# QA_GATE_CHECKLIST_V1 - Checklist de Qualidade por Fase

**Versão**: 1.0  
**Data**: 2026-03-28  
**Responsável**: QA Lead

## Visão Geral

### Objetivo
Validar qualidade em cada fase do roadmap, garantindo critérios de aceites antes de prosseguir.

### Critérios de Aprovação
- Todos os itens críticos da fase passaram
- Nenhum risco P0 ou P1 sem mitigação
- Evidências documentadas
- Testes executados e validados

---

## Fase 1 — Auth + Tenant Context

### Checklist Funcional
- [ ] Login com email/senha funciona
- [ ] Login resolve membership de tenant
- [ ] Sessão define role corretamente (owner/employee)
- [ ] Logout funciona
- [ ] Refresh de sessão valida membership ativa

### Checklist Técnico
- [ ] Tabela `tenant_memberships` criada
- [ ] Fluxo de auth implementado corretamente
- [ ] Guards de rota implementados
- [ ] Guards de ação implementados
- [ ] Contexto de sessão acessível globalmente

### Checklist Segurança
- [ ] Employee bloqueado em rotas restritas (/finance, /aiconfig)
- [ ] Employee bloqueado em ações restritas (delete em services)
- [ ] Validação server-side aplicada (não só frontend)
- [ ] Tokens de sessão seguros

### Testes de Aceitação
- [ ] Owner consegue acessar todas as rotas permitidas
- [ ] Employee consegue acessar apenas rotas permitidas
- [ ] Usuário sem membership é bloqueado
- [ ] Usuário com membership inativa é bloqueado

### Evidências Obrigatórias
- [ ] Prints/screenshots de fluxo de login
- [ ] Logs de autenticação
- [ ] Evidência de guards funcionando
- [ ] Evidência de bloqueio de employee

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate
[ ] GO para Fase 2  [ ] NO-GO (bloquear até correção)

---

## Fase 2 — Guardas de Frontend e Experiência

### Checklist Funcional
- [ ] Guards de rota aplicados em todas as rotas críticas
- [ ] Guards de ação aplicados em todas as ações críticas
- [ ] UI oculta botões/links para employee em áreas restritas
- [ ] UI mostra botões/links para employee em áreas permitidas

### Checklist Técnico
- [ ] LoadingSkeleton implementado nas telas principais
- [ ] ErrorState implementado nas telas principais
- [ ] EmptyState implementado nas telas principais
- [ ] Toast de sucesso implementado para ações CRUD
- [ ] Toast de erro implementado para falhas

### Checklist Segurança
- [ ] Guards de rota consistentes com RBAC V1
- [ ] Guards de ação consistentes com RBAC V1
- [ ] Nenhuma rota restrita acessível via URL direta
- [ ] Nenhuma ação restrita acessível via console

### Testes de Aceitação
- [ ] Employee acessa `/dashboard` (permitido)
- [ ] Employee acessa `/agenda` (permitido)
- [ ] Employee acessa `/services` (permitido)
- [ ] Employee NÃO acessa `/finance` (bloqueado)
- [ ] Employee NÃO acessa `/aiconfig` (bloqueado)
- [ ] LoadingSkeleton aparece enquanto carrega
- [ ] ErrorState aparece quando há erro
- [ ] EmptyState aparece quando não há dados

### Evidências Obrigatórias
- [ ] Videos/screenshots de guards funcionando
- [ ] Evidência de estados de UI
- [ ] Logs de tentativas de acesso indevido
- [ ] Evidência de toasts de sucesso/erro

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate
[ ] GO para Fase 3  [ ] NO-GO (bloquear até correção)

---

## Fase 3 — Segurança e Isolamento

### Checklist Funcional
- [ ] Todas as queries de hooks têm filtro por `tenant_id`
- [ ] Todas as queries diretas têm filtro por `tenant_id`
- [ ] Políticas RLS ativadas em tabelas sensíveis
- [ ] Nenhum cross-join entre tenants

### Checklist Técnico
- [ ] useAppointments usa filtro tenant
- [ ] useServices usa filtro tenant
- [ ] useFinance usa filtro tenant
- [ ] Outros hooks (se houver) usam filtro tenant
- [ ] Nenhuma query bypassa RLS

### Checklist Segurança
- [ ] Tentativa de leitura de outro tenant falha
- [ ] Tentativa de escrita em outro tenant falha
- [ ] Nenhuma vulnerabilidade CRÍTICA encontrada
- [ ] Mitigações aplicadas para vulnerabilidades encontradas

### Testes de Aceitação
- [ ] Tenant A consegue ler dados do Tenant A
- [ ] Tenant A NÃO consegue ler dados do Tenant B
- [ ] Tenant A NÃO consegue escrever dados do Tenant B
- [ ] Ataques de SQL injection falham (RLS bloqueia)
- [ ] Ataques de cross-tenant falham

