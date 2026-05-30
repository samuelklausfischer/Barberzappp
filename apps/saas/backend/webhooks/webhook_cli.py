"""
Webhook CLI Module

Command-line interface for managing Supabase webhooks and retry queue.
Provides commands for monitoring, debugging, and managing webhook events.
"""

import sys
import json
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, UTC
from dataclasses import asdict

import click

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import dependencies
try:
    from .retry_queue import (
        create_retry_queue,
        RetryWorker,
        WebhookRetryJob,
        RetryStatus,
    )
    from .invalidator import (
        CacheInvalidator,
        invalidate_tenant,
        invalidate_client,
        invalidate_services,
        invalidate_queue,
    )
    from .supabase_webhook import (
        SupabaseWebhook,
        WebhookEvent,
        WebhookEventType,
    )
    from ..cache.cache_manager import get_cache_manager
    QUEUE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Some webhook modules not available: {e}")
    QUEUE_AVAILABLE = False


# ==================== CLI Group ====================

@click.group()
def webhook_cli():
    """
    BarberZap Webhook CLI
    
    Manage Supabase webhooks, cache invalidation, and retry queue.
    """
    pass


# ==================== Cache Commands ====================

@webhook_cli.group()
def cache():
    """Cache management commands"""
    pass


@cache.command()
@click.option('--shop-id', '-s', help='Shop/tenant ID to invalidate')
@click.option('--client-id', '-c', help='Client ID to invalidate')
@click.option('--pattern', '-p', help='Custom pattern to invalidate')
@click.option('--all', is_flag=True, help='Flush all cache')
def invalidate(shop_id: Optional[str], client_id: Optional[str], pattern: Optional[str], all: bool):
    """Invalidate cache entries"""
    try:
        manager = get_cache_manager()
        
        if all:
            logger.warning("Flushing all cache...")
            count = manager.flush_namespace()
            click.echo(f"Flushed {count} cache entries")
            return
        
        if pattern:
            count = manager.invalidate(pattern)
            click.echo(f"Invalidated {count} keys matching pattern: {pattern}")
            return
        
        if shop_id:
            count = invalidate_tenant(shop_id)
            click.echo(f"Invalidated {count} keys for shop: {shop_id}")
            return
        
        if client_id:
            count = invalidate_client(client_id)
            click.echo(f"Invalidated {count} keys for client: {client_id}")
            return
        
        click.echo("Please specify what to invalidate (use --help)")
    
    except Exception as e:
        click.echo(f"Error invalidating cache: {e}", err=True)
        sys.exit(1)


@cache.command()
def status():
    """Get cache status"""
    try:
        manager = get_cache_manager()
        health = manager.get_health_status()
        
        # Format output
        click.echo(click.style("Cache Status", fg='green', bold=True))
        click.echo(f"Status: {health['status']}")
        click.echo(f"\nRedis:")
        click.echo(f"  Connected: {health['redis']['connected']}")
        if health.get('cache'):
            click.echo(f"  Memory Used: {health['cache'].get('memory_used_mb', 0):.2f} MB")
            click.echo(f"  Total Keys: {health['cache'].get('total_keys', 0)}")
            click.echo(f"  Connected Clients: {health['cache'].get('connected_clients', 0)}")
        
        click.echo(f"\nMetrics:")
        if health.get('metrics'):
            metrics = health['metrics']
            click.echo(f"  Hits: {metrics.get('hits', 0)}")
            click.echo(f"  Misses: {metrics.get('misses', 0)}")
            click.echo(f"  Errors: {metrics.get('errors', 0)}")
            click.echo(f"  Hit Rate: {metrics.get('hit_rate', 0):.2%}")
            click.echo(f"  Avg Latency: {metrics.get('avg_latency_ms', 0):.2f} ms")
            click.echo(f"  Uptime: {metrics.get('uptime_seconds', 0):.0f} seconds")
    
    except Exception as e:
        click.echo(f"Error getting cache status: {e}", err=True)
        sys.exit(1)


# ==================== Webhook Commands ====================

@webhook_cli.group()
def webhook():
    """Webhook management commands"""
    pass


