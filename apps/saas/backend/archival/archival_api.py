"""
BarberZap - Archival API Module

FastAPI endpoints for managing data archival operations.

Endpoints:
- GET /api/archival/stats - Get table sizes and archival status
- POST /api/archival/archive/clients - Archive inactive clients
- POST /api/archival/archive/appointments - Archive old appointments
- POST /api/archival/archive/messages - Archive old messages
- POST /api/archival/archive/activity-logs - Archive old logs
- GET /api/archival/archived-clients - Search archived clients
- GET /api/archival/archived-appointments - Search archived appointments
- POST /api/archival/restore - Restore records from archive
- GET /api/archival/operations - List archival operations
"""

import os
import logging
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Optional, Any
from enum import Enum

import asyncpg
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field, validator
from dataclasses import dataclass

from ..config.redis_config import RedisConfig
from ..config.supabase_config import SupabaseConfig
from ..error.exceptions import (
    BadRequestError,
    NotFoundError,
    ValidationError
)
from .archival_job import (
    ArchivalJob,
    ArchivalType,
    queue_clients_archive,
    queue_appointments_archive,
    queue_messages_archive,
    queue_activity_logs_archive,
    queue_all_archive,
)

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class ArchivalStatus(str, Enum):
    """Status de operação de arquivamento"""
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


class ArchivedTableType(str, Enum):
    """Tipos de tabelas arquivadas"""
    CLIENTS = 'clients'
    APPOINTMENTS = 'appointments'
    MESSAGES = 'messages'
    ACTIVITY_LOGS = 'activity_logs'


# ==================== Pydantic Models ====================

class ArchivalStatsResponse(BaseModel):
    """Estatísticas gerais de arquivamento"""
    table_name: str
    total_rows: int
    table_size: str
    index_size: str
    total_size: str
    percentage_archived: Optional[float] = None

    class Config:
        from_attributes = True


class ArchivalStatusResponse(BaseModel):
    """Status atual de arquivamento por tabela"""
    table_name: str
    total_archived: int
    first_archived: Optional[str]
    last_archived: Optional[str]
    shops_affected: int
    total_spent: Optional[float] = None
    total_revenue: Optional[float] = None

    class Config:
        from_attributes = True


class ArchiveRequestBase(BaseModel):
    """Base model para requisições de arquivamento"""
    shop_id: Optional[str] = None
    older_than_months: int = Field(default=12, ge=1, le=120)
    batch_size: int = Field(default=1000, ge=100, le=10000)
    dry_run: bool = Field(default=False)


class ArchiveClientRequest(ArchiveRequestBase):
    """Request para arquivar clientes"""
    older_than_months: int = Field(default=24, ge=1, le=120)


class ArchiveAppointmentRequest(ArchiveRequestBase):
    """Request para arquivar agendamentos"""
    older_than_months: int = Field(default=12, ge=1, le=120)


class ArchiveMessageRequest(ArchiveRequestBase):
    """Request para arquivar mensagens"""
    older_than_months: int = Field(default=18, ge=1, le=120)


class ArchiveActivityResult(ArchiveRequestBase):
    """Request para arquivar logs"""
    older_than_months: int = Field(default=6, ge=1, le=120)


class ArchiveResponse(BaseModel):
    """Resposta de operação de arquivamento"""
    success: bool
    message: str
    job_id: Optional[str] = None
    estimated_records_to_archive: Optional[int] = 0
    job_details: Optional[Dict] = None


class ArchivedClient(BaseModel):
    """Cliente arquivado"""
    id: str
    shop_id: str
    name: str
    phone_number: str
    email: Optional[str]
    archived_at: str
    last_visit_at: Optional[str]
    total_visits: int
    total_spent: float
    archive_reason: str

    class Config:
        from_attributes = True


class ArchivedAppointment(BaseModel):
    """Agendamento arquivado"""
    id: str
    shop_id: str
    client_name: str
    employee_name: str
    service_name: str
    scheduled_at: str
    status: str
    price: float
    archived_at: str
    archive_reason: str

    class Config:
        from_attributes = True


class ArchivedClientsResponse(BaseModel):
    """Resposta de pesquisa de clientes arquivados"""
    count: int
    page: int
    page_size: int
    total_pages: int
    clients: List[ArchivedClient]


class ArchivedAppointmentsResponse(BaseModel):
    """Resposta de pesquisa de agendamentos arquivados"""
    count: int
    page: int
    page_size: int
    total_pages: int
    appointments: List[ArchivedAppointment]


class RestoreRequest(BaseModel):
    """Request para restauração de emergência"""
    record_type: ArchivedTableType
    record_id: str
    reason: Optional[str] = None


