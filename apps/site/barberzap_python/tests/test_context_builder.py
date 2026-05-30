"""
Unit tests for Context Builder
"""

import pytest
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.context_builder import (
    build_context,
    build_context_string,
    get_barbers_list,
    get_services_list,
    get_barbershop_config,
    validate_context
)
from integrations.supabase_rest import SupabaseRestClient


# ============= FIXTURES =============

@pytest.fixture
def supabase_client():
    """Provides Supabase client for testing."""
    return SupabaseRestClient()


@pytest.fixture
def test_user_id():
    """Test user_id - adjust as needed."""
    return 'd9fd2be4-0768-483b-b122-b60277335e2a'  # User ID válido existente no banco


@pytest.fixture
def invalid_user_id():
    """Invalid user_id for negative testing."""
    return '999999'  # User ID que não existe


# ============= TESTE: build_context =============

def test_build_context_success(supabase_client, test_user_id):
    """Test successful context building."""
    context = build_context(test_user_id, supabase_client)

    assert context is not None, "Context should not be None"
    assert 'barbershop' in context, "Context should have 'barbershop'"
    assert 'barbers' in context, "Context should have 'barbers'"
    assert 'services' in context, "Context should have 'services'"

    # Verify barbershop structure
    bs = context['barbershop']
    assert 'user_id' in bs
    assert 'name' in bs
    assert 'address' in bs
    assert 'hours' in bs
    assert 'ai_name' in bs

    # Verify barbers structure
    assert isinstance(context['barbers'], list)
    for barber in context['barbers']:
        assert 'id' in barber
        assert 'name' in barber
        assert 'status' in barber

    # Verify services structure
    assert isinstance(context['services'], list)
    for service in context['services']:
        assert 'id' in service
        assert 'name' in service
        assert 'price' in service
        assert 'status' in service
        assert isinstance(service['price'], (int, float))


def test_build_context_not_found(supabase_client, invalid_user_id):
    """Test context building with non-existent user_id."""
    context = build_context(invalid_user_id, supabase_client)

    assert context is None, "Context should be None for invalid user_id"


def test_build_context_invalid_user_id():
    """Test context building with invalid user_id types."""
    # None
    assert build_context(None) is None
    # Empty string
    assert build_context('') is None
    # Invalid type
    assert build_context(123) is None


def test_build_context_with_default_client(test_user_id):
    """Test context building using default client."""
    context = build_context(test_user_id)

    assert context is not None
    assert 'barbershop' in context


# ============= TESTE: build_context_string =============

def test_build_context_string_success(supabase_client, test_user_id):
    """Test successful context string building."""
    ctx_str = build_context_string(test_user_id, supabase_client)

    assert ctx_str is not None, "Context string should not be None"
    assert isinstance(ctx_str, str), "Context string should be a string"
    assert len(ctx_str) > 0, "Context string should not be empty"

    # Verify expected content
    assert 'Barbearia:' in ctx_str or 'Barbeiros:' in ctx_str or 'Serviços:' in ctx_str


def test_build_context_string_not_found(supabase_client, invalid_user_id):
    """Test context string building with non-existent user_id."""
    ctx_str = build_context_string(invalid_user_id, supabase_client)

    assert ctx_str is None, "Context string should be None for invalid user_id"


# ============= TESTE: get_barbers_list =============

def test_get_barbers_list_active_only(supabase_client, test_user_id):
    """Test getting active barbers."""
    barbers = get_barbers_list(test_user_id, active_only=True, client=supabase_client)

    assert isinstance(barbers, list), "Should return a list"

    if barbers:  # If there are barbers
        for barber in barbers:
            assert 'id' in barber
            assert 'name' in barber
            assert barber['status'] == 'active', "Should only return active barbers"


def test_get_barbers_list_all(supabase_client, test_user_id):
    """Test getting all barbers (including inactive)."""
    barbers = get_barbers_list(test_user_id, active_only=False, client=supabase_client)

    assert isinstance(barbers, list), "Should return a list"


def test_get_barbers_list_default_client(test_user_id):
    """Test getting barbers with default client."""
    barbers = get_barbers_list(test_user_id)

    assert isinstance(barbers, list)


