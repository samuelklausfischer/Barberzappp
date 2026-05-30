# Supabase Webhook Cache Invalidation System

Automatic cache invalidation for BarberZap using Supabase PostgreSQL webhooks and Redis.

## Overview

This system receives webhook events from Supabase PostgreSQL triggers and automatically invalidates the relevant Redis cache entries. This ensures cache consistency across the application without manual cache flushing.

## Architecture

```
Supabase (PostgreSQL Trigger)
    ↓
Webhook Event
    ↓
Webhook Endpoint (FastAPI/Flask)
    ↓
Signature Validation
    ↓
Event Parsing
    ↓
Cache Pattern Mapping
    ↓
Redis Cache Invalidation
    ↓
[Optional] Retry Queue (on failure)
```

## Components

### 1. supabase_webhook.py

Core webhook handling with signature validation.

**Classes:**
- `WebhookEvent`: Represents a database event (INSERT/UPDATE/DELETE)
- `SupabaseWebhook`: Validates webhook signatures and parses payloads

**Features:**
- HMAC-SHA256 signature verification
- Event type validation
- Field extraction helpers

### 2. invalidator.py

Maps Supabase events to cache patterns and performs invalidation.

**Functions:**
- `map_supabase_event_to_cache_patterns()`: Maps events to Redis keys
- `invalidate_patterns()`: Invalidates multiple patterns
- `invalidate_tenant()`: Invalidates all cache for a shop
- `invalidate_appointment_date()`: Invalidates appointments by date
- `invalidate_client()`: Invalidates client data and stats

**Supported Events:**

| Event Type | Table | Cache Patterns |
|------------|-------|----------------|
| INSERT | appointments | `appointments:{shop_id}:{date}`, `tenant:{shop_id}` |
| UPDATE | appointments | `appointments:{shop_id}:{date}`, `client:stats:{client_id}` (if status changed) |
|DELETE | appointments | `appointments:{shop_id}:{date}`, `tenant:{shop_id}` |
| INSERT/UPDATE | clients | `client:{client_id}`, `tenant:{shop_id}` |
| INSERT/UPDATE | services | `services:{shop_id}`, `tenant:{shop_id}` |
| INSERT/UPDATE | employees | `tenant:{shop_id}` |

### 3. webhook_handler.py

FastAPI/Flask route handlers for webhook endpoints.

**Classes:**
- `WebhookHandler`: Main async handler with retry support

**Endpoints:**
- `POST /webhooks/supabase/{signature}` - Webhook with signature in URL
- `POST /webhooks/supabase` - Webhook with signature in header
- `GET /webhooks/supabase/health` - Health check

**Response Codes:**
- `200`: Webhook processed successfully
- `202`: Webhook accepted (async processing)
- `400`: Invalid payload
- `401`: Signature verification failed
- `500`: Internal server error

### 4. retry_queue.py

Redis-based retry queue with exponential backoff.

**Classes:**
- `WebhookRetryQueue`: Persistent retry queue using Redis
- `RetryWorker`: Background worker that processes failed webhooks

**Features:**
- Exponential backoff (1s, 2s, 4s, max 30s)
- 3 retry attempts by default
- Dead letter queue (DLQ) for permanent failures
- Job metrics and monitoring

### 5. webhook_cli.py

Command-line interface for managing webhooks.

## Installation

### Prerequisites

```bash
pip install redis fastapi[all] click
```

### Environment Variables

```bash
# Redis connection
export REDIS_URL="redis://localhost:6379/0"

# Supabase webhook secret (for signature validation)
export SUPABASE_WEBHOOK_SECRET="your-secret-here"

# Logging
export LOG_LEVEL="INFO"
```

## Integration Guide

### FastAPI Integration

```python
from fastapi import FastAPI
from barber.webhooks import create_supabase_webhook_router

app = FastAPI()

# Add webhook routes
webhook_router = create_supabase_webhook_router(
    require_signature=True  # Enforce signature validation
)
app.include_router(webhook_router)

# Webhook will be available at:
# - POST /webhooks/supabase/{signature}
# - POST /webhooks/supabase
# - GET /webhooks/supabase/health
```

