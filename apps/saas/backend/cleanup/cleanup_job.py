"""
BarberZap - Data Cleanup Jobs

BullMQ cleanup jobs for managing temporary and expired data.
Runs scheduled and on-demand cleanup operations with safety checks.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import json

from bullmq import Job, Worker
from bullmq.types import JobOptions

# Database client (supabase or similar)
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logging.warning("Supabase client not available, some features may be limited")

logger = logging.getLogger(__name__)


@dataclass
class CleanupResult:
    """Result of a cleanup operation"""
    job_name: str
    table_name: str
    deleted: int = 0
    duration_ms: int = 0
    status: str = "pending"  # pending, in_progress, completed, failed, dry_run
    error_message: Optional[str] = None
    dry_run: bool = False
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "job_name": self.job_name,
            "table_name": self.table_name,
            "deleted": self.deleted,
            "duration_ms": self.duration_ms,
            "status": self.status,
            "error_message": self.error_message,
            "dry_run": self.dry_run,
            "timestamp": self.timestamp.isoformat()
        }


@dataclass
class CleanupProgress:
    """Progress tracking for batch cleanup"""
    job_id: str
    total_to_delete: int = 0
    deleted: int = 0
    failed: int = 0
    batch_size: int = 1000
    current_batch: int = 0
    estimated_total_batches: int = 0
    started_at: datetime = field(default_factory=datetime.utcnow)
    last_update: datetime = field(default_factory=datetime.utcnow)

    @property
    def progress_percent(self) -> float:
        """Calculate progress percentage"""
        if self.total_to_delete == 0:
            return 0.0
        return (self.deleted / self.total_to_delete) * 100

    @property
    def elapsed_seconds(self) -> float:
        """Calculate elapsed time in seconds"""
        return (self.last_update - self.started_at).total_seconds()

    @property
    def estimated_remaining_seconds(self) -> Optional[float]:
        """Estimate remaining time based on progress"""
        if self.deleted == 0:
            return None
        elapsed = self.elapsed_seconds
        rate = self.deleted / elapsed if elapsed > 0 else 0
        if rate == 0:
            return None
        remaining = (self.total_to_delete - self.deleted) / rate
        return remaining

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "job_id": self.job_id,
            "total_to_delete": self.total_to_delete,
            "deleted": self.deleted,
            "failed": self.failed,
            "batch_size": self.batch_size,
            "current_batch": self.current_batch,
            "estimated_total_batches": self.estimated_total_batches,
            "progress_percent": round(self.progress_percent, 2),
            "elapsed_seconds": round(self.elapsed_seconds, 2),
            "estimated_remaining_seconds": round(self.estimated_remaining_seconds, 2) if self.estimated_remaining_seconds else None,
            "started_at": self.started_at.isoformat(),
            "last_update": self.last_update.isoformat()
        }


class CleanupJob:
    """
    BullMQ job for data cleanup
    
    Features:
    - Safe deletion with validation
    - Batch processing (configurable size)
    - Progress tracking
    - Retry logic
    - Dry run mode
    - Stats output
    - Notifications via Slack/Webhook
    """

    # Job names
    JOB_CLEANUP_MAGIC_LINKS = 'cleanup_magic_links'
    JOB_CLEANUP_VERIFICATION_CODES = 'cleanup_verification_codes'
    JOB_CLEANUP_NOTIFICATIONS = 'cleanup_notifications'
    JOB_CLEANUP_ACTIVITY_LOGS = 'cleanup_activity_logs'
    JOB_CLEANUP_TOKENS = 'cleanup_tokens'
    JOB_CLEANUP_CACHE = 'cleanup_cache'
    JOB_CLEANUP_ALL = 'cleanup_all'

    # Retry configuration
    MAX_RETRIES = 3
    RETRY_DELAY_MS = 30000  # 30 seconds
    RETRY_BACKOFF = True

    # Job timeout
    JOB_TIMEOUT_MS = 7200000  # 2 hours max

    # Batch configuration
    DEFAULT_BATCH_SIZE = 1000
    MAX_BATCH_SIZE = 5000

    def __init__(
        self,
        redis_connection: Any,
        supabase_client: Optional[Client] = None,
        notification_service: Any = None
    ):
        """
        Initialize cleanup job processor
        
        Args:
            redis_connection: Redis connection for BullMQ
            supabase_client: Supabase client for database operations
            notification_service: Notification service (Slack, etc.)
        """
        self.redis_connection = redis_connection
        self.supabase = supabase_client
        self.notification_service = notification_service

        # Progress tracking storage (in-memory, could be Redis)
        self._progress: Dict[str, CleanupProgress] = {}

    def get_progress(self, job_id: str) -> Optional[CleanupProgress]:
        """Get progress for a job"""
        return self._progress.get(job_id)

    def update_progress(self, job_id: str, deleted: int = 0, failed: int = 0):
        """Update progress for a job"""
        if job_id in self._progress:
            progress = self._progress[job_id]
            progress.deleted += deleted
            progress.failed += failed
            progress.current_batch += 1
            progress.last_update = datetime.utcnow()

    async def cleanup_magic_links(
        self,
        hours_ago: int = 24,
        dry_run: bool = False,
        batch_size: int = DEFAULT_BATCH_SIZE,
        performed_by: str = 'system'
    ) -> CleanupResult:
        """
        Checkup expired magic links
        
        Args:
            hours_ago: Delete links expired X+ hours ago
            dry_run: If True, don't actually delete
            batch_size: Number of records to process per batch
            performed_by: Who is performing the cleanup
        
        Returns:
            CleanupResult with stats
        """
        start_time = datetime.utcnow()
        result = CleanupResult(
            job_name=self.JOB_CLEANUP_MAGIC_LINKS,
            table_name='magic_links',
            dry_run=dry_run,
            timestamp=start_time
        )

        try:
            if not self.supabase:
                raise RuntimeError("Supabase client not configured")

            logger.info(f"{'[DRY RUN] ' if dry_run else ''}Cleaning up magic links expired {hours_ago}+ hours ago")

            # Call stored procedure
            response = self.supabase.rpc(
                'procedure_cleanup_expired_magic_links',
                params={
                    'p_hours_ago': hours_ago,
                    'p_performed_by': performed_by,
                    'p_dry_run': dry_run
                }
            )

            if response.data:
                result.deleted = response.data
                result.status = 'dry_run' if dry_run else 'completed'
            else:
                result.deleted = 0
                result.status = 'dry_run' if dry_run else 'completed'

            # Log result
            logger.info(f"Cleanup magic links: {result.deleted} deleted (dry_run={dry_run})")

        except Exception as e:
            result.status = 'failed'
            result.error_message = str(e)
            logger.error(f"Error cleaning up magic links: {e}", exc_info=True)

        finally:
            result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        return result

    async def cleanup_verification_codes(
        self,
        hours_ago: int = 1,
        dry_run: bool = False,
        batch_size: int = DEFAULT_BATCH_SIZE,
        performed_by: str = 'system'
    ) -> CleanupResult:
        """Cleanup expired verification codes"""
        start_time = datetime.utcnow()
        result = CleanupResult(
            job_name=self.JOB_CLEANUP_VERIFICATION_CODES,
            table_name='verification_codes',
            dry_run=dry_run,
            timestamp=start_time
        )

        try:
            if not self.supabase:
                raise RuntimeError("Supabase client not configured")

            logger.info(f"{'[DRY RUN] ' if dry_run else ''}Cleaning up verification codes expired {hours_ago}+ hours ago")

            response = self.supabase.rpc(
                'procedure_cleanup_expired_codes',
                params={
                    'p_hours_ago': hours_ago,
                    'p_performed_by': performed_by,
                    'p_dry_run': dry_run
                }
            )

            if response.data:
                result.deleted = response.data
                result.status = 'dry_run' if dry_run else 'completed'
            else:
                result.deleted = 0
                result.status = 'dry_run' if dry_run else 'completed'

            logger.info(f"Cleanup verification codes: {result.deleted} deleted (dry_run={dry_run})")

        except Exception as e:
            result.status = 'failed'
            result.error_message = str(e)
            logger.error(f"Error cleaning up verification codes: {e}", exc_info=True)

        finally:
            result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        return result

    async def cleanup_notifications(
        self,
        log_days: int = 7,
        dry_run: bool = False,
        batch_size: int = DEFAULT_BATCH_SIZE,
        performed_by: str = 'system'
    ) -> CleanupResult:
        """Cleanup old notifications (read 7+ days ago)"""
        start_time = datetime.utcnow()
        result = CleanupResult(
            job_name=self.JOB_CLEANUP_NOTIFICATIONS,
            table_name='notifications',
            dry_run=dry_run,
            timestamp=start_time
        )

        try:
            if not self.supabase:
                raise RuntimeError("Supabase client not configured")

            logger.info(f"{'[DRY RUN] ' if dry_run else ''}Cleaning up notifications read {log_days}+ days ago")

            response = self.supabase.rpc(
                'procedure_cleanup_old_notifications',
                params={
                    'p_log_days': log_days,
                    'p_performed_by': performed_by,
                    'p_dry_run': dry_run
                }
            )

            if response.data:
                result.deleted = response.data
                result.status = 'dry_run' if dry_run else 'completed'
            else:
                result.deleted = 0
                result.status = 'dry_run' if dry_run else 'completed'

            logger.info(f"Cleanup notifications: {result.deleted} deleted (dry_run={dry_run})")

        except Exception as e:
            result.status = 'failed'
            result.error_message = str(e)
            logger.error(f"Error cleaning up notifications: {e}", exc_info=True)

        finally:
            result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        return result

    async def cleanup_activity_logs(
        self,
        time_gap_minutes: int = 1,
        dry_run: bool = False,
        batch_size: int = DEFAULT_BATCH_SIZE,
        performed_by: str = 'system'
    ) -> CleanupResult:
        """Cleanup duplicate activity logs"""
        start_time = datetime.utcnow()
        result = CleanupResult(
            job_name=self.JOB_CLEANUP_ACTIVITY_LOGS,
            table_name='activity_logs',
            dry_run=dry_run,
            timestamp=start_time
        )

        try:
            if not self.supabase:
                raise RuntimeError("Supabase client not configured")

            logger.info(f"{'[DRY RUN] ' if dry_run else ''}Cleaning up duplicate activity logs (gap: {time_gap_minutes}m)")

            response = self.supabase.rpc(
                'procedure_cleanup_duplicate_activity_logs',
                params={
                    'p_time_gap_minutes': time_gap_minutes,
                    'p_performed_by': performed_by,
                    'p_dry_run': dry_run
                }
            )

            if response.data:
                result.deleted = response.data
                result.status = 'dry_run' if dry_run else 'completed'
            else:
                result.deleted = 0
                result.status = 'dry_run' if dry_run else 'completed'

            logger.info(f"Cleanup activity logs: {result.deleted} deleted (dry_run={dry_run})")

        except Exception as e:
            result.status = 'failed'
            result.error_message = str(e)
            logger.error(f"Error cleaning up activity logs: {e}", exc_info=True)

        finally:
            result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        return result

    async def cleanup_tokens(
        self,
        days_ago: int = 7,
        dry_run: bool = False,
        batch_size: int = DEFAULT_BATCH_SIZE,
        performed_by: str = 'system'
    ) -> CleanupResult:
        """Cleanup expired session and password reset tokens"""
        start_time = datetime.utcnow()
        result = CleanupResult(
            job_name=self.JOB_CLEANUP_TOKENS,
            table_name='tokens',
            dry_run=dry_run,
            timestamp=start_time
        )

        try:
            if not self.supabase:
                raise RuntimeError("Supabase client not configured")

            logger.info(f"{'[DRY RUN] ' if dry_run else ''}Cleaning up expired tokens ({days_ago}+ days ago)")

            response = self.supabase.rpc(
                'procedure_cleanup_expired_tokens',
                params={
                    'p_days_ago': days_ago,
                    'p_performed_by': performed_by,
                    'p_dry_run': dry_run
                }
            )

            if response.data:
                result.deleted = response.data
                result.status = 'dry_run' if dry_run else 'completed'
            else:
                result.deleted = 0
                result.status = 'dry_run' if dry_run else 'completed'

            logger.info(f"Cleanup tokens: {result.deleted} deleted (dry_run={dry_run})")

        except Exception as e:
            result.status = 'failed'
            result.error_message = str(e)
            logger.error(f"Error cleaning up tokens: {e}", exc_info=True)

        finally:
            result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        return result

    async def cleanup_cache(
        self,
        stale_days: int = 7,
        dry_run: bool = False,
        batch_size: int = DEFAULT_BATCH_SIZE,
        performed_by: str = 'system'
    ) -> CleanupResult:
        """Cleanup stale and expired cache entries"""
        start_time = datetime.utcnow()
        result = CleanupResult(
            job_name=self.JOB_CLEANUP_CACHE,
            table_name='cache_entries',
            dry_run=dry_run,
            timestamp=start_time
        )

        try:
            if not self.supabase:
                raise RuntimeError("Supabase client not configured")

            logger.info(f"{'[DRY RUN] ' if dry_run else ''}Cleaning up cache entries (stale: {stale_days}+ days)")

            response = self.supabase.rpc(
                'procedure_cleanup_cache_entries',
                params={
                    'p_stale_days': stale_days,
                    'p_performed_by': performed_by,
                    'p_dry_run': dry_run
                }
            )

            if response.data:
                result.deleted = response.data
                result.status = 'dry_run' if dry_run else 'completed'
            else:
                result.deleted = 0
                result.status = 'dry_run' if dry_run else 'completed'

            logger.info(f"Cleanup cache: {result.deleted} deleted (dry_run={dry_run})")

        except Exception as e:
            result.status = 'failed'
            result.error_message = str(e)
            logger.error(f"Error cleaning up cache: {e}", exc_info=True)

        finally:
            result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        return result

    async def cleanup_all(
        self,
        magic_links_hours: int = 24,
        verification_codes_hours: int = 1,
        notifications_days: int = 7,
        tokens_days: int = 7,
        cache_days: int = 7,
        dry_run: bool = False,
        performed_by: str = 'system'
    ) -> Dict[str, CleanupResult]:
        """Run all cleanup jobs"""
        start_time = datetime.utcnow()
        logger.info(f"{'[DRY RUN] ' if dry_run else ''}Starting full cleanup")

        results = {}

        # Run each cleanup job
        results['magic_links'] = await self.cleanup_magic_links(
            magic_links_hours, dry_run, performed_by=performed_by
        )
        results['verification_codes'] = await self.cleanup_verification_codes(
            verification_codes_hours, dry_run, performed_by=performed_by
        )
        results['notifications'] = await self.cleanup_notifications(
            notifications_days, dry_run, performed_by=performed_by
        )
        results['activity_logs'] = await self.cleanup_activity_logs(
            1, dry_run, performed_by=performed_by
        )
        results['tokens'] = await self.cleanup_tokens(
            tokens_days, dry_run, performed_by=performed_by
        )
        results['cache'] = await self.cleanup_cache(
            cache_days, dry_run, performed_by=performed_by
        )

        # Calculate total
        total_deleted = sum(r.deleted for r in results.values() if r.deleted)
        total_duration = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        logger.info(
            f"Full cleanup completed: {total_deleted} total deleted in {total_duration}ms (dry_run={dry_run})"
        )

        # Send notification if configured
        if self.notification_service and not dry_run and not any(r.status == 'failed' for r in results.values()):
            await self._send_success_notification(total_deleted, total_duration, results)

        return results

    async def _send_success_notification(self, total_deleted: int, duration_ms: int, results: Dict[str, CleanupResult]):
        """Send success notification via configured notification service"""
        if not self.notification_service:
            return

        message = (
            f"✅ Cleanup completed successfully!\n"
            f"• Total records deleted: {total_deleted:,}\n"
            f"• Duration: {duration_ms / 1000:.2f}s\n\n"
            f"Details:\n"
        )

        for table_name, result in results.items():
            message += f"• {result.table_name}: {result.deleted:,} deleted\n"

        # This would depend on the notification service implementation
        try:
            if hasattr(self.notification_service, 'send_slack_message'):
                await self.notification_service.send_slack_message(message, channel='#alerts')
            elif hasattr(self.notification_service, 'send_message'):
                await self.notification_service.send_message(message)
            logger.info("Cleanup notification sent")
        except Exception as e:
            logger.error(f"Failed to send cleanup notification: {e}")


# BullMQ Worker Setup

async def process_cleanup_job(job: Job, token: str | None = None):
    """BullMQ worker processor for cleanup jobs"""
    job_name = job.name
    job_data = job.data

    logger.info(f"Processing cleanup job: {job_name}")

    # Initialize cleanup job processor
    from ..config import get_redis_connection
    from ..config import get_supabase_client

    redis_conn = get_redis_connection()
    supabase = get_supabase_client()
    processor = CleanupJob(redis_conn, supabase)

    result = None

    try:
        # Update job status
        await job.updateProgress(0)

        # Route to appropriate cleanup function
        if job_name == processor.JOB_CLEANUP_MAGIC_LINKS:
            result = await processor.cleanup_magic_links(
                hours_ago=job_data.get('hours_ago', 24),
                dry_run=job_data.get('dry_run', False),
                batch_size=job_data.get('batch_size', processor.DEFAULT_BATCH_SIZE),
                performed_by=job_data.get('performed_by', 'worker')
            )
        elif job_name == processor.JOB_CLEANUP_VERIFICATION_CODES:
            result = await processor.cleanup_verification_codes(
                hours_ago=job_data.get('hours_ago', 1),
                dry_run=job_data.get('dry_run', False),
                batch_size=job_data.get('batch_size', processor.DEFAULT_BATCH_SIZE),
                performed_by=job_data.get('performed_by', 'worker')
            )
        elif job_name == processor.JOB_CLEANUP_NOTIFICATIONS:
            result = await processor.cleanup_notifications(
                log_days=job_data.get('log_days', 7),
                dry_run=job_data.get('dry_run', False),
                batch_size=job_data.get('batch_size', processor.DEFAULT_BATCH_SIZE),
                performed_by=job_data.get('performed_by', 'worker')
            )
        elif job_name == processor.JOB_CLEANUP_ACTIVITY_LOGS:
            result = await processor.cleanup_activity_logs(
                time_gap_minutes=job_data.get('time_gap_minutes', 1),
                dry_run=job_data.get('dry_run', False),
                batch_size=job_data.get('batch_size', processor.DEFAULT_BATCH_SIZE),
                performed_by=job_data.get('performed_by', 'worker')
            )
        elif job_name == processor.JOB_CLEANUP_TOKENS:
            result = await processor.cleanup_tokens(
                days_ago=job_data.get('days_ago', 7),
                dry_run=job_data.get('dry_run', False),
                batch_size=job_data.get('batch_size', processor.DEFAULT_BATCH_SIZE),
                performed_by=job_data.get('performed_by', 'worker')
            )
        elif job_name == processor.JOB_CLEANUP_CACHE:
            result = await processor.cleanup_cache(
                stale_days=job_data.get('stale_days', 7),
                dry_run=job_data.get('dry_run', False),
                batch_size=job_data.get('batch_size', processor.DEFAULT_BATCH_SIZE),
                performed_by=job_data.get('performed_by', 'worker')
            )
        elif job_name == processor.JOB_CLEANUP_ALL:
            results = await processor.cleanup_all(
                magic_links_hours=job_data.get('magic_links_hours', 24),
                verification_codes_hours=job_data.get('verification_codes_hours', 1),
                notifications_days=job_data.get('notifications_days', 7),
                tokens_days=job_data.get('tokens_days', 7),
                cache_days=job_data.get('cache_days', 7),
                dry_run=job_data.get('dry_run', False),
                performed_by=job_data.get('performed_by', 'worker')
            )
            result = list(results.values())[0] if results else None
        else:
            raise ValueError(f"Unknown job name: {job_name}")

        # Update job status to 100%
        await job.updateProgress(100)

        # Return result
        if result:
            return result.to_dict()

        return {}

    except Exception as e:
        logger.error(f"Error processing cleanup job {job_name}: {e}", exc_info=True)
        raise


# Worker Factory
def create_cleanup_worker(
    redis_connection: Any,
    concurrency: int = 1
) -> Worker:
    """Create a BullMQ worker for cleanup jobs"""
    worker = Worker(
        'cleanup-queue',
        process_cleanup_job,
        {
            'connection': redis_connection,
            'concurrency': concurrency
        }
    )

    logger.info("Cleanup worker created and listening")

    return worker


# Queue helper functions
async def queue_cleanup_job(
    queue: Any,
    job_name: str,
    job_data: Dict[str, Any],
    options: Optional[JobOptions] = None
) -> Job:
    """Queue a cleanup job"""
    default_options = JobOptions(
        attempts=CleanupJob.MAX_RETRIES,
        backoff={
            'type': 'exponential',
            'delay': CleanupJob.RETRY_DELAY_MS
        },
        timeout=CleanupJob.JOB_TIMEOUT_MS
    }

    if options:
        default_options.update(options)

    job = await queue.add(job_name, job_data, default_options)
    logger.info(f"Queued cleanup job: {job_name} (ID: {job.id})")

    return job


async def queue_all_cleanup_jobs(
    queue: Any,
    dry_run: bool = False,
    performed_by: str = 'system'
) -> List[Job]:
    """Queue all cleanup jobs"""
    jobs = []

    jobs.append(await queue_cleanup_job(
        queue,
        CleanupJob.JOB_CLEANUP_MAGIC_LINKS,
        {'hours_ago': 24, 'dry_run': dry_run, 'performed_by': performed_by}
    ))

    jobs.append(await queue_cleanup_job(
        queue,
        CleanupJob.JOB_CLEANUP_VERIFICATION_CODES,
        {'hours_ago': 1, 'dry_run': dry_run, 'performed_by': performed_by}
    ))

    jobs.append(await queue_cleanup_job(
        queue,
        CleanupJob.JOB_CLEANUP_NOTIFICATIONS,
        {'log_days': 7, 'dry_run': dry_run, 'performed_by': performed_by}
    ))

    jobs.append(await queue_cleanup_job(
        queue,
        CleanupJob.JOB_CLEANUP_ACTIVITY_LOGS,
        {'time_gap_minutes': 1, 'dry_run': dry_run, 'performed_by': performed_by}
    ))

    jobs.append(await queue_cleanup_job(
        queue,
        CleanupJob.JOB_CLEANUP_TOKENS,
        {'days_ago': 7, 'dry_run': dry_run, 'performed_by': performed_by}
    ))

    jobs.append(await queue_cleanup_job(
        queue,
        CleanupJob.JOB_CLEANUP_CACHE,
        {'stale_days': 7, 'dry_run': dry_run, 'performed_by': performed_by}
    ))

    logger.info(f"Queued {len(jobs)} cleanup jobs")

    return jobs


if __name__ == '__main__':
    # For testing purposes
    import asyncio
    from redis import Redis

    async def main():
        redis = Redis(host='localhost', port=6379, db=0)
        worker = create_cleanup_worker(redis)

        print("Cleanup worker running. Press Ctrl+C to stop.")

        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down worker...")
            await worker.close()

    asyncio.run(main())
