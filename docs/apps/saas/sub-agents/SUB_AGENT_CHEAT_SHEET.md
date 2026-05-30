# 🎴 SUB-AGENT SYSTEM - Cheat Sheet

Guia de bolso rápido para referenciar o System de Sub-Agents.

---

## AGENTS QUICK REFERENCE

### 🔵 ORCHESTRATION (3)

| Agent | Skills | Context Size | Primary Output |
|-------|--------|--------------|----------------|
| **Orchestrator** | Task breakdown, coordination | Max (~50k) | Execution plans, coordination |
| **Task Manager** | Task management, tracking | Medium (~15k)| Task status, progress |
| **Project Lead** | Project planning, milestones | Medium (~20k)| Roadmap updates |

### 🟣 SPECIALIST (9)

| Agent | Domain | Skills | When to Use |
|-------|--------|--------|-------------|
| **Frontend Specialist** | React + TS | ts-react, hooks, patterns | Component architecture, UI specs |
| **System Architect** | Architecture | design-principles, layered-arch | Overall system design, patterns |
| **AI Specialist** | AI Integration | ai-integration, prompts | AI features, prompts, streaming |
| **Database Specialist** | Data | db-design, sql | Schemas, data models |
| **Security Specialist** | Security | auth, validation | Auth flows, input validation |
| **UI/UX Designer** | Design | ui-design, accessibility | UX flows, visual design |
| **Testing Specialist** | Testing | vitest, rtl | Test strategies, coverage |
| **Performance Specialist** | Performance | optimization, profiling | Performance issues, optimization |
| **Integration Specialist** | Integrations | apis, webhooks | External APIs, services |

### 🟢 EXECUTION (6)

| Agent | Creates | Skills | Output Format |
|-------|---------|--------|---------------|
| **Component Generator** | React Components | ts-react, hooks | .tsx files |
| **Hook Generator** | Custom Hooks | react-hooks, generics | .ts/.tsx files |
| **Service Generator** | Services/APIs | typescript, apis | .ts files |
| **Test Generator** | Tests | vitest, rtl | .test.tsx/.test.ts files |
| **Doc Generator** | Documentation | markdown, writing | .md, JSDoc |
| **Config Generator** | Config Files | build-tools, tsconfig | .json, .js configs |

### 🟡 VALIDATION (3)

| Agent | Validates | Skills | Output |
|-------|-----------|--------|--------|
| **Code Reviewer** | Quality | patterns, linting | Review report |
| **Linter/Formatter** | Linting/Format | eslint, prettier | Fixed code |

---

## WORKFLOW PATTERNS

### 1. Simple Task (1 agent)
```
User Request → Orchestrator → Specialist → Execution → Validation → Result
```

### 2. Component Creation
```
Orchestrator
  ├─→ Frontend Specialist (specs)
  ├─→ UI/UX Designer (design)
  └─→ Component Generator (implement)
       └─→ Code Reviewer (review)
```

### 3. Complex Feature
```
Orchestrator
  ├─→ System Architect (architecture)
  ├─→ Frontend Specialist (frontend specs)
  ├─→ Backend/API Specialist (API specs)
  └─→ Security Specialist (security)
       ↓
  Multiple Execution Agents (parallel)
       ↓
  Code Reviewer → Linter
```

---

## SKILL REQUIREMENTS MATRIX

### Creating a Component ✏️
```
Required Skills:
- ts-react (level: expert)
- react-hooks (level: advanced)
- typography (level: intermediate)

Agent Chain:
Frontend Specialist → Component Generator → Code Reviewer
```

### Creating a Hook 🪝
```
Required Skills:
- react-hooks (level: expert)
- typescript-generics (level: advanced)

Agent Chain:
Frontend Specialist → Hook Generator → Code Reviewer
```

### Creating Tests 🧪
```
Required Skills:
- testing (level: expert)
- vitest (level: advanced)

Agent Chain:
Testing Specialist → Test Generator → Code Reviewer
```

### Integrating AI 🤖
```
Required Skills:
- ai-integration (level: advanced)
- prompt-engineering (level: advanced)

Agent Chain:
AI Specialist → Service Generator → Code Reviewer → Validation
```

---

## COMMON AGENT SEQUENCES

### Sequence: New Feature
```
1. Orchestrator (analyze request)
2. System Architect (design architecture)
3. Domain Specialist(s) (provide specs)
4. Execution Agents (implement)
5. Code Reviewer (review)
6. Test Generator (create tests)
7. Orchestrator (aggregate)
```

