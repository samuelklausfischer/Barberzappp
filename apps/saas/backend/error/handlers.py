"""
Error Handlers and Middlewares for BarberZap Backend
Provides consistent error responses across all endpoints
"""

import time
from typing import Any, Callable, Dict, Optional, Tuple
import traceback

from .exceptions import (
    BaseAPIError,
    create_error_from_exception,
    get_serialized_error,
)
from .logger import (
    get_error_handler,
    generate_correlation_id,
    set_correlation_id,
    get_correlation_id,
)


class ErrorHandlerMixin:
    """
    Mixin class to add error handling to web frameworks
    Can be used with FastAPI, Flask, or other frameworks
    """
    
    def __init__(self, include_stack_trace: bool = False):
        self.include_stack_trace = include_stack_trace
        self.error_handler = get_error_handler()
    
    def handle_exception(self, exc: Exception) -> Tuple[Dict[str, Any], int]:
        """
        Convert exception to API response
        
        Args:
            exc: The exception to handle
            
        Returns:
            Tuple of (response_dict, status_code)
        """
        # Generate correlation ID if not set
        correlation_id = get_correlation_id()
        if not correlation_id:
            correlation_id = generate_correlation_id()
            set_correlation_id(correlation_id)
        
        # Convert exception to API error
        if isinstance(exc, BaseAPIError):
            api_error = exc
        else:
            api_error = create_error_from_exception(exc)
        
        # Log the error
        self.error_handler.log_error(
            message=api_error.message,
            error=exc if not isinstance(exc, BaseAPIError) else None,
            error_code=api_error.error_code,
            context=api_error.context,
            level="ERROR" if api_error.status_code >= 500 else "WARNING",
        )
        
        # Build response
        response = get_serialized_error(
            exc,
            include_detail=self.include_stack_trace or api_error.status_code >= 500,
        )
        
        # Add correlation ID
        response['correlation_id'] = correlation_id
        
        return response, api_error.status_code


def create_error_middleware(
    app: Any,
    framework: str = "auto",
    include_stack_trace: bool = False,
) -> Any:
    """
    Create error handling middleware for different frameworks
    
    Args:
        app: The application instance
        framework: Framework type ('fastapi', 'flask', 'auto')
        include_stack_trace: Include stack traces in error responses
        
    Returns:
        Modified application
    """
    error_handler = ErrorHandlerMixin(include_stack_trace=include_stack_trace)
    
    # Auto-detect framework if needed
    if framework == "auto":
        if "FastAPI" in str(type(app)):
            framework = "fastapi"
        elif "Flask" in str(type(app)):
            framework = "flask"
        else:
            # Fall back to simple decorator
            return error_handler
    
    if framework == "fastapi":
        return _setup_fastapi_error_handler(app, error_handler)
    elif framework == "flask":
        return _setup_flask_error_handler(app, error_handler)
    
    return error_handler


def _setup_fastapi_error_handler(app: Any, error_handler: ErrorHandlerMixin) -> Any:
    """Setup error handler for FastAPI"""
    try:
        from fastapi import Request
        from fastapi.responses import JSONResponse
        from fastapi.exceptions import RequestValidationError, HTTPException
        from pydantic import ValidationError
        
        @app.exception_handler(BaseAPIError)
        async def handle_base_api_error(request: Request, exc: BaseAPIError):
            response, status_code = error_handler.handle_exception(exc)
            return JSONResponse(status_code=status_code, content=response)
        
        @app.exception_handler(RequestValidationError)
        async def handle_validation_error(request: Request, exc: RequestValidationError):
            # Generate correlation ID
            correlation_id = get_correlation_id()
            if not correlation_id:
                correlation_id = generate_correlation_id()
                set_correlation_id(correlation_id)
            
            # Build error details
            errors = exc.errors()
            response = {
                "error": "VALIDATION_ERROR",
                "message": "Invalid request data",
                "details": errors,
                "correlation_id": correlation_id,
            }
            
            # Log validation error
            error_handler.error_handler.log_warning(
                "Validation error",
                context={"errors": errors, "path": str(request.url)},
            )
            
            return JSONResponse(status_code=422, content=response)
        
        @app.exception_handler(HTTPException)
        async def handle_http_exception(request: Request, exc: HTTPException):
            response = {
                "error": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "correlation_id": get_correlation_id(),
            }
            return JSONResponse(status_code=exc.status_code, content=response)
        
        @app.exception_handler(Exception)
        async def handle_unexpected_exception(request: Request, exc: Exception):
            response, status_code = error_handler.handle_exception(exc)
            return JSONResponse(status_code=status_code, content=response)
        
    except ImportError:
        # FastAPI not available
        pass
    
    return app


