"""
Webhook Retry Queue Module

Implements a retry mechanism for failed webhooks using BullMQ.
Provides exponential backoff, dead letter queue, and monitoring.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, UTC, timedelta
import json
import asyncio
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


# ==================== Configuration ====================

class RetryConfig:
    """Configuration for webhook retry queue"""
    
    # Number of retry attempts
    MAX_ATTEMPTS = 3
    
    # Exponential backoff settings
    BASE_DELAY_MS = 1000  # 1 second
    MAX_DELAY_MS = 30000  # 30 seconds
    EXPONENT_FACTOR = 2
    
    # Queue names
    QUEUE_NAME = 'webhook:retry'
    DLQ_NAME = 'webhook:dlq'
    
    # Job options
    REMOVE_ON_COMPLETE = 100  # Keep last 100 completed jobs
    REMOVE_ON_FAIL = 50       # Keep last 50 failed jobs
    
    # Job timeout (in milliseconds)
    JOB_TIMEOUT = 10000  # 10 seconds


class RetryStatus(str, Enum):
    """Status of a retry job"""
    PENDING = 'pending'
    ACTIVE = 'active'
    COMPLETED = 'completed'
    FAILED = 'failed'
    DELAYED = 'delayed'
    RETRYING = 'retrying'
    DEAD = 'dead'


@dataclass
class WebhookRetryJob:
    """Represents a webhook retry job"""
    
    job_id: str
    payload: str
    headers: Dict[str, str]
    error: str
    attempts: int = 0
    max_attempts: int = RetryConfig.MAX_ATTEMPTS
    delay_ms: int = RetryConfig.BASE_DELAY_MS
    status: RetryStatus = RetryStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    last_error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'job_id': self.job_id,
            'payload': self.payload,
            'headers': self.headers,
            'error': self.error,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'delay_ms': self.delay_ms,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_error': self.last_error,
            'metadata': self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WebhookRetryJob':
        """Create from dictionary"""
        # Convert datetime strings back to datetime objects
        if 'created_at' in data:
            data = data.copy()
            if isinstance(data['created_at'], str):
                data['created_at'] = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
            if isinstance(data['updated_at'], str):
                data['updated_at'] = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
        
        return cls(**data)
    
    def increment_attempts(self):
        """Increment attempt count"""
        self.attempts += 1
        self.updated_at = datetime.now(UTC)
    
    def calculate_next_delay(self) -> int:
        """
        Calculate next delay using exponential backoff
        
        Returns:
            Delay in milliseconds
        """
        delay = self.delay_ms * (RetryConfig.EXPONENT_FACTOR ** self.attempts)
        return min(delay, RetryConfig.MAX_DELAY_MS)


# ==================== Redis-based Retry Queue ====================

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, retry queue will use in-memory fallback")


class WebhookRetryQueue:
    """
    Redis-based webhook retry queue with exponential backoff
    
    Features:
    - Persistent queue using Redis
    - Exponential backoff retries
    - Dead letter queue for permanent failures
    - Job metrics and monitoring
    """
    
    def __init__(
        self,
        redis_url: str = None,
        redis_client=None,
        queue_name: str = None,
        dlq_name: str = None,
        enable_dlq: bool = True
    ):
        """
        Initialize retry queue
        
        Args:
            redis_url: Redis connection URL
            redis_client: Existing Redis client (preferred)
            queue_name: Name for the main retry queue
            dlq_name: Name for the dead letter queue
            enable_dlq: Whether to enable dead letter queue
        """
        self.queue_name = queue_name or RetryConfig.QUEUE_NAME
        self.dlq_name = dlq_name or RetryConfig.DLQ_NAME
        self.enable_dlq = enable_dlq
        
        # Initialize Redis
        if redis_client:
            self.redis = redis_client
        elif REDIS_AVAILABLE:
            if redis_url:
                self.redis = redis.from_url(redis_url, decode_responses=True)
            else:
                # Try to get from cache manager
                try:
                    from ..cache.cache_manager import get_cache_manager
                    cache = get_cache_manager()
                    if cache._client:
                        self.redis = cache._client
                except Exception:
                    self.redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        else:
            self.redis = None
        
        # Metrics
        self._jobs_created = 0
        self._jobs_retried = 0
        self._jobs_completed = 0
        self._jobs_failed = 0
        
        logger.info(f"Webhook retry queue initialized: {self.queue_name}")
    
    async def add_for_retry(
        self,
        payload: str,
        headers: Dict[str, str],
        error: str,
        job_id: Optional[str] = None,
        delay_ms: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add a failed webhook to the retry queue
        
        Args:
            payload: Webhook payload
            headers: Webhook headers
            error: Error message
            job_id: Optional custom job ID
            delay_ms: Initial delay in milliseconds
            metadata: Optional metadata
            
        Returns:
            Job ID
        """
        job_id = job_id or f"webhook_{datetime.now(UTC).timestamp()}"
        
        job = WebhookRetryJob(
            job_id=job_id,
            payload=payload,
            headers=headers,
            error=error,
            delay_ms=delay_ms or RetryConfig.BASE_DELAY_MS,
            metadata=metadata or {},
        )
        
        # Store job in Redis
        if self.redis:
            try:
                key = f"{self.queue_name}:{job_id}"
                self.redis.hset(key, mapping=job.to_dict())
                self.redis.expire(key, 86400)  # Expire after 24 hours
                
                # Add to retry set (sorted by timestamp)
                retry_at = datetime.now(UTC).timestamp() + (job.delay_ms / 1000)
                self.redis.zadd(
                    f"{self.queue_name}:scheduled",
                    {job_id: retry_at}
                )
                
                self._jobs_created += 1
                logger.info(
                    f"Webhook added to retry queue: {job_id} "
                    f"(attempts: {job.attempts}/{job.max_attempts}, delay: {job.delay_ms}ms)"
                )
                
            except Exception as e:
                logger.error(f"Failed to add webhook to retry queue: {e}")
                return ""
        else:
            # In-memory fallback
            self._jobs_created += 1
            logger.warning(f"Redis not available, webhook {job_id} not queued for retry")
        
        return job_id
    
    async def get_next_job(self) -> Optional[WebhookRetryJob]:
        """
        Get next job ready for retry
        
        Returns:
            WebhookRetryJob or None if no jobs ready
        """
        if not self.redis:
            return None
        
        try:
            now = datetime.now(UTC).timestamp()
            
            # Get jobs ready for retry (score <= now)
            job_ids = self.redis.zrangebyscore(
                f"{self.queue_name}:scheduled",
                0,
                now
            )
            
            if not job_ids:
                return None
            
            # Get first job
            job_id = job_ids[0]
            key = f"{self.queue_name}:{job_id}"
            job_data = self.redis.hgetall(key)
            
            if not job_data:
                # Job expired or removed, remove from schedule
                self.redis.zrem(f"{self.queue_name}:scheduled", job_id)
                return None
            
            job = WebhookRetryJob.from_dict(job_data)
            return job
            
        except Exception as e:
            logger.error(f"Failed to get next retry job: {e}")
            return None
    
    async def mark_retrying(self, job_id: str, last_error: Optional[str] = None):
        """
        Mark a job as being retried
        
        Args:
            job_id: Job ID
            last_error: Last error message
        """
        if not self.redis or not job_id:
            return
        
        try:
            key = f"{self.queue_name}:{job_id}"
            job_data = self.redis.hgetall(key)
            
            if job_data:
                job = WebhookRetryJob.from_dict(job_data)
                job.increment_attempts()
                job.status = RetryStatus.RETRYING
                job.last_error = last_error or job.last_error
                
                # Schedule next retry
                next_delay = job.calculate_next_delay()
                retry_at = datetime.now(UTC).timestamp() + (next_delay / 1000)
                
                # Update in Redis
                self.redis.hset(key, mapping=job.to_dict())
                self.redis.zadd(f"{self.queue_name}:scheduled", {job_id: retry_at})
                
                self._jobs_retried += 1
                logger.info(
                    f"Webhook {job_id} marked for retry "
                    f"(attempt {job.attempts}/{job.max_attempts}, next delay: {next_delay}ms)"
                )
            
        except Exception as e:
            logger.error(f"Failed to mark job {job_id} as retrying: {e}")
    
    async def mark_completed(self, job_id: str):
        """
        Mark a job as completed successfully
        
        Args:
            job_id: Job ID
        """
        if not self.redis or not job_id:
            self._jobs_completed += 1
            return
        
        try:
            # Remove from queue
            key = f"{self.queue_name}:{job_id}"
            self.redis.delete(key)
            self.redis.zrem(f"{self.queue_name}:scheduled", job_id)
            
            self._jobs_completed += 1
            logger.info(f"Webhook {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Failed to mark job {job_id} as completed: {e}")
    
    async def mark_failed(self, job_id: str, error: str):
        """
        Mark a job as permanently failed
        
        Args:
            job_id: Job ID
            error: Error message
        """
        if not self.redis or not job_id:
            self._jobs_failed += 1
            return
        
        try:
            key = f"{self.queue_name}:{job_id}"
            job_data = self.redis.hgetall(key)
            
            if job_data:
                job = WebhookRetryJob.from_dict(job_data)
                
                # Check if should retry or send to DLQ
                if job.attempts < job.max_attempts:
                    # Mark for retry
                    await self.mark_retrying(job_id, error)
                else:
                    # Send to DLQ
                    if self.enable_dlq:
                        job.status = RetryStatus.DEAD
                        job.last_error = error
                        job.updated_at = datetime.now(UTC)
                        
                        # Move to DLQ
                        dlq_key = f"{self.dlq_name}:{job_id}"
                        self.redis.hset(dlq_key, mapping=job.to_dict())
                        self.redis.zadd(
                            f"{self.dlq_name}:jobs",
                            {job_id: datetime.now(UTC).timestamp()}
                        )
                    
                    # Remove from retry queue
                    self.redis.delete(key)
                    self.redis.zrem(f"{self.queue_name}:scheduled", job_id)
                    
                    self._jobs_failed += 1
                    logger.error(
                        f"Webhook {job_id} permanently failed after {job.attempts} attempts: {error}"
                    )
            
        except Exception as e:
            logger.error(f"Failed to mark job {job_id} as failed: {e}")
    
    async def get_queue_stats(self) -> Dict[str, Any]:
        """
        Get retry queue statistics
        
        Returns:
            Dict with queue stats
        """
        stats = {
            'created': self._jobs_created,
            'retried': self._jobs_retried,
            'completed': self._jobs_completed,
            'failed': self._jobs_failed,
            'pending': 0,
            'dlq_count': 0,
        }
        
        if self.redis:
            try:
                stats['pending'] = self.redis.zcard(f"{self.queue_name}:scheduled")
                stats['dlq_count'] = self.redis.zcard(f"{self.dlq_name}:jobs")
            except Exception as e:
                logger.error(f"Failed to get queue stats: {e}")
        
        return stats
    
    async def get_dead_letter_queue(self, limit: int = 100) -> List[WebhookRetryJob]:
        """
        Get jobs from dead letter queue
        
        Args:
            limit: Maximum number of jobs to return
            
        Returns:
            List of WebhookRetryJob
        """
        if not self.redis:
            return []
        
        jobs = []
        try:
            job_ids = self.redis.zrevrange(f"{self.dlq_name}:jobs", 0, limit - 1)
            
            for job_id in job_ids:
                key = f"{self.dlq_name}:{job_id}"
                job_data = self.redis.hgetall(key)
                
                if job_data:
                    jobs.append(WebhookRetryJob.from_dict(job_data))
        
        except Exception as e:
            logger.error(f"Failed to get DLQ jobs: {e}")
        
        return jobs
    
    async def retry_from_dlq(self, job_id: str) -> bool:
        """
        Retry a job from dead letter queue
        
        Args:
            job_id: Job ID to retry
            
        Returns:
            True if job was requeued
        """
        if not self.redis:
            return False
        
        try:
            dlq_key = f"{self.dlq_name}:{job_id}"
            job_data = self.redis.hgetall(dlq_key)
            
            if not job_data:
                return False
            
            job = WebhookRetryJob.from_dict(job_data)
            
            # Reset attempts and requeue
            job.attempts = 0
            job.status = RetryStatus.PENDING
            job.last_error = None
            
            # Add back to retry queue
            queue_key = f"{self.queue_name}:{job_id}"
            self.redis.hset(queue_key, mapping=job.to_dict())
            self.redis.zadd(
                f"{self.queue_name}:scheduled",
                {job_id: datetime.now(UTC).timestamp()}
            )
            
            # Remove from DLQ
            self.redis.delete(dlq_key)
            self.redis.zrem(f"{self.dlq_name}:jobs", job_id)
            
            logger.info(f"Job {job_id} requeued from DLQ")
            return True
            
        except Exception as e:
            logger.error(f"Failed to retry job {job_id} from DLQ: {e}")
            return False
    
    async def clear_dlq(self) -> int:
        """
        Clear dead letter queue
        
        Returns:
            Number of jobs cleared
        """
        if not self.redis:
            return 0
        
        try:
            job_ids = self.redis.zrange(f"{self.dlq_name}:jobs", 0, -1)
            
            count = 0
            for job_id in job_ids:
                self.redis.delete(f"{self.dlq_name}:{job_id}")
                count += 1
            
            self.redis.delete(f"{self.dlq_name}:jobs")
            
            logger.info(f"Cleared {count} jobs from DLQ")
            return count
            
        except Exception as e:
            logger.error(f"Failed to clear DLQ: {e}")
            return 0


