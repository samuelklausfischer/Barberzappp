"""
Supabase Webhook Core Module

Handles incoming webhook events from Supabase postgres triggers
and validates their signatures.
"""

import hmac
import hashlib
import logging
import json
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum

logger = logging.getLogger(__name__)


class WebhookEventType(str, Enum):
    """Supabase webhook event types"""
    INSERT = 'INSERT'
    UPDATE = 'UPDATE'
    DELETE = 'DELETE'


class WebhookError(Exception):
    """Base exception for webhook errors"""
    pass


class WebhookSignatureError(WebhookError):
    """Invalid webhook signature"""
    pass


class WebhookValidationError(WebhookError):
    """Invalid webhook payload"""
    pass


@dataclass
class WebhookRecord:
    """Represents a database record in a webhook event"""
    
    __annotations__: Dict[str, Any] = field(default_factory=dict)
    
    raw_data: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Extract field annotations from raw_data"""
        if self.raw_data:
            for key, value in self.raw_data.items():
                setattr(self, key, value)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a field value"""
        return getattr(self, key, default)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return self.raw_data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WebhookRecord':
        """Create WebhookRecord from dictionary"""
        return cls(raw_data=data)


@dataclass
class WebhookEvent:
    """
    Represents a Supabase webhook event
    
    Expected payload structure:
    {
        "type": "INSERT|UPDATE|DELETE",
        "table": "table_name",
        "record": { ... },
        "old_record": { ... },  // For UPDATE/DELETE
        "schema": "public",
        "trigger": "trigger_name"
    }
    """
    
    event_type: WebhookEventType
    table: str
    record: WebhookRecord
    old_record: Optional[WebhookRecord] = None
    schema: str = 'public'
    trigger: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    
    raw_payload: Dict[str, Any] = field(default_factory=dict)
    
    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> 'WebhookEvent':
        """
        Create WebhookEvent from payload dictionary
        
        Args:
            payload: Raw webhook payload
            
        Returns:
            WebhookEvent instance
            
        Raises:
            WebhookValidationError: If payload is invalid
        """
        # Validate required fields
        required_fields = ['type', 'table', 'record']
        for field_name in required_fields:
            if field_name not in payload:
                raise WebhookValidationError(f"Missing required field: {field_name}")
        
        # Validate event type
        try:
            event_type = WebhookEventType(payload['type'])
        except ValueError:
            raise WebhookValidationError(
                f"Invalid event type: {payload['type']}. "
                f"Must be one of: {', '.join(e.value for e in WebhookEventType)}"
            )
        
        # Create record objects
        record = WebhookRecord.from_dict(payload['record'])
        old_record = None
        
        if payload.get('old_record'):
            old_record = WebhookRecord.from_dict(payload['old_record'])
        
        # Create event
        return cls(
            event_type=event_type,
            table=payload['table'],
            record=record,
            old_record=old_record,
            schema=payload.get('schema', 'public'),
            trigger=payload.get('trigger'),
            raw_payload=payload,
        )
    
    def get_field(self, field_name: str, from_old: bool = False) -> Any:
        """
        Get a field value from the record
        
        Args:
            field_name: Name of the field to retrieve
            from_old: If True, get from old_record (for UPDATE/DELETE events)
            
        Returns:
            Field value or None if not found
        """
        record = self.old_record if from_old else self.record
        if record:
            return record.get(field_name)
        return None
    
    def get_id(self, from_old: bool = False) -> Optional[str]:
        """Get the record ID (common field 'id')"""
        return self.get_field('id', from_old=from_old)
    
    def get_shop_id(self, from_old: bool = False) -> Optional[str]:
        """Get the shop_id from the record"""
        # Try common field names
        for field in ['shop_id', 'tenant_id', 'shopID', 'tenantID']:
            value = self.get_field(field, from_old=from_old)
            if value:
                return str(value)
        return None
    
    def get_client_id(self, from_old: bool = False) -> Optional[str]:
        """Get the client_id from the record"""
        for field in ['client_id', 'clientID', 'customer_id', 'customerID']:
            value = self.get_field(field, from_old=from_old)
            if value:
                return str(value)
        return None
    
    def get_scheduled_date(self, from_old: bool = False) -> Optional[str]:
        """Get the scheduled date from the record"""
        for field in ['scheduled_at', 'scheduledAt', 'date', 'appointment_date']:
            value = self.get_field(field, from_old=from_old)
            if value:
                # Format date to YYYY-MM-DD if it's a datetime
                if isinstance(value, str):
                    return value.split('T')[0]
                return str(value)
        return None
    
    def get_status(self, from_old: bool = False) -> Optional[str]:
        """Get the status field from the record"""
        return self.get_field('status', from_old=from_old)
    
    def has_status_changed(self) -> bool:
        """Check if status field changed (for UPDATE events)"""
        if self.event_type != WebhookEventType.UPDATE:
            return False
        
        old_status = self.get_status(from_old=True)
        new_status = self.get_status(from_old=False)
        
        return old_status != new_status
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'event_type': self.event_type.value,
            'table': self.table,
            'record': self.record.to_dict(),
            'old_record': self.old_record.to_dict() if self.old_record else None,
            'schema': self.schema,
            'trigger': self.trigger,
            'timestamp': self.timestamp.isoformat(),
            'raw_payload': self.raw_payload,
        }


