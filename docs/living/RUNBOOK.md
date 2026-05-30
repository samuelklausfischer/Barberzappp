# BarberZap — Runbook (Living)

Este runbook é **operacional** (como rodar / quais portas / quais env vars). Para docs de produto e arquitetura, veja `docs/` e os READMEs dentro de cada app.

---

## TL;DR (local dev)

### Site (landing) — `apps/site/Barberzap-Dev` (Vite)
```bash
cd apps/site/Barberzap-Dev
npm install
npm run dev
```
- Porta (confirmada): **5173** (`apps/site/Barberzap-Dev/vite.config.js`, strictPort=true).

### SaaS (frontend) — `apps/saas` (Vite)
```bash
cd apps/saas
cp .env.example .env.local
# edite .env.local
npm install
npm run dev
```
- Porta (confirmada): **3000** (`apps/saas/vite.config.ts`).

### Site (backend integração Supabase↔GitHub) — Docker
```bash
cd apps/site/infrastructure
cp ../.env.example .env
# edite .env
docker compose up --build
```
- Porta exposta: **8000**

---

## Apps e serviços

### 1) Site — Landing (frontend)
**Path:** `apps/site/Barberzap-Dev/`

**Scripts (package.json):**
- `npm run dev` — dev server
- `npm run build` — build
- `npm run preview` — preview
- `npm run lint` — lint

**Portas:**
- Vite dev server: **5173** (`apps/site/Barberzap-Dev/vite.config.js`, strictPort=true)
- Vite preview: normalmente **4173**

**Env vars:** (não há `.env.example` específico dentro de `Barberzap-Dev/` neste repo; quando necessário, use envs padrão do Vite `VITE_*`.)

---

### 2) Site — Backend de integração Supabase ↔ GitHub
**Objetivo:** serviço Python (Uvicorn/FastAPI) usado para integração e webhooks.

**Path:** `apps/site/infrastructure/`

**Como rodar (Docker Compose):**
```bash
cd apps/site/infrastructure
cp ../.env.example .env
# edite .env
docker compose up --build
```

**Portas:**
- API: **8000** (mapeado `8000:8000`)
- Healthcheck: `GET http://localhost:8000/health`

