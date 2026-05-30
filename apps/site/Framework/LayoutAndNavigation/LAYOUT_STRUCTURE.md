# BarberZap Admin Layout - Visual Structure

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION ROOT                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   ADMIN SHELL                           │   │
│  │  (Wraps all admin routes with Outlet)                   │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌─────────────────────────────────┐  │   │
│  │  │              │  │                                 │  │   │
│  │  │   TOP BAR    │  │  FIXED HEADER (z-40, h-16)      │  │   │
│  │  │              │  │  ┌────┬──────┬────────┬──────┐  │  │   │
│  │  │              │  │  │Menu│ Search│Notify │ User │  │  │   │
│  │  │              │  │  │icon│ input │ badge │menu │  │  │   │
│  │  │              │  │  └────┴──────┴────────┴──────┘  │  │   │
│  │  └──────────────┘  └─────────────────────────────────┘  │   │
│  │          │                                                │   │
│  │          ├────────────────────────────────────────────────┤   │
│  │          │                                                │   │
│  │          ▼                                                │   │
│  │  ┌──────────────┐  ┌─────────────────────────────────┐  │   │
│  │  │   SIDEBAR    │  │                                 │  │   │
│  │  │              │  │     MAIN CONTAINER              │  │   │
│  │  │  Responsive  │  │                                 │  │   │
│  │  │  Navigation  │  │  ┌─────────────────────────┐   │  │   │
│  │  │              │  │  │                         │   │  │   │
│  │  │  ┌────────┐  │  │  │    MAIN CONTENT        │   │  │   │
│  │  │  │Navigatn│  │  │  │                         │   │  │   │
│  │  │  │ Items  │  │  │  │  • Page Header          │   │  │   │
│  │  │  │        │  │  │  │    - Title              │   │  │   │
│  │  │  │•Dashbrd│  │  │  │    - Subtitle           │   │  │   │
│  │  │  │•Agenda │  │  │  │    - Actions            │   │  │   │
│  │  │  │•Clien..│  │  │  │                         │   │  │   │
│  │  │  │•Servi..│  │  │  │  • Breadcrumbs          │   │  │   │
│  │  │  │•Funci..│  │  │  │    Home > Page          │   │  │   │
│  │  │  │•Financ.│  │  │  │                         │   │  │   │
│  │  │  │•Whats..│  │  │  │  • Page Content         │   │  │   │
│  │  │  │•IA Conf│  │  │  │    (Outlet/PageComp)    │   │  │   │
│  │  │  │•Aparên.│  │  │  │                         │   │  │   │
│  │  │  │•Config.│  │  │  │  - PageGrid             │   │  │   │
│  │  │  │        │  │  │  │    - PageCard[]        │   │  │   │
│  │  │  │        │  │  │  │                         │   │  │   │
│  │  │  └────────┘  │  │  └─────────────────────────┘   │  │   │
│  │  │              │  │                                 │  │   │
│  │  │  ┌────────┐  │  │    (Scrollable area)            │  │   │
│  │  │  │ Footer │  │  │                                 │  │   │
│  │  │  │Logout  │  │  │                                 │  │   │
│  │  │  └────────┘  │  └─────────────────────────────────┘  │   │
│  │  │              │                                        │   │
│  │  └──────────────┘                                        │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MOBILE BOTTOM NAV (z-50, h-16)                          │   │
│  │  Only visible on mobile (<640px)                         │   │
│  │  ┌────────┬─────────┬───────────┬────────┐              │   │
│  │  │Dashbrd │  Agenda │  WhatsApp │   +    │              │   │
│  │  │        │         │           │ (Mais) │              │   │
│  │  └────────┴─────────┴───────────┴────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

OVERLAYS & MODALS (z-60+)
┌───────────────────────┐
│ Mobile More Sheet     │ (z-70)
│ • Additional routes   │
│ • Close button        │
└───────────────────────┘


                      OVERLAYS & DRAWERS
                      ┌───────────────┐
                      │ Mobile Sidebar│ (z-60)
                      │ Full-screen   │
                      │ drawer        │
                      └───────────────┘
