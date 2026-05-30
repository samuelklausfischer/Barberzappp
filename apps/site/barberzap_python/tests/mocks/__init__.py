"""
Test mocks for BarberZap

This package provides mock implementations for testing without
requiring external dependencies:
- Evolution API mock
- AI Service mock
- Supabase mock
- PostgreSQL mock
"""

from tests.mocks.mock_evolution_api import (
    MockEvolutionAPI,
    get_mock_evolution_api,
    reset_mock_evolution_api,
    create_evolution_api_mock,
    create_evolution_api_mock_with_failures
)

from tests.mocks.mock_ai_service import (
    MockAIService,
    get_mock_ai_service,
    reset_mock_ai_service,
    create_ai_service_mock,
    create_ai_service_mock_with_failure,
    MockAIServiceWithFailure
)

__all__ = [
    # Evolution API mocks
    'MockEvolutionAPI',
    'get_mock_evolution_api',
    'reset_mock_evolution_api',
    'create_evolution_api_mock',
    'create_evolution_api_mock_with_failures',

    # AI Service mocks
    'MockAIService',
    'get_mock_ai_service',
    'reset_mock_ai_service',
    'create_ai_service_mock',
    'create_ai_service_mock_with_failure',
    'MockAIServiceWithFailure',
]
