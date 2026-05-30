"""
Exemplo de Uso do Sistema de Cache BarberZap
Demonstra as principais funcionalidades
"""

import logging
from cache import (
    CacheManager,
    get_cache_manager,
    get_invalidation_manager,
    InvalidationEventType,
    build_key,
    ttl_config,
)
from config import connection_config

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def exemplo_basico():
    """Exemplo 1: Operaçōes básicas de cache"""
    print("\n" + "="*60)
    print("EXEMPLO 1: Operaçōes Básicas")
    print("="*60)
    
    cache = get_cache_manager()
    
    # Ver saúde do cache
    health = cache.get_health_status()
    print(f"✓ Status: {health['status']}")
    print(f"✓ Hit Rate: {health['metrics']['hit_rate']:.2%}")
    
    # SET: Salvar dados
    tenant_data = {
        'id': 'shop123',
        'name': 'Barber Shop Central',
        'phone': '+55 11 98765-4321',
        'address': 'Rua Principal, 123'
    }
    
    cache.set(
        build_key.tenant_key('shop123'),
        tenant_data,
        ttl=ttl_config.TENANT_DATA_TTL
    )
    print(f"✓ Salvo tenant:{'shop123'} no cache")
    
    # GET: Obter dados
    cached = cache.get(build_key.tenant_key('shop123'))
    print(f"✓ Recuperado do cache: {cached['name']}")
    
    # DELETE: Remover dado
    cache.delete(build_key.tenant_key('shop123'))
    print(f"✓ Removido do cache")
    
    # Verificar se ainda existe
    exists = cache.exists(build_key.tenant_key('shop123'))
    print(f"✓ Ainda existe: {exists}")


def exemplo_cache_first():
    """Exemplo 2: Padrão cache-first"""
    print("\n" + "="*60)
    print("EXEMPLO 2: Padrão Cache-First")
    print("="*60)
    
    cache = get_cache_manager()
    
    # Simular fetch do banco de dados
    def fetch_services_from_db(shop_id):
        print(f"  → Buscando do banco: {shop_id}")
        return {
            'shop_id': shop_id,
            'services': [
                {'id': 'svc1', 'name': 'Corte de Cabelo', 'price': 35.00},
                {'id': 'svc2', 'name': 'Barba', 'price': 25.00},
                {'id': 'svc3', 'name': 'Combo Cabelo + Barba', 'price': 50.00},
            ]
        }
    
    key = build_key.services_key('shop123')
    
    # Primeira chamada - cache miss (busca do banco)
    print("\nPrimera chamada (cache miss):")
    services1 = cache.get_or_fetch(
        key,
        lambda: fetch_services_from_db('shop123'),
        ttl=ttl_config.SERVICES_TTL
    )
    print(f"✓ Resultado: {len(services1['services'])} serviços")
    
    # Segunda chamada - cache hit
    print("\nSegunda chamada (cache hit):")
    services2 = cache.get_or_fetch(
        key,
        lambda: fetch_services_from_db('shop123')
    )
    print(f"✓ Resultado: {len(services2['services'])} serviços (do cache)")
    
    # Métricas
    health = cache.get_health_status()
    print(f"\n✓ Hit Rate: {health['metrics']['hit_rate']:.2%}")


def exemplo_operacoes_lote():
    """Exemplo 3: Operaçōes em lote"""
    print("\n" + "="*60)
    print("EXEMPLO 3: Operaçōes em Lote")
    print("="*60)
    
    cache = get_cache_manager()
    
    # Preparar múltiplos dados
    clientes = [
        {'id': 'cli1', 'name': 'João Silva', 'phone': '123456789'},
        {'id': 'cli2', 'name': 'Maria Santos', 'phone': '987654321'},
        {'id': 'cli3', 'name': 'Pedro Costa', 'phone': '456789123'},
    ]
    
    # SET_MANY: Salvar múltiplos dados
    items = {
        build_key.client_key(c['id']): c
        for c in clientes
    }
    
    saved = cache.set_many(items, ttl=ttl_config.CLIENT_DATA_TTL)
    print(f"✓ Salvados {saved} clientes no cache")
    
    # GET_MANY: Buscar múltiplos dados
    keys = list(items.keys())
    results = cache.get_many(keys)
    
    print(f"✓ Recuperados {len([r for r in results.values() if r])} clientes")
    for key, client in results.items():
        if client:
            print(f"  - {client['name']}: {client['phone']}")


def exemplo_invalidacao():
    """Exemplo 4: Sistema de invalidação"""
    print("\n" + "="*60)
    print("EXEMPLO 4: Sistema de Invalidação")
    print("="*60)
    
    cache = get_cache_manager()
    invalidation = get_invalidation_manager()
    
    # Invalidar tenant
    deleted = invalidation.invalidate_tenant('shop123', source='exemplo')
    print(f"✓ Invalidados {deleted} chaves para tenant:shop123")
    
    # Invalidar serviços
    deleted = invalidation.invalidate_services('shop123')
    print(f"✓ Invalidados {deleted} chaves para services:shop123")
    
    # Invalidar appointments de uma data
    deleted = invalidation.invalidate_appointments('shop123', '2026-03-04')
    print(f"✓ Invalidados {deleted} chaves para appointments da data")


