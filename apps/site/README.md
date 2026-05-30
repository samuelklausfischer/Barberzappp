# ✂️ BarberZap — Secretária Virtual para Barbearias

> **Micro SaaS de atendimento automatizado via WhatsApp para barbearias.**
> A IA agenda, confirma e lembra seus clientes — para que você tenha foco total na tesoura.

---

## 🏗️ Arquitetura Geral

```
Landing Page (React/Vite)
    │
    ├── POST /webhook/barberzap ──▶ n8n (Orquestrador)
    │                                   │
    │                                   ├── Supabase (Banco de Dados)
    │                                   │     └── leads, messages, agents_config...
    │                                   │
    │                                   └── Evolution API (WhatsApp)
    │                                         └── Envio/Recebimento de mensagens
    │
    └── Redirect ──▶ Cakto (Checkout de Pagamento)
                       │
                       └── Webhook Compra ──▶ n8n
```

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend (LP)** | React 18 + Vite + Tailwind CSS + Framer Motion |
| **Orquestrador** | n8n (self-hosted via EasyPanel) |
| **Banco de Dados** | Supabase (PostgreSQL) |
| **WhatsApp** | Evolution API |
| **Checkout** | Cakto |
| **Tracking** | Facebook Pixel (PageView, Lead, ViewContent, ViewPrice) |

## 📁 Estrutura do Projeto

```
Barberzap SITE/
│
├── Barberzap-Dev/               # 🎨 Frontend (Landing Page React)
│   ├── src/
│   │   ├── App.jsx              # Orquestrador principal (~150 linhas)
│   │   ├── components/
│   │   │   ├── ui/              # Componentes reutilizáveis (Button, ScrollCard...)
│   │   │   └── sections/        # 14 seções da LP (Hero, Pricing, FAQ...)
│   │   ├── utils/
│   │   │   └── pixel.js         # Módulo de tracking do Meta Pixel
│   │   └── main.jsx             # Entry point
│   ├── public/                  # Imagens e ícones estáticos
│   └── package.json
│
├── docs/                        # 📚 Documentação
│   ├── reports/                 # Relatórios de análise e auditoria
│   ├── strategy/                # Estratégias de marketing e copywriting
│   ├── pixel/                   # Configuração e guias do Meta Pixel
│   ├── deployment/              # Guias de deploy (EasyPanel, Docker, GitHub)
│   ├── CONTEXTO_GEMINI.md       # Contexto de IA para o projeto
│   ├── ESPECIFICACAO_VISUAL_LP.md
│   └── ESTADO_ATUAL_LP.md
│
├── data/                        # 📊 Dados e listas
│   ├── Prospecção de Leads.csv  # Lista principal de leads
│   ├── lista_meta_ads.csv       # Leads para Meta Ads
│   ├── lista_prospeccao_limpa.csv
│   └── estatisticas_leads.txt
│
├── scripts/                     # 🔧 Scripts utilitários
│   ├── organizar_lista_meta.py  # Limpeza de listas de leads
│   ├── supabase_github_integration.py
│   ├── visitor_webhook.py       # Webhook de visitantes
│   ├── visitor-tracker.js       # Tracker JS de visitantes
│   ├── supabase_github_schema.sql
│   └── supabase_visitors_schema.sql
│
├── infrastructure/              # 🐳 Configurações de infraestrutura
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── github_actions_workflow.yml
│   ├── .htaccess
│   ├── default.php
│   ├── requirements.txt
│   └── requirements_github_integration.txt
│
├── assets/                      # 🖼️ Assets visuais
│   ├── landing-page-sources/    # Fontes originais da LP
│   └── generated-images/       # Imagens geradas por IA
│
├── .env.example                 # Variáveis de ambiente (template)
├── robots.txt
└── README.md                    # ← Você está aqui
```

## 🚀 Desenvolvimento Local (Frontend)

```bash
# Navegar para o frontend
cd Barberzap-Dev

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build de produção
npm run build
```

## 🔗 Integrações Externas

| Serviço | Endpoint / URL |
|---|---|
| **n8n (Webhook LP)** | `https://0001-0001.25xe2c.easypanel.host/webhook/barberzap` |
| **Cakto (Checkout)** | `https://pay.cakto.com.br/psc74bb_701168` |
| **Supabase** | `db.knwflqqhohdcleuyupth.supabase.co` |
| **n8n MCP** | `https://0001-0001.25xe2c.easypanel.host/mcp` |

## 📊 Banco de Dados (Supabase — Tabelas Principais)

| Tabela | Rows | Função |
|---|---|---|
| `leads` | 105 | Leads capturados (status, plan, is_ai_muted) |
| `messages` | 1518 | Histórico de mensagens da IA |
| `agents_config` | 5 | Configuração dos agentes (prompt, model) |
| `plans` | 5 | Planos e links de checkout |
| `conversation_reviews` | 42 | Reviews de conversas |

## 🤖 Workflows n8n (Principais)

| Workflow | Nodes | Função |
|---|---|---|
| `🔧 IA Principal Roteador Multiagente` | 72 | Roteador central de mensagens |
| `Cakto Compra work` | 75 | Processa webhooks de compra |
| `IA VENDAS` | 16 | Agente de vendas WhatsApp |
| `IA Suporte` | 17 | Agente de suporte |
| `IA Instalação` | 12 | Guia de instalação |
| `IA Pos venda` | 16 | Agente pós-venda |
| `IA Reembolso` | 16 | Processamento de estornos |

## 👥 Autor

**Samuel Klaus Fischer** — [suporte@fluxoficial.com.br](mailto:suporte@fluxoficial.com.br)

---

© 2026 BarberZap. Todos os direitos reservados.