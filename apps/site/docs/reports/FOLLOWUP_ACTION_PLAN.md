# 🎯 BarberZap - Plano de Ação: Follow-up Sequence

**Data:** 2026-02-23  
**Versão:** 1.0  
**Propósito:** Plano de ação imediato para implementar sequência de follow-up completa

---

## 📊 RESUMO EXECUTIVO

### Situação Atual (DETALES CRÍTICOS)

| Componente | Status | O Que Temos | O Que Falta |
|------------|--------|-------------|-------------|
| **1º Contato Script** | ⚠️ PARCIAL | Strategy doc com 3 variantes | Templates Python não implementados |
| **Follow-up #2** | 🔴 AUSENTE | NADA | Script completo necessário |
| **Follow-up #3** | 🔴 AUSENTE | NADA | Script completo necessário |
| **Follow-up #4** | 🔴 AUSENTE | NADA | Script completo necessário |
| **Demo CTA** | ⚠️ PARCIAL | CTA básico no strategy doc | Script detalhado não existe |
| **Rebuttals** | 🔴 AUSENTE | NADA | 6 objeções comuns não cobertas |
| **Timing Definido** | 🔴 AUSENTE | NADA | Regras de tempo não existem |
| **Fuso Horário** | 🔴 AUSENTE | NADA | Lógica de timezone não implementada |
| **Scheduler** | 🔴 AUSENTE | NADA | Nenhum sistema de agendamento |
| **CRM Tracking** | ✅ PRONTO | Schema, funil, 12 estágios | Apenas tracking inbound |

### PROBLEMA CRÍTICO IDENTIFICADO

🚨 **A prospecção outbound NÃO EXISTE como sistema automatizado.**

O que existe hoje:
- ✅ Documentos de estratégia (markdown)
- ✅ CRM ready para prospecção (schema, estágios)
- ✅ Scripts de 1º documento (no strategy doc)

O que NÃO existe:
- 🔴 Implementação de scripts em Python
- 🔴 Sistema de envio automatedo (scheduler)
- 🔴 Lógica de timing (quando enviar)
- 🔴 Lógica de fuso horário (onde o lead está localizado)
- 🔴 Módulo de follow-up completo

**Resultado:** A prospecção outbound é 100% MANUAL hoje. Não há automatização de follow-ups.

---

## 🎯 OBJETIVO IMEDIATO (2-3 dias)

Transformar o que é hoje PROSPECÇÃO MANUAL em **PROSPECÇÃO SEMI-AUTOMATIZADA**:

1. ✅ Criar templates de scripts em Python
2. ✅ Implementar lógica de timing básica
3. ✅ Criar script runner manual (enviar follow-ups por comando)
4. ✅ Testar com pequeno grupo de leads

---

## 📋 PLANO DE AÇÃO DETALHADO

### 🚨 PRIORIDADE 0: FASE IMEDIATA (HOJE + AMANHÃ)

#### Tarefa 1: Criar Scripts em Python (2-3 horas)

**Arquivo:** `/root/Barberzap SITE/barberzap_python/prospection/scripts.py`

**Entregáveis:**
- [ ] Implementar classe `ProspectionScripts`
- [ ] Migrar scripts existentes do strategy doc para Python templates
- [ ] Criar 3 variantes por perfil para 1º contato
- [ ] Criar 3 variantes por perfil para Follow-up #2
- [ ] Criar 3 variantes por perfil para Follow-up #3
- [ ] Criar script Follow-up #4 (Last Chance)
- [ ] Criar script Demo CTA
- [ ] Criar 6 scripts de Rebuttals

**Recurso:** Usar documento `SCRIPTS_TEMPLATES.md` já criado

**Código base disponível:** Já está no `SCRIPTS_TEMPLATES.md` seção "Implementação"

#### Tarefa 2: Implementar Módulo de Timing (2-3 horas)

**Arquivo:** `/root/Barberzap SITE/barberzap_python/prospection/timing.py`

**Entregáveis:**
- [ ] Implementar classe `FollowupTimingCalculator`
- [ ] Mapeamento DDD → Fuso horário (92=UTC-4,其余=UTC-3)
- [ ] Função `calculate_next_send_time()`
- [ ] Função `is_allowed_send_time()` (horários 9-12, 14-19)
- [ ] Regra de dias bloqueados (domingo)
- [ ] Testes com leads de São Paulo vs Manaus

