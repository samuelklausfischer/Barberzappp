"""
Dependency Injection Utilities

Common dependencies for route handlers.
"""

from typing import Optional
from functools import lru_cache
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from integrations.supabase_rest import get_client, SupabaseRestClient


# ============= SUPABASE CLIENT DEPENDENCY =============

def get_supabase_client() -> SupabaseRestClient:
    """
    Get Supabase client instance.
    
    Returns:
        SupabaseRestClient instance
    """
    return get_client()


# ============= AUTH DEPENDENCIES =============

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID")
) -> dict:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization header with Bearer token
        x_tenant_id: Tenant ID header (for testing purposes)
    
    Returns:
        Dict with user info: {id, tenant_id, role, email, name}
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    # TODO: Implement proper JWT validation
    # For now, implement a simple placeholder
    
    if x_tenant_id:
        # Testing mode - use tenant-id header
        return {
            "id": x_tenant_id,
            "tenant_id": x_tenant_id,
            "role": "admin",
            "email": f"test@tenant{x_tenant_id}.com",
            "name": f"Test Tenant {x_tenant_id}"
        }
    
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # TODO: Validate JWT token
    # For now, just check if token exists and is not empty
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # TODO: Decode and validate token
    # Placeholder: return mock user data
    return {
        "id": "user_123",
        "tenant_id": "1",
        "role": "admin",
        "email": "admin@example.com",
        "name": "Admin User"
    }


async def verify_admin(user: dict = Depends(get_current_user)) -> dict:
    """
    Verify user has admin role.
    
    Args:
        user: Current user from get_current_user
    
    Returns:
        User info if admin
    
    Raises:
        HTTPException: If user is not admin
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user


async def get_tenant_context(
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Get tenant context from current user.
    
    Args:
        user: Current user from get_current_user
    
    Returns:
        Dict with tenant_id
    """
    return {
        "tenant_id": user.get("tenant_id"),
        "user_id": user.get("id"),
        "user_role": user.get("role")
    }


# ============= PAGINATION DEPENDENCIES =============

def get_pagination_params(
    page: int = 1,
    page_size: int = 20,
    order_by: str = "created_at",
    order_dir: str = "desc"
) -> dict:
    """
    Get pagination parameters from query string.
    
    Args:
        page: Page number (1-indexed)
        page_size: Items per page
        order_by: Field to order by
        order_dir: Sort direction (asc/desc)
    
    Returns:
        Dict with pagination parameters
    """
    # Validate
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20
    if order_dir not in ["asc", "desc"]:
        order_dir = "desc"
    
    return {
        "page": page,
        "page_size": page_size,
        "order_by": order_by,
        "order_dir": order_dir,
        "offset": (page - 1) * page_size
    }


def get_date_range(
    period: str = "7d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Optional[dict]:
    """
    Get date range for analytics queries.
    
    Args:
        period: Time period preset (today, yesterday, 7d, 30d, 90d, 1y, custom)
        start_date: Start date (ISO format) for custom period
        end_date: End date (ISO format) for custom period
    
    Returns:
        Dict with start_date and end_date or None
    """
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    
    if period == "custom":
        if not start_date or not end_date:
            return None
        try:
            return {
                "start_date": datetime.fromisoformat(start_date),
                "end_date": datetime.fromisoformat(end_date)
            }
        except ValueError:
            return None
    
    # Preset periods
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "yesterday":
        start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7d":
        start = now - timedelta(days=7)
    elif period == "30d":
        start = now - timedelta(days=30)
    elif period == "90d":
        start = now - timedelta(days=90)
    elif period == "1y":
        start = now - timedelta(days=365)
    else:
        start = now - timedelta(days=7)  # Default to 7 days
    
    return {
        "start_date": start,
        "end_date": now
    }
