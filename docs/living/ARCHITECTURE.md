# BarberZap — Architecture (Living)

Versão curta (token-saver). Para o documento detalhado:  
- `docs/reference/architecture/ARCHITECTURE_CONSOLIDATED_2026-05-11.md`

## Componentes
- **Site (vendas/público):** `apps/site/` (landing + docs + automações auxiliares)
- **SaaS (BarberZap Pro):** `apps/saas/` (dashboard/admin)
- **Backend:** `apps/saas/backend/` (Python) + (algumas automações em `apps/site/barberzap_python/`)
- **Database:** Supabase/Postgres (SQL em `apps/saas/database/`)

## Integrações externas (esperadas)
- **WhatsApp:** Evolution API
- **Workflows:** n8n
- **Pagamentos:** Cakto
- **IA:** OpenAI API (ou provider equivalente)
- **Cache/Queue (se usado):** Redis + BullMQ

## Padrões de arquitetura (decidir e padronizar)
- **Auth:** preferencialmente Supabase Auth + JWT
- **Multi-tenant:** `shop_id` como tenant_id em todas as tabelas e requests
- **Isolamento:** RLS no Supabase

## Fluxos principais
1) **Aquisição:** landing → checkout → webhook → cria/ativa tenant
2) **WhatsApp:** Evolution → webhook/orquestração → DB → resposta
3) **Operação SaaS:** login → dashboard → APIs/DB → realtime (quando aplicável)

## Fonte da verdade por assunto
- Site: `docs/apps/site/INDEX.md`
- SaaS: `docs/apps/saas/INDEX.md`
- Governança/segurança/agentes: `docs/reference/INDEX.md`
