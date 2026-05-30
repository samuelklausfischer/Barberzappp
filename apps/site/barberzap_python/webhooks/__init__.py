"""
Webhooks - External webhook handlers for BarberZap

This package contains webhook handlers for integrating Evolution API
with the BarberZap SaaS platform.
"""

from webhooks.webhook_handler import (
    webhook_barberzap,
    create_barberzap_webhook_route,
    WebhookNormalizer,
    validate_webhook_request,
    is_whatsapp_message,
    is_status_update
)

__all__ = [
    'webhook_barberzap',
    'create_barberzap_webhook_route',
    'WebhookNormalizer',
    'validate_webhook_request',
    'is_whatsapp_message',
    'is_status_update'
]
