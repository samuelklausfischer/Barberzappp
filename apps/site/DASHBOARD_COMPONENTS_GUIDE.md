# BarberZap Dashboard - Componentes Práticos

> **Baseado em**: DESIGN_SYSTEM_ANALYSIS.md  
> **Objetivo**: Exemplos de componentes React com Tailwind para o dashboard admin

---

## Índice
1. [Setup Inicial](#1-setup-inicial)
2. [Componentes de Navegação](#2-componentes-de-navegação)
3. [Componentes de Dados](#3-componentes-de-dados)
4. [Componentes de Formulário](#4-componentes-de-formulário)
5. [Componentes de Feedback](#5-componentes-de-feedback)
6. [Layout Wrappers](#6-layout-wrappers)
7. [Animations & Transitions](#7-animations--transitions)

---

## 1. Setup Inicial

### 1.1 Adicionar Classes Custom ao `index.css`

```css
/* src/index.css - Adicionar estas classes */

/* Gradient text */
.text-gradient-primary {
  @apply bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-clip-text text-transparent;
}

/* Glass morphism */
.glass {
  @apply bg-background/60 backdrop-blur-xl border border-white/5;
}

.glass-heavy {
  @apply bg-background/80 backdrop-blur-2xl border border-border;
}

/* Glow effects */
.glow-primary {
  box-shadow: 0 0 30px rgba(234, 179, 8, 0.2);
}

.glow-subtle {
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.1);
}

/* Custom scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary));
}

/* Smooth transitions */
.transition-smooth {
  @apply transition-all duration-300 ease-out;
}

/* Card base styles */
.card-base {
  @apply bg-card border border-border rounded-xl hover:border-primary/30 transition-colors;
}

/* Badge base */
.badge-base {
  @apply px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest;
}
```

---

## 2. Componentes de Navegação

### 2.1 Sidebar Item

```jsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-3 px-4 py-3 rounded-lg
        transition-smooth group
        ${isActive 
          ? 'bg-primary/10 text-primary border-l-2 border-primary' 
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }
      `}
    >
      <Icon size={20} className="shrink-0" />
      <span className="font-medium text-sm">{label}</span>
      
      {badge && (
        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-lg -z-10" />
      )}
    </button>
  );
};
```

### 2.2 Breadcrumb

```jsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  items: Array<{ label: string; href?: string }>;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={14} />}
          {item.href ? (
            <a 
              href={item.href} 
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
```

### 2.3 Top Navigation Bar

```jsx
import React from 'react';
import { Bell, Search, Settings, User } from 'lucide-react';
import { Button } from './Button';

export const TopNav: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Search size={16} className="text-primary-foreground" />
            </div>
            <input 
              type="text"
              placeholder="Buscar..."
              className="w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Bell size={16} />
          </Button>
          <Button variant="outline" size="sm">
            <Settings size={16} />
          </Button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold">Barbearia do João</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
```

---

## 3. Componentes de Dados

### 3.1 Stat Card

```jsx
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  icon: LucideIcon;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  icon: Icon,
  className = '',
}) => {
  return (
    <div className={`card-base p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon size={24} className="text-primary" />
        </div>
        
        {trend && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest
            ${trend.isPositive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}
          `}>
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      
      <p className="text-3xl font-black text-foreground">
        {value}
      </p>
    </div>
  );
};
```

### 3.2 Usage Card (with Progress)

```jsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface UsageCardProps {
  label: string;
  current: number;
  total: number;
  unit?: string;
  icon: LucideIcon;
}

export const UsageCard: React.FC<UsageCardProps> = ({
  label,
  current,
  total,
  unit = '',
  icon: Icon,
}) => {
  const percentage = (current / total) * 100;
  
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-semibold">
            {current} de {total} {unit}
          </p>
        </div>
      </div>
      
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`
            h-full bg-gradient-to-r from-yellow-600 to-primary rounded-full
            transition-all duration-500
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-[10px] text-right text-muted-foreground mt-2 font-bold uppercase">
        {percentage.toFixed(0)}% utilizado
      </p>
    </div>
  );
};
```

### 3.3 Revenue Chart Card

```jsx
import React from 'react';
import { TrendingUp } from 'lucide-react';

export const RevenueCard: React.FC = () => {
  return (
    <div className="bg-primary/5 border-2 border-primary/20 rounded-[2rem] p-6 md:p-8 relative overflow-hidden glow-subtle">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Faturamento Mensal
            </p>
            <p className="text-4xl md:text-5xl font-black text-gradient-primary">
              R$ 12.450
            </p>
          </div>
          
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-400/10 text-emerald-400">
            <TrendingUp size={14} />
            <span className="text-xs font-black uppercase tracking-wider">+23%</span>
          </div>
        </div>
        
        {/* Mini chart placeholder */}
        <div className="h-24 bg-gradient-to-t from-primary/10 to-transparent rounded-xl mb-4" />
        
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-bold">+ R$ 2.850</span> em relação ao mês anterior
        </p>
      </div>
    </div>
  );
};
```

### 3.4 Client List Item

```jsx
import React from 'react';
import { Mail, Phone, MoreVertical } from 'lucide-react';

interface ClientListItemProps {
  name: string;
  avatar?: string;
  lastVisit?: string;
  totalVisits: number;
  status?: 'active' | 'inactive';
}

export const ClientListItem: React.FC<ClientListItemProps> = ({
  name,
  avatar,
  lastVisit,
  totalVisits,
  status = 'active',
}) => {
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border hover:bg-white/5 transition-colors">
      {/* Avatar */}
      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-black text-primary border border-primary/30">
        {initial}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm mb-1 truncate">{name}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {lastVisit && (
            <>
              <span className="font-medium">Última visita: {lastVisit}</span>
              <span className="w-1 h-1 bg-border rounded-full" />
            </>
          )}
          <span className="font-medium">{totalVisits} visitas</span>
        </div>
      </div>
      
      {/* Status */}
      {status === 'active' ? (
        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <Mail size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <Phone size={16} />
        </button>
        <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
};
```

---

## 4. Componentes de Formulário

### 4.1 Enhanced Input Field

```jsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: LucideIcon;
  type?: 'text' | 'email' | 'tel' | 'password';
  error?: string;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  error,
  className = '',
}) => {
  return (
    <div className={`${className}`}>
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 block">
        {label}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon size={18} />
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`
            w-full bg-white/5 border
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl text-sm
            focus:border-primary outline-none transition-all
            ${error ? 'border-red-400' : 'border-white/10'}
          `}
        />
      </div>
      
      {error && (
        <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
```

### 4.2 Select Field

```jsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectFieldProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 block">
        {label}
      </label>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between focus:border-primary outline-none transition-all"
        >
          <span>{value || 'Selecione...'}</span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl overflow-hidden z-20 shadow-xl">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-primary/10 transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4.3 Toggle Switch

```jsx
import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      
      <button
        onClick={() => onChange?.(!checked)}
        disabled={disabled}
        className={`
          relative w-14 h-8 rounded-full transition-all duration-300
          ${checked ? 'bg-primary' : 'bg-secondary'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div
          className={`
            absolute top-1 w-6 h-6 rounded-full bg-white shadow-md
            transition-all duration-300
            ${checked ? 'left-7' : 'left-1'}
          `}
        />
      </button>
    </div>
  );
};
```

---

## 5. Componentes de Feedback

### 5.1 Status Badge

```jsx
import React from 'react';

type StatusType = 'success' | 'warning' | 'error' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const styles = {
    success: {
      container: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400',
      dot: 'bg-emerald-400',
    },
    warning: {
      container: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
      dot: 'bg-amber-400',
    },
    error: {
      container: 'bg-red-400/10 border-red-400/30 text-red-400',
      dot: 'bg-red-400',
    },
    neutral: {
      container: 'bg-muted-foreground/10 border-muted-foreground/30 text-muted-foreground',
      dot: 'bg-muted-foreground',
    },
  };
  
  const style = styles[status];
  
  return (
    <div className={`
      badge-base border flex items-center gap-2
      ${style.container}
    `}>
      <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </div>
  );
};
```

### 5.2 Alert Banner

```jsx
import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface AlertBannerProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message?: string;
  icon?: LucideIcon;
  onClose?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  title,
  message,
  icon: Icon,
  onClose,
}) => {
  const styles = {
    info: {
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      text: 'text-primary',
      icon: Icon,
    },
    warning: {
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/30',
      text: 'text-amber-400',
      icon: Icon,
    },
    error: {
      bg: 'bg-red-400/10',
      border: 'border-red-400/30',
      text: 'text-red-400',
      icon: Icon,
    },
    success: {
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/30',
      text: 'text-emerald-400',
      icon: Icon,
    },
  };
  
  const style = styles[type];
  
  return (
    <div className={`
      ${style.bg} ${style.border} border rounded-xl p-4 flex items-start gap-4
    `}>
      {Icon && (
        <div className="mt-0.5">
          <Icon size={20} className={style.text} />
        </div>
      )}
      
      <div className="flex-1">
        <p className={`font-bold text-sm mb-1 ${style.text}`}>{title}</p>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
```

### 5.3 Toast Notification

```jsx
import React from 'react';
import { LucideIcon, X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    bg: 'bg-card',
    border: 'border-emerald-400/30',
    icon: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10',
  },
  error: {
    bg: 'bg-card',
    border: 'border-red-400/30',
    icon: 'text-red-400',
    iconBg: 'bg-red-400/10',
  },
  warning: {
    bg: 'bg-card',
    border: 'border-amber-400/30',
    icon: 'text-amber-400',
    iconBg: 'bg-amber-400/10',
  },
  info: {
    bg: 'bg-card',
    border: 'border-primary/30',
    icon: 'text-primary',
    iconBg: 'bg-primary/10',
  },
};

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  
  const style = styles[type];
  const Icon = icons[type];
  
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
          style={{ boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)' }}
          className={`
            fixed bottom-6 right-6 z-[300]
            ${style.bg} ${style.border} border
            rounded-xl p-4 flex items-start gap-4 min-w-[320px]
          `}
        >
          <div className={`w-10 h-10 ${style.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={style.icon} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-1">{title}</p>
            {message && (
              <p className="text-xs text-muted-foreground">{message}</p>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

---

## 6. Layout Wrappers

### 6.1 Page Layout

```jsx
import React from 'react';
import { TopNav } from './TopNav';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          {(title || subtitle || actions) && (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
              <div>
                {title && (
                  <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-gradient-primary">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-muted-foreground mt-2">{subtitle}</p>
                )}
              </div>
              
              {actions && (
                <div className="flex items-center gap-3 shrink-0">
                  {actions}
                </div>
              )}
            </div>
          )}
          
          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  );
};
```

### 6.2 Grid Layout Helpers

```jsx
// Grid 2 column (responsive)
export const Grid2: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
    {children}
  </div>
);

// Grid 3 column (responsive)
export const Grid3: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {children}
  </div>
);

// Grid 4 column (responsive)
export const Grid4: React.FC<{ children: React.ReactNode; className?: string }> => ({ 
  children, 
  className = '' 
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
    {children}
  </div>
);
```

### 6.3 Dashboard Sidebar Layout

```jsx
import React from 'react';
import { SidebarItem } from './SidebarItem';
import { Scissors, Calendar, Users, DollarSign, Settings, HelpCircle } from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const menuItems = [
    { icon: Calendar, label: 'Agenda', active: true },
    { icon: Users, label: 'Clientes', badge: 5 },
    { icon: DollarSign, label: 'Financeiro' },
    { icon: Settings, label: 'Configurações' },
    { icon: HelpCircle, label: 'Ajuda' },
  ];
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Scissors size={18} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-bold italic uppercase tracking-tighter">
              Barber<span className="text-primary">Zap</span>
            </span>
          </div>
        </div>
        
        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              label={item.label}
              isActive={item.active}
              badge={item.badge}
            />
          ))}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-wider">
            v1.0.0
          </p>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
```

---

## 7. Animations & Transitions

### 7.1 Fade In Animation Wrapper

```jsx
import React from 'react';
import { motion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
}) => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };
  
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        duration, 
        delay,
        ease: 'easeOut' 
      }}
    >
      {children}
    </motion.div>
  );
};
```

### 7.2 Stagger Container

```jsx
import React from 'react';
import { motion } from 'framer-motion';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  className,
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.4 }
        },
      }}
    >
      {children}
    </motion.div>
  );
};
```

### 7.3 Hover Glow Component

```jsx
import React from 'react';

interface HoverGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'primary' | 'secondary';
}

export const HoverGlow: React.FC<HoverGlowProps> = ({
  children,
  className = '',
  glowColor = 'primary',
}) => {
  const glowStyles = {
    primary: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]',
    secondary: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]',
  };
  
  return (
    <div className={`${glowStyles[glowColor]} transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};
```

---

## 8. Exemplo Completo de Página

```jsx
import React from 'react';
import { PageLayout } from './PageLayout';
import { StatCard } from './StatCard';
import { RevenueCard } from './RevenueCard';
import { Grid2, Grid3 } from './GridLayout';
import { ClientListItem } from './ClientListItem';
import { Calendar, Users, Scissors, TrendingUp } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './Animations';

export const DashboardPage: React.FC = () => {
  return (
    <PageLayout
      title="Dashboard"
      subtitle="Visão geral da sua barbearia"
      actions={
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors">
          Novo Agendamento
        </button>
      }
    >
      <StaggerContainer className="space-y-8">
        {/* Stats Row */}
        <StaggerItem>
          <Grid3>
            <StatCard
              label="Agendamentos Hoje"
              value="24"
              trend={{ value: 12, isPositive: true }}
              icon={Calendar}
            />
            <StatCard
              label="Clientes Totais"
              value="847"
              trend={{ value: 8, isPositive: true }}
              icon={Users}
            />
            <StatCard
              label="Cortes Realizados"
              value="156"
              trend={{ value: 3, isPositive: false }}
              icon={Scissors}
            />
          </Grid3>
        </StaggerItem>
        
        {/* Revenue & Clients */}
        <StaggerItem>
          <Grid2>
            {/* Revenue Section */}
            <div className="space-y-6">
              <RevenueCard />
              
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Faturamento por Serviço</h3>
                {/* Chart placeholder */}
                <div className="h-40 bg-gradient-to-t from-primary/5 to-transparent rounded-lg" />
              </div>
            </div>
            
            {/* Clients Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold">Clientes Recentes</h3>
              </div>
              
              <div className="divide-y divide-border max-h-96 overflow-auto scrollbar-thin">
                <ClientListItem
                  name="Carlos Silva"
                  lastVisit="Há 2 horas"
                  totalVisits={15}
                  status="active"
                />
                <ClientListItem
                  name="João Santos"
                  lastVisit="Há 1 dia"
                  totalVisits={8}
                  status="active"
                />
                <ClientListItem
                  name="Pedro Costa"
                  lastVisit="Há 3 dias"
                  totalVisits={3}
                  status="inactive"
                />
                <ClientListItem
                  name="Lucas Oliveira"
                  lastVisit="Há 1 semana"
                  totalVisits={22}
                  status="active"
                />
                <ClientListItem
                  name="Marcos Dias"
                  lastVisit="Há 2 semanas"
                  totalVisits={6}
                  status="inactive"
                />
              </div>
              
              <div className="p-4 border-t border-border">
                <button className="w-full text-center text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                  Ver todos os clientes →
                </button>
              </div>
            </div>
          </Grid2>
        </StaggerItem>
      </StaggerContainer>
    </PageLayout>
  );
};
```

---

## 9. Utility Hooks

### 9.1/useLocalStorage

```jsx
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue] as const;
}
```

### 9.2 useMediaQuery

```jsx
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
}
```

---

## 10. Resumo de Classes Tailwind Key

### 10.1 Cores

```jsx
// Backgrounds
bg-background       // #0b0c0d
bg-card            // #191a1c
bg-primary         // #eab308 (gold)
bg-secondary       // #2a2b33
bg-muted           // #2a2b33

// Text
text-foreground    // #f2f2f2
text-primary       // #eab308
text-primary-foreground // #2d2f1b
text-muted-foreground // #a1a1aa

// Bordas
border-border      // #2a2b33
border-primary     // Primary color
```

### 10.2 Tipografia

```jsx
// Font weights
font-black         // Títulos principais
font-bold          // Subtítulos, destaques
font-semibold      // Botões padrão
font-medium        // Parágrafos

// Tamanhos
text-[8px]         // Labels micro
text-[10px]        // Badges, labels
text-sm            // Body text
text-lg            // Subtítulos
text-3xl           // Títulos
text-4xl-7xl       // Hero titles

// Estilos
italic             // Itálico (brand style)
uppercase          // Maiúsculas
tracking-widest    // Espaçamento largo
tracking-tighter   // Espaçamento compacto
```

### 10.3 Spacing

```jsx
// Padding
p-4         // 16px padrão
p-6         // 24px médio
p-8         // 32px grande
px-4 py-3   // Botões, inputs

// Margin
mb-4, mb-6, mb-8  // Entre elementos
space-y-4, space-y-6  // Vertical spacing
gap-4, gap-6, gap-8   // Grid gaps
```

### 10.4 Borders & Radius

```jsx
// Border radius
rounded-lg      // 8px padrão
rounded-xl      // 12px
rounded-2xl     // 16px
rounded-[2rem]  // 32px
rounded-[3rem]  // 48px

// Borders
border          // Padrão 1px
border-2        // 2px (destaque)
border-t        // Top border
border-b        // Bottom border
```

### 10.5 Shadows & Glow

```jsx
shadow-lg       // Sombra grande
shadow-xl       // Sombra muito grande
shadow-2xl      // Sombra extra grande
shadow-[0_0_30px_rgba(234,179,8,0.4)]  // Glow gold
```

### 10.6 Backdrop & Blur

```jsx
backdrop-blur-sm   // 4px
backdrop-blur-md   // 12px
backdrop-blur-lg   // 16px
backdrop-blur-xl   // 24px

bg-primary/10      // Opacidade
bg-white/5         // Leve
```

### 10.7 Transições

```jsx
transition-all duration-300    // Padrão
transition-colors             // Só cores
transition-transform          // Só transformações
ease-out                      // Curva suave
hover:scale-105               // Hover scale
```

---

## 11. Checklist de Implementação

### ✅ Setup

- [ ] Adicionar classes custom ao `index.css`
- [ ] Configurar `tailwind.config.js` (já feito)
- [ ] Instalar dependências: `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`

### ✅ Componentes Base

- [ ] Button (já existe na landing page)
- [ ] InputField (usar do guide)
- [ ] SelectField (criar)
- [ ] ToggleSwitch (criar)

### ✅ Layout

- [ ] PageLayout wrapper
- [ ] DashboardLayout (sidebar + main)
- [ ] TopNav
- [ ] Breadcrumb

### ✅ Dashboard Cards

- [ ] StatCard
- [ ] UsageCard
- [ ] RevenueCard
- [ ] ClientListItem

### ✅ Feedback

- [ ] StatusBadge
- [ ] AlertBanner
- [ ] Toast (usar framer-motion)

### ✅ Navigation

- [ ] SidebarItem
- [ ] MobileNavigation (drawer)

### ✅ Animations

- [ ] FadeIn wrapper
- [ ] StaggerContainer
- [ ] HoverGlow

---

## 12. Recursos Úteis

### 12.1 Lucide Icons

Documentação: https://lucide.dev/icons/

```bash
npm install lucide-react
```

### 12.2 Framer Motion

Documentação: https://www.framer.com/motion/

```bash
npm install framer-motion
```

### 12.3 Tailwind CSS

Documentação: https://tailwindcss.com/docs

### 12.4 Design Tokens Reference

Consultar `DESIGN_SYSTEM_ANALYSIS.md` para tokens completos de cores, tipografia, espaçamento, etc.

---

## 13. Exemplo de Import Completo

```jsx
// src/components/index.ts
export { Button } from './ui/Button';
export { InputField, SelectField, ToggleSwitch } from './ui/Inputs';
export { PageLayout, DashboardLayout } from './layout/Layouts';
export { StatCard, UsageCard, RevenueCard } from './data/Stats';
export { StatusBadge, AlertBanner, Toast } from './feedback/Alerts';
export { SidebarItem, TopNav, Breadcrumb } from './navigation';
export { FadeIn, StaggerContainer, StaggerItem } from './animations';
```

---

**Fim do Guia de Componentes**

Este guia fornece componentes prontos para uso no dashboard admin do BarberZap, mantendo consistência visual com a landing page existente.