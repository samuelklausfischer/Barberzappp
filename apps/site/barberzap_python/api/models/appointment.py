"""
Appointment Models

Pydantic models for appointment-related endpoints.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AppointmentBase(BaseModel):
    """Base appointment model."""
    client_name: str = Field(..., min_length=1, max_length=255)
    client_phone: str = Field(..., min_length=10, max_length=20)
    barber_id: Any = Field(..., description="ID of the barber")
    service_ids: list = Field(..., min_length=1, description="List of service IDs")
    appointment_date: datetime = Field(..., description="Appointment date and time")
    status: str = Field(
        default="scheduled",
        pattern="^(scheduled|confirmed|completed|cancelled|no_show)$"
    )
    notes: Optional[str] = Field(None, description="Additional notes")


class AppointmentCreate(AppointmentBase):
    """Model for creating a new appointment."""
    total_price: Optional[float] = Field(None, description="Total appointment price")
    duration_minutes: Optional[int] = Field(None, description="Total duration in minutes")


class AppointmentUpdate(BaseModel):
    """Model for updating appointment."""
    client_name: Optional[str] = Field(None, min_length=1, max_length=255)
    client_phone: Optional[str] = Field(None, min_length=10, max_length=20)
    barber_id: Optional[Any] = None
    service_ids: Optional[list] = Field(None, min_length=1)
    appointment_date: Optional[datetime] = None
    status: Optional[str] = Field(
        None,
        pattern="^(scheduled|confirmed|completed|cancelled|no_show)$"
    )
    notes: Optional[str] = None
    total_price: Optional[float] = None
    duration_minutes: Optional[int] = None
    reminder_sent: Optional[bool] = None


class AppointmentResponse(AppointmentBase):
    """Complete appointment response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    tenant_id: Any = Field(..., description="Tenant ID")
    total_price: Optional[float] = None
    duration_minutes: Optional[int] = None
    reminder_sent: bool = Field(default=False)
    created_at: datetime
    updated_at: Optional[datetime] = None


class AppointmentListResponse(BaseModel):
    """List of appointments response."""
    total: int
    items: list[AppointmentResponse]
