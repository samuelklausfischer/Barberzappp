"""
BarberZap - Data Cleanup Module

Provides automated cleanup of temporary and expired data.

Components:
- cleanup_job: BullMQ jobs for async cleanup
- cleanup_api: FastAPI endpoints for management
- cleanup_cli: CLI tools for manual operations
- cleanup_safety: Safety checks and validations
- cleanup_healthcheck: Health monitoring and alerts
"""

__version__ = "1.0.0"
