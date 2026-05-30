# RBAC V1 - Role-Based Access Control

**Versão**: 1.0  
**Data**: 2026-03-28  
**Escopo**: BarberZap SaaS Multi-tenant

## Perfis de Acesso

| Perfil | Descrição | Tenant Scope |
|--------|-----------|--------------|
| `owner` | Dono da barbearia | Acesso total do próprio tenant |
| `employee` | Funcionário da barbearia | Acesso operacional do próprio tenant |

## Matriz de Permissões por Rota

### Dashboard
| Ação | Owner | Employee | Observação |
|-------|-------|----------|------------|
| Ver | ✅ | ✅ | Leitura de métricas gerais |

### Agenda
| Ação | Owner | Employee | Observação |
|-------|-------|----------|------------|
| Ver | ✅ | ✅ | Lista de agendamentos |
| Criar | ✅ | ✅ | Novo agendamento |
| Editar | ✅ | ✅ | Alterar horário/serviço |
| Cancelar | ✅ | ✅ | Cancelar agendamento |

### Serviços
| Ação | Owner | Employee | Observação |
|-------|-------|----------|------------|
| Ver | ✅ | ✅ | Lista de serviços |
| Criar | ✅ | ✅ | Novo serviço |
| Editar | ✅ | ✅ | Alterar preço/descrição |
| Inativar | ✅ | ✅ | Soft delete (active=false) |
| Reativar | ✅ | ✅ | Restaurar serviço inativo |
| Excluir (hard) | ✅ | ❌ | Apenas owner |

### Financeiro
| Ação | Owner | Employee | Observação |
|-------|-------|----------|------------|
| Ver resumo | ✅ | ❌ | Employee não acessa financeiro |
| Ver detalhes | ✅ | ❌ | Employee não acessa financeiro |
| Criar/Editar | ✅ | ❌ | Employee não acessa financeiro |

### AI Config
| Ação | Owner | Employee | Observação |
|-------|-------|----------|------------|
| Ver configuração | ✅ | ❌ | Employee não acessa IA config |
| Editar configuração | ✅ | ❌ | Employee não acessa IA config |
| Editar base conhecimento | ✅ | ❌ | Employee não acessa IA config |

### Settings
| Ação | Owner | Employee | Observação |
|-------|-------|----------|------------|
| Ver configurações | ✅ | ❌ | Employee não acessa settings |
| Editar configurações | ✅ | ❌ | Employee não acessa settings |

## Regras de Segurança Obrigatórias

### 1. Isolamento por Tenant
- Toda operação DEVE validar `tenant_id` do usuário
- Nenhum dado pode ser acessado sem escopo tenant válido
- Queries SEMPRE incluem `.eq('tenant_id', currentTenantId)`

### 2. Validação de Role
- Toda ação DEVE verificar role do usuário (`owner` ou `employee`)
- Guards de rota e ação aplicados em frontend e backend
- Sem autorização só via UI; backend também valida

### 3. Membership Ativa
- Acesso apenas se `membership.status = 'active'`
- Usuário inativo é bloqueado em qualquer ação

### 4. Auditoria de Alterações
- Registros sensíveis (`services`, `appointments`) DEVE incluir:
  - `updated_by` (user_id)
  - `updated_at` (timestamp)
  - `deleted_by` (user_id, quando soft delete)
  - `deleted_at` (timestamp, quando soft delete)

## Estratégia de Exclusão

### Soft Delete Padrão
- Tabelas críticas: `services`, `appointments`, `clients`
- Exclusão física: apenas `owner`
- Exclusão lógica: `active = false`
- Reativação permitida para `owner` e `employee` (em serviços)

## Regras Específicas por Módulo

### Serviços
- Employee: pode criar/editar/inativar/reativar
- Soft delete OBRIGATÓRIO para evitar perda irreversível
- Reativação só em serviços inativos do mesmo tenant

### Financeiro
- Employee: acesso totalmente bloqueado
- Owner: acesso completo
- Nenhum endpoint de financeiro pode ser acessado por employee

### AI Config
- Employee: acesso totalmente bloqueado
- Owner: acesso completo
- Configurações isoladas por tenant (base de conhecimento, tom de voz)

## Validação de Gates

### Gate 1 - RBAC Completo
- [ ] Todas as rotas críticas definidas na matriz
- [ ] Todas as ações mapeadas para owner/employee
- [ ] Regras de isolamento por tenant documentadas

### Gate 2 - Segurança Multi-tenant
- [ ] Queries com escopo tenant em todas as tabelas
- [ ] Políticas RLS definidas e validadas
- [ ] Validação server-side em todas as ações sensíveis

### Gate 3 - Auditoria Implementada
- [ ] Campos de auditoria definidos no schema
- [ ] Lógica de registro de alterações implementada
- [ ] Soft delete aplicado em tabelas críticas

## Status da Versão
- [ ] RBAC V1 congelada
- [ ] Em implementação
- [ ] Em validação
- [ ] Aprovado
- [ ] Em produção

**Aprovado por**: ______________  
**Data de aprovação**: ______________
