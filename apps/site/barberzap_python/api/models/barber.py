"""
Barber Models

Pydantic models for barber-related endpoints.
"""

from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class BarberBase(BaseModel):
    """Base barber model."""
    name: str = Field(..., min_length=1, max_length=255, description="Barber name")
    specialties: Optional[str] = Field(None, description="Services/specialties")
    bio: Optional[str] = Field(None, description="Barber bio/description")
    status: str = Field(default="active", pattern="^(active|inactive)$")


class BarberCreate(BarberBase):
    """Model for creating a new barber."""
    pass


class BarberUpdate(BaseModel):
    """Model for updating barber information."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    specialties: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")
    photo_url: Optional[str] = Field(None, description="URL of barber photo")


class BarberResponse(BarberBase):
    """Complete barber response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    user_id: Any = Field(..., description="Tenant ID")
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class BarberListResponse(BaseModel):
    """List of barbers response."""
    total: int
    items: list[BarberResponse]
