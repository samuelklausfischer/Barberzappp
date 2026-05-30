"""
BarberZap - SQL Query Profiler

Profiler automático para queries SQL.
Identifica slow queries, analisa planos de execução, detecta N+1 queries

Features:
- Log automático de todas as queries com tempo de execução
- Identificação de slow queries (> 50ms)
- Análise de query plan (EXPLAIN ANALYZE)
- Recomendações de index
- Detecção de queries N+1
- Agregação por endpoint
- Top 100 slow queries
- Histórico de 7 dias

Uso:
    # No repository ou database layer
    from profiler.queries_profiler import profile_query
    
    async with profile_query(conn, "SELECT * FROM users"):
        await conn.execute("SELECT * FROM users")
"""

import time
import re
import hashlib
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple, ContextManager
from dataclasses import dataclass, field
from collections import defaultdict
from functools import wraps

import asyncpg


@dataclass
class QueryProfile:
    """Perfil de uma query SQL"""
    query_hash: str
    query_normalized: str
    query_preview: str  # Primeiros 200 caracteres
    query_type: str  # SELECT, INSERT, UPDATE, DELETE, etc.
    
    duration_ms: float
    timestamp: datetime
    
    # Métricas do plano de execução
    execution_plan: Optional[Dict[str, Any]] = None
    rows_affected: Optional[int] = None
    rows_scanned: Optional[int] = None
    
    # Diagnósticos
    is_slow: bool = False
    is_sequential_scan: bool = False
    missing_indexes: List[str] = field(default_factory=list)
    n_plus_one_detected: bool = False
    
    # Contexto
    endpoint: Optional[str] = None
    shop_id: Optional[str] = None
    request_id: Optional[str] = None


