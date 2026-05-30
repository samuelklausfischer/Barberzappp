"""
Cache Invalidation Module

Maps Supabase webhook events to Redis cache patterns and invalidates
the appropriate cache entries.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, UTC

from ..cache.cache_manager import get_cache_manager, CacheManager
from ..config.redis_config import build_key, CacheKeySchema
from .supabase_webhook import WebhookEvent, WebhookEventType

logger = logging.getLogger(__name__)


# ==================== Event-to-Pattern Mappings ====================

EVENT_PATTERN_MAPPINGS = {
    # Appointments
    ('appointments', WebhookEventType.INSERT): lambda e: [
        f"{build_key.APPOINTMENTS}:{e.get_shop_id()}:{e.get_scheduled_date()}",
        f"{build_key.TENANT}:{e.get_shop_id()}",
    ],
    ('appointments', WebhookEventType.UPDATE): lambda e: (
        _get_appointment_update_patterns(e)
    ),
    ('appointments', WebhookEventType.DELETE): lambda e: [
        f"{build_key.APPOINTMENTS}:{e.get_shop_id(from_old=True)}:{e.get_scheduled_date(from_old=True)}",
        f"{build_key.TENANT}:{e.get_shop_id(from_old=True)}",
    ],
    
    # Clients
    ('clients', WebhookEventType.INSERT): lambda e: [
        f"{build_key.CLIENT}:{e.get_id()}",
        f"{build_key.TENANT}:{e.get_shop_id()}",
    ],
    ('clients', WebhookEventType.UPDATE): lambda e: [
        f"{build_key.CLIENT}:{e.get_id()}",
        f"{build_key.TENANT}:{e.get_shop_id()}",
        f"{build_key.CLIENT_STATS}:{e.get_id()}",  # Invalidate stats when client updates
    ],
    ('clients', WebhookEventType.DELETE): lambda e: [
        f"{build_key.CLIENT}:{e.get_id(from_old=True)}",
        f"{build_key.TENANT}:{e.get_shop_id(from_old=True)}",
        f"{build_key.CLIENT_STATS}:{e.get_id(from_old=True)}",
    ],
    
    # Services
    ('services', WebhookEventType.INSERT): lambda e: [
        f"{build_key.SERVICES}:{e.get_shop_id()}",
        f"{build_key.TENANT}:{e.get_shop_id()}",
    ],
    ('services', WebhookEventType.UPDATE): lambda e: [
        f"{build_key.SERVICES}:{e.get_shop_id()}",
        f"{build_key.TENANT}:{e.get_shop_id()}",
    ],
    ('services', WebhookEventType.DELETE): lambda e: [
        f"{build_key.SERVICES}:{e.get_shop_id(from_old=True)}",
        f"{build_key.TENANT}:{e.get_shop_id(from_old=True)}",
    ],
    
    # Employees
    ('employees', 'INSERT'): lambda e: [
        f"{build_key.TENANT}:{e.get_shop_id()}",
    ],
    ('employees', 'UPDATE'): lambda e: [
        f"{build_key.TENANT}:{e.get_shop_id()}",
    ],
    ('employees', 'DELETE'): lambda e: [
        f"{build_key.TENANT}:{e.get_shop_id(from_old=True)}",
    ],
    
    # Queue
    ('queue', WebhookEventType.INSERT): lambda e: [
        f"{build_key.QUEUE}:{e.get_shop_id()}",
    ],
    ('queue', WebhookEventType.UPDATE): lambda e: [
        f"{build_key.QUEUE}:{e.get_shop_id()}",
    ],
    ('queue', WebhookEventType.DELETE): lambda e: [
        f"{build_key.QUEUE}:{e.get_shop_id(from_old=True)}",
    ],
    
    # Generic tenant updates (any table with shop_id)
    ('*', WebhookEventType.UPDATE): lambda e: _get_tenant_patterns_if_shop_changed(e),
}


def _get_appointment_update_patterns(event: WebhookEvent) -> List[str]:
    """
    Get patterns for appointment update events
    
    Special handling for status changes:
    - If status changed, also invalidate client stats
    """
    patterns = [
        f"{build_key.APPOINTMENTS}:{event.get_shop_id()}:{event.get_scheduled_date()}",
        f"{build_key.TENANT}:{event.get_shop_id()}",
    ]
    
    # Check if status changed
    if event.has_status_changed():
        patterns.append(f"{build_key.CLIENT_STATS}:{event.get_client_id()}")
        logger.info(
            f"Appointment status changed, invalidating client stats: {event.get_client_id()}"
        )
    
    return patterns


def _get_tenant_patterns_if_shop_changed(event: WebhookEvent) -> List[str]:
    """
    For generic updates, check if shop_id changed and invalidate tenant cache
    
    This is useful for tables that might reference shops
    """
    old_shop = event.get_shop_id(from_old=True)
    new_shop = event.get_shop_id(from_old=False)
    
    if old_shop and new_shop and old_shop != new_shop:
        return [
            f"{build_key.TENANT}:{old_shop}",
            f"{build_key.TENANT}:{new_shop}",
        ]
    elif old_shop or new_shop:
        shop_id = old_shop or new_shop
        return [f"{build_key.TENANT}:{shop_id}"]
    
    return []


# ==================== Cache Invalidation Functions ====================

class CacheInvalidator:
    """
    High-level cache invalidation handler
    """
    
    def __init__(self, cache_manager: Optional[CacheManager] = None):
        """
        Initialize invalidator
        
        Args:
            cache_manager: Optional cache manager instance (uses default if not provided)
        """
        self.cache = cache_manager or get_cache_manager()
    
    def invalidate_event(self, event: WebhookEvent) -> Dict[str, Any]:
        """
        Invalidate cache entries based on webhook event
        
        Args:
            event: Webhook event to process
            
        Returns:
            Dict with invalidation results:
                - patterns: List of patterns to invalidate
                - deleted: Number of keys deleted
                - status: 'success', 'partial', or 'error'
                - duration_ms: Processing duration
        """
        start_time = datetime.now(UTC)
        
        try:
            # Get patterns for this event
            patterns = map_supabase_event_to_cache_patterns(
                event.event_type,
                event.table,
                event.record.to_dict(),
                event.old_record.to_dict() if event.old_record else None
            )
            
            if not patterns:
                logger.debug(f"No cache patterns to invalidate for {event.event_type} on {event.table}")
                return {
                    'patterns': [],
                    'deleted': 0,
                    'status': 'success',
                    'duration_ms': 0,
                }
            
            logger.info(f"Invalidating {len(patterns)} cache patterns for {event.event_type} on {event.table}")
            logger.debug(f"Patterns: {patterns}")
            
            # Invalidate each pattern
            total_deleted = 0
            failed_patterns = []
            
            for pattern in patterns:
                try:
                    deleted = self.cache.invalidate(pattern)
                    total_deleted += deleted
                    logger.debug(f"Deleted {deleted} keys for pattern: {pattern}")
                    
                    if deleted == 0:
                        logger.debug(f"No keys found for pattern: {pattern}")
                        
                except Exception as e:
                    logger.error(f"Failed to invalidate pattern '{pattern}': {e}")
                    failed_patterns.append(pattern)
            
            duration_ms = (datetime.now(UTC) - start_time).total_seconds() * 1000
            
            # Determine status
            if failed_patterns:
                status = 'partial'
                logger.warning(
                    f"Cache invalidation partially failed: "
                    f"{len(failed_patterns)}/{len(patterns)} patterns failed"
                )
            else:
                status = 'success'
                logger.info(
                    f"Cache invalidation completed successfully: "
                    f"{total_deleted} keys deleted in {duration_ms:.2f}ms"
                )
            
            return {
                'patterns': patterns,
                'deleted': total_deleted,
                'failed_patterns': failed_patterns,
                'status': status,
                'duration_ms': duration_ms,
            }
            
        except Exception as e:
            duration_ms = (datetime.now(UTC) - start_time).total_seconds() * 1000
            logger.error(f"Cache invalidation failed: {e}")
            return {
                'patterns': [],
                'deleted': 0,
                'status': 'error',
                'error': str(e),
                'duration_ms': duration_ms,
            }


def map_supabase_event_to_cache_patterns(
    event_type: WebhookEventType,
    table_name: str,
    record_data: Dict[str, Any],
    old_record: Optional[Dict[str, Any]] = None
) -> List[str]:
    """
    Map a Supabase webhook event to cache invalidation patterns
    
    Args:
        event_type: Type of event (INSERT, UPDATE, DELETE)
        table_name: Name of the table
        record_data: Current record data
        old_record: Previous record data (for UPDATE/DELETE events)
        
    Returns:
        List of cache patterns to invalidate
        
    Example:
        >>> patterns = map_supabase_event_to_cache_patterns(
        ...     event_type='INSERT',
        ...     table_name='appointments',
        ...     record_data={'shop_id': 'shop123', 'scheduled_at': '2026-03-04T10:00:00Z'}
        ... )
        >>> # Returns: ['barberzap:appointments:shop123:2026-03-04', 'barberzap:tenant:shop123']
    """
    # Create a mock WebhookEvent for pattern generation
    from .supabase_webhook import WebhookRecord, WebhookEvent
    
    record = WebhookRecord.from_dict(record_data)
    old_rec = WebhookRecord.from_dict(old_record) if old_record else None
    
    event = WebhookEvent(
        event_type=event_type,
        table=table_name,
        record=record,
        old_record=old_rec,
    )
    
    # Look up mapping
    key = (table_name, event_type)
    
    # Try exact match first
    if key in EVENT_PATTERN_MAPPINGS:
        return EVENT_PATTERN_MAPPINGS[key](event)
    
    # Try wildcard table match
    wildcard_key = ('*', event_type)
    if wildcard_key in EVENT_PATTERN_MAPPINGS:
        return EVENT_PATTERN_MAPPINGS[wildcard_key](event)
    
    # Default: no invalidation
    logger.debug(f"No cache patterns defined for {event_type} on {table_name}")
    return []


def invalidate_patterns(patterns: List[str]) -> int:
    """
    Invalidate all cache keys matching the given patterns
    
    Args:
        patterns: List of cache patterns
        
    Returns:
        Total number of keys deleted across all patterns
        
    Example:
        >>> invalidate_patterns([
        ...     'barberzap:appointments:shop123:2026-03-04',
        ...     'barberzap:tenant:shop123'
        ... ])
        3
    """
    cache = get_cache_manager()
    total_deleted = 0
    
    for pattern in patterns:
        try:
            deleted = cache.invalidate(pattern)
            total_deleted += deleted
            logger.debug(f"Deleted {deleted} keys for pattern: {pattern}")
        except Exception as e:
            logger.error(f"Failed to invalidate pattern '{pattern}': {e}")
    
    return total_deleted


def invalidate_tenant(shop_id: str) -> int:
    """
    Invalidate all cache for a specific tenant/shop
    
    Invalidates:
    - barberzap:tenant:{shop_id}
    - barberzap:services:{shop_id}
    - barberzap:appointments:{shop_id}:*
    - barberzap:queue:{shop_id}
    
    Args:
        shop_id: Shop/tenant ID
        
    Returns:
        Number of keys deleted
        
    Example:
        >>> invalidate_tenant('shop123')
        5
    """
    cache = get_cache_manager()
    return cache.invalidate_multi_tenant(shop_id)


def invalidate_appointment_date(shop_id: str, date: str) -> int:
    """
    Invalidate appointments cache for a specific shop and date
    
    Args:
        shop_id: Shop/tenant ID
        date: Date in YYYY-MM-DD format
        
    Returns:
        Number of keys deleted
        
    Example:
        >>> invalidate_appointment_date('shop123', '2026-03-04')
        2
    """
    cache = get_cache_manager()
    pattern = f"{build_key.APPOINTMENTS}:{shop_id}:{date}"
    return cache.invalidate(pattern)


def invalidate_client(client_id: str) -> int:
    """
    Invalidate cache for a specific client
    
    Invalidates:
    - barberzap:client:{client_id}
    - barberzap:client:stats:{client_id}
    
    Args:
        client_id: Client ID
        
    Returns:
        Number of keys deleted
        
    Example:
        >>> invalidate_client('client456')
        2
    """
    cache = get_cache_manager()
    patterns = [
        f"{build_key.CLIENT}:{client_id}",
        f"{build_key.CLIENT_STATS}:{client_id}",
    ]
    
    total = 0
    for pattern in patterns:
        total += cache.invalidate(pattern)
    
    return total


def invalidate_services(shop_id: str) -> int:
    """
    Invalidate services cache for a specific shop
    
    Args:
        shop_id: Shop/tenant ID
        
    Returns:
        Number of keys deleted
    """
    cache = get_cache_manager()
    return cache.invalidate(f"{build_key.SERVICES}:{shop_id}")


def invalidate_queue(shop_id: str) -> int:
    """
    Invalidate queue cache for a specific shop
    
    Args:
        shop_id: Shop/tenant ID
        
    Returns:
        Number of keys deleted
    """
    cache = get_cache_manager()
    return cache.invalidate(f"{build_key.QUEUE}:{shop_id}")


# ==================== Batch Invalidation Helpers ====================

def invalidate_batch(resources: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Invalidate multiple resources in a batch
    
    Args:
        resources: List of resource dicts with 'type' and 'id' keys
            Example: [{'type': 'tenant', 'id': 'shop123'}, {'type': 'client', 'id': 'client456'}]
        
    Returns:
        Dict with total deleted and breakdown by type
        
    Example:
        >>> invalidate_batch([
        ...     {'type': 'tenant', 'id': 'shop123'},
        ...     {'type': 'client', 'id': 'client456'}
        ... ])
        {'total': 10, 'by_type': {'tenant': 5, 'client': 5}}
    """
    cache = get_cache_manager()
    results = {'total': 0, 'by_type': {}}
    
    for resource in resources:
        resource_type = resource.get('type')
        resource_id = resource.get('id')
        
        if not resource_type or not resource_id:
            logger.warning(f"Invalid resource: {resource}")
            continue
        
        try:
            if resource_type == 'tenant':
                deleted = invalidate_tenant(resource_id)
            elif resource_type == 'client':
                deleted = invalidate_client(resource_id)
            elif resource_type == 'services':
                deleted = invalidate_services(resource_id)
            elif resource_type == 'queue':
                deleted = invalidate_queue(resource_id)
            else:
                logger.warning(f"Unknown resource type: {resource_type}")
                continue
            
            results['total'] += deleted
            results['by_type'][resource_type] = results['by_type'].get(resource_type, 0) + deleted
            
        except Exception as e:
            logger.error(f"Failed to invalidate resource {resource_type}:{resource_id}: {e}")
    
    return results
