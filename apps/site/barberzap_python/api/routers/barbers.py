"""
Barber Routes

Endpoints for barber management.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from api.models.barber import (
    BarberCreate,
    BarberUpdate,
    BarberResponse,
    BarberListResponse
)
from api.models.common import PaginationParams
from api.deps import get_current_user, get_pagination_params
from integrations.supabase_rest import SupabaseRestClient
from datetime import datetime


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/barbers", tags=["Barbers"])


def get_tenant_id(user: dict) -> str:
    """Extract tenant_id from user."""
    return str(user.get("tenant_id", user.get("id", "1")))


@router.get("", response_model=BarberListResponse)
async def list_barbers(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> BarberListResponse:
    """List all barbers for the tenant."""
    try:
        tenant_id = get_tenant_id(user)
        
        filters = {'user_id': f'eq.{tenant_id}'}
        if status:
            filters['status'] = f'eq.{status}'
        
        filters['order'] = f'{pagination.order_by}.{pagination.order_dir}'
        filters['limit'] = str(pagination.page_size)
        filters['offset'] = str(pagination.offset)
        
        results = client.get('barbers', filters) or []
        
        items = [
            BarberResponse(
                id=b.get('id'),
                user_id=b.get('user_id'),
                name=b.get('name', ''),
                specialties=b.get('specialties'),
                bio=b.get('bio'),
                status=b.get('status', 'active'),
                photo_url=b.get('photo_url'),
                created_at=b.get('created_at', datetime.utcnow()),
                updated_at=b.get('updated_at')
            )
            for b in results
        ]
        
        return BarberListResponse(total=len(items), items=items)
        
    except Exception as e:
        logger.error(f"Error listing barbers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=BarberResponse, status_code=status.HTTP_201_CREATED)
async def create_barber(
    barber: BarberCreate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> BarberResponse:
    """Create a new barber."""
    try:
        tenant_id = get_tenant_id(user)
        
        data = barber.model_dump()
        data['user_id'] = tenant_id
        data['created_at'] = datetime.utcnow().isoformat()
        
        result = client.post('barbers', data)
        
        if isinstance(result, list):
            result = result[0] if result else {}
        
        return BarberResponse(
            id=result.get('id'),
            user_id=result.get('user_id'),
            name=result.get('name', ''),
            specialties=result.get('specialties'),
            bio=result.get('bio'),
            status=result.get('status', 'active'),
            photo_url=result.get('photo_url'),
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except Exception as e:
        logger.error(f"Error creating barber: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{barber_id}", response_model=BarberResponse)
async def get_barber(
    barber_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> BarberResponse:
    """Get barber by ID."""
    try:
        tenant_id = get_tenant_id(user)
        
        result = client.get(
            'barbers',
            filters={'id': f'eq.{barber_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Barber not found")
        
        return BarberResponse(
            id=result.get('id'),
            user_id=result.get('user_id'),
            name=result.get('name', ''),
            specialties=result.get('specialties'),
            bio=result.get('bio'),
            status=result.get('status', 'active'),
            photo_url=result.get('photo_url'),
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting barber: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{barber_id}", response_model=BarberResponse)
async def update_barber(
    barber_id: str,
    update: BarberUpdate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> BarberResponse:
    """Update barber information."""
    try:
        tenant_id = get_tenant_id(user)
        
        # Verify ownership
        existing = client.get(
            'barbers',
            filters={'id': f'eq.{barber_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Barber not found")
        
        data = update.model_dump(exclude_unset=True)
        if data:
            data['updated_at'] = datetime.utcnow().isoformat()
            
            # Manual patch
            import requests
            from urllib.parse import urlencode
            url = f"{client.url}/rest/v1/barbers"
            filters = {'id': f'eq.{barber_id}'}
            query_string = urlencode(filters)
            if query_string:
                url = f"{url}?{query_string}"
            
            response = client.session.request(
                method='PATCH', url=url, headers=client.headers, json=data, timeout=30
            )
            result = client._handle_response(response)
        else:
            result = existing
            if isinstance(result, list):
                result = result[0]
        
        return await get_barber(barber_id, user, client)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating barber: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{barber_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_barber(
    barber_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> None:
    """Delete a barber."""
    try:
        tenant_id = get_tenant_id(user)
        
        existing = client.get(
            'barbers',
            filters={'id': f'eq.{barber_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Barber not found")
        
        client.delete('barbers', barber_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting barber: {e}")
        raise HTTPException(status_code=500, detail=str(e))