class QueryProfileStorage:
    """Armazenamento de profiles de queries"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self._profiles: Dict[str, List[QueryProfile]] = defaultdict(list)
        self._slow_queries: List[QueryProfile] = []
        self._query_patterns: Dict[str, List[QueryProfile]] = defaultdict(list)
        self._lock = asyncio.Lock()
        self._max_profiles = 10000
        self._max_slow_queries = 1000
        
        # Configurações
        self.slow_threshold_ms = 50
        self.retention_days = 7
    
    async def add_profile(self, profile: QueryProfile):
        """Adiciona um profile de query"""
        async with self._lock:
            # Adicionar ao geral
            self._profiles[profile.query_hash].append(profile)
            if len(self._profiles[profile.query_hash]) > 1000:
                self._profiles[profile.query_hash] = self._profiles[profile.query_hash][-1000:]
            
            # Adicionar aos slow queries se aplicável
            if profile.is_slow:
                self._slow_queries.append(profile)
                if len(self._slow_queries) > self._max_slow_queries:
                    self._slow_queries = self._slow_queries[-self._max_slow_queries:]
            
            # Adicionar ao padrão
            pattern = self._extract_query_pattern(profile.query_normalized)
            self._query_patterns[pattern].append(profile)
            
            # Persistir no Redis se disponível
            if self.redis:
                await self._persist_to_redis(profile)
    
    async def _persist_to_redis(self, profile: QueryProfile):
        """Persiste profile no Redis"""
        try:
            key = f"profiling:queries:{profile.query_hash}"
            value = json.dumps({
                'hash': profile.query_hash,
                'query': profile.query_normalized,
                'duration_ms': profile.duration_ms,
                'timestamp': profile.timestamp.isoformat(),
                'is_slow': profile.is_slow,
                'endpoint': profile.endpoint,
                'rows_affected': profile.rows_affected
            })
            
            # TTL de 7 dias
            await self.redis.setex(key, 7 * 24 * 3600, value)
            
            # Adicionar ao timeline
            await self.redis.zadd(
                'profiling:queries:timeline',
                {key: profile.timestamp.timestamp()}
            )
            
            # Adicionar ao sorted set de slow queries
            if profile.is_slow:
                await self.redis.zadd(
                    'profiling:queries:slow',
                    {f"{key}:{profile.timestamp.timestamp()}": profile.duration_ms}
                )
            
            # Manter apenas top 1000 slow
            await self.redis.zremrangebyrank('profiling:queries:slow', 0, -1001)
            
        except Exception as e:
            # Não falhar por erro de persistência
            pass
    
    async def get_slow_queries(self, limit: int = 100) -> List[QueryProfile]:
        """Retorna as queries mais lentas"""
        async with self._lock:
            sorted_slow = sorted(
                self._slow_queries,
                key=lambda x: x.duration_ms,
                reverse=True
            )
            return sorted_slow[:limit]
    
    async def get_top_queries_by_endpoint(self, endpoint: str, limit: int = 20) -> List[QueryProfile]:
        """Retorna as queries mais executadas em um endpoint"""
        async with self._lock:
            endpoint_queries = [
                p for p in self._slow_queries
                if p.endpoint == endpoint
            ]
            
            # Agrupar por hash
            by_hash = defaultdict(list)
            for p in endpoint_queries:
                by_hash[p.query_hash].append(p)
            
            # Calcular stats
            results = []
            for hash_key, profiles in by_hash.items():
                avg_duration = sum(p.duration_ms for p in profiles) / len(profiles)
                results.append({
                    'query_hash': hash_key,
                    'query_preview': profiles[0].query_preview,
                    'avg_duration_ms': avg_duration,
                    'count': len(profiles),
                    'max_duration_ms': max(p.duration_ms for p in profiles),
                    'total_duration_ms': sum(p.duration_ms for p in profiles)
                })
            
            # Ordenar por total time
            results.sort(key=lambda x: x['total_duration_ms'], reverse=True)
            return results[:limit]
    
    async def get_n_plus_one_queries(self, endpoint: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retorna queries com padrão N+1 detectado"""
        async with self._lock:
            n_plus_one = []
            
            for hash_key, profiles in self._query_patterns.items():
                # Detectar padrão N+1
                # Mesma query executada muitas vezes na mesma request
                if len(profiles) > 3:  # Threshold
                    # Check se foram executadas em close succession
                    timestamps = [p.timestamp for p in profiles]
                    min_t = min(timestamps)
                    max_t = max(timestamps)
                    
                    # Se executaram em menos de 1 segundo
                    if (max_t - min_t).total_seconds() < 1.0:
                        n_plus_one.append({
                            'query_pattern': hash_key,
                            'query_preview': profiles[0].query_preview,
                            'execution_count': len(profiles),
                            'total_duration_ms': sum(p.duration_ms for p in profiles),
                            'endpoint': endpoint or profiles[0].endpoint,
                            'first_seen': min_t.isoformat(),
                            'suggested_fix': self._suggest_n_plus_one_fix(profiles[0])
                        })
            
            return n_plus_one
    
    async def get_index_recommendations(self) -> List[Dict[str, Any]]:
        """Retorna recomendações de index baseadas nas queries"""
        async with self._lock:
            recommendations = []
            
            # Analisar slow queries para missing indexes
            for profile in self._slow_queries:
                if profile.missing_indexes:
                    for index_col in profile.missing_indexes:
                        recommendations.append({
                            'query_hash': profile.query_hash,
                            'query_preview': profile.query_preview,
                            'avg_duration_ms': profile.duration_ms,
                            'suggested_index': f"CREATE INDEX idx_suggested ON ??? ({', '.join(index_col)})",
                            'rationale': f"Query executada em {profile.duration_ms:.2f}ms com sequential scan"
                        })
            
            return recommendations
    
    def _extract_query_pattern(self, query: str) -> str:
        """Extrai padrão da query (remove literals)"""
        normalized = re.sub(r"'[^']*'", "?", query)
        normalized = re.sub(r'\b\d+\b', "?", normalized)
        normalized = re.sub(r'\s+', " ", normalized).strip()
        return normalized
    
    def _suggest_n_plus_one_fix(self, profile: QueryProfile) -> str:
        """Sugere correção para query N+1"""
        if "SELECT" in profile.query_normalized and "WHERE" in profile.query_normalized:
            return "Consider using JOIN or select_related/ prefetch_related to fetch in single query"
        return "Add batch loading or caching for this query pattern"


# ============================================
# Profiling Context
# ============================================

_global_storage = QueryProfileStorage()


def set_profiler_storage(storage: QueryProfileStorage):
    """Define o storage global de profiles"""
    global _global_storage
    _global_storage = storage


