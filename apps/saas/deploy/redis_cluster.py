"""
Redis Cluster Setup for BarberZap Multi-Region Deployment
Implements Redis cluster with sharding, Sentinel for HA, and cross-region replication
"""

import asyncio
import json
import socket
import logging
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import random

try:
    import redis.asyncio as redis
    from redis.sentinel import Sentinel
    from redis.cluster import RedisCluster
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)


class RedisRole(Enum):
    """Redis node role"""
    MASTER = "master"
    REPLICA = "replica"
    SENTINEL = "sentinel"


class NodeStatus(Enum):
    """Node health status"""
    HEALTHY = "healthy"
    UNREACHABLE = "unreachable"
    FAILING = "failing"
    SYNCING = "syncing"


@dataclass
class RedisNode:
    """Redis cluster node"""
    id: str
    host: str
    port: int
    role: RedisRole
    region: str
    status: NodeStatus = NodeStatus.HEALTHY
    priority: int = 100
    last_check: datetime = field(default_factory=datetime.utcnow)
    latency_ms: float = 0.0
    error_count: int = 0
    connections: int = 0
    memory_used: int = 0
    memory_max: int = 0
    key_count: int = 0


@dataclass
class ShardConfig:
    """Shard configuration for Redis cluster"""
    slot_ranges: List[Tuple[int, int]]  # e.g., [(0, 5460), (5461, 10922), (10923, 16383)]
    master_node: str  # Redis node ID
    replica_nodes: List[str] = field(default_factory=list)


@dataclass 
class CrossRegionConfig:
    """Cross-region replication configuration"""
    source_region: str
    target_regions: List[str]
    replication_type: str = "async"  # async, sync, mixed
    batch_size: int = 1000
    replication_interval: int = 5  # seconds


