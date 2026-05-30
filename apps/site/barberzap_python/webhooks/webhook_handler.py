"""
BarberZap Webhook Handler - Evolution API Webhook Receiver

Receives and processes webhooks from Evolution API for the BarberZap SaaS.

Workflow:
1. Normalizer: Extracts instance_name, sender, message, client_name, event
2. Tenant Resolution: resolve_tenant(instance_name)
3. Context Building: build_context(tenant_id)
4. Secretária: generate_response(instance_name, phone, message, context)
5. CRM Logging: upsert_lead() + log_message()
6. Evolution API: send_message(instance_name, phone, response)

FASE 6 - Converter BarberZap do N8N → Python
"""

import logging
from typing import Dict, Optional, Any, TYPE_CHECKING
from datetime import datetime

# Conditional imports for type checking
if TYPE_CHECKING:
    from fastapi import Request
    from fastapi.responses import JSONResponse

# Core imports
from core.tenant_resolver import resolve_tenant, TenantResolutionError
from core.context_builder import build_context

# Agents imports
from agents.secretaria_universal import generate_response

# CRM imports
from crm.crm_manager import upsert_lead, log_message, log_conversation

# Integration imports
from integrations.evolution_api import send_message as evolution_send_message


# Configuração de logging
logger = logging.getLogger(__name__)

# Lazy import function for FastAPI at runtime
def get_fastapi_types():
    """Lazy import FastAPI types to avoid import errors."""
    try:
        from fastapi import Request as FastAPIRequest
        from fastapi.responses import JSONResponse as FastAPIJSONResponse
        return FastAPIRequest, FastAPIJSONResponse
    except ImportError:
        logger.warning("FastAPI not installed, some functions will not work")
        return None, None


# ============= NORMALIZER =============