def get_profiler_storage() -> QueryProfileStorage:
    """Retorna o storage global de profiles"""
    return _global_storage


def _normalize_query(query: str) -> str:
    """Normaliza query para análise"""
    # Remove comments
    query = re.sub(r'--[^\n]*', '', query)
    query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
    
    # Normalize whitespace
    query = ' '.join(query.split())
    
    # Remove extra whitespace before/after operators
    query = re.sub(r'\s*([=,()])\s*', r'\1', query)
    
    return query.strip()


def _hash_query(query: str) -> str:
    """Gera hash da query"""
    normalized = _normalize_query(query)
    return hashlib.md5(normalized.encode()).hexdigest()


def _detect_query_type(query: str) -> str:
    """Detecta o tipo da query"""
    query_upper = query.strip().upper()
    
    for qtype in ['UPDATE', 'INSERT', 'DELETE', 'SELECT', 'CREATE', 'ALTER', 'DROP']:
        if query_upper.startswith(qtype):
            return qtype
    
    return 'OTHER'


@asynccontextmanager
async def profile_query(
    conn: asyncpg.Connection,
    query: str,
    params: Optional[Dict] = None,
    endpoint: Optional[str] = None,
    shop_id: Optional[str] = None,
    request_id: Optional[str] = None
) -> ContextManager[Tuple[Any, float]]:
    """
    Context manager para profiling de queries.
    
    Args:
        conn: Conexão asyncpg
        query: Query SQL
        params: Parâmetros da query
        endpoint: Endpoint onde a query foi executada
        shop_id: Shop ID se aplicável
        request_id: Request ID se aplicável
    
    Returns:
        Tupla (result, duration_ms)
    
    Usage:
        async with profile_query(conn, "SELECT * FROM users") as (result, duration):
            rows = await conn.fetch("SELECT * FROM users")
    """
    start_time = time.perf_counter()
    query_hash = _hash_query(query)
    query_normalized = _normalize_query(query)
    
    result = None
    execution_plan = None
    rows_affected = None
    
    try:
        # Executar query
        if params:
            result = await conn.execute(query, *params.values())
        else:
            result = await conn.execute(query)
        
        duration_ms = (time.perf_counter() - start_time) * 1000
        
        # Extrair rows se for SELECT
        if query.strip().upper().startswith('SELECT'):
            rows = await conn.fetch(query, *(params.values() if params else []))
            rows_affected = len(rows)
            result = rows
        
        # Analisar plano de execução para slow queries
        storage = get_profiler_storage()
        if duration_ms >= storage.slow_threshold_ms:
            try:
                plan = await conn.fetchval(f"EXPLAIN {query}", *(params.values() if params else []))
                execution_plan = {'explain': plan}
            except Exception:
                pass
        
        # Criar profile
        profile = QueryProfile(
            query_hash=query_hash,
            query_normalized=query_normalized,
            query_preview=query[:200],
            query_type=_detect_query_type(query),
            duration_ms=duration_ms,
            timestamp=datetime.now(timezone.utc),
            execution_plan=execution_plan,
            rows_affected=rows_affected,
            is_slow=(duration_ms >= storage.slow_threshold_ms),
            endpoint=endpoint,
            shop_id=shop_id,
            request_id=request_id
        )
        
        # Detectar sequential scan no plano
        if execution_plan:
            if 'Seq Scan' in str(execution_plan):
                profile.is_sequential_scan = True
                # Sugerir index
                if 'WHERE' in query_normalized.upper():
                    profile.missing_indexes = [_extract_where_columns(query_normalized)]
        
        # Detectar N+1 pattern
        async with storage._lock:
            recent_pattern_queries = [
                p for p in storage._query_patterns.get(query_normalized, [])
                if (datetime.now(timezone.utc) - p.timestamp).total_seconds() < 1.0
            ]
            if len(recent_pattern_queries) >= 3:
                profile.n_plus_one_detected = True
        
        # Armazenar profile
        await storage.add_profile(profile)
        
        yield (result, duration_ms)
        
    except Exception as e:
        # Mesmo com erro, profile a execução
        duration_ms = (time.perf_counter() - start_time) * 1000
        
        profile = QueryProfile(
            query_hash=query_hash,
            query_normalized=query_normalized,
            query_preview=query[:200],
            query_type=_detect_query_type(query),
            duration_ms=duration_ms,
            timestamp=datetime.now(timezone.utc),
            is_slow=(duration_ms >= storage.slow_threshold_ms),
            endpoint=endpoint,
            shop_id=shop_id,
            request_id=request_id
        )
        
        await storage.add_profile(profile)
        raise


