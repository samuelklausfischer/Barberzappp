# 📝 Gap Implementation Example

**Example: Implementing Gap #8 - Advanced TypeScript Generics**

This document demonstrates how to close one of the identified gaps using the sub-agent system.

---

## 🎯 Gap #8: Advanced TypeScript Generics

### Description
Many agents have basic TypeScript skills, but lack expertise in_advanced_ generics, utility types, and type inference patterns.

### Impact
- Limited component reusability
- More code duplication
- Reduced type safety in complex scenarios
- Longer development time

### Solution
Expand TypeScript generics skills in 3 key agents and create a utility type library.

---

## 📋 Implementation Plan

### Phase 1: Skill Enhancement (1-2 days)

#### Agents to Upgrade

1. **Frontend Specialist**
   - Add skill: `typescript-generics-advanced`
   - Level: intermediate → advanced
   - Focus: Generic components, type inference

2. **System Architect**
   - Add skill: `typescript-generics-advanced`
   - Level: intermediate → advanced
   - Focus: Type-safe architecture, utility types

3. **Component Generator**
   - Add skill: `typescript-generics-intermediate`
   - Level: basic → intermediate
   - Focus: Generate generic components

### Phase 2: Create Utility Type Library (2-3 days)

#### New File: `src/types/utilities.ts`

```typescript
/**
 * Advanced TypeScript Utility Types
 * Collection of reusable type utilities for BarberZap framework
 */

// Partial but recursive
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Required but recursive
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Make specific keys required
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make specific keys optional
type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Extract specific nested property type
type Path<T> = T extends object
  ? { [K in keyof T]: `${K & string}` | `${K & string}.${Path<T[K]>}` }[keyof T]
  : never;

// Type-safe getter by path
type GetByPath<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? GetByPath<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

// Omit keys recursively
type DeepOmit<T, K extends string> = T extends object
  ? {
      [P in keyof T as P extends K ? never : P]: T[P] extends object
        ? DeepOmit<T[P], K>
        : T[P];
    }
  : T;

// Pick keys recursively
type DeepPick<T, K extends string> = T extends object
  ? {
      [P in keyof T as P extends K ? P : never]: T[P] extends object
        ? DeepPick<T[P], K>
        : T[P];
    }
  : T;

// Union to intersection
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

// Last element of array
type Last<T extends any[]> = T extends [...any, infer L] ? L : never;

// First element of array
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

// Exclude null and undefined
type NonNullable<T> = T extends null | undefined ? never : T;

// Extract promise type
type Awaited<T> = T extends Promise<infer U> ? U : T;

// Extract function return type
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract function parameters
type ParametersOf<T> = T extends (...args: infer P) => any ? P : never;

// Event handler type
type EventHandler<T = any> = (event: CustomEvent<T>) => void;

// Make all string keys readonly
type ReadonlyStrings<T> = {
  readonly [K in keyof T as K extends string ? K : never]: T[K];
} & {
  [K in keyof T as K extends string ? never : K]: T[K];
};

// Conditional type for API responses
type ApiResponse<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

// Props with children
type PropsWithChildren<P = {}> = P & { children?: React.ReactNode };

// Extract prop types from component
type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

// Generic component props
type GenericComponentProps<T> = {
  data: T;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyFn?: (item: T) => string;
};

// Entity type with ID
type Entity<T = {}> = T & { id: string };

// Entity array type
type EntityArray<T extends Entity> = T[];

// Find entity by ID
type FindEntity<T extends Entity, ID extends string> = T extends { id: ID } ? T : never;

// Service response type
type ServiceResponse<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

// Service function type
type ServiceFunction<TParams, TResult> = (params: TParams) => Promise<TResult>;

// Hook return type
type HookReturn<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

// Validation result type
type ValidationResult<T> = {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
  warnings: Partial<Record<keyof T, string>>;
};

// Form state type
type FormState<T> = {
  values: T;
  touched: Partial<Record<keyof T, boolean>>;
  errors: Partial<Record<keyof T, string>>;
  dirty: boolean;
  submitting: boolean;
};

// Paginated response type
type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Filter type
type Filter<T> = Partial<Record<keyof T, any>>;

// Sort type
type Sort<T> = {
  field: keyof T;
  direction: 'asc' | 'desc';
};

// Query params type
type QueryParams<T> = {
  filter?: Filter<T>;
  sort?: Sort<T>;
  page?: number;
  limit?: number;
};

// Barbership-specific types

// Service type with pricing
type BarberService = {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  category: string;
};

// Appointment type
type BarberAppointment = {
  id: string;
  customerId: string;
  barberId: string;
  services: Array<{ serviceId: string; price: number }>;
  date: Date;
  duration: number;
  totalPrice: number;
  status: 'scheduled' | 'completed' | 'cancelled';
};

// Customer type
type BarberCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  lastVisit?: Date;
};

// Barber type
type Barber = {
  id: string;
  name: string;
  services: string[]; // service IDs
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
};

// Inventory item type
type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  pricePerUnit: number;
  category: string;
  supplier?: string;
  lastRestocked?: Date;
};

// Revenue type
type RevenueRecord = {
  id: string;
  date: Date;
  amount: number;
  category: 'services' | 'products' | 'other';
  description?: string;
  barberId?: string; // commission tracking
};

// Commission calculation type
type CommissionCalculation = {
  barberId: string;
  period: {
    start: Date;
    end: Date;
  };
  services: Array<{
    serviceId: string;
    quantity: number;
    commission: number;
  }>;
  totalCommission: number;
};

// Export all types
export type {
  DeepPartial,
  DeepRequired,
  RequireKeys,
  PartialKeys,
  Path,
  GetByPath,
  DeepOmit,
  DeepPick,
  UnionToIntersection,
  Last,
  First,
  NonNullable,
  Awaited,
  ReturnTypeOf,
  ParametersOf,
  EventHandler,
  ReadonlyStrings,
  ApiResponse,
  PropsWithChildren,
  ComponentProps,
  GenericComponentProps,
  Entity,
  EntityArray,
  FindEntity,
  ServiceResponse,
  ServiceFunction,
  HookReturn,
  ValidationResult,
  FormState,
  PaginatedResponse,
  Filter,
  Sort,
  QueryParams,
  BarberService,
  BarberAppointment,
  BarberCustomer,
  Barber,
  InventoryItem,
  RevenueRecord,
  CommissionCalculation,
};

```

