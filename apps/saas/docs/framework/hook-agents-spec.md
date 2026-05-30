# SPECIALIST HOOK AGENTS - Framework Painel Admin
## Sistema de Sub-Agentes para Hooks Customizados

---

## 📋 ÍNDICE

1. [Hook Agents Catalog](#1-hook-agents-catalog)
2. [Hook Patterns Library](#2-hook-patterns-library)
3. [Prompt Examples](#3-prompt-examples)
4. [Development Workflows](#4-development-workflows)

---

# 1. HOOK AGENTS CATALOG

## 🏗️ HOOK ARCHITECT AGENT

### Perfil
Agente especializado em projetar interfaces e APIs de hooks customizados React.

### Skills Especializados
- **React Patterns**: Composition, custom hooks API design, hook contracts
- **TypeScript**: Advanced generics, type inference, type guards
- **State Management paradigms**: Context, reducers, suspense, fetch states
- **API Design**: Input/output contracts, error handling patterns, loading states
- **Performance**: Memoization strategies, dependency array optimization
- **Testing requirements**: What to test, edge cases coverage

### Contexto Requerido
```
{
  "featureRequirement": string,
  "useCase": string,
  "existingPatterns": string[],
  "dataLayer": {
    "apiSpec"?: object,
    "storageType"?: "localStorage" | "sessionStorage" | "memory",
    "asyncOperations"?: boolean
  },
  "uiRequirements": {
    "loadingState"?: boolean,
    "errorHandling"?: boolean,
    "optimisticUpdates"?: boolean,
    "realtime"?: boolean
  }
}
```

### Responsabilidades
- ✅ Definir hook signature (inputs, outputs)
- ✅ Especificar tipos TypeScript com generics apropriados
- ✅ Documentar contrato do hook
- ✅ Identificar dependências e efectos
- ✅ Definir requirements de testing

### Prompt Template

```
You are a React Hook Architect. Design a custom React hook based on the requirements.

## FEATURE REQUIREMENT
{{featureRequirement}}

## USE CASE
{{useCase}}

## EXISTING PATTERNS IN THE CODEBASE
{{existingPatterns}}

## DATA LAYER SPEC
{{dataLayer}}

## UI REQUIREMENTS
{{uiRequirements}}

## YOUR TASK
Design the hook by specifying:

1. **Hook Signature**
   - Hook name: use[FeatureName]
   - Type parameters (generics) if any
   - Input parameters with types
   - Return type/interface

2. **TypeScript Interfaces**
   - Full type definitions
   - Generic constraints
   - Type utilities (Pick, Partial, etc.)

3. **Hook Contract Documentation**
   ```typescript
   /**
    * @summary Brief description
    * @param paramName - Parameter description
    * @returns Return value description
    * @example Usage example
    */
   ```

4. **Implementation Requirements**
   - State variables needed
   - Effects and their dependencies
   - Memoization opportunities
   - Cleanup functions

5. **Testing Requirements**
   - Unit test scenarios required
   - Edge cases to cover
   - Integration considerations

6. **Related Patterns**
   - Which existing hooks compose
   - Which utility functions use

Return the hook specification in a structured markdown format.
```

---

## ⚛️ HOOK GENERATOR AGENT

### Perfil
Agente especializado em implementar hooks React a partir de especificações.

### Skills Especializados
- **React Hooks Mastery**: useState, useEffect, useCallback, useMemo, useRef, useReducer
- **TypeScript Implementation**: Generic types, conditional types, type assertions
- **Code Patterns**: Custom hooks composition, factory patterns, hook chaining
- **Error Handling**: Try/catch patterns, error boundaries, error state management
- **Async Patterns**: Promises, async/await, race conditions, abort controllers
- **Performance**: useMemo for expensive computations, useCallback for callbacks

### Contexto Requerido
```
{
  "hookSpec": {
    "name": string,
    "typeParameters"?: string[],
    "inputs": Parameter[],
    "outputs": Parameter[],
    "interfaces": TypeScriptInterface[]
  },
  "existingHooks": string[],
  "projectStructure": {
    "hooksDirectory": string,
    "utilsDirectory"?: string
  }
}
```

### Responsabilidades
- ✅ Implementar o hook completo com TypeScript
- ✅ Aplicar os patterns definidos no projeto
- ✅ Usar hooks existentes quando apropriado
- ✅ Incluir JSDoc comments completos
- ✅ Follow coding conventions (ESLint, Prettier)

### Prompt Template

```
You are a React Hook Generator. Implement a custom React hook from the specification.

## HOOK SPECIFICATION
{{hookSpec}}

## EXISTING HOOKS IN THE PROJECT
{{existingHooks}}

## PROJECT STRUCTURE
{{projectStructure}}

## CODE CONVENTIONS
- Use TypeScript strict mode
- Use functional components and hooks
- Prefer composition over inheritance
- Export named exports for hooks
- Include comprehensive JSDoc comments

## EXISTING PATTERNS TO FOLLOW

### useLocalStorage Pattern
```typescript
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T): void => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
```

### useDebounce Pattern
```typescript
export const useDebounce = <T>(value: T, delay: number = DEBOUNCE_DELAY): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

## YOUR TASK
Implement the hook following these guidelines:

1. **Implementation Structure**
   - Import required React hooks
   - Import utility functions/constants
   - Define TypeScript interfaces
   - Implement the hook function
   - Export the hook

2. **Type Safety**
   - Use generics where appropriate
   - Ensure type safety throughout
   - Handle type errors gracefully

3. **Error Handling**
   - Try/catch for async operations
   - Error state management
   - User-friendly error messages

4. **Performance**
   - useMemo for expensive computations
   - useCallback for stable function references
   - Proper dependency arrays

5. **Documentation**
   - JSDoc comment describing the hook
   - Parameter descriptions
   - Return type descriptions
   - Usage examples

Return the complete, production-ready hook implementation.
```

---

## ⚡ HOOK OPTIMIZER AGENT

### Perfil
Agente especializado em otimizar performance de hooks React existentes.

### Skills Especializados
- **React Performance**: Re-renders, stale closures, dependency arrays
- **Memoization Strategies**: useMemo, useCallback, React.memo
- **React DevTools Profiler**: Identifying performance bottlenecks
- **Effect Optimization**: Cleanup functions, dependency management
- **Bundle Size**: Tree-shaking, code splitting, lazy loading
- **Memory Leaks**: Event listener cleanup, intervals, subscriptions

### Contexto Requerido
```
{
  "hookCode": string,
  "performanceIssues": string[],
  "metrics": {
    "renderCount"?: number,
    "bundleSizeImpact"?: number,
    "memoryOverhead"?: string
  },
  "requirements": {
    "priority": "critical" | "high" | "medium" | "low",
    "targetMetrics"?: object
  }
}
```

### Responsabilidades
- ✅ Identificar re-renders desnecessários
- ✅ Otimizar useEffect e dependency arrays
- ✅ Aplicar memoização onde apropriado
- ✅ Remover código duplicado
- ✅ Simplificar lógica complexa
- ✅ Sugerir refactors para melhor composição

### Prompt Template

```
You are a React Hook Optimizer. Optimize the given hook for performance.

## HOOK CODE TO OPTIMIZE
```typescript
{{hookCode}}
```

## IDENTIFIED PERFORMANCE ISSUES
{{performanceIssues}}

## PERFORMANCE METRICS
{{metrics}}

## OPTIMIZATION PRIORITY
{{priority}}

## OPTIMIZATION GUIDELINES

### React Performance Best Practices
1. **Minimize Re-renders**
   - Use useMemo for expensive computations
   - Use useCallback for stable function references
   - Split components when necessary

2. **Proper Dependency Arrays**
   - Only include actual dependencies
   - Use useCallback to stabilize references
   - Avoid dependency array anti-patterns

3. **Effect Cleanup**
   - Always return cleanup functions
   - Prevent memory leaks
   - Cancel async operations

4. **Code Splitting**
   - Lazy load heavy dependencies
   - Use dynamic imports when possible
   - Reduce bundle size

### Common Performance Patterns

#### Pattern 1: Memoized Callbacks
```typescript
const handleClick = useCallback((item: T) => {
  onAction?.(item);
}, [onAction]);
```

#### Pattern 2: Memoized Computations
```typescript
const filteredData = useMemo(
  () => data.filter(item => item.active),
  [data]
);
```

#### Pattern 3: Effect with Cleanup
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => controller.abort();
}, [dependency]);
```

## YOUR TASK
Analyze and optimize the hook by:

1. **Performance Analysis**
   - Identify re-render triggers
   - Find expensive computations
   - Detect memory leak risks
   - Spot stale closure issues

2. **Optimization Strategy**
   - Apply memoization where beneficial
   - Fix dependency array issues
   - Optimize async operations
   - Reduce memory overhead

3. **Refactoring Recommendations**
   - Simplify complex logic
   - Extract repeated code
   - Improve hook composition
   - Suggest architectural improvements

4. **Before/After Metrics**
   - Estimated re-render reduction
   - Bundle size impact
   - Memory improvement

Return the optimized hook code with:
- Explanation of each optimization
- Performance metrics comparison
- Additional recommendations
```

---

## 🧪 HOOK TEST GENERATOR AGENT

### Perfil
Agente especializado em gerar testes comprehensive para hooks React.

### Skills Especializados
- **React Testing Library**: renderHook, act, waitFor, waitForElementToBeRemoved
- **Vitest/Jest**: Test runner, assertions, mocking
- **Hook Testing Patterns**: State updates, effects, async operations
- **Testing Scenarios**: Happy path, error cases, edge cases
- **Mocking Strategies**: API mocking, timer mocking, storage mocking
- **Test Coverage**: Branch coverage, statement coverage

### Contexto Requerido
```
{
  "hookSpec": {
    "name": string,
    "signature": string,
    "returns": object
  },
  "implementation": string,
  "testingRequirements": {
    "framework": "vitest" | "jest",
    "coverageTarget": number,
    "scenarios": string[]
  }
}
```

### Responsabilidades
- ✅ Gerar test cases completos
- ✅ Cobrir happy paths
- ✅ Cobrir edge cases
- ✅ Testar error handling
- ✅ Testar async operations
- ✅ Incluir mocks apropriados

### Prompt Template

```
You are a React Hook Test Generator. Generate comprehensive tests for the given hook.

## HOOK SPECIFICATION
{{hookSpec}}

## HOOK IMPLEMENTATION
```typescript
{{implementation}}
```

## TEST CONFIGURATION
```json
{
  "framework": "{{framework}}",
  "coverageTarget": {{coverageTarget}},
  "scenarios": {{scenarios}}
}
```

## TESTING FRAMEWORK SETUP

### React Testing Library
```typescript
// renderHook: Render a hook in a test environment
const { result } = renderHook(() => useHook(params));

// act: Wrap state updates and effects
await act(async () => {
  result.current.setValue(newValue);
});

// rerender: Trigger re-render with new props
const { rerender } = renderHook(({ id }) => useHook(id));
rerender({ id: 2 });

// waitFor: Wait for conditions to be met
await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

### Common Test Patterns

#### Pattern 1: State Update Test
```typescript
it('updates value when setter is called', () => {
  const { result } = renderHook(() => useHook());
  
  act(() => {
    result.current.setValue('new value');
  });
  
  expect(result.current.value).toBe('new value');
});
```

#### Pattern 2: Async Operation Test
```typescript
it('loads data asynchronously', async () => {
  const { result } = renderHook(() => useHook(id));
  
  expect(result.current.isLoading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

#### Pattern 3: Error Handling Test
```typescript
it('handles errors gracefully', async () => {
  const { result } = renderHook(() => useHook());
  
  await act(async () => {
    await result.current.fetchWithError();
  });
  
  expect(result.current.error).toBeDefined();
});
```

#### Pattern 4: Effect Cleanup Test
```typescript
it('cleans up on unmount', () => {
  const cleanup = vi.fn();
  const { unmount } = renderHook(() => useEffectCleanup(cleanup));
  
  unmount();
  
  expect(cleanup).toHaveBeenCalled();
});
```

#### Pattern 5: Timer/Dependency Test
```typescript
it('debounces value changes', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useDebounce('initial', 500));
  
  act(() => {
    result.current.setValue('new');
  });
  
  expect(result.current.debouncedValue).toBe('initial');
  
  act(() => {
    vi.advanceTimersByTime(500);
  });
  
  expect(result.current.debouncedValue).toBe('new');
  
  vi.useRealTimers();
});
```

## YOUR TASK
Generate comprehensive tests including:

1. **Happy Path Tests**
   - Normal use cases
   - Expected behavior
   - Default values

2. **Edge Case Tests**
   - Empty values
   - Null/undefined inputs
   - Boundary conditions
   - Concurrent operations

3. **Error Handling Tests**
   - API errors
   - Network failures
   - Invalid inputs
   - Timeout scenarios

4. **Performance Tests**
   - Debounce/throttle behavior
   - Effect cleanup
   - Memory cleanup

5. **Integration Tests** (if applicable)
   - Compose with other hooks
   - Test with mock data

6. **Test Utilities**
   - Helper functions
   - Mock data factories
   - Custom matchers

Return the test file with:
- All test cases
- Proper setup/teardown
- Clear test descriptions
- Expected vs actual outcomes
```

