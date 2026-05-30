"""
BarberZap CRM Demo Booking Module

Funções para gerenciar agendamento de demos no CRM
Integra com schema extendido: funnel_stage (demo_requested, demo_scheduled)
"""

import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta

from crm.crm_manager import upsert_lead, get_lead_by_phone
from integrations.supabase_rest import get_client, SupabaseError


logger = logging.getLogger(__name__)


def update_lead_demo_requested(
    user_id: str,
    phone: str,
    booking_link: str
) -> Dict:
    """
    Atualiza lead quando link de demo é enviado
    
    Args:
        user_id: Tenant ID
        phone: Phone do lead (5511999999999)
        booking_link: Link do Cal.com para demo
    
    Returns:
        Dict com lead atualizado:
        {
            'success': bool,
            'lead_id': Optional[int],
            'action': str,  # 'created' or 'updated'
            'lead': Optional[Dict],
            'error': Optional[str]
        }
    
    Example:
        >>> result = update_lead_demo_requested(
        ...     user_id='1',
        ...     phone='5511999999999',
        ...     booking_link='https://cal.com/samuel/demo-barberzap'
        ... )
        >>> print(result['action'])
        'updated'
    """
    result = upsert_lead(
        user_id=user_id,
        phone=phone,
        status='demo_requested',
        metadata={
            'demo_booking_link': booking_link,
            'demo_link_sent_at': datetime.utcnow().isoformat()
        }
    )
    
    if result.get('success'):
        logger.info(f"✅ Lead marked as demo_requested: {phone}")
    else:
        logger.error(f"❌ Failed to mark lead as demo_requested: {phone}")
    
    return result


def update_lead_demo_scheduled(
    user_id: str,
    phone: str,
    booking_data: Dict
) -> Dict:
    """
    Atualiza lead quando demo é agendada (via Cal.com webhook)
    
    Args:
        user_id: Tenant ID
        phone: Phone do lead (5511999999999)
        booking_data: Dict do booking Cal.com:
            - booking_id: str (UID do booking)
            - start_time: str (ISO 8601 format)
            - end_time: str (ISO 8601 format)
            - attendee: {name, email, phone}
            - meeting_link: str (opcional)
    
    Returns:
        Dict com lead atualizado
    
    Example:
        >>> booking_data = {
        ...     'booking_id': 'booking_xxx',
        ...     'start_time': '2026-02-24T14:00:00Z',
        ...     'end_time': '2026-02-24T14:15:00Z',
        ...     'attendee': {'name': 'João', 'email': 'joao@email.com'},
        ...     'meeting_link': 'https://meet.google.com/xxx'
        ... }
        >>> result = update_lead_demo_scheduled(user_id='1', phone='5511999999999', booking_data=booking_data)
        >>> print(result['success'])
        True
    """
    # Parse timestamps
    start_time = datetime.fromisoformat(booking_data['start_time'].replace('Z', '+00:00'))
    end_time = datetime.fromisoformat(booking_data['end_time'].replace('Z', '+00:00'))
    
    # Upsert lead (update first, then set next_followup)
    result = upsert_lead(
        user_id=user_id,
        phone=phone,
        status='demo_scheduled',
        metadata={
            'demo_booking_id': booking_data['booking_id'],
            'demo_scheduled_at': booking_data['start_time'],
            'demo_ends_at': booking_data['end_time'],
            'demo_meeting_link': booking_data.get('meeting_link'),
            'demo_booking_link': f"https://cal.com/book/samuel/demo/{booking_data['booking_id']}",
            'demo_reminders_sent': []
        }
    )
    
    # Set next_followup at demo time via direct patch
    if result.get('success') and result.get('lead_id'):
        try:
            client = get_client()
            client.patch(
                'crm_leads',
                result['lead_id'],
                {
                    'next_followup_at': start_time.isoformat(),
                    'last_status_change': datetime.utcnow().isoformat()
                }
            )
            logger.info(f"✅ Lead marked as demo_scheduled: {phone} @ {start_time}")
        except SupabaseError as e:
            logger.error(f"❌ Failed to update next_followup_at: {e}")
    
    return result


def record_demo_reminder_sent(
    user_id: str,
    phone: str,
    reminder_time: datetime,
    reminder_type: str
) -> Dict:
    """
    Registra lembrete enviado para demo
    
    Args:
        user_id: Tenant ID
        phone: Phone do lead
        reminder_time: Timestamp do lembrete
        reminder_type: "1h_before", "15min_before", "day_before", "24h_before"
    
    Returns:
        Dict com lead atualizado
    """
    lead = get_lead_by_phone(user_id, phone)
    if not lead:
        return {'success': False, 'error': 'Lead not found'}
    
    metadata = lead.get('metadata', {})
    reminders_sent = metadata.get('demo_reminders_sent', [])
    reminders_sent.append({
        'type': reminder_type,
        'sent_at': reminder_time.isoformat()
    })
    
    result = upsert_lead(
        user_id=user_id,
        phone=phone,
        metadata={**metadata, 'demo_reminders_sent': reminders_sent}
    )
    
    if result.get('success'):
        logger.info(f"✅ Demo reminder recorded: {phone} - {reminder_type}")
    
    return result


