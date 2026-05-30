# Living Docs — Change Policy (Token-Saver Rules)

Objetivo: manter documentação **curta, atual e barata em tokens**.

## Regras

### 1) Onde escrever o quê
- **Resumo do monorepo:** `docs/living/PROJECT_SUMMARY.md`
- **Mapa de pastas:** `docs/living/REPO_MAP.md`
- **Arquitetura (alto nível):** `docs/living/ARCHITECTURE.md`
- **Como rodar/deploy:** `docs/living/RUNBOOK.md`
- **Decisões:** `docs/living/DECISIONS.md`

### 2) Tamanho máximo (hard-ish limits)
- Cada living doc: **≤ 200 linhas** (preferir links/paths)
- Se passar disso: mover detalhe para `apps/*/docs/` ou `docs/reference/` (criar se necessário)

### 3) Como atualizar (sem re-ler o repo inteiro)
Sempre fazer:
1. Rodar snapshot leve (`repo_snapshot.py`) com depth 3–4
2. Identificar o que mudou (pastas/entrypoints/config)
3. Atualizar só as seções afetadas

### 4) “Fonte da verdade”
- Para detalhes operacionais do SaaS: `apps/saas/docs/`
- Para detalhes de marketing/copy do site: `apps/site/docs/`
- Living docs só apontam para esses locais.

### 5) Decisões (ADR-lite)
Sempre que mudar algo estrutural (paths, auth model, DB schema, integrações):
- adicionar 4 bullets em `DECISIONS.md`:
  - Decisão
  - Por quê
  - Alternativas
  - Consequências

## Checklist rápido (quando alguém pedir “organiza o projeto”)
- [ ] Atualizar `REPO_MAP.md`
- [ ] Atualizar `PROJECT_SUMMARY.md`
- [ ] Atualizar `RUNBOOK.md` (comandos + env)
- [ ] Registrar decisão em `DECISIONS.md`
