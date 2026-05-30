# BarberZap - Data Cleanup System

Complete data cleanup solution for managing temporary and expired data in the BarberZap system. Automatically removes expired magic links, verification codes, session tokens, cache entries, and other temporary data to maintain database performance.

## Overview

The Data Cleanup System provides automated, safe, and auditable cleanup of temporary data that accumulates over time.

### Features

- **Automated Cleanup**: Scheduled jobs remove expired data automatically
- **Safe Operations**: Safety checks prevent accidental deletion of production data
- **Audit Trail**: Complete logging of all cleanup operations
- **Health Monitoring**: Real-time alerts for cleanup issues
- **Manual Control**: Admin API and CLI for manual intervention
- **Batch Processing**: Configurable batch sizes for large deletions
- **Dry Run Mode**: Preview operations without making changes
- **Progress Tracking**: Real-time progress updates for large operations

## Components

### Database Tables

| Table | Purpose | Default TTL |
|-------|---------|-------------|
| `magic_links` | Authentication magic links | 24 hours |
| `verification_codes` | SMS/Email verification codes | 1 hour |
| `notifications` | User notifications | 7 days (after read) |
| `activity_logs` | System activity logs | Dedupliation (within 1m) |
| `client_session_tokens` | Client session tokens | 7 days |
| `password_reset_tokens` | Password reset tokens | 1 hour |
| `cache_entries` | Temporary cache | 7 days (no access) |

### Audit Tables

| Table | Purpose |
|-------|---------|
| `cleanup_runs_log` | Individual cleanup operation logs |
| `cleanup_history` | Aggregated stats per table/date |
| `cleanup_stats_cache` | Cached statistics for dashboard |
| `cleanup_safety_log` | Safety check logs |
| `cleanup_alert_log` | Alert history |

## Installation

### 1. Database Setup

Run the SQL scripts in order (database directory):

```bash
# 1. Create cleanup tables with constraints
psql -h localhost -U postgres -d barberzap \
  -f database/22_cleanup_tables.sql

# 2. Create cleanup procedures
psql -h localhost -U postgres -d barberzap \
  -f database/23_cleanup_procedures.sql

# 3. Create audit tables
psql -h localhost -U postgres -d barberzap \
  -f database/24_cleanup_audit.sql

# 4. Add constraints and scheduling support
psql -h localhost -U postgres -d barberzap \
  -f database/25_cleanup_constraints.sql
```

### 2. Backend Setup

```bash
cd /root/barber/backend/cleanup

# Install dependencies
pip install bullmq click tabulate

# Make CLI executable
chmod +x cleanup_cli.py
```

### 3. Environment Variables

Ensure these are set in your `.env`:

```env
# Redis for BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Cleanup settings
CLEANUP_BATCH_SIZE=1000
CLEANUP_MAX_RETRIES=3
```

### 4. Worker Setup

```bash
# Start cleanup worker (runs in background)
python backend/cleanup/cleanup_cli.py  # Will spawn worker

# Or using pm2/gunicorn (production)
pm2 start backend/cleanup/cleanup_job.py \
  --name cleanup-worker \
  --interpreter python3
```

## Usage

### CLI Commands

#### Show Statistics

```bash
# Show all table stats
python backend/cleanup/cleanup_cli.py stats

# Show stats for specific table
python backend/cleanup/cleanup_cli.py stats-table magic_links

# Show history
python backend/cleanup/cleanup_cli.py history --limit 50
```

#### Run Cleanup

```bash
# Run all cleanups in dry-run mode (preview)
python backend/cleanup/cleanup_cli.py run --dry-run

# Run all cleanups (actual deletion)
python backend/cleanup/cleanup_cli.py run

# Run specific cleanup job
python backend/cleanup/cleanup_cli.py run-job cleanup_magic_links --dry-run

# Run with custom retention periods
python backend/cleanup/cleanup_cli.py run \
  --magic-links-hours 12 \
  --notifications-days 14
```

#### Force Delete (Dangerous!)

```bash
# Force delete all records from a table (requires confirmation)
python backend/cleanup/cleanup_cli.py force magic_links

# Skip confirmation flag
python backend/cleanup/cleanup_cli.py force magic_links --confirm
```

#### Schedule Management

