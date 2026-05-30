"""
Prometheus Metrics Exporter for BarberZap
=========================================
Exports critical metrics in Prometheus exposition format.

Metrics tracked:
- Webhook success rate
- Cache hit rate  
- Realtime connections
- Booking conflicts/min
- Outbox queue depth
- Dashboard load times
- BullMQ queue stats
- Redis health
- Supabase health
- App errors rate
"""

import time
import logging
from typing import Dict, List, Optional
from functools import wraps
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum

# Prometheus registry will be set up when metrics are first used
from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
    multiprocess,
    start_http_server,
    Info,
)
from prometheus_client.openmetrics.exposition import generate_latest as om_generate_latest

logger = logging.getLogger(__name__)


class MetricLabel(Enum):
    """Metric label keys"""
    SHOP_ID = "shop_id"
    USER_ID = "user_id"
    METRIC_TYPE = "metric_type"
    CACHE_TYPE = "cache_type"
    QUEUE_NAME = "queue_name"
    ERROR_TYPE = "error_type"
    ENDPOINT = "endpoint"
    STATUS = "status"
    WEBHOOK_PROVIDER = "webhook_provider"


@dataclass
class MetricConfig:
    """Configuration for a metric"""
    name: str
    description: str
    labels: List[str] = field(default_factory=list)


