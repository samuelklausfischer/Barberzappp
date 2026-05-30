# BarberZap Multi-Region Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Prerequisites Check

```bash
# Check required tools
python3 --version    # 3.9+
docker --version     # 20.10+
docker compose version
node --version       # 18+
terraform --version  # 1.3+
```

### Step 1: Environment Setup (2 minutes)

```bash
cd /root/barber/deploy

# Copy environment file
cp .env.example .env

# Edit with your values
nano .env
```

**Minimum required fields**:
```bash
SUPABASE_ACCESS_TOKEN=...
SUPABASE_KEY=...
CLOUDFLARE_API_TOKEN=...  (optional, for DNS)
```

### Step 2: Quick Docker Deploy (3 minutes)

```bash
# Deploy all regions
./deploy_multi_region.sh

# Monitor deployment
docker ps -a
```

**Wait for ~5 minutes** while containers start and health checks pass.

### Step 3: Verify Deployment (30 seconds)

```bash
# Check all regions healthy
python region_manager.py health

# Test API endpoints
curl https://localhost:8000/health
curl https://localhost:8000/regions
```

## 🌐 Test Multi-Region Routing

```bash
# Test with different IPs
python geolocation.py lookup 8.8.8.8        # US - should route to us-east
python geolocation.py lookup 200.147.202.222 # Brazil - should route to latam
python geolocation.py lookup 151.101.1.67   # Singapore - should route to asia-pacific
```

## 📦 What Was Deployed

| Region | Services | Health Endpoint |
|--------|----------|-----------------|
| LATAM (Primary) | Backend, Frontend, Redis x3, Workers x3 | `:8000/health` |
| US-East | Backend, Frontend, Redis x2, Workers x2 | `:8001/health` |
| US-West | Backend, Frontend, Redis, Workers | `:8002/health` |
| EU | Backend, Frontend, Redis, Workers | `:8003/health` |
| Asia-Pacific | Backend, Frontend, Redis, Workers | `:8004/health` |

Note: Port mapping in actual deployment uses routing, not sequential ports.

## 🔍 Monitoring

Access dashboards:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **HAProxy Stats**: http://localhost:8404

## 🔄 Update One Region Only

```bash
# Update only LATAM region
./deploy_multi_region.sh --regions latam --skip-build

# Health check only
./deploy_multi_region.sh --health-check-only
```

## 🛠️ Terraform AWS Deployment (Optional)

For full AWS infrastructure with Terraform:

```bash
cd terraform

# Initialize
terraform init

# Plan (preview)
terraform plan

# Apply (deploy)
terraform apply -auto-approve

# Get connection info
terraform output deployment_config
```

## ⚠️ Troubleshooting

### Container not starting?

```bash
# Check logs
docker logs backend-app

# Restart specific service
docker compose restart backend-app

# Full restart
docker compose restart
```

### Region unreachable?

```bash
# Check circuit breaker
curl http://localhost:9500/regions | jq

# Manual health check
curl https://api.barberzap.latam.com/health
```

### Redis connection issues?

```bash
# Check Redis
redis-cli -p 6379 ping

# Check cluster mode
redis-cli -p 6379 cluster nodes

# Check sentinel
redis-cli -p 26379 sentinel masters
```

## 📚 Next Steps

1. **Setup real Supabase projects** in each region
2. **Configure Cloudflare DNS** with your domain
3. **Setup SSL certificates** for production
4. **Configure alerting** in Prometheus/Grafana
5. Deploy to **production** with full Terraform

## 🔐 Security Checklist

Before production:

- [ ] Change all default passwords
- [ ] Use secure Supabase keys
- [ ] Configure firewall/security groups
- [ ] Enable HTTPS everywhere
- [ ] Setup rate limiting
- [ ] Configure WAF rules
- [ ] Enable audit logging

## 📞 Need Help?

- Full Documentation: `/root/barber/deploy/README.md`
- Summary: `/root/barber/deploy/MULTI_REGION_SUMMARY.md`
- Logs: `/root/barber/deploy/logs/`

---

**Deployment Status**: 🟢 Ready

To rollback or make changes, see the main README.
