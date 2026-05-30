# Quick Start Guide - BullMQ Jobs

🚀 Get up and running with BarberZap background jobs in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Redis server running

## Installation

```bash
cd /root/barber/workers/jobs
npm install
```

## 1. Start Redis

**Option A: Using Docker (Recommended)**
```bash
make docker-redis
```

**Option B: Local installation**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

**Option C: Redis Cloud / Upstash**
Skip local Redis - just set `REDIS_URL` in `.env`

## 2. Configure Environment

```bash
make env-example
# Edit .env with your values
```

Minimal `.env` for local dev:
```bash
REDIS_URL=redis://localhost:6379
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Start Workers

```bash
npm run dev
```

Or using Make:
```bash
make dev
```

## 4. Schedule Your First Job

```typescript
import {
  initializeBullMQ,
  scheduleBookingConfirmation,
  scheduleReminders,
  scheduleCRMUpdate,
} from './workers/jobs/index.js';

// Initialize
await initializeBullMQ();

// Schedule a confirmation
await scheduleBookingConfirmation({
  appointmentId: 'apt_123',
  clientId: 'client_456',
  clientPhone: '+5511999999999',
  clientName: 'João Silva',
  barberName: 'Carlos Barber',
  serviceName: 'Corte e Barba',
  date: '2026-03-05',
  time: '14:00',
  duration: 60,
  price: 80,
});

// Schedule reminders
await scheduleReminders(
  new Date('2026-03-05T14:00:00'),
  {
    appointmentId: 'apt_123',
    clientId: 'client_456',
    clientPhone: '+5511999999999',
    clientName: 'João Silva',
    barberName: 'Carlos Barber',
    serviceName: 'Corte e Barba',
    date: '2026-03-05',
    time: '14:00',
  }
);

// Update CRM
await scheduleCRMUpdate({
  clientId: 'client_456',
  appointmentId: 'apt_123',
  action: 'created',
  servicePrice: 80,
});
```

## 5. Monitor Jobs

```bash
# Check statistics
npm run stats

# Check health
npm run health

# View queue details
npm run queue notifications

# View failed jobs
npm run list notifications failed 20

# View job details
npm run job notifications <job-id>
```

## Common Workflows

### When Appointment is Created
```typescript
// 1. Send confirmation
await scheduleBookingConfirmation(appointmentData);

// 2. Schedule reminders
await scheduleReminders(appointmentDateTime, reminderData);

// 3. Update CRM
await scheduleCRMUpdate({
  clientId: appointmentData.clientId,
  appointmentId: appointmentData.appointmentId,
  action: 'created',
  servicePrice: appointmentData.price,
});
```

### When Appointment is Completed
```typescript
await scheduleCRMUpdate({
  clientId: clientId,
  appointmentId: appointmentId,
  action: 'completed',
  servicePrice: price,
  appointmentDate: new Date().toISOString(),
});
```

### When Appointment is Cancelled
```typescript
// 1. Cancel pending reminders
await cancelReminderJobs(appointmentId);

// 2. Update CRM
await scheduleCRMUpdate({
  clientId: clientId,
  appointmentId: appointmentId,
  action: 'cancelled',
});

// 3. Send notification
await scheduleCancellationNotification({
  appointmentId: appointmentId,
  clientId: clientId,
  clientPhone: clientPhone,
  clientName: clientName,
  barberPhone: barberPhone,
  barberName: barberName,
  serviceName: serviceName,
  originalDate: date,
  originalTime: time,
  reason: reason,
});
```

### When Client No-Shows
```typescript
await scheduleCRMUpdate({
  clientId: clientId,
  appointmentId: appointmentId,
  action: 'no_show',
});
```

## Run Demo Examples

```bash
npm run test
```

This will run a full cycle demo showing:
- Creating appointment
- Sending confirmation
- Scheduling reminders
- Updating CRM
- Handling cancellation

## CLI Commands (Quick Reference)

```bash
# Statistics
make stats

# Queue monitoring
make queue-dev      # Notifications queue
make queue-crm      # CRM queue

# List jobs
make list-waiting   # Waiting jobs
make list-failed    # Failed jobs
make list-completed # Completed jobs

# Cleanup
make clean-all      # Clean old jobs
make clean-dlq-all  # Clean dead letter queue
make retry-failed   # Retry all failed jobs

# Redis
make redis-bash     # Open Redis CLI
make redis-monitor  # Monitor Redis commands
make redis-flush    # Flush all data (CAREFUL!)
```

## Troubleshooting

### Workers not processing jobs

Check if workers are running:
```bash
make health
```

Check Redis connection:
```bash
make redis-bash
> PING
# Should return: PONG
```

### Jobs stuck in waiting

Increase worker concurrency in `index.ts`:
```typescript
const notificationsWorker = new Worker(
  QUEUES.NOTIFICATIONS,
  processor,
  {
    connection: getRedisConnection(),
    concurrency: 10, // Increase this
  }
);
```

### Too many failed jobs

Check what's failing:
```bash
make list-failed
```

View error details:
```bash
npm run job notifications <job-id>
```

### WhatsApp not sending

1. Check API keys in `.env`
2. Verify API URL is correct
3. Check phone number format (starts with 55 for Brazil)
4. Review logs for specific errors

## Next Steps

- Read full [README.md](./README.md) for detailed documentation
- Check [DIAGRAM.txt](./DIAGRAM.txt) for architecture overview
- Review [examples.ts](./examples.ts) for more usage examples
- Set up production deployment (Redis Cluster, separate worker processes)

## Production Checklist

- [ ] Use Redis with password
- [ ] Configure Redis persistence (RDB + AOF)
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure alerts (failed jobs, Redis down)
- [ ] Use separate worker processes
- [ ] Set up log aggregation
- [ ] Configure rate limits for WhatsApp API
- [ ] Test retry logic thoroughly
- [ ] Set up database backups
- [ ] Document deployment process

## Need Help?

- Check [README.md](./README.md) troubleshooting section
- Review logs in terminal
- Inspect failed jobs with CLI
- Check Redis storage

---

**That's it! You're ready to go! 🎉**
