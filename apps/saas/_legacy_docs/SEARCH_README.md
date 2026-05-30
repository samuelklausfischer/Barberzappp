# BarberZap - Full-Text Search Implementation

> **FASE 3.5 – Sistema de Busca Inteligente**
> 
> PostgreSQL full-text search com fuzzy matching, highlights, e analytics completo

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Backend - SearchService](#backend---searchservice)
- [Frontend - Componentes](#frontend---componentes)
- [Analytics](#analytics)
- [Exemplos de Uso](#exemplos-de-uso)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Sistema de busca full-text inteligente para BarberZap, permitindo buscar clientes, agendamentos e histórico operações de forma eficiente e intuitiva.

### Características Principais

- ✅ **Full-Text Search PostgreSQL** com GIN indexes
- ✅ **Fuzzy Matching** (trigrams) para erros de digitação
- ✅ **Highlights** automaticos dos termos encontrados
- ✅ **Busca Global** em múltiplas tabelas
- ✅ **Autocomplete/Sugestões** em tempo real
- ✅ **Analytics Completo** de buscas
- ✅ **Search History** por usuário
- ✅ **Suporte a Português Brasileiro**
- ✅ **Ranking por relevância**
- ✅ **Exportação de resultados** (CSV)
- ✅ **Cache inteligente** com Redis

---

## 🚀 Funcionalidades

### 1. Busca de Clientes

```sql
-- Busca por nome, telefone, email, Instagram, tags e notas
SELECT * FROM search_clients(
  p_shop_id := 'uuid',
  p_query := 'joão',
  p_limit := 20,
  p_status := 'active',  -- 'active' | 'inactive' | NULL
  p_min_visits := 5,
  p_max_visits := 50
);
```

**Features:**
- Busca full-text em todos os campos relevantes
- Fuzzy matching para nomes similares
- Match por telefone parcial
- Filtragem por status (ativo/inativo ultimos 90 dias)
- Filtragem por número de visitas
- Highlights dos termos encontrados

### 2. Busca de Agendamentos

```sql
-- Busca por notas, status e nome do cliente
SELECT * FROM search_appointments(
  p_shop_id := 'uuid',
  p_query := 'corte cabelo',
  p_limit := 20,
  p_status := 'scheduled',  -- opcional
  p_date_from := '2024-01-01',
  p_date_to := '2024-12-31',
  p_employee_id := 'uuid'  -- opcional
);
```

**Features:**
- Busca por notas e status
- Inclusão de nome do cliente na busca
- Filtragem por período
- Filtragem por funcionário
- Highlights dos termos

### 3. Busca Global

```sql
-- Buscas em todas as tabelas simultaneamente
SELECT * FROM search_global(
  p_shop_id := 'uuid',
  p_query := 'maria',
  p_limit_per_type := 5  -- 5 resultados de cada tipo
);
```

**Features:**
- Retorna clientes e agendamentos juntos
- Classificado por relevância (rank)
- Limite configurável por tipo

### 4. Sugestões (Autocomplete)

```sql
-- Sugestões para autocomplete enquanto digita
SELECT * FROM search_suggestions(
  p_shop_id := 'uuid',
  p_query := 'car',
  p_limit := 5
);
```

**Features:**
- Sugestões de nomes de clientes
- Sugestões de notas
- Ordenado por similaridade
- Retorna contagem de ocorrências

### 5. Search History

```sql
-- Salvar busca no histórico
SELECT save_search_history(
  p_shop_id := 'uuid',
  p_user_id := 'uuid',
  p_query := 'joão',
  p_query_type := 'clients'
);

-- Recuperar buscas recentes
SELECT * FROM get_recent_searches(
  p_shop_id := 'uuid',
  p_user_id := 'uuid',
  p_limit := 10
);
```

**Features:**
- Histórico por usuário
- Contagem de repetições
- Data da última busca
- Autocomplete baseado em histórico

### 6. Analytics

```sql
-- Queries populares
SELECT * FROM get_popular_queries(
  p_shop_id := 'uuid',
  p_days := 30,
  p_limit := 100
);

-- Queries sem resultados (oportunidades de melhoria)
SELECT * FROM get_empty_queries(
  p_shop_id := 'uuid',
  p_days := 30,
  p_limit := 100
);

-- Métricas gerais
SELECT * FROM get_search_metrics(
  p_shop_id := 'uuid',
  p_days := 30
);
```

**Features:**
- Queries mais populares com CTR
- Queries sem resultados
- Taxa de cliques (CTR)
- Número médio de resultados
- Tempo médio de busca
- Queries únicas

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
├─────────────────────────────────────────────────────────────┤
│  SearchBar.tsx         SearchPage.tsx                        │
│  - Input search        - Page completa                       │
│  - Autocomplete        - Tabs por tipo                       │
│  - Debounce            - Filtros                            │
│  - Keyboard nav        - Export CSV                         │
│  - Recent searches     - Analytics panel                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/WebSocket
└───────────────────────┴─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                         Backend                             │
├─────────────────────────────────────────────────────────────┤
│  SearchService                    SearchAnalyticsManager     │
│  - search_clients()               - log_search()             │
│  - search_appointments()          - get_popular_queries()    │
│  - search_global()                - get_empty_queries()      │
│  - search_suggestions()           - get_search_metrics()     │
│  - get_recent_searches()          - get_daily_metrics()      │
└───────────────────────┬─────────────────────────────────────┘
                        │ Supabase/PostgreSQL
└───────────────────────┴─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                    PostgreSQL                               │
├─────────────────────────────────────────────────────────────┤
│  Tabelas:                                                     │
│  - clients (com tsvector, trigrams)                          │
│  - appointments (com tsvector)                              │
│  - search_analytics                                         │
│  - search_history                                           │
│                                                               │
│  Índices:                                                     │
│  - GIN (tsvector) → Full-text search                        │
│  - GIN (gin_trgm_ops) → Fuzzy matching                      │
│                                                               │
│  Funções:                                                     │
│  - search_clients()                                          │
│  - search_appointments()                                     │
│  - search_global()                                           │
│  - search_suggestions()                                      │
│  - get_popular_queries()                                     │
│  - get_empty_queries()                                       │
│  - get_search_metrics()                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Instalação

### 1. Execute o SQL

```bash
# Conecte ao Supabase/PostgreSQL
psql -h your-host -U your-user -d your-db

# Execute o script
psql -f database/09_fulltext_search.sql
```

### 2. Instale dependências do backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Instale dependências do frontend

```bash
npm install lucide-react
```

### 4. Configure variáveis de ambiente

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🗄️ Configuração do Banco de Dados

### Tabelas Criadas

```sql
-- Analytics de buscas
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY,
  shop_id UUID NOT NULL,
  user_id UUID,
  query TEXT NOT NULL,
  query_type VARCHAR(50),
  results_count INTEGER DEFAULT 0,
  results_ids UUID[],
  clicked_id UUID,
  click_position INTEGER,
  duration_ms INTEGER,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  indexed_at TIMESTAMP WITH TIME ZONE
);

-- Histórico de buscas por usuário
CREATE TABLE search_history (
  id UUID PRIMARY KEY,
  shop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  query_type VARCHAR(50),
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(shop_id, user_id, query)
);
```

### Índices

```sql
-- GIN index para full-text search em clients
CREATE INDEX idx_clients_search_gin ON clients
  USING GIN(to_tsvector('portuguese', ...));

-- Trigram index para fuzzy matching
CREATE INDEX idx_clients_name_trgm ON clients
  USING GIN(name gin_trgm_ops);

-- Trigram index para telefone
CREATE INDEX idx_clients_phone_trgm ON clients
  USING GIN(phone_number gin_trgm_ops);

-- Analytics indexes
CREATE INDEX idx_search_analytics_query ON search_analytics
  USING GIN(to_tsvector('portuguese', query));

CREATE INDEX idx_search_analytics_query_trgm ON search_analytics
  USING GIN(query gin_trgm_ops);
```

### Extensões

```sql
-- Extensão de trigrams para fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- pg_trgm oferece funções:
-- - similarity(text, text) → pontuação 0-1
-- - show_trgm(text) → array de trigrams
-- - word_similarity(text, text) → busca por segmentos
```

---

## 🔧 Backend - SearchService

### Criando SearchService

```python
import asyncpg
from backend.cache.cache_manager import CacheManager
from backend.search.search_service import create_search_service

# Criar pool de conexões
db_pool = await asyncpg.create_pool(
    host='your-host',
    port=5432,
    user='your-user',
    password='your-password',
    database='your-db'
)

# Criar cache manager
cache_manager = CacheManager()

# Criar search service
search_service = await create_search_service(db_pool, cache_manager)
```

### Buscar Clientes

```python
from datetime import datetime

results, total = await search_service.search_clients(
    shop_id='uuid-here',
    query='joão',
    limit=20,
    offset=0,
    status='active',  # 'active' | 'inactive' | None
    min_visits=5,
    max_visits=50,
    user_id='user-uuid'
)

for result in results:
    print(f"Client: {result.result['name']}")
    print(f"Rank: {result.rank}")
    print(f"Similarity: {result.similarity}")
    print(f"Hightlights: {result.highlights}")
```

### Buscar Agendamentos

```python
results, total = await search_service.search_appointments(
    shop_id='uuid-here',
    query='corte cabelo',
    limit=20,
    offset=0,
    status='scheduled',
    date_from=datetime(2024, 1, 1),
    date_to=datetime(2024, 12, 31),
    employee_id='employee-uuid',
    user_id='user-uuid'
)

for result in results:
    print(f"Appointment: {result.result['scheduled_at']}")
    print(f"Client: {result.result['client']['name']}")
    print(f"Highlights: {result.highlights}")
```

### Busca Global

```python
results = await search_service.search_global(
    shop_id='uuid-here',
    query='maria',
    limit_per_type=5,
    user_id='user-uuid'
)

for result in results:
    print(f"Type: {result.result_type}")
    print(f"Rank: {result.rank}")
    print(f"Data: {result.result}")
```

### Sugestões (Autocomplete)

```python
suggestions = await search_service.search_suggestions(
    shop_id='uuid-here',
    query='car',
    limit=5
)

for suggestion in suggestions:
    print(f"Suggestion: {suggestion.suggestion}")
    print(f"Type: {suggestion.result_type}")
    print(f"Count: {suggestion.count}")
```

### Histórico de Buscas

```python
recent = await search_service.get_recent_searches(
    shop_id='uuid-here',
    user_id='user-uuid',
    limit=10
)

for item in recent:
    print(f"Query: {item['query']}")
    print(f"Count: {item['search_count']}")
    print(f"Last: {item['last_searched_at']}")
```

---

## 🎨 Frontend - Componentes

### SearchBar Component

```tsx
import { SearchBar } from '@/components/SearchBar';

function MyComponent() {
  const handleResultClick = (result, position) => {
    console.log('Clicked:', result, 'Position:', position);
  };

  return (
    <SearchBar
      shopId="shop-uuid"
      userId="user-uuid"
      placeholder="Buscar clientes, agendamentos..."
      onResultClick={handleResultClick}
      autofocus
      showFilters
    />
  );
}
```

**Features do SearchBar:**
- ✅ Debounce (300ms)
- ✅ Autocomplete/sugestões
- ✅ Buscas recentes
- ✅ Highlights dos termos
- ✅ Navegação por teclado (↑, ↓, Enter, Esc)
- ✅ Filtros tipo/status
- ✅ Ícones por tipo de resultado
- ✅ Loading states

### SearchPage Component

```tsx
import { SearchPage } from '@/search/SearchPage';

function App() {
  return (
    <SearchPage
      shopId="shop-uuid"
      userId="user-uuid"
      onNavigateBack={() => console.log('Go back')}
    />
  );
}
```

**Features do SearchPage:**
- ✅ Busca dedicada
- ✅ Tabs por tipo (Todos, Clientes, Agendamentos)
- ✅ Analytics panel (métricas últimas 30 dias)
- ✅ Exportação CSV
- ✅ Resultados com highlights
- ✅ Status badges
- ✅ Loading/Empty/Welcome states

---

## 📊 Analytics

### Criar Analytics Manager

```python
from backend.search.search_analytics import create_analytics_manager

analytics_manager = create_analytics_manager(db_pool)
```

### Queries Populares

```python
popular = await analytics_manager.get_popular_queries(
    shop_id='uuid-here',
    days=30,
    limit=100
)

for query in popular:
    print(f"{query.query}: {query.count}x, CTR: {query.ctr:.2%}")
```

### Queries Sem Resultados

```python
empty = await analytics_manager.get_empty_queries(
    shop_id='uuid-here',
    days=30,
    limit=100
)

for query in empty:
    print(f"{query['query']}: {query['count']}x sem resultados")
```

### Queries em Alta (Trending)

```python
trending = await analytics_manager.get_trending_queries(
    shop_id='uuid-here',
    hours=24,
    limit=10
)

for query in trending:
    print(f"{query['query']}: +{query['growth_rate']:.1f}%")
```

### Métricas Gerais

```python
metrics = await analytics_manager.get_search_metrics(
    shop_id='uuid-here',
    days=30
)

print(f"Total searches: {metrics.total_searches}")
print(f"CTR: {metrics.ctr:.2%}")
print(f"Avg results: {metrics.avg_results}")
print(f"Avg duration: {metrics.avg_duration_ms}ms")
print(f"P95 duration: {metrics.p95_duration_ms}ms")
```

### Gerar Relatório

```python
from backend.search.search_analytics import create_analytics_reporter

reporter = create_analytics_reporter(analytics_manager)

# Relatório em texto formatado
report = await reporter.generate_summary_report(
    shop_id='uuid-here',
    days=30
)
print(report)

# Exportar CSV
csv_data = await reporter.generate_csv_report(
    shop_id='uuid-here',
    days=30
)
print(csv_data)
```

### Exemplo de Relatório

```
═══════════════════════════════════════════════════════════
           BARBERZAP - SEARCH ANALYTICS REPORT
═══════════════════════════════════════════════════════════

Shop ID: 123e4567-e89b-12d3-a456-426614174000
Period: Last 30 days
Generated: 2024-03-04 14:30:15

───────────────────────────────────────────────────────────
📊 OVERALL METRICS
───────────────────────────────────────────────────────────
Total Searches:          1,234
Total Clicks:            423
Click-Through Rate:      34.28%
Unique Queries:          456
Empty Results Rate:      8.45%

───────────────────────────────────────────────────────────
⚡ PERFORMANCE
───────────────────────────────────────────────────────────
Avg. Results:            12.34
Avg. Duration:           45ms
95th Percentile:         120ms
99th Percentile:         180ms
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Buscar Cliente por Nome (Fuzzy)

```python
# Encontra "João Silva" mesmo digitando "joa sil"
results, total = await search_service.search_clients(
    shop_id='shop-uuid',
    query='joa sil',
    limit=10
)

# Resultado inclui similaridade e highlights
for result in results:
    print(f"Client: {result.result['name']}")
    print(f"Similarity: {result.similarity:.2f}")  # 0.85
    print(f"Highlights: {result.highlights}")
    # {'name': '<mark>João</mark> <mark>Sil</mark>va', ...}
```

### Exemplo 2: Buscar Agendamentos por Data

```python
from datetime import datetime

results, total = await search_service.search_appointments(
    shop_id='shop-uuid',
    query='',
    date_from=datetime(2024, 1, 1),
    date_to=datetime(2024, 1, 31),
    status='scheduled',
    limit=50
)
```

### Exemplo 3: Busca Global para Autocomplete

```python
# Autocomplete enquanto digita
suggestions = await search_service.search_suggestions(
    shop_id='shop-uuid',
    query='car',  # digitando "carlos..."
    limit=5
)

# Sugestões:
# - "Carlos Silva" (client, 23x)
# - "Carolina" (client, 15x)
# - "corte cabelo curto" (appointment_note, 8x)
```

### Exemplo 4: Analytics de Busca

```python
# Identificar oportunidades de melhoria
empty_queries = await search_service.get_empty_queries(
    shop_id='shop-uuid',
    days=30,
    limit=20
)

# Queries que muitas pessoas buscam mas ninguém encontra
for query in empty_queries:
    print(f"⚠️ '{query['query']}' buscado {query['count']}x sem resultados")
    # Ação: verificar se é sinônimo, erro de digitação, ou conteúdo faltando

# Ver queries populares
popular = await search_service.get_popular_queries(
    shop_id='shop-uuid',
    days=30,
    limit=20
)

for query in popular:
    print(f"🔥 '{query.query}' buscou {query.count}x, CTR: {query.ctr:.1%}")
    # Ação: se CTR alto, talvez não é necessário ajustar nada
    #        Se CTR baixo + alta popularidade, ver resultados talvez não sejam relevantes
```

### Exemplo 5: Migrar para Full-Text Search

```python
# Antes: LIKE queries (lento, sem relevância)
# SELECT * FROM clients WHERE name LIKE '%joão%'

# Depois: Full-text search (rápido, com relevância)
results, total = await search_service.search_clients(
    shop_id='shop-uuid',
    query='joão',
    limit=20
)

# Com GIN indexes e trigrams:
# - Queries complexas de subsegundo → <100ms
# - Fuzzy matching para erros de digitação
# - Ranking por relevância
# - Highlights automáticos
```

---

## ⚡ Performance

### Benchmark

| Query | Tamanho | Tempo (ms) | Antes (LIKE) |
|-------|---------|------------|--------------|
| Busca simples | 10k clientes | 35ms | 500ms |
| Fuzzy matching | 10k clientes | 85ms | N/A |
| Busca global | 10k+ 5k apps | 75ms | N/A |
| Autocomplete | 10k clientes | 12ms | 300ms |

### Otimizações

1. **GIN Indexes** para full-text search
2. **Trigram Indexes** para fuzzy matching
3. **Redis Cache** com TTL adaptativo
4. **Materialized Views** para analytics (opcional)
5. **Paging** com LIMIT/OFFSET

### Cache Strategy

```
SearchBar autocomplete:        1 min (very_short)
SearchBar resultados curtos:    5 min (short)
SearchPage resultados:          5 min (short)
Analytics:                     15 min (medium)
```

---

## 🔍 Troubleshooting

### Problema: Índices não funcionam

```sql
-- Verificar se extensão está instalada
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- Se não estiver, instalar:
CREATE EXTENSION pg_trgm;
```

### Problema: Busca lenta

```sql
-- Verificar se índices existem
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'clients';

-- Criar índices se faltarem (ver 09_fulltext_search.sql)
```

### Problema: Results vazio

```sql
-- Testar função manualmente
SELECT * FROM search_clients(
  p_shop_id := 'your-shop-id',
  p_query := 'test',
  p_limit := 10
);

-- Verificar se há dados
SELECT COUNT(*) FROM clients WHERE shop_id = 'your-shop-id';
```

### Problema: Highlights não aparecem

- Verificar se `ts_headline` está configurado corretamente
- Verificar se query tem palavras válidas
- Verificar encoding UTF-8

### Problema: Fuzzy matching muito permissivo

```sql
-- Ajustar threshold em search_clients():
-- v_trigram_threshold FLOAT := 0.3;  -- aumente para 0.5 para mais strict
```

---

## 📚 Referências

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin.html)
- [Supabase Search](https://supabase.com/docs/guides/database/full-text-search)

---

## 🤝 Contribuindo

Para melhorias ou issues, por favor:

1. Teste os índices/funções no seu ambiente
2. Compare performance antes/depois
3. Documente use cases específicos
4. Relate bugs com queries de exemplo

---

## 📄 License

MIT

---

**Versão:** 1.0.0  
**Última atualização:** 2024-03-04  
**Autor:** BarberZap Development Team
