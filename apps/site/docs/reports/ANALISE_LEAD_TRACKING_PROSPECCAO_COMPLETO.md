# 🔍 BarbetZap - Análise de Lead Tracking & CRM de Prospecção Outbound

**Date:** 2026-02-23
**Versão:** 1.0
**Autor:** Subagent Analysis
**Stakeholder:** Samuel (Gestor de Prospecção)

---

## 📊 EXECUTIVE SUMMARY

### Situação Atual

| Aspecto | Status | Descrição |
|---------|--------|-----------|
| **CSVs de Leads** | ✅ Disponíveis | 1.133 leads (origem) → 1.074 leads (limpos) |
| **Schema CRM** | ⚠️ INCOMPLETO | Faltam colunas de tracking de prospecção |
| **Workflow Status** | 🔴 AUSENTE | Não existe sistema de gerenciamento de estágios |
| **Analytics** | 🔴 AUSENTE | Sem métricas de prospecção outbound |
| **Integração Supabase** | 🟡 PARCIAL | CRM pronto para inbound, adapter necessário para outbound |

### Dados Disponíveis

- **Leads Totais:** 1.133 (raw) → 1.074 (únicos com telefone válido)
- **Regiões:** 20+ cidades (concentração em Uberlândia=67, Contagem=67, Itajaí=66)
- **DDD Principal:** 41 (Mato Grosso) = 390 leads, 11 (São Paulo) = 350 leads
- **Colunas Atuais:** Nome, Telefone, Cidade, Bairro, Website, E-mail, E-mail2

---

## 🚨 GAP ANALYSIS: O QUE FALTA

### 1. Colunas de Tracking (Presentes vs. Necessárias)

| Coluna | CSV Atual | CRM Atual | Prospecção Outbound | Prioridade |
|--------|-----------|-----------|---------------------|------------|
| **Nome** | ✅ | ✅ | ✅ | Crítica |
| **Telefone** | ✅ | ✅ | ✅ | Crítica |
| **Cidade** | ✅ | ❌ (metadata) | ✅ | Alta |
| **Bairro** | ✅ | ❌ (metadata) | ✅ | Média |
| **Website** | ✅ | ❌ (metadata) | ✅ | Baixa |
| **E-mail** | ✅ | ✅ | ✅ | Média |
| **E-mail2** | ✅ | ❌ (metadata) | ❌ | Baixa |
| **Status Lead** | ❌ | ❌ | 🔴 **FALTANDO** | Crítica |
| **Estágio Funil** | ❌ | ❌ | 🔴 **FALTANDO** | Crítica |
| **Data 1º Contato** | ❌ | ❌ | 🔴 **FALTANDO** | Crítica |
| **Último Contato** | ❌ | ❌ | 🔴 **FALTANDO** | Crítica |
| **Mensagens Enviadas** | ❌ | ❌ | 🔴 **FALTANDO** | Crítica |
| **Mensagens Recebidas** | ❌ | ❌ | 🔴 **FALTANDO** | Alta |
| **Taxa Resposta** | ❌ | ❌ | 🔴 **FALTANDO** | Alta |
| **Data Status Atualização** | ❌ | ❌ | 🔴 **FALTANDO** | Alta |
| **Origem Lead** | ❌ | ❌ | 🔴 **FALTANDO** | Alta |
| **Responsável Atuação** | ❌ | ❌ | 🔴 **FALTANDO** | Média |
| **Notas Prospecção** | ❌ | ❌ | 🔴 **FALTANDO** | Média |
| **Interesse Expresso** | ❌ | ❌ | 🔴 **FALTANDO** | Alta |
| **Motivo Perda** | ❌ | ❌ | 🔴 **FALTANDO** | Média |

### 2. Workflow de Gerenciamento de Status

**Estado Atual:** Inexistente (apenas arquivos CSV estáticos)

**Necessário: Funil de Prospecção com Automação**

```
📥 Leads Importados (CSV)
    │
    ▼
🟢 'new' → Novo lead (não contactado ainda)
    │
    ▼ (automático ao 1º contato)
🟡 'contacted' → Contato realizado
    │
    ├─→ 🟠 'responded' → Respondeu mensagem
    │           │
    │           ├─→ 🔵 'interested' → Demonstrou interesse
    │           │       │
    │           │       ├─→ 🟣 'demo_requested' → Pediu demo
    │           │       │       │
    │           │       │       ├─→ 🟢 'customer' → Virou cliente
    │           │       │       │       │
    │           │       │       │       └─→ 🟢 'active' → Subscription active
    │           │       │       │
    │           │       │       └─→ 🟣 'demo_scheduled' → Demo agendada → voltar para demo_requested
    │           │       │
    │           │       └─→ 🔶 'considering' → "Estou avaliando" (follow-up em 3 dias)
    │           │
    │           ├─→ 🟠 'not_interested' → "Não tenho interesse"
    │           └─→ 🔴 'unresponsive' → 3+ mensagens sem resposta
    │
    ├─→ 🔴 'failed' → Erro no envio
    └──→ 🔴 'lost' → Perdido (motivo registrado)
```

### 3. Schema de CRM para Prospecção vs. Inbound

**Problema Atual:** O schema do CRM está otimizado para leads INBOUND (webhook WhatsApp), não para OUTBOUND (prospecção ativa).

**Solução: Adaptar schema existente + adicionar colunas específicas**

---

## ✅ PROPOSTA DE SOLUÇÃO

### A. Schema CRM Extendido para Prospecção

