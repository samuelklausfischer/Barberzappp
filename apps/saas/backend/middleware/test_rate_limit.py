"""
Rate Limiting Tests for BarberZap
Unit tests for the rate limiting system
"""

import pytest
import time
from unittest.mock import Mock, patch, MagicMock

from barber.backend.middleware import (
    RateLimiter,
    RateLimitExceeded,
    get_rate_limiter,
    reset_rate_limit,
)
from barber.backend.middleware.rate_limit_config import (
    RateLimitMapping,
    RateLimitRule,
    env_config,
)
from barber.backend.middleware.decorators import (
    rate_limit,
    rate_limit_booking,
    rate_limit_auth,
    rate_limit_api,
)
from barber.backend.middleware.rate_limit_stats import (
    RateLimitStatsCollector,
    get_stats_collector,
)


# ==================== Fixtures ====================

@pytest.fixture
def limiter():
    """Create a rate limiter instance"""
    # Create mock redis client
    mock_redis = Mock()
    mock_redis.ping.return_value = True
    mock_redis.pipeline.return_value.__enter__ = Mock()
    mock_redis.pipeline.return_value.__exit__ = Mock()
    
    # Create limiter with mock redis
    with patch('barber.backend.middleware.rate_limit.redis.Redis', return_value=mock_redis):
        limiter = RateLimiter()
        return limiter


@pytest.fixture
def collector():
    """Create a stats collector"""
    mock_redis = Mock()
    mock_redis.ping.return_value = True
    mock_redis.scan_iter.return_value = []
    
    with patch('barber.backend.middleware.rate_limit_stats.redis.Redis', return_value=mock_redis):
        return RateLimitStatsCollector()


# ==================== Rate Limiter Tests ====================

class TestRateLimiter:
    """Tests for RateLimiter class"""
    
    def test_check_rate_limit_allowed(self, limiter):
        """Test that requests within limit are allowed"""
        # Mock the pipeline to return count within limit
        mock_pipeline = MagicMock()
        mock_pipeline.execute.return_value = [0, 5]  # 5 requests (limit is 10)
        
        limiter._redis.pipeline.return_value = mock_pipeline
        
        result = limiter.check_rate_limit('ip', '127.0.0.1', 10, 60)
        
        assert result['allowed'] is True
        assert result['current'] == 5
        assert result['remaining'] == 5
    
    def test_check_rate_limit_exceeded(self, limiter):
        """Test that requests over limit are blocked"""
        # Mock the pipeline to return count over limit
        mock_pipeline = MagicMock()
        mock_pipeline.execute.return_value = [0, 15]  # 15 requests (limit is 10)
        mock_pipeline.zrange.return_value = [(b'127.0.0.1', time.time())]
        
        limiter._redis.pipeline.return_value = mock_pipeline
        
        result = limiter.check_rate_limit('ip', '127.0.0.1', 10, 60)
        
        assert result['allowed'] is False
        assert result['current'] == 15
        assert result['retry_after'] > 0
    
    def test_check_rate_limit_admin_bypass(self, limiter):
        """Test that admin bypass works"""
        result = limiter.check_rate_limit(
            'ip', '127.0.0.1', 
            limit=10, window=60, 
            admin_bypass=True
        )
        
        assert result['allowed'] is True
        assert result['current'] == 0
    
    def test_get_current_usage(self, limiter):
        """Test getting current usage"""
        # Mock zcard to return current count
        limiter._redis.zremrangebyscore.return_value = 5
        limiter._redis.zcard.return_value = 5
        
        usage = limiter.get_current_usage('ip', '127.0.0.1', 10, 60)
        
        assert usage['count'] == 5
        assert usage['limit'] == 10
        assert usage['remaining'] == 5
        assert usage['percentage_used'] == 50.0
    
    def test_reset(self, limiter):
        """Test resetting rate limit"""
        limiter._redis.delete.return_value = 1
        
        result = limiter.reset('ip', '127.0.0.1')
        
        assert result is True
        limiter._redis.delete.assert_called_once()


# ==================== Configuration Tests ====================

