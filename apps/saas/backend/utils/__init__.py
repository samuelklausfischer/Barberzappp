"""
BarberZap Backend Utils

Utilities package for BarberZap backend operations.
"""

from .conflict_resolution import (
    # Enums
    ConflictType,
    AtomicResultCode,
    
    # Exception
    ConflictResolutionError,
    
    # Data classes
    RetryConfig,
    ConflictStats,
    
    # Detection
    detect_conflict,
    detect_conflict_type,
    parse_atomic_result,
    
    # Logging
    log_conflict,
    log_conflict_async,
    
    # Statistics
    get_conflict_stats,
    get_recent_conflicts,
    
    # Retry
    handle_conflict_with_retry,
    handle_conflict_with_retry_async,
    
    # Decorators
    with_conflict_retry,
    with_conflict_retry_async,
    
    # Atomic operations
    book_appointment_atomic_sync,
    book_appointment_atomic_async,
)

__all__ = [
    # Enums
    'ConflictType',
    'AtomicResultCode',
    
    # Exception
    'ConflictResolutionError',
    
    # Data classes
    'RetryConfig',
    'ConflictStats',
    
    # Detection
    'detect_conflict',
    'detect_conflict_type',
    'parse_atomic_result',
    
    # Logging
    'log_conflict',
    'log_conflict_async',
    
    # Statistics
    'get_conflict_stats',
    'get_recent_conflicts',
    
    # Retry
    'handle_conflict_with_retry',
    'handle_conflict_with_retry_async',
    
    # Decorators
    'with_conflict_retry',
    'with_conflict_retry_async',
    
    # Atomic operations
    'book_appointment_atomic_sync',
    'book_appointment_atomic_async',
]
