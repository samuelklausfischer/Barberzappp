# 🔍 BarberZap - Análise Completa de Sequência de Follow-up Outbound

**Data:** 2026-02-23  
**Versão:** 1.0  
**Autor:** Subagent Analysis  
**Stakeholder:** Samuel (Gestor de Prospecção)  
**Contexto:** Estratégia de follow-up para leads de prospecção ativa

---

## 📊 EXECUTIVE SUMMARY

### Situação Atual

| Aspecto | Status | Descrição |
|---------|--------|-----------|
| **Script 1º Contato** | ✅ Documentado | Time test + impact (strategy doc) |
| **Follow-up #2** | 🔴 AUSENTE | Não documentado |
| **Follow-up #3** | 🔴 AUSENTE | Não documentado |
| **Follow-up #4** | 🔴 AUSENTE | Não documentado |
| **Last Chance** | 🔴 AUSENTE | Não documentado |
| **Script Demo CTA** | ⚠️ PARCIAL | "Quer testar grátis por 7 dias?" (básico) |
| **Timing Definido** | 🔴 AUSENTE | Sem tempos entre follow-ups |
| **Segmentação Scripts** | ⚠️ BÁSICA | Perfil (simples/premium/grande) definido |
| **Personalização Dinâmica** | 🔴 AUSENTE | Sem lógica de personalização |
| **CRM Tracking** | ✅ IMPLEMENTADO | Funnel stages prontos para prospecção |

### O Que Existe (Documentado)

#### Fonte: `/root/Barberzap SITE/docs/strategy/ESTRATEGIA_VENDAS_BARBEIROS.md`

1. **Mensagem de Teste de Tempo** (1º contato)
2. **Pitch Direto** (ROI focus)
3. **Segmentação por Perfil** (Simples, Premium, Grande)
4. **Cálculo ROI por Perfil**

#### Fonte: `/root/Barberzap SITE/docs/reports/ANALISE_LEAD_TRACKING_PROSPECCAO.md`

5. **Funil de CRM** com 12 estágios
6. **Schema de Tracking** completo
7. **Workflow de Importação de Leads CSV**
8. **Auto-staging logic** para respostas

---

## 🎯 SEQUÊNCIA EXISTENTE DE SCRIPTS

### 1º Contato documentedado

#### Mensagem Após o "Teste de Tempo"
```
"Olá, vi sua barbearia no Maps e fiz um teste. Uma mensagem de agendamento 
que fica 15 minutos sem resposta é um cliente que você pode ter perdido agora."
```

#### Pitch Direto
```
"Eu treinei uma IA especificamente para barbeiros que responde em 5 segundos, 
agenda o horário e já lança no seu financeiro. 24h por dia."
```

#### Script de ROI (Cálculo de Impacto)
```
"Se você perde apenas 2 clientes por dia por demora no WhatsApp (Ticket R$50), 
são **R$ 3.000,00 a menos no seu bolso** por mês. O BarberZap resolve isso 
por uma fração desse valor."
```

---

## 📋 RELATÓRIO: O QUE FALTA

### Scripts AUSENTES por Etapa

#### 🔴 Follow-up #2 (24-48h após 1º contato)
- **Status:** NÃO EXISTE
- **Objetivo:** Re-engajar leads que não responderam ao 1º contato
- **Target:** Leads em estágio `contacted` com `messages_received = 0`
- **Conteúdo necessário:**
  - Reforçar problema (demora no atendimento)
  - Apresentar solução diferente (demo visual)
  - Prova social (caso de sucesso similar)
  - CTA claro (demo curta)

#### 🔴 Follow-up #3 (3-5 dias após 2º follow-up)
- **Status:** NÃO EXISTE
- **Objetivo:** Última tentativa antes de considerar lost
- **Target:** Leads em estágio `contacted` com `messages_sent >= 3`
- **Conteúdo necessário:**
  - Urgência (escassez de slots disponíveis)
  - Diferencial competitivo (exclusividade)
  - Benefício garantido (teste gratuito sem compromisso)
  - CTA de baixo atrito (responder com "demonstrar" ou ver link)

#### 🔴 Follow-up #4 / Last Chance (7-10 dias)
- **Status:** NÃO EXISTE
- **Objetivo:** Despedida profissional, manter lead warm para futuro
- **Target:** Leads marcados como `unresponsive`
- **Conteúdo necessário:**
  - Mensagem de encerramento (reengajamento futuro)
  - Opt-out explícito (responder "pare" para parar)
  - Manter canal aberto ( WhatsApp ativo quando quiser )

