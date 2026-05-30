# 📊 SUB-AGENT SYSTEM - Diagramas Visuais

Este documento contém diagramas visuais (ASCII art) para entender o Sistema de Sub-Agentes.

---

## HIERARQUIA DE AGENTS

```
 ╔═══════════════════════════════════════════════════════════════════════════╗
 ║                         ORCHESTRATION LAYER                                ║
 ║  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐     ║
 ║  │   Orchestrator   │   │   Task Manager   │   │   Project Lead   │     ║
 ║  │      Agent       │   │      Agent       │   │      Agent       │     ║
 ║  │  (Coordenação)   │   │  (Gerenciamento) │   │   (Roadmap)      │     ║
 ║  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘     ║
 ╚═══════════╪═════════════════════╪═════════════════════╪═════════════════╝
             │                   │                   │
             ▼                   ▼                   ▼
 ╔═══════════════════════════════════════════════════════════════════════════╗
 ║                       SPECIALIST LAYER (9 Agents)                         ║
 ║  ┌────────────┬────────────┬────────────┬────────────┬────────────┐     ║
 ║  │  Frontend  │   System   │     AI     │  Database  │  Security  │     ║
 ║  │ Specialist │  Architect │ Specialist │ Specialist │ Specialist │     ║
 ║  └──────┬─────┴──────┬─────┴──────┬─────┴──────┬─────┴──────┬─────┘     ║
 ║  ┌────────────┼────────────┼────────────┼────────────┼────────────┐     ║
 ║  │   UI/UX    │  Testing   │Performance │Integration │            │     ║
 ║  │  Designer  │ Specialist │ Specialist │ Specialist │            │     ║
 ║  └──────┬─────┴──────┬─────┴──────┬─────┴──────┬─────┴────────────┘     ║
 ╚═════════╪════════════╪════════════╪════════════╪═════════════════════════╝
           │           │           │           │
           └───────────┴───────────┴───────────┘
                       │
 ╔══════════════════════╪═══════════════════════════════════════════════════╗
 ║                    EXECUTION LAYER (6 Agents)                            ║
 ║  ┌─────────────┬─────────────┬─────────────┬─────────────┬───────────┐  ║
 ║  │ Component  │   Hook      │  Service    │    Test     │  Doc      │  ║
 ║  │ Generator  │  Generator  │  Generator  │  Generator  │ Generator │  ║
 ║  └─────────────┴─────────────┴─────────────┴─────────────┴───────────┘  ║
 ║  ┌─────────────┬─────────────┐                                          ║
 ║  │    Config   │             │                                          ║
 ║  │  Generator  │             │                                          ║
 ║  └─────────────┴─────────────┘                                          ║
 ╚════════════════╪═════════════════════════════════════════════════════════╝
                  │
 ┌────────────────┴────────────────────────────────────────────────────────┐
 │                  VALIDATION LAYER (3 Agents)                             │
 │  ┌─────────────┬─────────────┬─────────────┐                          │
 │  │  Code       │  Linter/    │             │                          │
 │  │  Reviewer   │  Formatter  │    (others) │                          │
 │  └─────────────┴─────────────┴─────────────┘                          │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## WORKFLOW PADRÃO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER REQUEST                                    │
│                  "Criar Dashboard component"                              │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT                                   │
│  1. Analisa request                                                        │
│  2. Identifica domínio (Frontend)                                         │
│  3. Cria plano de execução                                                │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
        ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
                            │ Phase 1: Design
┌───────────────────────────┴─────────────────────────────────────────────┐
│                          SPECIALIST(S)                                   │
│  ├─ Frontend Specialist (component architecture)                         │
│  └─ UI/UX Designer (visual design)                                        │
│                                                                          │
│  Output: Specs, TypeScript interfaces, Design mockup                     │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
        ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
                            │ Phase 2: Implementation
┌───────────────────────────┴─────────────────────────────────────────────┐
│                       EXECUTION AGENT(S)                                 │
│  1. Component Generator (implementa Dashboard.tsx)                        │
│  2. Hook Generator (cria useDashboard hook)                              │
│  3. Test Generator (cria Dashboard.test.tsx)                              │
│  4. Doc Generator (gera documentação)                                     │
│                                                                          │
│  Output: Código funcional, testes, docs                                   │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
        ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
                            │ Phase 3: Validation
┌───────────────────────────┴─────────────────────────────────────────────┐
│                      VALIDATION AGENT(S)                                 │
│  ├─ Code Reviewer (review de qualidade)                                  │
│  └─ Linter/Formatter (check linting, fix auto)                           │
│                                                                          │
│  Output: Validation report, Código corrigido                              │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
        ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
                            │ validation pass?
                            ├─ YES → Proceed
                            └─ NO  → Loop back to Execution
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT (final)                           │
│  Agrega todos os resultados e gera resposta final                        │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FINAL DELIVERABLE                                 │
│  - Component code files                                                  │
│  - Test files                                                            │
│  - Documentation                                                         │
│  - Validation reports                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## COLABORAÇÃO MULTI-ESPECIALISTA

```
Task: Criar feature de autenticação completa
       (frontend UI + backend API + security + integration)

┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR                                   │
│  Identify multiple domains needed...                                     │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────────────┐
         │                                                  │
         ▼                                                  ▼
┌────────────────────┐                            ┌────────────────────┐
│ Frontend Specialist│                            │  Security Specialist│
│                    │                            │                    │
│ Tasks:             │                            │ Tasks:             │
│ - Login UI Component│                            │ - Auth flows       │
│ - Protected Routes  │                            │ - Token management │
│ - User display      │                            │ - Input validation │
└──────┬─────────────┘                            └──────┬─────────────┘
       │                                                │
       │ Results                                        │ Results
       │ props specs                                    │ security specs
       │ UI design patterns                             │ auth requirements
       │                                                │
       └────────────────────────┬───────────────────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │  Orchestrator     │
                     │  Merge specs      │
                     └────────┬───────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Execution Agents                                  │
│                                                                          │
│  1. Component Generator (Login form UI)                                  │
│  2. Service Generator (Auth service)                                     │
│  3. Hook Generator (useAuth hook)                                        │
│  4. Component Generator (ProtectedRoute component)                       │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Validation Agents                                 │
│  Code Reviewer (review all components)                                   │
│  Security Specialist (review auth for vulnerabilities)                   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       FINAL INTEGRATION                                  │
│  Complete auth feature with frontend, backend, and security              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## REVIEW & ITERATION LOOP

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Execution Agent                                       │
│                                                                          │
│  Task: Implement StatsCard component                                     │
│  ─────────────────────────────────                                      │
│  const StatsCard = ({ label, value }: Props) => {                       │
│    return (                                                              │
│      <div className="card">                                              │
│        <h2>{label}</h2>                                                 │
│        <p>{value}</p>                                                    │
│      </div>                                                              │
│    );                                                                    │
│  };                                                                      │
│                                                                          │
│  ✅ Code Generated                                                      │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Validation Agent (Code Reviewer)                      │
│                                                                          │
│  Checking...                                                            │
│  ✅ Types correct                                                       │
│  ✅ Renders cleanly                                                     │
│  ❌ Missing icon prop support                                           │
│  ❌ No accessibility attributes                                         │
│  ❌ Missing trend indicator (required)                                  │
│                                                                          │
│  Status: FAILED ❌                                                       │
│  Feedback sent to Execution Agent                                       │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            │ Feedback
                            ├─ Add icon prop support
                            ├─ Add ARIA labels
                            └─ Add trend indicator
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Execution Agent (v2)                                  │
│                                                                          │
│  Iterating based on feedback...                                         │
│  ─────────────────────────────────                                      │
│  const StatsCard = ({ label, value, icon, trend }: Props) => {          │
│    return (                                                              │
│      <div className="card" role="article" aria-label={label}>          │
│        {icon && <Icon name={icon} aria-hidden="true" />}                │
│        <h2>{label}</h2>                                                 │
│        <p>{value}</p>                                                    │
│        {trend && <TrendBadge {...trend} />}                             │
│      </div>                                                              │
│    );                                                                    │
│  };                                                                      │
│                                                                          │
│  ✅ Code Revised                                                       │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Validation Agent (Review)                              │
│                                                                          │
│  Checking...                                                            │
│  ✅ Types correct (added icon, trend)                                    │
│  ✅ Renders cleanly                                                     │
│  ✅ Icon prop implemented                                               │
│  ✅ ARIA attributes present                                             │
│  ✅ Trend indicator implemented                                         │
│                                                                          │
│  Status: PASSED ✅                                                       │
│  Component approved for delivery                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Task: Create Dashboard Feature                       │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │  DESIGN PHASE    │
                         └────────┬─────────┘
                                  │
      ┌───────────────────────────┼──────────────────────────┐
      │                           │                          │
      ▼                           ▼                          ▼