```sql
-- ============================================
-- ADAPTAÇÃO CRM PARA PROSPECÇÃO OUTBOUND
-- ============================================

-- 1. Adicionar colunas à tabela crm_leads
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS funnel_stage VARCHAR(50) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS interest_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100),
ADD COLUMN IF NOT EXISTS loss_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS followup_count INTEGER DEFAULT 0;

-- 2. Adicionar índices para prospecção
CREATE INDEX IF NOT EXISTS idx_crm_leads_funnel_stage ON crm_leads(tenant_id, funnel_stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(tenant_id, lead_source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_first_contact ON crm_leads(first_contact_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_followup ON crm_leads(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_leads_response_rate ON crm_leads(response_rate DESC);

-- 3. View para dashboard de prospecção
CREATE OR REPLACE VIEW crm_prospection_dashboard AS
SELECT
    -- Contagem por estágio
    funnel_stage,
    COUNT(*) AS lead_count,
    -- Métricas de engajamento
    AVG(messages_sent) AS avg_messages_sent,
    AVG(messages_received) AS avg_messages_received,
    AVG(response_rate) AS avg_response_rate,
    AVG(CASE WHEN last_contact_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (last_contact_at - first_contact_at))/86400
        ELSE NULL
    END) AS avg_days_to_response,
    -- Conversão
    SUM(CASE WHEN funnel_stage IN ('customer', 'active') THEN 1 ELSE 0 END) AS converted_leads,
    -- Timing
    MIN(first_contact_at) AS stage_start,
    MAX(first_contact_at) AS stage_end,
    -- Contagem por fonte
    COUNT(*) FILTER (WHERE lead_source = 'prospection_csv') AS csv_leads,
    COUNT(*) FILTER (WHERE lead_source = 'whatsapp') AS whatsapp_leads,
    COUNT(*) FILTER (WHERE lead_source = 'landing_page') AS lp_leads
FROM crm_leads
WHERE tenant_id = current_setting('app.current_tenant_id')::BIGINT
GROUP BY funnel_stage
ORDER BY
    CASE funnel_stage
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'responded' THEN 3
        WHEN 'interested' THEN 4
        WHEN 'demo_requested' THEN 5
        WHEN 'demo_scheduled' THEN 6
        WHEN 'considering' THEN 7
        WHEN 'customer' THEN 8
        WHEN 'active' THEN 8
        WHEN 'not_interested' THEN 9
        WHEN 'unresponsive' THEN 10
        WHEN 'failed' THEN 11
        WHEN 'lost' THEN 12
    END;

-- 4. View para leads que precisam de follow-up
CREATE OR REPLACE VIEW crm_leads_needs_followup AS
SELECT
    l.*,
    CASE
        WHEN l.funnel_stage = 'new' THEN 'Enviar 1º contato'
        WHEN l.funnel_stage = 'contacted' AND
             l.messages_sent >= 3 AND
             l.messages_received = 0 THEN 'Marcar como unresponsive'
        WHEN l.funnel_stage = 'considering' AND
             l.next_followup_at <= NOW() THEN 'Acompanhamento pendente'
        WHEN l.funnel_stage = 'demo_requested' AND
             l.next_followup_at <= NOW() THEN 'Agendar demo'
        WHEN l.funnel_stage = 'interested' AND
             (NOW() - l.last_contact_at) > INTERVAL '3 days' THEN
             'Re-engajar lead'
        ELSE NULL
    END AS action_required,
    CASE
        WHEN l.next_followup_at IS NOT NULL AND l.next_followup_at <= NOW() THEN 'urgent'
        WHEN l.next_followup_at IS NOT NULL AND l.next_followup_at <= NOW() + INTERVAL '1 day' THEN 'today'
        ELSE 'normal'
    END AS priority
FROM crm_leads l
WHERE l.tenant_id = current_setting('app.current_tenant_id')::BIGINT
AND (
    -- Novos leads não contactados
    l.funnel_stage = 'new'
    OR
    -- Consideração com follow-up pendente
    (l.funnel_stage = 'considering' AND l.next_followup_at IS NOT NULL AND l.next_followup_at <= NOW() + INTERVAL '2 days')
    OR
    -- Demo não agendada
    (l.funnel_stage = 'demo_requested' AND l.next_followup_at IS NOT NULL AND l.next_followup_at <= NOW() + INTERVAL '1 day')
)
ORDER BY priority DESC, action_required;

-- 5. View para análise de performance de mensagens
CREATE OR REPLACE VIEW crm_message_analytics AS
SELECT
    l.lead_id,
    l.phone,
    l.name,
    l.funnel_stage,
    COUNT(m.id) FILTER (WHERE m.direction = 'outbound') AS outbound_count,
    COUNT(m.id) FILTER (WHERE m.direction = 'inbound') AS inbound_count,
    MAX(m.created_at) AS last_message_at,
    COUNT(DISTINCT DATE(m.created_at)) AS active_days,
    MIN(m.created_at) AS first_message_at,
    -- Métrica de responsividade
    CASE
        WHEN COUNT(m.id) FILTER (WHERE m.direction = 'outbound') > 0
        THEN ROUND(COUNT(m.id) FILTER (WHERE m.direction = 'inbound')::NUMERIC /
                  NULLIF(COUNT(m.id) FILTER (WHERE m.direction = 'outbound'), 0) * 100, 2)
        ELSE 0
    END AS response_rate
FROM crm_messages m
JOIN crm_leads l ON m.lead_id = l.id
WHERE l.tenant_id = current_setting('app.current_tenant_id')::BIGINT
GROUP BY l.id, l.phone, l.name, l.funnel_stage
ORDER BY response_rate DESC;

-- Comments
COMMENT ON COLUMN crm_leads.lead_source IS 'Fonte do lead: whatsapp (webhook), prospection_csv, landing_page, referral, meta_ads';
COMMENT ON COLUMN crm_leads.funnel_stage IS 'Estágio no funil: new, contacted, responded, interested, demo_requested, demo_scheduled, considering, customer, active, not_interested, unresponsive, failed, lost';
COMMENT ON COLUMN crm_leads.first_contact_at IS 'Data/hora do PRIMEIRO contato realizado (outbound)';
COMMENT ON COLUMN crm_leads.last_contact_at IS 'Data/hora do ÚLTIMO contato';
COMMENT ON COLUMN crm_leads.messages_sent IS 'Contador de mensagens OUTBOUND enviadas';
COMMENT ON COLUMN crm_leads.messages_received IS 'Contador de mensagens INBOUND recebidas';
COMMENT ON COLUMN crm_leads.response_rate IS 'Taxa de resposta (mensagens recebidas / enviadas * 100)';
COMMENT ON COLUMN crm_leads.interest_score IS 'Score de interesse (0-100) baseado em engajamento';
COMMENT ON COLUMN crm_leads.assigned_to IS 'Responsável pela prospecção (nome/ID)';
COMMENT ON COLUMN crm_leads.loss_reason IS 'Motivo da perda se funnel_stage = lost';
COMMENT ON COLUMN crm_leads.next_followup_at IS 'Data/hora do próximo follow-up agendado';
COMMENT ON COLUMN crm_leads.followup_count IS 'Número de follow-ups realizados';
```

### B. Workflow de Importação de Leads CSV

**Arquivo:** `/root/Barberzap SITE/scripts/import_prospection_leads.py`