**Recurso:** Usar documento `FOLLOWUP_TIMING_RECOMENDACOES.md` já criado

**Código base disponível:** Já está no `FOLLOWUP_TIMING_RECOMENDACOES.md` seção "Implementação"

#### Tarefa 3: Criar Script Runner Manual (1-2 horas)

**Arquivo:** `/root/Barberzap SITE/barberzap_python/prospection/manual_followup.py`

**Entregáveis:**
- [ ] Script CLI para disparar follow-ups
- [ ] Query leads do CRM que precisam de follow-up
- [ ] Filtrar por estágio (contacted, considering)
- [ ] Enviar mensagens via Evolution API
- [ ] Atualizar CRM (messages_sent, next_followup_at)
- [ ] Gerar relatório de envio

**Uso:**
```bash
python3 manual_followup.py --stage contacted --limit 50 --dry-run
```

---

### ⚡ PRIORIDADE 1: FASE CURTO PRAZO (3-5 dias)

#### Tarefa 4: Follow-up #2 Completo

**Entregáveis:**
- [ ] 3 variantes de script pronto (simple, premium, large)
- [ ] Testar envio com 10-20 leads perfil simples
- [ ] Testar envio com 10-20 leads perfil premium
- [ ] Testar envio com 10-20 leads perfil large
- [ ] Medir taxa de resposta
- [ ] Ajustar script se necessário

**Métricas a coletar:**
- Enviados: X
- Responderam: Y (%)
- Demo agendada: Z (% de respondentes)

#### Tarefa 5: Follow-up #3 Completo

**Entregáveis:**
- [ ] 3 variantes de script pronto (simple, premium, large)
- [ ] Testar envio com leads que não responderam ao #2
- [ ] Medir taxa de resposta
- [ ] Ajustar script se necessário

#### Tarefa 6: Follow-up #4 Completo (Last Chance)

**Entregáveis:**
- [ ] Script de Last Chance (encerramento profissional)
- [ ] Implementar opt-out (responder "PARE" para remover)
- [ ] Testar opt-out logic
- [ ] Validar que leads não recebem mais mensagens após

---

### 🎯 PRIORIDADE 2: FASE MÉDIO PRAZO (1-2 semanas)

#### Tarefa 7: Scheduler Automatizado

**Arquivo:** `/root/Barberzap SITE/barberzap_python/prospection/scheduler.py`

**Entregáveis:**
- [ ] Scheduler executando periodicamente (cada 5-10 minutos)
- [ ] Query automática de leads que precisam de follow-up
- [ ] Verificar horário permitido para cada lead
- [ ] Enviar follow-ups automaticamente
- [ ] Atualizar CRM com status
- [ ] Logging de todas as ações

**Funcionamento:**
```python
# Executa a cada 10 minutos
scheduler.run()  # → Envia follow-ups de todos os leads que precisam
```

#### Tarefa 8: Rebuttals Complete

**Entregáveis:**
- [ ] 6 scripts de resposta a objeções prontos
- [ ] Implementar lógica de classificação de resposta
- [ ] Detectar tipo de objeção automaticamente
- [ ] Enviar rebuttal apropriado
- [ ] Ajustar estágio CRM (considering, not_interested, etc.)

**Objecções implementadas:**
1. "Não tenho interesse"
2. "Muito caro"
3. "Já tenho sistema"
4. "Não preciso agora / Estou avaliando"
5. "Ligue depois / Estou ocupado"
6. "Precisei de mais informações"

#### Tarefa 9: Demo CTA Completo

**Entregáveis:**
- [ ] Script de agendamento de detalhado
- [ ] Implementar webhook/form para agendar demos
- [ ] Criar calendário de disponibilidade
- [ ] Enviar confirmação + lembrete 1h antes
- [ ] Atualizar CRM demo_requested → demo_scheduled

---

### 🚀 PRIORIDADE 3: FASE LONGO PRAZO (2-4 semanas)

#### Tarefa 10: Sistema de Lead Scoring

