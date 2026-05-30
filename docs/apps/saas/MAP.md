# 🗺️ MAP - Índice do Projeto

Este é o mapa completo do BarberZap Pro. Use este documento para encontrar rapidamente qualquer módulo, componente ou funcionalidade.

## 📌 Atalhos Rápidos

- [Dashboard](#dashboard) - Visão geral e métricas
- [Agenda](#agenda) - Gestão de agendamentos
- [Financeiro](#financeiro) - Controle financeiro
- [Serviços](#serviços) - Catálogo de serviços
- [WhatsApp](#whatsapp) - Integração WhatsApp
- [AI Config](#ai-config) - Configuração assistente IA
- [Autenticação](#autenticação) - Login e auth
- [Tipos](#tipos) - TypeScript types
- [Utils](#utils) - Funções utilitárias
- [Config](#config) - Configurações globais
- [🤖 Sub-Agent System](#-sub-agent-system) - Sistema de sub-agentes

---

## 📂 Estrutura Completa por Categoria

### 🚀 App & Entry Points

| Arquivo | Descrição | Linhas Aprox. |
|---------|-----------|---------------|
| `src/app/App.tsx` | Componente raiz (layout, routing, auth) | ~150 |
| `src/app/main.tsx` | React entry point (ReactDOM) | ~10 |
| `index.html` | HTML entry (CDN scripts, meta tags) | ~40 |

---

### 🎨 Componentes de UI

#### Shared Components
| Arquivo | Descrição | Uso |
|---------|-----------|-----|
| `src/components/shared/Card/` | Card reutilizável | Múltiplos |
| `src/components/shared/Button/` | Button reutilizável | Múltiplos |
| `src/components/shared/Input/` | Input reutilizável | Formulários |

#### Layout Components
| Arquivo | Descrição | Props Principais |
|---------|-----------|------------------|
| `src/components/layout/Sidebar/Sidebar.tsx` | Navegação lateral | `currentView`, `onViewChange`, `onLogout` |

#### Feature Components

##### Dashboard 📊
| Arquivo | Descrição | Props |
|---------|-----------|-------|
| `src/components/dashboard/Dashboard.tsx` | Dashboard principal | `appointments`, `onNavigate` |
| `src/components/dashboard/StatsCard.tsx` | Card de métricas | `label`, `value`, `icon`, `trend` |

##### Agenda 📅
| Arquivo | Descrição | Props |
|---------|-----------|-------|
| `src/components/agenda/Agenda.tsx` | Lista de agendamentos | `appointments` |
| `src/components/agenda/AppointmentCard.tsx` | Card de agendamento | `appointment`, `onEdit`, `onDelete` |

##### Financeiro 💰
| Arquivo | Descrição | Props |
|---------|-----------|-------|
| `src/components/finance/Finance.tsx` | Painel financeiro | - |
| `src/components/finance/Charts/RevenueChart.tsx` | Gráfico de receita | `data` |
| `src/components/finance/Charts/ServiceDistribution.tsx` | Distribuição de serviços | `data` |

##### Serviços ✂️
| Arquivo | Descrição | Props |
|---------|-----------|-------|
| `src/components/services/ServicesList.tsx` | Lista de serviços | `services` |
| `src/components/services/ServiceCard.tsx` | Card de serviço | `service`, `onEdit`, `onDelete` |

##### WhatsApp 💬
| Arquivo | Descrição | Props |
|---------|-----------|-------|
| `src/components/whatsapp/WhatsAppConnect.tsx` | Configuração WhatsApp | - |

##### AI Config 🤖
| Arquivo | Descrição | Props |
|---------|-----------|-------|
| `src/components/aiconfig/AIConfig.tsx` | Configuração IA | - |

##### Autenticação 🔐
| Arquivo | Descrição | Props |
|---------|-----------|-------|
| `src/components/auth/Login.tsx` | Tela de login | `onLogin` |

---

### 🔧 Features (Business Logic)

#### Autenticação
| Arquivo | Descrição |
|---------|-----------|
| `src/features/auth/hooks/useAuth.ts` | Hook de autenticação |
| `src/features/auth/types/` | Tipos de auth |

#### Agendamentos
| Arquivo | Descrição |
|---------|-----------|
| `src/features/appointments/hooks/useAppointments.ts` | Hook de agendamentos |
| `src/features/appointments/mocks/mockAppointments.ts` | Dados mock |
| `src/features/appointments/types/` | Tipos de agendamentos |

#### Serviços
| Arquivo | Descrição |
|---------|-----------|
| `src/features/services/hooks/useServices.ts` | Hook de serviços |
| `src/features/services/mocks/mockServices.ts` | Dados mock |
| `src/features/services/types/` | Tipos de serviços |

#### IA/Assistente
| Arquivo | Descrição |
|---------|-----------|
| `src/features/ai/hooks/useAIChat.ts` | Hook de chat IA |
| `src/features/ai/types/` | Tipos de IA |

---

### 🎯 Domain (Core)

#### Tipos Globais
| Arquivo | Descrição |
|---------|-----------|
| `src/domain/types/index.ts` | Tipos exportados globalmente |
| `src/domain/types/common.ts` | Tipos comuns (User, etc.) |
| `src/domain/types/appointment.ts` | Tipo Appointment |
| `src/domain/types/service.ts` | Tipo Service |
| `src/domain/types/financial.ts` | Tipo FinancialStats |

#### Entidades
| Arquivo | Descrição |
|---------|-----------|
| `src/domain/entities/User.ts` | Entidade User |
| `src/domain/entities/Appointment.ts` | Entidade Appointment |
| `src/domain/entities/Service.ts` | Entidade Service |

#### Constantes de Negócio
| Arquivo | Descrição |
|---------|-----------|
| `src/domain/constants/appointments.ts` | Status de agendamentos |
| `src/domain/constants/services.ts` | Categorias de serviços |

---

### 🌐 Infrastructure (External Services)

#### IA (Google Gemini)
| Arquivo | Descrição |
|---------|-----------|
| `src/infrastructure/ai/geminiService.ts` | Cliente Gemini |
| `src/infrastructure/ai/types.ts` | Tipos da API |

#### WhatsApp (Futuro)
| Arquivo | Descrição |
|---------|-----------|
| `src/infrastructure/whatsapp/` | Integração WhatsApp |

#### API (Futuro)
| Arquivo | Descrição |
|---------|-----------|
| `src/infrastructure/api/client.ts` | Cliente HTTP |
| `src/infrastructure/api/endpoints.ts` | Endpoints |

---

### ⚙️ Config

| Arquivo | Descrição |
|---------|-----------|
| `src/config/theme.ts` | Tema (cores, spacing) |
| `src/config/routes.ts` | Rotas da aplicação |
| `src/config/constants.ts` | Constantes gerais |

---

### 🛠️ Lib (Utils)

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/utils.ts` | Funções utilitárias gerais |
| `src/lib/formatters.ts` | Formatação de moeda, data, etc. |
| `src/lib/validators.ts` | Validações |

---

### 🪝 Custom Hooks (Globais)

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useMediaQuery.ts` | Detectar media query |
| `src/hooks/useLocalStorage.ts` | Persistir em localStorage |
| `src/hooks/useDebounce.ts` | Debounce de valores |

---

### 🖼️ Assets

| Pasta | Descrição |
|-------|-----------|
| `src/assets/images/` | Imagens e logos |
| `src/assets/fonts/` | Fontes customizadas |
| `src/assets/icons/` | Ícones SVG |

---

## 🔄 Fluxos Críticos

### 1. Fluxo de Login
```
Login Component
  ↓ [useAuth hook]
Auth Context
  ↓ [handleLogin]
App.tsx (renderização condicional)
  ↓
Dashboard
```

### 2. Fluxo de Agendamento
```
Agenda Component
  ↓ [useAppointments hook]
Mock Data (features/appointments/mocks/)
  ↓
Renderização de Appointment Cards
  ↓
Ações (Edit/Delete) → Hooks de atualização
```

### 3. Fluxo de IA/Chat
```
AIConfig Component
  ↓ [useAIChat hook]
Gemini Service (infrastructure/ai/)
  ↓ [API call]
Google Gemini API
  ↓
Retorno → Chat UI
```

### 4. Fluxo de Serviços
```
ServicesList Component
  ↓ [useServices hook]
Mock Data (features/services/mocks/)
  ↓
Renderização de Service Cards
  ↓
Ações (Edit/Delete/Add)
```

---

## 🔗 Integrações Externas

| Serviço | Propósito | Status | Localização |
|---------|----------|--------|-------------|
| **Google Gemini** | Assistente virtual IA | ✅ Ativo | `src/infrastructure/ai/geminiService.ts` |
| **WhatsApp API** | Confirmações automáticas | 🔲 Futuro | `src/infrastructure/whatsapp/` |
| **Backend API** | Dados reais | 🔲 Futuro | `src/infrastructure/api/` |
| **Google Fonts** | Fonte Manrope | ✅ Ativo | `index.html` |
| **Material Symbols** | Ícones | ✅ Ativo | `index.html` |
| **Recharts** | Gráficos | ✅ Ativo | Dependência |

---

## 📊 Dados e Mocks

| Tipo de Dado | Localização | Descrição |
|-------------|-------------|-----------|
| **Agendamentos** | `src/features/appointments/mocks/mockAppointments.ts` | Lista de agendamentos mock |
| **Serviços** | `src/features/services/mocks/mockServices.ts` | Lista de serviços mock |
| **Usuários** | `src/domain/types/common.ts` | Tipo User |
| **Financeiro** | `src/domain/types/financial.ts` | Tipos financeiros |

---

## 🎨 Tema e Estilização

| Localização | Descrição |
|-------------|-----------|
| `src/config/theme.ts` | Cores, spacing, breakpoints |
| `index.html` | Tailwind CDN config |
| Componentes | Classes Tailwind inline |

### Cores Principais

- **Primary**: `#f4c025` (Gold)
- **Background**: `#09090b` (Zinc 950)
- **Surface**: `#18181b` (Zinc 900)
- **Text**: Branco/Zinc variations

---

## 🚀 Scripts Importantes

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Iniciar servidor dev |
| `npm run build` | Build para produção |
| `npm run preview` | Preview do build |

---

## 📚 Documentação Relacionada

### 🏗️ Core Architecture
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura e padrões do sistema
- [START_HERE.md](./START_HERE.md) - Guia de onboarding
- [DATA_MAP.md](./DATA_MAP.md) - Índice de dados e queries
- [RUNBOOKS/](./RUNBOOKS/) - Runbooks operacionais

### 🤖 Sub-Agent System (NEW!)
- [SUB_AGENT_ARCHITECTURE.md](./SUB_AGENT_ARCHITECTURE.md) - **Arquitetura completa do sistema de sub-agentes** (20 agents, skills, context, workflows)
- [SUB_AGENT_SYSTEM.md](./SUB_AGENT_SYSTEM.md) - Referência rápida do sistema de sub-agentes
- [SUB_AGENT_DIAGRAMS.md](./SUB_AGENT_DIAGRAMS.md) - Diagramas visuais do sistema
- [SUB_AGENT_CHEAT_SHEET.md](./SUB_AGENT_CHEAT_SHEET.md) - Cheat sheet rápida dos agents

---

## 🔍 Como Encontrar Coisas Rapidamente

### "Onde está o componente X?"
1. Veja a tabela [Componentes de UI](#-componentes-de-ui)
2. Filtre pela feature (dashboard, agenda, etc.)
3. Encontre o arquivo correspondente

### "Onde está a lógica de X?"
1. Veja a tabela [Features](#-features-business-logic)
2. Encontre a feature correspondente
3. Veja os hooks e mocks

### "Onde estão os tipos X?"
1. Veja a tabela [Domain Types](#-tipos-globais)
2. Encontre o tipo específico
3. Ou veja [Tipos Globais](#-tipos-globais)

### "Onde está o serviço X?"
1. Veja a tabela [Infrastructure](️-infrastructure-external-services)
2. Encontre a integração correspondente

---

## ✅ Checklist de Navegação

- [ ] Entendi a estrutura de pastas
- [ ] Sei onde encontrar componentes
- [ ] Sei onde encontrar lógica de negócio
- [ ] Sei onde encontrar tipos
- [ ] Sei onde encontrar serviços externos
- [ ] Entendi os fluxos principais
- [ ] Sei onde estão os dados mock
- [ ] Conheço as configurações globais

---

**Última atualização**: 2026-03-03
**Responsável**: Dev Sênior
