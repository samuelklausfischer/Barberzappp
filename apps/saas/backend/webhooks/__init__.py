"""
Supabase Webhook System for BarberZap Cache Invalidation

This package provides webhook handlers that receive events from Supabase
and invalidate the Redis cache accordingly.

Main components:
- supabase_webhook: Core webhook endpoint logic
- invalidator: Cache invalidation functions
- webhook_handler: FastAPI/Flask route handlers
- retry_queue: BullMQ-based retry system
"""

from .supabase_webhook import (
    SupabaseWebhook,
    WebhookEvent,
    WebhookSignatureError,
    WebhookValidationError,
)

from .invalidator import (
    CacheInvalidator,
    map_supabase_event_to_cache_patterns,
    invalidate_patterns,
    invalidate_tenant,
    invalidate_appointment_date,
    invalidate_client,
)

from .webhook_handler import (
    WebhookHandler,
    create_webhook_handler,
)

from .retry_queue import (
    WebhookRetryQueue,
    RetryWorker,
    create_retry_queue,
)

from .webhook_cli import (
    WebhookCLI,
    webhook_cli,
)

__all__ = [
    # supabase_webhook
    'SupabaseWebhook',
    'WebhookEvent',
    'WebhookSignatureError',
    'WebhookValidationError',
    # invalidator
    'CacheInvalidator',
    'map_supabase_event_to_cache_patterns',
    'invalidate_patterns',
    'invalidate_tenant',
    'invalidate_appointment_date',
    'invalidate_client',
    # webhook_handler
    'WebhookHandler',
    'create_webhook_handler',
    # retry_queue
    'WebhookRetryQueue',
    'RetryWorker',
    'create_retry_queue',
    # CLI
    'WebhookCLI',
    'webhook_cli',
]

__version__ = '1.0.0'
