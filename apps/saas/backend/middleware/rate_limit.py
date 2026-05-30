"""
Rate Limiting Middleware for BarberZap
Redis-based sliding window rate limiter with distributed support
"""

import time
import logging
from typing import Optional, Dict, Any, Callable
from datetime import datetime
from contextlib import contextmanager
import redis
import hashlib
from functools import wraps

from ..config.redis_config import (
    connection_config,
    retry_config
)

logger = logging.getLogger(__name__)


# ==================== Rate Limit Configuration ====================

class RateLimitConfig:
    """Configuration for rate limiting"""
    
    # Default window size in seconds
    DEFAULT_WINDOW = 60  # 1 minute
    
    # Default limits per key type
    DEFAULT_LIMITS = {
        'webhook': {'limit': 100, 'window': 3600},  # 100/hour
        'booking': {'limit': 10, 'window': 60},     # 10/min
        'api': {'limit': 100, 'window': 60},        # 100/min
        'auth': {'limit': 20, 'window': 60},        # 20/min
        'password_reset': {'limit': 5, 'window': 60}, # 5/min
    }
    
    # Custom error messages
    ERROR_MESSAGES = {
        'webhook': "Muitas requisições de webhook. Tente novamente em 1 hora.",
        'booking': "Muitas tentativas de agendamento. Tente novamente em 1 minuto.",
        'api': "Limite de requisições da API atingido. Tente novamente em 1 minuto.",
        'auth': "Muitas tentativas de login. Tente novamente em 1 minuto.",
        'password_reset': "Muitas solicitações de redefinição de senha. Tente novamente em 1 minuto.",
        'default': "Muitas requisições. Por favor, tente novamente mais tarde.",
    }
    
    # Retry-After header in seconds
    RETRY_AFTER_DEFAULT = 60


# ==================== Rate Limit Exception ====================

