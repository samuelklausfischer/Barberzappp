# SPECIALIST HOOK AGENTS - Framework Painel Admin (CONTINUAÇÃO)
## Continuação do documento de especificação...

---

# 3. PROMPT EXAMPLES (COMPLETO)

## Example 1: Hook Architect - Designing useResource

```markdown
You are a React Hook Architect. Design a custom React hook based on the requirements.

## FEATURE REQUIREMENT
We need a generic CRUD hook for managing resources in our application. This hook should replace multiple similar hooks (useServices, useAppointments, etc.) and provide a consistent API for Create, Read, Update, Delete operations.

## USE CASE
The hook will be used across multiple features:
- Services management (barbershop services)
- Appointments CRUD (booking system)
- Staff management (employees)
- Customer records (client database)

Each feature has similar requirements:
- Fetch all items
- Create new item
- Update existing item
- Delete item
- Optimistic UI updates
- Loading and error states
- LocalStorage caching

## EXISTING PATTERNS IN THE CODEBASE

### Current useServices Pattern
```typescript
export const useServices = () => {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  return { services, setServices };
};
```

### Current useAppointments Pattern
```typescript
export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  return { appointments, setAppointments };
};
```

### useLocalStorage Pattern (for caching)
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

## DATA LAYER SPEC
```json
{
  "storageType": "localStorage",
  "asyncOperations": true,
  "optimisticUpdates": true,
  "cacheStrategy": "write-back",
  "apiPattern": "REST"
}
```

## UI REQUIREMENTS
```json
{
  "loadingState": true,
  "errorHandling": true,
  "optimisticUpdates": true,
  "realtime": false,
  "debounceMs": 300
}
```

## YOUR TASK
Design the hook by specifying:

### 1. Hook Signature
```typescript
export function useResource<T extends { id: string | number }>(
  config: UseResourceConfig<T>
): UseResourceReturn<T>
```

### 2. TypeScript Interfaces (Complete)
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

### 3. Hook Contract Documentation (JSDoc)
```typescript
/**
 * Generic CRUD hook for resource management with optimistic updates and caching
 * 
 * @template T - Resource type, must have an id property (string or number)
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

### 4. Implementation Requirements

#### State Variables Needed
```typescript
- data: T[] - Resource list
- isLoading: boolean - Loading state for operations
- error: Error | null - Error state for operations
- isValidating: boolean - Refetching/validation state
- abortController: AbortController - Request cancellation
- pendingRequests: Map<string, Promise<T>> - Request deduplication
```

#### Effects and Dependencies
```typescript
// 1. Initial fetch
useEffect(() => {
  fetchAll();
}, [config.endpoint]); // Run when endpoint changes

// 2. Cache persistence
useEffect(() => {
  if (config.storageKey && data.length > 0) {
    localStorage.setItem(config.storageKey, JSON.stringify(data));
  }
}, [data, config.storageKey]); // Persist when data changes

// 3. Auto-refetch
useEffect(() => {
  if (!config.autoRefetch || !config.refetchInterval) return;
  const interval = setInterval(() => fetchAll(), config.refetchInterval);
  return () => clearInterval(interval);
}, [config.autoRefetch, config.refetchInterval, fetchAll]);
```

#### Memoization Opportunities
```typescript
// Memoize CRUD functions to prevent recreation
const create = useCallback(async (item: Omit<T, 'id'>) => {
  // Implementation
}, [config.endpoint, config.fetchFn]);

const update = useCallback(async (id: string | number, updates: P) => {
  // Implementation
}, [config.endpoint, config.fetchFn]);

// Memoize data access operations
const getById = useCallback((id: string | number) => {
  return data.find(item => item.id === id);
}, [data]);
```

#### Cleanup Functions
```typescript
// Abort ongoing fetch requests on unmount
useEffect(() => {
  const controller = new AbortController();
  return () => controller.abort();
}, []);

// Clear auto-refetch intervals
useEffect(() => {
  let interval: NodeJS.Timeout;
  if (config.autoRefetch && config.refetchInterval) {
    interval = setInterval(fetchAll, config.refetchInterval);
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [config.autoRefetch, config.refetchInterval]);
```

### 5. Testing Requirements

#### Unit Test Scenarios

**1. Fetch Operations**
- ✅ fetchAll() successfully loads data
- ✅ fetchAll() handles error and sets error state
- ✅ fetchAll() sets isLoading true during operation
- ✅ fetchById() finds correct item from data
- ✅ fetchById() returns undefined for non-existent ID
- ✅ fetchById() uses fetchFn when provided
- ✅ Concurrent fetchAll calls deduplicated

**2. Create Operations**
- ✅ create() adds new item to data array
- ✅ create() returns created item with generated ID
- ✅ create() throws error on API failure
- ✅ create() validates required fields through TypeScript
- ✅ create() persists to localStorage when storageKey provided

**3. Update Operations**
- ✅ update() modifies correct item in data array
- ✅ update() only updates provided fields (partial update)
- ✅ update() handles non-existent ID gracefully
- ✅ update() persists changes to localStorage
- ✅ update() throws error on API failure

**4. Delete Operations**
- ✅ delete() removes item from data array
- ✅ delete() handles non-existent ID gracefully
- ✅ delete() persists removal to localStorage
- ✅ delete() throws error on API failure

**5. Cache Operations**
- ✅ mutate() updates data without API call (optimistic)
- ✅ invalidate() triggers refetch
- ✅ clear() empties data array
- ✅ localStorage restored on initial mount when storageKey provided

**6. Loading/Error States**
- ✅ isLoading true during async operations
- ✅ isLoading false after completion
- ✅ error set on failures
- ✅ error cleared on successful requests
- ✅ isValidating true during refetch

**7. Edge Cases**
- ✅ Empty data handling (array, not null)
- ✅ Duplicate requests cancelled/merged
- ✅ AbortController cleanup on unmount
- ✅ Auto-refetch starts and stops correctly
- ✅ Storage errors handled gracefully

#### Test Cases Count: ~25 test cases

### 6. Related Patterns

#### Compose: Existing Hooks
```typescript
- useLocalStorage: For cache persistence (when storageKey provided)
- useDebounce: For debounced auto-save operations
- useAbortState: Custom hook for request cancellation (to be created)
```

#### Utilitize Functions
```typescript
- createItemFromResponse(): Transform API response to resource type
- isResource(): Type guard for resource interface
- generateId(): Generate unique ID for new items
```

#### Similar To
```typescript
- React Query's useQuery/useMutation (but simpler)
- SWR's useSWR (with mutate)
```

#### Extend: None (base pattern)

## RETURN FORMAT

Return a complete specification in structured markdown format with all sections above.
```

---

## Example 2: Hook Generator - Implementing useResource

```markdown
You are a React Hook Generator. Implement a custom React hook from the specification.

## HOOK SPECIFICATION

```typescript
/**
 * Generic CRUD hook for resource management with optimistic updates and caching
 * 
 * @template T - Resource type, must have an id property (string or number)
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
 * const services = useResource<Service>({
 *   endpoint: '/api/services',
 *   storageKey: 'services-cache',
 * });
 * ```
 */

