"""
Search Analytics Module for BarberZap
Track and analyze search behavior, popular queries, and search performance
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import statistics

import asyncpg


logger = logging.getLogger(__name__)


# ==================== Data Classes ====================

@dataclass
class SearchEvent:
    """Represents a single search event"""
    shop_id: str
    user_id: Optional[str]
    query: str
    query_type: str
    results_count: int
    duration_ms: int
    timestamp: datetime
    clicked_id: Optional[str] = None
    click_position: Optional[int] = None
    results_ids: Optional[List[str]] = None


@dataclass
class QueryStats:
    """Statistics for a single query"""
    query: str
    count: int
    avg_results: float
    avg_duration_ms: float
    ctr: float  # Click-through rate
    first_seen: datetime
    last_seen: datetime


@dataclass
class DailyMetrics:
    """Daily search metrics"""
    date: datetime
    total_searches: int
    total_clicks: int
    ctr: float
    avg_results: float
    avg_duration_ms: float
    no_results_count: int
    no_results_rate: float
    unique_queries: int


@dataclass
class SearchPerformanceMetrics:
    """Overall search performance metrics"""
    total_searches: int
    total_clicks: int
    ctr: float
    avg_results: float
    avg_duration_ms: float
    p95_duration_ms: float
    p99_duration_ms: float
    no_results_rate: float
    unique_queries: int
    period_days: int


# ==================== Search Analytics Manager ====================

class SearchAnalyticsManager:
    """
    Manages search analytics including:
    - Real-time metrics tracking
    - Query popularity tracking
    - Performance monitoring
    - Historical analysis
    """
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool
        self._realtime_events = deque(maxlen=10000)  # Keep last 10k events in memory
        self._query_stats = defaultdict(lambda: {
            'count': 0,
            'results_sum': 0,
            'duration_sum': 0.0,
            'clicks': 0,
            'first_seen': None,
            'last_seen': None
        })
        self._daily_cache = {}  # date -> DailyMetrics
        self._lock = asyncio.Lock()
        logger.info("SearchAnalyticsManager initialized")
    
    # ==================== Event Logging ====================
    
    async def log_search(self, event: SearchEvent):
        """
        Log a search event
        
        Args:
            event: SearchEvent to log
        """
        # Update in-memory structures
        async with self._lock:
            self._realtime_events.append(event)
            
            query_key = f"{event.shop_id}_{event.query}"
            stats = self._query_stats[query_key]
            
            stats['count'] += 1
            stats['results_sum'] += event.results_count
            stats['duration_sum'] += event.duration_ms
            stats['last_seen'] = event.timestamp
            
            if stats['first_seen'] is None:
                stats['first_seen'] = event.timestamp
        
        # Also log to database asynchronously
        asyncio.create_task(self._persist_search_event(event))
    
    async def log_click(self, shop_id: str, query: str, click_position: int):
        """
        Log a click on a search result
        
        Args:
            shop_id: Shop UUID
            query: Search query
            click_position: Position of clicked result
        """
        async with self._lock:
            query_key = f"{shop_id}_{query}"
            stats = self._query_stats.get(query_key)
            if stats:
                stats['clicks'] += 1
    
    # ==================== Query Analytics ====================
    
    async def get_popular_queries(
        self,
        shop_id: str,
        days: int = 30,
        limit: int = 100
    ) -> List[QueryStats]:
        """
        Get most popular queries
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
            limit: Maximum results
        
        Returns:
            List of QueryStats
        """
        from_cache = []
        
        async with self._lock:
            for key, stats in self._query_stats.items():
                # Extract shop from key
                key_shop_id = key.split('_')[0] if '_' in key else None
                
                if key_shop_id == shop_id and stats['count'] > 0:
                    avg_results = stats['results_sum'] / stats['count']
                    avg_duration = stats['duration_sum'] / stats['count']
                    ctr = stats['clicks'] / stats['count'] if stats['count'] > 0 else 0
                    
                    query_text = key.replace(f"{shop_id}_", '')
                    
                    from_cache.append(QueryStats(
                        query=query_text,
                        count=stats['count'],
                        avg_results=avg_results,
                        avg_duration_ms=avg_duration,
                        ctr=ctr,
                        first_seen=stats['first_seen'] or datetime.now(),
                        last_seen=stats['last_seen'] or datetime.now()
                    ))
        
        # Sort by count and limit
        from_cache.sort(key=lambda x: x.count, reverse=True)
        return from_cache[:limit]
    
    async def get_empty_queries(
        self,
        shop_id: str,
        days: int = 30,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get queries that returned no results (opportunities for improvement)
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
            limit: Maximum results
        
        Returns:
            List of query statistics
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    query,
                    COUNT(*) as count,
                    MIN(created_at) as first_seen,
                    MAX(created_at) as last_seen
                FROM search_analytics
                WHERE shop_id = $1::UUID
                  AND created_at >= NOW() - INTERVAL '1 day' * $2
                  AND results_count = 0
                  AND LENGTH(TRIM(query)) >= 2
                GROUP BY query
                ORDER BY count DESC
                LIMIT $3
            """, shop_id, days, limit)
        
        return [dict(row) for row in rows]
    
    async def get_trending_queries(
        self,
        shop_id: str,
        hours: int = 24,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get queries that are trending (increasing in popularity)
        
        Args:
            shop_id: Shop UUID
            hours: Number of recent hours to analyze
            limit: Maximum results
        
        Returns:
            List of trending queries with growth rate
        """
        current_time = datetime.now()
        recent_start = current_time - timedelta(hours=hours)
        previous_start = recent_start - timedelta(hours=hours)
        
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                WITH recent_counts AS (
                    SELECT 
                        query,
                        COUNT(*) as count
                    FROM search_analytics
                    WHERE shop_id = $1::UUID
                      AND created_at >= $2::TIMESTAMP WITH TIME ZONE
                      AND LENGTH(TRIM(query)) >= 2
                    GROUP BY query
                ),
                previous_counts AS (
                    SELECT 
                        query,
                        COUNT(*) as count
                    FROM search_analytics
                    WHERE shop_id = $1::UUID
                      AND created_at >= $3::TIMESTAMP WITH TIME ZONE
                      AND created_at < $2::TIMESTAMP WITH TIME ZONE
                      AND LENGTH(TRIM(query)) >= 2
                    GROUP BY query
                )
                SELECT 
                    r.query,
                    r.count as recent_count,
                    COALESCE(p.count, 0) as previous_count,
                    CASE 
                        WHEN COALESCE(p.count, 0) = 0 THEN r.count::FLOAT
                        ELSE (r.count::FLOAT / COALESCE(p.count, 1) - 1) * 100
                    END as growth_rate
                FROM recent_counts r
                LEFT JOIN previous_counts p ON r.query = p.query
                WHERE r.count >= 3
                ORDER BY growth_rate DESC, r.count DESC
                LIMIT $4
            """, shop_id, recent_start, previous_start, limit)
        
        return [dict(row) for row in rows]
    
    # ==================== Performance Metrics ====================
    
    async def get_search_metrics(
        self,
        shop_id: str,
        days: int = 30
    ) -> SearchPerformanceMetrics:
        """
        Get comprehensive search performance metrics
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
        
        Returns:
            SearchPerformanceMetrics object
        """
        async with self.db_pool.acquire() as conn:
            # Get metrics from database
            row = await conn.fetchrow("""
                SELECT * FROM get_search_metrics(
                    p_shop_id := $1::UUID,
                    p_days := $2::INTEGER
                )
            """, shop_id, days)
            
            metrics = dict(row) if row else {}
            
            # Also get percentile data
            percentiles = await conn.fetchrow("""
                SELECT 
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
                    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration
                FROM search_analytics
                WHERE shop_id = $1::UUID
                  AND created_at >= NOW() - INTERVAL '1 day' * $2
            """, shop_id, days)
        
        return SearchPerformanceMetrics(
            total_searches=metrics.get('total_searches', 0),
            total_clicks=metrics.get('total_clicks', 0),
            ctr=metrics.get('ctr', 0.0),
            avg_results=metrics.get('avg_results', 0.0),
            avg_duration_ms=metrics.get('avg_duration_ms', 0.0),
            p95_duration_ms=percentiles['p95_duration'] if percentiles else 0,
            p99_duration_ms=percentiles['p99_duration'] if percentiles else 0,
            no_results_rate=metrics.get('no_results_rate', 0.0),
            unique_queries=metrics.get('unique_queries', 0),
            period_days=days
        )
    
    async def get_daily_metrics(
        self,
        shop_id: str,
        days: int = 30
    ) -> List[DailyMetrics]:
        """
        Get daily search metrics
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
        
        Returns:
            List of DailyMetrics
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    DATE_TRUNC('day', created_at) as date,
                    COUNT(*) as total_searches,
                    COUNT(*) FILTER (WHERE clicked_id IS NOT NULL) as total_clicks,
                    AVG(results_count) as avg_results,
                    AVG(duration_ms) as avg_duration_ms,
                    COUNT(*) FILTER (WHERE results_count = 0) as no_results_count
                FROM search_analytics
                WHERE shop_id = $1::UUID
                  AND created_at >= NOW() - INTERVAL '1 day' * $2
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date DESC
            """, shop_id, days)
        
        metrics = []
        for row in rows:
            total_searches = row['total_searches']
            total_clicks = row['total_clicks']
            no_results_count = row['no_results_count']
            
            metrics.append(DailyMetrics(
                date=row['date'],
                total_searches=total_searches,
                total_clicks=total_clicks,
                ctr=total_clicks / total_searches if total_searches > 0 else 0,
                avg_results=row['avg_results'] or 0,
                avg_duration_ms=row['avg_duration_ms'] or 0,
                no_results_count=no_results_count,
                no_results_rate=no_results_count / total_searches if total_searches > 0 else 0,
                unique_queries=0  # Could be computed with subquery
            ))
        
        return metrics
    
    # ==================== Click Position Analytics ====================
    
    async def get_click_distribution(
        self,
        shop_id: str,
        days: int = 30
    ) -> Dict[int, int]:
        """
        Get distribution of clicks by position (1st, 2nd, 3rd, etc.)
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
        
        Returns:
            Dictionary mapping position to count
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    click_position,
                    COUNT(*) as count
                FROM search_analytics
                WHERE shop_id = $1::UUID
                  AND created_at >= NOW() - INTERVAL '1 day' * $2
                  AND click_position IS NOT NULL
                  AND click_position <= 10
                GROUP BY click_position
                ORDER BY click_position
            """, shop_id, days)
        
        return {row['click_position']: row['count'] for row in rows}
    
    async def get_top_positions_metric(
        self,
        shop_id: str,
        days: int = 30
    ) -> Dict[str, float]:
        """
        Get metrics for top search positions (CTR by position)
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
        
        Returns:
            Dictionary with position metrics
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                WITH search_counts AS (
                    SELECT 
                        MIN(click_position) as min_position,
                        COUNT(*) FILTER (WHERE clicked_id IS NOT NULL) as clicks,
                        COUNT(*) as total
                    FROM search_analytics
                    WHERE shop_id = $1::UUID
                      AND created_at >= NOW() - INTERVAL '1 day' * $2
                      AND results_count > 0
                    GROUP BY id
                ),
                position_stats AS (
                    SELECT 
                        CASE 
                            WHEN min_position = 1 THEN 'position_1'
                            WHEN min_position <= 3 THEN 'position_2_3'
                            WHEN min_position <= 5 THEN 'position_4_5'
                            ELSE 'position_6_plus'
                        END as position_group,
                        SUM(clicks)::FLOAT as clicks,
                        SUM(total) as total
                    FROM search_counts
                    WHERE min_position IS NOT NULL
                    GROUP BY 
                        CASE 
                            WHEN min_position = 1 THEN 'position_1'
                            WHEN min_position <= 3 THEN 'position_2_3'
                            WHEN min_position <= 5 THEN 'position_4_5'
                            ELSE 'position_6_plus'
                        END
                )
                SELECT 
                    position_group,
                    clicks,
                    total,
                    clicks / total as ctr
                FROM position_stats
            """, shop_id, days)
        
        return {row['position_group']: row['ctr'] for row in rows}
    
    # ==================== Real-time Metrics ====================
    
    async def get_realtime_metrics(self, shop_id: str) -> Dict[str, Any]:
        """
        Get real-time search metrics (from in-memory cache)
        
        Args:
            shop_id: Shop UUID
        
        Returns:
            Dictionary with real-time metrics
        """
        async with self._lock:
            # Filter events by shop and recent activity
            recent_events = [
                e for e in self._realtime_events
                if e.shop_id == shop_id
                and e.timestamp > datetime.now() - timedelta(hours=1)
            ]
            
            if not recent_events:
                return {
                    'searches_last_hour': 0,
                    'avg_results': 0,
                    'avg_duration_ms': 0,
                    'queries_count': 0
                }
            
            return {
                'searches_last_hour': len(recent_events),
                'avg_results': statistics.mean([e.results_count for e in recent_events]),
                'avg_duration_ms': statistics.mean([e.duration_ms for e in recent_events]),
                'queries_count': len(set([e.query for e in recent_events]))
            }
    
    # ==================== Export ====================
    
    async def export_analytics(
        self,
        shop_id: str,
        days: int = 30,
        format: str = 'json'
    ) -> str:
        """
        Export search analytics data
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
            format: Export format (json, csv)
        
        Returns:
            Exported data as string
        """
        metrics = await self.get_search_metrics(shop_id, days)
        popular = await self.get_popular_queries(shop_id, days)
        empty = await self.get_empty_queries(shop_id, days)
        daily = await self.get_daily_metrics(shop_id, days)
        
        data = {
            'shop_id': shop_id,
            'period_days': days,
            'generated_at': datetime.now().isoformat(),
            'metrics': asdict(metrics),
            'popular_queries': [asdict(q) for q in popular],
            'empty_queries': empty[:50],
            'daily_metrics': [asdict(d) for d in daily]
        }
        
        if format == 'json':
            return json.dumps(data, indent=2, default=str)
        elif format == 'csv':
            # Simple CSV export of popular queries
            lines = ['query,count,avg_results,ctr']
            for q in popular[:100]:
                lines.append(f'"{q.query}",{q.count},{q.avg_results:.2f},{q.ctr:.4f}')
            return '\n'.join(lines)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    # ==================== Private Methods ====================
    
    async def _persist_search_event(self, event: SearchEvent):
        """
        Persist search event to database (fire-and-forget)
        
        Args:
            event: SearchEvent to persist
        """
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO search_analytics (
                        shop_id, user_id, query, query_type,
                        results_count, results_ids, duration_ms,
                        created_at, indexed_at
                    ) VALUES (
                        $1::UUID, $2::UUID, $3::TEXT, $4::VARCHAR,
                        $5::INTEGER, $6::UUID[], $7::INTEGER,
                        $8::TIMESTAMP WITH TIME ZONE, NOW()
                    )
                """, 
                    event.shop_id,
                    event.user_id,
                    event.query,
                    event.query_type,
                    event.results_count,
                    event.results_ids,
                    event.duration_ms,
                    event.timestamp
                )
        except Exception as e:
            logger.error(f"Failed to persist search event: {e}")


# ==================== Analytics Reporter ====================

class SearchAnalyticsReporter:
    """
    Generate reports from search analytics data
    """
    
    def __init__(self, analytics_manager: SearchAnalyticsManager):
        self.analytics = analytics_manager
        logger.info("SearchAnalyticsReporter initialized")
    
    async def generate_summary_report(
        self,
        shop_id: str,
        days: int = 30
    ) -> str:
        """
        Generate a human-readable summary report
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
        
        Returns:
            Formatted report string
        """
        metrics = await self.analytics.get_search_metrics(shop_id, days)
        popular = await self.analytics.get_popular_queries(shop_id, days, limit=10)
        empty = await self.analytics.get_empty_queries(shop_id, days, limit=5)
        trending = await self.analytics.get_trending_queries(shop_id, hours=24, limit=5)
        
        report = f"""
