"""
WhatsApp Models

Pydantic models for WhatsApp-related endpoints.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class WhatsAppInstanceInfo(BaseModel):
    """WhatsApp instance information."""
    instance_name: str
    status: str
    connected: bool
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None
    battery_level: Optional[int] = None
    platform: Optional[str] = None
    created_at: Optional[datetime] = None


class WhatsAppConnectionResponse(BaseModel):
    """WhatsApp connection status response."""
    connected: bool = Field(..., description="Whether WhatsApp is connected")
    instance_name: Optional[str] = None
    status: str = Field(..., description="Connection status")
    qr_code: Optional[str] = Field(None, description="QR code for pairing (if needed)")
    phone_connected: Optional[str] = Field(None, description="Connected phone number")
    last_activity: Optional[datetime] = None
    uptime_seconds: Optional[int] = None


class WhatsAppTestMessageRequest(BaseModel):
    """Request model for sending test WhatsApp message."""
    phone: str = Field(..., min_length=10, max_length=20, description="Recipient phone")
    message: str = Field(..., min_length=1, max_length=1000, description="Test message")


class WhatsAppTestMessageResponse(BaseModel):
    """Response model for test message."""
    success: bool
    message_id: Optional[str] = None
    phone: str
    message: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    status: str
    error: Optional[str] = None
    delivery_attempts: int = Field(default=1)
