"""
Service Routes

Endpoints for service management.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from api.models.service import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceListResponse
)
from api.models.common import PaginationParams
from api.deps import get_current_user, get_pagination_params
from integrations.supabase_rest import SupabaseRestClient


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/services", tags=["Services"])


def get_tenant_id(user: dict) -> str:
    """Extract tenant_id from user."""
    return str(user.get("tenant_id", user.get("id", "1")))


@router.get("", response_model=ServiceListResponse)
async def list_services(
    pagination: PaginationParams = Depends(),
    status: str = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ServiceListResponse:
    """List all services for the tenant."""
    try:
        tenant_id = get_tenant_id(user)
        
        filters = {'user_id': f'eq.{tenant_id}'}
        if status:
            filters['status'] = f'eq.{status}'
        
        filters['order'] = f'{pagination.order_by}.{pagination.order_dir}'
        filters['limit'] = str(pagination.page_size)
        filters['offset'] = str(pagination.offset)
        
        results = client.get('services', filters) or []
        
        items = [
            ServiceResponse(
                id=s.get('id'),
                user_id=s.get('user_id'),
                name=s.get('name', ''),
                description=s.get('description'),
                price=float(s.get('price', 0)),
                duration=int(s.get('duration', 30)),
                status=s.get('status', 'active'),
                image_url=s.get('image_url'),
                created_at=s.get('created_at', datetime.utcnow()),
                updated_at=s.get('updated_at')
            )
            for s in results
        ]
        
        return ServiceListResponse(total=len(items), items=items)
        
    except Exception as e:
        logger.error(f"Error listing services: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(
    service: ServiceCreate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ServiceResponse:
    """Create a new service."""
    try:
        tenant_id = get_tenant_id(user)
        
        data = service.model_dump()
        data['user_id'] = tenant_id
        data['created_at'] = datetime.utcnow().isoformat()
        
        result = client.post('services', data)
        
        if isinstance(result, list):
            result = result[0] if result else {}
        
        return ServiceResponse(
            id=result.get('id'),
            user_id=result.get('user_id'),
            name=result.get('name', ''),
            description=result.get('description'),
            price=float(result.get('price', 0)),
            duration=int(result.get('duration', 30)),
            status=result.get('status', 'active'),
            image_url=result.get('image_url'),
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except Exception as e:
        logger.error(f"Error creating service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ServiceResponse:
    """Get service by ID."""
    try:
        tenant_id = get_tenant_id(user)
        
        result = client.get(
            'services',
            filters={'id': f'eq.{service_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Service not found")
        
        return ServiceResponse(
            id=result.get('id'),
            user_id=result.get('user_id'),
            name=result.get('name', ''),
            description=result.get('description'),
            price=float(result.get('price', 0)),
            duration=int(result.get('duration', 30)),
            status=result.get('status', 'active'),
            image_url=result.get('image_url'),
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    update: ServiceUpdate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ServiceResponse:
    """Update service information."""
    try:
        tenant_id = get_tenant_id(user)
        
        existing = client.get(
            'services',
            filters={'id': f'eq.{service_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Service not found")
        
        data = update.model_dump(exclude_unset=True)
        if data:
            data['updated_at'] = datetime.utcnow().isoformat()
            
            import requests
            from urllib.parse import urlencode
            url = f"{client.url}/rest/v1/services"
            filters = {'id': f'eq.{service_id}'}
            query_string = urlencode(filters)
            if query_string:
                url = f"{url}?{query_string}"
            
            response = client.session.request(
                method='PATCH', url=url, headers=client.headers, json=data, timeout=30
            )
            client._handle_response(response)
        
        return await get_service(service_id, user, client)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> None:
    """Delete a service."""
    try:
        tenant_id = get_tenant_id(user)
        
        existing = client.get(
            'services',
            filters={'id': f'eq.{service_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Service not found")
        
        client.delete('services', service_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting service: {e}")
        raise HTTPException(status_code=500, detail=str(e))
