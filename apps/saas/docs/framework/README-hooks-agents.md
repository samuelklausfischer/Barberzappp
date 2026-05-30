# 📚 Hook Agents Framework - Quick Reference

## 🎯 Overview
Sistema de sub-agentes especializados para criar, otimizar e testar hooks React customizados no BarberZap Pro.

---

## 🏗️ AGENTES (Hook Agents Catalog)

### 1. Hook Architect Agent
**Função:** Projetar interfaces e APIs de hooks

**Skills:**
- React patterns & custom hooks API design
- TypeScript (generics, conditional types)
- State management (useState, useReducer, Context)
- API design (contracts, error handling, loading states)
- Performance (memoization, dependency arrays)
- Testing requirements definition

**Responsabilidades:**
- ✅ Definir hook signature (inputs/outputs)
- ✅ Especificar tipos TypeScript com generics
- ✅ Documentar contrato do hook
- ✅ Identificar dependências e effects
- ✅ Definir requirements de testing

---

### 2. Hook Generator Agent
**Função:** Implementar hooks React a partir de especificações

**Skills:**
- React Hooks mastery (useState, useEffect, useCallback, useMemo, useReducer)
- TypeScript implementation (generics, type guards, utility types)
- Code patterns (composition, factory, async patterns)
- Error handling (try/catch, error states, recovery)
- Async patterns (promises, async/await, abort controllers)
- Performance (useMemo, useCallback, dependency arrays)

**Responsabilidades:**
- ✅ Implementar hook completo com TypeScript
- ✅ Aplicar patterns do projeto
- ✅ Usar hooks existentes quando apropriado
- ✅ Incluir JSDoc comments completos
- ✅ Follow conventions (ESLint, Prettier)

---

### 3. Hook Optimizer Agent
**Função:** Otimizar performance de hooks existentes

**Skills:**
- React performance (re-renders, stale closures, dependency arrays)
- Memoization strategies (useMemo, useCallback, React.memo)
- React DevTools Profiler
- Effect optimization (cleanup, dependency management)
- Bundle size (tree-shaking, code splitting)
- Memory leaks (event listeners, intervals, subscriptions)

**Responsabilidades:**
- ✅ Identificar re-renders desnecessários
- ✅ Otimizar useEffect e dependency arrays
- ✅ Aplicar memoização onde apropriado
- ✅ Remover código duplicado
- ✅ Simplificar lógica complexa

---

### 4. Hook Test Generator Agent
**Função:** Gerar testes comprehensive para hooks React

**Skills:**
- React Testing Library (renderHook, act, waitFor)
- Vitest/Jest (runner, assertions, mocking)
- Hook testing patterns (state updates, effects, async)
- Testing scenarios (happy path, errors, edge cases)
- Mocking strategies (API, timers, storage)
- Test coverage (branch, statement)

**Responsabilidades:**
- ✅ Gerar test cases completos
- ✅ Cobrir happy paths
- ✅ Cobrir edge cases
- ✅ Testar error handling
- ✅ Testar async operations

---

## 🔧 PATTERNS (Hook Patterns Library)

### 1. useResource (CRUD Genérico)
**Função:** Gerenciar recursos com operações CRUD

**Interface:**
```typescript
useResource<T extends { id: string | number }>(config: UseResourceConfig<T>): UseResourceReturn<T>

// Methods: fetchAll, fetchById, create, update, delete, mutate, invalidate, clear
// State: data, isLoading, error, isValidating
```

**Features:**
- ✅ CRUD operations
- ✅ Optimistic updates
- ✅ LocalStorage caching
- ✅ Auto-refetching
- ✅ Request deduplication

---

### 2. usePagination
**Função:** Gerenciar paginação de dados

**Interface:**
```typescript
usePagination<T>(config: PaginationConfig<T>): PaginationReturn<T>

// Methods: goToPage, nextPage, prevPage, firstPage, lastPage, setItemsPerPage, reset
// State: currentPageData, currentPage, totalPages, totalItems, isLoading
```

**Features:**
- ✅ Client-side e server-side
- ✅ Navegação completa
- ✅ Loading states
- ✅ Validção de bounds

---

### 3. useFilters
**Função:** Gerenciar filtros multi-critério

**Interface:**
```typescript
useFilters<T>(config: FiltersConfig<T>): FiltersReturn<T>

// Types: text, select, multiselect, range, date, boolean
// Methods: setFilter, setFilters, resetFilters, clearFilter, applyFilters
// State: filters, hasActiveFilters, activeFilterCount
```

**Features:**
- ✅ Múltiplos tipos de filtro
- ✅ Debounce automático
- ✅ Funções customizadas

---

### 4. useDialog
**Função:** Gerenciar modais/dialogs

