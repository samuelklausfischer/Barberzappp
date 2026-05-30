"""
BarbetZap CRM Prospection Manager

Extension module for handling OUTBOUND prospection leads with specialized tracking.
Implements funnel stage management, automatic status transitions, and prospection-specific analytics.

Author: BarbetZap System
Date: 2026-02-23

Usage:
    from crm.crm_prospection import (
        update_funnel_stage,
        record_outbound_message,
        record_inbound_message,
        get_prospection_metrics,
        FunnelStage,
        LeadSource
    )

    # Update lead stage
    result = update_funnel_stage(lead_id=123, user_id='prospection', stage=FunnelStage.CONTACTED)

    # Record outbound message
    result = record_outbound_message(lead_id=123, user_id='prospection', phone='5547933114288', message='Olá!...')
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import re

from .crm_manager import upsert_lead
from integrations.supabase_rest import get_client, SupabaseError


# ==========================================
# LOGGER
# ==========================================

logger = logging.getLogger(__name__)


# ==========================================
# ENUMS
# ==========================================

class FunnelStage(str, Enum):
    """
    Estágios do funil de prospecção outbound

    Funnel progression:
        new → contacted → responded → interested → demo_requested → demo_scheduled → customer
        Branches: considering (evaluation), not_interested, unresponsive, lost, failed
    """
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
    """
    Fontes de lead
    """
    WHATSAPP_WEBHOOK = 'whatsapp'
    PROSPECTION_CSV = 'prospection_csv'
    LANDING_PAGE = 'landing_page'
    REFERRAL = 'referral'
    META_ADS = 'meta_ads'
    EMAIL_OUTREACH = 'email_outreach'


# ==========================================
# FUNNEL STAGE MANAGEMENT
# ==========================================

def update_funnel_stage(
    lead_id: int,
    user_id: str,
    stage: FunnelStage,
    loss_reason: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Atualiza estágio do funil de um lead e registra timestamp de mudança

    Automatically sets next_followup_at based on stage:
    - considering: +3 days
    - demo_requested: +2 hours
    - unresponsive: +7 days
    - interested: +1 day

    Args:
        lead_id: ID do lead
        user_id: Tenant ID (usually 'prospection')
        stage: Novo estágio do funil (FunnelStage enum)
        loss_reason: Motivo da perda (se stage = LOST)
        metadata: Metadata adicional a adicionar

    Returns:
        Dict: {'success': bool, 'error': str, 'lead': dict, 'stage_changed': str}

    Example:
        >>> result = update_funnel_stage(
        ...     lead_id=123,
        ...     user_id='prospection',
        ...     stage=FunnelStage.INTERESTED
        ... )
        >>> print(result['success'])
        True
    """
    result = {
        'success': False,
        'error': None,
        'lead': None,
        'stage_changed': None
    }

    try:
        # Validate stage
        if stage not in [s.value for s in FunnelStage]:
            result['error'] = f"Invalid funnel stage: {stage}. Must be one of {[s.value for s in FunnelStage]}"
            return result

        client = get_client()

        # Get current lead
        current_lead = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)

        if not current_lead:
            result['error'] = f"Lead not found: {lead_id}"
            return result

        current_stage = current_lead.get('funnel_stage', FunnelStage.NEW)

        # Skip if same stage
        if current_stage == stage:
            result['success'] = True
            result['lead'] = current_lead
            result['stage_changed'] = None
            logger.info(f"ℹ️ Lead {lead_id} already in stage: {stage}")
            return result

        # Prepare update data
        now = datetime.utcnow()
        update_data = {
            'funnel_stage': stage,
            'last_status_change': now.isoformat(),
            'updated_at': now.isoformat()
        }

        # Set next_followup based on stage
        if stage == FunnelStage.CONSIDERING:
            update_data['next_followup_at'] = (now + timedelta(days=3)).isoformat()
            update_data['followup_count'] = (current_lead.get('followup_count', 0) + 1)

        elif stage == FunnelStage.DEMO_REQUESTED:
            update_data['next_followup_at'] = (now + timedelta(hours=2)).isoformat()

        elif stage == FunnelStage.UNRESPONSIVE:
            update_data['next_followup_at'] = (now + timedelta(days=7)).isoformat()

        elif stage == FunnelStage.INTERESTED:
            update_data['next_followup_at'] = (now + timedelta(days=1)).isoformat()

        # Set loss reason if LOST stage
        if stage == FunnelStage.LOST and loss_reason:
            update_data['loss_reason'] = loss_reason

        # Clear loss_reason if moving away from LOST stage
        elif current_stage == FunnelStage.LOST and stage != FunnelStage.LOST:
            update_data['loss_reason'] = None

        # Merge metadata
        if metadata:
            existing_meta = current_lead.get('metadata') or {}
            update_data['metadata'] = {**existing_meta, **metadata}

        # Execute update
        updated_lead = client.patch('crm_leads', lead_id, update_data)

        result['success'] = True
        result['lead'] = updated_lead
        result['stage_changed'] = stage
        logger.info(f"✅ Lead {lead_id} stage updated: {current_stage} → {stage}")

        return result

    except SupabaseError as e:
        result['error'] = f"Supabase error: {e}"
        logger.error(result['error'])
        return result
    except Exception as e:
        result['error'] = f"Unexpected error: {e}"
        logger.error(result['error'], exc_info=True)
        return result


