# SKILLS_SOP_V1 - Standard Operating Procedures

**Versão**: 1.0  
**Data**: 2026-03-28  
**Responsável**: SF-SpecWriter

## Catálogo de Skills por Product Agent

---

## PA-Discovery Auditor

### Skill: discovery.placeholder_inventory

**Objective**
Mapear todos os placeholders e dados mockados no frontend.

**Inputs**
- Lista de rotas críticas
- Lista de componentes principais

**Preconditions**
- Projeto clonado e acessível
- IDE/Editor funcionando

**Execution Steps**
1. Navegar por cada rota crítica
2. Identificar:
   - Dados mockados/hardcoded
   - Uso de dados fixos
   - Componentes com placeholders
3. Documentar cada ocorrência com:
   - Rota/Arquivo
   - Tipo de placeholder
   - Impacto funcional
4. Classificar severidade (P0/P1/P2)

**Validation Checks**
- [ ] Todas as rotas críticas verificadas
- [ ] Cada placeholder documentado
- [ ] Severidade classificada corretamente

**Error Handling**
- Se arquivo não encontrado: registrar em backlog de P2
- Se código confuso: marcar para revisão técnica

**Output Schema**
```json
{
  "placeholders": [
    {
      "rota": "/agenda",
      "arquivo": "Agenda.tsx",
      "tipo": "mock_data",
      "linha": 50,
      "severidade": "P0"
    }
  ]
}
```

**Done Criteria**
- [ ] Inventario completo de placeholders
- [ ] Classificação de severidade finalizada
- [ ] Pronto para priorização de correção

**Anti-patterns**
- Não pular rotas
- Não confundir placeholder com estado de loading
- Não classificar tudo como P1

---

### Skill: discovery.mock_dependency_map

**Objective**
Mapear dependências de mocks/hooks incompletos.

**Inputs**
- Lista de hooks existentes (useAppointments, useServices, etc.)
- Lista de componentes que usam dados

**Preconditions**
- Inventário de placeholders concluído

**Execution Steps**
1. Para cada hook:
   - Verificar se está conectado a Supabase
   - Identificar mocks locais
   - Documentar dependências
2. Para cada componente:
   - Verificar se usa hook correto
   - Identificar se usa dados mock
   - Documentar dependência
3. Gerar mapa de dependências

**Validation Checks**
- [ ] Todos os hooks verificados
- [ ] Dependências documentadas
- [ ] Conexões hook ↔ componente mapeadas

**Error Handling**
- Se hook não existe: marcar para criação
- Se componente não usa hook: marcar para refatoração

**Output Schema**
```json
{
  "dependencias": [
    {
      "componente": "Dashboard",
      "hook_atual": "Nenhum (mock)",
      "hook_recomendado": "useAppointments",
      "risco": "P0"
    }
  ]
}
```

**Done Criteria**
- [ ] Mapa de dependências completo
- [ ] Hooks recomendados definidos
- [ ] Pronto para priorização

**Anti-patterns**
- Não ignorar hooks não usados
- Não assumir que componente usa hook correto

---

### Skill: discovery.priority_matrix

**Objective**
Classificar gaps encontrados por prioridade (P0/P1/P2).

**Inputs**
- Inventário de placeholders
- Mapa de dependências
- Impacto no negócio

**Preconditions**
- Inventário de placeholders concluído
- Mapa de dependências concluído

**Execution Steps**
1. Para cada gap:
   - Avaliar impacto funcional
   - Avaliar risco de negócio
   - Classificar severidade:
     - P0: quebra fluxo principal
     - P1: afeta operação diária
     - P2: melhoria de qualidade
2. Gerar matriz de prioridades

**Validation Checks**
- [ ] Todos os gaps classificados
- [ ] Critérios de prioridade aplicados
- [ ] Matriz consistente

**Error Handling**
- Se critérios ambíguos: usar P1 como default
- Se impacto desconhecido: classificar como P1

**Output Schema**
```json
{
  "prioridades": {
    "P0": ["Dashboard sem dados reais", "Agenda com mock"],
    "P1": ["Services parcialmente mockado", "Finance sem real"],
    "P2": ["Componentes com placeholder visual"]
  }
}
```