export function useResource<T extends { id: string | number }, P = Partial<T>>(
  config: UseResourceConfig<T>
): UseResourceReturn<T, P> { }

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
  fetchAll: () => Promise<void>;
  fetchById: (id: string | number) => Promise<T | undefined>;
  create: (item: Omit<T, 'id'>) => Promise<T>;
  update: (id: string | number, updates: P) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
  
  /** Cache Operations */
  mutate: (updater: (data: T[]) => T[]) => void;
  invalidate: () => void;
  clear: () => void;
}
```

## PROJECT CONTEXT
```typescript
// Project: BarberZap Pro
// Stack: Vite + React 19 + TypeScript 5.8
// Patterns: Functional hooks, no classes, strict TypeScript

// File location: src/hooks/useResource.ts
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

## YOUR TASK

Implement the complete `useResource` hook with:
1. Full TypeScript implementation with generics
2. CRUD operations (create, read, update, delete)
3. Optimistic updates via mutate()
4. LocalStorage caching (when storageKey provided)  
5. Auto-refetching (when autoRefetch true)
6. Loading and error states
7. Request deduplication (pending requests map)
8. AbortController for cleanup
9. Comprehensive error handling
10. Debug logging (when debug true)
11. Complete JSDoc documentation

## RETURN FORMAT

