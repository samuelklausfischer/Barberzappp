# 🧩 SPECIALIST EM COMPONENT AGENTS
## Framework Painel Admin - Arquitetura de Sub-Agentes UI

---

## 📋 CONTEXTO ANALISADO

Baseado na análise de `/root/barber/src/components/` (8 componentes principais):

| Componente | Arquivo | Padrões Identificados |
|------------|---------|----------------------|
| Dashboard | `dashboard/Dashboard.tsx` | PageHeader, StatsCard, DataTable, ListItem, Badge, Alert |
| Agenda | `agenda/Agenda.tsx` | PageHeader, StatsCard, ListItem, Badge DatePicker |
| ServicesList | `services/ServicesList.tsx` | PageHeader, ResourceCard, EmptyState |
| WhatsAppConnect | `whatsapp/WhatsAppConnect.tsx` | PageHeader, StatusCard, QRScanner |
| AIConfig | `aiconfig/AIConfig.tsx` | PageHeader, Form, ToggleSwitch |
| Finance | `finance/Finance.tsx` | PageHeader, StatsCard, ChartCard |
| Login | `auth/Login.tsx` | Form, InputGroup, SocialButton |
| Sidebar | `layout/Sidebar.tsx` | Navigation, MenuItem |

### Design System Identificado:
- **Primary Color**: `#f4c025` (Gold)
- **Background**: Zinc scale (900, 950, 950)
- **Sp Tokens**: `rounded-xl`, `rounded-2xl`, `rounded-3xl`
- **Typography**: Material Symbols Outlined, Inter/System fonts
- **Animations**: `animate-in fade-in`, `slide-in-from-left/top/bottom`
- **Shadows**: `shadow-lg`, `shadow-red-950/40`, custom color shadows

---

## 🎯 1. COMPONENT AGENTS CATALOG

---

### 🏛️ AGENT 1: Component Architect Agent

**Função Primária**: Especificar novos componentes e APIs

**Skills:**
- Design System Theory & Atomic Design
- Component API Design (Props, Events, Slots)
- TypeScript Interface Definition
- Accessibility Standards (WCAG 2.1 AA)
- React Component Composition Patterns
- UX Writing & Label Design
- Design Token Mapping

**Contexto:**
- Theme system configuration
- Design guidelines document
- Existing pattern library
- Component catalog

**Prompt Template:**
```
You are the Component Architect Agent for BarberZap Admin Panel.

CONTEXT:
- Design System: Zinc + Gold (#f4c025) palette
- Framework: React + TypeScript + Tailwind CSS
- Icons: Material Symbols Outlined
- Existing patterns: StatsCard, ResourceCard, DataTable, ListItem

TASK: Create specification for a new component: {{COMPONENT_NAME}}

REQUIREMENTS:
- Definition component purpose and use cases
- Design comprehensive props interface with TypeScript
- Define variants (size, color, intent, shape)
- Specify behaviors (interactions, states, transitions)
- Accessibility requirements (ARIA, keyboard, focus)
- Design tokens to use (colors, spacing, radius, shadows)
- Composed sub-components (if applicable)
- Edge cases to handle

OUTPUT FORMAT:
```typescript
// COMPONENT SPECIFICATION
Component: {{COMPONENT_NAME}}
Purpose: [1-2 sentences]

interface {{COMPONENT_NAME}}Props {
  // Required props
  // Optional props with defaults
}

// Variants
- Variant A: description
- Variant B: description

// Accessibility
- [ ] Semantic HTML
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators

// Design Tokens
- Colors: primary, secondary, ...
- Spacing: [reference to theme]
- Radius: [reference to theme]
- Shadows: [reference to theme]

// Sub-Components (if applicable)
- ChildComponent1
- ChildComponent2
```

EXAMPLES FROM CODEBASE:
- Reference Dashboard.statsCard pattern
- Reference ServicesList.resourceCard pattern
- Reference Agenda.listItem pattern
```

**Responsável por:**
- Criar especificação técnica de novos componentes
- Documentar variantes e comportamentos
- Definir APIs públicas e internas
- Especificar requisitos de acessibilidade

---

### 🛠️ AGENT 2: Component Generator Agent

**Função Primária**: Implementar componentes baseados em especificações

**Skills:**
- React 18+ (Hooks, Context, Suspense)
- TypeScript (Advanced types, generics)
- Tailwind CSS (Utility composition, variants)
- Component Composition Patterns
- Performance Optimization (memo, useMemo, useCallback)
- Responsive Design (Mobile-first approach)
- Accessibility Implementation (ARIA attributes)

**Contexto:**
- Component specification from Architect
- Existing implementation patterns
- Tailwind config
- Icon set reference

**Prompt Template:**
```
You are the Component Generator Agent for BarberZap Admin Panel.

CONTEXT:
- Design System: Zinc + Gold (#f4c025)
- Framework: React + TypeScript + Tailwind CSS
- Icons: Material Symbols Outlined

TASK: Implement component: {{COMPONENT_NAME}}

SPECIFICATION:
{{COMPONENT_SPEC_FROM_ARCHITECT}}

REQUIREMENTS:
- Follow existing codebase patterns
- Use consistent styling approach (see examples below)
- Implement all variants from spec
- Include proper TypeScript types
- Handle edge cases (empty states, loading, errors)
- Add accessibility attributes (ARIA, keyboard)
- Write clean, idiomatic React code

EXISTING PATTERNS TO MATCH:
```tsx
// Example pattern from Dashboard.tsx
<div className="rounded-2xl border border-white/10 bg-zinc-900 p-8">
  {/* StatsCard pattern */}
</div>