```

## Responsive Layout States

### MOBILE (< 640px)
```
┌─────────────────────────────┐
│[≡] BarberZap    [🔍][🔔][👤]│  ← Compact TopBar (h-14)
├─────────────────────────────┤
│                             │
│    PAGE CONTENT             │  ← Full width, no sidebar
│    (flex-1)                 │     offset
│    - Breadcrumbs            │
│    - Header                 │
│    - Cards Grid             │
│    ...                      │
│                             │
│   [Scrollable area]         │
│                             │
├─────────────────────────────┤
│[Dashboard][Agenda][Whats][➕]│  ← Bottom Nav visible
└─────────────────────────────┘

Sidebar Behavior:
- Hidden by default
- Shows as drawer on hamburger click
- Full-screen overlay with backdrop
```

### TABLET (640px - 1023px)
```
┌─────────────────────────────────────────────┐
│[≡] BarberZap Admin      [Search...] [🔔][👤]│  ← Standard TopBar (h-16)
├──────┬──────────────────────────────────────┤
│      │                                       │
│SIDEBAR│      PAGE CONTENT                    │
│(64px │      (flex-1)                         │  ← Collapsed sidebar
│width)│      - Breadcrumbs                    │     margin: ml-16
│      │      - Header                         │
│[≡]   │      - Cards Grid                     │
│Dash  │      ...                              │
│Agend│                                       │
│Clien│      [Scrollable area]                 │
│Servi│                                       │
│Funci│                                       │
│Fina.│                                       │
│Whats│                                       │
│+Config                                      │
│      │                                       │
│[⊖]   │                                       │  ← Collapse toggle
└──────┴──────────────────────────────────────┘
      ↑
  Can expand to 240px

Sidebar Behavior:
- Collapsed by default (64px)
- Toggle to expand (240px)
- Bottom Nav hidden
```

### DESKTOP (≥ 1024px)
```
┌──────────────────────────────────────────────────────────────┐
│BarberZap Admin    [Search...]                  [🔔][User▼]   │  ← Full TopBar (h-16)
├───────────┬──────────────────────────────────────────────────┤
│           │                                                  │
│ SIDEBAR   │              PAGE CONTENT                        │
║(260px)    ║              (max-w-7xl)                         ║  ← Fixed sidebar
║           ║                                                  ║     margin: ml-[260px]
║ Branding  ║              • Breadcrumbs                       ║
║           ║                Home > Dashboard                  ║
║ Navigatn  ║                                                  ║
║           ║              • Header                            ║
║ •Dashboard║                Dashboard                         ║
║   [24]    ║                Overview metrics                  ║
║           ║                                                  ║
║ • Agenda  ║              • Page Grid                         ║
║   [3]     ║                ┌─────┬─────┬─────┬─────┐        ║
║           ║                │Card │Card │Card │Card │        ║
║ •Clientes║                │ 24  │R$2k │  5  │ 95% │        ║
║           ║                └─────┴─────┴─────┴─────┘        ║
║ •Serviços║                ┌─────┬─────┬─────┐                ║
║           ║                │Card │Card │Card │                ║
║ •Funcionário│              └─────┴─────┴─────┘                ║
║           ║                                                  ║
║ •Financeiro│                                                ║
║   R$ 2.450 ║              [Scrollable area]                  ║
║           ║                                                  ║
║ •WhatsApp ║                                                ║
║   [12]     ║                                                ║
║           ║                                                ║
║ •IA Config║                                                ║
║           ║                                                ║
║ •Aparência║                                                ║
║           ║                                                ║
║ •Config.  ║                                                ║
║           ║                                                ║
║ ───────────────────────────────────────────────────────────── ║
║                                                             ║
║           ┌───────┐                                        ║
║           │Salir 🚪│                                        ║  ← Logout
║           └───────┘                                        ║
└───────────┴──────────────────────────────────────────────────┘
        ↑
    Fixed position

Sidebar Behavior:
- Fixed expanded (260px)
- Auto-collapse option
- Bottom Nav hidden
- Independent scrolling
```

## Component Interaction Flow

```
START: User navigates to /admin
        │
        ▼
