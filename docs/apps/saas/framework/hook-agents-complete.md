# SPECIALIST HOOK AGENTS - Framework Painel Admin (COMPLETO)
## Sistema de Sub-Agentes para Hooks Customizados

---

# 1. HOOK AGENTS CATALOG (COMPLETO)

## 🏗️ HOOK ARCHITECT AGENT

### Skills Especializados
| Categoria | Skills |
|-----------|--------|
| **React Patterns** | Composition pattern, custom hooks API design, hook contracts, state reduction, effect scheduling |
| **TypeScript** | Advanced generics with constraints, conditional types, type inference, type guards, utility types (Pick, Partial, Omit, Exclude) |
| **State Management** | useState, useReducer, Context API, Zustand patterns, async states, fetch states |
| **API Design** | Input/output contracts, error handling patterns, loading states, optimistic updates, cache strategies |
| **Performance** | Memoization strategies, dependency array optimization, re-render prevention, stale closure prevention |
| **Best Practices** | SOLID principles for hooks, single responsibility, testability patterns |

### Prompt Template Completo

```markdown
You are a React Hook Architect. Design a custom React hook based on the requirements.

## FEATURE REQUIREMENT
{{featureRequirement}}

## USE CASE
{{useCase}}

## EXISTING PATTERNS IN THE CODEBASE
{{existingPatterns}}

## CODEBASE CONTEXT
```
Project: BarberZap Pro (Vite + React 19 + TypeScript)
Current hooks:
- useLocalStorage: Persistence with error handling
- useDebounce: Delayed value updates
- useMediaQuery: Responsive queries
- useAuth: Simple auth state
- useServices: Feature-specific data
- useAppointments: Feature-specific data
- useAIChat: Chat state with async operations

Architecture:
- Feature-based folder structure
- Mock data in features
- TypeScript strict mode
- No external state library yet
```

## DATA LAYER SPEC
{{dataLayer}}

## UI REQUIREMENTS
{{uiRequirements}}

## DESIGN CONSTRAINTS
- Use TypeScript strict mode
- Follow existing pattern conventions
- Ensure type safety with generics
- Support SSR readiness (no window global without check)
- Provide JSDoc documentation
- Return stable references (useCallback/useMemo)

## YOUR TASK
Design the hook by specifying:

### 1. Hook Signature
```typescript
export function use{{FeatureName}}<{{Generics}}>(
  inputs: InputParameters
): ReturnInterface
```

### 2. TypeScript Interfaces (Complete)
```typescript
// Input interfaces
interface Use{{FeatureName}}Config {
  // Configuration options
}

// Output interfaces
interface Use{{FeatureName}}Return {
  // Return values
}
```

### 3. Hook Contract Documentation (JSDoc)
```typescript
/**
 * @summary One-line description
 * @description Detailed multi-line description
 * 
 * @template T - Generic parameter description
 * @param paramName - Parameter description
 * @returns Return value description
 * 
 * @example
 * ```tsx
 * const hook = use{{FeatureName}}({ option: value });
 * ```
 * 
 * @see Related hooks or utilities
 */
```

### 4. Implementation Requirements
- **State Variables**: List all state needed with types
- **Effects**: Describe all useEffect hooks with dependencies
- **Cleanup**: What needs cleanup on unmount
- **Memoization**: Where to useMemo/useCallback
- **Composition**: Which existing hooks to use (useLocalStorage, useDebounce, etc.)

### 5. Testing Requirements
List test scenarios:
- ✅ Happy paths
- ⚠️ Edge cases
- ❌ Error cases

### 6. Related Patterns
- Compose: useLocalStorage, useDebounce, useMediaQuery
- Extend: none
- Similar to: [existing hook]

Return a complete specification in structured markdown.
```

---

## ⚛️ HOOK GENERATOR AGENT

