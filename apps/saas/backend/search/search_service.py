"""
Search Service for BarberZap
Full-text search with fuzzy matching, highlights, and analytics
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from enum import Enum
import hashlib

import asyncpg
from typing_extensions import Literal

from ..config.redis_config import connection_config, ttl_config, build_key
from ..cache.cache_manager import CacheManager, CacheMetrics
from ..error import (
    get_error_handler,
    log_warning, log_error, log_debug
)


logger = logging.getLogger(__name__)


# ==================== Enums ====================

class QueryType(str, Enum):
    """Types of search queries"""
    CLIENTS = "clients"
    APPOINTMENTS = "appointments"
    HISTORY = "history"
    GLOBAL = "global"
    SUGGESTIONS = "suggestions"


class ClientStatus(str, Enum):
    """Client status filters"""
    ACTIVE = "active"  # Visit in last 90 days
    INACTIVE = "inactive"  # No visit in 90 days


class AppointmentStatus(str, Enum):
    """Appointment status filters"""
    SCHEDULED = "standard"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


# ==================== Search Results ====================

class SearchResult:
    """Base class for search results"""
    
    def __init__(self, id: str, rank: float, result: Dict[str, Any], result_type: str):
        self.id = id
        self.rank = rank
        self.result = result
        self.result_type = result_type
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'rank': round(self.rank, 3),
            'result_type': self.result_type,
            'data': self.result
        }


class ClientSearchResult(SearchResult):
    """Client search result with highlights"""
    
    def __init__(self, id: str, rank: float, similarity: float, 
                 highlights: Dict[str, str], client: Dict[str, Any]):
        super().__init__(id, rank, client, 'client')
        self.similarity = similarity
        self.highlights = highlights
    
    def to_dict(self) -> Dict[str, Any]:
        base = super().to_dict()
        base['similarity'] = round(self.similarity, 3)
        base['highlights'] = self.highlights
        return base


class AppointmentSearchResult(SearchResult):
    """Appointment search result with highlights"""
    
    def __init__(self, id: str, rank: float, highlights: Dict[str, str],
                 appointment: Dict[str, Any], client: Dict[str, Any]):
        super().__init__(id, rank, {**appointment, 'client': client}, 'appointment')
        self.highlights = highlights
    
    def to_dict(self) -> Dict[str, Any]:
        base = super().to_dict()
        base['highlights'] = self.highlights
        return base


class GlobalSearchResult(SearchResult):
    """Global search result (multiple types)"""
    
    def __init__(self, result_type: str, id: str, rank: float, result: Dict[str, Any]):
        super().__init__(id, rank, result, result_type)


class SuggestionResult:
    """Search suggestion result"""
    
    def __init__(self, suggestion: str, result_type: str, count: int):
        self.suggestion = suggestion
        self.result_type = result_type
        self.count = count
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'suggestion': self.suggestion,
            'result_type': self.result_type,
            'count': self.count
        }


# ==================== Search Analytics ====================

class SearchAnalytics:
    """Track search analytics"""
    
    def __init__(self):
        self.total_searches = 0
        self.total_clicks = 0
        self.queries = {}  # query -> count
        self.empty_queries = {}  # query -> count
        self.query_timestamps = {}
        self._lock = asyncio.Lock()
    
    async def log_search(self, query: str, results_count: int, duration_ms: int):
        """Log a search"""
        async with self._lock:
            self.total_searches += 1
            self.queries[query] = self.queries.get(query, 0) + 1
            self.query_timestamps[query] = datetime.now()
            
            if results_count == 0:
                self.empty_queries[query] = self.empty_queries.get(query, 0) + 1
    
    async def log_click(self, query: str, position: int):
        """Log a result click"""
        async with self._lock:
            self.total_clicks += 1
    
    def get_popular_queries(self, limit: int = 100) -> List[Tuple[str, int]]:
        """Get most popular queries"""
        return sorted(self.queries.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    def get_empty_queries(self, limit: int = 100) -> List[Tuple[str, int]]:
        """Get queries with no results"""
        return sorted(self.empty_queries.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get analytics metrics"""
        ctr = self.total_clicks / self.total_searches if self.total_searches > 0 else 0
        return {
            'total_searches': self.total_searches,
            'total_clicks': self.total_clicks,
            'ctr': round(ctr, 4),
            'unique_queries': len(self.queries),
            'empty_queries_count': len(self.empty_queries),
            'empty_queries_rate': len(self.empty_queries) / self.total_searches if self.total_searches > 0 else 0
        }


