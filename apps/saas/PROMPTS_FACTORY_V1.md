# PROMPTS_FACTORY_V1 - Blueprint de Prompts

**Versão**: 1.0  
**Data**: 2026-03-28  
**Responsável**: PF-Strategist

## Product Agents (Alvo)

1. **PA-Discovery Auditor**
2. **PA-Tenant Security Guard**
3. **PA-Auth & RBAC Designer**
4. **PA-Data Contracts Engineer**
5. **PA-Frontend Integrator**
6. **PA-AI Config Integrator**
7. **PA-Metrics Planner**
8. **PA-QA & Release Manager**

## Blueprint por Product Agent

### PA-Discovery Auditor

**Objetivo**
Mapear todos os placeholders, mocks e dívidas de integração remanescentes no frontend.

**Escopo**
- Rotas críticas: Dashboard, Agenda, Finance, Services, AI Config, App Shell
- Hooks de dados: useAppointments, useServices, useFinance, etc.
- Componentes com dados mockados ou fixos

**Fora de Escopo**
- Refatoração de código não crítica
- Melhorias de UX estética

**Entradas Obrigatórias**
- Lista de rotas críticas
- Lista de hooks de dados existentes
- Lista de componentes principais

**Processo Sugerido**
1. Varredura linha por linha em cada rota crítica
2. Identificar:
   - Dados mockados/hardcoded
   - Uso de hooks incompletos ou ausentes
   - Dependências quebradas
3. Classificar cada gap:
   - P0 (crítico): quebra fluxo principal
   - P1 (importante): afeta operação diária
   - P2 (menor): melhoria de qualidade
4. Gerar plano de correção com menor risco

**Saída Obrigatória**
```json
{
  "gaps": [
    {
      "rota": "/agenda",
      "arquivo": "src/components/agenda/Agenda.tsx",
      "tipo": "mock_data",
      "severidade": "P0",
      "impacto": "Agenda não mostra dados reais",
      "correcao_recomendada": "Substituir mock por useAppointments()",
      "risco_da_correcao": "Baixo"
    }
  ],
  "prioridade_total": {
    "P0": 3,
    "P1": 5,
    "P2": 2
  }
}
```

**Critérios de Aceite**
- Todos os gaps classificados por severidade
- Plano de correção concreto e executável
- Evidência por arquivo afetado

**Riscos e Mitigação**
- Risco: sobrecarga de gaps identificados
  - Mitigação: priorizar P0 primeiro, depois P1
- Risco: ambiguidade entre mock vs real
  - Mitigação: definir critérios claros de identificação

---

### PA-Tenant Security Guard

**Objetivo**
Garantir isolamento absoluto entre tenants (barbearias).

**Escopo**
- Queries de dados (Supabase)
- Hooks de dados (useAppointments, useServices, etc.)
- Políticas RLS do banco
- Validação server-side

**Fora de Escopo**
- Otimização de performance
- Refatoração de código não crítica

**Entradas Obrigatórias**
- Lista de tabelas sensíveis (appointments, services, finance, etc.)
- Lista de hooks de dados
- Lista de rotas que acessam dados

**Processo Sugerido**
1. Auditar cada query por tabela sensível
2. Verificar:
   - Presença de filtro por `tenant_id`
   - Ausência de cross-join entre tenants
   - Políticas RLS implementadas
3. Simular ataques:
   - Tentar acessar dados de outro tenant
   - Tentar alterar dados de outro tenant
4. Gerar matriz de risco

**Saída Obrigatória**
```json
{
  "auditoria": [
    {
      "tabela": "appointments",
      "hook": "useAppointments",
      "filtro_tenant": true,
      "risco": "Baixo",
      "recomendacao": "OK"
    },
    {
      "tabela": "finance_transactions",
      "hook": "useFinance",
      "filtro_tenant": false,
      "risco": "CRÍTICO",
      "recomendacao": "Adicionar .eq('tenant_id', currentTenantId)"
    }
  ],
  "riscos_criticos": [
    {
      "descricao": "useFinance não filtra por tenant",
      "severidade": "P0",
      "correcao": "Adicionar filtro tenant_id em todas as queries"
    }
  ]
}
```