class WebhookNormalizer:
    """Normalizes Evolution API webhook payload."""

    @staticmethod
    def normalize(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes Evolution API webhook payload.

        Extracts:
        - instance_name: Instance name from Evolution API
        - sender: Phone number (clean format, without @s.whatsapp.net)
        - message: Message content
        - client_name: Client name (from pushName)
        - event: Event type

        Args:
            payload: Raw webhook payload from Evolution API

        Returns:
            Dict with normalized fields:
                {
                    'instance_name': str,
                    'sender': str,  # clean phone number
                    'message': str,
                    'client_name': Optional[str],
                    'event': str,
                    'raw_payload': dict,  # Original payload for reference
                    'is_valid': bool,
                    'should_process': bool
                }

        Example:
            >>> payload = {
            ...     "event": "messages.upsert",
            ...     "instance": {"instanceName": "barbearia_001"},
            ...     "data": [{
            ...         "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
            ...         "message": {"conversation": "Olá, quero agendar"},
            ...         "pushName": "João Silva"
            ...     }]
            ... }
            >>> normalized = WebhookNormalizer.normalize(payload)
            >>> print(normalized['sender'])
            '5511999999999'
            >>> print(normalized['client_name'])
            'João Silva'
        """
        normalized = {
            'instance_name': None,
            'sender': None,
            'message': None,
            'client_name': None,
            'event': 'unknown',
            'raw_payload': payload,
            'is_valid': False,
            'should_process': False
        }

        try:
            # Extract instance name
            instance = payload.get('instance', {})
            normalized['instance_name'] = instance.get('instanceName')

            # Extract event type
            normalized['event'] = payload.get('event', 'unknown')

            # Extract data array
            data = payload.get('data', [])
            if not data:
                logger.warning("No data in webhook payload")
                return normalized

            message_obj = data[0]
            key = message_obj.get('key', {})

            # Extract phone number (JID format: 5511999999999@s.whatsapp.net)
            remote_jid = key.get('remoteJid', '')
            if remote_jid:
                # Remove @s.whatsapp.net suffix
                sender = remote_jid.split('@')[0]
                normalized['sender'] = sender

            # Extract client name
            normalized['client_name'] = message_obj.get('pushName')

            # Extract message content
            message_content = None
            message_type = message_obj.get('message', {})

            # Handle different message types
            if 'conversation' in message_type:
                message_content = message_type['conversation']
            elif 'extendedTextMessage' in message_type:
                message_content = message_type['extendedTextMessage'].get('text')
            elif 'imageMessage' in message_type:
                message_content = message_type['imageMessage'].get('caption', '[Imagem]')
            elif 'videoMessage' in message_type:
                message_content = message_type['videoMessage'].get('caption', '[Vídeo]')
            else:
                message_content = '[Midia]'

            if message_content:
                normalized['message'] = message_content

            # Determine if message should be processed
            # Skip: messages from self, empty messages, non-text events
            from_me = key.get('fromMe', False)
            is_valid = (
                normalized['instance_name'] and
                normalized['sender'] and
                normalized['message'] and
                not from_me
            )

            normalized['is_valid'] = is_valid
            normalized['should_process'] = is_valid and normalized['event'] in [
                'messages.upsert',
                'message'
            ]

            logger.debug(
                f"Normalized webhook: instance={normalized['instance_name']}, "
                f"sender={normalized['sender']}, event={normalized['event']}, "
                f"should_process={normalized['should_process']}"
            )

        except Exception as e:
            logger.error(f"Error normalizing webhook payload: {e}", exc_info=True)

        return normalized


# ============= MAIN WEBHOOK HANDLER =============

async def webhook_barberzap(request: Any) -> Any:
    """
    Main webhook handler for BarberZap SaaS.

    Endpoint: POST /webhook/barberzap-saas

    Receives Evolution API webhooks and processes them through the full pipeline:
    1. Normalizer → Extracts instance_name, sender, message, client_name, event
    2. Tenant Resolution → resolve_tenant(instance_name)
    3. Context Building → build_context(tenant_id)
    4. Secretária → generate_response(instance_name, phone, message, context)
    5. CRM Logging → upsert_lead() + log_message()
    6. Evolution API → send_message(instance_name, phone, response)

    Expected Payload (Evolution API):
    {
        "event": "messages.upsert",
        "instance": {
            "instanceName": "barbearia_001",
            "status": "open"
        },
        "data": [{
            "key": {
                "remoteJid": "5511999999999@s.whatsapp.net",
                "fromMe": false,
                "id": "3EB0..."
            },
            "message": {
                "conversation": "Olá, quero agendar um corte"
            },
            "pushName": "João Silva",
            "timestamp": 1740315600
        }]
    }

    Args:
        request: FastAPI Request object

    Returns:
        JSONResponse with processing result

    Example:
        # Direct call
        response = await webhook_barberzap(request)

        # API returns
        {
            "status": "processed",
            "success": true,
            "tenant_id": "123",
            "instance_name": "barbearia_001",
            "phone": "5511999999999",
            "client_name": "João Silva",
            "response": "Claro! Qual horário prefere?",
            "lead_updated": true,
            "message_sent": true,
            "processing_time_ms": 245
        }
    """
    start_time = datetime.utcnow()

    # Initialize result structure
    result = {
        'status': 'received',
        'success': False,
        'tenant_id': None,
        'instance_name': None,
        'phone': None,
        'client_name': None,
        'message': None,
        'response': None,
        'lead_updated': False,
        'lead_id': None,
        'message_sent': False,
        'error': None,
        'error_details': None,
        'steps': {},
        'processing_time_ms': 0,
        'metadata': {}
    }

    try:
        # ========================
        # STEP 0: Parse payload
        # ========================
        payload = await request.json()
        result['metadata']['raw_event'] = payload.get('event')
        logger.info(f"📩 Webhook received: {payload.get('event')} from instance {payload.get('instance', {}).get('instanceName')}")

        # ========================
        # STEP 1: NORMALIZER
        # ========================
        logger.debug("Step 1: Normalizing webhook payload...")
        normalized = WebhookNormalizer.normalize(payload)

        result['steps']['normalizer'] = {
            'is_valid': normalized['is_valid'],
            'should_process': normalized['should_process'],
            'event': normalized['event']
        }

        # Update result with normalized data
        result['instance_name'] = normalized['instance_name']
        result['phone'] = normalized['sender']
        result['client_name'] = normalized['client_name']
        result['message'] = normalized['message']
        result['metadata']['event'] = normalized['event']

        # Skip processing if message should not be processed
        if not normalized['should_process']:
            logger.info(f"⏭️ Message skipped: should_process={normalized['should_process']}")
            result['status'] = 'skipped'
            result['success'] = True
            result['metadata']['skip_reason'] = 'should_process=false'

            # Try to return JSONResponse, otherwise return dict
            _, JSONResponse = get_fastapi_types()
            if JSONResponse:
                return JSONResponse(content=result)
            return result

        # ========================
        # STEP 2: TENANT RESOLUTION
        # ========================
        logger.debug("Step 2: Resolving tenant...")
        try:
            tenant_id = resolve_tenant(normalized['instance_name'])

            if not tenant_id:
                error_msg = f"Tenant not found for instance: {normalized['instance_name']}"
                logger.warning(error_msg)
                result['status'] = 'error'
                result['error'] = 'instance_not_found'
                result['error_details'] = error_msg

                _, JSONResponse = get_fastapi_types()
                if JSONResponse:
                    return JSONResponse(status_code=404, content=result)
                return result

            result['tenant_id'] = tenant_id
            result['steps']['tenant_resolution'] = {
                'success': True,
                'tenant_id': tenant_id
            }
            logger.debug(f"✅ Tenant resolved: {tenant_id}")

        except TenantInactiveError as e:
            error_msg = f"Tenant inactive: {e}"
            logger.warning(error_msg)
            result['status'] = 'error'
            result['error'] = 'tenant_inactive'
            result['error_details'] = str(e)

            _, JSONResponse = get_fastapi_types()
            if JSONResponse:
                return JSONResponse(status_code=403, content=result)
            return result

        except TenantResolutionError as e:
            error_msg = f"Tenant resolution failed: {e}"
            logger.error(error_msg)
            result['status'] = 'error'
            result['error'] = 'tenant_resolution_failed'
            result['error_details'] = str(e)

            _, JSONResponse = get_fastapi_types()
            if JSONResponse:
                return JSONResponse(status_code=500, content=result)
            return result

        # ========================
        # STEP 3: CONTEXT BUILDING
        # ========================
        logger.debug("Step 3: Building context...")
        context = build_context(tenant_id)

        if not context:
            logger.warning(f"Context not found for tenant: {tenant_id}")
            # Continue with empty context

        result['steps']['context_building'] = {
            'success': context is not None,
            'has_context': context is not None
        }

        # ========================
        # STEP 4: SECRETÁRIA (AI Response)
        # ========================
        logger.debug("Step 4: Generating AI response...")
        ai_result = generate_response(
            instance_name=normalized['instance_name'],
            phone=normalized['sender'],
            message=normalized['message'],
            context_override=context,
            save_user_message=False  # We'll save in CRM step instead
        )

        result['steps']['secretaria'] = {
            'success': ai_result.get('success', False),
            'ai_name': ai_result.get('ai_name'),
            'barbershop_name': ai_result.get('barbershop_name')
        }

        if not ai_result.get('success'):
            error_msg = f"AI generation failed: {ai_result.get('error')}"
            logger.error(error_msg)
            result['status'] = 'error'
            result['error'] = 'ai_generation_failed'
            result['error_details'] = error_msg

            _, JSONResponse = get_fastapi_types()
            if JSONResponse:
                return JSONResponse(status_code=500, content=result)
            return result

        result['response'] = ai_result['response']
        logger.debug(f"✅ AI response generated: {result['response'][:50]}...")

        # ========================
        # STEP 5: CRM LOGGING
        # ========================
        logger.debug("Step 5: Logging to CRM...")
        crm_result = log_conversation(
            user_id=tenant_id,
            phone=normalized['sender'],
            client_name=normalized['client_name'],
            inbound_message=normalized['message'],
            outbound_message=ai_result['response'],
            metadata={
                'instance_name': normalized['instance_name'],
                'ai_name': ai_result.get('ai_name'),
                'ai_model': ai_result.get('metadata', {}).get('model'),
                'event': normalized['event']
            }
        )

        result['steps']['crm_logging'] = {
            'success': crm_result.get('success', False),
            'messages_logged': crm_result.get('messages_logged', 0),
            'errors': crm_result.get('errors', [])
        }

        if crm_result.get('success'):
            result['lead_updated'] = True
            result['lead_id'] = crm_result.get('lead_id')
            logger.debug(f"✅ CRM logged: lead_id={result['lead_id']}")
        else:
            logger.warning(f"CRM logging partially failed: {crm_result.get('errors')}")
            result['lead_updated'] = False

        # ========================
        # STEP 6: EVOLUTION API - SEND MESSAGE
        # ========================
        logger.debug("Step 6: Sending message via Evolution API...")
        evolution_response = evolution_send_message(
            instance_name=normalized['instance_name'],
            phone=normalized['sender'],
            message=ai_result['response']
        )

        result['steps']['evolution_api'] = {
            'success': evolution_response.get('success', False),
            'message_id': evolution_response.get('message_id')
        }

        if evolution_response.get('success'):
            result['message_sent'] = True
            logger.debug(f"✅ Message sent: {evolution_response.get('message_id')}")
        else:
            logger.warning(f"Evolution API send failed: {evolution_response.get('error')}")
            result['message_sent'] = False
            result['metadata']['evolution_error'] = evolution_response.get('error')

        # ========================
        # FINALIZE
        # ========================
        result['status'] = 'processed'
        result['success'] = True
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        result['processing_time_ms'] = round(processing_time, 2)

        logger.info(
            f"✅ Webhook processed successfully: "
            f"{normalized['instance_name']} -> {normalized['sender']} "
            f"({result['processing_time_ms']}ms)"
        )

        _, JSONResponse = get_fastapi_types()
        if JSONResponse:
            return JSONResponse(content=result)
        return result

    except Exception as e:
        error_msg = f"Unexpected error in webhook handler: {e}"
        logger.error(error_msg, exc_info=True)

        result['status'] = 'error'
        result['error'] = 'unexpected_error'
        result['error_details'] = str(e)
        result['processing_time_ms'] = round(
            (datetime.utcnow() - start_time).total_seconds() * 1000, 2
        )

        _, JSONResponse = get_fastapi_types()
        if JSONResponse:
            return JSONResponse(status_code=500, content=result)
        return result


# ============= WEBHOOK HELPER FUNCTIONS =============

def validate_webhook_request(request: Any) -> tuple[bool, Optional[str], Optional[Dict]]:
    """
    Validates webhook request before processing.

    Args:
        request: FastAPI Request object

    Returns:
        tuple: (is_valid, error_message, payload)
    """
    try:
        # Check content type
        content_type = request.headers.get('content-type', '')
        if 'application/json' not in content_type:
            return False, "Content-Type must be application/json", None

        # Validate payload structure (lazy)
        # Will be fully validated in normalize step

        return True, None, None

    except Exception as e:
        return False, f"Validation error: {e}", None


def is_whatsapp_message(payload: Dict) -> bool:
    """
    Checks if webhook payload is a valid WhatsApp message event.

    Args:
        payload: Webhook payload

    Returns:
        True if payload is a WhatsApp message event
    """
    event = payload.get('event', '')
    return event in ['messages.upsert', 'message']


def is_status_update(payload: Dict) -> bool:
    """
    Checks if webhook payload is a status update (connection state, etc.).

    Args:
        payload: Webhook payload

    Returns:
        True if payload is a status update
    """
    event = payload.get('event', '')
    return event in ['connection.update', 'presence.update', 'status.update']


# ============= FASTAPI ROUTE FACTORY =============

def create_barberzap_webhook_route(app: Any) -> None:
    """
    Factory function to register the webhook route.

    Usage:
        from webhooks.webhook_handler import create_barberzap_webhook_route

        app = FastAPI(...)

        # Register webhook
        create_barberzap_webhook_route(app)
    """
    app.add_api_route(
        path="/webhook/barberzap-saas",
        endpoint=webhook_barberzap,
        methods=["POST"],
        tags=["Webhooks"],
        summary="BarberZap SaaS Main Webhook",
        description="""
        Receives and processes Evolution API webhooks for the BarberZap SaaS.

        **Workflow:**
        1. Normalizer: Extracts instance_name, sender, message, client_name, event
        2. Tenant Resolution: resolve_tenant(instance_name)
        3. Context Building: build_context(tenant_id)
        4. Secretária: generate_response(instance_name, phone, message, context)
        5. CRM Logging: upsert_lead() + log_message()
        6. Evolution API: send_message(instance_name, phone, response)

        **Expected Payload:**
        ```json
        {
            "event": "messages.upsert",
            "instance": {
                "instanceName": "barbearia_001"
            },
            "data": [{
                "key": {
                    "remoteJid": "5511999999999@s.whatsapp.net",
                    "fromMe": false
                },
                "message": {
                    "conversation": "Olá, quero agendar um corte"
                },
                "pushName": "João Silva"
            }]
        }
        ```
        """
    )


# ============= STANDALONE TESTING =============

if __name__ == "__main__":
    import asyncio
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    # Create test app
    test_app = FastAPI()
    create_barberzap_webhook_route(test_app)

    # Test payload
    test_payload = {
        "event": "messages.upsert",
        "instance": {
            "instanceName": "barbearia_001",
            "status": "open"
        },
        "data": [{
            "key": {
                "remoteJid": "5511999999999@s.whatsapp.net",
                "fromMe": False,
                "id": "3EB0FAED6CC5D57E"
            },
            "message": {
                "conversation": "Olá, quero agendar um corte para sexta às 14h"
            },
            "pushName": "João Silva",
            "timestamp": 1740315600
        }]
    }

    # Run async test
    async def test_webhook():
        from unittest.mock import Mock
        mock_request = Mock()
        mock_request.json = asyncio.coroutine(lambda: test_payload)
        mock_request.headers = {"content-type": "application/json"}

        response = await webhook_barberzap(mock_request)
        return response

    print("=" * 70)
    print("BarberZap Webhook Handler - Test")
    print("=" * 70)

    # Test normalizer
    print("\n🔧 Testing WebhookNormalizer...")
    normalized = WebhookNormalizer.normalize(test_payload)
    print(f"Instance: {normalized['instance_name']}")
    print(f"Sender: {normalized['sender']}")
    print(f"Client Name: {normalized['client_name']}")
    print(f"Message: {normalized['message']}")
    print(f"Event: {normalized['event']}")
    print(f"Is Valid: {normalized['is_valid']}")
    print(f"Should Process: {normalized['should_process']}")

    # Test validators
    print("\n🔍 Testing validators...")
    print(f"Is WhatsApp message: {is_whatsapp_message(test_payload)}")
    print(f"Is status update: {is_status_update(test_payload)}")

    print("\n" + "=" * 70)
    print("✨ Tests complete!")
    print("=" * 70)