---

# 2. HOOK PATTERNS LIBRARY

## 🔧 useResource (CRUD Genérico)

### Interface
```typescript
/**
 * Generic CRUD hook for resource management
 * @template T - Resource type
 * @param config - Resource configuration
 * @returns CRUD operations and state
 */
export function useResource<T extends { id: string | number }>(
  config: UseResourceConfig<T>
): UseResourceReturn<T>

interface UseResourceConfig<T> {
  /** API endpoint for the resource */
  endpoint: string;
  /** Initial data for optimistic updates */
  initialData?: T[];
  /** Enable automatic refetching */
  autoRefetch?: boolean;
  /** Fetch interval in ms */
  refetchInterval?: number;
  /** Custom fetch function */
  fetchFn?: () => Promise<T[]>;
}

interface UseResourceReturn<T> {
  /** Data state */
  data: T[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Fetch all resources */
  fetchAll: () => Promise<void>;
  /** Fetch single resource */
  fetchById: (id: string | number) => Promise<T | undefined>;
  /** Create new resource */
  create: (item: Omit<T, 'id'>) => Promise<T>;
  /** Update existing resource */
  update: (id: string | number, updates: Partial<T>) => Promise<T>;
  /** Delete resource */
  delete: (id: string | number) => Promise<void>;
  /** Mutate locally without API call */
  mutate: (updater: (data: T[]) => T[]) => void;
  /** Invalidate cache */
  invalidate: () => void;
}
```