**Entregáveis:**
- [ ] Score de engajamento (0-100)
- [ ] Fatores: respondeu, respondeu rápido, abriu link, etc.
- [ ] Segmentar leads por score (alto/médio/baixo)
- [ ] Priorizar follow-ups para leads de alto score
- [ ] Dashboard visual de scoring

#### Tarefa 11: A/B Testing de Scripts

**Entregáveis:**
- [ ] Sistema de variantes de script (A/B)
- [ ] Aleatorizar leads entre versões
- [ ] Medir performance de cada variante
- [ ] A/B teste continuo de otimização
- [ ] Automatizar escolha de melhor variante

#### Tarefa 12: Advanced Analytics

**Entregáveis:**
- [ ] Dashboard de follow-up
- [ ] Metrics: tempo de resposta, taxa de conversão por etapa
- [ ] Funnel visualization (1º contato → follow-up → demo → trial → assinatura)
- [ ] ROI tracking (investimento prospecção vs. assinaturas)
- [ ] Alerts (follow-up rate baixo, etc.)

---

## 🎨 FLOWCHART DE FLUXO DE DECISÃO (COMPLETO)

```
┌─────────────────────────────────────────────────────────────┐
│                 LEAD EM PROSPECÇÃO OUTBOUND                 │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ STATUS: NEW    │
                    │ 1.074 leads    │
                    └────────┬───────┘
                             │
                    [Import CSV leads]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   DIA 0: 1º CONTATO                         │
│                     (Time Test + Impact)                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ STATUS:        │
                    │ CONTACTED      │
                    │ messages_sent=1│
                    └────────┬───────┘
                             │
                 ┌───────────┴──────────┐
                 │      Lead Responde?    │
                 └───────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
            SIM            NÃO         APOSTROFA
              │              │              │
              ▼              ▼              ▼
┌──────────────────┐   [Enquando não]   [Analisar]
│ Analisa Intent   │   [respondem]      comando
│ (interessado?)   │   esperar e       (ex: PARE,
└────────┬─────────┘   verificar        LIGUE,
         │             agendamento)     CARO)
         │                  │              │
       ┌─┴─┐                ▼              ▼
       │Si │┐         ┌────────────────┐ ┌─────────────┐
       ├───┘│         │  DIA 1-2: FOLL │ │ Analisa tipo│
       │ Não│         │  OW-UP #2      │ │ de apostrofa│
       ▼    ▼         │  (Re-engajam.) │ └──────┬──────┘
   ┌──────┐ ┌──────┐   └────────┬───────┘         │
   │Inter-│ │Respo-│            │                 │
   │essado│ │der   │         [Enquando não]       ├─ "PARE"
   │ (ROI) │ │básic │         [respondem]         │   ▼
   └──┬───┘ └───┬──┘            │                NOT_INTERESTED
      │       │               ▼
      │       │        ┌────────────────┐
      │       │        │  DIA 3-4: FOLL │   LIGUE / CARO /
      │       │        │  OW-UP #3      │   PRECISO INFO
      │       │        │  (Urgência)    │          │
      │       │        └────────┬───────┘          ▼
      │       │                 │             CONSIDERING
      │       │            [Enquando não]          │
      │       │            [respondem]    [Follow-up
      │       │                 │      em 3 dias]
      │       │                 ▼
      │       │          ┌────────────────┐
      │       │          │  DIA 5-6: FOLL │
      │       │          │  OW-UP #4      │
      │       │          │  (Last Chance) │
      │       │          └────────┬───────┘
      │       │                 │
      │       │        ┌────────┴────────┐
      │       │        │ Sem resposta    │
      │       │        └────────┬────────┘
      │       │                 │        OPT-OUT?
      │       │                 │           │
      │       └─────────────────┼───────────┼─────────┐
      │                         │          │         │
      │                         ▼          ▼         ▼
      │                    UNRESPONSI    RESPO   OPTED
      │                       VE       NDERED   OUT
      │                         │          │         │
      │    ┌────────────────────┘          │         ▼
      │    │                       INTERES  NOT_
      │    │                        TED    INTERESTED
      │    │                          │     → LOST
      │    └──────────────────────────┘
      │
      ▼
┌──────────────────┐
│ STATUS: INTEREST │
│ ED               │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ Script Demo CTA              │
│ "Quando é melhor demo?"      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────┐
│ STATUS: DEMO_    │
│ REQUESTED        │
└────────┬─────────┘
         │
         ▼
    [Agendar demo]
         │
         ▼
┌──────────────────┐
│ STATUS: DEMO_    │
│ SCHEDULED        │
└────────┬─────────┘
         │
         ▼
    [Realizar demo]
         │
         ▼
┌──────────────────────────────┐
│ Script Demo Conclusão        │
│ "Resumo + next steps"        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────┐
│ STATUS: CONSI    │
│ DERING           │
└────────┬─────────┘
         │
         ▼
    [Follow-up em 3 dias]
         │
    ┌────┴────┐
    │         │
    ▼         ▼
CONVERTE   NÃO CONVERTE
    │         │
    ▼         ▼
CUSTOM    NOT_
ACTIVE    INTERESTED
             │
             ▼
            LOST
```

