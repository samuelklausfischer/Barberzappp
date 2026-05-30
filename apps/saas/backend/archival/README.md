# BarberZap - Data Archival System

Complete data archival solution for managing historical data while maintaining performance.

## Overview

The Data Archival System provides automated, safe, and auditable archival of historical data (clients, appointments, messages, activity logs) to improve database performance while preserving all records for compliance and analysis.

## Features

### Database Structure
- **Partitioned Tables**: Archived data is stored in PostgreSQL tables partitioned by time (year/quarter/month)
- **Row Level Security (RLS)**: Only superadmin can access archived tables
- **Read-Only Protection**: Archived tables are INSERT/UPDATE/DELETE protected
- **Full-Text Search**: Optimized indices for searching archived data
- **Audit Trail**: Complete logging of all archival operations

### Archival Policies
- **Clients**: Inactive for 24+ months (no appointments)
- **Appointments**: Completed/cancelled for 12+ months
- **Messages**: Older than 18+ months
- **Activity Logs**: Older than 6+ months

### Processing Features
- **Async Processing**: BullMQ jobs for non-blocking archival
- **Batch Processing**: Configurable batch sizes (100-5000 records)
- **Progress Tracking**: Real-time progress updates
- **Retry Logic**: Exponential backoff on failures
- **Dry Run Mode**: Test without making changes

### Analytics & Reporting
- **Materialized Views**: Pre-computed statistics
- **Concurrent Refresh**: Statistics update without blocking reads
- **Size Tracking**: Monitor table growth and space savings
- **Operation Logs**: Full audit trail of all operations

## Installation

### 1. Database Setup

Run the SQL scripts in order:

```bash
# 1. Create archival tables with partitions
psql -h localhost -U postgres -d barberzap \
  -f database/12_archival_tables.sql

# 2. Create archival policies and procedures
psql -h localhost -U postgres -d barberzap \
  -f database/13_archival_policy.sql

# 3. Create materialized views for statistics
psql -h localhost -U postgres -d barberzap \
  -f database/14_summary_views.sql

# 4. Create audit trail tables
psql -h localhost -U postgres -d barberzap \
  -f database/15_archival_audit.sql
```

### 2. Backend Setup

```bash
cd /root/barber/backend/archival

# Install dependencies (if not already installed)
pip install bullmq click

# Make CLI executable
chmod +x archival_cli.py
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

# Archival settings
ARCHIVAL_BATCH_SIZE=1000
ARCHIVAL_MAX_RETRIES=3
```

### 4. Worker Setup

```bash
# Start archival worker (runs in background)
python -m backend.archival.archival_job

# Or using pm2/gunicorn (production)
pm2 start backend/archival/archival_job.py \
  --name archival-worker \
  --interpreter python3
```

## Usage

### CLI Commands

#### Show Table Statistics

```bash
# Show table sizes
python backend/archival/archival_cli.py stats table-sizes

# Show archival status (active vs archived)
python backend/archival/archival_cli.py stats archival-status

# Show operation statistics
python backend/archival/archival_cli.py stats operations \
  --start-date 2024-01-01 \
  --end-date 2024-12-31 \
  --format table
```

#### Run Archival Operations

```bash
# Archive inactive clients (24+ months)
python backend/archival/archival_cli.py run clients \
  --months 24 \
  --shop-id xxx-xxx-xxx \
  --dry-run

# Archive old appointments (12+ months)
python backend/archival/archival_cli.py run appointments \
  --months 12 \
  --batch-size 1000

# Archive all eligible data
python backend/archival/archival_cli.py run all \
  --dry-run

# Archive with specific batch size
python backend/archival/archival_cli.py run clients \
  --months 24 \
  --batch-size 5000 \
  --performed-by admin@barber.com
```

#### Summary & Reporting

```bash
# Show aggregated summary
python backend/archival/archival_cli.py summary

# Summary for a specific year
python backend/archival/archival_cli.py summary --year 2024

# Output as JSON
python backend/archival/archival_cli.py summary --format json
```

#### Cleanup Old Logs

```bash
# Clean up logs older than 90 days (dry run)
python backend/archival/archival_cli.py cleanup --days 90 --dry-run

# Actually cleanup (requires confirmation)
python backend/archival/archival_cli.py cleanup --days 90

# Skip confirmation
python backend/archival/archival_cli.py cleanup --days 90 --confirm
```

