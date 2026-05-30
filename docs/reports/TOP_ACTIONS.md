# Top Actions (Prioritized)

## P0 (alto impacto / baixo risco)
1) Confirmar portas reais (site + saas) via `vite.config.*` e atualizar `docs/living/RUNBOOK.md`.
2) Garantir `.gitignore` cobre `.env.local`, `node_modules/`, `dist/` (checar ambos apps).
3) Padronizar “Fonte da Verdade” de docs: living → apps/reference (já iniciado). Ajustar links quebrados (se houver).
4) Registrar decisões pendentes em `docs/living/DECISIONS.md`: auth model, tenant_id, backend ownership.

## P1 (organização com cuidado)
5) Criar `docs/reference/architecture/` (já criado) e referenciar sempre no living.
6) Criar `docs/qa/QA_CHECKLIST.md` e ligar no `docs/INDEX.md`.
7) Criar “Deploy notes” por app em `docs/apps/site/deployment/` e `docs/apps/saas/runbooks/` (links para scripts existentes).

## P2 (limpeza / dedup)
8) Mover (ou arquivar) `.md` históricos dos roots de `apps/site/` e `apps/saas/` para `docs/archive/` após validação.
9) Considerar remover artifacts de build do git (se estiverem versionados): `apps/saas/dist/` e `apps/site/assets/index-*.{js,css}`.
