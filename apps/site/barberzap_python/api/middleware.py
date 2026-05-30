"""
API Middleware

Custom middleware for authentication, logging, and error handling.
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and responses."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log details.
        
        Args:
            request: Incoming request
            call_next: Next middleware or route handler
        
        Returns:
            Response from next handler
        """
        start_time = time.time()
        
        # Request info
        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Extract tenant ID if available
        tenant_id = request.headers.get("X-Tenant-ID", request.query_params.get("tenant_id", "unknown"))
        
        logger.info(
            f"→ {method} {path} | "
            f"Client: {client_host} | "
            f"Tenant: {tenant_id} | "
            f"User-Agent: {user_agent[:50]}"
        )
        
        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"← {method} {path} | "
                f"Status: {response.status_code} | "
                f"Time: {process_time:.3f}s"
            )
            
            # Add processing time header
            response.headers["X-Process-Time"] = f"{process_time:.3f}"
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"✗ {method} {path} | "
                f"Error: {str(e)} | "
                f"Time: {process_time:.3f}s"
            )
            raise


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract and validate tenant information.
    
    Adds tenant_id to request state for access in endpoints.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Extract tenant info from headers or query params.
        
        Args:
            request: Incoming request
            call_next: Next middleware or route handler
        
        Returns:
            Response from next handler
        """
        # Try to get tenant_id from headers
        tenant_id = request.headers.get("X-Tenant-ID")
        
        # Fall back to query parameter
        if not tenant_id:
            tenant_id = request.query_params.get("tenant_id")
        
        # Store in request state
        if tenant_id:
            request.state.tenant_id = tenant_id
        else:
            request.state.tenant_id = None
        
        return await call_next(request)


class CORSMiddleware(BaseHTTPMiddleware):
    """
    Enhanced CORS middleware for cross-origin requests.
    """
    
    def __init__(self, app: ASGIApp, allow_origins: list = None):
        super().__init__(app)
        self.allow_origins = allow_origins or ["*"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add CORS headers to response.
        """
        response = await call_next(request)
        
        origin = request.headers.get("origin", "*")
        
        # Check if origin is allowed
        if "*" in self.allow_origins or origin in self.allow_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Tenant-ID"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "3600"
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Tenant-ID"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "3600"
        
        return response


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Security middleware for adding security headers.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add security headers to response.
        """
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