**Done Criteria**
- [ ] Matriz de prioridades completa
- [ ] Todos os gaps classificados
- [ ] Pronto para implementação

**Anti-patterns**
- Não classificar tudo como P0
- Não ignorar impacto de negócio

---

## PA-Tenant Security Guard

### Skill: security.tenant_scope_audit

**Objective**
Auditar queries e hooks para garantir escopo por tenant.

**Inputs**
- Lista de hooks de dados
- Lista de tabelas sensíveis

**Preconditions**
- Lista de tabelas sensíveis disponível

**Execution Steps**
1. Para cada hook:
   - Verificar se inclui filtro por `tenant_id`
   - Verificar se usa `.eq('tenant_id', currentTenantId)`
2. Para cada tabela sensível:
   - Auditar queries diretas
   - Verificar se há cross-join
3. Documentar gaps de segurança

**Validation Checks**
- [ ] Todos os hooks verificados
- [ ] Todas as tabelas sensíveis verificadas
- [ ] Gaps de segurança documentados

**Error Handling**
- Se hook não acessa Supabase: registrar para revisão
- Se query não tem filtro: marcar como CRÍTICO

**Output Schema**
```json
{
  "auditoria": [
    {
      "hook": "useAppointments",
      "filtro_tenant": true,
      "risco": "Baixo"
    },
    {
      "hook": "useFinance",
      "filtro_tenant": false,
      "risco": "CRÍTICO"
    }
  ]
}
```

**Done Criteria**
- [ ] Auditoria completa
- [ ] Riscos classificados
- [ ] Pronto para correção

**Anti-patterns**
- Não assumir que hook está correto
- Não ignorar queries diretas

---

### Skill: security.rls_policy_check

**Objective**
Verificar políticas RLS do Supabase para cada tabela sensível.

**Inputs**
- Lista de tabelas sensíveis
- Acesso ao Supabase (policies)

**Preconditions**
- Acesso ao Supabase disponível

**Execution Steps**
1. Para cada tabela sensível:
   - Verificar se existe política RLS
   - Verificar se política usa `tenant_id`
   - Verificar se permite apenas role correto
2. Documentar políticas faltantes
3. Gerar plano de correção

**Validation Checks**
- [ ] Todas as tabelas verificadas
- [ ] Políticas mapeadas
- [ ] Gaps documentados

**Error Handling**
- Se política não existe: marcar como CRÍTICO
- Se política não filtra por tenant: marcar como CRÍTICO

**Output Schema**
```json
{
  "policies": [
    {
      "tabela": "appointments",
      "policy_existe": true,
      "filtro_tenant": true,
      "status": "OK"
    },
    {
      "tabela": "finance_transactions",
      "policy_existe": false,
      "status": "CRÍTICO"
    }
  ]
}
```

**Done Criteria**
- [ ] Auditoria de RLS completa
- [ ] Gaps documentados
- [ ] Plano de correção definido

**Anti-patterns**
- Não assumir que RLS está ativo
- Não ignorar tabelas "pouco usadas"

---

### Skill: security.cross_tenant_attack_simulation

**Objective**
Simular tentativas de acesso cross-tenant.

**Inputs**
- Lista de tenants
- Lista de usuários de teste

**Preconditions**
- Ambiente de teste disponível

**Execution Steps**
1. Criar usuários de diferentes tenants
2. Tentar acessar dados de outro tenant:
   - Via API direta
   - Via UI (se disponível)
3. Tentar alterar dados de outro tenant
4. Documentar vulnerabilidades

**Validation Checks**
- [ ] Tentativas de acesso simuladas
- [ ] Vulnerabilidades documentadas
- [ ] Riscos classificados

**Error Handling**
- Se ambiente indisponível: marcar como pendente
- Se vulnerabilidade encontrada: marcar como CRÍTICO

**Output Schema**
```json
{
  "simulacoes": [
    {
      "tipo": "leitura",
      "tenant_origem": "A",
      "tenant_alvo": "B",
      "sucesso": false,
      "risco": "Baixo"
    },
    {
      "tipo": "escrita",
      "tenant_origem": "A",
      "tenant_alvo": "B",
      "sucesso": true,
      "risco": "CRÍTICO"
    }
  ]
}
```

