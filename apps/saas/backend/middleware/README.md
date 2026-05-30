# Rate Limiting System documentation for BarberZap

Complete distributed rate limiting system with Redis backend, sliding window algorithm, and comprehensive statistics.

## 📋 Overview

The rate limiting system protects your API from abuse, spam, and DoS attacks by limiting request rates based on various keys (IP, user, phone, shop_id, email).

### Key Features

- ✅ **Redis-based distributed rate limiting** - Works across multiple instances
- ✅ **Sliding window algorithm** - Accurate request counting
- ✅ **Multiple key types** - IP, user, phone, shop_id, email, custom
- ✅ **Flexible decorators** - Easy integration with FastAPI/Flask
- ✅ **Statistics tracking** - Hit/miss/violation metrics with 24h retention
- ✅ **Admin bypass** - Allow admins to bypass limits
- ✅ **Whitelist/blocklist** - IP and shop-specific overrides
- ✅ **Environment-based configuration** - Adjust limits per environment
- ✅ **CLI tools** - Monitor and manage rate limits

## 🚀 Quick Start

### 1. Environment Variables

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Mode: strict (block on error), lenient (allow on error), disabled
RATE_LIMIT_MODE=strict

# Multiplier for limits (1.0 = normal, 2.0 = double, etc.)
RATE_LIMIT_MULTIPLIER=1.0

# Admin bypass enabled
RATE_LIMIT_ADMIN_BYPASS=true

# Whitelist IPs (comma-separated)
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,10.0.0.1

# Whitelist shop IDs
RATE_LIMIT_WHITELIST_SHOPS=shop123,shop456

# Block specific IPs
RATE_LIMIT_BLOCKED_IPS=192.168.1.100
```

### 2. Basic Usage

```python
from fastapi import FastAPI, Request
from barber.backend.middleware import (
    rate_limit,
    rate_limit_booking,
    rate_limit_auth,
    rate_limit_api,
    rate_limit_webhook,
)

app = FastAPI()

# Simple rate limit by IP
@app.get("/api/endpoint")
@rate_limit(limit=100, window=60, key_type='ip')
async def endpoint():
    return {"message": "Hello"}

# Booking endpoint with phone number limit
@app.post("/api/appointments")
@rate_limit_booking()
async def create_appointment(phone: str, data: dict):
    return {"message": "Booking created"}

# Authentication endpoint
@app.post("/api/auth/login")
@rate_limit_auth()
async def login(username: str, password: str):
    return {"token": "..."}

# General API endpoint with shop_id limit
@app.get("/api/clients")
@rate_limit_api()
async def list_clients():
    return {"clients": []}

# Webhook endpoint
@app.post("/webhooks/supabase")
@rate_limit_webhook()
async def webhook_handler():
    return {"status": "ok"}
```

## 📦 Available Decorators

### `@rate_limit(limit, window, key_type, ...)`

Generic rate limiting decorator with full customization.

**Parameters:**
- `limit` (int): Maximum number of requests
- `window` (int): Time window in seconds
- `key_type` (str): Type of key (`'ip'`, `'user'`, `'phone'`, `'shop_id'`, `'email'`, `'custom'`)
- `key_func` (Callable, optional): Custom function to extract key
- `key_param` (str, optional): Parameter name to use as key
- `bypass_admin` (bool): Allow admins to bypass (default: True)
- `message` (str, optional): Custom error message

**Example:**
```python
@rate_limit(limit=50, window=60, key_type='shop_id')
async def endpoint():
    pass

# Using a parameter as the key
@rate_limit(limit=10, window=60, key_param='user_id')
async def user_endpoint(user_id: str):
    pass

# Custom key function
def extract_custom_key(request):
    return request.headers.get('X-API-Key')

@rate_limit(limit=100, window=60, key_type='custom', key_func=extract_custom_key)
async def custom_endpoint():
    pass
