"""
BarberZap - Performance Alerting System

Sistema de alertas para problemas de performance.
Monitora métricas e dispara alertas baseados em thresholds.

Alerts:
- high_latency: Latência alta (>500ms)
- slow_query: Query lenta (>100ms)
- low_cache_hit: Baixa taxa de cache hit (<70%)
- high_memory: Alto uso de memória (>80%)
- high_error_rate: Alta taxa de erro (>1%)

Canais de alerta:
- Log (sempre)
- Slack/Teams Webhook
- Email (ops team)
"""

import asyncio
import json
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from collections import deque, defaultdict

import aiohttp
import httpx


class AlertSeverity(str, Enum):
    """Severidade do alerta"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Tipos de alerta"""
    HIGH_LATENCY = "high_latency"
    SLOW_QUERY = "slow_query"
    LOW_CACHE_HIT = "low_cache_hit"
    HIGH_MEMORY = "high_memory"
    HIGH_ERROR_RATE = "high_error_rate"
    N_PLUS_ONE_QUERY = "n_plus_one_query"
    CONNECTION_POOL_EXHAUSTED = "connection_pool_exhausted"
    QUEUE_BACKLOG = "queue_backlog"


@dataclass
class AlertThreshold:
    """Configuração de threshold para alerta"""
    name: str
    alert_type: AlertType
    severity: AlertSeverity
    
    # Threshold values
    threshold: float
    window_seconds: int  # Window para avaliação
    min_samples: int  # Mínimo de amostras na janela
    
    # Cooldown (evitar spam de alertas)
    cooldown_seconds: int = 300  # 5 minutos
    
    # Estado interno
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0
    
    def should_trigger(self, current_value: float, samples: int) -> bool:
        """Verifica se deve disparar o alerta"""
        # Check cooldown
        if self.last_triggered:
            cooldown_remaining = (self.last_triggered + timedelta(seconds=self.cooldown_seconds)) - datetime.now(timezone.utc)
            if cooldown_remaining.total_seconds() > 0:
                return False
        
        # Check threshold
        if samples < self.min_samples:
            return False
        
        return current_value >= self.threshold
    
    def mark_triggered(self):
        """Marca como disparado"""
        self.last_triggered = datetime.now(timezone.utc)
        self.trigger_count += 1


@dataclass
class Alert:
    """Alerta disparado"""
    id: str
    type: AlertType
    severity: AlertSeverity
    
    threshold_name: str
    current_value: float
    threshold_value: float
    
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Context
    endpoint: Optional[str] = None
    shop_id: Optional[str] = None
    request_id: Optional[str] = None


class AlertMetricsBuffer:
    """Buffer para métricas de alerta"""
    
    def __init__(self):
        self.buffers: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self._lock = asyncio.Lock()
    
    async def add(self, key: str, value: float, timestamp: Optional[datetime] = None):
        """Adiciona valor ao buffer"""
        async with self._lock:
            ts = timestamp or datetime.now(timezone.utc)
            self.buffers[key].append({
                'value': value,
                'timestamp': ts.timestamp()
            })
    
    async def get_stats(self, key: str, window_seconds: int = 300) -> Dict[str, float]:
        """Retorna estatísticas do buffer"""
        async with self._lock:
            values = self.buffers.get(key, deque())
            
            if not values:
                return {'count': 0, 'avg': 0, 'max': 0, 'current': 0}
            
            # Filter by window
            cutoff = (datetime.now(timezone.utc) - timedelta(seconds=window_seconds)).timestamp()
            window_values = [v['value'] for v in values if v['timestamp'] >= cutoff]
            
            if not window_values:
                return {'count': 0, 'avg': 0, 'max': 0, 'current': 0}
            
            return {
                'count': len(window_values),
                'avg': sum(window_values) / len(window_values),
                'max': max(window_values),
                'min': min(window_values),
                'current': window_values[-1] if window_values else 0
            }
    
    async def clear(self, key: Optional[str] = None):
        """Limpa buffer"""
        async with self._lock:
            if key:
                self.buffers[key].clear()
            else:
                self.buffers.clear()


