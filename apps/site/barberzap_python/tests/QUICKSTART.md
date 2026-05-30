# BarberZap Testing Framework - Quick Start

Get started with the testing framework in 5 minutes.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements-test.txt
```

### 2. Run All Tests

```bash
pytest -v
```

### 3. View Summary

```bash
pytest -v --tb=no -q
```

## 📂 Test Structure

```
tests/
├── mocks/                      # Mock implementations
│   ├── mock_evolution_api.py   # Evolution API mock
│   └── mock_ai_service.py      # AI Service mock
├── test_wrap_*.py             # Wrapper tests
├── test_core_*.py             # Core tests
├── test_agent_*.py            # Agent tests
├── test_crm_*.py              # CRM tests
└── test_integration_*.py      # Integration tests
```

## 🏷️ Run by Category

```bash
# Unit tests
pytest -m unit -v

# Integration tests
pytest -m integration -v

# Wrapper tests (Supabase, PG, Evolution, AI)
pytest -m wrapper -v

# Core tests (Tenant, Context)
pytest -m core -v

# Agent tests (Secretaria)
pytest -m agent -v

# CRM tests
pytest -m crm -v

# Placeholder tests (mocks)
pytest -m placeholder -v
```

## 📊 Run Specific Test Files

```bash
# Single file
pytest tests/test_wrap_supabase.py -v

# Specific function
pytest tests/test_wrap_supabase.py::TestSupabaseRestClient::test_initialization -v

# Multiple files
pytest tests/test_wrap_*.py -v
```

## 🎭 Use Mocks

```python
# Evolution API Mock
from tests.mocks import MockEvolutionAPI

api = MockEvolutionAPI()
result = api.send_message("instance", "phone", "message")
assert result['success'] is True

# AI Service Mock
from tests.mocks import MockAIService

ai = MockAIService()
response = ai.generate_response("Hello")
assert response['success'] is True
```

## 📞 Test Runners

### Bash Script
```bash
./run_tests.sh unit
./run_tests.sh integration
./run_tests.sh help
```

### Python Script
```bash
python run_tests.py unit
python run_tests.py integration
python run_tests.py --help
```

## 📈 Coverage

```bash
# Generate coverage report
pytest --cov=barberzap_python --cov-report=html

# View in browser
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

## 🔍 Filter Tests

```bash
# By keyword
pytest -k "supabase" -v
pytest -k "tenant" -v
pytest -k "success" -v

# By marker combination
pytest -m "unit and wrapper" -v
pytest -m "integration and not slow" -v
```

## 🧪 Quick Examples

### Example 1: Run Wrapper Tests
```bash
pytest -m wrapper -v | head -50
```

### Example 2: Run with Stop on First Failure
```bash
pytest -x -v
```

### Example 3: Run Last Failed Tests
```bash
pytest --lf -v
```

### Example 4: Show Test Execution Time
```bash
pytest -v --durations=10
```

## 📚 Documentation

- Full documentation: `tests/README.md`
- Configuration: `pytest.ini`
- Fixtures: `tests/conftest.py`
- Mocks: `tests/mocks/`
- Summary: `TESTING_FRAMEWORK_SUMMARY.md`

## ✨ Tips

1. **Use `-v`** for detailed output
2. **Use `-s`** to see print statements
3. **Use `--tb=short`** for shorter tracebacks
4. **Use `--tb=no`** to suppress tracebacks
5. **Use `-x`** to stop on first failure
6. **Use `--lf`** to rerun last failed tests
7. **Use `--ff`** to run failed tests first

## 🎉 Success!

If you see `== 175 tests collected` or similar, the framework is working!

```
============================ test session starts ============================
platform linux -- Python 3.12.x
rootdir: /path/to/barberzap_python
configfile: pytest.ini
collected 175 items

tests/test_wrap_supabase.py::TestSupabaseRestClient::test_initialization PASSED
...
============================== 175 passed in 2.50s ===========================
```

## 🆘 Troubleshooting

### Import Errors
```bash
# Make sure you're in the right directory
cd /root/Barberzap\ SITE/barberzap_python
python3 -m pytest tests/
```

### Missing Dependencies
```bash
pip install -r requirements-test.txt
```

### Path Issues
```bash
# Add project root to PYTHONPATH
export PYTHONPATH=/root/Barberzap\ SITE/barberzap_python:$PYTHONPATH
```

## 📞 Need Help?

```bash
# Show all pytest options
pytest --help

# Show test markers
pytest --markers

# Show available fixtures
pytest --fixtures
```

---

Ready to test! Start with `pytest -v` and see all tests in action. 🚀
