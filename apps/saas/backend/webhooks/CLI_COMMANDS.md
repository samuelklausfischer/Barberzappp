# Webhook CLI Commands

Quick reference for managing BarberZap webhooks from the command line.

## Installation

Make sure you have the required dependencies:

```bash
cd /root/barber/backend
pip install click fastapi[all]
```

## Environment Setup

```bash
export REDIS_URL="redis://localhost:6379/0"
export SUPABASE_WEBHOOK_SECRET="your-secret-here"
export LOG_LEVEL="INFO"
```

---

## Cache Commands

### Invalidate Cache

```bash
# Invalidate all cache for a specific shop
python -m barber.webhooks cache invalidate --shop-id shop123

# Invalidate cache for a specific client
python -m barber.webhooks cache invalidate --client-id client456

# Invalidate by custom pattern
python -m barber.webhooks cache invalidate --pattern "tenant:*"

# Flush all cache (use with caution!)
python -m barber.webhooks cache invalidate --all
```

### Get Cache Status

```bash
python -m barber.webhooks cache status
```

**Output:**
```
Cache Status
━━━━━━━━━━━━
Status: healthy
Redis:
  Connected: True
  Memory Used: 1.23 MB
  Total Keys: 156
  Connected Clients: 3

Metrics:
  Hits: 1234
  Misses: 56
  Errors: 2
  Hit Rate: 95.65%
  Avg Latency: 2.34 ms
  Uptime: 7200 seconds
```

---

## Webhook Commands

### Simulate Webhook Test

```bash
# Validate webhook payload without processing
python -m barber.webhooks webhook simulate \
  --payload example_webhooks/appointments_insert.json \
  --dry-run

# Process webhook (actually invalidates cache)
python -m barber.webhooks webhook simulate \
  --payload example_webhooks/appointments_update.json
```

### Get Webhook Statistics

```bash
python -m barber.webhooks webhook stats
```

**Output:**
```
Webhook Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jobs Created: 45
Jobs Retried: 12
Jobs Completed: 38
Jobs Failed: 3
Pending Jobs: 2
Dead Letter Queue: 1
```

---

## Retry Queue Commands

### List Failed Jobs

```bash
# List last 20 failed jobs
python -m barber.webhooks queue list

# List up to 100 failed jobs
python -m barber.webhooks queue list --limit 100

# Filter by status (not yet implemented)
python -m barber.webhooks queue list --status dead
```

**Output:**
```
Dead Letter Queue (3 jobs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job: webhook_1234567890
  Status: dead
  Attempts: 3/3
  Error: Connection timeout
  Last Error: Failed to connect to Redis
  Created: 2026-03-04 10:30:00

Job: webhook_0987654321
  Status: dead
  Attempts: 3/3
  Error: Invalid payload
  Last Error: Missing required field: type
  Created: 2026-03-04 11:15:00
```

### Retry Failed Job

```bash
python -m barber.webhooks queue retry --job-id webhook_1234567890
```

**Output:**
```
✓ Job webhook_1234567890 requeued successfully
```

### Clear Dead Letter Queue

```bash
# Clear DLQ (requires confirmation)
python -m barber.webhooks queue flush --confirm
```

**Output:**
```
⚠ Cleared 3 jobs from DLQ
```

---

## Worker Commands

### Start Retry Worker

```bash
# Start worker with default 5 second poll interval
python -m barber.webhooks worker

# Start worker with custom poll interval
python -m barber.webhooks worker --poll-interval 10
```

**Output:**
```
Starting retry worker (interval: 5.0s)
```

**Stop:** Press `Ctrl+C` to gracefully stop the worker.

---

## Diagnostics Commands

### Test System Connectivity

```bash
python -m barber.webhooks test
```

**Output:**
```
Testing webhook system...
✓ Cache connection OK
✓ Retry queue initialized
✓ Signature validation OK

System test complete
```

### Check Environment Configuration

```bash
python -m barber.webhooks check
```

**Output:**
```
Environment Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━
REDIS_URL: redis://localhost:6379/0
SUPABASE_WEBHOOK_SECRET: abc1234567...
LOG_LEVEL: INFO

Module Status
━━━━━━━━━━━━━━━━━━━━
Retry Queue: Available
Redis Library: Available
```

---

## Running Interactive Demo

```bash
# Run all demos interactively
python -m barber.webhooks test_webhook_demo.py

# Run specific demo
python -m barber.webhooks test_webhook_demo.py --demo basic
python -m barber.webhooks test_webhook_demo.py --demo signature
python -m barber.webhooks test_webhook_demo.py --demo patterns
python -m barber.webhooks test_webhook_demo.py --demo handler
python -m barber.webhooks test_webhook_demo.py --demo all
```

---

## Testing with CURL

### Generate Signature

```bash
# Using openssl
SECRET="your-webhook-secret"
PAYLOAD=$(cat example_webhooks/appointments_insert.json)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print "sha256="$2}')
echo "Signature: $SIGNATURE"
```

### Test Webhook Endpoint