### Phase 3: Update Agent Skills (Using System)

Use the Orchestrator Agent to update skill definitions:

```markdown
# Update Agent Skills Prompt

**Task**: Update skills for 3 agents to include advanced TypeScript generics

**Agents to Update**:
1. Frontend Specialist - Add `typescript-generics-advanced` (level: expert)
2. System Architect - Add `typescript-generics-advanced` (level: expert)
3. Component Generator - Add `typescript-generics-intermediate` (level: advanced)

**New Skills to Define**:

## Skill: typescript-generics-advanced
- **Level**: expert
- **Description**: Expert-level TypeScript generics including advanced patterns, utility types, and type inference
- **Examples**:
  - Conditional types: `T extends U ? X : Y`
  - Mapped types: `{ [K in keyof T]: ... }`
  - Template literal types: `` `${Prefix}${K}` ``
  - Recursive types
  - Generic constraints
  - Type inference patterns
- **Use Cases**:
  - Creating reusable generic components
  - Type-safe API clients
  - Form validators
  - State management utilities

## Skill: typescript-generics-intermediate
- **Level**: advanced
- **Description**: Intermediate TypeScript generics using utility types and basic generic patterns
- **Examples**:
  - Utility types: `Pick`, `Omit`, `Partial`, `Required`, `Record`
  - Generic components with props constraints
  - Type parameters with default values
  - Generic functions
- **Use Cases**:
  - Reusable component patterns
  - Type-safe services
  - API response types

**Expected Output**:
- Updated SUB_AGENT_ARCHITECTURE.md with new skills
- Updated skill matrix for 3 agents
- Examples of how to use advanced generics in prompts
```

