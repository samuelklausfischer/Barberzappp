"""
Cache Invalidation System for BarberZap
Handles invalidation via Supabase webhooks and Redis pub/sub for distributed invalidation
"""

import json
import asyncio
import threading
import time
import logging
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime
import hashlib
from enum import Enum

from redis.exceptions import RedisError
from .cache_manager import CacheManager, get_cache_manager
from ..config.redis_config import build_key, ttl_config

logger = logging.getLogger(__name__)


# ==================== Invalidation Events ====================

class InvalidationEventType(Enum):
    """Types of cache invalidation events"""
    TENANT_UPDATED = "tenant_updated"
    SERVICES_UPDATED = "services_updated"
    APPOINTMENT_CREATED = "appointment_created"
    APPOINTMENT_UPDATED = "appointment_updated"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    CLIENT_UPDATED = "client_updated"
    QUEUE_UPDATED = "queue_updated"
    BULK_INVALIDATE = "bulk_invalidate"
    CUSTOM = "custom"


# ==================== Invalidation Strategy ====================

class InvalidationStrategy:
    """Defines how cache invalidation should be handled"""

    # Default strategies for different event types
    STRATEGIES = {
        InvalidationEventType.TENANT_UPDATED: [
            lambda shop_id: build_key.tenant_key(shop_id),
            lambda shop_id: f"{build_key.SERVICES}:{shop_id}",
            lambda shop_id: build_key.queue_key(shop_id),
        ],
        InvalidationEventType.SERVICES_UPDATED: [
            lambda shop_id: build_key.services_key(shop_id),
        ],
        InvalidationEventType.APPOINTMENT_CREATED: [
            lambda shop_id, date: build_key.appointments_key(shop_id, date),
            lambda shop_id: build_key.queue_key(shop_id),
        ],
        InvalidationEventType.APPOINTMENT_UPDATED: [
            lambda shop_id, date: build_key.appointments_key(shop_id, date),
            lambda shop_id: build_key.queue_key(shop_id),
        ],
        InvalidationEventType.APPOINTMENT_CANCELLED: [
            lambda shop_id, date: build_key.appointments_key(shop_id, date),
            lambda shop_id: build_key.queue_key(shop_id),
        ],
        InvalidationEventType.CLIENT_UPDATED: [
            lambda client_id: build_key.client_key(client_id),
            lambda client_id: build_key.client_stats_key(client_id),
        ],
        InvalidationEventType.QUEUE_UPDATED: [
            lambda shop_id: build_key.queue_key(shop_id),
        ],
    }

    @classmethod
    def get_invalidation_keys(cls, event_type: InvalidationEventType, **kwargs) -> List[str]:
        """
        Get cache keys to invalidate for a given event type
        
        Args:
            event_type: Type of event that triggers invalidation
            **kwargs: Parameters needed for the event type (e.g., shop_id, client_id, date)
            
        Returns:
            List of cache keys to invalidate
        """
        keys = []
        strategies = cls.STRATEGIES.get(event_type, [])
        
        for strategy in strategies:
            try:
                key = strategy(**kwargs)
                if isinstance(key, str):
                    keys.append(key)
                elif isinstance(key, list):
                    keys.extend(key)
            except Exception as e:
                logger.error(f"Error generating invalidation key for {event_type}: {e}")
        
        return keys

    @classmethod
    def register_strategy(cls, event_type: InvalidationEventType, strategies: List[Callable]):
        """Register a custom invalidation strategy for an event type"""
        cls.STRATEGIES[event_type] = strategies


# ==================== Supabase Webhook Handler ====================