**Done Criteria**
- [ ] Simulações completas
- [ ] Vulnerabilidades identificadas
- [ ] Plano de correção definido

**Anti-patterns**
- Não assumir que segurança está OK
- Não ignorar cenários de ataque

---

## PA-Auth & RBAC Designer

### Skill: auth.session_flow_modeling

**Objective**
Modelar fluxo de autenticação e resolução de sessão.

**Inputs**
- Lista de perfis (owner, employee)
- Lista de tenants

**Preconditions**
- Supabase Auth configurado

**Execution Steps**
1. Definir fluxo de login:
   - User entra com email/senha
   - Supabase Auth valida
   - Buscar membership de tenant
   - Definir role e tenant atual
   - Criar contexto de sessão
2. Definir fluxo de refresh:
   - Validar session ativa
   - Verificar membership ativa
   - Atualizar role se necessário
3. Documentar fluxos

**Validation Checks**
- [ ] Fluxo de login completo
- [ ] Fluxo de refresh completo
- [ ] Papéis e tenant documentados

**Error Handling**
- Se Supabase Auth não configurado: marcar CRÍTICO
- Se membership não existe: tratar como erro

**Output Schema**
```json
{
  "fluxo_login": {
    "passos": [
      "User entra com email/senha",
      "Supabase Auth valida",
      "Busca membership de tenant",
      "Define role e tenant atual",
      "Cria contexto de sessão"
    ]
  },
  "fluxo_refresh": {
    "passos": [
      "Valida session ativa",
      "Verifica membership ativa",
      "Atualiza role se necessário"
    ]
  }
}
```

**Done Criteria**
- [ ] Fluxos modelados completamente
- [ ] Documentação clara
- [ ] Pronto para implementação

**Anti-patterns**
- Não ignorar casos de erro
- Não assumir que membership sempre existe

---

### Skill: auth.membership_rbac_mapping

**Objective**
Mapear membership user ↔ tenant ↔ role.

**Inputs**
- Lista de usuários
- Lista de tenants
- Lista de perfis (owner, employee)

**Preconditions**
- Fluxo de login modelado

**Execution Steps**
1. Definir tabela `tenant_memberships`:
   - user_id
   - tenant_id
   - role
   - status (active/inactive)
   - created_at
2. Definir regras:
   - Um usuário pode ter membership em múltiplos tenants
   - Membership ativa define tenant atual
   - Role define permissões
3. Documentar mapeamento

**Validation Checks**
- [ ] Tabela definida corretamente
- [ ] Regras claras
- [ ] Mapeamento documentado

**Error Handling**
- Se tabela já existe: usar estrutura existente
- Se conflito de mapeamento: resolver com regra de precedência

**Output Schema**
```json
{
  "tabela": "tenant_memberships",
  "colunas": [
    "user_id (uuid)",
    "tenant_id (uuid)",
    "role (text)",
    "status (text)",
    "created_at (timestamptz)"
  ],
  "regras": [
    "Um usuário pode ter múltiplas memberships",
    "Membership ativa define tenant atual",
    "Role define permissões"
  ]
}
```

**Done Criteria**
- [ ] Tabela definida
- [ ] Regras claras
- [ ] Pronto para implementação

**Anti-patterns**
- Não permitir membership duplicada no mesmo tenant
- Não permitir membership sem tenant

---

### Skill: auth.route_action_permission_matrix

**Objective**
Definir guards de rota e ação por role.

**Inputs**
- Lista de rotas críticas
- Lista de ações por rota
- Matriz RBAC (RBAC_V1)

**Preconditions**
- RBAC_V1 definido
- Membership modelada

**Execution Steps**
1. Para cada rota:
   - Definir roles permitidos
   - Definir roles bloqueados
   - Criar guard de rota
2. Para cada ação:
   - Definir roles permitidos
   - Definir roles bloqueados
   - Criar guard de ação
3. Gerar matriz de guards

**Validation Checks**
- [ ] Todas as rotas cobertas
- [ ] Todas as ações cobertas
- [ ] Guards consistentes com RBAC_V1

**Error Handling**
- Se rota não documentada em RBAC_V1: marcar P2
- Se conflito de permissão: resolver com RBAC_V1