### Skills Especializados
| Categoria | Skills |
|-----------|--------|
| **React Hooks** | useState, useEffect, useRef, useCallback, useMemo, useReducer, useLayoutEffect, useTransition, useDeferredValue |
| **TypeScript** | Generic constraints, conditional types, mapped types, utility types, type assertions, type guards |
| **Code Patterns** | Custom hooks composition, factory pattern, hook chaining, state machines with useReducer, async patterns |
| **Error Handling** | Try/catch patterns, error boundaries integration, error state recovery, user-friendly messages |
| **Async Patterns** | Promises, async/await, race conditions, abort controllers, request cancellation, loading states |
| **Performance** | useMemo for expensive computations, useCallback for callbacks, memoization strategies |
| **Testing Ready** | Testable hooks, separation of concerns, easy mocking |

### Prompt Template Completo

```markdown
You are a React Hook Generator. Implement a custom React hook from the specification.

## HOOK SPECIFICATION
{{hookSpec}}

## PROJECT CONTEXT
```typescript
// Project: BarberZap Pro
// Stack: Vite + React 19 + TypeScript 5.8
// Patterns: Functional hooks, no classes, strict TypeScript

// File location: src/hooks/use{{FeatureName}}.ts
```

## EXISTING HOOKS TO COMPOSE

### useLocalStorage (Persistence)
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

### useDebounce (Delayed Updates)
```typescript
export const useDebounce = <T>(value: T, delay: number = DEBOUNCE_DELAY): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

### useMediaQuery (Responsive)
```typescript
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};
```

### useAuth (Auth State)
```typescript
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(saved === 'true');
    setLoading(false);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
  };
};
```

## CODE CONVENTIONS
```typescript
// 1. Imports: React hooks first, then utilities, then types
import { useState, useEffect, useCallback, useMemo } from 'react';

// 2. Type definitions before hook
interface Use{{FeatureName}}Config {
  // ...
}

interface Use{{FeatureName}}Return {
  // ...
}

// 3. Hook implementation
export function use{{FeatureName}}<{{Generics}}>(
  config: Use{{FeatureName}}Config<{{Generics}}>
): Use{{FeatureName}}Return<{{Generics}}> {
  // Implementation
}

// 4. Helper functions below (if any)
```

## IMPLEMENTATION REQUIREMENTS

### Error Handling Pattern
```typescript
try {
  // Operation
} catch (error) {
  console.error('[use{{FeatureName}}] Error:', error);
  setError(error instanceof Error ? error : new Error(String(error)));
} finally {
  // Cleanup
}
```

### Cleanup Pattern
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  // Async operation with signal
  
  return () => controller.abort();
}, [deps]);
```

### Loading State Pattern
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

const loadData = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    // Fetch
  } catch (err) {
    setError(err as Error);
  } finally {
    setIsLoading(false);
  }
}, [deps]);
```

### Memoization Pattern
```typescript
const memoizedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);

const stableCallback = useCallback(
  (param: T) => {
    actions(param);
  },
  [deps]
);
```

## YOUR TASK
Implement the complete, production-ready hook:

1. **File Structure**
   - Proper imports
   - Type definitions
   - Hook export
   - Helper functions (if any)

2. **Type Safety**
   - Generics with constraints
   - Proper typing throughout
   - Type guards where needed

3. **Error Handling**
   - Try/catch for async operations
   - Error state management
   - Error recovery mechanisms

4. **Performance**
   - useMemo for expensive operations
   - useCallback for callbacks
   - Proper dependency arrays

5. **Documentation**
   - Comprehensive JSDoc
   - Parameter descriptions
   - Return type documentation
   - Usage examples

6. **Composition**
   - Use existing hooks where appropriate
   - Compose rather than reimplement
   - Follow established patterns