class SupabaseWebhook:
    """
    Supabase webhook handler with signature validation
    """
    
    def __init__(self, webhook_secret: str):
        """
        Initialize webhook handler
        
        Args:
            webhook_secret: Secret key for signature validation
        """
        self.webhook_secret = webhook_secret
        self._signature_header = 'x-webhook-signature'
        self._signature_prefix = 'sha256='
    
    def verify_signature(
        self,
        payload: str,
        signature: str,
        secret: Optional[str] = None
    ) -> bool:
        """
        Verify webhook signature using HMAC-SHA256
        
        Args:
            payload: Raw payload string
            signature: Signature from X-Webhook-Signature header
            secret: Optional custom secret (uses default if not provided)
            
        Returns:
            True if signature is valid
            
        Raises:
            WebhookSignatureError: If signature is invalid
        """
        secret = secret or self.webhook_secret
        
        # Remove prefix if present
        if signature.startswith(self._signature_prefix):
            signature = signature[len(self._signature_prefix):]
        
        # Compute expected signature
        expected = hmac.new(
            key=secret.encode('utf-8'),
            msg=payload.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # Compare signatures in constant time to prevent timing attacks
        if not hmac.compare_digest(expected, signature):
            raise WebhookSignatureError(
                f"Invalid signature. Expected: {expected}, Got: {signature}"
            )
        
        return True
    
    def parse_event(self, payload: str, signature: Optional[str] = None) -> WebhookEvent:
        """
        Parse and validate webhook payload
        
        Args:
            payload: Raw JSON payload string
            signature: Signature from X-Webhook-Signature header (optional if validation disabled)
            
        Returns:
            WebhookEvent instance
            
        Raises:
            WebhookValidationError: If payload is invalid
            WebhookSignatureError: If signature is invalid
        """
        # Verify signature if provided
        if signature and self.webhook_secret:
            self.verify_signature(payload, signature)
        
        # Parse JSON
        try:
            data = json.loads(payload)
        except json.JSONDecodeError as e:
            raise WebhookValidationError(f"Invalid JSON payload: {e}")
        
        # Validate and create event
        return WebhookEvent.from_dict(data)
    
    def process_event(self, payload: str, signature: Optional[str] = None) -> WebhookEvent:
        """
        Process webhook event with full validation
        
        Args:
            payload: Raw JSON payload string
            signature: Signature from X-Webhook-Signature header
            
        Returns:
            WebhookEvent instance
            
        log:
            Info/Warning/Error messages for the processing flow
        """
        start_time = datetime.now(UTC)
        
        try:
            event = self.parse_event(payload, signature)
            
            duration_ms = (datetime.now(UTC) - start_time).total_seconds() * 1000
            logger.info(
                f"Webhook event processed successfully: "
                f"{event.event_type.value} on {event.table} "
                f"(duration: {duration_ms:.2f}ms)"
            )
            
            return event
            
        except WebhookSignatureError as e:
            logger.error(f"Webhook signature validation failed: {e}")
            raise
            
        except WebhookValidationError as e:
            logger.error(f"Webhook payload validation failed: {e}")
            raise
            
        except Exception as e:
            logger.error(f"Unexpected error processing webhook: {e}")
            raise WebhookError(f"Webhook processing failed: {e}")
    
    def set_signature_header(self, header: str):
        """
        Set custom signature header name
        
        Args:
            header: Header name (e.g., 'x-webhook-signature')
        """
        self._signature_header = header


# ==================== Helper Functions ====================

def is_valid_webhook(payload: Dict[str, Any]) -> bool:
    """
    Quick validation check for webhook payload
    
    Args:
        payload: Payload dictionary
        
    Returns:
        True if payload has minimum required fields
    """
    required = ['type', 'table', 'record']
    return all(field in payload for field in required)


def extract_signature(headers: Dict[str, str], header_name: str = None) -> Optional[str]:
    """
    Extract signature from headers (case-insensitive)
    
    Args:
        headers: Headers dictionary
        header_name: Specific header name (uses default if not provided)
        
    Returns:
        Signature string or None if not found
    """
    if header_name:
        # Try exact match and lowercase
        for key in [header_name, header_name.lower(), header_name.replace('-', '_')]:
            if key in headers:
                return headers[key]
    else:
        # Try common signature header names
        common_names = [
            'x-webhook-signature',
            'x-supabase-webhook-signature',
            'webhook-signature',
            'signature',
        ]
        for name in common_names:
            value = extract_signature(headers, name)
            if value:
                return value
    
    return None
