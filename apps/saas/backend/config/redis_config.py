"""
Redis Configuration for BarberZap
Manages connection settings, TTL policies, and retry strategies
"""

from typing import Dict
from dataclasses import dataclass, field
import os

# ==================== Connection Settings ====================

class RedisConnectionConfig:
    """Redis connection configuration"""
    
    def __init__(self):
        # Redis connection string (supports: redis://user:pass@host:port/db, rediss:// for SSL)
        self.redis_url = os.getenv(
            'REDIS_URL',
            'redis://localhost:6379/0'
        )
        
        # Individual connection parameters (used if REDIS_URL not set)
        self.host = os.getenv('REDIS_HOST', 'localhost')
        self.port = int(os.getenv('REDIS_PORT', '6379'))
        self.password = os.getenv('REDIS_PASSWORD', None)
        self.db = int(os.getenv('REDIS_DB', '0'))
        
        # SSL/TLS
        self.ssl_enabled = os.getenv('REDIS_SSL', 'false').lower() == 'true'
        self.ssl_cert_reqs = os.getenv('REDIS_SSL_CERT_REQS', 'required')
        
        # Connection pool settings
        self.max_connections = int(os.getenv('REDIS_MAX_CONNECTIONS', '50'))
        self.socket_timeout = int(os.getenv('REDIS_SOCKET_TIMEOUT', '5'))
        self.socket_connect_timeout = int(os.getenv('REDIS_SOCKET_CONNECT_TIMEOUT', '5'))
        self.retry_on_timeout = os.getenv('REDIS_RETRY_ON_TIMEOUT', 'true').lower() == 'true'
        
        # Health check
        self.health_check_interval = int(os.getenv('REDIS_HEALTH_CHECK_INTERVAL', '30'))
        
        # Decode responses
        self.decode_responses = True
    
    @property
    def connection_kwargs(self) -> Dict:
        """Get connection kwargs for redis.Redis"""
        kwargs = {
            'host': self.host,
            'port': self.port,
            'db': self.db,
            'max_connections': self.max_connections,
            'socket_timeout': self.socket_timeout,
            'socket_connect_timeout': self.socket_connect_timeout,
            'retry_on_timeout': self.retry_on_timeout,
            'decode_responses': self.decode_responses,
            'health_check_interval': self.health_check_interval,
        }
        
        if self.password:
            kwargs['password'] = self.password
        
        if self.ssl_enabled:
            kwargs['ssl'] = True
            kwargs['ssl_cert_reqs'] = self.ssl_cert_reqs
        
        return kwargs


# ==================== TTL Configuration ====================

class RedisTTLConfig:
    """TTL (Time To Live) settings for different data types"""
    
    # Default TTL (in seconds)
    DEFAULT_TTL = 300  # 5 minutes
    
    # TTL by data type
    TENANT_DATA_TTL = int(os.getenv('CACHE_TTL_TENANT', '3600'))  # 1 hour - tenant data changes infrequently
    SERVICES_TTL = int(os.getenv('CACHE_TTL_SERVICES', '1800'))  # 30 minutes
    APPOINTMENTS_TTL = int(os.getenv('CACHE_TTL_APPOINTMENTS', '300'))  # 5 minutes - need to be fresh
    CLIENT_DATA_TTL = int(os.getenv('CACHE_TTL_CLIENT', '1800'))  # 30 minutes
    CLIENT_STATS_TTL = int(os.getenv('CACHE_TTL_CLIENT_STATS', '900'))  # 15 minutes
    SESSION_TTL = int(os.getenv('CACHE_TTL_SESSION', '7200'))  # 2 hours
    
    # TTL by pattern
    TTL_PATTERNS: Dict[str, int] = {
        'tenant:*': TENANT_DATA_TTL,
        'services:*': SERVICES_TTL,
        'appointments:*:*': APPOINTMENTS_TTL,
        'client:*': CLIENT_DATA_TTL,
        'client:stats:*': CLIENT_STATS_TTL,
        'session:*': SESSION_TTL,
    }
    
    @classmethod
    def get_ttl_for_pattern(cls, pattern: str) -> int:
        """Get TTL for a given pattern"""
        for pat, ttl in cls.TTL_PATTERNS.items():
            if pattern.startswith(pat):
                return ttl
        return cls.DEFAULT_TTL
    
    @classmethod
    def get_ttl_for_key_type(cls, key_type: str) -> int:
        """Get TTL for a key type (without the ID part)"""
        return cls.get_ttl_for_pattern(f"{key_type}:")