**Critérios de Aceite**
- Toda query sensível com filtro tenant
- Nenhum risco P0 aberto sem correção
- Matriz de ataque simulado documentada

**Riscos e Mitigação**
- Risco: queries antigas sem filtro
  - Mitigação: revisão linha por linha de todos os hooks

---

### PA-Auth & RBAC Designer

**Objetivo**
Modelar autenticação e autorização para owner e employee.

**Escopo**
- Sessão de usuário (auth)
- Vínculo de membership (user ↔ tenant ↔ role)
- Guards de rota e ação
- Matriz de permissões (RBAC V1)

**Fora de Escopo**
- Implementação técnica (apenas modelagem)

**Entradas Obrigatórias**
- Lista de perfis (owner, employee)
- Lista de rotas críticas
- Lista de ações por rota

**Processo Sugerido**
1. Definir modelo de dados:
   - `tenant_memberships(user_id, tenant_id, role, status)`
   - `employee_scopes` (opcional, para permissões finas)
2. Definir fluxo de autenticação:
   - Login → resolver membership → definir role
   - Refresh de sessão → validar membership ativa
3. Definir guards:
   - Guard de rota (ex.: "/finance" só owner)
   - Guard de ação (ex.: "delete" só owner em serviços)
4. Gerar matriz de permissões

**Saída Obrigatória**
```json
{
  "modelo_dados": {
    "tenant_memberships": "user_id, tenant_id, role, status, created_at",
    "employee_scopes": "user_id, tenant_id, can_view_finance, can_manage_ai, etc."
  },
  "fluxo_auth": {
    "login": "Autenticar → Buscar membership → Definir role → Criar sessão",
    "refresh": "Validar session → Verificar membership ativa → Atualizar role"
  },
  "guards_rota": [
    {
      "rota": "/finance",
      "roles_permitidos": ["owner"],
      "role_bloqueado": ["employee"]
    },
    {
      "rota": "/aiconfig",
      "roles_permitidos": ["owner"],
      "role_bloqueado": ["employee"]
    }
  ],
  "guards_acao": [
    {
      "recurso": "services",
      "acao": "delete",
      "roles_permitidos": ["owner"],
      "role_bloqueado": ["employee"]
    }
  ]
}
```

**Critérios de Aceite**
- Modelo de dados completo
- Fluxo de auth definido
- Guards por rota e ação documentados
- Matriz RBAC consistente com RBAC_V1.md

**Riscos e Mitigação**
- Risco: inconsistência entre guards frontend e backend
  - Mitigação: matriz única RBAC versionada

---

### PA-Data Contracts Engineer

**Objetivo**
Definir contratos de dados frontend ↔ backend por entidade.

**Escopo**
- Entidades principais: appointments, services, finance, clients, tenants, bot_configs, knowledge_base
- Telas: Dashboard, Agenda, Finance, Services, AI Config
- Transformações de dados (format, enums, fallbacks)

**Fora de Escopo**
- Implementação técnica (apenas contratos)

**Entradas Obrigatórias**
- Schema atual do banco
- Lista de telas críticas

**Processo Sugerido**
1. Mapear campos por entidade:
   - Nome do campo
   - Tipo de dado
   - Opcionalidade (nullability)
2. Definir transformações:
   - Formatação de datas
   - Formatação de valores monetários
   - Mapeamento de status (enum)
3. Definir fallbacks:
   - Valores padrão quando null
   - Textos de exibição alternativos

**Saída Obrigatória**
```json
{
  "contratos": [
    {
      "entidade": "appointments",
      "campos": [
        {
          "nome": "id",
          "tipo": "uuid",
          "opcional": false
        },
        {
          "nome": "client_name",
          "tipo": "text",
          "opcional": true,
          "fallback": "'Cliente'"
        },
        {
          "nome": "start_time",
          "tipo": "timestamptz",
          "opcional": true,
          "transformacao": "formatar para 'HH:MM'"
        },
        {
          "nome": "status",
          "tipo": "text",
          "opcional": true,
          "enum": ["scheduled", "completed", "cancelled"]
        }
      ]
    }
  ],
  "transformacoes_padrao": {
    "datas": "formatTime(dateString) → 'HH:MM' ou 'DD/MM'",
    "valores": "formatPrice(value) → 'R$ X,XX'",
    "status": "formatStatusLabel(status) → 'Confirmado', 'Pendente', 'Cancelado'"
  }
}
```

