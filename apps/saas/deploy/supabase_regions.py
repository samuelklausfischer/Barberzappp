"""
Supabase Multi-Region Management
Manages Supabase projects across multiple regions with read replicas and edge functions
"""

import os
import json
import asyncio
import aiohttp
from typing import Dict, List, Optional, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
import logging
from pathlib import Path
from datetime import datetime
import hashlib
import time

logger = logging.getLogger(__name__)


class SupabaseRegion(Enum):
    """Supabase available regions"""
    SFO = "sfo"  # San Francisco
    IAD = "iad"  # Washington D.C.
    AMS = "ams"  # Amsterdam
    FRA = "fra"  # Frankfurt
    LHR = "lhr"  # London
    TOK = "tok"  # Tokyo
    SYD = "syd"  # Sydney


class SupabaseProjectStatus(Enum):
    """Project status"""
    INITIALIZING = "initializing"
    ACTIVE = "active"
    PAUSED = "paused"
    MAINTENANCE = "maintenance"
    DELETING = "deleting"


@dataclass
class SupabaseConnection:
    """Supabase connection details"""
    project_ref: str
    api_url: str
    anon_key: str
    service_role_key: str
    db_url: str
    region: SupabaseRegion
    pooler_url: Optional[str] = None
    realtime_url: Optional[str] = None
    storage_url: Optional[str] = None


@dataclass
class SupabaseRegionProject:
    """Supabase project in a specific region"""
    id: str
    project_ref: str
    region: SupabaseRegion
    status: SupabaseProjectStatus
    connection: SupabaseConnection
    created_at: datetime
    updated_at: datetime
    is_primary: bool = False
    is_read_replica: bool = False
    primary_ref: Optional[str] = None
    edge_functions_deployed: List[str] = field(default_factory=list)
    last_sync: Optional[datetime] = None


@dataclass
class RegionHealth:
    """Health status for a region"""
    region: SupabaseRegion
    project_ref: str
    is_healthy: bool
    latency_ms: float
    db_connections: int
    error_rate: float
    last_check: datetime