### Requirements
- ✅ Generic type support with id constraint
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Optimistic updates support
- ✅ Loading and error states
- ✅ Cache invalidation
- ✅ Auto-refetching option
- ✅ Batch operations support

### Edge Cases
- Network failure handling
- Concurrent updates
- Optimistic update rollback
- Duplicate requests cancellation
- Empty data handling
- Large dataset pagination

### Implementation Notes
```typescript
// Composes: useLocalStorage for cache, useDebounce for debounced saves
// Pattern: Reducer for state management, abort controller for cancellation
```

---

## 📄 usePagination

### Interface
```typescript
/**
 * Pagination management hook
 * @template T - Item type
 */
export function usePagination<T>(
  config: PaginationConfig<T>
): PaginationReturn<T>

interface PaginationConfig<T> {
  /** Complete data set or fetch function */
  data?: T[];
  /** Fetch function for server-side pagination */
  fetchPage?: (page: number, limit: number) => Promise<T[]>;
  /** Items per page */
  itemsPerPage?: number;
  /** Initial page */
  initialPage?: number;
}

interface PaginationReturn<T> {
  /** Current page data */
  currentPageData: T[];
  /** All data (client-side) */
  allData: T[] | undefined;
  /** Current page number */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Total items */
  totalItems: number;
  /** Loading state */
  isLoading: boolean;
  /** Go to specific page */
  goToPage: (page: number) => Promise<void>;
  /** Go to next page */
  nextPage: () => Promise<void>;
  /** Go to previous page */
  prevPage: () => Promise<void>;
  /** Set items per page */
  setItemsPerPage: (limit: number) => void;
  /** Reset to first page */
  reset: () => void;
}
```

