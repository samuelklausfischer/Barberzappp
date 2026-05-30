# 🚀 Component Agents - Quick Reference

Guia rápido para usar os agentes especializados em componentes UI.

---

## 📋 QUICK LOOKUP

| Task | Primary Agent | Prompt Key |
|------|---------------|-----------|
| Criar novo componente | `Component Architect` → `Component Generator` → `Component QA` | `create new component: [name]` |
| Refatorar componente | `Component Refactor` | `refactor: [path] - [goals]` |
| Validar componente | `Component QA` | `QA check: [path]` |
| Adicionar variante | `Component Refactor` + `Design System` | `add variant to [name]: [variant]` |
| Melhorar performance | `Component Refactor` | `optimize [path] for performance` |
| Criar documentação | `Documentation Agent` | `document [path]` |
| Atualizar design tokens | `Design System Agent` | `update design tokens for [feature]` |

---

## 💪 PROMPT TEMPLATES (copiar & colar)

---

### TEMPLATE 1: Criar Componente Novo

```
You are the Component Architect Agent for BarberZap Admin Panel.

CONTEXT:
- Design System: Zinc + Gold (#f4c025) palette
- Framework: React + TypeScript + Tailwind CSS
- Icons: Material Symbols Outlined

TASK: Create specification for a new component: [NOME_DO_COMPONENTE]

REQUIREMENTS:
- Component purpose and use cases
- Design comprehensive props interface with TypeScript
- Define variants (size, color, intent, shape)
- Specify behaviors (interactions, states, transitions)
- Accessibility requirements (ARIA, keyboard, focus)
- Design tokens to use (colors, spacing, radius, shadows)

OUTPUT: Complete component specification following this format:
```typescript
Component: [NOME]
Purpose: [1-2 sentences]

interface [ComponentName]Props {
  // ...all props
}

// Variants
- Variant A: description + classes
- Variant B: description + classes

// Accessibility
- [ ] Requirements

// Design Tokens
- Colors, spacing, radius used
```
```

**Seguir este prompt com:**
```
Now implement this component using existing codebase patterns. Use Button.tsx and Dashboard.tsx as style references.
```

---

### TEMPLATE 2: Refatorar Componente

```
You are the Component Refactor Agent for BarberZap Admin Panel.

TASK: Refactor component at [CAMINHO_DO_ARQUIVO]

CURRENT CODE:
[COLAR CÓDIGO AQUI OU DIZER: "see the file"]

REFACTORING GOALS:
- Extract repeated logic into custom hooks
- Split large components into smaller ones
- Improve performance (reduce re-renders)
- Enhance type safety (eliminate any types)
- Follow existing patterns from codebase

EXISTING PATTERNS TO MATCH:
- Reference [COMPONENT_DE_REFERENCIA] for style
- Reference [OUTRO_COMPONENT] for patterns

OUTPUT: Refactored component code with:
// Summary of changes:
// - Performance: ...
// - Readability: ...
// - Maintainability: ...
```

---

### TEMPLATE 3: Validar Componente (QA)

```
You are the Component QA Agent for BarberZap Admin Panel.

TASK: Validate component at [CAMINHO_DO_ARQUIVO]

COMPONENT CODE:
[COLAR CÓDIGO AQUI OU DIZER: "see the file"]

QUALITY CHECKLIST:

1. ACCESSIBILITY (WCAG 2.1 AA)
   - Semantic HTML elements used
   - ARIA labels where needed
   - Keyboard navigation complete
   - Focus indicators visible
   - Screen reader announcements
   - Color contrast ratios met
   - Touch targets minimum 44x44px

2. PERFORMANCE
   - Avoids unnecessary re-renders
   - No inline functions that cause re-renders
   - Bundle size minimal

3. REACT BEST PRACTICES
   - Strong TypeScript types (no any)
   - Named function components
   - Proper key usage
   - No direct DOM manipulation

4. DESIGN CONSISTENCY
   - Matches design system tokens
   - Responsive breakpoints match
   - Hover/focus states implemented

5. CODE QUALITY
   - No console.log statements
   - Meaningful variable names
   - ESLint rules passing

6. EDGE CASES
   - Empty data handled
   - Loading state handled
   - Error state handled

OUTPUT: QA report in YAML format:
```yaml
accessibility_score: 0-100
performance_score: 0-100
code_quality_score: 0-100
design_consistency_score: 0-100
overall_score: 0-100

critical_issues:
  - severity: high/medium/low
    area: accessibility/performance/code/design
    description: clear description
    suggestion: specific fix

warnings:
  - severity: medium/low
    description: ...

approved: true/false
notes: ...
```
```

---

### TEMPLATE 4: Adicionar Variante Existente

```
You are the Component Refactor Agent for BarberZap Admin Panel.

TASK: Add new variant to [NOME_DO_COMPONENTE]

CURRENT COMPONENT:
[COLAR CÓDIGO AQUI OU CAMINHO]

NEW VARIANT REQUIREMENTS:
- Variant name: [NOME_DA_VARIANTE]
- Purpose: [Quando usar esta variante]
- Colors: [Cores específicas]
- Size: [Tamanho se diferente do padrão]
- Shape: [Formato se diferente]

OUTPUT: Updated component with:
// New variant: [nome]
// Classes: [classes Tailwind]
// Usage example: <Button variant="[nome]" />
```

