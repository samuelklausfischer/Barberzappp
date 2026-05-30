"""
Calendar Sync Job

BullMQ job for syncing BarberZap appointments with external calendars
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import json

from bullmq import Job, Worker
from bullmq.types import JobOptions

from .google_calendar import GoogleCalendarService, OAuthCredentials
from .exceptions import (
    CalendarSyncError,
    CalendarConflictError,
    CalendarInvalidTokenError,
)

logger = logging.getLogger(__name__)


@dataclass
class SyncResult:
    """Result of a calendar sync operation"""
    client_calendar_id: str
    synced: bool
    created: int = 0
    updated: int = 0
    deleted: int = 0
    errors: int = 0
    conflicts: int = 0
    error_message: str = None
    details: List[Dict] = field(default_factory=list)
    duration_ms: int = 0


@dataclass
class SyncJobData:
    """Data required for sync job"""
    client_calendar_id: str
    client_id: str
    shop_id: str
    calendar_type: str
    calendar_id: str
    access_token: str
    refresh_token: Optional[str] = None
    sync_direction: str = 'to_external'
    sync_from_date: Optional[datetime] = None
    appointments: Optional[List[Dict]] = None


class CalendarSyncJob:
    """
    BullMQ job for calendar synchronization
    
    Features:
    - Sync appointments to/from external calendars
    - Handle conflicts
    - Retry logic with exponential backoff
    - Log sync attempts
    - Track sync status
    """
    
    # Job names
    JOB_NAME = 'sync_client_calendar'
    
    # Retry configuration
    MAX_RETRIES = 3
    RETRY_DELAY_MS = 5000
    RETRY_BACKOFF = True
    
    # Job timeout
    JOB_TIMEOUT_MS = 60000  # 1 minute
    
    # Sync status
    STATUS_SYNCED = 'synced'
    STATUS_FAILED = 'failed'
    STATUS_CONFLICT = 'conflict'
    
    def __init__(
        self,
        redis_connection: Any,
        supabase_client: Any = None,
    ):
        """
        Initialize calendar sync job processor
        
        Args:
            redis_connection: Redis connection for BullMQ
            supabase_client: Supabase client for database operations
        """
        self.redis_connection = redis_connection
        self.supabase = supabase_client
        
        # Initialize services
        self.google_service = GoogleCalendarService()
        
        # Initialize BullMQ worker
        self.worker = Worker(
            redis_connection,
            self.JOB_NAME,
            self.process,
            {
                'concurrency': 5,
                'lockDuration': 30000,
            }
        )
        
        # Handle worker events
        self.worker.on('completed', self.on_completed)
        self.worker.on('failed', self.on_failed)
    
    async def close(self):
        """Close worker and service connections"""
        await self.google_service.close()
        await self.worker.close()
    
    # =====================================================
    # JOB PROCESSING
    # =====================================================
    
    @staticmethod
    async def process(job: Job, token: str):
        """
        Process a calendar sync job
        
        Args:
            job: BullMQ job
            token: Job token
        
        This is called by BullMQ when a job is fetched
        """
        processor = CalendarSyncJob.__new__(CalendarSyncJob)
        return await processor._process_job(job)
    
    async def _process_job(self, job: Job) -> SyncResult:
        """Internal job processing logic"""
        job_data = SyncJobData(**job.data)
        start_time = datetime.utcnow()
        
        logger.info(f"Processing sync job for calendar {job_data.client_calendar_id}")
        
        result = SyncResult(
            client_calendar_id=job_data.client_calendar_id,
            synced=False,
        )
        
        try:
            # Update sync status in database
            await self._update_sync_status(
                job_data.client_calendar_id,
                'in_progress'
            )
            
            # Route to appropriate service
            if job_data.calendar_type == 'google':
                sync_results = await self._sync_google_calendar(job_data)
            elif job_data.calendar_type == 'outlook':
                # TODO: Implement Outlook sync
                sync_results = await self._sync_outlook_calendar(job_data)
            elif job_data.calendar_type == 'apple':
                # TODO: Implement Apple Calendar sync
                sync_results = await self._sync_apple_calendar(job_data)
            else:
                raise CalendarSyncError(f"Unsupported calendar type: {job_data.calendar_type}")
            
            # Update result
            result.synced = True
            result.created = sync_results.get('created', 0)
            result.updated = sync_results.get('updated', 0)
            result.deleted = sync_results.get('deleted', 0)
            result.errors = sync_results.get('errors', 0)
            result.conflicts = sync_results.get('conflicts', 0)
            result.details = sync_results.get('details', [])
            
            # Update sync status
            if result.conflicts > 0:
                await self._update_sync_status(
                    job_data.client_calendar_id,
                    self.STATUS_CONFLICT,
                    error_message=f"{result.conflicts} conflicts detected"
                )
            else:
                await self._update_sync_status(
                    job_data.client_calendar_id,
                    self.STATUS_SYNCED
                )
                
                # Update last_synced_at
                await self._update_last_synced(job_data.client_calendar_id)
            
            logger.info(f"Sync completed for calendar {job_data.client_calendar_id}: {result}")
            
        except CalendarInvalidTokenError as e:
            # Authentication error - needs reauth
            logger.error(f"Authentication error for calendar {job_data.client_calendar_id}: {e}")
            result.synced = False
            result.errors = 1
            result.error_message = str(e)
            
            # Disable calendar and mark as needing reauth
            await self._disable_calendar(job_data.client_calendar_id)
            await self._update_sync_status(
                job_data.client_calendar_id,
                self.STATUS_FAILED,
                error_message="Authentication failed. Please reconnect your calendar."
            )
            
            # Don't retry auth errors
            job.opts.attempts = job.opts.attempts or job.data.attempts or 0
            
        except CalendarConflictError as e:
            # Conflict error
            logger.warning(f"Conflict detected for calendar {job_data.client_calendar_id}: {e}")
            result.synced = False
            result.conflicts = 1
            result.error_message = str(e)
            
            await self._update_sync_status(
                job_data.client_calendar_id,
                self.STATUS_CONFLICT,
                error_message=str(e)
            )
            
        except Exception as e:
            # Other errors
            logger.error(f"Sync failed for calendar {job_data.client_calendar_id}: {e}")
            result.synced = False
            result.errors = 1
            result.error_message = str(e)
            
            await self._update_sync_status(
                job_data.client_calendar_id,
                self.STATUS_FAILED,
                error_message=str(e)
            )
            
            # Re-raise for BullMQ retry
            raise
        
        finally:
            # Calculate duration
            result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        return result
    
    # =====================================================
    # GOOGLE CALENDAR SYNC
    # =====================================================
    
    async def _sync_google_calendar(self, job_data: SyncJobData) -> Dict[str, Any]:
        """Sync with Google Calendar"""
        # Build OAuth credentials
        credentials = OAuthCredentials(
            client_id=self.google_service.client_id,
            client_secret=self.google_service.client_secret,
            redirect_uri=self.google_service.redirect_uri,
            access_token=job_data.access_token,
            refresh_token=job_data.refresh_token,
        )
        
        # Sync appointments
        results = await self.google_service.sync_appointments(
            client_id=job_data.client_id,
            calendar_id=job_data.calendar_id or 'primary',
            appointments=job_data.appointments,
            credentials=credentials,
            since_date=job_data.sync_from_date,
        )
        
        return results
    
    # =====================================================
    # OUTLOOK CALENDAR SYNC (TODO)
    # =====================================================
    
    async def _sync_outlook_calendar(self, job_data: SyncJobData) -> Dict[str, Any]:
        """Sync with Microsoft Outlook Calendar"""
        # TODO: Implement Outlook integration
        logger.warning("Outlook calendar sync not yet implemented")
        return {
            'created': 0,
            'updated': 0,
            'deleted': 0,
            'errors': 1,
            'conflicts': 0,
            'details': [{
                'action': 'not_implemented',
                'error': 'Outlook calendar sync not yet implemented'
            }]
        }
    
    # =====================================================
    # APPLE CALENDAR SYNC (TODO)
    # =====================================================
    
    async def _sync_apple_calendar(self, job_data: SyncJobData) -> Dict[str, Any]:
        """Sync with Apple Calendar"""
        # TODO: Implement Apple Calendar integration
        logger.warning("Apple calendar sync not yet implemented")
        return {
            'created': 0,
            'updated': 0,
            'deleted': 0,
            'errors': 1,
            'conflicts': 0,
            'details': [{
                'action': 'not_implemented',
                'error': 'Apple calendar sync not yet implemented'
            }]
        }
    
    # =====================================================
    # DATABASE OPERATIONS
    # =====================================================
    
    async def _update_sync_status(
        self,
        client_calendar_id: str,
        status: str,
        error_message: str = None
    ):
        """Update sync status in database"""
        if not self.supabase:
            return
        
        try:
            data = {
                'last_sync_status': status,
            }
            
            if error_message:
                data['last_sync_error'] = error_message
            
            await self.supabase.table('client_calendars').update(data).eq('id', client_calendar_id).execute()
        except Exception as e:
            logger.error(f"Failed to update sync status: {e}")
    
    async def _update_last_synced(self, client_calendar_id: str):
        """Update last_synced_at timestamp"""
        if not self.supabase:
            return
        
        try:
            await self.supabase.table('client_calendars').update({
                'last_synced_at': datetime.utcnow().isoformat()
            }).eq('id', client_calendar_id).execute()
        except Exception as e:
            logger.error(f"Failed to update last_synced_at: {e}")
    
    async def _disable_calendar(self, client_calendar_id: str):
        """Disable calendar after auth error"""
        if not self.supabase:
            return
        
        try:
            await self.supabase.table('client_calendars').update({
                'enabled': False,
            }).eq('id', client_calendar_id).execute()
            
            logger.info(f"Disabled calendar {client_calendar_id} due to auth error")
        except Exception as e:
            logger.error(f"Failed to disable calendar: {e}")
    
    # =====================================================
    # EVENT HANDLERS
    # =====================================================
    
    async def on_completed(self, job: Job, result: SyncResult):
        """Handle job completion"""
        logger.info(f"Job {job.id} completed: {result}")
    
    async def on_failed(self, job: Job, error: Exception):
        """Handle job failure"""
        logger.error(f"Job {job.id} failed: {error}")
    
    # =====================================================
    # JOB QUEUEING
    # =====================================================
    
    @staticmethod
    async def queue_sync_job(
        queue: Any,
        job_data: SyncJobData,
        options: JobOptions = None,
    ) -> Job:
        """
        Queue a calendar sync job
        
        Args:
            queue: BullMQ queue
            job_data: Sync job data
            options: Job options
            
        Returns:
            Created job
        """
        default_options = {
            'attempts': CalendarSyncJob.MAX_RETRIES,
            'backoff': {
                'type': 'exponential',
                'delay': CalendarSyncJob.RETRY_DELAY_MS,
            },
            'timeout': CalendarSyncJob.JOB_TIMEOUT_MS,
        }
        
        if options:
            default_options.update(options)
        
        job = await queue.add(
            CalendarSyncJob.JOB_NAME,
            job_data.__dict__,
            default_options
        )
        
        logger.info(f"Queued sync job {job.id} for calendar {job_data.client_calendar_id}")
        return job


# =====================================================
# HELPER FUNCTIONS
# =====================================================

async def sync_client_calendar(
    queue: Any,
    client_calendar_id: str,
    client_id: str,
    shop_id: str,
    calendar_type: str,
    calendar_id: str,
    access_token: str,
    refresh_token: str = None,
    sync_direction: str = 'to_external',
    appointments: List[Dict] = None,
    delay_ms: int = 0,
) -> Job:
    """
    Helper function to queue a calendar sync job
    
    Args:
        queue: BullMQ queue
        client_calendar_id: Client calendar ID
        client_id: Client ID
        shop_id: Shop ID
        calendar_type: Type of calendar ('google', 'outlook', 'apple')
        calendar_id: External calendar ID
        access_token: OAuth access token
        refresh_token: OAuth refresh token
        sync_direction: Sync direction ('to_external', 'from_external')
        appointments: List of appointments to sync
        delay_ms: Delay before starting job
        
    Returns:
        Created job
    """
    job_data = SyncJobData(
        client_calendar_id=client_calendar_id,
        client_id=client_id,
        shop_id=shop_id,
        calendar_type=calendar_type,
        calendar_id=calendar_id,
        access_token=access_token,
        refresh_token=refresh_token,
        sync_direction=sync_direction,
        appointments=appointments,
    )
    
    options = {
        'delay': delay_ms,
    }
    
    return await CalendarSyncJob.queue_sync_job(queue, job_data, options)


def create_sync_job_data(
    client_calendar_id: str,
    client_id: str,
    shop_id: str,
    calendar_type: str,
    calendar_id: str,
    access_token: str,
    **kwargs
) -> SyncJobData:
    """
    Factory function to create sync job data
    
    Returns:
        SyncJobData instance
    """
    return SyncJobData(
        client_calendar_id=client_calendar_id,
        client_id=client_id,
        shop_id=shop_id,
        calendar_type=calendar_type,
        calendar_id=calendar_id,
        access_token=access_token,
        **kwargs
    )