### Manual Integration

```python
from fastapi import FastAPI, Request, Response
from barber.webhooks import create_webhook_handler

app = FastAPI()
handler = create_webhook_handler(require_signature=True)

@app.post("/webhooks/supabase/{signature}")
async def supabase_webhook(signature: str, request: Request):
    payload = await request.body()
    headers = dict(request.headers)
    
    result = await handler.handle_webhook(
        payload=payload.decode(),
        headers=headers,
        signature_header=f"sha256={signature}"
    )
    
    return Response(
        content=json.dumps(result),
        status_code=result['status_code'],
        media_type="application/json"
    )
```

### Starting the Retry Worker

```python
import asyncio
from barber.webhooks import create_retry_queue, create_retry_worker, create_webhook_handler

async def main():
    # Create components
    handler = create_webhook_handler()
    queue = create_retry_queue()
    worker = create_retry_worker(queue, handler, poll_interval=5.0)
    
    # Start worker
    await worker.start()
    
    try:
        # Keep running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await worker.stop()

asyncio.run(main())
```

## Supabase Setup

### 1. Create Database Function for Webhook Payload

```sql
CREATE OR REPLACE FUNCTION supabase_webhook_event()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://your-api.com/webhooks/supabase/' || pg_temp.encode(
            pg_temp.hmac(
                pg_temp.convert_to(row_to_json(NEW)::text, 'UTF8'),
                current_setting('app.webhook_secret'),
                'sha256'
            ),
            'hex'
        ),
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := row_to_json(NEW)::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Create Triggers

```sql
-- Appointments trigger
CREATE TRIGGER appointments_webhook
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW EXECUTE FUNCTION supabase_webhook_event();

-- Clients trigger
CREATE TRIGGER clients_webhook
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION supabase_webhook_event();

-- Services trigger
CREATE TRIGGER services_webhook
AFTER INSERT OR UPDATE OR DELETE ON services
FOR EACH ROW EXECUTE FUNCTION supabase_webhook_event();

-- Employees trigger
CREATE TRIGGER employees_webhook
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION supabase_webhook_event();
```

### 3. Alternative: Use Supabase Webhooks Feature

Alternatively, use Supabase's native webhook feature:

1. Go to Supabase Dashboard > Database > Extensions
2. Enable `pg_net` extension
3. Configure webhook in project settings

## CLI Commands

### Cache Management

```bash
# Invalidate cache for a specific shop
python -m barber.webhooks cache invalidate --shop-id shop123

# Invalidate cache for a client
python -m barber.webhooks cache invalidate --client-id client456

# Invalidate by pattern
python -m barber.webhooks cache invalidate --pattern "tenant:*"

# Flush all cache
python -m barber.webhooks cache invalidate --all

# Get cache status
python -m barber.webhooks cache status
```

### Webhook Management

```bash
# Simulate a webhook for testing
python -m barber.webhooks webhook simulate --payload webhook.json --dry-run

# Show webhook statistics
python -m barber.webhooks webhook stats
```

### Retry Queue Management

```bash
# List failed webhook jobs
python -m barber.webhooks queue list --limit 20

# Retry a specific failed job
python -m barber.webhooks queue retry --job-id webhook_1234567890

# Clear dead letter queue
python -m barber.webhooks queue flush --confirm
```

### Worker Management

```bash
# Start retry worker daemon
python -m barber.webhooks worker --poll-interval 5
```

### Diagnostics

```bash
# Test system connectivity
python -m barber.webhooks test

