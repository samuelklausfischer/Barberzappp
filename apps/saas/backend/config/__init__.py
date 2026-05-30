"""
BarberZap Configuration Package

Configurações centralizadas para Redis, TTL, e retry policies
"""

from .redis_config import (
    RedisConnectionConfig,
    RedisTTLConfig,
    RedisRetryConfig,
    CacheMetricsConfig,
    CacheKeySchema,
    build_key,
    # Singleton instances
    connection_config,
    ttl_config,
    retry_config,
    metrics_config,
)

__all__ = [
    'RedisConnectionConfig',
    'RedisTTLConfig',
    'RedisRetryConfig',
    'CacheMetricsConfig',
    'CacheKeySchema',
    'build_key',
    'connection_config',
    'ttl_config',
    'retry_config',
    'metrics_config',
]
