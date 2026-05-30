"""
Authentication Routes

Endpoints for user authentication and token management.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from api.models.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserResponse
)
from api.models.common import ErrorResponse, MessageResponse
from integrations.supabase_rest import SupabaseRestClient


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()


# ============= PLACEHOLDER JWT FUNCTIONS =============
# TODO: Implement proper JWT generation and validation

def create_access_token(user_id: str, tenant_id: str, role: str = "admin") -> tuple[str, int]:
    """
    Create JWT access token.
    
    Args:
        user_id: User ID
        tenant_id: Tenant ID
        role: User role
    
    Returns:
        Tuple of (token, expires_in_seconds)
    """
    # TODO: Implement proper JWT with jose library
    # For now, return a mock token
    expires_in = 3600  # 1 hour
    token = f"access_token_{user_id}_{tenant_id}_{int(datetime.utcnow().timestamp())}"
    return token, expires_in


def create_refresh_token(user_id: str, tenant_id: str) -> str:
    """
    Create JWT refresh token.
    
    Args:
        user_id: User ID
        tenant_id: Tenant ID
    
    Returns:
        Refresh token string
    """
    # TODO: Implement proper JWT
    return f"refresh_token_{user_id}_{tenant_id}_{int(datetime.utcnow().timestamp())}"


def verify_token(token: str, token_type: str = "access") -> dict:
    """
    Verify JWT token.
    
    Args:
        token: JWT token string
        token_type: Token type ('access' or 'refresh')
    
    Returns:
        Dict with token payload
    
    Raises:
        HTTPException: If token is invalid
    """
    # TODO: Implement proper JWT verification
    # For now, just parse the mock token
    
    if token.startswith(f"{token_type}_token_"):
        parts = token.split("_")[2:]  # Skip prefix
        if len(parts) >= 2:
            return {
                "sub": parts[0],
                "tenant_id": parts[1],
                "role": "admin",
                "iat": int(parts[2]) if len(parts) > 2 else None,
                "exp": None
            }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"}
    )


# ============= ROUTES =============

@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    request: LoginRequest,
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> LoginResponse:
    """
    Authenticate user and return access token.
    
    Validates credentials and returns JWT tokens for API access.
    
    Args:
        request: Login credentials (email, password, remember_me)
        client: Supabase client
    
    Returns:
        LoginResponse with access_token, refresh_token, and user info
    
    Raises:
        HTTPException: If credentials are invalid
    """
    logger.info(f"Login attempt: {request.email}")
    
    # TODO: Validate password with actual hashing
    # For now, simulate authentication
    
    try:
        # Query user/tenant from database
        # Try to find user by email
        results = client.get(
            'agente_config',
            filters={'email': f'eq.{request.email}'},
            single=True
        )
        
        if not results:
            # Try to find by user_id as fallback
            results = client.get(
                'agente_config',
                filters={'user_id': f'eq.1'},  # Demo fallback
                single=True
            )
        
        if not results:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # For demo: accept any non-empty password
        # TODO: Validate actual password hash
        if not request.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password is required",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Build user info
        user_id = results.get('user_id') or results.get('id') or '1'
        tenant_id = str(user_id)  # For now, tenant_id = user_id
        user_name = results.get('barber_name') or results.get('nome_barbearia') or 'Barbearia'
        
        # Create tokens
        access_token, expires_in = create_access_token(
            user_id=user_id,
            tenant_id=tenant_id,
            role="admin"
        )
        
        refresh_token = create_refresh_token(
            user_id=user_id,
            tenant_id=tenant_id
        )
        
        # Update last login (if table supports it)
        # TODO: Implement last_login update
        
        logger.info(f"✓ Login successful: {request.email} -> tenant_id={tenant_id}")
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user=UserResponse(
                id=user_id,
                tenant_id=tenant_id,
                name=user_name,
                email=request.email,
                phone=results.get('phone'),
                role="admin",
                is_active=True,
                created_at=results.get('created_at', datetime.utcnow()),
                last_login=datetime.utcnow()
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: RefreshTokenRequest
) -> RefreshTokenResponse:
    """
    Refresh access token using refresh token.
    
    Args:
        request: Refresh token request
    
    Returns:
        RefreshTokenResponse with new access_token
    
    Raises:
        HTTPException: If refresh token is invalid
    """
    logger.info("Token refresh request")
    
    try:
        # Verify refresh token
        payload = verify_token(request.refresh_token, token_type="refresh")
        
        # Create new access token
        user_id = payload["sub"]
        tenant_id = payload["tenant_id"]
        role = payload["role"]
        
        access_token, expires_in = create_access_token(
            user_id=user_id,
            tenant_id=tenant_id,
            role=role
        )
        
        logger.info(f"✓ Token refreshed: user_id={user_id}, tenant_id={tenant_id}")
        
        return RefreshTokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def logout(credentials = Depends(security)) -> MessageResponse:
    """
    Logout user and invalidate token.
    
    Note: JWT tokens are stateless. This endpoint can be used for logging purposes
    or to add the token to a blacklist (if implementing token blacklisting).
    
    Args:
        credentials: Bearer token credentials
    
    Returns:
        MessageResponse confirming logout
    """
    # TODO: Implement token blacklisting if needed
    # For now, just acknowledge
    logger.info("User logged out")
    
    return MessageResponse(
        message="Successfully logged out",
        data={"logged_out": True}
    )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    credentials = Depends(security),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> UserResponse:
    """
    Get current authenticated user information.
    
    Args:
        credentials: Bearer token credentials
        client: Supabase client
    
    Returns:
        UserResponse with user information
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = verify_token(token, token_type="access")
    
    user_id = payload["sub"]
    tenant_id = payload["tenant_id"]
    
    try:
        # Query user from database
        results = client.get(
            'agente_config',
            filters={'user_id': f'eq.{user_id}'},
            single=True
        )
        
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user_id,
            tenant_id=tenant_id,
            name=results.get('barber_name') or results.get('nome_barbearia') or 'Barbearia',
            email=results.get('email') or '',
            phone=results.get('phone'),
            role=payload.get("role", "admin"),
            is_active=True,
            created_at=results.get('created_at', datetime.utcnow()),
            last_login=results.get('last_login')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user info: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