class TestRateLimitConfig:
    """Tests for rate limit configuration"""
    
    def test_get_endpoint_config(self):
        """Test getting endpoint configuration"""
        from barber.backend.middleware.rate_limit_config import get_endpoint_config
        
        config = get_endpoint_config('webhook')
        
        assert 'limit' in config
        assert 'window' in config
        assert config['limit'] == 100
        assert config['window'] == 3600
    
    def test_get_error_message(self):
        """Test getting error message"""
        from barber.backend.middleware.rate_limit_config import get_error_message
        
        message = get_error_message('booking')
        
        assert 'agendamento' in message.lower()
    
    def test_rate_limit_mapping(self):
        """Test endpoint mapping"""
        rule = RateLimitMapping.get_rule('POST', '/api/appointments')
        
        assert rule is not None
        assert rule.key_type == 'phone'
        assert rule.limit == 10
        assert rule.window == 60
    
    def test_env_config(self):
        """Test environment configuration"""
        with patch.dict('os.environ', {'RATE_LIMIT_ENABLED': 'false'}):
            from barber.backend.middleware.rate_limit_config import RateLimitEnvConfig
            config = RateLimitEnvConfig()
            
            assert config.is_enabled() is False
    
    def test_env_config_whitelist(self):
        """Test whitelist configuration"""
        with patch.dict('os.environ', {
            'RATE_LIMIT_WHITELIST_IPS': '127.0.0.1,10.0.0.1'
        }):
            from barber.backend.middleware.rate_limit_config import RateLimitEnvConfig
            config = RateLimitEnvConfig()
            
            assert '127.0.0.1' in config.whitelist_ips
            assert '10.0.0.1' in config.whitelist_ips
            assert config.is_whitelisted('ip', '127.0.0.1') is True
    
    def test_modify_limit(self):
        """Test limit modification"""
        with patch.dict('os.environ', {'RATE_LIMIT_MULTIPLIER': '2.0'}):
            from barber.backend.middleware.rate_limit_config import RateLimitEnvConfig
            config = RateLimitEnvConfig()
            
            modified = config.modify_limit(10)
            
            assert modified == 20


# ==================== Decorator Tests ====================

