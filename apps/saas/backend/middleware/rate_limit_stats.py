"""
Rate Limiting Statistics for BarberZap
Collect and analyze rate limiting metrics with Redis storage
"""

import time
import json
import logging
from typing import Dict, Any, List, Optional, Iterator
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict

from .rate_limit import get_rate_limiter
from .rate_limit_config import env_config

logger = logging.getLogger(__name__)


# ==================== Statistics Data Structures ====================

@dataclass
class RateLimitStats:
    """Statistics for a rate limited key"""
    
    key_type: str
    key_value: str
    
    # Counters
    hits: int = 0
    violations: int = 0
    blocked: int = 0
    
    # Metadata
    limit: Optional[int] = None
    window: Optional[int] = None
    last_violation: Optional[str] = None
    
    # Timestamps
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'key_type': self.key_type,
            'key_value': self._mask_key() if self.key_type in ['email', 'phone'] else self.key_value,
            'hits': self.hits,
            'violations': self.violations,
            'blocked': self.blocked,
            'limit': self.limit,
            'window': self.window,
            'last_violation': self.last_violation,
            'first_seen': self.first_seen,
            'last_seen': self.last_seen,
            'violation_rate': self.violation_rate if self.hits > 0 else 0,
        }
    
    def _mask_key(self) -> str:
        """Mask sensitive key values for privacy"""
        if not self.key_value or len(self.key_value) <= 4:
            return '****'
        return self.key_value[:2] + '****' + self.key_value[-2:]
    
    @property
    def violation_rate(self) -> float:
        """Calculate violation rate (0-1)"""
        if self.hits == 0:
            return 0.0
        return self.violations / self.hits


@dataclass
class ViolationRecord:
    """A single rate limit violation record"""
    
    key_type: str
    key_value: str
    limit: int
    window: int
    violating_count: int
    timestamp: str
    retry_after: int
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'key_type': self.key_type,
            'key_value': self._mask_key() if self.key_type in ['email', 'phone'] else self.key_value,
            'limit': self.limit,
            'window': self.window,
            'violating_count': self.violating_count,
            'timestamp': self.timestamp,
            'retry_after': self.retry_after,
        }
    
    def _mask_key(self) -> str:
        """Mask sensitive key values"""
        if not self.key_value or len(self.key_value) <= 4:
            return '****'
        return self.key_value[:2] + '****' + self.key_value[-2:]


# ==================== Statistics Collector ====================

