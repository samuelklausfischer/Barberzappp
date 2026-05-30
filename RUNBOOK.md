# BarberZap Monorepo — Runbook (Ops)

## Paths
- Monorepo root: `/root/barberzap-monorepo`
- Site: `apps/site`
- SaaS: `apps/saas`

## Dev — Site (Landing)
- Path: `apps/site/Barberzap-Dev`
- Commands:
  - `npm install`
  - `npm run dev`
  - `npm run build`

## Dev — SaaS
- Path: `apps/saas`
- Prereq: Node 18+
- Commands:
  - `cp .env.example .env.local`
  - `npm install`
  - `npm run dev` (porta indicada no README: http://localhost:3000)

## Backend (SaaS)
- Path: `apps/saas/backend`
- Python deps: `apps/saas/backend/requirements.txt`
- (TODO) Padronizar comando de run (uvicorn/fastapi) neste arquivo quando confirmarmos o entrypoint.

## Infra / Deploy
- Site docker: `apps/site/infrastructure/` (Dockerfile + docker-compose)
- SaaS deploy: `apps/saas/deploy/` (inclui multi-region)

## Env vars (onde procurar)
- Site: `apps/site/.env.example`
- SaaS: `apps/saas/.env.example` → `.env.local`

## Troubleshooting rápido
- Se algo não sobe, checar primeiro:
  - `package.json` do app correspondente
  - `.env.local` / `.env` faltando
  - portas em uso
  - dependências (node_modules) inconsistentes