┌─────────────────────┐
│   AdminShell Mount  │
│   • Initialize hooks│
│   • Set up resize   │
└──────────┬──────────┘
           │
           ├─────────────────────────────────┐
           │                                 │
           ▼                                 ▼
    ┌──────────┐                      ┌──────────┐
    │ TopBar   │                      │ Sidebar  │
    │ Render   │                      │ Render   │
    │          │                      │          │
    │• Search  │                      │• Mobile  │
    │• Notify  │                      │• Tablet  │
    │• User    │                      │• Desktop │
    └──────────┘                      └────┬─────┘
                                           │
┌──────────────────────────────┐           │
│   MainContent via Outlet     │ ◄─────────┘
│   • Page Header              │
│   • Breadcrumbs              │
│   • Page Component Render    │
│     ├─ PageGrid              │
│     ├─ PageCard[]            │
│     └─ PageSection[]         │
└──────────────────────────────┘
           │
           ▼
    ┌──────────┐
    │Mobile    │
    │BotNav    │ (Only mobile)
    └──────────┘

USER INTERACTIONS:
┌─────────────────────┐      ┌─────────────────────┐
│ Click Menu Button   │─────▶│ Open Mobile Drawer  │
│ (Mobile)            │      │ with Backdrop       │
└─────────────────────┘      └─────────────────────┘

┌─────────────────────┐      ┌─────────────────────┐
│ Click Sidebar Item  │─────▶│ Navigate to Route   │
│ (Any device)        │      │ + Close Mobile View │
└─────────────────────┘      └─────────────────────┘

┌─────────────────────┐      ┌─────────────────────┐
│ Ctrl/Cmd + B        │─────▶│ Toggle Sidebar       │
│ (Keyboard)          │      │ (Tablet/Desktop)    │
└─────────────────────┘      └─────────────────────┘

┌─────────────────────┐      ┌─────────────────────┐
│ Click "Mais" Button │─────▶│ Open More Sheet     │
│ (Bottom Nav)        │      │ (Slide-up panel)    │
└─────────────────────┘      └─────────────────────┘

┌─────────────────────┐      ┌─────────────────────┐
│ Logout Click        │─────▶│ Clear Auth          │
│                     │      │ + Redirect to Login │
└─────────────────────┘      └─────────────────────┘
```

## State Management Flow

```
useSidebarState Hook:
┌─────────────────────────────────────────────────────┐
│ isMobileOpen (boolean)                               │
│   • Controls mobile drawer visibility                │
│   • Auto-closed on route change                      │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│ isCollapsed (boolean)                               │
│   • Controls sidebar collapsed state (tablet/desktop)│
│   • Toggled via collapse button or Ctrl+B           │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│ isTabletMode (boolean)                              │
│   • Derived from window width (640-1023px)          │
│   • Updates on resize                               │
│   • Determines layout mode                          │
└─────────────────────────────────────────────────────┘

Effect Chain:
resize → isTabletMode update → layout re-render
route change → isMobileOpen = false → mobile drawer close
keyboard → toggle handlers → state updates
```

## Animation Timeline

```
Mobile Sidebar Open:
0ms    ─ back drop fade in starts
0ms    ─ sidebar slide from -100% starts
200ms  ─✓ backdrop fully opaque
300ms  ─✓ sidebar fully visible (spring animation)

Mobile Sidebar Close:
0ms    ─ backdrop fade out starts
0ms    ─ sidebar slide to -100% starts
200ms  ─✓ backdrop fully transparent
300ms  ─✓ sidebar off-screen (spring animation)

Page Transition:
0ms    ─ old component exit: opacity 0, y -10
150ms  ─✓ old component gone
150ms  ─ new component enter: opacity 0, y 10
350ms  ─✓ new component visible: opacity 1, y 0

Active Nav Item:
0ms    ─ indicator line starts moving
100ms  ─✓ indicator in new position (spring)
0ms    �─ glow effect starts
200ms  ─✓ glow at full opacity

Mobile More Sheet:
0ms    ─ backdrop fades in
0ms    ─ sheet slides from 100%
200ms  ─✓ fully visible
```

## Z-Index Stack

```
Level 70: Mobile More Sheet
Level 60: Mobile Sidebar Drawer + Backdrop
Level 50: Mobile Bottom Nav
Level 40: TopBar (fixed header)
Level 30: Sidebar (desktop/tablet)
Level 20: Page Content
Level 10: Modals/Panels
Level 0:  Base content
```