Return the complete hook implementation with:
- Full TypeScript code
- JSDoc comments
- Usage examples
```

---

## ⚡ HOOK OPTIMIZER AGENT

### Skills Especializados
| Categoria | Skills |
|-----------|--------|
| **React Performance** | Re-render analysis, stale closure detection, dependency array anti-patterns, render bail-out |
| **Memoization** | useMemo, useCallback, React.memo, selector patterns, deep comparison memoization |
| **Effect Optimization** | Cleanup functions, dependency management, effect ordering, request cancellation |
| **Bundle Size** | Tree-shaking, code splitting, dynamic imports, lazy loading |
| **Memory Leaks** | Event listener cleanup, interval/timeout cleanup, subscription cleanup, abort controllers |
| **Profiling** | React DevTools Profiler, performance marking, benchmarking, bottleneck identification |

### Prompt Template Completo

```markdown
You are a React Hook Optimizer. Optimize the given hook for performance.

## HOOK CODE TO OPTIMIZE
```typescript
{{hookCode}}
```

## PERFORMANCE ISSUES IDENTIFIED
{{performanceIssues}}

## METRICS
{{metrics}}

## OPTIMIZATION PRIORITY: {{priority}}

## PERFORMANCE ANTIPATTERNS TO FIX

### Antipattern 1: Function Recreation
```typescript
// BAD: Function recreated every render
const { data } = useResource();
const handleClick = () => {
  processData(data); // New function reference each render
};

// GOOD: Stabilized with useCallback
const handleClick = useCallback(() => {
  processData(data);
}, [data]);
```

### Antipattern 2: Unnecessary Re-renders
```typescript
// BAD: Triggers child re-renders
const handleUpdate = () => {
  setObj({ ...obj, value: newValue }); // New object reference
};

// GOOD: Update only what needed
const handleUpdate = () => {
  setValue(newValue); // Separate state for frequent updates
};
```

### Antipattern 3: Incorrect Dependencies
```typescript
// BAD: Missing dependency
useEffect(() => {
  fetchData(userId);
}, []); // Should include userId

// GOOD: All dependencies included
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Antipattern 4: Missing Cleanup
```typescript
// BAD: Memory leak
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// GOOD: Cleanup on unmount
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Antipattern 5: Runaway Effects
```typescript
// BAD: Effect triggers itself
useEffect(() => {
  setValue(value + 1);
}, [value]);

// GOOD: Proper effect structure
useEffect(() => {
  if (someCondition) {
    setValue(value + 1);
  }
}, [someCondition]);
```

## OPTIMIZATION TECHNIQUES

### 1. Memoization Strategy
```typescript
// For expensive computations
const result = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// For stable callbacks
const callback = useCallback(() => {
  action(params);
}, [action, params]);
```

### 2. Dependency Array Management
```typescript
// Use refs for non-reactive values
const latestConfig = useRef(config);
useEffect(() => {
  latestConfig.current = config;
}, [config]);

const callback = useCallback(() => {
  processWith(latestConfig.current);
}, []);
```

### 3. Effect Debouncing
```typescript
// Debounce rapid updates
useEffect(() => {
  const timer = setTimeout(() => {
    debouncedAction(value);
  }, 300);
  return () => clearTimeout(timer);
}, [value]);
```

### 4. Request Cancellation
```typescript
// Cancel pending requests
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, [id]);
```

### 5. State Optimization
```typescript
// Split state to minimize updates
const [items, setItems] = useState<T[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);

// Instead of one large object
const [state, setState] = useState({
  items: [],
  selectedId: null as string | null
});
```

## YOUR TASK

### Step 1: Performance Analysis
- Identify re-render causes
- Find expensive computations
- Detect memory leak risks
- Spot stale closure issues

### Step 2: Apply Optimizations
1. Memoize expensive computations with useMemo
2. Stabilize callbacks with useCallback
3. Fix dependency arrays
4. Add proper cleanup
5. Split state for granular updates

### Step 3: Code Refactoring
- Simplify complex logic
- Extract repeated code
- Improve hook composition
- Suggest architectural improvements