**Output Schema**
```json
{
  "guards_rota": [
    {
      "rota": "/finance",
      "roles_permitidos": ["owner"],
      "roles_bloqueados": ["employee"]
    }
  ],
  "guards_acao": [
    {
      "recurso": "services",
      "acao": "delete",
      "roles_permitidos": ["owner"],
      "roles_bloqueados": ["employee"]
    }
  ]
}
```

**Done Criteria**
- [ ] Matriz de guards completa
- [ ] Consistente com RBAC_V1
- [ ] Pronto para implementação

**Anti-patterns**
- Não permitir ação sem role explícito
- Não assumir que rota pública

---

## PA-Data Contracts Engineer

### Skill: contracts.entity_schema_alignment

**Objective**
Alinhar schema do banco com contrato de dados frontend.

**Inputs**
- Schema atual do Supabase
- Lista de telas críticas

**Preconditions**
- Acesso ao schema do banco

**Execution Steps**
1. Para cada entidade críticas:
   - Mapear campos do schema
   - Identificar campos usados no frontend
   - Alinhar nomes e tipos
2. Definir campos obrigatórios vs opcionais
3. Documentar alinhamento

**Validation Checks**
- [ ] Todas as entidades verificadas
- [ ] Campos mapeados
- [ ] Alinhamento documentado

**Error Handling**
- Se schema desatualizado: atualizar primeiro
- Se campo inconsistente: resolver com regra de precedência (banco)

**Output Schema**
```json
{
  "entidades": [
    {
      "nome": "appointments",
      "campos_banco": ["id", "client_name", "service_type", "start_time", "status", "price"],
      "campos_frontend": ["id", "clientName", "serviceType", "startTime", "status", "price"],
      "alinhamento": "OK"
    }
  ]
}
```

**Done Criteria**
- [ ] Alinhamento completo
- [ ] Campos mapeados
- [ ] Pronto para implementação

**Anti-patterns**
- Não usar nomes de campos diferentes no frontend
- Não ignorar campos do banco

---

### Skill: contracts.status_normalization

**Objective**
Padronizar enums de status por entidade.

**Inputs**
- Lista de entidades com status
- Status atuais em uso

**Preconditions**
- Schema alinhado

**Execution Steps**
1. Para cada entidade com status:
   - Listar todos os status em uso
   - Definir canônico (ex.: scheduled, completed, cancelled)
   - Mapear status antigos → canônicos
2. Documentar padronização

**Validation Checks**
- [ ] Todos os status identificados
- [ ] Canônico definido
- [ ] Mapeamento completo

**Error Handling**
- Se status ambíguo: documentar para decisão
- Se conflito de mapeamento: resolver com regra de precedência

**Output Schema**
```json
{
  "status": [
    {
      "entidade": "appointments",
      "canonico": ["scheduled", "completed", "cancelled"],
      "mapeamento": {
        "pendente": "scheduled",
        "confirmado": "completed",
        "cancelado": "cancelled"
      }
    }
  ]
}
```

**Done Criteria**
- [ ] Padronização completa
- [ ] Mapeamento definido
- [ ] Pronto para implementação

**Anti-patterns**
- Não usar múltiplos status para mesmo estado
- Não usar status ambíguos

---

### Skill: contracts.fallback_strategy

**Objective**
Definir valores de fallback para campos opcionais.

**Inputs**
- Lista de campos opcionais
- Tipos de dados

**Preconditions**
- Schema alinhado

**Execution Steps**
1. Para cada campo opcional:
   - Definir valor de fallback
   - Definir texto de exibição alternativa
   - Documentar regra
2. Implementar fallbacks no frontend

**Validation Checks**
- [ ] Todos os campos opcionais cobertos
- [ ] Fallbacks definidos
- [ ] Textos alternativos definidos

**Error Handling**
- Se campo não tem fallback: usar default do tipo (ex.: 0, "")
- Se fallback inadequado: documentar para revisão

**Output Schema**
```json
{
  "fallbacks": [
    {
      "campo": "client_name",
      "tipo": "text",
      "fallback": "'Cliente'",
      "exibicao": "Cliente não informado"
    },
    {
      "campo": "price",
      "tipo": "numeric",
      "fallback": "0",
      "exibicao": "R$ 0,00"
    }
  ]
}
```

