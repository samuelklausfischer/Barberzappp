"""
Testes para Tenant Resolver
"""

import os
import sys
from unittest.mock import Mock, patch

# Adiciona o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.tenant_resolver import (
    resolve_tenant,
    resolve_tenant_safe,
    resolve_tenant_cached,
    get_tenant_instance_info,
    is_instance_active,
    list_tenant_instances,
    validate_tenant_access,
    TenantNotFoundError,
    TenantInactiveError,
    TenantResolutionError,
)


def test_resolve_tenant_success():
    """Testa resolução bem-sucedida de tenant."""
    
    # Mock do cliente Supabase
    with patch('core.tenant_resolver.get_client') as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        
        # Simula resposta com tenant ativo
        mock_client.get.return_value = {
            'id': 1,
            'instance_name': 'barbearia_001',
            'user_id': '12345',
            'status': 'active'
        }
        
        user_id = resolve_tenant('barbearia_001')
        
        assert user_id == '12345'
        mock_client.get.assert_called_once()
        
        print("✅ test_resolve_tenant_success: PASS")


def test_resolve_tenant_not_found():
    """Testa resolução quando instância não existe."""
    
    with patch('core.tenant_resolver.get_client') as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        
        # Simula instância não encontrada
        mock_client.get.return_value = None
        
        user_id = resolve_tenant('instancia_inexistente')
        
        assert user_id is None
        print("✅ test_resolve_tenant_not_found: PASS")


def test_resolve_tenant_inactive():
    """Testa resolução quando tenant está inativo."""
    
    with patch('core.tenant_resolver.get_client') as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        
        # Primeira chamada (ativa = False, retorna None para filtro com status=active)
        # Segunda chamada (sem filtro de status, retorna instância inativa)
        mock_client.get.side_effect = [
            None,  # Com filtro status=eq.active
            {'instance_name': 'barbearia_inativa', 'status': 'inactive'}
        ]
        
        try:
            user_id = resolve_tenant('barbearia_inativa', check_active=True)
            assert False, "Deveria ter levantado TenantInactiveError"
        except TenantInactiveError as e:
            assert 'inativa' in str(e).lower()
            print("✅ test_resolve_tenant_inactive: PASS")


def test_resolve_tenant_without_active_check():
    """Testa resolução sem verificar se está ativo."""
    
    with patch('core.tenant_resolver.get_client') as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        
        # Instância inativa
        mock_client.get.return_value = {
            'instance_name': 'barbearia_inativa',
            'user_id': '67890',
            'status': 'inactive'
        }
        
        user_id = resolve_tenant('barbearia_inativa', check_active=False)
        
        assert user_id == '67890'
        print("✅ test_resolve_tenant_without_active_check: PASS")


def test_resolve_tenant_safe():
    """Testa versão safe que não levanta exceções."""
    
    with patch('core.tenant_resolver.get_client') as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        
        # Simula instância inativa
        mock_client.get.side_effect = [
            None,  # Com filtro active
            {'instance_name': 'barbearia_inativa', 'status': 'inactive'}
        ]
        
        # Não deve levantar exceção
        user_id = resolve_tenant_safe('barbearia_inativa')
        
        assert user_id is None
        print("✅ test_resolve_tenant_safe: PASS")


def test_get_tenant_instance_info():
    """Testa obtenção de informações completas da instância."""
    
    with patch('core.tenant_resolver.get_client') as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        
        expected_info = {
            'id': 1,
            'instance_name': 'barbearia_001',
            'user_id': '12345',
            'status': 'active',
            'api_key': 'xxx',
            'webhook_url': 'https://example.com/webhook',
            'created_at': '2026-02-23T12:00:00Z',
            'updated_at': '2026-02-23T12:00:00Z'
        }
        
        mock_client.get.return_value = expected_info
        
        info = get_tenant_instance_info('barbearia_001')
        
        assert info == expected_info
        print("✅ test_get_tenant_instance_info: PASS")


def test_is_instance_active():
    """Testa verificação se instância está ativa."""
    
    # Teste 1: Instância ativa
    with patch('core.tenant_resolver.get_tenant_instance_info') as mock_info:
        mock_info.return_value = {'status': 'active'}
        
        assert is_instance_active('barbearia_001') == True
        print("✅ test_is_instance_active (ativa): PASS")
    
    # Teste 2: Instância inativa
    with patch('core.tenant_resolver.get_tenant_instance_info') as mock_info:
        mock_info.return_value = {'status': 'inactive'}
        
        assert is_instance_active('barbearia_001') == False
        print("✅ test_is_instance_active (inativa): PASS")


def test_list_tenant_instances():
    """Testa listagem de instâncias de um tenant."""
    
    with patch('core.tenant_resolver.get_client') as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        
        expected_instances = [
            {'instance_name': 'barbearia_001', 'status': 'active'},
            {'instance_name': 'barbearia_002', 'status': 'active'}
        ]
        
        mock_client.get.return_value = expected_instances
        
        instances = list_tenant_instances('12345')
        
        assert len(instances) == 2
        assert instances[0]['instance_name'] == 'barbearia_001'
        print("✅ test_list_tenant_instances: PASS")


def test_validate_tenant_access():
    """Testa validação de acesso cross-tenant."""
    
    # Teste 1: Acesso válido
    with patch('core.tenant_resolver.resolve_tenant') as mock_resolve:
        mock_resolve.return_value = '12345'
        
        assert validate_tenant_access('barbearia_001', '12345') == True
        print("✅ test_validate_tenant_access (válido): PASS")
    
    # Teste 2: Acesso inválido
    with patch('core.tenant_resolver.resolve_tenant') as mock_resolve:
        mock_resolve.return_value = '99999'
        
        assert validate_tenant_access('barbearia_001', '12345') == False
        print("✅ test_validate_tenant_access (inválido): PASS")


def test_cache_resolve_tenant_cached():
    """Testa cache LRU de resolve_tenant_cached."""
    
    with patch('core.tenant_resolver.resolve_tenant_safe') as mock_resolve:
        mock_resolve.return_value = '12345'
        
        # Primeira chamada - deve chamar a função
        result1 = resolve_tenant_cached('barbearia_001')
        assert mock_resolve.call_count == 1
        
        # Segunda chamada - deve usar cache
        result2 = resolve_tenant_cached('barbearia_001')
        assert mock_resolve.call_count == 1  # Não incrementa
        
        # Terceira chamada com outra instância - deve chamar novamente
        result3 = resolve_tenant_cached('barbearia_002')
        assert mock_resolve.call_count == 2
        
        # Chamada repetida da primeira - deve usar cache
        result4 = resolve_tenant_cached('barbearia_001')
        assert mock_resolve.call_count == 2
        
        print("✅ test_cache_resolve_tenant_cached: PASS")


def run_all_tests():
    """Executa todos os testes."""
    print("\n" + "="*60)
    print("Executando testes do Tenant Resolver")
    print("="*60 + "\n")
    
    tests = [
        test_resolve_tenant_success,
        test_resolve_tenant_not_found,
        test_resolve_tenant_inactive,
        test_resolve_tenant_without_active_check,
        test_resolve_tenant_safe,
        test_get_tenant_instance_info,
        test_is_instance_active,
        test_list_tenant_instances,
        test_validate_tenant_access,
        test_cache_resolve_tenant_cached,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"❌ {test.__name__}: FAIL - {e}")
            failed += 1
        except Exception as e:
            print(f"❌ {test.__name__}: ERROR - {e}")
            failed += 1
    
    print("\n" + "="*60)
    print(f"Resultados: {passed} passou, {failed} falhou")
    print("="*60 + "\n")
    
    return failed == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