```typescript
// File: src/hooks/useResource.ts
// ===========================================
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Types and interfaces...
 */

/**
 * Helper functions...
 */

/**
 * Main hook implementation...
 */
export function useResource<T extends { id: string | number }, P = Partial<T>>(
  config: UseResourceConfig<T>
): UseResourceReturn<T, P> {
  // Implementation
}

// Export types
export type { UseResourceConfig, UseResourceReturn };
```
```

---

## Example 3: Hook Optimizer - Optimizing useResource

```markdown
You are a React Hook Optimizer. Optimize the given hook for performance.

## HOOK CODE TO OPTIMIZE

```typescript
export function useResource<T extends { id: string | number }>(
  config: UseResourceConfig<T>
): UseResourceReturn<T> {
  const [data, setData] = useState<T[]>(config.initialData || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(config.endpoint);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const create = async (item: Omit<T, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(item),
      });
      const newItem = await response.json();
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (id: string | number, updates: Partial<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.endpoint}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const updated = await response.json();
      setData(prev => prev.map(item => item.id === id ? updated : item));
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const delete = async (id: string | number) => {
    setIsLoading(true);
    setError(null);
    try {
      await fetch(`${config.endpoint}/${id}`, {
        method: 'DELETE',
      });
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const mutate = (updater: (data: T[]) => T[]) => {
    setData(updater);
  };

  return {
    data,
    isLoading,
    error,
    fetchAll,
    create,
    update,
    delete,
    mutate,
  };
}
```

## PERFORMANCE ISSUES IDENTIFIED

1. **Function Recreation**: All CRUD functions recreated on every render
2. **Missing AbortController**: No request cancellation on unmount
3. **No Request Deduplication**: Concurrent requests go through
4. **State Updates Cause Re-renders**: Single loading/error state for all operations
5. **Missing Dependencies**: useEffect not optimized
6. **No Memoization**: Expensive operations not memoized
7. **Local Storage NOT IMPLEMENTED**: Spec says it should cache

## METRICS

```json
{
  "renderCount": 15-20 per interaction",
  "bundleSizeImpact": "baseline",
  "memoryOverhead": "potential leaks from pending requests"
}
```

## OPTIMIZATION PRIORITY: HIGH

## YOUR TASK

Analyze and optimize the hook by:

1. **Performance Analysis**
   - Identify re-render triggers
   - Find expensive computations
   - Detect memory leak risks
   - Spot stale closure issues

2. **Optimization Strategy**
   - Apply useMemo/useCallback
   - Implement AbortController
   - Add request deduplication
   - Add LocalStorage caching
   - Optimize state management

3. **Refactoring Recommendations**
   - Simplify complex logic
   - Extract repeated code
   - Improve hook composition
   - Suggest architectural improvements

4. **Before/After Metrics**
   - Estimated re-render reduction
   - Bundle size impact
   - Memory improvement

## RETURN FORMAT

