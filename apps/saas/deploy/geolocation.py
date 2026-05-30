"""
Geolocation Utilities for BarberZap Multi-Region Deployment
Provides IP geolocation, distance calculation, and region mapping
"""

import asyncio
import aiohttp
import logging
import os
import socket
import ipaddress
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import json
from pathlib import Path
import hashlib

logger = logging.getLogger(__name__)


class Continent(Enum):
    """Continents"""
    AFRICA = "Africa"
    ASIA = "Asia"
    EUROPE = "Europe"
    NORTH_AMERICA = "North America"
    SOUTH_AMERICA = "South America"
    OCEANIA = "Oceania"
    ANTARCTICA = "Antarctica"


@dataclass
class GeoLocation:
    """Geographic location information"""
    ip: str
    country: str
    country_code: str
    city: Optional[str] = None
    region: Optional[str] = None
    latitude: float = 0.0
    longitude: float = 0.0
    timezone: Optional[str] = None
    isp: Optional[str] = None
    org: Optional[str] = None
    asn: Optional[int] = None
    continent: Optional[Continent] = None
    
    # Metadata
    source: str = "unknown"
    cached: bool = False
    cached_at: Optional[datetime] = None


@dataclass
class RegionInfo:
    """Information about a server region"""
    id: str
    name: str
    continent: Continent
    latitude: float
    longitude: float
    datacenters: List[str] = field(default_factory=list)
    timezone: str = "UTC"


class GeoIPService(Enum):
    """Available GeoIP services"""
    IP_API = "ip-api.com"
    IPAPI_CO = "ipapi.co"
    IPINFO = "ipinfo.io"
    MAXMIND = "maxmind"
    CLOUDFLARE = "cloudflare"


# Region locations
REGIONS = {
    'latam': RegionInfo(
        id='latam',
        name='Latin America',
        continent=Continent.SOUTH_AMERICA,
        latitude=-14.2350,
        longitude=-51.9253,
        datacenters=['us-east-1', 'sa-east-1'],
        timezone='America/Sao_Paulo'
    ),
    'us-east': RegionInfo(
        id='us-east',
        name='US East',
        continent=Continent.NORTH_AMERICA,
        latitude=38.9072,
        longitude=-77.0369,
        datacenters=['us-east-1'],
        timezone='America/New_York'
    ),
    'us-west': RegionInfo(
        id='us-west',
        name='US West',
        continent=Continent.NORTH_AMERICA,
        latitude=37.7749,
        longitude=-122.4194,
        datacenters=['us-west-2'],
        timezone='America/Los_Angeles'
    ),
    'eu-central': RegionInfo(
        id='eu-central',
        name='Europe Central',
        continent=Continent.EUROPE,
        latitude=50.1109,
        longitude=8.6821,
        datacenters=['eu-central-1', 'eu-west-1'],
        timezone='Europe/Berlin'
    ),
    'asia-pacific': RegionInfo(
        id='asia-pacific',
        name='Asia Pacific',
        continent=Continent.ASIA,
        latitude=35.6762,
        longitude=139.6503,
        datacenters=['ap-northeast-1', 'ap-southeast-1'],
        timezone='Asia/Tokyo'
    ),
}

# Supabase region mappings
SUPABASE_REGIONS = {
    'latam': 'iad',       # IAD closest to LATAM
    'us-east': 'iad',
    'us-west': 'sfo',
    'eu-central': 'fra',
    'asia-pacific': 'tok',
}

