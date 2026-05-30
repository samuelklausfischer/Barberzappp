"""
BarberZap - Backend Profiler Decorators

Decoradores para profiling de funções e endpoints.
Suporta tracking de tempo, memória, CPU e coleta de dados para flame graphs.

Uso:
    @profile_function()
    def expensive_operation():
        ...
    
    @profile_endpoint()
    @app.get("/api/endpoint")
    async def endpoint():
        ...
"""

import time
import functools
import inspect
import asyncio
from datetime import datetime, timezone
from typing import Callable, Dict, Any, Optional, List, TypeVar, ParamSpec
from dataclasses import dataclass, field
from collections import defaultdict

import psutil

try:
    from ..config.redis_config import RedisConfig
except ImportError:
    RedisConfig = None


T = TypeVar('T')
P = ParamSpec('P')


@dataclass
class ProfileData:
    """Dados coletados de uma execução profiled"""
    function_name: str
    module: str
    file: str
    line: int
    
    execution_time_ms: float
    start_time: datetime
    end_time: datetime
    
    memory_before_mb: float
    memory_after_mb: float
    memory_delta_mb: float
    
    cpu_before_ms: float
    cpu_after_ms: float
    cpu_delta_ms: float
    
    call_count: int = 1
    
    success: bool = True
    error: Optional[str] = None
    
    stack_frames: List[Dict[str, Any]] = field(default_factory=list)
    child_calls: List['ProfileData'] = field(default_factory=list)
    
    # Custom metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


class ProfilerRegistry:
    """Registro global de profiling data"""
    
    def __init__(self):
        self._profiles: Dict[str, ProfileData] = {}
        self._aggregated: Dict[str, List[ProfileData]] = defaultdict(list)
        self._call_tree: List[ProfileData] = []
        self._lock = asyncio.Lock()
        self._enabled = True
        self._process = psutil.Process()
    
    def enable(self):
        """Habilita profiling"""
        self._enabled = True
    
    def disable(self):
        """Desabilita profiling"""
        self._enabled = False
    
    def is_enabled(self) -> bool:
        """Verifica se profiling está habilitado"""
        return self._enabled
    
    async def add_profile(self, profile: ProfileData):
        """Adiciona um profile ao registro"""
        if not self._enabled:
            return
        
        # Hash da função (module:name)
        key = f"{profile.module}:{profile.function_name}"
        
        async with self._lock:
            self._profiles[key] = profile
            self._aggregated[key].append(profile)
            
            # Manter apenas últimos 1000 por função
            if len(self._aggregated[key]) > 1000:
                self._aggregated[key] = self._aggregated[key][-1000:]
    
    async def get_profile(self, key: str) -> Optional[ProfileData]:
        """Retorna profile específico"""
        return self._profiles.get(key)
    
    async def get_aggregated(self, key: str) -> List[ProfileData]:
        """Retorna profiles agregados"""
        return self._aggregated.get(key, [])
    
    async def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas agregadas"""
        async with self._lock:
            stats = {}
            for key, profiles in self._aggregated.items():
                if not profiles:
                    continue
                
                total_time = sum(p.execution_time_ms for p in profiles)
                avg_time = total_time / len(profiles)
                max_time = max(p.execution_time_ms for p in profiles)
                min_time = min(p.execution_time_ms for p in profiles)
                p95_time = sorted([p.execution_time_ms for p in profiles])[int(len(profiles) * 0.95)]
                
                stats[key] = {
                    'call_count': len(profiles),
                    'total_time_ms': total_time,
                    'avg_time_ms': avg_time,
                    'min_time_ms': min_time,
                    'max_time_ms': max_time,
                    'p95_time_ms': p95_time,
                    'success_rate': sum(1 for p in profiles if p.success) / len(profiles),
                    'avg_memory_mb': sum(p.memory_delta_mb for p in profiles) / len(profiles)
                }
            
            return stats
    
    async def get_top_slow(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retorna as funções mais lentas"""
        stats = await self.get_stats()
        
        sorted_by_avg = sorted(
            stats.items(),
            key=lambda x: x[1]['avg_time_ms'],
            reverse=True
        )
        
        return [
            {'function': key, **stat}
            for key, stat in sorted_by_avg[:limit]
        ]
    
    async def get flamegraph_data(self) -> List[Dict[str, Any]]:
        """Retorna dados para flame graph"""
        # Formato: [{"name": "func", "value": 100, "children": [...]}]
        async with self._lock:
            return self._build_flamegraph_tree(self._call_tree)
    
    def _build_flamegraph_tree(self, profiles: List[ProfileData]) -> List[Dict[str, Any]]:
        """Constroi árvore para flame graph"""
        nodes = []
        
        for profile in profiles:
            node = {
                'name': f"{profile.module}.{profile.function_name}",
                'value': profile.execution_time_ms,
                'children': self._build_flamegraph_tree(profile.child_calls)
            }
            nodes.append(node)
        
        return nodes
    
    async def reset(self):
        """Limpa todos os profiles"""
        async with self._lock:
            self._profiles.clear()
            self._aggregated.clear()
            self._call_tree.clear()
    
    def _get_memory_mb(self) -> float:
        """Retorna uso de memória em MB"""
        try:
            return self._process.memory_info().rss / 1024 / 1024
        except Exception:
            return 0
    
    def _get_cpu_ms(self) -> float:
        """Retorna tempo de CPU em milissegundos"""
        try:
            times = self._process.cpu_times()
            return (times.user + times.system) * 1000
        except Exception:
            return 0