# ==================== Retry Configuration ====================

class RedisRetryConfig:
    """Retry policy for Redis operations"""
    
    def __init__(self):
        self.max_retries = int(os.getenv('REDIS_MAX_RETRIES', '3'))
        self.base_delay = float(os.getenv('REDIS_RETRY_BASE_DELAY', '0.5'))  # seconds
        self.max_delay = float(os.getenv('REDIS_RETRY_MAX_DELAY', '2.0'))
        self.exponential_base = float(os.getenv('REDIS_RETRY_EXP_BASE', '2'))
        self.retryable_exceptions = [
            'ConnectionError',
            'TimeoutError',
            'ResponseError',
            'RedisError',
        ]
    
    def get_delay(self, attempt: int) -> float:
        """Calculate delay for a given retry attempt using exponential backoff"""
        delay = self.base_delay * (self.exponential_base ** (attempt - 1))
        return min(delay, self.max_delay)


# ==================== Cache Metrics Configuration ====================

@dataclass
class CacheMetricsConfig:
    """Configuration for cache metrics collection"""
    
    enabled: bool = field(default_factory=lambda: os.getenv('CACHE_METRICS_ENABLED', 'true').lower() == 'true')
    sample_rate: float = field(default_factory=lambda: float(os.getenv('CACHE_METRICS_SAMPLE_RATE', '1.0')))
    max_history_size: int = 1000  # Number of metric entries to keep
    alert_threshold: float = 0.7  # Hit rate below this triggers an alert


# ==================== Cache Key Schema ====================

class CacheKeySchema:
    """Defines the naming convention for cache keys"""
    
    # Prefix for all BarberZap cache keys
    PREFIX = 'barberzap'
    
    # Key patterns
    TENANT = f'{PREFIX}:tenant'  # barberzap:tenant:{shop_id}
    SERVICES = f'{PREFIX}:services'  # barberzap:services:{shop_id}
    APPOINTMENTS = f'{PREFIX}:appointments'  # barberzap:appointments:{shop_id}:{date}
    CLIENT = f'{PREFIX}:client'  # barberzap:client:{client_id}
    CLIENT_STATS = f'{PREFIX}:client:stats'  # barberzap:client:stats:{client_id}
    SESSION = f'{PREFIX}:session'  # barberzap:session:{session_id}
    QUEUE = f'{PREFIX}:queue'  # barberzap:queue:{shop_id}
    CACHE_VERSION = f'{PREFIX}:version'  # barberzap:version
    
    @classmethod
    def tenant_key(cls, shop_id: str) -> str:
        return f'{cls.TENANT}:{shop_id}'
    
    @classmethod
    def services_key(cls, shop_id: str) -> str:
        return f'{cls.SERVICES}:{shop_id}'
    
    @classmethod
    def appointments_key(cls, shop_id: str, date: str) -> str:
        return f'{cls.APPOINTMENTS}:{shop_id}:{date}'
    
    @classmethod
    def client_key(cls, client_id: str) -> str:
        return f'{cls.CLIENT}:{client_id}'
    
    @classmethod
    def client_stats_key(cls, client_id: str) -> str:
        return f'{cls.CLIENT_STATS}:{client_id}'
    
    @classmethod
    def session_key(cls, session_id: str) -> str:
        return f'{cls.SESSION}:{session_id}'
    
    @classmethod
    def queue_key(cls, shop_id: str) -> str:
        return f'{cls.QUEUE}:{shop_id}'
    
    @classmethod
    def parse_key(cls, key: str) -> Dict[str, str]:
        """Parse a cache key to extract components"""
        if not key.startswith(cls.PREFIX):
            return {}
        
        parts = key.split(':')
        if len(parts) < 3:
            return {}
        
        result = {
            'prefix': parts[0],
            'type': parts[1],
            'key': ':'.join(parts[2:])
        }
        
        # Handle special cases
        if result['type'] == 'appointments':
            shop_date = result['key'].split(':')
            if len(shop_date) == 2:
                result['shop_id'] = shop_date[0]
                result['date'] = shop_date[1]
        elif result['type'] == 'stats':
            result['client_id'] = result['key']
        else:
            result['shop_id'] = result['key']
        
        return result


# ==================== Module Exports ====================

# Singleton instances
connection_config = RedisConnectionConfig()
ttl_config = RedisTTLConfig()
retry_config = RedisRetryConfig()
metrics_config = CacheMetricsConfig()

# Expose key schema
build_key = CacheKeySchema  # Alias for convenience
