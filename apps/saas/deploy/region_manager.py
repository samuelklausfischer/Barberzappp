"""
Region Manager for BarberZap Multi-Region Deployment
Manages regions, detects user location, routes traffic intelligently
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import logging
import socket
from pathlib import Path
import hashlib

logger = logging.getLogger(__name__)


class RegionStatus(Enum):
    """Status of a region"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNDER_MAINTENANCE = "maintenance"


@dataclass
class RegionConfig:
    """Configuration for a deployment region"""
    id: str
    name: str
    code: str  # e.g., 'us-east', 'latam'
    supabase_region: str  # Supabase region code (sfo, iad, ams, tok)
    datacenter: str  # Provider datacenter (cloud region)
    primary: bool = False
    latitude: float = 0.0
    longitude: float = 0.0
    priority: int = 100
    health_check_url: str = ""
    api_url: str = ""
    ws_url: str = ""
    
    # Runtime state
    status: RegionStatus = RegionStatus.HEALTHY
    latency_ms: float = 0.0
    error_count: int = 0
    last_check: float = 0.0
    circuit_breaker_open: bool = False
    circuit_breaker_until: float = 0.0


@dataclass
class RegionStats:
    """Statistics per region"""
    request_count: int = 0
    success_count: int = 0
    error_count: int = 0
    avg_latency: float = 0.0
    min_latency: float = float('inf')
    max_latency: float = 0.0
    last_latency: float = 0.0
    
    def record_request(self, latency_ms: float, success: bool):
        """Record a request to this region"""
        self.request_count += 1
        self.last_latency = latency_ms
        
        if success:
            self.success_count += 1
            # Update running average
            if self.avg_latency == 0:
                self.avg_latency = latency_ms
            else:
                self.avg_latency = (self.avg_latency * 0.9) + (latency_ms * 0.1)
        else:
            self.error_count += 1
        
        self.min_latency = min(self.min_latency, latency_ms)
        self.max_latency = max(self.max_latency, latency_ms)
    
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.request_count == 0:
            return 1.0
        return self.success_count / self.request_count


