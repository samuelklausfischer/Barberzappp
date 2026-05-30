# 🤖 SUB-AGENT SYSTEM - Quick Reference

Este documento é um guia rápido para referenciar o Sistema de Sub-Agentes do Framework Painel Admin.

## 📚 Documentação Principal

A especificação completa está em: **[SUB_AGENT_ARCHITECTURE.md](./SUB_AGENT_ARCHITECTURE.md)**

## 🎯 Referência Rápida

### Agentes por Categoria

#### Orquestração (3)
- **Orchestrator** - Coordenação geral
- **Task Manager** - Gerenciamento de tasks
- **Project Lead** - Roadmap e milestones

#### Especialistas (8)
- **Frontend Specialist** - React, TypeScript, Components
- **System Architect** - Arquitetura e patterns
- **AI Specialist** - Integrações AI
- **Database Specialist** - Schemas, queries
- **Security Specialist** - Auth, validations
- **UI/UX Designer** - Design, acessibilidade
- **Testing Specialist** - Testes, quality
- **Performance Specialist** - Otimização
- **Integration Specialist** - APIs, webhooks

#### Execução (6)
- **Component Generator** - Cria componentes React
- **Hook Generator** - Cria custom hooks
- **Service Generator** - Implementa serviços
- **Test Generator** - Cria testes
- **Doc Generator** - Gera documentação
- **Config Generator** - Cria configs

#### Validação (3)
- **Code Reviewer** - Code review e qualidade
- **Linter/Formatter** - Fix linting issues

### Skills Necessárias

| Skill | Level | Agentes que Possuem |
|-------|-------|---------------------|
| React + TypeScript | Expert | Frontend Specialist, Component Generator |
| System Architecture | Expert | System Architect, Project Lead |
| Testing | Expert/Average | Testing Specialist, Test Generator |
| Security | Expert | Security Specialist |
| AI Integration | Advanced | AI Specialist |
| Performance | Advanced | Performance Specialist |

### Fluxo de Trabalho Padrão

```
User Request
    ↓
Orchestrator (analisa e planeja)
    ↓
Task Manager (quebra em subtarefas)
    ↓
Specialists (fornecem expertise)
    ↓
Execution Agents (implementam)
    ↓
Validation Agents (verificam)
    ↓
Orchestrator (agrega resultado)
```

### Context Management

| Agent Type | Context Needed | Size |
|------------|----------------|------|
| Orchestrator | Completo | Máximo (~50k tokens) |
| Specialist | Domain-specific | Alto (~20k tokens) |
| Execution | Task-focused | Médio (~10k tokens) |
| Validation | Artifact + criteria | Baixo (~5k tokens) |

## 🔗 Links Importantes

- [SUB_AGENT_ARCHITECTURE.md](./SUB_AGENT_ARCHITECTURE.md) - Arquitetura completa
- [MAP.md](./MAP.md) - Mapa do projeto
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema
- [START_HERE.md](./START_HERE.md) - Guia de onboarding

## 📊 Métricas do Sistema

- **Total de Agents**: 20
- **Layers**: 4 (Orchestration, Specialist, Execution, Validation)
- **Skills Definidas**: ~25
- **Prompts Templates**: 15+
- **Workflows**: 6 padrões principais
- **Context Sharing**: Delta Updates + Lazy Loading

---

**Document Version**: 1.0
**Last Updated**: 2026-03-03