class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded"""
    
    def __init__(
        self,
        message: str,
        retry_after: int,
        limit: int,
        window: int,
        current: int,
        key: str
    ):
        self.message = message
        self.retry_after = retry_after
        self.limit = limit
        self.window = window
        self.current = current
        self.key = key
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            'error': 'rate_limit_exceeded',
            'message': self.message,
            'retry_after': self.retry_after,
            'limit': self.limit,
            'window': self.window,
            'current': self.current,
            'key': '.'.join(self.key.split(':')[-2:])  # Show last two parts only
        }


# ==================== Rate Limiter Core ====================

class RateLimiter:
    """
    Redis-based sliding window rate limiter
    
    Features:
    - Distributed rate limiting across multiple instances
    - Sliding window algorithm for accurate counting
    - Customizable keys (IP, user, phone, etc.)
    - Statistics tracking
    - Admin bypass support
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Initialize rate limiter
        
        Args:
            redis_client: Optional Redis client (creates new one if not provided)
        """
        self._redis = redis_client
        
        if self._redis is None:
            self._redis = self._create_redis_client()
        
        # Redis key prefix
        self._prefix = 'barberzap:ratelimit'
        
        # Test connection
        try:
            self._redis.ping()
            logger.info("RateLimiter connected to Redis successfully")
        except Exception as e:
            logger.warning(f"RateLimiter Redis connection warning: {e}")
    
    def _create_redis_client(self) -> redis.Redis:
        """Create Redis client from config"""
        from redis.connection import ConnectionPool
        
        pool = ConnectionPool(**connection_config.connection_kwargs)
        return redis.Redis(connection_pool=pool)
    
    def _get_key(self, key_type: str, key_value: str) -> str:
        """
        Build Redis key for rate limiting
        
        Args:
            key_type: Type of key (ip, user, phone, shop_id)
            key_value: Actual value of the key
            
        Returns:
            Full Redis key
        """
        return f"{self._prefix}:{key_type}:{key_value}"
    
    def _get_stats_key(self, key_value: str) -> str:
        """Get key for statistics tracking"""
        return f"{self._prefix}:stats:{key_value}"
    
    def _get_blocked_key(self, key_value: str) -> str:
        """Get key for tracking blocked keys (24h TTL)"""
        return f"{self._prefix}:blocked:{key_value}"
    
    def _get_violators_key(self) -> str:
        """Get sorted set key for top violators"""
        return f"{self._prefix}:violators"
    
    def check_rate_limit(
        self,
        key_type: str,
        key_value: str,
        limit: int,
        window: int,
        admin_bypass: bool = False
    ) -> Dict[str, Any]:
        """
        Check if rate limit is exceeded using sliding window algorithm
        
        Args:
            key_type: Type of key (ip, user, phone, shop_id)
            key_value: Actual value of the key
            limit: Maximum number of requests
            window: Time window in seconds
            admin_bypass: If True, always allow (for admins)
            
        Returns:
            Dict with 'allowed' (bool), 'limit', 'window', 'current', 'retry_after'
            
        Example:
            >>> limiter = RateLimiter()
            >>> result = limiter.check_rate_limit('ip', '192.168.1.1', 100, 60)
            >>> if not result['allowed']:
            ...     print(f"Rate limit exceeded. Retry after {result['retry_after']}s")
        """
        if admin_bypass:
            logger.debug(f"Admin bypass for rate limit: {key_type}:{key_value}")
            return {
                'allowed': True,
                'limit': limit,
                'window': window,
                'current': 0,
                'retry_after': 0
            }
        
        key = self._get_key(key_type, key_value)
        now = time.time()
        window_start = now - window
        
        try:
            # Use Redis pipeline for atomic operations
            pipeline = self._redis.pipeline()
            
            # Remove entries outside the sliding window
            pipeline.zremrangebyscore(key, 0, window_start)
            
            # Count current requests in window
            pipeline.zcard(key)
            
            # Add current request
            pipeline.zadd(key, {str(now): now})
            
            # Set expiration on the key
            pipeline.expire(key, window + 1)
            
            # Execute pipeline
            results = pipeline.execute()
            current_count = results[1]
            
            allowed = current_count <= limit
            retry_after = 0
            
            if not allowed:
                # Calculate how long until oldest request expires
                oldest = self._redis.zrange(key, 0, 0, withscores=True)
                if oldest:
                    oldest_time = oldest[0][1]
                    retry_after = int(oldest_time - window_start)
                    retry_after = max(1, retry_after)
                
                # Record statistics
                self._record_violation(key_type, key_value, limit, window, current_count)
                
                logger.debug(
                    f"Rate limit exceeded: {key_type}:{key_value} "
                    f"({current_count}/{limit} in {window}s)"
                )
            else:
                # Record successful request in stats
                self._record_hit(key_type, key_value)
            
            return {
                'allowed': allowed,
                'limit': limit,
                'window': window,
                'current': current_count,
                'retry_after': retry_after,
                'remaining': max(0, limit - current_count)
            }
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            # On error, allow the request (fail-open)
            return {
                'allowed': True,
                'limit': limit,
                'window': window,
                'current': 0,
                'retry_after': 0
            }
    
    def _record_hit(self, key_type: str, key_value: str):
        """Record a successful request in statistics"""
        stats_key = self._get_stats_key(key_value)
        try:
            self._redis.hincrby(stats_key, 'hits', 1)
            self._redis.expire(stats_key, 86400)  # 24h TTL
        except Exception as e:
            logger.warning(f"Error recording hit: {e}")
    
    def _record_violation(
        self,
        key_type: str,
        key_value: str,
        limit: int,
        window: int,
        current: int
    ):
        """Record a rate limit violation"""
        stats_key = self._get_stats_key(key_value)
        violators_key = self._get_violators_key()
        blocked_key = self._get_blocked_key(key_value)
        
        try:
            with self._redis.pipeline() as pipe:
                # Increment violation count in stats
                pipe.hincrby(stats_key, 'violations', 1)
                pipe.hincrby(stats_key, 'blocked', 1)
                pipe.hset(stats_key, 'last_violation', datetime.utcnow().isoformat())
                pipe.hset(stats_key, 'limit', limit)
                pipe.hset(stats_key, 'window', window)
                pipe.expire(stats_key, 86400)
                
                # Add to violators sorted set (score = violation count)
                pipe.zincrby(violators_key, 1, key_value)
                pipe.expire(violators_key, 86400)
                
                # Track blocked timestamp
                pipe.set(blocked_key, datetime.utcnow().isoformat())
                pipe.expire(blocked_key, 86400)  # 24h TTL
                
                pipe.execute()
            
            logger.warning(
                f"Rate limit violation recorded: {key_type}:{key_value} "
                f"({current}/{limit} in {window}s)"
            )
            
        except Exception as e:
            logger.warning(f"Error recording violation: {e}")
    
    def reset(self, key_type: str, key_value: str) -> bool:
        """
        Reset rate limit for a specific key
        
        Args:
            key_type: Type of key
            key_value: Value of the key
            
        Returns:
            True if successful
        """
        key = self._get_key(key_type, key_value)
        try:
            self._redis.delete(key)
            logger.info(f"Rate limit reset: {key_type}:{key_value}")
            return True
        except Exception as e:
            logger.error(f"Error resetting rate limit: {e}")
            return False
    
    def check(
        self,
        key_type: str,
        key_value: str,
        limit: int = None,
        window: int = None,
        raise_on_exceed: bool = True,
        admin_bypass: bool = False
    ) -> bool:
        """
        Convenience method to check rate limit
        
        Args:
            key_type: Type of key
            key_value: Value of the key
            limit: Maximum requests (uses default if not specified)
            window: Time window in seconds (uses default if not specified)
            raise_on_exceed: If True, raises RateLimitExceeded exception
            admin_bypass: If True, always allow (for admins)
            
        Returns:
            True if allowed, False otherwise
            
        Raises:
            RateLimitExceeded: If limit exceeded and raise_on_exceed=True
        """
        # Use default limit/window if not specified
        if limit is None or window is None:
            from .rate_limit_config import get_endpoint_config
            config = get_endpoint_config(key_type)
            if limit is None:
                limit = config['limit']
            if window is None:
                window = config['window']
        
        result = self.check_rate_limit(key_type, key_value, limit, window, admin_bypass)
        
        if not result['allowed'] and raise_on_exceed:
            from .rate_limit_config import get_error_message
            message = get_error_message(key_type)
            
            raise RateLimitExceeded(
                message=message,
                retry_after=result['retry_after'],
                limit=limit,
                window=window,
                current=result['current'],
                key=self._get_key(key_type, key_value)
            )
        
        return result['allowed']
    
    def get_stats(self, key_type: str, key_value: str) -> Optional[Dict[str, Any]]:
        """
        Get statistics for a specific key
        
        Args:
            key_type: Type of key
            key_value: Value of the key
            
        Returns:
            Dict with hit, violation counts, or None if not found
        """
        stats_key = self._get_stats_key(key_value)
        try:
            data = self._redis.hgetall(stats_key)
            if not data:
                return None
            
            # Convert string values to int
            result = {}
            for k, v in data.items():
                if k in ['hits', 'violations', 'blocked']:
                    result[k] = int(v)
                else:
                    result[k] = v
            
            result['key_type'] = key_type
            result['key_value'] = key_value
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return None
    
    def get_current_usage(
        self,
        key_type: str,
        key_value: str,
        limit: int,
        window: int
    ) -> Dict[str, Any]:
        """
        Get current usage without incrementing
        
        Args:
            key_type: Type of key
            key_value: Value of the key
            limit: Maximum requests
            window: Time window in seconds
            
        Returns:
            Dict with 'count', 'limit', 'remaining', 'window_start', 'window_end'
        """
        key = self._get_key(key_type, key_value)
        now = time.time()
        window_start = now - window
        window_end = now
        
        try:
            # Remove old entries and count
            pipeline = self._redis.pipeline()
            pipeline.zremrangebyscore(key, 0, window_start)
            pipeline.zcard(key)
            
            results = pipeline.execute()
            count = results[1]
            
            return {
                'count': count,
                'limit': limit,
                'remaining': max(0, limit - count),
                'window_start': window_start,
                'window_end': window_end,
                'window_seconds': window,
                'percentage_used': (count / limit) * 100 if limit > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting current usage: {e}")
            return {
                'count': 0,
                'limit': limit,
                'remaining': limit,
                'window_start': window_start,
                'window_end': window_end,
                'window_seconds': window,
                'percentage_used': 0
            }


# ==================== Convenience Functions ====================

def get_rate_limiter() -> RateLimiter:
    """
    Get or create singleton rate limiter instance
    
    Returns:
        RateLimiter instance
    """
    return _get_rate_limiter()


# Singleton instance
_rate_limiter_instance: Optional[RateLimiter] = None
_rate_limiter_lock = __import__('threading').Lock()


def _get_rate_limiter() -> RateLimiter:
    """Get or create global rate limiter singleton"""
    global _rate_limiter_instance
    
    if _rate_limiter_instance is None:
        with _rate_limiter_lock:
            if _rate_limiter_instance is None:
                _rate_limiter_instance = RateLimiter()
    
    return _rate_limiter_instance


def check_rate_limit(key_type: str, key_value: str, **kwargs) -> Dict[str, Any]:
    """
    Convenience function to check rate limit
    
    Example:
        >>> result = check_rate_limit('ip', '192.168.1.1', limit=100, window=60)
        >>> if not result['allowed']:
        ...     print(f"Retry after {result['retry_after']}s")
    """
    limiter = get_rate_limiter()
    return limiter.check_rate_limit(key_type, key_value, **kwargs)


def reset_rate_limit(key_type: str, key_value: str) -> bool:
    """
    Convenience function to reset rate limit
    
    Example:
        >>> reset_rate_limit('ip', '192.168.1.1')
    """
    limiter = get_rate_limiter()
    return limiter.reset(key_type, key_value)


# ==================== Context Manager for Rate Limiting ====================

@contextmanager
def rate_limit_context(
    key_type: str,
    key_value: str,
    limit: int,
    window: int,
    admin_bypass: bool = False
):
    """
    Context manager for rate limiting
    
    Example:
        >>> with rate_limit_context('ip', '192.168.1.1', 100, 60):
        ...     # Do something
        ...     pass
    """
    limiter = get_rate_limiter()
    result = limiter.check_rate_limit(key_type, key_value, limit, window, admin_bypass)
    
    if not result['allowed']:
        message = RateLimitConfig.ERROR_MESSAGES.get(key_type, RateLimitConfig.ERROR_MESSAGES['default'])
        raise RateLimitExceeded(
            message=message,
            retry_after=result['retry_after'],
            limit=limit,
            window=window,
            current=result['current'],
            key=limiter._get_key(key_type, key_value)
        )
    
    yield result