---

## 📊 PROJEÇÃO DE IMPACTO (COM E SEM FOLLOW-UPS)

### Cenário Atual (SEM follow-ups automatizados)
- **Apenas 1º contato manual**
- Conversão final: **1.2%** (13 assinaturas de 1.074 leads)
- MRR gerado: R$ 649/mês

### Cenário Com Follow-ups (COMPLETOS)
- **Sequência de 4 follow-ups automatizados**
- Conversão final: **3.2%** (34 assinaturas de 1.074 leads)
- MRR gerado: R$ 1.697/mês

### Diferença
- **Aumento de conversão:** +162%
- **Acrescimo de MRR:** +R$ 1.048/mês (21 novas assinaturas)

---

## 🎯 QUADRO DE ACOMPANHAMENTO (RACI)

| Tarefa | Responsável (R) | Accountable (A) | Consulted (C) | Informed (I) | Status |
|--------|-----------------|-----------------|---------------|--------------|--------|
| **Fase Imediata** |
| Criar scripts.py | Samuel | -- | -- | Dev/Equipe | 🔴 Pendente |
| Criar timing.py | Samuel | -- | -- | Dev/Equipe | 🔴 Pendente |
| Criar manual_followup.py | Samuel | -- | -- | Dev/Equipe | 🔴 Pendente |
| **Fase Curto Prazo** |
| Follow-up #2 (test) | -- | Samuel | -- | Dev/Equipe | 🔴 Pendente |
| Follow-up #3 (test) | -- | Samuel | -- | Dev/Equipe | 🔴 Pendente |
| Follow-up #4 (test) | -- | Samuel | -- | Dev/Equipe | 🔴 Pendente |
| **Fase Médio Prazo** |
| Scheduler automatizado | Dev | Samuel | -- | Equipe | 🔴 Pendente |
| Rebuttals completos | Samuel | -- | -- | -- | 🔴 Pendente |
| Demo CTA completo | Samuel | -- | -- | -- | 🔴 Pendente |

---

## 🚦 RISKS & MITIGAÇÃO

### Risco 1: Evolution API Rate Limit
**Descrição:** Enviar muitas mensagens rapidamente pode bloquear a conta

**Mitigação:**
- Implementar rate limiting no scheduler (max 1 mensagem/segundo)
- Monitorar logs de API limit
- Implementar queue system com retry

### Risco 2: Fuso Horário Errado
**Descrição:** Calcular fuso horário incorretamente e enviar em horário proibido

**Mitigação:**
- Testar extensivamente com leads de diferentes regiões
- Validar lógica com exemplos reais
- Implementar check manual antes de automação completa

### Risco 3: Script Ofende Barbeiros
**Descrição:** Scripts muito agressivos são percebidos como spam

**Mitigação:**
- Usar scripts amigáveis e profissionais
- Testar com pequeno grupo antes de escala
- Monitorar feedback de leads

### Risco 4: CRM Desatualizado
**Descrição:** CRM não atualiza correctly after follow-ups

**Mitigação:**
- Validar CRM updates após cada envio
- Implementar logging extensivo
- Criar dashboard para monitorar status

---

## 📚 RECURSOS DISPONÍVEIS

### Documentos Criados Nesta Análise

