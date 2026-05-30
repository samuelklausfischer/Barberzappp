"""
Logging Middleware for BarberZap Backend
Logs all requests, responses, and errors with correlation IDs
"""

import time
from typing import Any, Callable, Optional
import json

from .logger import (
    get_error_handler,
    generate_correlation_id,
    set_correlation_id,
    get_correlation_id,
)  


def create_logging_middleware(app: Any, framework: str = "auto") -> Any:
    """
    Create logging middleware for different frameworks
    
    Args:
        app: The application instance
        framework: Framework type ('fastapi', 'flask', 'auto')
        
    Returns:
        Modified application
    """
    # Auto-detect framework if needed
    if framework == "auto":
        if "FastAPI" in str(type(app)):
            framework = "fastapi"
        elif "Flask" in str(type(app)):
            framework = "flask"
    
    if framework == "fastapi":
        return _setup_fastapi_logging_middleware(app)
    elif framework == "flask":
        return _setup_flask_logging_middleware(app)
    
    return app


def _setup_fastapi_logging_middleware(app: Any) -> Any:
    """Setup logging middleware for FastAPI"""
    try:
        from fastapi import Request
        from starlette.middleware.base import BaseHTTPMiddleware
        import starlette.responses
        
        class LoggingMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                # Generate correlation ID
                correlation_id = request.headers.get("X-Correlation-ID") or generate_correlation_id()
                set_correlation_id(correlation_id)
                
                # Extract request info
                method = request.method
                path = request.url.path
                client_ip = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
                user_id = request.headers.get("X-User-ID") or request.state.get("user_id")
                
                # Start timer
                start_time = time.time()
                
                # Process request
                try:
                    response = await call_next(request)
                    
                    # Calculate duration
                    duration_ms = (time.time() - start_time) * 1000
                    
                    # Log request on success
                    error_handler = get_error_handler()
                    error_handler.log_request(
                        method=method,
                        path=path,
                        status_code=response.status_code,
                        duration_ms=duration_ms,
                        client_ip=client_ip,
                        user_agent=user_agent,
                        user_id=user_id,
                    )
                    
                    # Add correlation ID to response headers
                    response.headers["X-Correlation-ID"] = correlation_id
                    
                    return response
                
                except Exception as exc:
                    # Calculate duration even for errors
                    duration_ms = (time.time() - start_time) * 1000
                    
                    # Log error
                    error_handler = get_error_handler()
                    error_handler.log_error(
                        message="Request failed",
                        error=exc,
                        context={
                            "method": method,
                            "path": path,
                            "client_ip": client_ip,
                            "user_agent": user_agent,
                            "user_id": user_id,
                            "duration_ms": duration_ms,
                        },
                    )
                    
                    # Re-raise to let error handler middleware catch it
                    raise
        
        # Add middleware to app
        app.add_middleware(LoggingMiddleware)
        
    except ImportError:
        # FastAPI not available
        pass
    
    return app


def _setup_flask_logging_middleware(app: Any) -> Any:
    """Setup logging middleware for Flask"""
    from flask import request, g
    
    @app.before_request
    def before_request():
        # Generate/extract correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or generate_correlation_id()
        set_correlation_id(correlation_id)
        
        # Store request info in Flask's g object
        g.start_time = time.time()
        g.correlation_id = correlation_id
    
    @app.after_request
    def after_request(response):
        # Calculate duration
        start_time = getattr(g, "start_time", time.time())
        duration_ms = (time.time() - start_time) * 1000
        
        # Log request
        error_handler = get_error_handler()
        error_handler.log_request(
            method=request.method,
            path=request.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            client_ip=request.remote_addr,
            user_agent=request.headers.get("user-agent"),
            user_id=request.headers.get("X-User-ID"),
        )
        
        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = get_correlation_id()
        
        return response
    
    @app.teardown_request
    def teardown_request(exception=None):
        if exception:
            # Log error if exception occurred
            error_handler = get_error_handler()
            error_handler.log_error(
                message="Request teardown error",
                error=exception,
                context={
                    "method": request.method,
                    "path": request.path,
                },
            )
    
    return app


