"""
BarberZap Middleware Package
Rate limiting and request validation middleware
"""

from .rate_limit import (
    RateLimiter,
    RateLimitExceeded,
    get_rate_limiter,
    check_rate_limit,
    reset_rate_limit,
    rate_limit_context,
)

from .rate_limit_config import (
    EndpointType,
    RateLimitRule,
    EndpointConfig,
    RateLimitMapping,
    get_endpoint_config,
    get_error_message,
    get_retry_after,
    env_config,
    RateLimitKeyFunc,
)

from .decorators import (
    rate_limit,
    rate_limit_booking,
    rate_limit_auth,
    rate_limit_api,
    rate_limit_webhook,
    rate_limit_sms,
    rate_limit_whatsapp,
    RateLimitDepends,
    create_rate_limit_dependency,
)

from .rate_limit_stats import (
    RateLimitStats,
    ViolationRecord,
    RateLimitStatsCollector,
    get_stats_collector,
    record_hit,
    record_violation,
    print_stats_summary,
    print_top_violators,
    print_stats_for_key,
)

__all__ = [
    # Core rate limiting
    'RateLimiter',
    'RateLimitExceeded',
    'get_rate_limiter',
    'check_rate_limit',
    'reset_rate_limit',
    'rate_limit_context',
    
    # Configuration
    'EndpointType',
    'RateLimitRule',
    'EndpointConfig',
    'RateLimitMapping',
    'get_endpoint_config',
    'get_error_message',
    'get_retry_after',
    'env_config',
    'RateLimitKeyFunc',
    
    # Decorators
    'rate_limit',
    'rate_limit_booking',
    'rate_limit_auth',
    'rate_limit_api',
    'rate_limit_webhook',
    'rate_limit_sms',
    'rate_limit_whatsapp',
    'RateLimitDepends',
    'create_rate_limit_dependency',
    
    # Statistics
    'RateLimitStats',
    'ViolationRecord',
    'RateLimitStatsCollector',
    'get_stats_collector',
    'record_hit',
    'record_violation',
    'print_stats_summary',
    'print_top_violators',
    'print_stats_for_key',
]

__version__ = '1.0.0'