#### 🔴 Script para Respostas Positivas (Demo CTA)
- **Status:** PARCIAL - apenas CTA básico
- **Objetivo:** Converter interesse em agendamento de demo
- **Target:** Leads em estágio `interested`
- **Conteúdo necessário:**
  - Otimizar hora de demo (quando melhor?)
  - Formato da demo (WhatsApp / Call / Video)
  - Duração (15-20 minutos)
  - O que o barbeiro vai ver (demo ao vivo)

#### 🔴 Script de Conclusão de Demo
- **Status:** NÃO EXISTE
- **Objetivo:** Mover para trial/assinatura após demo
- **Target:** Leads em estágio `demo_scheduled` após demo realizada
- **Conteúdo necessário:**
  - Recap do que foi visto
  - Próximo passo (ativar trial)
  - Instruções de setup (rápido)
  - CTA para checkout de teste grátis

---

## ⏱️ TIMING DE FOLLOW-UP (RECOMENDADO)

### Proposta de Sequência Temporal

```
DIA 0 - 1º Contato
├─ Horário: 09:00 - 11:00 ou 14:00 - 16:00 (evitar fuso horário)
├─ Mensagem: Time test + Pitch
└─ Status CRM: new → contacted

DIA 1 ou 2 - Follow-up #2 (Re-engajamento)
├─ Timing: 24-48h após 1º contato
├─ Condição: Sem resposta ao 1º
├─ Objetivo: Prova social + benefícios
└─ Status CRM: contacted → contacted (messages_sent++)

DIA 3 ou 4 - Follow-up #3 (Urgência)
├─ Timing: 72-96h após 1º contato
├─ Condição: Sem resposta ao 1º e 2º
├─ Objetivo: Última tentativa forte
└─ Status CRM: contacted → contacted (messages_sent++)

DIA 5 ou 6 - Follow-up #4 (Last Chance)
├─ Timing: 120-144h após 1º contato
├─ Condição: Sem resposta a nenhum follow-up
├─ Objetivo: Encerramento profissional
└─ Status CRM: contacted → unresponsive

RESPOSTA POSITIVA - Demo CTA (Imediato)
├─ Timing: Assim que responder positivamente
├─ Transição: interested → demo_requested
└─ Agendar demo em 24-48h

DEMO REALIZADA - Next Steps
├─ Timing: Imediatamente após demo
├─ Transição: demo_requested → considering
└─ Follow-up em 3 dias se não converter
```

### Regras de Envio

| Regra | Descrição |
|-------|-----------|
| **Máximo mensagens** | 5 tentativas (incluindo 1º contato) |
| **Horário permitido** | 09:00 - 12:00 e 14:00 - 19:00 (fuso local) |
| **Dias bloqueados** | Domingo e feriados |
| **Fator horário** | Calcular fuso horário por cidade |
| **Respeito opt-out** | Se responder "pare" ou "não quero" → not_interested/lost |

---

## 🎯 SEGMENTAÇÃO DE SCRIPTS

### Por Perfil de Barbearia (EXISTENTE no Strategy Doc)

| Perfil | Volume Cad. | Foco Principal | Ticket Médio | ROI Mensal Estimado |
|--------|------------|----------------|--------------|---------------------|
| **Simples** | 1-2 cadeiras | Profissionalismo e economia de tempo | R$ 40 | **R$ 2.400** |
| **Premium** | Experiência | Experiência do cliente e conveniência | R$ 60 | **R$ 3.600** |
| **Grande/Rede** | 3+ cadeiras | Gestão, controle equipe, financeiro | R$ 50 | **R$ 4.500** |

#### Scripts Adaptados por Perfil

**Simples:**
- Enfoque: "Não precisa responder tudo, a IA faz isso"
- ROI: "Economiza tempo para mais cortes"
- CTA: "Teste grátis de 7 dias, pode parar quando quiser"

**Premium:**
- Enfoque: "Seu cliente espera atendimento de alto nível"
- ROI: "Cada cliente perdido R$ 60"
- CTA: "Exclusivo para barbearias premium"

