"""
Lead/CRM Models

Pydantic models for lead and CRM-related endpoints.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class LeadBase(BaseModel):
    """Base lead model."""
    name: Optional[str] = Field(None, max_length=255, description="Lead/client name")
    phone: str = Field(..., min_length=10, max_length=20, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    notes: Optional[str] = Field(None, description="Additional notes")
    status: str = Field(
        default="new",
        pattern="^(new|contacted|converted|lost)$",
        description="Lead status in kanban"
    )
    source: str = Field(default="whatsapp", description="Lead source")


class LeadCreate(LeadBase):
    """Model for creating a new lead."""
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class LeadUpdate(BaseModel):
    """Model for updating lead information."""
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(new|contacted|converted|lost)$")
    tags: Optional[List[str]] = Field(None, description="Lead tags")


class LeadStatusUpdate(BaseModel):
    """Model for updating lead status only."""
    status: str = Field(
        ...,
        pattern="^(new|contacted|converted|lost)$",
        description="New lead status"
    )
    notes: Optional[str] = Field(None, description="Optional notes with status change")


class LeadResponse(LeadBase):
    """Complete lead response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    tenant_id: Any = Field(..., description="Tenant ID")
    tags: List[str] = Field(default_factory=list)
    ai_enabled: bool = Field(default=True)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class LeadListResponse(BaseModel):
    """List of leads response."""
    total: int
    items: List[LeadResponse]


class MessageBase(BaseModel):
    """Base message model."""
    message: str = Field(..., min_length=1, description="Message content")
    direction: str = Field(..., pattern="^(inbound|outbound)$", description="Message direction")


class MessageCreate(MessageBase):
    """Model for creating a new message."""
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class MessageResponse(MessageBase):
    """Complete message response."""
    model_config = ConfigDict(from_attributes=True)

    id: Any
    tenant_id: Any = Field(..., description="Tenant ID")
    lead_id: Any = Field(..., description="Lead ID")
    sender_type: str
    phone: str
    media_url: Optional[str] = None
    created_at: datetime


class MessageListResponse(BaseModel):
    """List of messages response."""
    total: int
    items: List[MessageResponse]


class ConversationResponse(BaseModel):
    """Conversation with lead info and messages."""
    lead: LeadResponse
    messages: List[MessageResponse]
    total_messages: int