// Example pattern from ServicesList.tsx
<div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 group hover:border-[#f4c025]/30 transition-all">
  {/* ResourceCard pattern */}
</div>

// Example pattern from Agenda.tsx
<span className={`
  px-4 py-1.5 rounded-full text-[10px] font-bold uppercase
  ${apt.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : ''}
`}>
  {/* Badge pattern */}
</span>
```

OUTPUT: Complete component code file with:
```tsx
import React from 'react';

interface {{COMPONENT_NAME}}Props {
  // props...
}

const {{COMPONENT_NAME}}: React.FC<{{COMPONENT_NAME}}Props> = ({ props }) => {
  return (
    // implementation
  );
};

export default {{COMPONENT_NAME}};
```

Include default export and Storybook-ready examples in comments.
```

**Responsável por:**
- Implementar componentes funcionalmente
- Aplicar classes Tailwind corretamente
- Garantir responsividade
- Implementar acessibilidade na prática
- Seguir padrões de código existentes

---

### 🔄 AGENT 3: Component Refactor Agent

**Função Primária**: Melhorar componentes existentes (performance, legibilidade, manutenibilidade)

**Skills:**
- Code Review & Analysis
- Performance Profiling (React DevTools, Lighthouse)
- Refactoring Patterns (Extract Component, HOC, Custom Hooks)
- Code Splitting & Lazy Loading
- Bundle Size Optimization
- Bug Identification & Fixing
- Design Pattern Application

**Contexto:**
- Current component implementation
- Performance metrics
- Known issues/bugs
- New patterns to apply

**Prompt Template:**
```
You are the Component Refactor Agent for BarberZap Admin Panel.

CONTEXT:
- Project: BarberZap Admin Panel
- Component location: {{COMPONENT_PATH}}
- Current implementation: {{EXISTING_CODE}}

TASK: Analyze and refactor component

ANALYSIS CHECKLIST:
- [ ] Performance issues (unnecessary re-renders, large bundle)
- [ ] Code duplication
- [ ] Complex logic that could be extracted
- [ ] Missing TypeScript types
- [ ] Accessibility gaps
- [ ] Inconsistent styling patterns
- [ ] Missing error handling
- [ ] Hardcoded values (should use design tokens)

REFACTORING GOALS:
{{REFACTOR_GOALS}}

EXISTING PATTERNS TO EMULATE:
```tsx
// Good pattern extracted from codebase
// Example: Custom hook for status colors
const useStatusColor = (status: string) => {
  const colors = {
    confirmed: 'bg-green-500/10 text-green-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    canceled: 'bg-red-500/10 text-red-500'
  };
  return colors[status as keyof typeof colors] || colors.pending;
};
```

OUTPUT FORMAT:
```tsx
// REFACTED COMPONENT

// 1. Extracted type definitions
// 2. Extracted custom hooks (if any)
// 3. Extracted sub-components (if any)
// 4. Main refactored component

// Summary of changes:
// - Performance: ...
// - Readability: ...
// - Maintainability: ...
// - Accessibility: ...
// - Bundle size: ...
```

REFACTORING PRINCIPLES:
- Start with types (stronger typing = better DX)
- Extract repeated logic to custom hooks
- Break down large components into smaller ones
- Use memo() only where needed (measure first!)
- Avoid prop drilling where Context is better
- Keep component responsibilities focused
```

**Responsável por:**
- Identificar debt técnico em componentes
- Otimizar performance
- Extrair lógica reutilizável
- Aplicar novos padrões
- Fixar bugs

---

### ✅ AGENT 4: Component QA Agent

**Função Primária**: Validar qualidade de componentes (a11y, performance, best practices)

**Skills:**
- Accessibility Testing (Axe, Lighthouse, Screen Readers)
- Performance Testing (Lighthouse, React Profiler)
- Visual Regression Testing
- Cross-browser Testing
- Mobile Testing (Responsive, Touch)
- Code Quality Analysis (ESLint, TypeScript)
- Best Practices (React rules, ARIA patterns)

**Contexto:**
- Component implementation
- Component specification
- Test plan requirements
- Accessibility standards

**Prompt Template:**
```
You are the Component QA Agent for BarberZap Admin Panel.

CONTEXT:
- Component: {{COMPONENT_NAME}}
- Location: {{COMPONENT_PATH}}
- Spec: {{COMPONENT_SPEC}}

TASK: Validate component quality

QUALITY CHECKLIST:

1. ACCESSIBILITY (WCAG 2.1 AA)
   - [ ] Semantic HTML elements used
   - [ ] ARIA labels where needed
   - [ ] Keyboard navigation complete
   - [ ] Focus indicators visible
   - [ ] Screen reader announces correctly
   - [ ] Color contrast ratios met (4.5:1 text, 3:1 UI)
   - [ ] Touch targets minimum 44x44px

2. PERFORMANCE
   - [ ] Avoids unnecessary re-renders
   - [ ] Lazy loading for heavy resources
   - [ ] Image optimization (WebP, lazy loading)
   - [ ] Bundle size impact minimal
   - [ ] No memory leaks (useEffect cleanup)

3. REACT BEST PRACTICES
   - [ ] Keys on lists are stable
   - [ ] PropTypes or TypeScript used
   - [ ] Controlled vs uncontrolled inputs consistent
   - [ ] No direct DOM manipulation (refs only when needed)
   - [ ] No inline functions in render (useCallback/useMemo)
   - [ ] Prop drilling minimized

4. DESIGN CONSISTENCY
   - [ ] Matches design system tokens
   - [ ] Responsive breakpoints match project
   - [ ] Hover/focus states implemented
   - [ ] Loading states handled
   - [ ] Error states handled
   - [ ] Empty states handled

5. CODE QUALITY
   - [ ] No console.log statements
   - [ ] No unused imports
   - [ ] Type safety (no any types)
   - [ ] ESLint rules passing
   - [ ] Named function components (better debugging)
   - [ ] Meaningful variable names

6. EDGE CASES
   - [ ] Long text handled (overflow, truncation)
   - [ ] Empty data handled
   - [ ] Loading state handled
   - [ ] Error state handled
   - [ ] Null/undefined props handled

OUTPUT FORMAT:
```yaml
accessibility_score: 0-100
performance_score: 0-100
code_quality_score: 0-100
design_consistency_score: 0-100
overall_score: 0-100

critical_issues:
  - severity: high/medium/low
    area: accessibility/performance/etc
    description: ...
    suggestion: ...

warnings:
  - ...

recommendations:
  - ...

approved: true/false
```

CRITICAL ISSUES BLOCK APPROVAL
```

**Responsável por:**
- Validar acessibilidade
- Medir performance
- Verificar best practices
- Detectar bugs
- Emitir aprovação/rejeição

---

### 🎨 AGENT 5: Design System Agent

**Função Primária**: Configurar e manter design tokens, variantes e composição

**Skills:**
- Design Token Management
- Variant Configuration
- Theme Composition
- Color Theory & Accessibility
- Spacing Systems
- Typography Scales
- Animation Curves
- Design Handoff

**Contexto:**
- Tailwind config
- Theme files
- Component variant usage
- Design guidelines

**Prompt Template:**
```
You are the Design System Agent for BarberZap Admin Panel.

CONTEXT:
- Current theme: Zinc + Gold (#f4c025)
- Tailwind config location: tailwind.config.ts

TASK: Configure design system for {{COMPONENT_OR_FEATURE}}

CURRENT TOKENS:
- Primary: #f4c025
- Background: zinc-900, zinc-950
- Text: zinc-400, zinc-500, white
- Rounds: xl (12px), 2xl (16px), 3xl (24px)
- Shadows: lg, custom color shadows

REQUIREMENTS:
- Add/extend design tokens in tailwind.config.ts
- Create variant combinations
- Ensure color contrast accessibility
- Document token usage

OUTPUT FORMAT:
```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add new colors
      },
      borderRadius: {
        // Add new radii
      },
      boxShadow: {
        // Add new shadows
      },
      animation: {
        // Add new animations
      },
      // Other tokens...
    }
  }
};

// COMPONENT_VARIANTS.md
## Button Variants
- primary: Gold background, black text
- secondary: White border, white text
- danger: Red background, white text
- ghost: Transparent, icon-only
```

ADDRESSES:
- New component variants
- Extended color palette
- Animation definitions
- Responsive breakpoints
```

**Responsável por:**
- Manter tailwind.config.ts
- Criar variantes consistentes
- Garantir acessibilidade visual
- Documentar design tokens
- Alinhar com designers

---

### 📚 AGENT 6: Documentation Agent

**Função Primária**: Documentar componentes, padrões e exemplos de uso

**Skills:**
- Technical Writing
- JSDoc/DocBlock Syntax
- Storybook Documentation
- API Documentation
- Usage Examples
- Best Practices Guides

**Contexto:**
- Component source code
- Component specification
- Usage examples from pages

**Prompt Template:**
```
You are the Documentation Agent for BarberZap Admin Panel.

CONTEXT:
- Component: {{COMPONENT_NAME}}
- Location: {{COMPONENT_PATH}}

TASK: Create comprehensive documentation

SECTIONS REQUIRED:

1. OVERVIEW
   - Component purpose
   - When to use
   - When NOT to use

2. PROPS API
   - Table with all props
   - Types, defaults, required status
   - Usage in code

3. VARIANTS
   - List all variants with screenshots/descriptions
   - How to use each variant

4. EXAMPLES
   - Basic usage
   - With all props
   - Common patterns/combinations
   - Edge cases

5. ACCESSIBILITY
   - ARIA patterns used
   - Keyboard navigation
   - Screen reader announcements

6. DESIGN TOKENS
   - Colors, spacing, radius used
   - How to customize

OUTPUT FORMAT:
```markdown
# {{COMPONENT_NAME}}

## Overview
...

## Props API
| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| ... | ... | ... | ... | ... |

## Usage Examples

```tsx
import {{COMPONENT_NAME}} from '@/components/{{COMPONENT_NAME}}';

// Basic usage
<{{COMPONENT_NAME}} />

// With all features
<{{COMPONENT_NAME}}
  prop="value"
  variant="primary"
  onAction={() => {}}
/>
```

## Variants

### Default
[Description]
![screenshot]

### Variant Name
[Description]
![screenshot]

## Accessibility
...

## Design Tokens
...

## See Also
- Related components
- Design system docs
```

REVIEW CODE FOR:
- JSDoc comments
- Storybook stories (if applicable)
- Inline comments for complex logic
```

**Responsável por:**
- Documentar API de componentes
- Criar exemplos de uso
- Escrever Storybook stories
- Manter guides de best practices
- Documentar padronização

---

## 📝 2. COMPONENT TEMPLATES

---

### TEMPLATE 1: ResourceCard Specification

Para cartões de listagem (Service, User, Product, etc.)