#### Restore Data (Emergency)

```bash
# Restore an appointment from archive
python backend/archival/archival_cli.py restore \
  --appointment-id xxx-xxx-xxx \
  --reason "Customer request for rebooking"

# Restore a client
python backend/archival/archival_cli.py restore \
  --client-id yyy-yyy-yyy \
  --reason "Reactive dormant customer"
```

#### Monitor Operations

```bash
# List recent operations
python backend/archival/archival_cli.py operations list

# List last 50 operations
python backend/archival/archival_cli.py operations list --limit 50

# Output as JSON
python backend/archival/archival_cli.py operations list --format json
```

### API Endpoints

#### Get Statistics

```bash
# Get table sizes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/archival/stats

# Get archival status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/archival/status

# Get operation statistics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/archival/summary?start_date=2024-01-01"
```

#### Run Archival

```bash
# Archive clients
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "older_than_months": 24,
    "dry_run": false
  }' \
  http://localhost:8000/api/archival/archive/clients

# Archive appointments
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "older_than_months": 12,
    "dry_run": false
  }' \
  http://localhost:8000/api/archival/archive/appointments

# Archive all data
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}' \
  http://localhost:8000/api/archival/archive/all
```

#### Search Archived Data

```bash
# Search archived clients
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/archival/archived-clients?page=1&page_size=50&name=John"

# Search archived appointments
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/archival/archived-appointments?page=1&status=completed"
```

#### Restore Data

```bash
# Restore an appointment
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "record_type": "appointments",
    "record_id": "xxx-xxx-xxx",
    "reason": "Emergency restore"
  }' \
  http://localhost:8000/api/archival/restore
```

#### Monitor Operations

```bash
# List operations
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/archival/operations?page=1&page_size=50"

# Get specific operation
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/archival/operations/xxx-xxx-xxx
```

### React Component

```tsx
import { ArchivalDashboard } from '@/components/ArchivalDashboard';

// In your admin page
<ArchivalDashboard shopId="xxx-xxx-xxx" adminOnly={true} />
```

The dashboard provides:
- Overview of table sizes and archival status
- Trigger archival operations with dry-run mode
- Monitor active/archived jobs
- Search archived clients and appointments
- Restore data (emergency)
- View complete audit trail

## Scheduled Archival

### Option 1: Cron Job

```bash
# Run archival every day at 2 AM
0 2 * * * cd /root/barber && \
  python -m backend.archival.archival_cli run all \
  --performed-by cron_job >> /var/log/archival.log 2>&1
```

### Option 2: pg_cron (PostgreSQL extension)

```sql
-- Enable pg_cron
CREATE EXTENSION pg_cron;

-- Schedule archival
SELECT cron.schedule(
  'archive-clients',
  '0 2 * * *',
  $$CALL procedure_archive_clients(24, NULL, 1000, FALSE, 'cron_job')$$
);

SELECT cron.schedule(
  'archive-appointments',
  '0 3 * * *',
  $$CALL procedure_archive_appointments(12, NULL, 1000, FALSE, 'cron_job')$$
);
```

### Option 3: Application Scheduler

```python
# Using APScheduler or similar
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=2, minute=0)
async def daily_archival():
    await queue_all_archive(queue, dry_run=False)

scheduler.start()
```

## Materialized Views Refresh

### Using pg_cron:

```sql
-- Refresh views daily at 1 AM
SELECT cron.schedule(
  'refresh-views',
  '0 1 * * *',
  $$CALL scheduled_refresh_materialized_views()$$
);
```

### Using CLI:

```bash
# Refresh all views
psql -h localhost -U postgres -d barberzap \
  -c "CALL scheduled_refresh_materialized_views();"

# Refresh specific view
psql -h localhost -U postgres -d barberzap \
  -c "CALL refresh_materialized_view_concurrently('mv_client_stats_per_month');"
```

## Monitoring & Alerting

### Health Checks

```bash
# Check archival worker status
curl http://localhost:8000/health/archival

# Check recent operations
python backend/archival/archival_cli.py operations list --limit 10
```

### Alerts Setup

```python
# Configure notifications on completion
notification_service = NotificationService(...)
archival_job = ArchivalJob(redis, supabase, notification_service)
```

## Troubleshooting

### Common Issues

#### Job Stuck in "in_progress"