**Critérios de Aceite**
- Todos os campos críticos mapeados
- Transformações definidas
- Fallbacks documentados
- Enums padronizados

**Riscos e Mitigação**
- Risco: inconsistência entre schema e contrato
  - Mitigação: manter contrato versionado

---

### PA-Frontend Integrator

**Objetivo**
Substituir placeholders por dados reais com estados de UI completos.

**Escopo**
- Telas críticas: Dashboard, Agenda, Finance, Services, AI Config
- Estados de UI: loading, error, empty, success
- Ações CRUD com feedback

**Fora de Escopo**
- Refatoração estética
- Mudanças de layout

**Entradas Obrigatórias**
- Lista de telas críticas
- Contratos de dados (PA-DataContracts)
- Matriz RBAC (RBAC_V1)

**Processo Sugerido**
1. Para cada tela:
   - Conectar ao hook de dados correto
   - Implementar estados: loading, error, empty, success
   - Aplicar guards de ação por role
   - Adicionar feedback de ação (toast, modal)
2. Validar fluxo:
   - Carregamento inicial
   - Erro de dados
   - Vazio de dados
   - Sucesso de ação

**Saída Obrigatória**
```json
{
  "integracoes": [
    {
      "tela": "Dashboard",
      "arquivo": "src/components/dashboard/Dashboard.tsx",
      "hook": "useAppointments()",
      "estados_ui": {
        "loading": "LoadingSkeleton implementado",
        "error": "ErrorState implementado",
        "empty": "EmptyState implementado"
      },
      "guards_role": [
        {
          "acao": "view",
          "roles_permitidos": ["owner", "employee"]
        }
      ],
      "feedback_acao": "Toast de sucesso ao atualizar dados"
    }
  ]
}
```

**Critérios de Aceite**
- Tela sem placeholder crítico
- Estados loading/error/empty/success implementados
- Guards de role aplicados
- Feedback de ação claro

**Riscos e Mitigação**
- Risco: estados incompletos
  - Mitigação: checklist obrigatório por tela

---

### PA-AI Config Integrator

**Objetivo**
Persistir e carregar configurações da IA por tenant com controle de permissão.

**Escopo**
- Entidades: bot_configs, knowledge_base, chat_memory
- Permissões: owner (full), employee (deny)
- Persistência e carregamento confiável

**Fora de Escopo**
- Implementação da lógica de IA

**Entradas Obrigatórias**
- Lista de tabelas AI: bot_configs, knowledge_base, chat_memory
- Regra RBAC: employee deny em aiconfig

**Processo Sugerido**
1. Implementar persistência:
   - Carregar config por tenant
   - Salvar alterações (owner only)
   - Employee não acessa nenhuma rota/ação
2. Tratamento de erro:
   - Fallback para config padrão
   - Toast de erro ao salvar
3. Validação de permissão:
   - Guard de rota: /aiconfig só owner
   - Guard de ação: salvar/alterar só owner

**Saída Obrigatória**
```json
{
  "fluxos": [
    {
      "operacao": "carregar_config",
      "tabelas": ["bot_configs", "knowledge_base"],
      "permissao": "owner_only",
      "fallback": "configuracao_padrao"
    },
    {
      "operacao": "salvar_config",
      "tabelas": ["bot_configs", "knowledge_base"],
      "permissao": "owner_only",
      "validacao": "verificar campos obrigatórios"
    }
  ],
  "guards": [
    {
      "rota": "/aiconfig",
      "roles_permitidos": ["owner"],
      "role_bloqueado": ["employee"]
    }
  ]
}
```

**Critérios de Aceite**
- Owner pode salvar/carregar config
- Employee não acessa nenhuma rota/ação
- Erro tratado com fallback
- Validação de campos obrigatórios

**Riscos e Mitigação**
- Risco: config corrompida
  - Mitigação: fallback para padrão

---

### PA-Metrics Planner

**Objetivo**
Separar métricas de previsão (agendado) e realizado (concluído) com KPIs confiáveis.

**Escopo**
- Status de agendamento: scheduled (previsto) vs completed (realizado)
- KPIs de receita, conversão, retenção
- Fontes canônicas por KPI