**Grande/Rede:**
- Enfoque: "Centralize e tenha visão do negócio"
- ROI: "Perde 3 clientes/dia = R$ 4.500/mês"
- CTA: "Demonstração para equipe completa"

### Por Cidade/Região (AUSENTE)

| Critério | Status | Necessidade |
|----------|--------|-------------|
| **Fuso horário** | 🔴 NÃO implementado | Crítica - evitar msgs de madrug |
| **Região (Sul/Norte)** | 🔴 NÃO implementado | Baixa |
| **Cidade específica** | 🔴 NÃO implementado | Baixa |
| **Personalização local** | 🔴 NÃO implementado | Baixa |

**Recomendação:** Implementar calculadora de fuso horário por cidade para enviar mensagens no horário local correto.

---

## 🔄 FLOWCHART DE HANDLING DE RESPOSTAS

### Fluxo de Decisão para Respostas

```
┌─────────────────────────────────────────────────────────┐
│                  LEAD EM STAGE: CONTACTED                │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Lead Responde? │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
         SIM              NÃO             APOSTROFA
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐      ┌─────────────┐   ┌──────────────┐
    │ Analisa  │      │ Envia      │   │ Analisa      │
    │ Intent   │      │ Follow-up   │   │ Comando     │
    └──────────┘      │ #2 (24-48h) │   └──────────────┘
          │           └─────────────┘          │
          ▼                                     │
┌─────────────────┐                           │
│  Palavras-chave │                           │
│  de Interesse   │                           │
│  (interessado,  │                           │
│  quero, demo)   │                           │
└────────┬────────┘                           │
         │                                     │
         ▼                                     │
    ┌─────────────┐                          │
    │ STAGE:      │                          │
    │ INTERESTED  │                          │
    └──────┬──────┘                          │
           │                                 │
           ▼                                 │
┌─────────────────────┐                       │
│  Script Demo CTA    │                       │
│  (AGENDAR DEMO)     │                       │
└──────────┬──────────┘                       │
           │                                 │
           ▼                                 │
    ┌─────────────┐                         │
    │ STAGE:      │                         │
    │ DEMO_       │                         │
    │ REQUESTED   │                         │
    └─────────────┘                         │
                                            ▼
                                   ┌──────────────────┐
                                   │ Comandos especiais │
                                   └────────┬──────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         │                  │                  │
                         ▼                  ▼                  ▼
                    "PARE"        "DEPOIS"           "CARO"
                         │                  │                  │
                         ▼                  ▼                  ▼
                   NOT_INTERESTED    CONSIDERING       NOT_INTERESTED
                         │                  │               (REBUT?)
                         │                  │                  │
                         │                  ▼                  │
                         │            Follow-up            │
                         │            em 3 dias            │
                         │                                  │
                         └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            LEAD EM STAGE: UNRESPONSIVE                  │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Sem resposta  │
                    │  por 5 mensagens│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Last Chance    │
                    │  (Follow-up #4) │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Opt-out?       │
                    └────────┬────────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
           OPT-OUT        SEM RESPOSTA   RESPOSTA
               │             │             │
               ▼             ▼             ▼
          NOT_INTERESTED    LOST           RESPONDED
```

### Handlers de Resposta Negativa

#### 1. "Não tenho interesse"
```
Script: "Sem problemas! Se mudar de ideia no futuro, pode me procurar.
         Sou o [Nome] da BarberZap. Boa sorte nos negócios! 👍"
Stage: NOT_INTERESTED
Action: Marcar lead como lost com motivo "sem interesse"
```

#### 2. "Ligue depois"
```
Script: "Claro! Qual melhor horário para conversar?
         [Ex: Manhã 9-12 / Tarde 14-18]"
Stage: CONSIDERING
Follow-up: Agendar ligação no horário informado
```

#### 3. "Muito caro"
```
Script: "Entendo! O investimento é R$ 49,90/mês, mas imagine o 
         seguinte: se você perde 2 clientes por demora no WhatsApp
         (R$ 50 cada), são R$ 3.000 que DEIXA de ganhar 
         por mês. O BarberZap evita essa perda em 7 dias.
         
         Experimentou nossa demonstração gratuita de 7 dias?
         Pode cancelar a qualquer sem custo."
Stage: INTERESTED (re-engaged)
Action: Tentar demo gratuita
```

