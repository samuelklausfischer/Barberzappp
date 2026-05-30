"""
Pytest Configuration and Shared Fixtures

Provides common fixtures and configuration for all tests.
"""

import pytest
import os
import sys
from unittest.mock import Mock, patch

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ========================
# MOCK FIXTURES
# ========================

@pytest.fixture
def mock_supabase_client():
    """
    Create a mock Supabase client.

    Returns:
        Mock SupabaseRestClient
    """
    client = Mock()
    client.get = Mock(return_value=[])
    client.post = Mock(return_value={})
    client.patch = Mock(return_value={})
    client.delete = Mock(return_value=True)
    client.upsert = Mock(return_value={})
    return client


@pytest.fixture
def mock_postgres_connection():
    """
    Create a mock PostgreSQL connection.

    Returns:
        Mock psycopg2 connection
    """
    conn = Mock()
    cursor = Mock()
    conn.cursor.return_value = cursor
    cursor.fetchall.return_value = []
    cursor.fetchone.return_value = None
    cursor.execute.return_value = None
    return conn


@pytest.fixture
def mock_ai_service():
    """
    Create a mock AI service.

    Returns:
        Mock AIService
    """
    ai = Mock()
    ai.generate_response = Mock(return_value={
        'success': True,
        'response': 'Mock AI response',
        'tokens_used': 50,
        'model': 'mock-model'
    })
    ai.set_model = Mock(return_value=True)
    return ai


@pytest.fixture
def mock_evolution_api():
    """
    Create a mock Evolution API.

    Returns:
        Mock EvolutionAPI
    """
    api = Mock()
    api.send_message = Mock(return_value={
        'success': True,
        'message_id': 'mock_msg_123'
    })
    api.create_instance = Mock(return_value={
        'success': True,
        'instance_name': 'mock_instance'
    })
    api.check_status = Mock(return_value={
        'success': True,
        'status': 'connected'
    })
    api.delete_instance = Mock(return_value={'success': True})
    api.get_qrcode = Mock(return_value={
        'success': True,
        'qrcode': 'mock_qrcode'
    })
    return api


# ========================
# DATA FIXTURES
# ========================

@pytest.fixture
def sample_barbershop_context():
    """
    Sample barbershop context for testing.

    Returns:
        Dict with barbershop configuration
    """
    return {
        'barbershop': {
            'id': 1,
            'user_id': 'tenant_123',
            'name': 'Barbearia Central',
            'ai_name': 'Ana',
            'address': 'Rua Teste, 123',
            'hours': '09:00 - 19:00',
            'phone': '11999999999',
            'whatsapp': '11999999999'
        },
        'barbers': [
            {'id': 1, 'name': 'Carlos', 'status': 'active'},
            {'id': 2, 'name': 'Pedro', 'status': 'active'},
            {'id': 3, 'name': 'Lucas', 'status': 'inactive'}
        ],
        'services': [
            {'id': 1, 'name': 'Corte de Cabelo', 'price': 35.00},
            {'id': 2, 'name': 'Barba', 'price': 25.00},
            {'id': 3, 'name': 'Combo Cabelo + Barba', 'price': 50.00}
        ]
    }


@pytest.fixture
def sample_webhook_payload():
    """
    Sample Evolution API webhook payload.

    Returns:
        Dict with webhook data
    """
    return {
        "event": "messages.upsert",
        "instance": {
            "instanceName": "barbearia_001",
            "status": "open"
        },
        "data": [{
            "key": {
                "remoteJid": "5511999999999@s.whatsapp.net",
                "fromMe": False,
                "id": "3EB0FAED6CC5D57E"
            },
            "message": {
                "conversation": "Olá, quero agendar um corte"
            },
            "pushName": "João Silva",
            "timestamp": 1740315600
        }]
    }


