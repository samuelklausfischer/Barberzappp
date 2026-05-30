"""
Employee Models

Pydantic models for employee-related endpoints.
"""

from typing import Optional
from datetime import datetime, time
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class EmployeeBase(BaseModel):
    """Base employee model."""
    name: str = Field(..., min_length=1, max_length=255, description="Employee name")
    email: Optional[EmailStr] = Field(None, description="Employee email")
    phone: Optional[str] = Field(None, max_length=20, description="Employee phone")
    role: str = Field(default="assistant", pattern="^(admin|manager|barber|assistant)$")
    bio: Optional[str] = Field(None, description="Employee bio")
    status: str = Field(default="active", pattern="^(active|inactive)$")


class EmployeeCreate(EmployeeBase):
    """Model for creating a new employee."""
    password: str = Field(..., min_length=8, description="Employee password")


class EmployeeUpdate(BaseModel):
    """Model for updating employee information."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[str] = Field(None, pattern="^(admin|manager|barber|assistant)$")
    bio: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")
    photo_url: Optional[str] = Field(None, description="URL of employee photo")
    work_start_time: Optional[time] = Field(None, description="Work start time")
    work_end_time: Optional[time] = Field(None, description="Work end time")


class EmployeeResponse(EmployeeBase):
    """Complete employee response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    tenant_id: Any = Field(..., description="Tenant ID")
    photo_url: Optional[str] = None
    work_start_time: Optional[time] = None
    work_end_time: Optional[time] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class EmployeeListResponse(BaseModel):
    """List of employees response."""
    total: int
    items: list[EmployeeResponse]