def get_request_context() -> dict:
    """
    Get current request context info
    
    Returns:
        Dictionary with request context
    """
    context = {
        "correlation_id": get_correlation_id(),
    }
    
    # Try to extract framework-specific info
    try:
        # Check for Flask
        from flask import request as flask_request
        context.update({
            "framework": "flask",
            "method": flask_request.method,
            "path": flask_request.path,
            "client_ip": flask_request.remote_addr,
        })
    except:
        try:
            # Check for FastAPI (in async context, this is more complex)
            context["framework"] = "fastapi"
        except:
            context["framework"] = "unknown"
    
    return context


def setup_request_validation(
    app: Any,
    framework: str = "auto",
    max_content_length: int = 10 * 1024 * 1024,  # 10MB default
) -> Any:
    """
    Setup request validation middleware
    
    Args:
        app: The application instance
        framework: Framework type
        max_content_length: Maximum request body size in bytes
        
    Returns:
        Modified application
    """
    if framework == "auto":
        if "FastAPI" in str(type(app)):
            framework = "fastapi"
        elif "Flask" in str(type(app)):
            framework = "flask"
    
    if framework == "flask":
        app.config['MAX_CONTENT_LENGTH'] = max_content_length
    
    return app


def sanitize_log_data(data: Any, sensitive_keys: list = None) -> Any:
    """
    Sanitize data for logging (remove sensitive info)
    
    Args:
        data: Data to sanitize
        sensitive_keys: List of keys to redact
        
    Returns:
        Sanitized data
    """
    if sensitive_keys is None:
        sensitive_keys = [
            'password', 'token', 'secret', 'api_key', 'session',
            'credit_card', 'ssn', 'social_security', 'pin',
            'authorization', 'cookie', 'csrf',
        ]
    
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            if any(sensitive in str(key).lower() for sensitive in sensitive_keys):
                sanitized[key] = "***REDACTED***"
            else:
                sanitized[key] = sanitize_log_data(value, sensitive_keys)
        return sanitized
    
    elif isinstance(data, list):
        return [sanitize_log_data(item, sensitive_keys) for item in data]
    
    else:
        return data


def log_slow_requests(app: Any, threshold_ms: float = 1000.0, framework: str = "auto"):
    """
    Create middleware to log slow requests
    
    Args:
        app: The application instance
        threshold_ms: Threshold in milliseconds
        framework: Framework type
        
    Returns:
        Modified application
    """
    error_handler = get_error_handler()
    
    if framework == "auto":
        if "FastAPI" in str(type(app)):
            framework = "fastapi"
        elif "Flask" in str(type(app)):
            framework = "flask"
    
    if framework == "fastapi":
        from fastapi import Request
        from starlette.middleware.base import BaseHTTPMiddleware
        
        class SlowRequestMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                start_time = time.time()
                response = await call_next(request)
                duration_ms = (time.time() - start_time) * 1000
                
                if duration_ms > threshold_ms:
                    error_handler.log_warning(
                        "Slow request detected",
                        context={
                            "path": request.url.path,
                            "method": request.method,
                            "duration_ms": duration_ms,
                            "threshold_ms": threshold_ms,
                        },
                    )
                
                return response
        
        app.add_middleware(SlowRequestMiddleware)
    
    elif framework == "flask":
        from flask import request, g
        
        @app.after_request
        def log_slow(response):
            if hasattr(g, 'start_time'):
                duration_ms = (time.time() - g.start_time) * 1000
                
                if duration_ms > threshold_ms:
                    error_handler.log_warning(
                        "Slow request detected",
                        context={
                            "path": request.path,
                            "method": request.method,
                            "duration_ms": duration_ms,
                            "threshold_ms": threshold_ms,
                        },
                    )
            
            return response
    
    return app
