"""
Alerting Engine for BarberZap
==============================
Monitors metrics and triggers alerts based on thresholds.

Features:
- Evaluates metrics against alert rules
- Sends notifications to multiple channels
- Supports cooldown periods
- Alert deduplication and grouping
- On-call rotation handling
"""

import argparse
import asyncio
import logging
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Set
from collections import defaultdict
import json
import httpx
import schedule
import yaml

from prometheus_client import CollectorRegistry, Gauge, start_http_server


class AlertSeverity(Enum):
    """Alert severity levels"""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class AlertState(Enum):
    """Alert states"""
    PENDING = "pending"
    FIRING = "firing"
    RESOLVED = "resolved"


@dataclass
class Alert:
    """An alert instance"""
    id: str
    name: str
    display_name: str
    severity: AlertSeverity
    state: AlertState
    metric_name: str
    labels: Dict[str, str]
    value: float
    threshold: float
    message: str
    timestamp: float
    cooldown_until: float = 0.0
    acknowledged: bool = False
    notification_count: int = 0


@dataclass
class AlertRule:
    """An alert rule definition"""
    name: str
    display_name: str
    description: str
    metric_name: str
    metric_type: str
    labels: Dict[str, str]
    thresholds: Dict[str, Dict[str, Any]]
    annotations: Dict[str, str]
    channels: List[str]
    cooldown_seconds: int
    enabled: bool


@dataclass
class NotificationChannel:
    """A notification channel"""
    name: str
    enabled: bool
    config: Dict[str, Any]