# Instância global do registry
_global_registry = ProfilerRegistry()


def get_registry() -> ProfilerRegistry:
    """Retorna o registry global de profiles"""
    return _global_registry


def profile_function(
    track_memory: bool = False,
    track_cpu: bool = False,
    stack_frames: bool = False,
    include_children: bool = True
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Decorador para profiling de funções.
    
    Args:
        track_memory: Track uso de memória
        track_cpu: Track tempo de CPU
        stack_frames: Capturar stack frames
        include_children: Incluir chamadas de funções filhas
    
    Usage:
        @profile_function(track_memory=True)
        def my_function():
            ...
    """
    
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        # Metadados da função
        module = inspect.getmodule(func).__name__ if inspect.getmodule(func) else "__main__"
        func_name = func.__name__
        file = inspect.getfile(func) if hasattr(func, '__code__') else "unknown"
        line = func.__code__.co_firstlineno if hasattr(func, '__code__') else 0
        
        @functools.wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Skip se profiling desabilitado
            if not _global_registry.is_enabled():
                return await func(*args, **kwargs)
            
            # Capturar métricas iniciais
            start_time = time.perf_counter()
            start_datetime = datetime.now(timezone.utc)
            
            start_memory = _global_registry._get_memory_mb() if track_memory else 0
            start_cpu = _global_registry._get_cpu_ms() if track_cpu else 0
            
            profile_data = ProfileData(
                function_name=func_name,
                module=module,
                file=file,
                line=line,
                execution_time_ms=0,  # Preenchido depois
                start_time=start_datetime,
                end_time=start_datetime,  # Preenchido depois
                memory_before_mb=start_memory,
                memory_after_mb=start_memory,  # Preenchido depois
                memory_delta_mb=0,
                cpu_before_ms=start_cpu,
                cpu_after_ms=start_cpu,  # Preenchido depois
                cpu_delta_ms=0
            )
            
            # Capturar stack frames se solicitado
            if stack_frames:
                profile_data.stack_frames = _capture_stack_frames()
            
            try:
                # Executar função
                result = await func(*args, **kwargs)
                
                # Capturar métricas finais
                end_time = time.perf_counter()
                end_datetime = datetime.now(timezone.utc)
                end_memory = _global_registry._get_memory_mb() if track_memory else start_memory
                end_cpu = _global_registry._get_cpu_ms() if track_cpu else start_cpu
                
                # Atualizar profile data
                profile_data.execution_time_ms = (end_time - start_time) * 1000
                profile_data.end_time = end_datetime
                profile_data.memory_after_mb = end_memory
                profile_data.memory_delta_mb = end_memory - start_memory
                profile_data.cpu_after_ms = end_cpu
                profile_data.cpu_delta_ms = end_cpu - start_cpu
                profile_data.success = True
                
                # Registrar
                await _global_registry.add_profile(profile_data)
                
                return result
                
            except Exception as e:
                # Capturar erro
                profile_data.success = False
                profile_data.error = str(e)
                profile_data.execution_time_ms = (time.perf_counter() - start_time) * 1000
                profile_data.end_time = datetime.now(timezone.utc)
                
                await _global_registry.add_profile(profile_data)
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Skip se profiling desabilitado
            if not _global_registry.is_enabled():
                return func(*args, **kwargs)
            
            # Capturar métricas iniciais
            start_time = time.perf_counter()
            start_datetime = datetime.now(timezone.utc)
            
            start_memory = _global_registry._get_memory_mb() if track_memory else 0
            start_cpu = _global_registry._get_cpu_ms() if track_cpu else 0
            
            profile_data = ProfileData(
                function_name=func_name,
                module=module,
                file=file,
                line=line,
                execution_time_ms=0,
                start_time=start_datetime,
                end_time=start_datetime,
                memory_before_mb=start_memory,
                memory_after_mb=start_memory,
                memory_delta_mb=0,
                cpu_before_ms=start_cpu,
                cpu_after_ms=start_cpu,
                cpu_delta_ms=0
            )
            
            if stack_frames:
                profile_data.stack_frames = _capture_stack_frames()
            
            try:
                # Executar função
                result = func(*args, **kwargs)
                
                # Capturar métricas finais
                end_time = time.perf_counter()
                end_datetime = datetime.now(timezone.utc)
                end_memory = _global_registry._get_memory_mb() if track_memory else start_memory
                end_cpu = _global_registry._get_cpu_ms() if track_cpu else start_cpu
                
                # Atualizar profile data
                profile_data.execution_time_ms = (end_time - start_time) * 1000
                profile_data.end_time = end_datetime
                profile_data.memory_after_mb = end_memory
                profile_data.memory_delta_mb = end_memory - start_memory
                profile_data.cpu_after_ms = end_cpu
                profile_data.cpu_delta_ms = end_cpu - start_cpu
                profile_data.success = True
                
                # Registrar
                asyncio.create_task(_global_registry.add_profile(profile_data))
                
                return result
                
            except Exception as e:
                profile_data.success = False
                profile_data.error = str(e)
                profile_data.execution_time_ms = (time.perf_counter() - start_time) * 1000
                profile_data.end_time = datetime.now(timezone.utc)
                
                asyncio.create_task(_global_registry.add_profile(profile_data))
                raise
        
        # Retorna wrapper apropriado (async ou sync)
        if asyncio.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        else:
            return sync_wrapper  # type: ignore
    
    return decorator


def profile_endpoint(
    track_queries: bool = True,
    track_cache: bool = True,
    min_slow_threshold: int = 100
) -> Callable:
    """
    Decorador para profiling de endpoints FastAPI.
    
    Args:
        track_queries: Automaticamente track queries do request
        track_cache: Automaticamente track cache hits/misses
        min_slow_threshold: Threshold em ms para marcar como slow
    
    Usage:
        @profile_endpoint()
        @app.get("/api/endpoint")
        async def endpoint():
            ...
    """
    
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            
            try:
                # Executar endpoint
                result = await func(*args, **kwargs)
                
                duration_ms = (time.perf_counter() - start_time) * 1000
                
                # Adicionar header se response tiver headers
                if hasattr(result, 'headers'):
                    result.headers['X-Endpoint-Time-ms'] = str(int(duration_ms))
                    
                    if duration_ms > min_slow_threshold:
                        result.headers['X-Endpoint-Slow'] = 'true'
                
                return result
                
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            
            try:
                result = func(*args, **kwargs)
                
                duration_ms = (time.perf_counter() - start_time) * 1000
                
                if hasattr(result, 'headers'):
                    result.headers['X-Endpoint-Time-ms'] = str(int(duration_ms))
                    
                    if duration_ms > min_slow_threshold:
                        result.headers['X-Endpoint-Slow'] = 'true'
                
                return result
                
            except Exception as e:
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        else:
            return sync_wrapper  # type: ignore
    
    return decorator


def _capture_stack_frames(skip: int = 1, max_frames: int = 50) -> List[Dict[str, Any]]:
    """Captura stack frames atuais"""
    import inspect
    
    frames = []
    for frame_info in inspect.stack()[skip:skip + max_frames]:
        # Skip frames do profiler
        if 'profiler' in frame_info.filename:
            continue
        
        frames.append({
            'file': frame_info.filename,
            'line': frame_info.lineno,
            'function': frame_info.function,
            'code': frame_info.code_context[0].strip() if frame_info.code_context else None
        })
    
    return frames


# ============================================
# Context Managers
# ============================================

from contextlib import asynccontextmanager, contextmanager


@asynccontextmanager
async def profile_context(name: str, metadata: Optional[Dict[str, Any]] = None):
    """
    Context manager para profiling de blocos de código async.
    
    Usage:
        async with profile_context("my_operation"):
            await some_async_operation()
    """
    start_time = time.perf_counter()
    start_memory = get_registry()._get_memory_mb()
    start_datetime = datetime.now(timezone.utc)
    
    try:
        yield
    finally:
        duration_ms = (time.perf_counter() - start_time) * 1000
        end_memory = get_registry()._get_memory_mb()
        
        profile = ProfileData(
            function_name=name,
            module="context",
            file="context",
            line=0,
            execution_time_ms=duration_ms,
            start_time=start_datetime,
            end_time=datetime.now(timezone.utc),
            memory_before_mb=start_memory,
            memory_after_mb=end_memory,
            memory_delta_mb=end_memory - start_memory,
            cpu_before_ms=0,
            cpu_after_ms=0,
            cpu_delta_ms=0,
            metadata=metadata or {}
        )
        
        await get_registry().add_profile(profile)


@contextmanager
def profile_context_sync(name: str, metadata: Optional[Dict[str, Any]] = None):
    """
    Context manager para profiling de blocos de código síncrono.
    
    Usage:
        with profile_context_sync("sync_operation"):
            result = some_sync_operation()
    """
    start_time = time.perf_counter()
    start_memory = get_registry()._get_memory_mb()
    start_datetime = datetime.now(timezone.utc)
    
    try:
        yield
    finally:
        duration_ms = (time.perf_counter() - start_time) * 1000
        end_memory = get_registry()._get_memory_mb()
        
        profile = ProfileData(
            function_name=name,
            module="context",
            file="context",
            line=0,
            execution_time_ms=duration_ms,
            start_time=start_datetime,
            end_time=datetime.now(timezone.utc),
            memory_before_mb=start_memory,
            memory_after_mb=end_memory,
            memory_delta_mb=end_memory - start_memory,
            cpu_before_ms=0,
            cpu_after_ms=0,
            cpu_delta_ms=0,
            metadata=metadata or {}
        )
        
        asyncio.create_task(get_registry().add_profile(profile))