class RestoreResponse(BaseModel):
    """Resposta de restauração"""
    success: bool
    message: str
    record_id: str
    shop_id: Optional[str] = None


class ArchivalOperation(BaseModel):
    """Operação de arquivamento"""
    id: str
    operation_type: str
    table_name: str
    criteria: Dict
    records_affected: int
    started_at: str
    completed_at: Optional[str]
    duration_seconds: Optional[int]
    performed_by: str
    status: str
    error_message: Optional[str]
    dry_run: bool

    class Config:
        from_attributes = True


class OperationsResponse(BaseModel):
    """Resposta de lista de operações"""
    count: int
    page: int
    page_size: int
    operations: List[ArchivalOperation]


# ==================== API Router ====================

router = APIRouter(prefix='/api/archival', tags=['archival'])


# ==================== Dependencies ====================

async def get_supabase_client():
    """Get Supabase client dependency"""
    return SupabaseConfig.get_client()


async def require_superadmin():
    """Require superadmin role for archival operations"""
    # TODO: Implement proper auth check
    # For now, we rely on Supabase RLS policies
    pass


# ==================== Stats Endpoints ====================

@router.get('/stats', response_model=List[ArchivalStatsResponse])
async def get_archival_stats(
    shop_id: Optional[str] = None,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Get current table sizes and archival statistics

    Returns:
        List of table sizes with archival percentage
    """
    try:
        # Call PostgreSQL function to get table sizes
        result = (supabase.rpc('get_table_size_stats')
                 .execute())

        if not result.data:
            return []

        # Parse results
        stats = [
            ArchivalStatsResponse(
                table_name=row['table_name'],
                total_rows=row['total_rows'],
                table_size=row['table_size'],
                index_size=row['index_size'],
                total_size=row['total_size']
            )
            for row in result.data
        ]

        return stats

    except Exception as e:
        logger.error(f"Error getting archival stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/status', response_model=List[ArchivalStatusResponse])
async def get_archival_status(
    shop_id: Optional[str] = None,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Get archival status (active vs archived records)

    Returns:
        List of archival status by table type
    """
    try:
        # Query archival statistics view
        query = supabase.table('archival_statistics').select('*')

        if shop_id:
            # Filter by specific shops if needed
            query = query.filter('table_name', 'eq', shop_id)

        result = query.execute()

        if not result.data:
            return []

        status = [
            ArchivalStatusResponse(**row)
            for row in result.data
        ]

        return status

    except Exception as e:
        logger.error(f"Error getting archival status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Archive Endpoints ====================

@router.post('/archive/clients', response_model=ArchiveResponse)
async def archive_clients(
    request: ArchiveClientRequest,
    background_tasks: BackgroundTasks,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Archive inactive clients (no appointments for 24+ months)

    Args:
        request: Archive request parameters

    Returns:
        Job ID and estimated record count
    """
    try:
        # Get Redis connection and Queue
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        # Queue the archival job
        job = await queue_clients_archive(
            queue=queue,
            shop_id=request.shop_id,
            months=request.older_than_months,
            dry_run=request.dry_run,
            performed_by='api_user'
        )

        return ArchiveResponse(
            success=True,
            message=f"Archival job queued for clients inactive for {request.older_than_months}+ months",
            job_id=job.id,
            job_details={
                'archival_type': 'clients',
                'shop_id': request.shop_id,
                'older_than_months': request.older_than_months,
                'dry_run': request.dry_run
            }
        )

    except Exception as e:
        logger.error(f"Error queuing clients archival: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/archive/appointments', response_model=ArchiveResponse)
async def archive_appointments(
    request: ArchiveAppointmentRequest,
    background_tasks: BackgroundTasks,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Archive completed/cancelled appointments (12+ months old)

    Args:
        request: Archive request parameters

    Returns:
        Job ID and estimated record count
    """
    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        job = await queue_appointments_archive(
            queue=queue,
            shop_id=request.shop_id,
            months=request.older_than_months,
            dry_run=request.dry_run,
            performed_by='api_user'
        )

        return ArchiveResponse(
            success=True,
            message=f"Archival job queued for appointments older than {request.older_than_months} months",
            job_id=job.id,
            job_details={
                'archival_type': 'appointments',
                'shop_id': request.shop_id,
                'older_than_months': request.older_than_months,
                'dry_run': request.dry_run
            }
        )

    except Exception as e:
        logger.error(f"Error queuing appointments archival: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/archive/messages', response_model=ArchiveResponse)
async def archive_messages(
    request: ArchiveMessageRequest,
    background_tasks: BackgroundTasks,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Archive old messages (18+ months old)

    Args:
        request: Archive request parameters

    Returns:
        Job ID and estimated record count
    """
    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        job = await queue_messages_archive(
            queue=queue,
            shop_id=request.shop_id,
            months=request.older_than_months,
            dry_run=request.dry_run,
            performed_by='api_user'
        )

        return ArchiveResponse(
            success=True,
            message=f"Archival job queued for messages older than {request.older_than_months} months",
            job_id=job.id,
            job_details={
                'archival_type': 'messages',
                'shop_id': request.shop_id,
                'older_than_months': request.older_than_months,
                'dry_run': request.dry_run
            }
        )

    except Exception as e:
        logger.error(f"Error queuing messages archival: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/archive/activity-logs', response_model=ArchiveResponse)
async def archive_activity_logs(
    request: ArchiveActivityResult,
    background_tasks: BackgroundTasks,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Archive old activity logs (6+ months old)

    Args:
        request: Archive request parameters

    Returns:
        Job ID and estimated record count
    """
    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        job = await queue_activity_logs_archive(
            queue=queue,
            shop_id=request.shop_id,
            months=request.older_than_months,
            dry_run=request.dry_run,
            performed_by='api_user'
        )

        return ArchiveResponse(
            success=True,
            message=f"Archival job queued for activity logs older than {request.older_than_months} months",
            job_id=job.id,
            job_details={
                'archival_type': 'activity_logs',
                'shop_id': request.shop_id,
                'older_than_months': request.older_than_months,
                'dry_run': request.dry_run
            }
        )

    except Exception as e:
        logger.error(f"Error queuing activity logs archival: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/archive/all', response_model=ArchiveResponse)
async def archive_all(
    shop_id: Optional[str] = None,
    dry_run: bool = False,
    background_tasks: BackgroundTasks,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Archive all eligible data (clients, appointments, messages, logs)

    Args:
        shop_id: Optional shop ID filter
        dry_run: Simulate without changes

    Returns:
        Job ID for the archival job
    """
    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        job = await queue_all_archive(
            queue=queue,
            shop_id=shop_id,
            dry_run=dry_run,
            performed_by='api_user'
        )

        return ArchiveResponse(
            success=True,
            message="Archival job queued for all eligible data",
            job_id=job.id,
            job_details={
                'archival_type': 'all',
                'shop_id': shop_id,
                'dry_run': dry_run
            }
        )

    except Exception as e:
        logger.error(f"Error queuing all archival: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Search Archived Data Endpoints ====================

@router.get('/archived-clients', response_model=ArchivedClientsResponse)
async def search_archived_clients(
    shop_id: Optional[str] = None,
    name: Optional[str] = None,
    phone_number: Optional[str] = None,
    archived_after: Optional[datetime] = None,
    archived_before: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Search archived clients

    Args:
        shop_id: Filter by shop ID
        name: Filter by name (partial match)
        phone_number: Filter by phone number (partial match)
        archived_after: Filter archived after this date
        archived_before: Filter archived before this date
        page: Page number (1-indexed)
        page_size: Number of results per page

    Returns:
        Paginated list of archived clients
    """
    try:
        # Build query
        query = supabase.table('clients_archived').select('*', count='exact')

        if shop_id:
            query = query.eq('shop_id', shop_id)
        if name:
            query = query.ilike('name', f'%{name}%')
        if phone_number:
            query = query.ilike('phone_number', f'%{phone_number}%')
        if archived_after:
            query = query.gte('archived_at', archived_after.isoformat())
        if archived_before:
            query = query.lte('archived_at', archived_before.isoformat())

        # Calculate offset
        offset = (page - 1) * page_size

        # Execute query with pagination
        result = (
            query
            .order('archived_at', desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )

        total_count = result.count or 0
        total_pages = (total_count + page_size - 1) // page_size

        clients = [ArchivedClient(**row) for row in result.data]

        return ArchivedClientsResponse(
            count=len(clients),
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            clients=clients
        )

    except Exception as e:
        logger.error(f"Error searching archived clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/archived-appointments', response_model=ArchivedAppointmentsResponse)
async def search_archived_appointments(
    shop_id: Optional[str] = None,
    client_name: Optional[str] = None,
    status: Optional[str] = None,
    scheduled_after: Optional[datetime] = None,
    scheduled_before: Optional[datetime] = None,
    archived_after: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Search archived appointments

    Args:
        shop_id: Filter by shop ID
        client_name: Filter by client name (partial match)
        status: Filter by status
        scheduled_after: Filter appointments scheduled after this date
        scheduled_before: Filter appointments scheduled before this date
        archived_after: Filter archived after this date
        page: Page number (1-indexed)
        page_size: Number of results per page

    Returns:
        Paginated list of archived appointments
    """
    try:
        # Build query
        query = supabase.table('appointments_archived').select('*', count='exact')

        if shop_id:
            query = query.eq('shop_id', shop_id)
        if client_name:
            query = query.ilike('client_name', f'%{client_name}%')
        if status:
            query = query.eq('status', status)
        if scheduled_after:
            query = query.gte('scheduled_at', scheduled_after.isoformat())
        if scheduled_before:
            query = query.lte('scheduled_at', scheduled_before.isoformat())
        if archived_after:
            query = query.gte('archived_at', archived_after.isoformat())

        # Calculate offset
        offset = (page - 1) * page_size

        # Execute query with pagination
        result = (
            query
            .order('scheduled_at', desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )

        total_count = result.count or 0
        total_pages = (total_count + page_size - 1) // page_size

        appointments = [ArchivedAppointment(**row) for row in result.data]

        return ArchivedAppointmentsResponse(
            count=len(appointments),
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            appointments=appointments
        )

    except Exception as e:
        logger.error(f"Error searching archived appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Restore Endpoint ====================

@router.post('/restore', response_model=RestoreResponse)
async def restore_record(
    request: RestoreRequest,
    background_tasks: BackgroundTasks,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Restore a record from archived tables (emergency use only)

    Args:
        request: Restore request with record type and ID

    Returns:
        Restore operation result
    """
    # Currently only appointments are supported for restore
    if request.record_type != ArchivedTableType.APPOINTMENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Restore for {request.record_type} is not yet supported. Only appointments can be restored."
        )

    try:
        # Call restore procedure
        result = (supabase.rpc('procedure_restore_appointment', {
            'p_appointment_id': request.record_id,
            'p_performed_by': 'api_user'
        }).execute())

        if result.data:
            data = result.data
            return RestoreResponse(
                success=data.get('success', False),
                message=data.get('message', ''),
                record_id=request.record_id,
                shop_id=data.get('shop_id')
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to restore record"
            )

    except Exception as e:
        logger.error(f"Error restoring record: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Operations Monitoring Endpoints ====================

@router.get('/operations', response_model=OperationsResponse)
async def list_archival_operations(
    table_name: Optional[str] = None,
    status: Optional[ArchivalStatus] = None,
    shop_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    List archival operations with filters

    Args:
        table_name: Filter by table name
        status: Filter by operation status
        shop_id: Filter by shop ID (from criteria)
        start_date: Filter operations started after this date
        end_date: Filter operations started before this date
        page: Page number (1-indexed)
        page_size: Number of results per page

    Returns:
        Paginated list of archival operations
    """
    try:
        # Build query
        query = supabase.table('archival_operations_log').select('*', count='exact')

        if table_name:
            query = query.eq('table_name', table_name)
        if status:
            query = query.eq('status', status.value)
        if start_date:
            query = query.gte('started_at', start_date.isoformat())
        if end_date:
            query = query.lte('started_at', end_date.isoformat())
        if shop_id:
            # Filter by shop_id in criteria JSONB
            query = query.contains('criteria', {'shop_id': shop_id})

        # Calculate offset
        offset = (page - 1) * page_size

        # Execute query
        result = (
            query
            .order('started_at', desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )

        total_count = result.count or 0
        total_pages = (total_count + page_size - 1) // page_size

        operations = [ArchivalOperation(**row) for row in result.data]

        return OperationsResponse(
            count=len(operations),
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            operations=operations
        )

    except Exception as e:
        logger.error(f"Error listing archival operations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/operations/{operation_id}', response_model=ArchivalOperation)
async def get_archival_operation(
    operation_id: str,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Get details of a specific archival operation

    Args:
        operation_id: ID of the archival operation

    Returns:
        Archival operation details
    """
    try:
        result = (supabase.table('archival_operations_log')
                 .select('*')
                 .eq('id', operation_id)
                 .single()
                 .execute())

        if not result.data:
            raise HTTPException(status_code=404, detail="Operation not found")

        return ArchivalOperation(**result.data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting archival operation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Statistics/Summary Endpoints ====================

@router.get('/summary')
async def get_archival_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    table_name: Optional[str] = None,
    supabase = Depends(get_supabase_client),
    _ = Depends(require_superadmin)
):
    """
    Get aggregated archival summary statistics

    Args:
        start_date: Filter start date
        end_date: Filter end date
        table_name: Filter by table name

    Returns:
        Aggregated statistics
    """
    try:
        result = (supabase.rpc('get_archival_statistics', {
            'p_start_date': start_date,
            'p_end_date': end_date,
            'p_table_name': table_name
        }).execute())

        return {
            'success': True,
            'data': result.data
        }

    except Exception as e:
        logger.error(f"Error getting archival summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
