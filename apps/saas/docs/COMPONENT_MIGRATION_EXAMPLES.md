# Component Migration Examples

Examples showing how to migrate from inline patterns to reusable components.

---

## 1. Button Migration

### Before (Inline Styles)

```tsx
// Dashboard.tsx
<button 
  onClick={() => onNavigate('whatsapp')}
  className="px-6 py-4 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95"
>
  Reconectar WhatsApp
</button>

// ServicesList.tsx
<button className="h-12 px-8 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
  <span className="material-symbols-outlined">add</span>
  Novo Serviço
</button>

// Agenda.tsx (FAB button)
<button className="fixed bottom-10 right-10 w-16 h-16 bg-[#f4c025] text-black rounded-full shadow-2xl shadow-[#f4c025]/20 flex items-center justify-center hover:scale-110 transition-all z-30">
  <span className="material-symbols-outlined text-4xl">add</span>
</button>

// Agenda.tsx (ghost action button)
<button className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
  <span className="material-symbols-outlined text-sm">edit</span>
</button>
```

### After (Using Button Component)

```tsx
import { Button } from '@/components/ui';

// Dashboard.tsx - Primary button
<Button onClick={() => onNavigate('whatsapp')}>
  Reconectar WhatsApp
</Button>

// ServicesList.tsx - Primary with icon
<Button leftIcon="add">
  Novo Serviço
</Button>

// Agenda.tsx - FAB button (circle, xl size)
<Button 
  variant="primary" 
  size="xl" 
  shape="circle"
  className="fixed bottom-10 right-10 shadow-2xl shadow-[#f4c025]/20"
  iconOnly
  tooltip="Adicionar agendamento"
>
  <span className="material-symbols-outlined text-4xl">add</span>
</Button>

// Agenda.tsx - Ghost action button
<Button 
  variant="ghost" 
  size="icon"
  iconOnly
  tooltip="Editar"
  onClick={handleEdit}
>
  <span className="material-symbols-outlined text-sm">edit</span>
</Button>
```

---

## 2. Badge Migration

### Before (Inline Styles)

```tsx
// Dashboard.tsx - Status badge
<span className={`px-3 py-1 rounded-lg text-xs font-bold ${
  apt.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 
  apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
}`}>
  {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'pending' ? 'Pendente' : 'Cancelado'}
</span>

// ServicesList.tsx - Popular badge
<span className="absolute top-4 right-4 bg-[#f4c025]/10 text-[#f4c025] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#f4c025]/20">
  Popular
</span>
```

### After (Using Badge Component)

```tsx
import { Badge } from '@/components/ui';

// Dashboard.tsx - Status badge with conditional variant
<Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'warning' : 'danger'}>
  {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'pending' ? 'Pendente' : 'Cancelado'}
</Badge>

// ServicesList.tsx - Popular badge
<Badge variant="gold">Popular</Badge>
```

---

## 3. Page Pattern Extraction

### Before (Repeated Page Header Pattern)

```tsx
// Dashboard.tsx
<header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div>
    <h1 className="text-4xl font-black tracking-tight mb-2">Dashboard</h1>
    <p className="text-zinc-500">Visão geral da sua barbearia</p>
  </div>
  {headerActions}
</header>

// ServicesList.tsx
<header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div>
    <h1 className="text-4xl font-black tracking-tight mb-2">Meus Serviços</h1>
    <p className="text-zinc-500">Gerencie o catálogo de serviços oferecidos na barbearia</p>
  </div>
  <Button leftIcon="add">Novo Serviço</Button>
</header>

// Agenda.tsx
<header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div>
    <h1 className="text-4xl font-black tracking-tight mb-2">Quinta-feira, 24 Out</h1>
    <p className="text-zinc-500">Gestão detalhada da sua agenda diária.</p>
  </div>
  <div className="flex items-center bg-zinc-900 border border-white/10 p-1 rounded-xl">
    {/* Date picker controls */}
  </div>
</header>

// Finance.tsx
<header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div>
    <h1 className="text-4xl font-black tracking-tight mb-2">Desempenho da Loja</h1>
    <p className="text-zinc-500">Visão geral das finanças e métricas operacionais</p>
  </div>
  <div className="flex items-center gap-4">
    {/* Time range selector + Export button */}
  </div>
</header>
```

### After (Using PageHeader Component)

