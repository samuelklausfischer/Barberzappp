# BarberZap Pro - Arquitetura do Sistema

## Visão Geral

BarberZap Pro é uma plataforma web de gestão SaaS para barbearias, desenvolvida com React 19, TypeScript e Vite. O sistema oferece dashboard de métricas, agendamento de clientes, catálogo de serviços, controle financeiro com visualizações, integração WhatsApp para confirmações automáticas e um assistente virtual AI configurável via Google Gemini.

## Padrão Arquitetural Adotado

**Arquitetura: Feature-First com Separação por Camadas**

O projeto adota uma abordagem híbrida que organiza o código por funcionalidades (features) mantendo separação clara de responsabilidades em camadas:

- **Feature-First**: Código organizado por contexto de negócio (dashboard, agenda, finance, etc.)
- **Layer-Based**: Separação entre UI, Business Logic e Infrastructure
- **Module Boundaries**: Regras claras de importação para evitar acoplamento

## Fronteiras de Importação

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                     │
│  (Components, UI, User Interactions)                        │
│  ↓ Pode importar: Application, Domain, Infrastructure       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  (Hooks, Use Cases, Orchestration)                          │
│  ↓ Pode importar: Domain, Infrastructure                    │
│  ↑ NÃO pode importar: Presentation                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  (Business Rules, Entities, Types)                           │
│  ↓ Pode importar: Nada (puro)                               │
│  ↑ NÃO pode importar: Application, Infrastructure            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│  (External Services, API, Utils, Configs)                   │
│  ↓ Pode importar: Domain                                    │
│  ↑ NÃO pode importar: Application, Presentation             │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura de Pastas

```
barber/
├── docs/                          # 📚 Documentação
│   ├── ARCHITECTURE.md           # Arquitetura e padrões
│   ├── START_HERE.md             # Guia de onboarding
│   ├── MAP.md                    # Índice do projeto
│   ├── DATA_MAP.md               # Índice de dados
│   └── RUNBOOKS/                 # Runbooks operacionais
│       ├── whatsapp.md
│       ├── errors-common.md
│       └── deployment.md
│
├── src/                           # 💻 Código principal
│   ├── app/                       # 🚀 Entry points
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # React entry point
│   │
│   ├── components/               # 🎨 Componentes UI
│   │   ├── shared/               # Componentes reutilizáveis
│   │   ├── layout/               # Layout components (Sidebar, Header)
│   │   ├── dashboard/            # Dashboard module
│   │   ├── agenda/               # Agenda module
│   │   ├── finance/              # Finance module
│   │   ├── services/             # Services module
│   │   ├── whatsapp/             # WhatsApp module
│   │   ├── aiconfig/             # AI Config module
│   │   └── auth/                 # Auth module
│   │
│   ├── features/                  # 🔧 Business Logic por contexto
│   │   ├── auth/                 # Autenticação
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── appointments/         # Agendamentos
│   │   │   ├── hooks/
│   │   │   ├── mocks/
│   │   │   └── types/
│   │   ├── services/             # Serviços
│   │   │   ├── hooks/
│   │   │   ├── mocks/
│   │   │   └── types/
│   │   └── ai/                   # IA/Assistente
│   │       ├── hooks/
│   │       └── types/
│   │
│   ├── domain/                    # 🎯 Domain Core
│   │   ├── entities/             # Entidades de negócio
│   │   ├── types/                # Tipos globais
│   │   └── constants/            # Constantes de negócio
│   │
│   ├── infrastructure/            # 🌐 External Integrations
│   │   ├── ai/                   # Google Gemini service
│   │   ├── whatsapp/             # WhatsApp integration (futuro)
│   │   └── api/                  # API client (futuro)
│   │
│   ├── config/                    # ⚙️ Configurações
│   │   ├── theme.ts              # Tema, cores, estilos
│   │   ├── routes.ts             # Rotas da aplicação
│   │   └── constants.ts          # Constantes gerais
│   │
│   ├── lib/                       # 🛠️ Utilitários
│   │   ├── utils.ts              # Funções utilitárias
│   │   ├── formatters.ts         # Formatação de dados
│   │   └── validators.ts         # Validações
│   │
│   ├── hooks/                     # 🪝 Custom Hooks (globais)
│   │   ├── useMediaQuery.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   │
│   └── assets/                    # 🖼️ Recursos estáticos
│       ├── images/
│       ├── fonts/
│       └── icons/
│
├── tests/                         # ✅ Testes (unit, integration, e2e)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                       # 📜 Scripts utilitários
│   ├── seed/
│   └── migration/
│
├── public/                        # 🌐 Arquivos públicos
│   └── index.html
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Fluxos Principais

### 1. Fluxo de Autenticação

```
Login View
  ↓ [handleLogin]
