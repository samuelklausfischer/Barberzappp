# 🤖 CONTEXTO JARVIS — Projeto BarberZap

> Este arquivo serve como briefing completo para a IA Jarvis (OpenClaw) na VPS.
> Leia este arquivo PRIMEIRO antes de qualquer outro.

---

## O Que É Este Projeto

**BarberZap** é um Micro SaaS de atendimento automatizado via WhatsApp para barbearias. A IA agenda, confirma e lembra clientes automaticamente — para que o barbeiro foque no corte, não no celular.

## Arquitetura

```
Landing Page (React/Vite)  ──webhook──▶  n8n (Orquestrador)  ──▶  Supabase (DB)
                                              │
                                              └──▶  Evolution API (WhatsApp)
                                              
Cakto (Checkout)  ──webhook──▶  n8n  ──▶  Supabase (ativa lead)
```

## Estrutura de Pastas

```
Barberzap SITE/
├── Barberzap-Dev/         → Frontend React (Landing Page)
├── docs/                  → Toda a documentação
│   ├── reports/           → Relatórios de análise
│   ├── strategy/          → Estratégias de marketing e vendas
│   ├── pixel/             → Meta Pixel configs
│   └── deployment/        → Guias de deploy
├── data/                  → CSVs de leads/prospecção
├── scripts/               → Scripts utilitários (Python, JS, SQL)
├── infrastructure/        → Docker, CI/CD, configs
├── assets/                → Imagens e recursos visuais
├── SUMARIO.md             → 📋 MAPA COMPLETO de todos os arquivos
└── README.md              → Documentação principal
```

> **⚡ DICA:** Leia o `SUMARIO.md` para encontrar qualquer arquivo rapidamente.

## Tecnologias

| Camada | Stack |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | n8n (self-hosted, mesma máquina que você) |
| Banco | Supabase (PostgreSQL remoto) |
| WhatsApp | Evolution API |
| Checkout | Cakto |
| Tracking | Facebook Pixel |

## Acesso n8n (Mesmo Servidor)

Você tem acesso direto aos workflows n8n. Os principais são:

| Workflow | Função |
|---|---|
| `🔧 IA Principal Roteador Multiagente` | Roteador central (72 nodes) |
| `Cakto Compra work` | Processa compras (75 nodes) |
| `IA VENDAS` | Agente de vendas WhatsApp |
| `IA Suporte` | Agente de suporte |
| `IA Instalação` | Guia de instalação |
| `IA Pos venda` | Agente pós-venda |
| `IA Reembolso` | Processamento de estornos |
| `Projeto Disparo / Final` | Disparo em massa para leads |

> ⚠️ **ATENÇÃO:** Todos os workflows estão INATIVOS no momento. Verificar credenciais antes de reativar.

## Banco de Dados (Supabase — Tabelas Chave)

| Tabela | Rows | Função |
|---|---|---|
| `leads` | 105 | Leads capturados |
| `messages` | 1518 | Histórico de mensagens |
| `agents_config` | 5 | Configuração dos agentes IA |
| `plans` | 5 | Planos e checkouts |
| `clients` | — | Cadastro de clientes |
| `conversation_reviews` | 42 | Reviews de conversas |

## Estratégia de Vendas

> Leia o arquivo completo em `docs/strategy/ESTRATEGIA_VENDAS_BARBEIROS.md`

**Resumo:** Prospectar barbearias via Google Maps → enviar mensagem teste de agendamento → expor a demora na resposta → apresentar o BarberZap como solução → oferecer 7 dias grátis.

## Integrações Externas

| Serviço | Endpoint |
|---|---|
| n8n Webhook (LP) | `https://0001-0001.25xe2c.easypanel.host/webhook/barberzap` |
| Cakto Checkout | `https://pay.cakto.com.br/psc74bb_701168` |
| Supabase | `db.knwflqqhohdcleuyupth.supabase.co` |

## Prioridades de Ação

1. **Revisar e reativar workflows n8n** (Roteador → Vendas → Cakto)
2. **Criar tabela `appointments`** no Supabase (não existe ainda)
3. **Preparar disparos** usando as listas em `data/` com os workflows de disparo
4. **Otimizar LP** — imagens para WebP + lazy loading

---

> 📅 Atualizado em: 22/02/2026
