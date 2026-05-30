# 📋 SUMÁRIO — Mapa Completo do Projeto BarberZap

> Use este arquivo para se localizar rapidamente em qualquer parte do projeto.
> Cada item é um link clicável que abre o arquivo diretamente.

---

## 🏠 Raiz do Projeto

| Arquivo | Descrição |
|---|---|
| [README.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/README.md) | Documentação principal — arquitetura, stack, integrações |
| [.env.example](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/.env.example) | Template de variáveis de ambiente |
| [robots.txt](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/robots.txt) | Regras de indexação para bots |
| [CONTEXTO_JARVIS.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/CONTEXTO_JARVIS.md) | 🤖 Briefing completo para a IA Jarvis na VPS |
| [SUMARIO.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/SUMARIO.md) | 📋 Este arquivo — mapa de navegação |

---

## 🎨 `Barberzap-Dev/` — Frontend (Landing Page React)

### Arquivos Principais

| Arquivo | Descrição |
|---|---|
| [App.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/App.jsx) | Orquestrador principal — imports, estado, handlers, efeitos (~150 linhas) |
| [main.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/main.jsx) | Entry point do React |
| [index.css](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/index.css) | Estilos globais e design tokens |
| [pixel.js](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/utils/pixel.js) | Módulo de tracking do Meta Pixel |
| [package.json](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/package.json) | Dependências e scripts npm |

### `components/ui/` — Componentes Reutilizáveis

| Componente | Descrição |
|---|---|
| [Button.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/ui/Button.jsx) | Botão com variantes (default, outline, hero, cta) |
| [SectionHeading.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/ui/SectionHeading.jsx) | Cabeçalho de seção com badge + título + subtítulo |
| [AccordionItem.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/ui/AccordionItem.jsx) | Accordion animado para FAQ |
| [ScrollCard.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/ui/ScrollCard.jsx) | Card com efeito de foco/glow ao rolar |

### `components/sections/` — Seções da Landing Page

> Listadas na **ordem em que aparecem na página**, de cima para baixo.

| # | Componente | O que renderiza |
|---|---|---|
| 1 | [HeroSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/HeroSection.jsx) | Headline principal + CTA + imagem do sistema com parallax |
| 2 | [BenefitsSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/BenefitsSection.jsx) | Grid de 3 benefícios (Agilidade, Foco, Organização) |
| 3 | [PainPointsSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/PainPointsSection.jsx) | 3 cards de identificação de dores do barbeiro |
| 4 | [ComparisonSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/ComparisonSection.jsx) | "Amador vs Barberzap" — comparação visual lado a lado |
| 5 | [HowItWorksSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/HowItWorksSection.jsx) | Passo a passo (Conecte → Configure → Atenda) |
| 6 | [EcosystemSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/EcosystemSection.jsx) | Features além do WhatsApp (Recuperação, Financeiro, Inovação) |
| 7 | [TestimonialsSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/TestimonialsSection.jsx) | 3 depoimentos + galeria marquee do painel |
| 8 | [GuaranteeSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/GuaranteeSection.jsx) | Garantia de 7 dias grátis |
| 9 | [CompetitorAlertSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/CompetitorAlertSection.jsx) | Alerta sobre apps que expõem clientes à concorrência |
| 10 | [PricingSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/PricingSection.jsx) | Oferta R$49,90 + barra de vagas + cards de inclusão |
| 11 | [FAQSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/FAQSection.jsx) | 5 perguntas frequentes com accordion |
| 12 | [FooterSection.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/FooterSection.jsx) | CTA final + rodapé com disclaimer Meta |

### `components/sections/` — Overlays e Modais

| Componente | O que renderiza |
|---|---|
| [LeadModal.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/LeadModal.jsx) | Modal de captura de lead (nome + WhatsApp → webhook → Cakto) |
| [Overlays.jsx](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/Barberzap-Dev/src/components/sections/Overlays.jsx) | Notificação de prova social + Lightbox de imagens |

---

## 📚 `docs/` — Documentação

### `docs/reports/` — Relatórios e Análises

| Arquivo | Descrição |
|---|---|
| [AUDITORIA_PSICOLOGICA_CONVERSAO.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/reports/AUDITORIA_PSICOLOGICA_CONVERSAO.html) | Análise psicológica do copy de conversão |
| [RELATORIO_DETALHADO_FUNIL.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/reports/RELATORIO_DETALHADO_FUNIL.html) | Relatório detalhado de cada etapa do funil |
| [analise-funil-interactive.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/reports/analise-funil-interactive.html) | Versão interativa da análise de funil |
| [META_ADS_AUDIT.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/reports/META_ADS_AUDIT.html) | Auditoria das campanhas Meta Ads |
| [backend_documentation.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/reports/backend_documentation.html) | Documentação do backend (n8n + Supabase) |
| [integacao_simples.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/reports/integacao_simples.html) | Guia simplificado de integração |

### `docs/strategy/` — Estratégias de Marketing