```typescript
// ResourceCard Component Specification
Component: ResourceCard
Purpose: Display a resource (service, user, product, etc.) with actions and metadata

interface ResourceCardProps {
  // === Required ===
  id: string;
  name: string;
  
  // === Content ===
  icon?: React.ElementType | string;
  description?: string;
  image?: string;
  tags?: string[];
  metadata?: Array<{
    label: string;
    value: string;
    icon?: string;
  }>;
  
  // === Badges ===
  badges?: Array<{
    text: string;
    variant: 'default' | 'success' | 'warning' | 'danger' | 'gold';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }>;
  
  // === Stats/Info ===
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
  }>;
  
  // === Actions ===
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryActions?: Array<{
    label?: string;
    icon: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'danger';
  }>;
  
  // === Variants ===
  variant?: 'default' | 'compact' | 'detailed' | 'gallery';
  size?: 'sm' | 'md' | 'lg';
  elevation?: 'none' | 'low' | 'medium' | 'high';
  
  // === States ===
  hoverable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  
  // === Layout ===
  orientation?: 'vertical' | 'horizontal';
  align?: 'start' | 'center' | 'end';
  
  // === Events ===
  onClick?: () => void;
  onMenuClick?: () => void;
  
  // === Styling ===
  className?: string;
  children?: React.ReactNode;
}

// === VARIANTS ===

## Default (vertical, medium)
- Icon + Name + Description + Metadata
- Stats below (2-3 items)
- Badge top-right (if present)
- Hover Actions overlay (edit, delete)

## Compact (horizontal, small)
- Image/Icon + Name + Metadata
- Single stat or badge
- Hover shows actions
- Reduced padding

## Detailed (vertical, large)
- Large image header
- Title + Description
- Multiple metadata sections
- Stats, badges, tags
- Primary action button below

## Gallery (visual-first)
- Large thumbnail
- Name overlay or below
- Minimal metadata
- Hover reveals actions

// === DESIGN TOKENS ===
- Background: bg-zinc-900 (default), bg-zinc-950 (selected)
- Border: border-white/10, hover:border-[#f4c025]/30
- Radius: rounded-2xl (default), rounded-3xl (large)
- Padding: p-8 (default), p-4 (compact), p-10 (detailed)
- Shadow: shadow-lg (elevated), custom-shadow (selected)

// === ACCESSIBILITY ===
- Semantic heading for name (h3)
- ARIA label for interactive elements
- Keyboard focus on card and actions
- Screen reader announcements for badges
- Focus indicators visible

// === BEHAVIORS ===
- Hover: scale轻微, border color change, actions reveal
- Click: trigger onClick (if provided)
- Selected: gold border/background tint
- Disabled: opacity 50%, no pointer events
- Loading: shimmer skeleton or spinner

// === EXAMPLE USAGE ===
<ResourceCard
  id="service-1"
  name="Corte Degradê"
  icon="content_cut"
  description="Corte moderno com degradê nas laterais"
  badges={[{ text: 'Popular', variant: 'gold', position: 'top-right' }]}
  stats={[
    { label: 'Preço', value: 'R$ 35,00', icon: 'payments' },
    { label: 'Duração', value: '30 min', icon: 'schedule' }
  ]}
  hoverable
  onClick={() => navigate(`/services/${id}`)}
  secondaryActions={[
    { icon: 'edit', onClick: handleEdit },
    { icon: 'delete', onClick: handleDelete, variant: 'danger' }
  ]}
/>
```

---

### TEMPLATE 2: DataTable Specification

Para tabelas de dados com colunas customizáveis

```typescript
// DataTable Component Specification
Component: DataTable
Purpose: Display tabular data with sorting, filtering, pagination, and actions

interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface ActionDef<T> {
  label: string;
  icon: string;
  onClick: (row: T, index: number) => void;
  disabled?: (row: T) => boolean;
  variant?: 'default' | 'danger' | 'gold';
  show?: 'always' | 'hover';
}

interface DataTableProps<T = any> {
  // === Data ===
  data: T[];
  columns: ColumnDef<T>[];
  keyField: keyof T;
  
  // === Actions ===
  rowActions?: ActionDef<T>[];
  headerActions?: ActionDef<T>[];
  bulkActions?: ActionDef<T>[];
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  
  // === Sorting ===
  sortable?: boolean;
  defaultSortField?: keyof T;
  defaultSortOrder?: 'asc' | 'desc';
  onSortChange?: (field: keyof T, order: 'asc' | 'desc') => void;
  
  // === Filtering ===
  filterable?: boolean;
  placeholder?: string;
  onFilterChange?: (filter: string) => void;
  filters?: React.ReactNode;
  
  // === Pagination ===
  paginated?: boolean;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  
  // === UI States ===
  loading?: boolean;
  empty?: {
    icon?: string;
    title?: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  };
  error?: string;
  
  // === Styling ===
  compact?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  bordered?: boolean;
  className?: string;
  
  // === Events ===
  onRowClick?: (row: T, index: number) => void;
}

// === VARIANTS ===

## Default
- Full padding
- Header row with separator
- Hover on rows
- Pagination bottom

## Compact
- Reduced padding
- Smaller fonts
- Hover optional
- No pagination (scroll)

## Barebones
- No borders
- No hover
- Actions only
- Minimal styling

// === DESIGN TOKENS ===
- Header: text-zinc-500, text-[10px], uppercase, font-bold, tracking-widest
- Border: border-white/5
- Hover: hover:bg-white/[0.02]
- Selected: bg-[#f4c025]/5
- Padding: px-8 py-4 (default), px-4 py-3 (compact)

// === ACCESSIBILITY ===
- Semantic table element (thead, tbody, th, td)
- Scope attributes on headers
- ARIA-sort on sortable columns
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader announces row count, sort order
- Focus visible on all interactive elements

// === BEHAVIORS ===
- Sort click: toggle asc/desc, show indicator
- Filter typing: real-time filtering with debounce
- Row select: checkbox, bulk actions appear
- Hover actions: show action buttons
- Pagination: update page, smooth transition

// === EXAMPLE USAGE ===
<DataTable
  data={appointments}
  keyField="id"
  columns={[
    { key: 'clientName', header: 'Cliente', sortable: true },
    { 
      key: 'clientAvatar', 
      header: '', 
      render: (url) => <img src={url} className="w-10 h-10 rounded-full" />
    },
    { key: 'service', header: 'Serviço' },
    { key: 'time', header: 'Horário', align: 'right' },
    { 
      key: 'status', 
      header: 'Status', 
      render: (status) => <Badge variant={status}>{status}</Badge>
    }
  ]}
  rowActions={[
    { label: 'Editar', icon: 'edit', onClick: handleEdit },
    { label: 'Cancelar', icon: 'close', onClick: handleCancel, variant: 'danger' }
  ]}
  sortable
  paginated
  pageSize={10}
  onRowClick={(row) => navigate(`/appointments/${row.id}`)}
/>
```

---

### TEMPLATE 3: Button Component Specification

Para botões interativos com múltiplas variantes

```typescript
// Button Component Specification
Component: Button
Purpose: Primary interactive element for user actions

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // === Variant ===
  variant?: 
    | 'primary'           // Gold bg, black text
    | 'secondary'         // White border, white text
    | 'danger'            // Red bg, white text
    | 'ghost'             // Transparent, icon-only
    | 'link'              // Text-only, underline
    | 'text'              // No background, no border
    | 'success'           // Green bg, white text
    
  // === Size ===
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  // === Shape ===
  shape?: 'square' | 'rounded' | 'circle' | 'pill'
  
  // === Content ===
  leftIcon?: string | React.ReactNode
  rightIcon?: string | React.ReactNode
  iconOnly?: boolean
  
  // === States ===
  loading?: boolean
  disabled?: boolean
  active?: boolean
  
  // === Behavior ===
  fullWidth?: boolean
  block?: boolean
  animation?: 'scale' | 'ripple' | 'slide' | 'none'
  
  // === Icon Button Specific ===
  tooltip?: string
  round?: boolean
  
  // === Classes ===
  className?: string
  
  // === Children ===
  children?: React.ReactNode
}

// === VARIANTS ===

## Primary (default)
- Background: bg-[#f4c025], hover:bg-[#d9a419]
- Text: text-black, font-bold
- Size: h-12 px-6 (md), py-4 (block)
- Radius: rounded-xl
- Shadow: shadow-lg
- Active: active:scale-95

## Secondary
- Background: transparent
- Border: border border-white/10, hover:border-white/20
- Text: text-white, font-bold
- Radius: rounded-xl
- Active: active:bg-white/5

## Danger
- Background: bg-red-600, hover:bg-red-500
- Text: text-white, font-bold
- Radius: rounded-xl
- Shadow: shadow-red-950/40
- Active: active:scale-95

## Ghost (icon-only)
- Background: transparent, hover:bg-white/5
- Text: text-zinc-400, hover:text-white
- Radius: rounded-lg
- Size: w-9 h-9

## Link
- Background: transparent
- Text: text-[#f4c025] or text-white (context)
- Hover: hover:underline
- No padding, no border
- Text-color inherited or gold

## Success
- Background: bg-green-600, hover:bg-green-500
- Text: text-white, font-bold
- Radius: rounded-xl

// === SIZE TOKENS ===
- xs: h-8 px-3 text-xs, icon: text-sm
- sm: h-10 px-4 text-sm, icon: text-base
- md: h-12 px-6 text-sm (default), icon: text-lg
- lg: h-14 px-8 text-base, icon: text-xl
- xl: h-16 px-10 text-lg, icon: text-2xl

// === SHAPE TOKENS ===
- square: rounded-lg
- rounded: rounded-xl (default)
- circle: rounded-full
- pill: rounded-full (for wide buttons)

// === DESIGN TOKENS ===
Colors:
- primary: #f4c025, #d9a419, #b89116 (states)
- secondary: white/10, white/20 (hover)
- danger: #dc2626, #ef4444, #b91c1c
- success: #16a34a, #22c55e, #15803d

Typography:
- font-bold (all variants except ghost/link)
- text-xs (xs), text-sm (sm, md), text-base (lg, xl)

Spacing:
- gap-2 between icon and text
- px-6, py-4 (md default)

// === ACCESSIBILITY ===
- semantic button element
- type="button" (or submit/reset as needed)
- aria-label for icon-only buttons
- aria-disabled with disabled prop
- aria-busy with loading state
- keyboard: Enter/Space to activate
- focus: ring-2 ring-[#f4c025]/50

// === BEHAVIORS ===
- Focus: ring-2 ring-[#f4c025]/50 ring-offset-2
- Active: scale-95 (primary, danger, success) or bg-change
- Loading: spinner replaces content, button disabled
- Disabled: opacity-50, pointer-events-none, grayscale
- Hover: background color transition
- Click: smooth press animation

// === EXAMPLE USAGE ===
<button className="bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold h-12 px-6 rounded-xl shadow-lg transition-all active:scale-95">
  {/* Primary button */}
  Salvar
</button>

<button className="border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl transition-all">
  {/* Secondary ghost with icon */}
  Cancelar
</button>

<button className="w-12 h-12 bg-[#f4c025] text-black rounded-full shadow-2xl shadow-[#f4c025]/20 flex items-center justify-center hover:scale-110 transition-all">
  <span className="material-symbols-outlined">add</span>
</button>
```