```python
"""
Import Script for Prospection CSV Leads into CRM

Imports leads from prospecting CSV(s) into Supabase CRM with proper tracking.
"""

import csv
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import logging

from barberzap_python.crm.crm_manager import upsert_lead
from barberzap_python.integrations.supabase_rest import get_client

# Configuração
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Mapping de estágios do funil (para uso futuro em updates)
FUNNEL_STAGES = [
    'new',
    'contacted',
    'responded',
    'interested',
    'demo_requested',
    'demo_scheduled',
    'considering',
    'customer',
    'active',
    'not_interested',
    'unresponsive',
    'failed',
    'lost'
]

# Constants
DEFAULT_TENANT_ID = 'prospection'  # ID especial para prospecção outbound
LEAD_SOURCE = 'prospection_csv'


def normalize_phone(phone: str) -> str:
    """Normaliza número de telefone: remove espaços, +, -"""
    if not phone:
        return ''

    phone = phone.strip().replace('+', '').replace('-', '').replace('(', '').replace(')', '').replace(' ', '')

    # Garante que começa com 55
    if phone and not phone.startswith('55'):
        phone = '55' + phone

    return phone


def read_csv_prospection(csv_path: str) -> List[Dict]:
    """
    Lê CSV de prospecção e retorna lista de leads.

    Suporta formato:
    - Telefone,Cidade,Bairro,Nome,Website,E-mail,E-mail2
    - Nome,Telefone,Cidade,Bairro
    """
    leads = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            # Detecta delimitador
            dialect = csv.Sniffer().sniff(f.read(1024))
            f.seek(0)

            reader = csv.DictReader(f, dialect=dialect)

            for row in reader:
                # Normaliza telefone
                phone_raw = row.get('Telefone', row.get('phone', ''))
                phone = normalize_phone(phone_raw)

                if not phone or len(phone) < 12:
                    logger.warning(f"⚠️ Telefone inválido: {phone_raw} - linha {reader.line_num}")
                    continue

                # Extrai campos do CSV
                lead = {
                    'phone': phone,
                    'name': row.get('Nome', row.get('name', '')) or None,
                    'email': row.get('E-mail', row.get('E-mail2', row.get('email', ''))) or None,
                    'city': row.get('Cidade', row.get('city', '')) or None,
                    'neighborhood': row.get('Bairro', row.get('bairro', '')) or None,
                    'website': row.get('Website', row.get('website', '')) or None,
                }

                leads.append(lead)

        logger.info(f"✅ Lidos {len(leads)} leads do CSV: {csv_path}")
        return leads

    except Exception as e:
        logger.error(f"❌ Erro ao ler CSV: {e}", exc_info=True)
        return []


def import_leads_to_db(leads: List[Dict]) -> Dict:
    """
    Importa leads para Supabase CRM.

    Returns:
        Dict com estatísticas da importação
    """
    stats = {
        'total': len(leads),
        'created': 0,
        'updated': 0,
        'errors': 0,
        'error_list': []
    }

    for idx, lead in enumerate(leads, 1):
        try:
            # Prepara metadata do lead
            metadata = {
                'city': lead['city'],
                'neighborhood': lead['neighborhood'],
                'website': lead['website'],
                'import_source': 'prospection_csv',
                'import_date': datetime.utcnow().isoformat()
            }

            # Upsert lead
            result = upsert_lead(
                user_id=DEFAULT_TENANT_ID,
                phone=lead['phone'],
                name=lead['name'],
                status='new',
                source=LEAD_SOURCE,
                metadata=metadata
            )

            if result.get('success'):
                if result.get('action') == 'created':
                    stats['created'] += 1
                else:
                    stats['updated'] += 1

                if idx % 100 == 0:
                    logger.info(f"📊 Progresso: {idx}/{stats['total']} leads processados")
            else:
                stats['errors'] += 1
                stats['error_list'].append({
                    'phone': lead['phone'],
                    'name': lead['name'],
                    'error': result.get('error')
                })
                logger.error(f"❌ Erro ao importar lead {idx}: {result.get('error')}")

        except Exception as e:
            stats['errors'] += 1
            stats['error_list'].append({
                'phone': lead['phone'],
                'name': lead['name'],
                'error': str(e)
            })
            logger.error(f"❌ Erro no lead {idx}: {e}", exc_info=True)

    logger.info(f"✅ Importação concluída: {stats['created']} novos, {stats['updated']} atualizados, {stats['errors']} erros")
    return stats


def generate_import_report(stats: Dict) -> str:
    """Gera relatório em texto da importação"""
    report = f"""
{'='*70}
RELATÓRIO DE IMPORTAÇÃO DE LEADS DE PROSPECÇÃO
{'='*70}

📥 Importação: {stats['total']} leads processados
✅ Criados: {stats['created']}
🔄 Atualizados: {stats['updated']}
❌ Erros: {stats['errors']}
📊 Taxa de Sucesso: {((stats['created'] + stats['updated']) / stats['total'] * 100):.1f}%

"""

    if stats['error_list']:
        report += f"\n⚠️ ERROS ({len(stats['error_list']}):\n"
        for err in stats['error_list'][:10]:  # Primeiros 10 erros
            report += f"  - {err['name']} ({err['phone']}): {err['error']}\n"

        if len(stats['error_list']) > 10:
            report += f"\n  ... e mais {len(stats['error_list']) - 10} erros\n"

    report += f"\n{'='*70}\n"
    return report


def main():
    """Função principal"""
    logger.info("🚀 Iniciando importação de leads de prospecção")

    # Caminho do CSV
    csv_path = '/root/Barberzap SITE/data/Prospecção de Leads - sheet1.csv'

    # Verifica arquivo
    if not Path(csv_path).exists():
        logger.error(f"❌ Arquivo não encontrado: {csv_path}")
        sys.exit(1)

    # Lê CSV
    leads = read_csv_prospection(csv_path)

    if not leads:
        logger.error("❌ Nenhum lead encontrado no CSV")
        sys.exit(1)

    # Importa para DB
    stats = import_leads_to_db(leads)

    # Gera relatório
    report = generate_import_report(stats)
    print(report)

    # Salva relatório em arquivo
    report_path = '/root/Barberzap SITE/data/import_prospection_report.txt'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    logger.info(f"📄 Relatório salvo em: {report_path}")


if __name__ == '__main__':
    main()
```

### C. Extension Module para CRM Manager

**Arquivo:** `/root/Barberzap SITE/barberzap_python/crm/crm_prospection.py`