# Check environment configuration
python -m barber.webhooks check
```

## Testing

### Create Test Payload

```json
// webhook.json
{
  "type": "INSERT",
  "table": "appointments",
  "record": {
    "id": "apt_123",
    "shop_id": "shop456",
    "client_id": "client789",
    "scheduled_at": "2026-03-04T10:00:00Z",
    "status": "confirmed"
  },
  "old_record": null,
  "schema": "public",
  "trigger": "appointments_webhook"
}
```

### Test Webhook Processing

```bash
# Validate payload
python -m barber.webhooks webhook simulate --payload webhook.json --dry-run

# Process webhook (will invalidate cache)
python -m barber.webhooks webhook simulate --payload webhook.json
```

### Manual CURL Test

```bash
# Generate signature
echo -n '{"type":"INSERT","table":"appointments","record":{...}}' | \
  openssl dgst -sha256 -hmac "your-secret-hex" | \
  awk '{print $2}'

# Test webhook
curl -X POST https://your-api.com/webhooks/supabase/$SIGNATURE \
  -H "Content-Type: application/json" \
  -d @webhook.json
```

## Monitoring

### Log Levels

```python
import logging

logging.getLogger('barber.webhooks').setLevel(logging.DEBUG)
```

### Metrics Available

- Jobs created/retried/completed/failed
- Pending jobs in queue
- Dead letter queue count
- Cache invalidation stats
- Webhook processing latency

### Health Checks

```bash
# Webhook health endpoint
curl https://your-api.com/webhooks/supabase/health

# Response:
{
  "status": "healthy",
  "service": "supabase-webhook",
  "timestamp": "2026-03-04T12:00:00Z"
}
```

## Troubleshooting

### Common Issues

**1. Invalid Signature Errors**
- Verify `SUPABASE_WEBHOOK_SECRET` matches between Supabase and your app
- Check signature header format (should be `sha256=<hex>`)

**2. Cache Not Invalidating**
- Check webhook logs for event type and table mapping
- Verify cache key patterns match your cache schema
- Run `webhook simulate --dry-run` to see patterns

**3. High Retry Queue Count**
- Check Redis connectivity
- Increase worker poll interval
- Review webhook payload for validation errors
- Check DLQ with `webhook queue list`

**4. Worker Not Processing**
- Verify worker is running: `ps aux | grep webhook_worker`
- Check Redis connection
- Review worker logs

## Performance

### Best Practices

1. **Async Processing**: Webhook handler processes invalidation asynchronously
2. **Connection Pooling**: Redis connection pool is reused
3. **Batch Operations**: Multiple patterns invalidated in batches
4. **Efficient Scanning**: Uses `SCAN` instead of `KEYS` in production

### Performance Tips

```python
# Batch invalidations
from barber.webhooks import invalidate_pattern_batch

patterns = [
    'tenant:shop123:*',
    'services:shop123',
    'appointments:shop123:*'
]
invalidate_pattern_batch(patterns)

# Use specific dates instead of wildcards when possible
invalidate_appointment_date('shop123', '2026-03-04')
```

## Security

### Recommendations

1. **Always validate signatures** in production
2. **Use HTTPS** for webhook endpoints
3. **Rotate webhook secrets** regularly
4. **Monitor unauthorized attempts**
5. **Rate limit webhook endpoints**

```bash
# Set strong secret
export SUPABASE_WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

## API Reference

### WebhookEvent

```python
class WebhookEvent:
    event_type: WebhookEventType      # INSERT, UPDATE, DELETE
    table: str                        # Table name
    record: WebhookRecord            # Current record
    old_record: Optional[WebhookRecord]  # Previous record
    schema: str                       # Schema name (default: public)
```

### Helper Methods

```python
# Get record ID
event.get_id()

# Get shop_id
event.get_shop_id()

# Get client_id
event.get_client_id()

# Get scheduled date
event.get_scheduled_date()

# Check if status changed
event.has_status_changed()

# Convert to dict
event.to_dict()
```

## License

MIT

## Support

For issues or questions:
- Check logs: `tail -f /var/log/barber/webhooks.log`
- Run diagnostics: `python -m barber.webhooks test`
- Review documentation above
