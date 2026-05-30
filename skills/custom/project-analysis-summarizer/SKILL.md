---
name: project-analysis-summarizer
description: Analyze and summarize a code/project repository into token-efficient “living docs”. Use when you need to: (1) inventory folders/files, (2) produce a concise PROJECT_SUMMARY.md, (3) create a structured REPO_MAP.md and ARCHITECTURE.md, (4) extract key configs (env, ports, services), and (5) keep summaries updated to reduce future prompt tokens.
---

# Project Analysis Summarizer

Turn a messy repo into a small set of **high-signal docs** so future work costs fewer tokens.

## Outputs (default)
Create/update these files at the repo root (or a chosen docs folder):
- `PROJECT_SUMMARY.md` (1–2 pages max)
- `REPO_MAP.md` (tree + what each area does)
- `ARCHITECTURE.md` (components + data flow)
- `RUNBOOK.md` (how to run/dev/build/deploy, ports, env vars)
- `DECISIONS.md` (short ADR-style decisions)

Hard rule: keep each file concise; prefer links/paths over long prose.

## Workflow

### 1) Inventory (cheap scan first)
- Generate a repo tree (depth-limited)
- Identify: apps, packages, infra, scripts, docs
- Detect stacks: Node/Python, frameworks, DBs, Docker, CI

Use the script: `scripts/repo_snapshot.py`.

### 2) Extract “truth sources”
Prioritize reading:
- `README*`, `package.json`, `pyproject.toml/requirements.txt`
- `docker-compose.yml`, `Dockerfile*`
- `.env.example`, `deploy/`, `infrastructure/`, `scripts/`
- entrypoints: `src/main.*`, `app.*`, `server.*`

### 3) Write token-efficient living docs
Rules:
- Prefer bullets + file paths.
- Each section: **What it is / Where it lives / How to run / Gotchas**.
- Avoid repeating code.

Templates live in `references/templates.md`.

### 4) Maintenance mode (update without re-reading everything)
When asked later:
- Re-run snapshot
- Diff tree changes
- Update only impacted sections

## Repo conventions (recommended)
If user approves, standardize:
- `apps/` for deployable products
- `packages/` for shared libs
- `ops/` for infra
- `teams/` for team specs
- `subagents/definitions/` + `skills/custom/`