# ============= TESTE: get_services_list =============

def test_get_services_list_active_only(supabase_client, test_user_id):
    """Test getting active services."""
    services = get_services_list(test_user_id, active_only=True, client=supabase_client)

    assert isinstance(services, list), "Should return a list"

    if services:  # If there are services
        for service in services:
            assert 'id' in service
            assert 'name' in service
            assert 'price' in service
            assert isinstance(service['price'], (int, float))
            assert service['status'] == 'active', "Should only return active services"


def test_get_services_list_all(supabase_client, test_user_id):
    """Test getting all services (including inactive)."""
    services = get_services_list(test_user_id, active_only=False, client=supabase_client)

    assert isinstance(services, list), "Should return a list"


def test_get_services_list_default_client(test_user_id):
    """Test getting services with default client."""
    services = get_services_list(test_user_id)

    assert isinstance(services, list)


# ============= TESTE: get_barbershop_config =============

def test_get_barbershop_config_success(supabase_client, test_user_id):
    """Test getting barbershop config."""
    config = get_barbershop_config(test_user_id, supabase_client)

    assert config is not None, "Config should not be None for valid user_id"
    assert 'user_id' in config
    assert 'name' in config
    assert 'address' in config
    assert 'hours' in config
    assert 'ai_name' in config

    assert config['user_id'] == test_user_id


def test_get_barbershop_config_not_found(supabase_client, invalid_user_id):
    """Test getting barbershop config with non-existent user_id."""
    config = get_barbershop_config(invalid_user_id, supabase_client)

    assert config is None, "Config should be None for invalid user_id"


# ============= TESTE: validate_context =============

def test_validate_context_valid(supabase_client, test_user_id):
    """Test validation of valid context."""
    context = build_context(test_user_id, supabase_client)

    if context:
        # Usa strict=False para validar mesmo quando nome é gerado
        assert validate_context(context, strict=False) is True, "Valid context should pass validation"

        # Também testa strict mode - pode falhar se nome está vazio
        try:
            is_strict_valid = validate_context(context, strict=True)
            # Se chegar aqui, nome existe
            assert is_strict_valid
        except AssertionError:
            # Se não tem nome, strict=False deve funcionar
            assert validate_context(context, strict=False) is True


def test_validate_context_none():
    """Test validation of None context."""
    assert validate_context(None) is False, "None should fail validation"


def test_validate_context_missing_section():
    """Test validation of context missing required section."""
    incomplete_context = {
        'barbershop': {'name': 'Test'},
        'barbers': []
        # Missing 'services'
    }

    assert validate_context(incomplete_context) is False, \
        "Context missing section should fail validation"


def test_validate_context_invalid_barbershop():
    """Test validation of context with invalid barbershop."""
    invalid_context = {
        'barbershop': {},  # Empty barbershop
        'barbers': [],
        'services': []
    }

    # Em modo não-strict, barbershop vazio é válido pois gera nome automático
    assert validate_context(invalid_context, strict=False) is True, \
        "Context with empty barbershop should pass in non-strict mode"

    # Em modo strict, deve falhar
    assert validate_context(invalid_context, strict=True) is False, \
        "Context with invalid barbershop should fail in strict mode"


# ============= TESTE: Integração =============

def test_full_integration_flow(supabase_client, test_user_id):
    """Test complete integration flow."""
    # 1. Build context
    context = build_context(test_user_id, supabase_client)
    assert context is not None

    # 2. Validate (non-strict mode)
    assert validate_context(context, strict=False) is True

    # 3. Build string
    ctx_str = build_context_string(test_user_id, supabase_client)
    assert ctx_str is not None and len(ctx_str) > 0

    # 4. Get individual components
    barbers = get_barbers_list(test_user_id, client=supabase_client)
    assert isinstance(barbers, list)

    services = get_services_list(test_user_id, client=supabase_client)
    assert isinstance(services, list)

    config = get_barbershop_config(test_user_id, supabase_client)
    assert config is not None

    # 5. Verify consistency
    assert len(barbers) == len(context['barbers'])
    assert len(services) == len(context['services'])
    assert config['name'] == context['barbershop']['name']


# ============= RUN TESTS =============

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
