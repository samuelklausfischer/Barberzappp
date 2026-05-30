"""
Employee Routes

Endpoints for employee/staff management.
"""

import logging
from datetime import datetime, time
from fastapi import APIRouter, Depends, HTTPException

from api.models.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse
)
from api.models.common import PaginationParams
from api.deps import get_current_user, get_pagination_params
from integrations.supabase_rest import SupabaseRestClient


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/employees", tags=["Employees"])


def get_tenant_id(user: dict) -> str:
    """Extract tenant_id from user."""
    return str(user.get("tenant_id", user.get("id", "1")))


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    pagination: PaginationParams = Depends(),
    status: str = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> EmployeeListResponse:
    """List all employees."""
    try:
        tenant_id = get_tenant_id(user)
        
        # TODO: Implement when employees table exists
        # For now, return barbers as employees
        filters = {'user_id': f'eq.{tenant_id}'}
        if status:
            filters['status'] = f'eq.{status}'
        
        filters['order'] = f'{pagination.order_by}.{pagination.order_dir}'
        filters['limit'] = str(pagination.page_size)
        filters['offset'] = str(pagination.offset)
        
        results = client.get('barbers', filters) or []
        
        items = [
            EmployeeResponse(
                id=b.get('id'),
                tenant_id=b.get('user_id'),
                name=b.get('name', ''),
                email=None,
                phone=None,
                role='barber',
                bio=b.get('bio'),
                status=b.get('status', 'active'),
                photo_url=b.get('photo_url'),
                work_start_time=None,
                work_end_time=None,
                created_at=b.get('created_at', datetime.utcnow()),
                updated_at=b.get('updated_at')
            )
            for b in results
        ]
        
        return EmployeeListResponse(total=len(items), items=items)
        
    except Exception as e:
        logger.error(f"Error listing employees: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    employee: EmployeeCreate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> EmployeeResponse:
    """Create a new employee."""
    try:
        tenant_id = get_tenant_id(user)
        
        # TODO: Implement when employees table exists
        # For now, create as barber
        data = {
            'user_id': tenant_id,
            'name': employee.name,
            'bio': employee.bio,
            'status': employee.status,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = client.post('barbers', data)
        
        if isinstance(result, list):
            result = result[0] if result else {}
        
        return EmployeeResponse(
            id=result.get('id'),
            tenant_id=tenant_id,
            name=result.get('name', ''),
            email=None,
            phone=None,
            role='barber',
            bio=result.get('bio'),
            status=result.get('status', 'active'),
            photo_url=result.get('photo_url'),
            work_start_time=None,
            work_end_time=None,
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except Exception as e:
        logger.error(f"Error creating employee: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> EmployeeResponse:
    """Get employee by ID."""
    try:
        tenant_id = get_tenant_id(user)
        
        # TODO: Implement when employees table exists
        # For now, get from barbers
        result = client.get(
            'barbers',
            filters={'id': f'eq.{employee_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return EmployeeResponse(
            id=result.get('id'),
            tenant_id=result.get('user_id'),
            name=result.get('name', ''),
            email=None,
            phone=None,
            role='barber',
            bio=result.get('bio'),
            status=result.get('status', 'active'),
            photo_url=result.get('photo_url'),
            work_start_time=None,
            work_end_time=None,
            created_at=result.get('created_at', datetime.utcnow()),
            updated_at=result.get('updated_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting employee: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    update: EmployeeUpdate,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> EmployeeResponse:
    """Update employee information."""
    try:
        tenant_id = get_tenant_id(user)
        
        # Verify exists
        existing = await get_employee(employee_id, user, client)
        if not existing:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        data = update.model_dump(exclude_unset=True)
        if data:
            data['updated_at'] = datetime.utcnow().isoformat()
            
            import requests
            from urllib.parse import urlencode
            url = f"{client.url}/rest/v1/barbers"
            filters = {'id': f'eq.{employee_id}'}
            query_string = urlencode(filters)
            if query_string:
                url = f"{url}?{query_string}"
            
            response = client.session.request(
                method='PATCH', url=url, headers=client.headers, json=data, timeout=30
            )
            client._handle_response(response)
        
        return await get_employee(employee_id, user, client)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating employee: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{employee_id}", status_code=204)
async def delete_employee(
    employee_id: str,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> None:
    """Delete an employee."""
    try:
        tenant_id = get_tenant_id(user)
        
        existing = client.get(
            'barbers',
            filters={'id': f'eq.{employee_id}', 'user_id': f'eq.{tenant_id}'},
            single=True
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        client.delete('barbers', employee_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting employee: {e}")
        raise HTTPException(status_code=500, detail=str(e))
