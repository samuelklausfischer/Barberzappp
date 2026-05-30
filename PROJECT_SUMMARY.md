# BarberZap Monorepo — Project Summary

## O que é
Monorepo do **BarberZap**, com dois produtos principais:

- **apps/site**: página de vendas + docs + automações auxiliares (antigo “Barberzap SITE”).
- **apps/saas**: aplicativo SaaS “BarberZap Pro” (gestão para barbearias) com UI em React/TS + backend Python + schema SQL.

## Entregáveis (apps)
- **Site (vendas/landing):** `apps/site/Barberzap-Dev/` (React/Vite/Tailwind)
- **SaaS (app):** `apps/saas/` (React + TS + Vite + Tailwind)

## Stack (alto nível)
- **Frontend (site):** React 18 + Vite + Tailwind + Framer Motion  
- **Frontend (saas):** React 19 + TypeScript + Vite + Tailwind (+ Recharts)
- **Backend (saas):** Python (ver `apps/saas/backend/` + `apps/saas/backend/requirements.txt`)
- **DB:** Supabase/Postgres (há muitos scripts SQL em `apps/saas/database/`)
- **WhatsApp:** Evolution API (pelo menos no desenho do site)
- **Orquestração:** n8n (referenciado no `apps/site/README.md`)

## Como rodar (atalho)
### Site (landing)
- Path: `apps/site/Barberzap-Dev/`
- Comandos:
  - `npm install`
  - `npm run dev`

### SaaS
- Path: `apps/saas/`
- Comandos:
  - `cp .env.example .env.local` (editar)
  - `npm install`
  - `npm run dev`

## Docs “fonte da verdade”
- SaaS: `apps/saas/docs/START_HERE.md`, `apps/saas/docs/MAP.md`, `apps/saas/docs/ARCHITECTURE.md`
- Site: `apps/site/README.md`, `apps/site/docs/`

## Status / Próximos passos (token-saver)
- Padronizar docs do monorepo (REPO_MAP/ARCHITECTURE/RUNBOOK/DECISIONS) e depois referenciar sempre esses arquivos nas conversas.
- Centralizar integrações e “truth sources” por app (env vars, portas, deploy) no RUNBOOK.
