# BarberZap Admin Dashboard - Páginas Resumidas

---

## Visão Geral

**11 páginas funcionais** cobrindo todos os aspectos da gestão de barbearia.

---

## 1. Dashboard Home

**Rota:** `/admin/dashboard`  
**Ícone:** LayoutDashboard

**Objetivo:** Visão consolidada com métricas principais e KPIs.

**Métricas Exibidas:**
- Receita do dia/mês
- Total de agendamentos
- Novos clientes
- Taxa de ocupação
- Ticket médio

**Componentes:**
- StatCards com métricas em tempo real
- Chart de faturamento (últimos 7 dias)
- Agenda do dia compacta
- Lista de agendamentos pendentes
- Notificações recentes

---

## 2. Agenda (Gerenciamento de Agendamentos)

**Rota:** `/admin/agenda`  
**Ícone:** Calendar

**Objetivo:** Gerenciar todos os agendamentos com calendar interativo.

**Features:**
- Calendar view (mensal/semanal/diária)
- Drag & drop para reagendamento
- Modal de agendamento completo
- Slots de horário dinâmicos por barbeiro
- Filtros por status, barbeiro e busca
- Ações em massa
- Integração WhatsApp para confirmações

**Status:**
- pending (Pendente)
- confirmed (Confirmado)
- completed (Concluído)
- cancelled (Cancelado)
- no_show (Não compareceu)
- in_progress (Em andamento)

**Modal de Agendamento:**
- Cliente (dropdown)
- Serviço (dropdown)
- Barbeiro (dropdown)
- Data (date picker)
- Horário (grid de slots)
- Duração (minutos)
- Preço (currency)
- Status
- Pagamento
- Observações

**Estatísticas:**
- Agendamentos hoje
- Agendamentos esta semana
- Cancelados
- Duração média

---

## 3. Horários (Horário de Funcionamento)

**Rota:** `/admin/horarios`  
**Ícone:** Clock

**Objetivo:** Configurar horários de funcionamento.

**Features:**
- Configuração por dia da semana
- Pausas/almoço
- Feriados e datas especiais
- Horário de verão
- Múltiplos turnos

---

## 4. Clientes (CRM Completo)

**Rota:** `/admin/clientes`  
**Ícone:** Users

**Objetivo:** Gestão completa da base de clientes.

**Features:**
- Lista de clientes com busca e filtros
- Cards detalhados
- Grid e list view
- Histórico de agendamentos
- Métricas por cliente: total gasto, visitas, última visita
- Exportação CSV
- Envio WhatsApp em massa

**Card do Cliente:**
```
┌──────────────────────────────────┐
│ [JS] João Silva                │
│      🟢 Ativo                   │
│                                  │
│ joao@email.com                   │
│ (11) 98765-4321                 │
│                                  │
│ 24 visitas | R$ 2.450 total     │
│ Última há 2 dias                 │
└──────────────────────────────────┘
```

**Status:**
- active (Ativo)
- inactive (Inativo)
- pending (Pendente)
- archived (Arquivado)

**Estatísticas:**
- Total de clientes
- Clientes ativos
- Clientes inativos
- Clientes pendentes

**Ações:**
- Novo cliente
- Editar
- Arquivar
- Enviar mensagem WhatsApp
- Exportar CSV

---

## 5. Serviços (Catálogo de Serviços)

**Rota:** `/admin/servicos`  
**Ícone:** Scissors

**Objetivo:** Gerenciar o catálogo de serviços.

**Features:**
- Lista de serviços com preço e duração
- Categorização (cabelo, barba, combo, acessórios)
- Ativar/desativar serviços
- Upload de imagens
- Descrições detalhadas

---

## 6. Funcionários (Gestão de Equipe)

**Rota:** `/admin/funcionarios`  
**Ícone:** UserCog

**Objetivo:** Gerenciar os barbeiros/funcionários.

**Features:**
- Cadastro de funcionários
- Configuração de comissão
- Horários individuais
- Especialidades
- Foto de perfil
- Métricas de desempenho

---

## 7. Financeiro (Faturamento)

**Rota:** `/admin/financeiro`  
**Ícone:** DollarSign

**Objetivo:** Acompanhar faturamento e gerar relatórios.

**Dashboard de Métricas:**
- Faturamento do mês
- Total de agendamentos
- Ticket médio
- Faturamento do dia

**Gráficos:**
- Revenue Line Chart: Últimos 7 dias
- Revenue Bar Chart: Por categoria de serviço

**Breakdown por Pagamento:**
- Cash (Dinheiro) 💵
- Credit (Crédito) 💳
- Debit (Débito) 💳
- PIX ⚡
- Pending (Pendente) ⏳

**Filtros:**
- Busca por nome do cliente
- Período (date range)
- Filtro por barbeiro
- Filtro por método de pagamento
- Filtro por status

**Tabela de Transações:**
```
| Data/Hora | Cliente | Serviço | Barbeiro | Valor | Pagamento | Status |
```

**Ações:**
- Exportar CSV
- Imprimir relatórios
- Filtrar períodos