### Step 4: Metrics Report
Provide:
- Estimated re-render reduction: X%
- Bundle size impact: +/-Y bytes
- Memory improvement: Z%
- Performance score: A/B/C/D

## RETURN FORMAT

```typescript
// OPTIMIZED CODE
// =================
[Code here]

// OPTIMIZATION CHANGES
// ====================
1. Added useMemo for [computation]
2. Wrapped callbacks in useCallback
3. Fixed dependency array: added [deps]
4. Added cleanup: [cleanup logic]
5. Split state: [state changes]

// BEFORE/AFTER ANALYSIS
// ====================
- Re-renders: from X to Y (-Z%)
- Bundle size: +/-A bytes
- Memory: improved by B%
- Performance score: A

// ADDITIONAL RECOMMENDATIONS
// ===========================
[Recommendations here]
```
```

---

## 🧪 HOOK TEST GENERATOR AGENT

### Skills Especializados
| Categoria | Skills |
|-----------|--------|
| **React Testing Library** | renderHook, act, waitFor, waitForElementToBeRemoved, screen queries |
| **Vitest/Jest** | Test runner, assertions, mocking, spies, vi.fn(), vi.mock() |
| **Hook Testing Patterns** | State updates, effects, async operations, cleanup, error boundary |
| **Testing Scenarios** | Happy path testing, edge cases, error cases, boundary conditions |
| **Mocking Strategies** | API mocking with vi.fn(), timer mocking with vi.useFakeTimers(), storage mocking |
| **Test Coverage** | Branch coverage, statement coverage, edge case coverage, mutation testing |

### Prompt Template Completo

```markdown
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
  "framework": "vitest",
  "coverageTarget": 90,
  "scenarios": ["happy", "error", "edge", "integration"]
}
```

## TESTING FRAMEWORK SETUP

### Import & Setup
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { use{{FeatureName}} } from './use{{FeatureName}}';
```

### Mock Patterns

#### Mock Storage (localStorage)
```typescript
beforeEach(() => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();
  global.localStorage = localStorageMock as any;
});
```

#### Mock Fetch API
```typescript
global.fetch = vi.fn();
beforeEach(() => {
  vi.mocked(fetch).mockClear();
});
```

