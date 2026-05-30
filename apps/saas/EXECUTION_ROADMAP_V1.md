# EXECUTION_ROADMAP_V1 - Plano de Execução

**Versão**: 1.0  
**Data**: 2026-03-28  
**Escopo**: BarberZap SaaS Multi-tenant (8 semanas)

## Visão Geral

**Objetivo**
- Atualizar frontend para 100% backend real (Supabase)
- Garantir isolamento multi-tenant absoluto
- Implementar RBAC owner/employee
- Separar métricas de previsão vs realizado
- Manter zero vazamento de dados entre barbearias

**Fases**: 6 (Fase 0 a Fase 6)  
**Duração**: 8 semanas

---

## Fase 0 — Congelamento de Governança (Semana 1) ✅

### Objetivo
Consolidar regras, contratos e critérios de aceite antes da implementação.

### Entregas
- [x] `RBAC_V1` (matriz de permissões)
- [x] `PROMPTS_FACTORY_V1` (blueprint de prompts)
- [x] `SKILLS_SOP_V1` (SOP de skills)
- [x] `GOVERNANCE_REPORT_V1` (relatório de aprovação)

### Gate
- Nenhum item P0 sem plano aprovado
- Todos os gates A-E passaram

### Status
**CONCLUÍDO** ✅

---

## Fase 1 — Auth + Tenant Context (Semana 2)

### Objetivo
Implementar autenticação real com vínculo multi-tenant.

### Entregas

#### T1: Modelo de Dados de Membership
**Subagente**: `PA-AuthRBAC`
**Descrição**: Implementar tabela `tenant_memberships` para vincular user ↔ tenant ↔ role
**Entrada**: RBAC V1 (matriz de permissões)
**Saída**: Tabela criada com colunas: user_id, tenant_id, role, status, created_at
**Gate**: Tabela criada com migrations aplicadas
**Risco**: Baixo

#### T2: Fluxo de Sessão
**Subagente**: `PA-AuthRBAC`
**Descrição**: Implementar fluxo de auth que resolve role e tenant do usuário
**Entrada**: Supabase Auth configurado
**Saída**: Contexto de sessão com { user, tenant, role }
**Gate**: Login → membership → role → contexto funcionando
**Risco**: Baixo