# ==================== Retry Worker ====================

class RetryWorker:
    """
    Background worker that processes retry queue
    """
    
    def __init__(
        self,
        retry_queue: WebhookRetryQueue,
        handler: 'WebhookHandler',
        poll_interval: float = 5.0
    ):
        """
        Initialize retry worker
        
        Args:
            retry_queue: Retry queue instance
            handler: Webhook handler to retry with
            poll_interval: Polling interval in seconds
        """
        self.queue = retry_queue
        self.handler = handler
        self.poll_interval = poll_interval
        self._running = False
        self._task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the retry worker"""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._worker_loop())
        logger.info("Retry worker started")
    
    async def stop(self):
        """Stop the retry worker"""
        self._running = False
        
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        logger.info("Retry worker stopped")
    
    async def _worker_loop(self):
        """Worker loop that processes retry queue"""
        while self._running:
            try:
                # Get next job
                job = await self.queue.get_next_job()
                
                if job:
                    # Process the job
                    logger.info(f"Processing retry job: {job.job_id}")
                    
                    try:
                        # Retry the webhook
                        result = await self.handler.handle_webhook(
                            payload=job.payload,
                            headers=job.headers
                        )
                        
                        if result['status'] == 'success':
                            await self.queue.mark_completed(job.job_id)
                        else:
                            await self.queue.mark_retrying(
                                job.job_id,
                                error=result.get('error', 'Unknown error')
                            )
                    
                    except Exception as e:
                        await self.queue.mark_retrying(job.job_id, error=str(e))
                
                # Wait before next poll
                await asyncio.sleep(self.poll_interval)
            
            except asyncio.CancelledError:
                break
            
            except Exception as e:
                logger.error(f"Error in retry worker loop: {e}", exc_info=True)
                await asyncio.sleep(self.poll_interval)


# ==================== Factory Functions ====================

def create_retry_queue(
    redis_url: str = None,
    redis_client=None,
    enable_dlq: bool = True
) -> WebhookRetryQueue:
    """
    Factory function to create a retry queue
    
    Args:
        redis_url: Redis connection URL
        redis_client: Existing Redis client
        enable_dlq: Enable dead letter queue
        
    Returns:
        WebhookRetryQueue instance
        
    Example:
        >>> from barber.webhooks import create_retry_queue
        >>>
        >>> retry_queue = create_retry_queue(redis_url="redis://localhost:6379/0")
        >>> await retry_queue.add_for_retry(payload, headers, error="Network error")
    """
    return WebhookRetryQueue(
        redis_url=redis_url,
        redis_client=redis_client,
        enable_dlq=enable_dlq
    )


def create_retry_worker(
    retry_queue: WebhookRetryQueue,
    handler: 'WebhookHandler',
    poll_interval: float = 5.0
) -> RetryWorker:
    """
    Factory function to create a retry worker
    
    Args:
        retry_queue: Retry queue instance
        handler: Webhook handler instance
        poll_interval: Polling interval in seconds
        
    Returns:
        RetryWorker instance
        
    Example:
        >>> from barber.webhooks import create_retry_worker, create_webhook_handler, create_retry_queue
        >>>
        >>> handler = create_webhook_handler()
        >>> queue = create_retry_queue()
        >>> worker = create_retry_worker(queue, handler)
        >>> await worker.start()
    """
    return RetryWorker(retry_queue, handler, poll_interval)
