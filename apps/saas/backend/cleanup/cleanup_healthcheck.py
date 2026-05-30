"""
BarberZap - Data Cleanup Health Check Module

Provides health monitoring and alerting for the cleanup system.
Monitors cleanup job status, data accumulation, and generates alerts.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertType(Enum):
    """Alert types"""
    CLEANUP_FAILED = "cleanup_failed"
    CLEANUP_STUCK = "cleanup_stuck"
    TABLE_TOO_LARGE = "table_too_large"
    CLEANUP_TOO_SLOW = "cleanup_too_slow"
    DATA_ACCUMULATING = "data_accumulating"
    NO_CLEANUP_RECENT = "no_cleanup_recent"
    QUOTA_EXCEEDED = "quota_exceeded"
    BACKUP_FAILED = "backup_failed"
    SAFETY_VIOLATION = "safety_violation"


@dataclass
class CleanupHealthMetrics:
    """Health metrics for cleanup system"""
    last_successful_cleanup_at: Optional[datetime] = None
    cleanup_jobs_pending_count: int = 0
    cleanup_jobs_failed_count: int = 0
    cleanup_errors_last_24h: int = 0

    # Table-specific metrics
    table_sizes: Dict[str, float] = field(default_factory=dict)  # table_name -> size_mb
    pending_counts: Dict[str, int] = field(default_factory=dict)  # table_name -> count
    cleanup_health_scores: Dict[str, int] = field(default_factory=dict)  # table_name -> 0-100

    # Data growth metrics
    data_growth_rates: Dict[str, float] = field(default_factory=dict)  # table_name -> mb_per_day

    # Duration metrics
    last_cleanup_duration_ms: Optional[int] = None
    avg_cleanup_duration_ms: Optional[int] = None


@dataclass
class CleanupAlert:
    """Cleanup alert"""
    id: str
    alert_type: AlertType
    severity: AlertSeverity
    table_name: Optional[str]
    job_name: Optional[str]
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    metric_value: Optional[float] = None
    threshold_value: Optional[float] = None
    triggered_at: datetime = field(default_factory=datetime.utcnow)
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "alert_type": self.alert_type.value,
            "severity": self.severity.value,
            "table_name": self.table_name,
            "job_name": self.job_name,
            "message": self.message,
            "details": self.details,
            "metric_value": self.metric_value,
            "threshold_value": self.threshold_value,
            "triggered_at": self.triggered_at.isoformat(),
            "acknowledged": self.acknowledged,
            "acknowledged_by": self.acknowledged,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved": self.resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolution_notes": self.resolution_notes
        }


class CleanupHealthChecker:
    """
    Health checker for cleanup system.

    Monitors:
    - Last successful cleanup duration
    - Cleanup jobs pending count
    - Cleanup errors in last 24h
    - Data growth rate (MB/day)
    - Table sizes

    Generates alerts when thresholds are exceeded.
    """

    # Alert thresholds
    MAX_PENDING_JOBS = 10
    MAX_ERRORS_24H = 3
    MAX_TABLE_SIZE_MB = 10000
    MAX_CLEANUP_DURATION_MS = 3600000  # 1 hour
    CLEANUP_STUCK_WARNING_HOURS = 24
    CLEANUP_STUCK_CRITICAL_HOURS = 48
    MAX_DATA_GROWTH_MB_PER_DAY = 100

    # Notification service (to be injected)
    notification_service: Optional[Any] = None

    def __init__(
        self,
        supabase_client=None,
        notification_service: Optional[Any] = None
    ):
        """
        Initialize health checker.

        Args:
            supabase_client: Supabase client for database queries
            notification_service: Notification service for sending alerts
        """
        self.supabase = supabase_client
        self.notification_service = notification_service

    async def check_health(self) -> CleanupHealthMetrics:
        """
        Check overall health of cleanup system.

        Returns:
            CleanupHealthMetrics with current health status
        """
        metrics = CleanupHealthMetrics()

        try:
            if self.supabase:
                # Get last successful cleanup
                last_cleanup_response = self.supabase.table('cleanup_runs_log').select('*').eq('status', 'completed').order('started_at', desc=True).limit(1).execute()
                if last_cleanup_response.data and last_cleanup_response.data[0]:
                    metrics.last_successful_cleanup_at = datetime.fromisoformat(
                        last_cleanup_response.data[0]['started_at'].replace('Z', '+00:00')
                    )
                    metrics.last_cleanup_duration_ms = last_cleanup_response.data[0].get('duration_ms')

                # Get errors in last 24h
                error_response = self.supabase.table('cleanup_runs_log').select('*', count='exact').eq('status', 'failed').gte('started_at', (datetime.utcnow() - timedelta(hours=24)).isoformat()).execute()
                if hasattr(error_response, 'count'):
                    metrics.cleanup_errors_last_24h = error_response.count

                # Get stats cache for table metrics
                stats_response = self.supabase.rpc('get_all_cleanup_stats')
                if stats_response.data:
                    for stat in stats_response.data:
                        table_name = stat['table_name']
                        metrics.table_sizes[table_name] = stat.get('table_size_mb', 0)
                        metrics.pending_counts[table_name] = stat.get('pending_count', 0)
                        metrics.cleanup_health_scores[table_name] = stat.get('cleanup_health_score', 0)
                        metrics.data_growth_rates[table_name] = stat.get('data_growth_rate_mb_per_day', 0)

        except Exception as e:
            logger.error(f"Error checking cleanup health: {e}", exc_info=True)

        return metrics

    async def generate_alerts(self, metrics: CleanupHealthMetrics) -> List[CleanupAlert]:
        """
        Generate alerts based on health metrics.

        Args:
            metrics: Current health metrics

        Returns:
            List of alerts
        """
        alerts: List[CleanupAlert] = []

        # Alert 1: Cleanup hasn't run in 24+ hours
        if metrics.last_successful_cleanup_at:
            hours_since_cleanup = (datetime.utcnow() - metrics.last_successful_cleanup_at).total_seconds() / 3600
            if hours_since_cleanup > self.CLEANUP_STUCK_CRITICAL_HOURS:
                alerts.append(CleanupAlert(
                    id=f"no_cleanup_{datetime.utcnow().timestamp()}",
                    alert_type=AlertType.NO_CLEANUP_RECENT,
                    severity=AlertSeverity.CRITICAL,
                    table_name=None,
                    job_name=None,
                    message=f"Cleanup hasn't run successfully in {hours_since_cleanup:.1f} hours",
                    metric_value=hours_since_cleanup,
                    threshold_value=self.CLEANUP_STUCK_CRITICAL_HOURS
                ))
            elif hours_since_cleanup > self.CLEANUP_STUCK_WARNING_HOURS:
                alerts.append(CleanupAlert(
                    id=f"no_cleanup_{datetime.utcnow().timestamp()}",
                    alert_type=AlertType.NO_CLEANUP_RECENT,
                    severity=AlertSeverity.WARNING,
                    table_name=None,
                    job_name=None,
                    message=f"Cleanup hasn't run successfully in {hours_since_cleanup:.1f} hours",
                    metric_value=hours_since_cleanup,
                    threshold_value=self.CLEANUP_STUCK_WARNING_HOURS
                ))

        # Alert 2: Too many errors in last 24h
        if metrics.cleanup_errors_last_24h > self.MAX_ERRORS_24H:
            alerts.append(CleanupAlert(
                id=f"cleanup_errors_{datetime.utcnow().timestamp()}",
                alert_type=AlertType.CLEANUP_FAILED,
                severity=AlertSeverity.ERROR,
                table_name=None,
                job_name=None,
                message=f"Cleanup had {metrics.cleanup_errors_last_24h} errors in the last 24 hours",
                metric_value=metrics.cleanup_errors_last_24h,
                threshold_value=self.MAX_ERRORS_24H
            ))

        # Alert 3: Tables exceeding size threshold
        for table_name, size_mb in metrics.table_sizes.items():
            if size_mb > self.MAX_TABLE_SIZE_MB:
                alerts.append(CleanupAlert(
                    id=f"table_size_{table_name}_{datetime.utcnow().timestamp()}",
                    alert_type=AlertType.TABLE_TOO_LARGE,
                    severity=AlertSeverity.ERROR,
                    table_name=table_name,
                    job_name=None,
                    message=f"Table '{table_name}' has grown to {size_mb:.2f}MB, exceeding threshold of {self.MAX_TABLE_SIZE_MB}MB",
                    metric_value=size_mb,
                    threshold_value=self.MAX_TABLE_SIZE_MB,
                    details={"pending_count": metrics.pending_counts.get(table_name, 0)}
                ))

        # Alert 4: Tables with low health score
        for table_name, health_score in metrics.cleanup_health_scores.items():
            if health_score < 50:
                alerts.append(CleanupAlert(
                    id=f"health_score_{table_name}_{datetime.utcnow().timestamp()}",
                    alert_type=AlertType.DATA_ACCUMULATING,
                    severity=AlertSeverity.WARNING if health_score > 30 else AlertSeverity.ERROR,
                    table_name=table_name,
                    job_name=None,
                    message=f"Table '{table_name}' health score is {health_score}/100, indicating data accumulation",
                    metric_value=health_score,
                    threshold_value=50,
                    details={"pending_count": metrics.pending_counts.get(table_name, 0)}
                ))

        # Alert 5: High data growth rate
        for table_name, growth_rate_mb_per_day in metrics.data_growth_rates.items():
            if growth_rate_mb_per_day > self.MAX_DATA_GROWTH_MB_PER_DAY:
                alerts.append(CleanupAlert(
                    id=f"data_growth_{table_name}_{datetime.utcnow().timestamp()}",
                    alert_type=AlertType.DATA_ACCUMULATING,
                    severity=AlertSeverity.WARNING,
                    table_name=table_name,
                    job_name=None,
                    message=f"Table '{table_name}' is growing at {growth_rate_mb_per_day:.2f}MB/day, exceeding threshold of {self.MAX_DATA_GROWTH_MB_PER_DAY}MB/day",
                    metric_value=growth_rate_mb_per_day,
                    threshold_value=self.MAX_DATA_GROWTH_MB_PER_DAY
                ))

        # Alert 6: Last cleanup took too long
        if metrics.last_cleanup_duration_ms and metrics.last_cleanup_duration_ms > self.MAX_CLEANUP_DURATION_MS:
            alerts.append(CleanupAlert(
                id=f"cleanup_slow_{datetime.utcnow().timestamp()}",
                alert_type=AlertType.CLEANUP_TOO_SLOW,
                severity=AlertSeverity.WARNING,
                table_name=None,
                job_name=None,
                message=f"Last cleanup took {metrics.last_cleanup_duration_ms / 1000 / 60:.1f} minutes, exceeding threshold of {self.MAX_CLEANUP_DURATION_MS / 1000 / 60:.1f} minutes",
                metric_value=metrics.last_cleanup_duration_ms / 1000 / 60,
                threshold_value=self.MAX_CLEANUP_DURATION_MS / 1000 / 60
            ))

        return alerts

    async def alert_check(self) -> Dict[str, Any]:
        """
        Perform a complete health check and generate alerts.

        Returns:
            Dictionary with health status and alerts
        """
        # Check health
        metrics = await self.check_health()

        # Generate alerts
        alerts = await self.generate_alerts(metrics)

        # Log alerts and send notifications
        for alert in alerts:
            logger.warning(f"Cleanup alert: [{alert.severity.value.upper()}] {alert.message}")

            # Store alert in database
            if self.supabase:
                try:
                    self.supabase.table('cleanup_alert_log').insert({
                        'alert_type': alert.alert_type.value,
                        'severity': alert.severity.value,
                        'table_name': alert.table_name,
                        'job_name': alert.job_name,
                        'alert_message': alert.message,
                        'details': alert.details,
                        'metric_value': alert.metric_value,
                        'threshold_value': alert.threshold_value,
                        'triggered_at': alert.triggered_at.isoformat()
                    }).execute()
                except Exception as e:
                    logger.error(f"Failed to log alert: {e}")

            # Send notification for critical alerts
            if alert.severity in [AlertSeverity.ERROR, AlertSeverity.CRITICAL]:
                await self._send_alert_notification(alert)

        # Determine overall health status
        critical_alerts = [a for a in alerts if a.severity == AlertSeverity.CRITICAL]
        error_alerts = [a for a in alerts if a.severity == AlertSeverity.ERROR]
        warning_alerts = [a for a in alerts if a.severity == AlertSeverity.WARNING]

        if critical_alerts:
            overall_status = "critical"
        elif error_alerts:
            overall_status = "error"
        elif warning_alerts:
            overall_status = "warning"
        else:
            overall_status = "healthy"

        return {
            "status": overall_status,
            "metrics": {
                "last_successful_cleanup_at": metrics.last_successful_cleanup_at.isoformat() if metrics.last_successful_cleanup_at else None,
                "cleanup_errors_last_24h": metrics.cleanup_errors_last_24h,
                "last_cleanup_duration_ms": metrics.last_cleanup_duration_ms,
                "table_metrics": {
                    table_name: {
                        "size_mb": metrics.table_sizes[table_name],
                        "pending_count": metrics.pending_counts[table_name],
                        "health_score": metrics.cleanup_health_scores[table_name],
                        "growth_rate_mb_per_day": metrics.data_growth_rates[table_name]
                    }
                    for table_name in metrics.table_sizes
                }
            },
            "alerts": [alert.to_dict() for alert in alerts],
            "alert_counts": {
                "critical": len(critical_alerts),
                "error": len(error_alerts),
                "warning": len(warning_alerts),
                "total": len(alerts)
            }
        }

    async def _send_alert_notification(self, alert: CleanupAlert):
        """Send alert notification via configured notification service"""
        if not self.notification_service:
            return

        try:
            message = (
                f"🚨 Cleanup Alert [{alert.severity.value.upper()}]\n"
                f"Type: {alert.alert_type.value}\n"
                f"Message: {alert.message}\n"
            )

            if alert.table_name:
                message += f"Table: {alert.table_name}\n"

            if alert.metric_value is not None:
                message += f"Value: {alert.metric_value}"
                if alert.threshold_value is not None:
                    message += f" (Threshold: {alert.threshold_value})"
                message += "\n"

            message += f"\nTriggered at: {alert.triggered_at.isoformat()}"

            # Send via configured notification service
            if hasattr(self.notification_service, 'send_slack_message'):
                channel = '#alerts'
                if alert.severity == AlertSeverity.CRITICAL:
                    channel = '#critical-alerts'
                await self.notification_service.send_slack_message(message, channel=channel)
            elif hasattr(self.notification_service, 'send_message'):
                await self.notification_service.send_message(message)

            logger.info(f"Alert notification sent: {alert.alert_type.value}")

        except Exception as e:
            logger.error(f"Failed to send alert notification: {e}", exc_info=True)


class CleanupHealthService:
    """
    Service for periodic health checks and alerting.

    Runs scheduled health checks and sends alerts when needed.
    """

    def __init__(
        self,
        health_checker: Optional[CleanupHealthChecker] = None,
        check_interval_seconds: int = 300  # 5 minutes
    ):
        """
        Initialize health service.

        Args:
            health_checker: Health checker instance
            check_interval_seconds: Interval between health checks
        """
        self.health_checker = health_checker
        self.check_interval_seconds = check_interval_seconds
        self._running = False

    async def start(self):
        """Start periodic health checks"""
        if self._running:
            logger.warning("Health service is already running")
            return

        self._running = True
        logger.info(f"Starting health service (interval: {self.check_interval_seconds}s)")

        while self._running:
            try:
                result = await self.health_checker.alert_check()

                if result['status'] != 'healthy':
                    logger.warning(f"Health check: status={result['status']}, alerts={result['alert_counts']['total']}")
                else:
                    logger.info("Health check: healthy")

            except Exception as e:
                logger.error(f"Error during health check: {e}", exc_info=True)

            # Wait for next check
            await asyncio.sleep(self.check_interval_seconds)

    async def stop(self):
        """Stop periodic health checks"""
        self._running = False
        logger.info("Health service stopped")

    async def check_once(self) -> Dict[str, Any]:
        """Run a single health check"""
        return await self.health_checker.alert_check()


# Factory function
def create_health_checker(
    supabase_client,
    notification_service: Optional[Any] = None
) -> CleanupHealthChecker:
    """
    Create a health checker.

    Args:
        supabase_client: Supabase client for database queries
        notification_service: Optional notification service

    Returns:
        Configured CleanupHealthChecker
    """
    return CleanupHealthChecker(
        supabase_client=supabase_client,
        notification_service=notification_service
    )


def create_health_service(
    health_checker: Optional[CleanupHealthChecker] = None,
    check_interval_seconds: int = 300
) -> CleanupHealthService:
    """
    Create a health service.

    Args:
        health_checker: Optional health checker instance
        check_interval_seconds: Interval between health checks

    Returns:
        Configured CleanupHealthService
    """
    return CleanupHealthService(
        health_checker=health_checker,
        check_interval_seconds=check_interval_seconds
    )
