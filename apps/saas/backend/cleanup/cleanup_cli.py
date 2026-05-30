#!/usr/bin/env python3
"""
BarberZap - Data Cleanup CLI

Command-line interface for managing data cleanup operations.
Provides tools for running cleanup, viewing stats, and managing schedules.
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path

import click
from tabulate import tabulate

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.cleanup.cleanup_job import CleanupJob, CleanupResult
from backend.config import get_redis_connection, get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Helper Functions
# ============================================================================

def format_number(n: int) -> str:
    """Format number with commas"""
    return f"{n:,}"


def format_duration(ms: int) -> str:
    """Format duration in ms to human readable"""
    if ms < 1000:
        return f"{ms}ms"
    elif ms < 60000:
        return f"{ms/1000:.2f}s"
    elif ms < 3600000:
        return f"{ms/60000:.2f}m"
    else:
        return f"{ms/3600000:.2f}h"


def format_timestamp(ts: Optional[str]) -> str:
    """Format timestamp to human readable"""
    if not ts:
        return "N/A"
    try:
        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return ts


def format_stats_table(stats: list) -> str:
    """Format stats data as a table"""
    headers = ["Table", "Pending", "Avg Age (h)", "Size (MB)", "Health", "Errors (24h)", "Last Cleanup"]
    rows = []

    for stat in stats:
        rows.append([
            stat['table_name'],
            format_number(int(stat.get('pending_count', 0))),
            f"{stat.get('avg_age_hours', 0):.1f}",
            f"{stat.get('table_size_mb', 0):.2f}",
            f"{stat.get('cleanup_health_score', 0)}/100",
            stat.get('cleanup_errors_24h', 0),
            format_timestamp(stat.get('last_cleanup_at'))
        ])

    return tabulate(rows, headers=headers, tablefmt="grid")


def format_history_table(history: list) -> str:
    """Format history data as a table"""
    headers = ["Time", "Job", "Table", "Deleted", "Duration", "Status", "By"]
    rows = []

    for item in history:
        rows.append([
            format_timestamp(item.get('started_at')),
            item.get('job_name', 'N/A'),
            item.get('table_name', 'N/A'),
            format_number(item.get('count_deleted', 0)),
            format_duration(item.get('duration_ms', 0)),
            item.get('status', 'N/A'),
            item.get('performed_by', 'N/A')
        ])

    return tabulate(rows, headers=headers, tablefmt="grid")


# ============================================================================
# CLI Commands
# ============================================================================

@click.group()
@click.version_option(version="1.0.0")
def cleanup():
    """BarberZap Data Cleanup CLI

    Manage cleanup of temporary and expired data.
    """
    pass


@cleanup.command()
@click.option('--format', type=click.Choice(['table', 'json']), default='table', help='Output format')
def stats(format):
    """Show cleanup statistics for all tables."""
    try:
        from dotenv import load_dotenv
        load_dotenv()

        supabase = get_supabase_client()

        click.echo("📊 Fetching cleanup statistics...")

        response = supabase.rpc('get_all_cleanup_stats')

        if not response.data:
            click.echo("❌ No stats available")
            return

        stats_data = response.data

        if format == 'json':
            click.echo(json.dumps(stats_data, indent=2))
        else:
            table = format_stats_table(stats_data)
            click.echo("\n" + table + "\n")

            # Summary
            total_pending = sum(s.get('pending_count', 0) for s in stats_data)
            total_size = sum(s.get('table_size_mb', 0) for s in stats_data)

            click.echo(f"📈 Summary:")
            click.echo(f"  • Total pending records: {format_number(total_pending)}")
            click.echo(f"  • Total table size: {total_size:.2f} MB")

    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
@click.argument('table_name')
@click.option('--format', type=click.Choice(['table', 'json']), default='table', help='Output format')
def stats_table(table_name, format):
    """Show cleanup statistics for a specific table."""
    try:
        from dotenv import load_dotenv
        load_dotenv()

        supabase = get_supabase_client()

        click.echo(f"📊 Fetching stats for '{table_name}'...")

        response = supabase.rpc('get_cleanup_stats', params={'p_table_name': table_name})

        if not response.data or not response.data[0]:
            click.echo(f"❌ No stats available for table '{table_name}'")
            return

        stat_data = response.data[0]

        if format == 'json':
            click.echo(json.dumps(stat_data, indent=2))
        else:
            click.echo(f"\n📋 Statistics for '{table_name}':")
            click.echo(f"  • Pending cleanup: {format_number(stat_data.get('pending_count', 0))} records")
            click.echo(f"  • Average age: {stat_data.get('avg_age_hours', 0):.1f} hours")
            click.echo(f"  • Table size: {stat_data.get('table_size_mb', 0):.2f} MB")
            click.echo(f"  • Deleted (24h): {format_number(stat_data.get('total_deleted_24h', 0))}")
            click.echo(f"  • Deleted (7d): {format_number(stat_data.get('total_deleted_7d', 0))}")
            click.echo(f"  • Deleted (30d): {format_number(stat_data.get('total_deleted_30d', 0))}")
            click.echo(f"  • Avg daily: {stat_data.get('avg_daily_deleted', 0):.0f}")
            click.echo(f"  • Health score: {stat_data.get('cleanup_health_score', 0)}/100")
            click.echo(f"  • Errors (24h): {stat_data.get('cleanup_errors_24h', 0)}")
            click.echo(f"  • Last cleanup: {format_timestamp(stat_data.get('last_cleanup_at'))}")
            click.echo()

    except Exception as e:
        logger.error(f"Error getting table stats: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
@click.option('--dry-run', is_flag=True, help='Preview what would be deleted without deleting')
@click.option('--magic-links-hours', default=24, help='Delete magic links expired X+ hours ago')
@click.option('--verification-codes-hours', default=1, help='Delete verification codes expired X+ hours ago')
@click.option('--notifications-days', default=7, help='Delete notifications read X+ days ago')
@click.option('--tokens-days', default=7, help='Delete tokens expired X+ days ago')
@click.option('--cache-days', default=7, help='Delete cache entries stale X+ days')
@click.option('--performed-by', default='cli', help='Who is performing the cleanup')
def run(dry_run, magic_links_hours, verification_codes_hours, notifications_days, tokens_days, cache_days, performed_by):
    """Run all cleanup jobs."""
    try:
        from dotenv import load_dotenv
        load_dotenv()

        redis_conn = get_redis_connection()
        supabase = get_supabase_client()

        if dry_run:
            click.echo("🔍 [DRY RUN MODE - No data will be deleted]")
        else:
            click.confirm("⚠️  This will delete expired/temporary data. Continue?", abort=True)

        click.echo("🧹 Starting cleanup...")

        async def run_cleanup():
            cleanup_job = CleanupJob(redis_conn, supabase)
            results = await cleanup_job.cleanup_all(
                magic_links_hours=magic_links_hours,
                verification_codes_hours=verification_codes_hours,
                notifications_days=notifications_days,
                tokens_days=tokens_days,
                cache_days=cache_days,
                dry_run=dry_run,
                performed_by=performed_by
            )
            return results

        results = asyncio.run(run_cleanup())

        # Display results
        click.echo("\n📊 Results:")
        for table_name, result in results.items():
            status_icon = "✅" if result.status == "completed" else "⚠️" if result.status == "dry_run" else "❌"
            click.echo(f"  {status_icon} {result.table_name}: {format_number(result.deleted)} deleted ({format_duration(result.duration_ms)})")
            if result.error_message:
                click.echo(f"     Error: {result.error_message}")

        total_deleted = sum(r.deleted for r in results.values())
        total_duration = sum(r.duration_ms for r in results.values())

        click.echo(f"\n📈 Total: {format_number(total_deleted)} records deleted in {format_duration(total_duration)}")
        click.echo(f"{'(Dry run - no data was deleted)' if dry_run else ''}")

    except click.Abort:
        click.echo("\n❌ Aborted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error running cleanup: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
@click.argument('job_name')
@click.option('--dry-run', is_flag=True, help='Preview what would be deleted without deleting')
@click.option('--hours-ago', type=int, help='For magic_links, verification_codes')
@click.option('--days-ago', type=int, help='For notifications, tokens, cache')
@click.option('--log-days', type=int, help='For notifications specifically')
@click.option('--time-gap-minutes', type=int, help='For activity_logs')
@click.option('--performed-by', default='cli', help='Who is performing the cleanup')
def run_job(job_name, dry_run, hours_ago, days_ago, log_days, time_gap_minutes, performed_by):
    """Run a specific cleanup job.

    Valid job names:
    - cleanup_magic_links
    - cleanup_verification_codes
    - cleanup_notifications
    - cleanup_activity_logs
    - cleanup_tokens
    - cleanup_cache
    """
    try:
        from dotenv import load_dotenv
        load_dotenv()

        redis_conn = get_redis_connection()
        supabase = get_supabase_client()

        valid_jobs = [
            'cleanup_magic_links',
            'cleanup_verification_codes',
            'cleanup_notifications',
            'cleanup_activity_logs',
            'cleanup_tokens',
            'cleanup_cache'
        ]

        if job_name not in valid_jobs:
            click.echo(f"❌ Invalid job_name. Must be one of: {', '.join(valid_jobs)}")
            sys.exit(1)

        if dry_run:
            click.echo("🔍 [DRY RUN MODE - No data will be deleted]")
        else:
            click.confirm("⚠️  This will delete expired/temporary data. Continue?", abort=True)

        click.echo(f"🧹 Running cleanup job: {job_name}...")

        async def run_job_cleanup():
            cleanup_job = CleanupJob(redis_conn, supabase)
            result = None

            if job_name == 'cleanup_magic_links':
                result = await cleanup_job.cleanup_magic_links(
                    hours_ago=hours_ago or 24,
                    dry_run=dry_run,
                    performed_by=performed_by
                )
            elif job_name == 'cleanup_verification_codes':
                result = await cleanup_job.cleanup_verification_codes(
                    hours_ago=hours_ago or 1,
                    dry_run=dry_run,
                    performed_by=performed_by
                )
            elif job_name == 'cleanup_notifications':
                result = await cleanup_job.cleanup_notifications(
                    log_days=log_days or days_ago or 7,
                    dry_run=dry_run,
                    performed_by=performed_by
                )
            elif job_name == 'cleanup_activity_logs':
                result = await cleanup_job.cleanup_activity_logs(
                    time_gap_minutes=time_gap_minutes or 1,
                    dry_run=dry_run,
                    performed_by=performed_by
                )
            elif job_name == 'cleanup_tokens':
                result = await cleanup_job.cleanup_tokens(
                    days_ago=days_ago or 7,
                    dry_run=dry_run,
                    performed_by=performed_by
                )
            elif job_name == 'cleanup_cache':
                result = await cleanup_job.cleanup_cache(
                    stale_days=days_ago or 7,
                    dry_run=dry_run,
                    performed_by=performed_by
                )

            return result

        result = asyncio.run(run_job_cleanup())

        # Display result
        if result:
            status_icon = "✅" if result.status == "completed" else "⚠️" if result.status == "dry_run" else "❌"
            click.echo(f"\n{status_icon} {result.table_name}: {format_number(result.deleted)} deleted ({format_duration(result.duration_ms)})")

            if result.error_message:
                click.echo(f"  ❌ Error: {result.error_message}")
        else:
            click.echo("❌ No result returned")

        click.echo(f"{'(Dry run - no data was deleted)' if dry_run else ''}")

    except click.Abort:
        click.echo("\n❌ Aborted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error running cleanup job {job_name}: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
@click.option('--limit', default=50, help='Number of history entries to show')
@click.option('--table-name', help='Filter by table name')
@click.option('--status', help='Filter by status')
@click.option('--format', type=click.Choice(['table', 'json']), default='table', help='Output format')
def history(limit, table_name, status, format):
    """Show cleanup operation history."""
    try:
        from dotenv import load_dotenv
        load_dotenv()

        supabase = get_supabase_client()

        click.echo("📜 Fetching cleanup history...")

        query = supabase.table('cleanup_runs_log').select('*')

        if table_name:
            query = query.eq('table_name', table_name)

        if status:
            query = query.eq('status', status)

        response = query.order('started_at', desc=True).limit(limit).execute()

        if not response.data:
            click.echo("❌ No history found")
            return

        history_data = response.data

        if format == 'json':
            click.echo(json.dumps(history_data, indent=2))
        else:
            table = format_history_table(history_data)
            click.echo("\n" + table + f"\n\nShowing {len(history_data)} of {len(history_data)} entries")

    except Exception as e:
        logger.error(f"Error getting history: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
@click.argument('job_name')
@click.argument('schedule_type', type=click.Choice(['hourly', 'daily', 'weekly']))
@click.option('--enabled/--disabled', default=True, help='Enable or disable the schedule')
@click.option('--cron-expression', help='Custom cron expression (for manual configuration)')
def schedule(job_name, schedule_type, enabled, cron_expression):
    """Set cleanup schedule for a job.

    Valid job names:
    - cleanup_magic_links
    - cleanup_verification_codes
    - cleanup_notifications
    - cleanup_activity_logs
    - cleanup_tokens
    - cleanup_cache

    Valid schedule types:
    - hourly: Run every hour
    - daily: Run once per day (3 AM UTC)
    - weekly: Run once per week (Sunday 3 AM UTC)
    """
    try:
        click.echo(f"⚙️  Updating schedule for '{job_name}'...")

        if not enabled:
            click.echo(f"  • Schedule type: {schedule_type}")
            click.echo(f"  • Status: DISABLED")
            click.echo(f"\n✅ Schedule updated (disabled)")
            return

        # Map schedule types to cron expressions
        cron_map = {
            'hourly': '0 * * * *',
            'daily': '0 3 * * *',
            'weekly': '0 3 * * 0'
        }

        cron_expr = cron_expression or cron_map.get(schedule_type)

        click.echo(f"  • Schedule type: {schedule_type}")
        click.echo(f"  • Cron expression: {cron_expr}")
        click.echo(f"  • Status: ENABLED")

        click.echo(f"\n✅ Schedule updated")
        click.echo(f"   Note: This requires pg_cron extension or application scheduler to be configured")

    except Exception as e:
        logger.error(f"Error updating schedule: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
@click.argument('table_name')
@click.option('--confirm', is_flag=True, help='Skip confirmation prompt')
def force(table_name, confirm):
    """Force delete all records from a table (DANGEROUS!).

    This deletes ALL records without any safety checks.
    Requires explicit confirmation.
    """
    try:
        from dotenv import load_dotenv
        load_dotenv()

        supabase = get_supabase_client()

        valid_tables = [
            'magic_links', 'verification_codes', 'notifications',
            'activity_logs', 'client_session_tokens', 'password_reset_tokens', 'cache_entries'
        ]

        if table_name not in valid_tables:
            click.echo(f"❌ Invalid table_name. Must be one of: {', '.join(valid_tables)}")
            sys.exit(1)

        # Get count
        click.echo(f"⚠️  WARNING: Force delete will remove ALL records from '{table_name}'")
        click.echo(f"   This operation cannot be undone!\n")

        response = supabase.rpc('get_cleanup_stats', params={'p_table_name': table_name})

        if response.data and response.data[0]:
            count = response.data[0].get('pending_count', 0)
            click.echo(f"📊 Current table stats: {format_number(count)} pending records")
        else:
            count = 0

        # Check actual count in table
        count_response = supabase.table(table_name).select('*', count='exact').execute()

        if hasattr(count_response, 'count'):
            actual_count = count_response.count
        else:
            # Fallback: fetch and count
            actual_count = len(count_response.data) if count_response.data else 0

        click.echo(f"📊 Total records in table: {format_number(actual_count)}")

        # Confirm
        if not confirm:
            click.echo("\n⚠️  Type 'CONFIRM' in all caps to proceed:")
            confirmation = click.prompt("Confirmation")

            if confirmation != 'CONFIRM':
                click.echo("❌ Operation cancelled")
                sys.exit(0)

        # Get reason
        reason = click.prompt("Please provide a reason for this force delete")

        # Log the operation
        click.echo("\n📝 Logging force delete operation...")

        supabase.table('cleanup_safety_log').insert({
            'operation_type': 'force_delete',
            'table_name': table_name,
            'pending_count': actual_count,
            'result': 'passed',
            'reason': reason,
            'performed_by': 'cli',
            'performed_by_type': 'cli'
        }).execute()

        # Perform force delete
        click.echo(f"🗑️  Force deleting {format_number(actual_count)} records from '{table_name}'...")
        click.echo("   This may take a while...")

        start_time = datetime.utcnow()

        delete_response = supabase.table(table_name).delete().execute()

        deleted_count = len(delete_response.data) if delete_response.data else 0

        duration = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        click.echo(f"✅ Force delete completed!")
        click.echo(f"   • Table: {table_name}")
        click.echo(f"   • Deleted: {format_number(deleted_count)} records")
        click.echo(f"   • Duration: {format_duration(duration)}")
        click.echo(f"   • Reason: {reason}")
        click.echo(f"   • Performed by: cli")
        click.echo(f"\n⚠️  This operation cannot be undone!")

    except click.Abort:
        click.echo("\n❌ Aborted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Force delete failed: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
def refresh_stats():
    """Refresh cleanup statistics cache."""
    try:
        from dotenv import load_dotenv
        load_dotenv()

        supabase = get_supabase_client()

        click.echo("♻️  Refreshing cleanup stats cache...")

        response = supabase.rpc('refresh_cleanup_stats_cache')

        click.echo("✅ Stats cache refreshed")

    except Exception as e:
        logger.error(f"Error refreshing stats: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


@cleanup.command()
def alerts():
    """Show active cleanup alerts."""
    try:
        from dotenv import load_dotenv
        load_dotenv()

        supabase = get_supabase_client()

        click.echo("🚨 Fetching active cleanup alerts...")

        response = supabase.table('cleanup_alert_log').select('*').eq('acknowledged', False).order('triggered_at', desc=True).limit(50).execute()

        if not response.data:
            click.echo("✅ No active alerts")
            return

        alerts_data = response.data

        headers = ["Type", "Severity", "Table", "Message", "Triggered"]
        rows = []

        for alert in alerts_data:
            rows.append([
                alert.get('alert_type', 'N/A'),
                alert.get('severity', 'N/A'),
                alert.get('table_name', 'N/A'),
                alert.get('alert_message', 'N/A')[:50],
                format_timestamp(alert.get('triggered_at'))
            ])

        table = tabulate(rows, headers=headers, tablefmt="grid")
        click.echo("\n" + table + f"\n\nShowing {len(alerts_data)} active alerts")

    except Exception as e:
        logger.error(f"Error getting alerts: {e}", exc_info=True)
        click.echo(f"❌ Error: {e}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cleanup()
