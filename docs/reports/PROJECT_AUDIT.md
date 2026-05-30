# Project Audit (Quick)

## Inventory
- Monorepo root: /root/barberzap-monorepo
- Apps:
  - apps/site (landing + docs + python automations)
  - apps/saas (BarberZap Pro SaaS)
- Automation:
  - teams/ (specs)
  - subagents/definitions/ (generated)
  - skills/custom/ (generated + utilities)
- Docs:
  - docs/living (token-savers)
  - docs/apps, docs/reference, docs/automation

## Potential duplicates / redundancy (signals)
- Site contains many standalone .md at apps/site/ root (historical from previous repo).
- SaaS contains many governance/docs at apps/saas/ root *and* apps/saas/docs/ (now also copied into docs/reference and docs/apps).
- Node build artifacts likely present: apps/site/assets/* and apps/saas/dist/*

## Risk checks (non-exhaustive)
- Check for secrets: presence of .env.local files and service role keys.
  - Found: apps/saas/.env.local exists (should be gitignored).
  - Found: apps/site/.env.example includes SUPABASE_SERVICE_ROLE_KEY (ok as example, but never commit real key).
- Large folders to avoid reading/sending to LLM: node_modules, dist.

## Gaps (docs vs code)
- RUNBOOK needs ports confirmed from vite.config.* (site + saas).
- Clarify where the “official backend” lives: apps/saas/backend vs apps/site/barberzap_python.
- Consolidate auth model: Supabase Auth vs custom JWT (document decision).
