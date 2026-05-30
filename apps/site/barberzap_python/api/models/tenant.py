"""
Tenant Models

Pydantic models for tenant-related endpoints.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class TenantBase(BaseModel):
    """Base tenant model."""
    name: str = Field(..., min_length=1, max_length=255, description="Barbershop name")
    email: Optional[EmailStr] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, max_length=20, description="Contact phone")
    address: Optional[str] = Field(None, max_length=500, description="Barbershop address")
    hours: Optional[str] = Field(None, description="Business hours")
    status: str = Field(default="active", pattern="^(active|inactive|suspended)$")


class TenantCreate(TenantBase):
    """Model for creating a new tenant."""
    password: str = Field(..., min_length=8, description="Admin password")
    whatsapp_number: Optional[str] = Field(None, max_length=20, description="WhatsApp number")
    instance_name: Optional[str] = Field(None, max_length=100, description="Evolution API instance name")


class TenantUpdate(BaseModel):
    """Model for updating tenant information."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    hours: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|suspended)$")
    logo_url: Optional[str] = Field(None, description="URL of company logo")


class TenantResponse(TenantBase):
    """Complete tenant response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any = Field(..., description="Tenant ID")
    user_id: Any = Field(..., description="User ID (tenant identifier)")
    whatsapp_number: Optional[str] = None
    instance_name: Optional[str] = None
    logo_url: Optional[str] = None
    ai_name: str = Field(default="Bot Barbearia", description="AI assistant name")
    ai_enabled: bool = Field(default=True, description="Whether AI is enabled")
    language: str = Field(default="pt-BR", description="Interface language")
    timezone: str = Field(default="America/Sao_Paulo", description="Timezone")
    greeting: Optional[str] = Field(None, description="Custom greeting message")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class TenantConfigResponse(BaseModel):
    """Tenant configuration response."""
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Any
    barbershop_name: str
    address: Optional[str] = None
    hours: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    ai_name: str
    ai_enabled: bool
    greeting: Optional[str] = None
    logo_url: Optional[str] = None
    
    # Instance configuration
    instance_name: Optional[str] = None
    instance_status: Optional[str] = None
    
    # Counts
    barbers_count: int = 0
    services_count: int = 0
    appointments_count: int = 0
    leads_count: int = 0
