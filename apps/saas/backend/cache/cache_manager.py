"""
Cache Manager for BarberZap
LRU cache with TTL, metrics tracking, and connection management
"""

import json
import time
import threading
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import redis
from redis.connection import ConnectionPool
from redis.exceptions import RedisError, ConnectionError, TimeoutError
import hashlib
import logging

from ..config.redis_config import (
    connection_config,
    ttl_config,
    retry_config,
    metrics_config,
    build_key
)

logger = logging.getLogger(__name__)


# ==================== Cache Metrics ====================

class CacheMetrics:
    """Track cache hit rate and performance metrics"""

    def __init__(self):
        self._hits = 0
        self._misses = 0
        self._errors = 0
        self._latencies = []  # Store last 100 latencies
        self._lock = threading.Lock()
        self._start_time = time.time()
        self._max_history = metrics_config.max_history_size

    def record_hit(self):
        with self._lock:
            self._hits += 1

    def record_miss(self):
        with self._lock:
            self._misses += 1

    def record_error(self):
        with self._lock:
            self._errors += 1

    def record_latency(self, duration_ms: float):
        with self._lock:
            self._latencies.append(duration_ms)
            if len(self._latencies) > self._max_history:
                self._latencies.pop(0)

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate"""
        with self._lock:
            total = self._hits + self._misses
            if total == 0:
                return 0.0
            return self._hits / total

    @property
    def avg_latency_ms(self) -> float:
        """Average operation latency in milliseconds"""
        with self._lock:
            if not self._latencies:
                return 0.0
            return sum(self._latencies) / len(self._latencies)

    @property
    def p95_latency_ms(self) -> float:
        """95th percentile latency in milliseconds"""
        with self._lock:
            if not self._latencies:
                return 0.0
            sorted_latencies = sorted(self._latencies)
            idx = int(len(sorted_latencies) * 0.95)
            return sorted_latencies[idx]

    @property
    def uptime(self) -> float:
        """Cache manager uptime in seconds"""
        return time.time() - self._start_time

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive metrics"""
        with self._lock:
            return {
                'hits': self._hits,
                'misses': self._misses,
                'errors': self._errors,
                'hit_rate': self.hit_rate,
                'avg_latency_ms': self.avg_latency_ms,
                'p95_latency_ms': self.p95_latency_ms,
                'uptime_seconds': self.uptime,
                'total_requests': self._hits + self._misses + self._errors,
            }

    def reset(self):
        """Reset all metrics"""
        with self._lock:
            self._hits = 0
            self._misses = 0
            self._errors = 0
            self._latencies = []
            self._start_time = time.time()


# ==================== Cache Manager ====================