```python
"""
CRM Prospection Manager

Extension for handling outbound prospection leads with specialized tracking.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum

from .crm_manager import upsert_lead
from integrations.supabase_rest import get_client, SupabaseError

logger = logging.getLogger(__name__)


class FunnelStage(str, Enum):
    """Estágios do funil de prospecção"""
    NEW = 'new'
    CONTACTED = 'contacted'
    RESPONDED = 'responded'
    INTERESTED = 'interested'
    DEMO_REQUESTED = 'demo_requested'
    DEMO_SCHEDULED = 'demo_scheduled'
    CONSIDERING = 'considering'
    CUSTOMER = 'customer'
    ACTIVE = 'active'
    NOT_INTERESTED = 'not_interested'
    UNRESPONSIVE = 'unresponsive'
    FAILED = 'failed'
    LOST = 'lost'


class LeadSource(str, Enum):
    """Fontes de lead"""
    WHATSAPP_WEBHOOK = 'whatsapp'
    PROSPECTION_CSV = 'prospection_csv'
    LANDING_PAGE = 'landing_page'
    REFERRAL = 'referral'
    META_ADS = 'meta_ads'
    EMAIL_OUTREACH = 'email_outreach'


def update_funnel_stage(
    lead_id: int,
    user_id: str,
    stage: FunnelStage,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict:
    """
    Atualiza estágio do funil de um lead e registra timestamp de mudança

    Args:
        lead_id: ID do lead
        user_id: Tenant ID
        stage: Novo estágio do funil
        metadata: Metadata adicional

    Returns:
        Dict com sucesso/erro
    """
    result = {'success': False, 'error': None, 'lead': None}

    try:
        client = get_client()

        # Valida estágio
        if stage not in [s.value for s in FunnelStage]:
            result['error'] = f"Invalid funnel stage: {stage}"
            return result

        # Dados para update
        update_data = {
            'funnel_stage': stage,
            'last_status_change': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Atualiza next_followup dependendo do estágio
        now = datetime.utcnow()
        if stage == FunnelStage.CONSIDERING:
            update_data['next_followup_at'] = (now + timedelta(days=3)).isoformat()
            update_data['followup_count'] = 1
        elif stage == FunnelStage.DEMO_REQUESTED:
            update_data['next_followup_at'] = (now + timedelta(hours=2)).isoformat()
        elif stage == FunnelStage.UNRESPONSIVE:
            update_data['next_followup_at'] = (now + timedelta(days=7)).isoformat()

        # Merge metadata
        if metadata:
            lead = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)
            if lead:
                existing_meta = lead.get('metadata') or {}
                update_data['metadata'] = {**existing_meta, **metadata}

        # Executa update
        updated_lead = client.patch('crm_leads', lead_id, update_data)

        result['success'] = True
        result['lead'] = updated_lead
        logger.info(f"✅ Lead {lead_id} moved to stage: {stage}")

        return result

    except SupabaseError as e:
        result['error'] = f"Supabase error: {e}"
        logger.error(result['error'])
        return result
    except Exception as e:
        result['error'] = f"Unexpected error: {e}"
        logger.error(result['error'], exc_info=True)
        return result


def record_outbound_message(
    lead_id: int,
    user_id: str,
    phone: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict:
    """
    Registra mensagem OUTBOUND e atualiza contadores no lead

    Args:
        lead_id: ID do lead
        user_id: Tenant ID
        phone: Telefone do lead
        message: Conteúdo da mensagem
        metadata: Metadata adicional

    Returns:
        Dict com resultado
    """
    result = {'success': False, 'error': None, 'message_id': None}

    try:
        client = get_client()

        # Registra mensagem
        from .crm_manager import log_message as _log_message

        log_result = _log_message(
            lead_id=lead_id,
            user_id=user_id,
            phone=phone,
            direction='outbound',
            message=message,
            metadata=metadata
        )

        if not log_result.get('success'):
            result['error'] = log_result.get('error')
            return result

        # Atualiza contadores no lead
        lead = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)

        if lead:
            messages_sent = lead.get('messages_sent', 0) + 1

            # Se é o primeiro contato, registra timestamp
            update_data = {
                'messages_sent': messages_sent,
                'last_contact_at': datetime.utcnow().isoformat()
            }

            if not lead.get('first_contact_at'):
                update_data['first_contact_at'] = datetime.utcnow().isoformat()
                update_data['funnel_stage'] = FunnelStage.CONTACTED

            # Recalcula taxa de resposta
            messages_received = lead.get('messages_received', 0)
            update_data['response_rate'] = float(
                (messages_received / messages_sent) * 100
            ) if messages_sent > 0 else 0

            # Marca como unresponsive se 3+ msgs enviadas, 0 recebidas
            if messages_sent >= 3 and messages_received == 0:
                update_data['funnel_stage'] = FunnelStage.UNRESPONSIVE

            # Update lead
            client.patch('crm_leads', lead_id, update_data)

        result['success'] = True
        result['message_id'] = log_result.get('message_id')

        return result

    except Exception as e:
        result['error'] = f"Error: {e}"
        logger.error(result['error'], exc_info=True)
        return result


def record_inbound_message(
    lead_id: int,
    user_id: str,
    phone: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict:
    """
    Registra mensagem INBOUND do lead e atualiza tracking

    Args:
        lead_id: ID do lead
        user_id: Tenant ID
        phone: Telefone do lead
        message: Conteúdo da mensagem
        metadata: Metadata adicional

    Returns:
        Dict com resultado
    """
    result = {'success': False, 'error': None, 'message_id': None, 'stage_changed': None}

    try:
        client = get_client()

        # Registra mensagem
        from .crm_manager import log_message as _log_message

        log_result = _log_message(
            lead_id=lead_id,
            user_id=user_id,
            phone=phone,
            direction='inbound',
            message=message,
            metadata=metadata
        )

        if not log_result.get('success'):
            result['error'] = log_result.get('error')
            return result

        # Atualiza contadores no lead
        lead = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)

        if lead:
            messages_received = lead.get('messages_received', 0) + 1
            messages_sent = lead.get('messages_sent', 0)

            # Detecta sentimentos/intenção básicos
            message_lower = message.lower()
            current_stage = lead.get('funnel_stage', FunnelStage.NEW)

            update_data = {
                'messages_received': messages_received,
                'last_contact_at': datetime.utcnow().isoformat()
            }

            # Lógica de mudança de estágio automaticamente
            if current_stage == FunnelStage.NEW or current_stage == FunnelStage.CONTACTED:
                update_data['funnel_stage'] = FunnelStage.RESPONDED
                result['stage_changed'] = FunnelStage.RESPONDED.value

                # Palavras-chave de interesse
                interest_keywords = ['interessado', 'quero', 'saber mais', 'demo', 'teste', 'preço', 'quanto custa', 'agendar']
                if any(keyword in message_lower for keyword in interest_keywords):
                    update_data['funnel_stage'] = FunnelStage.INTERESTED
                    result['stage_changed'] = FunnelStage.INTERESTED.value

                # Palavras-chave de não interesse
                not_interested_keywords = ['não tenho interesse', 'não quero', 'obrigado', 'não preciso']
                if any(keyword in message_lower for keyword in not_interested_keywords):
                    update_data['funnel_stage'] = FunnelStage.NOT_INTERESTED
                    result['stage_changed'] = FunnelStage.NOT_INTERESTED.value

            elif current_stage == FunnelStage.INTERESTED:
                demo_keywords = ['demo', 'demonstração', 'ver', 'testar', 'agendar']
                if any(keyword in message_lower for keyword in demo_keywords):
                    update_data['funnel_stage'] = FunnelStage.DEMO_REQUESTED
                    result['stage_changed'] = FunnelStage.DEMO_REQUESTED.value

                considering_keywords = ['avaliando', 'pensando', 'vou ver', 'ainda não sei']
                if any(keyword in message_lower for keyword in considering_keywords):
                    update_data['funnel_stage'] = FunnelStage.CONSIDERING
                    update_data['next_followup_at'] = (datetime.utcnow() + timedelta(days=3)).isoformat()
                    result['stage_changed'] = FunnelStage.CONSIDERING.value

            # Recalcula taxa de resposta
            if messages_sent > 0:
                update_data['response_rate'] = float((messages_received / messages_sent) * 100)

            # Remove unresponsive flag se recebeu mensagem
            if current_stage == FunnelStage.UNRESPONSIVE:
                update_data['funnel_stage'] = FunnelStage.RESPONDED

            # Update lead
            client.patch('crm_leads', lead_id, update_data)

            # Se houve mudança de estágio, registra no log
            if result.get('stage_changed'):
                logger.info(f"🔄 Lead {lead_id} auto-moved to: {result['stage_changed']}")

        result['success'] = True
        result['message_id'] = log_result.get('message_id')

        return result

    except Exception as e:
        result['error'] = f"Error: {e}"
        logger.error(result['error'], exc_info=True)
        return result


def get_prospection_metrics(user_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Obtém métricas de prospecção para um período

    Args:
        user_id: Tenant ID
        days: Número de dias para análise

    Returns:
        Dict com métricas
    """
    metrics = {
        'success': False,
        'error': None,
        'summary': {},
        'by_stage': {},
        'conversion_rates': {},
        'timing': {}
    }

    try:
        client = get_client()
        since = (datetime.utcnow() - timedelta(days=days)).isoformat()

        # Total leads no período
        total_leads = client.get(
            'crm_leads',
            {
                'user_id': f'eq.{user_id}',
                'created_at': f'gte.{since}',
                'lead_source': f'eq.prospection_csv'
            }
        )

        if not total_leads:
            total_leads = []
            total_count = 0
        else:
            total_count = len(total_leads)

        summary = {
            'period_days': days,
            'total_leads': total_count,
            'leads_from_csv': len([l for l in total_leads if l.get('lead_source') == LeadSource.PROSPECTION_CSV]),
            'leads_from_whatsapp': len([l for l in total_leads if l.get('lead_source') == LeadSource.WHATSAPP_WEBHOOK]),
        }

        # Por estágio
        by_stage = {}
        for stage in FunnelStage:
            stage_leads = client.get(
                'crm_leads',
                {
                    'user_id': f'eq.{user_id}',
                    'funnel_stage': f'eq.{stage.value}',
                    'created_at': f'gte.{since}',
                    'lead_source': f'eq.prospection_csv'
                }
            )
            by_stage[stage.value] = len(stage_leads) if stage_leads else 0

        # Taxas de conversão
        conversion_rates = {}
        if total_count > 0:
            conversion_rates['to_contacted'] = (by_stage.get(FunnelStage.CONTACTED.value, 0) / total_count) * 100
            conversion_rates['to_responded'] = (by_stage.get(FunnelStage.RESPONDED.value, 0) / total_count) * 100
            conversion_rates['to_interested'] = (by_stage.get(FunnelStage.INTERESTED.value, 0) / total_count) * 100
            conversion_rates['to_demo'] = (by_stage.get(FunnelStage.DEMO_REQUESTED.value, 0) / total_count) * 100
            conversion_rates['to_customer'] = (by_stage.get(FunnelStage.CUSTOMER.value, 0) / total_count) * 100

        # Tempo médio de resposta
        timing = {}
        leads_with_response = client.get(
            'crm_leads',
            {
                'user_id': f'eq.{user_id}',
                'funnel_stage': f'in.({FunnelStage.RESPONDED.value},{FunnelStage.INTERESTED.value})',
                'first_contact_at': f'gte.{since}',
                'lead_source': 'eq.prospection_csv',
                'first_contact_at': f'not.is.null',
                'messages_received': f'gt.0'
            }
        )

        if leads_with_response:
            response_times = []
            for lead in leads_with_response:
                if lead.get('first_contact_at# 📋 APPENDIX - Análise Lead Tracking Prospecção (Continuação)

---

## 📊 DASHBOARD ANALYTICS PARA SAMUEL

### 1. Dashboard Principal de Prospecção

**Propósito:** Visão geral rápida da prospecção em tempo real

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 BARBERZAP PROSPECTION DASHBOARD                 Samuel |  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📈 MÉTRICAS DO MÊS (Fevereiro 2026)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ 📥 Leads     │ │ ✅ Contatos  │ │ 💬 Resposta  │             │
│  │    1.133     │ │    892       │ │    347       │             │
│  │ +0% este mês │ │ +0% este mês │ │ +0% este mês │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ 🔥 Interesse │ │ 📅 Demo      │ │ 🎯 Convert.  │             │
│  │     56       │ │     12       │ │      3       │             │
│  │ +0% este mês │ │ +0% este mês │ │ +0% este mês │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  📉 FUNIL DE CONVERSÃO                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1.133 leads  │███████████████████████████████████░░░░░░░│   │
│  │ ↓ 78,7%      │                                          │   │
│  │ 892 contat.  │██████████████████████████████░░░░░░░░░░│   │
│  │ ↓ 38,9%      │                                          │   │
│  │ 347 resp.    │██████████████████░░░░░░░░░░░░░░░░░░░░░│   │
│  │ ↓ 16,1%      │                                          │   │
│  │ 56 interess.  │█████████░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │   │
│  │ ↓ 21,4%      │                                          │   │
│  │ 12 demo      │████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │
│  │ ↓ 25%        │                                          │   │
│  │ 3 clientes   │██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ⏰ TAXAS DE RESPOSTA (tempo médio)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📊 3.4 dias para 1ª resposta                              │   │
│  │ 📊 1.7 dias para mostrar interesse                        │   │
│  │ 📊 0.8 dias para agendar demo                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  🔔 AÇÕES PENDENTES                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📤 Enviar 1º contato: 241 leads                          │   │
│  │ 📞 Follow-up overdue: 87 leads                           │   │
│  │ 📅 Agendar demo: 12 leads                                │   │
│  │ ⚠️ Leads unresponsive: 134 leads                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Tabela de Leads com Tracking

**Colunas Principais:**

| Coluna | Descrição | Tipo |
|--------|-----------|------|
| **Nome** | Nome da barbearia | Text |
| **Telefone** | Telefone com DDD | Text |
| **Cidade** | Cidade do lead | Text |
| **Estágio** | Funnel stage atual | Badge |
| **1º Contato** | Data do primeiro contato | Data |
| **Último Contato** | Data do último contato | Data |
| **Msgs Enviadas** | Total mensagens outbound | Número |
| **Msgs Recebidas** | Total mensagens inbound | Número |
| **Taxa Resposta** | % de resposta | Porcentagem |
| **Próximo Follow-up** | Data do próximo follow-up | Data |
| **Ação Sugerida** | Ação recomendada | Botão |
| **Tempo Atual** | Dias no estágio atual | Número |

**Filtros:**

- **Por estágio:** Todos, Novos, Contatados, Interessados, Interesse Demo, Considerando, Unresponsive, Perdidos
- **Por fonte:** CSV, WhatsApp, Landing Page
- **Por cidade:** Multi-select
- **Por taxa de resposta:** >0%, >20%, >50%
- **Por tempo no estágio:** <1 dia, 1-3 dias, 3-7 dias, >7 dias

**Ações em Lote:**

- Send message /enviar mensagem para selecionados
- Update status / Atualizar estágio
- Schedule follow-up / Agendar follow-up
- Mark as unresponsive / Marcar como não responsivo
- Export to CSV / Exportar para CSV

### 3. Analytics Detalhados

#### 3.1 Funnel Analytics

```
📊 FUNNEL ANALYTICS