**Env vars (nomes apenas):** (ver template `apps/site/.env.example`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET_KEY`
- `ENCRYPTION_KEY`
- `WEBHOOK_SECRET`

**Artefatos relevantes:**
- `apps/site/infrastructure/Dockerfile` (Python 3.11, expõe 8000)
- `apps/site/infrastructure/docker-compose.yml`

---

### 3) SaaS — Frontend (Vite)
**Path:** `apps/saas/`

**Como rodar:**
```bash
cd apps/saas
cp .env.example .env.local
# edite .env.local
npm install
npm run dev
```

**Scripts (package.json):**
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`

**Portas:**
- Vite dev server: **3000** (`apps/saas/vite.config.ts`)
- Vite preview: normalmente **4173**

**Env vars (nomes apenas):** (ver template `apps/saas/.env.example`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Load tests (k6):**
- Ex.: `npm run test:load:ci`
- Ex.: `npm run test:load:all`

---

### 4) SaaS — Workers/Jobs (BullMQ)
**Path:** `apps/saas/workers/jobs/`

> Observação: este diretório tem `.env.example` próprio para jobs/queues/WhatsApp.

**Env vars (nomes apenas):** (ver `apps/saas/workers/jobs/.env.example`)
- `REDIS_URL`
- `WHATSAPP_API_KEY`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `WORKER_CONCURRENCY_NOTIFICATIONS`
- `WORKER_CONCURRENCY_CRM`
- `WORKER_CONCURRENCY_WHATSAPP`
- `ENABLE_AUTO_REMINDERS`
- `ENABLE_VERBOSE_LOGGING`
- `FAILED_JOBS_ALERT_THRESHOLD`
- `JOB_TTL_COMPLETED`
- `JOB_TTL_FAILED`
- `RETRY_BASE_DELAY`

---

### 5) SaaS — Cache (Redis client/config)
**Path:** `apps/saas/backend/cache/`

**Env vars (nomes apenas):** (ver `apps/saas/backend/cache/.env.example`)
- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `REDIS_SSL`
- `REDIS_SSL_CERT_REQS`
- `REDIS_MAX_CONNECTIONS`
- `REDIS_SOCKET_TIMEOUT`
- `REDIS_SOCKET_CONNECT_TIMEOUT`
- `REDIS_RETRY_ON_TIMEOUT`
- `REDIS_HEALTH_CHECK_INTERVAL`
- `CACHE_TTL_TENANT`
- `CACHE_TTL_SERVICES`
- `CACHE_TTL_APPOINTMENTS`
- `CACHE_TTL_CLIENT`
- `CACHE_TTL_CLIENT_STATS`
- `CACHE_TTL_SESSION`
- `REDIS_MAX_RETRIES`
- `REDIS_RETRY_BASE_DELAY`
- `REDIS_RETRY_MAX_DELAY`
- `REDIS_RETRY_EXP_BASE`
- `CACHE_METRICS_ENABLED`
- `CACHE_METRICS_SAMPLE_RATE`
- `CACHE_INVALIDATION_CHANNEL`
- `CACHE_PUBSUB_ENABLED`
- `SUPABASE_WEBHOOK_PATH`
- `CACHE_LOG_LEVEL`
- `ENV`
- `DEBUG`

---

## Deploy / Docker (SaaS multi-region)

### Docker Compose multi-region
**Path:** `apps/saas/deploy/docker-compose.multi-region.yml`

**Serviços e portas expostas (host → container):**
- `nginx-lb`: **80**, **443**
- `haproxy-lb`: **8404**, **1936**
- Redis LATAM: **6379**, **16379**
- Redis replica LATAM: **6380**, **16380**
- Redis sentinel LATAM: **26379**
- Redis US-East: **7379**, **17379**
- Redis US-West: **8379**
- Redis EU: **9379**
- Redis APAC: **10379**
- `backend-app`: **8000** (API), **8001** (metrics)
- `frontend-app`: **3000** (servindo via nginx: porta 80 dentro do container)
- `prometheus`: **9090**
- `grafana`: **3001** (host) → **3000** (container)
- `loki`: **3100**
- `redis-exporter`: **9121**
- `region-manager`: **9500**

### Variáveis de ambiente do deploy
**Template:** `apps/saas/deploy/.env.example`

**Env vars (nomes apenas):**
- App/build/região:
  - `APP_NAME`, `ENVIRONMENT`, `BUILD_TAG`, `REGION`
- Supabase:
  - `SUPABASE_ACCESS_TOKEN`, `SUPABASE_ORGANIZATION_ID`
  - `SUPABASE_URL_LATAM`, `SUPABASE_KEY_LATAM`, `SUPABASE_JWT_SECRET_LATAM`
  - `SUPABASE_URL_USEAST`, `SUPABASE_KEY_USEAST`
  - `SUPABASE_URL_USWEST`, `SUPABASE_KEY_USWEST`
  - `SUPABASE_URL_EU`, `SUPABASE_KEY_EU`
  - `SUPABASE_URL_AP`, `SUPABASE_KEY_AP`
  - `SUPABASE_KEY`, `SUPABASE_JWT_SECRET`
- Redis:
  - `REDIS_HOST_LATAM`, `REDIS_PORT_LATAM`, `REDIS_PASSWORD_LATAM`
  - `REDIS_HOST_USWEST`, `REDIS_PORT_USWEST`, `REDIS_PASSWORD_USWEST`
  - `REDIS_HOST_EU`, `REDIS_PORT_EU`, `REDIS_PASSWORD_EU`
  - `REDIS_HOST_AP`, `REDIS_PORT_AP`, `REDIS_PASSWORD_AP`
  - `REDIS_MAX_CONNECTIONS`, `REDIS_SOCKET_TIMEOUT`, `REDIS_HEALTH_CHECK_INTERVAL`, `REDIS_SSL`, `RETRY_ON_TIMEOUT`
  - `REDIS_SENTINEL_HOST`, `REDIS_SENTINEL_PORT`, `REDIS_SENTINEL_MASTER`
- Registry/AWS:
  - `DOCKER_REGISTRY`, `DOCKER_USERNAME`, `DOCKER_PASSWORD`
  - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Cloudflare:
  - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_TUNNEL_TOKEN`
- Upstreams:
  - `UPSTREAM_LATAM`, `UPSTREAM_USEAST`, `UPSTREAM_USWEST`, `UPSTREAM_EU`, `UPSTREAM_AP`
- Observability:
  - `PROMETHEUS_ENABLED`, `PROMETHEUS_RETENTION`
  - `GRAFANA_PASSWORD`, `GRAFANA_ADMIN_USER`
  - `LOKI_ENABLED`
  - `SENTRY_DSN`, `SENTRY_ENVIRONMENT`
- Feature flags / health:
  - `ENABLE_REGION_ROUTING`, `ENABLE_CIRCUIT_BREAKER`, `CIRCUIT_BREAKER_THRESHOLD`, `CIRCUIT_BREAKER_TIMEOUT`
  - `ENABLE_AUTO_FAILOVER`, `HEALTH_CHECK_ENABLED`, `HEALTH_CHECK_INTERVAL`
- Worker/api/frontend settings:
  - `WORKER_CONCURRENCY`, `WORKER_QUEUE`
  - `API_PORT`, `API_HOST`, `WORKERS`, `LOG_LEVEL`
  - `VITE_APP_URL`, `VITE_API_URL`, `VITE_WS_URL`, `VITE_REALTIME_URL`, `VITE_ENABLE_REGION_DETECTION`
- Backup/security/limits:
  - `BACKUP_ENABLED`, `BACKUP_RETENTION_DAYS`, `BACKUP_SCHEDULE`
  - `CORS_ORIGINS`, `CORS_ALLOW_CREDENTIALS`
  - `RATE_LIMIT_ENABLED`, `RATE_LIMIT_PER_MINUTE`
- Notificações/analytics/email:
  - `ERROR_NOTIFICATION_WEBHOOK`, `ERROR_NOTIFICATION_EMAIL`
  - `GOOGLE_ANALYTICS_ID`, `POSTHOG_API_KEY`, `POSTHOG_HOST`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- Storage:
  - `STORAGE_TYPE`

### Script de deploy
**Path:** `apps/saas/deploy/deploy_multi_region.sh`

**Uso:**
```bash
cd apps/saas/deploy
cp .env.example .env
# edite .env
bash deploy_multi_region.sh --help

# Exemplo: dry run
bash deploy_multi_region.sh --dry-run --verbose
```

---

## Troubleshooting rápido

- **Porta ocupada (Vite):** tente `npm run dev -- --port 5174`.
- **Healthcheck falhando (backend integração site):** `curl -f http://localhost:8000/health`.
- **Docker compose multi-region pesado:** comece subindo só o necessário (ex.: backend + redis + frontend) e valide healthchecks.