| Arquivo | Descrição |
|---|---|
| [ESTRATEGIA_PIXEL.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/strategy/ESTRATEGIA_PIXEL.html) | Estratégia completa do Meta Pixel |
| [ESTRATEGIA_PONTE_CHECKOUT.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/strategy/ESTRATEGIA_PONTE_CHECKOUT.html) | Estratégia da página ponte antes do checkout |
| [ESTRATEGIA_TRAFEGO_ANDROMEDA.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/strategy/ESTRATEGIA_TRAFEGO_ANDROMEDA.html) | Estratégia de tráfego Andrômeda |
| [MATRIZ_COPYWRITING_ADS.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/strategy/MATRIZ_COPYWRITING_ADS.html) | Matriz de copy para anúncios |
| [SIMULACAO_PONTE_BARBERZAP.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/strategy/SIMULACAO_PONTE_BARBERZAP.html) | Simulação visual da ponte de checkout |
| [ESTRATEGIA_VENDAS_BARBEIROS.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/strategy/ESTRATEGIA_VENDAS_BARBEIROS.md) | 🎯 **Estratégia completa de vendas** — scripts, segmentação, ROI, fluxo de prospecção |

### `docs/pixel/` — Meta Pixel

| Arquivo | Descrição |
|---|---|
| [GUIA_CONFIGURACAO_PIXEL.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/pixel/GUIA_CONFIGURACAO_PIXEL.html) | Guia passo a passo de configuração do Pixel |
| [RELATORIO_IMPLEMENTACAO_PIXEL.html](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/pixel/RELATORIO_IMPLEMENTACAO_PIXEL.html) | Relatório da implementação do Pixel na LP |
| [Pixel meta.txt](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/pixel/Pixel%20meta.txt) | ID e código do Pixel Meta |

### `docs/deployment/` — Guias de Deploy

| Arquivo | Descrição |
|---|---|
| [easypanel_setup.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/deployment/easypanel_setup.md) | Guia de setup no EasyPanel |
| [easypanel_github_repo.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/deployment/easypanel_github_repo.md) | Integração EasyPanel ↔ GitHub |
| [easypanel_preenchimento_rapido.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/deployment/easypanel_preenchimento_rapido.md) | Checklist rápido de preenchimento |
| [supabase_github_integration_setup.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/deployment/supabase_github_integration_setup.md) | Integração Supabase ↔ GitHub |
| [visitor_tracking_setup.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/deployment/visitor_tracking_setup.md) | Setup do sistema de visitor tracking |

### `docs/` — Raiz

| Arquivo | Descrição |
|---|---|
| [CONTEXTO_GEMINI.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/CONTEXTO_GEMINI.md) | Contexto do projeto para assistentes de IA |
| [ESPECIFICACAO_VISUAL_LP.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/ESPECIFICACAO_VISUAL_LP.md) | Especificação visual detalhada da LP |
| [ESTADO_ATUAL_LP.md](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/docs/ESTADO_ATUAL_LP.md) | Snapshot do estado atual e próximos passos |

---

## 📊 `data/` — Dados e Listas de Leads

| Arquivo | Descrição |
|---|---|
| [Prospecção de Leads - sheet1.csv](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/data/Prospecção%20de%20Leads%20-%20sheet1.csv) | Lista principal de leads (exportada do Sheets) |
| [lista_meta_ads.csv](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/data/lista_meta_ads.csv) | Leads formatados para Meta Ads |
| [lista_prospeccao_limpa.csv](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/data/lista_prospeccao_limpa.csv) | Lista limpa/deduplicada |
| [estatisticas_leads.txt](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/data/estatisticas_leads.txt) | Estatísticas resumidas dos leads |

---

## 🔧 `scripts/` — Scripts Utilitários

| Arquivo | Linguagem | Descrição |
|---|---|---|
| [organizar_lista_meta.py](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/scripts/organizar_lista_meta.py) | Python | Limpa e organiza listas para Meta Ads |
| [supabase_github_integration.py](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/scripts/supabase_github_integration.py) | Python | Integração CI/CD Supabase ↔ GitHub |
| [visitor_webhook.py](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/scripts/visitor_webhook.py) | Python | Webhook receptor de visitantes |
| [visitor-tracker.js](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/scripts/visitor-tracker.js) | JavaScript | Tracker client-side de visitantes |
| [supabase_github_schema.sql](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/scripts/supabase_github_schema.sql) | SQL | Schema do banco para integração GitHub |
| [supabase_visitors_schema.sql](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/scripts/supabase_visitors_schema.sql) | SQL | Schema do banco para visitor tracking |

---

## 🐳 `infrastructure/` — Infra e CI/CD

| Arquivo | Descrição |
|---|---|
| [Dockerfile](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/infrastructure/Dockerfile) | Imagem Docker do projeto |
| [docker-compose.yml](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/infrastructure/docker-compose.yml) | Orquestração multi-container |
| [github_actions_workflow.yml](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/infrastructure/github_actions_workflow.yml) | Pipeline CI/CD do GitHub Actions |
| [.htaccess](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/infrastructure/.htaccess) | Regras de redirect Apache |
| [default.php](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/infrastructure/default.php) | Página PHP fallback |
| [requirements.txt](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/infrastructure/requirements.txt) | Dependências Python |
| [requirements_github_integration.txt](file:///c:/Users/samue/OneDrive/Área%20de%20Trabalho/IA%27S%20Gen.%20Diretorio/Barberzap%20SITE/infrastructure/requirements_github_integration.txt) | Dependências Python para integração |

---

## 🖼️ `assets/` — Recursos Visuais

| Pasta/Arquivo | Descrição |
|---|---|
| `landing-page-sources/` | Fontes originais da LP (screenshots do painel, ícones, etc.) |
| `generated-images/` | Imagens geradas por IA para uso no projeto |
| `favicon.svg` | Ícone do site |
| `placeholder.svg` | Imagem placeholder genérica |

---

> 📅 Última atualização: 22/02/2026 — 19:54