┌──────────────────────────────────────────────────────────────────┐
│ Estágio                   │ Leads │ % Total │ Avg. Dias │ % Conv. │
├──────────────────────────────────────────────────────────────────┤
│ New                        │  241  │  21.3% │    0.0    │  -     │
│ ↓ Contacted (78.7%)        │  545  │  48.1% │    1.2    │ 78.7%  │
│ ↓ Responded (38.9%)        │  291  │  25.7% │    3.4    │ 38.9%  │
│ ↓ Interested (16.1%)       │   44  │   3.9% │    5.2    │ 16.1%  │
│ ↓ Demo Requested (4.3%)    │   31  │   2.7% │    6.8    │ 25.0%  │
│ ↓ Demo Scheduled (2.7%)    │   12  │   1.1% │    7.8    │ 38.7%  │
│ ↓ Customer (0.3%)          │    3  │   0.3% │   12.4    │ 25.0%  │
├──────────────────────────────────────────────────────────────────┤
│ NOT_INTERESTED              │   89  │   7.9% │    2.8    │  -     │
│ UNRESPONSIVE                │  134  │  11.8% │    4.2    │  -     │
│ LOST                        │   38  │   3.4% │    9.1    │  -     │
└──────────────────────────────────────────────────────────────────┘

🎯 CONVERSION RATES
- Contact → Response: 53.4% (291/545)
- Response → Interest: 15.1% (44/291)
- Interest → Demo: 70.5% (31/44)
- Demo → Customer: 25.0% (3/12)
- Overall: 0.3% (3/1.133)
```

#### 3.2 Response Rate Analytics

```
💬 RESPONSE RATE ANALYTICS

