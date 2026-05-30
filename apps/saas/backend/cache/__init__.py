"""
BarberZap Cache Package

Sistema de cache distribuído com Redis para BarberZap
"""

from .cache_manager import (
    CacheManager,
    get_cache_manager,
    reset_cache_manager,
    CacheMetrics,
)

from .invalidation import (
    InvalidationEventType,
    InvalidationStrategy,
    SupabaseWebhookHandler,
    RedisPubSubInvalidation,
    AsyncCacheInvalidation,
    CacheInvalidationManager,
    get_invalidation_manager,
)

__all__ = [
    # Cache Manager
    'CacheManager',
    'get_cache_manager',
    'reset_cache_manager',
    'CacheMetrics',
    # Invalidation
    'InvalidationEventType',
    'InvalidationStrategy',
    'SupabaseWebhookHandler',
    'RedisPubSubInvalidation',
    'AsyncCacheInvalidation',
    'CacheInvalidationManager',
    'get_invalidation_manager',
]

__version__ = '1.0.0'