### Requirements
- ✅ Client-side and server-side pagination
- ✅ Page navigation controls
- ✅ Items per page customization
- ✅ Total count calculation
- ✅ Loading states for async fetching
- ✅ Page range validation

### Edge Cases
- Page out of bounds
- Empty dataset
- Server-side filtering conflicts
- Rapid page changes (debounce)
- Large page sizes

### Implementation Notes
```typescript
// Uses useDebounce for rapid page changes
// Validates page boundaries
// Memoizes current page data
```

---

## 🔍 useFilters

### Interface
```typescript
/**
 * Filtering management hook
 * @template T - Item type
 */
export function useFilters<T>(
  config: FiltersConfig<T>
): FiltersReturn<T>

interface FiltersConfig<T> {
  /** Initial values for filters */
  initialFilters?: Record<string, any>;
  /** Filter definitions */
  filters: FilterDefinition<T>[];
  /** Enable debounce for filter changes */
  debounceMs?: number;
}

interface FilterDefinition<T> {
  /** Filter key */
  key: keyof T | string;
  /** Filter type */
  type: 'text' | 'select' | 'multiselect' | 'range' | 'date' | 'boolean';
  /** Label for UI */
  label: string;
  /** Options for select/multiselect */
  options?: Array<{ value: any; label: string }>;
  /** Default value */
  defaultValue?: any;
}

interface FiltersReturn<T> {
  /** Current filter values */
  filters: Record<string, any>;
  /** Update filter value */
  setFilter: (key: string, value: any) => void;
  /** Reset all filters */
  resetFilters: () => void;
  /** Clear specific filter */
  clearFilter: (key: string) => void;
  /** Apply filters to data */
  applyFilters: (data: T[]) => T[];
  /** Check if any filters are active */
  hasActiveFilters: boolean;
  /** Active filter count */
  activeFilterCount: number;
}
```