def mark_demo_outcome(
    user_id: str,
    phone: str,
    outcome: str,
    notes: Optional[str] = None,
    assignee: Optional[str] = None
) -> Dict:
    """
    Marca resultado da demo e atualiza funnel stage
    
    Args:
        user_id: Tenant ID
        phone: Phone do lead
        outcome: "trial_signup", "interested", "not_interested", "no_show"
        notes: Notas adicionais da demo
        assignee: Nome de quem fez a demo (default: Samuel)
    
    Returns:
        Dict com lead atualizado
    """
    # Mapeia outcome para funnel stage
    stage_mapping = {
        'trial_signup': 'customer',
        'interested': 'considering',
        'not_interested': 'not_interested',
        'no_show': 'unresponsive'
    }
    
    funnel_stage = stage_mapping.get(outcome, 'considering')
    
    metadata = {
        'demo_outcome': outcome,
        'demo_completed_at': datetime.utcnow().isoformat()
    }
    
    if assignee:
        metadata['demo_assignee'] = assignee
    
    if notes:
        metadata['demo_notes'] = notes
    
    result = upsert_lead(
        user_id=user_id,
        phone=phone,
        status=funnel_stage,
        metadata=metadata
    )
    
    if result.get('success'):
        logger.info(f"✅ Demo outcome recorded: {phone} - {outcome}")
    
    return result


def get_leads_needing_demo_today(
    user_id: str
) -> List[Dict]:
    """
    Retorna leads com demo agendada para hoje
    
    Args:
        user_id: Tenant ID
    
    Returns:
        Lista de leads (crm_leads)
    """
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        client = get_client()
        
        # Busca leads scheduled
        leads = client.get(
            'crm_leads',
            {
                'user_id': f'eq.{user_id}',
                'funnel_stage': f'eq.demo_scheduled',
                'next_followup_at': f'gte.{today_start.isoformat()}'
            }
        )
        
        if not leads:
            return []
        
        # Filtra apenas demos de hoje
        today_leads = []
        for lead in leads:
            demo_time = lead.get('metadata', {}).get('demo_scheduled_at')
            if demo_time:
                demo_dt = datetime.fromisoformat(demo_time.replace('Z', '+00:00'))
                if today_start <= demo_dt < today_end:
                    today_leads.append(lead)
        
        logger.info(f"✅ Found {len(today_leads)} demos for today")
        return today_leads
    
    except SupabaseError as e:
        logger.error(f"❌ Error fetching today's demos: {e}")
        return []


def get_leads_needing_reminder(
    user_id: str,
    reminder_type: str
) -> List[Dict]:
    """
    Retorna leads que precisam receber lembrete de demo
    
    Args:
        user_id: Tenant ID
        reminder_type: "1h_before", "15min_before", "24h_before"
    
    Returns:
        Lista de leads que precisam de reminder
    """
    try:
        client = get_client()
        
        # Busca todos leads with demo_scheduled
        leads = client.get(
            'crm_leads',
            {
                'user_id': f'eq.{user_id}',
                'funnel_stage': f'eq.demo_scheduled'
            }
        )
        
        if not leads:
            return []
        
        # Calcular janela de tempo baseada em reminder_type
        now = datetime.utcnow()
        
        reminder_windows = {
            '24h_before': timedelta(hours=23, minutes=30),
            '1h_before': timedelta(minutes=58),
            '15min_before': timedelta(minutes=13)
        }
        
        window = reminder_windows.get(reminder_type, timedelta(hours=1))
        
        needs_reminder_leads = []
        
        for lead in leads:
            demo_time_str = lead.get('metadata', {}).get('demo_scheduled_at')
            if not demo_time_str:
                continue
            
            demo_time = datetime.fromisoformat(demo_time_str.replace('Z', '+00:00'))
            time_until_demo = demo_time - now
            
            # Check if within time window
            if window <= time_until_demo <= window + timedelta(minutes=5):
                # Check if reminder already sent
                reminders = lead.get('metadata', {}).get('demo_reminders_sent', [])
                already_sent = any(r.get('type') == reminder_type for r in reminders)
                
                if not already_sent:
                    needs_reminder_leads.append(lead)
        
        logger.info(f"✅ Found {len(needs_reminder_leads)} leads needing {reminder_type} reminder")
        return needs_reminder_leads
    
    except SupabaseError as e:
        logger.error(f"❌ Error fetching leads needing reminder: {e}")
        return []


