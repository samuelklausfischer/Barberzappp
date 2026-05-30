"""
CRM - Customer Relationship Management for BarberZap

This package provides CRM operations including:
- Lead upsert (upsert_lead)
- Message logging (log_message)
- Full conversation logging (log_conversation)
- Lead history and management
"""

from crm.crm_manager import (
    upsert_lead,
    log_message,
    log_conversation
)

# Also export from crm_logger for backward compatibility
from crm.crm_logger import (
    upsert_lead as upsert_lead_v2,
    log_message as log_message_v2,
    get_lead_history,
    lead_exists,
    get_lead_by_id,
    update_lead_status,
    list_leads,
    get_message_by_id,
    CRMError,
    CRMLeadNotFoundError,
    CRMMessageError
)

__all__ = [
    # From crm_manager (used by webhook_handler)
    'upsert_lead',
    'log_message',
    'log_conversation',
    # From crm_logger (extended functionality)
    'upsert_lead_v2',
    'log_message_v2',
    'get_lead_history',
    'lead_exists',
    'get_lead_by_id',
    'update_lead_status',
    'list_leads',
    'get_message_by_id',
    # Exceptions
    'CRMError',
    'CRMLeadNotFoundError',
    'CRMMessageError',
]