```typescript
// OPTIMIZED CODE
// =================
export function useResource<T extends { id: string | number }>(
  config: UseResourceConfig<T>
): UseResourceReturn<T> {
  // Optimized implementation with:
  // - useCallback for stable function references
  // - AbortController for request cancellation
  // - Request deduplication map
  // - LocalStorage persistence
  // - Better state management
}

// OPTIMIZATION CHANGES
// ====================
1. Wrapped all CRUD functions in useCallback

2. Added useRef for AbortController to prevent recreation

3. Added pendingRequests map for deduplication

4. Implemented LocalStorage persistence when storageKey provided

5. Optimized useEffect dependencies

6. Memoized expensive operations

// BEFORE/AFTER ANALYSIS
// ====================
- Re-renders: from 15-20 to 2-3 per interaction (-87%)
- Bundle size: +2 KB (added caching logic)
- Memory: eliminated request leaks
- Performance score: C → A

// ADDITIONAL RECOMMENDATIONS
// ===========================
1. Consider adding retry logic for failed requests

2. Add optimistic rollback on API failure

3. Implement pagination for large datasets

4. Add debounced auto-save for mutate operations

5. Consider separating loading states per operation
```
```

---

# 4. DEVELOPMENT WORKFLOWS

## Workflow 1: New Hook Creation

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW 1: NEW HOOK CREATION                 │
└─────────────────────────────────────────────────────────────────┘

1. REQUIREMENTS GATHERING
   ├─ Feature specification from product/tech lead
   ├─ Use case analysis
   ├─ Existing patterns review
   └─ Tech constraints documentation

2. HOOK ARCHITECT (Design Phase)
   ├─ Define hook signature with generics
   ├─ Create TypeScript interfaces
   ├─ Write JSDoc documentation
   ├─ Specify implementation requirements
   ├─ Define testing requirements
   └─ Approve specification

3. HOOK GENERATOR (Implementation Phase)
   ├─ Implement hook with TypeScript
   ├─ Compose existing hooks (useLocalStorage, etc.)
   ├─ Add error handling
   ├─ Include performance optimizations
   ├─ Write JSDoc comments
   └─ Code review self-check

4. HOOK OPTIMIZER (Optimization Phase)
   ├─ Analyze performance
   ├─ Apply memoization
   ├─ Fix dependency arrays
   ├─ Add cleanup functions
   ├─ Optimize state management
   └─ Performance metrics report

5. HOOK TEST GENERATOR (Testing Phase)
   ├─ Generate test suite
   ├─ Write happy path tests
   ├─ Write error case tests
   ├─ Write edge case tests
   ├─ Target 90%+ coverage
   └─ Test integration scenarios

6. CODE REVIEW
   ├─ Peer review
   ├─ TypeScript strict mode check
   ├─ ESLint checking
   └─ Approval

7. DEPLOYMENT
   ├─ Merge to main
   ├─ Version bump (if published)
   └─ Documentation update

TIME ESTIMATE:
- Simple hook: 2-4 hours
- Medium hook: 4-8 hours
- Complex hook: 8-16 hours
```

---

## Workflow 2: Hook Refactoring

```
┌─────────────────────────────────────────────────────────────────┐
│                   WORKFLOW 2: HOOK REFACTORING                   │
└─────────────────────────────────────────────────────────────────┘

1. ANALYSIS
   ├─ Performance profiling with React DevTools
   ├─ Identify bottlenecks
   ├─ Review patterns for modernization
   └─ Gather metrics (render count, memory, bundle)

2. HOOK OPTIMIZER (Optimization Phase)
   ├─ Apply performance fixes
   ├─ Memoize expensive operations
   ├─ Fix dependency arrays
   ├─ Add proper cleanup
   ├─ Reduce bundle size
   └─ Generate optimization report

3. HOOK ARCHITECT (Validation Phase)
   ├─ Review changes maintain API contract
   ├─ Validate type safety
   ├─ Check pattern consistency
   └─ Approve refactoring

4. HOOK TEST GENERATOR (Test Update Phase)
   ├─ Update existing tests
   ├─ Add regression tests
   ├─ Verify coverage maintained
   └─ Add performance tests if needed

5. VERIFICATION
   ├─ Run full test suite
   ├─ Compare before/after metrics
   ├─ Manual testing in dev
   └─ Integration testing

6. DEPLOYMENT
   ├─ Changelog update
   ├─ Merge to main
   └─ Monitor production metrics

TIME ESTIMATE:
- Simple optimization: 1-2 hours
- Medium refactor: 2-4 hours
- Complete overhaul: 4-8 hours
```

---

## Workflow 3: Bug Fix / Hotfix

```
┌─────────────────────────────────────────────────────────────────┐
│                  WORKFLOW 3: BUG FIX / HOTFIX                    │
└─────────────────────────────────────────────────────────────────┘

1. BUG REPORT
   ├─ Issue documentation
   ├─ Reproduction steps
   ├─ Expected vs actual behavior
   └─ Impact assessment

2. ROOT CAUSE ANALYSIS
   ├─ HOOK ARCHITECT analyzes issue
   ├─ Identify root cause
   ├─ Determine scope of fix
   └─ Propose solution

3. HOOK GENERATOR (Fix Implementation)
   ├─ Implement fix
   ├─ Maintain backward compatibility (critical)
   ├─ Add error handling if needed
   └─ Document change

4. HOOK TEST GENERATOR (Test Phase)
   ├─ Write test for bug scenario
   ├─ Verify fix passes test
   ├─ Ensure no regressions
   └─ Run full test suite

5. HOOK OPTIMIZER (Performance Check)
   ├─ Verify no performance degradation
   ├─ Measure impact
   └─ Report findings

6. CODE REVIEW & DEPLOY
   ├─ Accelerated review
   ├─ Hotfix release
   ├─ Monitor production
   └─ Close issue

TIME ESTIMATE:
- Critical bug: 1-2 hours (immediate fix)
- Standard bug: 2-4 hours
- Complex bug: 4-8 hours
```

---

## Workflow 4: Migration to useResource

```
┌─────────────────────────────────────────────────────────────────┐
│              WORKFLOW 4: MIGRATION TO USE-RESOURCE                │
└─────────────────────────────────────────────────────────────────┘

1. ASSESSMENT
   ├─ Identify feature-specific hooks
   ├─ List: useServices, useAppointments, useStaff
   ├─ Analyze current patterns
   └─ Create migration plan

2. HOOK ARCHITECT (Design Migration)
   ├─ Ensure useResource meets all requirements
   ├─ Map existing APIs to useResource
   ├─ Identify missing features if any
   ├─ Create migration guide
   └─ Approve migration strategy

3. HOOK GENERATOR (Implementation - if needed)
   ├─ Implement missing features in useResource
   ├─ Add necessary adapters
   ├─ Update TypeScript types
   └─ Prepare migration hooks

4. HOOK TEST GENERATOR (Test Migration)
   ├─ Create tests for migrated code
   ├- Compare behavior before/after
   ├─ Ensure feature parity
   └─ Document any differences

5. MIGRATION EXECUTION
   ├─ Feature by feature migration
   ├─ Update components to use useResource
   ├─ Remove old hooks
   └─ Update imports

6. VERIFICATION
   ├─ Full integration testing
   ├─ User acceptance testing
   ├─ Performance comparison
   └─ Rollback plan ready

7. CLEANUP
   ├─ Remove deprecated hooks
   ├─ Update documentation
   └─ Archive old code

TIME ESTIMATE:
- Single feature migration: 2-4 hours
- All features migration: 1-2 days
```

---

## AGENT ORCHESTRATION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

               ┌─────────────┐
               │   REQUEST   │
               │   (User)    │
               └──────┬──────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  DISPATCH (Framework)   │
         │  - Parse request        │
         │  - Select agents       │
         │  - Create context      │
         └────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐          ┌───────────────┐
│    ARCHITECT  │          │   GENERATOR   │
│  (1st Agent)  │          │   (2nd Agent) │
│               │          │               │
│ - Design spec │──────────▶│ - Implement  │
│ - Define APIs │  Hook Spec │ - Code       │
│ - TypeScript  │          │ - Docs       │
└───────┬───────┘          └───────┬───────┘
        │                          │
        │                          │
        ▼                          ▼
