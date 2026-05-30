"""
Chat Models

Pydantic models for chat-related endpoints.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ChatSendMessageRequest(BaseModel):
    """Request model for sending a message manually."""
    phone: str = Field(..., min_length=10, max_length=20, description="Recipient phone")
    message: str = Field(..., min_length=1, description="Message content")
    save_to_crm: bool = Field(default=True, description="Save message to CRM history")


class ChatSendMessageResponse(BaseModel):
    """Response model for sent message."""
    success: bool
    message_id: Optional[str] = None
    phone: str
    direction: str = Field(default="outbound")
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None


class ChatHistoryRequest(BaseModel):
    """Request model for fetching chat history."""
    phone: str = Field(..., min_length=10, max_length=20)
    limit: int = Field(default=50, ge=1, le=500)
    include_lead_info: bool = Field(default=True)


class ChatHistoryResponse(BaseModel):
    """Response model for chat history."""
    phone: str
    lead_info: Optional[Dict[str, Any]] = None
    messages: list[Dict[str, Any]]
    total_messages: int
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)


class AIGenerateRequest(BaseModel):
    """Request model for AI message generation."""
    phone: str = Field(..., min_length=10, max_length=20, description="Client phone")
    client_input: str = Field(..., min_length=1, description="Input message from client")
    context_override: Optional[Dict[str, Any]] = Field(None, description="Override context")
    mode: str = Field(
        default="auto",
        pattern="^(auto|booking|info|support|sales)$",
        description="AI response mode"
    )
    temperature: float = Field(default=0.7, ge=0, le=2, description="AI temperature")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Max tokens to generate")


class AIGenerateResponse(BaseModel):
    """Response model for AI generation."""
    success: bool
    response: Optional[str] = None
    ai_name: str
    barbershop_name: str
    mode: str
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    cost_estimate: Optional[float] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)
