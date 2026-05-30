"""
Rate Limiting Configuration for BarberZap
Endpoint-specific rate limits and error messages
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum


# ==================== Endpoint Types ====================

class EndpointType(Enum):
    """Types of endpoints with different rate limiting strategies"""
    WEBHOOK = 'webhook'
    BOOKING = 'booking'
    API = 'api'
    AUTH = 'auth'
    PASSWORD_RESET = 'password_reset'
    CUSTOM = 'custom'


# ==================== Rate Limit Configuration ====================

@dataclass
class RateLimitRule:
    """Configuration for a single rate limit rule"""
    
    limit: int
    window: int  # seconds
    key_type: str  # 'ip', 'user', 'phone', 'shop_id', 'email'
    message: Optional[str] = None
    bypass_admin: bool = True
    burst_allowance: int = 0  # Allow temporary burst
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'limit': self.limit,
            'window': self.window,
            'key_type': self.key_type,
            'message': self.message,
            'bypass_admin': self.bypass_admin,
            'burst_allowance': self.burst_allowance
        }


# ==================== Endpoint Configuration ====================

class EndpointConfig:
    """Rate limit configuration for different endpoint types"""
    
    # Webhook endpoints (webhook receivers, external integrations)
    WEBHOOK = RateLimitRule(
        limit=100,
        window=3600,  # 1 hour
        key_type='ip',
        message="Muitas requisições de webhook. Tente novamente em 1 hora.",
        bypass_admin=True
    )
    
    # Booking endpoints (appointment creation, cancellation)
    BOOKING_CREATE = RateLimitRule(
        limit=10,
        window=60,  # 1 minute
        key_type='phone',
        message="Muitas tentativas de agendamento. Tente novamente em 1 minuto.",
        bypass_admin=True
    )
    
    BOOKING_CANCEL = RateLimitRule(
        limit=5,
        window=60,  # 1 minute
        key_type='shop_id',
        message="Muitas tentativas de cancelamento. Tente novamente em 1 minuto.",
        bypass_admin=True
    )
    
    # API endpoints (general CRUD operations)
    API_READ = RateLimitRule(
        limit=100,
        window=60,  # 1 minute
        key_type='shop_id',
        message="Muitas requisições de leitura. Tente novamente em 1 minuto.",
        bypass_admin=True
    )
    
    API_WRITE = RateLimitRule(
        limit=50,
        window=60,  # 1 minute
        key_type='shop_id',
        message="Muitas requisições de escrita. Tente novamente em 1 minuto.",
        bypass_admin=True
    )
    
    # Authentication endpoints
    AUTH_LOGIN = RateLimitRule(
        limit=20,
        window=60,  # 1 minute
        key_type='ip',
        message="Muitas tentativas de login. Tente novamente em 1 minuto.",
        bypass_admin=True,
        burst_allowance=3
    )
    
    AUTH_PASSWORD_RESET = RateLimitRule(
        limit=5,
        window=60,  # 1 minute
        key_type='email',
        message="Muitas solicitações de redefinição de senha. Tente novamente em 1 minuto.",
        bypass_admin=False  # Don't bypass password reset
    )
    
    PASSWORD_RESET = AUTH_PASSWORD_RESET
    
    # SMS/WhatsApp endpoints
    SMS_SEND = RateLimitRule(
        limit=10,
        window=60,  # 1 minute
        key_type='phone',
        message="Muitas mensagens SMS enviadas. Tente novamente em 1 minuto.",
        bypass_admin=True
    )
    
    WHATSAPP_SEND = RateLimitRule(
        limit=20,
        window=60,  # 1 minute
        key_type='phone',
        message="Muitas mensagens WhatsApp enviadas. Tente novamente em 1 minuto.",
        bypass_admin=True
    )
    
    # Admin/management endpoints
    ADMIN = RateLimitRule(
        limit=1000,
        window=60,  # 1 minute
        key_type='user',
        message="Limite de requisições administrativas atingido.",
        bypass_admin=False  # Admin limits apply to admin users too
    )


# ==================== Endpoint Mapping ====================

class RateLimitMapping:
    """Maps endpoint paths to rate limit rules"""
    
    ENDPOINT_RULES = {
        # Webhooks
        ('POST', '/webhooks/supabase'): EndpointConfig.WEBHOOK,
        ('POST', '/webhooks/whatsapp'): EndpointConfig.WEBHOOK,
        ('POST', '/webhooks/twilio'): EndpointConfig.WEBHOOK,
        
        # Bookings
        ('POST', '/api/appointments'): EndpointConfig.BOOKING_CREATE,
        ('POST', '/api/bookings'): EndpointConfig.BOOKING_CREATE,
        ('DELETE', '/api/appointments/{id}'): EndpointConfig.BOOKING_CANCEL,
        ('POST', '/api/appointments/{id}/cancel'): EndpointConfig.BOOKING_CANCEL,
        
        # Authentication
        ('POST', '/api/auth/login'): EndpointConfig.AUTH_LOGIN,
        ('POST', '/api/auth/register'): EndpointConfig.AUTH_LOGIN,
        ('POST', '/api/auth/reset-password'): EndpointConfig.AUTH_PASSWORD_RESET,
        ('POST', '/api/auth/forgot-password'): EndpointConfig.AUTH_PASSWORD_RESET,
        ('POST', '/api/auth/verify-email'): EndpointConfig.AUTH_LOGIN,
        
        # Clients (API - read)
        ('GET', '/api/clients'): EndpointConfig.API_READ,
        ('GET', '/api/client'): EndpointConfig.API_READ,
        ('GET', '/api/clients/{id}'): EndpointConfig.API_READ,
        
        # Clients (API - write)
        ('POST', '/api/clients'): EndpointConfig.API_WRITE,
        ('PUT', '/api/clients/{id}'): EndpointConfig.API_WRITE,
        ('PATCH', '/api/clients/{id}'): EndpointConfig.API_WRITE,
        ('DELETE', '/api/clients/{id}'): EndpointConfig.API_WRITE,
        
        # Services (API - read)
        ('GET', '/api/services'): EndpointConfig.API_READ,
        ('GET', '/api/services/{id}'): EndpointConfig.API_READ,
        
        # Services (API - write)
        ('POST', '/api/services'): EndpointConfig.API_WRITE,
        ('PUT', '/api/services/{id}'): EndpointConfig.API_WRITE,
        ('DELETE', '/api/services/{id}'): EndpointConfig.API_WRITE,
        
        # Shop/tenant (API - read)
        ('GET', '/api/shop'): EndpointConfig.API_READ,
        ('GET', '/api/shops'): EndpointConfig.API_READ,
        ('GET', '/api/shop/{id}'): EndpointConfig.API_READ,
        
        # Shop/tenant (API - write)
        ('PUT', '/api/shop'): EndpointConfig.API_WRITE,
        ('PUT', '/api/shop/{id}'): EndpointConfig.API_WRITE,
        
        # SMS/WhatsApp
        ('POST', '/api/sms/send'): EndpointConfig.SMS_SEND,
        ('POST', '/api/whatsapp/send'): EndpointConfig.WHATSAPP_SEND,
        ('POST', '/api/notifications/send'): EndpointConfig.WHATSAPP_SEND,
        
        # Admin
        ('GET', '/admin/*'): EndpointConfig.ADMIN,
        ('POST', '/admin/*'): EndpointConfig.ADMIN,
        ('PUT', '/admin/*'): EndpointConfig.ADMIN,
        ('DELETE', '/admin/*'): EndpointConfig.ADMIN,
    }
    
    @classmethod
    def get_rule(cls, method: str, path: str, shop_id: str = None) -> Optional[RateLimitRule]:
        """
        Get rate limit rule for a specific endpoint
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            path: Endpoint path
            shop_id: Optional shop ID to check for custom overrides
            
        Returns:
            RateLimitRule if found, None otherwise
        """
        # Exact match first
        key = (method, path)
        if key in cls.ENDPOINT_RULES:
            return cls.ENDPOINT_RULES[key]
        
        # Pattern match for wildcard paths
        for pattern_rule, rule in cls.ENDPOINT_RULES.items():
            pattern_method, pattern_path = pattern_rule
            if method == pattern_method and '*' in pattern_path:
                # Convert pattern to simple glob
                prefix = pattern_path.replace('*', '')
                if path.startswith(prefix) or path == prefix.rstrip('/'):
                    return rule
        
        # Check for shop-specific overrides
        if shop_id:
            # Could implement shop-specific rate limits here
            pass
        
        return None
    
    @classmethod
    def add_rule(cls, method: str, path: str, rule: RateLimitRule):
        """Add or update a rate limit rule for an endpoint"""
        cls.ENDPOINT_RULES[(method, path)] = rule
    
    @classmethod
    def remove_rule(cls, method: str, path: str):
        """Remove a rate limit rule for an endpoint"""
        key = (method, path)
        if key in cls.ENDPOINT_RULES:
            del cls.ENDPOINT_RULES[key]


# ==================== Configuration Helpers ====================

def get_endpoint_config(endpoint_type: str) -> Dict[str, Any]:
    """
    Get configuration for an endpoint type
    
    Args:
        endpoint_type: Type string ('webhook', 'booking', 'api', 'auth', etc.)
        
    Returns:
        Dict with 'limit' and 'window'
    """
    config_map = {
        'webhook': EndpointConfig.WEBHOOK.to_dict(),
        'booking': EndpointConfig.BOOKING_CREATE.to_dict(),
        'api': EndpointConfig.API_READ.to_dict(),
        'auth': EndpointConfig.AUTH_LOGIN.to_dict(),
        'password_reset': EndpointConfig.PASSWORD_RESET.to_dict(),
        'login': EndpointConfig.AUTH_LOGIN.to_dict(),
        'sms': EndpointConfig.SMS_SEND.to_dict(),
        'whatsapp': EndpointConfig.WHATSAPP_SEND.to_dict(),
        'admin': EndpointConfig.ADMIN.to_dict(),
    }
    
    endpoint_type = endpoint_type.lower()
    
    if endpoint_type not in config_map:
        # Default to API limits
        return EndpointConfig.API_READ.to_dict()
    
    return config_map[endpoint_type]


def get_error_message(endpoint_type: str) -> str:
    """
    Get error message for an endpoint type
    
    Args:
        endpoint_type: Type string
        
    Returns:
        Error message string
    """
    config_map = {
        'webhook': EndpointConfig.WEBHOOK.message,
        'booking': EndpointConfig.BOOKING_CREATE.message,
        'api': EndpointConfig.API_READ.message,
        'auth': EndpointConfig.AUTH_LOGIN.message,
        'password_reset': EndpointConfig.PASSWORD_RESET.message,
        'login': EndpointConfig.AUTH_LOGIN.message,
        'sms': EndpointConfig.SMS_SEND.message,
        'whatsapp': EndpointConfig.WHATSAPP_SEND.message,
        'admin': EndpointConfig.ADMIN.message,
    }
    
    endpoint_type = endpoint_type.lower()
    
    return config_map.get(
        endpoint_type,
        "Muitas requisições. Por favor, tente novamente mais tarde."
    )


def get_retry_after(endpoint_type: str) -> int:
    """Get default retry-after time for an endpoint type"""
    config = get_endpoint_config(endpoint_type)
    return config['window']


# ==================== Environment-Based Configuration ====================

class RateLimitEnvConfig:
    """Environment-specific rate limit configuration"""
    
    def __init__(self):
        import os
        
        # Global rate limiting toggle
        self.enabled = os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
        
        # Rate limiting mode (strict, lenient, disabled)
        self.mode = os.getenv('RATE_LIMIT_MODE', 'strict').lower()  # strict, lenient, disabled
        
        # Multiplier for limits (1.0 = normal, 2.0 = double limits, etc.)
        self.limit_multiplier = float(os.getenv('RATE_LIMIT_MULTIPLIER', '1.0'))
        
        # Admin bypass enabled
        self.admin_bypass = os.getenv('RATE_LIMIT_ADMIN_BYPASS', 'true').lower() == 'true'
        
        # Whitelist IPs (comma-separated)
        self.whitelist_ips = self._parse_list(os.getenv('RATE_LIMIT_WHITELIST_IPS', ''))
        
        # Whitelist shop IDs (comma-separated)
        self.whitelist_shops = self._parse_list(os.getenv('RATE_LIMIT_WHITELIST_SHOPS', ''))
        
        # Block IPs (comma-separated)
        self.blocked_ips = self._parse_list(os.getenv('RATE_LIMIT_BLOCKED_IPS', ''))
        
        # Custom Redis TTL for rate limit keys
        self.redis_ttl = int(os.getenv('RATE_LIMIT_REDIS_TTL', '0'))  # 0 = use window duration
    
    def _parse_list(self, value: str) -> List[str]:
        """Parse comma-separated list"""
        if not value:
            return []
        return [item.strip() for item in value.split(',') if item.strip()]
    
    def modify_limit(self, base_limit: int) -> int:
        """Apply multiplier to a base limit"""
        modified = int(base_limit * self.limit_multiplier)
        return max(1, modified)  # At least 1
    
    def is_whitelisted(self, key_type: str, key_value: str) -> bool:
        """Check if a key is whitelisted"""
        if key_type == 'ip':
            return key_value in self.whitelist_ips
        elif key_type == 'shop_id':
            return key_value in self.whitelist_shops
        return False
    
    def is_blocked(self, key_type: str, key_value: str) -> bool:
        """Check if a key is blocked"""
        if key_type == 'ip':
            return key_value in self.blocked_ips
        return False
    
    def is_enabled(self) -> bool:
        """Check if rate limiting is enabled globally"""
        return self.enabled and self.mode != 'disabled'
    
    def is_strict_mode(self) -> bool:
        """Check if strict mode is enabled"""
        return self.mode == 'strict'
    
    def is_lenient_mode(self) -> bool:
        """Check if lenient mode is enabled (allow on error)"""
        return self.mode == 'lenient'


# Global environment config instance
env_config = RateLimitEnvConfig()


# ==================== Custom Key Functions ====================

class RateLimitKeyFunc:
    """Custom key extraction functions for different scenarios"""
    
    @staticmethod
    def extract_ip(request) -> Optional[str]:
        """
        Extract IP address from request
        
        Handles proxies, X-Forwarded-For, etc.
        """
        # Check X-Forwarded-For header
        forwarded = request.headers.get('X-Forwarded-For')
        if forwarded:
            # Get first IP in the list
            return forwarded.split(',')[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        
        # Fall back to request.client.host
        if hasattr(request, 'client') and request.client:
            return request.client.host
        
        return None
    
    @staticmethod
    def extract_shop_id(request) -> Optional[str]:
        """Extract shop_id from request"""
        # Try query params
        shop_id = request.query_params.get('shop_id')
        if shop_id:
            return shop_id
        
        # Try path params
        if hasattr(request, 'path_params'):
            shop_id = request.path_params.get('shop_id')
            if shop_id:
                return shop_id
        
        # Try headers
        shop_id = request.headers.get('X-Shop-ID')
        if shop_id:
            return shop_id
        
        # Try from JWT token (if available)
        if hasattr(request, 'state') and request.state:
            auth_data = getattr(request.state, 'auth', None)
            if auth_data:
                return auth_data.get('shop_id')
        
        return None
    
    @staticmethod
    def extract_user_id(request) -> Optional[str]:
        """Extract user_id from request"""
        # Try from JWT token or session
        if hasattr(request, 'state') and request.state:
            auth_data = getattr(request.state, 'auth', None)
            if auth_data:
                return auth_data.get('user_id')
        
        return None
    
    @staticmethod
    def extract_phone(request) -> Optional[str]:
        """Extract phone number from request"""
        # Try body
        if hasattr(request, 'json'):
            # We can't await here, so return None
            pass
        
        # Try query params
        phone = request.query_params.get('phone')
        if phone:
            return phone
        
        return None
    
    @staticmethod
    def extract_email(request) -> Optional[str]:
        """Extract email from request"""
        # Try query params
        email = request.query_params.get('email')
        if email:
            return email
        
        return None
    
    @staticmethod
    def hash_key(key: str) -> str:
        """
        Hash a key for privacy and consistency
        
        Args:
            key: Original key value
            
        Returns:
            Hashed key
        """
        import hashlib
        return hashlib.sha256(key.encode()).hexdigest()[:16]
