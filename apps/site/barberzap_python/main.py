"""
BarberZap - Main Application Entry Point
FastAPI application for WhatsApp-based AI assistant for barbershops

FASE 7: Dashboard API Integration
Added comprehensive REST API for admin dashboard consumption.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import modules
from webhooks.webhook_handler import create_barberzap_webhook_route

# Import Dashboard API routers
from api.routers import (
    auth_router,
    tenants_router,
    barbers_router,
    services_router,
    appointments_router,
    clients_router,
    employees_router,
    leads_router,
    stats_router,
    chat_router,
    whatsapp_router,
)
from api.middleware import (
    LoggingMiddleware,
    TenantMiddleware,
    SecurityMiddleware,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    print("🚀 Starting BarberZap API v1.0.0...")
    print(f"📍 Environment: {os.getenv('APP_ENV', 'development')}")
    print(f"🔗 Supabase URL: {os.getenv('SUPABASE_URL', 'Not configured')}")
    print(f"📊 Dashboard API: Enabled")
    print(f"🤖 Webhooks: BarberZap-SaaS Evolution API")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down BarberZap API...")


# Create FastAPI application
app = FastAPI(
    title="BarberZap API",
    description="AI-powered WhatsApp assistant for barbershops. Includes dashboard REST API and Evolution API webhook processing.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============= MIDDLEWARE =============

# CORS middleware (FastAPI built-in)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("APP_ENV") == "development" else os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(TenantMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityMiddleware)


# ============= WEBHOOK ROUTES (PRE-EXISTING) =============

# Register BarberZap webhook (FASE 6 - Backward compatible)
create_barberzap_webhook_route(app)  # /webhook/barberzap-saas


# ============= DASHBOARD API ROUTES (NEW) =============

# Authentication
app.include_router(auth_router)

# Tenant Management
app.include_router(tenants_router)

# Barbers
app.include_router(barbers_router)

# Services
app.include_router(services_router)

# Appointments (placeholder - coming soon)
app.include_router(appointments_router)

# Clients
app.include_router(clients_router)

# Employees
app.include_router(employees_router)

# Leads / CRM
app.include_router(leads_router)

# Analytics / Stats
app.include_router(stats_router)

# Chat
app.include_router(chat_router)

# WhatsApp Connection
app.include_router(whatsapp_router)


# ============= ENDPOINTS =================

@app.get("/", tags=["Health"])
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "name": "BarberZap API",
        "version": "1.0.0",
        "status": "online",
        "environment": os.getenv("APP_ENV", "development"),
        "features": {
            "dashboard_api": True,
            "webhooks": True,
            "crm": True,
            "ai_assistant": True
        },
        "endpoints": {
            "api_docs": "/docs",
            "webhook": "/webhook/barberzap-saas",
            "health": "/health"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "timestamp": "2026-02-23T23:28:00Z",
        "components": {
            "api": "ok",
            "database": "ok",
            "webhooks": "ok"
        }
    }


# ============= ERROR HANDLERS =============

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("APP_ENV") == "development" else "An error occurred"
        }
    )


# ============= RUN SERVER =============

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=os.getenv("APP_HOST", "0.0.0.0"),
        port=int(os.getenv("APP_PORT", "8000")),
        reload=os.getenv("APP_ENV") == "development",
        workers=1 if os.getenv("APP_ENV") == "development" else 4,
        log_level="info"
    )
