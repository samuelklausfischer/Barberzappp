"""
Region Routing Middleware for BarberZap Multi-Region Deployment
Handles region detection, latency-based routing, and automatic failover
"""

import time
import asyncio
import logging
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
from collections import defaultdict
from datetime import datetime, timedelta
import inspect

# FastAPI integration
try:
    from fastapi import Request, Response, HTTPException, status
    from fastapi.middleware import Middleware
    from starlette.middleware.base import BaseHTTPMiddleware
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    Request = Any
    Response = Any

logger = logging.getLogger(__name__)


class RegionStatus(Enum):
    """Health status of a region"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    MAINTENANCE = "maintenance"


@dataclass
class RoutingDecision:
    """Result of region routing decision"""
    region: str
    reason: str
    latency_estimate_ms: float = 0.0
    is_fallback: bool = False
    original_region: Optional[str] = None


@dataclass
class RegionMetrics:
    """Metrics for a region"""
    request_count: int = 0
    success_count: int = 0
    error_count: int = 0
    total_latency_ms: float = 0.0
    min_latency_ms: float = float('inf')
    max_latency_ms: float = 0.0
    last_success: float = 0.0
    last_error: float = 0.0
    circuit_breaker_open: bool = False
    circuit_breaker_opened_at: Optional[float] = None
    consecutive_failures: int = 0
    
    @property
    def avg_latency_ms(self) -> float:
        """Calculate average latency"""
        if self.request_count == 0:
            return 0.0
        return self.total_latency_ms / self.request_count
    
    @property
    def error_rate(self) -> float:
        """Calculate error rate"""
        if self.request_count == 0:
            return 0.0
        return self.error_count / self.request_count
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.request_count == 0:
            return 1.0
        return self.success_count / self.request_count
    
    def record_request(self, latency_ms: float, success: bool):
        """Record a request to this region"""
        self.request_count += 1
        self.total_latency_ms += latency_ms
        self.min_latency_ms = min(self.min_latency_ms, latency_ms)
        self.max_latency_ms = max(self.max_latency_ms, latency_ms)
        
        now = time.time()
        if success:
            self.success_count += 1
            self.last_success = now
            self.consecutive_failures = 0
        else:
            self.error_count += 1
            self.last_error = now
            self.consecutive_failures += 1
    
    def open_circuit_breaker(self):
        """Open circuit breaker for this region"""
        self.circuit_breaker_open = True
        self.circuit_breaker_opened_at = time.time()
        logger.warning(f"Circuit breaker opened due to failures")
    
    def try_close_circuit_breaker(self, timeout_seconds: int = 60) -> bool:
        """Try to close circuit breaker if timeout passed"""
        if not self.circuit_breaker_open:
            return True
        
        if self.circuit_breaker_opened_at:
            elapsed = time.time() - self.circuit_breaker_opened_at
            if elapsed > timeout_seconds:
                self.circuit_breaker_open = False
                self.circuit_breaker_opened_at = None
                self.consecutive_failures = 0
                logger.info("Circuit breaker closed, allowing traffic")
                return True
        
        return False


class RegionRoutingMiddleware:
    """
    Middleware for intelligent region routing
    """
    
    # Default regions configuration
    DEFAULT_REGIONS = {
        'latam': {
            'name': 'Latin America',
            'datacenter': 'us-east-1',
            'latency_base': 100,
            'priority': 1,
            'weight': 100,
        },
        'us-east': {
            'name': 'US East',
            'datacenter': 'us-east-1',
            'latency_base': 150,
            'priority': 2,
            'weight': 80,
        },
        'us-west': {
            'name': 'US West',
            'datacenter': 'us-west-2',
            'latency_base': 200,
            'priority': 3,
            'weight': 60,
        },
        'eu-central': {
            'name': 'Europe Central',
            'datacenter': 'eu-central-1',
            'latency_base': 180,
            'priority': 4,
            'weight': 50,
        },
        'asia-pacific': {
            'name': 'Asia Pacific',
            'datacenter': 'ap-northeast-1',
            'latency_base': 300,
            'priority': 5,
            'weight': 40,
        },
    }
    
    def __init__(
        self,
        config: Optional[Dict[str, Any]] = None,
        enable_circuit_breaker: bool = True,
        circuit_breaker_threshold: int = 5,
        circuit_breaker_timeout: int = 60,
        health_check_interval: int = 30,
    ):
        """
        Initialize Region Routing Middleware
        
        Args:
            config: Region configuration (uses DEFAULT_REGIONS if None)
            enable_circuit_breaker: Enable circuit breaker pattern
            circuit_breaker_threshold: Consecutive failures before opening circuit
            circuit_breaker_timeout: Seconds before attempting to close circuit
            health_check_interval: Health check interval (not implemented in middleware)
        """
        self.regions = config or self.DEFAULT_REGIONS.copy()
        self.metrics: Dict[str, RegionMetrics] = {
            region_id: RegionMetrics()
            for region_id in self.regions
        }
        
        self.enable_circuit_breaker = enable_circuit_breaker
        self.circuit_breaker_threshold = circuit_breaker_threshold
        self.circuit_breaker_timeout = circuit_breaker_timeout
        self.health_check_interval = health_check_interval
        
        # Routing strategy
        self.routing_strategy = "latency"  # latency, round-robin, weighted, random
        self.enable_auto_fallback = True
        self.fallback_regions = ['us-east', 'us-west']
        
        # Latency cache
        self.latency_cache: Dict[str, float] = {}
        self.latency_cache_ttl = 300  # 5 minutes
        
        # GeoIP mapping
        self.country_region_map = {
            'BR': 'latam', 'AR': 'latam', 'CL': 'latam', 'CO': 'latam',
            'PE': 'latam', 'MX': 'latam', 'VE': 'latam',
            'US': 'us-east', 'CA': 'us-east',
            'GB': 'eu-central', 'DE': 'eu-central', 'FR': 'eu-central',
            'ES': 'eu-central', 'IT': 'eu-central', 'NL': 'eu-central',
            'JP': 'asia-pacific', 'KR': 'asia-pacific', 'SG': 'asia-pacific',
            'AU': 'asia-pacific',
        }
        
        # Lock for thread safety
        self._lock = None
    
    def get_region_for_request(self, request: Request) -> RoutingDecision:
        """
        Determine the optimal region for a request
        """
        if not FASTAPI_AVAILABLE:
            return RoutingDecision(region='latam', reason='default')
        
        # Check for explicit region in headers
        explicit_region = request.headers.get('X-Preferred-Region')
        if explicit_region and explicit_region in self.regions:
            metrics = self.metrics[explicit_region]
            
            # Check circuit breaker
            if self.enable_circuit_breaker and metrics.circuit_breaker_open:
                # Try to close circuit breaker
                if metrics.try_close_circuit_breaker(self.circuit_breaker_timeout):
                    pass  # Circuit closed, proceed
                else:
                    # Find fallback region
                    if self.enable_auto_fallback:
                        fallback = self._find_fallback_region(explicit_region)
                        if fallback:
                            return RoutingDecision(
                                region=fallback,
                                reason='circuit_breaker_fallback',
                                is_fallback=True,
                                original_region=explicit_region
                            )
            
            return RoutingDecision(
                region=explicit_region,
                reason='explicit_header'
            )
        
        # Check for region in cookie
        region_cookie = request.state.get('region_cookie')
        if region_cookie and region_cookie in self.regions:
            return RoutingDecision(
                region=region_cookie,
                reason='cookie'
            )
        
        # Check for Cloudflare country header
        cf_country = request.headers.get('CF-IPCountry', request.headers.get('X-Forwarded-For', '').split(',')[-1])
        if cf_country:
            cf_country = cf_country.strip().upper()
            if cf_country in self.country_region_map:
                mapped_region = self.country_region_map[cf_country]
                if self._is_region_healthy(mapped_region):
                    return RoutingDecision(
                        region=mapped_region,
                        reason='geolocation'
                    )
        
        # Route based on strategy
        return self._route_by_strategy(request)
    
    def _is_region_healthy(self, region_id: str) -> bool:
        """Check if region is healthy and available"""
        if region_id not in self.regions:
            return False
        
        metrics = self.metrics[region_id]
        
        # Check circuit breaker
        if self.enable_circuit_breaker:
            if metrics.circuit_breaker_open:
                metrics.try_close_circuit_breaker(self.circuit_breaker_timeout)
                if metrics.circuit_breaker_open:
                    return False
        
        # Check error rate
        if metrics.request_count > 10 and metrics.error_rate > 0.5:
            return False
        
        return True
    
    def _find_fallback_region(self, excluded_region: str) -> Optional[str]:
        """Find a healthy fallback region"""
        for fallback in self.fallback_regions:
            if fallback != excluded_region and self._is_region_healthy(fallback):
                return fallback
        
        # Try any other healthy region
        for region_id in self.regions:
            if region_id != excluded_region and self._is_region_healthy(region_id):
                return region_id
        
        return None
    
    def _route_by_strategy(self, request: Request) -> RoutingDecision:
        """Route request based on configured strategy"""
        healthy_regions = [
            r for r in self.regions
            if self._is_region_healthy(r)
        ]
        
        if not healthy_regions:
            logger.warning("No healthy regions, using default")
            return RoutingDecision(region='latam', reason='no_healthy_regions')
        
        if self.routing_strategy == "latency":
            # Sort by measured latency
            sorted_regions = sorted(
                healthy_regions,
                key=lambda r: self.latency_cache.get(r, float('inf'))
            )
            selected_region = sorted_regions[0]
            latency_estimate = self.latency_cache.get(selected_region, 0)
            
            return RoutingDecision(
                region=selected_region,
                reason='latency_optimal',
                latency_estimate_ms=latency_estimate
            )
        
        elif self.routing_strategy == "round-robin":
            # Simple round-robin based on request count
            sorted_regions = sorted(
                healthy_regions,
                key=lambda r: self.metrics[r].request_count
            )
            selected_region = sorted_regions[0]
            
            return RoutingDecision(
                region=selected_region,
                reason='round_robin'
            )
        
        elif self.routing_strategy == "weighted":
            # Weighted random based on config weight
            import random
            
            weights = [self.regions[r]['weight'] for r in healthy_regions]
            selected_region = random.choices(healthy_regions, weights=weights)[0]
            
            return RoutingDecision(
                region=selected_region,
                reason='weighted_random'
            )
        
        else:  # random
            import random
            selected_region = random.choice(healthy_regions)
            
            return RoutingDecision(
                region=selected_region,
                reason='random'
            )
    
    def record_request(self, region: str, latency_ms: float, success: bool):
        """
        Record request metrics for a region
        
        Args:
            region: Region ID
            latency_ms: Request latency in milliseconds
            success: Whether the request was successful
        """
        if region not in self.metrics:
            logger.warning(f"Unknown region: {region}")
            return
        
        metrics = self.metrics[region]
        metrics.record_request(latency_ms, success)
        
        # Update latency cache
        self.latency_cache[region] = latency_ms
        
        # Check circuit breaker
        if self.enable_circuit_breaker and not success:
            if metrics.consecutive_failures >= self.circuit_breaker_threshold:
                metrics.open_circuit_breaker()
    
    def get_region_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all regions"""
        return {
            region_id: {
                'request_count': metrics.request_count,
                'success_rate': metrics.success_rate,
                'error_rate': metrics.error_rate,
                'avg_latency_ms': metrics.avg_latency_ms,
                'min_latency_ms': metrics.min_latency_ms,
                'max_latency_ms': metrics.max_latency_ms,
                'last_success': metrics.last_success,
                'last_error': metrics.last_error,
                'circuit_breaker_open': metrics.circuit_breaker_open,
            }
            for region_id, metrics in self.metrics.items()
        }
    
    def reset_metrics(self, region: Optional[str] = None):
        """Reset metrics for a region or all regions"""
        if region:
            if region in self.metrics:
                self.metrics[region] = RegionMetrics()
        else:
            self.metrics = {r: RegionMetrics() for r in self.regions}
    
    # ==================== Decorator ====================
    
    def with_region_routing(self, func: Callable) -> Callable:
        """
        Decorator to enable region routing for an endpoint
        
        Usage:
            @router.get("/api/data")
            @region_middleware.with_region_routing
            async def get_data(request: Request):
                ...
        """
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            for key, value in kwargs.items():
                if isinstance(value, Request):
                    request = value
                    break
            
            if not request or not FASTAPI_AVAILABLE:
                return await func(*args, **kwargs)
            
            # Get routing decision
            decision = self.get_region_for_request(request)
            
            # Add region to request state
            request.state.region = decision.region
            request.state.routing_decision = decision
            
            # Record start time
            start_time = time.time()
            success = False
            
            try:
                result = await func(*args, **kwargs)
                success = True
                
                # Add region headers to response
                if isinstance(result, Response):
                    result.headers['X-Served-Region'] = decision.region
                    result.headers['X-Routing-Reason'] = decision.reason
                    if decision.is_fallback:
                        result.headers['X-Original-Region'] = decision.original_region or ''
                
                return result
                
            except Exception as e:
                success = False
                raise
            
            finally:
                # Record metrics
                latency_ms = (time.time() - start_time) * 1000
                self.record_request(decision.region, latency_ms, success)
        
        return wrapper