---

## 8. WhatsApp (Integração)

**Rota:** `/admin/whatsapp`  
**Ícone:** MessageCircle

**Objetivo:** Gerenciar integração via Evolution API.

**Features:**
- Status de conexão em tempo real
- QR Code para conectar dispositivos
- Configuração da API (URL, API key, instância)
- Enviar mensagens de teste
- Logs de webhook (mensagens recebidas)
- Regras de resposta automática com IA
- Simular webhooks para teste

**Painel de Status:**
- Estado: Conectado/Desconectado
- Instância
- Última verificação
- QR Code (quando desconectado)

**Estatísticas:**
- Mensagens recebidas
- Regras ativas de auto-reply
- Instância ativa

**Enviar Mensagem de Teste:**
- Telefone
- Mensagem
- Botão enviar

**Regras de Auto-Reply:**
```
| Nome | Palavras-chave | Resposta | IA | Status |
|------|----------------|----------|-----|--------|
| Bem-vindo | oi, olá, hello | ... | ✅ | Ativo |
| Horários | horário, hora | ... | ❌ | Ativo |
```

**Configuração da API:**
- URL Base: `http://localhost:8080`
- API Key: Chave secreta
- Nome da Instância: `barberzap01`
- Webhook URL: Automatizado

---

## 9. IA Config (Secretária Virtual)

**Rota:** `/admin/ai-config`  
**Ícone:** BrainCircuit

**Objetivo:** Personalizar a secretária virtual (Ana).

**5 Abas:**

1. **Identidade:**
   - Nome da secretária ("Ana")
   - Foto de perfil
   - Mensagem de boas-vindas
   - Horário de funcionamento
   - Localização (endereço, cidade, estado, telefone)

2. **Voz & Tom:**
   - Seleção de tom (Profissional, Amigável, Enérgico, Descontraído)
   - Templates de resposta (saudação, agendamento, preços, localização)
   - Texto de fallback (quando não entende)

3. **Modelo:**
   - Escolha do modelo LLM (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
   - Temperatura (0.0 - 1.0)
   - Max Tokens
   - System Prompt (avançado)

4. **Especialistas:**
   - Ativar/desativar agentes especializados
   - **Agendamento** 📅 - Gestão de horários
   - **Preços** 💰 - Informações de valores
   - **Localização** 📍 - Endereço
   - **Outros** 💬 - Conversas gerais

5. **Conhecimento:**
   - Importar serviços (sincronizado)
   - Importar horários (sincronizado)
   - FAQ customizado
   - Sincronização em tempo real

**Preview ao Vivo:**
- Chat com a secretária
- Exibir prompt do sistema
- Testar em tempo real

**Estatísticas da IA:**
- Mensagens tratadas
- Taxa de sucesso
- Transferências para humano

---

## 10. Aparência (Tema e Branding)

**Rota:** `/admin/aparencia`  
**Ícone:** Palette

**Objetivo:** Personalizar aparência visual.

**Features:**
- Core colors (primário, secundário, background)
- Upload do logo da barbearia
- Tipografia personalizada
- Layout preferences
- Theme options (Dark, Light, System)

---

## 11. Configurações (Gerais)

**Rota:** `/admin/configuracoes`  
**Ícone:** Settings

**Objetivo:** Configurações gerais do sistema.

**Features:**
- Dados da barbearia (Nome, CNPJ, endereço)
- Configurações de agendamento (prazos, confirmações automáticas)
- Notificações (Email, WhatsApp, in-app)
- Integrações (Chaves de API, webhooks)
- Backup e restore de dados
- Logs do sistema

---

## Resumo de Funcionalidades por Página

| Página | Rotas | Features Principais |
|--------|-------|-------------------|
| Dashboard Home | dashboard | Métricas, charts, agenda compacta |
| Agenda | agenda | Calendar, drag & drop, filtros, WhatsApp |
| Horários | horarios | Config por dia, pausas, feriados |
| Clientes | clientes | CRM, busca, filtros, export, WhatsApp |
| Serviços | servicos | Catálogo, preços, categorias, imagens |
| Funcionários | funcionarios | Cadastro, comissão, horários, métricas |
| Financeiro | financeiro | Revenue chart, breakdown, transações, CSV |
| WhatsApp | whatsapp | Conexão Evolution API, auto-reply, logs |
| IA Config | ai-config | Secretária Ana, especialistas, modelo |
| Aparência | aparencia | Tema, cores, logo, tipografia |
| Configuracoes | configuracoes | Dados empresa, notificações, API, backup |

---

## Navegação

### Mobile (Bottom Nav - 4 itens)
1. Dashboard
2. Agenda
3. WhatsApp
4. Mais (➕) → abre sheet com restantes

### Desktop/Tablet (Sidebar - 11 itens)
1. Dashboard
2. Agenda
3. Horários
4. Clientes
5. Serviços
6. Funcionários
7. Financeiro
8. WhatsApp
9. IA Config
10. Aparência
11. Configurações

---

**Última atualização:** 2026-02-25  
**Versão:** 1.0.0
