"""
Lead/CRM Routes

Endpoints for lead and CRM management.
"""

import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from api.models.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadListResponse,
    LeadStatusUpdate,
    MessageResponse,
    MessageListResponse,
    ConversationResponse
)
from api.models.common import PaginationParams
from api.deps import get_current_user, get_pagination_params
from api.models.lead import MessageBase, MessageCreate
from integrations.supabase_rest import SupabaseRestClient


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/leads", tags=["Leads / CRM"])


def get_tenant_id(user: dict) -> str:
    """Extract tenant_id from user."""
    return str(user.get("tenant_id", user.get("id", "1")))


# ============= LEAD ENDPOINTS =============

@router.get("", response_model=LeadListResponse)
async def list_leads(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> LeadListResponse:
    """List all leads for the tenant."""
    try:
        from crm.crm_logger import list_leads as crm_list_leads
        
        tenant_id = get_tenant_id(user)
        
        leads = crm_list_leads(
            tenant_id=tenant_id,
            status=status,
            limit=pagination.page_size,
            offset=pagination.offset,
            client=client
        )
        
        items = [
            LeadResponse(
                id=l.get('id'),
                tenant_id=l.get('tenant_id', tenant_id),
                name=l.get('name') or l.get('client_name', ''),
                phone=l.get('phone') or l.get('client_phone', ''),
                email=l.get('email'),
                notes=l.get('notes'),
                status=l.get('status') or l.get('kanban_stage', 'new'),
                source=l.get('source', 'whatsapp'),
                tags=l.get('tags', []),
                ai_enabled=l.get('ai_enabled', True),
                metadata=l.get('metadata', {}),
                last_message_at=l.get('last_message_at'),
                created_at=l.get('created_at', datetime.utcnow()),
                updated_at=l.get('updated_at')
            )
            for l in leads
        ]
        
        return LeadListResponse(total=len(items), items=items)
        
    except Exception as e:
        logger.error(f"Error listing leads: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    lead: LeadCreate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> LeadResponse:
    """Create a new lead."""
    try:
        from crm.crm_logger import upsert_lead
        
        tenant_id = get_tenant_id(user)
        
        result = upsert_lead(
            tenant_id=tenant_id,
            phone=lead.phone,
            name=lead.name,
            status=lead.status,
            email=lead.email,
            notes=lead.notes,
            metadata=lead.metadata,
            client=client
        )
        
        return LeadResponse(
            id=result.get('id'),
            tenant_id=tenant_id,
            name=result.get('name') or result.get('client_name', ''),
            phone=result.get('phone') or result.get('client_phone', ''),
            email=result.get('email'),
            notes=result.get('notes'),
            status=result.get('status') or result.get('kanban_stage', 'new'),
            source=result.get('source', 'whatsapp'),
            tags=result.get('tags', []),
            ai_enabled=result.get('ai_enabled', True),
            metadata=result.get('metadata', {}),
            last_message_at=result.get('last_message_at'),
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except Exception as e:
        logger.error(f"Error creating lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> LeadResponse:
    """Get lead by ID."""
    try:
        from crm.crm_logger import get_lead_by_id
        
        tenant_id = get_tenant_id(user)
        
        lead = get_lead_by_id(tenant_id, lead_id, client)
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return LeadResponse(
            id=lead.get('id'),
            tenant_id=lead.get('tenant_id', tenant_id),
            name=lead.get('name') or lead.get('client_name', ''),
            phone=lead.get('phone') or lead.get('client_phone', ''),
            email=lead.get('email'),
            notes=lead.get('notes'),
            status=lead.get('status') or lead.get('kanban_stage', 'new'),
            source=lead.get('source', 'whatsapp'),
            tags=lead.get('tags', []),
            ai_enabled=lead.get('ai_enabled', True),
            metadata=lead.get('metadata', {}),
            last_message_at=lead.get('last_message_at'),
            created_at=lead.get('created_at', datetime.utcnow()),
            updated_at=lead.get('updated_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    update: LeadUpdate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> LeadResponse:
    """Update lead information."""
    try:
        from crm.crm_logger import update_lead_status
        
        tenant_id = get_tenant_id(user)
        
        data = update.model_dump(exclude_unset=True)
        
        if 'status' in data:
            update_lead_status(
                tenant_id=tenant_id,
                phone=data.get('phone'),
                status=data.get('status'),
                notes=data.get('notes'),
                client=client
            )
        
        # TODO: Update other fields
        
        return await get_lead(lead_id, user, client)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{lead_id}/status", response_model=LeadResponse)
async def update_lead_status_endpoint(
    lead_id: str,
    update: LeadStatusUpdate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> LeadResponse:
    """Update lead status only."""
    try:
        from crm.crm_logger import update_lead_status, get_lead_by_id
        
        tenant_id = get_tenant_id(user)
        lead = get_lead_by_id(tenant_id, lead_id, client)
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        phone = lead.get('phone') or lead.get('client_phone', '')
        
        update_lead_status(
            tenant_id=tenant_id,
            phone=phone,
            status=update.status,
            notes=update.notes,
            client=client
        )
        
        return await get_lead(lead_id, user, client)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lead status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lead_id}/conversation", response_model=ConversationResponse)
async def get_lead_conversation(
    lead_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ConversationResponse:
    """Get complete conversation history for a lead."""
    try:
        from crm.crm_logger import get_lead_by_id
        
        tenant_id = get_tenant_id(user)
        
        lead = get_lead_by_id(tenant_id, lead_id, client)
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        phone = lead.get('phone') or lead.get('client_phone', '')
        
        messages = client.get(
            'crm_messages',
            filters={'lead_id': f'eq.{lead_id}', 'order': 'created_at.asc'}
        )
        
        return ConversationResponse(
            lead=LeadResponse(
                id=lead.get('id'),
                tenant_id=tenant_id,
                name=lead.get('name') or lead.get('client_name', ''),
                phone=phone,
                email=lead.get('email'),
                notes=lead.get('notes'),
                status=lead.get('status') or lead.get('kanban_stage', 'new'),
                source=lead.get('source', 'whatsapp'),
                tags=lead.get('tags', []),
                ai_enabled=lead.get('ai_enabled', True),
                metadata=lead.get('metadata', {}),
                last_message_at=lead.get('last_message_at'),
                created_at=lead.get('created_at', datetime.utcnow()),
                updated_at=lead.get('updated_at')
            ),
            messages=[
                MessageResponse(
                    id=m.get('id'),
                    tenant_id=m.get('tenant_id'),
                    lead_id=m.get('lead_id'),
                    sender_type=m.get('sender_type'),
                    phone=m.get('phone'),
                    message=m.get('content', '') or '',
                    direction='inbound' if m.get('sender_type') == 'client' else 'outbound',
                    media_url=m.get('media_url'),
                    created_at=m.get('created_at', datetime.utcnow())
                )
                for m in (messages or [])
            ],
            total_messages=len(messages) if messages else 0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lead conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