---

## 🔄 3. WORKFLOWS

---

### WORKFLOW A: Criação de Novo Componente

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST: New Component                       │
│                    "Create Button component"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 1: Component Architect Agent                       │
│         Analyze requirements, create specification              │
├─────────────────────────────────────────────────────────────────┤
│   INPUT: Request + Use cases + Design system context            │
│   OUTPUT: Component spec (props, variants, tokens, a11y)        │
│   DURATION: ~5 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  HUMAN REVIEW   │ (optional)
                    │  Approve spec?  │
                    └─────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │ NO                           │ YES
               ▼                              ▼
        ┌─────────────┐            ┌─────────────────────────────────┐
        │    REJECT   │            │   STEP 2: Design System Agent    │
        │  Refine spec│            │   Add/update design tokens      │
        └─────────────┘            ├─────────────────────────────────┤
                                   │   INPUT: Component spec          │
                                   │   OUTPUT: Updated tailwind.config│
                                   │   DURATION: ~2 minutes           │
                                   └─────────────────────────────────┘
                                                │
                                                ▼
                                 ┌─────────────────────────────────┐
                                 │  STEP 3: Component Generator    │
                                 │  Implement the component        │
                                 ├─────────────────────────────────┤
                                 │  INPUT: Spec + Design tokens    │
                                 │  OUTPUT: Component code file    │
                                 │  DURATION: ~5-10 minutes        │
                                 └─────────────────────────────────┘
                                                │
                                                ▼
                                 ┌─────────────────────────────────┐
                                 │   STEP 4: Component QA Agent    │
                                 │   Validate quality              │
                                 ├─────────────────────────────────┤
                                 │   INPUT: Component code         │
                                 │   OUTPUT: QA report + approval  │
                                 │   DURATION: ~3 minutes          │
                                 └─────────────────────────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────────┐
                                  │      QA APPROVED?            │
                                  └──────────────────────────────┘
                                                │
                                 ┌──────────────┴──────────────┐
                                 │ NO                           │ YES
                                 ▼                              ▼
                          ┌─────────────┐            ┌─────────────────────────────────┐
                          │    ITERATE  │            │ STEP 5: Documentation Agent    │
                          │   Fix bugs  │────────────►│   Create docs & examples      │
                          └─────────────┘            ├─────────────────────────────────┤
                                                     │ INPUT: Component + spec       │
                                                     │ OUTPUT: MD docs, Storybook     │
                                                     │ DURATION: ~2 minutes           │
                                                     └─────────────────────────────────┘
                                                                  │
                                                                  ▼
                                               ┌─────────────────────────────────┐
                                               │    ✅ COMPONENT READY           │
                                               │    File: /components/Button.tsx  │
                                               ├─────────────────────────────────┤
                                               │ Next: Integrate into pages       │
                                               └─────────────────────────────────┘
```

### CRITERIA DE APROVAÇÃO:
- **Spec Approval**: Use cases clear, props comprehensive, variants defined
- **Code Approval**: All QA checks pass, critical issues resolved
- **Doc Approval**: Examples working, API documented, accessibility noted

### TEMPO TOTAL ESTIMADO: ~20-30 minutos por componente (sem iterações)

---

### WORKFLOW B: Refatoração de Componente

```
┌─────────────────────────────────────────────────────────────────┐
│                REQUEST: Refactor Component                      │
│                "Optimize Dashboard for performance"             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 1: Performance Analysis                            │
│         (Manual or via Lighthouse/Benchmarks)                   │
├─────────────────────────────────────────────────────────────────┤
│   - Measure current performance metrics                          │
│   - Identify bottlenecks (re-renders, bundle size)               │
│   - Gather React DevTools profiler data                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 2: Component Refactor Agent                        │
│         Analyze code, create refactoring plan                    │
├─────────────────────────────────────────────────────────────────┤
│   INPUT: Current code + performance metrics                      │
│   OUTPUT: Refactoring plan + changes summary                     │
│   DURATION: ~5-10 minutes                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  HUMAN REVIEW   │ (optional)
                    │  Approve plan?  │
                    └─────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │ NO                           │ YES
               ▼                              ▼
        ┌─────────────┐            ┌─────────────────────────────────┐
        │    REJECT   │            │   STEP 3: Apply Refactoring     │
        │  Adjust plan│            │   (Generator or Refactor Agent) │
        └─────────────┘            ├─────────────────────────────────┤
                                   │   INPUT: Refactoring plan        │
                                   │   OUTPUT: Refactored component   │
                                   │   DURATION: ~10-20 minutes       │
                                   └─────────────────────────────────┘
                                                │
                                                ▼
                                 ┌─────────────────────────────────┐
                                 │   STEP 4: Component QA Agent    │
                                 │   Validate improvements         │
                                 ├─────────────────────────────────┤
                                 │   INPUT: Refactored code        │
                                 │   OUTPUT: QA report + metrics   │
                                 │   DURATION: ~3 minutes          │
                                 └─────────────────────────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────────┐
                                  │   IMPROVEMENTS MEASURED?    │
                                  └──────────────────────────────┘
                                                │
                                 ┌──────────────┴──────────────┐
                                 │ NO                           │ YES
                                 ▼                              ▼
                          ┌─────────────┐            ┌─────────────────────────────────┐
                          │    ITERATE  │            │ STEP 5: Documentation Agent    │
                          │   Refine    │────────────►│   Update docs (changes only)  │
                          └─────────────┘            ├─────────────────────────────────┤
                                                     │ INPUT: Changes summary         │
                                                     │ OUTPUT: Updated docs, changelog│
                                                     │ DURATION: ~1-2 minutes         │
                                                     └─────────────────────────────────┘
                                                                  │
                                                                  ▼
                                               ┌─────────────────────────────────┐
                                               │    ✅ REFACTORING COMPLETE      │
                                               │    Performance improved by X%   │
                                               ├─────────────────────────────────┤
                                               │   Before: Yms  After: Zms       │
                                               └─────────────────────────────────┘
```

### CHECKLIST DE REFACTORING:
- [ ] Performance: re-renders reduced, memo added strategically
- [ ] Code: extracted hooks, split large components
- [ ] Types: eliminated `any`, added proper interfaces
- [ ] Readability: better naming, reduced complexity
- [ ] Testing: existing tests still pass (if any)
- [ ] Breaking changes: none for API consumers

### TEMPERS TIPOS DE REFACTORING:
1. **Performance-focused**: memo, useMemo, useCallback, code splitting
2. **Readability-focused**: extract components, custom hooks, utility functions
3. **Type-safety-focused**: add types, eliminate any, proper generics
4. **Accessibility-focused**: add ARIA attributes, keyboard navigation

---

### WORKFLOW C: QA e Aprovação de Component

```
┌─────────────────────────────────────────────────────────────────┐
│                REQUEST: QA Component                            │
│                "Validate ResourceCard implementation"           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 1: Component QA Agent                              │
│         Run quality checklist automated                          │
├─────────────────────────────────────────────────────────────────┤
│   INPUT: Component code + Component spec                        │
│   OUTPUT: QA report with scores and issues                      │
│   DURATION: ~3-5 minutes                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌───────────────────────┐
                   │   CALCULATE SCORES     │
                   ├───────────────────────┤
                   │   Accessibility: 85/100│
                   │   Performance: 92/100 │
                   │   Code Quality: 88/100│
                   │   Design: 95/100      │
                   │   ────────────────────│
                   │   OVERALL: 90/100     │
                   └───────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ CRITICAL ISSUES?│
                    └─────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │ YES                          │ NO
               ▼                              ▼
        ┌─────────────┐            ┌─────────────────────────────────┐
        │   BLOCKED   │            │  HUMAN REVIEW (optional)        │
        │  Requires   │            ├─────────────────────────────────┤
        │  fixes      │            │   Review warnings, improvements  │
        └─────────────┘            └─────────────────────────────────┘
               │                              │
               │                              │
        ┌──────┴──────┐                      │
        ▼             ▼                      ▼
 ┌─────────┐   ┌──────────┐        ┌─────────────────────────────────┐
 │ Generator│   │Refactor  │        │         ✅ APPROVED             │
 │   fix    │   │   agent  │        ├─────────────────────────────────┤
 └─────────┘   └──────────┘        │  Component ready for:           │
      │             │              │  - Integration into pages        │
      └──────┬──────┘              │  - Storybook documentation      │
             ▼                     │  - Production deployment        │
     ┌──────────────┐              └─────────────────────────────────┘
     │   RETRY QA   │                            
     └──────────────┘                            
             │
             └────────► (back to STEP 1)
