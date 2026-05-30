#!/usr/bin/env python3
"""
BarberZap - Performance Profiler CLI

Interface de linha de comando para gerenciar o profiler.

Comandos disponíveis:
    profiler status          - Mostrar status do profiler
    profiler endpoints       - Mostrar endpoints mais lentos
    profiler queries         - Mostrar queries mais lentas
    profiler cache           - Mostrar estatísticas de cache
    profiler profile <name>  - Executar profiling de uma função
    profiler dump            - Exportar dados de profiling
    profiler reset           - Limpar todos os dados
    profiler alerts          - Mostrar alertas de performance
    profiler flamegraph      - Gerar flame graph
"""

import asyncio
import json
import sys
import argparse
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

try:
    from ..config.redis_config import RedisConfig
    from .backend_profiler import get_registry, ProfilerRegistry
    from .queries_profiler import get_profiler_storage, get_query_stats_summary
except ImportError:
    # Para execução direta
    sys.path.insert(0, '/root/barber/backend')
    from config.redis_config import RedisConfig
    from profiler.backend_profiler import get_registry, ProfilerRegistry
    from profiler.queries_profiler import get_profiler_storage, get_query_stats_summary


class ProfilerCLI:
    """CLI para gerenciar o profiler"""
    
    def __init__(self):
        self.redis = None
        self.registry = None
        self.query_storage = None
    
    async def initialize(self):
        """Inicializa conexões"""
        self.redis = RedisConfig().get_client()
        self.registry = get_registry()
        self.query_storage = get_profiler_storage()
    
    async def status(self, args) -> Dict[str, Any]:
        """
        Mostra status do profiler
        
        profiler status
        """
        try:
            # Check se profiler está habilitado
            enabled = os.getenv('PROFILER_ENABLED', 'true').lower() == 'true'
            sampling_rate = float(os.getenv('PROFILER_SAMPLING_RATE', '0.1'))
            
            # Contagem de requests no Redis
            request_count = await self.redis.dbsize() if self.redis else 0
            
            # Get function profiles
            function_stats = await self.registry.get_stats()
            
            # Get query stats
            query_stats = await self.query_stats_summary()
            
            status = {
                'profiler_enabled': enabled,
                'sampling_rate': sampling_rate,
                'environment': os.getenv('ENVIRONMENT', 'unknown'),
                'redis_keys': request_count,
                'functions_profiled': len(function_stats),
                'queries_profiled': query_stats.get('total_queries_profiled', 0),
                'slow_queries': query_stats.get('slow_queries_count', 0),
                'n_plus_one_detected': query_stats.get('n_plus_one_count', 0),
                'slow_request_threshold': int(os.getenv('PROFILER_SLOW_REQUEST_THRESHOLD', '500')),
                'slow_query_threshold': int(os.getenv('PROFILER_SLOW_QUERY_THRESHOLD', '50'))
            }
            
            if args.json:
                print(json.dumps(status, indent=2))
            else:
                self._print_status(status)
            
            return status
            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    def _print_status(self, status: Dict[str, Any]):
        """Imprime status formatado"""
        print("\n" + "=" * 60)
        print("BarberZap Performance Profiler Status")
        print("=" * 60)
        print(f"Environment:        {status['environment']}")
        print(f"Profiler Enabled:   {'✓' if status['profiler_enabled'] else '✗'}")
        print(f"Sampling Rate:      {status['sampling_rate']:.0%}")
        print(f"\nMetrics:")
        print(f"  Functions Profiled:   {status['functions_profiled']}")
        print(f"  Queries Profiled:     {status['queries_profiled']}")
        print(f"  Slow Queries:         {status['slow_queries']}")
        print(f"  N+1 Queries:          {status['n_plus_one_detected']}")
        print(f"  Redis Keys:           {status['redis_keys']}")
        print(f"\nThresholds:")
        print(f"  Slow Request:     {status['slow_request_threshold']}ms")
        print(f"  Slow Query:       {status['slow_query_threshold']}ms")
        print("=" * 60 + "\n")
    
    async def endpoints(self, args) -> List[Dict[str, Any]]:
        """
        Mostra endpoints mais lentos
        
        profiler endpoints [--limit N] [--slow-only]
        """
        try:
            limit = args.limit or 20
            slow_only = args.slow_only
            
            # Buscar dados do Redis
            endpoint_keys = await self.redis.smembers('profiling:endpoints')
            
            endpoints_data = []
            
            for endpoint in endpoint_keys:
                # Pegar todos os requests deste endpoint
                request_ids = await self.redis.zrevrange(
                    f'profiling:endpoint:{endpoint.decode()}',
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
                min_duration = min(durations)
                p95_duration = sorted(durations)[int(total_requests * 0.95)] if total_requests > 0 else 0
                
                endpoints_data.append({
                    'endpoint': endpoint.decode(),
                    'request_count': total_requests,
                    'total_duration_ms': total_duration,
                    'avg_duration_ms': avg_duration,
                    'min_duration_ms': min_duration,
                    'max_duration_ms': max_duration,
                    'p95_duration_ms': p95_duration
                })
            
            # Filtrar se slow-only
            if slow_only:
                endpoints_data = [e for e in endpoints_data if e['avg_duration_ms'] > 500]
            
            # Ordenar por avg duration
            endpoints_data.sort(key=lambda x: x['avg_duration_ms'], reverse=True)
            
            # Limitar resultado
            endpoints_data = endpoints_data[:limit]
            
            if args.json:
                print(json.dumps(endpoints_data, indent=2))
            else:
                self._print_endpoints(endpoints_data)
            
            return endpoints_data
            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    def _print_endpoints(self, endpoints: List[Dict[str, Any]]):
        """Imprime endpoints formatado"""
        print("\n" + "=" * 100)
        print(f"{'Endpoint':<40} {'Requests':<10} {'Avg (ms)':<12} {'P95 (ms)':<12} {'Max (ms)':<12}")
        print("=" * 100)
        
        for ep in endpoints:
            print(
                f"{ep['endpoint']:<40} "
                f"{ep['request_count']:<10} "
                f"{ep['avg_duration_ms']:<12.1f} "
                f"{ep['p95_duration_ms']:<12.1f} "
                f"{ep['max_duration_ms']:<12.1f}"
            )
        
        print("=" * 100 + "\n")
    
    async def queries(self, args) -> List[Dict[str, Any]]:
        """
        Mostra queries mais lentas
        
        profiler queries [--limit N] [--analyze-plan]
        """
        try:
            limit = args.limit or 50
            analyze_plan = args.analyze_plan
            
            # Buscar slow queries do storage
            slow_queries = await self.query_storage.get_slow_queries(limit)
            
            queries_data = []
            for query in slow_queries:
                qdata = {
                    'query_preview': query.query_preview,
                    'duration_ms': query.duration_ms,
                    'query_type': query.query_type,
                    'timestamp': query.timestamp.isoformat(),
                    'endpoint': query.endpoint,
                    'rows_affected': query.rows_affected,
                    'is_sequential_scan': query.is_sequential_scan,
                    'n_plus_one_detected': query.n_plus_one_detected
                }
                
                if analyze_plan and query.execution_plan:
                    qdata['execution_plan'] = query.execution_plan
                
                queries_data.append(qdata)
            
            if args.json:
                print(json.dumps(queries_data, indent=2))
            else:
                self._print_queries(queries_data)
            
            return queries_data
            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    def _print_queries(self, queries: List[Dict[str, Any]]):
        """Imprime queries formatado"""
        print("\n" + "=" * 120)
        print(f"{'Query':<50} {'Type':<8} {'Duration (ms)':<15} {'Rows':<8} {'Endpoint':<30}")
        print("=" * 120)
        
        for q in queries:
            print(
                f"{q['query_preview']:<50} "
                f"{q['query_type']:<8} "
                f"{q['duration_ms']:<15.2f} "
                f"{str(q['rows_affected'] or '-'):<8} "
                f"{(q['endpoint'] or '-')[:30]:<30}"
            )
        
        print("=" * 120 + "\n")
    
    async def cache(self, args) -> Dict[str, Any]:
        """
        Mostra estatísticas de cache
        
        profiler cache
        """
        # Implementação - buscar dados do Redis
        try:
            # Buscar dados de cache dos requests
            cache_stats = {
                'hit_rate': 0.0,
                'hits': 0,
                'misses': 0,
                'patterns': {}
            }
            
            # Buscar requests recentes e aggregate cache stats
            recent_requests = await self.redis.zrevrange('profiling:requests:timeline', 0, 99)
            
            total_hits = 0
            total_misses = 0
            pattern_stats = {}
            
            for req_id in recent_requests:
                req_data = await self.redis.get(f'profiling:requests:{req_id.decode()}')
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
            cache_stats['patterns'] = pattern_stats
            
            if args.json:
                print(json.dumps(cache_stats, indent=2))
            else:
                self._print_cache(cache_stats)
            
            return cache_stats
            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    def _print_cache(self, cache: Dict[str, Any]):
        """Imprime cache stats formatado"""
        print("\n" + "=" * 60)
        print("Cache Statistics")
        print("=" * 60)
        print(f"Total Hits:       {cache['hits']}")
        print(f"Total Misses:     {cache['misses']}")
        print(f"Hit Rate:         {cache['hit_rate']:.2%}")
        
        print("\n" + "=" * 60)
        print("Top Cache Patterns")
        print("=" * 60)
        
        # Ordenar patterns por total usage
        sorted_patterns = sorted(
            cache['patterns'].items(),
            key=lambda x: x[1]['hits'] + x[1]['misses'],
            reverse=True
        )[:10]
        
        for pattern, stats in sorted_patterns:
            total = stats['hits'] + stats['misses']
            hit_rate = stats['hits'] / total if total > 0 else 0
            print(f"{pattern:<40} ({hit_rate:5.1%} hit, {total} total)")
        
        print("=" * 60 + "\n")
    
    async def profile(self, args) -> Dict[str, Any]:
        """
        Executa profiling de uma função
        
        profiler profile <module.function>
        """
        # Implementação would import and profile specific function
        print("Function profiling not yet implemented")
        return {}
    
    async def dump(self, args) -> Dict[str, Any]:
        """
        Exporta dados de profiling
        
        profiler dump [--format json|flamegraph] [--output FILE]
        """
        try:
            format_type = args.format or 'json'
            
            if format_type == 'json':
                # Dump everything to JSON
                dump_data = {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'endpoints': await self.endpoints(type('Args', (), {'limit': 100, 'slow_only': False, 'json': True})),
                    'queries': await self.queries(type('Args', (), {'limit': 100, 'analyze_plan': False, 'json': True})),
                    'functions': await self.registry.get_stats(),
                    'query_stats': await self.query_stats_summary()
                }
                
                output = json.dumps(dump_data, indent=2)
                
                if args.output:
                    with open(args.output, 'w') as f:
                        f.write(output)
                    print(f"Dump saved to {args.output}")
                else:
                    print(output)
            
            elif format_type == 'flamegraph':
                from .flamegraph_generator import generate_flamegraph
                flamegraph = await generate_flamegraph()
                
                if args.output:
                    with open(args.output, 'w') as f:
                        f.write(flamegraph)
                    print(f"Flame graph saved to {args.output}")
                else:
                    print(flamegraph)
            
            else:
                print(f"Unknown format: {format_type}", file=sys.stderr)
                sys.exit(1)
            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    async def reset(self, args) -> None:
        """
        Limpa todos os dados de profiling
        
        profiler reset
        """
        try:
            if not args.force:
                response = input("This will delete all profiling data. Are you sure? [y/N]: ")
                if response.lower() != 'y':
                    print("Cancelled")
                    return
            
            # Clear Redis keys
            keys = await self.redis.keys('profiling:*')
            if keys:
                await self.redis.delete(*keys)
            
            # Clear registries
            await self.registry.reset()
            await self.query_storage.reset_query_profiles()
            
            print("All profiling data cleared")
            
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    async def alerts(self, args) -> List[Dict[str, Any]]:
        """
        Mostra alertas de performance
        
        profiler alerts
        """
        alerts = []
        
        # Check slow request rate
        slow_requests = await self.redis.zrange('profiling:requests:duration', 0, -1, withscores=True)
        slow_count = len([r for _, score in slow_requests if score > 500])
        
        if slow_count > 10:
            alerts.append({
                'type': 'high_latency',
                'severity': 'warning',
                'message': f"{slow_count} slow requests detected (>500ms) in the last period",
                'threshold': '500ms'
            })
        
        # Check slow queries
        slow_queries = await self.query_storage.get_slow_queries(10)
        if slow_queries and slow_queries[0].duration_ms > 500:
            alerts.append({
                'type': 'slow_query',
                'severity': 'critical',
                'message': f"Query taking {slow_queries[0].duration_ms:.2f}ms detected: {slow_queries[0].query_preview}",
                'threshold': '500ms'
            })
        
        # Check N+1 queries
        n_plus_one = await self.query_storage.get_n_plus_one_queries()
        if n_plus_one:
            alerts.append({
                'type': 'n_plus_one_query',
                'severity': 'warning',
                'message': f"{len(n_plus_one)} potential N+1 query patterns detected",
                'patterns': n_plus_one
            })
        
        if args.json:
            print(json.dumps(alerts, indent=2))
        else:
            self._print_alerts(alerts)
        
        return alerts
    
    def _print_alerts(self, alerts: List[Dict[str, Any]]):
        """Imprime alertas formatado"""
        if not alerts:
            print("\n✓ No performance alerts")
            return
        
        print("\n" + "=" * 80)
        print("Performance Alerts")
        print("=" * 80)
        
        for alert in alerts:
            severity_symbol = '🔴' if alert['severity'] == 'critical' else '🟡'
            print(f"\n{severity_symbol} [{alert['type'].upper()}] {alert['message']}")
        
        print("\n" + "=" * 80 + "\n")


async def main():
    """Função principal do CLI"""
    parser = argparse.ArgumentParser(
        description='BarberZap Performance Profiler CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # status
    subparsers.add_parser('status', help='Show profiler status')
    
    # endpoints
    ep_parser = subparsers.add_parser('endpoints', help='Show slowest endpoints')
    ep_parser.add_argument('--limit', '-l', type=int, help='Limit results')
    ep_parser.add_argument('--slow-only', action='store_true', help='Show only slow endpoints')
    
    # queries
    q_parser = subparsers.add_parser('queries', help='Show slowest queries')
    q_parser.add_argument('--limit', '-l', type=int, help='Limit results')
    q_parser.add_argument('--analyze-plan', action='store_true', help='Include execution plans')
    
    # cache
    subparsers.add_parser('cache', help='Show cache statistics')
    
    # profile
    prof_parser = subparsers.add_parser('profile', help='Profile a function')
    prof_parser.add_argument('function', help='Function to profile (module.function)')
    
    # dump
    dump_parser = subparsers.add_parser('dump', help='Export profiling data')
    dump_parser.add_argument('--format', '-f', choices=['json', 'flamegraph'], help='Output format')
    dump_parser.add_argument('--output', '-o', help='Output file')
    
    # reset
    reset_parser = subparsers.add_parser('reset', help='Clear all profiling data')
    reset_parser.add_argument('--force', '-f', action='store_true', help='Skip confirmation')
    
    # alerts
    subparsers.add_parser('alerts', help='Show performance alerts')
    
    # Global options
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    cli = ProfilerCLI()
    await cli.initialize()
    
    # Execute command
    command_method = getattr(cli, args.command, None)
    if command_method:
        await command_method(args)
    else:
        parser.print_help()
        sys.exit(1)


def run_cli():
    """Entry point para CLI"""
    import os
    os.chdir('/root/barber')
    asyncio.run(main())


if __name__ == '__main__':
    run_cli()
