"""
BarberZap Metrics Package
=========================

Exports all metrics-related modules and utilities.

Usage:
    from metrics import PrometheusExporter, MetricsCollector
    
    exporter = PrometheusExporter(shop_id='your-shop-id')
    collector = MetricsCollector(redis_url='redis://localhost:6379')
"""

from .prometheus_exporter import (
    PrometheusExporter,
    get_exporter,
    track_latency,
    MetricLabel,
    MetricConfig,
)

from .metrics_collector import (
    MetricsCollector,
    get_collector,
    RedisMetricsStore,
    TimeWindow,
    MetricType,
    MetricSample,
    MetricAggregate,
)

__all__ = [
    # Prometheus Exporter
    'PrometheusExporter',
    'get_exporter',
    'track_latency',
    'MetricLabel',
    'MetricConfig',
    # Metrics Collector
    'MetricsCollector',
    'get_collector',
    'RedisMetricsStore',
    'TimeWindow',
    'MetricType',
    'MetricSample',
    'MetricAggregate',
]

__version__ = '1.0.0'