def _setup_flask_error_handler(app: Any, error_handler: ErrorHandlerMixin) -> Any:
    """Setup error handler for Flask"""
    from flask import jsonify
    
    @app.errorhandler(BaseAPIError)
    def handle_base_api_error(exc: BaseAPIError):
        response, status_code = error_handler.handle_exception(exc)
        return jsonify(response), status_code
    
    @app.errorhandler(400)
    def handle_bad_request(exc):
        response = {
            "error": "BAD_REQUEST",
            "message": str(exc),
            "correlation_id": get_correlation_id(),
        }
        return jsonify(response), 400
    
    @app.errorhandler(401)
    def handle_unauthorized(exc):
        response = {
            "error": "UNAUTHORIZED",
            "message": "Authentication required",
            "correlation_id": get_correlation_id(),
        }
        return jsonify(response), 401
    
    @app.errorhandler(403)
    def handle_forbidden(exc):
        response = {
            "error": "FORBIDDEN",
            "message": "Permission denied",
            "correlation_id": get_correlation_id(),
        }
        return jsonify(response), 403
    
    @app.errorhandler(404)
    def handle_not_found(exc):
        response = {
            "error": "NOT_FOUND",
            "message": "Resource not found",
            "correlation_id": get_correlation_id(),
        }
        return jsonify(response), 404
    
    @app.errorhandler(409)
    def handle_conflict(exc):
        response = {
            "error": "CONFLICT",
            "message": str(exc),
            "correlation_id": get_correlation_id(),
        }
        return jsonify(response), 409
    
    @app.errorhandler(500)
    def handle_internal_error(exc):
        response, status_code = error_handler.handle_exception(exc)
        return jsonify(response), status_code
    
    @app.errorhandler(Exception)
    def handle_unexpected_exception(exc):
        response, status_code = error_handler.handle_exception(exc)
        return jsonify(response), status_code
    
    return app


def with_error_handling(framework: str = "fastapi"):
    """
    Decorator to add error handling to route handlers
    
    Args:
        framework: Framework type for error handling
        
    Returns:
        Decorator function
    """
    error_handler = ErrorHandlerMixin()
    
    def decorator(func: Callable) -> Callable:
        if framework == "flask":
            from functools import wraps
            
            @wraps(func)
            def wrapper(*args, **kwargs):
                try:
                    return func(*args, **kwargs)
                except BaseAPIError as exc:
                    from flask import jsonify
                    response, status_code = error_handler.handle_exception(exc)
                    return jsonify(response), status_code
                except Exception as exc:
                    response, status_code = error_handler.handle_exception(exc)
                    return jsonify(response), status_code
            
            return wrapper
        
        elif framework == "fastapi":
            # FastAPI handles errors globally
            return func
        
        return func
    
    return decorator


def validate_and_raise(
    condition: bool,
    error_class: type,
    message: str,
    **kwargs,
) -> None:
    """
    Validate condition and raise error if False
    
    Args:
        condition: Condition to check
        error_class: Error class to raise
        message: Error message
        **kwargs: Additional arguments for error class
    """
    if not condition:
        raise error_class(message, **kwargs)


def require_condition(
    condition: bool,
    message: str,
    error_class: type = None,
) -> None:
    """
    Assert condition and raise ValidationError if False
    
    Args:
        condition: Condition to check
        message: Error message if False
        error_class: Custom error class (default: ValidationError)
    """
    from .exceptions import ValidationError as DefaultValidationError
    
    error_cls = error_class or DefaultValidationError
    
    if not condition:
        raise error_cls(message=message)
