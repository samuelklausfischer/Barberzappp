# BarberZap Backend - Redis Cache Layer

## 📁 Estrutura de Arquivos

```
backend/
├── config/
│   ├── __init__.py              # Exporta configurações
│   └── redis_config.py          # Configurações de Redis, TTL, retry
├── cache/
│   ├── __init__.py              # Exporta módulos do cache
│   ├── cache_manager.py         # Gerenciador de cache (LRU, TTL, métricas)
│   ├── invalidation.py          # Sistema de invalidação (webhooks, pub/sub)
│   ├── example_usage.py         # Exemplos completos de uso
│   ├── requirements.txt         # Dependências Python
│   └── README.md                # Documentação completa
└── README_CACHE.md              # Este arquivo
```

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd /root/barber/backend/cache
pip install -r requirements.txt
```

### 2. Configurar Redis

```bash
# Local (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Ou configurar URL no .env
export REDIS_URL=redis://localhost:6379/0
```

### 3. Testar Conexão

```bash
cd /root/barber/backend
python cache/example_usage.py
```

### 4. Integrar no Seu Código

```python
from cache import get_cache_manager, get_invalidation_manager
from config import build_key

# Obter instância do cache
cache = get_cache_manager()

# Usar cache
tenant = cache.get_or_fetch(
    build_key.tenant_key('shop123'),
    lambda: get_tenant_from_db('shop123')
)

# Invalidar cache quando dados mudam
invalidation = get_invalidation_manager()
invalidation.invalidate_tenant('shop123')
```

## 📚 Documentação Detalhada

Para documentação completa, veja:

- **[cache/README.md](cache/README.md)** - Documentação completa do sistema de cache
- **[cache/example_usage.py](cache/example_usage.py)** - Exemplos de código práticos

## 🎯 Funcionalidades Implementadas

### ✅ cache_manager.py
- [x] Cache LRU com TTL configurável
- [x] Padrão cache-first, database-second
- [x] Métricas de cache hit rate
- [x] Serialização JSON
- [x] Gerenciamento de conexão com pooling
- [x] Retry automático com backoff exponencial
- [x] Health monitoring
- [x] Operações em lote (get_many, set_many)
- [x] Context manager support

### ✅ invalidation.py
- [x] Invalidação via Supabase webhooks
- [x] Pattern matching para keys
- [x] Redis pub/sub para invalidação distribuída
- [x] Async support
- [x] Estratégias de invalidação por tipo de evento
- [x] Batch invalidation

### ✅ redis_config.py
- [x] Configurações de conexão (URL + parâmetros individuais)
- [x] TTL configurável por tipo de dado
- [x] Pool size configurável
- [x] Retry policy com backoff exponencial
- [x] Key schema padronizado
- [x] Suporte a SSL/TLS

## 🔧 Integração com Supabase Webhooks

### Configurar Webhook no Supabase

1. Dashboard → Database → Webhooks
2. Criar webhook para tabelas:
   - `tenants` (INSERT, UPDATE, DELETE)
   - `services` (INSERT, UPDATE, DELETE)
   - `appointments` (INSERT, UPDATE, DELETE)
   - `clients` (INSERT, UPDATE, DELETE)
3. Endpoint: `https://seu-api.com/webhooks/supabase-cache`

### Endpoint Flask/Starlette

```python
from flask import Flask, request
from cache import get_invalidation_manager

app = Flask(__name__)
invalidation = get_invalidation_manager()
invalidation.start()

@app.route('/webhooks/supabase-cache', methods=['POST'])
def handle_webhook():
    result = invalidation.handle_supabase_webhook(request.get_json())
    return result
```

## 📊 Padrões de Key

| Pattern | Exemplo | TTL Padrão |
|---------|---------|------------|
| `barberzap:tenant:{shop_id}` | `barberzap:tenant:shop123` | 3600s |
| `barberzap:services:{shop_id}` | `barberzap:services:shop123` | 1800s |
| `barberzap:appointments:{shop_id}:{date}` | `barberzap:appointments:shop123:2026-03-04` | 300s |
| `barberzap:client:{client_id}` | `barberzap:client:client456` | 1800s |
| `barberzap:client:stats:{client_id}` | `barberzap:client:stats:client456` | 900s |
| `barberzap:queue:{shop_id}` | `barberzap:queue:shop123` | 900s |

## 🔍 Monitoramento

### Health Check Endpoint

```python
from cache import get_cache_manager

@app.route('/health/cache')
def cache_health():
    cache = get_cache_manager()
    return cache.get_health_status()
```

### Métricas Disponíveis

- **Hit Rate**: Porcentage de requisições servidas do cache
- **Latência**: Média e P95 de latência de operações
- **Redis Info**: Memória usada, total de keys, etc.
- **Uptime**: Tempo desde o início da aplicação

## 🧪 Testes

```bash
# Teste básico de conexão
python cache/example_usage.py

# Teste manual
python -c "from cache import get_cache_manager; cm = get_cache_manager(); print(cm.ping())"
```

## 📝 Exemplos de Uso

### API com Cache

```python
from flask import Flask
from cache import get_cache_manager
from config import build_key

app = Flask(__name__)
cache = get_cache_manager()

@app.route('/tenant/<shop_id>')
def get_tenant(shop_id):
    tenant = cache.get_or_fetch(
        build_key.tenant_key(shop_id),
        lambda: supabase.table('tenants').select('*').eq('id', shop_id).single().data
    )
    return tenant or {'error': 'Not found'}, 404
```

### Invalidação após Update

```python
@app.route('/tenant/<shop_id>', methods=['PUT'])
def update_tenant(shop_id):
    data = request.get_json()
    # Update no banco
    result = supabase.table('tenants').update(data).eq('id', shop_id).execute()
    
    # Invalidar cache
    cache.delete(build_key.tenant_key(shop_id))
    
    return result.data[0]
```

## ⚙️ Variáveis de Ambiente

```bash
# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_SSL=false

# TTL (segundos)
CACHE_TTL_TENANT=3600
CACHE_TTL_SERVICES=1800
CACHE_TTL_APPOINTMENTS=300
CACHE_TTL_CLIENT=1800

# Pool
REDIS_MAX_CONNECTIONS=50
REDIS_SOCKET_TIMEOUT=5

# Retry
REDIS_MAX_RETRIES=3
REDIS_RETRY_BASE_DELAY=0.5

# Métricas
CACHE_METRICS_ENABLED=true
```

## 🚧 Próximos Passos

1. **Configurar Redis Production**: Implementar Redis Cluster ou Redis Cloud
2. **Monitoramento**: Integrar com Prometheus/Grafana
3. **Alertas**: Configurar alertas de hit rate baixo
4. **Testes de Carga**: Validar performance sob alta carga
5. **Distributed Tracing**: Adicionar tracing para operações de cache

## 📞 Suporte

Para questões ou problemas:
- Verifique o `cache/README.md` para documentação detalhada
- Execute `cache/example_usage.py` para testar funcionalidades
- Verifique logs do Redis: `docker logs <redis-container>`

---

**Implementado:** 2026-03-04  
**Versão:** 1.0.0  
**Status:** ✅ FASE 1.3 Completa
