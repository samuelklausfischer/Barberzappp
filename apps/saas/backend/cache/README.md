# BarberZap Redis Cache Layer

Sistema de cache distribuído com Redis para BarberZap, projetado para melhorar performance e reduzir a latência nas requisições ao Supabase.

## 📋 Índice

- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso Básico](#uso-básico)
- [Padrões de Key](#padrões-de-key)
- [Invalidação de Cache](#invalidação-de-cache)
- [Webhooks do Supabase](#webhooks-do-supabase)
- [Pub/Sub Distribuído](#pubsub-distribuído)
- [Monitoramento e Métricas](#monitoramento-e-métricas)
- [Exemplos de Integração](#exemplos-de-integração)

---

## 🚀 Instalação

### Pré-requisitos

- Python 3.8+
- Redis 5.0+ (ou serviço gerenciado como Redis Cloud, ElastiCache)
- Supabase Webhook configurado

### Instalar dependências

```bash
pip install redis
```

### Estrutura de Arquivos

```
backend/
├── config/
│   └── redis_config.py       # Configurações do Redis
├── cache/
│   ├── cache_manager.py      # Gerenciador de cache
│   ├── invalidation.py       # Sistema de invalidação
│   └── README.md            # Este arquivo
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no seu arquivo `.env`:

```bash
# Redis Connection
REDIS_URL=redis://localhost:6379/0
# ou configure individualmente:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_SSL=false

# Connection Pool
REDIS_MAX_CONNECTIONS=50
REDIS_SOCKET_TIMEOUT=5
REDIS_SOCKET_CONNECT_TIMEOUT=5
REDIS_RETRY_ON_TIMEOUT=true

# TTL (Time To Live) em segundos
CACHE_TTL_TENANT=3600        # 1 hora
CACHE_TTL_SERVICES=1800      # 30 minutos
CACHE_TTL_APPOINTMENTS=300   # 5 minutos
CACHE_TTL_CLIENT=1800        # 30 minutos
CACHE_TTL_CLIENT_STATS=900   # 15 minutos

# Metrics
CACHE_METRICS_ENABLED=true
CACHE_METRICS_SAMPLE_RATE=1.0

# Retry Policy
REDIS_MAX_RETRIES=3
REDIS_RETRY_BASE_DELAY=0.5
REDIS_RETRY_MAX_DELAY=2.0
```

### Configuração de Redis (Standalone, Docker, etc.)

#### Usando Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Com persistence
  redis-persistent:
    image: redis:7-alpine
    command: redis-server --appendonly yes --appendfsync everysec
    ports:
      - "6379:6379"
    volumes:
      - redis_persistent:/data
    restart: unless-stopped

volumes:
  redis_data:
  redis_persistent:
```

```bash
docker-compose up -d redis
```

#### Usando Redis Cloud / ElastiCache

```bash
REDIS_URL=rediss://user:password@redis-12345.cloud.redislabs.com:12345
REDIS_SSL=true
REDIS_SSL_CERT_REQS=required
```

---

## 📖 Uso Básico

### Inicialização do Cache Manager

```python
from cache.cache_manager import CacheManager, get_cache_manager

# Instância global (singleton)
cache = get_cache_manager()

# Ou criar instância específica
cache = CacheManager(redis_url="redis://localhost:6379/0")

# Usando context manager
with CacheManager() as cache:
    # cache gerenciado automaticamente
    data = cache.get("tenant:shop123")
```

### Operações Básicas

#### Get - obter valor do cache

```python
from cache.cache_manager import get_cache_manager

cache = get_cache_manager()

# Obter dados do tenant
tenant_data = cache.get("barberzap:tenant:shop123")

if tenant_data:
    print(f"Tenant: {tenant_data['name']}")
else:
    print("Cache miss - buscar no banco")
```

#### Set - salvar valor no cache

```python
from cache.cache_manager import CacheManager
from config.redis_config import ttl_config

cache = CacheManager()

# Salvar com TTL padrão
cache.set("barberzap:tenant:shop123", {"name": "Barber Shop", "phone": "123-456"})

# Salvar com TTL específico
cache.set(
    "barberzap:services:shop123",
    services_data,
    ttl=ttl_config.SERVICES_TTL
)

# Salvar com TTL customizado (10 minutos)
cache.set("barberzap:appointments:shop123:2026-03-04", apps_data, ttl=600)
```

#### Get or Fetch - padrão cache-first

```python
# Fetch data do Supabase se não estiver em cache
def fetch_tenant_from_db(shop_id):
    return supabase.table('tenants').select('*').eq('id', shop_id).single().data

tenant_data = cache.get_or_fetch(
    "barberzap:tenant:shop123",
    lambda: fetch_tenant_from_db("shop123")
)
```

#### Delete - remover chave específica

```python
cache.delete("barberzap:client:client456")
```

#### Invalidate - remover por pattern

```python
# Invalidar todos os appointments de uma loja
cache.invalidate("barberzap:appointments:shop123:*")

# Invalidar todos os dados de um client
cache.invalidate("barberzap:client:client456*")
```

### Operações em Lote

```python
# Get múltiplos
keys = [
    "barberzap:tenant:shop123",
    "barberzap:services:shop123",
]
results = cache.get_many(keys)

# Set múltiplos
items = {
    "barberzap:tenant:shop123": tenant_data,
    "barberzap:services:shop123": services_data,
}
cache.set_many(items, ttl=3600)
```

---

## 🗝️ Padrões de Key

O sistema usa um namespace prefixado para organizar as chaves:

```python
from config.redis_config import build_key

# Format: barberzap:{type}:{identifier}

tenant_key = build_key.tenant_key("shop123")
# barberzap:tenant:shop123

services_key = build_key.services_key("shop123")
# barberzap:services:shop123

appointments_key = build_key.appointments_key("shop123", "2026-03-04")
# barberzap:appointments:shop123:2026-03-04

client_key = build_key.client_key("client456")
# barberzap:client:client456

client_stats_key = build_key.client_stats_key("client456")
# barberzap:client:stats:client456
```

### Padrões Suportados

| Pattern | Descrição | TTL Padrão |
|---------|-----------|------------|
| `tenant:{shop_id}` | Dados completos do tenant | 3600s (1h) |
| `services:{shop_id}` | Serviços da loja | 1800s (30m) |
| `appointments:{shop_id}:{date}` | Agendamentos do dia | 300s (5m) |
| `client:{client_id}` | Dados do cliente | 1800s (30m) |
| `client:stats:{client_id}` | Stats do cliente | 900s (15m) |
| `queue:{shop_id}` | Fila de espera | 900s (15m) |

### Parse de Keys

```python
from config.redis_config import build_key

key = "barberzap:appointments:shop123:2026-03-04"
parsed = build_key.parse_key(key)
# {
#     'prefix': 'barberzap',
#     'type': 'appointments',
#     'key': 'shop123:2026-03-04',
#     'shop_id': 'shop123',
#     'date': '2026-03-04'
# }
```

---

## 🔄 Invalidação de Cache

### Invalidation Manager

```python
from cache.invalidation import get_invalidation_manager

# Iniciar o sistema de invalidação (inclui pub/sub)
invalidation = get_invalidation_manager()
invalidation.start()

# Invalidar todos os dados de um tenant
deleted = invalidation.invalidate_tenant("shop123", source="webhook")
print(f"Deleted {deleted} cache entries")

# Invalidar serviços
deleted = invalidation.invalidate_services("shop123")

# Invalidar appointments de uma data específica
deleted = invalidation.invalidate_appointments("shop123", "2026-03-04")

# Invalidar dados de um client
deleted = invalidation.invalidate_client("client456")

# Parar o sistema
invalidation.stop()
```

### Invalidação por Evento

```python
from cache.invalidation import InvalidationStrategy

# Obter chaves para invalidação
keys = InvalidationStrategy.get_invalidation_keys(
    InvalidationEventType.APPOINTMENT_CREATED,
    shop_id="shop123",
    date="2026-03-04"
)
# ['barberzap:appointments:shop123:2026-03-04', 'barberzap:queue:shop123']

# Invalidar
for key in keys:
    cache.delete(key)
```

---

## 🔗 Webhooks do Supabase

### Configurar Webhook no Supabase

1. Acesse o Dashboard do Supabase
2. Vá em **Database** → **Webhooks**
3. Crie um webhook para as tabelas:
   - `tenants` (INSERT, UPDATE, DELETE)
   - `services` (INSERT, UPDATE, DELETE)
   - `appointments` (INSERT, UPDATE, DELETE)
   - `clients` (INSERT, UPDATE, DELETE)

4. Configure o endpoint do seu backend:
   ```
   https://your-api.com/webhooks/supabase-cache
   ```

### Endpoint para receber webhooks

```python
from flask import Flask, request, jsonify
from cache.invalidation import get_invalidation_manager

app = Flask(__name__)
invalidation = get_invalidation_manager()
invalidation.start()

@app.route('/webhooks/supabase-cache', methods=['POST'])
def handle_supabase_webhook():
    """Recebe webhooks do Supabase e invalida cache"""
    try:
        payload = request.get_json()
        
        # Validar webhook (opcional - use webhook secret)
        # secret = request.headers.get('x-webhook-secret')
        # if secret != os.getenv('SUPABASE_WEBHOOK_SECRET'):
        #     return jsonify({'error': 'Invalid secret'}), 401
        
        # Processar invalidação
        result = invalidation.handle_supabase_webhook(payload)
        
        return jsonify(result), 200
        
    except Exception as e:
        app.logger.error(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### Payload do Webhook

```json
{
  "type": "UPDATE",
  "table": "appointments",
  "record": {
    "id": "app123",
    "shop_id": "shop123",
    "date": "2026-03-04",
    "status": "confirmed"
  },
  "old_record": {
    "id": "app123",
    "shop_id": "shop123",
    "date": "2026-03-04",
    "status": "pending"
  },
  "schema": "public"
}
```

---

## 📡 Pub/Sub Distribuído

Para sistemas com múltiplas instâncias, o pub/sub garante que invalidações sejam propagadas:

```python
from cache.invalidation import get_invalidation_manager

# Iniciar listener de pub/sub
invalidation = get_invalidation_manager()
invalidation.start()

# Quando você invalida cache, é automaticamente publicado
invalidation.invalidate_tenant("shop123")  
# → Todas as instâncias recebem a invalidação

# Custom handler para invalidação
def on_invalidation(message):
    print(f"Received invalidation: {message}")

invalidation.pubsub.register_handler(on_invalidation)
```

### Publicação Manual

```python
from cache.invalidation import RedisPubSubInvalidation, get_cache_manager

cache = get_cache_manager()
pubsub = RedisPubSubInvalidation(cache)

# Publicar invalidação para chaves específicas
pubsub.publish_invalidation(
    ["barberzap:tenant:shop123", "barberzap:services:shop123"],
    source="manual"
)

# Publicar invalidação por pattern
pubsub.publish_pattern_invalidation(
    "barberzap:appointments:shop123:*",
    source="scheduler"
)
```

---

## 📊 Monitoramento e Métricas

### Ver Saúde do Cache

```python
from cache.cache_manager import get_cache_manager

cache = get_cache_manager()
health = cache.get_health_status()

print(json.dumps(health, indent=2))
# {
#   "status": "healthy",
#   "redis": {
#     "connected": true,
#     "host": "localhost",
#     "port": 6379,
#     "latency_ms": 0.52
#   },
#   "cache": {
#     "memory_used_mb": 12.4,
#     "total_keys": 1423,
#     "hits": 4521,
#     "misses": 893,
#     "redis_hit_rate": 0.835
#   },
#   "metrics": {
#     "hits": 4521,
#     "misses": 893,
#     "errors": 12,
#     "hit_rate": 0.835,
#     "avg_latency_ms": 0.58,
#     "p95_latency_ms": 1.2,
#     "uptime_seconds": 86400
#   }
# }
```

### Métricas Individuais

```python
metrics = cache._metrics

# Hit rate
print(f"Cache Hit Rate: {metrics.hit_rate:.2%}")

# Latência média
print(f"Avg Latency: {metrics.avg_latency_ms:.2f}ms")

# Total requests
print(f"Total Requests: {metrics._hits + metrics._misses}")

# Resetar métricas
cache.reset_metrics()
```

### Endpoint de Health Check

```python
from flask import Flask, jsonify
from cache.cache_manager import get_cache_manager

app = Flask(__name__)
cache = get_cache_manager()

@app.route('/health/cache')
def cache_health():
    health = cache.get_health_status()
    status_code = 200 if health['status'] == 'healthy' else 503
    return jsonify(health), status_code

@app.route('/metrics/cache')
def cache_metrics():
    metrics = cache._metrics.get_stats()
    return jsonify(metrics)
```

---

## 💡 Exemplos de Integração

### Exemplo 1: API de Tenants com Cache

```python
from flask import Flask
from cache.cache_manager import get_cache_manager

app = Flask(__name__)
cache = get_cache_manager()

def get_tenant_from_db(shop_id):
    return supabase.table('tenants').select('*').eq('id', shop_id).single().data

@app.route('/tenant/<shop_id>')
def get_tenant(shop_id):
    # Cache-first approach
    tenant = cache.get_or_fetch(
        build_key.tenant_key(shop_id),
        lambda: get_tenant_from_db(shop_id),
        ttl=ttl_config.TENANT_DATA_TTL
    )
    
    if not tenant:
        return {'error': 'Tenant not found'}, 404
    
    return tenant

@app.route('/tenant/<shop_id>', methods=['PUT'])
def update_tenant(shop_id):
    # Atualizar no banco
    data = request.get_json()
    result = supabase.table('tenants').update(data).eq('id', shop_id).execute()
    
    # Invalidar cache
    cache.invalidate(build_key.tenant_key(shop_id))
    
    return result.data[0]
```

### Exemplo 2: API de Appointments com Cache

```python
from cache.invalidation import InvalidationEventType, InvalidationStrategy

@app.route('/appointments/<shop_id>/<date>')
def get_appointments(shop_id, date):
    appointments = cache.get_or_fetch(
        build_key.appointments_key(shop_id, date),
        lambda: get_appointments_from_db(shop_id, date),
        ttl=ttl_config.APPOINTMENTS_TTL
    )
    
    return appointments

@app.route('/appointments', methods=['POST'])
def create_appointment():
    data = request.get_json()
    
    # Salvar no banco
    result = supabase.table('appointments').insert(data).execute()
    appointment = result.data[0]
    
    # Invalidar cache
    keys = InvalidationStrategy.get_invalidation_keys(
        InvalidationEventType.APPOINTMENT_CREATED,
        shop_id=appointment['shop_id'],
        date=appointment['date']
    )
    
    for key in keys:
        cache.delete(key)
    
    return appointment, 201
```

### Exemplo 3: Batch Loading com Cache

```python
def get_shop_dashboard(shop_id):
    # Buscar múltiplos dados em batch
    keys = [
        build_key.tenant_key(shop_id),
        build_key.services_key(shop_id),
        build_key.queue_key(shop_id),
    ]
    
    # Buscar do cache
    cached_data = cache.get_many(keys)
    
    # Identificar misses e buscar do banco
    to_fetch = {}
    for key, value in cached_data.items():
        if value is None:
            if 'tenant' in key:
                to_fetch[key] = lambda: get_tenant_from_db(shop_id)
            elif 'services' in key:
                to_fetch[key] = lambda: get_services_from_db(shop_id)
            elif 'queue' in key:
                to_fetch[key] = lambda: get_queue_from_db(shop_id)
    
    # Fetch e cache dos dados em falta
    if to_fetch:
        fetched = {}
        for key, fetch_func in to_fetch.items():
            data = fetch_func()
            fetched[key] = data
            cache.set(key, data)
        
        # Atualizar cached_data
        cached_data.update(fetched)
    
    # Montar resultado
    return {
        'tenant': cached_data.get(build_key.tenant_key(shop_id)),
        'services': cached_data.get(build_key.services_key(shop_id)),
        'queue': cached_data.get(build_key.queue_key(shop_id)),
    }
```

### Exemplo 4: Async com FastAPI

```python
from fastapi import FastAPI
from cache.invalidation import AsyncCacheInvalidation
import asyncio

app = FastAPI()
async_invalidator = AsyncCacheInvalidation()

@app.post("/appointments")
async def create_appointment(appointment: dict):
    # Salvar no banco
    result = await asyncio.to_thread(
        lambda: supabase.table('appointments').insert(appointment).execute()
    )
    created = result.data[0]
    
    # Invalidar cache de forma assíncrona
    await async_invalidator.invalidate_appointments_async(
        shop_id=created['shop_id'],
        date=created['date'],
        publish=True
    )
    
    return created
```

---

## 🧪 Testes

### Testar Conexão Redis

```python
from cache.cache_manager import CacheManager

cache = CacheManager()
print("Connected:", cache.ping())
print("Health:", cache.get_health_status())
```

### Testar Operações Básicas

```python
# Set
cache.set("test:key", {"value": 123}, ttl=60)

# Get
data = cache.get("test:key")
print(data)  # {'value': 123}

# Delete
cache.delete("test:key")

# Invalidate pattern
cache.set("test:app1", {"id": 1})
cache.set("test:app2", {"id": 2})
cache.invalidate("test:*")  # Deleta ambos
```

---

## 🔧 Troubleshooting

### Redis não conecta

```python
# Ver configuração
health = cache.get_health_status()
print(health)

# Testar com redis-cli
# redis-cli -h localhost -p 6379 ping
```

### Cache não está funcionando

```python
# Ver métricas de hit rate
health = cache.get_health_status()
print(f"Hit Rate: {health['metrics']['hit_rate']:.2%}")

# Se hit rate baixo, verificar TTL
from config.redis_config import ttl_config
print("Service TTL:", ttl_config.SERVICES_TTL)
```

### Invalidação não propagando

```python
# Ver se pub/sub está ativo
from cache.invalidation import get_invalidation_manager
invalidation = get_invalidation_manager()
print("Listening:", invalidation.pubsub._listening)

# Reiniciar se necessário
invalidation.stop()
invalidation.start()
```

---

## 📚 Referências

- [Redis Documentation](https://redis.io/docs/)
- [Python Redis Library](https://redis.readthedocs.io/)
- [Supabase Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [LRU Cache Strategy](https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU)

---

## 📝 Licença

Este código é parte do projeto BarberZap.
