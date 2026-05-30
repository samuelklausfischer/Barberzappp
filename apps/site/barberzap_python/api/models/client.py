"""
Client Models

Pydantic models for client-related endpoints.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ClientBase(BaseModel):
    """Base client model."""
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = Field(None, description="Client email")
    address: Optional[str] = Field(None, description="Client address")
    notes: Optional[str] = Field(None, description="Additional notes")
    status: str = Field(default="active", pattern="^(active|inactive)$")


class ClientCreate(ClientBase):
    """Model for creating a new client."""
    birth_date: Optional[datetime] = Field(None, description="Client birth date")


class ClientUpdate(BaseModel):
    """Model for updating client information."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")
    birth_date: Optional[datetime] = None
    photo_url: Optional[str] = Field(None, description="URL of client photo")


class ClientResponse(ClientBase):
    """Complete client response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    tenant_id: Any = Field(..., description="Tenant ID")
    birth_date: Optional[datetime] = None
    photo_url: Optional[str] = None
    total_visits: int = Field(default=0, description="Total number of visits")
    total_spent: float = Field(default=0.0, description="Total amount spent")
    last_visit: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ClientListResponse(BaseModel):
    """List of clients response."""
    total: int
    items: list[ClientResponse]