# ==========================================
# MESSAGE TRACKING
# ==========================================

def record_outbound_message(
    lead_id: int,
    user_id: str,
    phone: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Registra mensagem OUTBOUND e atualiza contadores no lead

    Automatically:
    - Increments messages_sent counter
    - Updates last_contact_at timestamp
    - Sets first_contact_at if first message
    - Auto-transitions to 'contacted' if first message
    - Recalculates response_rate
    - Auto-transitions to 'unresponsive' if 3+ msgs sent with 0 responses

    Args:
        lead_id: ID do lead em crm_leads
        user_id: Tenant ID
        phone: Phone number (normalized)
        message: Content of outbound message
        metadata: Additional metadata (template used, instance info, etc.)

    Returns:
        Dict: {'success': bool, 'error': str, 'message_id': int, 'lead_updated': bool}

    Example:
        >>> result = record_outbound_message(
        ...     lead_id=123,
        ...     user_id='prospection',
        ...     phone='5547933114288',
        ...     message='Olá! Tudo bem?'
        ... )
    """
    result = {
        'success': False,
        'error': None,
        'message_id': None,
        'lead_updated': False
    }

    try:
        from .crm_manager import log_message as _log_message

        client = get_client()

        # Get current lead
        lead = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)

        if not lead:
            result['error'] = f"Lead not found: {lead_id}"
            return result

        # Log message
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

        # Update lead counters
        messages_sent = lead.get('messages_sent', 0) + 1
        messages_received = lead.get('messages_received', 0)

        update_data = {
            'messages_sent': messages_sent,
            'last_contact_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Set first_contact_at if first message
        if not lead.get('first_contact_at'):
            update_data['first_contact_at'] = datetime.utcnow().isoformat()
            update_data['funnel_stage'] = FunnelStage.CONTACTED
            logger.info(f"📤 First contact logged for lead {lead_id}")

        # Recalculate response rate
        response_rate = 0
        if messages_sent > 0:
            response_rate = round((messages_received / messages_sent) * 100, 2)
        update_data['response_rate'] = response_rate

        # Auto-transition to unresponsive if 3+ sent, 0 received
        if messages_sent >= 3 and messages_received == 0:
            # Optionally auto-transition to UNRESPONSIVE
            # update_data['funnel_stage'] = FunnelStage.UNRESPONSIVE
            logger.info(f"⚠️ Lead {lead_id} has sent 3+ messages with 0 responses")

        # Update interest score based on engagement
        interest_score = calculate_interest_score(
            messages_sent=messages_sent,
            messages_received=messages_received,
            response_rate=response_rate,
            funnel_stage=lead.get('funnel_stage'),
            days_since_last_contact=lead.get('last_contact_at')
        )
        update_data['interest_score'] = interest_score

        # Execute update
        client.patch('crm_leads', lead_id, update_data)

        result['success'] = True
        result['message_id'] = log_result.get('message_id')
        result['lead_updated'] = True

        logger.debug(f"✅ Outbound message logged and counters updated for lead {lead_id}")

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
) -> Dict[str, Any]:
    """
    Registra mensagem INBOUND e atualiza tracking

    Automatically:
    - Increments messages_received counter
    - Updates last_contact_at
    - Detects sentiment/intent from message content
    - Auto-transitions funnel stage based on detected intent

    Detected intents:
    - Interest: keywords like 'interessado', 'quero', 'demo', 'preço', 'agendar'
    - Not interested: 'não tenho interesse', 'não quero', 'obrigado'
    - Considering: 'avaliando', 'pensando', 'ainda não sei'
    - Demo request: 'demo', 'demonstração', 'ver', 'testar', 'agendar'

    Args:
        lead_id: ID do lead
        user_id: Tenant ID
        phone: Phone number
        message: Content of inbound message
        metadata: Additional metadata

    Returns:
        Dict: {'success': bool, 'error': str, 'message_id': int, 'stage_changed': str, 'intent_detected': str}

    Example:
        >>> result = record_inbound_message(lead_id=123, user_id='prospection', phone='5547933114288', message='Estou interessado na demo')
        >>> print(result['stage_changed'])
        'interested'
    """
    result = {
        'success': False,
        'error': None,
        'message_id': None,
        'stage_changed': None,
        'intent_detected': None
    }

    try:
        from .crm_manager import log_message as _log_message

        client = get_client()

        # Get current lead
        lead = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)

        if not lead:
            result['error'] = f"Lead not found: {lead_id}"
            return result

        # Log message
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

        # Update counters
        messages_received = lead.get('messages_received', 0) + 1
        messages_sent = lead.get('messages_sent', 0)

        # Detect intent from message
        intent, confidence = detect_message_intent(message)
        result['intent_detected'] = intent

        # Determine new funnel stage
        current_stage = lead.get('funnel_stage', FunnelStage.NEW)
        new_stage = current_stage

        update_data = {
            'messages_received': messages_received,
            'last_contact_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Logic for stage transition
        if current_stage in [FunnelStage.NEW, FunnelStage.CONTACTED]:
            new_stage = FunnelStage.RESPONDED

            if intent == 'interest':
                new_stage = FunnelStage.INTERESTED
                update_data['next_followup_at'] = (datetime.utcnow() + timedelta(days=1)).isoformat()

            elif intent == 'not_interested':
                new_stage = FunnelStage.NOT_INTERESTED

        elif current_stage == FunnelStage.RESPONDED or current_stage == FunnelStage.INTERESTED:
            if intent == 'demo':
                new_stage = FunnelStage.DEMO_REQUESTED
                update_data['next_followup_at'] = (datetime.utcnow() + timedelta(hours=2)).isoformat()

            elif intent == 'considering':
                new_stage = FunnelStage.CONSIDERING
                update_data['next_followup_at'] = (datetime.utcnow() + timedelta(days=3)).isoformat()

            elif intent == 'interest':
                if current_stage == FunnelStage.RESPONDED:
                    new_stage = FunnelStage.INTERESTED

        elif current_stage == FunnelStage.UNRESPONSIVE:
            # Lead responded! Bring back to responded stage
            new_stage = FunnelStage.RESPONDED

        # If stage changed, update it
        if new_stage != current_stage:
            update_data['funnel_stage'] = new_stage
            update_data['last_status_change'] = datetime.utcnow().isoformat()
            result['stage_changed'] = new_stage
            logger.info(f"🔄 Lead {lead_id} auto-transition: {current_stage} → {new_stage} (intent: {intent})")

        # Recalculate response rate
        if messages_sent > 0:
            update_data['response_rate'] = round((messages_received / messages_sent) * 100, 2)

        # Update interest score
        interest_score = calculate_interest_score(
            messages_sent=messages_sent,
            messages_received=messages_received,
            response_rate=update_data.get('response_rate', 0),
            funnel_stage=new_stage,
            days_since_last_contact=update_data['last_contact_at']
        )
        update_data['interest_score'] = interest_score

        # Execute update
        client.patch('crm_leads', lead_id, update_data)

        result['success'] = True
        result['message_id'] = log_result.get('message_id')

        logger.debug(f"✅ Inbound message logged and tracking updated for lead {lead_id}")

        return result

    except Exception as e:
        result['error'] = f"Error: {e}"
        logger.error(result['error'], exc_info=True)
        return result


# ==========================================
# INTENT DETECTION
# ==========================================

def detect_message_intent(message: str) -> tuple[str, float]:
    """
    Detect intent from message content

    Intents:
    - interest: Positive intent ('interessado', 'quero', 'demo', 'teste', 'preço')
    - not_interested: Negative intent ('não tenho interesse', 'não quero', 'obrigado')
    - considering: Evaluation intent ('avaliando', 'pensando', 'ainda não sei')
    - demo: Wants demo ('demo', 'demonstração', 'ver', 'testar', 'agendar')

    Args:
        message: Message content

    Returns:
        Tuple of (intent: str, confidence: float)
    """
    if not message:
        return 'unknown', 0.0

    message_lower = message.lower()

    # Interest keywords
    interest_keywords = [
        'interessado', 'quero', 'saber mais', 'demo', 'teste', 'preço',
        'quanto custa', 'agendar', 'gostaria', 'sim', 'tenho interesse'
    ]
    if any(kw in message_lower for kw in interest_keywords):
        return 'interest', 0.8

    # Demo request keywords
    demo_keywords = [
        'demo', 'demonstração', 'ver', 'testar', 'agendar',
        'mostrar', 'como funciona'
    ]
    if any(kw in message_lower for kw in demo_keywords):
        return 'demo', 0.9

    # Not interested keywords
    not_interested_keywords = [
        'não tenho interesse', 'não quero', 'obrigado por agora',
        'não preciso', 'não é o momento', 'vou pensar', 'obrigado'
    ]
    if any(kw in message_lower for kw in not_interested_keywords):
        return 'not_interested', 0.7

    # Considering keywords
    considering_keywords = [
        'avaliando', 'pensando', 'vou ver', 'ainda não sei',
        'tenho algumas dúvidas', 'vou considerar', 'aguardando'
    ]
    if any(kw in message_lower for kw in considering_keywords):
        return 'considering', 0.6

    return 'unknown', 0.0


# ==========================================
# INTEREST SCORE CALCULATION
# ==========================================

def calculate_interest_score(
    messages_sent: int,
    messages_received: int,
    response_rate: float,
    funnel_stage: str,
    days_since_last_contact: Optional[str] = None
) -> int:
    """
    Calculate interest score (0-100) based on engagement

    Score factors:
    - Response rate: up to 40 points
    - Message count balance: up to 30 points
    - Funnel stage: up to 30 points
    - Recent activity: up to 10 points

    Args:
        messages_sent: Number of outbound messages sent
        messages_received: Number of inbound messages received
        response_rate: Response rate percentage
        funnel_stage: Current funnel stage
        days_since_last_contact: String timestamp of last contact

    Returns:
        Interest score (0-100)
    """
    score = 0

    # 1. Response rate (0-40 points)
    if response_rate == 0:
        score += 0
    elif response_rate <= 25:
        score += 10
    elif response_rate <= 50:
        score += 20
    elif response_rate <= 75:
        score += 30
    else:  # > 75%
        score += 40

    # 2. Message count balance (0-30 points)
    if messages_sent == 0:
        score += 0
    else:
        balance = messages_received / messages_sent
        if balance >= 2:
            score += 30
        elif balance >= 1:
            score += 25
        elif balance >= 0.5:
            score += 15
        elif balance > 0:
            score += 5

    # 3. Funnel stage (0-30 points)
    stage_scores = {
        FunnelStage.NEW: 5,
        FunnelStage.CONTACTED: 10,
        FunnelStage.RESPONDED: 20,
        FunnelStage.INTERESTED: 30,
        FunnelStage.DEMO_REQUESTED: 30,
        FunnelStage.DEMO_SCHEDULED: 30,
        FunnelStage.CONSIDERING: 25,
        FunnelStage.CUSTOMER: 30,
        FunnelStage.ACTIVE: 30,
        FunnelStage.NOT_INTERESTED: 0,
        FunnelStage.UNRESPONSIVE: 5,
        FunnelStage.FAILED: 0,
        FunnelStage.LOST: 0
    }
    score += stage_scores.get(funnel_stage, 5)

    # 4. Recent activity (0-10 points)
    if days_since_last_contact:
        try:
            last_contact = datetime.fromisoformat(days_since_last_contact.replace('Z', '+00:00'))
            days_since = (datetime.utcnow() - last_contact).days

            if days_since <= 1:
                score += 10
            elif days_since <= 3:
                score += 7
            elif days_since <= 7:
                score += 4
            else:
                score += 0
        except:
            pass

    return min(score, 100)


# ==========================================
# ANALYTICS FUNCTIONS
# ==========================================

def get_prospection_metrics(
    user_id: str,
    days: int = 30,
    lead_source: Optional[str] = None
) -> Dict[str, Any]:
    """
    Obtém métricas de prospecção para um período

    Args:
        user_id: Tenant ID
        days: Number of days for analysis
        lead_source: Filter by lead source (optional)

    Returns:
        Dict with metrics: summary, by_stage, conversion_rates, timing, geographic

    Example:
        >>> metrics = get_prospection_metrics(user_id='prospection', days=30)
        >>> print(metrics['summary']['total_leads'])
        1133
    """
    metrics = {
        'success': False,
        'error': None,
        'summary': {},
        'by_stage': {},
        'conversion_rates': {},
        'timing': {},
        'geographic': {}
    }

    try:
        client = get_client()
        since = (datetime.utcnow() - timedelta(days=days)).isoformat()

        # Base filters
        base_filters = {
            'user_id': f'eq.{user_id}',
            'created_at': f'gte.{since}'
        }
        if lead_source:
            base_filters['lead_source'] = f'eq.{lead_source}'

        # Total leads created in period
        total_leads = client.get('crm_leads', base_filters)
        total_count = len(total_leads) if total_leads else 0

        # Summary
        summary = {
            'period_days': days,
            'total_leads': total_count,
            'leads_from_csv': len([l for l in (total_leads or []) if l.get('lead_source') == 'prospection_csv']),
            'leads_from_whatsapp': len([l for l in (total_leads or []) if l.get('lead_source') == 'whatsapp']),
            'leads_from_landing_page': len([l for l in (total_leads or []) if l.get('lead_source') == 'landing_page']),
        }

        metrics['summary'] = summary

        # By stage (current stage of leads created in period)
        by_stage = {}
        for stage in FunnelStage:
            stage_leads = client.get('crm_leads', {
                **base_filters,
                'funnel_stage': f'eq.{stage.value}'
            })
            by_stage[stage.value] = len(stage_leads) if stage_leads else 0

        metrics['by_stage'] = by_stage

        # Conversion rates (cumulative)
        conversion_rates = {}
        if total_count > 0:
            conversion_rates['to_contacted'] = round(by_stage.get(FunnelStage.CONTACTED.value, 0) / total_count * 100, 1)
            conversion_rates['to_responded'] = round(by_stage.get(FunnelStage.RESPONDED.value, 0) / total_count * 100, 1)
            conversion_rates['to_interested'] = round(by_stage.get(FunnelStage.INTERESTED.value, 0) / total_count * 100, 1)
            conversion_rates['to_demo'] = round(by_stage.get(FunnelStage.DEMO_REQUESTED.value, 0) / total_count * 100, 1)
            conversion_rates['to_customer'] = round(by_stage.get(FunnelStage.CUSTOMER.value, 0) / total_count * 100, 1)

        metrics['conversion_rates'] = conversion_rates

        # Timing metrics
        timing = {}

        # Average response time (leads that received a response)
        leads_with_response = client.get('crm_leads', {
            **base_filters,
            'funnel_stage': f'in.({FunnelStage.RESPONDED.value},{FunnelStage.INTERESTED.value})',
            'first_contact_at': f'not.is.null',
            'messages_received': f'gt.0'
        })

        if leads_with_response:
            response_times = []
            for lead in leads_with_response:
                if lead.get('first_contact_at') and lead.get('last_contact_at'):
                    first = datetime.fromisoformat(lead['first_contact_at'].replace('Z', '+00:00'))
                    try:
                        last = datetime.fromisoformat(lead['last_contact_at'].replace('Z', '+00:00'))
                    except:
                        continue
                    response_time_days = (last - first).total_seconds() / 86400
                    response_times.append(response_time_days)

            if response_times:
                timing['avg_days_to_response'] = round(sum(response_times) / len(response_times), 1)
                timing['min_days_to_response'] = round(min(response_times), 1)
                timing['max_days_to_response'] = round(max(response_times), 1)

        metrics['timing'] = timing

        # Geographic distribution (top 10 cities)
        city_leads = client.get('crm_leads', {
            **base_filters,
            'city': f'not.is.null'
        })

        if city_leads:
            from collections import Counter
            city_counter = Counter(l.get('city', 'Unknown') for l in city_leads)
            metrics['geographic'] = dict(city_counter.most_common(10))

        metrics['success'] = True

        return metrics

    except Exception as e:
        metrics['error'] = str(e)
        logger.error(f"Error getting prospection metrics: {e}", exc_info=True)
        return metrics


# ==========================================
# BULK OPERATIONS
# ==========================================

def get_leads_needing_action(
    user_id: str,
    priority_level: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get leads that need action (first contact, follow-up, demo scheduling)

    Args:
        user_id: Tenant ID
        priority_level: Filter by priority ('urgent', 'today', 'high', 'medium', 'normal')

    Returns:
        List of leads needing action

    Example:
        >>> leads = get_leads_needing_action(user_id='prospection', priority_level='high')
        >>> print(f"{len(leads)} high-priority actions needed")
    """
    try:
        # Query the view
        client = get_client()

        filters = {'user_id': f'eq.{user_id}'}

        # Add priority filter if specified
        if priority_level:
            filters['priority'] = f'eq.{priority_level}'

        leads = client.get('crm_leads_needs_followup', filters)

        return leads if leads else []

    except Exception as e:
        logger.error(f"Error getting leads needing action: {e}", exc_info=True)
        return []


# ==========================================
# MAIN (TEST ONLY)
# ==========================================

if __name__ == '__main__':
    # Setup logging for testing
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    print("=" * 70)
    print("BarbetZap CRM Prospection Manager - Testing")
    print("=" * 70)

    # Test funnel stages
    print("\n📊 Funnel stages:")
    for stage in FunnelStage:
        print(f"  - {stage.value}")

    # Test lead sources
    print("\n📊 Lead sources:")
    for source in LeadSource:
        print(f"  - {source.value}")

    # Test intent detection
    print("\n🔍 Intent detection test:")
    messages = [
        "Estou interessado na demo",
        "Não tenho interesse agora",
        "Vou avaliar e te falo",
        "Pode agendar uma demo para mim?"
    ]

    for msg in messages:
        intent, confidence = detect_message_intent(msg)
        print(f"  '{msg}' -> {intent} (confidence: {confidence})")

    # Test interest score calculation
    print("\n📊 Interest score test:")

    test_cases = [
        (0, 0, 0, FunnelStage.NEW, None),
        (3, 0, 0, FunnelStage.CONTACTED, None),
        (5, 1, 20, FunnelStage.RESPONDED, None),
        (3, 3, 100, FunnelStage.INTERESTED, None),
        (7, 0, 0, FunnelStage.UNRESPONSIVE, None),
    ]

    for sent, received, rate, stage, last in test_cases:
        score = calculate_interest_score(sent, received, rate, stage, last)
        print(f"  Sent={sent}, Received={received}, Rate={rate}%, Stage={stage.value} -> Score={score}")

    print("\n" + "=" * 70)
    print("✨ Tests completed!")
    print("=" * 70)
