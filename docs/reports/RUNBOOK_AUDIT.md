# RUNBOOK_AUDIT — BarberZap (docs vs repo)

Data: 2026-05-11

## Escopo checado
- `apps/site/Barberzap-Dev/package.json`
- `apps/site/.env.example`
- `apps/site/infrastructure/{Dockerfile,docker-compose.yml}`
- `apps/saas/package.json`
- `apps/saas/.env.example`
- `apps/saas/workers/jobs/.env.example`
- `apps/saas/backend/cache/.env.example`
- `apps/saas/deploy/{.env.example,docker-compose.multi-region.yml,deploy_multi_region.sh}`
- `docs/living/RUNBOOK.md`

## Inconsistências / riscos encontrados

### 1) `apps/saas` parece ser apenas frontend Vite, mas `deploy/docker-compose.multi-region.yml` refere backend/worker Python
- `apps/saas/package.json` contém somente scripts Vite + k6.
- Já o compose multi-region builda imagens via `docker/Dockerfile`, `docker/frontend/Dockerfile` e roda `uvicorn backend.main:app`.
- Isso sugere que o **backend Python** está fora de `apps/saas/` (provavelmente em `backend/` no root do repositório) e que `apps/saas` é só UI.
- A doc anterior era vaga (“SaaS (frontend)”). O runbook agora explicita essa separação.

### 2) Possível typo em env var no template de deploy
Arquivo: `apps/saas/deploy/.env.example`
- Linha: ` BullMQ_REDIS_HOST=redis-master-latam`
- Tem **espaço à esquerda** antes do nome da variável, o que pode quebrar `export $(cat .env | ...)` e/ou parsing.

### 3) Porta US-West divergente no `.env.example` vs compose
- `apps/saas/deploy/docker-compose.multi-region.yml`:
  - `redis-master-uswest` usa `--port 8379` e expõe `"8379:8379"`.
- `apps/saas/deploy/.env.example`:
  - `REDIS_PORT_USWEST=7379` (**parece incorreto**, 7379 é US-East no compose).

### 4) Nomes de volumes sugerem replicação LATAM, mas compose define só 1 replica
- `volumes:` inclui `redis-replica-latam-1` e `redis-replica-latam-2`, porém os serviços definidos incluem apenas `redis-replica-latam` (um único).
- Pode ser resquício de uma versão anterior (ou intenção não implementada).

### 5) Runbook antigo dizia “Portas reais dependem do vite.config.*”
- Não há evidência aqui de `vite.config` custom de porta; em Vite o default é 5173 (dev) e 4173 (preview).
- O runbook atualizado assume defaults e avisa que pode mudar se a porta estiver ocupada.

## Sugestões rápidas (opcionais)
1) Corrigir `REDIS_PORT_USWEST` no `apps/saas/deploy/.env.example` para **8379** (ou ajustar compose se o correto for 7379).
2) Remover o espaço em `BullMQ_REDIS_HOST` ou padronizar como `BULLMQ_REDIS_HOST`.
3) Se a intenção é ter 2 réplicas LATAM, criar serviços `redis-replica-latam-1` e `redis-replica-latam-2` ou simplificar os volumes.