┌───────────────┐          ┌───────────────┐
│   OPTIMIZER   │          │  TEST GEN     │
│  (3rd Agent)  │          │   (4th Agent) │
│               │          │               │
│ - Performance │          │ - Test suite  │
│ - Memoization │◀─────────│ - Coverage    │
│ - Cleanup     │  Generated│ - Mocks      │
└───────┬───────┘          └───────┬───────┘
        │                          │
        └─────────────┬────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  AGGREGATE (Framework)  │
         │  - Combine results      │
         │  - Validate outputs     │
         │  - Format response      │
         └────────────────────────┘
                      │
                      ▼
               ┌─────────────┐
               │   RESPONSE   │
               │   (User)     │
               └─────────────┘

AGENT HANDOFF MECHANISM:
------------------------
1. Each agent receives context from previous agent
2. Framework tracks state across agent calls
3. Results are validated before passing to next agent
4. Any agent can request clarification
5. User can intervene at any point

PARALLEL EXECUTION (when possible):
------------------------------------
- OPTIMIZER and TEST GEN can run in parallel
- Multiple hook specs can be designed by ARCHITECT in parallel
- GENERATOR work can be batched
```

---

## QUALITY GATES

```
┌─────────────────────────────────────────────────────────────────┐
│                       QUALITY GATES                              │
└─────────────────────────────────────────────────────────────────┘

 Gate 1: ARCHITECT SPECS
 ├─ Complete JSDoc documentation
 ├─ TypeScript interfaces defined
 ├─ All edge cases identified
 ├─ Testing requirements specified
 └─ API contract approved

 Gate 2: GENERATOR CODE
 ├─ TypeScript compiles without errors
 ├─ Strict mode passes
 ├─ No any types
 ├─ All exports documented
 ├─ Error handling implemented
 └─ Code follows conventions

 Gate 3: OPTIMIZER ANALYSIS
 ├─ Performance acceptable
 ├─ No memory leaks
 ├─ Cleanup functions present
 ├─ Dependency arrays correct
 ├─ Memoization applied
 └─ Bundle size impact minimal

 Gate 4: TEST COVERAGE
 ├─ Test coverage ≥ 90%
 ├─ All tests passing
 ├─ Edge cases covered
 ├─ Error paths tested
 ├─ Integration tested
 └─ No console errors

 Gate 5: FINAL REVIEW
 ├─ All quality gates passed
 ├─ Peer review completed
 ├─ Documentation updated
 ├─ Changelog written
 └─ Ready for deployment
```

---

## SUCCESS METRICS

```typescript
interface HookAgentMetrics {
  // Development Metrics
  hooksCreated: number;
  averageDevelopmentTime: string; // hours
  codeReusability: number; // % of hooks reused
  
  // Quality Metrics
  testCoverage: number; // target: ≥90%
  bugRate: number; // bugs per 100 hooks
  typeSafetyScore: 'A' | 'B' | 'C' | 'D';
  
  // Performance Metrics
  averageRenderReduction: number; // %
  memoryLeakIncidents: number;
  bundleSizeImpact: number; // bytes per hook
  
  // Adoption Metrics
  hooksUsed: number;
  migratedFeatures: number;
  developerSatisfaction: number; // 1-10 scale
}
```

---

## SUMMARY

This complete specification provides:

✅ **4 Hook Agents** with detailed skills and prompts:
   - Hook Architect Agent
   - Hook Generator Agent  
   - Hook Optimizer Agent
   - Hook Test Generator Agent

✅ **8 Hook Patterns** completely specified:
   - useResource (CRUD genérico)
   - usePagination
   - useFilters
   - useDialog
   - useToast
   - useConfirm
   - useScrollToBottom
   - useToggle

✅ **3 Complete Prompt Examples**:
   - Hook Architect designing useResource
   - Hook Generator implementing useResource
   - Hook Optimizer optimizing useResource

✅ **4 Development Workflows**:
   - New Hook Creation
   - Hook Refactoring
   - Bug Fix / Hotfix
   - Migration to useResource

✅ **Quality Gates** and **Success Metrics** for continuous improvement.

The framework is ready to be implemented and will significantly accelerate hook development while maintaining high quality standards.