# ==================== FastAPI Middleware ====================

if FASTAPI_AVAILABLE:

    class RegionRoutingHTTPMiddleware(BaseHTTPMiddleware):
        """
        FastAPI HTTP Middleware for region routing
        """
        
        def __init__(self, app, region_manager: RegionRoutingMiddleware):
            super().__init__(app)
            self.region_manager = region_manager
        
        async def dispatch(self, request: Request, call_next):
            """Middleware dispatch method"""
            # Handle CORS preflight
            if request.method == "OPTIONS":
                return await call_next(request)
            
            # Determine region
            decision = self.region_manager.get_region_for_request(request)
            
            # Store in state
            request.state.region = decision.region
            request.state.routing_decision = decision
            
            # Record start time
            start_time = time.time()
            success = False
            
            try:
                response = await call_next(request)
                success = True
                
                # Add headers
                response.headers['X-Served-Region'] = decision.region
                response.headers['X-Routing-Reason'] = decision.reason
                
                if decision.is_fallback:
                    response.headers['X-Original-Region'] = decision.original_region or ''
                
                if decision.latency_estimate_ms:
                    response.headers['X-Region-Latency'] = str(decision.latency_estimate_ms)
                
                return response
                
            except Exception:
                success = False
                raise
            
            finally:
                # Record metrics
                latency_ms = (time.time() - start_time) * 1000
                self.region_manager.record_request(decision.region, latency_ms, success)


