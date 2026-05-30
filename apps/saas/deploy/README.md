# BarberZap Multi-Region Deployment

## 🌍 Overview

This repository contains the complete multi-region deployment infrastructure for BarberZap, enabling global scalability with low-latency access across multiple geographic regions.

## 📋 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare / CloudFront                   │
│                     (Global CDN + WAF + DNS)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │  LATAM   │    │ US-West  │    │   EU     │
        │ (Primary)│    │ (West US)│    │ (Europe) │
        └──────────┘    └──────────┘    └──────────┘
              │               │               │
        ┌─────┴─────┐   ┌───┴────┐   ┌────┴────┐
        │  Supabase │   │ Supabase│  │ Supabase│
        │ (Primary) │   │(Replica)│  │(Replica)│
        └───────────┘   └─────────┘  └─────────┘
              │               │               │
        ┌─────┴─────┐   ┌───┴────┐   ┌────┴────┐
        │  Redis    │   │ Redis  │  │   Redis │
        │  Cluster  │   │ Cluster│  │ Cluster │
        └───────────┘   └─────────┘  └─────────┘
        ┌─────┴─────┐   ┌───┴────┐   ┌────┴────┐
        │   ECS     │   │   ECS  │  │   ECS   │
        │  Cluster  │   │ Cluster│  │ Cluster │
        └───────────┘   └─────────┘  └─────────┘
```

## 🗺️ Regions

| Region ID | Name | AWS Region | Supabase | Primary |
|-----------|------|------------|----------|---------|
| `latam` | Latin America | us-east-1 | iad | ✅ |
| `us-east` | US East | us-east-1 | iad | - |
| `us-west` | US West | us-west-2 | sfo | - |
| `eu-central` | Europe Central | eu-central-1 | fra | - |
| `asia-pacific` | Asia Pacific | ap-northeast-1 | tok | - |

## 📁 Project Structure

```
barber/
├── deploy/
│   ├── region_manager.py           # Region management logic
│   ├── docker-compose.multi-region.yml  # Docker stack definitions
│   ├── supabase_regions.py         # Supabase multi-region management
│   ├── redis_cluster.py            # Redis cluster setup
│   ├── geolocation.py              # GeoIP utilities
│   ├── deploy_multi_region.sh      # Deployment automation script
│   ├── terraform/                  # Infrastructure as Code
│   │   ├── main.tf                 # Main Terraform configuration
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── modules/
│   │       ├── vpc/                # VPC module
│   │       ├── redis_cluster/      # Redis module
│   │       ├── ecs/                # ECS module
│   │       └── supabase/           # Supabase module
│   ├── config/
│   │   ├── redis/
│   │   ├── nginx/
│   │   ├── haproxy/
│   │   └── prometheus/
│   └── logs/
├── backend/
│   └── middleware/
│       └── region_routing.py       # Region routing middleware
└── src/
    └── region/
        └── RegionProvider.tsx      # Frontend region detection
```

## 🔑 Key Features

### 1. **Automatic Region Detection**
- **Backend**: GeoIP detection using ip-api.com, ipapi.co, ipinfo.io
- **Frontend**: Timezone-based detection with manual override option
- **Fallback**: Country-to-region mapping

### 2. **Latency-Based Routing**
- Real-time latency measurement to all regions
- Automatic redirection to nearest healthy region
- Circuit breaker pattern for failed regions
- Progressive fallback chain

### 3. **Multi-Region Database**
- **Supabase**: Primary in LATAM, read replicas in other regions
- **Redis**: Cross-region replication with Global Datastore
- **Automatic failover** with Sentinel for Redis
- **Backup sync** between regions

### 4. **Intelligent Load Balancing**
- **Latency-based**: Routes to lowest-latency healthy region
- **Round-robin**: Distributes load evenly
- **Weighted**: Prioritizes regions by weight
- **Random**: Simple randomized distribution

### 5. **Health Monitoring**
- Active health checks every 30 seconds
- Circuit breaker opens after 5 consecutive failures
- Auto-recovery after 60 seconds timeout
- Prometheus + Grafana dashboard

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.9+
- Node.js 18+
- Terraform 1.3+
- AWS CLI configured
- Supabase account
- (Optional) Cloudflare account

### 1. Clone Repository

```bash
git clone https://github.com/barberzap/barber.git
cd barber/deploy
```

### 2. Configure Environment

```bash
# Create environment file
cp .env.example .env

# Edit with your values
nano .env
```

Required environment variables:
```bash
# Supabase
SUPABASE_ACCESS_TOKEN=your_token
SUPABASE_ORGANIZATION_ID=org_id
SUPABASE_URL_LATAM=https://xxx.supabase.co
SUPABASE_KEY=anon_key

# Registry
DOCKER_REGISTRY=docker.io/yourname
DOCKER_USERNAME=username
DOCKER_PASSWORD=password

# Cloudflare (optional)
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone
```

### 3. Deploy with Docker Compose

```bash
# Deploy all regions
./deploy_multi_region.sh

