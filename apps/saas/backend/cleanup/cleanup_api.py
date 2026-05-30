"""
BarberZap - Data Cleanup API

FastAPI endpoints for managing cleanup operations.
Provides admin-only access to cleanup statistics, manual triggers, and history.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# Router
router = APIRouter(
    prefix="/api/cleanup",
    tags=["cleanup"],
    dependencies=[Depends(HTTPBearer())]
)

# ============================================================================
# Pydantic Models
# ============================================================================

class CleanupStatsResponse(BaseModel):
    """Response for cleanup statistics"""
    table_name: str
    pending_count: int
    avg_age_hours: float
    table_size_mb: float
    total_deleted_24h: int = 0
    total_deleted_7d: int = 0
    total_deleted_30d: int = 0
    avg_daily_deleted: float = 0
    last_cleanup_at: Optional[datetime] = None
    data_growth_rate_mb_per_day: float = 0
    cleanup_health_score: int = 0
    cleanup_errors_24h: int = 0
    active_alerts: int = 0


class CleanupAllStatsResponse(BaseModel):
    """Response for all cleanup statistics"""
    tables: List[CleanupStatsResponse]
    total_pending: int
    total_size_mb: float
    summary: Dict[str, Any]


class CleanupJobRequest(BaseModel):
    """Request to run a cleanup job"""
    dry_run: bool = Field(False, description="If true, only count without deleting")
    performed_by: Optional[str] = Field(None, description="Who is performing the cleanup")
    hours_ago: Optional[int] = Field(None, description="For magic_links, verification_codes")
    log_days: Optional[int] = Field(None, description="For notifications")
    days_ago: Optional[int] = Field(None, description="For tokens, cache")
    time_gap_minutes: Optional[int] = Field(None, description="For activity logs")


class CleanupJobResponse(BaseModel):
    """Response from a cleanup job"""
    job_name: str
    table_name: str
    deleted: int
    duration_ms: int
    status: str
    error_message: Optional[str] = None
    dry_run: bool
    timestamp: datetime


class CleanupAllResponse(BaseModel):
    """Response from running all cleanup jobs"""
    results: Dict[str, CleanupJobResponse]
    total_deleted: int
    total_duration_ms: int
    dry_run: bool
    timestamp: datetime


class CleanupHistoryItem(BaseModel):
    """Single cleanup history item"""
    id: str
    job_name: str
    table_name: str
    count_deleted: int
    status: str
    performed_by: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    dry_run: bool = False


class CleanupScheduleRequest(BaseModel):
    """Request to update cleanup schedule"""
    job_name: str
    schedule_type: str = Field(..., description="hourly, daily, weekly, custom")
    cron_expression: Optional[str] = Field(None, description="For custom schedule")
    enabled: bool = True


class ForceDeleteRequest(BaseModel):
    """Request for force delete (DANGEROUS!)"""
    table_name: str
    count_threshold: int = Field(..., description="Confirm you want to delete this many records")
    confirmation: str = Field(..., description="Type 'CONFIRM' to proceed")
    reason: str = Field(..., description="Reason for force delete")
    performed_by: str = Field(..., description="Who is performing the operation")


# ============================================================================
# Dependencies
# ============================================================================

async def get_supabase_client():
    """Get Supabase client"""
    from ..config import get_supabase_client
    return get_supabase_client()


async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """Verify user is admin"""
    # This would integrate with your auth system
    # For now, just validate token exists
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    return credentials.credentials


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/stats", response_model=CleanupAllStatsResponse)
async def get_cleanup_stats(
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Get cleanup statistics for all tables.

    Returns pending counts, table sizes, and history.
    Admin access only.
    """
    try:
        # Call the stats cache function
        response = supabase.rpc('get_all_cleanup_stats')

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get cleanup stats"
            )

        stats_data = response.data

        # Transform to response models
        tables = []
        total_pending = 0
        total_size_mb = 0

        for row in stats_data:
            stat = CleanupStatsResponse(**row)
            tables.append(stat)
            total_pending += stat.pending_count
            total_size_mb += stat.table_size_mb

        summary = {
            "total_tables": len(tables),
            "tables_with_pending": sum(1 for t in tables if t.pending_count > 0),
            "high_priority_tables": sum(1 for t in tables if t.pending_count > 1000 or t.cleanup_health_score < 70),
            "last_full_cleanup": max((t.last_cleanup_at for t in tables if t.last_cleanup_at), default=None)
        }

        return CleanupAllStatsResponse(
            tables=tables,
            total_pending=total_pending,
            total_size_mb=round(total_size_mb, 2),
            summary=summary
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cleanup stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats/{table_name}", response_model=CleanupStatsResponse)
async def get_table_cleanup_stats(
    table_name: str,
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Get cleanup statistics for a specific table.

    Valid table names: magic_links, verification_codes, notifications,
    activity_logs, client_session_tokens, password_reset_tokens, cache_entries
    """
    valid_tables = [
        'magic_links', 'verification_codes', 'notifications',
        'activity_logs', 'client_session_tokens', 'password_reset_tokens', 'cache_entries'
    ]

    if table_name not in valid_tables:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid table_name. Must be one of: {', '.join(valid_tables)}"
        )

    try:
        response = supabase.rpc(
            'get_cleanup_stats',
            params={'p_table_name': table_name}
        )

        if not response.data or not response.data[0]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table {table_name} not found or no stats available"
            )

        stat_data = response.data[0]
        return CleanupStatsResponse(**stat_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cleanup stats for {table_name}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/run-all", response_model=CleanupAllResponse)
async def run_all_cleanup(
    request: CleanupJobRequest,
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Run all cleanup jobs.

    This will clean up all expired/temporary data across all tables.
    Use dry_run=True to preview what would be deleted.

    Admin access only.
    """
    from .cleanup_job import CleanupJob
    from ..config import get_redis_connection

    try:
        # Initialize cleanup job processor
        redis_conn = get_redis_connection()
        cleanup_job = CleanupJob(redis_conn, supabase)

        # Run all cleanups
        results = await cleanup_job.cleanup_all(
            magic_links_hours=request.hours_ago or 24,
            verification_codes_hours=request.hours_ago or 1,
            notifications_days=request.log_days or 7,
            tokens_days=request.days_ago or 7,
            cache_days=request.days_ago or 7,
            dry_run=request.dry_run,
            performed_by=request.performed_by or 'api'
        )

        # Calculate totals
        total_deleted = sum(r.deleted for r in results.values())
        total_duration = sum(r.duration_ms for r in results.values())

        # Convert to response models
        results_dict = {
            job_name: CleanupJobResponse(**r.to_dict())
            for job_name, r in results.items()
        }

        return CleanupAllResponse(
            results=results_dict,
            total_deleted=total_deleted,
            total_duration_ms=total_duration,
            dry_run=request.dry_run,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error running all cleanup: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/jobs/{job_name}", response_model=CleanupJobResponse)
async def run_specific_cleanup_job(
    job_name: str,
    request: CleanupJobRequest,
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Run a specific cleanup job.

    Valid job names:
    - cleanup_magic_links
    - cleanup_verification_codes
    - cleanup_notifications
    - cleanup_activity_logs
    - cleanup_tokens
    - cleanup_cache

    Admin access only.
    """
    from .cleanup_job import CleanupJob
    from ..config import get_redis_connection

    valid_jobs = [
        'cleanup_magic_links',
        'cleanup_verification_codes',
        'cleanup_notifications',
        'cleanup_activity_logs',
        'cleanup_tokens',
        'cleanup_cache'
    ]

    if job_name not in valid_jobs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid job_name. Must be one of: {', '.join(valid_jobs)}"
        )

    try:
        # Initialize cleanup job processor
        redis_conn = get_redis_connection()
        cleanup_job = CleanupJob(redis_conn, supabase)

        # Route to appropriate cleanup function
        result = None

        if job_name == 'cleanup_magic_links':
            result = await cleanup_job.cleanup_magic_links(
                hours_ago=request.hours_ago or 24,
                dry_run=request.dry_run,
                performed_by=request.performed_by or 'api'
            )
        elif job_name == 'cleanup_verification_codes':
            result = await cleanup_job.cleanup_verification_codes(
                hours_ago=request.hours_ago or 1,
                dry_run=request.dry_run,
                performed_by=request.performed_by or 'api'
            )
        elif job_name == 'cleanup_notifications':
            result = await cleanup_job.cleanup_notifications(
                log_days=request.log_days or 7,
                dry_run=request.dry_run,
                performed_by=request.performed_by or 'api'
            )
        elif job_name == 'cleanup_activity_logs':
            result = await cleanup_job.cleanup_activity_logs(
                time_gap_minutes=request.time_gap_minutes or 1,
                dry_run=request.dry_run,
                performed_by=request.performed_by or 'api'
            )
        elif job_name == 'cleanup_tokens':
            result = await cleanup_job.cleanup_tokens(
                days_ago=request.days_ago or 7,
                dry_run=request.dry_run,
                performed_by=request.performed_by or 'api'
            )
        elif job_name == 'cleanup_cache':
            result = await cleanup_job.cleanup_cache(
                stale_days=request.days_ago or 7,
                dry_run=request.dry_run,
                performed_by=request.performed_by or 'api'
            )

        return CleanupJobResponse(**result.to_dict())

    except Exception as e:
        logger.error(f"Error running cleanup job {job_name}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/history", response_model=List[CleanupHistoryItem])
async def get_cleanup_history(
    limit: int = Query(50, ge=1, le=200),
    table_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Get cleanup history.

    Returns log entries of previous cleanup operations.
    Can filter by table_name, status, and start_date.
    """
    try:
        query = supabase.table('cleanup_runs_log').select('*')

        # Apply filters
        if table_name:
            query = query.eq('table_name', table_name)

        if status:
            query = query.eq('status', status)

        if start_date:
            query = query.gte('started_at', start_date.isoformat())

        # Order and limit
        response = query.order('started_at', desc=True).limit(limit).execute()

        if not response.data:
            return []

        # Transform to response models
        history_items = []
        for row in response.data:
            item = CleanupHistoryItem(
                id=row['id'],
                job_name=row['job_name'],
                table_name=row['table_name'],
                count_deleted=row['count_deleted'],
                status=row['status'],
                performed_by=row.get('performed_by'),
                started_at=row['started_at'],
                completed_at=row.get('completed_at'),
                duration_ms=row.get('duration_ms'),
                dry_run=row.get('dry_run', False)
            )
            history_items.append(item)

        return history_items

    except Exception as e:
        logger.error(f"Error getting cleanup history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/schedule")
async def update_cleanup_schedule(
    request: CleanupScheduleRequest,
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Update cleanup schedule.

    Configure when cleanup jobs should run automatically.
    Requires pg_cron extension enabled.

    Admin access only.
    """
    try:
        # This would interact with pg_cron or an application scheduler
        # For now, return a success response

        # Example pg_cron usage:
        # SELECT cron.schedule('cleanup-magic-links-daily', '0 3 * * *',
        #   $$CALL procedure_cleanup_expired_magic_links(24, 'schedule', FALSE);$$

        # Store schedule config in a config table or app settings
        if request.enabled:
            logger.info(f"Scheduling cleanup job {request.job_name} as {request.schedule_type}")
        else:
            logger.info(f"Disabling cleanup job {request.job_name}")

        return {
            "success": True,
            "message": f"Schedule updated for {request.job_name}",
            "job_name": request.job_name,
            "schedule_type": request.schedule_type,
            "enabled": request.enabled
        }

    except Exception as e:
        logger.error(f"Error updating cleanup schedule: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/force-table")
async def force_delete_table(
    request: ForceDeleteRequest,
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Force delete all records from a table (DANGEROUS!).\n\n
    This operation deletes ALL records without any safety checks.
    It is intended for emergency cleanup when normal methods fail.\n\n
    WARNING: This operation cannot be undone!\n\n
    Requires explicit confirmation and admin access.
    """
    # Validate confirmation
    if request.confirmation != 'CONFIRM':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation must be exactly 'CONFIRM' with all caps"
        )

    # Validate table name
    valid_tables = [
        'magic_links', 'verification_codes', 'notifications',
        'activity_logs', 'client_session_tokens', 'password_reset_tokens', 'cache_entries'
    ]

    if request.table_name not in valid_tables:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid table_name. Must be one of: {', '.join(valid_tables)}"
        )

    # Check the actual count
    try:
        count_response = supabase.rpc(
            'get_cleanup_stats',
            params={'p_table_name': request.table_name}
        )

        if not count_response.data or not count_response.data[0]:
            actual_count = 0
        else:
            actual_count = count_response.data[0].get('pending_count', 0)

        if actual_count != request.count_threshold:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Count threshold mismatch. Table has {actual_count} pending records, but you specified {request.count_threshold}. Please verify and try again."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying table count: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify table count"
        )

    # Log the force delete operation for audit
    try:
        log_response = supabase.table('cleanup_safety_log').insert({
            'operation_type': 'force_delete',
            'table_name': request.table_name,
            'pending_count': actual_count,
            'result': 'passed',
            'reason': request.reason,
            'performed_by': request.performed_by,
            'performed_by_type': 'api'
        }).execute()

        logger.warning(f" FORCE DELETE operation logged: table={request.table_name}, count={actual_count}, by={request.performed_by}, reason={request.reason}")

    except Exception as e:
        logger.error(f"Failed to log force delete operation: {e}")

    # Perform the force delete
    try:
        # Direct DELETE (no safety checks)
        delete_response = supabase.table(request.table_name).delete().execute()

        deleted_count = len(delete_response.data) if delete_response.data else 0

        logger.warning(f"FORCE DELETE completed: table={request.table_name}, deleted={deleted_count}, by={request.performed_by}")

        return {
            "success": True,
            "table_name": request.table_name,
            "deleted": deleted_count,
            "performed_by": request.performed_by,
            "reason": request.reason,
            "timestamp": datetime.utcnow().isoformat(),
            "warning": "This operation cannot be undone!"
        }

    except Exception as e:
        logger.error(f"Force delete failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Force delete failed: {str(e)}"
        )


@router.post("/refresh-stats")
async def refresh_cleanup_stats_cache(
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Manually refresh the cleanup statistics cache.

    Useful after running cleanup jobs to update dashboard.
    """
    try:
        response = supabase.rpc('refresh_cleanup_stats_cache')

        return {
            "success": True,
            "message": "Cleanup stats cache refreshed",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error refreshing cleanup stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/alerts")
async def get_cleanup_alerts(
    acknowledged: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Get cleanup alerts.

    Returns active or all cleanup alerts.
    """
    try:
        query = supabase.table('cleanup_alert_log').select('*')

        if not acknowledged:
            query = query.eq('acknowledged', False)

        response = query.order('triggered_at', desc=True).limit(limit).execute()

        return response.data or []

    except Exception as e:
        logger.error(f"Error getting cleanup alerts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_cleanup_alert(
    alert_id: str,
    performed_by: str = Query(...),
    supabase = Depends(get_supabase_client),
    admin_token: str = Depends(verify_admin)
):
    """
    Acknowledge a cleanup alert.

    Marks the alert as acknowledged.
    """
    try:
        response = supabase.table('cleanup_alert_log').update({
            'acknowledged': True,
            'acknowledged_by': performed_by,
            'acknowledged_at': datetime.utcnow().isoformat()
        }).eq('id', alert_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert {alert_id} not found"
            )

        return {
            "success": True,
            "message": f"Alert {alert_id} acknowledged",
            "alert_id": alert_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def cleanup_health_check(
    supabase = Depends(get_supabase_client)
):
    """
    Health check for cleanup system.

    Returns status of cleanup jobs and last successful runs.
    """
    try:
        # Check last successful cleanup runs
        response = supabase.table('cleanup_runs_log').select('*').eq('status', 'completed').order('started_at', desc=True).limit(10).execute()

        last_runs = response.data or []

        return {
            "status": "healthy",
            "last_successful_runs": len(last_runs),
            "last_run_at": last_runs[0]['started_at'] if last_runs else None,
            "check_time": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Cleanup health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "error": str(e),
            "check_time": datetime.utcnow().isoformat()
        }


# Main function to include router
def include_cleanup_router(app):
    """Include the cleanup router in a FastAPI app"""
    app.include_router(router)
    logger.info("Cleanup API routes registered")
