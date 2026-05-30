# BarberZap Metrics Endpoints Reference

Complete reference for all monitoring and metrics endpoints.

## Table of Contents

- [Prometheus Metrics](#prometheus-metrics)
- [Internal API Endpoints](#internal-api-endpoints)
- [External Integration](#external-integration)
- [Alert API Endpoints](#alert-api-endpoints)
- [Metrics by Category](#metrics-by-category)

---

## Prometheus Metrics

### Base Endpoint
```
GET /metrics
```

Exposes all metrics in Prometheus exposition format.
Port: 9090 (default)

### Example Request
```bash
curl http://localhost:9090/metrics
```

### Example Response
```
# HELP barber_webhook_total Total number of webhooks processed
# TYPE barber_webhook_total counter
barber_webhook_total{shop_id="shop-1",provider="whatsapp",status="success"} 1234
barber_webhook_total{shop_id="shop-1",provider="whatsapp",status="failure"} 5

# HELP barber_webhook_success_rate Webhook success rate percentage (0-100)
# TYPE barber_webhook_success_rate gauge
barber_webhook_success_rate{shop_id="shop-1",provider="whatsapp"} 99.6

# HELP barber_cache_hit_rate Cache hit rate percentage (0-100)
# TYPE barber_cache_hit_rate gauge
barber_cache_hit_rate{shop_id="shop-1",cache_type="booking"} 85.5
barber_cache_hit_rate{shop_id="shop-1",cache_type="user"} 92.3

# HELP barber_realtime_connections Number of active realtime connections
# TYPE barber_realtime_connections gauge
barber_realtime_connections{shop_id="shop-1"} 67

# HELP barber_booking_conflicts_per_minute Booking conflicts per minute
# TYPE barber_booking_conflicts_per_minute gauge
barber_booking_conflicts_per_minute{shop_id="shop-1"} 2

# HELP barber_outbox_queue_depth Number of items in outbox queue
# TYPE barber_outbox_queue_depth gauge
barber_outbox_queue_depth{shop_id="shop-1"} 45

# HELP barber_job_active Number of active jobs
# TYPE barber_job_active gauge
barber_job_active{shop_id="shop-1",queue="webhooks"} 12
barber_job_active{shop_id="shop-1",queue="reminders"} 5

# HELP barber_redis_health Redis health status (1=healthy, 0=unhealthy)
# TYPE barber_redis_health gauge
barber_redis_health{shop_id="shop-1"} 1

# HELP barber_supabase_health Supabase health status (1=healthy, 0=unhealthy)
# TYPE barber_supabase_health gauge
barber_supabase_health{shop_id="shop-1"} 1

# HELP barber_errors_total Total errors
# TYPE barber_errors_total counter
barber_errors_total{shop_id="shop-1",error_type="DatabaseError",severity="critical"} 3

# HELP barber_api_request_seconds API request latency in seconds
# TYPE barber_api_request_seconds histogram
barber_api_request_seconds_bucket{shop_id="shop-1",endpoint="/api/bookings",method="GET",le="0.01"} 2345
barber_api_request_seconds_bucket{shop_id="shop-1",endpoint="/api/bookings",method="GET",le="0.05"} 5678
...
```

---

## Internal API Endpoints

### Get Metrics Summary
```
GET /api/metrics
```

Query Parameters:
- `window` (optional): Time window (`1h`, `24h`, `7d`) - default: `1h`
- `shop_id` (optional): Filter by shop ID - default: `all`
- `metrics` (optional): Comma-separated list of metrics to return

Example Requests:
```bash
# Get last hour all metrics
curl http://localhost:3000/api/metrics?window=1h

# Get specific shop metrics for 24 hours
curl http://localhost:3000/api/metrics?shop_id=shop-1&window=24h

# Get specific metrics only
curl http://localhost:3000/api/metrics?metrics=webhook_success_rate,cache_hit_rate,booking_conflicts
```

Example Response:
```json
{
  "timestamp": 1712489320.123,
  "window": "1h",
  "shop_id": "shop-1",
  "metrics": [
    {
      "timestamp": 1712489320.123,
      "time": "now",
      "webhook_success_rate": 95.5,
      "cache_hit_rate": 82.3,
      "realtime_connections": 67,
      "booking_conflicts": 2,
      "outbox_depth": 45,
      "dashboard_load_time": 245.3,
      "error_rate": 0.5
    },
    {
      "timestamp": 1712489260.123,
      "time": "now",
      "webhook_success_rate": 95.2,
      "cache_hit_rate": 82.1,
      "realtime_connections": 65,
      "booking_conflicts": 1,
      "outbox_depth": 43,
      "dashboard_load_time": 234.5,
      "error_rate": 0.4
    }
  ],
  "aggregates": {
    "webhook_success_rate": {
      "min": 94.5,
      "max": 96.0,
      "avg": 95.3
    },
    "cache_hit_rate": {
      "min": 80.1,
      "max": 83.5,
      "avg": 82.2
    }
  },
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

### Get Webhook Stats
```
GET /api/metrics/webhooks
```

Query Parameters:
- `window` (optional): Time window - default: `1h`
- `shop_id` (optional): Filter by shop ID

Response:
```json
{
  "window": "1h",
  "total": 1234,
  "success": 1228,
  "failure": 6,
  "success_rate": 99.51,
  "avg_latency": 0.123,
  "p50_latency": 0.095,
  "p95_latency": 0.234,
  "p99_latency": 0.567,
  "by_provider": {
    "whatsapp": {
      "total": 800,
      "success_rate": 99.75
    },
    "telegram": {
      "total": 434,
      "success_rate": 99.07
    }
  },
  "trend": [/* timestamps */]
}
```

### Get Cache Stats
```
GET /api/metrics/cache
```

Query Parameters:
- `window` (optional): Time window - default: `1h`
- `shop_id` (optional): Filter by shop ID
- `cache_type` (optional): Filter by cache type

Response:
```json
{
  "window": "1h",
  "hits": 45678,
  "misses": 9876,
  "hit_rate": 82.21,
  "miss_rate": 17.79,
  "by_type": {
    "booking": {
      "hit_rate": 85.5,
      "hits": 25000,
      "misses": 4200
    },
    "user": {
      "hit_rate": 78.9,
      "hits": 12000,
      "misses": 3200
    },
    "shop": {
      "hit_rate": 82.3,
      "hits": 8678,
      "misses": 2476
    }
  },
  "trend": [/* timestamps */]
}
```

### Get Job Stats
```
GET /api/metrics/jobs
```

Query Parameters:
- `window` (optional): Time window - default: `1h`

Response:
```json
{
  "window": "1h",
  "total_processed": 5678,
  "success_rate": 99.2,
  "avg_processing_time": 2.34,
  "by_queue": {
    "webhooks": {
      "active": 12,
      "waiting": 45,
      "failed": 2,
      "success_rate": 99.6,
      "avg_time": 0.45
    },
    "reminders": {
      "active": 5,
      "waiting": 23,
      "failed": 0,
      "success_rate": 100.0,
      "avg_time": 1.23
    },
    "crm_updates": {
      "active": 8,
      "waiting": 67,
      "failed": 4,
      "success_rate": 98.5,
      "avg_time": 5.67
    }
  }
}
```

### Get System Stats
```
GET /api/metrics/system
```

Response:
```json
{
  "timestamp": 1712489320.123,
  "cpu": {
    "percent": 45.2,
    "cores": 4
  },
  "memory": {
    "percent": 62.3,
    "total_mb": 8192,
    "used_mb": 5102,
    "available_mb": 3090
  },
  "disk": {
    "percent": 78.5,
    "total_gb": 100,
    "used_gb": 78.5,
    "used_gb": 21.5
  },
  "redis": {
    "healthy": true,
    "latency_seconds": 0.012,
    "connected_clients": 23
  },
  "supabase": {
    "healthy": true,
    "latency_seconds": 0.045
  }
}
```

### Get Dashboard Summary
```
GET /api/metrics/summary
```

Returns a compact summary of all key metrics for the dashboard.

Response:
```json
{
  "timestamp": 1712489320.123,
  "webhook": {
    "success_rate": 99.5,
    "total_last_hour": 1234
  },
  "cache": {
    "hit_rate": 82.2
  },
  "realtime": {
    "connections": 67
  },
  "bookings": {
    "conflicts_per_minute": 2,
    "total_today": 456
  },
  "jobs": {
    "active": 25,
    "waiting": 135,
    "failed": 6
  },
  "system": {
    "cpu_percent": 45.2,
    "memory_percent": 62.3,
    "redis_healthy": true,
    "supabase_healthy": true
  },
  "shop_ranking": {
    "shop-1": {
      "cache_hit_rate": 85.5,
      "bookings_today": 123
    },
    "shop-2": {
      "cache_hit_rate": 82.3,
      "bookings_today": 156
    }
  }
}
```

---

## Alert API Endpoints

### Get Alerts
```
GET /api/alerts
```

Query Parameters:
- `severity` (optional): Filter by severity (`critical`, `warning`, `info`)
- `state` (optional): Filter by state (`firing`, `resolved`)
- `shop_id` (optional): Filter by shop ID
- `acknowledged` (optional): Filter by acknowledged status (`true`, `false`)
- `limit` (optional): Maximum number of alerts to return

Example Request:
```bash
curl http://localhost:3000/api/alerts?severity=critical&state=firing
```

Response:
```json
{
  "alerts": [
    {
      "id": "webhook_success_rate_low:shop-1:whatsapp",
      "name": "webhook_success_rate_low",
      "display_name": "Low Webhook Success Rate",
      "severity": "critical",
      "state": "firing",
      "metric_name": "barber_webhook_success_rate",
      "labels": {
        "shop_id": "shop-1",
        "provider": "whatsapp"
      },
      "value": 88.5,
      "threshold": 90.0,
      "message": "Webhook success rate is low for shop shop-1\nCurrent rate: 88.5% (threshold: 90.0%)",
      "timestamp": 1712489000.000,
      "acknowledged": false,
      "notification_count": 3
    }
  ],
  "total": 1,
  "firing": 1,
  "acknowledged": 0
}
```

### Acknowledge Alert
```
POST /api/alerts/{alert_id}/acknowledge
```

Request Body:
```json
{
  "acknowledged_by": "user@example.com",
  "comment": " investigating"
}
```

Response:
```json
{
  "id": "webhook_success_rate_low:shop-1:whatsapp",
  "acknowledged": true,
  "acknowledged_at": "2024-03-04T01:00:00Z",
  "acknowledged_by": "user@example.com"
}
```

### Clear/Resolve Alert
```
DELETE /api/alerts/{alert_id}
```

or

```
PUT /api/alerts/{alert_id}/resolve
```

Response:
```json
{
  "id": "webhook_success_rate_low:shop-1:whatsapp",
  "state": "resolved",
  "resolved_at": "2024-03-04T01:00:00Z"
}
```

### Get Alert Rules
```
GET /api/alerts/rules
```

Get all alert rules configuration.

Response:
```json
{
  "rules": [
    {
      "name": "webhook_success_rate_low",
      "display_name": "Low Webhook Success Rate",
      "description": "Webhook success rate has dropped below threshold",
      "enabled": true,
      "thresholds": {
        "critical": {
          "value": 90,
          "operator": "<"
        },
        "warning": {
          "value": 95,
          "operator": "<"
        }
      },
      "channels": ["slack", "email"],
      "cooldown_seconds": 300
    }
  ]
}
```

### Update Alert Rule
```
PUT /api/alerts/rules/{rule_name}
```

Request Body:
```json
{
  "enabled": false,
  "thresholds": {
    "critical": {
      "value": 85,
      "operator": "<"
    }
  }
}
```

Response:
```json
{
  "name": "webhook_success_rate_low",
  "updated": true
}
```

---

## External Integration

### Webhook Endpoint
```
POST /api/webhooks/metrics
```

Allows external systems to push metrics to BarberZap.

Request Body:
```json
{
  "metric_name": "external_custom_metric",
  "shop_id": "shop-1",
  "value": 123.45,
  "labels": {
    "source": "external",
    "type": "custom"
  },
  "timestamp": 1712489320.123
}
```

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-04T01:00:00Z",
  "services": {
    "metrics_collector": "healthy",
    "prometheus_exporter": "healthy",
    "redis": "healthy",
    "supabase": "healthy"
  }
}
```

### Readiness Probe
```
GET /ready
```

Response:
```json
{
  "ready": true,
  "timestamp": "2024-03-04T01:00:00Z"
}
```

---

## Metrics by Category

### Webhook Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/webhooks` | Webhook statistics |
| `/metrics` | `barber_webhook_total` counter |
| `/metrics` | `barber_webhook_success_rate` gauge |
| `/metrics` | `barber_webhook_processing_seconds` histogram |

### Cache Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/cache` | Cache statistics |
| `/metrics` | `barber_cache_hits_total` counter |
| `/metrics` | `barber_cache_misses_total` counter |
| `/metrics` | `barber_cache_hit_rate` gauge |
| `/metrics` | `barber_cache_size_bytes` gauge |

### Realtime Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/summary` | Includes realtime stats |
| `/metrics` | `barber_realtime_connections` gauge |
| `/metrics` | `barber_realtime_messages_total` counter |
| `/metrics` | `barber_realtime_message_seconds` histogram |

### Booking Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/summary` | Includes booking stats |
| `/metrics` | `barber_booking_conflicts_total` counter |
| `/metrics` | `barber_booking_conflicts_per_minute` gauge |
| `/metrics` | `barber_booking_success_rate` gauge |
| `/metrics` | `barber_booking_total` counter |

### Outbox Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/summary` | Includes outbox stats |
| `/metrics` | `barber_outbox_queue_depth` gauge |
| `/metrics` | `barber_outbox_processed_total` counter |
| `/metrics` | `barber_outbox_processing_seconds` histogram |

### Job Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/jobs` | Job queue statistics |
| `/metrics` | `barber_job_total` counter |
| `/metrics` | `barber_job_active` gauge |
| `/metrics` | `barber_job_waiting` gauge |
| `/metrics` | `barber_job_failed` gauge |
| `/metrics` | `barber_job_processing_seconds` histogram |

### System Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics/system` | System resource stats |
| `/metrics` | `barber_redis_health` gauge |
| `/metrics` | `barber_redis_ping_seconds` gauge |
| `/metrics` | `barber_supabase_health` gauge |
| `/metrics` | `barber_supabase_query_seconds` gauge |
| `/metrics` | `barber_system_cpu_percent` gauge |
| `/metrics` | `barber_system_memory_percent` gauge |
| `/metrics` | `barber_system_disk_percent` gauge |

### Error Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/alerts` | Error alerts |
| `/metrics` | `barber_errors_total` counter |
| `/metrics` | `barber_errors_per_minute` gauge |

### Performance Metrics

| Endpoint | Description |
|----------|-------------|
| `/api/metrics` | Performance metrics |
| `/metrics` | `barber_api_request_seconds` histogram |
| `/metrics` | `barber_dashboard_load_seconds` histogram |

---

## Port Summary

| Service | Port | Endpoint |
|---------|------|----------|
| Prometheus Exporter | 9090 | `/metrics` |
| Alerting Engine | 9091 | `/metrics` (engine metrics) |
| API Server | 3000 | `/api/metrics/*`, `/api/alerts/*` |
| Dashboard | 5173 (dev) / 3000 (prod) | Frontend UI |

---

## Prometheus Query Examples

### Webhook Success Rate by Shop
```promql
barber_webhook_success_rate
```

### Average Cache Hit Rate
```promql
avg(barber_cache_hit_rate)
```

### Booking Conflicts Per Minute
```promql
rate(barber_booking_conflicts_total[5m]) * 60
```

### P95 Webhook Latency
```promql
histogram_quantile(0.95,
  sum(rate(barber_webhook_processing_seconds_bucket[5m])) by (le, shop_id)
)
```

### Error Rate
```promql
sum(rate(barber_errors_total[5m])) by (shop_id, error_type)
```

### Queue Depth
```promql
sum(barber_outbox_queue_depth) by (shop_id)
```

---

## Authentication Notes

For production deployments, consider adding authentication:

```nginx
# Example nginx config
location /api/metrics {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:3000;
}

location /metrics {
    allow 10.0.0.0/8;  # Internal network only
    deny all;
    proxy_pass http://localhost:9090;
}
```
