# BarberZap Admin Panel Route Configuration

## Route Definitions

All admin panel routes use React Router with the following structure.

### 1. Dashboard
```javascript
{
  path: '/admin/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  description: 'Overview & metrics',
  order: 1,
  inBottomNav: true,
  index: true // Default route when /admin is visited
}
```

### 2. Agenda (Appointments)
```javascript
{
  path: '/admin/agenda',
  label: 'Agenda',
  icon: Calendar,
  description: 'Manage appointments',
  order: 2,
  inBottomNav: true
}
```

### 3. Horários (Scheduling)
```javascript
{
  path: '/admin/horarios',
  label: 'Horários',
  icon: Clock,
  description: 'Set working hours',
  order: 3,
  inBottomNav: false
}
```

### 4. Clientes (Customers)
```javascript
{
  path: '/admin/clientes',
  label: 'Clientes',
  icon: Users,
  description: 'Customer database',
  order: 4,
  inBottomNav: false
}
```

### 5. Serviços (Services)
```javascript
{
  path: '/admin/servicos',
  label: 'Serviços',
  icon: Scissors,
  description: 'Service catalog',
  order: 5,
  inBottomNav: false
}
```

### 6. Funcionários (Staff)
```javascript
{
  path: '/admin/funcionarios',
  label: 'Funcionários',
  icon: UserCog,
  description: 'Staff management',
  order: 6,
  inBottomNav: false
}
```

### 7. Financeiro (Financial)
```javascript
{
  path: '/admin/financeiro',
  label: 'Financeiro',
  icon: DollarSign,
  description: 'Revenue & expenses',
  order: 7,
  inBottomNav: false
}
```

### 8. WhatsApp Integration
```javascript
{
  path: '/admin/whatsapp',
  label: 'WhatsApp',
  icon: MessageCircle,
  description: 'WhatsApp integration',
  order: 8,
  inBottomNav: true
}
```

### 9. AI Configuration
```javascript
{
  path: '/admin/ai-config',
  label: 'IA Config',
  icon: BrainCircuit,
  description: 'AI assistant settings',
  order: 9,
  inBottomNav: false
}
```

### 10. Appearance (Appearances)
```javascript
{
  path: '/admin/aparencia',
  label: 'Aparência',
  icon: Palette,
  description: 'Theme & branding',
  order: 10,
  inBottomNav: false
}
```

### 11. Settings
```javascript
{
  path: '/admin/configuracoes',
  label: 'Configurações',
  icon: Settings,
  description: 'General settings',
  order: 11,
  inBottomNav: false
}
```

## Complete Routes Array

```javascript
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Scissors,
  UserCog,
  DollarSign,
  MessageCircle,
  BrainCircuit,
  Palette,
  Settings
} from 'lucide-react';

export const ADMIN_ROUTES = [
  {
    id: 'dashboard',
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & metrics',
    order: 1,
    inBottomNav: true
  },
  {
    id: 'agenda',
    path: '/admin/agenda',
    label: 'Agenda',
    icon: Calendar,
    description: 'Manage appointments',
    order: 2,
    inBottomNav: true
  },
  {
    id: 'horarios',
    path: '/admin/horarios',
    label: 'Horários',
    icon: Clock,
    description: 'Set working hours',
    order: 3,
    inBottomNav: false
  },
  {
    id: 'clientes',
    path: '/admin/clientes',
    label: 'Clientes',
    icon: Users,
    description: 'Customer database',
    order: 4,
    inBottomNav: false
  },
  {
    id: 'servicos',
    path: '/admin/servicos',
    label: 'Serviços',
    icon: Scissors,
    description: 'Service catalog',
    order: 5,
    inBottomNav: false
  },
  {
    id: 'funcionarios',
    path: '/admin/funcionarios',
    label: 'Funcionários',
    icon: UserCog,
    description: 'Staff management',
    order: 6,
    inBottomNav: false
  },
  {
    id: 'financeiro',
    path: '/admin/financeiro',
    label: 'Financeiro',
    icon: DollarSign,
    description: 'Revenue & expenses',
    order: 7,
    inBottomNav: false
  },
  {
    id: 'whatsapp',
    path: '/admin/whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    description: 'WhatsApp integration',
    order: 8,
    inBottomNav: true
  },
  {
    id: 'ai-config',
    path: '/admin/ai-config',
    label: 'IA Config',
    icon: BrainCircuit,
    description: 'AI assistant settings',
    order: 9,
    inBottomNav: false
  },
  {
    id: 'aparencia',
    path: '/admin/aparencia',
    label: 'Aparência',
    icon: Palette,
    description: 'Theme & branding',
    order: 10,
    inBottomNav: false
  },
  {
    id: 'configuracoes',
    path: '/admin/configuracoes',
    label: 'Configurações',
    icon: Settings,
    description: 'General settings',
    order: 11,
    inBottomNav: false
  }
];

// Bottom navigation routes (mobile-only, top 4 for quick access)
export const BOTTOM_NAV_ROUTES = ADMIN_ROUTES
  .filter(route => route.inBottomNav)
  .slice(0, 4);

// Helper function to get route by path
export const getRouteByPath = (path) => {
  return ADMIN_ROUTES.find(route => route.path === path);
};

// Helper function to get breadcrumb hierarchy
export const getBreadcrumbs = (path) => {
  const route = getRouteByPath(path);
  if (!route) return [];
  
  return [
    { label: 'Admin', path: '/admin' },
    { label: route.label, path: route.path }
  ];
};
```

## Breadcrumb Examples

### Dashboard Page
```
Home > Dashboard
```

### Customer Detail Page
```
Home > Clientes > João Silva
```

### Appointment Edit Page
```
Home > Agenda > Editar Agendamento
```

## Route Metadata

Each route can have extended metadata for SEO, permissions, and features:

```javascript
{
  // Basic Info
  id: 'dashboard',
  path: '/admin/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  description: 'Overview & metrics',
  
  // Navigation
  order: 1,
  inBottomNav: true,
  inSidebar: true,
  
  // Permissions (future)
  permissions: ['dashboard:read'],
  
  // SEO (future)
  meta: {
    title: 'Dashboard | BarberZap Admin',
    description: 'Overview of your barbershop metrics'
  },
  
  // Features
  features: {
    search: true,
    filters: false,
    export: true
  }
}
```

## Custom Routes for Sub-pages

Nested routes for detailed pages:

```javascript
// Customer Detail
{
  id: 'cliente-detail',
  path: '/admin/clientes/:id',
  label: 'Cliente Detalhes',
  icon: User,
  parent: 'clientes',
  parentLabel: 'Clientes'
}

// Appointment Edit
{
  id: 'agendamento-edit',
  path: '/admin/agenda/:id/edit',
  label: 'Editar Agendamento',
  icon: CalendarEdit,
  parent: 'agenda',
  parentLabel: 'Agenda'
}
```

## Keyboard Shortcuts (Future)

```javascript
const routeShortcuts = {
  '/admin/dashboard': 'Meta + D',
  '/admin/agenda': 'Meta + A',
  '/admin/clientes': 'Meta + C',
  '/admin/whatsapp': 'Meta + W'
};
```
