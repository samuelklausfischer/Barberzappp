"""
Webhook Handler Module

FastAPI route handlers for processing Supabase webhook events.
Supports async processing and proper error handling.
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime, UTC
import os

from .supabase_webhook import (
    SupabaseWebhook,
    WebhookEvent,
    WebhookSignatureError,
    WebhookValidationError,
    WebhookError,
    extract_signature,
)
from .invalidator import CacheInvalidator
from .retry_queue import WebhookRetryQueue

logger = logging.getLogger(__name__)


# ==================== Webhook Handler ====================

class WebhookHandler:
    """
    FastAPI-compatible webhook handler
    
    Features:
    - Signature validation
    - Async processing
    - Automatic retry on failure
    - Comprehensive logging
    - Proper status codes
    """
    
    def __init__(
        self,
        webhook_secret: Optional[str] = None,
        retry_queue: Optional[WebhookRetryQueue] = None,
        require_signature: bool = False
    ):
        """
        Initialize webhook handler
        
        Args:
            webhook_secret: Secret for signature validation (from env if not provided)
            retry_queue: Retry queue for failed webhooks
            require_signature: Whether to require signature validation
        """
        self.webhook_secret = webhook_secret or os.getenv('SUPABASE_WEBHOOK_SECRET', '')
        self.require_signature = require_signature
        self.retry_queue = retry_queue
        
        self.webhook = SupabaseWebhook(self.webhook_secret)
        self.invalidator = CacheInvalidator()
        
        if not self.webhook_secret and require_signature:
            logger.warning(
                "Webhook signature validation required but no secret provided. "
                "Set SUPABASE_WEBHOOK_SECRET environment variable."
            )
    
    async def handle_webhook(
        self,
        payload: str,
        headers: Dict[str, str],
        signature_header: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handle incoming webhook request
        
        Args:
            payload: Raw JSON payload
            headers: HTTP headers
            signature_header: Custom signature header (optional)
            
        Returns:
            Response dict with status and data
            
        Status Codes:
            - 202: Accepted (will be processed in background)
            - 200: Processed successfully (synchronous)
            - 400: Bad request (invalid payload)
            - 401: Unauthorized (invalid signature)
            - 500: Internal server error
        """
        start_time = datetime.now(UTC)
        
        # Extract signature
        signature = signature_header or extract_signature(headers)
        
        # Validate signature if required
        if self.require_signature and not signature:
            logger.warning("Webhook received without signature (validation required)")
            return {
                'status': 'error',
                'status_code': 401,
                'error': 'Signature required but not provided',
            }
        
        try:
            # Parse and validate webhook
            event = self.webhook.process_event(payload, signature)
            
            # Log event details
            logger.info(
                f"Processing webhook: {event.event_type.value} on {event.table}, "
                f"record_id={event.get_id()}, shop_id={event.get_shop_id()}"
            )
            
            # Process cache invalidation (sync for now, can be made async)
            result = await self._process_invalidation(event)
            
            duration_ms = (datetime.now(UTC) - start_time).total_seconds() * 1000
            
            response = {
                'status': 'success',
                'status_code': 200,
                'message': 'Webhook processed successfully',
                'event': {
                    'type': event.event_type.value,
                    'table': event.table,
                    'record_id': event.get_id(),
                    'shop_id': event.get_shop_id(),
                },
                'cache_invalidation': result,
                'duration_ms': round(duration_ms, 2),
                'timestamp': datetime.now(UTC).isoformat(),
            }
            
            logger.info(
                f"Webhook processed successfully in {duration_ms:.2f}ms: "
                f"{event.event_type.value} on {event.table}"
            )
            
            return response
            
        except WebhookSignatureError as e:
            logger.error(f"Webhook signature validation failed: {e}")
            return {
                'status': 'error',
                'status_code': 401,
                'error': 'Invalid signature',
                'details': str(e),
            }
            
        except WebhookValidationError as e:
            logger.error(f"Webhook payload validation failed: {e}")
            return {
                'status': 'error',
                'status_code': 400,
                'error': 'Invalid payload',
                'details': str(e),
            }
            
        except Exception as e:
            logger.error(f"Unexpected error processing webhook: {e}", exc_info=True)
            
            # Add to retry queue if available
            if self.retry_queue:
                try:
                    await self.retry_queue.add_for_retry(
                        payload=payload,
                        headers=headers,
                        error=str(e)
                    )
                    logger.info("Webhook added to retry queue")
                except Exception as retry_error:
                    logger.error(f"Failed to add webhook to retry queue: {retry_error}")
            
            return {
                'status': 'error',
                'status_code': 500,
                'error': 'Internal server error',
                'details': str(e),
            }
    
    async def _process_invalidation(self, event: WebhookEvent) -> Dict[str, Any]:
        """
        Process cache invalidation for an event
        
        Args:
            event: Webhook event
            
        Returns:
            Invalidation result
        """
        # Process in background to avoid blocking response
        task = asyncio.create_task(self._invalidate_async(event))
        return await task
    
    async def _invalidate_async(self, event: WebhookEvent) -> Dict[str, Any]:
        """
        Async cache invalidation
        
        Args:
            event: Webhook event
            
        Returns:
            Invalidation result
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.invalidator.invalidate_event,
            event
        )
    
    def can_process_async(self) -> bool:
        """Check if async processing is available"""
        return True


# ==================== FastAPI Integration ====================

def create_webhook_handler(
    webhook_secret: Optional[str] = None,
    retry_queue: Optional[WebhookRetryQueue] = None,
    require_signature: bool = False
) -> WebhookHandler:
    """
    Factory function to create a webhook handler
    
    Args:
        webhook_secret: Optional webhook secret
        retry_queue: Optional retry queue
        require_signature: Whether to require signature validation
        
    Returns:
        WebhookHandler instance
        
    Example:
        >>> from fastapi import FastAPI, Request
        >>> from barber.webhooks import create_webhook_handler
        >>>
        >>> app = FastAPI()
        >>> handler = create_webhook_handler(require_signature=True)
        >>>
        >>> @app.post("/webhooks/supabase/{signature}")
        >>> async def supabase_webhook(signature: str, request: Request):
        ...     payload = await request.body()
        ...     headers = dict(request.headers)
        ...     result = await handler.handle_webhook(
        ...         payload=payload.decode(),
        ...         headers=headers,
        ...         signature_header=f"sha256={signature}"
        ...     )
        ...     return result
    """
    return WebhookHandler(
        webhook_secret=webhook_secret,
        retry_queue=retry_queue,
        require_signature=require_signature
    )


# ==================== FastAPI Route Example ====================

try:
    from fastapi import APIRouter, Request, Response, status
    from fastapi.responses import JSONResponse
    
    def create_supabase_webhook_router(
        webhook_secret: Optional[str] = None,
        retry_queue: Optional[WebhookRetryQueue] = None,
        path: str = "/webhooks/supabase"
    ) -> APIRouter:
        """
        Create a FastAPI router for Supabase webhooks
        
        Args:
            webhook_secret: Optional webhook secret
            retry_queue: Optional retry queue
            path: Base path for webhook routes
            
        Returns:
            FastAPI APIRouter instance
            
        Example:
            >>> from fastapi import FastAPI
            >>> from barber.webhooks import create_supabase_webhook_router
            >>>
            >>> app = FastAPI()
            >>> webhook_router = create_supabase_webhook_router(require_signature=True)
            >>> app.include_router(webhook_router)
        """
        router = APIRouter()
        handler = create_webhook_handler(webhook_secret, retry_queue)
        
        @router.post(f"{path}/{{signature}}")
        async def supabase_webhook(signature: str, request: Request):
            """
            Supabase webhook endpoint with signature in URL path
            
            Signature is validated against the X-Webhook-Signature header.
            """
            try:
                payload = await request.body()
                headers = dict(request.headers)
                
                result = await handler.handle_webhook(
                    payload=payload.decode(),
                    headers=headers,
                    signature_header=f"sha256={signature}"
                )
                
                return JSONResponse(
                    content=result,
                    status_code=result['status_code']
                )
                
            except Exception as e:
                logger.error(f"Webhook endpoint error: {e}", exc_info=True)
                return JSONResponse(
                    content={
                        'status': 'error',
                        'error': 'Internal server error',
                    },
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        @router.post(f"{path}")
        async def supabase_webhook_no_sig(request: Request):
            """
            Supabase webhook endpoint (signature in header only)
            """
            try:
                payload = await request.body()
                headers = dict(request.headers)
                
                result = await handler.handle_webhook(
                    payload=payload.decode(),
                    headers=headers
                )
                
                return JSONResponse(
                    content=result,
                    status_code=result['status_code']
                )
                
            except Exception as e:
                logger.error(f"Webhook endpoint error: {e}", exc_info=True)
                return JSONResponse(
                    content={
                        'status': 'error',
                        'error': 'Internal server error',
                    },
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        @router.get(f"{path}/health")
        async def webhook_health():
            """Health check endpoint"""
            return {
                'status': 'healthy',
                'service': 'supabase-webhook',
                'timestamp': datetime.now(UTC).isoformat(),
            }
        
        return router
    
except ImportError:
    # FastAPI not available, skip router creation
    def create_supabase_webhook_router(*args, **kwargs):
        raise ImportError("FastAPI is not installed. Cannot create webhook router.")


# ==================== Flask Integration (Optional) ====================

def create_flask_webhook_route(
    app,
    webhook_secret: Optional[str] = None,
    retry_queue: Optional[WebhookRetryQueue] = None,
    path: str = "/webhooks/supabase"
):
    """
    Add Flask route for Supabase webhooks
    
    Args:
        app: Flask application
        webhook_secret: Optional webhook secret
        retry_queue: Optional retry queue
        path: Base path for webhook routes
        
    Example:
        >>> from flask import Flask
        >>> from barber.webhooks import create_flask_webhook_route
        >>>
        >>> app = Flask(__name__)
        >>> create_flask_webhook_route(app, require_signature=True)
    """
    if not hasattr(app, 'async_mode'):
        # Sync Flask app, create sync handler
        handler = WebhookHandler(webhook_secret, retry_queue)
        
        @app.route(f"{path}/<string:signature>", methods=['POST'])
        def supabase_webhook(signature):
            from flask import request, jsonify
            
            payload = request.get_data(as_text=True)
            headers = dict(request.headers)
            
            # Run async handler in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                result = loop.run_until_complete(handler.handle_webhook(
                    payload=payload,
                    headers=headers,
                    signature_header=f"sha256={signature}"
                ))
                return jsonify(result), result['status_code']
            finally:
                loop.close()
        
        @app.route(f"{path}", methods=['POST'])
        def supabase_webhook_no_sig():
            from flask import request, jsonify
            
            payload = request.get_data(as_text=True)
            headers = dict(request.headers)
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                result = loop.run_until_complete(handler.handle_webhook(
                    payload=payload,
                    headers=headers
                ))
                return jsonify(result), result['status_code']
            finally:
                loop.close()
    else:
        # Async Flask app (Quart/Flask 2.0+)
        handler = WebhookHandler(webhook_secret, retry_queue)
        
        @app.route(f"{path}/<string:signature>", methods=['POST'])
        async def supabase_webhook(signature):
            from flask import request, jsonify
            
            payload = await request.get_data(as_text=True)
            headers = dict(request.headers)
            
            result = await handler.handle_webhook(
                payload=payload,
                headers=headers,
                signature_header=f"sha256={signature}"
            )
            return jsonify(result), result['status_code']
        
        @app.route(f"{path}", methods=['POST'])
        async def supabase_webhook_no_sig():
            from flask import request, jsonify
            
            payload = await request.get_data(as_text=True)
            headers = dict(request.headers)
            
            result = await handler.handle_webhook(
                payload=payload,
                headers=headers
            )
            return jsonify(result), result['status_code']