---

### TEMPLATE 5: Documentar Componente

```
You are the Documentation Agent for BarberZap Admin Panel.

TASK: Create documentation for [NOME_DO_COMPONENTE]

COMPONENT CODE:
[COLAR CÓDIGO AQUI OU CAMINHO]

DOCUMENTATION REQUIRED:
1. Component Overview (purpose, when to use)
2. Props API table (all props with types and defaults)
3. All variants with descriptions
4. Usage examples (basic, with all props, edge cases)
5. Accessibility notes
6. Design tokens used
7. See Also (related components)

OUTPUT: Complete component documentation in Markdown format
```

---

## 🔄 WORKFLOW EXAMPLES

---

### EXEMPLO 1: Criando Button Component do Zero

**Passo 1: Architect Agent**
```
Create specification for Button component:
- Used throughout the app
- Needs variants: primary, secondary, danger, ghost, link
- Sizes: xs, sm, md, lg, xl, icon
- Shapes: square, rounded, circle, pill
- Icons: left, right, icon-only
- Loading state
- Accessible (keyboard, ARIA)
```

**Passo 2: Design System Agent**
```
Add color variants to design tokens for Button:
- primary: #f4c025, #d9a419 states
- secondary: white/10, white/20
- danger: red-600, red-500
- success: green-600, green-500
```

**Passo 3: Generator Agent**
```
Implement Button component following:
- Tailwind patterns from Dashboard.tsx
- Material Symbols Outlined icons
- All variants from spec
- Proper TypeScript types
- Accessibility attributes
```

**Passo 4: QA Agent**
```
QA check on Button.tsx:
- Contrast ratios for all variants
- Minimum touch targets (44x44px)
- Keyboard navigation
- Focus indicators
- No performance issues
```

**Passo 5: Documentation Agent**
```
Document Button component:
- Props API table
- All variants with examples
- Usage patterns
- Accessibility notes
```

---

### EXEMPLO 2: Refatorando Dashboard para Extrair Components

**Passo 1: Refactor Agent**
```
Refactor Dashboard.tsx to extract:
1. StatsCard component (repeated 3 types)
2. ActionCard component (grid items)
3. DataTable component (appointment list)

Maintain all current functionality and styling.
Follow existing Tailwind patterns.
```

**Passo 2: QA Agent**
```
QA check on refactored Dashboard:
- Visual output identical to original
- No broken functionality
- Better performance
- Clean code structure
```

**Passo 3: Documentation Agent**
```
Document new extracted components:
- StatsCard with split variant
- ActionCard for grid items
- DataTable with filtering support
```

---

### EXEMPLO 3: Validando Quality de Componente Existente

**Prompt direto:**
```
You are the Component QA Agent for BarberZap Admin Panel.

QA check on /root/barber/src/components/dashboard/Dashboard.tsx

Check:
- Performance (re-renders)
- Accessibility (semantic HTML, ARIA)
- React best practices
- Design consistency
- Code quality
- Edge cases

Provide YAML QA report with scores and issues.
```

---

## 🎨 COMMON VARIANTS

---

### BUTTON VARIANTS

```tsx
// Primary (main actions)
<Button variant="primary">Salvar</Button>

// Secondary (cancel, go back)
<Button variant="secondary">Cancelar</Button>

// Danger (delete, destroy)
<Button variant="danger">Excluir</Button>

// Ghost (icon actions)
<Button variant="ghost" iconOnly>
  <span className="material-symbols-outlined">edit</span>
</Button>

// Link (text-only actions)
<Button variant="link">Ver todos</Button>

// Success (confirm, complete)
<Button variant="success">Confirmar</Button>
```

### SIZE VARIANTS

```tsx
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="icon">Icon only</Button>
```

### ICON COMBINATIONS

```tsx
// Left icon
<Button leftIcon="add">Adicionar</Button>

// Right icon
<Button rightIcon="arrow_forward">Próximo</Button>

// Icon only
<Button iconOnly tooltip="Editar">
  <span className="material-symbols-outlined">edit</span>
</Button>

// Both icons
<Button leftIcon="upload" rightIcon="arrow_forward">
  Enviar arquivo
</Button>
```

### SHAPE VARIANTS

```tsx
<Button shape="square">Square corners</Button>
<Button shape="rounded">Rounded (default)</Button>
<Button shape="circle">Circle</Button>
<Button shape="pill">Pill (wide)</Button>
```

---

## 📊 BADGE VARIANTS

```tsx
// Status badges
<Badge variant="success">Confirmado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="danger">Cancelado</Badge>
<Badge variant="info">Informação</Badge>
<Badge variant="gold">Popular</Badge>
```

---

## 🃏 CARD VARIANTS

```tsx
// Stats card
<StatsCard icon="payments" label="Faturamento" value="R$ 4.520,00" />

// Resource card
<ResourceCard 
  name="Corte Degradê" 
  description="Corte moderno com degradê"
  price="R$ 35,00"
  duration="30 min"
/>

// List item card
<ListItem 
  title="João Silva"
  subtitle="Corte Degradê"
  time="14:00"
  status="confirmed"
/>
```

---

## ⚡ PERFORMANCE TIPS

---

### QUANDO USAR useMemo
```tsx
// Good: Expensive calculation
const filtered = useMemo(() => data.filter(...), [data, filter]);

// Bad: Simple operation
const doubled = useMemo(() => count * 2, [count]); // Don't do this
```

### QUANDO USAR useCallback
```tsx
// Good: Passing to multiple children
const handleEdit = useCallback((id) => {
  setEditing(id);
}, []);

// Good: Event handler for multiple uses
const handleSubmit = useCallback(() => {
  submit(values);
}, [values]);

// Bad: Local function
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // Don't do this unless passed as prop
```

### QUANDO USAR memo
```tsx
// Good: Component re-renders often with same props
export const ExpensiveComponent = memo(({ data, onSelect }) => {
  return ...
});

// Bad: Component changes often
export const Counter = memo(({ count, onIncrement }) => {
  return <button onClick={onIncrement}>{count}</button>;
});
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

---

### ISSUE: Component not updating

**Problem:** State isn't triggering re-render
```tsx
// Wrong
const [state, setState] = useState({ count: 0 });
state.count = 5; // Won't work!

// Right
const [state, setState] = useState({ count: 0 });
setState({ ...state, count: 5 }); // Works!
```

---

### ISSUE: Inline function causing re-renders

**Problem:** Function reference changes every render
```tsx
// Wrong (re-renders child every time)
<button onClick={() => handleClick(id)}>Click</button>

// Right (stable reference)
<button onClick={() => handleClick(id)}>Click</button>

// Even better (if same id)
const handleSpecificClick = useCallback(() => handleClick(id), [id, handleClick]);
```

---

### ISSUE: Missing dependencies warning

**Problem:** ESLint warning about dependency array
```tsx
// Warning: 'fetchData' should be in dependency array
useEffect(() => {
  fetchData();
}, []);

// Fix
useEffect(() => {
  fetchData();
}, [fetchData]);

// Or if fetchData is stable (defined outside component)
const fetchData = useCallback(() => { ... }, []);
```

---

### ISSUE: Accessibility - keyboard not working

**Problem:** Custom element not keyboard accessible
```tsx
// Wrong (div isn't keyboard interactive)
<div onClick={handleClick}>Click me</div>

// Right
<button onClick={handleClick}>Click me</button>

// Or if must be div (add keyboard support)
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

---

## 📦 CHEATSHEET: TAILWIND CLASSES

---

### COMMON COMBINATIONS

```tsx
// Card base
className="bg-zinc-900 border border-white/10 rounded-2xl p-6"

// Button primary
className="bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl px-6 py-3 active:scale-95"

// Input
className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50"

// Badge
className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"

// Icon button
className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10"

// FAB button
className="w-16 h-16 bg-[#f4c025] text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110"
```

### RESPONSIVE PREFIXES

```tsx
// Mobile first (default, then md: overrides)
className="p-4 md:p-6 lg:p-8"
className="flex-col md:flex-row"
className="text-sm md:text-base lg:text-lg"
```

### STATE CLASSES

```tsx
// Hover
hover:bg-white/10
hover:text-white
hover:scale-105

// Focus
focus:outline-none
focus:ring-2 focus:ring-[#f4c025]/50

// Active
active:scale-95
active:bg-white/20

// Disabled
disabled:opacity-50
disabled:cursor-not-allowed
```

---

## 🔍 DEBUGGING

---

### CHECKLIST PARA DEBUGAR COMPONENT:

- [ ] Props estão sendo passadas corretamente?
- [ ] TypeScript types estão corretos?
- [ ] Hooks dependencies array está completo?
- [ ] Keys em listas são estáveis?
- [ ] Não há side effects em render?
- [ ] State mutations diretas não estão acontecendo?
- [ ] Event handlers têm `e.preventDefault()` se necessário?
- [ ] Assíncrono está sendo tratado com `try/catch`?
- [ ] Cleanup em `useEffect` é necessário?
- [ ] Não há memory leaks?

### REACT DEVTOOLS:

1. **Profiler:** Capturar snapshots de performance
2. **Components:** Ver props e state em tempo real
3. **Settings:** Ativar "Highlight updates when components render"
4. **Redux DevTools (se aplicável):** Tracing de actions

---

## 📚 LEARN MORE

---

### DOCUMENTAÇÃO:
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Material Symbols: https://fonts.google.com/icons

### DESIGN PATTERNS:
- Compound Components: https://kentcdodds.com/blog/compound-components-pattern
- Render Props: https://reactpatterns.com/#render-props
- Higher-Order Components: https://reactpatterns.com/#higher-order-components
- Custom Hooks: https://usehooks.com/

### ACESSIBILIDADE:
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- React Accessibility: https://react.dev/learn/accessibility

---

**Versão:** 1.0  
**Criado em:** 2026-03-03  
**Para uso com:** Component Agents Architecture