**Done Criteria**
- [ ] Fallbacks definidos
- [ ] Exibições alternativas definidas
- [ ] Pronto para implementação

**Anti-patterns**
- Não usar fallback vazio
- Não usar fallback inadequado

---

## PA-Frontend Integrator

### Skill: frontend.real_data_binding

**Objective**
Conectar telas a dados reais via hooks.

**Inputs**
- Lista de telas críticas
- Hooks de dados correspondentes

**Preconditions**
- Contratos de dados definidos
- Hooks implementados

**Execution Steps**
1. Para cada tela:
   - Conectar ao hook correto
   - Mapear campos do contrato
   - Aplicar transformações (datas, valores, status)
   - Validar integridade
2. Testar carregamento inicial
3. Testar atualização de dados

**Validation Checks**
- [ ] Todas as telas conectadas
- [ ] Campos mapeados corretamente
- [ ] Transformações aplicadas
- [ ] Integridade validada

**Error Handling**
- Se hook não existe: criar primeiro
- Se dados inconsistentes: validar contrato

**Output Schema**
```json
{
  "integracoes": [
    {
      "tela": "Dashboard",
      "hook": "useAppointments()",
      "campos_mapeados": ["client_name", "service_type", "start_time", "status", "price"],
      "transformacoes": ["formatTime", "formatPrice", "formatStatus"],
      "status": "OK"
    }
  ]
}
```

**Done Criteria**
- [ ] Todas as telas conectadas
- [ ] Dados reais carregando
- [ ] Pronto para teste

**Anti-patterns**
- Não usar dados mockados
- Não ignorar campos do contrato

---

### Skill: frontend.ui_state_standardization

**Objective**
Padronizar estados de UI (loading, error, empty, success).

**Inputs**
- Lista de telas críticas
- Componentes de UI padrão (LoadingSkeleton, ErrorState, EmptyState)

**Preconditions**
- Componentes de UI padrão disponíveis

**Execution Steps**
1. Para cada tela:
   - Implementar estado `loading`
   - Implementar estado `error`
   - Implementar estado `empty`
   - Implementar estado `success`
2. Garantir consistência de UX
3. Adicionar feedback visual

**Validation Checks**
- [ ] Todos os estados implementados
- [ ] Consistência visual
- [ ] Feedback claro

**Error Handling**
- Se componente padrão não existe: criar primeiro
- Se estado não tratado: adicionar tratamento

**Output Schema**
```json
{
  "estados": [
    {
      "tela": "Agenda",
      "loading": "LoadingSkeleton(count=5, type='list')",
      "error": "ErrorState(message, onRetry)",
      "empty": "EmptyState(icon='event_busy', title, description)",
      "success": "Dados carregados com sucesso"
    }
  ]
}
```

**Done Criteria**
- [ ] Estados padronizados
- [ ] Consistência visual
- [ ] Pronto para teste

**Anti-patterns**
- Não deixar tela sem estado
- Não usar estados inconsistentes

---

### Skill: frontend.crud_feedback_loop

**Objective**
Implementar feedback de ações CRUD (toast, modal, confirmação).

**Inputs**
- Lista de ações CRUD
- Lista de rotas

**Preconditions**
- Estados padronizados

**Execution Steps**
1. Para cada ação CRUD:
   - Adicionar confirmação (se necessário)
   - Adicionar feedback visual (toast)
   - Atualizar estado após ação
   - Recarregar dados (se necessário)
2. Testar feedback de erro

**Validation Checks**
- [ ] Todas as ações com feedback
- [ ] Confirmações adicionadas
- [ ] Erros tratados
- [ ] Estado atualizado corretamente

**Error Handling**
- Se ação sem feedback: adicionar
- Se erro não tratado: tratar

**Output Schema**
```json
{
  "acoes": [
    {
      "tipo": "create",
      "recurso": "service",
      "confirmacao": "modal_confirm",
      "feedback_sucesso": "toast 'Serviço criado'",
      "feedback_erro": "toast 'Erro ao criar serviço'",
      "recarregar": true
    }
  ]
}
```

