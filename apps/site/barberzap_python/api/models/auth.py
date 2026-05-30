"""
Authentication Models

Pydantic models for authentication endpoints.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=1, description="User password")
    remember_me: bool = Field(default=False, description="Remember token")


class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer")
    expires_in: int = Field(..., description="Token expiration in seconds")
    user: 'UserResponse' = Field(..., description="User information")


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str = Field(..., description="JWT refresh token")


class RefreshTokenResponse(BaseModel):
    """Refresh token response."""
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer")
    expires_in: int = Field(..., description="Token expiration in seconds")


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str = Field(..., description="Subject (user ID)")
    tenant_id: str = Field(..., description="Tenant ID")
    role: str = Field(default="admin", pattern="^(admin|manager|barber|assistant)$")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")


class UserBase(BaseModel):
    """Base user model."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr = Field(..., description="User email")
    phone: Optional[str] = Field(None, max_length=20)
    role: str = Field(default="admin", pattern="^(admin|manager|barber|assistant)$")


class UserResponse(UserBase):
    """User response model."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    tenant_id: Any = Field(..., description="Tenant ID")
    photo_url: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime
    last_login: Optional[datetime] = None


# Forward reference resolution
LoginResponse.model_rebuild()
