"""
Stats/Analytics Models

Pydantic models for analytics and statistics endpoints.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class DateRangeFilter(BaseModel):
    """Date range filter for stats queries."""
    start_date: Optional[datetime] = Field(None, description="Start date (inclusive)")
    end_date: Optional[datetime] = Field(None, description="End date (inclusive)")
    period: str = Field(
        default="7d",
        pattern="^(today|yesterday|7d|30d|90d|1y|custom)$",
        description="Time period preset or 'custom' for custom range"
    )


class OverviewStats(BaseModel):
    """Overview statistics for the dashboard."""
    total_leads: int = Field(default=0)
    new_leads_today: int = Field(default=0)
    active_conversations: int = Field(default=0)
    total_appointments: int = Field(default=0)
    appointments_today: int = Field(default=0)
    total_revenue: float = Field(default=0.0)
    revenue_today: float = Field(default=0.0)
    conversion_rate: float = Field(default=0.0)
    
    # Counts
    barbers_count: int = Field(default=0)
    services_count: int = Field(default=0)
    clients_count: int = Field(default=0)


class LeadsStats(BaseModel):
    """Lead statistics and breakdown."""
    total: int = Field(default=0)
    new: int = Field(default=0)
    contacted: int = Field(default=0)
    converted: int = Field(default=0)
    lost: int = Field(default=0)
    
    new_leads_by_source: Dict[str, int] = Field(default_factory=dict)
    leads_per_day: list[Dict[str, Any]] = Field(default_factory=list)
    conversion_funnel: Dict[str, int] = Field(default_factory=dict)


class ConversationsStats(BaseModel):
    """Conversation statistics."""
    total_conversations: int = Field(default=0)
    total_messages: int = Field(default=0)
    inbound_messages: int = Field(default=0)
    outbound_messages: int = Field(default=0)
    avg_response_time_minutes: Optional[float] = None
    
    messages_per_day: list[Dict[str, Any]] = Field(default_factory=list)
    top_contacts: list[Dict[str, Any]] = Field(default_factory=list)


class RevenueStats(BaseModel):
    """Revenue statistics."""
    total_revenue: float = Field(default=0.0)
    revenue_by_service: Dict[str, float] = Field(default_factory=dict)
    revenue_by_barber: Dict[str, float] = Field(default_factory=dict)
    revenue_by_period: list[Dict[str, Any]] = Field(default_factory=list)
    
    average_ticket: float = Field(default=0.0)
    completed_appointments: int = Field(default=0)


class StatsResponse(BaseModel):
    """Complete statistics response."""
    tenant_id: Any
    period: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    overview: OverviewStats
    leads: LeadsStats
    conversations: ConversationsStats
    revenue: RevenueStats
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)
