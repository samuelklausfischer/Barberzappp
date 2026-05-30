"""
Service Models

Pydantic models for service-related endpoints.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator, ConfigDict


class ServiceBase(BaseModel):
    """Base service model."""
    name: str = Field(..., min_length=1, max_length=255, description="Service name")
    description: Optional[str] = Field(None, description="Service description")
    price: float = Field(..., gt=0, description="Service price")
    duration: int = Field(..., gt=0, le=480, description="Service duration in minutes")
    status: str = Field(default="active", pattern="^(active|inactive)$")


class ServiceCreate(ServiceBase):
    """Model for creating a new service."""
    pass


class ServiceUpdate(BaseModel):
    """Model for updating service information."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    duration: Optional[int] = Field(None, gt=0, le=480)
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")
    image_url: Optional[str] = Field(None, description="URL of service image")


class ServiceResponse(ServiceBase):
    """Complete service response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    user_id: Any = Field(..., description="Tenant ID")
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ServiceListResponse(BaseModel):
    """List of services response."""
    total: int
    items: list[ServiceResponse]