### Requirements
- ✅ Multi-filter support
- ✅ Multiple filter types (text, select, range, date, boolean)
- ✅ Debounced filter application
- ✅ Filter reset functionality
- ✅ Active filter state tracking
- ✅ Custom filter functions support

### Edge Cases
- Special characters in text filters
- Null/undefined values in data
- Empty filter values
- Date format compatibility
- Case sensitivity options

### Implementation Notes
```typescript
// Composes: useDebounce for debounced filtering
// Pattern: Curried filters for composition
// Memoization for filtered results
```

---

## 💬 useDialog

### Interface
```typescript
/**
 * Dialog/modal management hook
 */
export function useDialog<T = void>(
  config?: DialogConfig<T>
): UseDialogReturn<T>

interface DialogConfig<T> {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Callback on close with data */
  onClose?: (data?: T) => void;
  /** Callback on open */
  onOpen?: () => void;
  /** Confirm before close */
  confirmClose?: boolean | (() => boolean);
}

interface UseDialogReturn<T> {
  /** Dialog open state */
  isOpen: boolean;
  /** Open dialog */
  open: () => void;
  /** Close dialog */
  close: (data?: T) => void;
  /** Toggle dialog */
  toggle: () => void;
  /** Handle confirmed close */
  closeWithConfirm: () => Promise<void>;
  /** Dialog props for component */
  dialogProps: {
    open: boolean;
    onClose: () => void;
  };
}
```

### Requirements
- ✅ Open/close/toggle functionality
- ✅ Confirmation before close
- ✅ Data return on close
- ✅ Lifecycle callbacks
- ✅ Keyboard (ESC) support
- ✅ Click outside support

### Edge Cases
- Rapid open/close
- Close with unsaved changes
- Nested dialogs
- Dialog open during unmount
- Animation timing issues

### Implementation Notes
```typescript
// Uses useConfirm for close confirmation
// Pattern: Compound component props
// Event cleanup on unmount
```

---

## 🔔 useToast