### Sequence: Bug Fix
```
1. Orchestrator (analyze bug)
2. Debugger Agent (identify cause)
3. Execution Agent (implement fix)
4. Testing Specialist (verify fix)
5. Code Reviewer (review)
```

### Sequence: Documentation
```
1. Orchestrator (identify what's needed)
2. Domain Specialist (provide details)
3. Doc Generator (write docs)
4. Linter/Formatter (format)
```

---

## DECISION TREE: WHICH AGENT TO USE?

### Question: What type of task?

```
START
  │
  ├── Planning/design, not coding?
  │   └─→ System Architect
  │
  ├── Architecture decisions?
  │   └─→ System Architect
  │
  ├── UI/UX design?
  │   └─→ UI/UX Designer
  │
  ├── Component coding?
  │   └─→ Component Generator
  │
  ├── Creating a hook?
  │   └─→ Hook Generator
  │
  ├── API/service integration?
  │   └─→ Service Generator
  │       └─→ (precede with Integration Specialist)
  │
  ├── Creating tests?
  │   └─→ Test Generator
  │       └─→ (precede with Testing Specialist)
  │
  ├── Writing docs?
  │   └─→ Doc Generator
  │
  ├── Reviewing code quality?
  │   └─→ Code Reviewer
  │
  ├── AI integration?
  │   └─→ AI Specialist → Service Generator
  │
  ├── Security concerns?
  │   └─→ Security Specialist
  │
  ├── Performance issues?
  │   └─→ Performance Specialist
  │
  └── Need to coordinate multiple?
      └─→ Orchestrator
```

---

## PROMPT TEMPLATES QUICK REFERENCE

### Orchestrator Prompt
```markdown
# ROLE: Orchestrator Agent
- Analyze task
- Break into subtarefas
- Assign to agents
- Coordinate execution
- Aggregate results
```

### Specialist Prompt
```markdown
# ROLE: {Domain} Specialist
- Analyze from domain perspective
- Provide architecture/specs
- Best practices recommendations
- Implementation notes
```

### Execution Prompt
```markdown
# ROLE: {Type} Generator
- Implement following specs
- Follow project conventions
- Use TypeScript strict mode
- Export types appropriately
```

### Validation Prompt
```markdown
# ROLE: Code Reviewer
- Check quality and patterns
- Verify TypeScript compliance
- Suggest improvements
- Report issues with severity
```

---

## HANDLING COMMON ISSUES

### Conflict Between Specialists
```
1. Log decision context
2. Compare skill levels
3. Check project precedents
4. Orchestrator decides
5. Document reasoning
```

### Dependency Cycle
```
1. Identify circular dependency
2. Refactor to break cycle
3. Re-order tasks
4. Update dependency graph
5. Proceed with execution
```

### Validation Fails
```
1. Collect detailed feedback
2. Return to execution agent
3. Agent iterates based on feedback
4. Re-validate
5. If still fails → Escalate
```

### Missing Context
```
1. Identify what's missing
2. Request from shared state
3. If not available → Ask user
4. Update context for future
5. Proceed with task
```

---

## METRICS TO TRACK

### Agent Performance
- Tasks completed
- Success rate (pass validation)
- Quality score (from reviews)
- Average execution time
- Skill level improvements

### System Health
- Average tokens per agent call
- Failure rate
- Error types distribution
- Agent usage frequency
- Collaboration patterns

### Project Progress
- Features implemented
- Code coverage
- Documentation completeness
- Issue resolution rate
- Milestone completion

---

## QUICK COMMANDS

### Analyze New Feature
```
Orchestrator agent: "Analyze feature X and create execution plan"
```

### Create Component
```
Frontend Specialist (specs) → Component Generator (implement)
```

### Fix Bug
```
Debug → Identify culprit → Fix → Test
```

### Add Documentation
```
Doc Generator → what needs docs?
```

### Code Review
```
Code Reviewer → review files: [list]
```

---

## CONTACT FOR HELP

- **Orchestrator**: Complex tasks, coordination
- **System Architect**: Design decisions, patterns
- **Domain Specialists**: Domain-specific questions
- **Execution Agents**: Implementation issues

---

## VERSION INFO

**Version**: 1.0
**Last Updated**: 2026-03-03
**Full Docs**: [SUB_AGENT_ARCHITECTURE.md](./SUB_AGENT_ARCHITECTURE.md)

---

## TIP: Use this sheet as a reference when:

- ✗ Unsure which agent to use
- ✗ Designing a new workflow
- ✗ Debugging agent issues
- ✗ Planning agent interactions
- ✗ Selecting skills for new tasks
