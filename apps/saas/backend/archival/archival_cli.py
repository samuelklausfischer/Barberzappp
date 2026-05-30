"""
BarberZap - Archival CLI Module

Command-line interface for managing data archival operations.

Commands:
- archival stats - Show table sizes and archival status
- archival run <type> - Run archival for specific table type
- archival summary - Show aggregated statistics
- archival cleanup - Clean up old logs
- archival restore - Restore records from archived tables
"""

import sys
import json
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, date

import click

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import dependencies
try:
    from .archival_job import (
        ArchivalJob,
        ArchivalType,
        queue_clients_archive,
        queue_appointments_archive,
        queue_messages_archive,
        queue_activity_logs_archive,
        queue_all_archive,
    )
    from ..config.redis_config import RedisConnection
    from ..config.supabase_config import SupabaseConfig
    CLI_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Some archival modules not available: {e}")
    CLI_AVAILABLE = False


# ==================== CLI Group ====================

@click.group()
def archival_cli():
    """
    BarberZap Data Archival CLI

    Manage data archival operations for clients, appointments,
    messages, and activity logs.
    """
    pass


# ==================== STATS COMMANDS ====================

@archival_cli.group()
def stats():
    """Archival statistics commands"""
    pass


@stats.command()
@click.option('--shop-id', '-s', help='Filter by shop ID')
@click.option('--format', '-f', type=click.Choice(['table', 'json']), default='table', help='Output format')
async def table_sizes(shop_id: Optional[str], format: str):
    """Show table sizes and row counts"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        supabase = SupabaseConfig.get_client()

        # Call PostgreSQL function to get table sizes
        result = (supabase.rpc('get_table_size_stats')
                 .execute())

        if format == 'json':
            click.echo(json.dumps(result.data, indent=2, default=str))
        else:
            # Table format output
            click.echo("\n" + "="*100)
            click.echo("TABLE SIZE STATISTICS")
            click.echo("="*100)
            click.echo(f"{'Table':<30} {'Rows':>12} {'Table Size':>15} {'Index Size':>15} {'Total Size':>15}")
            click.echo("-"*100)

            for row in result.data:
                click.echo(
                    f"{row['table_name']:<30} "
                    f"{row['total_rows']:>12,} "
                    f"{row['table_size']:>15} "
                    f"{row['index_size']:>15} "
                    f"{row['total_size']:>15}"
                )

            click.echo("="*100 + "\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@stats.command()
@click.option('--format', '-f', type=click.Choice(['table', 'json']), default='table', help='Output format')
async def archival_status(format: str):
    """Show current archival status (active vs archived)"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        supabase = SupabaseConfig.get_client()

        # Query materialized view or calculate status
        result = (supabase.table('archival_statistics')
                 .select('*')
                 .execute())

        if format == 'json':
            click.echo(json.dumps(result.data, indent=2, default=str))
        else:
            click.echo("\n" + "="*120)
            click.echo("ARCHIVAL STATUS SUMMARY")
            click.echo("="*120)
            click.echo(
                f"{'Table':<20} {'Total Archived':>15} {'First Archived':>20} "
                f"{'Last Archived':>20} {'Shops Affected':>15}"
            )
            click.echo("-"*120)

            for row in result.data:
                click.echo(
                    f"{row['table_name']:<20} "
                    f"{row['total_archived']:>15,} "
                    f"{row['first_archived'] or 'N/A':>20} "
                    f"{row['last_archived'] or 'N/A':>20} "
                    f"{row['shops_affected']:>15,}"
                )

            click.echo("="*120 + "\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@stats.command()
@click.option('--start-date', '-s', type=click.DateTime(['%Y-%m-%d']), help='Start date')
@click.option('--end-date', '-e', type=click.DateTime(['%Y-%m-%d']), help='End date')
@click.option('--table', '-t', help='Filter by table name')
@click.option('--format', '-f', type=click.Choice(['table', 'json']), default='table', help='Output format')
async def operations(start_date: Optional[datetime], end_date: Optional[datetime], table: Optional[str], format: str):
    """Show archival operations statistics"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        supabase = SupabaseConfig.get_client()

        # Call function to get statistics
        result = (supabase.rpc('get_archival_statistics', {
            'p_start_date': start_date.date() if start_date else None,
            'p_end_date': end_date.date() if end_date else None,
            'p_table_name': table
        }).execute())

        if format == 'json':
            click.echo(json.dumps(result.data, indent=2, default=str))
        else:
            click.echo("\n" + "="*110)
            click.echo("ARCHIVAL OPERATIONS STATISTICS")
            click.echo("="*110)
            click.echo(
                f"{'Table':<20} {'Operations':>12} {'Archived':>12} {'Success':>10} "
                f"{'Failed':>8} {'Avg Duration':>15} {'Avg Records':>12}"
            )
            click.echo("-"*110)

            for row in result.data:
                click.echo(
                    f"{row['table_name']:<20} "
                    f"{row['total_operations']:>12,} "
                    f"{row['total_records_archived']:>12,} "
                    f"{row['successful_operations']:>10} "
                    f"{row['failed_operations']:>8} "
                    f"{row['avg_duration_seconds']:>14.2f}s "
                    f"{row['avg_records_per_operation']:>12,.1f}"
                )

            click.echo("="*110 + "\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


# ==================== RUN COMMANDS ====================

@archival_cli.group()
def run():
    """Run archival operations"""
    pass


@run.command('clients')
@click.option('--months', '-m', default=24, help='Archive clients inactive for this many months')
@click.option('--shop-id', '-s', help='Archive only for specific shop')
@click.option('--batch-size', '-b', default=1000, help='Batch size for processing')
@click.option('--dry-run', is_flag=True, help='Simulate without making changes')
@click.option('--performed-by', default='cli_user', help='User performing the operation')
async def run_clients(months: int, shop_id: Optional[str], batch_size: int, dry_run: bool, performed_by: str):
    """Archive inactive clients (older than specified months)"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        # Get Redis connection and Queue
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        click.echo(f"\n{'='*60}")
        click.echo(f"ARCHIVING CLIENTS")
        click.echo(f"{'='*60}")
        click.echo(f"Criteria: Inactive for {months}+ months")
        click.echo(f"Shop ID: {shop_id or 'All shops'}")
        click.echo(f"Batch size: {batch_size:,}")
        click.echo(f"Dry run: {dry_run}")
        click.echo(f"{'='*60}\n")

        if dry_run:
            click.echo("DRY RUN MODE - No changes will be made\n")

        confirmation = click.confirm(f'Ready to archive clients? (dry-run={dry_run})', default=not dry_run)
        if not confirmation:
            click.echo("Operation cancelled")
            return

        click.echo("Queuing archival job...")
        job = await queue_clients_archive(
            queue=queue,
            shop_id=shop_id,
            months=months,
            dry_run=dry_run,
            performed_by=performed_by
        )

        click.echo(f"✓ Job queued successfully")
        click.echo(f"  Job ID: {job.id}")
        click.echo(f"  Type: {job.data.get('archival_type')}")
        click.echo(f"\nMonitor progress with: archival operations --job-id {job.id}\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@run.command('appointments')
@click.option('--months', '-m', default=12, help='Archive appointments older than this many months')
@click.option('--shop-id', '-s', help='Archive only for specific shop')
@click.option('--batch-size', '-b', default=1000, help='Batch size for processing')
@click.option('--dry-run', is_flag=True, help='Simulate without making changes')
@click.option('--performed-by', default='cli_user', help='User performing the operation')
async def run_appointments(months: int, shop_id: Optional[str], batch_size: int, dry_run: bool, performed_by: str):
    """Archive completed/cancelled appointments"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        click.echo(f"\n{'='*60}")
        click.echo(f"ARCHIVING APPOINTMENTS")
        click.echo(f"{'='*60}")
        click.echo(f"Criteria: Older than {months} months")
        click.echo(f"Shop ID: {shop_id or 'All shops'}")
        click.echo(f"Batch size: {batch_size:,}")
        click.echo(f"Dry run: {dry_run}")
        click.echo(f"{'='*60}\n")

        if dry_run:
            click.echo("DRY RUN MODE - No changes will be made\n")

        confirmation = click.confirm(f'Ready to archive appointments? (dry-run={dry_run})', default=not dry_run)
        if not confirmation:
            click.echo("Operation cancelled")
            return

        click.echo("Queuing archival job...")
        job = await queue_appointments_archive(
            queue=queue,
            shop_id=shop_id,
            months=months,
            dry_run=dry_run,
            performed_by=performed_by
        )

        click.echo(f"✓ Job queued successfully")
        click.echo(f"  Job ID: {job.id}")
        click.echo(f"  Type: {job.data.get('archival_type')}")
        click.echo(f"\nMonitor progress with: archival operations --job-id {job.id}\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@run.command('messages')
@click.option('--months', '-m', default=18, help='Archive messages older than this many months')
@click.option('--shop-id', '-s', help='Archive only for specific shop')
@click.option('--batch-size', '-b', default=1000, help='Batch size for processing')
@click.option('--dry-run', is_flag=True, help='Simulate without making changes')
@click.option('--performed-by', default='cli_user', help='User performing the operation')
async def run_messages(months: int, shop_id: Optional[str], batch_size: int, dry_run: bool, performed_by: str):
    """Archive old messages"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        click.echo(f"\n{'='*60}")
        click.echo(f"ARCHIVING MESSAGES")
        click.echo(f"{'='*60}")
        click.echo(f"Criteria: Older than {months} months")
        click.echo(f"Shop ID: {shop_id or 'All shops'}")
        click.echo(f"Batch size: {batch_size:,}")
        click.echo(f"Dry run: {dry_run}")
        click.echo(f"{'='*60}\n")

        if dry_run:
            click.echo("DRY RUN MODE - No changes will be made\n")

        confirmation = click.confirm(f'Ready to archive messages? (dry-run={dry_run})', default=not dry_run)
        if not confirmation:
            click.echo("Operation cancelled")
            return

        click.echo("Queuing archival job...")
        job = await queue_messages_archive(
            queue=queue,
            shop_id=shop_id,
            months=months,
            dry_run=dry_run,
            performed_by=performed_by
        )

        click.echo(f"✓ Job queued successfully")
        click.echo(f"  Job ID: {job.id}")
        click.echo(f"  Type: {job.data.get('archival_type')}")
        click.echo(f"\nMonitor progress with: archival operations --job-id {job.id}\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@run.command('activity-logs')
@click.option('--months', '-m', default=6, help='Archive activity logs older than this many months')
@click.option('--shop-id', '-s', help='Archive only for specific shop')
@click.option('--batch-size', '-b', default=5000, help='Batch size for processing')
@click.option('--dry-run', is_flag=True, help='Simulate without making changes')
@click.option('--performed-by', default='cli_user', help='User performing the operation')
async def run_activity_logs(months: int, shop_id: Optional[str], batch_size: int, dry_run: bool, performed_by: str):
    """Archive old activity logs"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        click.echo(f"\n{'='*60}")
        click.echo(f"ARCHIVING ACTIVITY LOGS")
        click.echo(f"{'='*60}")
        click.echo(f"Criteria: Older than {months} months")
        click.echo(f"Shop ID: {shop_id or 'All shops'}")
        click.echo(f"Batch size: {batch_size:,}")
        click.echo(f"Dry run: {dry_run}")
        click.echo(f"{'='*60}\n")

        if dry_run:
            click.echo("DRY RUN MODE - No changes will be made\n")

        confirmation = click.confirm(f'Ready to archive activity logs? (dry-run={dry_run})', default=not dry_run)
        if not confirmation:
            click.echo("Operation cancelled")
            return

        click.echo("Queuing archival job...")
        job = await queue_activity_logs_archive(
            queue=queue,
            shop_id=shop_id,
            months=months,
            dry_run=dry_run,
            performed_by=performed_by
        )

        click.echo(f"✓ Job queued successfully")
        click.echo(f"  Job ID: {job.id}")
        click.echo(f"  Type: {job.data.get('archival_type')}")
        click.echo(f"\nMonitor progress with: archival operations --job-id {job.id}\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@run.command('all')
@click.option('--shop-id', '-s', help='Archive only for specific shop')
@click.option('--dry-run', is_flag=True, help='Simulate without making changes')
@click.option('--performed-by', default='cli_user', help='User performing the operation')
async def run_all(shop_id: Optional[str], dry_run: bool, performed_by: str):
    """Archive all eligible data (clients, appointments, messages, logs)"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        redis_conn = RedisConnection.get_connection()
        from bullmq import Queue
        queue = Queue('archival', { connection: redis_conn })

        click.echo(f"\n{'='*60}")
        click.echo(f"ARCHIVING ALL DATA")
        click.echo(f"{'='*60}")
        click.echo(f"Shop ID: {shop_id or 'All shops'}")
        click.echo(f"Dry run: {dry_run}")
        click.echo(f"{'='*60}")
        click.echo("Will archive:")
        click.echo("  - Clients inactive for 24+ months")
        click.echo("  - Appointments older than 12+ months")
        click.echo("  - Messages older than 18+ months")
        click.echo("  - Activity logs older than 6+ months")
        click.echo(f"{'='*60}\n")

        if dry_run:
            click.echo("DRY RUN MODE - No changes will be made\n")

        confirmation = click.confirm(f'Ready to archive all data? (dry-run={dry_run})', default=False)
        if not confirmation:
            click.echo("Operation cancelled")
            return

        click.echo("Queuing archival job...")
        job = await queue_all_archive(
            queue=queue,
            shop_id=shop_id,
            dry_run=dry_run,
            performed_by=performed_by,
        )

        click.echo(f"✓ Job queued successfully")
        click.echo(f"  Job ID: {job.id}")
        click.echo(f"  Type: {job.data.get('archival_type')}")
        click.echo(f"\nMonitor progress with: archival operations --job-id {job.id}\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


# ==================== SUMMARY COMMANDS ====================

@archival_cli.command('summary')
@click.option('--year', '-y', type=int, help='Filter by year')
@click.option('--format', '-f', type=click.Choice(['table', 'json']), default='table', help='Output format')
async def summary(year: Optional[int], format: str):
    """Show aggregated archival summary statistics"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        supabase = SupabaseConfig.get_client()

        # Build query
        query = supabase.table('archival_operations_stats').select('*')

        if year:
            start_date = date(year, 1, 1)
            end_date = date(year, 12, 31)
            query = query.gte('stat_date', start_date).lte('stat_date', end_date)

        query = query.order('stat_date', desc=True)
        result = query.execute()

        if format == 'json':
            click.echo(json.dumps(result.data, indent=2, default=str))
        else:
            click.echo("\n" + "="*100)
            click.echo("ARCHIVAL SUMMARY STATISTICS")
            if year:
                click.echo(f"Year: {year}")
            click.echo("="*100)
            click.echo(
                f"{'Date':<12} {'Table':<20} {'Records':>12} {'Ops':>6} "
                f"{'Success':>8} {'Failed':>8} {'Avg Duration':>15}"
            )
            click.echo("-"*100)

            for row in result.data:
                click.echo(
                    f"{row['stat_date']:<12} "
                    f"{row['table_name']:<20} "
                    f"{row['total_records_archived']:>12,} "
                    f"{row['operations_count']:>6} "
                    f"{row['successful_operations']:>8} "
                    f"{row['failed_operations']:>8} "
                    f"{row['avg_duration_seconds']:>14.2f}s"
                )

            click.echo("="*100 + "\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


# ==================== CLEANUP COMMANDS ====================

@archival_cli.command('cleanup')
@click.option('--days', '-d', default=90, help='Retention period in days')
@click.option('--dry-run', is_flag=True, help='Simulate without making changes')
@click.option('--confirm', is_flag=True, help='Skip confirmation prompt')
async def cleanup(days: int, dry_run: bool, confirm: bool):
    """Clean up old archival logs"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        supabase = SupabaseConfig.get_client()

        click.echo(f"\n{'='*60}")
        click.echo(f"CLEANUP ARCHIVAL LOGS")
        click.echo(f"{'='*60}")
        click.echo(f"Retention period: {days} days")
        click.echo(f"Dry run: {dry_run}")
        click.echo(f"{'='*60}\n")

        if dry_run:
            click.echo("DRY RUN MODE - No changes will be made\n")

        if not confirm:
            confirmation = click.confirm(f'Delete logs older than {days} days?', default=False)
            if not confirmation:
                click.echo("Operation cancelled")
                return

        # Call cleanup function
        result = (supabase.rpc('cleanup_archival_logs', {
            'p_retention_days': days,
            'p_dry_run': dry_run
        }).execute())

        if result.data:
            data = result.data
            if data.get('dry_run'):
                click.echo(f"\nDRY RUN RESULTS:")
                click.echo(f"  Operations to delete: {data.get('operations_to_delete', 0):,}")
                click.echo(f"  Access logs to delete: {data.get('access_logs_to_delete', 0):,}")
            else:
                click.echo(f"\n✓ Logs cleaned up successfully")
                click.echo(f"  Operations deleted: {data.get('operations_deleted', 0):,}")
                click.echo(f"  Access logs deleted: {data.get('access_logs_deleted', 0):,}")

        click.echo()

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


# ==================== RESTORE COMMANDS ====================

@archival_cli.command('restore')
@click.option('--appointment-id', '-a', type=click.UUID, help='Appointment ID to restore')
@click.option('--client-id', '-c', type=click.UUID, help='Client ID to restore')
@click.option('--reason', '-r', help='Reason for restoration')
@click.option('--performed-by', default='cli_user', help='User performing the operation')
async def restore(
    appointment_id: Optional[str],
    client_id: Optional[str],
    reason: Optional[str],
    performed_by: str
):
    """Restore records from archived tables (emergency use only)"""
    if not (appointment_id or client_id):
        click.echo("Error: Must specify --appointment-id or --client-id", err=True)
        sys.exit(1)

    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        supabase = SupabaseConfig.get_client()

        click.echo(f"\n{'='*60}")
        click.echo(f"RESTORE RECORD FROM ARCHIVE")
        click.echo(f"{'='*60}")

        if appointment_id:
            click.echo(f"Appointment ID: {appointment_id}")
        if client_id:
            click.echo(f"Client ID: {client_id}")

        click.echo(f"Reason: {reason or 'Not specified'}")
        click.echo(f"Performed by: {performed_by}")
        click.echo(f"{'='*60}\n")

        confirmation = click.confirm('Restore this record? This is an emergency operation.')
        if not confirmation:
            click.echo("Operation cancelled")
            return

        # Call restore function
        result = (supabase.rpc('procedure_restore_appointment', {
            'p_appointment_id': str(appointment_id) if appointment_id else None,
            'p_performed_by': performed_by
        }).execute())

        if result.data:
            data = result.data
            if data.get('success'):
                click.echo(f"\n✓ Record restored successfully")
                click.echo(f"  Record ID: {data.get('appointment_id')}")
                click.echo(f"  Message: {data.get('message')}")
            else:
                click.echo(f"\n✗ Failed to restore record")
                click.echo(f"  Message: {data.get('message')}")

        click.echo()

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


# ==================== OPERATIONS COMMAND ====================

@archival_cli.group()
def operations():
    """Monitor archival operations"""
    pass


@operations.command('list')
@click.option('--limit', '-l', default=20, help='Number of operations to show')
@click.option('--format', '-f', type=click.Choice(['table', 'json']), default='table', help='Output format')
async def list_operations(limit: int, format: str):
    """List recent archival operations"""
    if not CLI_AVAILABLE:
        click.echo("Error: Required modules not available", err=True)
        sys.exit(1)

    try:
        supabase = SupabaseConfig.get_client()

        result = (supabase.table('archival_operations_log')
                 .select('*')
                 .order('started_at', desc=True)
                 .limit(limit)
                 .execute())

        if format == 'json':
            click.echo(json.dumps(result.data, indent=2, default=str))
        else:
            click.echo("\n" + "="*130)
            click.echo("RECENT ARCHIVAL OPERATIONS")
            click.echo("="*130)
            click.echo(
                f"{'Started':<20} {'Type':<12} {'Table':<20} {'Status':<12} "
                f"{'Records':>10} {'Duration':>10} {'Performed By':<20}"
            )
            click.echo("-"*130)

            for row in result.data:
                started = datetime.fromisoformat(row['started_at']).strftime('%Y-%m-%d %H:%M:%S')
                duration = f"{row.get('duration_seconds', 0):.1f}s" if row.get('duration_seconds') else 'N/A'
                status_emoji = {
                    'completed': '✓',
                    'failed': '✗',
                    'in_progress': '⟳',
                    'cancelled': '⊘'
                }.get(row['status'], '?')

                click.echo(
                    f"{started:<20} "
                    f"{status_emoji} {row['operation_type']:<10} "
                    f"{row['table_name']:<20} "
                    f"{row['status']:<12} "
                    f"{row['records_affected']:>10,} "
                    f"{duration:>10} "
                    f"{row['performed_by']:<20}"
                )

            click.echo("="*130 + "\n")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


# ==================== MAIN ENTRY POINT ====================

if __name__ == '__main__':
    archival_cli()