class RateLimitStatsCollector:
    """
    Collect and manage rate limiting statistics
    
    Features:
    - Hit/miss/violation tracking per key
    - Redis-based storage with 24h TTL
    - Top violators leaderboard
    - Aggregated statistics by type
    """
    
    def __init__(self, limiter=None):
        """
        Initialize statistics collector
        
        Args:
            limiter: RateLimiter instance (uses global if not provided)
        """
        self._limiter = limiter or get_rate_limiter()
        self._redis = self._limiter._redis
        
        # Redis key prefixes
        self._stats_prefix = 'barberzap:ratelimit:stats'
        self._violations_prefix = 'barberzap:ratelimit:violations'
        self._violators_key = 'barberzap:ratelimit:violators'
    
    def _get_stats_key(self, key_value: str) -> str:
        """Get Redis key for stats"""
        return f"{self._stats_prefix}:{key_value}"
    
    def _get_violation_key(self, timestamp: str) -> str:
        """Get Redis key for a violation record"""
        return f"{self._violations_prefix}:{timestamp}"
    
    # ==================== Stats Recording ====================
    
    def record_hit(self, key_type: str, key_value: str):
        """Record a successful (allowed) request"""
        stats_key = self._get_stats_key(key_value)
        now = datetime.utcnow().isoformat()
        
        try:
            with self._redis.pipeline() as pipe:
                pipe.hincrby(stats_key, 'hits', 1)
                pipe.hsetnx(stats_key, 'key_type', key_type)
                pipe.hsetnx(stats_key, 'first_seen', now)
                pipe.hset(stats_key, 'last_seen', now)
                pipe.expire(stats_key, 86400)  # 24h TTL
                pipe.execute()
        except Exception as e:
            logger.warning(f"Error recording hit: {e}")
    
    def record_violation(
        self,
        key_type: str,
        key_value: str,
        limit: int,
        window: int,
        current_count: int,
        retry_after: int
    ):
        """
        Record a rate limit violation
        
        Args:
            key_type: Type of key
            key_value: Value of the key
            limit: Rate limit that was exceeded
            window: Time window
            current_count: Actual count at time of violation
            retry_after: Seconds to wait before retry
        """
        stats_key = self._get_stats_key(key_value)
        now = datetime.utcnow().isoformat()
        timestamp_ms = int(time.time() * 1000)
        
        try:
            with self._redis.pipeline() as pipe:
                # Update stats
                pipe.hincrby(stats_key, 'violations', 1)
                pipe.hincrby(stats_key, 'blocked', 1)
                pipe.hset(stats_key, 'last_violation', now)
                pipe.hset(stats_key, 'limit', limit)
                pipe.hset(stats_key, 'window', window)
                pipe.hsetnx(stats_key, 'key_type', key_type)
                pipe.hsetnx(stats_key, 'first_seen', now)
                pipe.hset(stats_key, 'last_seen', now)
                pipe.expire(stats_key, 86400)
                
                # Record violation details
                violation_key = self._get_violation_key(str(timestamp_ms))
                violation_data = json.dumps({
                    'key_type': key_type,
                    'key_value': key_value,
                    'limit': limit,
                    'window': window,
                    'current_count': current_count,
                    'retry_after': retry_after,
                    'timestamp': now
                })
                pipe.set(violation_key, violation_data)
                pipe.expire(violation_key, 86400)
                
                # Add to violators leaderboard (sorted set)
                pipe.zincrby(self._violators_key, 1, key_value)
                pipe.expire(self._violators_key, 86400)
                
                pipe.execute()
                
            logger.info(
                f"Rate limit violation recorded: {key_type}:{key_value} "
                f"({current_count}/{limit} in {window}s)"
            )
            
        except Exception as e:
            logger.warning(f"Error recording violation: {e}")
    
    # ==================== Stats Retrieval ====================
    
    def get_stats(self, key_value: str) -> Optional[RateLimitStats]:
        """
        Get statistics for a specific key
        
        Args:
            key_value: The key value to look up
            
        Returns:
            RateLimitStats object or None if not found
        """
        stats_key = self._get_stats_key(key_value)
        
        try:
            data = self._redis.hgetall(stats_key)
            if not data:
                return None
            
            # Convert to proper types
            result = RateLimitStats(
                key_type=data.get('key_type', 'unknown'),
                key_value=key_value,
                hits=int(data.get('hits', 0)),
                violations=int(data.get('violations', 0)),
                blocked=int(data.get('blocked', 0)),
                limit=int(data.get('limit', 0)) if data.get('limit') else None,
                window=int(data.get('window', 0)) if data.get('window') else None,
                last_violation=data.get('last_violation'),
                first_seen=data.get('first_seen'),
                last_seen=data.get('last_seen'),
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return None
    
    def get_stats_by_type(self, key_type: str, limit: int = 100) -> List[RateLimitStats]:
        """
        Get statistics for all keys of a given type
        
        Args:
            key_type: Type of key (ip, shop_id, phone, email, etc.)
            limit: Maximum number of results
            
        Returns:
            List of RateLimitStats objects
        """
        pattern = f"{self._stats_prefix}:*"
        results = []
        
        try:
            # Scan for matching keys
            for key in self._redis.scan_iter(match=pattern, count=1000):
                # Get the key value from the Redis key
                key_value = key.decode().split(':')[-1] if isinstance(key, bytes) else key.split(':')[-1]
                
                # Get stats
                stats = self.get_stats(key_value)
                
                if stats and stats.key_type == key_type:
                    results.append(stats)
                
                if len(results) >= limit:
                    break
            
            # Sort by violations (descending)
            results.sort(key=lambda x: x.violations, reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting stats by type: {e}")
        
        return results
    
    def get_top_violators(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top violators across all key types
        
        Args:
            limit: Number of top violators to return
            
        Returns:
            List of violator info dicts with 'key_value', 'violation_count', 'stats'
        """
        try:
            # Get top violators from sorted set
            results = self._redis.zrevrange(self._violators_key, 0, limit - 1, withscores=True)
            
            violators = []
            for key_value, score in results:
                key_value = key_value.decode() if isinstance(key_value, bytes) else key_value
                score = float(score) if isinstance(score, bytes) else score
                
                # Get full stats
                stats = self.get_stats(key_value)
                
                violators.append({
                    'key_value': key_value,
                    'violation_count': int(score),
                    'stats': stats.to_dict() if stats else None
                })
            
            return violators
            
        except Exception as e:
            logger.error(f"Error getting top violators: {e}")
            return []
    
    def get_violations(
        self,
        since: Optional[str] = None,
        until: Optional[str] = None,
        limit: int = 100
    ) -> List[ViolationRecord]:
        """
        Get violation records within a time range
        
        Args:
            since: ISO format timestamp (start of range)
            until: ISO format timestamp (end of range)
            limit: Maximum number of records
            
        Returns:
            List of ViolationRecord objects
        """
        pattern = f"{self._violations_prefix}:*"
        results = []
        
        # Parse timestamps
        since_ms = int(datetime.fromisoformat(since).timestamp() * 1000) if since else 0
        until_ms = int(datetime.fromisoformat(until).timestamp() * 1000) if until else time.time() * 1000
        
        try:
            for key in self._redis.scan_iter(match=pattern, count=1000):
                # Extract timestamp from key
                key_str = key.decode() if isinstance(key, bytes) else key
                timestamp_ms = int(key_str.split(':')[-1])
                
                # Check if within range
                if since_ms <= timestamp_ms <= until_ms:
                    # Get violation data
                    data = self._redis.get(key)
                    if data:
                        data_dict = json.loads(data)
                        
                        record = ViolationRecord(
                            key_type=data_dict['key_type'],
                            key_value=data_dict['key_value'],
                            limit=data_dict['limit'],
                            window=data_dict['window'],
                            violating_count=data_dict['current_count'],
                            timestamp=data_dict['timestamp'],
                            retry_after=data_dict['retry_after'],
                        )
                        
                        results.append(record)
                
                if len(results) >= limit:
                    break
            
            # Sort by timestamp (newest first)
            results.sort(key=lambda x: x.timestamp, reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting violations: {e}")
        
        return results
    
    # ==================== Aggregated Stats ====================
    
    def get_aggregated_stats(self) -> Dict[str, Any]:
        """
        Get aggregated statistics across all keys
        
        Returns:
            Dict with totals, top violations, stats by type
        """
        try:
            # Scan all stats keys
            pattern = f"{self._stats_prefix}:*"
            
            total_hits = 0
            total_violations = 0
            total_blocked = 0
            stats_by_type = defaultdict(lambda: {
                'hits': 0,
                'violations': 0,
                'blocked': 0,
                'count': 0
            })
            
            for key in self._redis.scan_iter(match=pattern, count=1000):
                key_str = key.decode() if isinstance(key, bytes) else key
                key_value = key_str.split(':')[-1]
                
                stats = self.get_stats(key_value)
                if stats:
                    total_hits += stats.hits
                    total_violations += stats.violations
                    total_blocked += stats.blocked
                    
                    stats_by_type[stats.key_type]['hits'] += stats.hits
                    stats_by_type[stats.key_type]['violations'] += stats.violations
                    stats_by_type[stats.key_type]['blocked'] += stats.blocked
                    stats_by_type[stats.key_type]['count'] += 1
            
            # Convert defaultdict to regular dict
            stats_by_type = dict(stats_by_type)
            
            # Calculate ratios
            total_requests = total_hits + total_blocked
            violation_rate = (total_violations / total_requests) if total_requests > 0 else 0
            block_rate = (total_blocked / total_requests) if total_requests > 0 else 0
            
            return {
                'total_hits': total_hits,
                'total_violations': total_violations,
                'total_blocked': total_blocked,
                'total_requests': total_requests,
                'violation_rate': round(violation_rate * 100, 2),
                'block_rate': round(block_rate * 100, 2),
                'stats_by_type': stats_by_type,
                'top_violators': self.get_top_violators(10),
                'timestamp': datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Error getting aggregated stats: {e}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat(),
            }
    
    # ==================== Maintenance ====================
    
    def clear_stats(self, key_value: Optional[str] = None) -> int:
        """
        Clear statistics
        
        Args:
            key_value: Specific key to clear (clears all if None)
            
        Returns:
            Number of keys deleted
        """
        if key_value:
            # Clear specific key
            stats_key = self._get_stats_key(key_value)
            deleted = self._redis.delete(stats_key)
            logger.info(f"Cleared stats for key: {key_value}")
            return deleted
        else:
            # Clear all stats
            pattern = f"{self._stats_prefix}:*"
            deleted = 0
            
            for key in self._redis.scan_iter(match=pattern, count=1000):
                deleted += self._redis.delete(key)
            
            logger.info(f"Cleared all rate limit stats ({deleted} keys)")
            return deleted
    
    def clear_violations(self, older_than_hours: int = 24) -> int:
        """
        Clear old violation records
        
        Args:
            older_than_hours: Clear violations older than this many hours
            
        Returns:
            Number of keys deleted
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=older_than_hours)
        cutoff_ms = int(cutoff_time.timestamp() * 1000)
        
        pattern = f"{self._violations_prefix}:*"
        deleted = 0
        
        try:
            for key in self._redis.scan_iter(match=pattern, count=1000):
                key_str = key.decode() if isinstance(key, bytes) else key
                timestamp_ms = int(key_str.split(':')[-1])
                
                if timestamp_ms < cutoff_ms:
                    deleted += self._redis.delete(key)
            
            logger.info(f"Cleared {deleted} old violation records")
            
        except Exception as e:
            logger.error(f"Error clearing violations: {e}")
        
        return deleted
    
    def reset_violators_leaderboard(self) -> bool:
        """Reset the violators leaderboard"""
        try:
            self._redis.delete(self._violators_key)
            logger.info("Violators leaderboard reset")
            return True
        except Exception as e:
            logger.error(f"Error resetting violators leaderboard: {e}")
            return False


# ==================== Global Stats Collector ====================

# Singleton instance
_stats_collector: Optional[RateLimitStatsCollector] = None
_stats_lock = __import__('threading').Lock()


def get_stats_collector() -> RateLimitStatsCollector:
    """Get or create global stats collector singleton"""
    global _stats_collector
    
    if _stats_collector is None:
        with _stats_lock:
            if _stats_collector is None:
                _stats_collector = RateLimitStatsCollector()
    
    return _stats_collector


def record_hit(key_type: str, key_value: str):
    """Convenience function to record a hit"""
    collector = get_stats_collector()
    collector.record_hit(key_type, key_value)


def record_violation(
    key_type: str,
    key_value: str,
    limit: int,
    window: int,
    current_count: int,
    retry_after: int
):
    """Convenience function to record a violation"""
    collector = get_stats_collector()
    collector.record_violation(
        key_type, key_value, limit, window, current_count, retry_after
    )


# ==================== CLI Functions ====================

def print_stats_summary():
    """Print a summary of rate limiting statistics"""
    collector = get_stats_collector()
    
    print("\n" + "="*60)
    print("RATE LIMITING STATISTICS SUMMARY")
    print("="*60)
    
    # Aggregated stats
    aggregated = collector.get_aggregated_stats()
    
    print(f"\nTotal Requests: {aggregated.get('total_requests', 0)}")
    print(f"  - Hits: {aggregated.get('total_hits', 0)}")
    print(f"  - Violations: {aggregated.get('total_violations', 0)}")
    print(f"  - Blocked: {aggregated.get('total_blocked', 0)}")
    print(f"Violation Rate: {aggregated.get('violation_rate', 0)}%")
    print(f"Block Rate: {aggregated.get('block_rate', 0)}%")
    
    # Stats by type
    stats_by_type = aggregated.get('stats_by_type', {})
    if stats_by_type:
        print("\nStatistics by Type:")
        for key_type, stats in stats_by_type.items():
            print(f"  {key_type}:")
            print(f"    - Keys: {stats['count']}")
            print(f"    - Hits: {stats['hits']}")
            print(f"    - Violations: {stats['violations']}")
            print(f"    - Blocked: {stats['blocked']}")
    
    # Top violators
    top_violators = aggregated.get('top_violators', [])
    if top_violators:
        print("\nTop Violators:")
        for i, violator in enumerate(top_violators[:5], 1):
            print(f"  {i}. {violator['key_value']}: {violator['violation_count']} violations")
    
    print("\n" + "="*60 + "\n")


def print_top_violators(limit: int = 10):
    """Print top violators"""
    collector = get_stats_collector()
    violators = collector.get_top_violators(limit)
    
    print(f"\nTop {limit} Violators:")
    print("-" * 60)
    
    for i, violator in enumerate(violators, 1):
        stats = violator.get('stats', {})
        print(f"{i}. Key: {violator['key_value']}")
        print(f"   Violations: {violator['violation_count']}")
        if stats:
            print(f"   Type: {stats.get('key_type', 'N/A')}")
            print(f"   Hits: {stats.get('hits', 0)}")
            print(f"   Last Violation: {stats.get('last_violation', 'N/A')}")
        print()


def print_stats_for_key(key_value: str):
    """Print statistics for a specific key"""
    collector = get_stats_collector()
    stats = collector.get_stats(key_value)
    
    if stats:
        print(f"\nStatistics for key: {key_value}")
        print("-" * 60)
        print(f"Type: {stats.key_type}")
        print(f"Hits: {stats.hits}")
        print(f"Violations: {stats.violations}")
        print(f"Blocked: {stats.blocked}")
        print(f"Limit: {stats.limit}")
        print(f"Window: {stats.window}s")
        print(f"Violation Rate: {stats.violation_rate:.2%}")
        print(f"First Seen: {stats.first_seen}")
        print(f"Last Seen: {stats.last_seen}")
        print(f"Last Violation: {stats.last_violation}")
    else:
        print(f"\nNo statistics found for key: {key_value}")