**Done Criteria**
- [ ] Feedback completo
- [ ] UX clara
- [ ] Pronto para teste

**Anti-patterns**
- Não deixar ação sem feedback
- Não usar feedback genérico

---

## PA-AI Config Integrator

### Skill: ai.config_persistence

**Objective**
Persistir configurações da IA no Supabase por tenant.

**Inputs**
- Lista de configurações
- Tabela `bot_configs`

**Preconditions**
- Tabela `bot_configs` existe

**Execution Steps**
1. Para cada config:
   - Carregar do Supabase (por tenant)
   - Exibir no frontend (owner only)
   - Salvar alterações (owner only)
2. Tratar erros:
   - Erro ao carregar: usar config padrão
   - Erro ao salvar: mostrar toast

**Validation Checks**
- [ ] Config carregada corretamente
- [ ] Config salva corretamente
- [ ] Erros tratados
- [ ] Employee não acessa

**Error Handling**
- Se config não existe: criar config padrão
- Erro ao salvar: rollback para config anterior

**Output Schema**
```json
{
  "config": {
    "tone": "Profissional",
    "instructions": "Contexto de negócio...",
    "delay_min": 2,
    "delay_max": 5,
    "buffer_enabled": true
  },
  "status": "OK"
}
```

**Done Criteria**
- [ ] Config persistida
- [ ] Recuperação funcionando
- [ ] Employee bloqueado
- [ ] Pronto para teste

**Anti-patterns**
- Não salvar config sem tenant
- Não permitir employee salvar config

---

### Skill: ai.knowledge_base_crud

**Objective**
Implementar CRUD de base de conhecimento por tenant.

**Inputs**
- Tabela `knowledge_base`
- Permissões: owner (full), employee (deny)

**Preconditions**
- Tabela `knowledge_base` existe

**Execution Steps**
1. Owner:
   - Criar entrada (pergunta/resposta)
   - Editar entrada
   - Excluir entrada
   - Listar entradas
2. Employee:
   - Bloqueado acesso total
3. Tratar erros:
   - Erro ao criar/editar: mostrar toast

**Validation Checks**
- [ ] CRUD funcionando para owner
- [ ] Employee bloqueado
- [ ] Erros tratados
- [ ] Escopo por tenant

**Error Handling**
- Erro de criação: rollback
- Erro de edição: manter versão anterior

**Output Schema**
```json
{
  "entries": [
    {
      "id": "uuid",
      "category": "Horários",
      "question": "Qual o horário?",
      "answer": "Seg a Sáb, 10h às 18h"
    }
  ],
  "employee_access": false
}
```

**Done Criteria**
- [ ] CRUD completo
- [ ] Employee bloqueado
- [ ] Pronto para teste

**Anti-patterns**
- Não permitir employee acessar knowledge base
- Não salvar sem tenant

---

### Skill: ai.chat_memory_scoping

**Objective**
Garantir escopo de memória de chat por tenant.

**Inputs**
- Tabela `chat_memory`
- Permissões: owner (full), employee (deny)

**Preconditions**
- Tabela `chat_memory` existe

**Execution Steps**
1. Garantir que chat memory é por tenant:
   - Incluir tenant_id em queries
   - Não misturar memórias de tenants diferentes
2. Employee:
   - Bloqueado acesso total
3. Validação:
   - Verificar que não há cross-tenant

**Validation Checks**
- [ ] Chat memory escopado por tenant
- [ ] Employee bloqueado
- [ ] Sem cross-tenant
- [ ] Queries com filtro tenant

**Error Handling**
- Se chat memory vazia: normal para tenant novo
- Erro de query: registrar para revisão

**Output Schema**
```json
{
  "memory": {
    "tenant_id": "uuid",
    "messages": [],
    "employee_access": false,
    "scoping": "tenant_only"
  }
}
```

**Done Criteria**
- [ ] Escopo correto
- [ ] Employee bloqueado
- [ ] Sem cross-tenant
- [ ] Pronto para teste

**Anti-patterns**
- Não misturar memórias
- Não permitir employee acessar

---

## PA-Metrics Planner

### Skill: metrics.forecast_vs_realized_split

**Objective**
Separar métricas de previsão e realização.

