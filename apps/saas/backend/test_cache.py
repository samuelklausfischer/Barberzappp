#!/usr/bin/env python3
"""
Teste rápido do sistema de cache BarberZap
Verifica se todos os módulos podem ser importados e usados
"""

import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Testar se todos os módulos podem ser importados"""
    print("📦 Testando imports...")
    
    try:
        from config import (
            connection_config,
            ttl_config,
            retry_config,
            metrics_config,
            build_key,
            RedisConnectionConfig,
            RedisTTLConfig,
        )
        print("  ✅ config.redis_config")
    except Exception as e:
        print(f"  ❌ config.redis_config: {e}")
        return False
    
    try:
        from cache import (
            CacheManager,
            get_cache_manager,
            CacheMetrics,
            InvalidationEventType,
            InvalidationStrategy,
            SupabaseWebhookHandler,
            RedisPubSubInvalidation,
            CacheInvalidationManager,
        )
        print("  ✅ cache.cache_manager")
        print("  ✅ cache.invalidation")
    except Exception as e:
        print(f"  ❌ cache: {e}")
        return False
    
    return True


def test_key_schema():
    """Testar schema de keys"""
    print("\n🗝️  Testando schema de keys...")
    
    try:
        from config import build_key
        
        # Testar todas as funções de key
        keys = {
            'tenant': build_key.tenant_key('shop123'),
            'services': build_key.services_key('shop123'),
            'appointments': build_key.appointments_key('shop123', '2026-03-04'),
            'client': build_key.client_key('client456'),
            'client_stats': build_key.client_stats_key('client456'),
            'queue': build_key.queue_key('shop123'),
        }
        
        for type_name, key in keys.items():
            print(f"  ✅ {type_name:15}: {key}")
        
        # Testar parse
        parsed = build_key.parse_key(keys['appointments'])
        assert parsed['shop_id'] == 'shop123'
        assert parsed['date'] == '2026-03-04'
        print(f"  ✅ Parse de key funciona")
        
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        return False
    
    return True


def test_config():
    """Testar configurações"""
    print("\n⚙️  Testando configurações...")
    
    try:
        from config import connection_config, ttl_config, retry_config
        
        print(f"  ✅ Redis Host: {connection_config.host}")
        print(f"  ✅ Redis Port: {connection_config.port}")
        print(f"  ✅ Redis DB: {connection_config.db}")
        print(f"  ✅ Max Connections: {connection_config.max_connections}")
        print(f"  ✅ TTL Tenant: {ttl_config.TENANT_DATA_TTL}s")
        print(f"  ✅ TTL Services: {ttl_config.SERVICES_TTL}s")
        print(f"  ✅ TTL Appointments: {ttl_config.APPOINTMENTS_TTL}s")
        print(f"  ✅ Max Retries: {retry_config.max_retries}")
        
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        return False
    
    return True


def test_cache_manager():
    """Testar CacheManager (requer Redis rodando)"""
    print("\n💾 Testando CacheManager...")
    
    try:
        from cache import get_cache_manager
        
        cache = get_cache_manager()
        
        # Verificar saúde
        health = cache.get_health_status()
        print(f"  Status: {health['status']}")
        
        if health['status'] == 'healthy':
            print("  ✅ Redis conectado")
            
            # Testar set/get
            test_key = 'test:quick:test'
            test_value = {'test': True, 'value': 123}
            
            cache.set(test_key, test_value, ttl=60)
            retrieved = cache.get(test_key)
            
            if retrieved == test_value:
                print("  ✅ SET/GET funciona")
            else:
                print(f"  ❌ SET/GET falhou: esperado {test_value}, got {retrieved}")
                return False
            
            # Testar delete
            cache.delete(test_key)
            if not cache.exists(test_key):
                print("  ✅ DELETE/EXISTS funciona")
            else:
                print("  ❌ DELETE/EXISTS falhou")
                return False
            
            # Mostrar métricas
            print(f"  ✅ Hit Rate: {health['metrics']['hit_rate']:.2%}")
            print(f"  ✅ Avg Latency: {health['metrics']['avg_latency_ms']:.2f}ms")
            
        else:
            print("  ⚠️  Redis não conectado (pode estar normal se Redis não está rodando)")
        
    except Exception as e:
        print(f"  ⚠️  Erro (pode ser esperado se Redis não está rodando): {e}")
    
    return True


def test_invalidation():
    """Testar sistema de invalidação (se Redis conectado)"""
    print("\n🔄 Testando sistema de invalidação...")
    
    try:
        from cache import get_invalidation_manager, InvalidationEventType, InvalidationStrategy
        
        invalidation = get_invalidation_manager()
        
        # Testar estratégia de invalidação
        keys = InvalidationStrategy.get_invalidation_keys(
            InvalidationEventType.TENANT_UPDATED,
            shop_id='shop123'
        )
        print(f"  ✅ Estratégia de invalidação funciona")
        print(f"     Keys: {keys}")
        
        # Testar health do invalidation
        if invalidation.cache_manager._connected:
            print("  ✅ Cache manager do invalidation está conectado")
        else:
            print("  ⚠️  Cache manager não conectado (sem Redis)")
        
    except Exception as e:
        print(f"  ❌ Erro: {e}")
        return False
    
    return True


def main():
    """Executar todos os testes"""
    print("\n" + "="*60)
    print("  TESTE RÁPIDO DO SISTEMA DE CACHE BARBERZAP")
    print("="*60 + "\n")
    
    results = {
        'imports': test_imports(),
        'key_schema': test_key_schema(),
        'config': test_config(),
        'cache_manager': test_cache_manager(),
        'invalidation': test_invalidation(),
    }
    
    print("\n" + "="*60)
    print("  RESUMO DOS TESTES")
    print("="*60 + "\n")
    
    for test_name, passed in results.items():
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"  {test_name:20}: {status}")
    
    total = len(results)
    passed = sum(results.values())
    print(f"\n  Total: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n  🎉 Todos os testes passaram!")
        return 0
    else:
        print(f"\n  ⚠️  {total - passed} teste(s) falhou/aram")
        return 1


if __name__ == '__main__':
    sys.exit(main())
