"""
Chat Routes

Endpoints for manual chat operations and AI integration.
"""

import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from api.models.chat import (
    ChatSendMessageRequest,
    ChatSendMessageResponse,
    ChatHistoryRequest,
    ChatHistoryResponse,
    AIGenerateRequest,
    AIGenerateResponse
)
from api.deps import get_current_user
from integrations.supabase_rest import SupabaseRestClient
from agents.secretaria_universal import generate_response
from integrations.evolution_api import send_message as evolution_send_message


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


def get_tenant_id(user: dict) -> str:
    """Extract tenant_id from user."""
    return str(user.get("tenant_id", user.get("id", "1")))


@router.post("/send", response_model=ChatSendMessageResponse)
async def send_chat_message(
    request: ChatSendMessageRequest,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ChatSendMessageResponse:
    """
    Send a manual message via WhatsApp.
    
    Args:
        request: Message request with phone and content
        user: Current user
        client: Supabase client
    
    Returns:
        Send message response
    """
    try:
        from crm.crm_logger import log_message
        from core.context_builder import build_context
        
        tenant_id = get_tenant_id(user)
        
        # Build context for AI mention if needed
        context = build_context(tenant_id, client)
        instance_name = context.get('barbershop', {}).get('name', 'default')
        
        # Send message via Evolution API
        evolution_result = evolution_send_message(
            instance_name=instance_name,
            phone=request.phone,
            message=request.message
        )
        
        if request.save_to_crm:
            log_message(
                tenant_id=tenant_id,
                phone=request.phone,
                sender="manual_user",
                message=request.message,
                direction="outbound",
                client=client
            )
        
        return ChatSendMessageResponse(
            success=evolution_result.get('success', False),
            message_id=evolution_result.get('message_id'),
            phone=request.phone,
            direction="outbound",
            sent_at=datetime.utcnow(),
            error=evolution_result.get('error') if not evolution_result.get('success') else None
        )
        
    except Exception as e:
        logger.error(f"Error sending chat message: {e}", exc_info=True)
        return ChatSendMessageResponse(
            success=False,
            phone=request.phone,
            direction="outbound",
            sent_at=datetime.utcnow(),
            error=str(e)
        )


@router.post("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    request: ChatHistoryRequest,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ChatHistoryResponse:
    """
    Get chat history for a phone number.
    
    Args:
        request: History request parameters
        user: Current user
        client: Supabase client
    
    Returns:
        Chat history response
    """
    try:
        from crm.crm_logger import get_lead_history
        
        tenant_id = get_tenant_id(user)
        
        # Get lead info
        from crm.crm_logger import lead_exists, get_lead_by_id
        lead_info = None
        
        # Find lead by phone
        all_leads = client.get(
            'crm_leads',
            filters={'tenant_id': f'eq.{tenant_id}'}
        ) or []
        
        lead = None
        for l in all_leads:
            if l.get('phone') == request.phone or l.get('client_phone') == request.phone:
                lead = l
                break
        
        if lead:
            lead_info = {
                'id': lead.get('id'),
                'name': lead.get('name') or lead.get('client_name'),
                'phone': lead.get('phone') or lead.get('client_phone'),
                'status': lead.get('status') or lead.get('kanban_stage')
            }
        
        # Get messages
        filters = {
            'tenant_id': f'eq.{tenant_id}',
            'order': 'created_at.desc',
            'limit': str(request.limit)
        }
        
        messages = client.get('crm_messages', filters) or []
        
        # Filter by phone
        filtered_messages = [
            m for m in messages
            if m.get('phone') == request.phone
        ][:request.limit]
        
        messages_list = [
            {
                'id': m.get('id'),
                'lead_id': m.get('lead_id'),
                'sender_type': m.get('sender_type'),
                'direction': 'inbound' if m.get('sender_type') == 'client' else 'outbound',
                'message': m.get('content', ''),
                'media_url': m.get('media_url'),
                'created_at': m.get('created_at')
            }
            for m in filtered_messages
        ]
        
        return ChatHistoryResponse(
            phone=request.phone,
            lead_info=lead_info,
            messages=messages_list,
            total_messages=len(messages_list),
            retrieved_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-generate", response_model=AIGenerateResponse)
async def generate_ai_response(
    request: AIGenerateRequest,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> AIGenerateResponse:
    """
    Generate AI response for a message.
    
    Args:
        request: AI generation request
        user: Current user
        client: Supabase client
    
    Returns:
        AI generation response
    """
    try:
        from core.context_builder import build_context
        
        tenant_id = get_tenant_id(user)
        
        # Build context
        context = build_context(tenant_id, client) or request.context_override
        
        # Generate response
        ai_result = generate_response(
            instance_name=f"tenant_{tenant_id}",
            phone=request.phone,
            message=request.client_input,
            context_override=context,
            save_user_message=False,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return AIGenerateResponse(
            success=ai_result.get('success', False),
            response=ai_result.get('response'),
            ai_name=ai_result.get('ai_name', 'AI'),
            barbershop_name=ai_result.get('barbershop_name', 'Barbearia'),
            mode=request.mode,
            model_used=ai_result.get('metadata', {}).get('model'),
            tokens_used=ai_result.get('metadata', {}).get('tokens_used'),
            cost_estimate=ai_result.get('metadata', {}).get('cost'),
            context=context or {},
            error=ai_result.get('error') if not ai_result.get('success') else None,
            generated_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}", exc_info=True)
        return AIGenerateResponse(
            success=False,
            response=None,
            ai_name="AI",
            barbershop_name="Barbearia",
            mode=request.mode,
            context={},
            error=str(e),
            generated_at=datetime.utcnow()
        )
