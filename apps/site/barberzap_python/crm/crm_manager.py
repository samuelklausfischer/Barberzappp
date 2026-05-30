"""
BarberZap CRM Manager

Module for CRM logging operations (leads upsert and messages logging).
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from integrations.supabase_rest import get_client, SupabaseError


# Configuração de logging
logger = logging.getLogger(__name__)


def upsert_lead(
    user_id: str,
    phone: str,
    name: Optional[str] = None,
    status: str = 'new',
    source: str = 'whatsapp',
    metadata: Optional[Dict[str, Any]] = None
) -> Dict:
    """
    Upsert a lead in crm_leads table.

    Checks if lead exists by user_id + phone combination.
    If exists, updates name and metadata. If not, creates new lead.

    Args:
        user_id: Tenant ID (user_id from whatsapp_instances)
        phone: Phone number (format: 5511999999999, without @s.whatsapp.net)
        name: Lead name (optional, defaults to phone if not provided)
        status: Lead status (default: 'new')
        source: Source of the lead (default: 'whatsapp')
        metadata: Additional metadata as dictionary

    Returns:
        Dict with structure:
            {
                'success': bool,
                'lead_id': Optional[int],
                'action': str,  # 'created' or 'updated'
                'lead': Optional[Dict],
                'error': Optional[str]
            }

    Example:
        >>> result = upsert_lead(
        ...     user_id='123',
        ...     phone='5511999999999',
        ...     name='João Silva'
        ... )
        >>> print(result['action'])
        'created'
        >>> print(result['lead_id'])
        123
    """
    result = {
        'success': False,
        'lead_id': None,
        'action': None,
        'lead': None,
        'error': None
    }

    try:
        client = get_client()

        # Normalize phone number (remove special chars, spaces)
        phone = phone.strip().replace('+', '').replace('-', '').replace(' ', '')

        if not phone:
            error_msg = "Phone number is required"
            logger.error(error_msg)
            result['error'] = error_msg
            return result

        if not user_id:
            error_msg = "User ID is required"
            logger.error(error_msg)
            result['error'] = error_msg
            return result

        logger.info(f"Upserting lead: user_id={user_id}, phone={phone}, name={name}")

        # Try to find existing lead
        existing_lead = client.get(
            'crm_leads',
            {'user_id': f'eq.{user_id}', 'phone': f'eq.{phone}'},
            single=True
        )

        if existing_lead:
            # Update existing lead
            lead_id = existing_lead.get('id')

            update_data = {
                'updated_at': datetime.utcnow().isoformat()
            }

            # Update name if provided and different
            if name and name != existing_lead.get('name'):
                update_data['name'] = name

            # Update status if different
            if status and status != existing_lead.get('status'):
                update_data['status'] = status

            # Merge metadata
            existing_meta = existing_lead.get('metadata') or {}
            if metadata:
                update_data['metadata'] = {**existing_meta, **metadata}

            if update_data:
                updated_lead = client.patch('crm_leads', lead_id, update_data)
                result['lead'] = updated_lead
                logger.info(f"✅ Lead updated: {lead_id}")
            else:
                result['lead'] = existing_lead
                logger.info(f"ℹ️ Lead already up to date: {lead_id}")

            result['lead_id'] = lead_id
            result['action'] = 'updated'

        else:
            # Create new lead
            lead_data = {
                'user_id': user_id,
                'phone': phone,
                'name': name or phone,
                'status': status,
                'source': source,
                'metadata': metadata or {},
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

            new_lead = client.post('crm_leads', lead_data)
            lead_id = new_lead.get('id') if new_lead else None

            result['lead'] = new_lead
            result['lead_id'] = lead_id
            result['action'] = 'created'

            logger.info(f"✅ Lead created: {lead_id}")

        result['success'] = True
        return result

    except SupabaseError as e:
        error_msg = f"Supabase error in upsert_lead: {e}"
        logger.error(error_msg)
        result['error'] = error_msg
        return result

    except Exception as e:
        error_msg = f"Unexpected error in upsert_lead: {e}"
        logger.error(error_msg, exc_info=True)
        result['error'] = error_msg
        return result


def log_message(
    lead_id: int,
    user_id: str,
    phone: str,
    direction: str,
    message: str,
    response: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict:
    """
    Log a message to crm_messages table.

    Args:
        lead_id: Lead ID (from crm_leads)
        user_id: Tenant ID
        phone: Phone number
        direction: Message direction ('inbound' or 'outbound')
        message: Message content (inbound or outbound)
        response: Response content (for outbound messages with original inbound)
        metadata: Additional metadata (model, provider, instance_name, etc.)

    Returns:
        Dict with structure:
            {
                'success': bool,
                'message_id': Optional[int],
                'message': Optional[Dict],
                'error': Optional[str]
            }

    Example:
        >>> result = log_message(
        ...     lead_id=123,
        ...     user_id='user_001',
        ...     phone='5511999999999',
        ...     direction='inbound',
        ...     message='Quero agendar um corte',
        ...     response='Claro! Qual horário prefere?'
        ... )
        >>> print(result['success'])
        True
    """
    result = {
        'success': False,
        'message_id': None,
        'message': None,
        'error': None
    }

    try:
        client = get_client()

        # Validate required fields
        if not lead_id:
            error_msg = "lead_id is required"
            logger.error(error_msg)
            result['error'] = error_msg
            return result

        if not user_id:
            error_msg = "user_id is required"
            logger.error(error_msg)
            result['error'] = error_msg
            return result

        if not phone:
            error_msg = "phone is required"
            logger.error(error_msg)
            result['error'] = error_msg
            return result

        if not direction or direction not in ['inbound', 'outbound']:
            error_msg = "direction must be 'inbound' or 'outbound'"
            logger.error(error_msg)
            result['error'] = error_msg
            return result

        if not message:
            error_msg = "message content is required"
            logger.error(error_msg)
            result['error'] = error_msg
            return result

        logger.debug(
            f"Logging message: lead_id={lead_id}, direction={direction}, "
            f"phone={phone}, message={message[:50]}..."
        )

        # Prepare message data
        message_data = {
            'lead_id': lead_id,
            'user_id': user_id,
            'phone': phone,
            'direction': direction,
            'message': message,
            'response': response or None,
            'metadata': metadata or {},
            'created_at': datetime.utcnow().isoformat()
        }

        # Insert message
        created_message = client.post('crm_messages', message_data)
        message_id = created_message.get('id') if created_message else None

        result['message'] = created_message
        result['message_id'] = message_id
        result['success'] = True

        logger.debug(f"✅ Message logged: {message_id}")

        return result

    except SupabaseError as e:
        error_msg = f"Supabase error in log_message: {e}"
        logger.error(error_msg)
        result['error'] = error_msg
        return result

    except Exception as e:
        error_msg = f"Unexpected error in log_message: {e}"
        logger.error(error_msg, exc_info=True)
        result['error'] = error_msg
        return result


def log_conversation(
    user_id: str,
    phone: str,
    client_name: Optional[str] = None,
    inbound_message: Optional[str] = None,
    outbound_message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict:
    """
    Complete conversation logging: upsert lead + log messages.

    Convenience function that combines upsert_lead and log_message
    for a complete conversation logged event.

    Args:
        user_id: Tenant ID
        phone: Phone number
        client_name: Optional client name
        inbound_message: Inbound message from client
        outbound_message: Outbound response from AI
        metadata: Additional metadata to attach to both lead and messages

    Returns:
        Dict with structure:
            {
                'success': bool,
                'lead_result': Dict,  # Result from upsert_lead
                'messages_logged': int,  # Number of messages logged
                'errors': List[str],  # List of any errors
                'lead_id': Optional[int]
            }

    Example:
        >>> result = log_conversation(
        ...     user_id='123',
        ...     phone='5511999999999',
        ...     client_name='João',
        ...     inbound_message='Quero agendar um corte',
        ...     outbound_message='Claro! Qual horário prefere?'
        ... )
        >>> print(result['success'])
        True
        >>> print(result['lead_id'])
        123
    """
    result = {
        'success': False,
        'lead_result': None,
        'messages_logged': 0,
        'errors': [],
        'lead_id': None
    }

    try:
        # Step 1: Upsert lead
        lead_result = upsert_lead(
            user_id=user_id,
            phone=phone,
            name=client_name,
            metadata=metadata
        )

        result['lead_result'] = lead_result

        if not lead_result.get('success'):
            error_msg = f"Failed to upsert lead: {lead_result.get('error')}"
            logger.error(error_msg)
            result['errors'].append(error_msg)
            return result

        lead_id = lead_result.get('lead_id')
        result['lead_id'] = lead_id

        # Step 2: Log inbound message (if provided)
        if inbound_message:
            log_result = log_message(
                lead_id=lead_id,
                user_id=user_id,
                phone=phone,
                direction='inbound',
                message=inbound_message,
                metadata=metadata
            )

            if log_result.get('success'):
                result['messages_logged'] += 1
            else:
                result['errors'].append(
                    f"Failed to log inbound message: {log_result.get('error')}"
                )

        # Step 3: Log outbound message (if provided)
        if outbound_message:
            log_result = log_message(
                lead_id=lead_id,
                user_id=user_id,
                phone=phone,
                direction='outbound',
                message=outbound_message,
                metadata=metadata
            )

            if log_result.get('success'):
                result['messages_logged'] += 1
            else:
                result['errors'].append(
                    f"Failed to log outbound message: {log_result.get('error')}"
                )

        result['success'] = len(result['errors']) == 0

        if result['success']:
            logger.info(f"✅ Complete conversation logged: lead_id={lead_id}, messages={result['messages_logged']}")

        return result

    except Exception as e:
        error_msg = f"Unexpected error in log_conversation: {e}"
        logger.error(error_msg, exc_info=True)
        result['errors'].append(error_msg)
        return result


# ============= EXEMPLOS DE USO =============

if __name__ == '__main__':
    # Configura logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("=" * 70)
    print("BarberZap CRM Manager - Exemplos de Uso")
    print("=" * 70)

    # Exemplo 1: Upsert lead novo
    print("\n📝 Exemplo 1: Criar novo lead")
    print("-" * 70)

    result = upsert_lead(
        user_id='1',
        phone='5511999999999',
        name='João Silva',
        status='new',
        source='whatsapp'
    )

    print(f"Sucesso: {result['success']}")
    print(f"Action: {result['action']}")
    print(f"Lead ID: {result['lead_id']}")
    if result.get('error'):
        print(f"Error: {result['error']}")

    # Exemplo 2: Logar mensagem
    print("\n📝 Exemplo 2: Logar mensagem")
    print("-" * 70)

    if result['lead_id']:
        log_result = log_message(
            lead_id=result['lead_id'],
            user_id='1',
            phone='5511999999999',
            direction='inbound',
            message='Quero agendar um corte',
            response='Claro! Qual horário prefere?',
            metadata={'instance_name': 'barbearia_001'}
        )

        print(f"Sucesso: {log_result['success']}")
        print(f"Message ID: {log_result['message_id']}")
        if log_result.get('error'):
            print(f"Error: {log_result['error']}")

    # Exemplo 3: Logar conversação completa
    print("\n📝 Exemplo 3: Logar conversação completa")
    print("-" * 70)

    conv_result = log_conversation(
        user_id='1',
        phone='5511888888888',
        client_name='Maria Santos',
        inbound_message='Qual o preço do corte?',
        outbound_message='Nossos cortes custam R$ 35. Quer agendar?',
        metadata={'instance_name': 'barbearia_001', 'ai_model': 'nemotron_nano'}
    )

    print(f"Sucesso: {conv_result['success']}")
    print(f"Lead ID: {conv_result['lead_id']}")
    print(f"Mensagens logadas: {conv_result['messages_logged']}")
    if conv_result.get('errors'):
        print(f"Erros: {conv_result['errors']}")

    # Exemplo 4: Upsert lead existente
    print("\n📝 Exemplo 4: Atualizar lead existente")
    print("-" * 70)

    if result['lead_id']:
        update_result = upsert_lead(
            user_id='1',
            phone='5511999999999',
            name='João Silva Jr.',  # Nome atualizado
            status='contacted',
            metadata={'last_contact': '2026-02-23'}
        )

        print(f"Sucesso: {update_result['success']}")
        print(f"Action: {update_result['action']}")
        print(f"Lead ID: {update_result['lead_id']}")

    print("\n" + "=" * 70)
    print("✨ Exemplos concluídos!")
    print("=" * 70)