```bash
# Set cleanup schedule
python backend/cleanup/cleanup_cli.py schedule cleanup_magic_links daily

# Disable schedule
python backend/cleanup/cleanup_cli.py schedule cleanup_magic_links daily --disabled
```

#### Alerts

```bash
# View active alerts
python backend/cleanup/cleanup_cli.py alerts
```

### API Endpoints

Base URL: `/api/cleanup`

All endpoints require admin authorization (Bearer token).

#### Get Statistics

```bash
# Get all table stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/cleanup/stats

# Get specific table stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/cleanup/stats/magic_links
```

#### Run Cleanup

```bash
# Run all cleanups (dry run)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}' \
  http://localhost:8000/api/cleanup/run-all

# Run specific cleanup job
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false, "hours_ago": 24}' \
  http://localhost:8000/api/cleanup/jobs/cleanup_magic_links
```

#### View History

```bash
# Get cleanup history
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/cleanup/history?limit=50&table_name=magic_links"
```

#### Alerts

```bash
# Get active alerts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/cleanup/alerts

# Acknowledge alert
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/cleanup/alerts/{alert_id}/acknowledge?performed_by=admin"
```

#### Health Check

```bash
# System health check
curl http://localhost:8000/api/cleanup/health
```

### React Component

```tsx
import { CleanupDashboard } from '@/components/CleanupDashboard';

// In your admin page
<CleanupDashboard shopId="xxx-xxx-xxx" adminOnly={true} />
```

The dashboard provides:
- Overview of table sizes and pending cleanup
- Trigger cleanup operations with dry-run mode
- Monitor active/archived jobs
- View cleanup history
- Configure cleanup schedules
- Manage alerts
- Force delete with explicit confirmation
- Admin-only access control

## Scheduled Cleanup

### Option 1: pg_cron (PostgreSQL Extension)

```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 3 AM UTC
SELECT cron.schedule(
  'cleanup-all-tables-daily',
  '0 3 * * *',
  $$CALL procedure_cleanup_all_tables(24, 1, 7, 7, 7, 'pg_cron', FALSE);$$
);

-- Schedule cleanup every 6 hours for magic links
SELECT cron.schedule(
  'cleanup-magic-links',
  '0 */6 * * *',
  $$CALL procedure_cleanup_expired_magic_links(24, 'pg_cron', FALSE);$$
);

-- Schedule cleanup hourly for verification codes
SELECT cron.schedule(
  'cleanup-verification-codes',
  '0 * * * *',
  $$CALL procedure_cleanup_expired_codes(1, 'pg_cron', FALSE);$$
);
```

### Option 2: BullMQ Worker

The cleanup job system uses BullMQ for async processing. The worker automatically processes cleanup jobs from the queue.

### Option 3: Application Scheduler

```python
# Using APScheduler or similar
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=3, minute=0)
async def daily_cleanup():
    from backend.cleanup.cleanup_job import CleanupJob
    job = CleanupJob(redis_conn, supabase)
    await job.cleanup_all()

scheduler.start()
```

## Safety Features

### Protected Tables

The following tables are on the protected whitelist and cannot be deleted:
- `clients`
- `services`
- `employees`
- `appointments`
- `working_hours`
- `shops`
- `users`
- `auth_users`

### Safety Checks

1. **Count Threshold**: Warn before deleting > 10,000 records
2. **Size Threshold**: Warn before deleting from tables > 1GB
3. **Protected Tables**: Reject attempts to delete production data
4. **Backup Requirement**: Automatic backup before large deletions (> 1,000 records)
5. **Dry Run Mode**: Preview operations without deletion
6. **Explicit Confirmation**: Require user confirmation for force deletes

### Force Delete

Force delete is available for emergency situations but requires:
1. Explicit "CONFIRM" string confirmation
2. Count verification before deletion
3. Reason documentation
4. Full audit trail logging

**WARNING**: Force delete cannot be undone!

## Monitoring & Alerting

### Health Metrics

The system monitors:
- Last successful cleanup duration
- Cleanup jobs pending count
- Cleanup errors in last 24h
- Data growth rate (MB/day)
- Table sizes
- Cleanup health scores (0-100)

### Alert Types

| Type | Severity | Condition |
|------|----------|-----------|
| `cleanup_failed` | Error | > 3 cleanup errors in 24h |
| `cleanup_stuck` | Critical | No successful cleanup in 48h |
| `table_too_large` | Error | Table size > 10GB |
| `cleanup_too_slow` | Warning | Cleanup duration > 1h |
| `data_accumulating` | Warning | Health score < 50 |
| `no_cleanup_recent` | Warning | No cleanup in 24h |
| `safety_violation` | Critical | Safety check failed |

