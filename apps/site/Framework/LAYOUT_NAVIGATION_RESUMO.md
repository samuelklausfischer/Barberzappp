# BarberZap Admin Dashboard - Layout & Navigation Resumido

---

## Visão Geral

O Layout & Navigation Framework define a estrutura responsiva do Admin Dashboard com adaptações para mobile, tablet e desktop.

## Estrutura de Componentes

```
AdminShell (Root)
├── TopBar (fixed, z-40)
│   ├── Logo/Branding
│   ├── Search (Ctrl/Cmd + K)
│   ├── Notifications badge
│   └── User dropdown
├── Sidebar (responsive, z-30)
│   ├── Branding
│   ├── Navigation items (11)
│   ├── Collapse toggle
│   └── Logout button
├── MainContent (scrollable, z-20)
│   ├── Breadcrumbs
│   ├── Page header
│   └── Content area
├── MobileBottomNav (z-50, mobile only)
│   └── 4 main tabs
└── Overlays
    ├── Mobile drawer
    ├── Mobile more sheet
    └── Modals
```

## Layout Responsivo

### Mobile (< 640px)

```
┌─────────────────────────────┐
│[≡] BarberZap    [🔍][🔔][👤]│  ← TopBar compacto (h-14)
├─────────────────────────────┤
│                             │
│    PAGE CONTENT (full)      │  ← Sem sidebar
│   ┌───────────────────────┐ │
│   │                       │ │
│   │   [Scrollable]        │ │
│   │                       │ │
│   └───────────────────────┘ │
├─────────────────────────────┤
│[Dashboard][Agenda][Whats][➕]│  ← Bottom Nav
└─────────────────────────────┘
```

- Sidebar: Oculto, aparece como drawer
- BottomNav: 4 itens (Dashboard, Agenda, WhatsApp, Mais)
- Content: Full width

### Tablet (640px - 1023px)

```
┌─────────────────────────────────────────────┐
│[≡] BZ Admin      [Search...]        [🔔][👤]│  ← TopBar (h-16)
├──────┬──────────────────────────────────────┤
│      │                                       │
│SIDEBAR│      PAGE CONTENT                    │
│(64px)│      (margin-left: 64px)             │
│      │                                       │
│[≡]   │      ┌───────────────────────┐       │
│Dash  │      │                       │       │
│Agend │      │   [Scrollable]        │       │
│Clien │      │                       │       │
│Servi │      └───────────────────────┘       │
└──────┴──────────────────────────────────────┘
    ↑
  Expande para 240px
```

- Sidebar: Colapsado (64px), expandível (240px)
- BottomNav: Oculto
- Content: Margem adjusts

### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────┐
│BarberZap Admin    [Search...]                    [🔔][User▼]│  ← TopBar (h-16)
├───────────┬──────────────────────────────────────────────────┤
│           │                                                  │
│ SIDEBAR   │              PAGE CONTENT                        │
║(260px)    ║              (margin-left: 260px)                ║
║           ║              • Breadcrumbs                       ║
║ Branding  ║              • Header                            ║
║           ║              • Grid de Cards                     ║
║ •Dashboard║              [Scrollable area]                   ║
║ • Agenda  ⎞                                                  ║
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

- Sidebar: Fixo expandido (260px), colapsável
- BottomNav: Oculto
- Content: Margem-left de 260px

## Rotas do Sistema

| # | Rota | Ícone | Descrição | Bottom Nav |
|---|------|-------|-----------|------------|
| 1 | `/admin/dashboard` | LayoutDashboard | Visão geral | ✅ |
| 2 | `/admin/agenda` | Calendar | Agendamentos | ✅ |
| 3 | `/admin/horarios` | Clock | Horários | ❌ |
| 4 | `/admin/clientes` | Users | CRM | ❌ |
| 5 | `/admin/servicos` | Scissors | Serviços | ❌ |
| 6 | `/admin/funcionarios` | UserCog | Funcionários | ❌ |
| 7 | `/admin/financeiro` | DollarSign | Financeiro | ❌ |
| 8 | `/admin/whatsapp` | MessageCircle | WhatsApp | ✅ |
| 9 | `/admin/ai-config` | BrainCircuit | IA Config | ❌ |
| 10 | `/admin/aparencia` | Palette | Aparência | ❌ |
| 11 | `/admin/configuracoes` | Settings | Configurações | ❌ |

## Componentes de Navegação

### TopBar

- **Altura**: 56px (h-14 mobile) / 64px (h-16 desktop)
- **Posição**: Fixed top, z-40
- **Elementos**:
  - Logo/Branding (esquerda)
  - Search global (Ctrl/Cmd + K)
  - Badge de notificações
  - Avatar + dropdown usuário

### Sidebar

- **Mobile** (<640px): Drawer overlay, 280px width
- **Tablet** (640-1023px): 64px colapsado, 240px expandido
- **Desktop** (≥1024px): 260px expandido, 64px colapsável
- **11 itens** de navegação com ícones Lucide
- **Indicador** de item ativo com glow effect
- **Logout** na parte inferior

### MobileBottomNav

- **Visível**: Somente em mobile (<640px)
- **4 itens**: Dashboard, Agenda, WhatsApp, Mais (➕)
- **Mais**: Abre sheet com rotas adicionais
- **Height**: 64px (h-16)
- **Z-index**: 50

### MobileNavMoreSheet

- **Tipo**: Sheet deslizante (slide-up)
- **Trigger**: Botão "Mais" no bottom nav
- **Backdrop**: Opaco, fecha ao clicar fora
- **Animado**: 200ms com spring
- **Z-index**: 70

## State Management

```javascript
{
  isMobileOpen: boolean,      // Mobile drawer
  isCollapsed: boolean,       // Sidebar collapse
  isTabletMode: boolean,      // Derived from width
  setMobileOpen: Function,    // Toggle drawer
  setCollapsed: Function,     // Toggle collapse
}
```

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl/Cmd + B` | Toggle sidebar |
| `Ctrl/Cmd + K` | Abrir busca |
| `Escape` | Fechar modais/drawers |

## Animações

- **Mobile Sidebar**: Slide-in spring (300ms)
- **Page Transitions**: Fade + Y-shift (150ms in, 200ms out)
- **Nav Indicator**: Glow + move (100ms)
- **More Sheet**: Slide-up (200ms)

## Z-Index Stack

```
70: Mobile More Sheet
60: Mobile Drawer + Backdrop
50: Mobile Bottom Nav
40: TopBar (fixed header)
30: Sidebar (desktop/tablet)
20: Page Content
10: Modals/Panels
0:  Base content
```

## Espaçamentos do Layout

### Content Layout

```css
/* Page container padding */
padding: 1.5rem (mobile) → 2rem (desktop)

/* Content max-width */
max-width: 100% (mobile) → 80rem (desktop lg)

/* Grid gaps */
gap: 1rem → 1.5rem
```

### Sidebar Dimensions

- Mobile: 280px (drawer)
- Tablet collapsed: 64px
- Tablet expanded: 240px
- Desktop expanded: 260px
- Desktop collapsed: 64px

### Navigation Item Height

- Height: 40px
- Padding: 8px 16px
- Icon size: 20px
- Font size: 14px

## Considerações de Design

- **Independent scrolling**: Sidebar e content scrollam independentemente
- **Responsive typography**: Tamanhos ajustados por breakpoint
- **Smooth transitions**: Todas as mudanças animadas
- **Focus management**: Ao abrir drawer, focus primeiro item
- **Overlay backdrop**: Sempre presente em modas/drawers mobile

---

**Última atualização:** 2026-02-25  
**Versão:** 1.0.0
