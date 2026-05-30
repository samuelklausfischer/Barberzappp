# BarberZap Monorepo — Repo Map

## Top-level

- `apps/`
  - `apps/site/` — página de vendas/landing + docs/automations auxiliares
  - `apps/saas/` — BarberZap Pro (SaaS)
- `teams/` — specs de times (ex.: `teams/barberzap-v1.json`)
- `subagents/definitions/` — definições JSON dos sub-agentes do projeto
- `skills/custom/` — skills do projeto (sub-agentes + utilitárias)

## apps/site (vendas)

Principais áreas:
- `apps/site/Barberzap-Dev/` — frontend React/Vite/Tailwind
- `apps/site/docs/` — documentação e relatórios
- `apps/site/infrastructure/` — Dockerfile/docker-compose/GitHub Actions
- `apps/site/barberzap_python/` — automações Python (API/webhooks/CRM/prospecção)
- `apps/site/data/` — CSVs/listas de leads
- `apps/site/scripts/` — scripts utilitários (import, visitor tracking, schema supabase)

## apps/saas (SaaS)

Principais áreas:
- `apps/saas/src/` — frontend principal (React/TS)
- `apps/saas/backend/` — backend Python (FastAPI/etc)
- `apps/saas/database/` — SQL migrations/policies/indexes/RLS
- `apps/saas/docs/` — docs do produto (START_HERE, MAP, ARCHITECTURE, RUNBOOKS)
- `apps/saas/deploy/` — deploy scripts e multi-region
- `apps/saas/tests/` — unit/integration/e2e/load
- `apps/saas/monitoring/` — alerting/metrics

## Team automation
- `teams/barberzap-v1.json` → fonte para gerar:
  - `subagents/definitions/barberzap/*.json`
  - `skills/custom/barberzap-*/SKILL.md`