#### T3: Guards de Rota e Ação
**Subagente**: `PA-AuthRBAC`
**Descrição**: Implementar guards por rota (ex.: `/finance` só owner) e ação (ex.: `delete` só owner)
**Entrada**: RBAC V1
**Saída**: Guards aplicados em router.tsx e componentes
**Gate`: Employee bloqueado em rotas/ações restritas
**Risco**: Médio (risco de inconsistência frontend/backend)

### Gate Fase 1
- [ ] Tabela `tenant_memberships` criada
- [ ] Fluxo de sessão funcionando
- [ ] Guards implementados e consistentes com RBAC V1
- [ ] Autenticação real funcionando com owner/employee

### Riscos e Mitigação
- **Risco**: Inconsistência entre guards frontend e backend
  - **Mitigação**: Matriz RBAC V1 única versionada; testar guards de ambos os lados
- **Risco**: Membership não existe para usuário
  - **Mitigação**: Tratar como erro de autenticação com mensagem clara

---

## Fase 2 — Guardas de Frontend e Experiência (Semana 3)

### Objetivo
Aplicar guards de rota/ação no frontend e padronizar estados de UI.

### Entregas

#### T4: Guards de Rota
**Subagente**: `PA-FrontendSync`
**Descrição**: Aplicar guards de rota para bloquear employee de áreas restritas
**Entrada**: RBAC V1 + guards definidos na Fase 1
**Saída**: Router.tsx com guards por rota
**Gate**: `/finance` e `/aiconfig` bloqueados para employee
**Risco**: Baixo

#### T5: Guards de Ação
**Subagente**: `PA-FrontendSync`
**Descrição**: Aplicar guards de ação para bloquear employee de ações restritas
**Entrada**: RBAC V1
**Saída**: Componentes com guards por ação (botões, links)
**Gate**: Employee não consegue deletar serviço, acessar financeiro, alterar AI config
**Risco**: Médio

#### T6: Estados de UI Padronizados
**Subagente**: `PA-FrontendSync`
**Descrição**: Padronizar `loading/error/empty/success` nas telas principais
**Entrada**: Lista de telas críticas
**Saída**: Telas com LoadingSkeleton, ErrorState, EmptyState implementados
**Gate**: Todas as telas críticas com estados completos
**Risco**: Baixo

### Gate Fase 2
- [ ] Guards de rota aplicados
- [ ] Guards de ação aplicados
- [ ] Estados de UI padronizados
- [ ] Employee bloqueado de áreas restritas

### Riscos e Mitigação
- **Risco**: Estado de UI não tratado
  - **Mitigação**: Checklist obrigatório por tela
- **Risco**: Guards inconsistentes
  - **Mitigação**: Validar contra RBAC V1

---

## Fase 3 — Segurança e Isolamento (Semana 4)

### Objetivo
Garantir isolamento multi-tenant absoluto com políticas RLS.

### Entregas

#### T7: Auditoria de Queries e Hooks
**Subagente**: `PA-TenantSecurity`
**Descrição**: Auditar todas as queries e hooks para garantir escopo tenant
**Entrada**: Lista de hooks e tabelas sensíveis
**Saída**: Matriz de queries com/sem filtro tenant
**Gate**: Todas as queries sensíveis com filtro `tenant_id`
**Risco**: Baixo

#### T8: Revisão de Políticas RLS
**Subagente**: `PA-TenantSecurity`
**Descrição**: Revisar e corrigir políticas RLS do Supabase
**Entrada**: Lista de tabelas sensíveis
**Saída**: Políticas RLS atualizadas e validadas
**Gate**: Cada tabela sensível com política RLS ativa
**Risco**: Médio

#### T9: Simulação de Ataque Cross-Tenant
**Subagente**: `PA-TenantSecurity`
**Descrição**: Simular tentativas de acesso cross-tenant
**Entrada**: Lista de tenants
**Saída**: Relatório de vulnerabilidades encontradas
**Gate**: Nenhuma vulnerabilidade CRÍTICA sem correção
**Risco**: Médio

### Gate Fase 3
- [ ] Queries e hooks com escopo tenant
- [ ] Políticas RLS validadas
- [ ] Ataques cross-tenant simulados e mitigados
- [ ] Nenhum risco P0 sem plano de correção

### Riscos e Mitigação
- **Risco**: Query antiga sem filtro
  - **Mitigação**: Revisão linha por linha de todos os hooks
- **Risco**: Política RLS ausente
  - **Mitigação**: Checklist de políticas por tabela sensível

---

## Fase 4 — Serviços CRUD completo para Employee (Semana 5)

### Objetivo
Liberar employee para gerir serviços com soft delete e reativação.

### Entregas

#### T10: Serviços CRUD para Employee
**Subagente**: `PA-FrontendSync`
**Descrição**: Implementar create/edit/inactivate/reactivate para employee em serviços
**Entrada**: RBAC V1 + hooks existentes (useServices)
**Saída**: ServicesList.tsx com CRUD completo para employee
**Gate**: Employee consegue criar/editar/inativar/reativar serviços
**Risco**: Baixo

#### T11: Soft Delete
**Subagente**: `PA-FrontendSync`
**Descrição**: Implementar soft delete em serviços (active=false)
**Entrada**: RBAC V1
**Saída**: Exclusão de serviço usa `update({ active: false })`
**Gate**: Soft delete implementado, hard delete apenas para owner
**Risco**: Baixo

#### T12: Auditoria de Alterações
**Subagente**: `PA-FrontendSync`
**Descrição**: Implementar registro de alterações em serviços
**Entrada**: RBAC V1
**Saída**: Campos updated_by, updated_at, deleted_by, deleted_at preenchidos
**Gate**: Auditoria funcionando em toda alteração de serviço
**Risco**: Baixo

### Gate Fase 4
- [ ] CRUD completo para employee
- [ ] Soft delete implementado
- [ ] Auditoria de alterações funcionando
- [ ] Employee consegue gerir serviços sem erro

### Riscos e Mitigação
- **Risco**: Hard delete usado por engano
  - **Mitigação**: Documentar regra de soft; revisar PRs de exclusão
- **Risco**: Auditoria não registrada
  - **Mitigação**: Implementar trigger ou lógica de registro obrigatória

---

## Fase 5 — Bloqueios de Acesso (Finance e AI Config) (Semana 6)

### Objetivo
Garantir que employee não acessa financeiro e AI config.

### Entregas

#### T13: Bloqueio de Financeiro
**Subagente**: `PA-FrontendSync`
**Descrição**: Bloquear rota `/finance` para employee (UI + backend)
**Entrada**: RBAC V1
**Saída`: Router e API bloqueados para employee em finance
**Gate`: Employee não acessa financeiro por nenhum caminho
**Risco**: Baixo

#### T14: Bloqueio de AI Config
**Subagente**: `PA-AIConfig`
**Descrição**: Bloquear rota `/aiconfig` para employee (UI + backend)
**Entrada**: RBAC V1
**Saída`: Router e API bloqueados para employee em AI config
**Gate`: Employee não acessa AI config por nenhum caminho
**Risco**: Baixo

#### T15: Validação de Rota Direta e API
**Subagente**: `PA-TenantSecurity`
**Descrição**: Validar que não há caminhos alternativos de acesso (URL direta, API endpoint)
**Entrada`: Lista de rotas e endpoints
**Saída`: Relatório de caminhos de acesso e validação
**Gate`: Nenhum caminho de acesso indevido encontrado
**Risco**: Médio