```sql
-- Check for long-running operations
SELECT * FROM archival_operations_log
WHERE status = 'in_progress'
ORDER BY started_at;

-- Manually mark as failed if needed
UPDATE archival_operations_log
SET status = 'failed', error_message = 'Manual intervention'
WHERE id = 'xxx-xxx-xxx';
```

#### Slow Performance

```bash
# Reduce batch size
python backend/archival/archival_cli.py run clients \
  --batch-size 500

# Check for locks
psql -h localhost -U postgres -d barberzap -c "
SELECT * FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
"
```

#### Materialized View Not Refreshing

```bash
# Check if concurrent refresh is supported
psql -h localhost -U postgres -d barberzap -c "
SELECT viewname, ispopulated
FROM pg_matviews
WHERE schemaname = 'public';
"

# Force refresh (may block)
psql -h localhost -U postgres -d barberzap -c "
REFRESH MATERIALIZED VIEW mv_client_stats_per_month;
"
```

### Logs

```bash
# Check archival worker logs
tail -f /var/log/archival_worker.log

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log

# Check BullMQ job logs
redis-cli HGETALL bull:job:archive_all:xxx-xxx-xxx
```

## Security Considerations

### Access Control

- **RLS Policies**: Ensure only superadmin role can access archived tables
- **Service Role Key**: Never expose service role key in frontend
- **Audit Logging**: All access is logged in `archival_access_log`

### Encryption

- Ensure database SSL is enabled
- Use encrypted connections for Redis if remote
- Rotate service role keys regularly

### Data Privacy

- Archived data contains PII (names, phone numbers)
- Ensure proper data retention policies
- Consider data anonymization for very old records

## Performance Tuning

### Batch Sizes

- **Clients**: 1000 (default)
- **Appointments**: 1000-2000
- **Messages**: 1000
- **Activity Logs**: 5000 (larger due to simple structure)

### Partitioning

- Create new partitions ahead of time
- Monitor partition size (aim for < 1GB per partition)
- Consider drop old partitions if no longer needed

### Indexing

- Monitor index usage with `pg_stat_user_indexes`
- Reindex if correlation is low
- Consider BRIN indexes for large timestamp ranges

## Maintenance

### Weekly

```bash
# Clean up old logs (90 days retention)
python backend/archival/archival_cli.py cleanup --days 90

# Refresh materialized views
psql -h localhost -U postgres -d barberzap -c "
CALL scheduled_refresh_materialized_views();
"
```

### Monthly

```bash
# Review archival operations
python backend/archival/archival_cli.py summary

# Check table sizes
python backend/archival/archival_cli.py stats table-sizes

# Run ANALYZE
psql -h localhost -U postgres -d barberzap -c "
ANALYZE clients;
ANALYZE appointments;
ANALYZE clients_archived;
ANALYZE appointments_archived;
"
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Admin Dashboard                      │
│               (ArchivalDashboard.tsx)                    │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP
┌─────────────────▼───────────────────────────────────────┐
│                  FastAPI Routes                          │
│              (archival_api.py)                           │
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
│      Archival Worker                  │
│    (archival_job.py)                  │
│  - Archive to *_archived tables       │
│  - Log operations                    │
│  - Refresh views                     │
└──────────────────────────────────────┘
        │
┌───────▼──────────────────────────────┐
│         Database (PostgreSQL)          │
│  - clients_archived (partitioned)     │
│  - appointments_archived             │
│  - messages_archived                 │
│  - activity_logs_archived            │
│  - archival_operations_log            │
│  - mv_* materialized views            │
└──────────────────────────────────────┘
```

## Dependencies

- **PostgreSQL**: 14+ (for partitioning and better index features)
- **Supabase**: Client library (supabase-py)
- **BullMQ**: Redis-based queue (bullmq)
- **Click**: CLI framework (for archival_cli.py)
- **FastAPI**: For API endpoints

## License

Part of the BarberZap project. See main LICENSE file.

## Support

For issues or questions:
1. Check logs in `/var/log/archival_worker.log`
2. Review PostgreSQL logs
3. Query `archival_operations_log` table for operation history
4. Contact the development team

## Changelog

### v1.0.0 (2024-03-04)
- Initial release of archival system
- Partitioned tables for clients, appointments, messages, activity logs
- BullMQ async processing
- CLI management tools
- API endpoints
- React admin dashboard
- Full audit trail
- Materialized views for statistics
