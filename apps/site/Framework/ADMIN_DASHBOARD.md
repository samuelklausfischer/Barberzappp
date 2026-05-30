# BarberZap Admin Dashboard Framework - Análise Completa

---

## Índice
1. [Visão Geral](#visão-geral)
2. [Design System](#design-system)
3. [Layout & Navegação](#layout--navegação)
4. [Componentes Core](#componentes-core)
5. [Páginas do Dashboard](#páginas-do-dashboard)
6. [Autenticação & Routing](#autenticação--routing)
7. [Recursos Técnicos](#recursos-técnicos)

---

## Visão Geral

O BarberZap Admin Dashboard é um painel administrativo completo e moderno para gestão de barbearias, construído com React, Tailwind CSS e integração com WhatsApp Business. O framework oferece uma experiência de usuário polida, thema escuro profissional e funcionalidades em todos os âmbitos do negócio (agendamento, financeiro, CRM, marketing, IA).

### Características Principais
- **11 Páginas Funcionais**: Cobrir toda operação da barbearia
- **25 Componentes Reutilizáveis**: Biblioteca completa de UI
- **Design System Unificado**: Tokens, guidelines e visual specs
- **Responsivo em 3 Breakpoints**: Mobile, tablet e desktop
- **Dark Theme Profissional**: Slate-900 com acentos gold/amber
- **Glass Morphism**: Backdrop blur e transparências elegantes
- **Integração WhatsApp**: Evolution API com webhooks
- **IA Secretária Virtual**: Configuração avançada de agentes especializados
- **CRM Completo**: Gestão de clientes, histórico e métricas
- **Financeiro Integrado**: Relatórios, gráficos e exportações

### Arquitetura Técnica
```
Framework/
├── DesignSystem/          # Design tokens e diretrizes
│   ├── DESIGN_TOKENS.md
│   ├── COMPONENT_GUIDELINES.md
│   └── VISUAL_SPEC.md
├── LayoutAndNavigation/   # Layout responsivo
│   ├── AdminShell.jsx
│   ├── Sidebar.jsx
│   ├── TopBar.jsx
│   ├── MainContent.jsx
│   ├── MobileBottomNav.jsx
│   └── ROUTES_CONFIG.md
├── CoreComponents/        # Biblioteca de componentes
│   ├── README.md
│   └── COMPONENTS_DOCS.md
├── Pages/                 # Páginas do dashboard
│   ├── AgendaPage.jsx
│   ├── ClientesPage.jsx
│   ├── FinanceiroPage.jsx
│   ├── WhatsAppPage.jsx
│   └── IAConfigPage.jsx
└── Logic/                 # Services e hooks
    ├── agendaFinanceiro.js
    ├── clientLogic.js
    └── iaConfig.js
```

---

## Design System

### Paleta de Cores

O design system utiliza uma paleta escura profissional com acentos em dourado/amber:

#### Cores Primárias
```css
/* Backgrounds */
--bg-primary: #0f172a;       /* slate-900 */
--bg-secondary: #1e293b;     /* slate-800 */
--bg-tertiary: #334155;      /* slate-700 */
--bg-elevated: rgba(30, 41, 59, 0.5); /* slate-800/50 */

/* Accent */
--primary: #f59e0b;          /* amber-500 */
--primary-hover: #fbbf24;    /* amber-400 */
--primary-light: #fcd34d;    /* amber-300 */

/* Text */
--text-primary: #ffffff;
--text-secondary: #94a3b8;   /* gray-400 */
--text-tertiary: #64748b;    /* gray-500 */
--text-disabled: #475569;    /* gray-600 */
```

#### Cores de Status
```css
/* Success */
--success-bg: rgba(16, 185, 129, 0.15);  /* emerald-500/15 */
--success: #10b981;                        /* emerald-500 */
--success-text: #34d399;                  /* emerald-400 */

/* Warning */
--warning-bg: rgba(245, 158, 11, 0.15);   /* amber-500/15 */
--warning: #f59e0b;                        /* amber-500 */

/* Error */
--error-bg: rgba(239, 68, 68, 0.15);      /* red-500/15 */
--error: #ef4444;                          /* red-500 */
--error-text: #f87171;                     /* red-400 */

/* Info */
--info-bg: rgba(59, 130, 246, 0.15);      /* blue-500/15 */
--info: #3b82f6;                          /* blue-500 */
```

### Tipografia

O sistema utiliza a fonte Inter com hierarquia clara:

```css
/* Font Family */
--font-family: 'Inter', system-ui, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;       /* 12px */
--text-sm: 0.875rem;      /* 14px */
--text-base: 1rem;        /* 16px */
--text-lg: 1.125rem;      /* 18px */
--text-xl: 1.25rem;       /* 20px */
--text-2xl: 1.5rem;       /* 24px */
--text-3xl: 1.875rem;     /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaçamento - 8-Point Grid System

```css
/* Base Spacing Unit = 4px (0.25rem) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Efeitos Visuais

#### Glass Morphism
```css
/* Card Backgrounds */
.glass-card {
  background: rgba(30, 41, 59, 0.5);    /* slate-800/50 */
  backdrop-filter: blur(16px);          /* backdrop-blur-xl */
  border: 1px solid rgba(51, 65, 85, 0.5); /* slate-700/50 */
  border-radius: 0.75rem;              /* rounded-xl */
}

/* Hover Effects */
.glass-card:hover {
  border-color: rgba(51, 65, 85, 0.8); /* slate-600 */
  transition: all 0.3s ease;
}
```

#### Sombras
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Glow Effect for Primary Elements */
--glow-primary: 0 0 20px rgba(245, 158, 11, 0.3); /* amber-500/30 */
```

### Breakpoints Responsivos

```css
/* Mobile First Approach */
--screen-xs: 0px;        /* Extra Small */
--screen-sm: 640px;      /* Small (tablet portrait) */
--screen-md: 768px;      /* Medium (tablet landscape) */
--screen-lg: 1024px;     /* Large (desktop) */
--screen-xl: 1280px;     /* Extra Large */
--screen-2xl: 1536px;    /* 2X Large */

/* Media Queries */
@media (min-width: 640px)  { .sm\:hidden { display: none; } }
@media (min-width: 1024px) { .lg\:ml-[260px] { margin-left: 260px; } }
@media (max-width: 639px)  { .mobile\:flex { display: flex; } }
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* rounded-lg */
--radius-md: 0.5rem;     /* rounded-xl */
--radius-lg: 0.75rem;    /* rounded-2xl */
--radius-full: 9999px;   /* rounded-full */
```

### Componentes do Design System

#### Buttons
```jsx
// Primary Button
<button className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all">
  Ação Principal
</button>

// Secondary Button
<button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all">
  Ação Secundária
</button>

// Outline Button
<button className="px-6 py-3 border border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white rounded-lg font-medium transition-all">
  Borda
</button>

// Danger Button
<button className="px-6 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-all">
  Excluir
</button>
```

#### Cards
```jsx
// Standard Card
<div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white">Título do Card</h3>
  <p className="text-gray-400 mt-2">Conteúdo do card</p>
</div>

// Stat Card
<div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all">
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-3 mb-3">
      <DollarSign className="w-5 h-5 text-emerald-400" />
      <span className="text-sm text-gray-400">Faturamento</span>
    </div>
  </div>
  <p className="text-3xl font-bold text-white">R$ 4.521</p>
</div>
```

#### Inputs
```jsx
// Default Input
<input
  type="text"
  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
  placeholder="Digite aqui..."
/>

// Input with Error
<input
  type="email"
  state="error"
  errorMessage="E-mail inválido"
  className="w-full bg-slate-700/50 border border-red-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
  placeholder="seu@email.com"
/>
```

#### Badges
```jsx
// Status Badges
<Badge variant="success">Confirmado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>
<Badge variant="info">Em andamento</Badge>

// Role Badges
(role) => (
  <Badge 
    variant={role === 'admin' ? 'gold' : 'default'}
    style={role === 'admin' ? 'filled' : 'outline'}
  >
    {role}
  </Badge>
)
```

---

## Layout & Navegação

### Estrutura do Layout

O AdminShell é o componente principal que envelopa todas as páginas do admin. Ele fornece uma estrutura consistente com:

1. **TopBar Fixo**: Search, notificações, menu de usuário (z-40, h-16)
2. **Sidebar Responsivo**: Adapta-se ao dispositivo (desktop/tablet/mobile)
3. **MainContent**: Área de conteúdo scrollable com offset do sidebar
4. **MobileBottomNav**: Navegação inferior apenas em mobile (<640px)
5. **Overlays & Modals**: Mobile drawer, more sheet, modais globais

### Layout Responsivo

#### Mobile (< 640px)
```
┌─────────────────────────────┐
│[≡] BarberZap    [🔍][🔔][👤]│  ← TopBar compacto (h-14)
├─────────────────────────────┤
│                             │
│    PAGE CONTENT             │  ← Full width, sem sidebar
│    (flex-1)                 │
│    - Breadcrumbs            │
│    - Header                 │
│    - Cards Grid             │
│   [Scrollable area]         │
│                             │
├─────────────────────────────┤
│[Dashboard][Agenda][Whats][➕]│  ← Bottom Nav visível
└─────────────────────────────┘
```

- **Sidebar**: Oculto por padrão, aparece como drawer
- **BottomNav**: Visível com 4 itens principais
- **Content**: Full width, sem margem lateral
- **Menus**: Full-screen overlay com backdrop

#### Tablet (640px - 1023px)
```
┌─────────────────────────────────────────────┐
│[≡] BarberZap Admin      [Search...] [🔔][👤]│  ← TopBar padrão (h-16)
├──────┬──────────────────────────────────────┤
│      │                                       │
│SIDEBAR│      PAGE CONTENT                    │
│(64px │      (flex-1)                         │
│width)│      - Breadcrumbs                    │
│      │      - Header                         │
│[≡]   │      - Cards Grid                     │
│Dash  │      [Scrollable area]                │
│Agend│                                       │
│Clien│                                       │
│Servi│   Collapse toggle (⊖)                  │
└──────┴──────────────────────────────────────┘
      ↑
  Pode expandir para 240px
```

- **Sidebar**: Colapsado por padrão (64px), expandível (240px)
- **BottomNav**: Oculto
- **Content**: Margem ajustada de acordo com sidebar

#### Desktop (≥ 1024px)
```
┌──────────────────────────────────────────────────────────────┐
│BarberZap Admin    [Search...]                  [🔔][User▼]   │  ← TopBar completo (h-16)
├───────────┬──────────────────────────────────────────────────┤
│           │                                                  │
│ SIDEBAR   │              PAGE CONTENT                        │
║(260px)    ║              (max-w-7xl)                         ║
║           ║              • Breadcrumbs                       ║
║ Branding  ║              • Header                            ║
║           ║              • Grid de Cards                     ║
║ Navigatn  ║              [Scrollable area]                   ║
║           ║                                                  ║
║ •Dashboard║                                                  ║
║ • Agenda  │                                                  ║
║ •Clientes│                                                  ║
║ •Serviços│                                                  ║
║ •Funcion.│                                                  ║
║ •Financeiro│                                                 ║
║ •WhatsApp│                                                  ║
║ •IA Config│                                                 ║
║ •Aparência│                                                 ║
║ •Config  │                                                  ║
║           ║                                                  ║
║ ───────────────────────────────────────────────────────────── ║
║           ┌───────┐                                        ║
║           │Salir 🚪│                                        ║
║           └───────┘                                        ║
└───────────┴──────────────────────────────────────────────────┘
```

- **Sidebar**: Fixo expandido (260px), pode colapsar
- **BottomNav**: Oculto
- **Content**: Margem-left de 260px (ou 64px se colapsado)
- **Independent scrolling**: Sidebar e Content scrollam independentemente

### Componentes de Navegação

#### TopBar
- **Localização**: Fixed top, z-40, height fixo
- **Componentes**:
  - Logo/Branding à esquerda
  - Barra de busca (Ctrl/Cmd + K)
  - Badge de notificações
  - Avatar do usuário com dropdown
- **Responsivo**: Compacto em mobile, completo em desktop/tablet

#### Sidebar
- **11 itens de navegação** com ícones Lucide
- **Badges de contagem** em itens relevantes
- **Indicador visual de item ativo** com glow effect
- **Logout** na parte inferior

#### MobileBottomNav
- **4 itens principais**: Dashboard, Agenda, WhatsApp, Mais
- **Botão "Mais"**: Abre sheet com rotas adicionais
- **Somente mobile**: Visível apenas em <640px

#### MobileNavMoreSheet
- **Sheet deslizante** com rotas não inclusas no bottom nav
- **Backdrop** para fechar ao clicar fora
- **Animação**: Slide-up com spring do Framer Motion

### Rotas do Sistema

O sistema possui 12 rotas principais (11 do admin + login):

| # | Rota | Ícone | Descrição | Bottom Nav |
|---|------|-------|-----------|------------|
| 1 | `/admin/dashboard` | LayoutDashboard | Visão geral e métricas | ✅ |
| 2 | `/admin/agenda` | Calendar | Gerenciamento de agendamentos | ✅ |
| 3 | `/admin/horarios` | Clock | Configuração de horários de funcionamento | ❌ |
| 4 | `/admin/clientes` | Users | CRM completo | ❌ |
| 5 | `/admin/servicos` | Scissors | Catálogo de serviços | ❌ |
| 6 | `/admin/funcionarios` | UserCog | Gestão de equipe | ❌ |
| 7 | `/admin/financeiro` | DollarSign | Faturamento e relatórios | ❌ |
| 8 | `/admin/whatsapp` | MessageCircle | Integração WhatsApp | ✅ |
| 9 | `/admin/ai-config` | BrainCircuit | Configuração da IA | ❌ |
| 10 | `/admin/aparencia` | Palette | Tema e branding | ❌ |
| 11 | `/admin/configuracoes` | Settings | Configurações gerais | ❌ |
| 12 | `/login` | Lock | Tela de login | N/A |

### State Management de Layout

O hook `useSidebarState` gerencia o estado do layout:

```javascript
{
  isMobileOpen: boolean,      // Mobile drawer visibility
  isCollapsed: boolean,       // Sidebar collapsed (tablet/desktop)
  isTabletMode: boolean,      // Derived from window width
  setMobileOpen: function,    // Toggle mobile drawer
  setCollapsed: function,     // Toggle sidebar collapse
}
```

### Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl/Cmd + B` | Toggle sidebar (tablet/desktop) |
| `Ctrl/Cmd + K` | Abrir busca global |
| `Escape` | Fechar modais, drawers, sheets |

### Animações e Transições

O sistema utiliza **Framer Motion** para animações fluidas:

- **Mobile Sidebar**: Slide-in com spring animation (300ms)
- **Page Transitions**: Fade + Y-shift (150ms in, 200ms out)
- **Active Nav Indicator**: Glow + movimento suave (100ms)
- **Mobile More Sheet**: Slide-up (200ms)

### Z-Index Stack

```
70: Mobile More Sheet
60: Mobile Sidebar Drawer + Backdrop
50: Mobile Bottom Nav
40: TopBar (fixed header)
30: Sidebar (desktop/tablet)
20: Page Content
10: Modals/Panels
0:  Base content
```

---

## Componentes Core

### Visão Geral

A biblioteca de componentes consiste em **25 componentes reutilizáveis** organizados em 4 categorias:

### Data Display (5 componentes)

#### 1. StatCard
Card de métrica com ícone, valor, label e trend.

```jsx
<StatCard
  icon={DollarSign}
  value="R$ 4.521"
  label="Faturamento Hoje"
  trend="up"
  trendValue={12.5}
  variant="default" // default | compact | large
/>
```

**Props**: icon, value, label, trend, trendValue, loading, variant

#### 2. DataTable
Tabela ordenável com paginação.

```jsx
<DataTable
  columns={[
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    { key: 'email', label: 'E-mail' },
    { key: 'status', label: 'Status' }
  ]}
  data={customers}
  pagination={{ currentPage: 1, totalPages: 10 }}
  onPageChange={(page) => loadPage(page)}
  onRowClick={(row) => navigate(`/customers/${row.id}`)}
/>
```

**Props**: columns, data, loading, pagination, onPageChange, onSort, onRowClick

#### 3. CardList
Lista de cards (horizontal/vertical/grid).

```jsx
<CardList
  items={clients}
  orientation="vertical"
  hoverable
  onItemClick={(client) => openModal(client)}
>
  {({ item }) => (
    <CardItem
      avatar={<Avatar src={item.avatar} name={item.name} />}
      title={item.name}
      subtitle={item.email}
      description={`${item.totalAppointments} visitas`}
      badge={<StatusBadge status={item.status} />}
    />
  )}
</CardList>
```

#### 4. Badge
Badges de status/roles.

```jsx
// Variantes pre-configuradas
<Badge variant="success">Confirmado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>
<Badge variant="info">Em andamento</Badge>

// Badges customizados
<Badge 
  variant="ghost" 
  size="xs"
  pulsing
>
  3 novos
</Badge>
```

**Variantes**: success, warning, error, info, gold, default
**Estilos**: filled, outline, ghost
**Tamanhos**: xs, sm, base, lg

#### 5. Avatar
Avatar com fallback de iniciais.

```jsx
<Avatar
  name="João Silva"
  src={avatarUrl}
  size="xl"
  showStatus
  status="online"
/>

// Grupo de avatares
<AvatarGroup>
  <Avatar name="Ana" />
  <Avatar name="Bruno" />
  <Avatar name="Carlos" />
  <Avatar name="+5" />
</AvatarGroup>
```

**Tamanhos**: xs, sm, base, lg, xl, 2xl

### Form Elements (7 componentes)

#### 1. Input
Campo de texto com estados.

```jsx
<Input
  label="Nome Completo"
  placeholder="Digite seu nome..."
  value={name}
  onChange={(e) => setName(e.target.value)}
  state="error"
  errorMessage="Este campo é obrigatório"
  helperText="Mínimo 3 caracteres"
  required
  leftIcon={<User className="w-5 h-5" />}
/>
```

**Estados**: default, error, success

#### 2. Select
Dropdown com busca.

```jsx
<Select
  label="Selecione um Serviço"
  options={[
    { value: 'haircut', label: 'Corte de Cabelo' },
    { value: 'beard', label: 'Barba' },
    { value: 'combo', label: 'Combo Cabelo + Barba' }
  ]}
  value={service}
  onChange={setService}
  searchable
/>
```

#### 3. DatePicker
Selecionador de data.

```jsx
<DatePicker
  label="Data do Agendamento"
  value={date}
  onChange={setDate}
  minDate={new Date()}
  maxDate={maxDate}
  locale="pt-BR"
/>
```

#### 4. PhoneInput
Input de telefone brasileiro.

```jsx
<PhoneInput
  label="Telefone"
  value={phone}
  onChange={setPhone}
  format="(XX) XXXXX-XXXX"
/>
```

#### 5. Toggle
Switch on/off.

```jsx
<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="Ativo"
  description="Habilitar notificações"
/>
```

#### 6. Checkbox/Radio
Checkboxes e radios customizados.

```jsx
<Checkbox
  checked={accepted}
  onChange={setAccepted}
  label="Concordo com os termos"
  required
/>

<RadioGroup
  value={paymentMethod}
  onChange={setPaymentMethod}
>
  <Radio value="pix" label="PIX" />
  <Radio value="card" label="Cartão" />
  <Radio value="cash" label="Dinheiro" />
</RadioGroup>
```

#### 7. SearchBox
Busca global com histórico.

```jsx
<SearchBox
  placeholder="Buscar agendamentos, clientes, serviços..."
  onSearch={(query) => performSearch(query)}
  suggestions={['João Silva', 'Corte Cabelo', 'Agenda']}
  recentSearches={['Agenda de hoje', 'Clientes ativos']}
  clearAfterSelect
/>
```

### Navigation & Actions (7 componentes)

#### 1. Button
Botões com variantes.

```jsx
<Button variant="primary" leftIcon={<Plus />}>
  Criar Agendamento
</Button>

<Button variant="secondary" rightIcon={<Download />}>
  Exportar CSV
</Button>

<Button variant="outline" size="sm">
  Cancelar
</Button>

<Button variant="danger" loading>
  Excluir
</Button>
```

**Variantes**: primary, secondary, outline, danger, ghost
**Tamanhos**: sm, md, lg

#### 2. IconButton
Botão de ícone.

```jsx
<IconButton
  icon={<Edit />}
  onClick={handleEdit}
  tooltip="Editar"
  variant="ghost"
/>
```

#### 3. ButtonGroup
Grupo de botões.

```jsx
<ButtonGroup>
  <Button>Dia</Button>
  <Button variant="active">Semana</Button>
  <Button>Mês</Button>
</ButtonGroup>
```

#### 4. Tabs
Abas de navegação.

```jsx
<Tabs
  activeTab="overview"
  onChange={setActiveTab}
>
  <Tab value="overview" label="Visão Geral" />
  <Tab value="details" label="Detalhes" />
  <Tab value="history" label="Histórico" />
</Tabs>
```

#### 5. Breadcrumbs
Breadcrumbs de navegação.

```jsx
<Breadcrumbs
  items={[
    { label: 'Home', path: '/admin' },
    { label: 'Clientes', path: '/admin/clientes' },
    { label: 'João Silva', active: true }
  ]}
/>
```

#### 6. Dropdown
Menu dropdown.

```jsx
<Dropdown
  trigger={<Button>Ações</Button>}
  align="right"
>
  <Dropdown.Item onClick={handleEdit}>Editar</Dropdown.Item>
  <Dropdown.Item onClick={handleDuplicate}>Duplicar</Dropdown.Item>
  <Dropdown.Separator />
  <Dropdown.Item onClick={handleDelete} variant="danger">Excluir</Dropdown.Item>
</Dropdown>
```

#### 7. Pagination
Paginação de tabelas.

```jsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  showSizeChanger
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
/>
```

### Feedback & Overlays (6 componentes)

#### 1. Alert
Alertas informativos.

```jsx
<Alert variant="success" dismissible onDismiss={onDismiss}>
  <CheckCircle className="w-5 h-5" />
  <div>
    <p className="font-semibold">Sucesso!</p>
    <p>As alterações foram salvas.</p>
  </div>
</Alert>

<Alert variant="warning">
  <AlertCircle className="w-5 h-5" />
  <p>Atenção: Esta ação não pode ser desfeita.</p>
</Alert>
```

**Variantes**: success, warning, error, info

#### 2. Toast
Notificações toast.

```jsx
<Toast
  variant="success"
  title="Agendamento criado!"
  message="Confirmado para amanhã às 14:00"
  duration={3000}
  position="top-right"
  onDismiss={() => dismiss()}
/>
```

#### 3. LoadingSpinner
Indicador de carregamento.

```jsx
<LoadingSpinner size="md" color="amber-500" />

// Full page loader
<LoadingSpinner fullPage message="Carregando..." />
```

#### 4. EmptyState
Estado vazio.

```jsx
<EmptyState
  icon={<Calendar className="w-16 h-16" />}
  title="Nenhum agendamento encontrado"
  description="Crie seu primeiro agendamento para começar"
  actionText="Novo Agendamento"
  onAction={handleCreate}
/>
```

#### 5. Modal
Modal dialog.

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Novo Cliente"
  size="lg"
>
  <ModalBody>
    <Input label="Nome" />
    <Input label="E-mail" />
    <PhoneInput label="Telefone" />
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancelar
    </Button>
    <Button onClick={handleSave}>Salvar</Button>
  </ModalFooter>
</Modal>
```

**Tamanhos**: sm, md, lg, xl, full

#### 6. ConfirmDialog
Modal de confirmação.

```jsx
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Excluir Cliente?"
  message="Esta ação não pode ser desfeita."
  confirmText="Sim, excluir"
  cancelText="Cancelar"
  variant="danger"
/>
```

---

## Páginas do Dashboard

### 1. Dashboard Home (Visão Geral)

**Rota:** `/admin/dashboard`

**Objetivo:** Visão consolidada com métricas principais e KPIs da barbearia.

**Componentes Principais:**
- StatCards com métricas em tempo real
- Chart de faturamento (últimos 7 dias)
- Agenda do dia compacta
- Lista de agendamentos pendentes
- Notificações recentes

**Métricas Exibidas:**
- Receita do dia/mês
- Total de agendamentos
- Novos clientes
- Taxa de ocupação
- Ticket médio

---

### 2. Agenda (Gerenciamento de Agendamentos)

**Rota:** `/admin/agenda`

**Objetivo:** Gerenciar todos os agendamentos da barbearia com calendar view.

**Features:**
- **Calendar interativo** com view mensal/semanal/diária
- **Drag & drop** para reagendamento
- **Criar agendamento** com modal completo
- **Slots de horário** dinâmicos por barbeiro
- **Filtros** por status, barbeiro e busca
- **Ações em massa**: Confirmar pendentes, marcar não compareceu
- **Integração WhatsApp** para confirmar via mensagem

**Status de Agendamento:**
- `pending` - Pendente (aguardando confirmação)
- `confirmed` - Confirmado
- `completed` - Concluído
- `cancelled` - Cancelado pelo cliente
- `no_show` - Não compareceu
- `in_progress` - Em andamento

**Modal de Agendamento:**
```
┌─────────────────────────────────┐
│ Novo Agendamento               │
├─────────────────────────────────┤
│ Cliente: [Dropdown]             │
│ Serviço: [Dropdown]             │
│ Barbeiro: [Dropdown]            │
│ Data: [Date Picker]             │
│ Horário: [Grid de slots]        │
│ Duração: [Number] min          │
│ Preço: [Currency] R$            │
│ Status: [Select]                │
│ Pagamento: [Select]             │
│ Observações: [Textarea]         │
├─────────────────────────────────┤
│   [Cancelar]  [Agendar]        │
└─────────────────────────────────┘
```

**Cards de Estatísticas:**
- Agendamentos hoje
- Agendamentos esta semana
- Cancelados
- Duração média

---

### 3. Horários (Horário de Funcionamento)

**Rota:** `/admin/horarios`

**Objetivo:** Configurar horários de funcionamento da barbearia.

**Features:**
- Configuração por dia da semana
- Pausas/almoço
- Feriados e datas especiais
- Horário de verão
- Múltiplos turnos

---

### 4. Clientes (CRM Completo)

**Rota:** `/admin/clientes`

**Objetivo:** Gestão completa da base de clientes.

**Features:**
- **Lista de clientes** com busca e filtros
- **Cards detalhados** com informações do cliente
- **Grid e list view** modo
- **Histórico de agendamentos** por cliente
- **Métricas de cliente**: total gasto, visitas, última visita
- **Exportação CSV**
- **Envio WhatsApp** em massa
- **Status do cliente**: ativo, inativo, pendente, arquivado

**Card de Cliente:**
```
┌──────────────────────────────────┐
│ [JS] João Silva                │
│      🟢 Ativo                   │
│                                  │
│ joao@email.com                   │
│ (11) 98765-4321                 │
│                                  │
│ 24 visitas | R$ 2.450 total     │
│ Última há 2 dias                 │
└──────────────────────────────────┘
```

**Estatísticas:**
- Total de clientes
- Clientes ativos
- Clientes inativos
- Clientes pendentes

**Ações:**
- Novo cliente
- Editar cliente
- Arquivar cliente
- Enviar mensagem WhatsApp
- Exportar CSV

---

### 5. Serviços (Catálogo de Serviços)

**Rota:** `/admin/servicos`

**Objetivo:** Gerenciar o catálogo de serviços oferecidos.

**Features:**
- Lista de serviços com preço e duração
- Categorização (cabelo, barba, combo, acessórios)
- Ativar/desativar serviços
- Upload de imagens
- Descrições detalhadas

---

### 6. Funcionários (Gestão de Equipe)

**Rota:** `/admin/funcionarios`

**Objetivo:** Gerenciar os barbeiros/funcionários.

**Features:**
- Cadastro de funcionários
- Configuração de comissão
- Horários individuais
- Especialidades
- Foto de perfil
- Métricas de desempenho

---

### 7. Financeiro (Faturamento)

**Rota:** `/admin/financeiro`

**Objetivo:** Acompanhar o faturamento e gerar relatórios.

**Features:**
- ****Dashboard de métricas**: Faturamento mês, total agendamentos, ticket médio, faturamento do dia
- **Gráfico de receita**: Últimos 7 dias com line chart
- **Gráfico por categoria**: Bar chart com faturamento por tipo de serviço
- **Breakdown por método de pagamento**: Dinheiro, crédito, débito, PIX, pendente
- **Tabela de transações**: Detalhada com filtros avançados
- **Exportação CSV** de transações
- **Relatórios impressos**

**Cards de Estatísticas:**
1. Faturamento Mês (mês atual, trend comparativo)
2. Total Agendamentos (no período)
3. Ticket Médio (por atendimento)
4. Hoje (faturamento do dia)

**Gráficos:**
- Revenue Line Chart: Faturamento últimos 7 dias
- Revenue Bar Chart: Por categoria de serviço

**Filtros:**
- Busca por nome do cliente
- Período (date range)
- Filtro por barbeiro
- Filtro por método de pagamento
- Filtro por status

**Tabela de Transações:**
| Data/Hora | Cliente | Serviço | Barbeiro | Valor | Pagamento | Status |
|-----------|---------|---------|----------|-------|-----------|--------|

**Métodos de Pagamento:**
- `cash` - Dinheiro 💵
- `credit` - Crédito 💳
- `debit` - Débito 💳
- `pix` - PIX ⚡
- `pending` - Pendente ⏳

---

### 8. WhatsApp (Integração)

**Rota:** `/admin/whatsapp`

**Objetivo:** Gerenciar a integração com WhatsApp Business via Evolution API.

**Features:**
- **Status de conexão** em tempo real
- **QR Code** para conectar/dispositivos
- **Configuração da API** (URL base, API key, nome da instância)
- **Enviar mensagens de teste**
- **Logs de webhook** (mensagens recebidas)
- **Regras de resposta automática** com IA
- **Simular webhooks** para teste

**Painel de Status:**
```
┌─────────────────────────────────────────┐
│ [🟢] Conectado                          │
│ Instância: barberzap01                  │
│                                         │
│ Estado: OPEN                            │
│ Última verif: Hoje às 14:32            │
│                                         │
│    [QR Code]                            │
│   (conectado)                           │
│                                         │
│  [Atualizar] [Desconectar]              │
└─────────────────────────────────────────┘
```

**Estatísticas:**
- Mensagens recebidas
- Regras ativas de auto-reply
- Instância ativa

**Enviar Mensagem de Teste:**
```
┌─────────────────────────────────┐
│ Enviar Mensagem de Teste       │
├─────────────────────────────────┤
│ Telefone: [_______________]     │
│ Mensagem: [_______________]     │
│           [_______________]     │
│                                 │
│  [Enviar Mensagem]              │
└─────────────────────────────────┘
```

**Regras de Auto-Reply:**
| Nome | Palavras-chave | Resposta | IA | Status |
|------|----------------|----------|-----|--------|
| Bem-vindo | oi, olá, hello | Olá! Bem-vindo... | ✅ | Ativo |
| Horários | horário, hora | Funcionamos das 9h às 18h... | ❌ | Ativo |

**Configuração da API:**
- URL Base: `http://localhost:8080`
- API Key: `chave-secreta`
- Nome da Instância: `barberzap01`
- Webhook URL: Automatizado

---

### 9. IA Config (Secretária Virtual)

**Rota:** `/admin/ai-config`

**Objetivo:** Personalizar a secretária virtual (Ana) com agentes especializados.

**Features:**
- **5 abas de configuração**: Identidade, Voz & Tom, Modelo, Especialistas, Conhecimento
- **Identidade**: Nome, foto, mensagem de boas-vindas
- **Voz & Tom**: Seleção de tom, templates de resposta
- **Modelo**: Escolha do modelo LLM, temperatura, max tokens
- **Especialistas**: Ativar/desativar agentes especializados
- **Conhecimento**: Importar serviços, horas, FAQ customizado
- **Preview ao vivo** do chat
- **Estatísticas** da IA

**Especialistas Disponíveis:**
1. **Agendamento** 📅 - Gestão de horários e reservas
2. **Preços** 💰 - Informações sobre valores e planos
3. **Localização** 📍 - Endereço e como chegar
4. **Outros** 💬 - Conversas gerais e dúvidas diversas

**Configuração de Identidade:**
- Nome da secretária: "Ana"
- Foto de perfil (upload)
- Mensagem de boas-vindas
- Horário de funcionamento
- Localização (endereço, cidade, estado, telefone)

**Configuração de Tom:**
- **Profissional**: Formal, educado, conciso
- **Amigável**: Caloroso, coloquial, acolhedor
- **Enérgico**: Animado, emotivo, expressivo
- **Descontraído**: Relaxado, humor, casual

- Templates de resposta por tipo (saudação, agendamento, preços, localização)
- Texto de fallback (quando não entende a mensagem)

**Configuração de Modelo:**
- GPT-4o (Recomendado) - Mais inteligente, mais caro
- GPT-4o-mini - Equilíbrio custo/benefício
- GPT-3.5-turbo - Mais econômico
- **Temperatura**: 0.0 (preciso) a 1.0 (criativo)
- **Max Tokens**: Limite de caracteres

**Preview ao Vivo:**
```
┌─────────────────────────────────┐
│  Preview Chat                   │
├─────────────────────────────────┤
│         [Ana avatar]            │
│                                 │
│ Olá! Bem-vindo à nossa           │
│ barbearia. Como posso ajudar?   │
│                                 │
│ ┌─────────────────────────────┐│
│ │ [ ] Digite sua mensagem...   ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Estatísticas da IA:**
- Mensagens tratadas
- Taxa de sucesso
- Transferências para humano

---

### 10. Aparência (Tema e Branding)

**Rota:** `/admin/aparencia`

**Objetivo:** Personalizar a aparência visual do dashboard.

**Features:**
- **Core colors**: Primário, secundário, background
- **Logo**: Upload do logo da barbearia
- **Tipografia**: Fonte personalizada
- **Layout preferences**: Modo de visualização
- **Theme options**: Dark, light, system preference

---

### 11. Configurações (Configurações Gerais)

**Rota:** `/admin/configuracoes`

**Objetivo:** Configurações gerais do sistema.

**Features:**
- **Dados da barbearia**: Nome, CNPJ, endereço
- **Configurações de agendamento**: Prazos, confirmações automáticas
- **Notificações**: Email, WhatsApp, in-app
- **Integrações**: Chaves de API, webhooks
- **Backup e restore** de dados
- **Logs do sistema**

---

## Autenticação & Routing

### Estrutura de Autenticação

O sistema utiliza React Router com proteção de rotas:

```javascript
// Rotas públicas
/login

// Rotas protegidas
/admin/* (requer autenticação)
```

### AuthContext

O contexto de autenticação gerencia:

```javascript
{
  user: {
    id: string,
    name: string,
    email: string,
    role: 'admin' | 'staff',
    avatar: string
  },
  token: string,
  isAuthenticated: boolean,
  isLoading: boolean,
  login: (credentials) => Promise<void>,
  logout: () => void,
  refreshUser: () => Promise<void>
}
```

### ProtectedRoute Component

Componente wrapper que protege rotas:

```javascript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

Redireciona para `/login` se não autenticado.

### Estrutura de Rotas

```javascript
<Routes>
  {/* Public */}
  <Route path="/login" element={<LoginPage />} />

  {/* Protected Admin */}
  <Route path="/admin" element={<ProtectedRoute><AdminShell /></ProtectedRoute>}>
    <Route index element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="agenda" element={<AgendaPage />} />
    <Route path="horarios" element={<HorariosPage />} />
    <Route path="clientes" element={<ClientesPage />} />
    <Route path="servicos" element={<ServicosPage />} />
    <Route path="funcionarios" element={<FuncionariosPage />} />
    <Route path="financeiro" element={<FinanceiroPage />} />
    <Route path="whatsapp" element={<WhatsAppPage />} />
    <Route path="ai-config" element={<IAConfigPage />} />
    <Route path="aparencia" element={<AparienciaPage />} />
    <Route path="configuracoes" element={<ConfiguracoesPage />} />

    {/* Nested Routes */}
    <Route path="clientes/:id" element={<ClienteDetailPage />} />
    <Route path="agenda/:id/edit" element={<AgendaEditPage />} />
  </Route>

  {/* Catch-all */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Breadcrumbs

Sistema automático de breadcrumbs:

```
Home > Dashboard
Home > Agenda > Editar Agendamento
Home > Clientes > João Silva
```

```javascript
const getBreadcrumbs = (path) => {
  const route = getRouteByPath(path);
  return [
    { label: 'Admin', path: '/admin' },
    { label: route.label, path: route.path }
  ];
};
```

---

## Recursos Técnicos

### Stack Tecnológico

```yaml
Frontend:
  - React 18+
  - React Router 6+
  - Tailwind CSS 3+
  - Framer Motion 10+
  - Lucide React (Ícones)
  - Date-fns (Datas)
  - Recharts (Gráficos - opcional)

Backend (Integration):
  - Evolution API (WhatsApp)
  - OpenAI API (IA)
  - REST API (custom)

State Management:
  - React Context API
  - React Hooks (useState, useEffect, useReducer)

Styling:
  - Tailwind Utility Classes
  - CSS Custom Properties (Design Tokens)
  - Inline Styles (variáveis dinâmicas)
```

### Performance

1. **Lazy Loading**: Rotas carregadas sob demanda com React.lazy
2. **Code Splitting**: Separação por página e funcionalidade
3. **Image Optimization**: Lazy loading e formatos modernos
4. **Memoization**: React.memo e useMemo onde aplicável
5. **Debounce**: Buscas e filtros com debounce de 300ms

### Acessibilidade (WCAG 2.1 AA)

- Contraste mínimo de 4.5:1 para texto
- Navegação por teclado completa
- ARIA labels e roles
- Focus indicators visíveis
- Screen reader support
- Reduced motion support

- ✅ Todos os componentes seguem WCAG AA
- ✅ Atalhos de teclado documentados
- ✅ Labels descritivos em todos os inputs
- ✅ Feedback visual para todas as ações

### Responsividade

Breakpoints definidos no Tailwind:
- `xs`: 0px (mobile)
- `sm`: 640px (tablet portrait)
- `md`: 768px (tablet landscape)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (extra large desktop)

Comportamento adaptativo:
- Mobile-first approach
- Layouts que mudam: grid/flex/stack
- Font sizes responsivos
- Padding/margin adaptativos
- Mostrar/ocultar elementos por breakpoint

### Animações

Todas as animações usadas no sistema:

```javascript
// Page Transitions
fadeIn: { opacity: 1, duration: 150 }
fadeOut: { opacity: 0, duration: 200 }

// Mobile Sidebar
slideInRight: { x: 0, transition: { type: 'spring', bounce: 0.3 } }
slideOutRight: { x: '100%' }

// Nav Item Active Indicator
glow: { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' }

// Stat Card Hover
scaleUp: { scale: 1.02 }

// Button Ripple (optional)
ripple: { duration: 400 }
```

### Internacionalização

Preparado para i18n:
- Textos externalizados
- Formatação de datas (pt-BR por padrão)
- Formatação de moeda (BRL)
- RTL support (future)

### Logging e Debugging

```javascript
// Console logging
console.log('[AdminShell]', 'Sidebar toggled');

// Error tracking
try {
  // ...
} catch (error) {
  console.error('[AgendaPage]', 'Failed to load appointments', error);
  // Send to monitoring service
}
```

### Testing Strategy

Recomendado:
- Unit tests: Components e hooks (Jest + React Testing Library)
- Integration tests: Fluxos completos (Cypress/Playwright)
- E2E tests: Cenários de usuário
- Visual regression tests (Chromatic - optional)

### Deployment Considerations

- **Build**: `npm run build` (React build otimizado)
- **Environment Variables**: `.env` com configurações sensíveis
- **API Keys**: Nunca commitar no repo
- **Caching**: Configure cache headers para assets estáticos
- **HTTPS**: Obrigatório para produção
- **Backups**: Backup regular do banco de dados

---

## Guia Rápido de Uso

### Como Criar uma Nova Página

1. Crie o componente em `Pages/NovaPagina.jsx`
2. Adicione a rota em `LayoutAndNavigation/ROUTES_CONFIG.md`
3. Adicione o link no Sidebar
4. Exporte em `Pages/index.js`

```jsx
// Pages/NovaPagina.jsx
import { DashboardContainer } from '../CoreComponents';
import { StatCard } from '../CoreComponents';

export const NovaPagina = () => {
  return (
    <DashboardContainer>
      <div className="p-6">
        <h1>Nova Página</h1>
        <p>Conteúdo da página...</p>
      </div>
    </DashboardContainer>
  );
};
```

### Como Adicionar um Novo Componente

1. Crie em `CoreComponents/NovoComponente.jsx`
2. Documente props e variants
3. Exporte em `CoreComponents/index.js`
4. Adicione exemplos no Storybook

```jsx
// CoreComponents/NovoComponente.jsx
export const NovoComponente = ({ prop1, prop2 }) => {
  return (
    <div className="...">
      {/* Component content */}
    </div>
  );
};
```

### Como Usar os Services

```javascript
import { clientService } from '../Logic/clientLogic';

// Get data
const clients = await clientService.getClients();

// Create
await clientService.createClient(data);

// Update
await clientService.updateClient(id, data);

// Delete
await clientService.deleteClient(id);
```

---

## Conclusão

O BarberZap Admin Dashboard Framework é uma solução completa, profissional e escalável para gestão de barbearias. Com:

- **25 componentes reutilizáveis** para acelerar desenvolvimento
- **Design system unificado** garantindo consistência visual
- **11 páginas funcionais** cobrindo todos os aspectos do negócio
- **Layout responsivo** em 3 breakpoints
- **Dark theme profissional** com glass morphism
- **Integração WhatsApp** nativa
- **IA secretária virtual** configurável
- **CRM e Financeiro** completos

O framework está pronto para uso em produção e pode ser facilmente estendido com novas funcionalidades e integrações.

---

**Última atualização:** 2026-02-25  
**Versão:** 1.0.0  
**Autor:** BarberZap Development Team