```

### NÍVEIS DE APROVAÇÃO:
- **95-100**: Excepcional, production-ready
- **85-94**: Aprovado com warnings mínimos
- **70-84**: Aprovado com warnings - documentar trade-offs
- **50-69**: Needs improvement - block until fixes
- **<50**: Blocked - major issues, redesign needed

### AUTOMATED CHECKS (QUANDO DISPONÍVEL):
- ESLint (code quality)
- TypeScript (type errors)
- Lighthouse (performance + accessibility)
- Axe DevTools (a11y)
- React DevTools Profiler (re-renders)

---

## 💬 4. PROMPT EXAMPLES (COMPLETOS)

---

### PROMPT EXEMPLO 1: Component Architect - Criando Button

```
You are the Component Architect Agent for BarberZap Admin Panel.

CONTEXT:
- Design System: Zinc + Gold (#f4c025) palette
- Framework: React + TypeScript + Tailwind CSS
- Icons: Material Symbols Outlined
- Project type: Barber shop management dashboard

EXISTING PATTERNS FROM CODEBASE:
```tsx
// Primary button pattern from Dashboard.tsx
<button className="px-6 py-4 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95">
  Reconectar WhatsApp
</button>

// Secondary button pattern
<button className="h-12 px-8 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
  <span className="material-symbols-outlined">add</span>
  Novo Serviço
</button>

// Icon button pattern from Agenda.tsx
<button className="fixed bottom-10 right-10 w-16 h-16 bg-[#f4c025] text-black rounded-full shadow-2xl shadow-[#f4c025]/20 flex items-center justify-center hover:scale-110 transition-all z-30">
  <span className="material-symbols-outlined text-4xl">add</span>
</button>

// Ghost button pattern
<button className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
  <span className="material-symbols-outlined text-sm">edit</span>
</button>

// Danger button
<button className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-red-500">
  <span className="material-symbols-outlined text-sm">close</span>
</button>
```

TASK: Create specification for Button component

REQUIREMENTS:
- Button is used throughout the application in many contexts
- Needs to support multiple variants (primary, secondary, danger, ghost, link)
- Needs sizes (xs, sm, md, lg, xl)
- Need shapes (square, rounded, circle, pill)
- Must support icons (left, right, icon-only)
- Needs loading state
- Must be accessible (keyboard, screen reader)
- Follow existing Tailwind patterns from codebase
- Active animation (scale-95) for tactile feedback

DELIVERABLE: Create Button component specification following format:
```typescript
// BUTTON COMPONENT SPECIFICATION
Component: Button
Purpose: [1-2 sentences]

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // All props with types, defaults, descriptions
}

// Variants
- Primary: [description + classes]
- Secondary: [description + classes]
- Danger: [description + classes]
- Ghost: [description + classes]
- Link: [description + classes]
- Icon-only: [description + classes]

// Sizes
- xs: [height, padding, font-size]
- sm: [height, padding, font-size]
- md: [height, padding, font-size]
- lg: [height, padding, font-size]
- xl: [height, padding, font-size]

// Shapes
- square: [radius]
- rounded: [radius]
- circle: [radius]
- pill: [radius]

// Accessibility
- [ ] Semantic button element
- [ ] Keyboard (Enter/Space)
- [ ] Focus visible (ring)
- [ ] aria-label for icon-only
- [ ] aria-disabled with disabled
- [ ] aria-busy with loading

// Design Tokens
- Colors: [list all color variants]
- Typography: [font-weights, sizes]
- Spacing: [padding mappings]
- Radius: [radius mappings]
- Shadows: [shadow mappings]

// States
- Hover: [what changes]
- Focus: [what changes]
- Active: [what changes]
- Disabled: [what changes]
- Loading: [what displays]

// Composed sub-components (if any)
- ButtonGroup: [description]

// Edge cases
- Very long text: [how to handle]
- Icon-only without tooltip: [consideration]
- Loading click: [prevent double submissions]
```

CREATE the specification now. Be specific about Tailwind classes to use.
```

---

### PROMPT EXEMPLO 2: Component Generator - Implementando Button

```
You are the Component Generator Agent for BarberZap Admin Panel.

CONTEXT:
- Design System: Zinc + Gold (#f4c025)
- Framework: React + TypeScript + Tailwind CSS
- Icons: Material Symbols Outlined

BUTTON SPECIFICATION:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  shape?: 'square' | 'rounded' | 'circle' | 'pill'
  leftIcon?: string | React.ReactNode
  rightIcon?: string | React.ReactNode
  iconOnly?: boolean
  loading?: boolean
  disabled?: boolean
  active?: boolean
  fullWidth?: boolean
  animation?: 'scale' | 'ripple' | 'slide' | 'none'
  tooltip?: string
  className?: string
  children?: React.ReactNode
}
```

VARIANTS:
- Primary: bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold, rounded-xl
- Secondary: border border-white/10 hover:bg-white/5 text-white font-bold, rounded-xl
- Danger: bg-red-600 hover:bg-red-500 text-white font-bold, rounded-xl
- Ghost: bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white, rounded-lg
- Link: no bg/border, text-[#f4c025] hover:underline, no padding

SIZES:
- icon: w-9 h-9 or w-12 h-12 for Material Icons
- xs: h-8 px-3 text-xs
- sm: h-10 px-4 text-sm
- md: h-12 px-6 (default)
- lg: h-14 px-8 text-base
- xl: h-16 px-10 text-lg

SHAPES:
- square: rounded-lg
- rounded: rounded-xl (default)
- circle: rounded-full
- pill: rounded-full (for wide buttonsLOADING STATE:
- Show spinner (material-outline:refresh) animating
- Replace or add spinner to content
- Button becomes disabled

EXISTING CODE PATTERNS TO MATCH:
```tsx
// From Dashboard.tsx
<button onClick={() => onNavigate('whatsapp')} className="px-6 py-4 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg transition-all active:scale-95">
  Reconectar WhatsApp
</button>

// From ServicesList.tsx
<button className="h-12 px-8 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
  <span className="material-symbols-outlined">add</span>
  Novo Serviço
</button>

// From Agenda.tsx (icon button)
<button className="fixed bottom-10 right-10 w-16 h-16 bg-[#f4c025] text-black rounded-full shadow-2xl shadow-[#f4c025]/20 flex items-center justify-center hover:scale-110 transition-all z-30">
  <span className="material-symbols-outlined text-4xl">add</span>
</button>

// From Agenda.tsx (ghost/action)
<button className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
  <span className="material-symbols-outlined text-sm">edit</span>
</button>
```

REQUIREMENTS:
- Create Button.tsx component in /root/barber/src/components/ui/ directory
- Follow existing Tailwind patterns exactly
- Use Material Symbols Outlined for icons
- Support all variants, sizes, shapes from spec
- Handle loading state with spin animation
- Include proper TypeScript types
- Add accessibility attributes (aria-label, disabled, etc.)
- Handle edge cases (icon-only without tooltip)
- Write clean, readable code

OUTPUT: Complete Button component file:
```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  shape?: 'square' | 'rounded' | 'circle' | 'pill';
  leftIcon?: string | React.ReactNode;
  rightIcon?: string | React.ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  fullWidth?: boolean;
  animation?: 'scale' | 'ripple' | 'slide' | 'none';
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  leftIcon,
  rightIcon,
  iconOnly,
  loading = false,
  disabled,
  active = false,
  fullWidth = false,
  animation = 'scale',
  tooltip,
  className,
  children,
  ...buttonProps
}) => {
  // Your implementation here
};

export default Button;
```

IMPLEMENT the component now with proper variant mapping, size mapping, shape mapping, and all features.
```

---

### PROMPT EXEMPLO 3: Component QA - Validando Button

