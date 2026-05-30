# BarberZap Admin Panel - Layout & Navigation Framework

Complete layout and navigation system for the BarberZap Admin Panel, built with React, Tailwind CSS, Framer Motion, and Lucide React icons.

## 📁 File Structure

```
LayoutAndNavigation/
├── AdminShell.jsx              # Main app shell wrapper
├── Sidebar.jsx                 # Responsive sidebar (mobile/tablet/desktop)
├── TopBar.jsx                  # Header with search, notifications, user menu
├── MainContent.jsx             # Page content wrapper with helpers
├── MobileBottomNav.jsx         # Mobile bottom navigation
├── index.jsx                   # Export barrel file
├── ROUTES_CONFIG.md            # All 11 admin routes defined
├── RESPONSIVE_STRATEGY.md      # Breakpoints and behavior guide
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Basic Setup

Wrap your admin routes with `AdminShell`:

```jsx
import { Routes, Route } from 'react-router-dom';
import { AdminShell } from './Framework/LayoutAndNavigation';

function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminShell />}>
        <Route index element={<Dashboard />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="clientes" element={<Clientes />} />
        {/* ... more routes */}
      </Route>
    </Routes>
  );
}
```

### 2. Page Component Example

Use `MainContent` in your page components:

```jsx
import { MainContent, PageCard, PageGrid } from './Framework/LayoutAndNavigation';

export function Dashboard() {
  return (
    <MainContent 
      title="Dashboard"
      subtitle="Visão geral da sua barbearia"
      actions={
        <button className="bg-amber-500 px-4 py-2 rounded-lg">
          Relatório
        </button>
      }
    >
      <PageGrid cols={4}>
        <PageCard>
          <h3 className="text-2xl font-bold">24</h3>
          <p className="text-slate-400">Agendamentos hoje</p>
        </PageCard>
        <PageCard>
          <h3 className="text-2xl font-bold">R$ 2.450</h3>
          <p className="text-slate-400">Receita hoje</p>
        </PageCard>
        {/* ... more cards */}
      </PageGrid>
    </MainContent>
  );
}
```

## 🧭 Routes Configuration

| Route | Path | Label | Icon | Bottom Nav |
|-------|------|-------|------|------------|
| Dashboard | `/admin/dashboard` | Dashboard | LayoutDashboard | ✓ |
| Agenda | `/admin/agenda` | Agenda | Calendar | ✓ |
| Horários | `/admin/horarios` | Horários | Clock | ✗ |
| Clientes | `/admin/clientes` | Clientes | Users | ✗ |
| Serviços | `/admin/servicos` | Serviços | Scissors | ✗ |
| Funcionários | `/admin/funcionarios` | Funcionários | UserCog | ✗ |
| Financeiro | `/admin/financeiro` | Financeiro | DollarSign | ✗ |
| WhatsApp | `/admin/whatsapp` | WhatsApp | MessageCircle | ✓ |
| IA Config | `/admin/ai-config` | IA Config | BrainCircuit | ✗ |
| Aparência | `/admin/aparencia` | Aparência | Palette | ✗ |
| Configurações | `/admin/configuracoes` | Configurações | Settings | ✗ |

## 📱 Responsive Breakpoints

| Breakpoint | Width | Device | Sidebar | BottomNav |
|------------|-------|--------|---------|-----------|
| Mobile | < 640px | Phone | Drawer (hidden) | Visible |
| Tablet | 640px - 1023px | Tablet | Collapsible | Hidden |
| Desktop | ≥ 1024px | Desktop | Fixed expanded | Hidden |

### Responsive Behaviors

#### Mobile (< 640px)
- Sidebar hidden, appears as drawer when hamburger menu clicked
- Bottom nav always visible with 4 main items
- Content takes full width
- Compact TopBar with icons only

#### Tablet (640px - 1023px)
- Sidebar collapsible (default collapsed)
- 240px expanded, 64px collapsed
- Bottom nav hidden
- Content margin adjusts based on sidebar state

#### Desktop (≥ 1024px)
- Sidebar fixed at 260px width
- Bottom nav hidden
- Content has margin-left: 260px
- Full TopBar with search input

## 🎨 Design Tokens

The layout uses these Design System colors:

### Primary Colors
- Primary: `amber-500` (#F59E0B)
- Secondary: `amber-600` (#D97706)
- Gradient: `from-amber-500 to-amber-600`

### Backgrounds
- Primary: `slate-900` (#0F172A)
- Secondary: `slate-800` (#1E293B)
- Glass: `slate-800/50` with `backdrop-blur-xl`

### Typography
- Primary: `slate-50` (#F8FAFC)
- Secondary: `slate-300` (#CBD5E1)
- Muted: `slate-400` (#94A3B8)

### Effects
- Glass Morphism: `backdrop-blur-xl` + `bg-slate-800/50`
- Hover Glow: `shadow-amber-500/20`
- Transitions: `duration-200`

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Toggle sidebar |
| `Ctrl/Cmd + K` | Open global search |
| `Escape` | Close modals/drawers |

## 🧩 Component API

### AdminShell

Main wrapper component for the admin panel.

```jsx
<AdminShell>
  {/* Routes render here via Outlet */}