#### 4. "Não preciso agora / Estou avaliando"
```
Script: "Deixa eu te perguntar: qual critério você está usando
         para avaliar isso? Vai testar alguma solução similar
         ou está comparando custo X benefício?
         
         Posso te passar um comparativo simples?"
Stage: CONSIDERING
Follow-up: 3 dias após
```

#### 5. Já tenho sistema
```
Script: "Legal! Qual sistema você usa hoje?
         Consigo te mostrar um comparação rápida - às vezes a
         IA da BarberZap faz coisas que outros não fazem
         (como agendar em 5 segundos 24h)."
Stage: CONSIDERING
Action: Fornecer comparação
```

---

## 📊 MÉTRICAS DE FOLLOW-UP

### KPIs por Etapa

| Etapa | KPI | Meta | Status |
|-------|-----|------|--------|
| **1º Contato** | Taxa de resposta | >25% | ⚠️ Não medido |
| **Follow-up #2** | Taxa de resposta | >15% | 🔴 N/A |
| **Follow-up #3** | Taxa de resposta | >10% | 🔴 N/A |
| **Resposta → Demo** | Conversão | >20% | ⚠️ Não medido |
| **Demo → Trial** | Conversão | >40% | ⚠️ Não medido |
| **Trial → Assinatura** | Conversão | >60% | ⚠️ Não medido |
| **Mensagens/Dia** | Volume | 50+ | 🔴 N/A |
| **Unresponsive Rate** | Leads mortos | <50% | 🔴 N/A |

### Métricas no CRM Tracker (IMPLEMENTADAS)

Fonte: `ANALISE_LEAD_TRACKING_PROSPECCAO.md`

```sql
-- Consultas disponíveis para métricas
SELECT * FROM crm_prospection_dashboard;
SELECT * FROM crm_leads_needs_followup;
SELECT * FROM crm_message_analytics;
```

**Métricas disponíveis:**
- ✅ Leads por estágio (funnel)
- ✅ Taxa de resposta (mensagens recebidas / enviadas)
- ✅ Tempo médio de resposta
- ✅ Contagem de mensagens por lead
- ✅ Taxa de conversão por estágio
- ❌ Tempo de follow-up timing (não implementado)

---

## 🎲 PERSONALIZAÇÃO DINÂMICA

### Variáveis Disponíveis para Scripts

| Variável | Fonte | Uso |
|----------|-------|-----|
| **Nome barbearia** | CSV / CRM | Personalização básica |
| **Cidade** | CSV / CRM | Referência local |
| **Perfil (simples/premium)** | Manual / Detectado | Script segmentado |
| **Quantidade cadeiras** | CSV / Detectado | Script segmentado |
| **Fuso horário** | Calculado por cidade | Timing de envio |
| **Respostas anteriores** | CRM messages | Contexto conversa |
| **Data último contato** | CRM last_contact_at | Variação script |

### Scripts Dinâmicos (PROPOSTA)

#### Módulo de Template Engine (NÃO EXISTE)

```python
# Proposta de implementação
def generate_contact_script(lead_data, stage, followup_number):
    """
    Gera script personalizado baseado em:
    - Dados do lead (nome, cidade, perfil)
    - Estágio atual (contacted, considering, etc.)
    - Número do follow-up (0=1º contato, 1=2º follow-up, etc.)
    - Histórico de respostas
    """
    
    # Templates por estágio
    templates = {
        'first_contact': [
            "Olá {nome_barbeiro}! Vi sua barbearia {barbearia} no Maps de {cidade}.",
            "Fiz um teste de agendamento...",
            # ...
        ],
        'followup_2': [
            "{nome_barbeiro}, tudo bem?",
            "Aqui da BarberZap querendo...",
            # ...
        ],
        'followup_3': [
            "Só uma pergunta rápida, {nome_barbeiro}...",
            # ...
        ],
        'demo_cta': [
            "Legal que se interessou!",
            "Quando é melhor pra demonstrar?",
            # ...
        ],
    }
    
    # Seleciona template baseado em perfil
    profile = lead_data['profile']  # simple, premium, large
    template = templates[stage][followup_number][profile]
    
    # Substitui variáveis
    script = template.format(**lead_data)
    
    return script
```

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### Arquivos e Caminhos Relevantes

#### Documentos de Estratégia
- `/root/Barberzap SITE/docs/strategy/ESTRATEGIA_VENDAS_BARBEIROS.md`
- Scripts existentes documentados here