#### Mock Timers
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});
```

### Test Pattern Templates

#### Pattern 1: State Update Test
```typescript
it('updates state when setter is called', () => {
  const { result } = renderHook(() => use{{FeatureName}}());
  
  act(() => {
    result.current.setValue('test');
  });
  
  expect(result.current.value).toBe('test');
});
```

#### Pattern 2: Initial State Test
```typescript
it('initializes with default value', () => {
  const { result } = renderHook(() => use{{FeatureName}}({ default: 'initial' }));
  
  expect(result.current.value).toBe('initial');
});
```

#### Pattern 3: Async Operation Test
```typescript
it('loads data asynchronously', async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: 'test' })
  } as Response);
  
  const { result } = renderHook(() => use{{FeatureName}}());
  
  expect(result.current.isLoading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ data: 'test' });
  });
});
```

#### Pattern 4: Error Handling Test
```typescript
it('handles fetch errors gracefully', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
  
  const { result } = renderHook(() => use{{FeatureName}}());
  
  await act(async () => {
    await result.current.fetch();
  });
  
  expect(result.current.error).instanceOf(Error);
  expect(result.current.error?.message).toBe('Network error');
});
```

#### Pattern 5: Effect Cleanup Test
```typescript
it('cleans up on unmount', () => {
  const cleanup = vi.fn();
  const { unmount } = renderHook(() => useHookWithCleanup(cleanup));
  
  unmount();
  
  expect(cleanup).toHaveBeenCalledTimes(1);
});
```

#### Pattern 6: Debounce/Throttle Test
```typescript
it('debounces rapid value changes', () => {
  const { result } = renderHook(() => useDebounce('initial', 300));
  
  act(() => {
    result.current.setValue('new1');
    result.current.setValue('new2');
    result.current.setValue('final');
  });
  
  expect(result.current.debouncedValue).toBe('initial');
  
  act(() => {
    vi.advanceTimersByTime(299);
  });
  
  expect(result.current.debouncedValue).toBe('initial');
  
  act(() => {
    vi.advanceTimersByTime(1);
  });
  
  expect(result.current.debouncedValue).toBe('final');
});
```

#### Pattern 7: Loading State Test
```typescript
it('sets loading state during async operation', async () => {
  const { result } = renderHook(() => use{{FeatureName}}());
  
  let resolve: (value: any) => void;
  const promise = new Promise(r => resolve = r);
  vi.mocked(fetch).mockImplementationOnce(() => promise);
  
  const fetchPromise = act(async () => {
    await result.current.fetch();
  });
  
  expect(result.current.isLoading).toBe(true);
  
  resolve!({ ok: true, json: async () => ({ data: 'test' }) } as Response);
  await fetchPromise;
  
  expect(result.current.isLoading).toBe(false);
});
```

#### Pattern 8: Rerender Test
```typescript
it('updates when props change', () => {
  const { result, rerender } = renderHook(
    ({ id }) => use{{FeatureName}}(id),
    { initialProps: { id: 1 } }
  );
  
  expect(result.current.id).toBe(1);
  
  rerender({ id: 2 });
  
  expect(result.current.id).toBe(2);
});
```

#### Pattern 9: Multiple Calls Test
```typescript
it('handles multiple concurrent calls', async () => {
  const { result } = renderHook(() => use{{FeatureName}}());
  
  const promises = [
    result.current.fetchItem('1'),
    result.current.fetchItem('2'),
    result.current.fetchItem('3')
  ];
  
  await act(async () => {
    await Promise.all(promises);
  });
  
  expect(result.current.items).toHaveLength(3);
});
```

#### Pattern 10: Storage Persistence Test
```typescript
it('persists state to localStorage', () => {
  const { result } = renderHook(() => useLocalStorage('test', 'initial'));
  
  act(() => {
    result.current.setValue('new value');
  });
  
  expect(localStorage.getItem('test')).toBe('"new value"');
});

it('restores state from localStorage', () => {
  localStorage.setItem('test', '"saved value"');
  
  const { result } = renderHook(() => useLocalStorage('test', 'default'));
  
  expect(result.current).toBe('saved value');
});
```

## TESTING CHECKLIST

### ✅ Must Cover
- [ ] Happy path: Normal operation works
- [ ] Initial state: Correct default values
- [ ] State updates: All setters work
- [ ] Effects: Effects run with correct timing
- [ ] Cleanup: Cleanup functions called

### ⚠️ Should Cover  
- [ ] Error handling: Errors caught and handled
- [ ] Async operations: Loading states and results
- [ ] Edges cases: Empty, null, undefined inputs
- [ ] Concurrent: Multiple simultaneous operations
- [ ] Rerenders: Updates when props change

### 📊 Coverage Target: {{coverageTarget}}%

## YOUR TASK
Generate comprehensive test file:

1. **File Structure**
   - Imports
   - Mock setup (beforeEach/afterEach)
   - Test suites (describe blocks)
   - Individual test cases (it blocks)

2. **Test Organization**
   - Group by functionality
   - Clear test descriptions
   - Arrange-Act-Assert pattern

3. **Test Data**
   - Consistent mock data
   - Helper functions for setup
   - Factories for complex objects

4. **Assertions**
   - Clear expect statements
   - Multiple assertions per test when related
   - Error message descriptions

## RETURN FORMAT

```typescript
// File: src/hooks/use{{FeatureName}}.test.ts
// ===========================================
[Full test code here]

// TEST SUMMARY
// ============
- Test cases: N
- Coverage: ~{{coverageTarget}}%
- Scenarios covered: [happy, error, edge, integration]

