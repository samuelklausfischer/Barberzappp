"""
Error Handling Module for BarberZap Backend
Central export of all error-related utilities
"""

# Exception classes
from .exceptions import (
    BaseAPIError,
    ValidationError,
    AuthenticationError,
    TokenExpiredError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    ServiceUnavailableError,
    create_error_from_exception,
    get_serialized_error,
)

# Logger
from .logger import (
    ErrorHandler,
    get_error_handler,
    set_correlation_id,
    get_correlation_id,
    generate_correlation_id,
    log_error,
    log_warning,
    log_info,
    log_debug,
)

# Handlers and middleware
from .handlers import (
    ErrorHandlerMixin,
    create_error_middleware,
    with_error_handling,
    validate_and_raise,
    require_condition,
)

from .middleware import (
    create_logging_middleware,
    get_request_context,
    setup_request_validation,
    sanitize_log_data,
    log_slow_requests,
)

__all__ = [
    # Exceptions
    "BaseAPIError",
    "ValidationError",
    "AuthenticationError",
    "TokenExpiredError",
    "AuthorizationError",
    "NotFoundError",
    "ConflictError",
    "InternalServerError",
    "ServiceUnavailableError",
    "create_error_from_exception",
    "get_serialized_error",
    
    # Logger
    "ErrorHandler",
    "get_error_handler",
    "set_correlation_id",
    "get_correlation_id",
    "generate_correlation_id",
    "log_error",
    "log_warning",
    "log_info",
    "log_debug",
    
    # Handlers
    "ErrorHandlerMixin",
    "create_error_middleware",
    "with_error_handling",
    "validate_and_raise",
    "require_condition",
    
    # Middleware
    "create_logging_middleware",
    "get_request_context",
    "setup_request_validation",
    "sanitize_log_data",
    "log_slow_requests",
]