def get_leads_needing_demo_link(
    user_id: str,
    hours_since_request: int = 24
) -> List[Dict]:
    """
    Retorna leads que solicitaram demo mas não receberam link ainda
    
    Args:
        user_id: Tenant ID
        hours_since_request: Horas desde a solicitação (default: 24h)
    
    Returns:
        Lista de leads que precisam de link
    """
    try:
        client = get_client()
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_since_request)
        
        leads = client.get(
            'crm_leads',
            {
                'user_id': f'eq.{user_id}',
                'funnel_stage': f'eq.interested'
            }
        )
        
        if not leads:
            return []
        
        needs_link_leads = []
        
        for lead in leads:
            # Check if demo link already sent
            metadata = lead.get('metadata', {})
            if metadata.get('demo_link_sent_at'):
                continue
            
            # Check if lead is new enough
            created_at = datetime.fromisoformat(lead.get('created_at').replace('Z', '+00:00'))
            if created_at >= cutoff_time:
                needs_link_leads.append(lead)
        
        logger.info(f"✅ Found {len(needs_link_leads)} leads needing demo link")
        return needs_link_leads
    
    except SupabaseError as e:
        logger.error(f"❌ Error fetching leads needing demo link: {e}")
        return []


def get_demo_booked_leads(
    user_id: str,
    days: int = 30
) -> List[Dict]:
    """
    Retorna leads com demo agendada nos últimos X dias
    
    Args:
        user_id: Tenant ID
        days: Número de dias (default: 30)
    
    Returns:
        Lista de leads com demo booked
    """
    try:
        client = get_client()
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        leads = client.get(
            'crm_leads',
            {
                'user_id': f'eq.{user_id}',
                'funnel_stage': f'eq.demo_scheduled'
            }
        )
        
        if not leads:
            return []
        
        booked_leads = []
        for lead in leads:
            demo_time_str = lead.get('metadata', {}).get('demo_scheduled_at')
            if not demo_time_str:
                continue
            
            demo_time = datetime.fromisoformat(demo_time_str.replace('Z', '+00:00'))
            if demo_time >= cutoff_date:
                booked_leads.append(lead)
        
        logger.info(f"✅ Found {len(booked_leads)} demo bookings in last {days} days")
        return booked_leads
    
    except SupabaseError as e:
        logger.error(f"❌ Error fetching demo booked leads: {e}")
        return []


# Demo script

if __name__ == '__main__':
    """
    Demo script para testar demo_booking module
    
    Setup:
    1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
    
    2. Run demo:
       python3 crm/demo_booking.py
    """
    import os
    
    print("=" * 70)
    print("BarberZap - Demo Booking CRM Demo")
    print("=" * 70)
    
    user_id = os.environ.get('TEST_USER_ID', '1')
    phone = os.environ.get('TEST_PHONE', '5511999999999')
    booking_link = "https://cal.com/samuel/demo-barberzap"
    
    # Test 1: Mark lead as demo_requested
    print("\n1️⃣ Testing update_lead_demo_requested...")
    print("-" * 70)
    
    result = update_lead_demo_requested(
        user_id=user_id,
        phone=phone,
        booking_link=booking_link
    )
    
    print(f"Success: {result.get('success')}")
    print(f"Action: {result.get('action')}")
    print(f"Lead ID: {result.get('lead_id')}")
    
    # Test 2: Mark lead as demo_scheduled
    print("\n2️⃣ Testing update_lead_demo_scheduled...")
    print("-" * 70)
    
    demo_time = (datetime.utcnow() + timedelta(hours=2)).isoformat()
    booking_data = {
        'booking_id': 'booking_demo_123',
        'start_time': demo_time,
        'end_time': demo_time,
        'attendee': {
            'name': 'João Teste',
            'email': 'teste@email.com',
            'phone': phone
        },
        'meeting_link': 'https://meet.google.com/xxx'
    }
    
    result = update_lead_demo_scheduled(
        user_id=user_id,
        phone=phone,
        booking_data=booking_data
    )
    
    print(f"Success: {result.get('success')}")
    print(f"Funnel stage: demo_scheduled")
    
    # Test 3: Record reminder sent
    print("\n3️⃣ Testing record_demo_reminder_sent...")
    print("-" * 70)
    
    result = record_demo_reminder_sent(
        user_id=user_id,
        phone=phone,
        reminder_time=datetime.utcnow(),
        reminder_type='1h_before'
    )
    
    print(f"Success: {result.get('success')}")
    
    # Test 4: Mark demo outcome
    print("\n4️⃣ Testing mark_demo_outcome...")
    print("-" * 70)
    
    result = mark_demo_outcome(
        user_id=user_id,
        phone=phone,
        outcome='interested',
        notes='Lead gostou da demo, vai avaliar com parceiro',
        assignee='Samuel'
    )
    
    print(f"Success: {result.get('success')}")
    print(f"Outcome: interested → considering")
    
    # Test 5: Get today's demos
    print("\n5️⃣ Testing get_leads_needing_demo_today...")
    print("-" * 70)
    
    today_demos = get_leads_needing_demo_today(user_id=user_id)
    print(f"Demos today: {len(today_demos)}")
    
    print("\n" + "=" * 70)
    print("✅ Demo completed!")
    print("=" * 70)
    
    print("\n📚 Notes:")
    print("- This uses Supabase REST client")
    print("- Ensure extend_prospection_schema.sql is applied")
    print("- Funnel stages handled: demo_requested, demo_scheduled, interested, considering")