┌──────────┐              ┌──────────┐              ┌──────────┐
│ Task 1   │              │ Task 2   │              │ Task 3   │
│Architect │              │Frontend  │              │ UI/UX    │
│ Design   │              │ Specs    │              │ Design   │
└─────┬────┘              └─────┬────┘              └─────┬────┘
      └─────────────────────┬──────┴────────────────────┘
                            │
                            ▼
                         ┌──────────────────┐
                         │ IMPLEMENTATION   │
                         │     PHASE        │
                         └────────┬─────────┘
                                  │
      ┌───────────────────────────┼──────────────────────────┐
      │                           │                          │
      ▼                           ▼                          ▼
┌──────────┐              ┌──────────┐              ┌──────────┐
│ Task 4   │              │ Task 5   │              │ Task 6   │
│ Implement│              │ Implement│              │ Implement│
│StatsCard │            ────►Charts │            ────►Dashboard│
└─────┬────┘              └─────┬────┘              └─────┬────┘
      │                           │                          │
      │                           │                          │
      │                           │                          ▼
      │                           │                   ┌──────────┐
      │                           │                   │ Task 7   │
      │                           │                   │ Implement│
      │                           │                   │ Hooks    │
      │                           │                   └─────┬────┘
      │                           │                         │
      │                           │                         │
      └────────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    TESTING       │
                         │     PHASE        │
                         └────────┬─────────┘
                                  │
      ┌───────────────────────────┼──────────────────────────┐
      │                           │                          │
      ▼                           ▼                          ▼
┌──────────┐              ┌──────────┐              ┌──────────┐
│ Task 8   │              │ Task 9   │              │ Task 10  │
│ Test     │              │ Test     │              │ Test     │
│StatsCard │              │ Charts   │              │ Dashboard│
└─────┬────┘              └─────┬────┘              └─────┬────┘
      └─────────────────────┬──────┴────────────────────┘
                            │
                            ▼
                         ┌──────────────────┐
                         │    VALIDATION    │
                         │     PHASE        │
                         └────────┬─────────┘
                                  │
      ┌───────────────────────────┼──────────────────────────┐
      │                           │                          │
      ▼                           ▼                          ▼
┌──────────┐              ┌──────────┐              ┌──────────┐
│ Task 11  │              │ Task 12  │              │ Task 13  │
│ Code     │              │ Linter   │              │ Security │
│ Review   │              │ Fix      │              │ Check    │
└─────┬────┘              └─────┬────┘              └─────┬────┘
      └─────────────────────┬──────┴────────────────────┘
                            │
                            ▼
                         ┌──────────────────┐
                         │    DELIVERY      │
                         │      PHASE       │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │                  │
                         │  COMPLETE ✅     │
                         │                  │
                         └──────────────────┘

Legend:
───► Sequential dependency (must complete before others)
╞═══╡ Parallel (can execute independently)
❌ Blocked task
✅ Completed task
⏳ In Progress
⭕ Pending
```

---

## MESSAGE BUS FLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MESSAGE BUS                                     │
│                        (Agent Communication)                             │
└─────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────┐
                           │  Message Queue  │
                           │                 │
                           │  Publish/Subscribe│
                           └────────┬────────┘
                                    │
      ┌───────────────────┬────────┴────────┬──────────────────┐
      │                   │                 │                  │
      ▼                   ▼                 ▼                  ▼
┌───────────┐       ┌───────────┐     ┌───────────┐      ┌───────────┐
│Orchestrator│       │ Specialist│     │ Execution │      │Validation │
│  Agent    │◄──────►│  Agents   │◄───►│  Agents   │◄────►│  Agents   │
└───────────┘       └───────────┘     └───────────┘      └───────────┘
       │                   │                 │                  │
       │                   │                 │                  │
       └───────────────────┴─────────────────┴──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Message Broker │
                  │                 │
                  │  - Routing     │
                  │  - Filtering   │
                  │  - Buffering   │
                  │  - Ack/Nack    │
                  └─────────────────┘

Message Types:
═══════════════════════════════════════════════════════════

1. COMMAND: "Do this action"
   { type: 'command', from: 'orchestrator', to: 'specialist',
     payload: { action: 'createComponent', spec: {...} } }

2. QUERY: "Get information"
   { type: 'query', from: 'execution', to: 'specialist',
     payload: { question: 'What pattern to use?' } }

3. EVENT: "Something happened"
   { type: 'event', from: 'execution',
     payload: { event: 'taskCompleted', taskId: '123' } }

4. RESPONSE: "Here's the answer/result"
   { type: 'response', from: 'specialist', to: 'orchestrator',
     payload: { result: {...} } }

Flow Example:
═══════════════════════════════════════════════════════════

1. Orchestrator → Specialist (COMMAND)
   "Create component spec for Dashboard"

2. Specialist → Orchestrator (RESPONSE)
   "Here's the spec: {...}"

3. Orchestrator → Execution (COMMAND)
   "Implement StatsCard with this spec"

4. Execution → Orchestrator (EVENT)
   "StatsCard implementation complete"

5. Orchestrator → Validation (COMMAND)
   "Review StatsCard implementation"

6. Validation → Orchestrator (RESPONSE)
   "Review passed with minor notes"
```