### Dashboard Alerts

Active alerts are displayed in the Cleanup Dashboard with:
- Severity color coding (critical, error, warning, info)
- Acknowledge action
- Timestamp
- Metric and threshold values

## Configuration

### Environment Variables

```env
# Cleanup thresholds
CLEANUP_COUNT_THRESHOLD=10000
CLEANUP_SIZE_THRESHOLD_MB=1000
CLEANUP_BACKUP_THRESHOLD_COUNT=1000
CLEANUP_BACKUP_THRESHOLD_MB=100

# BullMQ queue
CLEANUP_QUEUE_NAME=cleanup-queue
CLEANUP_JOB_TIMEOUT_MS=7200000  # 2 hours
CLEANUP_MAX_RETRIES=3
CLEANUP_RETRY_DELAY_MS=30000  # 30 seconds
```

### Retention Periods

| Data Type | Default TTL | Configurable |
|-----------|-------------|--------------|
| Magic Links | 24 hours | ✅ `MAGIC_LINKS_TTL_HOURS` |
| Verification Codes | 1 hour | ✅ `VERIFICATION_CODES_TTL_HOURS` |
| Notifications | 7 days | ✅ `NOTIFICATIONS_RETENTION_DAYS` |
| Session Tokens | 7 days | ✅ `SESSION_TOKENS_TTL_DAYS` |
| Reset Tokens | 1 hour | ✅ `RESET_TOKENS_TTL_HOURS` |
| Cache (stale) | 7 days | ✅ `CACHE_STALE_DAYS` |

### Batch Sizes

| Operation | Default | Max |
|-----------|---------|-----|
| Magic Links | 1,000 | 5,000 |
| Verification Codes | 1,000 | 5,000 |
| Notifications | 1,000 | 5,000 |
| Activity Logs | 1,000 | 5,000 |
| Tokens | 1,000 | 5,000 |
| Cache | 100 | 1,000 |

## Troubleshooting

### Cleanup Not Running

```bash
# Check worker status
ps aux | grep cleanup_job

# Check BullMQ queue
redis-cli LLEN cleanup-queue

# Check last cleanup
psql -h localhost -U postgres -d barberzap \
  -c "SELECT * FROM cleanup_runs_log ORDER BY started_at DESC LIMIT 5;"
```

### High Pending Count

```bash
# Check table size
python backend/cleanup/cleanup_cli.py stats

# Run dry-run to see what will be deleted
python backend/cleanup/cleanup_cli.py run --dry-run

# Check constraints
psql -h localhost -U postgres -d barberzap -c \
  "SELECT * FROM check_cleanup_constraint_violations();"
```

### Job Stuck in "in_progress"

```sql
-- Check for long-running operations
SELECT * FROM cleanup_runs_log
WHERE status = 'in_progress'
ORDER BY started_at;

-- Manually mark as failed if needed
UPDATE cleanup_runs_log
SET status = 'failed', error_message = 'Manual intervention'
WHERE id = 'xxx-xxx-xxx';
```

### Performance Issues

```bash
# Reduce batch size
export CLEANUP_BATCH_SIZE=100

# Index usage check
psql -h localhost -U postgres -d barberzap -c \
  "SELECT * FROM check_cleanup_index_usage();"

# Table size
psql -h localhost -U postgres -d barberzap -c \
  "SELECT * FROM get_cleanup_table_sizes();"
```

## Maintenance

### Daily

```bash
# Check health
curl http://localhost:8000/api/cleanup/health

# Review alerts
python backend/cleanup/cleanup_cli.py alerts

# Check last cleanup
SELECT * FROM cleanup_runs_log
WHERE started_at > NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

### Weekly

```bash
# Run full cleanup in dry-run to review
python backend/cleanup/cleanup_cli.py run --dry-run

# Check table sizes
psql -h localhost -U postgres -d barberzap -c \
  "SELECT * FROM get_cleanup_table_sizes() ORDER BY pending_cleanup DESC;"

# Review optimization
psql -h localhost -U postgres -d barberzap -c \
  "ANALYZE magic_links, verification_codes, notifications,
          activity_logs, client_session_tokens, password_reset_tokens, cache_entries;"
