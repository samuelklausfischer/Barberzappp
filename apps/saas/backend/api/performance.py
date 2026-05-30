"""
BarberZap - Performance Profiling API

API endpoints para consulta de métricas de performance.
"""

import os
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from enum import Enum

from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel, Field

from ..config.redis_config import RedisConfig
from ..profiler.profiling_middleware import ProfilingConfig
from ..profiler.queries_profiler import get_profiler_storage, get_query_stats_summary
from ..profiler.backend_profiler import get_registry
from ..profiler.alerting import get_alerting_manager, AlertSeverity
from ..profiler.flamegraph_generator import generate_flamegraph, generate_flamegraph_json


router = APIRouter(prefix="/api/profiler", tags=["profiler"])


# ============================================
# Data Models
# ============================================

class ProfilerStatusResponse(BaseModel):
    enabled: bool
    sampling_rate: float
    environment: str
    redis_keys: int
    functions_profiled: int
    queries_profiled: int
    slow_queries: int
    n_plus_one_detected: int


class EndpointMetrics(BaseModel):
    endpoint: str
    request_count: int
    avg_duration_ms: float
    p95_duration_ms: float
    max_duration_ms: float


class QueryMetrics(BaseModel):
    query_hash: str
    query_preview: str
    query_type: str
    execution_count: int
    avg_duration_ms: float
    max_duration_ms: float
    total_duration_ms: float
    is_slow: bool


class CachePattern(BaseModel):
    pattern: str
    hit_rate: float
    total: int


class CacheMetrics(BaseModel):
    hit_rate: float
    hits: int
    misses: int
    patterns: List[CachePattern]


class ComponentMetrics(BaseModel):
    componentId: str
    renderCount: int
    avgRenderTime: float
    maxRenderTime: float
    reRenderRate: float


class SystemMetrics(BaseModel):
    memoryUsageMb: float
    cpuUsagePercent: float
    uptime: float


class PerformanceMetricsResponse(BaseModel):
    config: Dict[str, Any]
    queries: Dict[str, Any]
    functions: Dict[str, Any]


class AlertModel(BaseModel):
    id: str
    type: str
    severity: str
    message: str
    timestamp: str


class HeatmapData(BaseModel):
    timestamp: str
    endpoint: str
    duration: float
    status: int


# ============================================
# Endpoints
# ============================================

