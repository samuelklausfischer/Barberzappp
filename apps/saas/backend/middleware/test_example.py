#!/usr/bin/env python3
"""
Quick integration test for rate limiting system
Tests rate limiting with mock Redis
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from unittest.mock import Mock, MagicMock
import time


def test_basic_rate_limiting():
    """Test basic rate limiting functionality"""
    print("="*60)
    print("TEST: Basic Rate Limiting")
    print("="*60)
    
    from backend.middleware.rate_limit import RateLimiter
    
    # Create mock redis client
    mock_redis = Mock()
    mock_redis.ping.return_value = True
    
    # Create rate limiter with mock
    limiter = RateLimiter(redis_client=mock_redis)
    
    # Mock pipeline to simulate rate limiting
    call_count = [0]
    def mock_pipeline():
        call_count[0] += 1
        current = call_count[0]
        
        mock_pipe = MagicMock()
        
        # First 10 requests succeed, 11th fails
        if current <= 10:
            mock_pipe.execute.return_value = [0, current]
        else:
            mock_pipe.execute.return_value = [0, 11]
            mock_pipe.zrange.return_value = [(b'127.0.0.1', time.time())]
        
        mock_pipe.__enter__ = Mock(return_value=mock_pipe)
        mock_pipe.__exit__ = Mock(return_value=None)
        return mock_pipe
    
    mock_redis.pipeline = mock_pipeline
    mock_redis.zremrangebyscore = Mock(return_value=None)
    mock_redis.zadd = Mock(return_value=None)
    mock_redis.expire = Mock(return_value=None)
    
    # Test allowed requests
    print("\n✅ Testing allowed requests (first 10)...")
    for i in range(1, 11):
        result = limiter.check_rate_limit('ip', '127.0.0.1', 10, 60)
        if not result['allowed']:
            print(f"❌ Request {i} should be allowed but was blocked")
            return False
        print(f"   Request {i}: Allowed ✅")
    
    # Test exceeded request
    print("\n❌ Testing exceeded request (11th)...")
    result = limiter.check_rate_limit('ip', '127.0.0.1', 10, 60)
    if result['allowed']:
        print("❌ Request 11 should be blocked but was allowed")
        return False
    print(f"   Request 11: Blocked ✅ (retry after: {result['retry_after']}s)")
    
    print("\n✅ Basic rate limiting test PASSED")
    return True


def test_configuration():
    """Test configuration loading"""
    print("\n" + "="*60)
    print("TEST: Configuration")
    print("="*60)
    
    from backend.middleware.rate_limit_config import (
        get_endpoint_config,
        get_error_message,
        RateLimitMapping
    )
    
    # Test getting endpoint config
    print("\n✅ Testing endpoint configuration...")
    config = get_endpoint_config('webhook')
    assert config['limit'] == 100
    assert config['window'] == 3600
    print(f"   Webhook config: {config['limit']}/hour ✅")
    
    config = get_endpoint_config('booking')
    assert config['limit'] == 10
    assert config['window'] == 60
    print(f"   Booking config: {config['limit']}/min ✅")
    
    # Test error messages
    print("\n✅ Testing error messages...")
    msg = get_error_message('booking')
    assert 'agendamento' in msg.lower() or 'booking' in msg.lower()
    print(f"   Booking error message: {msg[:50]}... ✅")
    
    # Test endpoint mapping
    print("\n✅ Testing endpoint mapping...")
    rule = RateLimitMapping.get_rule('POST', '/api/appointments')
    assert rule is not None
    assert rule.key_type == 'phone'
    assert rule.limit == 10
    print(f"   POST /api/appointments -> phone key, {rule.limit}/min ✅")
    
    print("\n✅ Configuration test PASSED")
    return True


def test_decorators():
    """Test decorator functionality"""
    print("\n" + "="*60)
    print("TEST: Decorators")
    print("="*60)
    
    from backend.middleware.decorators import (
        rate_limit,
        rate_limit_booking,
        rate_limit_auth,
        rate_limit_api,
        rate_limit_webhook,
    )
    
    # Test creating decorators
    print("\n✅ Testing decorator creation...")
    
    basic_decorator = rate_limit(limit=100, window=60, key_type='ip')
    print("   @rate_limit decorator created ✅")
    
    booking_decorator = rate_limit_booking(limit=10, window=60)
    print("   @rate_limit_booking decorator created ✅")
    
    auth_decorator = rate_limit_auth(limit=20, window=60)
    print("   @rate_limit_auth decorator created ✅")
    
    api_decorator = rate_limit_api(limit=100, window=60)
    print("   @rate_limit_api decorator created ✅")
    
    webhook_decorator = rate_limit_webhook(limit=100, window=3600)
    print("   @rate_limit_webhook decorator created ✅")
    
    print("\n✅ Decorators test PASSED")
    return True


def test_statistics():
    """Test statistics collection"""
    print("\n" + "="*60)
    print("TEST: Statistics Collection")
    print("="*60)
    
    from barber.backend.middleware.rate_limit_stats import RateLimitStatsCollector
    
    # Create mock redis
    mock_redis = Mock()
    mock_redis.ping.return_value = True
    mock_redis.scan_iter.return_value = []
    
    collector = RateLimitStatsCollector()
    collector._redis = mock_redis
    
    # Test recording hit
    print("\n✅ Testing hit recording...")
    collector._redis.hincrby = Mock(return_value=1)
    collector.record_hit('ip', '127.0.0.1')
    print("   Hit recorded ✅")
    
    # Test recording violation
    print("\n✅ Testing violation recording...")
    mock_pipeline = MagicMock()
    mock_pipeline.__enter__ = Mock(return_value=mock_pipeline)
    mock_pipeline.__exit__ = Mock(return_value=None)
    mock_pipeline.execute = Mock(return_value=None)
    mock_redis.pipeline = Mock(return_value=mock_pipeline)
    
    collector.record_violation(
        'ip', '127.0.0.1',
        limit=10, window=60,
        current_count=15,
        retry_after=30
    )
    print("   Violation recorded ✅")
    
    # Test get_stats
    print("\n✅ Testing stats retrieval...")
    mock_redis.hgetall = Mock(return_value={
        'key_type': 'ip',
        'hits': '100',
        'violations': '5',
        'blocked': '3'
    })
    
    stats = collector.get_stats('127.0.0.1')
    assert stats is not None
    assert stats.hits == 100
    assert stats.violations == 5
    print(f"   Stats: {stats.hits} hits, {stats.violations} violations ✅")
    
    print("\n✅ Statistics test PASSED")
    return True


def test_exception():
    """Test RateLimitExceeded exception"""
    print("\n" + "="*60)
    print("TEST: RateLimitExceeded Exception")
    print("="*60)
    
    from barber.backend.middleware.rate_limit import RateLimitExceeded
    
    # Test creating exception
    print("\n✅ Testing exception creation...")
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
    assert exc.current == 15
    print("   Exception created with correct values ✅")
    
    # Test to_dict conversion
    print("\n✅ Testing exception to_dict...")
    exc_dict = exc.to_dict()
    assert exc_dict['error'] == 'rate_limit_exceeded'
    assert exc_dict['retry_after'] == 30
    assert exc_dict['limit'] == 10
    print(f"   Exception dict: {exc_dict} ✅")
    
    print("\n✅ Exception test PASSED")
    return True


def test_cli_commands():
    """Test CLI command functions exist"""
    print("\n" + "="*60)
    print("TEST: CLI Commands")
    print("="*60)
    
    import barber.backend.middleware.cli as cli_module
    
    # Test that CLI module has required functions
    commands = [
        'cmd_summary',
        'cmd_top',
        'cmd_stats',
        'cmd_reset',
        'cmd_usage',
        'cmd_config',
        'cmd_clear',
        'cmd_violations',
        'cmd_test',
        'cmd_export',
    ]
    
    print("\n✅ Testing CLI command functions...")
    for cmd in commands:
        assert hasattr(cli_module, cmd), f"Missing command: {cmd}"
        print(f"   {cmd}() exists ✅")
    
    print("\n✅ CLI commands test PASSED")
    return True


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("RATE LIMITING SYSTEM INTEGRATION TESTS")
    print("="*60)
    print("\nQuick tests to verify rate limiting system works correctly\n")
    
    tests = [
        ("Basic Rate Limiting", test_basic_rate_limiting),
        ("Configuration", test_configuration),
        ("Decorators", test_decorators),
        ("Statistics", test_statistics),
        ("Exception", test_exception),
        ("CLI Commands", test_cli_commands),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n❌ {name} test FAILED with exception: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"\n✅ Passed: {passed}/{len(tests)}")
    print(f"❌ Failed: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n🎉 All tests PASSED! Rate limiting system is working.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review above.")
    
    print("\n" + "="*60 + "\n")
    
    # Return exit code
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