```

### `@rate_limit_booking(limit=10, window=60, phone_param=None)`

Specifically for booking/appointment operations.

**Uses phone number as key for rate limiting.**

```python
@app.post("/api/appointments")
@rate_limit_booking()
async def create_appointment(phone: str, data: dict):
    return {"created": True}
```

### `@rate_limit_auth(limit=20, window=60, ip_key=True, email_param=None)`

For authentication operations (login, password reset, etc.).

**Parameters:**
- `ip_key` (bool): Use IP as key (True) or email (False)
- `email_param` (str): Email parameter name (if ip_key=False)

```python
# Login limited by IP
@app.post("/api/auth/login")
@rate_limit_auth()
async def login():
    pass

# Password reset limited by email
@app.post("/api/auth/reset-password")
@rate_limit_auth(limit=5, ip_key=False, email_param='email')
async def reset_password(email: str):
    pass
```

### `@rate_limit_api(limit=100, window=60, shop_id_param=None, read_only=True)`

For general API endpoints.

**Parameters:**
- `read_only` (bool): True for read operations (100/min), False for write (50/min)

```python
# Read endpoint
@app.get("/api/clients")
@rate_limit_api()
async def list_clients():
    pass

# Write endpoint
@app.post("/api/clients")
@rate_limit_api(read_only=False)
async def create_client():
    pass
```

### `@rate_limit_webhook(limit=100, window=3600)`

For webhook endpoints (webhook receivers, integrations).

```python
@app.post("/webhooks/supabase")
@rate_limit_webhook()
async def webhook_handler():
    pass
```

### `@rate_limit_sms(limit=10, window=60, phone_param=None)`

For SMS sending.

```python
@app.post("/api/sms/send")
@rate_limit_sms()
async def send_sms(phone: str, message: str):
    pass
```

### `@rate_limit_whatsapp(limit=20, window=60, phone_param=None)`

For WhatsApp messaging.

```python
@app.post("/api/whatsapp/send")
@rate_limit_whatsapp()
async def send_whatsapp(phone: str, message: str):
    pass
```

## 🔧 FastAPI Dependencies

Use FastAPI's dependency injection system:

```python
from fastapi import FastAPI, Depends
from barber.backend.middleware import create_rate_limit_dependency

app = FastAPI()

# Create dependency
rate_limiter = create_rate_limit_dependency(
    limit=100,
    window=60,
    key_type='shop_id'
)

# Use in endpoint
@app.get("/api/clients")
async def list_clients(_=Depends(rate_limiter)):
    return {"clients": []}
```

## 📊 Statistics & Monitoring

### Programmatic Access

```python
from barber.backend.middleware import (
    get_stats_collector,
    print_stats_summary,
    print_top_violators,
)

collector = get_stats_collector()

# Get aggregated stats
stats = collector.get_aggregated_stats()
print(f"Total requests: {stats['total_requests']}")
print(f"Violation rate: {stats['violation_rate']}%")

# Get top violators
violators = collector.get_top_violators(10)
for v in violators:
    print(f"{v['key_value']}: {v['violation_count']} violations")

# Get stats for specific key
key_stats = collector.get_stats('192.168.1.1')
if key_stats:
    print(f"Hits: {key_stats.hits}")
    print(f"Violations: {key_stats.violations}")