# ==================== Singleton ====================

# Global instance
_region_routing_middleware: Optional[RegionRoutingMiddleware] = None


def get_region_routing_middleware(config: Optional[Dict] = None) -> RegionRoutingMiddleware:
    """Get or create global region routing middleware instance"""
    global _region_routing_middleware
    if _region_routing_middleware is None:
        _region_routing_middleware = RegionRoutingMiddleware(config)
    return _region_routing_middleware


# ==================== Helper Functions ====================

def parse_region_from_ip(ip: str, country_map: Optional[Dict[str, str]] = None) -> Optional[str]:
    """
    Parse region from IP (simplified - would use GeoIP in production)
    """
    if not ip:
        return None
    
    # This is a simplified version. In production, use actual GeoIP service
    # such as ip-api.com, MaxMind GeoIP2, or Cloudflare headers
    return None


def estimate_latency_to_region(source_ip: str, region_id: str,
                               base_latencies: Optional[Dict[str, float]] = None) -> float:
    """
    Estimate latency to a region from source IP
    
    Args:
        source_ip: Source IP address
        region_id: Target region ID
        base_latencies: Base latency for each region
    """
    if base_latencies:
        return base_latencies.get(region_id, 200.0)
    
    # Use default approximations
    default_latencies = {
        'latam': 100.0,
        'us-east': 150.0,
        'us-west': 200.0,
        'eu-central': 180.0,
        'asia-pacific': 300.0,
    }
    
    return default_latencies.get(region_id, 200.0)


