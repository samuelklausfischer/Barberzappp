"""
BarberZap - Performance Profiler Package

Sistema completo de profiling para monitoramento e otimização de performance.

Components:
- ProfilingMiddleware: Middleware automático para profiling de requests
- BackendProfiler: Decorators para profiling de funções
- QueriesProfiler: Profiling de queries SQL
- AlertingManager: Sistema de alertas de performance
- FlameGraphGenerator: Geração de flame graphs
- ProfilerCLI: Interface de linha de comando

Uso básico:

    # Middleware (em main.py ou app.py)
    from profiler.profiling_middleware import ProfilingMiddleware
    app.add_middleware(ProfilingMiddleware)

    # Decorator de função
    from profiler.backend_profiler import profile_function

    @profile_function(track_memory=True)
    def my_function():
        ...

    # Profiling de queries
    from profiler.queries_profiler import profile_query

    async with profile_query(conn, "SELECT * FROM users") as (result, duration):
        rows = await conn.fetch("SELECT * FROM users")

    # Alertas
    from profiler.alerting import get_alerting_manager, setup_channels_from_env

    setup_channels_from_env()
    # Alertas automáticos são disparados

    # CLI
    $ profiler status
    $ profiler endpoints
    $ profiler queries
"""

from .profiling_middleware import (
    ProfilingMiddleware,
    ProfilingConfig,
    QueryTracker,
    CacheTracker,
    get_profiler_from_request,
    profile_query,
    profile_cache_hit,
    profile_cache_miss
)

from .backend_profiler import (
    ProfileData,
    ProfilerRegistry,
    get_registry,
    profile_function,
    profile_endpoint,
    profile_context,
    profile_context_sync
)

from .queries_profiler import (
    QueryProfile,
    QueryProfileStorage,
    profile_query as profile_query_async,
    profile_query_method,
    get_profiler_storage,
    get_query_stats_summary
)

from .alerting import (
    Alert,
    AlertThreshold,
    AlertSeverity,
    AlertType,
    AlertingManager,
    get_alerting_manager,
    setup_channels_from_env,
    start_alerting_monitor
)

from .flamegraph_generator import (
    StackFrame,
    FlameGraphGenerator,
    generate_flamegraph,
    generate_flamegraph_json,
    capture_with_py_spy
)

__all__ = [
    # ProfilingMiddleware
    'ProfilingMiddleware',
    'ProfilingConfig',
    'QueryTracker',
    'CacheTracker',
    'get_profiler_from_request',
    'profile_query',
    'profile_cache_hit',
    'profile_cache_miss',
    
    # BackendProfiler
    'ProfileData',
    'ProfilerRegistry',
    'get_registry',
    'profile_function',
    'profile_endpoint',
    'profile_context',
    'profile_context_sync',
    
    # QueriesProfiler
    'QueryProfile',
    'QueryProfileStorage',
    'profile_query_async',
    'profile_query_method',
    'get_profiler_storage',
    'get_query_stats_summary',
    
    # Alerting
    'Alert',
    'AlertThreshold',
    'AlertSeverity',
    'AlertType',
    'AlertingManager',
    'get_alerting_manager',
    'setup_channels_from_env',
    'start_alerting_monitor',
    
    # FlameGraphGenerator
    'StackFrame',
    'FlameGraphGenerator',
    'generate_flamegraph',
    'generate_flamegraph_json',
    'capture_with_py_spy',
]

__version__ = '1.0.0'
