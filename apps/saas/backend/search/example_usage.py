"""
Example Usage of BarberZap Search System
Demonstrates how to use the SearchService and Analytics components
"""

import asyncio
import asyncpg
from datetime import datetime, timedelta

# Import the search components
from backend.cache.cache_manager import CacheManager
from backend.search.search_service import create_search_service
from backend.search.search_analytics import create_analytics_manager, create_analytics_reporter


async def main():
    """Main example"""
    
    # 1. Create database connection pool
    print("📊 Connecting to database...")
    db_pool = await asyncpg.create_pool(
        host='localhost',
        port=5432,
        user='postgres',
        password='your-password',
        database='barberzap',
        min_size=5,
        max_size=20
    )
    
    # 2. Create cache manager
    print("🗄️ Initializing cache...")
    cache_manager = CacheManager()
    
    # 3. Create search service
    print("🔍 Creating search service...")
    search_service = await create_search_service(db_pool, cache_manager)
    
    # 4. Create analytics manager
    print("📈 Creating analytics manager...")
    analytics_manager = create_analytics_manager(db_pool)
    analytics_reporter = create_analytics_reporter(analytics_manager)
    
    # ==================== EXAMPLES ====================
    
    # Example 1: Search clients
    print("\n" + "="*60)
    print("📋 Example 1: Search Clients")
    print("="*60)
    
    results, total = await search_service.search_clients(
        shop_id='your-shop-uuid',
        query='joão',
        limit=10
    )
    
    print(f"Found {len(results)} of {total} clients")
    for result in results[:3]:
        print(f"  - {result.result['name']} (similarity: {result.similarity:.2f})")
    
    # Example 2: Search with filters
    print("\n" + "="*60)
    print("📋 Example 2: Search Clients with Filters")
    print("="*60)
    
    results, total = await search_service.search_clients(
        shop_id='your-shop-uuid',
        query='',
        limit=20,
        status='active',
        min_visits=5
    )
    
    print(f"Found {len(results)} active clients with 5+ visits")
    
    # Example 3: Search appointments
    print("\n" + "="*60)
    print("📋 Example 3: Search Appointments")
    print("="*60)
    
    results, total = await search_service.search_appointments(
        shop_id='your-shop-uuid',
        query='corte cabelo',
        limit=10,
        date_from=datetime.now() - timedelta(days=30)
    )
    
    print(f"Found {len(results)} appointments matching 'corte cabelo'")
    for result in results[:2]:
        client_name = result.result['client']['name']
        date = result.result['scheduled_at'].strftime('%d/%m/%Y')
        print(f"  - {client_name} on {date}")
    
    # Example 4: Global search
    print("\n" + "="*60)
    print("📋 Example 4: Global Search")
    print("="*60)
    
    results = await search_service.search_global(
        shop_id='your-shop-uuid',
        query='maria',
        limit_per_type=3
    )
    
    print(f"Found {len(results)} results across all tables")
    for result in results[:5]:
        print(f"  [{result.result_type}] {result.rank:.2f}: {result.result}")
    
    # Example 5: Search suggestions (autocomplete)
    print("\n" + "="*60)
    print("📋 Example 5: Search Suggestions")
    print("="*60)
    
    suggestions = await search_service.search_suggestions(
        shop_id='your-shop-uuid',
        query='car',
        limit=5
    )
    
    print(f"Suggestions for 'car':")
    for suggestion in suggestions:
        print(f"  - {suggestion.suggestion} ({suggestion.result_type}, {suggestion.count}x)")
    
    # Example 6: Recent searches
    print("\n" + "="*60)
    print("📋 Example 6: Recent Searches")
    print("="*60)
    
    recent = await search_service.get_recent_searches(
        shop_id='your-shop-uuid',
        user_id='user-uuid',
        limit=5
    )
    
    print(f"Recent searches:")
    for item in recent:
        print(f"  - {item['query']} ({item['search_count']}x, {item['last_searched_at']})")
    
    # Example 7: Analytics - Popular queries
    print("\n" + "="*60)
    print("📋 Example 7: Popular Queries")
    print("="*60)
    
    popular = await analytics_manager.get_popular_queries(
        shop_id='your-shop-uuid',
        days=30,
        limit=10
    )
    
    print(f"Top 10 queries (last 30 days):")
    for query in popular:
        print(f"  {query.count:3d}x - {query.query} (CTR: {query.ctr:.1%})")
    
    # Example 8: Analytics - Empty queries
    print("\n" + "="*60)
    print("📋 Example 8: Empty Queries")
    print("="*60)
    
    empty = await analytics_manager.get_empty_queries(
        shop_id='your-shop-uuid',
        days=30,
        limit=10
    )
    
    print(f"Queries with no results (last 30 days):")
    for query in empty[:5]:
        print(f"  - {query['query']} ({query['count']}x)")
        print(f"    First: {query['first_seen']}")
        print(f"    Last: {query['last_seen']}")
    
    # Example 9: Analytics - Overall metrics
    print("\n" + "="*60)
    print("📋 Example 9: Search Metrics")
    print("="*60)
    
    metrics = await analytics_manager.get_search_metrics(
        shop_id='your-shop-uuid',
        days=30
    )
    
    print(f"Search metrics (last {metrics.period_days} days):")
    print(f"  Total searches: {metrics.total_searches:,}")
    print(f"  Total clicks: {metrics.total_clicks:,}")
    print(f"  CTR: {metrics.ctr:.2%}")
    print(f"  Avg results: {metrics.avg_results:.2f}")
    print(f"  Avg duration: {metrics.avg_duration_ms:.0f}ms")
    print(f"  P95 duration: {metrics.p95_duration_ms:.0f}ms")
    print(f"  No results rate: {metrics.no_results_rate:.2%}")
    print(f"  Unique queries: {metrics.unique_queries:,}")
    
    # Example 10: Generate report
    print("\n" + "="*60)
    print("📋 Example 10: Generate Analytics Report")
    print("="*60)
    
    report = await analytics_reporter.generate_summary_report(
        shop_id='your-shop-uuid',
        days=30
    )
    
    print(report)
    
    # Example 11: Export CSV
    print("\n" + "="*60)
    print("📋 Example 11: Export CSV")
    print("="*60)
    
    csv_data = await analytics_reporter.generate_csv_report(
        shop_id='your-shop-uuid',
        days=30
    )
    
    print(f"CSV data (first 500 chars):")
    print(csv_data[:500])
    print("...")
    
    # ==================== CLEANUP ====================
    
    print("\n" + "="*60)
    print("🧹 Cleaning up...")
    print("="*60)
    
    await db_pool.close()
    print("✅ Database pool closed")
    
    print("\n✅ All examples completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