class PrometheusExporter:
    """
    Prometheus metrics exporter for BarberZap
    
    Exports metrics for:
    - Webhooks (success rate, failures, latency)
    - Cache (hit rate, miss rate, size)
    - Realtime (connections, messages)
    - Bookings (conflicts, success rate)
    - Outbox (queue depth, processing rate)
    - Jobs (BullMQ stats, success/fail, processing time)
    - System (Redis, Supabase health)
    - Errors (rate by type)
    """
    
    # Instance registry
    _instance: Optional['PrometheusExporter'] = None
    _registry: CollectorRegistry = CollectorRegistry()
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(
        self,
        shop_id: Optional[str] = None,
        enable_multiprocess: bool = False,
        port: int = 9090,
    ):
        if hasattr(self, '_initialized'):
            return
            
        self.shop_id = shop_id
        self.enable_multiprocess = enable_multiprocess
        self.port = port
        self._initialized = True
        self._http_server = None
        
        # Initialize metrics
        self._init_metrics()
        
        logger.info(f"PrometheusExporter initialized for shop {shop_id}")
    
    def _init_metrics(self):
        """Initialize all Prometheus metrics"""
        self._init_webhook_metrics()
        self._init_cache_metrics()
        self._init_realtime_metrics()
        self._init_booking_metrics()
        self._init_outbox_metrics()
        self._init_job_metrics()
        self._init_system_metrics()
        self._init_error_metrics()
        self._init_latency_metrics()
    
    def _init_webhook_metrics(self):
        """Initialize webhook-related metrics"""
        self.webhook_total = Counter(
            'barber_webhook_total',
            'Total number of webhooks processed',
            ['shop_id', 'provider', 'status'],
        )
        
        self.webhook_success_rate = Gauge(
            'barber_webhook_success_rate',
            'Webhook success rate percentage (0-100)',
            ['shop_id', 'provider'],
        )
        
        self.webhook_latency = Histogram(
            'barber_webhook_processing_seconds',
            'Webhook processing time in seconds',
            ['shop_id', 'provider'],
            buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
        )
    
    def _init_cache_metrics(self):
        """Initialize cache-related metrics"""
        self.cache_hits = Counter(
            'barber_cache_hits_total',
            'Total cache hits',
            ['shop_id', 'cache_type'],
        )
        
        self.cache_misses = Counter(
            'barber_cache_misses_total',
            'Total cache misses',
            ['shop_id', 'cache_type'],
        )
        
        self.cache_hit_rate = Gauge(
            'barber_cache_hit_rate',
            'Cache hit rate percentage (0-100)',
            ['shop_id', 'cache_type'],
        )
        
        self.cache_size = Gauge(
            'barber_cache_size_bytes',
            'Cache size in bytes',
            ['shop_id', 'cache_type'],
        )
    
    def _init_realtime_metrics(self):
        """Initialize realtime connection metrics"""
        self.realtime_connections = Gauge(
            'barber_realtime_connections',
            'Number of active realtime connections',
            ['shop_id'],
        )
        
        self.realtime_messages_total = Counter(
            'barber_realtime_messages_total',
            'Total realtime messages sent/received',
            ['shop_id', 'direction'],
        )
        
        self.realtime_latency = Histogram(
            'barber_realtime_message_seconds',
            'Realtime message delivery time in seconds',
            ['shop_id'],
            buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0],
        )
    
    def _init_booking_metrics(self):
        """Initialize booking-related metrics"""
        self.booking_conflicts = Counter(
            'barber_booking_conflicts_total',
            'Total booking conflicts',
            ['shop_id'],
        )
        
        self.booking_conflicts_rate = Gauge(
            'barber_booking_conflicts_per_minute',
            'Booking conflicts per minute',
            ['shop_id'],
        )
        
        self.booking_success_rate = Gauge(
            'barber_booking_success_rate',
            'Booking success rate percentage (0-100)',
            ['shop_id'],
        )
        
        self.booking_total = Counter(
            'barber_booking_total',
            'Total bookings created',
            ['shop_id', 'status'],
        )
    
    def _init_outbox_metrics(self):
        """Initialize outbox pattern metrics"""
        self.outbox_depth = Gauge(
            'barber_outbox_queue_depth',
            'Number of items in outbox queue',
            ['shop_id'],
        )
        
        self.outbox_processed_total = Counter(
            'barber_outbox_processed_total',
            'Total outbox items processed',
            ['shop_id', 'status'],
        )
        
        self.outbox_latency = Histogram(
            'barber_outbox_processing_seconds',
            'Outbox item processing time in seconds',
            ['shop_id'],
            buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0],
        )
    
    def _init_job_metrics(self):
        """Initialize BullMQ job metrics"""
        self.job_total = Counter(
            'barber_job_total',
            'Total jobs processed',
            ['shop_id', 'queue', 'status'],
        )
        
        self.job_active = Gauge(
            'barber_job_active',
            'Number of active jobs',
            ['shop_id', 'queue'],
        )
        
        self.job_waiting = Gauge(
            'barber_job_waiting',
            'Number of waiting jobs',
            ['shop_id', 'queue'],
        )
        
        self.job_failed = Gauge(
            'barber_job_failed',
            'Number of failed jobs',
            ['shop_id', 'queue'],
        )
        
        self.job_latency = Histogram(
            'barber_job_processing_seconds',
            'Job processing time in seconds',
            ['shop_id', 'queue', 'job_type'],
            buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 300.0],
        )
    
    def _init_system_metrics(self):
        """Initialize system health metrics"""
        self.redis_health = Gauge(
            'barber_redis_health',
            'Redis health status (1=healthy, 0=unhealthy)',
            ['shop_id'],
        )
        
        self.redis_latency = Gauge(
            'barber_redis_ping_seconds',
            'Redis ping latency in seconds',
            ['shop_id'],
        )
        
        self.supabase_health = Gauge(
            'barber_supabase_health',
            'Supabase health status (1=healthy, 0=unhealthy)',
            ['shop_id'],
        )
        
        self.supabase_latency = Gauge(
            'barber_supabase_query_seconds',
            'Supabase query latency in seconds',
            ['shop_id', 'query_type'],
        )
        
        self.system_version = Info(
            'barber_system_info',
            'System version information',
        )
    
    def _init_error_metrics(self):
        """Initialize error tracking metrics"""
        self.errors_total = Counter(
            'barber_errors_total',
            'Total errors',
            ['shop_id', 'error_type', 'severity'],
        )
        
        self.errors_rate = Gauge(
            'barber_errors_per_minute',
            'Rate of errors per minute',
            ['shop_id', 'error_type', 'severity'],
        )
    
    def _init_latency_metrics(self):
        """Initialize latency tracking metrics"""
        self.api_latency = Histogram(
            'barber_api_request_seconds',
            'API request latency in seconds',
            ['shop_id', 'endpoint', 'method'],
            buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
        )
        
        self.dashboard_load_latency = Histogram(
            'barber_dashboard_load_seconds',
            'Dashboard load time in seconds',
            ['shop_id', 'dashboard_type'],
            buckets=[0.1, 0.5, 1.0, 2.0, 3.0, 5.0, 10.0],
        )
    
    # Helper methods for recording metrics
    def record_webhook(
        self,
        shop_id: str,
        provider: str,
        success: bool,
        latency: float,
    ):
        """Record a webhook event"""
        status = 'success' if success else 'failure'
        self.webhook_total.labels(
            shop_id=shop_id,
            provider=provider,
            status=status,
        ).inc()
        
        if success:
            self.webhook_latency.labels(
                shop_id=shop_id,
                provider=provider,
            ).observe(latency)
    
    def record_cache(self, shop_id: str, cache_type: str, hit: bool):
        """Record a cache access"""
        if hit:
            self.cache_hits.labels(shop_id=shop_id, cache_type=cache_type).inc()
        else:
            self.cache_misses.labels(shop_id=shop_id, cache_type=cache_type).inc()
    
    def set_cache_hit_rate(self, shop_id: str, cache_type: str, rate: float):
        """Set cache hit rate for a shop and cache type"""
        self.cache_hit_rate.labels(
            shop_id=shop_id,
            cache_type=cache_type,
        ).set(rate)
    
    def record_booking_conflict(self, shop_id: str):
        """Record a booking conflict"""
        self.booking_conflicts.labels(shop_id=shop_id).inc()
    
    def record_booking(self, shop_id: str, status: str):
        """Record a booking event"""
        self.booking_total.labels(shop_id=shop_id, status=status).inc()
    
    def set_realtime_connections(self, shop_id: str, count: int):
        """Set number of realtime connections"""
        self.realtime_connections.labels(shop_id=shop_id).set(count)
    
    def set_outbox_depth(self, shop_id: str, depth: int):
        """Set outbox queue depth"""
        self.outbox_depth.labels(shop_id=shop_id).set(depth)
    
    def record_job(
        self,
        shop_id: str,
        queue: str,
        status: str,
        job_type: str,
        latency: Optional[float] = None,
    ):
        """Record a job completion"""
        self.job_total.labels(
            shop_id=shop_id,
            queue=queue,
            status=status,
        ).inc()
        
        if latency is not None:
            self.job_latency.labels(
                shop_id=shop_id,
                queue=queue,
                job_type=job_type,
            ).observe(latency)
    
    def set_job_stats(self, shop_id: str, queue: str, active: int, waiting: int, failed: int):
        """Set job queue statistics"""
        self.job_active.labels(shop_id=shop_id, queue=queue).set(active)
        self.job_waiting.labels(shop_id=shop_id, queue=queue).set(waiting)
        self.job_failed.labels(shop_id=shop_id, queue=queue).set(failed)
    
    def set_redis_health(self, shop_id: str, healthy: bool, latency: float):
        """Set Redis health status"""
        self.redis_health.labels(shop_id=shop_id).set(1 if healthy else 0)
        self.redis_latency.labels(shop_id=shop_id).set(latency)
    
    def set_supabase_health(self, shop_id: str, healthy: bool):
        """Set Supabase health status"""
        self.supabase_health.labels(shop_id=shop_id).set(1 if healthy else 0)
    
    def record_supabase_query(self, shop_id: str, query_type: str, latency: float):
        """Record a Supabase query latency"""
        self.supabase_latency.labels(
            shop_id=shop_id,
            query_type=query_type,
        ).set(latency)
    
    def record_error(self, shop_id: str, error_type: str, severity: str):
        """Record an error"""
        self.errors_total.labels(
            shop_id=shop_id,
            error_type=error_type,
            severity=severity,
        ).inc()
    
    def record_api_request(
        self,
        shop_id: str,
        endpoint: str,
        method: str,
        latency: float,
    ):
        """Record an API request"""
        self.api_latency.labels(
            shop_id=shop_id,
            endpoint=endpoint,
            method=method,
        ).observe(latency)
    
    def record_dashboard_load(self, shop_id: str, dashboard_type: str, latency: float):
        """Record a dashboard load event"""
        self.dashboard_load_latency.labels(
            shop_id=shop_id,
            dashboard_type=dashboard_type,
        ).observe(latency)
    
    def set_system_info(self, version: str, commit: str, environment: str):
        """Set system information"""
        self.system_version.info({
            'version': version,
            'commit': commit,
            'environment': environment,
        })
    
    def start_server(self, port: Optional[int] = None):
        """Start the Prometheus metrics HTTP server"""
        port = port or self.port
        if self._http_server is None:
            try:
                self._http_server = start_http_server(port)
                logger.info(f"Prometheus metrics server started on port {port}")
            except Exception as e:
                logger.error(f"Failed to start Prometheus server: {e}")
                raise
    
    def get_metrics(self) -> bytes:
        """Export all metrics in Prometheus format"""
        if self.enable_multiprocess:
            return multiprocess.MetricsHandler().read()
        return generate_latest(self._registry)
    
    def get_content_type(self) -> str:
        """Get the content type for metrics"""
        return CONTENT_TYPE_LATEST