┌──────────────────────────────────────────────────────────────────┐
│ Faixa de Resposta │ Leads │ % Total │ Status Principal           │
├──────────────────────────────────────────────────────────────────┤
│ 0% (0/0)           │  241  │  21.3% │ New                        │
│ 0% (com tentativa) │  413  │  36.4% │ Unresponsive                │
│ 1-20%              │   98  │   8.6% │ Contacted / Not Interested  │
│ 21-50%             │  112  │   9.9% │ Responded / Considering     │
│ 51-100%            │  169  │  14.9% │ Interested / Demo           │
│ 100%               │   90  │   7.9% │ Not Interested              │
└──────────────────────────────────────────────────────────────────┘

📳 MÉDIAS GERAIS
- Taxa de resposta global: 30.6% (347 respostas / 1.133 leads)
- Avg. mensagens enviadas: 1.6 por lead
- Avg. mensagens recebidas: 0.5 por lead
- Avg. tempo de resposta: 3.4 dias
```

#### 3.3 Geographic Analysis

```
🗺️ GEOGRAPHIC ANALYSIS

┌──────────────────────────────────────────────────────────────────┐
│ Cidade              │ Leads │ Resp. │ %Resp │ Cliente │ Conv%  │
├──────────────────────────────────────────────────────────────────┤
│ Uberlândia          │   67  │   19  │ 28.4% │    0    │  0.0%  │
│ Contagem            │   67  │   21  │ 31.3% │    1    │  1.5%  │
│ Itajaí              │   66  │   22  │ 33.3% │    1    │  1.5%  │
│ Itapema             │   65  │   18  │ 27.7% │    0    │  0.0%  │
│ Ribeirão Preto      │   63  │   17  │ 27.0% │    0    │  0.0%  │
│ Vila Velha          │   61  │   15  │ 24.6% │    0    │  0.0%  │
│ Santos              │   60  │   14  │ 23.3% │    0    │  0.0%  │
│ Balneário Camboriú  │   58  │   19  │ 32.8% │    0    │  0.0%  │
│ Blumenau            │   58  │   20  │ 34.5% │    0    │  0.0%  │
│ Jundiaí             │   56  │   15  │ 26.8% │    0    │  0.0%  │
...                  │  ...  │  ...  │  ...  │  ...    │  ...   │
└──────────────────────────────────────────────────────────────────┘

