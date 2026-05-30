"""
Search Module for BarberZap
Full-text search with fuzzy matching, highlights, and analytics
"""

from .search_service import (
    SearchService,
    SearchResult,
    ClientSearchResult,
    AppointmentSearchResult,
    GlobalSearchResult,
    SuggestionResult,
    QueryType,
    ClientStatus,
    AppointmentStatus,
    create_search_service
)

from .search_analytics import (
    SearchAnalyticsManager,
    SearchAnalyticsReporter,
    SearchEvent,
    QueryStats,
    DailyMetrics,
    SearchPerformanceMetrics,
    create_analytics_manager,
    create_analytics_reporter
)

__all__ = [
    # Search Service
    'SearchService',
    'SearchResult',
    'ClientSearchResult',
    'AppointmentSearchResult',
    'GlobalSearchResult',
    'SuggestionResult',
    'QueryType',
    'ClientStatus',
    'AppointmentStatus',
    'create_search_service',
    
    # Analytics
    'SearchAnalyticsManager',
    'SearchAnalyticsReporter',
    'SearchEvent',
    'QueryStats',
    'DailyMetrics',
    'SearchPerformanceMetrics',
    'create_analytics_manager',
    'create_analytics_reporter',
]