class SupabaseWebhookHandler:
    """
    Handle incoming Supabase webhook events for cache invalidation
    
    Expected webhook payload format:
    {
        "type": "INSERT" | "UPDATE" | "DELETE",
        "table": "tenants" | "services" | "appointments" | "clients",
        "record": { ... },
        "old_record": { ... }  // for UPDATE/DELETE
    }
    """

    # Mapping from Supabase tables to invalidation event types
    TABLE_EVENT_MAP = {
        'tenants': InvalidationEventType.TENANT_UPDATED,
        'services': InvalidationEventType.SERVICES_UPDATED,
        'appointments': InvalidationEventType.APPOINTMENT_UPDATED,
        'clients': InvalidationEventType.CLIENT_UPDATED,
    }

    def __init__(self, cache_manager: Optional[CacheManager] = None):
        self.cache_manager = cache_manager or get_cache_manager()
        self._handlers: Dict[str, Callable] = {}

    def handle_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a Supabase webhook payload and invalidate cache
        
        Args:
            payload: Webhook payload from Supabase
            
        Returns:
            Result of invalidation operation
        """
        try:
            # Validate payload
            if not payload or 'table' not in payload or 'type' not in payload:
                logger.error("Invalid webhook payload")
                return {'status': 'error', 'message': 'Invalid payload'}
            
            table = payload['table']
            event_type = payload['type']  # INSERT, UPDATE, DELETE
            record = payload.get('record', {})
            
            # Determine invalidation type based on table
            if table not in self.TABLE_EVENT_MAP:
                logger.warning(f"No invalidation strategy for table '{table}'")
                return {'status': 'skipped', 'message': f'No strategy for table {table}'}
            
            invalidation_event = self.TABLE_EVENT_MAP[table]
            
            # Special handling for different event types
            if table == 'appointments':
                return self._handle_appointment(event_type, record)
            
            # Standard handling
            keys_to_invalidate = self._get_keys_for_record(table, record)
            result = self._invalidate_keys(keys_to_invalidate)
            
            logger.info(f"Invalidated {result['deleted_count']} keys for {event_type} on {table}")
            
            return {
                'status': 'success',
                'event_type': event_type,
                'table': table,
                'keys_invalidated': keys_to_invalidate,
                'deleted_count': result['deleted_count'],
            }
            
        except Exception as e:
            logger.error(f"Error handling webhook: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _handle_appointment(self, event_type: str, record: Dict[str, Any]) -> Dict[str, Any]:
        """Handle appointment-specific invalidation"""
        shop_id = record.get('shop_id')
        appointment_date = record.get('appointment_date') or record.get('date')
        
        if not shop_id:
            logger.error("Appointment record missing shop_id")
            return {'status': 'error', 'message': 'Missing shop_id'}
        
        # Determine event type
        if event_type == 'INSERT' or record.get('status') == 'scheduled':
            invalidation_type = InvalidationEventType.APPOINTMENT_CREATED
        elif event_type == 'DELETE' or record.get('status') == 'cancelled':
            invalidation_type = InvalidationEventType.APPOINTMENT_CANCELLED
        else:
            invalidation_type = InvalidationEventType.APPOINTMENT_UPDATED
        
        # Get keys to invalidate
        kwargs = {'shop_id': shop_id}
        if appointment_date:
            kwargs['date'] = appointment_date
        
        keys_to_invalidate = InvalidationStrategy.get_invalidation_keys(
            invalidation_type, **kwargs
        )
        
        result = self._invalidate_keys(keys_to_invalidate)
        
        return {
            'status': 'success',
            'event_type': event_type,
            'invalidation_type': invalidation_type.value,
            'keys_invalidated': keys_to_invalidate,
            'deleted_count': result['deleted_count'],
        }

    def _get_keys_for_record(self, table: str, record: Dict[str, Any]) -> List[str]:
        """Extract cache keys from a database record"""
        keys = []
        
        if table == 'tenants':
            shop_id = record.get('id') or record.get('shop_id')
            if shop_id:
                keys.extend(InvalidationStrategy.get_invalidation_keys(
                    InvalidationEventType.TENANT_UPDATED,
                    shop_id=shop_id
                ))
        
        elif table == 'services':
            shop_id = record.get('shop_id')
            if shop_id:
                keys.extend(InvalidationStrategy.get_invalidation_keys(
                    InvalidationEventType.SERVICES_UPDATED,
                    shop_id=shop_id
                ))
        
        elif table == 'clients':
            client_id = record.get('id')
            if client_id:
                keys.extend(InvalidationStrategy.get_invalidation_keys(
                    InvalidationEventType.CLIENT_UPDATED,
                    client_id=client_id
                ))
        
        return keys

    def _invalidate_keys(self, keys: List[str]) -> Dict[str, Any]:
        """Invalidate a list of cache keys"""
        if not keys:
            return {'status': 'success', 'deleted_count': 0}
        
        deleted_count = 0
        for key in keys:
            try:
                # Handle patterns vs exact keys
                if '*' in key:
                    deleted_count += self.cache_manager.invalidate(key)
                else:
                    deleted_count += 1 if self.cache_manager.delete(key) else 0
            except Exception as e:
                logger.error(f"Error invalidating key '{key}': {e}")
        
        return {'status': 'success', 'deleted_count': deleted_count}

    def register_custom_handler(self, table: str, handler: Callable[[Dict], Dict]):
        """Register a custom handler for a specific table"""
        self._handlers[table] = handler


# ==================== Redis Pub/Sub for Distributed Invalidation ====================

class RedisPubSubInvalidation:
    """
    Manage cache invalidation via Redis pub/sub for distributed systems
    
    All instances subscribe to a channel and invalidate cache when messages are received
    """

    CHANNEL = f"{build_key.PREFIX}:invalidate"

    def __init__(self, cache_manager: Optional[CacheManager] = None):
        self.cache_manager = cache_manager or get_cache_manager()
        self._pubsub = None
        self._listening = False
        self._listen_thread: Optional[threading.Thread] = None
        self._invalidation_handlers: List[Callable] = []

    def publish_invalidation(self, keys: List[str], source: str = "unknown") -> bool:
        """
        Publish an invalidation message to Redis pub/sub
        
        Args:
            keys: List of cache keys to invalidate
            source: Identifier for the source of the invalidation
            
        Returns:
            True if published successfully
        """
        if not self.cache_manager._connected:
            logger.warning("Redis not connected, cannot publish invalidation")
            return False

        message = {
            'timestamp': datetime.utcnow().isoformat(),
            'source': source,
            'keys': keys,
        }

        try:
            self.cache_manager._client.publish(
                self.CHANNEL,
                json.dumps(message)
            )
            logger.info(f"Published invalidation for {len(keys)} keys from {source}")
            return True
        except Exception as e:
            logger.error(f"Error publishing invalidation: {e}")
            return False

    def publish_pattern_invalidation(self, pattern: str, source: str = "unknown") -> bool:
        """
        Publish a pattern-based invalidation message

        Args:
            pattern: Cache key pattern to invalidate
            source: Identifier for the source

        Returns:
            True if published successfully
        """
        if not self.cache_manager._connected:
            return False

        message = {
            'timestamp': datetime.utcnow().isoformat(),
            'source': source,
            'pattern': pattern,
        }

        try:
            self.cache_manager._client.publish(
                self.CHANNEL,
                json.dumps(message)
            )
            logger.info(f"Published pattern invalidation '{pattern}' from {source}")
            return True
        except Exception as e:
            logger.error(f"Error publishing pattern invalidation: {e}")
            return False

    def start_listening(self):
        """Start listening for invalidation messages in a background thread"""
        if self._listening:
            logger.warning("Already listening for invalidation messages")
            return

        self._listening = True
        self._listen_thread = threading.Thread(
            target=self._listen_loop,
            daemon=True,
            name="redis-pubsub-listener"
        )
        self._listen_thread.start()
        logger.info("Started listening for cache invalidation messages")

    def stop_listening(self):
        """Stop listening for invalidation messages"""
        self._listening = False
        if self._pubsub:
            self._pubsub.unsubscribe()
        if self._listen_thread:
            self._listen_thread.join(timeout=2)
        logger.info("Stopped listening for cache invalidation messages")

    def _listen_loop(self):
        """Main loop for listening to pub/sub messages"""
        if not self.cache_manager._connected:
            logger.error("Cannot start listening - Redis not connected")
            return

        try:
            self._pubsub = self.cache_manager._client.pubsub()
            self._pubsub.subscribe(self.CHANNEL)

            while self._listening:
                try:
                    message = self._pubsub.get_message(timeout=1)
                    if message and message['type'] == 'message':
                        self._handle_invalidation_message(message['data'])

                except Exception as e:
                    logger.error(f"Error processing pub/sub message: {e}")
                    time.sleep(1)

        except Exception as e:
            logger.error(f"Error in pub/sub listen loop: {e}")
        finally:
            self._listening = False

    def _handle_invalidation_message(self, data: str):
        """Process an invalidation message from pub/sub"""
        try:
            message = json.loads(data)
            deleted_count = 0

            # Handle list of keys
            if 'keys' in message:
                for key in message['keys']:
                    if '*' in key:
                        deleted_count += self.cache_manager.invalidate(key)
                    else:
                        deleted_count += 1 if self.cache_manager.delete(key) else 0

            # Handle pattern invalidation
            elif 'pattern' in message:
                deleted_count += self.cache_manager.invalidate(message['pattern'])

            logger.info(
                f"Processed invalidation from {message.get('source', 'unknown')}: "
                f"{deleted_count} keys deleted"
            )

            # Call registered handlers
            for handler in self._invalidation_handlers:
                try:
                    handler(message)
                except Exception as e:
                    logger.error(f"Error in invalidation handler: {e}")

        except Exception as e:
            logger.error(f"Error handling invalidation message: {e}")

    def register_handler(self, handler: Callable[[Dict], None]):
        """Register a callback to be invoked when invalidation is received"""
        self._invalidation_handlers.append(handler)


# ==================== Async Support ====================

class AsyncCacheInvalidation:
    """
    Async version of cache invalidation for use with async/await
    """

    def __init__(self):
        self._handler = SupabaseWebhookHandler()
        self._pubsub = RedisPubSubInvalidation()

    async def handle_webhook_async(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Async wrapper for webhook handling"""
        # Run sync handler in thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._handler.handle_webhook, payload)

    async def invalidate_keys_async(self, keys: List[str], publish: bool = True) -> Dict[str, Any]:
        """
        Invalidate cache keys asynchronously
        
        Args:
            keys: List of keys to invalidate
            publish: Whether to publish to pub/sub for distributed invalidation
            
        Returns:
            Dict with invalidation result
        """
        loop = asyncio.get_event_loop()
        
        # Invalidate locally
        deleted_count = 0
        for key in keys:
            if '*' in key:
                deleted_count += await loop.run_in_executor(
                    None, self._handler.cache_manager.invalidate, key
                )
            else:
                deleted_count += await loop.run_in_executor(
                    None, self._handler.cache_manager.delete, key
                )

        # Publish to pub/sub if requested
        if publish:
            await loop.run_in_executor(
                None, self._pubsub.publish_invalidation, keys, "async"
            )

        return {
            'status': 'success',
            'deleted_count': deleted_count,
            'keys': keys,
        }

    async def invalidate_tenant_async(self, shop_id: str, publish: bool = True) -> Dict[str, Any]:
        """Invalidate all cache for a tenant asynchronously"""
        keys = [
            build_key.tenant_key(shop_id),
            f"{build_key.SERVICES}:{shop_id}",
            f"{build_key.APPOINTMENTS}:{shop_id}:*",
            build_key.queue_key(shop_id),
        ]
        return await self.invalidate_keys_async(keys, publish)


