"""
API Routers Module

All route modules for the API.
"""

from .auth import router as auth_router
from .tenants import router as tenants_router
from .barbers import router as barbers_router
from .services import router as services_router
from .appointments import router as appointments_router
from .clients import router as clients_router
from .employees import router as employees_router
from .leads import router as leads_router
from .stats import router as stats_router
from .chat import router as chat_router
from .whatsapp import router as whatsapp_router

__all__ = [
    'auth_router',
    'tenants_router',
    'barbers_router',
    'services_router',
    'appointments_router',
    'clients_router',
    'employees_router',
    'leads_router',
    'stats_router',
    'chat_router',
    'whatsapp_router',
]