def exemplo_webhook_supabase():
    """Exemplo 5: Simular webhook do Supabase"""
    print("\n" + "="*60)
    print("EXEMPLO 5: Webhook do Supabase")
    print("="*60)
    
    invalidation = get_invalidation_manager()
    
    # Simular payload de webhook Supabase (INSERT em appointments)
    webhook_payload = {
        'type': 'INSERT',
        'table': 'appointments',
        'record': {
            'id': 'app456',
            'shop_id': 'shop123',
            'date': '2026-03-04',
            'time': '14:00',
            'client_id': 'client789',
            'status': 'scheduled'
        },
        'schema': 'public'
    }
    
    # Processar webhook
    result = invalidation.handle_supabase_webhook(webhook_payload)
    print(f"✓ Status: {result['status']}")
    print(f"✓ Event Type: {result.get('event_type')}")
    print(f"✓ Chaves invalidadas: {result.get('keys_invalidated', [])}")


def exemplo_metricas():
    """Exemplo 6: Monitoramento de métricas"""
    print("\n" + "="*60)
    print("EXEMPLO 6: Métricas de Cache")
    print("="*60)
    
    cache = get_cache_manager()
    
    # Realizar algumas operaçōes para gerar métricas
    for i in range(10):
        key = f"test:key:{i}"
        cache.set(key, {'value': i}, ttl=60)
        cache.get(key)  # Hit
        cache.get(f"test:missing:{i}")  # Miss
    
    # Obter métricas completas
    health = cache.get_health_status()
    
    print("\n📊 Métricas da Aplicação:")
    metrics = health['metrics']
    print(f"  Hits: {metrics['hits']}")
    print(f"  Misses: {metrics['misses']}")
    print(f"  Hit Rate: {metrics['hit_rate']:.2%}")
    print(f"  Avg Latency: {metrics['avg_latency_ms']:.2f}ms")
    print(f"  P95 Latency: {metrics['p95_latency_ms']:.2f}ms")
    print(f"  Total Requests: {metrics['total_requests']}")
    print(f"  Uptime: {metrics['uptime_seconds']:.1f}s")
    
    print("\n📊 Métricas do Redis:")
    redis_info = health['cache']
    print(f"  Memória Usada: {redis_info.get('memory_used_mb', 0):.2f} MB")
    print(f"  Total Keys: {redis_info.get('total_keys', 0)}")
    print(f"  Redis Hit Rate: {redis_info.get('redis_hit_rate', 0):.2%}")
    print(f"  Connected Clients: {redis_info.get('connected_clients', 0)}")


def exemplo_key_schema():
    """Exemplo 7: Schema de Keys"""
    print("\n" + "="*60)
    print("EXEMPLO 7: Schema de Keys")
    print("="*60)
    
    # Construir keys
    keys = [
        ("Tenant", build_key.tenant_key('shop123')),
        ("Services", build_key.services_key('shop123')),
        ("Appointments", build_key.appointments_key('shop123', '2026-03-04')),
        ("Client", build_key.client_key('client456')),
        ("Client Stats", build_key.client_stats_key('client456')),
        ("Queue", build_key.queue_key('shop123')),
    ]
    
    print("\nKeys geradas:")
    for label, key in keys:
        print(f"  {label:15}: {key}")
    
    # Parse de key
    print("\nParse de key:")
    key_to_parse = build_key.appointments_key('shop123', '2026-03-04')
    parsed = build_key.parse_key(key_to_parse)
    print(f"  Key: {key_to_parse}")
    print(f"  Parsed: {parsed}")


def exemplo_context_manager():
    """Exemplo 8: Context Manager"""
    print("\n" + "="*60)
    print("EXEMPLO 8: Context Manager")
    print("="*60)
    
    # Usando context manager para conexão automática
    with CacheManager() as cache:
        print("✓ Cache conectado dentro do context manager")
        cache.set("temp:test", {"value": 1})
        print(f"✓ Dados salvos: {cache.get('temp:test')}")
        print("✓ Conexão será fechada automaticamente")
    
    print("✓ Conexão fechada")


def main():
    """Executar todos os exemplos"""
    print("\n" + "🚀"*30)
    print("  DEMONSTRAÇÃO DO SISTEMA DE CACHE BARBERZAP")
    print("🚀"*30)
    
    try:
        # Verificar conexão
        cache = get_cache_manager()
        if not cache.ping():
            print("\n❌ Erro: Não foi possível conectar ao Redis!")
            print("   Verifique se o Redis está rodando em:")
            print(f"   {connection_config.host}:{connection_config.port}")
            return
        
        print("\n✓ Redis conectado com sucesso!")
        
        # Executar exemplos
        exemplo_basico()
        exemplo_cache_first()
        exemplo_operacoes_lote()
        exemplo_invalidacao()
        exemplo_webhook_supabase()
        exemplo_metricas()
        exemplo_key_schema()
        exemplo_context_manager()
        
        # Resumo final
        print("\n" + "="*60)
        print("RESUMO FINAL")
        print("="*60)
        health = cache.get_health_status()
        print(f"✓ Status: {health['status']}")
        print(f"✓ Hit Rate Global: {health['metrics']['hit_rate']:.2%}")
        print(f"✓ Total de Chaves no Redis: {health['cache'].get('total_keys', 0)}")
        print("\n✓ Todos os exemplos executados com sucesso!")
        
    except Exception as e:
        logger.error(f"Erro ao executar exemplos: {e}", exc_info=True)
        print(f"\n❌ Erro: {e}")


if __name__ == '__main__':
    main()