### Gate Fase 5
- [ ] Financeiro bloqueado para employee
- [ ] AI Config bloqueado para employee
- [ ] Validação de caminhos alternativos concluída
- [ ] Employee sem acesso a áreas restritas

### Riscos e Mitigação
- **Risco**: URL direta bypassando guards
  - **Mitigação**: Validar também backend; não confiar só em UI
- **Risco**: API endpoint não protegido
  - **Mitigação**: Auditar todos os endpoints e aplicar guards server-side

---

## Fase 6 — Frontend Real em Dados Confiáveis (Semana 7)

### Objetivo
Remover placeholders críticos e usar métricas separadas (previsto vs realizado).

### Entregas

#### T16: Dashboard em Dados Reais
**Subagente**: `PA-FrontendSync`
**Descrição**: Conectar Dashboard a dados reais via useAppointments
**Entrada`: Contratos de dados + hooks existentes
**Saída`: Dashboard.tsx com dados reais, estados completos
**Gate`: Dashboard sem placeholder crítico
**Risco**: Baixo

#### T17: Métricas Separadas (Previsto vs Realizado)
**Subagente**: `PA-Metrics`
**Descrição**: Separar métricas de previsão (scheduled) e realizado (completed)
**Entrada`: Dados de appointments
**Saída`: KPIs de receita prevista, receita realizada, conversão, ticket médio
**Gate`: Métricas separadas e baseadas em status correto
**Risco**: Médio

#### T18: Agenda Real
**Subagente**: `PA-FrontendSync`
**Descrição**: Conectar Agenda a dados reais via useAppointments
**Entrada`: Contratos de dados
**Saída`: Agenda.tsx com dados reais, estados completos
**Gate`: Agenda sem placeholder crítico
**Risco**: Baixo

#### T19: Financeiro Real (Owner Only)
**Subagente**: `PA-FrontendSync`
**Descrição**: Conectar Finance a dados reais via useFinance (só owner)
**Entrada`: Contratos de dados
**Saída`: Finance.tsx com dados reais, estados completos
**Gate`: Financeiro sem placeholder crítico, apenas owner acessa
**Risco**: Baixo