// MISSING COVERAGE (if any)
// =======================
[List any edge cases not covered]
```
```

---

# 2. HOOK PATTERNS LIBRARY (COMPLETO)

## 1️⃣ useResource

### TypeScript Complete Definition

```typescript
/**
 * Generic CRUD hook for resource management with optimistic updates,
 * caching, and automatic refetching.
 *
 * @template T - Resource type, must have an id property (string or number)
 * @template P - Partial update type (defaults to Partial<T>)
 *
 * @param config - Hook configuration object
 * @param config.endpoint - API endpoint for the resource (e.g., '/api/services')
 * @param config.initialData - Initial data to pre-populate state
 * @param config.storageKey - LocalStorage key for caching (optional)
 * @param config.autoRefetch - Automatically refetch on interval (default: false)
 * @param config.refetchInterval - Refetch interval in ms (default: 0)
 * @param config.fetchFn - Custom fetch function (default: uses fetch API)
 * @param config.debug - Enable debug logging (default: false)
 *
 * @returns Object containing data, state, and CRUD operations
 *
 * @example
 * ```tsx
 * // Basic usage for services
 * const services = useResource<Service>({
 *   endpoint: '/api/services',
 *   storageKey: 'services-cache',
 * });
 *
 * // Fetch data
 * await services.fetchAll();
 *
 * // Create new item
 * const newService = await services.create({
 *   name: 'Haircut',
 *   price: 30,
 *   duration: 30
 * });
 *
 * // Update item
 * await services.update('1', { price: 35 });
 *
 * // Delete item
 * await services.delete('1');
 *
 * // Optimistic mutation
 * services.mutate(prev => [...prev, newService]);
 * ```
 */
export function useResource<T extends { id: string | number }, P = Partial<T>>(
  config: UseResourceConfig<T>
): UseResourceReturn<T, P> { }

/**
 * Configuration for the useResource hook
 */
interface UseResourceConfig<T> {
  /** API endpoint for the resource */
  endpoint: string;
  /** Initial data to pre-populate state */
  initialData?: T[];
  /** LocalStorage key for caching (optional) */
  storageKey?: string;
  /** Automatically refetch on interval */
  autoRefetch?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Custom fetch function (default: standard fetch) */
  fetchFn?: () => Promise<T[]>;
  /** Enable debug logging to console */
  debug?: boolean;
}

/**
 * Return object from useResource hook
 */
interface UseResourceReturn<T, P = Partial<T>> {
  // State
  /** Current resource data */
  data: T[];
  /** Loading state for operations */
  isLoading: boolean;
  /** Error state if any operation failed */
  error: Error | null;
  /** Validation state (refetching) */
  isValidating: boolean;
  
  // CRUD Operations - Read
  /** Fetch all resources from API */
  fetchAll: () => Promise<void>;
  /** Fetch single resource by ID */
  fetchById: (id: string | number) => Promise<T | undefined>;
  
  // CRUD Operations - Create
  /** Create new resource */
  create: (item: Omit<T, 'id'>) => Promise<T>;
  
  // CRUD Operations - Update
  /** Update existing resource */
  update: (id: string | number, updates: P) => Promise<T>;
  
  // CRUD Operations - Delete
  /** Delete resource by ID */
  delete: (id: string | number) => Promise<void>;
  
  // Batch Operations
  /** Create multiple items */
  createMany: (items: Array<Omit<T, 'id'>>) => Promise<T[]>;
  /** Update multiple items */
  updateMany: (updates: Array<{ id: string | number; changes: P }>) => Promise<T[]>;
  /** Delete multiple items */
  deleteMany: (ids: Array<string | number>) => Promise<void>;
  
  // Cache Operations
  /** Mutate data locally without API call (optimistic) */
  mutate: (updater: (data: T[]) => T[]) => void;
  /** Invalidate cache and refetch */
  invalidate: () => void;
  /** Clear all data (without API call) */
  clear: () => void;
  
  // Utility
  /** Get item by ID from cache */
  getById: (id: string | number) => T | undefined;
}
```