### Interface
```typescript
/**
 * Toast notification management hook
 */
export function useToast(): UseToastReturn

interface Toast {
  /** Toast ID */
  id: string;
  /** Message content */
  message: React.ReactNode;
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Auto-dismiss duration */
  duration?: number;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UseToastReturn {
  /** Current toasts */
  toasts: Toast[];
  /** Show success toast */
  success: (message: string, duration?: number) => void;
  /** Show error toast */
  error: (message: string, duration?: number) => void;
  /** Show warning toast */
  warning: (message: string, duration?: number) => void;
  /** Show info toast */
  info: (message: string, duration?: number) => void;
  /** Show custom toast */
  toast: (toast: Omit<Toast, 'id'>) => void;
  /** Dismiss toast by ID */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

interface UseToastConfig {
  /** Default duration */
  defaultDuration?: number;
  /** Maximum toasts visible */
  maxToasts?: number;
  /** Stack direction */
  direction?: 'vertical' | 'horizontal';
}
```

### Requirements
- ✅ Multiple toast types (success, error, warning, info)
- ✅ Auto-dismiss with configurable duration
- ✅ Manual dismiss support
- ✅ Action button support
- ✅ Maximum toasts limit
- ✅ Non-blocking notifications

### Edge Cases
- Rapid toast creation
- Custom React content in messages
- Long messages truncation
- Toast queue management
- Visibility during page navigation

### Implementation Notes
```typescript
// Uses useEffect cleanup for auto-dismiss
// Pattern: FIFO or LIFO queue
// Memo stability for callbacks
```

---

## ✅ useConfirm

### Interface
```typescript
/**
 * Confirmation dialog hook
 * @template T - Return data type
 */
export function useConfirm<T = boolean>(
  config?: ConfirmConfig
): UseConfirmReturn<T>

interface ConfirmConfig {
  /** Default message */
  message?: string;
  /** Default confirmation button text */
  confirmText?: string;
  /** Default cancel button text */
  cancelText?: string;
  /** Default destructive action */
  destructive?: boolean;
}

interface ConfirmOptions {
  /** Confirmation message */
  message?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Destructive action (red button) */
  destructive?: boolean;
}

interface UseConfirmReturn<T> {
  /** Show confirmation dialog */
  confirm: (options?: ConfirmOptions) => Promise<T>;
  /** Dialog state */
  isOpen: boolean;
  /** Current options */
  options: ConfirmOptions | null;
  /** Handle confirm */
  handleConfirm: (data?: T) => void;
  /** Handle cancel */
  handleCancel: () => void;
}

// Usage example: Async confirmation
const { confirm } = useConfirm();

const handleDelete = async (id: string) => {
  const shouldDelete = await confirm({
    message: 'Tem certeza que deseja excluir?',
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
    destructive: true
  });
  
  if (shouldDelete) {
    await deleteItem(id);
  }
};
```

### Requirements
- ✅ Promise-based API
- ✅ Customizable messages and buttons
- ✅ Destructive action styling
- ✅ Return data support
- ✅ Keyboard support (Enter/Escape)

### Edge Cases
- Confirm during unmount
- Multiple concurrent confirms
- Promise rejection handling
- Custom return data types

### Implementation Notes
```typescript
// Pattern: Promise with external resolution
// Composition: useDialog for dialog management
```

---

## ⬇️ useScrollToBottom

### Interface
```typescript
/**
 * Scroll to bottom hook for chat/feeds
 * @template TRef - Reference element type
 */
export function useScrollToBottom<TRef extends HTMLElement>(
  config?: ScrollToBottomConfig
): UseScrollToBottomReturn<TRef>

interface ScrollToBottomConfig {
  /** Auto-scroll on data change */
  autoScroll?: boolean;
  /** Threshold for "near bottom" [0-1] */
  threshold?: number;
  /** Smooth scroll */
  smooth?: boolean;
  /** Debounce scroll events */
  debounceMs?: number;
}

interface UseScrollToBottomReturn<TRef> {
  /** Target element ref */
  ref: RefObject<TRef>;
  /** Scroll to bottom */
  scrollToBottom: (smooth?: boolean) => void;
  /** Check if near bottom */
  isNearBottom: boolean;
  /** Whether user is at bottom */
  isAtBottom: boolean;
}

// Use with chat messages
const messages = useMessages();
const { ref, scrollToBottom, isNearBottom } = useScrollToBottom();

useEffect(() => {
  if (isNearBottom) {
    scrollToBottom();
  }
}, [messages.data]);
```

