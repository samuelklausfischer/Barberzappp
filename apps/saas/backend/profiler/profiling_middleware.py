"""
BarberZap - Performance Profiling Middleware

Middleware automático para profiling de requisições HTTP.
Coleta métricas de latência, queries de banco, cache e payloads.

Features:
- Sampling configurável (não-produção)
- Tracking de stack frames
- Detecção de slow queries (> 100ms)
- Armazenamento em Redis com TTL de 1h
- Métricas de request/response size

Uso:
    app.add_middleware(ProfilingMiddleware)
"""

import time
import os
import json
import hashlib
import asyncio
import traceback
import psutil
from typing import Dict, Any, Optional, Callable, List
from functools import wraps
from collections import defaultdict
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from ..config.redis_config import RedisConfig
from ..error.exceptions import BadRequestError


class ProfilingConfig:
    """Configuração do profiling middleware"""
    
    # Sampling rate (0.0 a 1.0)
    # Em produção, usar 0.01 (1%)
    # Em desenvolvimento/staging, usar 1.0 (100%)
    SAMPLING_RATE = float(os.getenv('PROFILER_SAMPLING_RATE', '0.1'))
    
    # Detect slow queries (ms)
    SLOW_QUERY_THRESHOLD = int(os.getenv('PROFILER_SLOW_QUERY_THRESHOLD', '100'))
    
    # Detect slow requests (ms)
    SLOW_REQUEST_THRESHOLD = int(os.getenv('PROFILER_SLOW_REQUEST_THRESHOLD', '500'))
    
    # TTL para dados no Redis (segundos)
    REDIS_TTL = int(os.getenv('PROFILER_REDIS_TTL', '3600'))  # 1 hora
    
    # Limites de collection
    MAX_STACK_FRAMES = int(os.getenv('PROFILER_MAX_STACK_FRAMES', '50'))
    MAX_QUERY_LOG = int(os.getenv('PROFILER_MAX_QUERY_LOG', '100'))
    
    # Enable/disable profiling
    ENABLED = os.getenv('PROFILER_ENABLED', 'true').lower() == 'true' and \
              os.getenv('ENVIRONMENT', 'development') != 'production'
    
    # Track memory (expensive)
    TRACK_MEMORY = os.getenv('PROFILER_TRACK_MEMORY', 'false').lower() == 'true'
    
    # Track CPU (expensive)
    TRACK_CPU = os.getenv('PROFILER_TRACK_CPU', 'false').lower() == 'true'


class QueryTracker:
    """Tracker para queries SQL"""
    
    def __init__(self):
        self.queries: List[Dict[str, Any]] = []
        self.slow_queries: List[Dict[str, Any]] = []
        self._lock = asyncio.Lock()
    
    async def add_query(self, query: str, duration_ms: float, params: Optional[Dict] = None):
        """Adiciona uma query ao tracker"""
        query_info = {
            'query': self._normalize_query(query),
            'duration_ms': duration_ms,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'params_hash': self._hash_params(params) if params else None,
            'is_slow': duration_ms >= ProfilingConfig.SLOW_QUERY_THRESHOLD
        }
        
        async with self._lock:
            self.queries.append(query_info)
            if query_info['is_slow']:
                self.slow_queries.append(query_info)
    
    def _normalize_query(self, query: str) -> str:
        """Normaliza a query para agrupar queries similares"""
        # Remove parâmetros literais
        import re
        normalized = re.sub(r"'[^']*'", "?", query)
        normalized = re.sub(r'\b\d+\b', "?", normalized)
        # Remove whitespace extra
        normalized = ' '.join(normalized.split())
        return normalized
    
    @staticmethod
    def _hash_params(params: Dict) -> str:
        """Hash dos parâmetros para identificar padrões"""
        param_str = json.dumps(params, sort_keys=True, default=str)
        return hashlib.md5(param_str.encode()).hexdigest()