@pytest.fixture
def sample_chat_history():
    """
    Sample chat history for testing.

    Returns:
        List of chat messages
    """
    return [
        {
            'id': 1,
            'tenant_id': 'tenant_123',
            'phone': '5511999999999',
            'role': 'user',
            'message': 'Olá',
            'metadata': None,
            'created_at': '2024-01-15T10:00:00'
        },
        {
            'id': 2,
            'tenant_id': 'tenant_123',
            'phone': '5511999999999',
            'role': 'assistant',
            'message': 'Olá! Como posso ajudar?',
            'metadata': {'model': 'test-model'},
            'created_at': '2024-01-15T10:01:00'
        },
        {
            'id': 3,
            'tenant_id': 'tenant_123',
            'phone': '5511999999999',
            'role': 'user',
            'message': 'Quero agendar um corte',
            'metadata': None,
            'created_at': '2024-01-15T10:02:00'
        }
    ]


@pytest.fixture
def sample_crm_lead():
    """
    Sample CRM lead for testing.

    Returns:
        Dict with lead data
    """
    return {
        'id': 123,
        'tenant_id': 'tenant_123',
        'phone': '5511999999999',
        'name': 'João Silva',
        'email': 'joao@email.com',
        'status': 'new',
        'created_at': '2024-01-15T10:00:00'
    }


@pytest.fixture
def sample_crm_message():
    """
    Sample CRM message for testing.

    Returns:
        Dict with message data
    """
    return {
        'id': 456,
        'lead_id': 123,
        'direction': 'inbound',
        'sender': 'cliente',
        'message': 'Olá, quero agendar',
        'created_at': '2024-01-15T10:00:00'
    }


# ========================
# CONFIGURATION FIXTURES
# ========================

@pytest.fixture(autouse=True)
def reset_globals():
    """
    Reset global state before each test.

    This fixture runs automatically before every test to ensure
    clean state.
    """
    # Reset tenant resolver cache
    import core.tenant_resolver as tr
    tr._tenant_cache = {}

    # Reset AI service mock
    import agents.secretaria_universal as su
    # No global state to reset currently

    yield

    # Cleanup after test
    tr._tenant_cache = {}


@pytest.fixture(autouse=True)
def configure_logging(caplog):
    """
    Configure logging for tests.

    This fixture captures logs for test verification.
    """
    import logging

    # Set log level for all loggers
    for name in ['core', 'integrations', 'agents', 'crm', 'webhooks']:
        logger = logging.getLogger(name)
        logger.setLevel(logging.DEBUG)
        logger.addHandler(caplog.handler)

    yield

    # Cleanup
    for name in ['core', 'integrations', 'agents', 'crm', 'webhooks']:
        logger = logging.getLogger(name)
        logger.removeHandler(caplog.handler)


# ========================
# PYTEST HOOKS
# ========================

def pytest_configure(config):
    """
    Configure pytest with custom markers and settings.
    """
    config.addinivalue_line(
        "markers", "unit: mark test as unit test (isolated component)"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test (multiple components)"
    )
    config.addinivalue_line(
        "markers", "wrapper: mark test as wrapper test (Supabase, PG, Evolution, AI)"
    )
    config.addinivalue_line(
        "markers", "core: mark test as core test (Tenant Resolver, Context Builder)"
    )
    config.addinivalue_line(
        "markers", "agent: mark test as agent test (Secretaria)"
    )
    config.addinivalue_line(
        "markers", "crm: mark test as CRM test"
    )
    config.addinivalue_line(
        "markers", "placeholder: mark test as placeholder wrapper test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "fast: mark test as fast running"
    )


def pytest_collection_modifyitems(config, items):
    """
    Modify collected test items.

    Used to add markers automatically based on file names.
    """
    for item in items:
        # Add markers based on file path
        if 'test_wrap_' in item.fspath.strpath:
            item.add_marker(pytest.mark.wrapper)
        elif 'test_core_' in item.fspath.strpath:
            item.add_marker(pytest.mark.core)
        elif 'test_agent_' in item.fspath.strpath:
            item.add_marker(pytest.mark.agent)
        elif 'test_crm_' in item.fspath.strpath:
            item.add_marker(pytest.mark.crm)
        elif 'test_integration_' in item.fspath.strpath:
            item.add_marker(pytest.mark.integration)

        # All tests are unit tests by default (unless marked as integration)
        if not any(mark in item.keywords for mark in ['integration', 'slow']):
            item.add_marker(pytest.mark.unit)