1. **RELATORIO_FOLLOWUP_SEQUENCE_ANALYSIS.md**
   - Análise completa de scripts existentes vs. ausentes
   - Flowchart de handling de respostas
   - Checklist de scripts a criar
   - Projeção de impacto COM e SEM follow-ups

2. **SCRIPTS_TEMPLATES.md**
   - Todos os templates de scripts necessários
   - Variáveis dinâmicas documentadas
   - Código base Python para implementação
   - Exemplos de uso

3. **FOLLOWUP_TIMING_RECOMENDACOES.md**
   - Regras de timing detalhadas
   - Lógica de fuso horário por DDD
   - Implementação código base Python
   - Escala de scheduling

### Documentos Existentes (Anterior à Análise)

4. **ESTRATEGIA_VENDAS_BARBEIROS.md** (na strategy/)
   - Scripts de 1º contato existentes
   - Segmentação por perfil (simple/premium/large)
   - ROI calculations por perfil

5. **ANALISE_LEAD_TRACKING_PROSPECCAO.md** (nos reports/)
   - Schema CRM extendido para prospecção
   - Funil de 12 estágios implementado
   - Auto-staging logic para respostas
   - Python module crm_prospection.py (partial)

6. **1.074 leads** (data/)
   - Lista de leads limpa pronta para prospecção
   - 20+ cidades distribuídas
   - Metadados por lead (telefone, cidade, barrio)

---

## ✅ CHECKLIST FINAL (POR IMPLEMENTAR)

### Scripts (TOTAL: 15 scripts)

#### 1º Contato (4 scripts)
- [ ] First Contact Base
- [ ] First Contact Simples
- [ ] First Contact Premium
- [ ] First Contact Large (rede)

#### Follow-up #2 (3 scripts)
- [ ] Follow-up #2 Simples
- [ ] Follow-up #2 Premium
- [ ] Follow-up #2 Large

#### Follow-up #3 (3 scripts)
- [ ] Follow-up #3 Simples
- [ ] Follow-up #3 Premium
- [ ] Follow-up #3 Large

#### Follow-up #4 (1 script)
- [ ] Follow-up #4 Last Chance (opt-out)

#### Demo CTA (2 scripts)
- [ ] Demo CTA (agendar)
- [ ] Demo Conclusão (next steps)

#### Rebuttals (6 scripts)
- [ ] Rebuttal "Não tenho interesse"
- [ ] Rebuttal "Muito caro"
- [ ] Rebuttal "Já tenho sistema"
- [ ] Rebuttal "Não preciso agora / Estou avaliando"
- [ ] Rebuttal "Ligue depois / Estou ocupado"
- [ ] Rebuttal "Precisei de mais informações"

#### Positive Responses (2 scripts)
- [ ] Positive Response (demo)
- [ ] "Vou ver / Vou analisar" (considering)

### Timing System

- [ ] Mapeamento DDD → Fuso horário
- [ ] Função calculate_next_send_time()
- [ ] Função is_allowed_send_time()
- [ ] Regra de dias bloqueados (domingo)
- [ ] Regra de horários permitidos (9-12, 14-19)

### Scheduler

- [ ] Script runner manual
- [ ] Scheduler automatizado (APScheduler ou similar)
- [ ] Query de leads que precisam de follow-up
- [ ] Integração com Evolution API
- [ ] CRM updates after envio

---

## 🎯 PRÓXIMO PASSO (HOJE)

### Ação Imediata

**Iniciar implementação de scripts.py:**
1. Criar pasta: `/root/Barberzap SITE/barberzap_python/prospection/`
2. Criar arquivo: `scripts.py`
3. Implementar classe `ProspectionScripts`
4. Migrar 5 scripts principais (1º cont. + F#2+F#3+F#4+Demo CTA)
5. Testar com 3 leads (um de cada perfil)

### Tempo estimado: 2-3 horas

### KPI de Sucesso:
- [ ] 5 scripts implementando
- [ ] 3 leads testados com sucesso
- [ ] Nenhum erro de Evolution API

---

**Plano de Ação v1.0**   
**Data:** 2026-02-23   
**Status:** 📋 Pronto para implementação   
**Próxima revisão:** Após Tarefa 1 (2-3 dias)