---

## 📊 Expected Impact

### Before Implementation
- Generic components: Limited or none
- Type safety in patterns: ~70%
- Code duplication: ~25%
- Development time: Baseline

### After Implementation
- Generic components: 10-15 new patterns
- Type safety in patterns: ~95%
- Code duplication: <10%
- Development time for features: **-30%**

### Example Use Cases Now Possible

1. **Generic List Component**
```typescript
const GenericList = <T extends Entity>(
  props: GenericComponentProps<T>
) => {
  return (
    <div className="space-y-2">
      {props.data.map((item, index) => (
        <div key={props.keyFn?.(item) || item.id}>
          {props.renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};
```

2. **Type-Safe API Service**
```typescript
const createService = <TParams, TResult>(
  endpoint: string
): ServiceFunction<TParams, TResult> => {
  return async (params: TParams): Promise<TResult> => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  };
};

// Usage
const appointmentService = createService<BarberAppointment, BarberAppointment>(
  '/api/appointments'
);
```

3. **Form Validator with Advanced Pattern**
```typescript
const validateForm = <T>(
  values: T,
  schema: Record<keyof T, (value: any) => string | null>
): ValidationResult<T> => {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const [key, validator] of Object.entries(schema)) {
    const error = validator(values[key as keyof T]);
    if (error) {
      errors[key as keyof T] = error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings: {},
  };
};
```

---

## 🎯 Success Metrics

### Quantitative
- [ ] Utility types library created with 30+ types
- [ ] 3 agents updated with new skills
- [ ] 10+ generic components created
- [ ] Code duplication reduced by 15%

### Qualitative
- [ ] Components are more reusable (similar patterns consolidated)
- [ ] Type safety increased (fewer 'any' types)
- [ ] Development feedback: "Generics make it easier to build features"

---

## 📝 Checklist for Completing This Gap

### Technical Tasks
- [ ] Create `src/types/utilities.ts` with 30+ utility types
- [ ] Update SUB_AGENT_ARCHITECTURE.md with new skill definitions
- [ ] Update 3 agent skill matrices
- [ ] Create examples of generic components using new types
- [ ] Update Component Generator prompts to use advanced generics
- [ ] Run TypeScript compiler to verify no errors
- [ ] Add tests for utility types

### Documentation Tasks
- [ ] Document new utility types (JSDoc comments)
- [ ] Create examples in codebase
- [ ] Update component documentation
- [ ] Update prompt templates for agents

### Testing Tasks
- [ ] Test utility types with real data
- [ ] Test generic components with different entity types
- [ ] Verify type-level errors catch bugs
- [ ] Measure code duplication before/after

---

## 🔗 Next Gaps

After completing Gap #8, consider these related gaps:

- **Gap #1**: Performance Analyzer Agent (advanced generics help optimize)
- **Gap #2**: API Documentation Agent (utility types auto-generate better docs)
- **Gap #12**: Feature Development Workflow (use generics for better automation)

---

## 💡 Lessons Learned

This example demonstrates:

1. **Upgrade approach**: Expand existing agent skills before creating new agents
2. **Library-first**: Create reusable utilities when closing technical gaps
3. **Documentation**: Keep docs updated alongside code
4. **Examples**: Show concrete use cases to prove value
5. **Metrics**: Track impact with data points

This pattern can be applied to close other gaps systematically.

---

**This example closes Gap #8 in ~3-5 days with high impact on framework capability.**

*For full gap analysis, see [GAPS_ANALYSIS_FINAL.md](./GAPS_ANALYSIS_FINAL.md)*