**Inputs**
- Dados de agendamentos (appointments)
- Dados de financeiro (finance_transactions)

**Preconditions**
- Status de agendamento padronizados

**Execution Steps**
1. Separar bases:
   - Previsão: appointments WHERE status = 'scheduled'
   - Realizado: appointments WHERE status = 'completed'
2. Calcular KPIs para cada base:
   - Receita
   - Quantidade
   - Ticket médio
3. Gerar comparativo

**Validation Checks**
- [ ] Bases separadas corretamente
- [ ] KPIs calculados
- [ ] Comparativo gerado
- [ ] Fontes canônicas definidas

**Error Handling**
- Se status não padronizado: padronizar primeiro
- Se dados inconsistentes: filtrar outliers

**Output Schema**
```json
{
  "comparativo": {
    "previsao": {
      "receita": "R$ X,XX",
      "quantidade": N,
      "ticket_medio": "R$ Y,YY"
    },
    "realizado": {
      "receita": "R$ A,AA",
      "quantidade": M,
      "ticket_medio": "R$ B,BB"
    },
    "conversao": "Z%"
  }
}
```

**Done Criteria**
- [ ] Separação correta
- [ ] KPIs calculados
- [ ] Pronto para exibição

**Anti-patterns**
- Não misturar previsto com realizado
- Não usar fontes diferentes

---

### Skill: metrics.kpi_registry

**Objective**
Definir catálogo de KPIs com fórmula e fonte.

**Inputs**
- Lista de KPIs desejados
- Dados disponíveis

**Preconditions**
- Bases separadas (previsto/realizado)

**Execution Steps**
1. Para cada KPI:
   - Definir fórmula
   - Definir fonte canônica
   - Definir periodicidade
   - Validar integridade
2. Documentar KPI

**Validation Checks**
- [ ] Fórmulas definidas
- [ ] Fontes canônicas definidas
- [ ] Periodicidades definidas
- [ ] KPIs validados

**Error Handling**
- Se fórmula inválida: corrigir
- Se fonte não existe: usar fonte alternativa

**Output Schema**
```json
{
  "kpis": [
    {
      "nome": "receita_prevista",
      "descricao": "Soma dos preços de agendamentos pendentes",
      "formula": "SUM(appointments.price) WHERE status = 'scheduled'",
      "fonte": "appointments",
      "periodicidade": "diaria"
    }
  ]
}
```

**Done Criteria**
- [ ] Catálogo completo
- [ ] Fórmulas claras
- [ ] Fontes canônicas
- [ ] Pronto para implementação

**Anti-patterns**
- Não usar fórmulas ambíguas
- Não misturar fontes

---

### Skill: metrics.retention_conversion_model

**Objective**
Modelar retenção e conversão de clientes.

**Inputs**
- Dados de clientes
- Dados de agendamentos
- Dados de CRM

**Preconditions**
- Status de agendamento padronizados

**Execution Steps**
1. Classificar clientes:
   - Novo: 1º agendamento
   - Recorrente: >3 agendamentos
   - Inativo: sem agendamento nos últimos 30 dias
   - Em recuperação: inativo que retornou
2. Calcular métricas:
   - Taxa de conversão (novo → recorrente)
   - Taxa de retenção (recorrente → recorrente)
   - Taxa de reativação (inativo → ativo)

**Validation Checks**
- [ ] Clientes classificados
- [ ] Métricas calculadas
- [ ] Modelagem documentada

**Error Handling**
- Se dados insuficientes: usar período maior
- Se classificação ambígua: definir regras claras

**Output Schema**
```json
{
  "classificacao": {
    "novo": N,
    "recorrente": R,
    "inativo": I,
    "em_recuperacao": E
  },
  "metricas": {
    "conversao": "X%",
    "retencao": "Y%",
    "reativacao": "Z%"
  }
}
```

**Done Criteria**
- [ ] Classificação completa
- [ ] Métricas calculadas
- [ ] Pronto para exibição

**Anti-patterns**
- Não misturar classificações
- Não usar períodos diferentes

---

## PA-QA & Release Manager

### Skill: qa.smoke_matrix

**Objective**
Definir smoke tests básicos por rota.

**Inputs**
- Lista de rotas críticas
- Lista de perfis (owner, employee)

