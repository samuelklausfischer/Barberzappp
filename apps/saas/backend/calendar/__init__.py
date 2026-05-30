"""
BarberZap Calendar Integration Package

Integrações com calendários externos (Google, Outlook, Apple)
"""

from .google_calendar import GoogleCalendarService
from .ics_exporter import ICSExporter
from .exceptions import (
    CalendarIntegrationError,
    CalendarAuthError,
    CalendarSyncError,
    CalendarConflictError
)

__all__ = [
    'GoogleCalendarService',
    'ICSExporter',
    'CalendarIntegrationError',
    'CalendarAuthError',
    'CalendarSyncError',
    'CalendarConflictError',
]