class CacheManager:
    """
    Redis cache manager with LRU, TTL, and metrics
    
    Features:
    - Connection pooling and retry logic
    - JSON serialization
    - Cache-first pattern
    - Metrics tracking
    - Pattern-based invalidation
    """

    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize cache manager
        
        Args:
            redis_url: Optional Redis connection string (overrides default config)
        """
        self._connection_params = connection_config.connection_kwargs
        if redis_url:
            # Parse redis_url and override connection_params
            self._connection_params = self._parse_redis_url(redis_url)
        
        self._pool: Optional[ConnectionPool] = None
        self._client: Optional[redis.Redis] = None
        self._metrics = CacheMetrics() if metrics_config.enabled else None
        self._lock = threading.Lock()
        self._connected = False
        
        self._connect()

    def _parse_redis_url(self, url: str) -> Dict[str, Any]:
        """Parse Redis URL and return connection parameters"""
        params = self._connection_params.copy()
        
        # Basic URL parsing (redis://host:port/db)
        if url.startswith('redis://') or url.startswith('rediss://'):
            url_without_scheme = url.replace('redis://', '').replace('rediss://', '')
            
            # Handle credentials
            if '@' in url_without_scheme:
                credentials, rest = url_without_scheme.split('@', 1)
                if ':' in credentials:
                    params['password'], rest = rest.split(':', 1)
            else:
                rest = url_without_scheme
            
            # Handle host:port/db
            parts = rest.rsplit('/', 1)
            if len(parts) == 2:
                host_port, db = parts
                params['db'] = int(db)
            else:
                host_port = parts[0]
            
            if ':' in host_port:
                host, port = host_port.split(':')
                params['host'] = host
                params['port'] = int(port)
            else:
                params['host'] = host_port
            
            # SSL
            if url.startswith('rediss://'):
                params['ssl'] = True
        
        return params

    def _connect(self):
        """Establish Redis connection with retry logic"""
        max_retries = retry_config.max_retries
        
        for attempt in range(1, max_retries + 1):
            try:
                self._pool = ConnectionPool(**self._connection_params)
                self._client = redis.Redis(connection_pool=self._pool)
                
                # Test connection
                self._client.ping()
                self._connected = True
                logger.info(f"Connected to Redis at {self._connection_params.get('host')}:{self._connection_params.get('port')}")
                return
                
            except (ConnectionError, TimeoutError) as e:
                if attempt == max_retries:
                    logger.error(f"Failed to connect to Redis after {max_retries} attempts: {e}")
                    self._connected = False
                    raise
                
                delay = retry_config.get_delay(attempt)
                logger.warning(f"Redis connection attempt {attempt}/{max_retries} failed. Retrying in {delay}s...")
                time.sleep(delay)

    def _with_retry(self, func):
        """Execute a Redis function with retry logic"""
        max_retries = retry_config.max_retries
        
        for attempt in range(1, max_retries + 1):
            try:
                return func()
            except (ConnectionError, TimeoutError, RedisError) as e:
                if self._metrics:
                    self._metrics.record_error()
                
                if attempt == max_retries:
                    logger.error(f"Redis operation failed after {max_retries} attempts: {e}")
                    raise
                
                delay = retry_config.get_delay(attempt)
                logger.warning(f"Redis operation attempt {attempt}/{max_retries} failed. Retrying in {delay}s...")
                time.sleep(delay)

    def _serialize(self, value: Any) -> str:
        """Serialize value to JSON string"""
        return json.dumps(value, default=str)

    def _deserialize(self, value: str) -> Any:
        """Deserialize JSON string to Python object"""
        try:
            return json.loads(value)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to deserialize cached value: {e}")
            return None

    def _start_timer(self):
        """Start a performance timer"""
        return time.time()

    def _end_timer(self, start_time: float):
        """End a performance timer and record latency"""
        if self._metrics:
            duration_ms = (time.time() - start_time) * 1000
            self._metrics.record_latency(duration_ms)

    # ==================== Core Operations ====================

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Get a value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
            
        Example:
            >>> cache = CacheManager()
            >>> data = cache.get('tenant:shop123')
        """
        if not self._connected:
            logger.warning("Redis not connected, skipping cache get")
            return None
        
        start_time = self._start_timer()
        
        try:
            result = self._with_retry(lambda: self._client.get(key))
            
            if result is None:
                if self._metrics:
                    self._metrics.record_miss()
                return None
            
            if self._metrics:
                self._metrics.record_hit()
            
            deserialized = self._deserialize(result)
            self._end_timer(start_time)
            
            return deserialized
            
        except Exception as e:
            logger.error(f"Error getting key '{key}': {e}")
            self._end_timer(start_time)
            return None

    def get_or_fetch(self, key: str, fetch_func, ttl: Optional[int] = None) -> Dict[str, Any]:
        """
        Get value from cache, or fetch and cache it if missing
        
        Cache-first pattern optimized for performance
        
        Args:
            key: Cache key
            fetch_func: Function to fetch data from database if not in cache
            ttl: Time to live in seconds (uses default if not specified)
            
        Returns:
            Cached or fetched value
            
        Example:
            >>> def fetch_tenant(shop_id):
            ...     return supabase.table('tenants').select('*').eq('id', shop_id).single()
            >>> cache = CacheManager()
            >>> data = cache.get_or_fetch('tenant:shop123', lambda: fetch_tenant('shop123'))
        """
        # Try cache first
        cached = self.get(key)
        if cached is not None:
            return cached
        
        # Fetch from database
        logger.debug(f"Cache miss for '{key}', fetching from database")
        data = fetch_func()
        
        if data is not None:
            self.set(key, data, ttl or ttl_config.DEFAULT_TTL)
        
        return data

    def set(self, key: str, value: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """
        Set a value in cache
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (uses config default if not specified)
            
        Returns:
            True if successful, False otherwise
            
        Example:
            >>> cache = CacheManager()
            >>> cache.set('tenant:shop123', {'name': 'Barber Shop'}, ttl=3600)
        """
        if not self._connected:
            logger.warning("Redis not connected, skipping cache set")
            return False
        
        start_time = self._start_timer()
        
        try:
            serialized = self._serialize(value)
            
            # Determine TTL
            if ttl is None:
                # Try to infer TTL from key pattern
                ttl = ttl_config.get_ttl_for_pattern(key)
            
            result = self._with_retry(lambda: self._client.setex(key, ttl, serialized))
            self._end_timer(start_time)
            
            return result
            
        except Exception as e:
            logger.error(f"Error setting key '{key}': {e}")
            self._end_timer(start_time)
            return False

    def delete(self, key: str) -> bool:
        """
        Delete a specific key from cache
        
        Args:
            key: Cache key to delete
            
        Returns:
            Number of keys deleted (0 or 1)
        """
        if not self._connected:
            logger.warning("Redis not connected, skipping cache delete")
            return False
        
        start_time = self._start_timer()
        
        try:
            result = self._with_retry(lambda: self._client.delete(key))
            self._end_timer(start_time)
            
            return result > 0
            
        except Exception as e:
            logger.error(f"Error deleting key '{key}': {e}")
            self._end_timer(start_time)
            return False

    def invalidate(self, pattern: str) -> int:
        """
        Invalidate all keys matching a pattern
        
        Args:
            pattern: Key pattern (supports Redis wildcards, e.g. "tenant:*")
            
        Returns:
            Number of keys deleted
            
        Example:
            >>> cache = CacheManager()
            >>> cache.invalidate('tenant:shop123:*')
        """
        if not self._connected:
            logger.warning("Redis not connected, skipping cache invalidate")
            return 0
        
        start_time = self._start_timer()
        
        try:
            # Build full pattern with prefix
            full_pattern = f"{build_key.PREFIX}:{pattern}" if ':' not in pattern else pattern
            
            # Get matching keys (use scan for production, keys for dev)
            keys = []
            for key in self._client.scan_iter(match=full_pattern, count=100):
                keys.append(key)
            
            if not keys:
                self._end_timer(start_time)
                return 0
            
            # Delete in batches
            deleted = 0
            batch_size = 100
            for i in range(0, len(keys), batch_size):
                batch = keys[i:i + batch_size]
                deleted += self._with_retry(lambda: self._client.delete(*batch))
            
            logger.info(f"Invalidated {deleted} keys matching pattern '{full_pattern}'")
            self._end_timer(start_time)
            
            return deleted
            
        except Exception as e:
            logger.error(f"Error invalidating pattern '{pattern}': {e}")
            self._end_timer(start_time)
            return 0

    def invalidate_multi_tenant(self, shop_id: str) -> int:
        """
        Invalidate all cache keys for a specific shop/tenant
        
        Invalidates:
        - tenant:{shop_id}
        - services:{shop_id}
        - appointments:{shop_id}:*
        - queue:{shop_id}
        
        Args:
            shop_id: Shop/tenant ID
            
        Returns:
            Number of keys deleted
        """
        patterns = [
            build_key.tenant_key(shop_id),
            f"{build_key.SERVICES}:{shop_id}",
            f"{build_key.APPOINTMENTS}:{shop_id}:*",
            build_key.queue_key(shop_id),
        ]
        
        total_deleted = 0
        for pattern in patterns:
            total_deleted += self.invalidate(pattern)
        
        return total_deleted

    def exists(self, key: str) -> bool:
        """Check if a key exists in cache"""
        if not self._connected:
            return False
        
        try:
            return self._with_retry(lambda: self._client.exists(key) > 0)
        except Exception as e:
            logger.error(f"Error checking key '{key}': {e}")
            return False

    def expire(self, key: str, ttl: int) -> bool:
        """Set TTL for an existing key"""
        if not self._connected:
            return False
        
        try:
            return self._with_retry(lambda: self._client.expire(key, ttl))
        except Exception as e:
            logger.error(f"Error setting TTL for key '{key}': {e}")
            return False

    # ==================== Batch Operations ====================

    def get_many(self, keys: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Get multiple values from cache
        
        Args:
            keys: List of cache keys
            
        Returns:
            Dict mapping keys to their cached values (None for missing keys)
        """
        if not self._connected or not keys:
            return {key: None for key in keys}
        
        start_time = self._start_timer()
        
        try:
            values = self._with_retry(lambda: self._client.mget(keys))
            result = {}
            
            for key, value in zip(keys, values):
                if value is None:
                    if self._metrics:
                        self._metrics.record_miss()
                    result[key] = None
                else:
                    if self._metrics:
                        self._metrics.record_hit()
                    result[key] = self._deserialize(value)
            
            self._end_timer(start_time)
            return result
            
        except Exception as e:
            logger.error(f"Error getting multiple keys: {e}")
            self._end_timer(start_time)
            return {key: None for key in keys}

    def set_many(self, items: Dict[str, Dict[str, Any]], ttl: Optional[int] = None) -> int:
        """
        Set multiple values in cache
        
        Args:
            items: Dict mapping keys to values
            ttl: Time to live for all items (default TTL used if not specified)
            
        Returns:
            Number of items successfully cached
        """
        if not self._connected or not items:
            return 0
        
        success_count = 0
        for key, value in items.items():
            if self.set(key, value, ttl):
                success_count += 1
        
        return success_count

    # ==================== Health & Monitoring ====================

    def get_health_status(self) -> Dict[str, Any]:
        """
        Get comprehensive health status of the cache manager
        
        Returns:
            Dict with connection status, metrics, and config info
        """
        # Basic Redis info
        redis_info = {
            'connected': self._connected,
            'host': self._connection_params.get('host'),
            'port': self._connection_params.get('port'),
            'db': self._connection_params.get('db'),
        }
        
        # Ping Redis to verify connection
        if self._connected and self._client:
            try:
                start_time = time.time()
                self._client.ping()
                redis_info['latency_ms'] = (time.time() - start_time) * 1000
            except Exception as e:
                redis_info['connected'] = False
                redis_info['error'] = str(e)
        
        # Get cache info (if connected)
        cache_info = {}
        if self._connected:
            try:
                info = self._client.info()
                cache_info['memory_used_mb'] = info.get('used_memory', 0) / (1024 * 1024)
                cache_info['total_keys'] = info.get('db0', {}).get('keys', 0)
                cache_info['hits'] = info.get('keyspace_hits', 0)
                cache_info['misses'] = info.get('keyspace_misses', 0)
                cache_info['redis_hit_rate'] = (
                    cache_info['hits'] / (cache_info['hits'] + cache_info['misses'])
                    if (cache_info['hits'] + cache_info['misses']) > 0
                    else 0.0
                )
                cache_info['connected_clients'] = info.get('connected_clients', 0)
            except Exception as e:
                cache_info['error'] = str(e)
        
        # Get application metrics
        app_metrics = {}
        if self._metrics:
            app_metrics = self._metrics.get_stats()
        
        # Pool info
        pool_info = {}
        if self._pool:
            pool_info = {
                'max_connections': self._pool.max_connections,
                'created_connections': getattr(self._pool, 'created_connections', 'N/A'),
                'available_connections': getattr(self._pool, 'available_connections', 'N/A'),
            }
        
        return {
            'status': 'healthy' if self._connected else 'unhealthy',
            'redis': redis_info,
            'cache': cache_info,
            'metrics': app_metrics,
            'pool': pool_info,
            'timestamp': datetime.utcnow().isoformat(),
        }

    def ping(self) -> bool:
        """Ping Redis server to check connectivity"""
        if not self._connected or not self._client:
            return False
        
        try:
            self._with_retry(lambda: self._client.ping())
            return True
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False

    # ==================== Maintenance ====================

    def flush_all(self) -> bool:
        """Clear all cache entries (use with caution!)"""
        if not self._connected:
            return False
        
        try:
            self._with_retry(lambda: self._client.flushdb())
            logger.warning("Cache flushed completely")
            return True
        except Exception as e:
            logger.error(f"Error flushing cache: {e}")
            return False

    def flush_namespace(self) -> bool:
        """Clear all BarberZap cache entries"""
        pattern = f"{build_key.PREFIX}:*"
        count = self.invalidate(pattern)
        logger.info(f"Flushed {count} BarberZap cache entries")
        return count > 0

    def reset_metrics(self):
        """Reset cache metrics"""
        if self._metrics:
            self._metrics.reset()

    def close(self):
        """Close Redis connection"""
        if self._pool:
            self._pool.disconnect()
            self._connected = False
            logger.info("Redis connection closed")

    def __enter__(self):
        """Context manager support"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager support"""
        self.close()


# ==================== Singleton Instance ====================

# Global cache manager instance
_cache_manager: Optional[CacheManager] = None
_cache_lock = threading.Lock()


def get_cache_manager() -> CacheManager:
    """
    Get or create the global cache manager instance
    
    Returns:
        CacheManager singleton instance
    """
    global _cache_manager
    
    if _cache_manager is None:
        with _cache_lock:
            if _cache_manager is None:
                _cache_manager = CacheManager()
                atexit.register(_cache_manager.close)
    
    return _cache_manager


def reset_cache_manager():
    """Reset the global cache manager instance (mainly for testing)"""
    global _cache_manager
    
    with _cache_lock:
        if _cache_manager:
            _cache_manager.close()
        _cache_manager = None


# Import atexit for cleanup
import atexit
