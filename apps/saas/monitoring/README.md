# BarberZap Monitoring & Alerting System

Complete monitoring and alerting solution for BarberZap, providing real-time visibility into application health, performance, and business metrics.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Metrics](#metrics)
- [Alerts](#alerts)
- [Dashboard](#dashboard)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The BarberZap monitoring system provides:

- **Prometheus-compatible metrics** for standard observability
- **Real-time dashboard** with interactive charts
- **Flexible alerting** with multiple notification channels
- **Multi-tenant support** with shop-level metrics
- **Historical data** retention (30 days by default)

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     BarberZap Applications                      │
│  (FastAPI/Node.js Workers + React Next.js Frontend)             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ Metrics Collection
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                  Metrics Collector Service                       │
│  - Polls Redis, BullMQ, Supabase                               │
│  - Aggregates metrics by time window                           │
│  - Stores in Redis with TTL                                    │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ Storage
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                      Redis Storage                              │
│  - Time-series metrics (sorted sets)                           │
│  - 30-day retention with automatic cleanup                     │
└────────────────────────┬───────────────────────────────────────┘
                         │
                 ┌───────┴───────┐
                 ▼               ▼
         ┌──────────────┐  ┌──────────────┐
         │  Prometheus  │  │   Dashboard   │
         │   Exporter   │  │   (React)     │
         │   :9090/metrics │  :3000        │
         └──────┬───────┘  └──────┬───────┘
                │                 │
                ▼                 ▼
         ┌──────────────┐  ┌──────────────┐
         │   Alerting   │  │   Grafana    │
         │   Engine     │  │   (Optional) │
         └──────┬───────┘  └──────────────┘
                │
      ┌─────────┼─────────┐
      ▼         ▼         ▼
  ┌───────┐ ┌───────┐ ┌───────┐
  │ Slack │ │ Email │ │WhatsApp│
  └───────┘ └───────┘ └───────┘
```

## Features

### Metrics Collection

- **Webhook Metrics**: Success rate, latency, failure analysis
- **Cache Metrics**: Hit rate, size, effectiveness tracking
- **Realtime Metrics**: Connection counts, message latency
- **Booking Metrics**: Conflicts, success rate, volume
- **Outbox Metrics**: Queue depth, processing rate, latency
- **Job Metrics**: BullMQ stats, success/failure rates
- **System Metrics**: CPU, memory, disk, Redis/Supabase health
- **Error Metrics**: Error rate by type and severity

### Alerting

- **Threshold-based alerts** with critical/warning/info levels
- **Multiple channels**: Slack, Email, WhatsApp, PagerDuty
- **On-call rotation** with escalation policies
- **Alert grouping and deduplication** to reduce noise
- **Maintenance windows** for planned downtime
- **Custom cooldown periods** per alert

### Dashboard

- **Real-time updates** every 15 seconds (configurable)
- **Interactive charts**: Line, Bar, Area, Gauge
- **Multi-tenant filtering** by shop_id
- **Time period filters**: 1h, 24h, 7d
- **Responsive design** for mobile/tablet/desktop
- **Alert panel** with acknowledge/clear actions

## Quick Start

### 1. Install Dependencies

```bash
# Backend dependencies
cd /root/barber/backend
pip install prometheus-client psutil redis

# Frontend dependencies (already have recharts)
cd /root/barber
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

Add to `.env`:

```env
# Monitoring Configuration
METRICS_PORT=9090
METRICS_ENABLED=true
ALERTING_CONFIG=monitoring/alerting.yaml
ALERTING_ENABLED=true

# Redis (for metrics storage)
REDIS_URL=redis://localhost:6379

# Notification Channels (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
WHATSAPP_API_URL=https://api.whatsapp.com/send
WHATSAPP_API_TOKEN=your-token
```

### 3. Start Metrics Collector

```bash
cd /root/barber/backend/metrics

# Start collector in background
python metrics_collector.py --redis-url redis://localhost:6379 &
COLLECTOR_PID=$!

echo "Collector started with PID: $COLLECTOR_PID"
```

### 4. Start Prometheus Exporter

```bash
cd /root/barber/backend/metrics

# Start exporter
python prometheus_exporter.py --port 9090 --shop-id all &
EXPORTER_PID=$!

echo "Exporter started with PID: $EXPORTER_PID"
```

Test metrics endpoint:

```bash
curl http://localhost:9090/metrics
```

### 5. Run Dashboard

```bash
cd /root/barber

# Start dev server
npm run dev

# Access dashboard at: http://localhost:5173/monitoring
```

### 6. (Optional) Set Up Alerting Engine

```bash
cd /root/barber/monitoring

# Install alerting engine dependencies
pip install pyyaml httpx schedule

# Start alerting engine
python alerting_engine.py --config alerting.yaml &
ALERTING_PID=$!

echo "Alerting engine started with PID: $ALERTING_PID"
```

## Installation

### Backend Installation

```bash
# Install Python dependencies
cd /root/barber/backend
pip install -r ../requirements.txt  # or individual packages:
pip install prometheus-client==0.19.0
pip install psutil==5.9.8
pip install redis==5.0.1
pip install pyyaml==6.0.1
pip install httpx==0.25.2
```

### Frontend Installation

The dashboard is already set up with Recharts. Verify installation:

```bash
cd /root/barber
npm list recharts
```

If needed:

```bash
npm install recharts@^3.6.0
```

### Production Deployment

#### systemd Service - Metrics Collector

Create `/etc/systemd/system/barber-metrics-collector.service`:

```ini
[Unit]
Description=BarberZap Metrics Collector
After=redis.service
Requires=redis.service

[Service]
Type=simple
User=barberzap
WorkingDirectory=/root/barber/backend/metrics
Environment="REDIS_URL=redis://localhost:6379"
ExecStart=/usr/bin/python3 metrics_collector.py --redis-url $REDIS_URL
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### systemd Service - Prometheus Exporter

Create `/etc/systemd/system/barber-prometheus-exporter.service`:

```ini
[Unit]
Description=BarberZap Prometheus Exporter
After=redis.service

[Service]
Type=simple
User=barberzap
WorkingDirectory=/root/barber/backend/metrics
Environment="PORT=9090"
Environment="SHOP_ID=all"
ExecStart=/usr/bin/python3 prometheus_exporter.py --port $PORT --shop-id $SHOP_ID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### systemd Service - Alerting Engine

Create `/etc/systemd/system/barber-alerting.service`:

```ini
[Unit]
Description=BarberZap Alerting Engine
After=redis.service

[Service]
Type=simple
User=barberzap
WorkingDirectory=/root/barber/monitoring
Environment="CONFIG=/root/barber/monitoring/alerting.yaml"
ExecStart=/usr/bin/python3 alerting_engine.py --config $CONFIG
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start services:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable barber-metrics-collector
sudo systemctl enable barber-prometheus-exporter
sudo systemctl enable barber-alerting

# Start services
sudo systemctl start barber-metrics-collector
sudo systemctl start barber-prometheus-exporter
sudo systemctl start barber-alerting

# Check status
sudo systemctl status barber-metrics-collector
sudo systemctl status barber-prometheus-exporter
sudo systemctl status barber-alerting
```

## Configuration

### Metrics Configuration

Edit `/root/barber/backend/metrics/prometheus_exporter.py` configuration:

```python
# Default settings
exporter = get_exporter(
    shop_id='your-shop-id',  # 'all' for multi-tenant aggregator
    enable_multiprocess=False,
    port=9090,
)
```

### Alerting Configuration

Edit `/root/barber/monitoring/alerting.yaml`:

```yaml
# Enable/disable alerts
alerts:
  - name: webhook_success_rate_low
    enabled: true
    thresholds:
      critical:
        value: 90
        operator: "<"
    channels: [slack, email]
    cooldown_seconds: 300

# Configure notification channels
channels:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#barberzap-alerts"
```

### Dashboard Configuration

Time filters and refresh interval can be changed in the component:

```tsx
<MetricsDashboard
  apiEndpoint="/api/metrics"
  refreshInterval={15000}  // 15 seconds
/>
```

## Metrics

### Available Metrics

#### Webhook Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_webhook_total` | Counter | Total webhooks processed | `shop_id`, `provider`, `status` |
| `barber_webhook_success_rate` | Gauge | Success rate percentage | `shop_id`, `provider` |
| `barber_webhook_processing_seconds` | Histogram | Processing time | `shop_id`, `provider` |

#### Cache Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_cache_hits_total` | Counter | Total cache hits | `shop_id`, `cache_type` |
| `barber_cache_misses_total` | Counter | Total cache misses | `shop_id`, `cache_type` |
| `barber_cache_hit_rate` | Gauge | Hit rate percentage | `shop_id`, `cache_type` |
| `barber_cache_size_bytes` | Gauge | Cache size in bytes | `shop_id`, `cache_type` |

#### Realtime Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_realtime_connections` | Gauge | Active connections | `shop_id` |
| `barber_realtime_messages_total` | Counter | Total messages | `shop_id`, `direction` |
| `barber_realtime_message_seconds` | Histogram | Message delivery time | `shop_id` |

#### Booking Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_booking_conflicts_total` | Counter | Total conflicts | `shop_id` |
| `barber_booking_conflicts_per_minute` | Gauge | Conflicts per minute | `shop_id` |
| `barber_booking_success_rate` | Gauge | Success rate percentage | `shop_id` |
| `barber_booking_total` | Counter | Total bookings | `shop_id`, `status` |

#### Outbox Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_outbox_queue_depth` | Gauge | Queue depth | `shop_id` |
| `barber_outbox_processed_total` | Counter | Items processed | `shop_id`, `status` |
| `barber_outbox_processing_seconds` | Histogram | Processing time | `shop_id` |

#### Job Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_job_total` | Counter | Total jobs processed | `shop_id`, `queue`, `status` |
| `barber_job_active` | Gauge | Active jobs | `shop_id`, `queue` |
| `barber_job_waiting` | Gauge | Waiting jobs | `shop_id`, `queue` |
| `barber_job_failed` | Gauge | Failed jobs | `shop_id`, `queue` |
| `barber_job_processing_seconds` | Histogram | Job processing time | `shop_id`, `queue`, `job_type` |

#### System Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_redis_health` | Gauge | Redis health (1=healthy) | `shop_id` |
| `barber_redis_ping_seconds` | Gauge | Redis ping latency | `shop_id` |
| `barber_supabase_health` | Gauge | Supabase health (1=healthy) | `shop_id` |
| `barber_supabase_query_seconds` | Gauge | Query latency | `shop_id`, `query_type` |
| `barber_system_cpu_percent` | Gauge | CPU usage percentage | - |
| `barber_system_memory_percent` | Gauge | Memory usage percentage | - |
| `barber_system_disk_percent` | Gauge | Disk usage percentage | - |

#### Error Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_errors_total` | Counter | Total errors | `shop_id`, `error_type`, `severity` |
| `barber_errors_per_minute` | Gauge | Errors per minute | `shop_id`, `error_type`, `severity` |

#### Performance Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `barber_api_request_seconds` | Histogram | API request latency | `shop_id`, `endpoint`, `method` |
| `barber_dashboard_load_seconds` | Histogram | Dashboard load time | `shop_id`, `dashboard_type` |

## Alerts

### Alert Severities

- **Critical**: Immediate action required, high impact
- **Warning**: Investigation needed, potential impact
- **Info**: Informational, low/no impact

### Alert Thresholds

| Alert | Critical | Warning | Info |
|-------|----------|---------|------|
| Webhook Success Rate | < 90% | < 95% | - |
| Webhook Latency | > 5s | > 2s | - |
| Cache Hit Rate | < 70% | < 80% | - |
| Booking Conflicts | > 20/min | > 10/min | > 5/min |
| Outbox Depth | > 500 | > 100 | - |
| Job Failures | > 50 | > 20 | - |
| Error Rate | > 10/min | > 5/min | > 1/min |
| API Latency | > 2s | > 1s | - |
| CPU Usage | > 90% | > 70% | - |
| Memory Usage | > 90% | > 75% | - |
| Disk Usage | > 90% | > 80% | - |

### Alert Configuration Example

```yaml
alerts:
  - name: custom_alert
    display_name: Custom Business Metric
    description: Monitor a custom metric
    metric:
      name: barber_custom_metric
      type: gauge
      labels:
        shop_id: "*"
    thresholds:
      critical:
        value: 100
        operator: ">"
    annotations:
      summary: "Custom threshold exceeded"
      description: "Value: {{ $value }}"
    channels: [slack]
    cooldown_seconds: 300
    enabled: true
```

## Dashboard

### Screenshots

TODO: Add screenshots of the dashboard

### Features

- **Metric Cards**: Key metrics with change indicators and status colors
- **Time Filters**: 1h, 24h, 7d views
- **Shop Filter**: Multi-tenant support
- **Charts**:
  - Line charts for trends
  - Bar charts for comparisons
  - Area charts for volume
  - Gauges for health/status
- **Alerts Panel**: Real-time alert feed with actions
- **Responsive**: Mobile, tablet, desktop support

### Customization

```tsx
// Customize metric cards
const customCards = [
  {
    title: 'Custom Metric',
    value: metricsData,
    unit: 'items',
    // ...
  }
];

// Add custom charts
const CustomChart = () => (
  <ChartSection
    title="Custom Metric Trend"
    data={chartData}
    dataKey="customMetric"
    xAxisKey="time"
    color="#8b5cf6"
  />
);
```

## API Endpoints

### Metrics API

```
GET /api/metrics
```

Query Parameters:
- `window`: Time window (`1h`, `24h`, `7d`) - default: `1h`
- `shop_id`: Shop ID filter - default: `all`

Response:

```json
{
  "timestamp": 1712489320.123,
  "metrics": [
    {
      "timestamp": 1712489320.123,
      "webhook_success_rate": 95.5,
      "cache_hit_rate": 82.3,
      "realtime_connections": 67,
      "booking_conflicts": 2,
      "outbox_depth": 45,
      "error_rate": 0.5
    }
  ],
  "alerts": [
    {
      "id": "alert-1",
      "type": "warning",
      "metric": "Cache Hit Rate",
      "message": "Cache hit rate dropped below 80%",
      "shop_id": "shop-1",
      "timestamp": 1712489000.000,
      "acknowledged": false
    }
  ]
}
```

### Prometheus Metrics Endpoint

```
GET /metrics
```

Response: Prometheus exposition format

```
# HELP barber_webhook_total Total number of webhooks processed
# TYPE barber_webhook_total counter
barber_webhook_total{shop_id="shop-1",provider="whatsapp",status="success"} 1234
...
```

### Alert Management API

```
GET /api/alerts
POST /api/alerts/:id/acknowledge
PUT /api/alerts/:id/clear
GET /api/alerts/rules
PUT /api/alerts/rules/:rule_id
```

## Troubleshooting

### Metrics Not Showing

1. **Check Redis connection**:
```bash
redis-cli ping
```

2. **Verify collector is running**:
```bash
ps aux | grep metrics_collector
```

3. **Check collector logs**:
```bash
journalctl -u barber-metrics-collector -f
```

4. **Verify metrics in Redis**:
```bash
redis-cli keys "barber:metrics:*"
redis-cli zrange "barber:metrics:webhook:total" -10 -1
```

### Alerts Not Firing

1. **Check alert config**:
```bash
python -c "import yaml; print(yaml.safe_load(open('monitoring/alerting.yaml')))"
```

2. **Verify thresholds are met**:
```bash
curl http://localhost:9090/metrics | grep barber_webhook_success_rate
```

3. **Check alerting engine logs**:
```bash
journalctl -u barber-alerting -f
```

4. **Test notification channels**:
```bash
# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL -H 'Content-Type: application/json' -d '{"text":"Test alert"}'
```

### Dashboard Issues

1. **Check API endpoint**:
```bash
curl http://localhost:3000/api/metrics
```

2. **Verify CORS settings**:
```javascript
// Check console for CORS errors
```

3. **Clear browser cache**:
- Chrome: DevTools > Application > Clear storage
- Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### High Memory Usage

1. **Check metrics retention**:
```bash
redis-cli config get maxmemory
```

2. **Adjust TTL**:
```python
# In metrics_collector.py
METRIC_TTL_DAYS = 7  # Reduce from 30
```

3. **Run cleanup**:
```bash
python -c "import asyncio; from metrics_collector import MetricsCollector; asyncio.run(collector.store.cleanup_old_metrics(before_days=30))"
```

## Best Practices

### Metric Naming

- Use descriptive names: `barber_webhook_success_rate`
- Include units when relevant: `barber_cache_size_bytes`
- Use labels for dimensions: `shop_id`, `provider`, `status`

### Alert Tuning

1. **Start conservative**: Higher thresholds, longer cooldowns
2. **Monitor false positives**: Adjust based on noise
3. **Group similar alerts**: Reduce notification spam
4. **Use severity levels**: Critical goes to PagerDuty/WhatsApp

### Performance

1. **Collect frequently** (every 30s) but **store efficiently**
2. **Use histograms** for latency (not just averages)
3. **Aggregate** in-collector, not in-dashboard
4. **Limit retained data** to what's actionable

### Multi-Tenant

1. **Label everything** with `shop_id`
2. **Track per-shop quotas** and alert appropriately
3. **Aggregate metrics** across shops for system view
4. **Filter dashboard** by shop for operational context

## License

MIT License - BarberZap Project

## Support

For issues and questions:
- GitHub Issues: https://github.com/barberzap/monitoring
- Email: devops@barberzap.com
- Internal Slack: #barberzap-monitoring