# ==================== CLI ====================

def print_region_stats(manager: RegionRoutingMiddleware):
    """Print region statistics to console"""
    stats = manager.get_region_stats()
    
    print("\n" + "=" * 80)
    print("REGION ROUTING STATISTICS")
    print("=" * 80)
    print(f"{'Region':<15} {'Requests':>10} {'Success':>10} {'Avg Latency':>12} {'Status':>12}")
    print("-" * 80)
    
    for region_id, stat in stats.items():
        status = "✓" if not manager.metrics[region_id].circuit_breaker_open else "✗ CB"
        print(
            f"{region_id:<15} "
            f"{stat['request_count']:>10} "
            f"{stat['success_rate']:>9.1%} "
            f"{stat['avg_latency_ms']:>11.0f}ms "
            f"{status:>12}"
        )
    
    print("=" * 80)
    print(f"Total Requests: {sum(s['request_count'] for s in stats.values())}")
    print(f"Routing Strategy: {manager.routing_strategy}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    # Demo
    manager = RegionRoutingMiddleware()
    
    # Simulate some requests
    for region in ['latam', 'us-east', 'us-west']:
        for i in range(100):
            latency = manager.regions[region]['latency_base'] + (hash(f"{region}{i}") % 50)
            success = random.random() > 0.1  # 90% success rate
            manager.record_request(region, latency, success)
    
    print_region_stats(manager)
