# BarberZap Testing Framework

Comprehensive test suite for the BarberZap SaaS platform using pytest.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Mocks](#mocks)
- [Configuration](#configuration)

## 🎯 Overview

This testing framework provides full coverage of the BarberZap application including:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Mocks**: Simulated external dependencies
- **Fixtures**: Reusable test data and configurations

## 📁 Test Structure

```
tests/
├── __init__.py                 # Test package init
├── conftest.py                 # Shared fixtures and configuration
├── mocks/                      # Mock implementations
│   ├── __init__.py
│   ├── mock_evolution_api.py   # Evolution API mock
│   └── mock_ai_service.py      # AI Service mock
├── test_wrap_supabase.py       # Supabase wrapper tests
├── test_wrap_postgres.py       # PostgreSQL wrapper tests
├── test_wrap_evolution_api.py  # Evolution API wrapper tests
├── test_wrap_ai_service.py     # AI Service wrapper tests
├── test_tenant_resolver.py     # Tenant Resolver tests
├── test_context_builder.py     # Context Builder tests
├── test_agent_secretaria.py    # Secretaria Universal tests
├── test_crm_logger.py          # CRM Logger tests
└── test_integration_webhook_flow.py  # Integration tests
```

## 🚀 Running Tests

### Install Dependencies

```bash
pip install pytest pytest-mock pytest-asyncio pytest-cov
```

### Run All Tests

```bash
# From project root
pytest

# Verbose output
pytest -v

# With coverage
pytest --cov=barberzap_python --cov-report=html
```

### Run Specific Test Categories

```bash
# Unit tests only
pytest -m unit

# Integration tests only
pytest -m integration

# Wrapper tests only
pytest -m wrapper

# Core tests only
pytest -m core

# Agent tests only
pytest -m agent

# CRM tests only
pytest -m crm

# Placeholder tests only
pytest -m placeholder
```

### Run Specific Test Files

```bash
# Single test file
pytest tests/test_wrap_supabase.py

# Specific function
pytest tests/test_wrap_supabase.py::TestSupabaseRestClient::test_initialization

# With verbose output
pytest tests/test_wrap_supabase.py -v
```

### Run Tests with Markers

```bash
# Fast tests only
pytest -m "fast"

# Slow tests only
pytest -m "slow"

# Exclude slow tests
pytest -m "not slow"
```

## 🏷️ Test Categories

### Unit Tests (`@pytest.mark.unit`)

Tests for individual components in isolation:
- Wrapper modules (Supabase, PostgreSQL, Evolution API, AI Service)
- Core modules (Tenant Resolver, Context Builder)
- Agent modules (Secretaria Universal)
- CRM modules (CRM Logger)

### Integration Tests (`@pytest.mark.integration`)

Tests for complete workflows:
- Complete webhook flow: webhook → tenant → context → IA → CRM → Evolution API
- Multi-component interactions

### Wrapper Tests (`@pytest.mark.wrapper`)

Tests for integration wrappers:
- `test_wrap_supabase.py`: Supabase REST API wrapper
- `test_wrap_postgres.py`: PostgreSQL memory wrapper
- `test_wrap_evolution_api.py`: Evolution API placeholder
- `test_wrap_ai_service.py`: AI Service placeholder

### Core Tests (`@pytest.mark.core`)

Tests for core business logic:
- `test_tenant_resolver.py`: Instance name → tenant ID resolution
- `test_context_builder.py`: Build context from database

### Agent Tests (`@pytest.mark.agent`)

Tests for AI agents:
- `test_agent_secretaria.py`: Universal Secretary AI Agent

### CRM Tests (`@pytest.mark.crm`)

Tests for CRM functionality:
- `test_crm_logger.py`: CRM Logger (upsert lead, log message, etc.)

### Placeholder Tests (`@pytest.mark.placeholder`)

Tests for placeholder wrappers (until real APIs are available):
- Evolution API placeholder
- AI Service placeholder

## 🎭 Mocks

### Evolution API Mock

Located in `tests/mocks/mock_evolution_api.py`

```python
from tests.mocks import get_mock_evolution_api

# Get mock instance
mock_api = get_mock_evolution_api()

# Send mock message
result = mock_api.send_message("instance", "phone", "message")

# Reset state
mock_api.reset()
```

### AI Service Mock

Located in `tests/mocks/mock_ai_service.py`

```python
from tests.mocks import get_mock_ai_service

# Get mock instance
mock_ai = get_mock_ai_service()

# Generate mock response
result = mock_ai.generate_response("prompt")

# Check call count
print(mock_ai.get_call_count())
```

## ⚙️ Configuration

### pytest.ini

Configuration is in `pytest.ini` at the project root:

```ini
[pytest]
testpaths = tests
addopts =
    -v
    --strict-markers
    --tb=short
    --color=yes
```

### Markers

Available markers:
- `unit`: Unit tests
- `integration`: Integration tests
- `wrapper`: Wrapper module tests
- `core`: Core module tests
- `agent`: Agent module tests
- `crm`: CRM module tests
- `fast`: Fast tests
- `slow`: Slow tests
- `placeholder`: Placeholder wrapper tests

## 📊 Coverage

Generate coverage report:

```bash
# HTML report
pytest --cov=barberzap_python --cov-report=html

# Terminal report
pytest --cov=barberzap_python --cov-report=term-missing

# Combined
pytest --cov=barberzap_python --cov-report=html --cov-report=term-missing
```

View HTML report:
```bash
open htmlcov/index.html
```

## 🔍 Test Examples

### Basic Unit Test

```python
@pytest.mark.unit
@pytest.mark.wrapper
def test_supabase_get():
    """Test Supabase GET operation."""
    client = SupabaseRestClient()
    result = client.get('barbers')
    assert isinstance(result, list)
```

### Using Mocks

```python
@patch('integrations.supabase_rest.requests.Session.request')
def test_with_mock(mock_request):
    """Test with mocking."""
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {'test': 'data'}
    mock_request.return_value = mock_response

    # Test code...
```

### Using Fixtures

```python
def test_with_fixture(sample_barbershop_context):
    """Test using sample context fixture."""
    assert 'barbershop' in sample_barbershop_context
    assert sample_barbershop_context['barbershop']['name'] == 'Barbearia Central'
```

## 🛠️ Development

### Adding New Tests

1. Create test file in `tests/`
2. Import necessary modules
3. Use appropriate markers
4. Write test functions with descriptive names
5. Run tests to verify

### Adding New Fixtures

Add to `tests/conftest.py`:

```python
@pytest.fixture
def my_fixture():
    """My custom fixture."""
    data = {'key': 'value'}
    yield data
    # Cleanup if needed
```

## 📝 Notes

- All tests auto-run `reset_globals` fixture for clean state
- Logging is captured for test verification
- Placeholder tests are for mock implementations
- Real connections are NOT used (except when explicitly marked as `@pytest.mark.real`)

## 🔗 Related Documentation

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest Mock Documentation](https://pytest-mock.readthedocs.io/)
- [BarberZap Project README](../README.md)