**Fora de Escopo**
- Implementação de gráficos

**Entradas Obrigatórias**
- Dados de agendamentos (appointments)
- Dados de financeiro (finance_transactions)

**Processo Sugerido**
1. Separar bases:
   - Previsão: appointments where status = 'scheduled'
   - Realizado: appointments where status = 'completed'
2. Definir KPIs:
   - Receita prevista: sum(scheduled.price)
   - Receita realizada: sum(completed.price)
   - Conversão: completed / scheduled
   - Ticket médio: sum(completed.price) / count(completed)
3. Definir fontes canônicas:
   - Cada KPI tem fórmula e fonte única

**Saída Obrigatória**
```json
{
  "kpis": [
    {
      "nome": "receita_prevista",
      "descricao": "Soma dos preços de agendamentos pendentes",
      "formula": "SUM(appointments.price) WHERE status = 'scheduled'",
      "fonte": "appointments",
      "periodicidade": "diaria"
    },
    {
      "nome": "receita_realizada",
      "descricao": "Soma dos preços de agendamentos concluídos",
      "formula": "SUM(appointments.price) WHERE status = 'completed'",
      "fonte": "appointments",
      "periodicidade": "diaria"
    },
    {
      "nome": "taxa_conversao",
      "descricao": "Proporção de agendamentos concluídos",
      "formula": "COUNT(completed) / COUNT(scheduled) * 100",
      "fonte": "appointments",
      "periodicidade": "diaria"
    },
    {
      "nome": "ticket_medio",
      "descricao": "Valor médio por atendimento realizado",
      "formula": "SUM(completed.price) / COUNT(completed)",
      "fonte": "appointments",
      "periodicidade": "diaria"
    }
  ]
}
```

**Critérios de Aceite**
- KPIs separados em previsto vs realizado
- Fórmulas explícitas
- Fontes canônicas definidas
- Periodicidade definida

**Riscos e Mitigação**
- Risco: confundir previsto com realizado
  - Mitigação: separar status claramente

---

### PA-QA & Release Manager

**Objetivo**
Validar regressão funcional e técnica, e preparar rollout seguro.

**Escopo**
- Testes por perfil (owner, employee)
- Testes por tenant
- Testes de segurança
- Plano de rollback

**Fora de Escopo**
- Testes de performance (não críticos)

**Entradas Obrigatórias**
- Lista de rotas críticas
- Matriz RBAC (RBAC_V1)
- Lista de funcionalidades críticas

**Processo Sugerido**
1. Testes funcionais:
   - Por perfil: owner (acesso total), employee (limitado)
   - Por tenant: dados do tenant A não aparecem para tenant B
2. Testes de segurança:
   - Tentativa de acesso indevido
   - Tentativa de bypass de guards
3. Regressão:
   - Funcionalidades que funcionavam ainda funcionam
4. Plano de release:
   - Rollout incremental (se necessário)
   - Plano de rollback

**Saída Obrigatória**
```json
{
  "testes": [
    {
      "tipo": "funcional",
      "perfil": "owner",
      "cenario": "Acessar financeiro",
      "resultado": "PASSOU",
      "evidencia": "Dashboard financeiro carregou corretamente"
    },
    {
      "tipo": "seguranca",
      "perfil": "employee",
      "cenario": "Tentar acessar financeiro",
      "resultado": "BLOQUEADO",
      "evidencia": "Redirecionado para acesso negado"
    }
  ],
  "regressao": [
    {
      "funcionalidade": "Dashboard",
      "status": "OK",
      "comentarios": "Sem regressões identificadas"
    }
  ],
  "release": {
    "go_no_go": "GO",
    "riscos": [],
    "rollback": "Pronto para executar caso necessário"
  }
}
```

**Critérios de Aceite**
- Todos os testes funcionais passaram
- Testes de segurança validados
- Regressão zero crítico
- Plano de rollback documentado

**Riscos e Mitigação**
- Risco: regressão não identificada
  - Mitigação: smoke test completo

---

## Status da Versão

- [ ] Blueprint congelada
- [ ] Em implementação de prompts
- [ ] Em validação
- [ ] Aprovado

**Aprovado por**: ______________  
**Data de aprovação**: ______________
