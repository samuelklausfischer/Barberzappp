# BarberZap Monitoring - Integration Examples

This guide provides practical examples for integrating the monitoring system into your BarberZap application.

## Table of Contents

- [Backend Integration](#backend-integration)
- [Frontend Integration](#frontend-integration)
- [Custom Metrics](#custom-metrics)
- [Custom Alerts](#custom-alerts)
- [Production Deployment](#production-deployment)

---

## Backend Integration

### 1. Integrating Prometheus Exporter

```python
# backend/api/webhooks.py
from fastapi import APIRouter, HTTPException, Request
import time
from metrics.prometheus_exporter import get_exporter, track_latency

router = APIRouter()

# Get exporter instance
exporter = get_exporter(shop_id="your-shop-id")

@router.post("/webhooks/{provider}")
async def receive_webhook(
    provider: str,
    request: Request,
):
    """Handle incoming webhooks with metrics"""
    start_time = time.time()
    success = True
    
    try:
        # Process webhook
        payload = await request.json()
        # ... your webhook processing logic ...
        
        latency = time.time() - start_time
        
        # Record successful webhook
        exporter.record_webhook(
            shop_id="your-shop-id",
            provider=provider,
            success=True,
            latency=latency,
        )
        
        return {"status": "ok"}
    
    except Exception as e:
        success = False
        latency = time.time() - start_time
        
        # Record failed webhook
        exporter.record_webhook(
            shop_id="your-shop-id",
            provider=provider,
            success=False,
            latency=latency,
        )
        
        # Record error
        exporter.record_error(
            shop_id="your-shop-id",
            error_type="WebhookError",
            severity="critical",
        )
        
        raise HTTPException(status_code=500, detail=str(e))
```

### 2. Using the Latency Decorator

```python
# backend/services/booking.py
from fastapi import APIRouter
from metrics.prometheus_exporter import get_exporter, track_latency
import time

router = APIRouter()
exporter = get_exporter(shop_id="your-shop-id")

@router.post("/bookings")
@track_latency(
    exporter=exporter,
    shop_id="your-shop-id",
    metric_type='api',
    endpoint='/api/bookings',
    method='POST',
)
async def create_booking(booking_data: dict):
    """Create a booking with automatic latency tracking"""
    # Your booking logic here
    # Latency is automatically recorded to Prometheus
    
    # Record booking metrics
    exporter.record_booking(
        shop_id="your-shop-id",
        status="confirmed",
    )
    
    return {"booking_id": "123"}
```

### 3. Cache Metrics Integration

```python
# backend/cache/cache_manager.py
from metrics.prometheus_exporter import get_exporter

exporter = get_exporter(shop_id="your-shop-id")

class CacheManager:
    def __init__(self):
        self.redis = None
    
    async def get(self, key: str, cache_type: str = "general"):
        """Get value from cache with metrics"""
        value = await self.redis.get(key)
        
        # Record cache access
        exporter.record_cache(
            shop_id="your-shop-id",
            cache_type=cache_type,
            hit=(value is not None),
        )
        
        return value
    
    async def set(self, key: str, value: str, ttl: int = 3600):
        """Set value in cache"""
        await self.redis.setex(key, ttl, value)
    
    async def update_stats(self):
        """Update cache hit rate metrics"""
        # Calculate hit rate from Redis stats
        hits = await self.redis.hget("barber:cache:stats:your-shop-id", "hits")
        misses = await self.redis.hget("barber:cache:stats:your-shop-id", "misses")
        
        if hits and misses:
            hit_count = int(hits)
            miss_count = int(misses)
            total = hit_count + miss_count
            
            if total > 0:
                hit_rate = (hit_count / total) * 100
                exporter.set_cache_hit_rate(
                    shop_id="your-shop-id",
                    cache_type="general",
                    rate=hit_rate,
                )
```

### 4. Realtime Connection Metrics

```python
# backend/realtime/manager.py
from metrics.prometheus_exporter import get_exporter

exporter = get_exporter(shop_id="your-shop-id")

class RealtimeManager:
    def __init__(self):
        self.connections = {}
    
    async def handle_connection(self, websocket, shop_id: str):
        """Handle new realtime connection"""
        self.connections[shop_id] = self.connections.get(shop_id, 0) + 1
        
        # Update connection count
        exporter.set_realtime_connections(
            shop_id=shop_id,
            count=len(self.connections),
        )
        
        try:
            await websocket.accept()
            while True:
                data = await websocket.receive_json()
                # ... handle message ...
                
                # Record message
                exporter.record_realtime_message(
                    shop_id=shop_id,
                    message_type="incoming",
                    message_id=data.get("id"),
                    latency=0.0,
                )
        finally:
            self.connections[shop_id] = self.connections.get(shop_id, 0) - 1
            exporter.set_realtime_connections(
                shop_id=shop_id,
                count=len(self.connections),
            )
```

### 5. Outbox Pattern Metrics

```python
# backend/outbox/processor.py
from metrics.prometheus_exporter import get_exporter
import time

exporter = get_exporter(shop_id="your-shop-id")

class OutboxProcessor:
    async def process_outbox(self):
        """Process outbox queue with metrics"""
        while True:
            try:
                # Get queue depth
                depth = await self.redis.llen(f"outbox:{self.shop_id}")
                exporter.set_outbox_depth(
                    shop_id=self.shop_id,
                    depth=depth,
                )
                
                # Process items
                items = await self.redis.lrange(f"outbox:{self.shop_id}", 0, 9)
                for item in items:
                    start_time = time.time()
                    
                    # Process item
                    await self.process_item(item)
                    
                    latency = time.time() - start_time
                    
                    # Record success
                    exporter.record_outbox_processed(
                        shop_id=self.shop_id,
                        status="success",
                        latency=latency,
                    )
                
            except Exception as e:
                exporter.record_outbox_processed(
                    shop_id=self.shop_id,
                    status="failed",
                    latency=0,
                )
                exporter.record_error(
                    shop_id=self.shop_id,
                    error_type="OutboxError",
                    severity="warning",
                )
            
            await asyncio.sleep(1)
```

---

## Frontend Integration

### 1. Using the Metrics Dashboard Component

```tsx
// src/app/monitoring/page.tsx
'use client';

import { MetricsDashboard } from '@/monitoring/MetricsDashboard';

export default function MonitoringPage() {
  return (
    <div>
      <MetricsDashboard
        apiEndpoint="/api/metrics"
        refreshInterval={15000} // 15 seconds
      />
    </div>
  );
}
```

### 2. Creating a Custom Metrics Hook

```tsx
// src/hooks/useMetrics.ts
import { useState, useEffect } from 'react';

interface MetricsData {
  webhook_success_rate: number;
  cache_hit_rate: number;
  realtime_connections: number;
  booking_conflicts: number;
  outbox_depth: number;
}

export function useMetrics(shopId?: string, interval = 15000) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (shopId) params.append('shop_id', shopId);
      
      const response = await fetch(`/api/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setMetrics(data.metrics[data.metrics.length - 1]);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, interval);
    return () => clearInterval(intervalId);
  }, [shopId, interval]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
```

### 3. Using the Custom Hook

```tsx
// src/components/ShopStats.tsx
'use client';

import { useMetrics } from '@/hooks/useMetrics';

interface ShopStatsProps {
  shopId: string;
}

export function ShopStats({ shopId }: ShopStatsProps) {
  const { metrics, loading, error } = useMetrics(shopId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading metrics</div>;
  if (!metrics) return <div>No metrics available</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold mb-2">Shop Statistics</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-sm text-gray-600">Success Rate</div>
          <div className="text-lg font-bold text-green-600">
            {metrics.webhook_success_rate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Cache Hit Rate</div>
          <div className="text-lg font-bold text-blue-600">
            {metrics.cache_hit_rate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Connections</div>
          <div className="text-lg font-bold">
            {metrics.realtime_connections}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Conflicts</div>
          <div className="text-lg font-bold text-red-600">
            {metrics.booking_conflicts}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Custom Metrics

### Adding Custom Metrics to Exporter

```python
# backend/metrics/custom.py
from prometheus_client import Counter, Gauge, Histogram
from metrics.prometheus_exporter import PrometheusExporter

class CustomMetrics:
    """Custom business metrics"""
    
    def __init__(self, exporter: PrometheusExporter):
        self.exporter = exporter
        self._register_custom_metrics()
    
    def _register_custom_metrics(self):
        """Register custom metrics with Prometheus"""
        # Custom business metrics
        self.customers_total = Counter(
            'barber_customers_total',
            'Total number of customers',
            ['shop_id', 'plan'],
        )
        
        self.revenue_total = Gauge(
            'barber_revenue_total',
            'Total revenue',
            ['shop_id'],
        )
        
        self.appointment_duration = Histogram(
            'barber_appointment_duration_minutes',
            'Appointment duration in minutes',
            ['shop_id', 'service'],
            buckets=[15, 30, 45, 60, 90, 120, 180],
        )
    
    def record_new_customer(self, shop_id: str, plan: str):
        """Record new customer signup"""
        self.customers_total.labels(
            shop_id=shop_id,
            plan=plan,
        ).inc()
    
    def record_revenue(self, shop_id: str, revenue: float):
        """Record revenue"""
        self.revenue_total.labels(shop_id=shop_id).set(revenue)
    
    def record_appointment(self, shop_id: str, service: str, duration: int):
        """Record appointment duration"""
        self.appointment_duration.labels(
            shop_id=shop_id,
            service=service,
        ).observe(duration)

# Usage
from metrics import get_exporter
from backend.metrics.custom import CustomMetrics

exporter = get_exporter(shop_id="your-shop-id")
custom = CustomMetrics(exporter)

# In your handlers
custom.record_new_customer("your-shop-id", "premium")
custom.record_revenue("your-shop-id", 1000.50)
custom.record_appointment("your-shop-id", "haircut", 30)
```

---

## Custom Alerts

### Adding a Custom Alert Rule

```yaml
# monitoring/alerting.yaml (add to alerts list)

- name: custom_revenue_drop
  display_name: Revenue Drop Alert
  description: Alert when revenue drops below threshold
  metric:
    name: barber_revenue_total
    type: gauge
    labels:
      shop_id: "*"
  thresholds:
    critical:
      value: 1000
      operator: "<"
    warning:
      value: 5000
      operator: "<"
  annotations:
    summary: "Revenue dropped for shop {{ $labels.shop_id }}"
    description: "Current revenue: ${{ $value }} (threshold: ${{ $threshold }})"
  channels: [slack, email]
  cooldown_seconds: 7200  # 2 hours
  enabled: true
```

### Custom Alert Evaluation Logic

```python
# monitoring/custom_evaluator.py
from datetime import datetime, timedelta

async def evaluate_custom_revenue_alert(alert_rule, exporter, store):
    """Custom evaluation for revenue alerts"""
    shop_ids = await store.get_all_shop_ids()
    
    for shop_id in shop_ids:
        # Get revenue for last 24 hours
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
        revenue_samples = await store.get_metrics(
            metric_type='custom',
            metric_name='revenue_total',
            start_time=start_time.timestamp(),
            end_time=end_time.timestamp(),
        )
        
        if revenue_samples:
            current_revenue = revenue_samples[-1].value
            yesterday_revenue = revenue_samples[0].value
            
            # Calculate drop percentage
            drop_percent = ((yesterday_revenue - current_revenue) / yesterday_revenue) * 100
            
            if drop_percent > alert_rule.threshold:
                # Fire alert
                await fire_alert(
                    rule=alert_rule,
                    shop_id=shop_id,
                    value=current_revenue,
                    message=f"Revenue dropped {drop_percent:.1f}% in the last 24 hours",
                )
```

---

## Production Deployment

### Docker Compose Example

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # Metrics Collector
  metrics-collector:
    build: ./backend
    command: python -m metrics.metrics_collector --redis-url redis://redis:6379
    environment:
      - REDIS_URL=redis://redis:6379
      - SHOP_ID=prod
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - monitoring

  # Prometheus Exporter
  prometheus-exporter:
    build: ./backend
    command: python -m metrics.prometheus_exporter --port 9090 --shop-id prod
    ports:
      - "9090:9090"
    environment:
      - PORT=9090
      - SHOP_ID=prod
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - monitoring

  # Alerting Engine
  alerting-engine:
    build: .
    command: python -m monitoring.alerting_engine --config monitoring/alerting.yaml
    environment:
      - PROMETHEUS_URL=http://prometheus-exporter:9090
      - METRICS_PORT=9091
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
    volumes:
      - ./monitoring:/monitoring
    depends_on:
      - prometheus-exporter
    restart: unless-stopped
    networks:
      - monitoring

  # Nginx (for external access)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - prometheus-exporter
    restart: unless-stopped
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream metrics {
        server prometheus-exporter:9090;
    }

    # Metrics endpoint (restricted)
    server {
        listen 80;
        server_name metrics.barberzap.com;

        location /metrics {
            allow 10.0.0.0/8;  # Internal network
            deny all;
            
            proxy_pass http://metrics;
            proxy_set_header Host $host;
        }

        # Health check
        location /health {
            proxy_pass http://metrics;
        }
    }
}
```

### Monitoring Stack with Prometheus & Grafana

```yaml
# docker-compose.monitoring-full.yml
version: '3.8'

services:
  # BarberZap services
  barber-metrics:
    image: barberzap/backend
    command: python -m metrics.prometheus_exporter --port 9090
    expose:
      - "9090"
    networks:
      - monitoring

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    depends_on:
      - barber-metrics
    networks:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SERVER_ROOT_URL=http://localhost:3000
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'barberzap-metrics'
    static_configs:
      - targets: ['barber-metrics:9090']
        labels:
          app: 'barberzap'
          env: 'production'

  - job_name: 'barber-alerting'
    static_configs:
      - targets: ['barber-alerting:9091']
        labels:
          app: 'barber-alerting'
```

---

## Environment Variables

Create a `.env.monitoring` file:

```env
# Redis
REDIS_URL=redis://localhost:6379

# Monitoring Configuration
METRICS_PORT=9090
METRICS_ENABLED=true
ALERTING_CONFIG=monitoring/alerting.yaml
ALERTING_ENABLED=true
SHOP_ID=your-shop-id

# Notification Channels
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
WHATSAPP_API_URL=https://api.whatsapp.com/send
WHATSAPP_API_TOKEN=your-token
PAGERDUTY_API_KEY=your-pagerduty-api-key
PAGERDUTY_SERVICE_KEY=your-service-key

# Time Windows
METRICS_RETENTION_DAYS=30
ALERT_RETENTION_DAYS=30
```

---

## Testing Integration

### Unit Test Example

```python
# tests/test_metrics.py
import pytest
from metrics.prometheus_exporter import PrometheusExporter
from prometheus_client.parser import text_string_to_metric_families

def test_exporter_registers_metrics():
    """Test that exporter registers all required metrics"""
    exporter = PrometheusExporter(shop_id="test-shop")
    
    # Get metrics in Prometheus format
    metrics = exporter.get_metrics().decode('utf-8')
    
    # Check for required metrics
    assert 'barber_webhook_total' in metrics
    assert 'barber_cache_hit_rate' in metrics
    assert 'barber_realtime_connections' in metrics
    assert 'barber_booking_conflicts_total' in metrics

def test_metric_recording():
    """Test that metrics are recorded correctly"""
    exporter = PrometheusExporter(shop_id="test-shop")
    
    # Record some metrics
    exporter.record_webhook("test-shop", "whatsapp", True, 0.123)
    exporter.record_cache("test-shop", "booking", True)
    exporter.set_realtime_connections("test-shop", 10)
    
    # Get metrics
    metrics = exporter.get_metrics().decode('utf-8')
    
    # Verify metrics are present
    assert 'barber_webhook_total{shop_id="test-shop"' in metrics
    assert 'barber_cache_hits_total{shop_id="test-shop"' in metrics

@pytest.mark.asyncio
async def test_collector_metrics():
    """Test metrics collector"""
    from metrics.metrics_collector import MetricsCollector
    
    collector = MetricsCollector(
        redis_url="redis://localhost:6379",
        prometheus_exporter=None,
    )
    
    # Collect system metrics
    await collector.collect_system_metrics()
    
    # Get dashboard summary
    summary = await collector.get_dashboard_summary()
    
    # Verify structure
    assert 'timestamp' in summary
    assert 'system' in summary
    assert 'cpu' in summary['system']
    assert 'memory' in summary['system']
```

### Integration Test Example

```python
# tests/integration/test_monitoring.py
import pytest
import httpx

@pytest.mark.integration
async def test_metrics_endpoint():
    """Test that metrics endpoint responds correctly"""
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:9090/metrics")
        
        assert response.status_code == 200
        metrics = response.text
        
        # Verify some key metrics
        assert 'barber_webhook_total' in metrics
        assert 'barber_cache_hit_rate' in metrics

@pytest.mark.integration
async def test_dashboard_api():
    """Test dashboard API endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:3000/api/metrics",
            params={"window": "1h"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'metrics' in data
        assert 'alerts' in data

@pytest.mark.integration
async def test_alerts_api():
    """Test alerts API endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:3000/api/alerts")
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'alerts' in data
        assert 'total' in data
```

---

## Quick Start Commands

```bash
# Install dependencies
cd monitoring
make install

# Start all monitoring services
make start

# Check status
make status

# View logs
make logs

# View metrics
make metrics

# Check health
make health

# Stop services
make stop

# Full restart
make restart
```

---

## Troubleshooting

### Metrics Not Appearing

```bash
# Check if Prometheus exporter is running
curl http://localhost:9090/metrics

# Check logs
make logs-exporter

# Verify Redis connection
redis-cli ping

# Check metrics in Redis
redis-cli keys "barber:metrics:*"
```

### Alerts Not Firing

```bash
# Check alerting engine logs
make logs-alerting

# Verify alert configuration
python -c "import yaml; print(yaml.safe_load(open('monitoring/alerting.yaml')))"

# Test Prometheus query
curl "http://localhost:9090/api/v1/query?query=barber_webhook_success_rate"
```

### Dashboard Not Loading

```bash
# Check API endpoint
curl http://localhost:3000/api/metrics

# Verify CORS settings
# Check browser console for errors

# Restart dashboard dev server
cd ../../
npm run dev
```
