#!/usr/bin/env python3
"""
Teste rápido do sistema de Error Handling do BarberZap
Verifica se todos os módulos podem ser importados e usados
"""

import sys
import os

# Adicionar backend ao path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

def test_module_imports():
    """Testar se todos os módulos podem ser importados"""
    print("📦 Testando importação de módulos...")
    
    try:
        from error import (
            BaseAPIError,
            ValidationError,
            AuthenticationError,
            AuthorizationError,
            NotFoundError,
            ConflictError,
            InternalServerError,
            ServiceUnavailableError,
            TokenExpiredError,
            create_error_from_exception,
            get_serialized_error,
            get_error_handler,
            log_error,
            log_warning,
            log_info,
            log_debug,
        )
        print("  ✅ error.exceptions")
        print("  ✅ error.logger")
        print("  ✅ error.__init__")
    except Exception as e:
        print(f"  ❌ Erro ao importar módulos: {e}")
        return False
    
    return True


def test_custom_errors():
    """Testar criação de erros customizados"""
    print("\n🎯 Testando erros customizados...")
    
    try:
        from error import ValidationError, NotFoundError, ConflictError
        
        # ValidationError
        ve = ValidationError(message="Invalid input", field="email")
        assert ve.status_code == 400
        assert ve.error_code == "VALIDATION_EMAIL_ERROR"  # Field customiza o error_code
        assert ve.recoverable is True
        print("  ✅ ValidationError funciona")
        
        # NotFoundError
        nfe = NotFoundError(resource="Appointment", resource_id="123")
        assert nfe.status_code == 404
        assert nfe.error_code == "NOT_FOUND"
        assert nfe.context["resource"] == "Appointment"
        print("  ✅ NotFoundError funciona")
        
        # ConflictError
        ce = ConflictError(
            message="Time slot booked",
            conflict_type="double_booking"
        )
        assert ce.status_code == 409
        assert ce.error_code == "CONFLICT_DOUBLE_BOOKING"
        assert ce.context["conflict_type"] == "double_booking"
        print("  ✅ ConflictError funciona")
        
    except Exception as e:
        print(f"  ❌ Erro ao criar custom errors: {e}")
        return False
    
    return True


def test_error_serialization():
    """Testar serialização de erros"""
    print("\n📊 Testando serialização de erros...")
    
    try:
        from error import ValidationError, get_serialized_error
        
        error = ValidationError(
            message="Email inválido",
            field="email",
            context={"provided": "invalid", "expected": "valid@email.com"}
        )
        
        # Serialização básica
        basic = error.to_dict()
        assert basic["error"] == "VALIDATION_EMAIL_ERROR"  # Field customiza o error_code
        assert basic["message"] == "Email inválido"
        assert basic["status"] == 400
        assert "detail" not in basic  # Não tem detail na versão básica
        print("  ✅ to_dict() funciona")
        
        # Serialização com detail
        with_detail = error.to_dict_with_detail()
        assert with_detail["detail"] == "Email inválido"
        assert with_detail["context"]["field"] == "email"
        print("  ✅ to_dict_with_detail() funciona")
        
        # Serialização get_serialized_error
        serialized = get_serialized_error(error, include_detail=True)
        assert serialized["error"] == "VALIDATION_EMAIL_ERROR"  # Field customiza o error_code
        assert serialized["detail"] == "Email inválido"
        print("  ✅ get_serialized_error() funciona")
        
    except Exception as e:
        print(f"  ❌ Erro na serialização: {e}")
        return False
    
    return True


def test_logger():
    """Testar logger"""
    print("\n📝 Testando logger...")
    
    try:
        from error import get_error_handler, log_error, log_warning, log_info, log_debug
        
        handler = get_error_handler()
        assert handler is not None
        print("  ✅ get_error_handler() funciona")
        
        # Testar logs (não deve lançar erro)
        log_info("Teste info", context={"test": True})
        log_warning("Teste warning")
        log_debug("Teste debug")
        log_error("Teste error", error=Exception("test error"))
        print("  ✅ Funções de log funcionam")
        
    except Exception as e:
        print(f"  ❌ Erro no logger: {e}")
        return False
    
    return True


def test_error_conversion():
    """Testar conversão de exceções genéricas"""
    print("\n🔄 Testando conversão de exceções...")
    
    try:
        from error import (
            create_error_from_exception,
            ValidationError,
            NotFoundError,
        )
        
        # Teste com ValueError (deve virar ValidationError)
        try:
            raise ValueError("Test value error")
        except Exception as e:
            api_error = create_error_from_exception(e)
            assert isinstance(api_error, ValidationError)
            assert api_error.status_code == 400
            print("  ✅ ValueError → ValidationError")
        
        # Teste com erro customizado (deve manter o tipo)
        try:
            raise NotFoundError(resource="Test", resource_id="123")
        except Exception as e:
            api_error = create_error_from_exception(e)
            assert isinstance(api_error, NotFoundError)
            print("  ✅ NotFoundError → NotFoundError (mantém tipo)")
        
        # Teste com exceção desconhecida (deve virar InternalServerError)
        try:
            raise RuntimeError("Unknown error")
        except Exception as e:
            api_error = create_error_from_exception(e)
            assert api_error.status_code == 500
            print("  ✅ RuntimeError → InternalServerError")
        
    except Exception as e:
        print(f"  ❌ Erro na conversão: {e}")
        return False
    
    return True


