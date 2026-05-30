"""
Integrations - Wrappers for external APIs

Este módulo fornece wrappers para serviços externos utilizados pelo BarberZap.
"""

# Supabase REST API Client
from .supabase_rest import (
    SupabaseRestClient,
    SupabaseError,
    SupabaseConnectionError,
    SupabaseResponseError,
    SupabaseValidationError,
    get_client,
    supabase_get,
    supabase_post,
    supabase_patch,
    supabase_delete,
    supabase_upsert
)

# AI Service (Placeholder)
from .ai_service import (
    AIService,
    AIProvider,
    create_ai_service
)

__all__ = [
    # Supabase
    'SupabaseRestClient',
    'SupabaseError',
    'SupabaseConnectionError',
    'SupabaseResponseError',
    'SupabaseValidationError',
    'get_client',
    'supabase_get',
    'supabase_post',
    'supabase_patch',
    'supabase_delete',
    'supabase_upsert',
    # AI Service
    'AIService',
    'AIProvider',
    'create_ai_service',
]
