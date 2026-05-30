"""
Metrics Collector for BarberZap
===============================
Collects metrics from various sources (Redis, BullMQ, Supabase, etc.)

Features:
- Webhook stats (last 1h, 24h, 7d)
- Cache stats (hit rates by type)
- Job stats (rate, success/fail, avg_time)
- Conflict stats (per shop)
- User activity stats
- System resources (CPU, memory, disk)
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict
import json
import psutil
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)


class TimeWindow(Enum):
    """Time windows for metric aggregation"""
    ONE_HOUR = '1h'
    ONE_DAY = '1d'
    ONE_WEEK = '7d'


class MetricType(Enum):
    """Types of metrics"""
    WEBHOOK = 'webhook'
    CACHE = 'cache'
    JOB = 'job'
    BOOKING = 'booking'
    REALTIME = 'realtime'
    OUTBOX = 'outbox'
    SYSTEM = 'system'
    ERROR = 'error'


@dataclass
class MetricSample:
    """A single metric sample"""
    timestamp: float
    value: float
    labels: Dict[str, str] = field(default_factory=dict)


@dataclass
class MetricAggregate:
    """Aggregated metric over a time window"""
    metric_type: str
    metric_name: str
    window: TimeWindow
    start_time: datetime
    end_time: datetime
    sum: float = 0.0
    count: int = 0
    min: float = float('inf')
    max: float = float('-inf')
    avg: float = 0.0
    samples: List[MetricSample] = field(default_factory=list)
    
    def add_sample(self, sample: MetricSample):
        """Add a sample to the aggregate"""
        self.sum += sample.value
        self.count += 1
        self.min = min(self.min, sample.value)
        self.max = max(self.max, sample.value)
        self.avg = self.sum / self.count if self.count > 0 else 0.0
        self.samples.append(sample)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'metric_type': self.metric_type,
            'metric_name': self.metric_name,
            'window': self.window.value,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'sum': self.sum,
            'count': self.count,
            'min': self.min if self.min != float('inf') else 0,
            'max': self.max if self.max != float('-inf') else 0,
            'avg': self.avg,
            'samples': [
                {
                    'timestamp': s.timestamp,
                    'value': s.value,
                    'labels': s.labels,
                }
                for s in self.samples[-100:]  # Last 100 samples
            ],
        }


class RedisMetricsStore:
    """
    Redis-based metrics storage
    Stores metrics with TTL for automatic cleanup
    """
    
    METRICS_PREFIX = 'barber:metrics:'
    METRIC_TTL_DAYS = 30  # Keep metrics for 30 days
    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: Optional[aioredis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        self._redis = await aioredis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self._redis:
            await self._redis.close()
    
    async def store_metric(
        self,
        metric_type: str,
        metric_name: str,
        value: float,
        labels: Dict[str, str],
        timestamp: Optional[float] = None,
    ):
        """
        Store a metric sample in Redis
        
        Args:
            metric_type: Type of metric
            metric_name: Name of the metric
            value: Metric value
            labels: Labels for the metric
            timestamp: Timestamp (default: now)
        """
        if self._redis is None:
            await self.connect()
        
        if timestamp is None:
            timestamp = time.time()
        
        key = f"{self.METRICS_PREFIX}{metric_type}:{metric_name}"
        
        # Store as sorted set with timestamp as score
        score = timestamp
        member = json.dumps({
            'value': value,
            'labels': labels,
        })
        
        pipe = self._redis.pipeline()
        pipe.zadd(key, {member: score})
        pipe.expire(key, self.METRIC_TTL_DAYS * 86400)
        await pipe.execute()
    
    async def get_metrics(
        self,
        metric_type: str,
        metric_name: str,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None,
    ) -> List[MetricSample]:
        """
        Get metrics for a time range
        
        Args:
            metric_type: Type of metric
            metric_name: Name of the metric
            start_time: Start timestamp (default: 1h ago)
            end_time: End timestamp (default: now)
        
        Returns:
            List of metric samples
        """
        if self._redis is None:
            await self.connect()
        
        key = f"{self.METRICS_PREFIX}{metric_type}:{metric_name}"
        
        if end_time is None:
            end_time = time.time()
        if start_time is None:
            start_time = end_time - 3600  # Default: 1 hour
        
        # Get samples from sorted set for time range
        items = await self._redis.zrangebyscore(
            key,
            start_time,
            end_time,
            withscores=True,
        )
        
        samples = []
        for item, timestamp in items:
            data = json.loads(item)
            samples.append(MetricSample(
                timestamp=timestamp,
                value=data['value'],
                labels=data.get('labels', {}),
            ))
        
        return samples
    
    async def get_aggregate(
        self,
        metric_type: str,
        metric_name: str,
        window: TimeWindow,
    ) -> MetricAggregate:
        """
        Get aggregated metrics for a time window
        
        Args:
            metric_type: Type of metric
            metric_name: Name of the metric
            window: Time window
        
        Returns:
            MetricAggregate
        """
        end_time = time.time()
        
        # Calculate start time based on window
        if window == TimeWindow.ONE_HOUR:
            start_time = end_time - 3600
        elif window == TimeWindow.ONE_DAY:
            start_time = end_time - 86400
        elif window == TimeWindow.ONE_WEEK:
            start_time = end_time - 604800
        else:
            start_time = end_time - 3600
        
        aggregate = MetricAggregate(
            metric_type=metric_type,
            metric_name=metric_name,
            window=window,
            start_time=datetime.fromtimestamp(start_time),
            end_time=datetime.fromtimestamp(end_time),
        )
        
        samples = await self.get_metrics(
            metric_type,
            metric_name,
            start_time,
            end_time,
        )
        
        for sample in samples:
            aggregate.add_sample(sample)
        
        return aggregate
    
    async def get_multiple_metrics(
        self,
        metric_type: str,
        metric_names: List[str],
        window: TimeWindow,
    ) -> Dict[str, MetricAggregate]:
        """Get multiple metrics at once"""
        results = {}
        for name in metric_names:
            results[name] = await self.get_aggregate(metric_type, name, window)
        return results
    
    async def cleanup_old_metrics(self, before_days: int = 30):
        """Clean up metrics older than specified days"""
        if self._redis is None:
            await self.connect()
        
        cutoff_time = time.time() - (before_days * 86400)
        
        # Get all metric keys
        keys = []
        async for key in self._redis.scan_iter(f"{self.METRICS_PREFIX}*"):
            keys.append(key)
        
        # Remove old samples
        for key in keys:
            await self._redis.zremrangebyscore(key, 0, cutoff_time)
        
        logger.info(f"Cleaned up metrics older than {before_days} days")


class MetricsCollector:
    """
    Main metrics collector for BarberZap
    
    Collects metrics from various sources and aggregates them
    """
    
    def __init__(
        self,
        redis_url: str,
        prometheus_exporter: Optional['PrometheusExporter'] = None,
    ):
        self.redis_url = redis_url
        self.prometheus_exporter = prometheus_exporter
        self.store = RedisMetricsStore(redis_url)
        self._running = False
        self._collection_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the collector"""
        if self._running:
            return
        
        await self.store.connect()
        self._running = True
        self._collection_task = asyncio.create_task(self._collection_loop())
        logger.info("Metrics collector started")
    
    async def stop(self):
        """Stop the collector"""
        self._running = False
        if self._collection_task:
            self._collection_task.cancel()
            try:
                await self._collection_task
            except asyncio.CancelledError:
                pass
        await self.store.disconnect()
        logger.info("Metrics collector stopped")
    
    async def _collection_loop(self):
        """Main collection loop"""
        while self._running:
            try:
                await self.collect_all_metrics()
            except Exception as e:
                logger.error(f"Error collecting metrics: {e}")
            
            # Collect every 30 seconds
            await asyncio.sleep(30)
    
    async def collect_all_metrics(self):
        """Collect all metrics from all sources"""
        await asyncio.gather(
            self.collect_cache_metrics(),
            self.collect_system_metrics(),
            self.collect_job_metrics(),
        )
    
    async def collect_cache_metrics(self):
        """Collect cache-related metrics"""
        try:
            # Get cache hit rates from Redis
            async with aioredis.from_url(self.redis_url) as redis:
                # Get cache stats for each shop
                shop_keys = await redis.keys("barber:cache:stats:*")
                
                for key in shop_keys:
                    try:
                        data = await redis.hgetall(key)
                        shop_id = key.split(':')[-1]
                        
                        hit_count = int(data.get('hits', 0))
                        miss_count = int(data.get('misses', 0))
                        total = hit_count + miss_count
                        
                        if total > 0:
                            hit_rate = (hit_count / total) * 100
                            
                            # Store metric
                            await self.store.store_metric(
                                metric_type='cache',
                                metric_name='hit_rate',
                                value=hit_rate,
                                labels={'shop_id': shop_id, 'cache_type': 'general'},
                            )
                            
                            # Update Prometheus if available
                            if self.prometheus_exporter:
                                self.prometheus_exporter.set_cache_hit_rate(
                                    shop_id=shop_id,
                                    cache_type='general',
                                    rate=hit_rate,
                                )
                    except Exception as e:
                        logger.error(f"Error collecting cache stats for {key}: {e}")
        
        except Exception as e:
            logger.error(f"Error collecting cache metrics: {e}")
    
    async def collect_system_metrics(self):
        """Collect system resource metrics"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=0.1)
            await self.store.store_metric(
                metric_type='system',
                metric_name='cpu_percent',
                value=cpu_percent,
                labels={},
            )
            
            # Memory
            memory = psutil.virtual_memory()
            await self.store.store_metric(
                metric_type='system',
                metric_name='memory_percent',
                value=memory.percent,
                labels={},
            )
            
            await self.store.store_metric(
                metric_type='system',
                metric_name='memory_used_mb',
                value=memory.used / (1024 * 1024),
                labels={},
            )
            
            # Disk
            disk = psutil.disk_usage('/')
            await self.store.store_metric(
                metric_type='system',
                metric_name='disk_percent',
                value=disk.percent,
                labels={},
            )
            
            # Redis health
            async with aioredis.from_url(self.redis_url) as redis:
                start = time.time()
                await redis.ping()
                latency = time.time() - start
                await self.store.store_metric(
                    metric_type='system',
                    metric_name='redis_latency',
                    value=latency,
                    labels={},
                )
                
                if self.prometheus_exporter:
                    self.prometheus_exporter.set_redis_health(
                        shop_id='all',
                        healthy=True,
                        latency=latency,
                    )
        
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            
            if self.prometheus_exporter:
                self.prometheus_exporter.set_redis_health(
                    shop_id='all',
                    healthy=False,
                    latency=0,
                )
    
    async def collect_job_metrics(self):
        """Collect BullMQ job metrics"""
        try:
            async with aioredis.from_url(self.redis_url) as redis:
                # Get all queue names
                queue_keys = await redis.keys("bull:queue:*")
                
                for queue_key in queue_keys:
                    try:
                        queue_name = queue_key.split(':')[-2]
                        
                        # Get queue stats
                        waiting_key = f"bull:{queue_name}:waiting"
                        active_key = f"bull:{queue_name}:active"
                        delayed_key = f"bull:{queue_name}:delayed"
                        failed_key = f"bull:{queue_name}:failed"
                        
                        waiting = await redis.llen(waiting_key)
                        active = await redis.llen(active_key)
                        delayed = await redis.llen(delayed_key)
                        failed = await redis.llen(failed_key)
                        
                        total_jobs = waiting + active + delayed + failed
                        
                        # Store metrics
                        await self.store.store_metric(
                            metric_type='job',
                            metric_name='active',
                            value=active,
                            labels={'queue': queue_name},
                        )
                        
                        await self.store.store_metric(
                            metric_type='job',
                            metric_name='waiting',
                            value=waiting,
                            labels={'queue': queue_name},
                        )
                        
                        await self.store.store_metric(
                            metric_type='job',
                            metric_name='failed',
                            value=failed,
                            labels={'queue': queue_name},
                        )
                        
                        # Store success rate (simple calculation)
                        if total_jobs > 0:
                            success_rate = ((total_jobs - failed) / total_jobs) * 100
                            await self.store.store_metric(
                                metric_type='job',
                                metric_name='success_rate',
                                value=success_rate,
                                labels={'queue': queue_name},
                            )
                    except Exception as e:
                        logger.error(f"Error collecting job stats for {queue_key}: {e}")
        
        except Exception as e:
            logger.error(f"Error collecting job metrics: {e}")
    
    async def get_webhook_stats(
        self,
        shop_id: str,
        window: TimeWindow,
    ) -> Dict[str, MetricAggregate]:
        """Get webhook statistics for a shop"""
        return await self.store.get_multiple_metrics(
            metric_type='webhook',
            metric_names=[
                'total',
                'success_rate',
                'latency',
            ],
            window=window,
        )
    
    async def get_cache_stats(
        self,
        shop_id: str,
        window: TimeWindow,
    ) -> Dict[str, MetricAggregate]:
        """Get cache statistics for a shop"""
        return await self.store.get_multiple_metrics(
            metric_type='cache',
            metric_names=[
                'hit_rate',
                'hits',
                'misses',
            ],
            window=window,
        )
    
    async def get_job_stats(
        self,
        window: TimeWindow,
    ) -> Dict[str, MetricAggregate]:
        """Get job statistics"""
        return await self.store.get_multiple_metrics(
            metric_type='job',
            metric_names=[
                'active',
                'waiting',
                'failed',
                'success_rate',
            ],
            window=window,
        )
    
    async def get_system_stats(
        self,
        window: TimeWindow,
    ) -> Dict[str, MetricAggregate]:
        """Get system statistics"""
        return await self.store.get_multiple_metrics(
            metric_type='system',
            metric_names=[
                'cpu_percent',
                'memory_percent',
                'disk_percent',
                'redis_latency',
            ],
            window=window,
        )
    
    async def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get summary metrics for dashboard"""
        now = time.time()
        
        # Get recent metrics (last hour)
        system_stats = await self.get_system_stats(TimeWindow.ONE_HOUR)
        job_stats = await self.get_job_stats(TimeWindow.ONE_HOUR)
        
        # Get top shops by activity
        async with aioredis.from_url(self.redis_url) as redis:
            # Get top shops by cache hits
            cache_rates = {}
            shop_keys = await redis.keys("barber:cache:stats:*")
            
            for key in shop_keys:
                try:
                    shop_id = key.split(':')[-1]
                    data = await redis.hgetall(key)
                    hit_count = int(data.get('hits', 0))
                    miss_count = int(data.get('misses', 0))
                    total = hit_count + miss_count
                    
                    if total > 0:
                        cache_rates[shop_id] = (hit_count / total) * 100
                except Exception:
                    pass
        
        return {
            'timestamp': now,
            'system': {
                'cpu': system_stats.get('cpu_percent', MetricAggregate(
                    metric_type='system',
                    metric_name='cpu_percent',
                    window=TimeWindow.ONE_HOUR,
                    start_time=datetime.fromtimestamp(now - 3600),
                    end_time=datetime.fromtimestamp(now),
                )).avg,
                'memory': system_stats.get('memory_percent', MetricAggregate(
                    metric_type='system',
                    metric_name='memory_percent',
                    window=TimeWindow.ONE_HOUR,
                    start_time=datetime.fromtimestamp(now - 3600),
                    end_time=datetime.fromtimestamp(now),
                )).avg,
                'redis_latency': system_stats.get('redis_latency', MetricAggregate(
                    metric_type='system',
                    metric_name='redis_latency',
                    window=TimeWindow.ONE_HOUR,
                    start_time=datetime.fromtimestamp(now - 3600),
                    end_time=datetime.fromtimestamp(now),
                )).avg,
            },
            'jobs': {
                'active': job_stats.get('active', MetricAggregate(
                    metric_type='job',
                    metric_name='active',
                    window=TimeWindow.ONE_HOUR,
                    start_time=datetime.fromtimestamp(now - 3600),
                    end_time=datetime.fromtimestamp(now),
                )).avg,
                'waiting': job_stats.get('waiting', MetricAggregate(
                    metric_type='job',
                    metric_name='waiting',
                    window=TimeWindow.ONE_HOUR,
                    start_time=datetime.fromtimestamp(now - 3600),
                    end_time=datetime.fromtimestamp(now),
                )).avg,
                'failed': job_stats.get('failed', MetricAggregate(
                    metric_type='job',
                    metric_name='failed',
                    window=TimeWindow.ONE_HOUR,
                    start_time=datetime.fromtimestamp(now - 3600),
                    end_time=datetime.fromtimestamp(now),
                )).avg,
                'success_rate': job_stats.get('success_rate', MetricAggregate(
                    metric_type='job',
                    metric_name='success_rate',
                    window=TimeWindow.ONE_HOUR,
                    start_time=datetime.fromtimestamp(now - 3600),
                    end_time=datetime.fromtimestamp(now),
                )).avg,
            },
            'shops': cache_rates,
        }