```tsx
import { PageHeader } from '@/components/patterns';
import { Button } from '@/components/ui';

// Dashboard.tsx
<PageHeader
  title="Dashboard"
  description="Visão geral da sua barbearia"
/>

// ServicesList.tsx
<PageHeader
  title="Meus Serviços"
  description="Gerencie o catálogo de serviços oferecidos na barbearia"
  actions={<Button leftIcon="add">Novo Serviço</Button>}
/>

// Agenda.tsx
<PageHeader
  title="Quinta-feira, 24 Out"
  description="Gestão detalhada da sua agenda diária"
  rightContent={<DatePickerControls />}
/>

// Finance.tsx
<PageHeader
  title="Desempenho da Loja"
  description="Visão geral das finanças e métricas operacionais"
  rightContent={
    <>
      <TimeRangeSelector />
      <Button leftIcon="download">Exportar</Button>
    </>
  }
/>
```

## PageHeader Implementation

```tsx
// /components/patterns/PageHeader.tsx
import React from 'react';
import { Button } from '@/components/ui';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  rightContent,
  className,
}) => {
  return (
    <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 ${className}`}>
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">{title}</h1>
        {description && <p className="text-zinc-500">{description}</p>}
      </div>
      {actions && <>{actions}</>}
      {rightContent && <>{rightContent}</>}
    </header>
  );
};

export default PageHeader;
```

---

## 4. StatsCard Pattern Extraction

### Before (Multiple Repeated Patterns)

```tsx
// Dashboard.tsx - Simple stat with 2 values
<div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 flex flex-col justify-between">
  <div className="flex justify-between items-start mb-6">
    <div>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Cortes Hoje</p>
      <h4 className="text-4xl font-bold">8</h4>
    </div>
    <div className="p-2 bg-[#f4c025]/10 text-[#f4c025] rounded-lg">
      <span className="material-symbols-outlined">content_cut</span>
    </div>
  </div>
  <div className="flex justify-between items-end">
    <div>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Faturamento Est.</p>
      <h4 className="text-2xl font-bold text-[#f4c025]">R$ 240,00</h4>
    </div>
  </div>
</div>

// Agenda.tsx - Small stat
<div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-2">
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-sm text-[#f4c025]">calendar_month</span>
    <span className="text-[10px] font-bold text-zinc-600 uppercase">Agendados</span>
  </div>
  <p className="text-2xl font-bold">12</p>
</div>

// Finance.tsx - Large stat with trend
<div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-white/10 p-8 relative overflow-hidden">
  <div className="flex justify-between items-start mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-[#f4c025]/10 text-[#f4c025] rounded-xl">
        <span className="material-symbols-outlined filled">attach_money</span>
      </div>
      <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Faturamento Total</p>
    </div>
    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20 flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">trending_up</span>
      +12.5%
    </span>
  </div>
  <h2 className="text-5xl font-bold tracking-tighter">R$ 4.520,00</h2>
  <p className="text-zinc-500 text-sm mt-2">Comparado a R$ 4.018,00 mês anterior</p>
</div>
```

### After (Using StatsCard Component)

```tsx
import { StatsCard } from '@/components/patterns';

// Dashboard.tsx - Multi-value stat (split variant)
<StatsCard 
  variant="split"
  stats={[
    { 
      label: 'Cortes Hoje', 
      value: '8', 
      icon: { name: 'content_cut', color: 'text-[#f4c025]' } 
    },
    { 
      label: 'Faturamento Est.', 
      value: 'R$ 240,00', 
      valueColor: 'text-[#f4c025]',
      headingSize: 'h4'
    }
  ]}
/>

// Agenda.tsx - Simple small stat
<StatsCard 
  variant="simple"
  size="sm"
  icon={{ name: 'calendar_month', color: 'text-[#f4c025]' }}
  label="Agendados"
  value="12"
/>

// Finance.tsx - Large stat with trend
<StatsCard 
  variant="large"
  size="lg"
  icon={{ name: 'attach_money', filled: true, color: 'text-[#f4c025]' }}
  label="Faturamento Total"
  value="R$ 4.520,00"
  valueSize="5xl"
  subtitle="Comparado a R$ 4.018,00 mês anterior"
  trend={{ value: '+12.5%', direction: 'up', color: 'text-green-500' }}
/>
```

## StatsCard Implementation

```tsx
// /components/patterns/StatsCard.tsx
import React from 'react';

type StatsCardVariant = 'simple' | 'split' | 'large' | 'trend';
type StatsCardSize = 'sm' | 'md' | 'lg';

interface StatItem {
  label: string;
  value: string | number;
  icon?: {
    name: string;
    color?: string;
    filled?: boolean;
    size?: string;
  };
  headingSize?: string;
  valueColor?: string;
}

interface Trend {
  value: string;
  direction: 'up' | 'down' | 'neutral';
  color?: string;
}

interface StatsCardProps {
  variant?: StatsCardVariant;
  size?: StatsCardSize;
  stats?: StatItem[];
  icon?: StatItem['icon'];
  label?: string;
  value?: string | number;
  headingSize?: string;
  valueColor?: string;
  valueSize?: string;
  subtitle?: string;
  trend?: Trend;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  variant = 'simple',
  size = 'md',
  stats,
  icon,
  label,
  value,
  headingSize = 'text-2xl',
  valueColor = 'text-white',
  valueSize,
  subtitle,
  trend,
  className = '',
}) => {
  // Rendering logic for multiple card types
  // ... implementation
  
  return (
    <div className={`bg-zinc-900 border border-white/10 rounded-2xl p-6 ${className}`}>
      {/* Card content based on variant */}
    </div>
  );
};