---

## STATE MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SHARED STATE                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PROJECT STATE                                                            │
│  ├─ phase: 'implementation'                                             │
│  ├─ currentTask: 'create-dashboard'                                     │
│  ├─ progress: 45%                                                       │
│  └─ filesCreated: ['StatsCard.tsx', 'Dashboard.tsx']                    │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  TASKS STATE                                                             │
│  ├─ task-1: { status: 'completed', agent: 'frontend-specialist' }      │
│  ├─ task-2: { status: 'in-progress', agent: 'component-generator' }    │
│  └─ task-3: { status: 'pending', agent: 'test-generator' }             │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ARTIFACTS STATE                                                         │
│  ├─ artifact-1: { type: 'component', path: 'StatsCard.tsx',           │
│  │              file: {...}, validated: true }                          │
│  └─ artifact-2: { type: 'test', path: 'StatsCard.test.tsx',           │
│  │              file: {...}, validated: false }                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  DECISIONS STATE                                                         │
│  └─ decision-1: { type: 'architecture', agent: 'system-architect',    │
│                  value: 'Use container/presentation pattern' }          │
└─────────────────────────────────────────────────────────────────────────┘

State Transitions:
═══════════════════════════════════════════════════════════

analysis → design → implementation → validation → deployment
    ↑                                           ↓
    └───────────────────────────── iteration ←─┘

Agents read/write to state based on:
- Their layer (Orchestrators read/write all, Execution reads task-specific)
- Their domain (Frontend reads frontend state)
- Their permissions (Validation only validates, doesn't modify)
```

---

## CONTEXT SHARING ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTEXT SHARING                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ProjectContext (Shared by all agents)                                   │
│  ├─ name: 'Framework Painel Admin'                                     │
│  ├─ stack: { frontend: 'React 19', ... }                               │
│  ├─ architecture: 'feature-first'                                      │
│  ├─ conventions: { naming: 'PascalCase', ... }                         │
│  └─ files: { folders: {...}, keyFiles: [...] }                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ REFERENCE (immutable)
                              │
          ╔══════════════════╧═══════════════════════════════════════════╗
          ║                    Orchestration Agents                       ║
          ║             Receive: Full Context (~50k tokens)               ║
          ╚═════════════════════════════════════════════════════════════╝
                              │
                              │ FILTER BY DOMAIN
                              │
          ╔══════════════════╧═══════════════════════════════════════════╗
          ║                    Specialist Agents                          ║
          ║             Receive: Domain Context (~20k tokens)             ║
          ╚═════════════════════════════════════════════════════════════╝
                              │
                              │ FILTER BY TASK
                              │
          ╔══════════════════╧═══════════════════════════════════════════╗
          ║                    Execution Agents                           ║
          ║             Receive: Task Context (~10k tokens)               ║
          ╚═════════════════════════════════════════════════════════════╝
                              │
                              │ FILTER BY ARTIFACT
                              │
          ╔══════════════════╧═══════════════════════════════════════════╗
          ║                    Validation Agents                          ║
          ║             Receive: Artifact + Criteria (~5k tokens)         ║
          ╚═════════════════════════════════════════════════════════════╝

Sharing Strategies:
═══════════════════════════════════════════════════════════

1. REFERENCE SHARING
   - Project context sent once
   - Subsequent agents receive reference only
   - Checksum validates no changes

2. DELTA UPDATES
   - Only changes transmitted
   - Compact format
   - Reduces token usage

3. LAZY LOADING
   - Load sections on demand
   - Initial context: task specs only
   - On request: load additional context

Example:
═══════════════════════════════════════════════════════════

Agent 1 (Orchestrator):
  Context: Complete (100%)

Agent 2 (Frontend Specialist):
  Context: frontend-related sections only (40%)

Agent 3 (Component Generator):
  Context: minimal - just task specs (10%)

Agent 4 (Code Reviewer):
  Context: artifact + validation criteria (5%)
```

---

**Document Version**: 1.0
**Last Updated**: 2026-03-03
**Related**: See [SUB_AGENT_ARCHITECTURE.md](./SUB_AGENT_ARCHITECTURE.md) for full details