# ==================== Search Service ====================

class SearchService:
    """
    Full-text search service with:
    - PostgreSQL full-text search (GIN + tsvector)
    - Fuzzy matching (trigrams)
    - Highlighting
    - Analytics
    - Caching
    - Search history
    """
    
    def __init__(self, db_pool: asyncpg.Pool, cache_manager: CacheManager):
        self.db_pool = db_pool
        self.cache = cache_manager
        self.analytics = SearchAnalytics()
        logger.info("SearchService initialized")
    
    # ==================== Client Search ====================
    
    async def search_clients(
        self,
        shop_id: str,
        query: str,
        limit: int = 20,
        offset: int = 0,
        status: Optional[Literal["active", "inactive"]] = None,
        min_visits: Optional[int] = None,
        max_visits: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> Tuple[List[ClientSearchResult], int]:
        """
        Search clients with fuzzy matching and full-text search
        
        Args:
            shop_id: Shop UUID
            query: Search query
            limit: Maximum results
            offset: Pagination offset
            status: Filter by status (active/inactive)
            min_visits: Minimum total visits
            max_visits: Maximum total visits
            user_id: User UUID (for analytics)
        
        Returns:
            Tuple of (results, total_count)
        """
        start_time = time.time()
        
        # Check cache
        cache_key = build_key(
            'search',
            'clients',
            shop_id,
            f"{query}_{limit}_{offset}_{status or ''}_{min_visits or ''}_{max_visits or ''}"
        )
        
        cached = await self.cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for client search: {query}")
            cached_results = json.loads(cached)
            return (
                [ClientSearchResult(**r) for r in cached_results['results']],
                cached_results['total']
            )
        
        # Execute search
        async with self.db_pool.acquire() as conn:
            results = await conn.fetch("""
                SELECT * FROM search_clients(
                    p_shop_id := $1::UUID,
                    p_query := $2::TEXT,
                    p_limit := $3::INTEGER,
                    p_offset := $4::INTEGER,
                    p_status := $5::VARCHAR,
                    p_min_visits := $6::INTEGER,
                    p_max_visits := $7::INTEGER
                )
            """, shop_id, query, limit, offset, status, min_visits, max_visits)
        
        # Get total count
        async with self.db_pool.acquire() as conn:
            total_row = await conn.fetchrow("""
                SELECT COUNT(*) as total
                FROM clients c
                WHERE c.shop_id = $1::UUID
                  AND c.deleted_at IS NULL
            """, shop_id)
            total = total_row['total'] if total_row else 0
        
        # Convert to result objects
        search_results = []
        results_ids = []
        
        for row in results:
            client_data = dict(row['client'])
            highlights = dict(row['highlights'])
            
            result = ClientSearchResult(
                id=str(row['id']),
                rank=row['rank'],
                similarity=row['similarity'],
                highlights=highlights,
                client=client_data
            )
            search_results.append(result)
            results_ids.append(row['id'])
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Log analytics
        await self._log_search(
            shop_id=shop_id,
            user_id=user_id,
            query=query,
            query_type=QueryType.CLIENTS,
            results_count=len(results_ids),
            results_ids=results_ids,
            duration_ms=duration_ms
        )
        
        # Save to search history
        if query and len(query.strip()) >= 2:
            await self._save_search_history(
                shop_id=shop_id,
                user_id=user_id,
                query=query,
                query_type=QueryType.CLIENTS
            )
        
        # Cache results
        cache_data = {
            'results': [r.to_dict() for r in search_results],
            'total': total,
            'queried_at': datetime.now().isoformat()
        }
        await self.cache.set(
            cache_key,
            json.dumps(cache_data),
            ttl=ttl_config.short  # 5 minutes
        )
        
        return search_results, total
    
    # ==================== Appointment Search ====================
    
    async def search_appointments(
        self,
        shop_id: str,
        query: str,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        employee_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Tuple[List[AppointmentSearchResult], int]:
        """
        Search appointments with full-text search
        
        Args:
            shop_id: Shop UUID
            query: Search query
            limit: Maximum results
            offset: Pagination offset
            status: Filter by status
            date_from: Filter by date from
            date_to: Filter by date to
            employee_id: Filter by employee
            user_id: User UUID (for analytics)
        
        Returns:
            Tuple of (results, total_count)
        """
        start_time = time.time()
        
        # Check cache
        cache_key = build_key(
            'search',
            'appointments',
            shop_id,
            f"{query}_{limit}_{offset}_{status or ''}_{date_from or ''}_{date_to or ''}_{employee_id or ''}"
        )
        
        cached = await self.cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for appointment search: {query}")
            cached_results = json.loads(cached)
            return (
                [AppointmentSearchResult(**r) for r in cached_results['results']],
                cached_results['total']
            )
        
        # Execute search
        async with self.db_pool.acquire() as conn:
            results = await conn.fetch("""
                SELECT * FROM search_appointments(
                    p_shop_id := $1::UUID,
                    p_query := $2::TEXT,
                    p_limit := $3::INTEGER,
                    p_offset := $4::INTEGER,
                    p_status := $5::TEXT,
                    p_date_from := $6::TIMESTAMP WITH TIME ZONE,
                    p_date_to := $7::TIMESTAMP WITH TIME ZONE,
                    p_employee_id := $8::UUID
                )
            """, shop_id, query, limit, offset, status, date_from, date_to, employee_id)
        
        # Get total count
        async with self.db_pool.acquire() as conn:
            total_row = await conn.fetchrow("""
                SELECT COUNT(*) as total
                FROM appointments a
                WHERE a.shop_id = $1::UUID
            """, shop_id)
            total = total_row['total'] if total_row else 0
        
        # Convert to result objects
        search_results = []
        results_ids = []
        
        for row in results:
            appointment_data = dict(row['appointment'])
            client_data = dict(row['client'])
            highlights = dict(row['highlights'])
            
            result = AppointmentSearchResult(
                id=str(row['id']),
                rank=row['rank'],
                highlights=highlights,
                appointment=appointment_data,
                client=client_data
            )
            search_results.append(result)
            results_ids.append(row['id'])
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Log analytics
        await self._log_search(
            shop_id=shop_id,
            user_id=user_id,
            query=query,
            query_type=QueryType.APPOINTMENTS,
            results_count=len(results_ids),
            results_ids=results_ids,
            duration_ms=duration_ms
        )
        
        # Save to search history
        if query and len(query.strip()) >= 2:
            await self._save_search_history(
                shop_id=shop_id,
                user_id=user_id,
                query=query,
                query_type=QueryType.APPOINTMENTS
            )
        
        # Cache results
        cache_data = {
            'results': [r.to_dict() for r in search_results],
            'total': total,
            'queried_at': datetime.now().isoformat()
        }
        await self.cache.set(
            cache_key,
            json.dumps(cache_data),
            ttl=ttl_config.short
        )
        
        return search_results, total
    
    # ==================== Global Search ====================
    
    async def search_global(
        self,
        shop_id: str,
        query: str,
        limit_per_type: int = 5,
        user_id: Optional[str] = None
    ) -> List[GlobalSearchResult]:
        """
        Global search across multiple tables
        
        Args:
            shop_id: Shop UUID
            query: Search query
            limit_per_type: Maximum results per type
            user_id: User UUID (for analytics)
        
        Returns:
            List of search results
        """
        start_time = time.time()
        
        # Check cache
        cache_key = build_key('search', 'global', shop_id, f"{query}_{limit_per_type}")
        
        cached = await self.cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for global search: {query}")
            cached_results = json.loads(cached)
            return [GlobalSearchResult(**r) for r in cached_results]
        
        # Execute search
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM search_global(
                    p_shop_id := $1::UUID,
                    p_query := $2::TEXT,
                    p_limit_per_type := $3::INTEGER
                )
            """, shop_id, query, limit_per_type)
        
        # Convert to result objects
        search_results = []
        results_ids = []
        
        for row in rows:
            result = GlobalSearchResult(
                result_type=row['result_type'],
                id=str(row['id']),
                rank=row['rank'],
                result=dict(row['result'])
            )
            search_results.append(result)
            results_ids.append(row['id'])
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Log analytics
        await self._log_search(
            shop_id=shop_id,
            user_id=user_id,
            query=query,
            query_type=QueryType.GLOBAL,
            results_count=len(results_ids),
            results_ids=results_ids,
            duration_ms=duration_ms
        )
        
        # Save to search history
        if query and len(query.strip()) >= 2:
            await self._save_search_history(
                shop_id=shop_id,
                user_id=user_id,
                query=query,
                query_type=QueryType.GLOBAL
            )
        
        # Cache results
        cache_data = [r.to_dict() for r in search_results]
        await self.cache.set(
            cache_key,
            json.dumps(cache_data),
            ttl=ttl_config.short
        )
        
        return search_results
    
    # ==================== Suggestions ====================
    
    async def search_suggestions(
        self,
        shop_id: str,
        query: str,
        limit: int = 5
    ) -> List[SuggestionResult]:
        """
        Get search suggestions (autocomplete)
        
        Args:
            shop_id: Shop UUID
            query: Partial query
            limit: Maximum suggestions
        
        Returns:
            List of suggestions
        """
        if not query or len(query.strip()) < 2:
            return []
        
        # Check cache (very short TTL for suggestions)
        cache_key = build_key('search', 'suggestions', shop_id, f"{query[:30]}_{limit}")
        
        cached = await self.cache.get(cache_key)
        if cached:
            return [SuggestionResult(**r) for r in json.loads(cached)]
        
        # Execute search
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM search_suggestions(
                    p_shop_id := $1::UUID,
                    p_query := $2::TEXT,
                    p_limit := $3::INTEGER
                )
            """, shop_id, query, limit)
        
        # Convert to result objects
        suggestions = [
            SuggestionResult(
                suggestion=row['suggestion'],
                result_type=row['result_type'],
                count=row['count']
            )
            for row in rows
        ]
        
        # Cache with very short TTL
        await self.cache.set(
            cache_key,
            json.dumps([s.to_dict() for s in suggestions]),
            ttl=ttl_config.very_short  # 1 minute
        )
        
        return suggestions
    
    # ==================== Search History ====================
    
    async def get_recent_searches(
        self,
        shop_id: str,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent searches for a user
        
        Args:
            shop_id: Shop UUID
            user_id: User UUID
            limit: Maximum results
        
        Returns:
            List of recent searches
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM get_recent_searches(
                    p_shop_id := $1::UUID,
                    p_user_id := $2::UUID,
                    p_limit := $3::INTEGER
                )
            """, shop_id, user_id, limit)
        
        return [dict(row) for row in rows]
    
    async def save_search_history(
        self,
        shop_id: str,
        user_id: str,
        query: str,
        query_type: str
    ):
        """Explicitly save to search history"""
        await self._save_search_history(shop_id, user_id, query, query_type)
    
    # ==================== Analytics ====================
    
    async def get_popular_queries(
        self,
        shop_id: str,
        days: int = 30,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get popular search queries
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
            limit: Maximum results
        
        Returns:
            List of popular queries with metrics
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM get_popular_queries(
                    p_shop_id := $1::UUID,
                    p_days := $2::INTEGER,
                    p_limit := $3::INTEGER
                )
            """, shop_id, days, limit)
        
        return [dict(row) for row in rows]
    
    async def get_empty_queries(
        self,
        shop_id: str,
        days: int = 30,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get queries with no results (opportunities for improvement)
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
            limit: Maximum results
        
        Returns:
            List of empty queries
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM get_empty_queries(
                    p_shop_id := $1::UUID,
                    p_days := $2::INTEGER,
                    p_limit := $3::INTEGER
                )
            """, shop_id, days, limit)
        
        return [dict(row) for row in rows]
    
    async def get_search_metrics(
        self,
        shop_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get search metrics summary
        
        Args:
            shop_id: Shop UUID
            days: Number of days to look back
        
        Returns:
            Search metrics summary
        """
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM get_search_metrics(
                    p_shop_id := $1::UUID,
                    p_days := $2::INTEGER
                )
            """, shop_id, days)
        
        return dict(row) if row else {}
    
    async def log_search_click(
        self,
        shop_id: str,
        search_id: str,
        clicked_id: str,
        click_position: int
    ):
        """
        Log when a user clicks on a search result
        
        Args:
            shop_id: Shop UUID
            search_id: Search analytics ID
            clicked_id: ID of the clicked result
            click_position: Position of the clicked result
        """
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                SELECT log_search_click(
                    p_search_id := $1::UUID,
                    p_clicked_id := $2::UUID,
                    p_click_position := $3::INTEGER
                )
            """, search_id, clicked_id, click_position)
        
        # Update in-memory analytics
        await self.analytics.log_click("", click_position)
    
    # ==================== Private Methods ====================
    
    async def _log_search(
        self,
        shop_id: str,
        user_id: Optional[str],
        query: str,
        query_type: str,
        results_count: int,
        results_ids: List[str],
        duration_ms: int
    ) -> Optional[str]:
        """Log search to analytics table"""
        if not query or len(query.strip()) < 2:
            return None
        
        async with self.db_pool.acquire() as conn:
            try:
                row = await conn.fetchrow("""
                    SELECT log_search(
                        p_shop_id := $1::UUID,
                        p_query := $2::TEXT,
                        p_query_type := $3::VARCHAR,
                        p_results_count := $4::INTEGER,
                        p_results_ids := $5::UUID[],
                        p_duration_ms := $6::INTEGER,
                        p_filters := NULL::JSONB,
                        p_user_id := $7::UUID
                    )
                """, shop_id, query, query_type, results_count, results_ids, duration_ms, user_id)
                
                search_id = str(row['log_search']) if row else None
                
                # Update in-memory analytics
                await self.analytics.log_search(query, results_count, duration_ms)
                
                return search_id
            except Exception as e:
                logger.error(f"Failed to log search: {e}")
                return None
    
    async def _save_search_history(
        self,
        shop_id: str,
        user_id: Optional[str],
        query: str,
        query_type: str
    ):
        """Save search to user's search history"""
        if not user_id:
            return
        
        async with self.db_pool.acquire() as conn:
            try:
                await conn.execute("""
                    SELECT save_search_history(
                        p_shop_id := $1::UUID,
                        p_user_id := $2::UUID,
                        p_query := $3::TEXT,
                        p_query_type := $4::VARCHAR
                    )
                """, shop_id, user_id, query, query_type)
            except Exception as e:
                logger.error(f"Failed to save search history: {e}")
    
    # ==================== Cache Invalidation ====================
    
    async def invalidate_search_cache(
        self,
        shop_id: str,
        client_id: Optional[str] = None,
        appointment_id: Optional[str] = None
    ):
        """
        Invalidate cached search results
        
        Args:
            shop_id: Shop UUID
            client_id: Client UUID (optional)
            appointment_id: Appointment UUID (optional)
        """
        if client_id:
            pattern = build_key('search', '*', shop_id, '*')
            await self.cache.delete_pattern(pattern)
        elif appointment_id:
            pattern = build_key('search', '*', shop_id, '*')
            await self.cache.delete_pattern(pattern)
        else:
            pattern = build_key('search', '*', shop_id, '*')
            await self.cache.delete_pattern(pattern)
        
        logger.debug(f"Invalidated search cache for shop {shop_id}")


# ==================== Factory ====================

async def create_search_service(
    db_pool: asyncpg.Pool,
    cache_manager: CacheManager
) -> SearchService:
    """
    Create a SearchService instance
    
    Args:
        db_pool: PostgreSQL connection pool
        cache_manager: Cache manager instance
    
    Returns:
        SearchService instance
    """
    return SearchService(db_pool, cache_manager)