### Gate Fase 6
- [ ] Dashboard em dados reais
- [ ] Métricas separadas (previsto vs realizado)
- [ ] Agenda em dados reais
- [ ] Financeiro em dados reais (owner only)
- [ ] Telas críticas sem placeholder

### Riscos e Mitigação
- **Risco**: Confundir previsto com realizado
  - **Mitigação**: Separar claramente por status; documentar fórmulas
- **Risco**: Dados inconsistentes
  - **Mitigação**: Validar contrato de dados vs schema

---

## Fase 7 — AI e CRM Orientados ao Negócio (Semana 8)

### Objetivo
Fortalecer operação da IA e CRM com base em dados reais por tenant.

### Entregas

#### T20: AI Config Real (Owner Only)
**Subagente**: `PA-AIConfig`
**Descrição**: Conectar AI Config a dados reais (bot_configs, knowledge_base, chat_memory)
**Entrada`: Contratos de dados + RBAC V1
**Saída`: AIConfig.tsx com dados reais, persistência funcionando, employee deny
**Gate`: Owner pode salvar/carregar config, employee bloqueado
**Risco`: Baixo

#### T21: CRM Retenção e Conversão
**Subagente**: `PA-Metrics`
**Descrição**: Implementar classificação de cliente (novo/recorrente/inativo) e métricas de retenção/conversão
**Entrada`: Dados de clientes + appointments
**Saída`: Classificação de clientes + métricas de retenção/conversão
**Gate`: Clientes classificados corretamente, métricas calculadas
**Risco**: Médio

### Gate Fase 7
- [ ] AI Config em dados reais (owner only)
- [ ] CRM com classificação de clientes
- [ ] Métricas de retenção/conversão calculadas
- [ ] Nenhuma mistura de dados entre tenants

### Riscos e Mitigação
- **Risco**: Mistura de clientes entre tenants
  - **Mitigação**: Filtro obrigatório por tenant em toda query
- **Risco**: Classificação inconsistente
  - **Mitigação**: Definir regras claras de classificação

---

## Fase 8 — QA Final, Go/No-Go e Rollout (Semana 8)

### Objetivo
Validar regressão funcional e técnica, e preparar rollout seguro.

### Entregas

#### T22: Suíte de Testes por Perfil
**Subagente**: `PA-QARelease`
**Descrição**: Criar suíte de testes por perfil (owner, employee) e por tenant
**Entrada`: Lista de rotas e funcionalidades
**Saída`: Checklist de testes + resultados
**Gate`: Testes por perfil e por tenant documentados
**Risco**: Baixo

#### T23: Testes de Segurança
**Subagente**: `PA-TenantSecurity`
**Descrição`: Executar testes de segurança (acesso indevido, cross-tenant, bypass de guards)
**Entrada`: Lista de rotas e endpoints
**Saída`: Relatório de segurança com passou/falhou
**Gate`: Nenhum teste de segurança falhou
**Risco**: Médio

#### T24: Relatório Go/No-Go
**Subagente**: `PA-QARelease`
**Descrição`: Consolidar resultados de testes e emitir parecer go/no-go
**Entrada`: Resultados de todos os testes
**Saída`: Relatório final go/no-go com riscos residuais
**Gate`: Parecer emitido com aprovação ou bloqueio
**Risco**: Baixo

#### T25: Plano de Rollout e Rollback
**Subagente**: `PA-QARelease`
**Descrição`: Definir plano de rollout incremental e rollback
**Entrada`: Lista de mudanças
**Saída`: Plano de rollout + plano de rollback
**Gate`: Rollout e rollback documentados
**Risco**: Médio

### Gate Fase 8
- [ ] Testes por perfil executados
- [ ] Testes de segurança passaram
- [ ] Relatório go/no-go emitido
- [ ] Plano de rollout e rollback definido
- [ ] Critérios de sucesso cumpridos

### Riscos e Mitigação
- **Risco**: Regressão não identificada
  - **Mitigação**: Smoke test completo + comparação com versão anterior