@webhook.command()
@click.option('--payload', '-p', type=click.Path(exists=True), help='JSON payload file')
@click.option('--headers', '-h', type=click.Path(exists=True), help='JSON headers file')
@click.option('--dry-run', is_flag=True, help='Validate without processing')
def simulate(payload: Optional[str], headers: Optional[str], dry_run: bool):
    """Simulate a webhook for testing"""
    try:
        if not payload:
            click.echo("Please specify a payload file with --payload", err=True)
            sys.exit(1)
        
        # Read payload
        with open(payload, 'r') as f:
            payload_data = f.read()
        
        # Load headers if provided
        headers_data = {}
        if headers:
            with open(headers, 'r') as f:
                headers_data = json.load(f)
        
        # Validate payload structure
        try:
            payload_json = json.loads(payload_data)
        except json.JSONDecodeError as e:
            click.echo(f"Invalid JSON payload: {e}", err=True)
            sys.exit(1)
        
        # Validate webhook format
        required_fields = ['type', 'table', 'record']
        missing = [f for f in required_fields if f not in payload_json]
        if missing:
            click.echo(f"Missing required fields: {', '.join(missing)}", err=True)
            sys.exit(1)
        
        if dry_run:
            click.echo(click.style("Dry run - payload valid:", fg='green'))
            click.echo(f"  Type: {payload_json['type']}")
            click.echo(f"  Table: {payload_json['table']}")
            click.echo(f"  Record: {json.dumps(payload_json['record'], indent=2)[:100]}...")
            return
        
        # Process webhook
        webhook = SupabaseWebhook(os.getenv('SUPABASE_WEBHOOK_SECRET', ''))
        event = webhook.parse_event(payload_data)
        
        click.echo(click.style("Webhook processed successfully:", fg='green'))
        click.echo(f"  Event Type: {event.event_type.value}")
        click.echo(f"  Table: {event.table}")
        click.echo(f"  Record ID: {event.get_id()}")
        click.echo(f"  Shop ID: {event.get_shop_id()}")
        
        # Show cache patterns
        from .invalidator import map_supabase_event_to_cache_patterns
        patterns = map_supabase_event_to_cache_patterns(
            event.event_type,
            event.table,
            event.record.to_dict(),
            event.old_record.to_dict() if event.old_record else None
        )
        click.echo(f"  Cache Patterns: {len(patterns)}")
        for pattern in patterns:
            click.echo(f"    - {pattern}")
    
    except Exception as e:
        click.echo(f"Error simulating webhook: {e}", err=True)
        sys.exit(1)


@webhook.command()
def stats():
    """Show webhook statistics"""
    if not QUEUE_AVAILABLE:
        click.echo("Retry queue not available", err=True)
        return
    
    async def show_stats():
        try:
            queue = create_retry_queue()
            stats = await queue.get_queue_stats()
            
            click.echo(click.style("Webhook Statistics", fg='green', bold=True))
            click.echo(f"Jobs Created: {stats['created']}")
            click.echo(f"Jobs Retried: {stats['retried']}")
            click.echo(f"Jobs Completed: {stats['completed']}")
            click.echo(f"Jobs Failed: {stats['failed']}")
            click.echo(f"Pending Jobs: {stats['pending']}")
            click.echo(f"Dead Letter Queue: {stats['dlq_count']}")
        
        except Exception as e:
            click.echo(f"Error getting webhook stats: {e}", err=True)
    
    asyncio.run(show_stats())


# ==================== Retry Queue Commands ====================

@webhook_cli.group()
def queue():
    """Retry queue management commands"""
    pass