### Requirements
- ✅ Auto-scroll on new content
- ✅ Smart scroll (only if near bottom)
- ✅ Smooth/instance scroll options
- ✅ Near-bottom detection
- ✅ Performance optimized (debounce)

### Edge Cases
- Rapid content updates
- User scrolling while new items arrive
- Empty container
- Dynamic container size

### Implementation Notes
```typescript
// Uses useDebounce for scroll events
// Intersection Observer for bottom detection
// RequestAnimationFrame for smooth scroll
```

---

## 🔄 useToggle

### Interface
```typescript
/**
 * Simple boolean toggle hook
 */
export function useToggle(
  defaultValue: boolean = false
): UseToggleReturn

interface UseToggleReturn {
  /** Current value */
  value: boolean;
  /** Set value */
  set: (value: boolean) => void;
  /** Toggle value */
  toggle: () => void;
  /** Set to true */
  setTrue: () => void;
  /** Set to false */
  setFalse: () => void;
}

// Usage examples
const [isOpen, setIsOpen, toggle] = useToggle();
const [isLoading, , toggleLoading] = useToggle(false);
```

### Requirements
- ✅ Simple boolean state
- ✅ Toggle, set, setTrue, setFalse helpers
- ✅ Lightweight (no effect needed)

### Edge Cases
- None (simple implementation)

### Implementation Notes
```typescript
// Pattern: Utility hook with helper functions
// No side effects (pure state)
```

---

# 3. PROMPT EXAMPLES

## Example 1: Hook Architect - Designing useResource

```markdown
You are a React Hook Architect. Design a custom React hook based on the requirements.

## FEATURE REQUIREMENT
We need a generic CRUD hook for managing resources in our application. This hook should replace multiple similar hooks (useServices, useAppointments, etc.) and provide a consistent API for Create, Read, Update, Delete operations.

## USE CASE
The hook will be used across multiple features:
- Services management
- Appointments CRUD
- Staff management
- Customer records

Each feature has similar requirements:
- Fetch all items
- Create new item
- Update existing item
- Delete item
- Optimistic UI updates
- Loading and error states

## EXISTING PATTERNS IN THE CODEBASE

### useServices Pattern
```typescript
export const useServices = () => {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  return { services, setServices };
};
```

### useAppointments Pattern
```typescript
export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  return { appointments, setAppointments };
};
```

### useLocalStorage Pattern (for caching)
```typescript
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  // ... implementation
};
```

## DATA LAYER SPEC
```json
{
  "storageType": "localStorage",
  "asyncOperations": true,
  "optimisticUpdates": true,
  "cacheStrategy": "write-back"
}
```

## UI REQUIREMENTS
```json
{
  "loadingState": true,
  "errorHandling": true,
  "optimisticUpdates": true,
  "realtime": false
}
```

## YOUR TASK
Design the hook by specifying:

1. **Hook Signature**
   - Hook name: useResource
   - Type parameters (generics) if any
   - Input parameters with types
   - Return type/interface

2. **TypeScript Interfaces**
   - Full type definitions
   - Generic constraints
   - Type utilities (Pick, Partial, etc.)

3. **Hook Contract Documentation**
   ```typescript
   /**
    * @summary Brief description
    * @param paramName - Parameter description
    * @returns Return value description
    * @example Usage example
    */
   ```

4. **Implementation Requirements**
   - State variables needed
   - Effects and their dependencies
   - Memoization opportunities
   - Cleanup functions

5. **Testing Requirements**
   - Unit test scenarios required
   - Edge cases to cover
   - Integration considerations

6. **Related Patterns**
   - Which existing hooks compose
   - Which utility functions use

Return the hook specification in a structured markdown format.
```

**Expected Output:**

