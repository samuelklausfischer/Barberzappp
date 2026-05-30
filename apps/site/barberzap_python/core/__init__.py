"""
Core - Central logic and utilities

Modules:
    - context_builder: Build complete barbershop context for AI agents
"""

from .context_builder import (
    build_context,
    build_context_string,
    get_barbers_list,
    get_services_list,
    get_barbershop_config,
    validate_context
)

__all__ = [
    'build_context',
    'build_context_string',
    'get_barbers_list',
    'get_services_list',
    'get_barbershop_config',
    'validate_context'
]


from .tenant_resolver import (
    resolve_tenant,
    resolve_tenant_safe,
    resolve_tenant_cached,
    get_tenant_instance_info,
    is_instance_active,
    list_tenant_instances,
    validate_tenant_access,
    TenantResolutionError,
    TenantNotFoundError,
    TenantInactiveError,
)

__all__ = [
    # Funções principais
    'resolve_tenant',
    'resolve_tenant_safe',
    'resolve_tenant_cached',
    
    # Funções auxiliares
    'get_tenant_instance_info',
    'is_instance_active',
    'list_tenant_instances',
    'validate_tenant_access',
    
    # Exceções
    'TenantResolutionError',
    'TenantNotFoundError',
    'TenantInactiveError',
]