class AlertChannel:
    """Canal de envio de alertas"""
    
    async def send(self, alert: Alert):
        """Envia alerta pelo canal"""
        raise NotImplementedError


class LogChannel(AlertChannel):
    """Canal de log para alertas"""
    
    def __init__(self):
        import logging
        self.logger = logging.getLogger('profiler.alerts')
    
    async def send(self, alert: Alert):
        level = {
            AlertSeverity.INFO: logging.INFO,
            AlertSeverity.WARNING: logging.WARNING,
            AlertSeverity.CRITICAL: logging.CRITICAL
        }.get(alert.severity, logging.WARNING)
        
        self.logger.log(
            level,
            f"[{alert.type.value.upper()}] {alert.message}",
            extra={
                'alert_id': alert.id,
                'severity': alert.severity.value,
                'current_value': alert.current_value,
                'threshold': alert.threshold_value,
                'endpoint': alert.endpoint,
                'shop_id': alert.shop_id,
                'details': alert.details
            }
        )


class SlackWebhookChannel(AlertChannel):
    """Canal de Slack webhook para alertas"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    async def send(self, alert: Alert):
        try:
            # Color por severidade
            color = {
                AlertSeverity.INFO: "good",
                AlertSeverity.WARNING: "warning",
                AlertSeverity.CRITICAL: "danger"
            }.get(alert.severity, "warning")
            
            payload = {
                "attachments": [{
                    "color": color,
                    "title": f"[{alert.severity.value.upper()}] {alert.type.value}",
                    "text": alert.message,
                    "fields": [
                        {"title": "Current Value", "value": f"{alert.current_value:.2f}", "short": True},
                        {"title": "Threshold", "value": f"{alert.threshold_value:.2f}", "short": True},
                        {"title": "Endpoint", "value": alert.endpoint or "N/A", "short": True},
                        {"title": "Timestamp", "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"), "short": True}
                    ],
                    "footer": f"BarberZap Profiler | {alert.id}"
                }]
            }
            
            async with httpx.AsyncClient() as client:
                await client.post(self.webhook_url, json=payload, timeout=5.0)
                
        except Exception as e:
            # Não falhar o alerta por erro no envio
            pass


class TeamsWebhookChannel(AlertChannel):
    """Canal de Microsoft Teams webhook para alertas"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    async def send(self, alert: Alert):
        try:
            # Color por severidade
            color = {
                AlertSeverity.INFO: "00ff00",
                AlertSeverity.WARNING: "ffaa00",
                AlertSeverity.CRITICAL: "ff0000"
            }.get(alert.severity, "ffaa00")
            
            payload = {
                "@type": "MessageCard",
                "@context": "https://schema.org/extensions",
                "summary": f"BarberZap Alert: {alert.type.value}",
                "themeColor": color,
                "title": f"[{alert.severity.value.upper()}] {alert.type.value}",
                "text": alert.message,
                "sections": [{
                    "facts": [
                        {"name": "Current Value", "value": f"{alert.current_value:.2f}"},
                        {"name": "Threshold", "value": f"{alert.threshold_value:.2f}"},
                        {"name": "Endpoint", "value": alert.endpoint or "N/A"},
                        {"name": "Timestamp", "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")}
                    ]
                }]
            }
            
            async with httpx.AsyncClient() as client:
                await client.post(self.webhook_url, json=payload, timeout=5.0)
                
        except Exception as e:
            pass