═══════════════════════════════════════════════════════════
           BARBERZAP - SEARCH ANALYTICS REPORT
═══════════════════════════════════════════════════════════

Shop ID: {shop_id}
Period: Last {days} days
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

───────────────────────────────────────────────────────────
📊 OVERALL METRICS
───────────────────────────────────────────────────────────
Total Searches:          {metrics.total_searches:,}
Total Clicks:            {metrics.total_clicks:,}
Click-Through Rate:      {metrics.ctr:.2%}
Unique Queries:          {metrics.unique_queries:,}
Empty Results Rate:      {metrics.no_results_rate:.2%}

───────────────────────────────────────────────────────────
⚡ PERFORMANCE
───────────────────────────────────────────────────────────
Avg. Results:            {metrics.avg_results:.2f}
Avg. Duration:           {metrics.avg_duration_ms:.0f}ms
95th Percentile:         {metrics.p95_duration_ms:.0f}ms
99th Percentile:         {metrics.p99_duration_ms:.0f}ms

───────────────────────────────────────────────────────────
🔥 TRENDING QUERIES (Last 24h)
───────────────────────────────────────────────────────────
"""
        
        for i, q in enumerate(trending[:5], 1):
            report += f"{i}. \"{q['query']}\" ({q['recent_count']} searches, +{q['growth_rate']:.1f}%)\n"
        
        report += f"""