class RedisClusterManager:
    """
    Manages Redis cluster with sharding, Sentinel, and cross-region replication
    """
    
    # Cluster configuration
    CLUSTER_SLOTS = 16384  # Redis cluster uses 16384 hash slots
    
    # Sentinel configuration
    SENTINEL_QUORUM = 2
    SENTINEL_DOWN_AFTER = 5000  # milliseconds
    SENTINEL_FAILOVER_TIMEOUT = 60000  # milliseconds
    
    def __init__(self):
        """Initialize Redis Cluster Manager"""
        if not REDIS_AVAILABLE:
            raise ImportError("redis-py-cluster is required. Install with: pip install redis[hiredis] redis集群")
        
        self.nodes: Dict[str, RedisNode] = {}  # node_id -> RedisNode
        self.shards: List[ShardConfig] = []
        self.sentinel_nodes: List[RedisNode] = []
        self.region_nodes: Dict[str, List[str]] = {}  # region -> node_ids
        self.connections: Dict[str, redis.Redis] = {}
        self.cluster_client: Optional[RedisCluster] = None
        self.sentinel_clients: Dict[str, Sentinel] = {}
        
        # Monitoring
        self.health_check_interval = 10
        self.replication_enabled = True
        self.auto_failover_enabled = True
        
        # Cross-region replication
        self.cross_region_configs: List[CrossRegionConfig] = []
        self.replication_tasks: Dict[str, asyncio.Task] = {}
        
        self._monitoring_task = None
    
    def add_node(self, node: RedisNode):
        """Add a Redis node to the cluster"""
        self.nodes[node.id] = node
        
        # Track by region
        if node.region not in self.region_nodes:
            self.region_nodes[node.region] = []
        self.region_nodes[node.region].append(node.id)
        
        # Track sentinel nodes
        if node.role == RedisRole.SENTINEL:
            self.sentinel_nodes.append(node)
        
        logger.info(f"Added Redis node: {node.id} ({node.host}:{node.port}) - {node.role.value} in {node.region}")
    
    def add_master(self, node_id: str, host: str, port: int, region: str,
                   slots: Optional[Tuple[int, int]] = None) -> RedisNode:
        """Add a master node with optional slot assignment"""
        node = RedisNode(
            id=node_id,
            host=host,
            port=port,
            role=RedisRole.MASTER,
            region=region,
            priority=1
        )
        self.add_node(node)
        return node
    
    def add_replica(self, node_id: str, host: str, port: int, region: str,
                    master_id: str) -> RedisNode:
        """Add a replica node"""
        node = RedisNode(
            id=node_id,
            host=host,
            port=port,
            role=RedisRole.REPLICA,
            region=region,
            priority=10  # Lower priority than master
        )
        self.add_node(node)
        
        # Update shard config
        for shard in self.shards:
            if shard.master_node == master_id:
                if node_id not in shard.replica_nodes:
                    shard.replica_nodes.append(node_id)
        
        return node
    
    def add_sentinel(self, node_id: str, host: str, port: int, region: str,
                     master_name: str) -> RedisNode:
        """Add a Sentinel node"""
        node = RedisNode(
            id=node_id,
            host=host,
            port=port,
            role=RedisRole.SENTINEL,
            region=region
        )
        self.add_node(node)
        return node
    
    def setup_sharding(self, num_shards: int = 3):
        """
        Setup cluster sharding with specified number of shards
        
        Args:
            num_shards: Number of shard master nodes
        """
        # Get master nodes
        masters = [n for n in self.nodes.values() if n.role == RedisRole.MASTER]
        
        if len(masters) < num_shards:
            logger.warning(f"Not enough master nodes ({len(masters)}) for {num_shards} shards")
            num_shards = len(masters)
        
        # Clear existing shards
        self.shards = []
        
        # Calculate slot distribution
        slots_per_shard = self.CLUSTER_SLOTS // num_shards
        start_slot = 0
        
        for i in range(num_shards):
            end_slot = start_slot + slots_per_shard - 1
            if i == num_shards - 1:
                end_slot = self.CLUSTER_SLOTS - 1
            
            master = masters[i]
            shard = ShardConfig(
                slot_ranges=[(start_slot, end_slot)],
                master_node=master.id,
                replica_nodes=[n.id for n in self.nodes.values() 
                              if n.role == RedisRole.REPLICA 
                              and n.region == master.region]
            )
            self.shards.append(shard)
            
            logger.info(f"Shard {i}: slots {start_slot}-{end_slot}, master {master.id}")
            
            start_slot = end_slot + 1
    
    def configure_sentinel(self, master_name: str = "mymaster", 
                          quorum: int = 2):
        """
        Configure Sentinel for monitoring and failover
        
        Args:
            master_name: Sentinel master name
            quorum: Quorum for failover
        """
        self.SENTINEL_QUORUM = quorum
        
        if not self.sentinel_nodes:
            logger.warning("No Sentinel nodes configured")
            return
        
        # Generate sentinel configuration
        sentinel_config = []
        
        # Get all masters
        masters = [n for n in self.nodes.values() if n.role == RedisRole.MASTER]
        
        for sentinel in self.sentinel_nodes:
            for master in masters:
                config = f"""
# Monitor master {master.id}
sentinel monitor {master}_{master.id} {master.host} {master.port} {quorum}
sentinel down-after-milliseconds {master}_{master.id} {self.SENTINEL_DOWN_AFTER}
sentinel failover-timeout {master}_{master.id} {self.SENTINEL_FAILOVER_TIMEOUT}
sentinel parallel-syncs {master}_{master.id} 1
sentinel auth-pass {master}_{master.id} {{SENTINEL_PASSWORD}}
sentinel notification-script {master}_{master.id} /opt/sentinel/notify.sh
sentinel client-reconfig-script {master}_{master.id} /opt/sentinel/reconfig.sh
"""
                sentinel_config.append((sentinel.id, config.strip()))
        
        return sentinel_config
    
    async def create_cluster(self, host: str, port: int = 7000,
                            cluster_enabled: bool = True) -> RedisCluster:
        """
        Initialize Redis cluster connection
        
        Args:
            host: Cluster entry point host
            port: Cluster entry point port
            cluster_enabled: Use cluster mode or standalone
        """
        if cluster_enabled:
            # Build startup nodes list
            startup_nodes = []
            for node in self.nodes.values():
                if node.role in [RedisRole.MASTER, RedisRole.REPLICA]:
                    startup_nodes.append({"host": node.host, "port": node.port})
            
            self.cluster_client = RedisCluster(
                startup_nodes=startup_nodes,
                decode_responses=True,
                skip_full_coverage_check=True,
                max_connections=50,
                socket_timeout=5,
                socket_connect_timeout=5,
                socket_keepalive=True,
            )
            
            logger.info(f"Created Redis cluster client with {len(startup_nodes)} nodes")
        else:
            # Single node or sentinel
            self.cluster_client = redis.Redis(
                host=host,
                port=port,
                decode_responses=True,
                health_check_interval=30,
            )
        
        return self.cluster_client
    
    async def create_sentinel_connection(self, region: str,
                                        master_name: str = "mymaster") -> Sentinel:
        """
        Create Sentinel connection for a region
        """
        sentinel_nodes = [
            (n.host, n.port)
            for n in self.sentinel_nodes
            if n.region == region
        ]
        
        if not sentinel_nodes:
            raise ValueError(f"No Sentinel nodes in region {region}")
        
        sentinel = Sentinel(
            sentinel_nodes,
            socket_timeout=5,
            socket_connect_timeout=5,
        )
        
        self.sentinel_clients[region] = sentinel
        logger.info(f"Created Sentinel client for region {region}")
        
        return sentinel
    
    def get_sentinel_master(self, region: str, master_name: str):
        """Get current master via Sentinel"""
        if region not in self.sentinel_clients:
            raise ValueError(f"No Sentinel client for region {region}")
        
        sentinel = self.sentinel_clients[region]
        return sentinel.master_for(master_name)
    
    def get_sentinel_slave(self, region: str, master_name: str):
        """Get replica via Sentinel (for read operations)"""
        if region not in self.sentinel_clients:
            raise ValueError(f"No Sentinel client for region {region}")
        
        sentinel = self.sentinel_clients[region]
        return sentinel.slave_for(master_name, socket_timeout=5)
    
    @staticmethod
    def get_slot(key: str) -> int:
        """
        Calculate which hash slot a key belongs to
        
        Args:
            key: Redis key
        """
        # Redis uses CRC16 algorithm for key hashing
        return RedisClusterManager._crc16(key.encode()) % RedisClusterManager.CLUSTER_SLOTS
    
    @staticmethod
    def _crc16(data: bytes) -> int:
        """CRC16 implementation for Redis cluster"""
        crc = 0
        for byte in data:
            crc ^= byte
            for _ in range(8):
                if crc & 1:
                    crc = (crc >> 1) ^ 0xA001
                else:
                    crc >>= 1
        return crc
    
    async def get_node_for_key(self, key: str) -> Optional[RedisNode]:
        """
        Get the Redis node responsible for a specific key
        """
        if not self.cluster_client:
            return None
        
        slot = self.get_slot(key)
        
        # Find shard containing this slot
        for shard in self.shards:
            for start, end in shard.slot_ranges:
                if start <= slot <= end:
                    master_id = shard.master_node
                    return self.nodes.get(master_id)
        
        return None
    
    async def get_read_node_for_key(self, key: str, 
                                   region: Optional[str] = None) -> Optional[RedisNode]:
        """
        Get a read replica node for a key (latency-aware)
        """
        master = await self.get_node_for_key(key)
        if not master:
            return None
        
        # Find replicas for this master
        replicas = []
        for shard in self.shards:
            if shard.master_node == master.id:
                replicas = [self.nodes.get(rid) for rid in shard.replica_nodes]
                break
        
        if not replicas:
            return master
        
        # If region specified, prioritize that region
        if region:
            region_replicas = [r for r in replicas if r and r.region == region]
            if region_replicas:
                # Return lowest latency replica in region
                return min(region_replicas, key=lambda r: r.latency_ms)
        
        # Return lowest latency replica
        return min(replicas, key=lambda r: r.latency_ms if r else float('inf'))
    
    # ==================== Cross-Region Replication ====================
    
    def configure_cross_region_replication(self, config: CrossRegionConfig):
        """
        Configure cross-region replication
        
        Args:
            config: Cross-region replication configuration
        """
        self.cross_region_configs.append(config)
        logger.info(f"Configured cross-region replication: {config.source_region} -> {config.target_regions}")
    
    async def start_cross_region_replication(self):
        """Start cross-region replication tasks"""
        for config in self.cross_region_configs:
            task_key = f"replicate_{config.source_region}"
            
            if task_key in self.replication_tasks:
                if not self.replication_tasks[task_key].done():
                    continue
            
            # Start replication task
            task = asyncio.create_task(
                self._replicate_region(config),
                name=task_key
            )
            self.replication_tasks[task_key] = task
            
            logger.info(f"Started replication task for {config.source_region}")
    
    async def _replicate_region(self, config: CrossRegionConfig):
        """
        Replicate data from source region to target regions
        
        In production, this would use Redis Streams, Pub/Sub, or keyspace notifications
        """
        source_nodes = self.region_nodes.get(config.source_region, [])
        
        if not source_nodes:
            logger.warning(f"No nodes in source region {config.source_region}")
            return
        
        while True:
            try:
                # Get source connection
                source_node = self.nodes.get(source_nodes[0])
                if not source_node or source_node.role != RedisRole.MASTER:
                    await asyncio.sleep(config.replication_interval)
                    continue
                
                if source_node.id not in self.connections:
                    self.connections[source_node.id] = await redis.Redis(
                        host=source_node.host,
                        port=source_node.port,
                        decode_responses=True
                    )
                
                source_conn = self.connections[source_node.id]
                
                # Get all keys (in production, use SCAN)
                keys = await source_conn.keys("*")
                
                # Replicate to target regions
                for target_region in config.target_regions:
                    target_nodes = self.region_nodes.get(target_region, [])
                    
                    for target_node_id in target_nodes:
                        target_node = self.nodes.get(target_node_id)
                        if not target_node:
                            continue
                        
                        if target_node.id not in self.connections:
                            self.connections[target_node.id] = await redis.Redis(
                                host=target_node.host,
                                port=target_node.port,
                                decode_responses=True
                            )
                        
                        target_conn = self.connections[target_node.id]
                        
                        # Replicate keys in batches
                        for i in range(0, len(keys), config.batch_size):
                            batch = keys[i:i + config.batch_size]
                            
                            for key in batch:
                                # Get key data
                                key_type = await source_conn.type(key)
                                
                                if key_type == 'string':
                                    value = await source_conn.get(key)
                                    await target_conn.set(key, value, nx=True)
                                elif key_type == 'hash':
                                    mapping = await source_conn.hgetall(key)
                                    if mapping:
                                        await target_conn.hset(key, mapping=mapping)
                                elif key_type == 'list':
                                    values = await source_conn.lrange(key, 0, -1)
                                    if values:
                                        await target_conn.delete(key)
                                        await target_conn.lpush(key, *values)
                                elif key_type == 'set':
                                    members = await source_conn.smembers(key)
                                    if members:
                                        await target_conn.sadd(key, *members)
                                elif key_type == 'zset':
                                    mapping = await source_conn.zrange(key, 0, -1, withscores=True)
                                    if mapping:
                                        await target_conn.zadd(key, dict(mapping))
                
                logger.debug(f"Replicated {len(keys)} keys from {config.source_region}")
                
            except Exception as e:
                logger.error(f"Error replicating from {config.source_region}: {e}")
            
            await asyncio.sleep(config.replication_interval)
    
    # ==================== Health Monitoring ====================
    
    async def check_node_health(self, node: RedisNode) -> bool:
        """
        Check health of a Redis node
        """
        try:
            if node.id not in self.connections:
                self.connections[node.id] = await redis.Redis(
                    host=node.host,
                    port=node.port,
                    socket_timeout=2,
                    socket_connect_timeout=2,
                    decode_responses=True
                )
            
            conn = self.connections[node.id]
            
            start_time = asyncio.get_event_loop().time()
            await conn.ping()
            latency_ms = (asyncio.get_event_loop().time() - start_time) * 1000
            
            # Update node stats
            node.latency_ms = latency_ms
            node.last_check = datetime.utcnow()
            node.status = NodeStatus.HEALTHY
            node.error_count = 0
            
            # Get additional info
            info = await conn.info()
            node.connections = int(info.get('connected_clients', 0))
            node.memory_used = int(info.get('used_memory', 0))
            node.memory_max = int(info.get('maxmemory', 0))
            node.key_count = int(info.get('db0', {}).get('keys', 0))
            
            return True
            
        except redis.ConnectionError:
            node.status = NodeStatus.UNREACHABLE
            node.error_count += 1
            return False
        except redis.TimeoutError:
            node.status = NodeStatus.UNREACHABLE
            node.error_count += 1
            return False
        except Exception as e:
            logger.error(f"Error checking node {node.id}: {e}")
            node.status = NodeStatus.UNREACHABLE
            node.error_count += 1
            return False
    
    async def check_all_nodes_health(self) -> Dict[str, bool]:
        """
        Check health of all nodes
        """
        results = {}
        
        tasks = [self.check_node_health(node) for node in self.nodes.values()]
        health_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for node, result in zip(self.nodes.values(), health_results):
            results[node.id] = result if isinstance(result, bool) else False
            if not isinstance(result, Exception):
                logger.debug(f"Node {node.id}: {result}")
        
        return results
    
    async def start_monitoring(self):
        """Start background health monitoring"""
        if self._monitoring_task is None or self._monitoring_task.done():
            self._monitoring_task = asyncio.create_task(self._monitoring_loop())
            logger.info("Started Redis cluster monitoring")
    
    async def stop_monitoring(self):
        """Stop background monitoring"""
        if self._monitoring_task:
            self._monitoring_task.cancel()
            logger.info("Stopped Redis cluster monitoring")
    
    async def _monitoring_loop(self):
        """Health monitoring loop"""
        while True:
            try:
                await self.check_all_nodes_health()
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
            
            await asyncio.sleep(self.health_check_interval)
    
    # ==================== Failover ====================
    
    async def handle_node_failure(self, failed_node: RedisNode):
        """
        Handle a failed node - trigger failover if master
        
        Args:
            failed_node: The failed Redis node
        """
        if failed_node.role != RedisRole.MASTER:
            logger.warning(f"Replica {failed_node.id} failed, no failover needed")
            return
        
        if not self.auto_failover_enabled:
            logger.warning(f"Auto-failover disabled, manual intervention required for {failed_node.id}")
            return
        
        logger.info(f"Master {failed_node.id} failed, checking for failover...")
        
        # Find replicas for this master
        replicas = []
        for shard in self.shards:
            if shard.master_node == failed_node.id:
                replicas = [self.nodes.get(rid) for rid in shard.replica_nodes]
                break
        
        if not replicas:
            logger.error(f"No replicas available for master {failed_node.id}")
            return
        
        # Select best replica (highest priority, lowest latency)
        best_replica = min(
            [r for r in replicas if r],
            key=lambda r: (r.priority, r.latency_ms)
        )
        
        logger.info(f"Promoting replica {best_replica.id} to master")
        
        # In production, this would use Sentinel to handle failover
        # For now, simulate the failover
        
        # Update roles
        failed_node.role = RedisRole.REPLICA
        best_replica.role = RedisRole.MASTER
        
        # Update shard config
        for shard in self.shards:
            if shard.master_node == failed_node.id:
                shard.master_node = best_replica.id
                if failed_node.id in shard.replica_nodes:
                    shard.replica_nodes.remove(failed_node.id)
                shard.replica_nodes.append(failed_node.id)
                break
        
        logger.info(f"Failover completed: {failed_node.id} -> {best_replica.id}")
    
    # ==================== Utility ====================
    
    async def get_cluster_info(self) -> Dict:
        """Get cluster information"""
        healthy_masters = sum(1 for n in self.nodes.values() 
                            if n.role == RedisRole.MASTER and n.status == NodeStatus.HEALTHY)
        healthy_replicas = sum(1 for n in self.nodes.values() 
                             if n.role == RedisRole.REPLICA and n.status == NodeStatus.HEALTHY)
        
        return {
            'nodes': {
                node_id: {
                    'host': node.host,
                    'port': node.port,
                    'role': node.role.value,
                    'region': node.region,
                    'status': node.status.value,
                    'latency_ms': node.latency_ms,
                    'connections': node.connections,
                    'memory_used_mb': node.memory_used // (1024*1024),
                }
                for node_id, node in self.nodes.items()
            },
            'shards': [
                {
                    'slots': shard.slot_ranges,
                    'master': shard.master_node,
                    'replicas': shard.replica_nodes,
                }
                for shard in self.shards
            ],
            'summary': {
                'total_nodes': len(self.nodes),
                'healthy_masters': healthy_masters,
                'healthy_replicas': healthy_replicas,
                'regions': list(self.region_nodes.keys()),
                'sentinel_nodes': len(self.sentinel_nodes),
            },
        }
    
    def get_redis_url(self, node_id: str) -> str:
        """Get Redis connection URL for a node"""
        node = self.nodes.get(node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")
        
        return f"redis://{node.host}:{node.port}/0"
    
    def export_config(self, output_path: str):
        """Export cluster configuration"""
        config = {
            'nodes': [
                {
                    'id': node.id,
                    'host': node.host,
                    'port': node.port,
                    'role': node.role.value,
                    'region': node.region,
                    'priority': node.priority,
                }
                for node in self.nodes.values()
            ],
            'shards': [
                {
                    'slot_ranges': shard.slot_ranges,
                    'master_node': shard.master_node,
                    'replica_nodes': shard.replica_nodes,
                }
                for shard in self.shards
            ],
            'sentinel': {
                'quorum': self.SENTINEL_QUORUM,
                'down_after_ms': self.SENTINEL_DOWN_AFTER,
                'failover_timeout_ms': self.SENTINEL_FAILOVER_TIMEOUT,
            },
            'cross_region': [
                {
                    'source_region': cr.source_region,
                    'target_regions': cr.target_regions,
                    'replication_type': cr.replication_type,
                }
                for cr in self.cross_region_configs
            ]
        }
        
        from pathlib import Path
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Cluster configuration exported to {output_path}")


# Singleton instance
_redis_cluster_manager: Optional[RedisClusterManager] = None


def get_redis_cluster_manager() -> RedisClusterManager:
    """Get singleton RedisClusterManager instance"""
    global _redis_cluster_manager
    if _redis_cluster_manager is None:
        _redis_cluster_manager = RedisClusterManager()
    return _redis_cluster_manager


async def main():
    """Demo/test function"""
    manager = RedisClusterManager()
    
    # Add nodes for LATAM region
    manager.add_master("latam-master-1", "redis-latam-1.barberzap.com", 6379, "latam")
    manager.add_replica("latam-replica-1", "redis-latam-2.barberzap.com", 6380, "latam", "latam-master-1")
    manager.add_replica("latam-replica-2", "redis-latam-3.barberzap.com", 6381, "latam", "latam-master-1")
    
    # Add sentinel
    manager.add_sentinel("latam-sentinel-1", "sentinel-latam-1.barberzap.com", 26379, "latam", "latam-master")
    manager.add_sentinel("latam-sentinel-2", "sentinel-latam-2.barberzap.com", 26380, "latam", "latam-master")
    manager.add_sentinel("latam-sentinel-3", "sentinel-latam-3.barberzap.com", 26381, "latam", "latam-master")
    
    # Setup sharding
    manager.setup_sharding(num_shards=1)
    
    # Configure sentinel
    sentinel_config = manager.configure_sentinel()
    
    # Export configuration
    manager.export_config("/root/barber/deploy/config/redis_cluster.json")
    
    print("Redis cluster configuration created successfully!")

if __name__ == "__main__":
    asyncio.run(main())
