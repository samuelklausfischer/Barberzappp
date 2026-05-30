"""
FastAPI Webhook Integration Example

This file demonstrates how to integrate the Supabase webhook system
with a FastAPI application.
"""

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from .webhook_handler import create_supabase_webhook_router, create_webhook_handler
from .retry_queue import create_retry_queue, create_retry_worker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== Application Lifecycle ====================

# Global references for cleanup
retry_worker = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    
    Starts the retry worker on startup and shuts it down gracefully.
    """
    global retry_worker
    
    # Startup: Initialize components and start worker
    logger.info("Starting BarberZap webhook service...")
    
    # Create retry queue
    retry_queue = create_retry_queue()
    
    # Create webhook handler
    handler = create_webhook_handler(
        webhook_secret=None,  # Will use SUPABASE_WEBHOOK_SECRET env var
        retry_queue=retry_queue,
        require_signature=True  # Enforce signature validation in production
    )
    
    # Start retry worker (polls every 5 seconds)
    retry_worker = create_retry_worker(retry_queue, handler, poll_interval=5.0)
    await retry_worker.start()
    
    logger.info("Webhook service started successfully")
    
    yield
    
    # Shutdown: Stop worker
    logger.info("Shutting down webhook service...")
    if retry_worker:
        await retry_worker.stop()
    logger.info("Webhook service stopped")


# ==================== FastAPI App ====================

# Create FastAPI app with lifespan
app = FastAPI(
    title="BarberZap Webhook Service",
    description="Supabase webhook endpoint for cache invalidation",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Webhook Routes ====================

# Include webhook router
webhook_router = create_supabase_webhook_router(
    webhook_secret=None,  # Will use SUPABASE_WEBHOOK_SECRET env var
    retry_queue=None,     # Will be managed by lifespan
    path="/webhooks/supabase"
)
app.include_router(webhook_router)


# ==================== Additional Routes ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "BarberZap Webhook Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "webhook": "/webhooks/supabase/{signature}",
            "webhook_no_sig": "/webhooks/supabase",
            "health": "/webhooks/supabase/health",
            "metrics": "/metrics"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "barberzap-webhook",
        "components": {
            "webhook": "healthy",
            "retry_queue": "healthy" if retry_worker else "not_running"
        }
    }


# ==================== Manual Webhook Route (Alternative) ====================

# If you want more control over the webhook endpoint,
# you can create a custom route instead of using the router:

# @app.post("/webhooks/supabase/{signature}")
# async def custom_supabase_webhook(signature: str, request: Request):
#     """
#     Custom webhook endpoint with additional logic
#     """
#     try:
#         # Read payload
#         payload = await request.body()
#         headers = dict(request.headers)
#
#         # Process webhook
#         handler = create_webhook_handler(require_signature=True)
#         result = await handler.handle_webhook(
#             payload=payload.decode(),
#             headers=headers,
#             signature_header=f"sha256={signature}"
#         )
#
#         # Log extra information
#         logger.info(f"Webhook processed: {result['status']}")
#
#         return JSONResponse(
#             content=result,
#             status_code=result['status_code']
#         )
#
#     except Exception as e:
#         logger.error(f"Webhook error: {e}", exc_info=True)
#         return Response(
#             content='{"error":"Internal server error"}',
#             status_code=500,
#             media_type="application/json"
#         )


# ==================== Development Server ====================

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting development server...")
    
    uvicorn.run(
        "fastapi_example:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )
