"""
Custom Exceptions for BarberZap Backend
Provides structured error classes with HTTP status codes
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import traceback


class BaseAPIError(Exception):
    """
    Base class for all API errors
    
    Attributes:
        status_code: HTTP status code
        error_code: Internal error code
        message: Error message (public)
        detail: Detailed error information (private/dev)
        context: Additional context for the error
        recoverable: Whether the error is recoverable
    """
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "SERVER_ERROR",
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        recoverable: bool = True,
        recovery_suggestions: Optional[List[str]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.detail = detail or message
        self.context = context or {}
        self.recoverable = recoverable
        self.recovery_suggestions = recovery_suggestions or []
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for API response"""
        return {
            "error": self.error_code,
            "message": self.message,
            "status": self.status_code,
            "recoverable": self.recoverable,
        }
    
    def to_dict_with_detail(self) -> Dict[str, Any]:
        """Convert error to dictionary with additional detail (dev mode)"""
        result = self.to_dict()
        result.update({
            "detail": self.detail,
            "context": self.context,
            "recovery_suggestions": self.recovery_suggestions,
        })
        return result


class ValidationError(BaseAPIError):
    """Validation error (400)"""
    
    def __init__(
        self,
        message: str = "Validation error",
        field: Optional[str] = None,
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        error_code = "VALIDATION_ERROR"
        if field:
            error_code = f"VALIDATION_{field.upper()}_ERROR"
        
        super().__init__(
            message=message,
            status_code=400,
            error_code=error_code,
            detail=detail,
            context=context or {},
            recoverable=True,
            recovery_suggestions=[
                "Check that all required fields are filled",
                "Verify that values are in the correct format",
            ],
        )
        
        if field:
            self.context["field"] = field


class AuthenticationError(BaseAPIError):
    """Authentication error (401)"""
    
    def __init__(
        self,
        message: str = "Authentication required",
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTH_ERROR",
            detail=detail,
            context=context or {},
            recoverable=True,
            recovery_suggestions=[
                "Please log in to access this resource",
                "Check your credentials and try again",
            ],
        )


class TokenExpiredError(AuthenticationError):
    """Token expired error (401)"""
    
    def __init__(
        self,
        message: str = "Token has expired",
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            detail=detail or "Authentication token has expired. Please log in again.",
            context=context,
        )
        self.error_code = "TOKEN_EXPIRED"
        self.recovery_suggestions = ["Please log in to get a new token"]


class AuthorizationError(BaseAPIError):
    """Authorization error (403)"""
    
    def __init__(
        self,
        message: str = "Permission denied",
        required_permission: Optional[str] = None,
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            detail=detail,
            context=context or {},
            recoverable=True,
            recovery_suggestions=[
                "You don't have permission to access this resource",
                "Contact administrator if you believe this is an error",
            ],
        )
        
        if required_permission:
            self.context["required_permission"] = required_permission


class NotFoundError(BaseAPIError):
    """Not found error (404)"""
    
    def __init__(
        self,
        resource: str = "Resource",
        resource_id: Optional[str] = None,
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with ID '{resource_id}' not found"
        
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            detail=detail,
            context=context or {},
            recoverable=True,
            recovery_suggestions=[
                "Verify the ID or URL is correct",
                "The resource may have been removed",
            ],
        )
        
        self.context["resource"] = resource
        if resource_id:
            self.context["resource_id"] = resource_id


class ConflictError(BaseAPIError):
    """Conflict error (409)"""
    
    def __init__(
        self,
        message: str = "Resource conflict",
        conflict_type: Optional[str] = None,
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        error_code = "CONFLICT"
        if conflict_type:
            error_code = f"CONFLICT_{conflict_type.upper()}"
        
        super().__init__(
            message=message,
            status_code=409,
            error_code=error_code,
            detail=detail,
            context=context or {},
            recoverable=True,
            recovery_suggestions=[
                "The resource may have been modified by another user",
                "Try refreshing and resubmitting",
            ],
        )
        
        if conflict_type:
            self.context["conflict_type"] = conflict_type


class InternalServerError(BaseAPIError):
    """Internal server error (500)"""
    
    def __init__(
        self,
        message: str = "Internal server error",
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        original_exception: Optional[Exception] = None,
    ):
        detail_text = detail or "An unexpected error occurred on the server"
        if original_exception:
            detail_text += f": {str(original_exception)}"
            context = context or {}
            context["original_error"] = str(original_exception)
            context["original_error_type"] = type(original_exception).__name__
        
        super().__init__(
            message=message,
            status_code=500,
            error_code="SERVER_ERROR",
            detail=detail_text,
            context=context or {},
            recoverable=True,
            recovery_suggestions=[
                "Try again in a few moments",
                "If the problem persists, contact support",
            ],
        )


class ServiceUnavailableError(BaseAPIError):
    """Service unavailable error (503)"""
    
    def __init__(
        self,
        service: str = "Service",
        message: Optional[str] = None,
        detail: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        message = message or f"{service} is temporarily unavailable"
        
        super().__init__(
            message=message,
            status_code=503,
            error_code="SERVICE_UNAVAILABLE",
            detail=detail,
            context=context or {},
            recoverable=True,
            recovery_suggestions=[
                "The service is temporarily unavailable",
                "Please try again later",
            ],
        )
        
        self.context["service"] = service


def create_error_from_exception(exc: Exception) -> BaseAPIError:
    """
    Create appropriate API error from general exception
    
    Args:
        exc: The exception to convert
        
    Returns:
        BaseAPIError instance
    """
    if isinstance(exc, BaseAPIError):
        return exc
    
    # Handle common exception types
    error_message = str(exc)
    error_type = type(exc).__name__
    
    if error_type == "ValueError":
        return ValidationError(detail=error_message)
    if error_type == "KeyError":
        return ValidationError(
            message="Missing required data",
            detail=f"Missing key: {error_message}",
            context={"missing_key": error_message},
        )
    if error_type == "PermissionError":
        return AuthorizationError(detail=error_message)
    if error_type == "ConnectionError":
        return ServiceUnavailableError(
            service="Database",
            message="Unable to connect to database",
            detail=error_message,
        )
    
    # Default: wrap in InternalServerError
    return InternalServerError(
        detail=error_message,
        original_exception=exc,
    )


def get_serialized_error(exc: Exception, include_detail: bool = False) -> Dict[str, Any]:
    """
    Get JSON-serializable error representation
    
    Args:
        exc: The exception
        include_detail: Whether to include detail (dev mode)
        
    Returns:
        Dictionary with error information
    """
    if isinstance(exc, BaseAPIError):
        return exc.to_dict_with_detail() if include_detail else exc.to_dict()
    
    # For regular exceptions
    api_exc = create_error_from_exception(exc)
    result = api_exc.to_dict()
    
    if include_detail:
        result.update({
            "detail": str(exc),
            "error_type": type(exc).__name__,
        })
    
    return result