- **Risco**: Rollout falhar
  - **Mitigação**: Plano de rollback pronto para execução imediata

---

## Critérios de Sucesso (DoD) do Programa

### Funcional
- [ ] Employee consegue gerir serviços (create/edit/inactivate/reactivate)
- [ ] Employee não acessa financeiro global
- [ ] Employee não acessa AI config
- [ ] Telas críticas (Dashboard, Agenda, Finance, Services) sem placeholder
- [ ] Métricas financeiras baseadas em realizado (completed)
- [ ] Métricas de previsão baseadas em agendado (scheduled)

### Técnico
- [ ] Zero vazamento cross-tenant
- [ ] Frontend conectado 100% ao backend
- [ ] Todos os estados de UI padronizados (loading/error/empty/success)
- [ ] Guards de rota e ação implementados
- [ ] Auditoria de alterações funcionando

### Segurança
- [ ] RBAC owner/employee consistente
- [ ] Políticas RLS ativas em todas as tabelas sensíveis
- [ ] Soft delete implementado em tabelas críticas
- [ ] Todos os endpoints protegidos por guards server-side

### Qualidade
- [ ] Testes por perfil executados
- [ ] Testes de segurança passaram
- [ ] Regressão zero crítico
- [ ] Plano de rollback documentado

---

## Riscos Principais do Programa

### Risco 1: Inconsistência entre Guards Frontend e Backend
**Severidade**: P0  
**Descrição**: Risco de que guards de frontend fiquem desalinhados com validação backend  
**Probabilidade**: Média  
**Mitigação**: Matriz RBAC V1 única versionada; revisar paridade em cada fase  
**Status**: Monitorado

### Risco 2: Soft Delete Não Implementado
**Severidade**: P0  
**Descrição**: Risco de hard delete ser usado por engano em tabelas críticas  
**Probabilidade**: Baixa  
**Mitigação**: Documentar regra em RBAC V1; revisar PRs de exclusão  
**Status**: Planejado mitigação na Fase 4

### Risco 3: Auditoria Não Registrada
**Severidade**: P1  
**Descrição**: Risco de não registrar quem alterou dados sensíveis  
**Probabilidade**: Média  
**Mitigação**: Implementar auditoria obrigatória na Fase 4 e Fase 5  
**Status**: Planejado mitigação

### Risco 4: Vazamento Cross-Tenant
**Severidade**: P0  
**Descrição**: Risco de dados de um tenant aparecerem para outro  
**Probabilidade**: Baixa  
**Mitigação**: Fase 3 dedicada à segurança e isolamento  
**Status**: Planejado mitigação

### Risco 5: Regressão Não Identificada
**Severidade**: P1  
**Descrição**: Risco de funcionalidade quebrar após mudança não ser detectada  
**Probabilidade**: Média  
**Mitigação**: Fase 8 com suíte completa de testes e smoke  
**Status**: Planejado mitigação

---

## Plano de Contingência

### Se Fase 1 Falhar (Auth não implementado)
- Continuar com Fase 2 usando auth mock
- Priorizar correção de auth como P0
- Bloquear Fases 3-8 até auth resolvido

### Se Fase 3 Falhar (Cross-tenant não mitigado)
- Parar desenvolvimento de novas features
- Focar 100% em segurança
- Revisar todas as queries e políticas RLS

### Se Fase 4 Falhar (Services não funcionam para employee)
- Continuar com Services como P0
- Bloquear Fases 5-8 até Services resolvido
- Considerar rollback para versão anterior

### Se Fase 8 Falhar (QA rejeita release)
- Não fazer rollout para produção
- Corrigir todos os bloqueadores (P0 e P1)
- Reprocessar QA na semana seguinte

---

## Assinaturas

**Chief Orchestrator**: ______________  
**Security Lead**: ______________  
**Product Lead**: ______________  
**QA Lead**: ______________  

---
**Versão do Documento**: 1.0  
**Última Atualização**: 2026-03-28  
**Próxima Revisão**: Após Fase 8 (2026-05-23)
