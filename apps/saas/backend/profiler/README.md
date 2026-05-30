# BarberZap Performance Profiler

Sistema completo de profiling e monitoramento de performance para BarberZap.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Componentes](#componentes)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Dashboard](#dashboard)
- [CLI](#cli)
- [Alertas](#alertas)
- [Flame Graphs](#flame-graphs)
- [Melhores Práticas](#melhores-práticas)

## 🔍 Visão Geral

O Performance Profiler do BarberZap coleta métricas de performance em tempo real, ajudando a identificar e corrigir gargalos de performance no backend e no frontend.

### Recursos

- ✅ **Middleware Profiling Automatico**: Coleta métricas de todas as requests HTTP
- ✅ **SQL Query Profiling**: Detecta queries lentas e N+1 queries
- ✅ **React Component Profiling**: Mede tempo de renderização de componentes
- ✅ **Cache Metrics**: Monitora hit rate e patterns de cache
- ✅ **Performance Dashboard**: Dashboard visual com métricas em tempo real
- ✅ **Alerting**: Alertas automáticos quando thresholds são excedidos
- ✅ **Flame Graphs**: Visualização hierárquica de execução de código
- ✅ **CLI**: Interface de linha de comando para análise de dados

## 🧩 Componentes

### Backend (Python)

#### `profiling_middleware.py`
Middleware Starlette para profiling automático de requests.

**Métricas coletadas:**
- Tempo de execução da request
- Quantidade e tempo de queries SQL
- Cache hits/misses
- Tamanho de request/response
- Stack frames para requests lentos

#### `backend_profiler.py`
Decoradores para profiling de funções Python.

**Decoradores:**
- `@profile_function()`: Profile tempo, memória, CPU de funções
- `@profile_endpoint()`: Profile endpoints FastAPI
- `profile_context()`: Context manager para blocos de código

#### `queries_profiler.py`
Profiling de queries SQL.

**Features:**
- Log automático de queries com tempo de execução
- Análise de planos de execução (EXPLAIN)
- Detecção de queries N+1
- Recomendações de index

#### `alerting.py`
Sistema de alertas de performance.

**Tipos de alerta:**
- High latency (>500ms)
- Slow query (>100ms)
- Low cache hit rate (<70%)
- High memory usage (>80%)
- High error rate (>1%)

**Canais:**
- Log (sempre)
- Slack Webhook
- Teams Webhook
- Email

#### `flamegraph_generator.py`
Gerador de flame graphs para visualização de performance.

**Formatos:**
- SVG flame graph
- JSON format (d3.js compatible)
- Chrome DevTools Profile format

#### `profiler_cli.py`
Interface de linha de comando.

**Comandos:**
```bash
profiler status          # Mostrar status
profiler endpoints       # Endpoints mais lentos
profiler queries         # Queries mais lentas
profiler cache           # Estatísticas de cache
profiler dump            # Exportar dados
profiler reset           # Limpar dados
profiler alerts          # Mostrar alertas
```

### Frontend (TypeScript/React)

#### `Profiler.tsx`
Componente wrapper do React Profiler.

```tsx
<Profiler id="MyComponent" onRender={handleRender}>
  <MyComponent />
</Profiler>
```

#### `usePerformance.ts`
Hooks de performance para componentes React.

- `useMeasureRenderTime()`: Mede tempo de renderização
- `useMeasureComponentRender()`: Mede ciclos completos
- `useMeasureCallbackTime()`: Mede tempo de callbacks
- `useMeasureMutationTime()`: Mede tempo de mutations

#### `PerformanceDashboard.tsx`
Dashboard completo de visualização de métricas.

**Visualizações:**
- Latency percentiles (P50, P95, P99)
- Slowest endpoints
- Slowest queries
- Cache hit rate
- Component render times
- Memory/CPU usage
- Heatmaps

### Database

#### `19_performance_metrics.sql`
Tabelas para armazenamento de métricas persistentes.

**Tabelas:**
- `performance_request_metrics`: Métricas de requests HTTP
- `performance_query_metrics`: Métricas dequeries SQL
- `performance_cache_metrics`: Métricas de cache
- `performance_component_metrics`: Métricas de componentes React
- `performance_alerts`: Histórico de alertas
- `performance_flamegraph_data`: Dados de flame graphs

## 📦 Instalação

### 1. Backend

Instalar dependências:

```bash
cd /root/barber/backend

# Opcional: py-spy para flame graphs avançados
pip install py-spy
```

### 2. Database

Aplicar migração SQL:

```bash
psql -U postgres -d barber -f database/19_performance_metrics.sql
```

### 3. Frontend

Os componentes React já estão disponíveis no projeto:

```bash
# Nenhuma instalação adicional necessária
# Os arquivos já estão em:
# - src/profiler/ReactProfiler.tsx
# - src/profiler/usePerformance.ts
# - src/components/PerformanceDashboard.tsx
```

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Configurações do Profiler
PROFILER_ENABLED=true                    # Habilitar/desabilitar profiler
PROFILER_SAMPLING_RATE=0.1              # Taxa de sampling (0.0 - 1.0)
PROFILER_SLOW_REQUEST_THRESHOLD=500      # Threshold de request lenta (ms)
PROFILER_SLOW_QUERY_THRESHOLD=100       # Threshold de query lenta (ms)
PROFILER_TRACK_MEMORY=false             # Tracking de memória (caro)
PROFILER_TRACK_CPU=false                # Tracking de CPU (caro)
PROFILER_REDIS_TTL=3600                 # TTL dos dados no Redis (segundos)

# Alertas
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/...
ALERT_TEAMS_WEBHOOK=https://outlook.office.com/webhook/...
ALERT_EMAIL_ENABLED=false
ALERT_EMAIL_RECIPIENTS=ops@barberzap.com

# Ambiente
ENVIRONMENT=development                  # development/test/production
```

### Habilitar Profiling Middleware

No `backend/main.py` ou `backend/app.py`:

```python
from profiler.profiling_middleware import ProfilingMiddleware
from profiler.alerting import start_alerting_monitor, setup_channels_from_env

app = FastAPI()

# Adicionar middleware de profiling
app.add_middleware(ProfilingMiddleware)

# Iniciar monitoramento de alertas em background
@app.on_event("startup")
async def startup():
    setup_channels_from_env()
    asyncio.create_task(start_alerting_monitor(interval_seconds=60))
```

### Criar API Endpoints

Adicionar ao `backend/api/`:

```python
# backend/api/performance.py

from fastapi import APIRouter, Query
from profiler.profiling_middleware import ProfilingConfig
from profiler.queries_profiler import get_query_stats_summary
from profiler.backend_profiler import get_registry
from profiler.alerting import get_alerting_manager

router = APIRouter(prefix="/api/profiler", tags=["profiler"])

@router.get("/metrics")
async def get_metrics():
    """Retorna métricas de performance agregadas"""
    query_stats = await get_query_stats_summary()
    registry = get_registry()
    
    return {
        "config": {
            "enabled": ProfilingConfig.ENABLED,
            "sampling_rate": ProfilingConfig.SAMPLING_RATE,
            "slow_request_threshold": ProfilingConfig.SLOW_REQUEST_THRESHOLD,
            "slow_query_threshold": ProfilingConfig.SLOW_QUERY_THRESHOLD
        },
        "queries": query_stats,
        "functions": await registry.get_stats()
    }

@router.get("/endpoints")
async def get_endpoints_slowest(limit: int = Query(20, le=100)):
    """Retorna endpoints mais lentos"""
    # Implementar usando Redis
    pass

@router.get("/queries")
async def get_queries_slowest(limit: int = Query(20, le=100)):
    """Retorna queries mais lentas"""
    storage = get_profiler_storage()
    slow_queries = await storage.get_slow_queries(limit)
    
    return {
        "queries": [
            {
                "query_hash": q.query_hash,
                "query_preview": q.query_preview,
                "duration_ms": q.duration_ms,
                "endpoint": q.endpoint,
                "is_slow": q.is_slow
            }
            for q in slow_queries
        ]
    }

@router.get("/heatmap")
async def get_heatmap(range: str = Query("1h")):
    """Retorna dados para heatmap de latências"""
    # Implementar usando Redis e database
    pass

@router.get("/alerts")
async def get_alerts():
    """Retorna alertas ativos"""
    manager = get_alerting_manager()
    alerts = await manager.get_recent_alerts(50)
    
    return {
        "alerts": [
            {
                "id": a.id,
                "type": a.type.value,
                "severity": a.severity.value,
                "message": a.message,
                "timestamp": a.timestamp.isoformat()
            }
            for a in alerts
        ]
    }

@router.post("/flamegraph/generate")
async def generate_flamegraph():
    """Gera flame graph dos dados do profiler"""
    from profiler.flamegraph_generator import generate_flamegraph
    
    svg = await generate_flamegraph()
    
    return {
        "flamegraph svg": svg
    }
```

## 🚀 Uso

### Backend Profiling

#### Profiling de Funções

```python
from profiler.backend_profiler import profile_function

@profile_function(track_memory=True, track_cpu=True)
async def expensive_calculation(data: list) -> list:
    result = []
    for item in data:
        # Processamento pesado
        processed = await heavy_operation(item)
        result.append(processed)
    return result
```

#### Profiling de Endpoints

```python
from profiler.backend_profiler import profile_endpoint

@profile_endpoint(min_slow_threshold=100)
@app.get("/api/expensive")
async def expensive_endpoint():
    # Endpoint lento será profiled
    result = await expensive_operation()
    return {"result": result}
```

#### Profiling de Queries

```python
from profiler.queries_profiler import profile_query

async def get_user(user_id: int):
    async with profile_query(conn, "SELECT * FROM users WHERE id = $1", params={'id': user_id}) as (result, duration):
        return await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
```

### Frontend Profiling

#### Component Profiler

```tsx
import { Profiler } from '@/profiler/ReactProfiler';

<Profiler id="MyComponent" onRender={(id, phase, duration) => {
  console.log(`${id} ${phase}: ${duration}ms`);
}}>
  <MyComponent />
</Profiler>
```

#### HOC Wrapper

```tsx
import { withProfiler } from '@/profiler/ReactProfiler';

const ProfiledComponent = withProfiler(MyComponent);

export default ProfiledComponent;
```

#### Performance Hooks

```tsx
import { useMeasureRenderTime } from '@/profiler/usePerformance';

function MyComponent() {
  const { metrics, measureRender } = useMeasureRenderTime('MyComponent');
  
  useEffect(() => {
    measureRender('mount');
  }, []);
  
  return (
    <div>
      <div>Renders: {metrics.count}</div>
      <div>Avg Time: {metrics.avgDuration.toFixed(2)}ms</div>
    </div>
  );
}
```

## 📊 Dashboard

### Acessar o Dashboard

O dashboard está disponível em:

```
https://barberzap.com/performance
```

Ou rotear no React Router:

```tsx
import { PerformanceDashboard } from '@/components/PerformanceDashboard';

<Route path="/performance" element={<PerformanceDashboard />} />
```

### Métricas no Dashboard

- **P50/P95/P99 Latency**: Percentis de latência de requests
- **Slowest Endpoints**: Top endpoints mais lentos
- **Slowest Queries**: Top queries SQL mais lentas
- **Cache Hit Rate**: Taxa de acerto do cache
- **Component Render Times**: Tempo de renderização dos componentes
- **Memory/CPU Usage**: Uso de recursos do sistema
- **Heatmap**: Visualização de latência por endpoint x tempo

## 💻 CLI

### Comandos Disponíveis

```bash
# Mostrar status do profiler
python -m profiler.profiler_cli status

# Ver endpoints mais lentos
python -m profiler.profiler_cli endpoints --limit 20

# Ver queries mais lentas
python -m profiler.profiler_cli queries --limit 20

# Ver estatísticas de cache
python -m profiler.profiler_cli cache

# Mostrar alertas ativos
python -m profiler.profiler_cli alerts

# Exportar dados JSON
python -m profiler.profiler_cli dump --format json --output profiler_data.json

# Gerar flame graph SVG
python -m profiler.profiler_cli dump --format svg --output flamegraph.svg

# Limpar todos os dados
python -m profiler.profiler_cli reset --force
```

### Atalhos (bash)

Adicionar ao `~/.bashrc`:

```bash
alias profiler='python /root/barber/backend/profiler/profiler_cli.py'
```

## 🚨 Alertas

### Configurar Alertas

```python
import os
from profiler.alerting import get_alerting_manager, AlertThreshold, AlertType, AlertSeverity

manager = get_alerting_manager()

# Adicionar threshold customizado
manager.add_custom_threshold(
    name='custom_high_latency',
    alert_type=AlertType.HIGH_LATENCY,
    severity=AlertSeverity.CRITICAL,
    threshold=1000,  # 1 segundo
    window_seconds=300
)
```

### Canais de Notificação

```bash
# Slack
export ALERT_SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Teams
export ALERT_TEAMS_WEBHOOK="https://outlook.office.com/webhook/YOUR/WEBHOOK"

# Email
export ALERT_EMAIL_ENABLED="true"
export ALERT_EMAIL_RECIPIENTS="ops@barberzap.com,dev@barberzap.com"
```

## 🔥 Flame Graphs

### Gerar Flame Graph

#### Pelo CLI

```bash
python -m profiler.profiler_cli dump --format svg --output flamegraph.svg
```

#### Pela API

```bash
curl -X POST http://localhost:8000/api/profiler/flamegraph/generate \
  -o flamegraph.svg
```

#### Usando py-spy (avançado)

```bash
# Capture do processo em execução
py-spy record -p $(pgrep -f "uvicorn") -o profile.svg -d 10
```

### Interpretação do Flame Graph

- **Eixo X**: Tempo de amostragem (não é cronológico)
- **Eixo Y**: Profundidade da stack de chamadas
- **Largura**: Tempo que a função ocupou a CPU
- **Cores**: Quanto mais quente (laranja/vermelho), mais tempo da função na CPU

## 📈 Melhores Práticas

### Performance Profiling

1. **Só profile production sampling rate baixo**
   - Development: 100% (todos os requests)
   - Staging: 10-20%
   - Production: 1-5%

2. **Use thresholds inteligentes**
   - P50 < 200ms
   - P95 < 500ms
   - P99 < 1000ms

3. **Foque nos gargalos primeiro**
   - Endpoints mais lentos (top 5)
   - Queries mais lentas (top 10)
   - Componentes com mais re-renders

### SQL Queries

1. **Sempre use índices**
   - Analise planos de execução
   - Crie índices para WHERE, JOIN, ORDER BY

2. **Evite N+1 queries**
   - Use JOIN ou prefetch_related
   - Batch loading quando possível

3. **Query complexity**
   - Evite subqueries complexas
   - Use CTEs para readability
   - Limite resultados com LIMIT

### React Components

1. **Minimize re-renders**
   - Use React.memo para componentes estáticos
   - UseMemo/useCallback para valores e callbacks
   - Perfilar hotspots com Profiler

2. **Code splitting**
   - Use lazy loading para componentes pesados
   - Separação por rotas

3. **Virtualização**
   - Use react-window ou react-virtualized para listas grandes

### Cache

1. **Hit rate > 70%**
   - Cache hit rate abaixo de 70% indica problemas
   - Analise patterns com baixa taxa

2. **TTL adequado**
   - Dados voláteis: TTL curto (1-5 min)
   - Dados estáticos: TTL longo (1h+)
   - Considerar stale-while-revalidate

## 🔧 Troubleshooting

### Profiler não está coletando dados

```bash
# Verificar variáveis de ambiente
echo $PROFILER_ENABLED
echo $PROFILER_SAMPLING_RATE

# Verificar conexão Redis
redis-cli KEYS "profiling:*"

# Verificar logs
tail -f logs/profiler.log
```

### Data not appearing in dashboard

```bash
# Verificar API endpoints
curl http://localhost:8000/api/profiler/metrics

# Verificar conexões database
psql -U postgres -d barber -c "SELECT COUNT(*) FROM performance_request_metrics;"
```

### High memory usage

```bash
# Reduzir sampling rate
PROFILER_SAMPLING_RATE=0.01

# Desabilitar tracking de memória
PROFILER_TRACK_MEMORY=false
```

## 📚 Referências

- [React Profiler API](https://react.dev/reference/react/Profiler)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [py-spy](https://github.com/benfred/py-spy)
- [Flame Graphs](http://www.brendangregg.com/flamegraphs.html)

## 🤝 Contribuindo

Para adicionar novas features ao profiler:

1. Adicionar feature ao backend (`backend/profiler/`)
2. Adicionar métricas ao database (`database/`)
3. Adicionar visualização ao frontend (`src/components/` ou `src/profiler/`)
4. Documentar neste README

## 📄 Licença

Este código é parte do projeto BarberZap. © 2024 BarberZap.