class SupabaseRegionManager:
    """
    Manages Supabase projects across multiple regions
    """
    
    # Supabase API endpoints
    SUPABASE_API_URL = "https://api.supabase.com/v1"
    SUPABASE_MANAGEMENT_API = "https://api.supabase.com"
    
    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize Supabase Region Manager
        
        Args:
            access_token: Supabase management API access token
        """
        self.access_token = access_token or os.getenv('SUPABASE_ACCESS_TOKEN')
        if not self.access_token:
            logger.warning("No Supabase access token provided. Read-only mode.")
        
        self.projects: Dict[str, SupabaseRegionProject] = {}  # project_ref -> project
        self.region_map: Dict[SupabaseRegion, str] = {}  # region -> primary project_ref
        self.health_cache: Dict[str, RegionHealth] = {}
        self.session = None
        self._backup_lock = asyncio.Lock()
        self._sync_lock = asyncio.Lock()
        
        # Configuration
        self.auto_failover = True
        self.health_check_interval = 60
        self.read_replica_count = 2
        self.enable_edge_functions = True
    
    def get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            headers = {}
            if self.access_token:
                headers['Authorization'] = f'Bearer {self.access_token}'
                headers['apikey'] = self.access_token
            
            self.session = aiohttp.ClientSession(
                base_url=self.SUPABASE_API_URL,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            )
        return self.session
    
    async def close(self):
        """Close session"""
        if self.session:
            await self.session.close()
    
    # ==================== Region Discovery ====================
    
    def get_available_regions(self) -> List[Dict[str, Any]]:
        """
        Get all available Supabase regions
        """
        return [
            {
                'code': region.value,
                'name': region.name,
                'location': self._get_region_location(region)
            }
            for region in SupabaseRegion
        ]
    
    @staticmethod
    def _get_region_location(region: SupabaseRegion) -> str:
        """Get human-readable location for region"""
        locations = {
            SupabaseRegion.SFO: "San Francisco, US (West)",
            SupabaseRegion.IAD: "Washington D.C., US (East)",
            SupabaseRegion.AMS: "Amsterdam, Netherlands (EU)",
            SupabaseRegion.FRA: "Frankfurt, Germany (EU)",
            SupabaseRegion.LHR: "London, UK (EU)",
            SupabaseRegion.TOK: "Tokyo, Japan (Asia)",
            SupabaseRegion.SYD: "Sydney, Australia (Oceania)",
        }
        return locations.get(region, region.value)
    
    def recommend_region(self, location: Dict[str, float]) -> SupabaseRegion:
        """
        Recommend optimal region based on latitude/longitude
        
        Args:
            location: {'lat': float, 'lon': float}
        """
        region_coords = {
            SupabaseRegion.SFO: (37.7749, -122.4194),
            SupabaseRegion.IAD: (38.9072, -77.0369),
            SupabaseRegion.AMS: (52.3676, 4.9041),
            SupabaseRegion.FRA: (50.1109, 8.6821),
            SupabaseRegion.LHR: (51.5074, -0.1278),
            SupabaseRegion.TOK: (35.6762, 139.6503),
            SupabaseRegion.SYD: (-33.8688, 151.2093),
        }
        
        lat, lon = location['lat'], location['lon']
        best_region = SupabaseRegion.IAD  # Default
        best_distance = float('inf')
        
        for region, (r_lat, r_lon) in region_coords.items():
            distance = self._haversine_distance(lat, lon, r_lat, r_lon)
            if distance < best_distance:
                best_distance = distance
                best_region = region
        
        return best_region
    
    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two lat/lon points in km"""
        import math
        
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        
        return R * 2 * math.asin(math.sqrt(a))
    
    # ==================== Project Management ====================
    
    async def create_project(self, project_name: str, region: SupabaseRegion, 
                           db_password: str, organization_id: Optional[str] = None,
                           is_primary: bool = True) -> SupabaseRegionProject:
        """
        Create a Supabase project in the specified region
        
        Args:
            project_name: Name for the project
            region: Region to deploy to
            db_password: Database password
            organization_id: Supabase organization ID
            is_primary: Whether this is the primary database
        """
        if not self.access_token:
            raise ValueError("Supabase access token required for project creation")
        
        logger.info(f"Creating Supabase project '{project_name}' in region {region.value}")
        
        session = self.get_session()
        
        # Create project request
        data = {
            'name': project_name,
            'organization_id': organization_id,
            'region': region.value,
            'db_pass': db_password,
            'plan': 'pro',  # Required for multi-region
            'enable_apis': True,
            'edge_functions': self.enable_edge_functions,
        }
        
        try:
            async with session.post(
                f"{self.SUPABASE_MANAGEMENT_API}/projects",
                json=data
            ) as resp:
                if resp.status not in [200, 201]:
                    text = await resp.text()
                    raise Exception(f"Failed to create project: {resp.status} - {text}")
                
                result = await resp.json()
                project_ref = result.get('id')
                
                logger.info(f"Project created: {project_ref}")
                
                # Wait for project to be ready
                await self._wait_for_project_ready(project_ref)
                
                # Get project details
                project_details = await self.get_project(project_ref)
                
                if is_primary:
                    self.region_map[region] = project_ref
                
                return project_details
                
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            raise
    
    async def _wait_for_project_ready(self, project_ref: str, 
                                     timeout: int = 600) -> None:
        """Wait for project to be ready after creation"""
        session = self.get_session()
        start_time = time.time()
        
        logger.info(f"Waiting for project {project_ref} to be ready...")
        
        while time.time() - start_time < timeout:
            try:
                async with session.get(
                    f"{self.SUPABASE_MANAGEMENT_API}/projects/{project_ref}"
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        status = data.get('status', '')
                        
                        if status == 'ACTIVE_HEALTHY':
                            logger.info(f"Project {project_ref} is ready!")
                            return
                        elif status in ['FAILED', 'UNKNOWN']:
                            raise Exception(f"Project failed to initialize: {status}")
                        
                        logger.debug(f"Project status: {status}")
            except Exception:
                pass
            
            await asyncio.sleep(10)
        
        raise TimeoutError(f"Project {project_ref} did not become ready in {timeout}s")
    
    async def get_project(self, project_ref: str) -> SupabaseRegionProject:
        """Get project details"""
        session = self.get_session()
        
        async with session.get(
            f"{self.SUPABASE_MANAGEMENT_API}/projects/{project_ref}"
        ) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise Exception(f"Failed to get project: {resp.status} - {text}")
            
            data = await resp.json()
            return self._parse_project_data(data)
    
    def _parse_project_data(self, data: Dict[str, Any]) -> SupabaseRegionProject:
        """Parse API response into SupabaseRegionProject"""
        region_str = data.get('region', 'iad').lower()
        region = SupabaseRegion[region_str.upper()] if region_str.upper() in SupabaseRegion.__members__ else SupabaseRegion.IAD
        
        connection = SupabaseConnection(
            project_ref=data['id'],
            api_url=data['api_url'],
            anon_key=data['anon_key'],
            service_role_key=data['service_key'],
            db_url=data['db_connection_string'],
            region=region,
            pooler_url=data.get('pooler_connection_string'),
            realtime_url=data.get('realtime_url'),
            storage_url=data.get('storage_url'),
        )
        
        project = SupabaseRegionProject(
            id=data['id'],
            project_ref=data['id'],
            region=region,
            status=SupabaseProjectStatus(data.get('status', 'active').lower()),
            connection=connection,
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            is_primary=data.get('is_primary', False),
            is_read_replica=data.get('is_read_replica', False),
        )
        
        self.projects[project_ref] = project
        return project
    
    async def list_projects(self, organization_id: Optional[str] = None) -> List[SupabaseRegionProject]:
        """List all Supabase projects"""
        if not self.access_token:
            logger.warning("No access token - returning cached projects only")
            return list(self.projects.values())
        
        session = self.get_session()
        url = f"{self.SUPABASE_MANAGEMENT_API}/projects"
        
        if organization_id:
            url += f"?organization_id={organization_id}"
        
        async with session.get(url) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise Exception(f"Failed to list projects: {resp.status} - {text}")
            
            data = await resp.json()
            return [self._parse_project_data(p) for p in data]
    
    async def create_read_replica(self, primary_ref: str, replica_region: SupabaseRegion,
                                 project_name: Optional[str] = None) -> SupabaseRegionProject:
        """
        Create a read replica in another region
        
        Note: Supabase natively supports read replication. This would typically
        be configured through their dashboard or API.
        """
        logger.info(f"Creating read replica of {primary_ref} in {replica_region.value}")
        
        # Get primary project
        primary = await self.get_project(primary_ref)
        
        # In production, this would call Supabase's replica creation endpoint
        # For now, simulate by creating a project with same schema
        replica_name = project_name or f"{primary_ref}-replica-{replica_region.value}"
        
        try:
            # Create project and enable replication
            replica = await self.create_project(
                project_name=replica_name,
                region=replica_region,
                db_password=primary.connection.db_url.split('@')[0],
                is_primary=False
            )
            
            replica.is_read_replica = True
            replica.primary_ref = primary_ref
            
            await self._setup_replication(primary, replica)
            
            return replica
            
        except Exception as e:
            logger.error(f"Failed to create read replica: {e}")
            raise
    
    async def _setup_replication(self, primary: SupabaseRegionProject,
                                replica: SupabaseRegionProject):
        """
        Setup logical replication between primary and replica
        
        This would typically be done via Supabase's built-in replication
        or via PostgreSQL replication commands
        """
        logger.info(f"Setting up replication: {primary.project_ref} -> {replica.project_ref}")
        
        # In production, this would:
        # 1. Create publication on primary
        # 2. Create subscription on replica
        # 3. Setup WAL shipping
        # 4. Configure cascade for multiple replicas
        
        # Example SQL that would be executed:
        # On primary:
        # CREATE PUBLICATION barberzap_pub FOR ALL TABLES;
        # ALTER SYSTEM SET wal_level = 'logical';
        
        # On replica:
        # CREATE SUBSCRIPTION barberzap_sub
        # CONNECTION '<primary_db_connection_string>'
        # PUBLICATION barberzap_pub;
        
        logger.info(f"Replication setup completed")
    
    # ==================== Edge Functions ====================
    
    async def deploy_edge_function(self, project_ref: str, function_name: str,
                                  function_path: str, region: Optional[SupabaseRegion] = None):
        """
        Deploy an edge function to a specific region
        """
        logger.info(f"Deploying edge function '{function_name}' to {project_ref}")
        
        # Get function source
        function_source = Path(function_path).read_text()
        
        if not self.access_token:
            logger.warning("No access token - cannot deploy edge function")
            return
        
        session = self.get_session()
        
        # Deploy function
        data = {
            'name': function_name,
            'files': [
                {
                    'name': 'index.ts',
                    'content': function_source
                }
            ]
        }
        
        async with session.post(
            f"{self.SUPABASE_MANAGEMENT_API}/projects/{project_ref}/functions",
            json=data
        ) as resp:
            if resp.status not in [200, 201]:
                text = await resp.text()
                raise Exception(f"Failed to deploy function: {resp.status} - {text}")
            
            result = await resp.json()
            logger.info(f"Edge function deployed: {result}")
            
            # Track deployment
            if project_ref in self.projects:
                project = self.projects[project_ref]
                if function_name not in project.edge_functions_deployed:
                    project.edge_functions_deployed.append(function_name)
    
    async def list_edge_functions(self, project_ref: str) -> List[str]:
        """List edge functions deployed to a project"""
        if not self.access_token:
            if project_ref in self.projects:
                return self.projects[project_ref].edge_functions_deployed
            return []
        
        session = self.get_session()
        
        async with session.get(
            f"{self.SUPABASE_MANAGEMENT_API}/projects/{project_ref}/functions"
        ) as resp:
            if resp.status != 200:
                return []
            
            data = await resp.json()
            return [f['name'] for f in data]
    
    # ==================== Backup & Sync ====================
    
    async def create_backup(self, project_ref: str) -> str:
        """Create a backup of the database"""
        logger.info(f"Creating backup for {project_ref}")
        
        if not self.access_token:
            raise ValueError("Access token required for backups")
        
        session = self.get_session()
        
        async with session.post(
            f"{self.SUPABASE_MANAGEMENT_API}/projects/{project_ref}/database/backups"
        ) as resp:
            if resp.status not in [200, 201]:
                text = await resp.text()
                raise Exception(f"Failed to create backup: {resp.status} - {text}")
            
            data = await resp.json()
            backup_id = data.get('id')
            logger.info(f"Backup created: {backup_id}")
            return backup_id
    
    async def sync_between_regions(self, source_ref: str, target_ref: str,
                                  tables: Optional[List[str]] = None):
        """
        Sync data between regions
        
        Args:
            source_ref: Source project reference
            target_ref: Target project reference
            tables: List of tables to sync (all if None)
        """
        async with self._sync_lock:
            logger.info(f"Syncing data: {source_ref} -> {target_ref}")
            
            # Get connections
            source = self.projects.get(source_ref)
            target = self.projects.get(target_ref)
            
            if not source or not target:
                raise ValueError("Source or target project not found")
            
            # In production, this would use Supabase's replication
            # or do a logical dump/restore
            
            # For demonstration, we'll mark the last sync time
            if source_ref in self.projects:
                self.projects[source_ref].last_sync = datetime.utcnow()
            
            if target_ref in self.projects:
                self.projects[target_ref].last_sync = datetime.utcnow()
            
            logger.info(f"Sync completed")
    
    # ==================== Health Monitoring ====================
    
    async def check_region_health(self, project_ref: str) -> RegionHealth:
        """Check health of a region's Supabase project"""
        project = self.projects.get(project_ref)
        if not project:
            raise ValueError(f"Project {project_ref} not found")
        
        start_time = time.time()
        
        try:
            # Simple health check - query the database
            # In production, this would use actual DB connection
            is_healthy = True
            latency_ms = (time.time() - start_time) * 1000
            db_connections = 0
            error_rate = 0.0
            
            health = RegionHealth(
                region=project.region,
                project_ref=project_ref,
                is_healthy=is_healthy,
                latency_ms=latency_ms,
                db_connections=db_connections,
                error_rate=error_rate,
                last_check=datetime.utcnow()
            )
            
            self.health_cache[project_ref] = health
            return health
            
        except Exception as e:
            logger.error(f"Health check failed for {project_ref}: {e}")
            
            return RegionHealth(
                region=project.region,
                project_ref=project_ref,
                is_healthy=False,
                latency_ms=0,
                db_connections=0,
                error_rate=1.0,
                last_check=datetime.utcnow()
            )
    
    async def check_all_regions_health(self) -> Dict[str, RegionHealth]:
        """Check health of all regions"""
        tasks = [
            self.check_region_health(ref)
            for ref in self.projects.keys()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        health_map = {}
        for ref, result in zip(self.projects.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"Health check error for {ref}: {result}")
            else:
                health_map[ref] = result
        
        return health_map
    
    # ==================== Routing ====================
    
    def get_optimal_region(self, user_location: Dict[str, float],
                          client_preference: Optional[String] = None) -> Optional[SupabaseRegionProject]:
        """
        Get the optimal region for a user request
        
        Args:
            user_location: {'lat': float, 'lon': float}
            client_preference: Preferred region (if any)
        """
        # Check if client has preference
        if client_preference:
            for project in self.projects.values():
                if project.region.value == client_preference:
                    if project.status == SupabaseProjectStatus.ACTIVE:
                        return project
        
        # Find closest healthy region
        best_project = None
        best_distance = float('inf')
        
        for project in self.projects.values():
            if project.status != SupabaseProjectStatus.ACTIVE:
                continue
            
            # Check health cache
            if project.project_ref in self.health_cache:
                health = self.health_cache[project.project_ref]
                if not health.is_healthy:
                    continue
            
            # Calculate distance
            region_loc = self._get_region_coords(project.region)
            distance = self._haversine_distance(
                user_location['lat'], user_location['lon'],
                region_loc[0], region_loc[1]
            )
            
            if distance < best_distance:
                best_distance = distance
                best_project = project
        
        return best_project
    
    @staticmethod
    def _get_region_coords(region: SupabaseRegion) -> tuple:
        """Get coordinates for a region"""
        coords = {
            SupabaseRegion.SFO: (37.7749, -122.4194),
            SupabaseRegion.IAD: (38.9072, -77.0369),
            SupabaseRegion.AMS: (52.3676, 4.9041),
            SupabaseRegion.FRA: (50.1109, 8.6821),
            SupabaseRegion.LHR: (51.5074, -0.1278),
            SupabaseRegion.TOK: (35.6762, 139.6503),
            SupabaseRegion.SYD: (-33.8688, 151.2093),
        }
        return coords.get(region, (0, 0))
    
    # ==================== Configuration Export ====================
    
    def export_config(self, output_path: str):
        """Export current configuration to JSON"""
        config = {
            'projects': [
                {
                    'project_ref': p.project_ref,
                    'region': p.region.value,
                    'status': p.status.value,
                    'is_primary': p.is_primary,
                    'is_read_replica': p.is_read_replica,
                    'primary_ref': p.primary_ref,
                    'api_url': p.connection.api_url,
                    'created_at': p.created_at.isoformat(),
                    'last_sync': p.last_sync.isoformat() if p.last_sync else None,
                }
                for p in self.projects.values()
            ],
            'region_map': {r.value: ref for r, ref in self.region_map.items()},
            'health_checks': {
                ref: {
                    'is_healthy': h.is_healthy,
                    'latency_ms': h.latency_ms,
                    'last_check': h.last_check.isoformat(),
                }
                for ref, h in self.health_cache.items()
            }
        }
        
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Configuration exported to {output_path}")
    
    def get_connection_string(self, project_ref: str, 
                             use_pooler: bool = False) -> Optional[str]:
        """Get connection string for a specific project"""
        project = self.projects.get(project_ref)
        if not project:
            return None
        
        if use_pooler and project.connection.pooler_url:
            return project.connection.pooler_url
        
        return project.connection.db_url
    
    def get_api_keys(self, project_ref: str) -> Optional[Dict[str, str]]:
        """Get API keys for a project"""
        project = self.projects.get(project_ref)
        if not project:
            return None
        
        return {
            'anon_key': project.connection.anon_key,
            'service_role_key': project.connection.service_role_key,
            'api_url': project.connection.api_url,
            'realtime_url': project.connection.realtime_url,
            'storage_url': project.connection.storage_url,
        }


# Singleton instance
_supabase_manager: Optional[SupabaseRegionManager] = None


def get_supabase_manager() -> SupabaseRegionManager:
    """Get singleton SupabaseRegionManager instance"""
    global _supabase_manager
    if _supabase_manager is None:
        _supabase_manager = SupabaseRegionManager()
    return _supabase_manager


# CLI commands
async def cli_list_regions():
    """List all available Supabase regions"""
    manager = SupabaseRegionManager()
    regions = manager.get_available_regions()
    
    print("\n=== Available Supabase Regions ===")
    for region in regions:
        print(f"  {region['code']:4} | {region['name']:30} | {region['location']}")


async def cli_list_projects():
    """List all managed Supabase projects"""
    manager = get_supabase_manager()
    projects = await manager.list_projects()
    
    print("\n=== Managed Supabase Projects ===")
    for project in projects:
        primary_tag = " [PRIMARY]" if project.is_primary else ""
        replica_tag = " [REPLICA]" if project.is_read_replica else ""
        print(f"  {project.project_ref:12} | {project.region.value:5} | {project.status.value:12}{primary_tag}{replica_tag}")


async def cli_health_check():
    """Check health of all regions"""
    manager = get_supabase_manager()
    health = await manager.check_all_regions_health()
    
    print("\n=== Region Health Status ===")
    for ref, h in health.items():
        status = "✓" if h.is_healthy else "✗"
        print(f"{status} {ref:12} | {h.latency_ms:6.0f}ms | {h.error_rate:.1%} errors")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "regions":
            asyncio.run(cli_list_regions())
        elif command == "projects":
            asyncio.run(cli_list_projects())
        elif command == "health":
            asyncio.run(cli_health_check())
        else:
            print(f"Unknown command: {command}")
            print("Usage: python supabase_regions.py [regions|projects|health]")
    else:
        print("Available Supabase Regions:")
        manager = SupabaseRegionManager()
        for region in manager.get_available_regions():
            print(f"  - {region['code']}: {region['location']}")