@router.get("/status", response_model=ProfilerStatusResponse)
async def get_profiler_status():
    """
    Retorna status do profiler.
    
    Mostra se profiling está habilitado, sampling rate, e estatísticas básicas.
    """
    try:
        redis = RedisConfig().get_client()
        keys_count = await redis.dbsize()
        
        # Query stats
        query_stats = await get_query_stats_summary()
        
        # Function stats
        registry = get_registry()
        function_stats = await registry.get_stats()
        
        return ProfilerStatusResponse(
            enabled=ProfilingConfig.ENABLED,
            sampling_rate=ProfilingConfig.SAMPLING_RATE,
            environment=os.getenv('ENVIRONMENT', 'unknown'),
            redis_keys=keys_count,
            functions_profiled=len(function_stats),
            queries_profiled=query_stats.get('total_queries_profiled', 0),
            slow_queries=query_stats.get('slow_queries_count', 0),
            n_plus_one_detected=query_stats.get('n_plus_one_count', 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics", response_model=PerformanceMetricsResponse)
async def get_performance_metrics():
    """
    Retorna métricas de performance agregadas.
    
    Inclui configuração, queries e funções profiled.
    """
    try:
        query_stats = await get_query_stats_summary()
        registry = get_registry()
        
        return PerformanceMetricsResponse(
            config={
                "enabled": ProfilingConfig.ENABLED,
                "sampling_rate": ProfilingConfig.SAMPLING_RATE,
                "slow_request_threshold": ProfilingConfig.SLOW_REQUEST_THRESHOLD,
                "slow_query_threshold": ProfilingConfig.SLOW_QUERY_THRESHOLD
            },
            queries=query_stats,
            functions=await registry.get_stats()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/endpoints", response_model=List[EndpointMetrics])
async def get_slow_endpoints(limit: int = Query(20, le=100)):
    """
    Retorna endpoints mais lentos.
    
    Ordenado por duração média descendente.
    """
    try:
        redis = RedisConfig().get_client()
        
        # Buscar endpoints do Redis
        endpoint_keys = await redis.smembers('profiling:endpoints')
        
        endpoints_data = []
        
        for endpoint in endpoint_keys:
            endpoint_str = endpoint.decode()
            
            # Pegar todos os requests deste endpoint
            request_ids = await redis.zrevrange(
                f'profiling:endpoint:{endpoint_str}',
                0, -1,
                withscores=True
            )
            
            if not request_ids:
                continue
            
            # Calcular estatísticas
            durations = [score for _, score in request_ids]
            total_requests = len(durations)
            total_duration = sum(durations)
            avg_duration = total_duration / total_requests
            max_duration = max(durations)
            
            # Calcular P95
            sorted_durations = sorted(durations)
            p95_index = int(total_requests * 0.95)
            p95_duration = sorted_durations[min(p95_index, total_requests - 1)]
            
            endpoints_data.append(EndpointMetrics(
                endpoint=endpoint_str,
                request_count=total_requests,
                avg_duration_ms=avg_duration,
                p95_duration_ms=p95_duration,
                max_duration_ms=max_duration
            ))
        
        # Ordenar por avg duration e limitar
        endpoints_data.sort(key=lambda x: x.avg_duration_ms, reverse=True)
        return endpoints_data[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queries", response_model=List[QueryMetrics])
async def get_slow_queries(
    limit: int = Query(20, le=100),
    analyze_plan: bool = Query(False)
):
    """
    Retorna queries mais lentas.
    
    Ordenado por duração média descendente.
    """
    try:
        storage = get_profiler_storage()
        slow_queries = await storage.get_slow_queries(limit)
        
        # Aggregate by query_hash to get execution counts
        from collections import defaultdict
        agg_stats = defaultdict(lambda: {'count': 0, 'total_duration': 0, 'max_duration': 0})
        
        for q in slow_queries:
            agg_stats[q.query_hash]['count'] += 1
            agg_stats[q.query_hash]['total_duration'] += q.duration_ms
            agg_stats[q.query_hash]['max_duration'] = max(agg_stats[q.query_hash]['max_duration'], q.duration_ms)
        
        return [
            QueryMetrics(
                query_hash=q.query_hash,
                query_preview=q.query_preview,
                query_type=q.query_type,
                execution_count=agg_stats[q.query_hash]['count'],
                avg_duration_ms=agg_stats[q.query_hash]['total_duration'] / agg_stats[q.query_hash]['count'],
                max_duration_ms=agg_stats[q.query_hash]['max_duration'],
                total_duration_ms=agg_stats[q.query_hash]['total_duration'],
                is_slow=q.is_slow
            )
            for q in slow_queries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache", response_model=CacheMetrics)
async def get_cache_metrics():
    """
    Retorna estatísticas de cache.
    
    Inclui hit rate, hits, misses e patterns.
    """
    try:
        import json
        redis = RedisConfig().get_client()
        
        # Buscar dados de cache dos requests
        cache_stats = {
            'hit_rate': 0.0,
            'hits': 0,
            'misses': 0,
            'patterns': []
        }
        
        # Buscar requests recentes e aggregate cache stats
        recent_requests = await redis.zrevrange('profiling:requests:timeline', 0, 99)
        
        total_hits = 0
        total_misses = 0
        pattern_stats: Dict[str, Dict[str, int]] = {}
        
        for req_id in recent_requests:
            req_data = await redis.get(f'profiling:requests:{req_id.decode()}')
            if req_data:
                data = json.loads(req_data)
                cache = data.get('cache', {})
                total_hits += cache.get('hits', 0)
                total_misses += cache.get('misses', 0)
                
                # Agregar patterns
                for pattern, stats in cache.get('patterns', {}).items():
                    if pattern not in pattern_stats:
                        pattern_stats[pattern] = {'hits': 0, 'misses': 0}
                    pattern_stats[pattern]['hits'] += stats['hits']
                    pattern_stats[pattern]['misses'] += stats['misses']
        
        total_requests = total_hits + total_misses
        cache_stats['hit_rate'] = total_hits / total_requests if total_requests > 0 else 0
        cache_stats['hits'] = total_hits
        cache_stats['misses'] = total_misses
        cache_stats['patterns'] = [
            CachePattern(
                pattern=pattern,
                hit_rate=stats['hits'] / (stats['hits'] + stats['misses']) if stats['hits'] + stats['misses'] > 0 else 0,
                total=stats['hits'] + stats['misses']
            )
            for pattern, stats in pattern_stats.items()
        ]
        
        return CacheMetrics(**cache_stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/components", response_model=List[ComponentMetrics])
async def get_component_metrics(limit: int = Query(20, le=100)):
    """
    Retorna métricas de componentes React.
    
    Inclui contagem de renders, tempos e taxa de re-render.
    """
    try:
        # Nesta implementação, component metrics são enviados do frontend
        # Para uma implementação completa, usaríamos websockets ou um endpoint de ingestão
        
        # Placeholder - em produção, buscar do storage de componentes
        return []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system", response_model=SystemMetrics)
async def get_system_metrics():
    """
    Retorna métricas do sistema.
    
    Inclui uso de memória, CPU e uptime.
    """
    try:
        import psutil
        
        process = psutil.Process()
        
        return SystemMetrics(
            memoryUsageMb=process.memory_info().rss / 1024 / 1024,
            cpuUsagePercent=process.cpu_percent(),
            uptime=datetime.now(timezone.utc).timestamp() - process.create_time()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/heatmap", response_model=List[HeatmapData])
async def get_heatmap(
    range: str = Query('1h', enum=['1h', '6h', '24h']),
    endpoint_filter: Optional[str] = Query(None)
):
    """
    Retorna dados para heatmap de latências.
    
    Agrupado por timestamp e endpoint.
    """
    try:
        redis = RedisConfig().get_client()
        
        # Determinar range de tempo
        now = datetime.now(timezone.utc)
        if range == '1h':
            start_time = now - timedelta(hours=1)
        elif range == '6h':
            start_time = now - timedelta(hours=6)
        else:  # 24h
            start_time = now - timedelta(hours=24)
        
        start_timestamp = start_time.timestamp()
        
        # Buscar requests no range de tempo
        all_request_ids = await redis.zrangebyscore(
            'profiling:requests:timeline',
            start_timestamp,
            now.timestamp()
        )
        
        heatmap_data = []
        
        for req_id in all_request_ids:
            req_data = await redis.get(f'profiling:requests:{req_id.decode()}')
            if req_data:
                import json
                data = json.loads(req_data)
                context = data.get('context', {})
                metrics = data.get('metrics', {})
                
                path = metrics.get('path', 'unknown')
                
                # Filter por endpoint se especificado
                if endpoint_filter and path != endpoint_filter:
                    continue
                
                heatmap_data.append(HeatmapData(
                    timestamp=context.get('timestamp', data.get('timestamp')),
                    endpoint=path,
                    duration=metrics.get('duration_ms', 0),
                    status=metrics.get('status_code', 200)
                ))
        
        return heatmap_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts", response_model=List[AlertModel])
async def get_alerts(
    severity: Optional[str] = Query(None, enum=['info', 'warning', 'critical']),
    limit: int = Query(50, le=100)
):
    """
    Retorna alertas de performance.
    
    Pode filtrar por severidade.
    """
    try:
        manager = get_alerting_manager()
        alerts = await manager.get_recent_alerts(limit)
        
        filtered_alerts = alerts
        if severity:
            filtered_alerts = [
                a for a in alerts 
                if a.severity.value == severity
            ]
        
        return [
            AlertModel(
                id=a.id,
                type=a.type.value,
                severity=a.severity.value,
                message=a.message,
                timestamp=a.timestamp.isoformat()
            )
            for a in filtered_alerts
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flamegraph/generate")
async def generate_flamegraph_endpoint(
    format: str = Query('svg', enum=['svg', 'json'])
):
    """
    Gera flame graph dos dados do profiler.
    
    Retorna SVG ou JSON.
    """
    try:
        if format == 'svg':
            svg_content = await generate_flamegraph()
            return {"flamegraph": svg_content, "format": "svg"}
        else:
            json_content = await generate_flamegraph_json()
            return {"flamegraph": json_content, "format": "json"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_profiler_data(confirm: bool = Query(..., description="Must be true to reset all data")):
    """
    Limpa todos os dados de profiling.
    
    CUIDADO: Esta ação não pode ser desfeita.
    """
    if not confirm:
        raise HTTPException(status_code=400, detail="Must confirm by setting confirm=true")
    
    try:
        redis = RedisConfig().get_client()
        
        # Limpar todas as keys do profiler no Redis
        keys = await redis.keys('profiling:*')
        if keys:
            await redis.delete(*keys)
        
        # Limpar registries
        registry = get_registry()
        await registry.reset()
        
        from ..profiler.queries_profiler import reset_query_profiles
        await reset_query_profiles()
        
        # Limpar alertas
        manager = get_alerting_manager()
        await manager.clear_alerts()
        
        return {"message": "All profiling data has been cleared"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_profiler_config():
    """
    Retorna configuração atual do profiler.
    """
    return {
        "enabled": ProfilingConfig.ENABLED,
        "sampling_rate": ProfilingConfig.SAMPLING_RATE,
        "slow_request_threshold_ms": ProfilingConfig.SLOW_REQUEST_THRESHOLD,
        "slow_query_threshold_ms": ProfilingConfig.SLOW_QUERY_THRESHOLD,
        "track_memory": ProfilingConfig.TRACK_MEMORY,
        "track_cpu": ProfilingConfig.TRACK_CPU,
        "redis_ttl_seconds": ProfilingConfig.REDIS_TTL,
        "max_stack_frames": ProfilingConfig.MAX_STACK_FRAMES,
        "max_query_log": ProfilingConfig.MAX_QUERY_LOG
    }


@router.put("/config")
async def update_profiler_config(
    enabled: Optional[bool] = None,
    sampling_rate: Optional[float] = None,
    slow_request_threshold: Optional[int] = None,
    slow_query_threshold: Optional[int] = None
):
    """
    Atualiza configuração do profiler.
    
    Nota: Algumas mudanças requerem reinício da aplicação.
    """
    updates = {}
    
    if enabled is not None:
        ProfilingConfig.ENABLED = enabled
        os.environ['PROFILER_ENABLED'] = 'true' if enabled else 'false'
        updates['enabled'] = enabled
    
    if sampling_rate is not None:
        ProfilingConfig.SAMPLING_RATE = sampling_rate
        os.environ['PROFILER_SAMPLING_RATE'] = str(sampling_rate)
        updates['sampling_rate'] = sampling_rate
    
    if slow_request_threshold is not None:
        ProfilingConfig.SLOW_REQUEST_THRESHOLD = slow_request_threshold
        os.environ['PROFILER_SLOW_REQUEST_THRESHOLD'] = str(slow_request_threshold)
        updates['slow_request_threshold'] = slow_request_threshold
    
    if slow_query_threshold is not None:
        ProfilingConfig.SLOW_QUERY_THRESHOLD = slow_query_threshold
        os.environ['PROFILER_SLOW_QUERY_THRESHOLD'] = str(slow_query_threshold)
        updates['slow_query_threshold'] = slow_query_threshold
    
    return {
        "message": "Configuration updated",
        "changes": updates
    }