### Evidências Obrigatórias
- [ ] Relatório de auditoria de queries
- [ ] Relatório de políticas RLS
- [ ] Relatório de simulações de ataque
- [ ] Logs de tentativas indevidas

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate
[ ] GO para Fase 4  [ ] NO-GO (bloquear até correção)

---

## Fase 4 — Serviços CRUD Completo

### Checklist Funcional
- [ ] Employee consegue criar serviço
- [ ] Employee consegue editar serviço
- [ ] Employee consegue inativar serviço (soft delete)
- [ ] Employee consegue reativar serviço
- [ ] Owner consegue fazer hard delete
- [ ] Serviços inativos não aparecem na lista ativa

### Checklist Técnico
- [ ] Soft delete usa `update({ active: false })`
- [ ] Hard delete usa `delete()` (apenas owner)
- [ ] `updated_by` preenchido ao alterar
- [ ] `updated_at` preenchido ao alterar
- [ ] `deleted_by` preenchido ao inativar
- [ ] `deleted_at` preenchido ao inativar

### Checklist Segurança
- [ ] Employee só acessa serviços do próprio tenant
- [ ] Employee NÃO pode hard delete
- [ ] Owner pode hard delete
- [ ] Auditoria registrada para toda alteração

### Testes de Aceitação
- [ ] Criação de serviço funciona
- [ ] Edição de serviço funciona
- [ ] Inativação funciona (soft delete)
- [ ] Reativação funciona
- [ ] Hard delete funciona (apenas owner)
- [ ] Employee NÃO consegue hard delete
- [ ] Auditoria registrada para cada alteração

### Evidências Obrigatórias
- [ ] Videos/screenshots de CRUD funcionando
- [ ] Logs de operações (created_at, updated_at, deleted_at)
- [ ] Evidência de soft vs hard delete
- [ ] Logs de updated_by/deleted_by

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate
[ ] GO para Fase 5  [ ] NO-GO (bloquear até correção)

---

## Fase 5 — Bloqueios de Acesso

### Checklist Funcional
- [ ] Employee NÃO consegue acessar `/finance`
- [ ] Employee NÃO consegue acessar `/aiconfig`
- [ ] Owner consegue acessar `/finance`
- [ ] Owner consegue acessar `/aiconfig`
- [ ] Nenhum caminho alternativo de acesso encontrado

### Checklist Técnico
- [ ] Router bloqueia `/finance` para employee
- [ ] Router bloqueia `/aiconfig` para employee
- [ ] API bloqueia endpoints de finance para employee
- [ ] API bloqueia endpoints de aiconfig para employee
- [ ] Nenhuma rota/API desprotegida

### Checklist Segurança
- [ ] Tentativa de acesso direto a `/finance` falha
- [ ] Tentativa de acesso direto a `/aiconfig` falha
- [ ] Tentativa de chamada API para finance falha
- [ ] Tentativa de chamada API para aiconfig falha
- [ ] Nenhum bypass de guards encontrado

### Testes de Aceitação
- [ ] Owner acessa `/finance` (permitido)
- [ ] Owner acessa `/aiconfig` (permitido)
- [ ] Employee NÃO acessa `/finance` (bloqueado)
- [ ] Employee NÃO acessa `/aiconfig` (bloqueado)
- [ ] Tentativa de URL direta bloqueada
- [ ] Tentativa de API direta bloqueada

### Evidências Obrigatórias
- [ ] Evidência de bloqueio de rotas
- [ ] Evidência de bloqueio de APIs
- [ ] Logs de tentativas indevidas
- [ ] Validação de caminhos alternativos

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate
[ ] GO para Fase 6  [ ] NO-GO (bloquear até correção)

---

## Fase 6 — Frontend Real em Dados Confiáveis

### Checklist Funcional
- [ ] Dashboard conectado a useAppointments
- [ ] Agenda conectada a useAppointments
- [ ] Finance conectado a useFinance
- [ ] Métricas separadas (previsto vs realizado)
- [ ] Nenhum placeholder crítico restante

### Checklist Técnico
- [ ] Dashboard usa dados reais
- [ ] Agenda usa dados reais
- [ ] Finance usa dados reais
- [ ] Métricas usam fórmulas corretas
- [ ] Estados de UI (loading/error/empty/success) funcionando

### Checklist Segurança
- [ ] Employee NÃO vê financeiro
- [ ] Owner vê financeiro completo
- [ ] Employee vê métricas operacionais (agenda, serviços)
- [ ] Métricas de financeiro isoladas para owner