class RegionManager:
    """
    Manages multi-region deployment for BarberZap
    """
    
    # Supabase available regions
    SUPABASE_REGIONS = {
        'sfo': {'name': 'San Francisco', 'lat': 37.7749, 'lon': -122.4194},
        'iad': {'name': 'Washington D.C.', 'lat': 38.9072, 'lon': -77.0369},
        'ams': {'name': 'Amsterdam', 'lat': 52.3676, 'lon': 4.9041},
        'tok': {'name': 'Tokyo', 'lat': 35.6762, 'lon': 139.6503},
        'fra': {'name': 'Frankfurt', 'lat': 50.1109, 'lon': 8.6821},
        'lhr': {'name': 'London', 'lat': 51.5074, 'lon': -0.1278},
        'syd': {'name': 'Sydney', 'lat': -33.8688, 'lon': 151.2093},
    }
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize Region Manager"""
        self.regions: Dict[str, RegionConfig] = {}
        self.stats: Dict[str, RegionStats] = {}
        self.circuit_breaker_threshold = 3  # Errors before opening
        self.circuit_breaker_timeout = 60  # Seconds
        self.health_check_interval = 30
        self.latency_check_interval = 60
        self.fallback_enabled = True
        self.load_balancing_strategy = "latency"  # latency, round-robin, random
        self.session = None
        self._health_check_task = None
        self._latency_check_task = None
        
        # Load configuration
        if config_path:
            self.load_config(config_path)
        else:
            self._init_default_regions()
    
    def _init_default_regions(self):
        """Initialize default regions"""
        # LATAM (Primary for BarberZap)
        self.add_region(RegionConfig(
            id="latam",
            name="Latin America",
            code="latam",
            supabase_region="iad",  # Use US East as closest
            datacenter="us-east-1",
            primary=True,
            latitude=-14.2350,
            longitude=-51.9253,
            priority=1,
            api_url="https://api.barberzap.latam.example.com",
            ws_url="wss://api.barberzap.latam.example.com",
        ))
        
        # US East
        self.add_region(RegionConfig(
            id="us-east",
            name="US East",
            code="us-east",
            supabase_region="iad",
            datacenter="us-east-1",
            primary=False,
            latitude=39.0437,
            longitude=-77.4875,
            priority=2,
            api_url="https://api.barberzap.us-east.example.com",
            ws_url="wss://api.barberzap.us-east.example.com",
        ))
        
        # US West
        self.add_region(RegionConfig(
            id="us-west",
            name="US West",
            code="us-west",
            supabase_region="sfo",
            datacenter="us-west-2",
            primary=False,
            latitude=37.7749,
            longitude=-122.4194,
            priority=3,
            api_url="https://api.barberzap.us-west.example.com",
            ws_url="wss://api.barberzap.us-west.example.com",
        ))
        
        # Europe Central
        self.add_region(RegionConfig(
            id="eu-central",
            name="Europe Central",
            code="eu-central",
            supabase_region="fra",
            datacenter="eu-central-1",
            primary=False,
            latitude=50.1109,
            longitude=8.6821,
            priority=4,
            api_url="https://api.barberzap.eu.example.com",
            ws_url="wss://api.barberzap.eu.example.com",
        ))
        
        # Asia Pacific
        self.add_region(RegionConfig(
            id="asia-pacific",
            name="Asia Pacific",
            code="ap",
            supabase_region="tok",
            datacenter="ap-northeast-1",
            primary=False,
            latitude=35.6762,
            longitude=139.6503,
            priority=5,
            api_url="https://api.barberzap.ap.example.com",
            ws_url="wss://api.barberzap.ap.example.com",
        ))
        
        logger.info(f"Initialized {len(self.regions)} regions")
    
    def add_region(self, region: RegionConfig):
        """Add a region configuration"""
        self.regions[region.id] = region
        self.stats[region.id] = RegionStats()
        logger.info(f"Added region: {region.id} ({region.name})")
    
    def load_config(self, config_path: str):
        """Load regions from configuration file"""
        path = Path(config_path)
        if not path.exists():
            logger.warning(f"Config file not found: {config_path}")
            self._init_default_regions()
            return
        
        with open(path) as f:
            config = json.load(f)
        
        for region_data in config.get('regions', []):
            region = RegionConfig(**region_data)
            self.add_region(region)
    
    def save_config(self, config_path: str):
        """Save current regions to configuration file"""
        config = {
            'regions': [
                {
                    'id': r.id,
                    'name': r.name,
                    'code': r.code,
                    'supabase_region': r.supabase_region,
                    'datacenter': r.datacenter,
                    'primary': r.primary,
                    'latitude': r.latitude,
                    'longitude': r.longitude,
                    'priority': r.priority,
                    'health_check_url': r.health_check_url,
                    'api_url': r.api_url,
                    'ws_url': r.ws_url,
                }
                for r in self.regions.values()
            ]
        }
        
        Path(config_path).parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Saved config to {config_path}")
    
    async def detect_region_from_ip(self, ip: str) -> Optional[str]:
        """
        Detect best region based on IP address geolocation
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Using ip-api.com (free tier)
                async with session.get(f'http://ip-api.com/json/{ip}') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data.get('status') == 'success':
                            country_code = data.get('countryCode', '').upper()
                            lat = data.get('lat', 0)
                            lon = data.get('lon', 0)
                            return self._find_nearest_region(lat, lon, country_code)
        except Exception as e:
            logger.error(f"Error detecting region from IP: {e}")
        
        return None
    
    def _find_nearest_region(self, lat: float, lon: float, 
                            country_code: Optional[str] = None) -> Optional[str]:
        """
        Find nearest region by geographic distance
        """
        # Direct country mapping first
        country_map = {
            'BR': 'latam', 'AR': 'latam', 'CL': 'latam', 'CO': 'latam',
            'PE': 'latam', 'MX': 'latam', 'VE': 'latam',
            'US': 'us-east', 'CA': 'us-east',
            'GB': 'eu-central', 'DE': 'eu-central', 'FR': 'eu-central', 'ES': 'eu-central',
            'IT': 'eu-central', 'NL': 'eu-central',
            'JP': 'asia-pacific', 'KR': 'asia-pacific', 'SG': 'asia-pacific',
            'AU': 'asia-pacific', 'NZ': 'asia-pacific',
        }
        
        if country_code and country_code in country_map:
            region_id = country_map[country_code]
            if region_id in self.regions:
                return region_id
        
        # Find by distance
        best_region = None
        best_distance = float('inf')
        
        for region_id, region in self.regions.items():
            distance = self._calculate_distance(lat, lon, region.latitude, region.longitude)
            if distance < best_distance:
                best_distance = distance
                best_region = region_id
        
        return best_region
    
    @staticmethod
    def _calculate_distance(lat1: float, lon1: float, 
                           lat2: float, lon2: float) -> float:
        """
        Calculate Haversine distance between two points in km
        """
        import math
        
        R = 6371  # Earth radius in km
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def detect_region_from_timezone(self, timezone: str) -> Optional[str]:
        """
        Detect region from timezone string
        """
        tz_map = {
            # LATAM
            'America/Sao_Paulo': 'latam',
            'America/Buenos_Aires': 'latam',
            'America/Santiago': 'latam',
            'America/Bogota': 'latam',
            'America/Lima': 'latam',
            'America/Mexico_City': 'latam',
            'America/Caracas': 'latam',
            # US
            'America/New_York': 'us-east',
            'America/Washington': 'us-east',
            'America/Chicago': 'us-east',
            'America/Los_Angeles': 'us-west',
            'America/Denver': 'us-west',
            'America/Phoenix': 'us-west',
            # Europe
            'Europe/London': 'eu-central',
            'Europe/Paris': 'eu-central',
            'Europe/Berlin': 'eu-central',
            'Europe/Amsterdam': 'eu-central',
            'Europe/Rome': 'eu-central',
            'Europe/Madrid': 'eu-central',
            # Asia
            'Asia/Tokyo': 'asia-pacific',
            'Asia/Seoul': 'asia-pacific',
            'Asia/Singapore': 'asia-pacific',
            'Asia/Shanghai': 'asia-pacific',
            # Australia
            'Australia/Sydney': 'asia-pacific',
        }
        
        return tz_map.get(timezone)
    
    def get_region_for_request(self, headers: Dict[str, str], 
                              preferred_region: Optional[str] = None) -> RegionConfig:
        """
        Get the optimal region for a request
        """
        # Check if user specified a region
        region_header = headers.get('X-Preferred-Region')
        if region_header and region_header in self.regions:
            region = self.regions[region_header]
            if not region.circuit_breaker_open:
                return region
        
        # Check for cookie-stored region
        cookie_region = headers.get('X-Region-Cookie')
        if cookie_region and cookie_region in self.regions:
            region = self.regions[cookie_region]
            if not region.circuit_breaker_open:
                return region
        
        # Use preferred region if provided and healthy
        if preferred_region and preferred_region in self.regions:
            region = self.regions[preferred_region]
            if not region.circuit_breaker_open and region.status != RegionStatus.UNHEALTHY:
                return region
        
        # Route based on strategy
        return self._route_by_strategy()
    
    def _route_by_strategy(self) -> RegionConfig:
        """
        Route request based on configured strategy
        """
        healthy_regions = [
            r for r in self.regions.values()
            if r.status in [RegionStatus.HEALTHY, RegionStatus.DEGRADED]
            and not r.circuit_breaker_open
        ]
        
        if not healthy_regions:
            # Fallback to any non-circuit broken region
            healthy_regions = [
                r for r in self.regions.values()
                if not r.circuit_breaker_open
            ]
        
        if not healthy_regions:
            # Last resort: return primary region
            return [r for r in self.regions.values() if r.primary][0]
        
        if self.load_balancing_strategy == "latency":
            # Sort by measured latency
            healthy_regions.sort(key=lambda r: r.latency_ms)
            return healthy_regions[0]
        
        elif self.load_balancing_strategy == "round-robin":
            # Round-robin based on request count (simple implementation)
            healthy_regions.sort(key=lambda r: self.stats[r.id].request_count)
            return healthy_regions[0]
        
        else:  # random
            import random
            return random.choice(healthy_regions)
    
    async def health_check(self, region: RegionConfig) -> bool:
        """
        Perform health check for a region
        """
        start_time = time.time()
        
        try:
            if not region.health_check_url:
                # Default to API health endpoint
                check_url = f"{region.api_url}/health"
            else:
                check_url = region.health_check_url
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(check_url) as resp:
                    is_healthy = resp.status == 200
                    
                    latency_ms = (time.time() - start_time) * 1000
                    region.latency_ms = latency_ms
                    region.last_check = time.time()
                    
                    if is_healthy:
                        region.status = RegionStatus.HEALTHY if latency_ms < 500 else RegionStatus.DEGRADED
                        region.error_count = 0
                        logger.debug(f"Health check OK: {region.id} ({latency_ms:.0f}ms)")
                    else:
                        region.error_count += 1
                        logger.warning(f"Health check FAIL: {region.id} (status: {resp.status})")
                    
                    return is_healthy
        
        except asyncio.TimeoutError:
            region.error_count += 1
            region.latency_ms = 5000  # Timeout penalty
            logger.warning(f"Health check TIMEOUT: {region.id}")
            return False
        
        except Exception as e:
            region.error_count += 1
            logger.error(f"Health check ERROR: {region.id} - {e}")
            return False
    
    async def check_all_regions(self):
        """
        Check health of all regions
        """
        logger.info(f"Checking health of {len(self.regions)} regions")
        
        tasks = [self.health_check(region) for region in self.regions.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Update circuit breakers
        for region_id, region in self.regions.items():
            if region.error_count >= self.circuit_breaker_threshold:
                region.circuit_breaker_open = True
                region.circuit_breaker_until = time.time() + self.circuit_breaker_timeout
                region.status = RegionStatus.UNHEALTHY
                logger.error(f"Circuit breaker opened: {region_id}")
            elif region.circuit_breaker_open and time.time() > region.circuit_breaker_until:
                # Try to close circuit breaker
                region.circuit_breaker_open = False
                region.status = RegionStatus.DEGRADED
                logger.info(f"Circuit breaker closed: {region_id}")
    
    def record_request(self, region_id: str, latency_ms: float, success: bool):
        """
        Record request statistics for a region
        """
        if region_id in self.stats:
            self.stats[region_id].record_request(latency_ms, success)
            
            # Update circuit breaker if error
            if not success:
                region = self.regions.get(region_id)
                if region:
                    region.error_count += 1
    
    def get_region_stats(self) -> Dict[str, dict]:
        """
        Get statistics for all regions
        """
        return {
            region_id: {
                'request_count': stats.request_count,
                'success_rate': stats.success_rate(),
                'avg_latency': stats.avg_latency,
                'last_latency': stats.last_latency,
                'status': self.regions[region_id].status.value,
                'circuit_breaker': self.regions[region_id].circuit_breaker_open,
            }
            for region_id, stats in self.stats.items()
        }
    
    def get_primary_region(self) -> Optional[RegionConfig]:
        """Get primary region"""
        return next((r for r in self.regions.values() if r.primary), None)
    
    def get_all_regions(self) -> List[RegionConfig]:
        """Get all regions sorted by priority"""
        return sorted(self.regions.values(), key=lambda r: r.priority)
    
    def get_healthy_regions(self) -> List[RegionConfig]:
        """Get healthy regions"""
        return [
            r for r in self.regions.values()
            if r.status == RegionStatus.HEALTHY
            and not r.circuit_breaker_open
        ]
    
    async def start_health_checks(self):
        """Start background health checks"""
        if self._health_check_task is None or self._health_check_task.done():
            self._health_check_task = asyncio.create_task(self._health_check_loop())
            logger.info("Started health check loop")
    
    async def stop_health_checks(self):
        """Stop background health checks"""
        if self._health_check_task:
            self._health_check_task.cancel()
            logger.info("Stopped health check loop")
    
    async def _health_check_loop(self):
        """Health check background loop"""
        while True:
            try:
                await self.check_all_regions()
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
            
            await asyncio.sleep(self.health_check_interval)
    
    async def calculate_region_latency(self, ip: Optional[str] = None) -> Dict[str, float]:
        """
        Calculate expected latency to all regions from a given IP
        """
        if ip:
            # Detect user location
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f'http://ip-api.com/json/{ip}') as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            if data.get('status') == 'success':
                                user_lat = data.get('lat', 0)
                                user_lon = data.get('lon', 0)
                                
                                latencies = {}
                                for region_id, region in self.regions.items():
                                    # Rough estimate: 1ms per 100km + base latency
                                    distance = self._calculate_distance(
                                        user_lat, user_lon,
                                        region.latitude, region.longitude
                                    )
                                    estimated_latency = 50 + (distance * 0.01)
                                    latencies[region_id] = round(estimated_latency, 1)
                                
                                return latencies
            except Exception as e:
                logger.error(f"Error calculating latency: {e}")
        
        # Return current measured latencies
        return {
            region_id: region.latency_ms
            for region_id, region in self.regions.items()
        }
    
    def get_dns_records(self) -> Dict[str, str]:
        """
        Get DNS records for multi-region deployment
        Returns suggested DNS A records and CNAMEs
        """
        records = {}
        
        for region_config in self.regions.values():
            records[f"{region_config.code}.api.barberzap.com"] = region_config.api_url.replace('https://', '')
            records[f"{region_config.code}.ws.barberzap.com"] = region_config.ws_url.replace('wss://', '')
        
        # Round-robin or latency-based routing would be handled at the DNS level
        # by services like Cloudflare or AWS Route53
        records["api.barberzap.com"] = "LBR/latency-based-routing" 
        
        return records


# Singleton instance
_region_manager: Optional[RegionManager] = None


def get_region_manager() -> RegionManager:
    """Get singleton RegionManager instance"""
    global _region_manager
    if _region_manager is None:
        _region_manager = RegionManager()
    return _region_manager


# CLI commands
async def cli_health_check():
    """CLI command to check all regions"""
    manager = get_region_manager()
    await manager.check_all_regions()
    
    print("\n=== Region Health Status ===")
    for region in manager.get_all_regions():
        status_color = "✓" if region.status == RegionStatus.HEALTHY else "✗"
        print(f"{status_color} {region.id:15} | {region.status.value:12} | {region.latency_ms:6.0f}ms | {region.error_count} errors")
    
    print("\n=== Request Statistics ===")
    stats = manager.get_region_stats()
    for region_id, stat in stats.items():
        print(f"{region_id:15} | {stat['success_rate']:.1%} success | {stat['avg_latency']:.0f}ms avg")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "health":
        asyncio.run(cli_health_check())
    else:
        print("Usage: python region_manager.py health")
        print("\nDefault regions configured:")
        manager = RegionManager()
        for region in manager.get_all_regions():
            print(f"  - {region.id}: {region.name} ({region.supabase_region})")