# Factory function
def get_collector(
    redis_url: str,
    prometheus_exporter: Optional['PrometheusExporter'] = None,
) -> MetricsCollector:
    """
    Create a metrics collector instance
    
    Args:
        redis_url: Redis connection URL
        prometheus_exporter: Optional Prometheus exporter instance
    
    Returns:
        MetricsCollector instance
    """
    return MetricsCollector(
        redis_url=redis_url,
        prometheus_exporter=prometheus_exporter,
    )


if __name__ == '__main__':
    # Test the collector
    import argparse
    
    parser = argparse.ArgumentParser(description='Metrics Collector')
    parser.add_argument('--redis-url', type=str, default='redis://localhost:6379', help='Redis URL')
    args = parser.parse_args()
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    
    async def main():
        collector = get_collector(args.redis_url)
        
        try:
            await collector.start()
            
            # Collect once and print summary
            await collector.collect_all_metrics()
            summary = await collector.get_dashboard_summary()
            
            print("\n=== Dashboard Summary ===")
            print(json.dumps(summary, indent=2, default=str))
            
            # Keep running
            print("\nCollector running. Press Ctrl+C to stop.")
            while True:
                await asyncio.sleep(60)
        
        except KeyboardInterrupt:
            print("\nShutting down...")
        finally:
            await collector.stop()
    
    asyncio.run(main())