# Deploy specific regions only
./deploy_multi_region.sh --regions latam,us-east

# Dry run
./deploy_multi_region.sh --dry-run --verbose

# Health check only
./deploy_multi_region.sh --health-check-only
```

### 4. Deploy with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan \
  -var="aws_region=us-east-1" \
  -var="environment=production"

# Apply infrastructure
terraform apply \
  -var="aws_region=us-east-1" \
  -var="env=production"

# Get outputs
terraform output deployment_config > ../config/terraform_outputs.json
```

### 5. Verify Deployment

```bash
# Check region health
python region_manager.py health

# Check Supabase regions
python supabase_regions.py projects

# Check Redis cluster
python redis_cluster.py

# Test GeoIP
python geolocation.py lookup 8.8.8.8
```

## 🔧 Configuration

### Region Manager

Edit `deploy/config/region_config.json`:

```json
{
  "regions": [
    {
      "id": "latam",
      "name": "Latin America",
      "code": "latam",
      "supabase_region": "iad",
      "datacenter": "us-east-1",
      "primary": true,
      "latitude": -14.235,
      "longitude": -51.925,
      "api_url": "https://api.barberzap.latam.com",
      "ws_url": "wss://ws.barberzap.latam.com"
    }
  ]
}
```

### Load Balancer (Nginx)

Edit `deploy/nginx/nginx.conf` for custom routing rules.

### Redis Cluster

Edit `deploy/redis_cluster.py` to configure sharding and replication.

## 📊 Monitoring

### Prometheus Metrics

- `region_request_count_total`: Total requests per region
- `region_latency_seconds`: Request latency per region
- `region_error_rate`: Error rate per region
- `region_circuit_breaker_state`: Circuit breaker state (0/1)

### Grafana Dashboards

Import dashboards from `deploy/config/grafana/dashboards/`:
- `region-overview.json`: Overview of all regions
- `latency-matrix.json`: Latency matrix heatmap
- `circuit-breaker.json`: Circuit breaker status

### Health Check Endpoints

- `/health?region=latam`: Check specific region
- `/regions`: List all regions and status
- `/latency`: Latency measurements
- `/routing`: Current routing state

## 🔄 Rollback Procedure

### Automatic Rollback

The deployment script will automatically rollback if health checks fail:

```bash
ROLLBACK_ON_FAILURE=true ./deploy_multi_region.sh
```

### Manual Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.multi-region.yml down

# Restore previous version
curl -X POST http://localhost:9500/rollback \
  -H "Content-Type: application/json" \
  -d '{"region": "latam", "version": "previous"}'
```

### Terraform Rollback

```bash
terraform plan -out=tfplan
terraform apply "tfplan"
# Or use Terraform's state manipulation
terraform state mv module.old module.new
```

## 🧪 Testing

### Unit Tests

```bash
# Python
pytest deploy/tests/

# Frontend
npm test -- src/region/
```

### Integration Tests

```bash
# Test region detection
python deploy/tests/test_region_manager.py

# Test geolocation
python deploy/tests/test_geolocation.py

# Test latency routing
python deploy/tests/test_routing.py
```

### Load Testing

```bash
# Using locust
locust -f deploy/tests/locustfile.py \
  --host=https://api.barberzap.com
```

## 📈 Performance Optimization

### Best Practices

1. **Use read replicas** for reads to distribute load
2. **Enable connection pooling** for database
3. **Configure Redis caching** with appropriate TTL
4. **Use CDN** for static assets
5. **Enable gzip compression** on load balancer
6. **Configure HTTP/2** for better multiplexing

### Latency Tips

- Deploy regional edge servers in major cities
- Use Cloudflare Workers for compute at edge
- Cache API responses at CDN level
- Pre-connect to nearest region

## 🔒 Security

### Network Security

- All traffic over TLS (HTTPS/WSS)
- VPC with private subnets only
- Security groups restrict access
- WAF rules for common attacks

### Database Security

- Connection strings in secrets manager
- Row-level security (RLS) in Supabase
- Encrypted backups
- Rotate credentials regularly

### Application Security

- JWT-based authentication
- Rate limiting per region
- CORS properly configured
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

**Region not reachable:**
```bash
# Check health
curl https://api.barberzap.latam.com/health

# Check logs
docker logs backend-app

# Check circuit breaker
curl http://localhost:9500/regions | jq
```

**Redis connection issues:**
```bash
# Check Redis status
redis-cli -p 6379 ping

# Check sentinel
redis-cli -p 26379 sentinel masters

# Check replication
redis-cli -p 6379 info replication
```

**Supabase connection issues:**
```bash
# Check project status
python supabase_regions.py projects

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

## 📞 Support

- **Documentation**: https://docs.barberzap.com
- **Issues**: https://github.com/barberzap/barber/issues
- **Email**: support@barberzap.com
- **Slack**: #barberzap-dev

## 📄 License

Copyright © 2026 BarberZap. All rights reserved.

---

**Built with ❤️ for global accessibility**
