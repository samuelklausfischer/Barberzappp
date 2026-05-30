# BarberZap — Decisions (ADR-lite)

## 2026-05-11 — Monorepo root
- **Decisão:** Criar monorepo novo em `/root/barberzap-monorepo`.
- **Por quê:** separar claramente **SaaS** vs **Site de vendas**, mantendo compartilhamento futuro.
- **Alternativas:** manter pastas separadas em /root; usar /root/Barberzap SITE como raiz.
- **Consequências:** paths mudaram (site e saas); precisamos atualizar qualquer deploy/script que apontava para caminhos antigos.

## 2026-05-11 — Estrutura padrão de automação (sub-agents + skills)
- **Decisão:** manter no monorepo:
  - `teams/` (specs)
  - `subagents/definitions/` (JSON)
  - `skills/custom/` (skills)
- **Por quê:** padroniza e reduz tokens (sempre sabemos onde ler/atualizar).