───────────────────────────────────────────────────────────
🤖 POPULAR QUERIES
───────────────────────────────────────────────────────────
"""
        
        for i, q in enumerate(popular[:10], 1):
            report += f"{i}. \"{q.query}\" ({q.count}x, CTR: {q.ctr:.1%})\n"
        
        report += f"""
───────────────────────────────────────────────────────────
❌ QUERIES WITH NO RESULTS
───────────────────────────────────────────────────────────
"""
        
        for i, q in enumerate(empty[:5], 1):
            report += f"{i}. \"{q['query']}\" ({q['count']}x)\n"
        
        report += "═══════════════════════════════════════════════════════════\n"
        
        return report
    
    async def generate_csv_report(
        self,
        shop_id: str,
        days: int = 30
    ) -> str:
        """
        Generate CSV report of popular queries
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
        
        Returns:
            CSV formatted string
        """
        popular = await self.analytics.get_popular_queries(shop_id, days, limit=200)
        
        lines = [
            'query,count,avg_results,avg_duration_ms,ctr,first_seen,last_seen'
        ]
        
        for q in popular:
            lines.append(
                f'"{q.query}",{q.count},{q.avg_results:.2f},'
                f'{q.avg_duration_ms:.2f},{q.ctr:.4f},'
                f'{q.first_seen.isoformat() if q.first_seen else ""},'
                f'{q.last_seen.isoformat() if q.last_seen else ""}'
            )
        
        return '\n'.join(lines)


# ==================== Factory ====================

def create_analytics_manager(db_pool: asyncpg.Pool) -> SearchAnalyticsManager:
    """
    Create a SearchAnalyticsManager instance
    
    Args:
        db_pool: PostgreSQL connection pool
    
    Returns:
        SearchAnalyticsManager instance
    """
    return SearchAnalyticsManager(db_pool)


def create_analytics_reporter(
        analytics_manager: SearchAnalyticsManager
) -> SearchAnalyticsReporter:
    """Create a SearchAnalyticsReporter instance"""
    return SearchAnalyticsReporter(analytics_manager)
