"""
Tenant Routes

Endpoints for tenant (barbershop) management.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer

from api.models.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantResponse,
    TenantConfigResponse
)
from api.models.common import (
    PaginatedResponse,
    SuccessResponse,
    ErrorResponse,
    PaginationParams
)
from api.deps import get_current_user, get_pagination_params
from integrations.supabase_rest import SupabaseRestClient
from core.context_builder import get_barbers_list, get_services_list


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tenants", tags=["Tenants"])
security = HTTPBearer()


def get_tenant_id_from_user(user: dict) -> str:
    """Extract tenant_id from user dict."""
    return str(user.get("tenant_id", user.get("id", "1")))


# ============= CRUD ENDPOINTS =============

@router.get("", response_model=PaginatedResponse[TenantResponse])
async def list_tenants(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> PaginatedResponse[TenantResponse]:
    """
    List all tenants (paginated).
    
    Args:
        pagination: Pagination parameters
        status: Filter by status (active, inactive, suspended)
        user: Current user
        client: Supabase client
    
    Returns:
        Paginated list of tenants
    """
    try:
        tenant_id = get_tenant_id_from_user(user)
        user_role = user.get("role", "barber")
        
        # Non-admin users can only see their own tenant
        if user_role != "admin":
            filters = {
                'user_id': f'eq.{tenant_id}'
            }
        else:
            filters = {}
            if status:
                filters['status'] = f'eq.{status}'
        
        # Add pagination
        filters['order'] = f'{pagination.order_by}.{pagination.order_dir}'
        filters['limit'] = str(pagination.page_size)
        filters['offset'] = str(pagination.offset)
        
        # Query tenants
        results = client.get('agente_config', filters) or []
        
        # Count total
        # TODO: Implement proper count
        total = len(results)
        
        # Build response
        items = []
        for result in results:
            items.append(TenantResponse(
                id=result.get('id') or result.get('user_id'),
                user_id=result.get('user_id') or result.get('id'),
                name=result.get('barber_name') or result.get('nome_barbearia') or '',
                email=result.get('email', ''),
                phone=result.get('phone'),
                address=result.get('endereco') or result.get('address'),
                hours=result.get('horarios') or result.get('horario_funcionamento'),
                status=status or result.get('status', 'active'),
                whatsapp_number=result.get('whatsapp'),
                instance_name=result.get('instance_name'),
                logo_url=result.get('logo_url'),
                ai_name=result.get('nome_ia') or result.get('ai_name', 'Bot'),
                ai_enabled=result.get('ai_enabled', True),
                language=result.get('language', 'pt-BR'),
                timezone=result.get('timezone', 'America/Sao_Paulo'),
                greeting=result.get('saudacao'),
                created_at=result.get('created_at'),
                updated_at=result.get('updated_at')
            ))
        
        total_pages = (total + pagination.page_size - 1) // pagination.page_size
        
        return PaginatedResponse(
            items=items,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Error listing tenants: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing tenants: {str(e)}"
        )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> TenantResponse:
    """
    Get tenant by ID.
    
    Args:
        tenant_id: Tenant ID
        user: Current user
        client: Supabase client
    
    Returns:
        Tenant details
    
    Raises:
        HTTPException: If tenant not found or access denied
    """
    try:
        current_tenant_id = get_tenant_id_from_user(user)
        user_role = user.get("role", "barber")
        
        # Check access
        if user_role != "admin" and current_tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Query tenant
        result = client.get(
            'agente_config',
            filters={'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        return TenantResponse(
            id=result.get('id') or result.get('user_id'),
            user_id=result.get('user_id') or result.get('id'),
            name=result.get('barber_name') or result.get('nome_barbearia') or '',
            email=result.get('email', ''),
            phone=result.get('phone'),
            address=result.get('endereco') or result.get('address'),
            hours=result.get('horarios') or result.get('horario_funcionamento'),
            status=result.get('status', 'active'),
            whatsapp_number=result.get('whatsapp'),
            instance_name=result.get('instance_name'),
            logo_url=result.get('logo_url'),
            ai_name=result.get('nome_ia') or result.get('ai_name', 'Bot'),
            ai_enabled=result.get('ai_enabled', True),
            language=result.get('language', 'pt-BR'),
            timezone=result.get('timezone', 'America/Sao_Paulo'),
            greeting=result.get('saudacao'),
            created_at=result.get('created_at'),
            updated_at=result.get('updated_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tenant: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting tenant: {str(e)}"
        )


@router.get("/{tenant_id}/config", response_model=TenantConfigResponse)
async def get_tenant_config(
    tenant_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> TenantConfigResponse:
    """
    Get complete tenant configuration including related data.
    
    Args:
        tenant_id: Tenant ID
        user: Current user
        client: Supabase client
    
    Returns:
        Complete tenant configuration
    """
    try:
        from core.tenant_resolver import get_tenant_instance_info
        
        current_tenant_id = get_tenant_id_from_user(user)
        user_role = user.get("role", "barber")
        
        if user_role != "admin" and current_tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get tenant config
        result = client.get(
            'agente_config',
            filters={'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Get barbers and services counts
        barbers = get_barbers_list(tenant_id, client=client)
        services = get_services_list(tenant_id, client=client)
        
        # Get WhatsApp instance info
        instance_info = get_tenant_instance_info(result.get('instance_name'), tenant_id)
        
        # Count leads
        leads = client.get(
            'crm_leads',
            filters={'tenant_id': f'eq.{tenant_id}'},
            single=False
        )
        leads_count = len(leads) if leads else 0
        
        # Count appointments (if table exists)
        # TODO: Implement appointment counting
        
        return TenantConfigResponse(
            tenant_id=tenant_id,
            barbershop_name=result.get('barber_name') or result.get('nome_barbearia') or '',
            address=result.get('endereco') or result.get('address'),
            hours=result.get('horarios') or result.get('horario_funcionamento'),
            phone=result.get('phone'),
            whatsapp=result.get('whatsapp'),
            ai_name=result.get('nome_ia') or result.get('ai_name', 'Bot'),
            ai_enabled=result.get('ai_enabled', True),
            greeting=result.get('saudacao'),
            logo_url=result.get('logo_url'),
            instance_name=result.get('instance_name'),
            instance_status=instance_info.get('status') if instance_info else None,
            barbers_count=len(barbers),
            services_count=len(services),
            appointments_count=0,
            leads_count=leads_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tenant config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting tenant config: {str(e)}"
        )


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    update: TenantUpdate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> TenantResponse:
    """
    Update tenant information.
    
    Args:
        tenant_id: Tenant ID
        update: Update data
        user: Current user
        client: Supabase client
    
    Returns:
        Updated tenant
    """
    try:
        current_tenant_id = get_tenant_id_from_user(user)
        user_role = user.get("role", "barber")
        
        if user_role != "admin" and current_tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Build update data
        update_data = update.model_dump(exclude_unset=True)
        
        # Map field names
        if 'name' in update_data:
            update_data['barber_name'] = update_data.pop('name')
        if 'address' in update_data:
            update_data['endereco'] = update_data['address']
        if 'hours' in update_data:
            update_data['horarios'] = update_data['hours']
        
        # Add timestamp
        from datetime import datetime
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Update tenant
        result = client_patch(client, 'agente_config', user_id=tenant_id, data=update_data)
        
        # Return updated tenant
        return await get_tenant(tenant_id, user, client)
        
    except Exception as e:
        logger.error(f"Error updating tenant: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating tenant: {str(e)}"
        )


# Helper function
def client_patch(client: SupabaseRestClient, table: str, user_id: str, data: dict):
    """Patch using user_id filter."""
    import requests
    url = f"{client.url}/rest/v1/{table}"
    filters = {'user_id': f'eq.{user_id}'}
    from urllib.parse import urlencode
    query_string = urlencode(filters)
    if query_string:
        url = f"{url}?{query_string}"
    
    response = client.session.request(
        method='PATCH',
        url=url,
        headers=client.headers,
        json=data,
        timeout=30
    )
    return client._handle_response(response)