def _extract_where_columns(query: str) -> List[str]:
    """Extrai colunas do WHERE clause para sugestão de index"""
    columns = []
    
    # Padrão simples para colunas no WHERE
    where_match = re.search(r'WHERE\s+(.*?)(?:\s+(?:GROUP|ORDER|LIMIT|$))', query, re.IGNORECASE)
    if where_match:
        where_clause = where_match.group(1)
        
        # Extrair identificadores simples
        col_matches = re.findall(r'\b([a-z_][a-z0-9_]*)\s*[=<>]', where_clause, re.IGNORECASE)
        columns.extend([col for col in col_matches if col not in ['and', 'or', 'not']])
    
    return list(set(columns))


# Decorator para repositories
def profile_query_method(
    slow_threshold_ms: int = 50,
    analyze_plan: bool = True
):
    """
    Decorador para métodos de repository que executam queries.
    
    Usage:
        class UserRepository:
            @profile_query_method(slow_threshold_ms=100)
            async def get_by_id(self, user_id: int):
                return await self.conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
    """
    
    def decorator(method):
        @wraps(method)
        async def wrapper(self, *args, **kwargs):
            start_time = time.perf_counter()
            
            try:
                result = await method(self, *args, **kwargs)
                
                duration_ms = (time.perf_counter() - start_time) * 1000
                
                if duration_ms >= slow_threshold_ms:
                    # Log warning
                    import logging
                    logger = logging.getLogger('profiler.queries')
                    logger.warning(
                        f"Slow query in {self.__class__.__name__}.{method.__name__}: "
                        f"{duration_ms:.2f}ms"
                    )
                
                return result
                
            except Exception as e:
                raise
        
        return wrapper
    
    return decorator


# ============================================
# Utilities
# ============================================

async def get_query_stats_summary() -> Dict[str, Any]:
    """Retorna resumo das estatísticas de queries"""
    storage = get_profiler_storage()
    
    slow_queries = await storage.get_slow_queries(100)
    n_plus_one = await storage.get_n_plus_one_queries()
    index_recs = await storage.get_index_recommendations()
    
    total_profiles = sum(len(profiles) for profiles in storage._profiles.values())
    
    return {
        'total_queries_profiled': total_profiles,
        'slow_queries_count': len(storage._slow_queries),
        'top_10_slow': [
            {
                'query_preview': q.query_preview,
                'duration_ms': q.duration_ms,
                'endpoint': q.endpoint,
                'timestamp': q.timestamp.isoformat()
            }
            for q in slow_queries[:10]
        ],
        'n_plus_one_count': len(n_plus_one),
        'index_recommendations_count': len(index_recs)
    }


async def reset_query_profiles():
    """Limpa todos os profiles de queries"""
    storage = get_profiler_storage()
    async with storage._lock:
        storage._profiles.clear()
        storage._slow_queries.clear()
        storage._query_patterns.clear()


async def get_query_stats_summary() -> Dict[str, Any]:
    """Retorna resumo das estatísticas de queries"""
    storage = get_profiler_storage()
    
    slow_queries = await storage.get_slow_queries(100)
    n_plus_one = await storage.get_n_plus_one_queries()
    index_recs = await storage.get_index_recommendations()
    
    total_profiles = sum(len(profiles) for profiles in storage._profiles.values())
    
    return {
        'total_queries_profiled': total_profiles,
        'slow_queries_count': len(storage._slow_queries),
        'top_10_slow': [
            {
                'query_preview': q.query_preview,
                'duration_ms': q.duration_ms,
                'endpoint': q.endpoint,
                'timestamp': q.timestamp.isoformat()
            }
            for q in slow_queries[:10]
        ],
        'n_plus_one_count': len(n_plus_one),
        'index_recommendations_count': len(index_recs)
    }