# Country code to region mapping
COUNTRY_REGION_MAP = {
    # South America
    'BR': 'latam', 'AR': 'latam', 'CL': 'latam', 'CO': 'latam',
    'PE': 'latam', 'EC': 'latam', 'BO': 'latam', 'PY': 'latam',
    'UY': 'latam', 'VE': 'latam', 'GY': 'latam', 'SR': 'latam',
    'GF': 'latam', 'FK': 'latam',
    # North America
    'US': 'us-east', 'CA': 'us-east', 'MX': 'latam', 'CU': 'latam',
    # Europe
    'GB': 'eu-central', 'IE': 'eu-central', 'DE': 'eu-central',
    'FR': 'eu-central', 'ES': 'eu-central', 'IT': 'eu-central',
    'NL': 'eu-central', 'BE': 'eu-central', 'AT': 'eu-central',
    'CH': 'eu-central', 'PT': 'eu-central', 'PL': 'eu-central',
    'CZ': 'eu-central', 'HU': 'eu-central', 'SE': 'eu-central',
    'NO': 'eu-central', 'DK': 'eu-central', 'FI': 'eu-central',
    'UA': 'eu-central', 'RO': 'eu-central', 'GR': 'eu-central',
    # Asia
    'JP': 'asia-pacific', 'KR': 'asia-pacific', 'CN': 'asia-pacific',
    'HK': 'asia-pacific', 'TW': 'asia-pacific', 'SG': 'asia-pacific',
    'MY': 'asia-pacific', 'TH': 'asia-pacific', 'VN': 'asia-pacific',
    'ID': 'asia-pacific', 'PH': 'asia-pacific', 'IN': 'asia-pacific',
    # Oceania
    'AU': 'asia-pacific', 'NZ': 'asia-pacific', 'FJ': 'asia-pacific',
    # Africa
    'ZA': 'eu-central', 'EG': 'eu-central', 'NG': 'eu-central',
    'KE': 'eu-central', 'MA': 'eu-central',
}