class CacheTracker:
    """Tracker para cache hits/misses"""
    
    def __init__(self):
        self.hits: int = 0
        self.misses: int = 0
        self.patterns: Dict[str, Dict[str, int]] = defaultdict(lambda: {'hits': 0, 'misses': 0})
        self._lock = asyncio.Lock()
    
    async def record_hit(self, key: str):
        """Registra um cache hit"""
        pattern = self._extract_pattern(key)
        async with self._lock:
            self.hits += 1
            self.patterns[pattern]['hits'] += 1
    
    async def record_miss(self, key: str):
        """Registra um cache miss"""
        pattern = self._extract_pattern(key)
        async with self._lock:
            self.misses += 1
            self.patterns[pattern]['misses'] += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de cache"""
        total = self.hits + self.misses
        return {
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': self.hits / total if total > 0 else 0,
            'patterns': dict(self.patterns)
        }
    
    @staticmethod
    def _extract_pattern(key: str) -> str:
        """Extrai padrão da chave de cache"""
        # Separa por : e substitui IDs por *
        parts = key.split(':')
        pattern_parts = []
        for part in parts:
            if part.isdigit():
                pattern_parts.append('*')
            else:
                pattern_parts.append(part)
        return ':'.join(pattern_parts)


class ProfilingMiddleware(BaseHTTPMiddleware):
    """Middleware de profiling automático"""
    
    def __init__(self, app: ASGIApp, redis_client=None):
        super().__init__(app)
        self.redis = redis_client or RedisConfig().get_client()
        self.query_tracker = QueryTracker()
        self.cache_tracker = CacheTracker()
        self._process = psutil.Process()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Processa a requisição com profiling"""
        
        # Skip se profiling desabilitado
        if not ProfilingConfig.ENABLED:
            return await call_next(request)
        
        # Skip se não passar no sampling
        if not self._should_sample(request):
            return await call_next(request)
        
        # Inicializar contexto de profiling
        context = await self._init_context(request)
        
        # Capturar métricas iniciais
        start_time = time.perf_counter()
        start_memory = self._get_memory_usage() if ProfilingConfig.TRACK_MEMORY else None
        start_cpu = self._get_cpu_usage() if ProfilingConfig.TRACK_CPU else None
        
        # Injetar trackers no request state
        request.state.profiler = {
            'query_tracker': self.query_tracker,
            'cache_tracker': self.cache_tracker,
            'context': context
        }
        
        try:
            # Processar request
            response = await call_next(request)
            
            # Capturar métricas finais
            end_time = time.perf_counter()
            duration_ms = (end_time - start_time) * 1000
            
            end_memory = self._get_memory_usage() if ProfilingConfig.TRACK_MEMORY else None
            end_cpu = self._get_cpu_usage() if ProfilingConfig.TRACK_CPU else None
            
            # Coletar dados do request/response
            request_size = request.headers.get('content-length', 0)
            response_size = response.headers.get('content-length', 0)
            
            # Capturar stack frames se necessário
            stack_frames = self._capture_stack_frames() if duration_ms > ProfilingConfig.SLOW_REQUEST_THRESHOLD else []
            
            # Montar profiling data
            profiling_data = {
                'context': context,
                'metrics': {
                    'duration_ms': duration_ms,
                    'is_slow': duration_ms >= ProfilingConfig.SLOW_REQUEST_THRESHOLD,
                    'request_size': int(request_size),
                    'response_size': int(response_size),
                    'memory_delta_mb': (end_memory - start_memory) / 1024 / 1024 if end_memory else None,
                    'cpu_delta_ms': (end_cpu - start_cpu) if end_cpu else None,
                    'status_code': response.status_code,
                    'method': request.method,
                    'path': request.url.path
                },
                'queries': {
                    'count': len(self.query_tracker.queries),
                    'total_duration_ms': sum(q['duration_ms'] for q in self.query_tracker.queries),
                    'slow_count': len(self.query_tracker.slow_queries),
                    'slow_queries': self.query_tracker.slow_queries[:ProfilingConfig.MAX_QUERY_LOG]
                },
                'cache': self.cache_tracker.get_stats(),
                'stack_frames': stack_frames,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            # Headers customizados
            response.headers['X-Profiling-Duration-ms'] = str(int(duration_ms))
            if profiling_data['metrics']['is_slow']:
                response.headers['X-Profiling-Slow'] = 'true'
            if profiling_data['queries']['slow_count'] > 0:
                response.headers['X-Profiling-Slow-Queries'] = str(profiling_data['queries']['slow_count'])
            
            # Armazenar no Redis
            await self._store_profiling_data(profiling_data)
            
            # LogSlow request
            if profiling_data['metrics']['is_slow']:
                await self._log_slow_request(profiling_data)
            
            return response
            
        except Exception as e:
            # Capturar erro no profiling
            error_context = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            await self._store_profiling_error(context, error_context)
            raise
    
    def _should_sample(self, request: Request) -> bool:
        """Determina se deve fazer profiling desta request"""
        import random
        
        # Always sample em ambiente de desenvolvimento
        if os.getenv('ENVIRONMENT') == 'development':
            return True
        
        # Skip health checks e endpoints de sistema
        if request.url.path in ['/health', '/metrics', '/readiness']:
            return False
        
        # Apply sampling rate
        return random.random() < ProfilingConfig.SAMPLING_RATE
    
    async def _init_context(self, request: Request) -> Dict[str, Any]:
        """Inicializa contexto de profiling"""
        # Extrair shop_id da query/params se disponível
        shop_id = None
        try:
            shop_id = request.query_params.get('shop_id') or \
                     request.path_params.get('shop_id')
            
            # Tentar extrair do header
            if not shop_id:
                shop_id = request.headers.get('X-Shop-ID')
        except Exception:
            pass
        
        return {
            'request_id': request.headers.get('X-Request-ID') or self._generate_request_id(),
            'shop_id': shop_id,
            'ip': request.client.host if request.client else None,
            'user_agent': request.headers.get('user-agent'),
            'endpoint': f"{request.method} {request.url.path}"
        }
    
    @staticmethod
    def _generate_request_id() -> str:
        """Gera um ID único para a requisição"""
        import uuid
        return str(uuid.uuid4())
    
    def _get_memory_usage(self) -> int:
        """Retorna uso atual de memória em KB"""
        try:
            return self._process.memory_info().rss
        except Exception:
            return 0
    
    def _get_cpu_usage(self) -> float:
        """Retorna tempo de CPU do processo em segundos"""
        try:
            return self._process.cpu_times().user + self._process.cpu_times().system
        except Exception:
            return 0
    
    def _capture_stack_frames(self) -> List[Dict[str, Any]]:
        """Captura stack frames atuais"""
        import inspect
        frames = []
        
        for frame, filename, lineno, function, code_context, index in inspect.stack(context=ProfilingConfig.MAX_STACK_FRAMES):
            # Skip frames internos do profiler
            if 'profiler' in filename:
                continue
            
            frames.append({
                'filename': filename,
                'lineno': lineno,
                'function': function,
                'line': code_context[0].strip() if code_context else None
            })
            
            if len(frames) >= ProfilingConfig.MAX_STACK_FRAMES:
                break
        
        return frames
    
    async def _store_profiling_data(self, data: Dict[str, Any]):
        """Armazena dados de profiling no Redis"""
        try:
            key = f"profiling:requests:{data['context']['request_id']}"
            value = json.dumps(data)
            
            # Usar pipeline para performance
            pipe = self.redis.pipeline()
            pipe.setex(key, ProfilingConfig.REDIS_TTL, value)
            
            # Adicionar aos índices
            pipe.zadd('profiling:requests:timeline', {data['context']['request_id']: time.time()})
            pipe.zadd('profiling:requests:duration', {data['context']['request_id']: data['metrics']['duration_ms']})
            
            # Index por endpoint
            pipe.sadd('profiling:endpoints', data['metrics']['path'])
            pipe.zadd(f'profiling:endpoint:{data["metrics"]["path"]}', 
                     {data['context']['request_id']: data['metrics']['duration_ms']})
            
            # Index por shop
            if data['context']['shop_id']:
                pipe.sadd('profiling:shops', data['context']['shop_id'])
                pipe.zadd(f'profiling:shop:{data["context"]["shop_id"]}', 
                         {data['context']['request_id']: data['metrics']['duration_ms']})
            
            await pipe.execute()
        except Exception as e:
            # Não falhar a request por erro no profiling
            pass
    
    async def _store_profiling_error(self, context: Dict[str, Any], error_data: Dict[str, Any]):
        """Armazena erro capturado durante profiling"""
        try:
            key = f"profiling:errors:{context['request_id']}"
            value = json.dumps({**context, **error_data})
            await self.redis.setex(key, ProfilingConfig.REDIS_TTL, value)
        except Exception:
            pass
    
    async def _log_slow_request(self, data: Dict[str, Any]):
        """Loga request lenta para monitoramento"""
        import logging
        logger = logging.getLogger('profiler')
        
        logger.warning(
            f"Slow Request: {data['metrics']['method']} {data['metrics']['path']} "
            f"took {data['metrics']['duration_ms']:.2f}ms "
            f"(queries: {data['queries']['count']}, "
            f"slow_queries: {data['queries']['slow_count']}, "
            f"cache_hit_rate: {data['cache']['hit_rate']:.2%})"
        )


# ============================================
# Helper Functions
# ============================================

def get_profiler_from_request(request: Request) -> Optional[Dict[str, Any]]:
    """Retorna o profiler do request state"""
    return getattr(request.state, 'profiler', None)


def profile_query(request: Request, query: str, duration_ms: float, params: Optional[Dict] = None):
    """Helper para profile queries (usado nos repository layers)"""
    profiler = get_profiler_from_request(request)
    if profiler:
        asyncio.create_task(profiler['query_tracker'].add_query(query, duration_ms, params))


def profile_cache_hit(request: Request, key: str):
    """Helper para profile cache hit"""
    profiler = get_profiler_from_request(request)
    if profiler:
        asyncio.create_task(profiler['cache_tracker'].record_hit(key))


def profile_cache_miss(request: Request, key: str):
    """Helper para profile cache miss"""
    profiler = get_profiler_from_request(request)
    if profiler:
        asyncio.create_task(profiler['cache_tracker'].record_miss(key))