### Testes de Aceitação
- [ ] Dashboard mostra dados reais de appointments
- [ ] Agenda mostra dados reais de appointments
- [ ] Finance mostra dados reais de transactions
- [ ] Métricas de previsão baseadas em scheduled
- [ ] Métricas de realização baseadas em completed
- [ ] Employee NÃO acessa financeiro

### Evidências Obrigatórias
- [ ] Videos/screenshots de dados reais carregando
- [ ] Evidência de métricas calculadas corretamente
- [ ] Logs de queries com filtro tenant
- [ ] Validação de contratos de dados

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate
[ ] GO para Fase 7  [ ] NO-GO (bloquear até correção)

---

## Fase 7 — AI e CRM Orientados ao Negócio

### Checklist Funcional
- [ ] AI Config conectada a dados reais
- [ ] Owner pode salvar/carregar config
- [ ] Employee NÃO acessa AI config
- [ ] CRM classifica clientes (novo/recorrente/inativo)
- [ ] Métricas de retenção calculadas
- [ ] Métricas de conversão calculadas

### Checklist Técnico
- [ ] AI Config usa bot_configs, knowledge_base, chat_memory
- [ ] AI Config salva dados no Supabase
- [ ] CRM usa dados de clients e appointments
- [ ] Classificação de clientes usa regras claras
- [ ] Métricas de retenção/conversão usam fórmulas corretas

### Checklist Segurança
- [ ] AI Config escopada por tenant
- [ ] Knowledge base escopada por tenant
- [ ] Chat memory escopada por tenant
- [ ] Employee NÃO acessa nenhuma config de IA
- [ ] CRM de clientes escopado por tenant

### Testes de Aceitação
- [ ] Owner salva config de IA
- [ ] Owner carrega config de IA
- [ ] Employee NÃO acessa AI config
- [ ] CRM classifica clientes corretamente
- [ ] Métricas de retenção calculadas corretamente
- [ ] Métricas de conversão calculadas corretamente

### Evidências Obrigatórias
- [ ] Evidência de persistência de config
- [ ] Evidência de escopo por tenant
- [ ] Logs de classificação de clientes
- [ ] Validação de métricas de retenção/conversão

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate
[ ] GO para Fase 8  [ ] NO-GO (bloquear até correção)

---

## Fase 8 — QA Final, Go/No-Go e Rollout

### Checklist Funcional
- [ ] Testes por perfil (owner, employee) executados
- [ ] Testes por tenant executados
- [ ] Testes de segurança executados
- [ ] Regressão validada
- [ ] Relatório go/no-go emitido
- [ ] Plano de rollout definido
- [ ] Plano de rollback definido

### Checklist Técnico
- [ ] Suíte de testes criada
- [ ] Testes de segurança criados
- [ ] Ferramentas de teste configuradas
- [ ] Ambiente de teste configurado
- [ ] Processo de rollout documentado
- [ ] Processo de rollback documentado

### Checklist Segurança
- [ ] Testes de acesso indevido passaram
- [ ] Testes de cross-tenant passaram
- [ ] Testes de bypass de guards passaram
- [ ] Nenhuma vulnerabilidade CRÍTICA encontrada

### Testes de Aceitação
- [ ] Owner testa todas as rotas permitidas
- [ ] Employee testa todas as rotas permitidas
- [ ] Employee NÃO acessa rotas restritas
- [ ] Tenant A NÃO acessa dados do Tenant B
- [ ] Testes de segurança passam
- [ ] Regressão zero crítico

### Evidências Obrigatórias
- [ ] Relatório de testes por perfil
- [ ] Relatório de testes por tenant
- [ ] Relatório de testes de segurança
- [ ] Relatório de regressão
- [ ] Parecer go/no-go
- [ ] Plano de rollout
- [ ] Plano de rollback

### Riscos Residuais
- [ ] Nenhum risco P0
- [ ] Riscos P1 com mitigação definida
- [ ] Plano de correção para P1

### Decisão de Gate Final
[ ] GO para Rollout em Produção  [ ] NO-GO (bloquear até correção)

---

## Critérios de Sucesso do Programa (DoD Final)

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

## Assinaturas de Finais

**Fase 1** (Auth + Tenant): ______________  
**Fase 2** (Frontend Guards): ______________  
**Fase 3** (Segurança): ______________  
**Fase 4** (Services CRUD): ______________  
**Fase 5** (Bloqueios): ______________  
**Fase 6** (Frontend Real): ______________  
**Fase 7** (AI + CRM): ______________  
**Fase 8** (QA Final): ______________  

**Chief Orchestrator**: ______________  
**QA Lead**: ______________  

---
**Versão do Documento**: 1.0  
**Última Atualização**: 2026-03-28  
**Próxima Revisão**: Após Fase 8 (2026-05-23)
