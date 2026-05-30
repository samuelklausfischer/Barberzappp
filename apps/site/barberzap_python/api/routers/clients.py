"""
Client Routes

Endpoints for client management.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from api.models.client import (
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientListResponse
)
from api.models.common import PaginationParams
from api.deps import get_current_user, get_pagination_params
from integrations.supabase_rest import SupabaseRestClient


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/clients", tags=["Clients"])


def get_tenant_id(user: dict) -> str:
    """Extract tenant_id from user."""
    return str(user.get("tenant_id", user.get("id", "1")))


@router.get("", response_model=ClientListResponse)
async def list_clients(
    pagination: PaginationParams = Depends(),
    status: str = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ClientListResponse:
    """List all clients."""
    try:
        tenant_id = get_tenant_id(user)
        
        # TODO: Implement when clients table exists
        # For now, return leads as clients
        from crm.crm_logger import list_leads as crm_list_leads
        
        leads = crm_list_leads(
            tenant_id=tenant_id,
            limit=pagination.page_size,
            offset=pagination.offset,
            client=client
        )
        
        items = [
            ClientResponse(
                id=l.get('id'),
                tenant_id=l.get('tenant_id', tenant_id),
                name=l.get('name') or l.get('client_name', ''),
                phone=l.get('phone') or l.get('client_phone', ''),
                email=l.get('email'),
                address=None,
                notes=l.get('notes'),
                status=l.get('status') or l.get('kanban_stage', 'active'),
                birth_date=None,
                photo_url=None,
                total_visits=0,
                total_spent=0.0,
                last_visit=None,
                created_at=l.get('created_at', datetime.utcnow()),
                updated_at=l.get('updated_at')
            )
            for l in leads
        ]
        
        return ClientListResponse(total=len(items), items=items)
        
    except Exception as e:
        logger.error(f"Error listing clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    client_data: ClientCreate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ClientResponse:
    """Create a new client."""
    try:
        from crm.crm_logger import upsert_lead
        
        tenant_id = get_tenant_id(user)
        
        result = upsert_lead(
            tenant_id=tenant_id,
            phone=client_data.phone,
            name=client_data.name,
            status='new',
            email=client_data.email,
            notes=client_data.notes,
            client=client
        )
        
        return ClientResponse(
            id=result.get('id'),
            tenant_id=tenant_id,
            name=result.get('name') or result.get('client_name', ''),
            phone=result.get('phone') or result.get('client_phone', ''),
            email=client_data.email,
            address=None,
            notes=client_data.notes,
            status='active',
            birth_date=client_data.birth_date,
            photo_url=None,
            total_visits=0,
            total_spent=0.0,
            last_visit=None,
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except Exception as e:
        logger.error(f"Error creating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ClientResponse:
    """Get client by ID."""
    try:
        from crm.crm_logger import get_lead_by_id
        
        tenant_id = get_tenant_id(user)
        
        lead = get_lead_by_id(tenant_id, client_id, client)
        
        if not lead:
            raise HTTPException(status_code=404, detail="Client not found")
        
        return ClientResponse(
            id=lead.get('id'),
            tenant_id=tenant_id,
            name=lead.get('name') or lead.get('client_name', ''),
            phone=lead.get('phone') or lead.get('client_phone', ''),
            email=lead.get('email'),
            address=None,
            notes=lead.get('notes'),
            status=lead.get('status') or lead.get('kanban_stage', 'active'),
            birth_date=None,
            photo_url=None,
            total_visits=0,
            total_spent=0.0,
            last_visit=None,
            created_at=lead.get('created_at', datetime.utcnow()),
            updated_at=lead.get('updated_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    update: ClientUpdate,
    user: dict = Depends(get_current_user),
    Client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ClientResponse:
    """Update client information."""
    try:
        from crm.crm_logger import update_lead_status
        
        tenant_id = get_tenant_id(user)
        
        data = update.model_dump(exclude_unset=True)
        
        if 'status' in data:
            # Get lead phone first
            from crm.crm_logger import get_lead_by_id
            lead = get_lead_by_id(tenant_id, client_id, Client)
            if not lead:
                raise HTTPException(status_code=404, detail="Client not found")
            
            phone = lead.get('phone') or lead.get('client_phone', '')
            
            update_lead_status(
                tenant_id=tenant_id,
                phone=phone,
                status=data['status'],
                notes=data.get('notes'),
                client=Client
            )
        
        return await get_client(client_id, user, Client)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> None:
    """Delete a client."""
    try:
        # TODO: Implement when clients table exists
        # For now, don't actually delete (leads should be archived instead)
        raise HTTPException(status_code=501, detail="Delete not implemented")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting client: {e}")
        raise HTTPException(status_code=500, detail=str(e))