class EmailChannel(AlertChannel):
    """Canal de email para alertas"""
    
    def __init__(self, smtp_config: Dict[str, Any], recipients: List[str]):
        self.smtp_config = smtp_config
        self.recipients = recipients
    
    async def send(self, alert: Alert):
        try:
            # Implementação simplificada - usar biblioteca de email real
            subject = f"[{alert.severity.value.upper()}] BarberZap Alert: {alert.type.value}"
            
            body = f"""
            <html>
            <body>
                <h2>Performance Alert</h2>
                <p><strong>Severity:</strong> {alert.severity.value}</p>
                <p><strong>Type:</strong> {alert.type.value}</p>
                <p><strong>Message:</strong> {alert.message}</p>
                
                <h3>Metrics</h3>
                <ul>
                    <li>Current Value: {alert.current_value:.2f}</li>
                    <li>Threshold: {alert.threshold_value:.2f}</li>
                </ul>
                
                <h3>Context</h3>
                <ul>
                    <li>Endpoint: {alert.endpoint or 'N/A'}</li>
                    <li>Shop ID: {alert.shop_id or 'N/A'}</li>
                    <li>Timestamp: {alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")}</li>
                </ul>
                
                <h3>Details</h3>
                <pre>{json.dumps(alert.details, indent=2)}</pre>
            </body>
            </html>
            """
            
            # Send via SMTP (simplified - use real SMTP library)
            # Este é apenas um placeholder para o envio real
            
        except Exception as e:
            pass