**Preconditions**
- Aplicação implantada

**Execution Steps**
1. Para cada rota:
   - Acessar como owner
   - Acessar como employee (se permitido)
   - Validar carregamento inicial
   - Validar dados
   - Validar ações permitidas/bloqueadas
2. Documentar resultados

**Validation Checks**
- [ ] Todas as rotas testadas
- [ ] Perfis testados
- [ ] Resultados documentados
- [ ] Erros registrados

**Error Handling**
- Se rota não carrega: registrar como CRÍTICO
- Se erro inesperado: registrar

**Output Schema**
```json
{
  "smoke_tests": [
    {
      "rota": "/agenda",
      "perfil": "owner",
      "carregamento": "OK",
      "dados": "OK",
      "acoes": "OK",
      "resultado": "PASSOU"
    },
    {
      "rota": "/finance",
      "perfil": "employee",
      "resultado": "BLOQUEADO (esperado)"
    }
  ]
}
```

**Done Criteria**
- [ ] Smoke tests completos
- [ ] Resultados documentados
- [ ] Pronto para análise

**Anti-patterns**
- Não pular rotas
- Não ignorar erros

---

### Skill: qa.regression_gate

**Objective**
Validar regressão funcional após mudanças.

**Inputs**
- Lista de funcionalidades críticas
- Lista de mudanças

**Preconditions**
- Smoke tests completos

**Execution Steps**
1. Para cada funcionalidade crítica:
   - Testar funcionamento atual
   - Comparar com funcionamento anterior
   - Identificar regressões
2. Classificar severidade
3. Documentar regressões

**Validation Checks**
- [ ] Funcionalidades testadas
- [ ] Regressões identificadas
- [ ] Severidade classificada
- [ ] Plano de correção definido

**Error Handling**
- Se funcionalidade quebrada: marcar como CRÍTICO
- Se regressão severa: bloquear release

**Output Schema**
```json
{
  "regressoes": [
    {
      "funcionalidade": "Agenda",
      "status": "BROKEN",
      "severidade": "P0",
      "causa": "Hook não filtra por tenant",
      "correcao": "Adicionar filtro tenant_id"
    }
  ],
  "go_no_go": "NO_GO"
}
```

**Done Criteria**
- [ ] Regressão validada
- [ ] Classificação completa
- [ ] Pronto para decisão

**Anti-patterns**
- Não ignorar regressões
- Não classificar tudo como menor

---

### Skill: release.rollback_protocol

**Objective**
Definir protocolo de rollback em caso de falha.

**Inputs**
- Lista de mudanças
- Lista de impactos

**Preconditions**
- Release planejado

**Execution Steps**
1. Para cada mudança:
   - Identificar reversão
   - Documentar passos de rollback
   - Definir critérios de gatilho
2. Definir processo geral:
   - Monitorar pós-release
   - Identificar falhas críticas
   - Executar rollback se necessário

**Validation Checks**
- [ ] Rollbacks documentados
- [ ] Critérios de gatilho definidos
- [ ] Processo geral definido
- [ ] Pronto para uso

**Error Handling**
- Se rollback não possível: marcar risco CRÍTICO
- Se critério ambíguo: definir explicitamente

**Output Schema**
```json
{
  "rollbacks": [
    {
      "mudanca": "Novo guard de finance",
      "reversao": "Remover guard",
      "passos": ["Remover código", "Rebuild", "Redeploy"],
      "criterio_gatilho": "Employee consegue acessar financeiro"
    }
  ],
  "protocolo": {
    "monitoramento": "Logs e erros",
    "falhas_criticas": ["cross-tenant", "segurança", "dados corrompidos"],
    "execucao_rollback": "Automático se falha crítica, manual se falha menor"
  }
}
```

**Done Criteria**
- [ ] Rollbacks documentados
- [ ] Protocolo definido
- [ ] Pronto para uso

**Anti-patterns**
- Não deixar rollback indefinido
- Não executar rollback sem critério claro

---

## Status da Versão

- [ ] Skills SOP congeladas
- [ ] Em validação
- [ ] Aprovadas
- [ ] Em implementação

**Aprovado por**: ______________  
**Data de aprovação**: ______________
