"""
BarberZap - Data Archival Module

This module provides comprehensive data archival capabilities for BarberZap,
including:

1. Archival Tables (PostgreSQL partitioned tables)
2. Archival Policies & Procedures (SQL stored functions)
3. BullMQ Jobs (async archival processing)
4. CLI Tools (command-line management)
5. API Endpoints (FastAPI routes)
6. Admin Dashboard (React component)

Features:
- Partitioned archival tables (by year/quarter/month)
- Row Level Security (superadmin only)
- Read-only archived tables
- Automatic batch processing
- Progress tracking
- Audit trail
- Materialized views for statistics
- Emergency restore capability

Usage:
    # CLI
    python -m backend.archival.archival_cli stats

    # API
    POST /api/archival/archive/clients
    GET /api/archival/stats

    # Direct import
    from backend.archival import ArchivalJob, ArchivalCLI
"""

from .archival_job import (
    ArchivalJob,
    ArchivalType,
    ArchivalStatus,
    ArchivalResult,
    queue_clients_archive,
    queue_appointments_archive,
    queue_messages_archive,
    queue_activity_logs_archive,
    queue_all_archive,
)

from .archival_api import router as archival_api_router

__all__ = [
    'ArchivalJob',
    'ArchivalType',
    'ArchivalStatus',
    'ArchivalResult',
    'queue_clients_archive',
    'queue_appointments_archive',
    'queue_messages_archive',
    'queue_activity_logs_archive',
    'queue_all_archive',
    'archival_api_router',
]

__version__ = '1.0.0'
