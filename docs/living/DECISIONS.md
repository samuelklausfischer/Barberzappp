# BarberZap — Decisions (Living, ADR-lite)

## 2026-05-11 — Monorepo root
- **Decisão:** Criar monorepo novo em `/root/barberzap-monorepo`.
- **Por quê:** separar claramente **SaaS** vs **Site de vendas**, mantendo compartilhamento futuro.
- **Alternativas:** manter pastas separadas em /root; usar /root/Barberzap SITE como raiz.
- **Consequências:** paths mudaram (site e saas); qualquer deploy/script antigo precisa ser atualizado.

## 2026-05-11 — Estrutura padrão de automação
- **Decisão:** manter no monorepo:
  - `teams/` (specs)
  - `subagents/definitions/` (JSON)
  - `skills/custom/` (skills)
  - `docs/` (índice + living docs)
- **Por quê:** padroniza e reduz tokens (sabemos sempre onde ler/atualizar).