AuthContext (features/auth)
  ↓ [isAuthenticated = true]
App.tsx (rota condicional)
  ↓
Dashboard View
```

### 2. Fluxo de Agendamento

```
Agenda View
  ↓ [usa mock data]
features/appointments/hooks/useAppointments
  ↓
Agenda Component (renderização)
  ↓
Ações (edit/delete) → hooks de atualização (futuro)
```

### 3. Fluxo de IA/Assistente

```
AIConfig View
  ↓ [useAIChat hook]
features/ai/hooks/useAIChat
  ↓ [chamada API]
infrastructure/ai/geminiService
  ↓ [Google Gemini API]
Retorno → UI (chat messages)
```

## Módulos Principais

| Módulo | Responsabilidade | Localização |
|--------|------------------|-------------|
| **Auth** | Autenticação de usuários | `features/auth/` |
| **Dashboard** | Visão geral e métricas | `components/dashboard/` |
| **Agenda** | Gestão de agendamentos | `components/agenda/` + `features/appointments/` |
| **Finance** | Controle financeiro | `components/finance/` |
| **Services** | Catálogo de serviços | `components/services/` + `features/services/` |
| **WhatsApp** | Integração WhatsApp | `components/whatsapp/` + `infrastructure/whatsapp/` |
| **AI Config** | Configuração assistente IA | `components/aiconfig/` + `features/ai/` |

## Estado da Aplicação

**Atual**: State local via React hooks (`useState`, `useEffect`)

**Futuro**: Considerar Context API ou Zustand para estado global se necessário

## Integrações Externas

| Serviço | Propósito | Status | Localização |
|---------|----------|--------|-------------|
| Google Gemini | Assistente virtual | ✅ Implementado | `infrastructure/ai/` |
| WhatsApp API | Confirmações automáticas | 🔲 Futuro | `infrastructure/whatsapp/` |
| Backend API | Dados reais | 🔲 Futuro | `infrastructure/api/` |

## Regras de Design

1. **Separation of Concerns**: Cada módulo tem responsabilidade única
2. **Single Responsibility**: Funções/classes fazem uma coisa bem
3. **Don't Repeat Yourself**: Reutilizar componentes e hooks
4. **Explicit over Implicit**: Nomes claros, sem abreviações
5. **Fail Fast**: Validações no início das funções
6. **Type Safety**: Usar TypeScript estritamente

## Decisões Arquiteturais

### Por que Feature-First?

✅ **Vantagens**:
- Código relacionado fica junto
- Fácil adicionar/remover features
- Equipes podem trabalhar em features isoladas
- Onboarding mais rápido (encontrar código por funcionalidade)

❌ **Desvantagens**:
- Pode haver duplicação entre features
- Requer disciplina para manter separação de camadas

### Por que não usar Redux/Zustand?

- Estado atual é simples (autenticação + view atual)
- React hooks básicos são suficientes
- Adicionar complexidade agora seria over-engineering
- Fácil migrar para estado global no futuro se necessário

### Por que Tailwind via CDN?

⚠️ **Status Atual**: Tailwind via CDN em `index.html`

📋 **Futuro**: Migrar para Tailwind local para:
- Melhor performance
- Tree-shaking automático
- Suporte a customização avançada
- Autocomplete no editor

## Tecnologias

- **Frontend**: React 19.2.3, TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS
- **Charts**: Recharts 3.6.0
- **AI**: Google GenAI 1.34.0
- **Icons**: Material Symbols Outlined
- **Font**: Manrope (Google Fonts)

## Próximas Melhorias Planejadas

1. ✅ Documentação completa
2. ✅ Estrutura de pastas reorganizada
3. 🔲 Testes unitários e de integração
4. 🔲 CI/CD configurado
5. 🔲 Backend API real (substituir mocks)
6. 🔲 WhatsApp integration real
7. 🔲 Error boundaries
8. 🔲 Loading states globais
9. 🔲 Sistema de notificações
10. 🔲 Autenticação real (JWT, OAuth)

## Manutenção

Para manter a arquitetura saudável:

1. **Respeitar fronteiras de importação**
2. **Documentar decisões arquiteturais**
3. **Manter tipos em TypeScript**
4. **Evitar duplicação de código**
5. **Escrever testes para features novas**
6. **Manter README atualizado**

---

**Última atualização**: 2026-03-03
**Responsável**: Dev Sênior