@queue.command(name='list')
@click.option('--limit', '-l', default=20, help='Max number of jobs to show')
@click.option('--status', '-s', help='Filter by status')
def list_jobs(limit: int, status: Optional[str]):
    """List retry queue jobs"""
    if not QUEUE_AVAILABLE:
        click.echo("Retry queue not available", err=True)
        return
    
    async def do_list():
        try:
            queue = create_retry_queue()
            
            # Get jobs from DLQ
            dlq_jobs = await queue.get_dead_letter_queue(limit)
            
            if not dlq_jobs:
                click.echo("No jobs in queue")
                return
            
            # Display jobs
            click.echo(click.style(f"Dead Letter Queue ({len(dlq_jobs)} jobs)", fg='yellow', bold=True))
            
            for job in dlq_jobs:
                status_color = {
                    'dead': 'red',
                    'failed': 'red',
                    'retrying': 'yellow',
                    'completed': 'green',
                }.get(job.status.value, 'blue')
                
                click.echo(f"\nJob: {job.job_id}")
                click.echo(f"  Status: {click.style(job.status.value, fg=status_color)}")
                click.echo(f"  Attempts: {job.attempts}/{job.max_attempts}")
                click.echo(f"  Error: {job.error}")
                if job.last_error:
                    click.echo(f"  Last Error: {job.last_error}")
                click.echo(f"  Created: {job.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        
        except Exception as e:
            click.echo(f"Error listing jobs: {e}", err=True)
    
    asyncio.run(do_list())


@queue.command()
@click.option('--job-id', '-j', required=True, help='Job ID to retry')
def retry(job_id: str):
    """Retry a failed webhook job"""
    if not QUEUE_AVAILABLE:
        click.echo("Retry queue not available", err=True)
        return
    
    async def do_retry():
        try:
            queue = create_retry_queue()
            success = await queue.retry_from_dlq(job_id)
            
            if success:
                click.echo(click.style(f"Job {job_id} requeued successfully", fg='green'))
            else:
                click.echo(f"Job {job_id} not found in DLQ", err=True)
        
        except Exception as e:
            click.echo(f"Error retrying job: {e}", err=True)
    
    asyncio.run(do_retry())


@queue.command()
@click.option('--confirm', is_flag=True, help='Confirm action')
def flush(confirm: bool):
    """Clear dead letter queue"""
    if not QUEUE_AVAILABLE:
        click.echo("Retry queue not available", err=True)
        return
    
    if not confirm:
        click.echo("Use --confirm to clear the dead letter queue", err=True)
        return
    
    async def do_flush():
        try:
            queue = create_retry_queue()
            count = await queue.clear_dlq()
            click.echo(click.style(f"Cleared {count} jobs from DLQ", fg='green'))
        
        except Exception as e:
            click.echo(f"Error clearing DLQ: {e}", err=True)
    
    asyncio.run(do_flush())


# ==================== Worker Commands ====================

@webhook_cli.command()
@click.option('--poll-interval', '-p', default=5.0, help='Polling interval in seconds')
def worker(poll_interval: float):
    """Start the retry worker daemon"""
    if not QUEUE_AVAILABLE:
        click.echo("Retry queue not available", err=True)
        return
    
    async def run_worker():
        try:
            from .webhook_handler import create_webhook_handler
            
            queue = create_retry_queue()
            handler = create_webhook_handler()
            worker = RetryWorker(queue, handler, poll_interval)
            
            click.echo(click.style(f"Starting retry worker (interval: {poll_interval}s)", fg='green'))
            
            await worker.start()
            
            # Keep running
            try:
                while True:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                click.echo("\nShutting down worker...")
                await worker.stop()
        
        except Exception as e:
            click.echo(f"Error running worker: {e}", err=True)
            sys.exit(1)
    
    asyncio.run(run_worker())


# ==================== Diagnostics Commands ====================

@webhook_cli.command()
def test():
    """Test webhook system connectivity"""
    click.echo(click.style("Testing webhook system...", fg='blue'))
    
    # Test cache
    try:
        manager = get_cache_manager()
        if manager.ping():
            click.echo(click.style("✓ Cache connection OK", fg='green'))
        else:
            click.echo(click.style("✗ Cache connection failed", fg='red'))
    except Exception as e:
        click.echo(click.style(f"✗ Cache error: {e}", fg='red'))
    
    # Test retry queue
    if QUEUE_AVAILABLE:
        try:
            queue = create_retry_queue()
            click.echo(click.style("✓ Retry queue initialized", fg='green'))
        except Exception as e:
            click.echo(click.style(f"✗ Retry queue error: {e}", fg='red'))
    else:
        click.echo(click.style("⊘ Retry queue not available", fg='yellow'))
    
    # Test signature validation
    try:
        webhook = SupabaseWebhook('test-secret')
        payload = '{"type":"INSERT","table":"test","record":{}}'
        signature = 'sha256=' + hmac.new(b'test-secret', payload.encode(), 'sha256').hexdigest()
        webhook.verify_signature(payload, signature)
        click.echo(click.style("✓ Signature validation OK", fg='green'))
    except Exception as e:
        click.echo(click.style(f"✗ Signature validation error: {e}", fg='red'))
    
    click.echo(click.style("\nSystem test complete", fg='blue'))


# ==================== Environment Check ====================

@webhook_cli.command()
def check():
    """Check environment configuration"""
    import os
    
    click.echo(click.style("Environment Configuration", fg='cyan', bold=True))
    click.echo()
    
    # Redis
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    click.echo(f"REDIS_URL: {redis_url}")
    
    # Supabase
    webhook_secret = os.getenv('SUPABASE_WEBHOOK_SECRET', 'Not set')
    if webhook_secret != 'Not set':
        webhook_secret = webhook_secret[:10] + '...'  # Hide most of it
    click.echo(f"SUPABASE_WEBHOOK_SECRET: {webhook_secret}")
    
    # Logging
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    click.echo(f"LOG_LEVEL: {log_level}")
    
    # Modules
    click.echo()
    click.echo(click.style("Module Status", fg='cyan', bold=True))
    click.echo(f"Retry Queue: {'Available' if QUEUE_AVAILABLE else 'Not Available'}")
    
    try:
        import redis
        click.echo("Redis Library: Available")
    except ImportError:
        click.echo("Redis Library: Not Available")


# ==================== Main Entry Point ====================

def main():
    """Main CLI entry point"""
    import os
    import hmac
    
    # Add hmac to global scope for test command
    globals()['hmac'] = hmac
    
    webhook_cli()


if __name__ == '__main__':
    cli()
    main()
