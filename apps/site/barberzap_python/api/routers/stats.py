"""
Stats/Analytics Routes

Endpoints for dashboard analytics and statistics.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from api.models.stats import (
    OverviewStats,
    LeadsStats,
    ConversationsStats,
    RevenueStats,
    StatsResponse,
    DateRangeFilter
)
from api.deps import get_current_user, get_date_range
from integrations.supabase_rest import SupabaseRestClient


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stats", tags=["Analytics"])


def get_tenant_id(user: dict) -> str:
    """Extract tenant_id from user."""
    return str(user.get("tenant_id", user.get("id", "1")))


@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    period: str = "7d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> OverviewStats:
    """Get overview statistics for the dashboard."""
    try:
        tenant_id = get_tenant_id(user)
        date_range = get_date_range(period, start_date, end_date)
        
        start_dt = date_range['start_date'] if date_range else datetime.utcnow() - timedelta(days=7)
        end_dt = date_range['end_date'] if date_range else datetime.utcnow()
        
        # Count leads
        all_leads = client.get('crm_leads', filters={'tenant_id': f'eq.{tenant_id}'}) or []
        total_leads = len(all_leads)
        
        # Count new leads today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        new_leads_today = sum(1 for l in all_leads if l.get('created_at') and l['created_at'] >= today_start.isoformat())
        
        # Count conversations with messages
        conversations = len(set(l.get('id') for l in all_leads))
        
        # Count services and barbers
        services = client.get('services', filters={'user_id': f'eq.{tenant_id}'}) or []
        barbers = client.get('barbers', filters={'user_id': f'eq.{tenant_id}'}) or []
        
        return OverviewStats(
            total_leads=total_leads,
            new_leads_today=new_leads_today,
            active_conversations=conversations,
            total_appointments=0,  # TODO: Implement
            appointments_today=0,
            total_revenue=0.0,  # TODO: Implement
            revenue_today=0.0,
            conversion_rate=0.0,  # TODO: Calculate
            barbers_count=len(barbers),
            services_count=len(services),
            clients_count=total_leads
        )
        
    except Exception as e:
        logger.error(f"Error getting overview stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leads", response_model=LeadsStats)
async def get_leads_stats(
    period: str = "7d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> LeadsStats:
    """Get lead statistics."""
    try:
        tenant_id = get_tenant_id(user)
        
        leads = client.get('crm_leads', filters={'tenant_id': f'eq.{tenant_id}'}) or []
        
        total = len(leads)
        
        # Count by status
        new = sum(1 for l in leads if (l.get('status') or l.get('kanban_stage')) == 'new')
        contacted = sum(1 for l in leads if (l.get('status') or l.get('kanban_stage')) == 'contacted')
        converted = sum(1 for l in leads if (l.get('status') or l.get('kanban_stage')) == 'converted')
        lost = sum(1 for l in leads if (l.get('status') or l.get('kanban_stage')) == 'lost')
        
        return LeadsStats(
            total=total,
            new=new,
            contacted=contacted,
            converted=converted,
            lost=lost,
            new_leads_by_source={'whatsapp': total},
            leads_per_day=[],
            conversion_funnel={'new': new, 'contacted': contacted, 'converted': converted, 'lost': lost}
        )
        
    except Exception as e:
        logger.error(f"Error getting leads stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=ConversationsStats)
async def get_conversations_stats(
    period: str = "7d",
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> ConversationsStats:
    """Get conversation statistics."""
    try:
        tenant_id = get_tenant_id(user)
        
        messages = client.get('crm_messages', filters={'tenant_id': f'eq.{tenant_id}'}) or []
        
        total_messages = len(messages)
        inbound = sum(1 for m in messages if m.get('sender_type') == 'client')
        outbound = total_messages - inbound
        
        # Count unique conversations (leads)
        unique_leads = len(set(m.get('lead_id') for m in messages if m.get('lead_id')))
        
        return ConversationsStats(
            total_conversations=unique_leads,
            total_messages=total_messages,
            inbound_messages=inbound,
            outbound_messages=outbound,
            avg_response_time_minutes=None,
            messages_per_day=[],
            top_contacts=[]
        )
        
    except Exception as e:
        logger.error(f"Error getting conversations stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/revenue", response_model=RevenueStats)
async def get_revenue_stats(
    period: str = "7d",
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> RevenueStats:
    """Get revenue statistics."""
    try:
        # TODO: Implement when appointments/booking table is available
        return RevenueStats(
            total_revenue=0.0,
            revenue_by_service={},
            revenue_by_barber={},
            revenue_by_period=[],
            average_ticket=0.0,
            completed_appointments=0
        )
        
    except Exception as e:
        logger.error(f"Error getting revenue stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/full", response_model=StatsResponse)
async def get_full_stats(
    period: str = "7d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> StatsResponse:
    """Get complete statistics."""
    try:
        tenant_id = get_tenant_id(user)
        date_range = get_date_range(period, start_date, end_date)
        
        overview = await get_overview_stats(period, start_date, end_date, user, client)
        leads = await get_leads_stats(period, start_date, end_date, user, client)
        conversations = await get_conversations_stats(period, user, client)
        revenue = await get_revenue_stats(period, user, client)
        
        return StatsResponse(
            tenant_id=tenant_id,
            period=period,
            start_date=date_range['start_date'] if date_range else None,
            end_date=date_range['end_date'] if date_range else None,
            overview=overview,
            leads=leads,
            conversations=conversations,
            revenue=revenue,
            generated_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error getting full stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