# Decorator for tracking function execution
def track_latency(
    exporter: PrometheusExporter,
    shop_id: str,
    metric_type: str,
    **labels,
):
    """
    Decorator to track function latency
    
    Args:
        exporter: PrometheusExporter instance
        shop_id: Shop ID for the metric
        metric_type: Type of metric (api, job, webhook, etc.)
        **labels: Additional labels for the metric
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                latency = time.time() - start_time
                
                if metric_type == 'api':
                    exporter.record_api_request(
                        shop_id=shop_id,
                        endpoint=labels.get('endpoint', func.__name__),
                        method=labels.get('method', 'GET'),
                        latency=latency,
                    )
                elif metric_type == 'job':
                    exporter.record_job(
                        shop_id=shop_id,
                        queue=labels.get('queue', 'default'),
                        status='success',
                        job_type=labels.get('job_type', func.__name__),
                        latency=latency,
                    )
                elif metric_type == 'webhook':
                    exporter.record_webhook(
                        shop_id=shop_id,
                        provider=labels.get('provider', 'unknown'),
                        success=True,
                        latency=latency,
                    )
                elif metric_type == 'dashboard':
                    exporter.record_dashboard_load(
                        shop_id=shop_id,
                        dashboard_type=labels.get('dashboard_type', 'main'),
                        latency=latency,
                    )
                
                return result
            except Exception as e:
                latency = time.time() - start_time
                exporter.record_error(
                    shop_id=shop_id,
                    error_type=type(e).__name__,
                    severity='critical',
                )
                
                # Record failed metric
                if metric_type == 'api':
                    exporter.record_api_request(
                        shop_id=shop_id,
                        endpoint=labels.get('endpoint', func.__name__),
                        method=labels.get('method', 'GET'),
                        latency=latency,
                    )
                elif metric_type == 'job':
                    exporter.record_job(
                        shop_id=shop_id,
                        queue=labels.get('queue', 'default'),
                        status='failed',
                        job_type=labels.get('job_type', func.__name__),
                        latency=latency,
                    )
                elif metric_type == 'webhook':
                    exporter.record_webhook(
                        shop_id=shop_id,
                        provider=labels.get('provider', 'unknown'),
                        success=False,
                        latency=latency,
                    )
                
                raise
        return wrapper
    return decorator


# Factory function
def get_exporter(
    shop_id: Optional[str] = None,
    enable_multiprocess: bool = False,
    port: int = 9090,
) -> PrometheusExporter:
    """
    Get or create PrometheusExporter instance
    
    Args:
        shop_id: Shop ID for multi-tenant metrics
        enable_multiprocess: Enable multiprocess mode
        port: Port for metrics server
    
    Returns:
        PrometheusExporter instance
    """
    return PrometheusExporter(
        shop_id=shop_id,
        enable_multiprocess=enable_multiprocess,
        port=port,
    )


if __name__ == '__main__':
    # Test the exporter
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='Prometheus Metrics Exporter')
    parser.add_argument('--port', type=int, default=9090, help='Metrics server port')
    parser.add_argument('--shop-id', type=str, default='test-shop', help='Shop ID for metrics')
    args = parser.parse_args()
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    
    # Create and start exporter
    exporter = get_exporter(shop_id=args.shop_id, port=args.port)
    exporter.start_server()
    
    # Record some test metrics
    exporter.record_webhook(args.shop_id, 'test-provider', True, 0.123)
    exporter.record_cache(args.shop_id, 'booking', True)
    exporter.set_cache_hit_rate(args.shop_id, 'booking', 85.5)
    exporter.record_booking(args.shop_id, 'confirmed')
    
    print(f"Metrics exporter running on port {args.port}")
    print(f"Metrics: http://localhost:{args.port}/metrics")
    
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0)