```markdown
# useResource Hook Specification

## 1. Hook Signature

```typescript
export function useResource<T extends { id: string | number }>(
  config: UseResourceConfig<T>
): UseResourceReturn<T>
```

## 2. TypeScript Interfaces

```typescript
/**
 * Configuration for the useResource hook
 */
interface UseResourceConfig<T> {
  /** API endpoint for the resource */
  endpoint: string;
  /** Initial data for optimistic updates */
  initialData?: T[];
  /** Storage key for caching (optional) */
  storageKey?: string;
  /** Enable automatic refetching */
  autoRefetch?: boolean;
  /** Fetch interval in ms */
  refetchInterval?: number;
  /** Custom fetch function */
  fetchFn?: () => Promise<T[]>;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Return value of useResource hook
 */
interface UseResourceReturn<T, P = Partial<T>> {
  /** Data state */
  data: T[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch cached data flag */
  isValidating: boolean;
  
  /** CRUD Operations */
  /** Fetch all resources */
  fetchAll: () => Promise<void>;
  /** Fetch single resource by ID */
  fetchById: (id: string | number) => Promise<T | undefined>;
  /** Create new resource */
  create: (item: Omit<T, 'id'>) => Promise<T>;
  /** Update existing resource */
  update: (id: string | number, updates: P) => Promise<T>;
  /** Delete resource */
  delete: (id: string | number) => Promise<void>;
  
  /** Cache Operations */
  /** Mutate locally without API call */
  mutate: (updater: (data: T[]) => T[]) => void;
  /** Invalidate and refetch cache */
  invalidate: () => void;
  /** Clear all data */
  clear: () => void;
}
```

## 3. Hook Contract Documentation

```typescript
/**
 * Generic CRUD hook for resource management with optimistic updates and caching
 * 
 * @template T - Resource type, must have an id property
 * @template P - Partial update type (defaults to Partial<T>)
 * 
 * @param config - Configuration object
 * @param config.endpoint - API endpoint for the resource
 * @param config.initialData - Initial data to pre-populate state
 * @param config.storageKey - LocalStorage key for caching (optional)
 * @param config.autoRefetch - Automatically refetch on interval (default: false)
 * @param config.refetchInterval - Refetch interval in ms (default: 0)
 * @param config.fetchFn - Custom fetch function (default: uses fetch API)
 * @param config.debug - Enable debug logging (default: false)
 * 
 * @returns Object containing data and CRUD operations
 * 
 * @example
 * ```tsx
 * // Basic usage for services
 * const services = useResource<Service>({
 *   endpoint: '/api/services',
 *   storageKey: 'services-cache',
 * });
 * 
 * services.fetchAll();
 * await services.create({ name: 'Haircut', price: 30 });
 * await services.update('1', { price: 35 });
 * await services.delete('1');
 * ```
 * 
 * @example
 * ```tsx
 * // Optimistic mutation
 * const { data, isLoading, error } = services;
 * services.mutate(prev => [...prev, newService]);
 * ```
 */
```

## 4. Implementation Requirements

### State Variables
```typescript
- data: T[] - Resource list
- isLoading: boolean - Loading state
- error: Error | null - Error state
- isValidating: boolean - Refetching state
- abortController: AbortController - Request cancellation
```

### Effects and Dependencies
```typescript
- Initial fetch: triggers on mount, depends on [config.endpoint]
- Cache persistence: runs when data changes, to localStorage
- Auto-refetch: interval effect if autoRefetch=true, cleanup on unmount
```

### Memoization Opportunities
```typescript
- Memoize CRUD functions: create, update, delete (useCallback)
- Memoize data access: filtered by ID, sorted
```

### Cleanup Functions
```typescript
- Abort ongoing fetch requests on unmount
- Clear refetch intervals
- Remove event listeners if any
```

## 5. Testing Requirements

### Unit Test Scenarios
1. **Fetch Operations**
   - fetchAll() successfully loads data
   - fetchAll() handles error and sets error state
   - fetchById() finds correct item
   - fetchById() returns undefined for non-existent ID

2. **Create Operations**
   - create() adds new item
   - create() throws error on failure
   - create() validates required fields

3. **Update Operations**
   - update() modifies correct item
   - update() handles non-existent ID
   - update() merges partial