### Requirements Checklist

| Requirement | Status |
|-------------|--------|
| Generic type with id constraint | ✅ |
| CRUD operations (Create, Read, Update, Delete) | ✅ |
| Optimistic updates support | ✅ |
| Loading and error states | ✅ |
| Cache invalidation | ✅ |
| Auto-refetching option | ✅ |
| Batch operations | ✅ |
| LocalStorage persistence | ✅ |
| Request cancellation | ✅ |
| Debug mode | ✅ |

### Edge Cases & Solutions

| Edge Case | Solution |
|-----------|----------|
| Network failure | Error state, automatic retry option |
| Concurrent updates | AbortController + last-write-wins |
| Optimistic updates need rollback | Track pending operations, restore on error |
| Duplicate requests | Request deduplication with pending requests map |
| Empty data handling | Return empty array, not null |
| Large dataset pagination | Add pagination support (future enhancement) |
| ID type mismatch | Accept string \| number, normalize internally |

### Implementation Composition

```typescript
// Composed with:
// - useLocalStorage: For cache persistence
// - useDebounce: For debounced auto-save
// - useAbortState: For request cancellation

// Pattern:
// - Reducer for state management
// - AbortController for cleanup
// - Map for pending request deduplication
```

---

## 2️⃣ usePagination

### TypeScript Complete Definition

```typescript
/**
 * Pagination management hook supporting both client-side and server-side pagination.
 *
 * @template T - Item type in the data set
 *
 * @param config - Pagination configuration
 * @param config.data - Complete dataset (client-side pagination)
 * @param config.fetchPage - Async fetch function (server-side pagination)
 * @param config.itemsPerPage - Items per page (default: 10)
 * @param config.initialPage - Starting page (default: 1)
 * @param config.totalItems - Total items (server-side, required)
 *
 * @returns Pagination controls and state
 *
 * @example
 * ```tsx
 * // Client-side pagination
 * const { currentPageData, nextPage, prevPage, totalPages } = usePagination({
 *   data: allItems,
 *   itemsPerPage: 20
 * });
 *
 * // Server-side pagination
 * const { currentPageData, nextPage, prevPage, totalPages } = usePagination({
 *   fetchPage: (page, limit) => api.getItems(page, limit),
 *   totalItems: 150,
 *   itemsPerPage: 20
 * });
 * ```
 */
export function usePagination<T>(
  config: PaginationConfig<T>
): PaginationReturn<T> { }

interface PaginationConfig<T> {
  /** Complete dataset (for client-side pagination) */
  data?: T[];
  /** Async fetch function (for server-side pagination) */
  fetchPage?: (page: number, itemsPerPage: number) => Promise<T[]>;
  /** Total items count (required for server-side) */
  totalItems?: number;
  /** Items per page (default: 10) */
  itemsPerPage?: number;
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Debounce page changes (ms) */
  debounceMs?: number;
}

interface PaginationReturn<T> {
  // Data
  /** Current page's data */
  currentPageData: T[];
  /** All data (client-side) */
  allData: T[] | undefined;
  
  // Pagination State
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  itemsPerPage: number;
  
  // UI State
  /** Loading state (server-side) */
  isLoading: boolean;
  /** Error state (server-side) */
  error: Error | null;
  /** Whether on first page */
  isFirstPage: boolean;
  /** Whether on last page */
  isLastPage: boolean;
  
  // Navigation
  /** Go to specific page */
  goToPage: (page: number) => Promise<void>;
  /** Go to next page */
  nextPage: () => Promise<void>;
  /** Go to previous page */
  prevPage: () => Promise<void>;
  /** Go to first page */
  firstPage: () => Promise<void>;
  /** Go to last page */
  lastPage: () => Promise<void>;
  
  // Configuration
  /** Set items per page */
  setItemsPerPage: (limit: number) => void;
  /** Reset to first page */
  reset: () => void;
}
```