export default StatsCard;
```

---

## 5. Form Input Pattern Extraction

### Before (Repeated Input Pattern)

```tsx
// Login.tsx - Email input
<div>
  <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
  <div className="relative group">
    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#f4c025] transition-colors">
      mail
    </span>
    <input 
      type="email" 
      placeholder="seu@email.com" 
      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50 transition-all"
      required
    />
  </div>
</div>

// Login.tsx - Password input
<div>
  <label className="block text-sm font-medium text-zinc-400 mb-2">Senha</label>
  <div className="relative group">
    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#f4c025] transition-colors">
      lock
    </span>
    <input 
      type="password" 
      placeholder="••••••••" 
      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50 transition-all"
      required
    />
    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
      <span className="material-symbols-outlined">visibility_off</span>
    </button>
  </div>
</div>
```

### After (Using Input Component)

```tsx
import { Input } from '@/components/ui';

// Login.tsx - Email input
<Input
  type="email"
  label="Email"
  placeholder="seu@email.com"
  leftIcon="mail"
  required
/>

// Login.tsx - Password input with toggle
<Input
  type="password"
  label="Senha"
  placeholder="••••••••"
  leftIcon="lock"
  rightIcon="visibility_off"
  onRightIconClick={togglePassword}
  required
/>
```

## Input Implementation

```tsx
// /components/ui/Input.tsx
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  leftIcon,
  rightIcon,
  onRightIconClick,
  error,
  className,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors ${
            focused || inputProps.value ? 'text-[#f4c025]' : ''
          }`}>
            {leftIcon}
          </span>
        )}
        <input
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          className={`w-full bg-black/40 border ${
            error ? 'border-red-500' : 'border-white/10'
          } ${focused || error ? 'focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50' : ''} ${leftIcon ? 'pl-12' : 'pr-4'} ${
            rightIcon ? 'pr-12' : 'pr-4'
          } rounded-xl py-4 text-white placeholder-zinc-600 focus:outline-none transition-all ${className}`}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">{rightIcon}</span>
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
```

---

## Migration Benefits

### Before Migration
- **Code duplication**: Same patterns repeated across files
- **Inconsistent styling**: Minor variations between similar elements
- **Hard to maintain**: Changes require updates in multiple places
- **Poor documentation**: No centralized component docs
- **Higher bundle size**: Duplicate Tailwind classes

### After Migration
- **Single source of truth**: Centralized component definitions
- **Consistent styling**: Enforced via component props
- **Easy maintenance**: Update once, apply everywhere
- **Better documentation**: JSDoc on components
- **Smaller bundle**: Shared code, reduced duplication

### Metrics (Expected)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines of code (repeated patterns) | ~500 lines | ~100 lines | -80% |
| Maintenance cost | High | Low | Significantly reduced |
| Time to add new page | 2-3 hours | 30-60 min | -75% |
| Consistency issues | Frequent | Rare | Significantly reduced |
| Bundle size of patterns | ~8KB | ~3KB | -62% |

---

## Next Steps

1. ✅ Create `Button` component (DONE)
2. ✅ Create `Badge` component (DONE)
3. 🔄 Create `PageHeader` component (TODO)
4. 🔄 Create `StatsCard` component (TODO)
5. 🔄 Create `Input` component (TODO)
6. 🔄 Create `ResourceCard` component (TODO)
7. 🔄 Create `ListItem` component (TODO)
8. 🔄 Create `DataTable` component (TODO)
9. 🔄 Migrate existing pages to use new components
10. 🔄 Remove inline patterns after migration
