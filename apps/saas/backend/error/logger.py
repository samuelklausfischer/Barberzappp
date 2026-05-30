"""
Structured Logger for BarberZap Backend
Provides JSON-formatted logging with correlation IDs
"""

import json
import logging
import sys
import traceback
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar
from pathlib import Path

# Context variable for correlation ID
correlation_id_var: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add correlation ID if available
        correlation_id = correlation_id_var.get()
        if correlation_id:
            log_entry['correlation_id'] = correlation_id
        
        # Add exception info
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': self.formatException(record.exc_info) if self._should_include_traceback() else None,
            }
        
        # Add extra fields
        if hasattr(record, 'extra'):
            log_entry.update(record.extra)
        
        return json.dumps(log_entry, default=str, ensure_ascii=False)
    
    def _should_include_traceback(self) -> bool:
        """Whether to include traceback in logs"""
        # Include tracebacks in development or debug mode
        return logging.getLogger().level <= logging.DEBUG


class ErrorHandler:
    """
    Centralized error handler with structured logging
    """
    
    def __init__(self, app_name: str = "barberzap", log_level: str = "INFO"):
        self.app_name = app_name
        self.logger = self._setup_logger(log_level)
        self._configure_logging()
    
    def _setup_logger(self, log_level: str) -> logging.Logger:
        """Setup the main logger"""
        logger = logging.getLogger(self.app_name)
        logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
        return logger
    
    def _configure_logging(self):
        """Configure logging handlers"""
        # Remove existing handlers
        root_logger = logging.getLogger()
        root_logger.handlers.clear()
        
        # Console handler with JSON formatter
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(JSONFormatter())
        console_handler.setLevel(logging.INFO)
        
        # Add handlers
        root_logger.addHandler(console_handler)
        root_logger.setLevel(logging.INFO)
    
    def _log_exception(
        self,
        exc: Exception,
        level: int = logging.ERROR,
        extra: Optional[Dict[str, Any]] = None,
    ):
        """Log an exception with structured data"""
        extra = extra or {}
        
        # Add error-specific information
        error_info = {
            'error_type': type(exc).__name__,
            'error_message': str(exc),
        }
        extra.update(error_info)
        
        # Use sys.exc_info() to get proper traceback if available, otherwise log with message only
        import sys
        exc_info = sys.exc_info()
        
        self.logger.log(
            level,
            f"Exception occurred: {type(exc).__name__}",
            # Only use exc_info if we have a proper exception context
            exc_info=exc_info[0] is not None and exc_info[1] is exc,
            extra=extra,
        )
    
    def log_error(
        self,
        message: str,
        error: Optional[Exception] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        level: str = "ERROR",
    ):
        """Log an error with optional exception"""
        extra = {}
        
        if error_code:
            extra['error_code'] = error_code
        
        if context:
            extra.update(context)
        
        if error:
            self._log_exception(error, getattr(logging, level.upper(), logging.ERROR), extra)
        else:
            self.logger.log(getattr(logging, level.upper(), logging.ERROR), message, extra=extra)
    
    def log_warning(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ):
        """Log a warning"""
        self.logger.warning(message, extra=context or {})
    
    def log_info(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ):
        """Log informational message"""
        self.logger.info(message, extra=context or {})
    
    def log_debug(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ):
        """Log debug message"""
        self.logger.debug(message, extra=context or {})
    
    def log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        """Log HTTP request"""
        self.logger.info(
            "HTTP Request",
            extra={
                'http': {
                    'method': method,
                    'path': path,
                    'status_code': status_code,
                    'duration_ms': round(duration_ms, 2),
                    'client_ip': client_ip,
                },
                'user_agent': user_agent,
                'user_id': user_id,
            },
        )
    
    def log_db_operation(
        self,
        operation: str,
        table: str,
        duration_ms: float,
        rows_affected: Optional[int] = None,
    ):
        """Log database operation"""
        extra = {
            'database': {
                'operation': operation,
                'table': table,
                'duration_ms': round(duration_ms, 2),
            },
        }
        
        if rows_affected is not None:
            extra['database']['rows_affected'] = rows_affected
        
        self.logger.debug("Database operation", extra=extra)
    
    def log_cache_operation(
        self,
        operation: str,
        key: Optional[str] = None,
        hit: Optional[bool] = None,
        duration_ms: Optional[float] = None,
    ):
        """Log cache operation"""
        extra = {
            'cache': {
                'operation': operation,
            },
        }
        
        if key:
            # Sanitize key for logs (remove sensitive data)
            extra['cache']['key'] = self._sanitize_key(key)
        if hit is not None:
            extra['cache']['hit'] = hit
        if duration_ms is not None:
            extra['cache']['duration_ms'] = round(duration_ms, 2)
        
        self.logger.debug("Cache operation", extra=extra)
    
    def _sanitize_key(self, key: str) -> str:
        """Sanitize cache key for logging"""
        # Remove sensitive tokens from key
        sensitive_parts = ['token', 'password', 'secret', 'session']
        
        for part in sensitive_parts:
            if part in key.lower():
                parts = key.split(':')
                sanitized_parts = []
                for i, p in enumerate(parts):
                    if part in p.lower():
                        sanitized_parts.append('***REDACTED***')
                    else:
                        sanitized_parts.append(p)
                return ':'.join(sanitized_parts)
        
        return key


# Singleton instance
_error_handler: Optional[ErrorHandler] = None


def get_error_handler() -> ErrorHandler:
    """Get the singleton error handler instance"""
    global _error_handler
    if _error_handler is None:
        _error_handler = ErrorHandler()
    return _error_handler


def set_correlation_id(correlation_id: str):
    """Set the correlation ID for the current context"""
    correlation_id_var.set(correlation_id)


def get_correlation_id() -> Optional[str]:
    """Get the correlation ID for the current context"""
    return correlation_id_var.get()


def generate_correlation_id() -> str:
    """Generate a new correlation ID"""
    return str(uuid.uuid4())


# Convenience functions
def log_error(message: str, error: Optional[Exception] = None, **kwargs):
    """Log an error"""
    handler = get_error_handler()
    handler.log_error(message, error, **kwargs)


def log_warning(message: str, **kwargs):
    """Log a warning"""
    handler = get_error_handler()
    handler.log_warning(message, **kwargs)


def log_info(message: str, **kwargs):
    """Log info"""
    handler = get_error_handler()
    handler.log_info(message, **kwargs)


def log_debug(message: str, **kwargs):
    """Log debug"""
    handler = get_error_handler()
    handler.log_debug(message, **kwargs)