### Requirements Checklist

| Requirement | Status |
|-------------|--------|
| Client-side pagination | ✅ |
| Server-side pagination | ✅ |
| Page navigation controls | ✅ |
| Items per page customization | ✅ |
| Total count calculation | ✅ |
| Loading states for async | ✅ |
| Page range validation | ✅ |
| Debounced page changes | ✅ |
| First/last page shortcuts | ✅ |

### Edge Cases & Solutions

| Edge Case | Solution |
|-----------|----------|
| Page out of bounds | Clamp to valid range |
| Empty dataset | Return empty array, 0 pages |
| Server-side filtering conflicts | Invalidate on filter changes |
| Rapid page changes | Debounce navigation |
| Large page sizes | Recommend maximum limit |
| Concurrent page loads | Abort previous, load latest |

---

## 3️⃣ useFilters

### TypeScript Complete Definition

```typescript
/**
 * Advanced filtering management hook with multiple filter types and debouncing.
 *
 * @template T - Item type being filtered
 *
 * @param config - Filters configuration
 * @param config.initialFilters - Initial filter values
 * @param config.filters - Filter definitions
 * @param config.debounceMs - Debounce delay for filter changes (default: 300ms)
 *
 * @returns Filter state and actions
 *
 * @example
 * ```tsx
 * const { filters, setFilter, applyFilters, hasActiveFilters } = useFilters({
 *   initialFilters: { search: '', category: 'all', priceRange: [0, 100] },
 *   filters: [
 *     { key: 'search', type: 'text', label: 'Search', defaultValue: '' },
 *     { key: 'category', type: 'select', label: 'Category', 
 *       options: [{ value: 'hair', label: 'Hair' }, ...] },
 *     { key: 'priceRange', type: 'range', label: 'Price', defaultValue: [0, 100] }
 *   ]
 * });
 *
 * const filteredData = applyFilters(allData);
 * ```
 */
export function useFilters<T>(
  config: FiltersConfig<T>
): FiltersReturn<T> { }

type FilterType = 'text' | 'select' | 'multiselect' | 'range' | 'date' | 'boolean';
type FilterValue = string | number | boolean | string[] | [number, number] | Date | null;

interface FiltersConfig<T> {
  /** Initial values for filters */
  initialFilters?: Record<string, FilterValue>;
  /** Filter definitions */
  filters: FilterDefinition<T>[];
  /** Debounce filter changes in ms (default: 300) */
  debounceMs?: number;
}

interface FilterDefinition<T> {
  /** Filter key */
  key: keyof T | string;
  /** Filter type */
  type: FilterType;
  /** Label for UI display */
  label: string;
  /** Options for select/multiselect */
  options?: Array<{ value: any; label: string }>;
  /** Default value */
  defaultValue?: FilterValue;
  /** Custom filter function */
  filterFn?: (item: T, value: FilterValue) => boolean;
}

interface FiltersReturn<T> {
  /** Current filter values */
  filters: Record<string, FilterValue>;
  
  // Actions
  /** Update single filter value */
  setFilter: (key: string, value: FilterValue) => void;
  /** Update multiple filters at once */
  setFilters: (updates: Record<string, FilterValue>) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
  /** Clear specific filter */
  clearFilter: (key: string) => void;
  
  // Apply
  /** Apply filters to data */
  applyFilters: (data: T[]) => T[];
  /** Debounced version of applyFilters */
  debouncedApplyFilters: (data: T[]) => T[];
  
  // State
  /** Check if any filters are active (not default) */
  hasActiveFilters: boolean;
  /** Number of active filters */
  activeFilterCount: number;
  Get active filter keys
  activeFilters: readonly string[];
}
```

### Requirements Checklist

| Requirement | Status |
|-------------|--------|
| Multi-filter support | ✅ |
| Multiple filter types | ✅ |
| Debounced application