#### CRM Prospection Module
- `/root/Barberzap SITE/docs/reports/ANALISE_LEAD_TRACKING_PROSPECCAO.md`
- Schema completo, workflow, funil já definidos

#### CRM Prospection Python Module (PROPOSTO)
- `/root/Barberzap SITE/barberzap_python/crm/crm_prospection.py`
- ✅ EXISTS (partial implementation from lead tracking doc)
- ✅ Has FunnelStage and LeadSource enums
- ✅ Has update_funnel_stage() function
- ✅ Has record_outbound_message() function
- ✅ Has record_inbound_message() function with auto-staging logic

#### Data Files
- `/root/Barberzap SITE/data/Prospecção de Leads - sheet1.csv`
- `/root/Barberzap SITE/data/lista_prospeccao_limpa.csv`
- 1.074 leads prontos para prospecção

### Implementação Falta de Scripts

**Status:** Arquivo de scripts AUSENTE

Local sugerido:
```
/root/Barberzap SITE/barberzap_python/prospection/
├── __init__.py
├── scripts.py          # ← A CRIAR - Todos os templates de scripts
├── followup_engine.py  # ← A CRIAR - Engine de follow-up
├── timing.py           # ← A CRIAR - Calculadora de timing
└── templates/
    ├── first_contact.md
    ├── followup_2.md
    ├── followup_3.md
    ├── followup_4_last_chance.md
    ├── demo_cta.md
    ├── demo_conclusion.md
    └── rebuttals.md
```

---

## 📋 CHECKLIST DE SCRIPTS A CRIAR

### Prioridade ALTA

🔴 **Follow-up #2** (Re-engajamento)
```
├─ Variante perfil simples
├─ Variante perfil premium
├─ Variante perfil grande
└─ Template base
```

🔴 **Follow-up #3** (Urgência)
```
├─ Variante perfil simples
├─ Variante perfil premium
├─ Variante perfil grande
└─ Template base
```

🔴 **Follow-up #4 / Last Chance** (Encerramento)
```
├─ Template base
└─ Opt-out explícito
```

🔴 **Demo CTA** (Agendar demo)
```
├─ Proposta de horário
├─ Formato da demo
├─ Duração
└─ O que vai ver
```

### Prioridade MÉDIA

🟡 **Script de Conclusão de Demo**
```
├─ Recap do demo
├─ Próximo passos
├─ Instruções de setup
└─ CTA para trial
```

🟡 **Rebuts (Respostas a objeções)**
```
├─ "Muito caro"
├─ "Não tenho interesse"
├─ "Já tenho sistema"
├─ "Ligue depois"
└─ "Estou avaliando"
```

### Prioridade BAIXA

🟢 **Personalização por Região**
```
├─ Script específico por DDD (region)
└─ Referências locais
```

---

## 🚀 PRÓXIMOS PASSOS (ACTION ITEMS)

### Curto Prazo (1-2 dias)

1. **Criar arquivo de scripts** (`/root/Barberzap SITE/barberzap_python/prospection/scripts.py`)
   - Documentar todos os scripts existentes
   - Criar estrutura de templates por perfil

2. **Definir timing definitivo**
   - Decidir: 24h (1 dia) ou 48h (2 dias) para follow-up #2
   - Definir horários permitidos (fuso horário)
   - Criar regra de dias bloqueados

3. **Implementar Follow-up #2**
   - Criar 3 variantes (simples, premium, grande)
   - Testar com pequeno grupo de leads

### Médio Prazo (3-5 dias)

4. **Implementar Follow-up #3 e #4**
   - Criar templates completos
   - Integrar com CRM staging logic

5. **Criar Script Demo CTA**
   - Definir processo de agendamento
   - Criar form ou API endpoint para agendar

6. **Implementar Módulo de Timing**
   - Calculadora de fuso horário por cidade
   - Scheduler de envios (usando APScheduler ou similar)

### Longo Prazo (1-2 semanas)

7. **Criar Engine de Follow-up Completa**
   - Automatizar sequência inteira
   - Integração com Evolution API para envios outbound
   - Dashboard de monitoramento

8. **Implementar Rebuts**
   - Scripts para todas as objeções comuns
   - Navegação entre estágios baseada em resposta

9. **Testes A/B**
   - Testar diferentes versões de scripts
   - Medir taxas de conversão por script