# ==================== Invalidation Manager ====================

class CacheInvalidationManager:
    """
    High-level manager for all cache invalidation operations
    Combines webhook handling and pub/sub for distributed invalidation
    """

    def __init__(self, cache_manager: Optional[CacheManager] = None):
        self.cache_manager = cache_manager or get_cache_manager()
        self.webhook_handler = SupabaseWebhookHandler(self.cache_manager)
        self.pubsub = RedisPubSubInvalidation(self.cache_manager)
        self.async_handler = AsyncCacheInvalidation()
        self._started = False

    def invalidate_tenant(self, shop_id: str, source: str = "manual") -> int:
        """
        Invalidate all cache for a specific tenant/shop
        
        Args:
            shop_id: Shop/tenant ID
            source: Source of the invalidation (for logging)
            
        Returns:
            Number of keys deleted
        """
        keys = [
            build_key.tenant_key(shop_id),
            f"{build_key.SERVICES}:{shop_id}",
            f"{build_key.APPOINTMENTS}:{shop_id}:*",
            build_key.queue_key(shop_id),
        ]

        deleted_count = 0
        for key in keys:
            deleted_count += self.cache_manager.invalidate(key)

        # Publish to pub/sub for distributed invalidation
        self.pubsub.publish_invalidation(keys, source)

        return deleted_count

    def invalidate_services(self, shop_id: str, source: str = "manual") -> int:
        """Invalidate services cache for a shop"""
        key = f"{build_key.SERVICES}:{shop_id}"
        deleted_count = self.cache_manager.invalidate(key)
        self.pubsub.publish_invalidation([key], source)
        return deleted_count

    def invalidate_appointments(self, shop_id: str, date: str, source: str = "manual") -> int:
        """Invalidate appointments cache for a specific date"""
        key = build_key.appointments_key(shop_id, date)
        deleted_count = self.cache_manager.invalidate(key)
        self.pubsub.publish_invalidation([key], source)
        return deleted_count

    def invalidate_client(self, client_id: str, source: str = "manual") -> int:
        """Invalidate client data cache"""
        keys = [
            build_key.client_key(client_id),
            f"{build_key.CLIENT_STATS}:{client_id}",
        ]
        deleted_count = sum(self.cache_manager.delete(k) for k in keys)
        self.pubsub.publish_invalidation(keys, source)
        return deleted_count

    def handle_supabase_webhook(self, payload: Dict) -> Dict:
        """Handle a Supabase webhook and trigger distributed invalidation"""
        result = self.webhook_handler.handle_webhook(payload)
        
        # Publish to pub/sub for distributed invalidation
        if result.get('status') == 'success' and result.get('keys_invalidated'):
            self.pubsub.publish_invalidation(result['keys_invalidated'], 'webhook')
        
        return result

    def start(self):
        """Start the invalidation system (pub/sub listener)"""
        if not self._started:
            self.pubsub.start_listening()
            self._started = True

    def stop(self):
        """Stop the invalidation system"""
        self.pubsub.stop_listening()
        self._started = False

    def __enter__(self):
        """Context manager support"""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager support"""
        self.stop()


# ==================== Singleton ====================

_invalidation_manager: Optional[CacheInvalidationManager] = None
_manager_lock = threading.Lock()


def get_invalidation_manager() -> CacheInvalidationManager:
    """Get or create the global invalidation manager instance"""
    global _invalidation_manager
    
    if _invalidation_manager is None:
        with _manager_lock:
            if _invalidation_manager is None:
                _invalidation_manager = CacheInvalidationManager()
    
    return _invalidation_manager
