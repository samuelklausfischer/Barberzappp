"""
WhatsApp Routes

Endpoints for WhatsApp connection management.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from api.models.whatsapp import (
    WhatsAppConnectionResponse,
    WhatsAppTestMessageRequest,
    WhatsAppTestMessageResponse,
    WhatsAppInstanceInfo
)
from api.deps import get_current_user
from integrations.supabase_rest import SupabaseRestClient
from integrations.evolution_api import send_message as evolution_send_message


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])


@router.get("/connection", response_model=WhatsAppConnectionResponse)
async def check_whatsapp_connection(
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> WhatsAppConnectionResponse:
    """
    Check WhatsApp connection status.
    
    Returns:
        Connection status and details
    """
    try:
        from core.tenant_resolver import get_tenant_instance_info
        
        tenant_id = str(user.get("tenant_id", user.get("id", "1")))
        
        # Get instance info
        instances = client.get(
            'whatsapp_instances',
            filters={'user_id': f'eq.{tenant_id}'}
        )
        
        if not instances:
            return WhatsAppConnectionResponse(
                connected=False,
                status="no_instance",
                instance_name=None
            )
        
        instance = instances[0]
        instance_name = instance.get('instance_name')
        
        instance_info = get_tenant_instance_info(instance_name, tenant_id)
        
        # For now, simulate connection status
        # In production, query Evolution API for actual status
        is_connected = instance_info.get('status') == 'active' if instance_info else False
        
        return WhatsAppConnectionResponse(
            connected=is_connected,
            instance_name=instance_name,
            status=instance_info.get('status', 'unknown') if instance_info else 'unknown',
            phone_connected=instance.get('phone_number') if instance else None,
            last_activity=instance.get('updated_at', datetime.utcnow()) if instance else None,
            uptime_seconds=None  # TODO: Calculate
        )
        
    except Exception as e:
        logger.error(f"Error checking WhatsApp connection: {e}")
        return WhatsAppConnectionResponse(
            connected=False,
            status="error",
            error=str(e)
        )


@router.get("/instance", response_model=WhatsAppInstanceInfo)
async def get_whatsapp_instance(
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> WhatsAppInstanceInfo:
    """
    Get WhatsApp instance information.
    
    Returns:
        Instance details
    """
    try:
        from core.tenant_resolver import get_tenant_instance_info
        
        tenant_id = str(user.get("tenant_id", user.get("id", "1")))
        
        instances = client.get(
            'whatsapp_instances',
            filters={'user_id': f'eq.{tenant_id}'}
        )
        
        if not instances:
            raise HTTPException(status_code=404, detail="No WhatsApp instance found")
        
        instance = instances[0]
        instance_name = instance.get('instance_name')
        
        instance_info = get_tenant_instance_info(instance_name, tenant_id)
        
        return WhatsAppInstanceInfo(
            instance_name=instance_name,
            status=instance_info.get('status', 'unknown') if instance_info else 'unknown',
            connected=instance_info.get('status') == 'active' if instance_info else False,
            phone_number=instance.get('phone_number') if instance else None,
            profile_picture=None,
            battery_level=None,
            platform=None,
            created_at=instance.get('created_at') if instance else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting WhatsApp instance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-message", response_model=WhatsAppTestMessageResponse)
async def send_test_message(
    request: WhatsAppTestMessageRequest,
    user: dict = Depends(get_current_user),
    client: SupabaseRestClient = Depends(lambda: __import__('api.deps', fromlist=['get_client']).get_client())
) -> WhatsAppTestMessageResponse:
    """
    Send test WhatsApp message.
    
    Args:
        request: Test message request
    
    Returns:
        Send message response
    """
    try:
        from core.tenant_resolver import get_tenant_instance_info
        
        tenant_id = str(user.get("tenant_id", user.get("id", "1")))
        
        # Get instance
        instances = client.get(
            'whatsapp_instances',
            filters={'user_id': f'eq.{tenant_id}'}
        )
        
        if not instances:
            raise HTTPException(status_code=404, detail="No WhatsApp instance configured")
        
        instance = instances[0]
        instance_name = instance.get('instance_name')
        
        # Send message
        result = evolution_send_message(
            instance_name=instance_name,
            phone=request.phone,
            message=request.message
        )
        
        return WhatsAppTestMessageResponse(
            success=result.get('success', False),
            message_id=result.get('message_id'),
            phone=request.phone,
            message=request.message,
            sent_at=datetime.utcnow(),
            status="sent" if result.get('success') else "failed",
            error=result.get('error'),
            delivery_attempts=1
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test message: {e}")
        return WhatsAppTestMessageResponse(
            success=False,
            phone=request.phone,
            message=request.message,
            sent_at=datetime.utcnow(),
            status="failed",
            error=str(e),
            delivery_attempts=1
        )
