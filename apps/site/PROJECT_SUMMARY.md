# apps/site — Project Summary (Vendas/Landing + Docs)

## O que é
Projeto da **landing page** do BarberZap + documentação extensa + automações auxiliares (Python/scripts) e infraestrutura docker.

## Stack
- React + Vite + Tailwind + Framer Motion (landing)
- n8n (orquestração — referenciado)
- Supabase (DB)
- Evolution API (WhatsApp)
- Cakto (checkout)

## Onde está o frontend
- `Barberzap-Dev/`

## Onde estão automações
- `barberzap_python/` (API/webhooks/CRM/prospecção)
- `scripts/` (import, visitor tracking, schemas)

## Como rodar (frontend)
- `cd Barberzap-Dev && npm install && npm run dev`