```bash
# Test webhook with signature in URL
curl -X POST http://localhost:8000/webhooks/supabase/$SIGNATURE \
  -H "Content-Type: application/json" \
  -d @example_webhooks/appointments_insert.json

# Test webhook with signature in header
curl -X POST http://localhost:8000/webhooks/supabase \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -d @example_webhooks/appointments_insert.json
```

### Health Check

```bash
curl http://localhost:8000/webhooks/supabase/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "supabase-webhook",
  "timestamp": "2026-03-04T12:00:00Z"
}
```

---

## Common Workflows

### 1. Check Cache Status and Invalidate

```bash
# 1. Check cache status
python -m barber.webhooks cache status

# 2. Invalidate cache for a specific shop
python -m barber.webhooks cache invalidate --shop-id shop123

# 3. Verify invalidation
python -m barber.webhooks cache status
```

### 2. Monitor and Debug Webhooks

```bash
# 1. Check webhook statistics
python -m barber.webhooks webhook stats

# 2. List failed webhooks
python -m barber.webhooks queue list

# 3. Check environment
python -m barber.webhooks check

# 4. Test system connectivity
python -m barber.webhooks test
```

### 3. Debug Specific Webhook

```bash
# 1. Simulate webhook in dry-run mode
python -m barber.webhooks webhook simulate \
  --payload example_webhooks/appointments_update.json \
  --dry-run

# 2. If patterns look correct, process it
python -m barber.webhooks webhook simulate \
  --payload example_webhooks/appointments_update.json

# 3. Check cache to verify invalidation
python -m barber.webhooks cache status
```

### 4. Manage Failed Webhooks

```bash
# 1. List all failed webhooks
python -m barber.webhooks queue list

# 2. Check logs for specific job details
# (view Redis directly or check application logs)

# 3. Fix the underlying issue (configuration, connection, etc.)

# 4. Retry the specific job
python -m barber.webhooks queue retry --job-id webhook_1234567890

# 5. Monitor the retry
python -m barber.webhooks queue list
```

---

## Troubleshooting

### Webhook Not Processing

```bash
# 1. Check Redis connection
python -m barber.webhooks test

# 2. Verify webhook secret matches
python -m barber.webhooks check

# 3. Test webhook with dry-run
python -m barber.webhooks webhook simulate --payload payload.json --dry-run

# 4. Check logs for errors
tail -f /var/log/barber/webhooks.log
```

### High Retry Queue Count

```bash
# 1. Check queue stats
python -m barber.webhooks webhook stats

# 2. List failed jobs
python -m barber.webhooks queue list

# 3. Check common errors in the list

# 4. Clear DLQ if needed (after fixing root cause)
python -m barber.webhooks queue flush --confirm
```

### Cache Not Invalidating

```bash
# 1. Verify cache is connected
python -m barber.webhooks cache status

# 2. Test invalidation manually
python -m barber.webhooks cache invalidate --pattern "tenant:*"

# 3. Simulate webhook to check patterns
python -m barber.webhooks webhook simulate --payload payload.json
```

---

## Integration with Production

### Systemd Service for Worker

Create `/etc/systemd/system/barber-webhook-worker.service`:

```ini
[Unit]
Description=BarberZap Webhook Retry Worker
After=network.target redis.service

[Service]
Type=simple
User=barber
WorkingDirectory=/root/barber/backend
Environment="PYTHONPATH=/root/barber/backend"
Environment="REDIS_URL=redis://localhost:6379/0"
Environment="SUPABASE_WEBHOOK_SECRET={{WEBHOOK_SECRET}}"
Environment="LOG_LEVEL=INFO"
ExecStart=/usr/bin/python3 -m barber.webhooks worker --poll-interval 5
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable barber-webhook-worker
sudo systemctl start barber-webhook-worker

# Check status
sudo systemctl status barber-webhook-worker

# View logs
sudo journalctl -u barber-webhook-worker -f
```

### Docker Compose for Webhook Service

```yaml
version: '3.8'

services:
  webhook:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379/0
      - SUPABASE_WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - LOG_LEVEL=INFO
    depends_on:
      - redis
    restart: unless-stopped

  webhook-worker:
    build: .
    command: python -m barber.webhooks worker --poll-interval 5
    environment:
      - REDIS_URL=redis://redis:6379/0
      - SUPABASE_WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - LOG_LEVEL=INFO
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

## Summary of All Commands

```bash
# Cache Management
python -m barber.webhooks cache invalidate --shop-id <id>
python -m barber.webhooks cache invalidate --client-id <id>
python -m barber.webhooks cache invalidate --pattern <pattern>
python -m barber.webhooks cache invalidate --all
python -m barber.webhooks cache status

# Webhook Management
python -m barber.webhooks webhook simulate --payload <file> [--dry-run]
python -m barber.webhooks webhook stats

# Retry Queue Management
python -m barber.webhooks queue list [--limit N]
python -m barber.webhooks queue retry --job-id <id>
python -m barber.webhooks queue flush --confirm

# Worker Management
python -m barber.webhooks worker [--poll-interval N]

# Diagnostics
python -m barber.webhooks test
python -m barber.webhooks check
```

For more information, see the main `README.md` file.
