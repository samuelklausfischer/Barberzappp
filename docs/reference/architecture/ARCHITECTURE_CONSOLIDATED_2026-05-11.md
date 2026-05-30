# 🏗️ BarberZap - Arquitetura Consolidada

**Versão:** 1.0.0  
**Data:** 2026-05-11  
**Status:** ✅ Consolidado (draft)

> Nota: Este documento é detalhado (não-living). A versão curta fica em `docs/living/ARCHITECTURE.md`.

## Visão Geral
O BarberZap é um sistema SaaS multi-tenant para gestão de barbearias com integração WhatsApp, composto por:
- Apps/Site: interface pública
- Apps/SaaS: dashboard admin
- Backend: API FastAPI + workers
- Database: Supabase PostgreSQL + Realtime
- Integrações: Evolution API, n8n, Cakto

## Stack (proposta)
- Frontend: React + Tailwind
- Backend: FastAPI (Python)
- DB: Supabase Postgres
- Realtime: Supabase Realtime
- Cache: Redis
- Queue: BullMQ
- WhatsApp: Evolution API
- Automações: n8n
- Pagamentos: Cakto
- AI/ML: OpenAI API

## Diagrama (alto nível)
(Conteúdo longo — ver versões futuras com diagramas por fluxo.)

## Autenticação
- Supabase Auth como base (JWT access/refresh)
- RLS para isolamento por tenant
- Roles: client/admin/employee/super_admin

## Multi-tenancy
- `shop_id` como tenant_id
- RLS policies por tabela

## Integrações
- Supabase: REST + Realtime + Storage + Auth
- Evolution API: WhatsApp inbound/outbound
- n8n: workflows
- Cakto: pagamentos

## Fluxos principais
- Aquisição via site → checkout → webhook
- Atendimento WhatsApp → webhook → contexto → resposta
- Operação SaaS → login → dashboard → APIs/DB

## Ownership por componente
- Site: apps/site
- SaaS: apps/saas
- Backend: apps/saas/backend (e/ou automações em apps/site/barberzap_python)
- DB: apps/saas/database
- Automações: n8n + scripts