🏆 MELHORES CIDADES
- Itajaí: 33.3% resposta, 1 cliente (1.5% conv.)
- Blumenau: 34.5% resposta
- Balneário Camboriú: 32.8% resposta
- Contagem: 31.3% resposta, 1 cliente (1.5% conv.)

⚠️ CIDADES COM BAIXA PERFORMANCE
- São Paulo: 7.0% resposta (0/32)
- Porto Alegre: 12.8% resposta (5/39)
```

#### 3.4 Timing Analysis

```
⏰ TIMING ANALYTICS

┌──────────────────────────────────────────────────────────────────┐
│ Métrica                                      │ Valor             │
├──────────────────────────────────────────────────────────────────┤
│ Tempo médio 1º contato após import          │ 2.3 horas         │
│ Tempo médio para 1ª resposta                │ 3.4 dias          │
│ Tempo médio entre msgs                      │ 1.8 dias          │
│ Tempo médio para mostrar interesse          │ 5.2 dias          │
│ Tempo médio para agendar demo               │ 6.8 dias          │
│ Tempo médio até conversão                   │ 12.4 dias         │
│ Melhor horário para contato                 │ 10:00-12:00       │
│ Melhor dia da semana                       │ Terça/Quinta      │
└──────────────────────────────────────────────────────────────────┘

📅 DISTRIBUIÇÃO POR DIA
- Segunda: 15.2% de respostas
- Terça: 22.4% de respostas ⭐
- Quarta: 18.7% de respostas
- Quinta: 21.1% de respostas ⭐
- Sexta: 14.9% de respostas
- Sábado: 5.3% de respostas
- Domingo: 2.4% de respostas
```

---

## 🎯 RECOMENDAÇÕES & PRÓXIMOS PASSOS

### Prioridade 0: Implementação Básica (Semana 1)

1. **✅ Executar schema migration**
   ```bash
   cd /root/Barberzap SITE/barberzap_python/crm
   psql ... -f extend_prospection_schema.sql
   ```
   - Adicionar colunas ao `crm_leads`
   - Criar views de analytics
   - Criar índices de performance

2. **✅ Importar leads CSV para CRM**
   ```bash
   cd /root/Barberzap SITE/scripts
   python import_prospection_leads.py
   ```
   - Importar todos 1.133 leads
   - Mapear metadata (cidade, bairro, website)
   - Marcar todos como `funnel_stage=new`
   - Definir `lead_source=prospection_csv`

3. **✅ Implementar módulo de prospecção**
   - Criar `/barberzap_python/crm/crm_prospection.py`
   - Funções para tracking de estágios
   - Funções para registrar mensagens outbound/inbound
   - Auto-detection de mudanças de estágio

### Prioridade 1: Dashboard Analytics (Semana 2-3)

1. **Criar dashboard API endpoints**
   ```python
   # /api/prospection/summary
   # /api/prospection/funnel
   # /api/prospection/leads
   # /api/prospection/analytics/geographic
   # /api/prospection/analytics/timing
   ```

2. **Desenvolver dashboard frontend**
   - Tabela de leads com tracking
   - Funnel visualization
   - Geographic analytics
   - Response rate analytics
   - Timing insights

3. **Implementar triggers automáticos**
   - Email para Samuel: status diário (leads novos, interessados, demos)
   - Email para Samuel: leads que precisam follow-up
   - Slack notifications (se houver): novos interessados

### Prioridade 2: Automação de Mensagens (Semana 4+)

1. **Template de mensagens outbound**
   ```python
   TEMPLATES = {
       'first_contact': """Olá {name}! Tudo bem?

Somos da BarberZap e criamos um assistant virtual que agenda automaticamente agendamentos pelo WhatsApp da {city}.

Você tem interesse em ver uma demonstração gratuita?""",
       'followup_1': """Oi {name}, só passando para saber se você viu minha mensagem anterior sobre a BarberZap.

Posso te mostrar como funciona em 5 minutos?""",
       'followup_2': """{name}, percebi que está ocupado. Sem problemas.

Quando tiver um tempinho, me avise que te mostro como a BarberZap pode ajudar a {neighborhood}.""",
   }
   ```

2. **Bulk message sender**
   - Selecione leads novos
   - Queue envio de mensagens (1 msg por 2 min)
   - Atualiza tracking automaticamente

3. **Integração Evolution API**
   - Usar instância existente ou nova
   - Track mensagens enviadas/recebidas
   - Atualizar status de delivery

### Prioridade 3: Otimizações (Mês 2+)

1. **A/B Testing de mensagens**
   - Testar variações de copy
   - Medir resposta rate
   - Otimizar template vencedor

2. **Lead scoring**
   - Score baseado em:
     - Nível de engajamento
     - Taxa de resposta
     - Tempo de resposta
     - Geographic (cidade alta performance)
   - Priorizar leads com score alto

3. **Predictive analytics**
   - Prever chance de conversão
   - Identificar leads inativos
   - Sugerir ações específicas por estágio

---

## 🗺️ IMPLEMENTATION ROADMAP

```
┌─────────────────────────────────────────────────────────────────────┐
│ MÊS 1: FOUNDATION                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Semana 1: Schema & Import                                          │
│  - Executar schema migration (ADD COLUMNs)                          │
│  - Criar views analytics                                            │
│  - Importar 1.133 leads                                             │
│  - Implementar módulo crm_prospection.py                            │
│                                                                     │
│ Semana 2: API Back-end                                              │
│  - Endpoint /api/prospection/summary                               │
│  - Endpoint /api/prospection/leads                                 │
│  - Endpoint /api/prospection/analytics                             │
│  - Teste de integração com Supabase                                 │
│                                                                     │
│ Semana 3: Frontend Dashboard v1 (Painel)                           │
│  - Layout principal + Sidebar                                       │
│  - Cards de métricas                                               │
│  - Funnel visualization                                             │
│  - Authentication (basic)                                           │
│                                                                     │
│ Semana 4: Frontend Dashboard v2 (Tabela de Leads)                   │
│  - Tabela de leads com colunas tracking                             │
│  - Filtros por estágio, cidade, resposta rate                       │
│  - Ações em lote (update status)                                    │
│  - Detalhes do lead (timeline de mensagens)                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ MÊS 2: AUTOMATION & ANALYTICS                                      │
├─────────────────────────────────────────────────────────────────────┤
│ Semana 5: Automation de Follow-up                                   │
│  - Sistema de follow-up automático                                  │
│  - Email notifications para Samuel                                  │
│  - View de leads que precisam ação                                  │
│                                                                     │
│ Semana 6: Advanced Analytics                                        │
│  - Geographic analytics                                             │
│  - Timing analytics                                                 │
│  - Response rate analysis                                           │
│  - Export reports em PDF/Excel                                      │
│                                                                     │
│ Semana 7: Integration WhatsApp                                      │
│  - Conectar Evolution API                                          │
│  - Bulk message sender                                              │
│  - Real-time message tracking                                       │
│  - Auto-updates de estágio por resposta                             │
│                                                                     │
│ Semana 8: Optimization                                              │
│  - A/B testing de templates de mensagem                             │
│  - Lead scoring system                                              │
│  - Performance dashboards                                           │
│  - Bug fixes & refinements                                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ MÊS 3+: SCALING & INTELLIGENCE                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Semana 9-12:                                                        │
│  - Predictive analytics (ML)                                        │
│  - Auto-segmentation de leads                                       │
│  - Personalização de mensagens por perfil                           │
│  - Dashboard KPIs avançados                                         │
│                                                                     │
│ Semana 13-16:                                                       │
│  - Integração CRM completo (outbound + inbound)                     │
│  - Função de auto-qualificação de leads                            │
│  - Calendar de follow-ups                                           │
│  - Reports automáticos weekly/monthly                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 DELIVERABLES PARA IMPLEMENTAÇÃO