class AlertingManager:
    """Gerenciador de alertas"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.channels: List[AlertChannel] = []
        
        # Thresholds
        self.thresholds: Dict[str, AlertThreshold] = {
            'high_latency_p50': AlertThreshold(
                name='high_latency_p50',
                alert_type=AlertType.HIGH_LATENCY,
                severity=AlertSeverity.INFO,
                threshold=100,
                window_seconds=300,
                min_samples=10
            ),
            'high_latency_p95': AlertThreshold(
                name='high_latency_p95',
                alert_type=AlertType.HIGH_LATENCY,
                severity=AlertSeverity.CRITICAL,
                threshold=500,
                window_seconds=300,
                min_samples=10
            ),
            'slow_query': AlertThreshold(
                name='slow_query',
                alert_type=AlertType.SLOW_QUERY,
                severity=AlertSeverity.WARNING,
                threshold=100,
                window_seconds=300,
                min_samples=5
            ),
            'low_cache_hit': AlertThreshold(
                name='low_cache_hit',
                alert_type=AlertType.LOW_CACHE_HIT,
                severity=AlertSeverity.WARNING,
                threshold=0.7,
                window_seconds=300,
                min_samples=20
            )
        }
        
        # Buffer de métricas
        self.buffer = AlertMetricsBuffer()
        
        # Histórico de alertas
        self.alerts: deque = deque(maxlen=1000)
    
    def add_channel(self, channel: AlertChannel):
        """Adiciona um canal de alerta"""
        self.channels.append(channel)
    
    async def record_metric(self, key: str, value: float):
        """Registra uma métrica para análise"""
        await self.buffer.add(key, value)
    
    async def check_thresholds(self):
        """Verifica todos os thresholds"""
        for threshold_name, threshold in self.thresholds.items():
            stats = await self.buffer.get_stats(threshold_name, threshold.window_seconds)
            
            if threshold.should_trigger(stats['avg'], stats['count']):
                await self._trigger_alert(threshold, stats)
    
    async def _trigger_alert(self, threshold: AlertThreshold, stats: Dict[str, float]):
        """Dispara um alerta"""
        import uuid
        
        alert = Alert(
            id=str(uuid.uuid4()),
            type=threshold.alert_type,
            severity=threshold.severity,
            threshold_name=threshold.name,
            current_value=stats['avg'],
            threshold_value=threshold.threshold,
            message=self._get_alert_message(threshold, stats),
            details={'stats': stats}
        )
        
        # Mark as triggered
        threshold.mark_triggered()
        
        # Save to history
        self.alerts.append(alert)
        
        # Send via all channels
        for channel in self.channels:
            try:
                await channel.send(alert)
            except Exception as e:
                pass
        
        # Persist to Redis
        if self.redis:
            await self.redis.setex(
                f"profiling:alerts:{alert.id}",
                7 * 24 * 3600,
                json.dumps({
                    'id': alert.id,
                    'type': alert.type.value,
                    'severity': alert.severity.value,
                    'message': alert.message,
                    'timestamp': alert.timestamp.isoformat()
                })
            )
    
    def _get_alert_message(self, threshold: AlertThreshold, stats: Dict[str, float]) -> str:
        """Gera mensagem do alerta"""
        messages = {
            'high_latency_p50': f"P50 latency elevated to {stats['avg']:.2f}ms (threshold: {threshold.threshold}ms)",
            'high_latency_p95': f"P95 latency critical at {stats['avg']:.2f}ms (threshold: {threshold.threshold}ms)",
            'slow_query': f"Average query time {stats['avg']:.2f}ms exceeds threshold {threshold.threshold}ms",
            'low_cache_hit': f"Cache hit rate dropped to {stats['avg']:.1%} (threshold: {threshold.threshold:.1%})"
        }
        return messages.get(threshold.name, f"Threshold {threshold.name} exceeded")
    
    def add_custom_threshold(
        self,
        name: str,
        alert_type: AlertType,
        severity: AlertSeverity,
        threshold: float,
        window_seconds: int = 300
    ):
        """Adiciona threshold customizado"""
        self.thresholds[name] = AlertThreshold(
            name=name,
            alert_type=alert_type,
            severity=severity,
            threshold=threshold,
            window_seconds=window_seconds,
            min_samples=5
        )
    
    async def get_recent_alerts(self, limit: int = 50) -> List[Alert]:
        """Retorna alertas recentes"""
        return list(self.alerts)[-limit:]
    
    async def get_alerts_by_severity(self, severity: AlertSeverity) -> List[Alert]:
        """Retorna alertas por severidade"""
        return [a for a in self.alerts if a.severity == severity]
    
    async def clear_alerts(self):
        """Limpa histórico de alertas"""
        self.alerts.clear()


# ============================================
# Singleton Instance
# ============================================

_global_alerting_manager = None


def get_alerting_manager() -> AlertingManager:
    """Retorna o gerenciador de alertas global"""
    global _global_alerting_manager
    if _global_alerting_manager is None:
        _global_alerting_manager = AlertingManager()
        
        # Adicionar canal de log por padrão
        _global_alerting_manager.add_channel(LogChannel())
    
    return _global_alerting_manager


def setup_channels_from_env():
    """Configura canais de alerta baseado em variáveis de ambiente"""
    import os
    
    manager = get_alerting_manager()
    
    # Slack
    slack_webhook = os.getenv('ALERT_SLACK_WEBHOOK')
    if slack_webhook:
        manager.add_channel(SlackWebhookChannel(slack_webhook))
    
    # Teams
    teams_webhook = os.getenv('ALERT_TEAMS_WEBHOOK')
    if teams_webhook:
        manager.add_channel(TeamsWebhookChannel(teams_webhook))
    
    # Email (simplified config)
    if os.getenv('ALERT_EMAIL_ENABLED') == 'true':
        recipients = os.getenv('ALERT_EMAIL_RECIPIENTS', '').split(',')
        if recipients:
            manager.add_channel(EmailChannel({}, recipients))


# ============================================
# Background Task
# ============================================

async def start_alerting_monitor(interval_seconds: int = 60):
    """
    Inicia monitoramento de alertas em background.
    
    Usage:
        asyncio.create_task(start_alerting_monitor())
    """
    setup_channels_from_env()
    manager = get_alerting_manager()
    
    while True:
        try:
            await manager.check_thresholds()
        except Exception as e:
            # Log error but continue monitoring
            pass
        
        await asyncio.sleep(interval_seconds)