10. **Integração com Lead Scoring**
    - Score de engajamento baseado em respostas
    - Priorização de leads para follow-up

---

## 📊 ESTIMATIVA DE CONVERSÃO (PROJEÇÃO)

### Cenário Atual (SEM follow-ups completos)

| Etapa | Leads | Conversão % | Resultado |
|-------|-------|-------------|----------|
| Total Leads | 1.074 | 100% | 1.074 |
| 1º Contato enviado | 1.074 | 100% | 1.074 |
| Respondem ao 1º | 269 | 25% | 269 |
| Demo agendada | 54 | 20% | 54 |
| Trial iniciado | 22 | 40% | 22 |
| Assinaturas | 13 | 60% | **13** |

**Conversão final: 1.2% (13 clientes de 1.074 leads)**

### Cenário Otímizado (COM follow-ups completos)

| Etapa | Leads | Conversão % | Resultado |
|-------|-------|-------------|----------|
| Total Leads | 1.074 | 100% | 1.074 |
| 1º Contato enviado | 1.074 | 100% | 1.074 |
| Follow-up #2 reengaja | 322 | +30% | 269 + 322 = 591 |
| Follow-up #3 reengaja | 118 | +20% | 591 + 118 = 709 |
| Total respondem | 709 | 66% | 709 |
| Demo agendada | 142 | 20% | 142 |
| Trial iniciado | 57 | 40% | 57 |
| Assinaturas | 34 | 60% | **34** |

**Conversão final: 3.2% (34 clientes de 1.074 leads)**

### Impacto:

- **Aumento de conversão:** +162% (13 → 34 assinaturas)
- **Acrescimo de MRR:** +21 assinaturas × R$ 49,90 = **R$ 1.048/mês**
- **ROI da implementação follow-ups:** **Extremamente alto**

---

## 🎯 CONCLUSÃO

### O QUE EXISTE

✅ Estratégia base bem definida
✅ Schema CRM completo para prospecção
✅ Funil de 12 estágios implementado
✅ Scripts de 1º contato documentados
✅ Segmentação por perfil (simples/premium/grande)
✅ Cálculo ROI por perfil
✅ Auto-staging logic para respostas

### O QUE FALTA

🔴 **Follow-up #2, #3, #4** (sequência completa de re-engajamento)
🔴 **Script Demo CTA** detalhado (agendamento de demo)
🔴 **Script de Conclusão de Demo** (next steps)
🔴 **Rebuts** (respostas a objeções)
🔴 **Timing definido** (quando enviar cada follow-up)
🔴 **Engine de follow-up automatizada** (não existe)
🔴 **Personalização dinâmica** (variáveis em scripts)
🔴 **Calculadora de fuso horário** (por cidade)
🔴 **Métricas de follow-up** (taxa de resposta por etapa)

### PRIORIDADE DE IMPLEMENTAÇÃO

1. ⚠️ **URGENTE** (1-2 dias): Criar Follow-up #2 (maior impacto)
2. ⚠️ **URGENTE** (1-2 dias): Definir timing definitivo
3. 🟡 **IMPORTANTE** (3-5 dias): Criar Follow-up #3 e #4
4. 🟡 **IMPORTANTE** (3-5 dias): Criar Script Demo CTA
5. 🟢 **DESEJÁVEL** (1-2 semanas): Engine de follow-up automatizada
6. 🟢 **DESEJÁVEL** (1-2 semanas): Rebuts completos

---

### Anexos

#### A. Funil de CRM (Completo)
```
new → contacted → responded → interested → demo_requested → demo_scheduled
  ⟶ considering ⟶ customer ⟶ active
  ⟶ not_interested
  ⟶ unresponsive ⟶ lost
  ⟶ failed
```

#### B. Schema CRM Extended (para Prospecção)
Ver `/root/Barberzap SITE/docs/reports/ANALISE_LEAD_TRACKING_PROSPECCAO.md`
Seção "A. Schema CRM Extendido para Prospecção"

#### C. Lista de Leads Disponíveis
- `/root/Barberzap SITE/data/Prospecção de Leads - sheet1.csv`
- 1.074 leads limpos
- 20+ cidades
- DDD 41 (390 leads), 11 (350 leads)

---

**Relatório Gerado em:** 2026-02-23  
**Versão:** 1.0  
**Status:** 📋 Em análise - Aguardando definição de scripts de follow-up