```

### CLI Commands

Create a CLI script at `/root/barber/backend/middleware/cli.py`:

```python
#!/usr/bin/env python3
"""
Rate Limiting CLI
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from barber.backend.middleware import (
    get_stats_collector,
    reset_rate_limit,
    env_config,
)


def cmd_summary(args):
    """Print statistics summary"""
    collector = get_stats_collector()
    from barber.backend.middleware.rate_limit_stats import print_stats_summary
    print_stats_summary()


def cmd_top_violators(args):
    """Print top violators"""
    collector = get_stats_collector()
    from barber.backend.middleware.rate_limit_stats import print_top_violators
    print_top_violators(args.limit)


def cmd_stats_key(args):
    """Print stats for specific key"""
    collector = get_stats_collector()
    from barber.backend.middleware.rate_limit_stats import print_stats_for_key
    print_stats_for_key(args.key)


def cmd_reset(args):
    """Reset rate limit for a key"""
    reset_rate_limit(args.key_type, args.key_value)
    print(f"Rate limit reset for {args.key_type}:{args.key_value}")


def cmd_config(args):
    """Print current configuration"""
    print("\nRate Limiting Configuration:")
    print("=" * 50)
    print(f"Enabled: {env_config.is_enabled()}")
    print(f"Mode: {env_config.mode}")
    print(f"Multiplier: {env_config.limit_multiplier}")
    print(f"Admin Bypass: {env_config.admin_bypass}")
    print(f"Whitelisted IPs: {len(env_config.whitelist_ips)}")
    print(f"Whitelisted Shops: {len(env_config.whitelist_shops)}")
    print(f"Blocked IPs: {len(env_config.blocked_ips)}")
    print()


def cmd_clear_stats(args):
    """Clear statistics"""
    collector = get_stats_collector()
    
    if args.key:
        count = collector.clear_stats(args.key)
        print(f"Cleared stats for key: {args.key}")
    else:
        count = collector.clear_stats()
        print(f"Cleared all statistics ({count} keys)")


def main():
    parser = argparse.ArgumentParser(
        description='BarberZap Rate Limiting CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Summary command
    summary_parser = subparsers.add_parser('summary', help='Print statistics summary')
    summary_parser.set_defaults(func=cmd_summary)
    
    # Top violators command
    top_parser = subparsers.add_parser('top', help='Print top violators')
    top_parser.add_argument('--limit', type=int, default=10, help='Number of violators to show')
    top_parser.set_defaults(func=cmd_top_violators)
    
    # Stats for key command
    stats_parser = subparsers.add_parser('stats', help='Print stats for specific key')
    stats_parser.add_argument('key', help='Key value to look up')
    stats_parser.set_defaults(func=cmd_stats_key)
    
    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset rate limit for a key')
    reset_parser.add_argument('key_type', help='Type of key (ip, user, phone, shop_id, email)')
    reset_parser.add_argument('key_value', help='Value of the key')
    reset_parser.set_defaults(func=cmd_reset)
    
    # Config command
    config_parser = subparsers.add_parser('config', help='Print current configuration')
    config_parser.set_defaults(func=cmd_config)
    
    # Clear stats command
    clear_parser = subparsers.add_parser('clear', help='Clear statistics')
    clear_parser.add_argument('--key', help='Specific key to clear (clears all if not specified)')
    clear_parser.set_defaults(func=cmd_clear_stats)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return 1
    
    args.func(args)
    return 0


if __name__ == '__main__':
    sys.exit(main())
```

Make it executable:
```bash
chmod +x /root/barber/backend/middleware/cli.py
```

Usage examples:
```bash
# Show statistics summary
python /root/barber/backend/middleware/cli.py summary

# Show top 20 violators
python /root/barber/backend/middleware/cli.py top --limit 20

# Show stats for specific IP
python /root/barber/backend/middleware/cli.py stats 192.168.1.1

# Reset rate limit for an IP
python /root/barber/backend/middleware/cli.py reset ip 192.168.1.1

# Show current configuration
python /root/barber/backend/middleware/cli.py config

# Clear all statistics
python /root/barber/backend/middleware/cli.py clear
```

## 🎯 Predefined Rate Limits

| Endpoint Type | Limit | Window | Key Type |
|--------------|-------|--------|----------|
| Webhooks | 100/hour | 3600s | IP |
| Booking (create) | 10/min | 60s | Phone |
| Booking (cancel) | 5/min | 60s | Shop ID |
| API (read) | 100/min | 60s | Shop ID |
| API (write) | 50/min | 60s | Shop ID |
| Auth (login) | 20/min | 60s | IP |
| Password reset | 5/min | 60s | Email |
| SMS | 10/min | 60s | Phone |
| WhatsApp | 20/min | 60s | Phone |
| Admin | 1000/min | 60s | User |

## 🔑 Key Types

### IP-based
Limits requests by IP address. Handles X-Forwarded-For and X-Real-IP headers for proxies.

```python
@rate_limit(limit=100, window=60, key_type='ip')
async def endpoint():
    pass
```

### User-based
Limits by authenticated user ID.

```python
@rate_limit(limit=100, window=60, key_type='user')
async def endpoint():
    pass
```

### Phone-based
Limits by phone number (good for bookings, SMS, WhatsApp).

```python
@rate_limit(limit=10, window=60, key_type='phone')
async def create_booking(phone: str):
    pass
```

### Shop ID-based
Limits by shop/tenant ID (good for multi-tenant applications).

```python
@rate_limit(limit=100, window=60, key_type='shop_id')
async def list_clients(shop_id: str):
    pass
```

### Email-based
Limits by email address (good for auth, password reset).

```python
@rate_limit(limit=5, window=60, key_type='email')
async def reset_password(email: str):
    pass
```

### Custom
Use any custom key function.

```python
def extract_api_key(request):
    return request.headers.get('X-API-Key')

@rate_limit(limit=100, window=60, key_type='custom', key_func=extract_api_key)
async def api_endpoint():
    pass
```

## ⚙️ Advanced Configuration

### Custom Endpoint Rules

```python
from barber.backend.middleware import (
    RateLimitMapping,
    RateLimitRule,
)

# Add custom rule for an endpoint
Rule = RateLimitRule(
    limit=200,
    window=60,
    key_type='shop_id',
    message="Custom limit exceeded"
)

RateLimitMapping.add_rule('GET', '/api/custom', Rule)
```

### Custom Limits per Environment

```python
# production .env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=strict
RATE_LIMIT_MULTIPLIER=1.0

# development .env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MODE=lenient
RATE_LIMIT_MULTIPLIER=10.0  # 10x limits for dev

# testing .env
RATE_LIMIT_ENABLED=false
```

### Key Extraction

```python
from barber.backend.middleware import RateLimitKeyFunc

# Manual key extraction
request = ...  # FastAPI Request object

ip = RateLimitKeyFunc.extract_ip(request)
shop_id = RateLimitKeyFunc.extract_shop_id(request)
user_id = RateLimitKeyFunc.extract_user_id(request)
phone = RateLimitKeyFunc.extract_phone(request)
email = RateLimitKeyFunc.extract_email(request)

# Hash keys for privacy
hashed = RateLimitKeyFunc.hash_key('user@example.com')
```

## 🔒 Error Handling

### Rate Limit Exceeded Exception

```python
from barber.backend.middleware import RateLimitExceeded

try:
    # Your code
    pass
except RateLimitExceeded as e:
    print(f"Error: {e.message}")
    print(f"Retry after: {e.retry_after} seconds")
    print(f"Limit: {e.limit} per {e.window} seconds")
    print(f"Current: {e.current}")
    
    # Convert to dict for API response
    error_dict = e.to_dict()
```

### Custom Error Responses

```python
from fastapi import FastAPI, HTTPException, status
from barber.backend.middleware import RateLimitExceeded, rate_limit

app = FastAPI()

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "rate_limit_exceeded",
            "message": exc.message,
            "retry_after": exc.retry_after,
        },
        headers={
            "Retry-After": str(exc.retry_after),
            "X-RateLimit-Limit": str(exc.limit),
            "X-RateLimit-Remaining": "0",
        }
    )
```

## 📈 Monitoring Dashboard

### Prometheus Metrics Integration

```python
from prometheus_client import Counter, Gauge, Histogram

# Create metrics
rate_limit_hits = Counter('rate_limit_hits', 'Total hits', ['key_type'])
rate_limit_violations = Counter('rate_limit_violations', 'Total violations', ['key_type'])
rate_limit_current = Gauge('rate_limit_current', 'Current request count', ['key_type', 'key_value'])

# Update metrics in your code
rate_limit_hits.labels(key_type='ip').inc()
rate_limit_violations.labels(key_type='ip').inc()
rate_limit_current.labels(key_type='ip', key_value='192.168.1.1').set(current_count)
```

### Grafana Dashboard

Example Grafana queries:

```promql
# Violation rate per minute
rate(rate_limit_violations[1m])

# Hits vs violations by key type
sum by (key_type) (rate_limit_hits)
sum by (key_type) (rate_limit_violations)

# Top violators
topk(10, rate_limit_current)
```

## 🧪 Testing

```python
import pytest
from barber.backend.middleware import (
    get_rate_limiter,
    reset_rate_limit,
)

def test_rate_limit():
    limiter = get_rate_limiter()
    
    # Reset any previous limits
    reset_rate_limit('ip', '127.0.0.1')
    
    # Make 5 requests (limit is 10)
    for i in range(5):
        result = limiter.check('ip', '127.0.0.1', 10, 60)
        assert result['allowed'] is True
    
    # Get current usage
    usage = limiter.get_current_usage('ip', '127.0.0.1', 10, 60)
    assert usage['count'] == 5
    assert usage['remaining'] == 5
```

## 💡 Best Practices

1. **Use appropriate key types**:
   - IP-based for unauthenticated endpoints
   - User/shop_id-based for authenticated endpoints
   - Phone/email-based for sensitive operations

2. **Set reasonable limits**:
   - Consider expected traffic patterns
   - Use environment multipliers for dev/staging
   - Monitor and adjust based on real usage

3. **Handle errors gracefully**:
   - Return clear error messages
   - Include Retry-After headers
   - Log violations for analysis

4. **Monitor statistics**:
   - Track violation rates
   - Identify top violators
   - Adjust limits as needed

5. **Use admin bypass**:
   - Allow admins to exceed limits
   - Essential for maintenance operations
   - Disable for security-critical endpoints

## 🐛 Troubleshooting

### Rate limits not working

```bash
# Check if enabled
python /root/barber/backend/middleware/cli.py config

# Check Redis connection
redis-cli ping
```

### All requests being blocked

- Check if your IP is in `RATE_LIMIT_BLOCKED_IPS`
- Verify `RATE_LIMIT_MODE` is not set to `strict` when Redis is down
- Check if whitelist/blacklist is configured correctly

### Statistics not showing

- Wait up to 24h (TTL) or clear stats manually
- Verify Redis connection
- Check if `redis_ttl` is configured

## 📚 API Reference

### RateLimiter Class

```python
class RateLimiter:
    def check_rate_limit(
        key_type: str,
        key_value: str,
        limit: int,
        window: int,
        admin_bypass: bool = False
    ) -> Dict[str, Any]:
        """Check if rate limit is exceeded"""
        
    def reset(key_type: str, key_value: str) -> bool:
        """Reset rate limit for a key"""
        
    def get_stats(key_type: str, key_value: str) -> Optional[Dict]:
        """Get statistics for a key"""
        
    def get_current_usage(
        key_type: str,
        key_value: str,
        limit: int,
        window: int
    ) -> Dict[str, Any]:
        """Get current usage without incrementing"""
```

### RateLimitStatsCollector Class

```python
class RateLimitStatsCollector:
    def get_stats(key_value: str) -> Optional[RateLimitStats]:
        """Get statistics for a key"""
        
    def get_top_violators(limit: int = 10) -> List[Dict]:
        """Get top violators"""
        
    def get_aggregated_stats() -> Dict[str, Any]:
        """Get aggregated statistics"""
        
    def clear_stats(key_value: Optional[str] = None) -> int:
        """Clear statistics"""
```

## 📝 License

Part of BarberZap project.