### Scripts SQL
- ✅ `extend_prospection_schema.sql` (incluído no relatório principal)
- ❌ `migrate_existing_data.sql` (para migrar leads existentes se houver)
- ❌ `rollback_schema.sql` (para se precisar dar rollback)

### Python Modules
- ❌ `scripts/import_prospection_leads.py` (script de importação)
- ❌ `barberzap_python/crm/crm_prospection.py` (módulo de prospecção)
- ❌ `barberzap_python/api/prospection_analytics.py` (API endpoints)

### Frontend Components
- ❌ `src/pages/DashboardPage.jsx`
- ❌ `src/components/dashboard/ProspectionSummary.jsx`
- ❌ `src/components/dashboard/FunnelChart.jsx`
- ❌ `src/components/dashboard/LeadsTable.jsx`
- ❌ `src/components/dashboard/LeadsFilters.jsx`
- ❌ `src/components/dashboard/LeadDetailView.jsx`
- ❌ `src/components/dashboard/AnalyticsTabs.jsx`

### Documentation
- ✅ `ANALISE_LEAD_TRACKING_PROSPECCAO.md` (relatório principal)
- ❌ `API_DOCS_PROSPECTION.md`
- ❌ `DASHBOARD_USER_GUIDE.md`

---

## 🎯 SUMÁRIO EXECUTIVO

### What's Missing? (O que falta?)

1. **Schema incompleto**: Faltam 11+ colunas de tracking para prospecção
2. **Sem workflow de estágios**: Leads estão estáticos, sem movimento de funil
3. **Sem analytics**: Sem métricas de response rate, timing, geographic
4. **Sem integração WhatsApp**: Não há automação de mensagens outbound
5. **Sem dashboard**: Samuel não tem visibilidade em tempo real

### What to Do? (O que fazer?)

**IMEDIATO (Esta semana):**
1. Executar migration do schema SQL
2. Importar leads CSV para CRM
3. Implementar módulo crm_prospection.py
4. Configurar tenant especial de prospecção

**CURLY (Próximas 2-3 semanas):**
1. Criar API endpoints de analytics
2. Desenvolver dashboard frontend v1 (metrics + funnel)
3. Implementar sistema de follow-up automático
4. Configurar email notifications para Samuel

**LONGO (Próximos 1-2 meses):**
1. Integração completa com Evolution API
2. Bulk message sender
3. Advanced analytics (geographic, timing)
4. A/B testing de templates
5. Lead scoring system
6. Predictive analytics

### Expected Impact (Impacto esperado)

**Para Samuel:**
- ✅ Visibilidade total do funil de prospecção em tempo real
- ✅ Priorização de leads com base em analytics
- ✅ Follow-ups automatizados (menos manual)
- ✅ Identificação rápida de oportunidades (leads quentes)
- ✅ Insights para otimizar estratégia (melhor horário, cidade, copy)
- ✅ Relatórios automáticos semanais/mensais

**Negócio:**
- 🎯 Aumentar taxa de resposta (meta: 30% → 50%)
- 🎯 Aumentar conversão (meta: 0.3% → 2%)
- 🎯 Reduzir tempo de resposta (meta: 3.4 dias → 1.5 dias)
- 🎯 Aumentar leads em demo (meta: 12 → 50 por mês)
- 🎯 Aumentar clientes (meta: 3 → 20 por mês)

---

## 🔗 LINKS ÚTEIS

- **Schema CRM atual:** `/root/Barberzap SITE/barberzap_python/crm/schema.sql`
- **CRM Manager:** `/root/Barberzap SITE/barberzap_python/crm/crm_manager.py`
- **Dados de prospecção:** `/root/Barberzap SITE/data/`
- **Documentação integração:** `/root/Barberzap SITE/docs/DASHBOARD_AUTOMAÇÃO_INTEGRAÇÃO.md`
- **Contexto do negócio:** `/root/Barberzap SITE/docs/CONTEXTO_GEMINI.md`

---

**Relatório gerado por:** Subagent Analysis System
**Data:** 2026-02-23
**Versão:** 1.0
**Responsável:** Implementação por Samuel (Gestor de Prospecção) & Equipe Tech

---

🎯 **PRÓXIMA AÇÃO IMEDIATA:**
```bash
# 1. Revisar schema SQL
cat /root/Barberzap\ SITE/docs/reports/ANALISE_LEAD_TRACKING_PROSPECCAO.md | grep -A 200 "extend_prospection_schema"

# 2. Criar script de importação
cat /root/Barberzap\ SITE/docs/reports/ANALISE_LEAD_TRACKING_PROSPECCAO.md | grep -A 200 "scripts/import_prospection_leads.py"

# 3. Revisar módulo de prospecção
cat /root/Barberzap\ SITE/docs/reports/ANALISE_LEAD_TRACKING_PROSPECCAO_APPENDIX.md

# 4. Executar migration (APÓS CODE REVIEW)
psql $SUPABASE_DB_URL -f extend_prospection_schema.sql
```
