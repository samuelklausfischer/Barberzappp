"""
Pydantic Models for BarberZap Dashboard API

These models define the request/response schemas for all API endpoints.
"""

from .common import (
    # Common response models
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
    MessageResponse
)
from .tenant import (
    # Tenant models
    TenantBase,
    TenantCreate,
    TenantUpdate,
    TenantResponse,
    TenantConfigResponse
)
from .barber import (
    # Barber models
    BarberBase,
    BarberCreate,
    BarberUpdate,
    BarberResponse,
    BarberListResponse
)
from .service import (
    # Service models
    ServiceBase,
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceListResponse
)
from .appointment import (
    # Appointment models
    AppointmentBase,
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentListResponse
)
from .client import (
    # Client models
    ClientBase,
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientListResponse
)
from .employee import (
    # Employee models
    EmployeeBase,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse
)
from .lead import (
    # Lead/CRM models
    LeadBase,
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadListResponse,
    LeadStatusUpdate,
    MessageBase,
    MessageCreate,
    MessageResponse,
    MessageListResponse,
    ConversationResponse
)
from .stats import (
    # Analytics models
    OverviewStats,
    LeadsStats,
    ConversationsStats,
    RevenueStats,
    DateRangeFilter,
    StatsResponse
)
from .auth import (
    # Auth models
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserResponse,
    TokenPayload
)
from .chat import (
    # Chat models
    ChatSendMessageRequest,
    ChatSendMessageResponse,
    ChatHistoryRequest,
    ChatHistoryResponse,
    AIGenerateRequest,
    AIGenerateResponse
)
from .whatsapp import (
    # WhatsApp models
    WhatsAppConnectionResponse,
    WhatsAppTestMessageRequest,
    WhatsAppTestMessageResponse,
    WhatsAppInstanceInfo
)

__all__ = [
    # Common
    'SuccessResponse',
    'ErrorResponse',
    'PaginatedResponse',
    'MessageResponse',
    # Tenant
    'TenantBase',
    'TenantCreate',
    'TenantUpdate',
    'TenantResponse',
    'TenantConfigResponse',
    # Barber
    'BarberBase',
    'BarberCreate',
    'BarberUpdate',
    'BarberResponse',
    'BarberListResponse',
    # Service
    'ServiceBase',
    'ServiceCreate',
    'ServiceUpdate',
    'ServiceResponse',
    'ServiceListResponse',
    # Appointment
    'AppointmentBase',
    'AppointmentCreate',
    'AppointmentUpdate',
    'AppointmentResponse',
    'AppointmentListResponse',
    # Client
    'ClientBase',
    'ClientCreate',
    'ClientUpdate',
    'ClientResponse',
    'ClientListResponse',
    # Employee
    'EmployeeBase',
    'EmployeeCreate',
    'EmployeeUpdate',
    'EmployeeResponse',
    'EmployeeListResponse',
    # Lead/CRM
    'LeadBase',
    'LeadCreate',
    'LeadUpdate',
    'LeadResponse',
    'LeadListResponse',
    'LeadStatusUpdate',
    'MessageBase',
    'MessageCreate',
    'MessageResponse',
    'MessageListResponse',
    'ConversationResponse',
    # Stats
    'OverviewStats',
    'LeadsStats',
    'ConversationsStats',
    'RevenueStats',
    'DateRangeFilter',
    'StatsResponse',
    # Auth
    'LoginRequest',
    'LoginResponse',
    'RefreshTokenRequest',
    'RefreshTokenResponse',
    'UserResponse',
    'TokenPayload',
    # Chat
    'ChatSendMessageRequest',
    'ChatSendMessageResponse',
    'ChatHistoryRequest',
    'ChatHistoryResponse',
    'AIGenerateRequest',
    'AIGenerateResponse',
    # WhatsApp
    'WhatsAppConnectionResponse',
    'WhatsAppTestMessageRequest',
    'WhatsAppTestMessageResponse',
    'WhatsAppInstanceInfo',
]
