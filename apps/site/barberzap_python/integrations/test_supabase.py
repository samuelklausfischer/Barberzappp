#!/usr/bin/env python3
"""
Teste básico do SupabaseRestClient

Verifica se o wrapper está funcionando corretamente.
"""

import sys
import os

# Adicionar diretório raiz ao path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from integrations.supabase_rest import (
    SupabaseRestClient,
    SupabaseError,
    get_client,
    supabase_get
)


def test_connection():
    """Testa conexão com Supabase."""
    print("=" * 60)
    print("TESTE: Conexão com Supabase")
    print("=" * 60)
    
    try:
        client = get_client()
        print(f"✓ Cliente criado")
        print(f"  URL: {client.url}")
        print(f"  Key: {client.service_role_key[:20]}...")
        return True
    except Exception as e:
        print(f"✗ Erro ao criar cliente: {e}")
        return False


def test_get_tables():
    """Testa busca de dados nas tabelas."""
    print("\n" + "=" * 60)
    print("TESTE: Busca de dados (GET)")
    print("=" * 60)
    
    client = get_client()
    
    # Lista de tabelas para testar
    tables = [
        'whatsapp_instances',
        'agente_config',
        'barbers',
        'services',
        'crm_leads',
        'crm_messages'
    ]
    
    results = {}
    
    for table in tables:
        try:
            print(f"\n  Tabela: {table}")
            data = client.get(table, {'limit': '5'})
            
            if data is None:
                count = 0
            else:
                count = len(data)
            
            results[table] = count
            print(f"    ✓ {count} registro(s)")
            
            if count > 0:
                print(f"    Exemplo: {list(data[0].keys())[:5]}...")
            
        except Exception as e:
            print(f"    ✗ Erro: {str(e)[:100]}")
            results[table] = -1
    
    # Resumo
    print(f"\n  Resumo:")
    success = sum(1 for count in results.values() if count >= 0)
    print(f"    ✓ {success}/{len(tables)} tabelas acessíveis")
    
    return success == len(tables)


def test_filters():
    """Testa filtros."""
    print("\n" + "=" * 60)
    print("TESTE: Filtros")
    print("=" * 60)
    
    client = get_client()
    
    tests = [
        {
            'name': 'Buscar com limit',
            'table': 'barbers',
            'filters': {'limit': '2'}
        },
        {
            'name': 'Buscar com order',
            'table': 'crm_leads',
            'filters': {'order': 'created_at.desc', 'limit': '3'}
        },
        {
            'name': 'Buscar colunas específicas',
            'table': 'services',
            'filters': {'select': 'id,name,price', 'limit': '3'}
        },
        {
            'name': 'Buscar único registro',
            'table': 'agente_config',
            'filters': {'limit': '1'},
            'single': True
        }
    ]
    
    passed = 0
    
    for test in tests:
        try:
            print(f"\n  {test['name']}:")
            data = client.get(
                test['table'],
                test.get('filters'),
                single=test.get('single', False)
            )
            print(f"    ✓ Sucesso: {len(data) if isinstance(data, list) else 'single'}")
            passed += 1
        except Exception as e:
            print(f"    ✗ Erro: {str(e)[:80]}")
    
    print(f"\n  Resultado: {passed}/{len(tests)} testes passaram")
    return passed == len(tests)


def test_utility_functions():
    """Testa funções utilitárias."""
    print("\n" + "=" * 60)
    print("TESTE: Funções Utilitárias")
    print("=" * 60)
    
    client = get_client()
    
    # Teste exists
    print("\n  Teste exists():")
    try:
        exists = client.exists('barbers', {'limit': '1'})
        print(f"    ✓ Barbeiros existem: {exists}")
    except Exception as e:
        print(f"    ✗ Erro: {e}")
        return False
    
    # Teste count
    print("\n  Teste count():")
    try:
        count = client.count('barbers')
        print(f"    ✓ Total de barbeiros: {count}")
    except Exception as e:
        print(f"    ✗ Erro: {e}")
        return False
    
    # Teste table_info
    print("\n  Teste table_info():")
    try:
        info = client.table_info('services')
        print(f"    ✓ Colunas: {', '.join(info.get('columns', [])[:5])}...")
    except Exception as e:
        print(f"    ✗ Erro: {e}")
        return False
    
    return True


def test_context_manager():
    """Testa context manager."""
    print("\n" + "=" * 60)
    print("TESTE: Context Manager")
    print("=" * 60)
    
    try:
        with SupabaseRestClient() as client:
            data = client.get('barbers', {'limit': '1'})
            print(f"  ✓ Context manager funcionou")
            print(f"  ✓ Dados obtidos: {len(data) if isinstance(data, list) else 'single'}")
        print(f"  ✓ Conexão fechada automaticamente")
        return True
    except Exception as e:
        print(f"  ✗ Erro: {e}")
        return False


def test_shortcut_functions():
    """Testa funções de atalho."""
    print("\n" + "=" * 60)
    print("TESTE: Funções de Atalho")
    print("=" * 60)
    
    try:
        print("\n  Usando supabase_get():")
        services = supabase_get('services', {'limit': '2'})
        print(f"    ✓ {len(services) if services else 0} serviço(s)")
        return True
    except Exception as e:
        print(f"    ✗ Erro: {e}")
        return False


def main():
    """Executa todos os testes."""
    print("\n" + "=" * 60)
    print("BARBERZAP - SUPABASE REST CLIENT TEST")
    print("=" * 60 + "\n")
    
    tests = [
        ("Conexão", test_connection),
        ("Busca de Dados", test_get_tables),
        ("Filtros", test_filters),
        ("Funções Utilitárias", test_utility_functions),
        ("Context Manager", test_context_manager),
        ("Funções de Atalho", test_shortcut_functions)
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ Teste '{name}' falhou com exceção: {e}")
            results.append((name, False))
    
    # Resumo final
    print("\n" + "=" * 60)
    print("RESUMO")
    print("=" * 60)
    
    for name, result in results:
        status = "✓ PASSOU" if result else "✗ FALHOU"
        print(f"  {status}: {name}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\n  Total: {passed}/{total} testes passaram")
    
    if passed == total:
        print(f"\n  ✓✓✓ TODOS OS TESTES PASSARAM ✓✓✓")
        return 0
    else:
        print(f"\n  ✗✗✗ ALGUNS TESTES FALHARAM ✗✗✗")
        return 1


if __name__ == '__main__':
    exit(main())