class GeoLocationProvider:
    """
    Geolocation provider using multiple services for reliability
    """
    
    def __init__(self, cache_ttl: int = 3600, maxmind_db_path: Optional[str] = None):
        """
        Initialize GeoLocation provider
        
        Args:
            cache_ttl: Cache time-to-live in seconds
            maxmind_db_path: Path to MaxMind GeoIP2 database (optional)
        """
        self.cache_ttl = cache_ttl
        self.cache: Dict[str, Tuple[GeoLocation, datetime]] = {}
        self.maxmind_db_path = maxmind_db_path
        
        # Service configuration
        self.services = [
            GeoIPService.IPAPI_CO,
            GeoIPService.IP_API,
            GeoIPService.IPINFO,
        ]
        
        # Initialize MaxMind if available
        self._maxmind_reader = None
        if maxmind_db_path and Path(maxmind_db_path).exists():
            try:
                import geoip2.database
                self._maxmind_reader = geoip2.database.Reader(maxmind_db_path)
                logger.info("MaxMind GeoIP2 database loaded")
            except ImportError:
                logger.warning("geoip2 not installed, MaxMind disabled")
    
    def _get_cache_key(self, ip: str) -> str:
        """Generate cache key for IP"""
        return hashlib.md5(ip.encode()).hexdigest()
    
    def _is_cache_valid(self, cached_at: datetime) -> bool:
        """Check if cache entry is still valid"""
        return datetime.utcnow() - cached_at < timedelta(seconds=self.cache_ttl)
    
    def get_from_cache(self, ip: str) -> Optional[GeoLocation]:
        """Get location from cache"""
        key = self._get_cache_key(ip)
        if key in self.cache:
            geo_loc, cached_at = self.cache[key]
            if self._is_cache_valid(cached_at):
                geo_loc.cached = True
                geo_loc.cached_at = cached_at
                return geo_loc
            else:
                # Remove expired cache entry
                del self.cache[key]
        return None
    
    def put_in_cache(self, ip: str, location: GeoLocation):
        """Store location in cache"""
        key = self._get_cache_key(ip)
        self.cache[key] = (location, datetime.utcnow())
    
    async def query_ipapi_co(self, session: aiohttp.ClientSession, ip: str) -> Optional[GeoLocation]:
        """Query ipapi.co"""
        try:
            async with session.get(f'https://ipapi.co/{ip}/json/', timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if 'error' not in data:
                        return GeoLocation(
                            ip=ip,
                            country=data.get('country_name', ''),
                            country_code=data.get('country_code', ''),
                            city=data.get('city'),
                            region=data.get('region'),
                            latitude=float(data.get('latitude', 0)),
                            longitude=float(data.get('longitude', 0)),
                            timezone=data.get('timezone'),
                            isp=data.get('org'),
                            source=GeoIPService.IPAPI_CO.value
                        )
        except Exception as e:
            logger.debug(f"ipapi.co failed: {e}")
        return None
    
    async def query_ip_api(self, session: aiohttp.ClientSession, ip: str) -> Optional[GeoLocation]:
        """Query ip-api.com"""
        try:
            async with session.get(f'http://ip-api.com/json/{ip}', timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('status') == 'success':
                        continent = self._get_continent_from_country(data.get('countryCode', ''))
                        return GeoLocation(
                            ip=ip,
                            country=data.get('country', ''),
                            country_code=data.get('countryCode', ''),
                            city=data.get('city'),
                            region=data.get('regionName'),
                            latitude=float(data.get('lat', 0)),
                            longitude=float(data.get('lon', 0)),
                            timezone=data.get('timezone'),
                            isp=data.get('isp'),
                            org=data.get('org'),
                            asn=data.get('as', '').split(' ')[0] if data.get('as') else None,
                            continent=continent,
                            source=GeoIPService.IP_API.value
                        )
        except Exception as e:
            logger.debug(f"ip-api.com failed: {e}")
        return None
    
    async def query_ipinfo(self, session: aiohttp.ClientSession, ip: str) -> Optional[GeoLocation]:
        """Query ipinfo.io"""
        try:
            token = os.getenv('IPINFO_TOKEN')  # Optional token for higher limits
            headers = {'Authorization': f'Bearer {token}'} if token else {}
            
            async with session.get(f'https://ipinfo.io/{ip}/json', headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    lat, lon = self._parse_lat_lon(data.get('loc', ''))
                    continent = self._get_continent_from_country(data.get('country', ''))
                    
                    return GeoLocation(
                        ip=ip,
                        country=data.get('country', ''),
                        country_code=data.get('country', ''),
                        city=data.get('city'),
                        region=data.get('region'),
                        latitude=lat,
                        longitude=lon,
                        timezone=data.get('timezone'),
                        org=data.get('org'),
                        continent=continent,
                        source=GeoIPService.IPINFO.value
                    )
        except Exception as e:
            logger.debug(f"ipinfo.io failed: {e}")
        return None
    
    def query_maxmind(self, ip: str) -> Optional[GeoLocation]:
        """Query MaxMind GeoIP2 database"""
        if not self._maxmind_reader:
            return None
        
        try:
            response = self._maxmind_reader.city(ip)
            return GeoLocation(
                ip=ip,
                country=response.country.name or '',
                country_code=response.country.iso_code or '',
                city=response.city.name,
                region=response.subdivisions.most_specific.name if response.subdivisions else None,
                latitude=response.location.latitude or 0.0,
                longitude=response.location.longitude or 0.0,
                timezone=response.location.time_zone,
                continent=self._get_continent_code(response.continent.code) if response.continent else None,
                source=GeoIPService.MAXMIND.value
            )
        except Exception as e:
            logger.debug(f"MaxMind query failed: {e}")
        return None
    
    @staticmethod
    def _parse_lat_lon(loc_str: str) -> Tuple[float, float]:
        """Parse "lat,lon" string"""
        try:
            lat, lon = loc_str.split(',')
            return float(lat), float(lon)
        except (ValueError, AttributeError):
            return 0.0, 0.0
    
    @staticmethod
    def _get_continent_from_country(country_code: str) -> Optional[Continent]:
        """Get continent from country code"""
        # Simplified mapping
        eu_countries = {'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'PL', 'PT'}
        asia_countries = {'JP', 'KR', 'CN', 'HK', 'TW', 'SG', 'MY', 'TH', 'VN', 'ID', 'PH', 'IN'}
        oceania_countries = {'AU', 'NZ', 'FJ'}
        africa_countries = {'ZA', 'EG', 'NG', 'KE', 'MA'}
        na_countries = {'US', 'CA', 'MX'}
        sa_countries = {'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY'}
        
        cc = country_code.upper()
        if cc in sa_countries:
            return Continent.SOUTH_AMERICA
        elif cc in na_countries:
            return Continent.NORTH_AMERICA
        elif cc in eu_countries:
            return Continent.EUROPE
        elif cc in asia_countries:
            return Continent.ASIA
        elif cc in oceania_countries:
            return Continent.OCEANIA
        elif cc in africa_countries:
            return Continent.AFRICA
        return None
    
    @staticmethod
    def _get_continent_code(code: str) -> Optional[Continent]:
        """Map continent code to enum"""
        codes = {
            'NA': Continent.NORTH_AMERICA,
            'SA': Continent.SOUTH_AMERICA,
            'EU': Continent.EUROPE,
            'AS': Continent.ASIA,
            'OC': Continent.OCEANIA,
            'AF': Continent.AFRICA,
            'AN': Continent.ANTARCTICA,
        }
        return codes.get(code.upper())
    
    async def get_location(self, ip: str) -> GeoLocation:
        """
        Get geolocation for an IP address
        
        Args:
            ip: IP address to lookup
            
        Returns:
            GeoLocation object
        """
        # Check cache
        cached = self.get_from_cache(ip)
        if cached:
            return cached
        
        # Try MaxMind first (fastest, no network)
        if self._maxmind_reader:
            location = self.query_maxmind(ip)
            if location:
                self.put_in_cache(ip, location)
                return location
        
        # Try online services
        async with aiohttp.ClientSession() as session:
            # Try each service in order
            for service in self.services:
                location = None
                
                if service == GeoIPService.IPAPI_CO:
                    location = await self.query_ipapi_co(session, ip)
                elif service == GeoIPService.IP_API:
                    location = await self.query_ip_api(session, ip)
                elif service == GeoIPService.IPINFO:
                    location = await self.query_ipinfo(session, ip)
                
                if location and location.country_code:
                    self.put_in_cache(ip, location)
                    return location
        
        # Fallback: return empty location
        return GeoLocation(
            ip=ip,
            country='Unknown',
            country_code='XX',
            source='fallback'
        )
    
    async def get_client_location(self, request_headers: Dict[str, str]) -> GeoLocation:
        """
        Get client IP and location from request headers
        
        Args:
            request_headers: Dictionary of HTTP headers
            
        Returns:
            GeoLocation for the client
        """
        # Extract IP from various headers
        ip = None
        
        # Check common headers
        for header in [
            'CF-Connecting-IP',      # Cloudflare
            'X-Forwarded-For',       # Standard proxy
            'X-Real-IP',             # Nginx
            'Forwarded',             # Standard
        ]:
            value = request_headers.get(header, '').strip()
            if value:
                # X-Forwarded-For can have multiple IPs, take the first one
                if ',' in value:
                    value = value.split(',')[0].strip()
                
                # Validate IP
                try:
                    ipaddress.ip_address(value)
                    ip = value
                    break
                except ValueError:
                    continue
        
        # Fallback to remote address (not available in headers)
        if ip is None:
            logger.warning("Could not determine client IP from headers")
            ip = "127.0.0.1"
        
        return await self.get_location(ip)
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates in km using Haversine formula
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
    
    def find_nearest_region(self, location: GeoLocation, 
                          regions: Optional[Dict[str, RegionInfo]] = None) -> str:
        """Find nearest region to a location"""
        if location.latitude == 0 and location.longitude == 0:
            # Fall back to country mapping
            return COUNTRY_REGION_MAP.get(location.country_code.upper(), 'latam')
        
        regions_map = regions or REGIONS
        
        nearest_region = 'latam'
        min_distance = float('inf')
        
        for region_id, region in regions_map.items():
            distance = self.calculate_distance(
                location.latitude, location.longitude,
                region.latitude, region.longitude
            )
            
            if distance < min_distance:
                min_distance = distance
                nearest_region = region_id
        
        return nearest_region
    
    def estimate_latency(self, location: GeoLocation, region_id: str) -> float:
        """
        Estimate latency to a region in ms
        
        Approximation: 1ms per 100km + base latency
        """
        region = REGIONS.get(region_id)
        if not region:
            return 200.0
        
        distance = self.calculate_distance(
            location.latitude, location.longitude,
            region.latitude, region.longitude
        )
        
        # Base latency (network hops)
        base_latency = 50.0
        
        # Distance component
        distance_latency = distance * 0.01  # 1ms per 100km
        
        # Continental crossing penalty
        if location.continent and location.continent != region.continent:
            distance_latency += 50.0
        
        return base_latency + distance_latency
    
    def recommend_region(self, location: GeoLocation,
                        latency_threshold: float = 200.0) -> Tuple[str, float]:
        """
        Recommend best region based on estimated latency
        
        Returns:
            Tuple of (region_id, estimated_latency_ms)
        """
        latencies = {}
        
        for region_id in REGIONS:
            latency = self.estimate_latency(location, region_id)
            latencies[region_id] = latency
        
        # Find best region
        best_region = min(latencies, key=latencies.get)
        best_latency = latencies[best_region]
        
        return best_region, best_latency
    
    def get_supabase_region(self, location: GeoLocation) -> str:
        """Map location to Supabase region code"""
        region_id = self.find_nearest_region(location)
        return SUPABASE_REGIONS.get(region_id, 'iad')


# ==================== Utility Functions ====================

def is_private_ip(ip: str) -> bool:
    """Check if IP is private/internal"""
    try:
        addr = ipaddress.ip_address(ip)
        return addr.is_private or addr.is_loopback or addr.is_link_local
    except ValueError:
        return False


def get_local_ip() -> Optional[str]:
    """Get local IP address"""
    try:
        # Connect to a public DNS server to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(0)
            s.connect(('8.8.8.8', 80))
            return s.getsockname()[0]
    except Exception:
        return None


def normalize_ip(ip: str) -> str:
    """Normalize IP address (remove port, handle IPv6)"""
    # Remove port if present
    if ':' in ip and not ip.startswith('['):
        parts = ip.rsplit(':', 1)
        if parts[1].isdigit():
            ip = parts[0]
    
    # Normalize IPv6
    try:
        addr = ipaddress.ip_address(ip)
        return str(addr)
    except ValueError:
        return ip


# ==================== CLI ====================

async def lookup_ip(ip: str):
    """CLI command to lookup an IP address"""
    provider = GeoLocationProvider()
    location = await provider.get_location(ip)
    
    print("\n" + "=" * 60)
    print("IP Geolocation Lookup")
    print("=" * 60)
    print(f"IP:           {location.ip}")
    print(f"Country:      {location.country} ({location.country_code})")
    print(f"City:         {location.city}")
    print(f"Region:       {location.region}")
    print(f"Coordinates:  ({location.latitude}, {location.longitude})")
    print(f"Timezone:     {location.timezone}")
    print(f"ISP:          {location.isp}")
    print(f"ASN:          {location.asn}")
    print(f"Continent:    {location.continent.value if location.continent else 'Unknown'}")
    print(f"Source:       {location.source}")
    print("=" * 60)
    
    # Recommend region
    recommended_region, estimated_latency = provider.recommend_region(location)
    region_info = REGIONS[recommended_region]
    
    print(f"\nRecommended Region: {region_info.name} ({recommended_region})")
    print(f"Estimated Latency: {estimated_latency:.0f}ms")
    print(f"Supabase Region: {provider.get_supabase_region(location)}")
    print("=" * 60 + "\n")


async def lookup_regions():
    """CLI command to list all available regions"""
    print("\n" + "=" * 60)
    print("Available Regions")
    print("=" * 60)
    print(f"{'ID':<15} {'Name':<20} {'Continent':<15} {'Timezone':<20}")
    print("-" * 60)
    
    for region_id, region in REGIONS.items():
        print(
            f"{region_id:<15} "
            f"{region.name:<20} "
            f"{region.continent.value:<15} "
            f"{region.timezone:<20}"
        )
    
    print("=" * 60 + "\n")


async def distance_between_regions(region1: str, region2: str):
    """CLI command to calculate distance between regions"""
    provider = GeoLocationProvider()
    
    r1 = REGIONS.get(region1)
    r2 = REGIONS.get(region2)
    
    if not r1 or not r2:
        print(f"Error: Invalid region(s). Available: {', '.join(REGIONS.keys())}")
        return
    
    distance = provider.calculate_distance(
        r1.latitude, r1.longitude,
        r2.latitude, r2.longitude
    )
    
    print(f"\nDistance between {r1.name} and {r2.name}: {distance:.0f} km\n")


if __name__ == "__main__":
    import os
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python geolocation.py <command> [args]")
        print("\nCommands:")
        print("  lookup <ip>           Lookup IP geolocation")
        print("  regions               List all regions")
        print("  distance <r1> <r2>    Calculate distance between regions")
        print("\nExamples:")
        print("  python geolocation.py lookup 8.8.8.8")
        print("  python geolocation.py regions")
        print("  python geolocation.py distance latam us-east")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "lookup":
        if len(sys.argv) < 3:
            print("Error: IP address required")
            sys.exit(1)
        asyncio.run(lookup_ip(sys.argv[2]))
    elif command == "regions":
        asyncio.run(lookup_regions())
    elif command == "distance":
        if len(sys.argv) < 4:
            print("Error: Two region IDs required")
            sys.exit(1)
        asyncio.run(distance_between_regions(sys.argv[2], sys.argv[3]))
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