```
You are the Component QA Agent for BarberZap Admin Panel.

CONTEXT:
- Component: Button
- Location: /root/barber/src/components/ui/Button.tsx
- Spec: See previous prompt

BUTTON COMPONENT CODE:
```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  shape?: 'square' | 'rounded' | 'circle' | 'pill';
  leftIcon?: string | React.ReactNode;
  rightIcon?: string | React.ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  fullWidth?: boolean;
  animation?: 'scale' | 'ripple' | 'slide' | 'none';
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  leftIcon,
  rightIcon,
  iconOnly,
  loading = false,
  disabled,
  active = false,
  fullWidth = false,
  animation = 'scale',
  tooltip,
  className,
  children,
  ...buttonProps
}) => {
  const sizeClasses = {
    xs: 'h-8 px-3 text-xs',
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
    xl: 'h-16 px-10 text-lg',
    icon: 'w-9 h-9 p-0'
  };

  const variantClasses = {
    primary: 'bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold',
    secondary: 'border border-white/10 hover:bg-white/5 text-white font-bold',
    danger: 'bg-red-600 hover:bg-red-500 text-white font-bold',
    ghost: 'bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white',
    link: 'text-[#f4c025] hover:underline px-0 py-0',
    success: 'bg-green-600 hover:bg-green-500 text-white font-bold'
  };

  const shapeClasses = {
    square: 'rounded-lg',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
    pill: 'rounded-full'
  };

  const baseClasses = `
    inline-flex items-center justify-center
    gap-2
    transition-all
    font-semibold
    focus:outline-none
    focus:ring-2 focus:ring-[#f4c025]/50 focus:ring-offset-2 focus:ring-offset-zinc-950
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    ${fullWidth ? 'w-full' : ''}
    ${animation === 'scale' && !loading ? 'active:scale-95' : ''}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${shapeClasses[shape]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const IconComponent = ({ iconName }: { iconName: string }) => (
    <span className="material-symbols-outlined">{iconName}</span>
  );

  const LoadingSpinner = () => (
    <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }
    return (
      <>
        {leftIcon && (typeof leftIcon === 'string' ? <IconComponent iconName={leftIcon} /> : leftIcon)}
        {children && <span>{children}</span>}
        {rightIcon && (typeof rightIcon === 'string' ? <IconComponent iconName={rightIcon} /> : rightIcon)}
      </>
    );
  };

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      aria-label={tooltip || (iconOnly && typeof children === 'string' ? children : undefined)}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...buttonProps}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
```

TASK: Validate Button component quality

QUALITY CHECKLIST:

1. ACCESSIBILITY (WCAG 2.1 AA)
   a) Semantic HTML elements used?
      - Is it a <button> element?
      - Are type attributes set correctly?
   
   b) ARIA attributes?
      - aria-label for icon-only buttons?
      - aria-busy with loading state?
      - aria-disabled properly set?
   
   c) Keyboard navigation?
      - Can Tab focus the button?
      - Does Enter/Space trigger it?
      - Is focus visible?
   
   d) Color contrast?
      - Primary: #f4c025 text on bg - check contrast
      - Secondary: white text on zinc - check contrast
      - Danger: white text on red - check contrast
      - Ghost: zinc-400 to white - check contrast
   
   e) Touch targets?
      - Are sizes >= 44x44px?

2. PERFORMANCE
   a) Unnecessary re-renders?
      - Is memo() needed? (likely yes for frequently rendering lists)
   
   b) Inline functions?
      - Any inline functions in render?
   
   c) Bundle size?
      - Any heavy dependencies? (none, good)

3. REACT BEST PRACTICES
   a) Prop types?
      - TypeScript interface used ✓
      - Default values set ✓
   
   b) Controlled/uncontrolled?
      - Button is inherently uncontrolled, this is correct ✓
   
   c) Direct DOM manipulation?
      - None ✓
   
   d) Inline functions?
      - IconComponent defined inside - should be moved outside!
   
   e) Named component?
      - Button is named function ✓

4. DESIGN CONSISTENCY
   a) Design tokens?
      - Colors match spec ✓
      - Sizes match spec ✓
      - Shapes match spec ✓
   
   b) Hover/focus states?
      - Hover implemented ✓
      - Focus ring implemented ✓
   
   c) Loading state?
      - Spinner animation ✓
      - Disabled when loading ✓
   
   d) Empty/edge cases?
      - Icon-only without tooltip handled?
      - Very long text handled (overflow)?
      - Null/undefined props handled?

5. CODE QUALITY
   a) No console.log?
      - None ✓
   
   b) No unused imports?
      - All imports used ✓
   
   c) Type safety?
      - No `any` types ✓
      - TypeScript strict compatible ✓
   
   d) Meaningful names?
      - All names clear ✓

6. EDGE CASES
   a) Long text?
      - May overflow on small screens
   
   b) Empty data?
      - Button with no children - will it render?
   
   c) Loading click?
      - disabled prevents double click ✓

OUTPUT FORMAT: Provide QA report in this format:
```yaml
accessibility_score: <0-100>
performance_score: <0-100>
code_quality_score: <0-100>
design_consistency_score: <0-100>
overall_score: <0-100>

critical_issues:
  - severity: high/medium/low
    area: accessibility/performance/etc
    description: clear description
    suggestion: specific suggestion
    location: line number or code section

warnings:
  - severity: medium/low
    area: ...
    description: ...
    suggestion: ...

recommendations:
  - description: ...
    priority: high/medium/low
    effort: low/medium/high

approved: true/false
notes: additional comments
```

RUN the full QA check now on the Button component.
```

---

## 🗂️ 5. COMPONENT MAPPING (CODEBASE → PATTERNS)

---

### PATTERN: PageHeader

**Localização:** Usado em todas as páginas principais

**Estrutura atual:**
```tsx
<header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
  <div>
    <h1 className="text-4xl font-black tracking-tight mb-2">{title}</h1>
    <p className="text-zinc-500">{description}</p>
  </div>
  {/* Actions area */}
</header>
```

**Variantes identificadas:**
- **Default**: Title + description + actions below
- **With stats**: Title + stats cards inline
- **With tabs**: Title + tab navigation + actions
- **Centered**: Title centered (modals/drawers)

**Variants futuras a criar:**
- `PageHeader` component consolidado
- Com opção de breadcrumbs
- Com opção de actions array
- Suporte a filters inline

---

### PATTERN: StatsCard

**Localização:** Dashboard, Agenda, Finance

**Estrutura atual:**
```tsx
<div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined">{icon}</span>
    <span className="text-zinc-500 text-xs uppercase">{label}</span>
  </div>
  <p className="text-2xl font-bold">{value}</p>
