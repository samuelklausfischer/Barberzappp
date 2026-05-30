"""
Rate Limiting Decorators for BarberZap
Python decorators for easy rate limiting on endpoints
"""

import functools
import logging
from typing import Optional, Callable, Any, Dict, Union
from inspect import signature, Parameter

from .rate_limit import RateLimiter, RateLimitExceeded, get_rate_limiter
from .rate_limit_config import (
    env_config,
    RateLimitKeyFunc,
    get_endpoint_config,
    get_error_message
)

logger = logging.getLogger(__name__)


# ==================== Rate Limit Decorator ====================

def rate_limit(
    limit: int,
    window: int,
    key_type: str = 'ip',
    key_func: Optional[Callable] = None,
    key_param: Optional[str] = None,
    raise_class: Optional[type] = RateLimitExceeded,
    bypass_admin: bool = True,
    message: Optional[str] = None
):
    """
    Generic rate limiting decorator
    
    Args:
        limit: Maximum number of requests
        window: Time window in seconds
        key_type: Type of key for rate limiting ('ip', 'user', 'phone', 'shop_id', 'email', 'custom')
        key_func: Custom function to extract key from request/arguments
        key_param: Name of parameter to use as key (for function arguments)
        raise_class: Exception class to raise on limit exceeded
        bypass_admin: Allow admin users to bypass rate limits
        message: Custom error message
        
    Example:
        @app.post('/api/endpoint')
        @rate_limit(limit=100, window=60, key_type='ip')
        async def endpoint():
            return {'message': 'Hello'}
        
        # Using a parameter as key
        @app.post('/api/users/{user_id}')
        @rate_limit(limit=10, window=60, key_param='user_id')
        async def user_endpoint(user_id: str):
            return {'user_id': user_id}
    """
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Check if rate limiting is enabled
            if not env_config.is_enabled():
                return await func(*args, **kwargs)
            
            # Extract key
            key_value = _extract_key(
                args, kwargs,
                key_type=key_type,
                key_func=key_func,
                key_param=key_param,
                func=func
            )
            
            if key_value is None:
                # Can't extract key, allow the request
                logger.warning(f"Could not extract rate limit key for {func.__name__}")
                return await func(*args, **kwargs)
            
            # Check if whitelisted
            if env_config.is_whitelisted(key_type, key_value):
                logger.debug(f"Key {key_type}:{key_value} is whitelisted")
                return await func(*args, **kwargs)
            
            # Check if blocked
            if env_config.is_blocked(key_type, key_value):
                error_msg = "Access blocked"
                if raise_class:
                    raise raise_class(error_msg)()
                return {'error': error_msg}, 403
            
            # Apply limit multiplier
            actual_limit = env_config.modify_limit(limit)
            
            # Check rate limit
            limiter = get_rate_limiter()
            
            try:
                result = limiter.check(
                    key_type=key_type,
                    key_value=key_value,
                    limit=actual_limit,
                    window=window,
                    raise_on_exceed=False,
                    admin_bypass=bypass_admin
                )
                
                if not result['allowed']:
                    # Rate limit exceeded
                    error_message = message or get_error_message(key_type)
                    
                    if raise_class:
                        raise RateLimitExceeded(
                            message=error_message,
                            retry_after=result['retry_after'],
                            limit=limit,
                            window=window,
                            current=result['current'],
                            key=limiter._get_key(key_type, key_value)
                        )
                    
                    # Return error response
                    return {
                        'error': 'rate_limit_exceeded',
                        'message': error_message,
                        'retry_after': result['retry_after'],
                        'limit': limit,
                        'window': window
                    }, 429
                
                # Rate limit not exceeded, proceed
                return await func(*args, **kwargs)
                
            except RateLimitExceeded as e:
                # Re-raise if already handled
                raise
            except Exception as e:
                logger.error(f"Error in rate limit decorator: {e}")
                if env_config.is_lenient_mode():
                    # Allow request on error
                    return await func(*args, **kwargs)
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Check if rate limiting is enabled
            if not env_config.is_enabled():
                return func(*args, **kwargs)
            
            # Extract key
            key_value = _extract_key(
                args, kwargs,
                key_type=key_type,
                key_func=key_func,
                key_param=key_param,
                func=func
            )
            
            if key_value is None:
                # Can't extract key, allow the request
                logger.warning(f"Could not extract rate limit key for {func.__name__}")
                return func(*args, **kwargs)
            
            # Check if whitelisted
            if env_config.is_whitelisted(key_type, key_value):
                logger.debug(f"Key {key_type}:{key_value} is whitelisted")
                return func(*args, **kwargs)
            
            # Check if blocked
            if env_config.is_blocked(key_type, key_value):
                error_msg = "Access blocked"
                if raise_class:
                    raise raise_class(error_msg)()
                return {'error': error_msg}, 403
            
            # Apply limit multiplier
            actual_limit = env_config.modify_limit(limit)
            
            # Check rate limit
            limiter = get_rate_limiter()
            
            try:
                result = limiter.check(
                    key_type=key_type,
                    key_value=key_value,
                    limit=actual_limit,
                    window=window,
                    raise_on_exceed=False,
                    admin_bypass=bypass_admin
                )
                
                if not result['allowed']:
                    # Rate limit exceeded
                    error_message = message or get_error_message(key_type)
                    
                    if raise_class:
                        raise RateLimitExceeded(
                            message=error_message,
                            retry_after=result['retry_after'],
                            limit=limit,
                            window=window,
                            current=result['current'],
                            key=limiter._get_key(key_type, key_value)
                        )
                    
                    # Return error response
                    return {
                        'error': 'rate_limit_exceeded',
                        'message': error_message,
                        'retry_after': result['retry_after'],
                        'limit': limit,
                        'window': window
                    }, 429
                
                # Rate limit not exceeded, proceed
                return func(*args, **kwargs)
                
            except RateLimitExceeded as e:
                # Re-raise if already handled
                raise
            except Exception as e:
                logger.error(f"Error in rate limit decorator: {e}")
                if env_config.is_lenient_mode():
                    # Allow request on error
                    return func(*args, **kwargs)
                raise
        
        # Return appropriate wrapper based on whether function is async
        if _is_async_function(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# ==================== Specialized Decorators ====================

def rate_limit_booking(
    limit: int = 10,
    window: int = 60,
    phone_param: Optional[str] = None
):
    """
    Rate limiting decorator specifically for booking operations
    
    Args:
        limit: Maximum bookings per window (default: 10/min)
        window: Time window in seconds (default: 60)
        phone_param: Name of parameter containing phone number
        
    Example:
        @app.post('/api/appointments')
        @rate_limit_booking()
        async def create_appointment(phone: str, ...):
            # phone will be used for rate limiting automatically
            pass
    """
    return rate_limit(
        limit=limit,
        window=window,
        key_type='phone',
        key_param=phone_param,
        message="Muitas tentativas de agendamento. Tente novamente em 1 minuto."
    )


def rate_limit_auth(
    limit: int = 20,
    window: int = 60,
    ip_key: bool = True,
    email_param: Optional[str] = None
):
    """
    Rate limiting decorator for authentication operations
    
    Args:
        limit: Maximum attempts per window (default: 20/min)
        window: Time window in seconds (default: 60)
        ip_key: Use IP as key (True) or email (False)
        email_param: Name of parameter containing email (if ip_key=False)
        
    Example:
        @app.post('/api/auth/login')
        @rate_limit_auth()
        async def login():
            # IP will be used for rate limiting
            pass
        
        @app.post('/api/auth/reset-password')
        @rate_limit_auth(limit=5, ip_key=False, email_param='email')
        async def reset_password(email: str):
            # Email will be used for rate limiting
            pass
    """
    key_type = 'email' if not ip_key else 'ip'
    message = (
        "Muitas tentativas de autenticação para este email. "
        "Tente novamente em 1 minuto."
        if not ip_key
        else "Muitas tentativas de autenticação. Tente novamente em 1 minuto."
    )
    
    return rate_limit(
        limit=limit,
        window=window,
        key_type=key_type,
        key_param=email_param,
        message=message,
        bypass_admin=False
    )


def rate_limit_api(
    limit: int = 100,
    window: int = 60,
    shop_id_param: Optional[str] = None,
    read_only: bool = True
):
    """
    Rate limiting decorator for general API operations
    
    Args:
        limit: Maximum requests per window (default: 100/min for read, 50/min for write)
        window: Time window in seconds (default: 60)
        shop_id_param: Name of parameter containing shop_id
        read_only: True for read operations, False for write operations
        
    Example:
        @app.get('/api/clients')
        @rate_limit_api()
        async def list_clients():
            pass
        
        @app.post('/api/clients')
        @rate_limit_api(limit=50, read_only=False)
        async def create_client():
            pass
    """
    if not read_only and limit == 100:
        limit = 50  # Default write limit is lower
    
    message = (
        "Muitas requisições de leitura. Tente novamente em 1 minuto."
        if read_only
        else "Muitas requisições de escrita. Tente novamente em 1 minuto."
    )
    
    return rate_limit(
        limit=limit,
        window=window,
        key_type='shop_id',
        key_param=shop_id_param,
        message=message
    )


def rate_limit_webhook(
    limit: int = 100,
    window: int = 3600
):
    """
    Rate limiting decorator for webhook endpoints
    
    Args:
        limit: Maximum webhooks per window (default: 100/hour)
        window: Time window in seconds (default: 3600)
        
    Example:
        @app.post('/webhooks/supabase')
        @rate_limit_webhook()
        async def webhook_handler():
            pass
    """
    return rate_limit(
        limit=limit,
        window=window,
        key_type='ip',
        message="Muitas requisições de webhook. Tente novamente em 1 hora."
    )


def rate_limit_sms(
    limit: int = 10,
    window: int = 60,
    phone_param: Optional[str] = None
):
    """
    Rate limiting decorator for SMS sending
    
    Args:
        limit: Maximum SMS per window (default: 10/min)
        window: Time window in seconds (default: 60)
        phone_param: Name of parameter containing phone number
        
    Example:
        @app.post('/api/sms/send')
        @rate_limit_sms()
        async def send_sms(phone: str):
            pass
    """
    return rate_limit(
        limit=limit,
        window=window,
        key_type='phone',
        key_param=phone_param,
        message="Muitas mensagens SMS enviadas. Tente novamente em 1 minuto."
    )


def rate_limit_whatsapp(
    limit: int = 20,
    window: int = 60,
    phone_param: Optional[str] = None
):
    """
    Rate limiting decorator for WhatsApp sending
    
    Args:
        limit: Maximum messages per window (default: 20/min)
        window: Time window in seconds (default: 60)
        phone_param: Name of parameter containing phone number
        
    Example:
        @app.post('/api/whatsapp/send')
        @rate_limit_whatsapp()
        async def send_whatsapp(phone: str):
            pass
    """
    return rate_limit(
        limit=limit,
        window=window,
        key_type='phone',
        key_param=phone_param,
        message="Muitas mensagens WhatsApp enviadas. Tente novamente em 1 minuto."
    )


# ==================== Helper Functions ====================

def _is_async_function(func: Callable) -> bool:
    """Check if a function is async"""
    import asyncio
    if hasattr(func, '__wrapped__'):
        func = func.__wrapped__
    return asyncio.iscoroutinefunction(func)


def _extract_key(
    args: tuple,
    kwargs: dict,
    key_type: str,
    key_func: Optional[Callable],
    key_param: Optional[str],
    func: Callable
) -> Optional[str]:
    """
    Extract the rate limit key from arguments
    
    Returns:
        Key value or None if not found
    """
    # Try custom key function first
    if key_func:
        try:
            key_value = key_func(*args, **kwargs)
            if key_value:
                return str(key_value)
        except Exception as e:
            logger.warning(f"Custom key function failed: {e}")
    
    # Try parameter name
    if key_param:
        # Check kwargs first
        if key_param in kwargs:
            return str(kwargs[key_param])
        
        # Check args based on function signature
        sig = signature(func)
        param_names = list(sig.parameters.keys())
        
        if key_param in param_names:
            # Find index of the parameter
            param_idx = param_names.index(key_param)
            
            # Adjust for self if it's a method
            if param_names[0] in ['self', 'cls']:
                param_idx -= 1
            
            # Get from args (if available)
            actual_idx = param_idx + (1 if param_names[0] in ['self', 'cls'] and args else 0)
            if actual_idx < len(args):
                return str(args[actual_idx])
    
    # Try to extract from request object (FastAPI)
    if args and hasattr(args[0], 'request'):
        request = args[0].request
        
        if key_type == 'ip':
            return RateLimitKeyFunc.extract_ip(request)
        elif key_type == 'shop_id':
            return RateLimitKeyFunc.extract_shop_id(request)
        elif key_type == 'user':
            return RateLimitKeyFunc.extract_user_id(request)
        elif key_type == 'phone':
            return RateLimitKeyFunc.extract_phone(request)
        elif key_type == 'email':
            return RateLimitKeyFunc.extract_email(request)
    
    # Try to find in kwargs (common FastAPI pattern)
    if 'request' in kwargs:
        request = kwargs['request']
        
        if key_type == 'ip':
            return RateLimitKeyFunc.extract_ip(request)
        elif key_type == 'shop_id':
            return RateLimitKeyFunc.extract_shop_id(request)
        elif key_type == 'user':
            return RateLimitKeyFunc.extract_user_id(request)
        elif key_type == 'phone':
            return RateLimitKeyFunc.extract_phone(request)
        elif key_type == 'email':
            return RateLimitKeyFunc.extract_email(request)
    
    return None


# ==================== FastAPI Dependency ====================

from fastapi import Request, HTTPException, status

class RateLimitDepends:
    """
    FastAPI dependency for rate limiting
    
    Example:
        @app.get('/api/endpoint')
        @rate_limit_dependency(limit=100, window=60, key_type='ip')
        async def endpoint():
            return {'message': 'Hello'}
    """
    
    def __init__(
        self,
        limit: int,
        window: int,
        key_type: str = 'ip',
        key_param: Optional[str] = None,
        bypass_admin: bool = True,
        message: Optional[str] = None
    ):
        self.limit = limit
        self.window = window
        self.key_type = key_type
        self.key_param = key_param
        self.bypass_admin = bypass_admin
        self.message = message
    
    def __call__(self, request: Request) -> None:
        """Check rate limit and raise HTTPException if exceeded"""
        if not env_config.is_enabled():
            return
        
        # Extract key
        if self.key_param:
            key_value = request.path_params.get(self.key_param)
            if not key_value:
                key_value = request.query_params.get(self.key_param)
        else:
            key_value = self._extract_key_from_request(request, self.key_type)
        
        if key_value is None:
            logger.warning(f"Could not extract rate limit key for {request.url}")
            return
        
        # Check whitelist/blocklist
        if env_config.is_whitelisted(self.key_type, key_value):
            return
        
        if env_config.is_blocked(self.key_type, key_value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access blocked"
            )
        
        # Apply multiplier
        actual_limit = env_config.modify_limit(self.limit)
        
        # Check rate limit
        limiter = get_rate_limiter()
        
        try:
            result = limiter.check(
                key_type=self.key_type,
                key_value=key_value,
                limit=actual_limit,
                window=self.window,
                raise_on_exceed=False,
                admin_bypass=self.bypass_admin
            )
            
            if not result['allowed']:
                error_message = self.message or get_error_message(self.key_type)
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        'error': 'rate_limit_exceeded',
                        'message': error_message,
                        'retry_after': result['retry_after'],
                        'limit': self.limit,
                        'window': self.window
                    },
                    headers={
                        'Retry-After': str(result['retry_after']),
                        'X-RateLimit-Limit': str(self.limit),
                        'X-RateLimit-Remaining': str(result['remaining']),
                        'X-RateLimit-Reset': str(result['retry_after'])
                    }
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in rate limit dependency: {e}")
            if not env_config.is_lenient_mode():
                raise
    
    def _extract_key_from_request(self, request: Request, key_type: str) -> Optional[str]:
        """Extract key from FastAPI request"""
        if key_type == 'ip':
            return RateLimitKeyFunc.extract_ip(request)
        elif key_type == 'shop_id':
            return RateLimitKeyFunc.extract_shop_id(request)
        elif key_type == 'user':
            return RateLimitKeyFunc.extract_user_id(request)
        elif key_type == 'phone':
            return RateLimitKeyFunc.extract_phone(request)
        elif key_type == 'email':
            return RateLimitKeyFunc.extract_email(request)
        return None


def create_rate_limit_dependency(
    limit: int,
    window: int,
    key_type: str = 'ip',
    **kwargs
):
    """
    Create a FastAPI rate limit dependency
    
    Example:
        rate_limiter = create_rate_limit_dependency(100, 60)
        
        @app.get('/api/endpoint')
        @Depends(rate_limiter)
        async def endpoint():
            return {'message': 'Hello'}
    """
    return RateLimitDepends(limit=limit, window=window, key_type=key_type, **kwargs)