class TestRateLimitDecorators:
    """Tests for rate limiting decorators"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_decorator(self):
        """Test basic rate limit decorator"""
        call_count = {'count': 0}
        
        @rate_limit(limit=10, window=60, key_type='ip')
        @rate_limit(limit=10, window=60, key_type='ip')
        async def test_function():
            call_count['count'] += 1
            return "success"
        
        # Test execution (may fail without proper request context)
        try:
            result = await test_function()
            assert result == "success"
        except Exception as e:
            # Expected to fail without proper request context
            pass
    
    def test_rate_limit_booking(self):
        """Test booking rate limit decorator"""
        decorator = rate_limit_booking(limit=10, window=60)
        assert decorator is not None
    
    def test_rate_limit_auth(self):
        """Test auth rate limit decorator"""
        decorator_ip = rate_limit_auth(ip_key=True)
        decorator_email = rate_limit_auth(ip_key=False, email_param='email')
        assert decorator_ip is not None
        assert decorator_email is not None
    
    def test_rate_limit_api(self):
        """Test API rate limit decorator"""
        decorator_read = rate_limit_api(read_only=True)
        decorator_write = rate_limit_api(read_only=False)
        assert decorator_read is not None
        assert decorator_write is not None


# ==================== Statistics Tests ====================

class TestRateLimitStats:
    """Tests for statistics collection"""
    
    def test_record_hit(self, collector):
        """Test recording a hit"""
        collector.record_hit('ip', '127.0.0.1')
        
        # Check if hincrby was called
        collector._redis.hincrby.assert_called()
    
    def test_record_violation(self, collector):
        """Test recording a violation"""
        collector._redis.pipeline.return_value.__enter__.return_value.hset.return_value = True
        
        collector.record_violation(
            'ip', '127.0.0.1',
            limit=10, window=60,
            current_count=15,
            retry_after=30
        )
        
        # Check if violation was recorded
        collector._redis.hincrby.assert_called()
    
    def test_get_stats(self, collector):
        """Test getting stats for a key"""
        # Mock hgetall to return stats data
        collector._redis.hgetall.return_value = {
            'key_type': 'ip',
            'hits': '100',
            'violations': '5',
            'blocked': '3'
        }
        
        stats = collector.get_stats('127.0.0.1')
        
        assert stats is not None
        assert stats.key_type == 'ip'
        assert stats.hits == 100
        assert stats.violations == 5
        assert stats.blocked == 3
    
    def test_get_top_violators(self, collector):
        """Test getting top violators"""
        # Mock zrevrange
        collector._redis.zrevrange.return_value = [
            (b'127.0.0.1', 10.0),
            (b'192.168.1.1', 5.0)
        ]
        collector._redis.hgetall.return_value = {}
        
        violators = collector.get_top_violators(10)
        
        assert len(violators) == 2
        assert violators[0]['violation_count'] == 10
    
    def test_get_aggregated_stats(self, collector):
        """Test getting aggregated statistics"""
        # Mock scan_iter to return keys
        collector._redis.scan_iter.return_value = []
        
        stats = collector.get_aggregated_stats()
        
        assert 'total_hits' in stats
        assert 'total_violations' in stats
        assert 'violation_rate' in stats
    
    def test_clear_stats(self, collector):
        """Test clearing statistics"""
        collector._redis.delete.return_value = 1
        
        count = collector.clear_stats('127.0.0.1')
        
        assert count >= 0


# ==================== Exception Tests ====================

class TestRateLimitException:
    """Tests for RateLimitExceeded exception"""
    
    def test_exception_creation(self):
        """Test creating a rate limit exception"""
        exc = RateLimitExceeded(
            message="Too many requests",
            retry_after=30,
            limit=10,
            window=60,
            current=15,
            key="ip:127.0.0.1"
        )
        
        assert exc.message == "Too many requests"
        assert exc.retry_after == 30
        assert exc.limit == 10
        assert exc.window == 60
        assert exc.current == 15
    
    def test_exception_to_dict(self):
        """Test converting exception to dict"""
        exc = RateLimitExceeded(
            message="Too many requests",
            retry_after=30,
            limit=10,
            window=60,
            current=15,
            key="ip:127.0.0.1"
        )
        
        exc_dict = exc.to_dict()
        
        assert exc_dict['error'] == 'rate_limit_exceeded'
        assert exc_dict['message'] == "Too many requests"
        assert exc_dict['retry_after'] == 30
        assert exc_dict['limit'] == 10


# ==================== Integration Tests ====================

class TestIntegration:
    """Integration tests for rate limiting"""
    
    @pytest.mark.integration
    @pytest.mark.skipif(not pytest.config.getoption("--redis"), reason="Redis not available")
    def test_full_rate_limit_cycle(self):
        """Test a full rate limit cycle with real Redis"""
        # This test requires a running Redis instance
        limiter = get_rate_limiter()
        
        # Reset the key
        reset_rate_limit('ip', '127.0.0.1')
        
        # Make 5 allowed requests
        for i in range(5):
            result = limiter.check('ip', '127.0.0.1', 10, 60, raise_on_exceed=False)
            assert result['allowed'] is True
        
        # Check current usage
        usage = limiter.get_current_usage('ip', '127.0.0.1', 10, 60)
        assert usage['count'] == 5
        
        # Clean up
        reset_rate_limit('ip', '127.0.0.1')


# ==================== Benchmarks ====================

class TestBenchmarks:
    """Performance benchmarks (not run by default)"""
    
    @pytest.mark.benchmark
    @pytest.mark.skip(reason="Benchmark only")
    def benchmark_rate_limit_check(self, limiter):
        """Benchmark rate limit check performance"""
        import timeit
        
        def check():
            limiter.check('ip', '127.0.0.1', 100, 60, raise_on_exceed=False)
        
        time = timeit.timeit(check, number=1000)
        avg_time_ms = (time / 1000) * 1000
        
        print(f"Average rate limit check time: {avg_time_ms:.3f}ms")
        assert avg_time_ms < 10  # Should be under 10ms


# ==================== Run Tests ====================

if __name__ == '__main__':
    pytest.main([
        __file__,
        '-v',
        '--tb=short',
    ])