```

### Monthly

```bash
# Review cleanup history
SELECT * FROM cleanup_history
WHERE cleanup_date >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY cleanup_date DESC, count_deleted DESC;

# Check index usage and remove unused indexes
SELECT * FROM check_cleanup_index_usage()
WHERE status = 'UNUSED';

# Refresh materialized views if used
SELECT refresh_cleanup_stats_cache();
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Cleanup Dashboard                     │
│              (CleanupDashboard.tsx)                      │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP
┌─────────────────▼───────────────────────────────────────┐
│                  FastAPI Routes                          │
│               (cleanup_api.py)                           │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│  BullMQ Queue  │  │  Supabase RPC   │
│   (Redis)      │  │  Procedures     │
└───────┬────────┘  └──────┬──────────┘
        │                   │
┌───────▼──────────────────▼──────────┐
│      Cleanup Worker                  │
│    (cleanup_job.py)                  │
│  - Validate safety checks             │
│  - Batch delete operations           │
│  - Log to audit tables                │
│  - Send notifications                 │
└──────────────────────────────────────┘
        │
┌───────▼──────────────────────────────┐
│         Database (PostgreSQL)         │
│  - magic_links, verification_codes    │
│  - notifications, activity_logs       │
│  - client_session_tokens              │
│  - password_reset_tokens              │
│  - cache_entries                      │
│  - cleanup_runs_log, cleanup_history  │
│  - cleanup_stats_cache                │
└──────────────────────────────────────┘
```

## Dependencies

- **PostgreSQL**: 14+ (for partial indexes and JSONB)
- **Supabase**: Client library (supabase-py)
- **BullMQ**: Redis-based queue (bullmq)
- **Redis**: 6+ for BullMQ
- **Click**: CLI framework (for cleanup_cli.py)
- **Tabulate**: Table formatting for CLI output
- **FastAPI**: For API endpoints

## Security Considerations

### Access Control

- **Admin Only**: All cleanup operations require admin privileges
- **Audit Logging**: All operations are logged in `cleanup_runs_log`
- **Safety Checks**: Multi layer validation before deletion
- **Protected Tables**: Production data tables cannot be deleted

### Encryption

- Ensure database SSL is enabled in production
- Use encrypted connections for Redis if remote
- Store environment variables securely

### Data Privacy

- Cleanup removes temporary data with no PII concerns
- Production data is NEVER deleted (protected tables)
- Full audit trail for compliance

## Performance Tuning

### Batch Sizes

- Start with default (1,000 records)
- Increase to 5,000 if performance is good
- Decrease to 100 if experiencing locks
- Monitor `duration_ms` in cleanup_runs_log

### Indexing

Cleanup tables have partial indexes for efficient deletion:
```sql
-- Example: Expired magic links
CREATE INDEX idx_magic_links_expired_for_cleanup
  ON magic_links(shop_id, expiry_date)
  WHERE used_at IS NULL AND expiry_date < NOW();
```

Check index usage:
```sql
SELECT * FROM check_cleanup_index_usage();
```

### Scheduling

- **High Traffic**: Run every 4-6 hours
- **Medium Traffic**: Run twice daily
- **Low Traffic**: Run once daily (3 AM UTC)

## Support

For issues or questions:
1. Check logs in `/var/log/cleanup_worker.log`
2. Review PostgreSQL logs
3. Query `cleanup_runs_log` for operation history
4. Query `cleanup_alert_log` for active alerts
5. Contact the development team

## Contributing

When adding new cleanup jobs:
1. Add table definition to `22_cleanup_tables.sql`
2. Add stored procedure to `23_cleanup_procedures.sql`
3. Add BullMQ job to `cleanup_job.py`
4. Add API endpoint to `cleanup_api.py`
5. Add CLI command to `cleanup_cli.py`
6. Update dashboard if needed

## License

Part of the BarberZap project. See main LICENSE file.

## Changelog

### v1.0.0 (2026-03-05)
- Initial release of cleanup system
- Automated cleanup of 7 temporary/expiration tables
- BullMQ async processing with batching
- CLI management tools
- API endpoints for manual control
- React admin dashboard
- Full audit trail
- Health checks and alerting
- Safety checks and confirmation dialogs
- Dry run mode for preview
- Scheduling support (pg_cron/BullMQ)