**Interface:**
```typescript
useDialog<T = void>(config?: DialogConfig<T>): UseDialogReturn<T>

// Methods: open, close, toggle, closeWithConfirm
// State: isOpen
// Props: dialogProps para componente
```

**Features:**
- ✅ Open/close/toggle
- ✅ Confirmação antes fechar
- ✅ Retorno de dados
- ✅ Keyboard (ESC) support

---

### 5. useToast
**Função:** Exibir notificações

**Interface:**
```typescript
useToast(): UseToastReturn

// Methods: success, error, warning, info, toast, dismiss, dismissAll
// State: toasts array
// Types: success, error, warning, info
```

**Features:**
- ✅ Múltiplos tipos
- ✅ Auto-dismiss
- ✅ Action buttons
- ✅ Max toasts limit

---

### 6. useConfirm
**Função:** Diálogo de confirmação

**Interface:**
```typescript
useConfirm<T = boolean>(config?: ConfirmConfig): UseConfirmReturn<T>

// Methods: confirm(options?) - Promise<T>
// State: isOpen, options
```

**Features:**
- ✅ Promise-based API
- ✅ Custom mensajes
- ✅ Destructive styling
- ✅ Return data

---

### 7. useScrollToBottom
**Função:** Auto-scroll em chats/feeds

**Interface:**
```typescript
useScrollToBottom<TRef extends HTMLElement>(config?: ScrollToBottomConfig): UseScrollToBottomReturn<TRef>

// Methods: scrollToBottom(smooth?)
// State: ref, isNearBottom, isAtBottom
```

**Features:**
- ✅ Auto-scroll inteligente
- ✅ Near-bottom detection
- ✅ Smooth scroll
- ✅ Performance otimizado

---

### 8. useToggle
**Função:** Toggle state simples

**Interface:**
```typescript
useToggle(defaultValue?: boolean): UseToggleReturn

// Methods: set(value), toggle(), setTrue(), setFalse()
// State: value
```

**Features:**
- ✅ Simples e leve
- ✅ Helpers convenientes
- ✅ Sem efeitos colaterais

---

## 🚀 WORKFLOWS

### Workflow 1: Novo Hook
```
Requirements → Architect (Design) → Generator (Implement) → 
Optimizer (Refine) → Test Generator (Test) → Review → Deploy
```

**Tempo estimado:**
- Simples: 2-4h
- Médio: 4-8h
- Complexo: 8-16h

---

### Workflow 2: Refactor
```
Analysis → Optimizer (Fix) → Architect (Validate) → 
Test Generator (Update) → Verify → Deploy
```

**Tempo estimado:**
- Simples: 1-2h
- Médio: 2-4h
- Completo: 4-8h

---

### Workflow 3: Bug Fix
```
Bug Report → Architect (Analyze) → Generator (Fix) → 
Test Generator (Test) → Optimizer (Check) → Deploy
```

**Tempo estimado:**
- Crítico: 1-2h
- Padrão: 2-4h
- Complexo: 4-8h

---

### Workflow 4: Migração para useResource
```
Assessment → Architect (Plan) → Generator (Implement) → 
Test Generator (Test) → Migrate Components → Verify → Clean up
```

**Tempo estimado:**
- Single feature: 2-4h
- All features: 1-2 dias

---

## 📊 QUALITY GATES

| Gate | Requirements |
|------|-------------|
| **1. architect Specs** | Complete JSDoc, TypeScript, test requirements |
| **2. generator Code** | Compiles, strict mode, error handling |
| **3. optimizer Analysis** | Performance ok, no leaks, cleanup |
| **4. test Coverage** | ≥90% coverage, all passing |
| **5. Final Review** | Peer review, docs, changelog |

---

## 📈 METRICS

### Development
- Hooks created: {count}
- Avg dev time: {hours}
- Code reusability: {percent}%

### Quality
- Test coverage: ≥90%
- Bug rate: <1/100
- Type safety: A grade

### Performance
- Render reduction: ≥80%
- Memory leaks: 0
- Bundle impact: minimal

---

## 📖 Documentos Detalhados

1. **`hook-agents-spec.md`** - Especificação inicial dos agentes
2. **`hook-agents-complete.md`** - Agentes + Patterns (Parte 1)
3. **`hook-agents-complete-2.md`** - Patterns + Workflows + Prompts (Parte 2)

---

## ✅ STATUS

| Item | Status |
|------|--------|
| Hook Agents Catalog | ✅ Completo |
| Hook Patterns Library | ✅ Completo (8 patterns) |
| Prompt Examples | ✅ Completo (3 prompts) |
| Development Workflows | ✅ Completo (4 workflows) |
| Quality Gates | ✅ Definido |
| Success Metrics | ✅ Definido |

---

**Status do Framework:** ✅ PRONTO PARA IMPLEMENTAÇÃO