class AlertEngine:
    """Main alerting engine"""
    
    def __init__(
        self,
        config_path: str = "alerting.yaml",
        prometheus_url: str = "http://localhost:9090",
        metrics_port: int = 9091,
    ):
        self.config_path = config_path
        self.prometheus_url = prometheus_url
        self.metrics_port = metrics_port
        
        self.rules: Dict[str, AlertRule] = {}
        self.channels: Dict[str, NotificationChannel] = {}
        self.alerts: Dict[str, Alert] = {}
        
        self._running = False
        self._evaluation_task: Optional[asyncio.Task] = None
        
        # Prometheus metrics for the engine itself
        self.registry = CollectorRegistry()
        self.alerts_active = Gauge(
            'barber_alerting_active_alerts',
            'Number of active alerts',
            ['severity'],
            registry=self.registry,
        )
        self.alerts_total = Gauge(
            'barber_alerting_total',
            'Total alerts triggered',
            registry=self.registry,
        )
    
    def load_config(self):
        """Load configuration from YAML file"""
        with open(self.config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        # Load alert rules
        for rule_config in config.get('alerts', []):
            if not rule_config.get('enabled', True):
                continue
            
            rule = AlertRule(
                name=rule_config['name'],
                display_name=rule_config.get('display_name', rule_config['name']),
                description=rule_config.get('description', ''),
                metric_name=rule_config['metric']['name'],
                metric_type=rule_config['metric'].get('type', 'gauge'),
                labels=rule_config['metric'].get('labels', {}),
                thresholds=rule_config['thresholds'],
                annotations=rule_config.get('annotations', {}),
                channels=rule_config.get('channels', []),
                cooldown_seconds=rule_config.get('cooldown_seconds', 300),
                enabled=True,
            )
            self.rules[rule.name] = rule
        
        # Load notification channels
        channels_config = config.get('channels', {})
        for channel_name, channel_config in channels_config.items():
            self.channels[channel_name] = NotificationChannel(
                name=channel_name,
                enabled=channel_config.get('enabled', False),
                config=channel_config,
            )
        
        logging.info(f"Loaded {len(self.rules)} alert rules and {len(self.channels)} channels")
    
    async def start(self):
        """Start the alerting engine"""
        if self._running:
            return
        
        self.load_config()
        
        # Start metrics server
        try:
            start_http_server(self.metrics_port, registry=self.registry)
            logging.info(f"Alerting metrics server started on port {self.metrics_port}")
        except Exception as e:
            logging.warning(f"Could not start metrics server: {e}")
        
        self._running = True
        self._evaluation_task = asyncio.create_task(self._evaluation_loop())
        
        logging.info("Alerting engine started")
    
    async def stop(self):
        """Stop the alerting engine"""
        self._running = False
        if self._evaluation_task:
            self._evaluation_task.cancel()
            try:
                await self._evaluation_task
            except asyncio.CancelledError:
                pass
        logging.info("Alerting engine stopped")
    
    async def _evaluation_loop(self):
        """Main evaluation loop"""
        interval = 30  # Evaluate every 30 seconds
        
        while self._running:
            try:
                await self._evaluate_all_rules()
                await self._cleanup_resolved_alerts()
            except Exception as e:
                logging.error(f"Error during evaluation: {e}")
            
            await asyncio.sleep(interval)
    
    async def _evaluate_all_rules(self):
        """Evaluate all alert rules"""
        for rule in self.rules.values():
            if not rule.enabled:
                continue
            
            try:
                await self._evaluate_rule(rule)
            except Exception as e:
                logging.error(f"Error evaluating rule {rule.name}: {e}")
    
    async def _evaluate_rule(self, rule: AlertRule):
        """Evaluate a single alert rule"""
        # Query Prometheus for metric values
        metrics = await self._query_prometheus(
            metric_name=rule.metric_name,
            labels=rule.labels,
        )
        
        for metric_value in metrics:
            labels = metric_value['metric']
            value = float(metric_value['value'][1])
            
            # Find highest severity threshold that's met
            triggered_severity = None
            triggered_threshold = None
            
            for severity_str, threshold_config in sorted(
                rule.thresholds.items(),
                key=lambda x: ['info', 'warning', 'critical'].index(x[0]),
                reverse=True,
            ):
                threshold_value = threshold_config['value']
                operator = threshold_config['operator']
                
                if self._check_threshold(value, operator, threshold_value):
                    triggered_severity = AlertSeverity(severity_str)
                    triggered_threshold = threshold_value
                    break
            
            # Check cooldown
            alert_key = f"{rule.name}:{json.dumps(labels, sort_keys=True)}"
            now = time.time()
            
            if alert_key in self.alerts:
                existing_alert = self.alerts[alert_key]
                if now < existing_alert.cooldown_until:
                    continue
            
            if triggered_severity:
                # Alert threshold met
                await self._fire_alert(
                    rule=rule,
                    severity=triggered_severity,
                    threshold=triggered_threshold,
                    value=value,
                    labels=labels,
                )
            else:
                # Alert resolved
                await self._resolve_alert(alert_key)
    
    def _check_threshold(self, value: float, operator: str, threshold: float) -> bool:
        """Check if value meets threshold"""
        if operator == '>':
            return value > threshold
        elif operator == '>=':
            return value >= threshold
        elif operator == '<':
            return value < threshold
        elif operator == '<=':
            return value <= threshold
        elif operator == '==':
            return value == threshold
        elif operator == '!=':
            return value != threshold
        return False
    
    async def _query_prometheus(
        self,
        metric_name: str,
        labels: Dict[str, str],
    ) -> List[Dict[str, Any]]:
        """Query Prometheus for metric values"""
        query = metric_name
        
        # Build label filters
        label_filters = []
        for key, value in labels.items():
            if value == '*':
                label_filters.append(f'{key}')
            else:
                label_filters.append(f'{key}="{value}"')
        
        if label_filters:
            query = f"{metric_name}{{{{{','.join(label_filters)}}}}}"
        
        url = f"{self.prometheus_url}/api/v1/query"
        params = {'query': query}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data['status'] == 'success':
                return data['data']['result']
        
        return []
    
    async def _fire_alert(
        self,
        rule: AlertRule,
        severity: AlertSeverity,
        threshold: float,
        value: float,
        labels: Dict[str, str],
    ):
        """Fire an alert"""
        alert_key = f"{rule.name}:{json.dumps(labels, sort_keys=True)}"
        
        # Generate alert message
        variables = {
            'labels': labels,
            'value': round(value, 2),
            'threshold': threshold,
        }
        
        summary = rule.annotations.get('summary', rule.display_name)
        message = rule.annotations.get('description', '')
        
        # Replace variables in templates
        summary = self._template_replace(summary, variables)
        message = self._template_replace(message, variables)
        
        # Create or update alert
        if alert_key in self.alerts:
            alert = self.alerts[alert_key]
            alert.state = AlertState.FIRING
            alert.value = value
            alert.timestamp = time.time()
            alert.cooldown_until = time.time() + rule.cooldown_seconds
        else:
            alert = Alert(
                id=alert_key,
                name=rule.name,
                display_name=rule.display_name,
                severity=severity,
                state=AlertState.FIRING,
                metric_name=rule.metric_name,
                labels=labels,
                value=value,
                threshold=threshold,
                message=f"{summary}\n{message}",
                timestamp=time.time(),
                cooldown_until=time.time() + rule.cooldown_seconds,
            )
            self.alerts[alert_key] = alert
            self.alerts_total.inc()
        
        # Send notifications
        if alert.notification_count == 0 or rule.cooldown_seconds > 0:
            await self._send_notifications(alert, rule.channels)
            alert.notification_count += 1
        
        # Update engine metrics
        self.alerts_active.labels(severity=severity.value).inc()
        logging.warning(f"Alert fired: {alert.display_name} ({severity.value}) - {message}")
    
    async def _resolve_alert(self, alert_key: str):
        """Mark an alert as resolved"""
        if alert_key not in self.alerts:
            return
        
        alert = self.alerts[alert_key]
        if alert.state == AlertState.FIRING:
            alert.state = AlertState.RESOLVED
            
            # Decrement engine metrics
            self.alerts_active.labels(severity=alert.severity.value).dec()
            
            logging.info(f"Alert resolved: {alert.display_name}")
    
    async def _cleanup_resolved_alerts(self):
        """Clean up old resolved alerts"""
        now = time.time()
        
        for alert_key, alert in list(self.alerts.items()):
            # Remove resolved alerts older than 24 hours
            if (
                alert.state == AlertState.RESOLVED
                and now - alert.timestamp > 86400
            ):
                del self.alerts[alert_key]
    
    async def _send_notifications(self, alert: Alert, channels: List[str]):
        """Send notifications for an alert"""
        for channel_name in channels:
            if channel_name not in self.channels:
                continue
            
            channel = self.channels[channel_name]
            if not channel.enabled:
                continue
            
            try:
                await self._send_to_channel(alert, channel)
            except Exception as e:
                logging.error(f"Failed to send notification to {channel_name}: {e}")
    
    async def _send_to_channel(self, alert: Alert, channel: NotificationChannel):
        """Send notification to a specific channel"""
        if channel.name == 'slack':
            await self._send_slack(alert, channel.config)
        elif channel.name == 'email':
            await self._send_email(alert, channel.config)
        elif channel.name == 'whatsapp':
            await self._send_whatsapp(alert, channel.config)
        elif channel.name == 'pagerduty':
            await self._send_pagerduty(alert, channel.config)
        else:
            logging.warning(f"Unknown channel: {channel.name}")
    
    async def _send_slack(self, alert: Alert, config: Dict[str, Any]):
        """Send Slack notification"""
        webhook_url = config.get('webhook_url')
        if not webhook_url:
            raise ValueError("Slack webhook URL not configured")
        
        # Determine severity emoji and mention
        severity_emoji = {
            AlertSeverity.CRITICAL: '🔴',
            AlertSeverity.WARNING: '🟡',
            AlertSeverity.INFO: '🔵',
        }
        
        severity_label = config.get('severity_labels', {}).get(alert.severity.value, '')
        
        message = {
            'channel': config.get('channel', '#alerts'),
            'username': config.get('username', 'BarberZap Alerts'),
            'icon_emoji': config.get('icon_emoji', ':barber:'),
            'attachments': [
                {
                    'color': {
                        AlertSeverity.CRITICAL: 'danger',
                        AlertSeverity.WARNING: 'warning',
                        AlertSeverity.INFO: 'info',
                    }.get(alert.severity, 'info'),
                    'title': f"{severity_emoji.get(alert.severity, '⚠️')} {alert.display_name}",
                    'text': alert.message,
                    'fields': [
                        {
                            'title': 'Severity',
                            'value': f"{severity_label} {alert.severity.value.upper()}",
                            'short': True,
                        },
                        {
                            'title': 'Value',
                            'value': str(alert.value),
                            'short': True,
                        },
                        {
                            'title': 'Threshold',
                            'value': str(alert.threshold),
                            'short': True,
                        },
                        {
                            'title': 'Time',
                            'value': datetime.fromtimestamp(alert.timestamp).isoformat(),
                            'short': True,
                        },
                    ],
                }
            ],
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(webhook_url, json=message)
            response.raise_for_status()
    
    async def _send_email(self, alert: Alert, config: Dict[str, Any]):
        """Send email notification (placeholder)"""
        # This would use SMTP or an email service
        # For now, just log
        logging.info(f"Would send email to {config.get('to_addresses')}: {alert.display_name}")
    
    async def _send_whatsapp(self, alert: Alert, config: Dict[str, Any]):
        """Send WhatsApp notification (placeholder)"""
        # This would integrate with WhatsApp API
        # For now, just log
        logging.info(f"Would send WhatsApp to {config.get('phone_numbers')}: {alert.display_name}")
    
    async def _send_pagerduty(self, alert: Alert, config: Dict[str, Any]):
        """Send PagerDuty notification (placeholder)"""
        # This would use PagerDuty Events API
        # For now, just log
        logging.info(f"Would trigger PagerDuty: {alert.display_name}")
    
    def _template_replace(self, template: str, variables: Dict[str, Any]) -> str:
        """Replace variables in template string"""
        # Simple {{ var }} replacement
        import re
        
        def replacer(match):
            var_path = match.group(1)
            value = variables
            for key in var_path.split('.'):
                value = value.get(key, '')
            return str(value)
        
        return re.sub(r'\{\{\s*(.+?)\s*\}\}', replacer, template)
    
    def get_active_alerts(self) -> List[Alert]:
        """Get all active (firing) alerts"""
        return [
            alert
            for alert in self.alerts.values()
            if alert.state == AlertState.FIRING
        ]
    
    def acknowledge_alert(self, alert_id: str):
        """Acknowledge an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].acknowledged = True
            logging.info(f"Alert acknowledged: {alert_id}")
    
    def resolve_alert(self, alert_id: str):
        """Manually resolve an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].state = AlertState.RESOLVED
            logging.info(f"Alert manually resolved: {alert_id}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='BarberZap Alerting Engine')
    parser.add_argument(
        '--config',
        type=str,
        default='monitoring/alerting.yaml',
        help='Path to alerting configuration file',
    )
    parser.add_argument(
        '--prometheus-url',
        type=str,
        default='http://localhost:9090',
        help='Prometheus server URL',
    )
    parser.add_argument(
        '--metrics-port',
        type=int,
        default=9091,
        help='Metrics server port',
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug logging',
    )
    args = parser.parse_args()
    
    # Set up logging
    level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    
    # Create and start engine
    engine = AlertEngine(
        config_path=args.config,
        prometheus_url=args.prometheus_url,
        metrics_port=args.metrics_port,
    )
    
    async def run():
        try:
            await engine.start()
            
            # Keep running
            logging.info("Alerting engine running. Press Ctrl+C to stop.")
            while True:
                await asyncio.sleep(60)
        
        except KeyboardInterrupt:
            logging.info("Shutting down...")
        finally:
            await engine.stop()
    
    asyncio.run(run())


if __name__ == '__main__':
    main()
