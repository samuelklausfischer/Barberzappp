# BarberZap Monorepo — Architecture (High Level)

## Componentes

### 1) Site / Landing (apps/site)
- **Frontend landing**: `apps/site/Barberzap-Dev/` (React/Vite)
- **Tracking**: Meta Pixel (documentado no `apps/site/README.md`)
- **Checkout**: Cakto (via redirect + webhook de compra, segundo README)

### 2) Orquestração / Automação (apps/site)
- **n8n** como orquestrador (webhooks + flows)
- **WhatsApp** via Evolution API (entrada/saída de mensagens)
- **Supabase** como DB comum (leads, messages, configs)

### 3) SaaS / App (apps/saas)
- **Frontend**: React + TypeScript + Vite
- **Backend**: Python (`apps/saas/backend/`)
- **Database**: Postgres/Supabase com foco em:
  - RLS policies
  - optimistic locking
  - índices/performance
  - outbox pattern
  - full-text search

## Fluxos principais (texto)

### Fluxo A — Aquisição (site)
1. Usuário visita landing (events/pixel)
2. Usuário vai para checkout (Cakto)
3. Webhook de compra → n8n → registra/ativa tenant no Supabase

### Fluxo B — Atendimento WhatsApp
1. Mensagem chega via Evolution API → webhook (n8n e/ou backend)
2. Resolução de tenant + contexto → IA/roteamento
3. Registro no Supabase (CRM/messages)
4. Resposta retorna via Evolution API

### Fluxo C — Operação SaaS
1. Usuário loga no app (modelo de auth a consolidar entre Supabase Auth/JWT)
2. UI consome APIs backend + DB
3. Operações: agenda, clientes, serviços, financeiro, configurações

## Pontos que precisam ser padronizados (pra reduzir retrabalho)
- **Auth model único** (SaaS vs Dashboard/admin vs automações)
- **Fonte da verdade de integrações** (Evolution/n8n/Supabase/Cakto) em um RUNBOOK central
- **Multi-tenant**: convenção de tenant_id em todas camadas