def test_correlation_id():
    """Testar correlation IDs"""
    print("\n🔗 Testando correlation IDs...")
    
    try:
        from error import (
            generate_correlation_id,
            set_correlation_id,
            get_correlation_id,
        )
        
        # Gerar ID
        cid1 = generate_correlation_id()
        assert cid1 is not None
        assert len(cid1) > 0
        print(f"  ✅ generate_correlation_id(): {cid1[:20]}...")
        
        # Set ID
        custom_id = "test-correlation-id-123"
        set_correlation_id(custom_id)
        retrieved = get_correlation_id()
        assert retrieved == custom_id
        print(f"  ✅ set/get_correlation_id(): {retrieved}")
        
    except Exception as e:
        print(f"  ❌ Erro no correlation ID: {e}")
        return False
    
    return True


def test_validation_helpers():
    """Testar helpers de validação"""
    print("\n✅ Testando helpers de validação...")
    
    try:
        from error import validate_and_raise, require_condition, ValidationError
        
        # test validate_and_raise (não deve lançar se condição True)
        validate_and_raise(
            True,
            ValidationError,
            message="Should not raise"
        )
        print("  ✅ validate_and_raise (True) não lança erro")
        
        # Test validate_and_raise (deve lançar se condição False)
        try:
            validate_and_raise(
                False,
                ValidationError,
                message="Should raise",
                field="test"
            )
            print("  ❌ validate_and_raise deveria ter lançado erro")
            return False
        except ValidationError:
            print("  ✅ validate_and_raise (False) lança ValidationError")
        
        # Test require_condition (não deve lançar se condição True)
        require_condition(True, "Should not raise")
        print("  ✅ require_condition (True) não lança erro")
        
        # Test require_condition (deve lançar se condição False)
        try:
            require_condition(False, "Should raise")
            print("  ❌ require_condition deveria ter lançado erro")
            return False
        except ValidationError:
            print("  ✅ require_condition (False) lança ValidationError")
        
    except Exception as e:
        print(f"  ❌ Erro nos helpers: {e}")
        return False
    
    return True


def test_log_sanitization():
    """Testar sanitização de logs"""
    print("\n🔒 Testando sanitização de logs...")
    
    try:
        from error import sanitize_log_data
        
        data = {
            "name": "John Doe",
            "email": "john@example.com",
            "password": "secret123",
            "token": "abc-def-123",
            "safe_value": "normal value",
        }
        
        sanitized = sanitize_log_data(data)
        
        # Valores normais devem ser mantidos
        assert sanitized["name"] == "John Doe"
        assert sanitized["email"] == "john@example.com"
        assert sanitized["safe_value"] == "normal value"
        print("  ✅ Valores normais preservados")
        
        # Valores sensíveis devem ser redacted
        assert sanitized["password"] == "***REDACTED***"
        assert sanitized["token"] == "***REDACTED***"
        print("  ✅ Valores sensíveis redacted")
        
    except Exception as e:
        print(f"  ❌ Erro na sanitização: {e}")
        return False
    
    return True


def main():
    """Executar todos os testes"""
    print("\n" + "="*70)
    print("  TESTE DO SISTEMA DE ERROR HANDLING - BARBERZAP (Backend)")
    print("="*70 + "\n")
    
    tests = {
        'imports': test_module_imports,
        'custom_errors': test_custom_errors,
        'serialization': test_error_serialization,
        'logger': test_logger,
        'conversion': test_error_conversion,
        'correlation_id': test_correlation_id,
        'validation_helpers': test_validation_helpers,
        'sanitization': test_log_sanitization,
    }
    
    results = {}
    for test_name, test_func in tests.items():
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ '{test_name}' crash: {e}")
            results[test_name] = False
    
    # Resumo
    print("\n" + "="*70)
    print("  RESUMO DOS TESTES")
    print("="*70 + "\n")
    
    for test_name, passed in results.items():
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"  {test_name:25}: {status}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\n  Total: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n  🎉 Todos os testes passaram! Sistema de error handling pronto.")
        return 0
    else:
        print(f"\n  ⚠️  {total - passed} teste(s) falhou/aram")
        return 1


if __name__ == '__main__':
    sys.exit(main())