</AdminShell>
```

**Props:** None (uses React Router Outlet)

---

### MainContent

Page content wrapper with header, breadcrumbs, and transitions.

```jsx
<MainContent 
  title="Page Title"
  subtitle="Optional subtitle"
  actions={<button>Action</button>}
  showBreadcrumbs={true}
  containerSize="default"
>
  {/* Page content */}
</MainContent>
```

**Props:**
- `title` (string): Page title
- `subtitle` (string): Optional description
- `actions` (ReactNode): Action buttons for header
- `showBreadcrumbs` (boolean): Show breadcrumb nav
- `containerSize` (string): `'sm'` | `'default'` | `'xl'` | `'full'`
- `className` (string): Additional classes

---

### PageCard

Reusable card component.

```jsx
<PageCard title="Card Title" hover={false} noPadding={false}>
  {/* Content */}
</PageCard>
```

**Props:**
- `title` (string): Card title
- `hover` (boolean): Enable hover effects
- `noPadding` (boolean): Remove default padding
- `className` (string): Additional classes

---

### PageGrid

Responsive grid wrapper.

```jsx
<PageGrid cols={4} gap="default">
  <PageCard>Item 1</PageCard>
  <PageCard>Item 2</PageCard>
</PageGrid>
```

**Props:**
- `cols` (number): `1` | `2` | `3` | `4` | `default`
- `gap` (string): `'sm'` | `'default'` | `'lg'`
- `className` (string): Additional classes

---

### PageSection

Section wrapper with optional title.

```jsx
<PageSection title="Section Title" description="Description" card={false}>
  {/* Content */}
</PageSection>
```

**Props:**
- `title` (string): Section title
- `description` (string): Optional description
- `card` (boolean): Wrap in card styling
- `actions` (ReactNode): Action buttons
- `className` (string): Additional classes

---

### LoadingState

Skeleton loader for pages.

```jsx
<LoadingState cards={3} lines={4} />
```

**Props:**
- `cards` (number): Number of skeleton cards
- `lines` (number): Lines per card

---

### EmptyState

Empty state for no-data scenarios.

```jsx
<EmptyState 
  icon={Calendar}
  title="No appointments"
  description="Create your first appointment"
  action={<button>New</button>}
/>
```

**Props:**
- `icon` (LucideIcon): Icon component
- `title` (string): Empty state title
- `description` (string): Optional description
- `action` (ReactNode): Call-to-action button
- `illustration` (ReactNode): Custom illustration

## 🔧 Customization

### Modify Sidebar Items

Edit `navItems` array in `Sidebar.jsx`:

```jsx
const navItems = [
  {
    id: 'new-page',
    path: '/admin/new',
    label: 'New Page',
    icon: YourIcon
  },
  // ... other items
];
```

### Add New Routes

Add to `ROUTES_CONFIG.md`:

```javascript
{
  id: 'new-page',
  path: '/admin/new',
  label: 'New Page',
  icon: IconName,
  description: 'Page description',
  order: 12,
  inBottomNav: false
}
```

### Adjust Breakpoints

Edit `tailwind.config.js`:

```js
theme: {
  screens: {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px'
  }
}
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.294.0",
    "framer-motion": "^10.16.0"
  }
}
```

## 🧪 Testing Checklist

Before deploying, ensure:

- [ ] Sidebar collapses/expands on tablet
- [ ] Mobile drawer opens on hamburger click
- [ ] Bottom nav hidden on desktop
- [ ] All routes navigate correctly
- [ ] Active states highlight in navigation
- [ ] User menu dropdown works
- [ ] Keyboard shortcuts function
- [ ] Page transitions are smooth
- [ ] Mobile has safe area padding
- [ ] No content overlap with fixed elements

## 🚶 Next Steps

### Ready for Implementation
The Layout & Navigation framework is complete and ready for the next phase:

1. **Page Components** (Next Agent Task)
   - Create Dashboard page components
   - Create Agenda/Calendar page components
   - Create Customer management pages

2. **API Integration** (Later Phase)
   - Connect sidebar user profile to authentication
   - Implement search functionality
   - Connect notifications system

3. **Feature Pages** (Later Phase)
   - WhatsApp integration page
   - AI Config page
   - Financial reports page

4. **Enhancements** (Later Phase)
   - Dark/light theme toggle
   - Custom sidebar sections
   - Dashboard widgets customization

## 📚 Related Files

- `../DesignSystem/DESIGN_TOKENS.md` - Color and style references
- `../DesignSystem/COMPONENT_GUIDELINES.md` - Component patterns
- `RESPONSIVE_STRATEGY.md` - Detailed responsive behavior
- `ROUTES_CONFIG.md` - Complete route definitions

## 💡 Tips

1. **Single-thumb navigation**: Bottom nav prioritized for mobile
2. **Keyboard shortcuts**: Help desktop users be more efficient
3. **Active highlighting**: Always show user where they are
4. **Glass morphism**: Use sparingly for performance
5. **Smooth transitions**: Keep animations under 300ms

## 🤝 Support

For questions or issues:
- Check `COMPONENT_GUIDELINES.md` for component patterns
- Check `RESPONSIVE_STRATEGY.md` for responsive patterns
- Review component comments and JSDoc

---

**Built with ❤️ for Brazilian barbershop owners**