</div>
```

**Variantes identificadas:**
- **Small**: Icon + label + value (Agenda)
- **Large**: Decorative icon + large value + subtitle (Dashboard)
- **Trend**: Value + percentage change + trend icon (Finance)
- **Split**: Multiple metrics in one card (Dashboard - haircuts + revenue)

---

### PATTERN: ResourceCard

**Localização:** ServicesList (serviços)

**Estrutura atual:**
```tsx
<div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 group hover:border-[#f4c025]/30">
  <div className="w-14 h-14 bg-white/5 rounded-2xl">
    <span className="material-symbols-outlined">{icon}</span>
  </div>
  <h3>{name}</h3>
  <p>{description}</p>
  <div className="mt-auto pt-6 border-t">
    {/* Price, duration */}
  </div>
  {/* Overlay with edit/delete */}
</div>
```

**Variantes identificadas:**
- **Default**: Service card with price/duration
- **With badge**: "Popular" badge
- **With image**: Future user cards, product cards
- **Empty state**: "Adicionar Serviço" placeholder

---

### PATTERN: ListItem

**Localização:** Agenda (agendamentos), Dashboard (tabela)

**Estrutura atual (Agenda):**
```tsx
<div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 flex items-center hover:border-[#f4c025]/30 group">
  <div className="w-24 text-right">
    <span className="text-2xl font-black">14:00</span>
  </div>
  <img src={avatar} className="w-14 h-14 rounded-full" />
  <div>
    <h4>{clientName}</h4>
    <div>{service} · R$ {price}</div>
  </div>
  <span className="badge">{status}</span>
  {/* Hover actions */}
</div>
```

**Variantes identificadas:**
- **Time-based**: Time on left + details
- **Table row**: Grid layout (Dashboard)
- **Compact**: Minimal info
- **With actions**: Hover reveals edit/delete

---

### PATTERN: DataTable

**Localização:** Dashboard (próximos agendamentos)

**Estrutura atual:**
```tsx
<div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
  <table className="w-full text-left">
    <thead>
      <tr className="text-zinc-500 text-[10px] uppercase">
        <th>Cliente</th>
        <th>Serviço</th>
        <th>Horário</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(row => <tr key={id}>{/* cells */}</tr>)}
    </tbody>
  </table>
</div>
```

**Features futuras:**
- Sortable columns
- Filterable
- Pagination
- Row selection
- Inline actions

---

### PATTERN: Button

**Localização:** Toda aplicação

**Classes identificadoras:**
- Primary: `bg-[#f4c025] text-black font-bold rounded-xl`
- Secondary: `border border-white/10 text-white font-bold rounded-xl`
- Ghost: `bg-white/5 text-zinc-400 hover:text-white rounded-lg`
- Danger: `hover:bg-red-500`
- Icon-only: `w-9 h-9` ou `w-12 h-12`
- FAB: `fixed bottom-10 right-10 w-16 h-16 rounded-full`

---

### PATTERN: Badge

**Localização:** Dashboard, Agenda, ServicesList

**Classes:**
```tsx
<span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
  {/* Variants */}
  {status === 'confirmed' ? 'bg-green-500/10 text-green-500' : ''}
  {status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : ''}
  {status === 'canceled' ? 'bg-red-500/10 text-red-500' : ''}
</span>
```

---

### PATTERN: Alert

**Localização:** Dashboard (alert WhatsApp desconectado)

**Estrutura:**
```tsx
<div className="lg:col-span-2 relative border border-red-500/20 bg-gradient-to-br from-red-950/20 to-zinc-900 rounded-2xl p-8">
  <div className="bg-red-500/20 text-red-500 p-4 rounded-2xl">
    <span className="material-symbols-outlined text-4xl">warning</span>
  </div>
  <h3>Alert Title</h3>
  <p>Description</p>
  <button>Primary action</button>
</div>
```

**Variantes futuras:**
- Success (green)
- Warning (yellow/gold)
- Info (blue)
- Dismissible

---

### PATTERN: Form Input

**Localização:** Login

**Estrutura:**
```tsx
<div>
  <label className="text-zinc-400 text-sm mb-2">Label</label>
  <div className="relative group">
    <span className="material-symbols-outlined absolute left-4 text-zinc-500 group-focus-within:text-[#f4c025]">
      icon
    </span>
    <input 
      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 text-white focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50"
    />
  </div>
</div>
```

---

### PATTERN: Sidebar Navigation

**Localização:** Sidebar.tsx (layout)

**Estrutura:**
```tsx
<button className={`
  w-full flex items-center gap-3 px-4 py-3 rounded-xl
  ${current === item ? 'bg-[#f4c025]/10 text-[#f4c025] border-l-4' : ''}
  ${current !== item ? 'text-zinc-500 hover:bg-white/5' : ''}
`}>
  <span className="material-symbols-outlined">{icon}</span>
  <span>{label}</span>
</button>
```

**Feature consolidar:**
- Item selecionado com destaque visual
- Badge de notificação (futuro)
- Submenus
- Collapse/expand

---

## 📊 6. AGENT ORCHESTRATION MATRIX

---

| Request Type | Primary Agent | Supporting Agents | Output |
|--------------|---------------|-------------------|--------|
| New component | Architect → Generator | Design System (tokens), QA (validate) | Component file + docs |
| Refactor component | Refactor | QA (before/after), Generator (if rewrite needed) | Improved component |
| Bug fix | Refactor/Generator | QA (regression test) | Fixed component |
| Add variant to existing | Refactor | Design System (new tokens), QA | Extended component |
| Update design system | Design System | Refactor (update components) | Updated config + components |
| Create pattern library | Documentation | Architect (specs), QA (examples) | Pattern docs |
| Performance audit | Refactor | QA (benchmarks) | Optimization report |
| Accessibility audit | QA | Refactor (fixes) | A11y report + fixes |
| Component review | QA | Architect (spec comparison) | QA report |

---

## 🚀 7. QUICK START GUIDE

---

### PARA CRIAR NOVO COMPONENT:

1. **Chamar Architect Agent** com descrição do componente
2. **Revisar spec** (opcional, human review)
3. **Chamar Design System Agent** para adicionar tokens
4. **Chamar Generator Agent** para implementar
5. **Chamar QA Agent** para validar
6. **Chamar Documentation Agent** para documentar

**Prompt one-liner:**
```
Create new component: ResourceCard for displaying barber services with name, description, price, duration, edit/delete actions. Use existing ServiceList.tsx as reference.
```

### PARA REFACTORAR COMPONENT:

1. **Executar análise de performance** (opcional)
2. **Chamar Refactor Agent** com código atual + objetivos
3. **Chamar QA Agent** para validar melhorias
4. **Chamar Documentation Agent** para atualizar docs (se necessário)

**Prompt one-liner:**
```
Refactor Dashboard.tsx to improve performance - extract repeated patterns into reusable components (StatsCard, ActionCard, DataTable). Maintain all current functionality.
```

### PARA VALIDAR COMPONENT:

1. **Chamar QA Agent** com caminho do componente
2. **Review QA report**
3. **Iterar se necessário** (via Generator/Refactor)

**Prompt one-liner:**
```
QA check on /root/barber/src/components/ui/Button.tsx - validate accessibility, performance, React best practices, and design consistency.
```

---

## 📚 8. RESOURCES & REFERENCES

---

### REPOSITÓRIO DE PADRÕES:
- `/root/barber/src/components/dashboard/Dashboard.tsx` - StatsCard, ActionCard, DataTable, Alert
- `/root/barber/src/components/agenda/Agenda.tsx` - ListItem, Badge, DatePicker
- `/root/barber/src/components/services/ServicesList.tsx` - ResourceCard, EmptyState
- `/root/barber/src/components/finance/Finance.tsx` - StatsCard (large), ChartCard
- `/root/barber/src/components/auth/Login.tsx` - Form, InputGroup, SocialButton
- `/root/barber/src/components/layout/Sidebar.tsx` - Navigation, MenuItem

### TAILWIND CONFIG:
- `tailwind.config.ts` - Design tokens base
- Cores: zinc scale, #f4c025 (gold), red-500/600 (danger), green-500 (success)
- Border radius: xl (12px), 2xl (16px), 3xl (24px)
- Shadows: lg (0 10px 15px -3px rgba(0,0,0,0.1))

### MATERIAL SYMBOLS OUTLINED:
- Ícones usados: home, calendar_month, content_cut, show_chart, chat, psychology, settings, payments, schedule, etc.
- Documentação: https://fonts.google.com/icons

---

## 🎨 9. DESIGN TOKENS REFERENCE

---

### COLORS

```typescript
// Primary
const gold = {
  400: '#f4c025',  // Default
  500: '#d9a419',  // Hover
  600: '#b89116',  // Active
}

// Backgrounds
const bg = {
  default: '#09090b',    // zinc-950
  card: '#18181b',       // zinc-900
  surface: '#27272a',    // zinc-800
  raised: 'rgba(255,255,255,0.05)',
}

// Text
const text = {
  primary: '#ffffff',
  secondary: '#a1a1aa',  // zinc-400
  muted: '#71717a',      // zinc-500
  disabled: '#52525b',   // zinc-600
}

// Status
const status = {
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  danger: 'bg-red-500/10 text-red-500',
  info: 'bg-blue-500/10 text-blue-500',
  gold: 'bg-[#f4c025]/10 text-[#f4c025]',
}
```

### SPACING

```typescript
// Padding
const padding = {
  xs: 'p-4',      // 16px
  sm: 'p-6',      // 24px
  md: 'p-8',      // 32px (default card)
  lg: 'p-10',     // 40px
  xl: 'p-12',     // 48px
}

// Gap
const gap = {
  sm: 'gap-2',    // 8px
  md: 'gap-4',    // 16px
  lg: 'gap-6',    // 24px
  xl: 'gap-8',    // 32px
}
```

### BORDER RADIUS

```typescript
const radius = {
  sm: 'rounded-lg',     // 8px
  md: 'rounded-xl',     // 12px (default button)
  lg: 'rounded-2xl',    // 16px (default card)
  xl: 'rounded-3xl',    // 24px (large card)
  full: 'rounded-full', // circle/pill
}
```

### TYPOGRAPHY

```typescript
// Headings
const heading = {
  h1: 'text-4xl font-black tracking-tight',      // Page titles
  h2: 'text-2xl font-bold',                      // Section titles
  h3: 'text-xl font-bold',                       // Card titles
  h4: 'text-lg font-bold',                       // Subtitles
}

// Body
const body = {
  base: 'text-sm',
  small: 'text-xs',
  tall: 'text-lg',
}

// Labels
const label = {
  default: 'text-zinc-500',
  muted: 'text-zinc-600',
  uppercase: 'uppercase tracking-widest',
}
```

### SHADOWS

```typescript
const shadow = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',                    // Elevated buttons
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',                // FAB buttons
  gold: 'shadow-[#f4c025]/20',        // Gold glow
  danger: 'shadow-red-950/40',        // Red glow
}
```

---

## 🔧 10. INTEGRATION WITH EXISTING CODEBASE

---

### FILE STRUCTURE RECOMMENDED:

```
/root/barber/src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Alert.tsx
│   │   ├── Modal.tsx
│   │   ├── Dialog.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Select.tsx
│   │   ├── Toggle.tsx
│   │   └── index.ts
│   ├── layout/                 # Layout components
│   │   ├── Sidebar.tsx        # Existing
│   │   ├── Header.tsx         # Future
│   │   ├── MainLayout.tsx     # Future
│   │   └── index.ts
│   ├── patterns/              # Pattern components
│   │   ├── PageHeader.tsx
│   │   ├── StatsCard.tsx
│   │   ├── ResourceCard.tsx
│   │   ├── ListItem.tsx
│   │   ├── DataTable.tsx
│   │   └── index.ts
│   ├── dashboard/             # Page-specific
│   │   ├── Dashboard.tsx      # Existing
│   │   └── index.ts
│   ├── agenda/
│   │   ├── Agenda.tsx         # Existing
│   │   └── index.ts
│   ├── services/
│   │   ├── ServicesList.tsx   # Existing
│   │   └── index.ts
│   ├── finance/
│   │   ├── Finance.tsx        # Existing
│   │   └── index.ts
│   ├── whatsapp/
│   │   ├── WhatsAppConnect.tsx # Existing
│   │   └── index.ts
│   ├── aiconfig/
│   │   ├── AIConfig.tsx       # Existing
│   │   └── index.ts
│   └── auth/
│       ├── Login.tsx          # Existing
│       └── index.ts
├── design-system/
│   ├── tokens.ts              # Design tokens as TS
│   ├── variants.ts            # Variant configurations
│   └── index.ts
├── hooks/
│   ├── useMediaQuery.ts       # Future
│   ├── useStatusColor.ts      # Future
│   └── index.ts
└── lib/
    ├── utils.ts               # Utility functions
    └── cn.ts                  # Classnames merger (clsx + tailwind-merge)
```

### EXPORTS COMPONENT INDEX:

```tsx
// /root/barber/src/components/index.ts
export { default as Button } from './ui/Button';
export { default as Badge } from './ui/Badge';
export { default as Card } from './ui/Card';
export { default as Input } from './ui/Input';
export { default as Alert } from './ui/Alert';
export { default as PageHeader } from './patterns/PageHeader';
export { default as StatsCard } from './patterns/StatsCard';
export { default as ResourceCard } from './patterns/ResourceCard';
export { default as ListItem } from './patterns/ListItem';
export { default as DataTable } from './patterns/DataTable';
```

### UTILITY FUNCTIONS:

```tsx
// /root/barber/src/lib/cn.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

## 📖 11. EXAMPLE MIGRATION: EXISTING → NEW COMPONENTS

---

### EXEMPLO 1: Consolidando Button from multiple usages

**Before (scattered throughout codebase):**
```tsx
// Dashboard.tsx
<button className="px-6 py-4 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg active:scale-95">
  Reconectar
</button>

// ServicesList.tsx
<button className="h-12 px-8 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg active:scale-95 flex items-center gap-2">
  <span className="material-symbols-outlined">add</span>
  Novo Serviço
</button>

// Agenda.tsx (FAB)
<button className="fixed bottom-10 right-10 w-16 h-16 bg-[#f4c025] text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110">
  <span className="material-symbols-outlined text-4xl">add</span>
</button>
```

**After (using unified Button component):**
```tsx
import { Button } from '@/components';

// Dashboard.tsx
<Button variant="primary" size="md">
  Reconectar
</Button>

// ServicesList.tsx
<Button variant="primary" size="md" leftIcon="add">
  Novo Serviço
</Button>

// Agenda.tsx (FAB)
<Button 
  variant="primary" 
  size="xl" 
  shape="circle"
  className="fixed bottom-10 right-10"
  iconOnly
>
  <span className="material-symbols-outlined text-4xl">add</span>
</Button>
```

---

### EXEMPLO 2: Extracting StatsCard from Dashboard/Agenda/Finance

**Before (repeated patterns):**
```tsx
// Dashboard.tsx
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
    <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
      <span className="material-symbols-outlined">payments</span>
    </div>
  </div>
</div>

// Agenda.tsx (similar but different)
<div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-2">
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-sm text-[#f4c025]">calendar_month</span>
    <span className="text-[10px] font-bold text-zinc-600 uppercase">Agendados</span>
  </div>
  <p className="text-2xl font-bold">12</p>
</div>
```

**After (unified StatsCard):**
```tsx
import { StatsCard } from '@/components';

// Dashboard.tsx - Multi-value stats card
<StatsCard 
  variant="split"
  stats={[
    { label: 'Cortes Hoje', value: '8', icon: 'content_cut' },
    { label: 'Faturamento Est.', value: 'R$ 240,00', icon: 'payments' }
  ]}
/>

// Agenda.tsx - Simple stat card
<StatsCard 
  icon={{ name: 'calendar_month', color: 'text-[#f4c025]' }}
  label="Agendados"
  value="12"
/>

// Finance.tsx - Large stat with trend
<StatsCard 
  size="lg"
  icon="payments"
  label="Faturamento Total"
  value="R$ 4.520,00"
  subtitle="Comparado a R$ 4.018,00 mês anterior"
  trend={{ value: '+12.5%', direction: 'up' }}
/>
```

---

### EXEMPLO 3: Extracting ResourceCard from ServicesList

**Before (inline card):**
```tsx
<div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 group hover:border-[#f4c025]/30 transition-all flex flex-col relative overflow-hidden">
  <span className="absolute top-4 right-4 bg-[#f4c025]/10 text-[#f4c025] text-[10px] font-bold uppercase px-3 py-1 rounded-full">
    Popular
  </span>
  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
    <span className="material-symbols-outlined text-2xl text-zinc-400">{svc.icon}</span>
  </div>
  <h3 className="text-xl font-bold mb-1">{svc.name}</h3>
  <p className="text-zinc-500 text-sm mb-10">{svc.description}</p>
  <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-end">
    <div>
      <p className="text-[10px] text-zinc-600 font-bold uppercase">Preço</p>
      <p className="text-xl font-bold">R$ {svc.price},00</p>
    </div>
    <div className="text-right">
      <p className="text-[10px] text-zinc-600 font-bold uppercase">Duração</p>
      <div className="flex items-center gap-1 text-zinc-400">
        <span className="material-symbols-outlined text-sm">schedule</span>
        <span>{svc.duration} min</span>
      </div>
    </div>
  </div>
  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity">
    <button>edit</button>
    <button>delete</button>
  </div>
</div>
```

**After (ResourceCard component):**
```tsx
import { ResourceCard, Badge } from '@/components';

<ResourceCard
  id={svc.id}
  name={svc.name}
  description={svc.description}
  icon={svc.icon}
  badges={svc.popular ? [{ text: 'Popular', variant: 'gold' }] : []}
  stats={[
    { label: 'Preço', value: `R$ ${svc.price},00` },
    { label: 'Duração', value: `${svc.duration} min`, icon: 'schedule' }
  ]}
  secondaryActions={[
    { icon: 'edit', onClick: () => handleEdit(svc) },
    { icon: 'delete', onClick: () => handleDelete(svc), variant: 'danger' }
  ]}
  hoverable
  onClick={() => navigate(`/services/${svc.id}`)}
/>
```

---

## ✅ 12. SUCCESS CRITERIA & METRICS

---

### QUALITY METRICS FOR COMPONENTS:

- **Accessibility Score**: ≥90/100 (Axe DevTools)
- **Performance Score**: ≥85/100 (Lighthouse Performance)
- **Type Coverage**: 100% (No `any` types)
- **Test Coverage**: ≥80% (when tests are added)
- **Bundle Size Impact**: <5KB per component (gzipped)

### ADOPTION METRICS:

- **Components Created**: Tracked via component catalog
- **Code Reduction Lines**: Measure after consolidation
- **Reusability Index**: Avg. usage per component
- **Developer Time Savings**: Time saved on new features

### DESIGN CONSISTENCY METRICS:

- **Design Token Compliance**: 100% tokens used (no hardcoded colors)
- **Pattern Consistency**: No duplicate patterns
- **Visual Regression**: Zero breaking changes to existing UI

---

## 🎯 SUMMARY

---

Este documento define a arquitetura completa de **6 agentes especializados em componentes UI** para o Framework Painel Admin BarberZap:

| Agent | Primary Function | Key Skills |
|-------|------------------|------------|
| **Component Architect** | Especificar novos componentes | Design theory, API design, TypeScript |
| **Component Generator** | Implementar componentes | React, Tailwind, patterns |
| **Component Refactor** | Melhorar componentes existentes | Performance, code analysis, patterns |
| **Component QA** | Validar qualidade | Accessibility, testing, best practices |
| **Design System** | Gerenciar tokens e variantes | Design tokens, configuration |
| **Documentation** | Documentar componentes | Technical writing, examples |

### WORKFLOWS DEFINIDOS:

1. **Criação de Novo Componente**: Architect → Design System → Generator → QA → Documentation
2. **Refatoração**: Analysis → Refactor Agent → QA → Doc Update
3. **QA & Aprovação**: QA Check → Score → Approve/Block

### TEMPLATES CRIADAS:

1. **ResourceCard Specification** - Para cartões de listagem
2. **DataTable Specification** - Para tabelas de dados
3. **Button Component Specification** - Para botões interativos

### PRÓXIMOS PASSOS:

1. Implementar o primeiro componente seguindo o workflow (Button é um bom início)
2. Criar diretórios de estrutura: `/components/ui`, `/components/patterns`
3. Configurar `tailwind.config.ts` com tokens extendidos
4. Criar utilitário `cn()` para class merging
5. Migração gradual: Substituir padrões repetidos por componentes consolidados

---

**Documento criado em:** 2026-03-03  
**Versão:** 1.0  
**Status:** Production-ready  
**Maintainer:** Component Agents Architecture Team
