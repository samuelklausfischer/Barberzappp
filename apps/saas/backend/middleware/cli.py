#!/usr/bin/env python3
"""
Rate Limiting CLI for BarberZap
Command-line tool for managing and monitoring rate limits
"""

import sys
import argparse
import json
from pathlib import Path
from typing import Optional

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from barber.backend.middleware import (
    get_stats_collector,
    get_rate_limiter,
    reset_rate_limit,
    env_config,
)
from barber.backend.middleware.rate_limit_stats import (
    print_stats_summary,
    print_top_violators,
    print_stats_for_key,
)


# ==================== Commands ====================

def cmd_summary(args):
    """Print statistics summary"""
    print("\n" + "="*60)
    print("RATE LIMITING STATISTICS SUMMARY")
    print("="*60)
    
    collector = get_stats_collector()
    stats = collector.get_aggregated_stats()
    
    if 'error' in stats:
        print(f"\nError: {stats['error']}")
        print("Make sure Redis is running and accessible.\n")
        return 1
    
    print(f"\n📊 Total Requests: {stats.get('total_requests', 0):,}")
    print(f"   ✅ Hits: {stats.get('total_hits', 0):,}")
    print(f"   ⚠️  Violations: {stats.get('total_violations', 0):,}")
    print(f"   🚫 Blocked: {stats.get('total_blocked', 0):,}")
    print(f"\n📈 Violation Rate: {stats.get('violation_rate', 0)}%")
    print(f"📈 Block Rate: {stats.get('block_rate', 0)}%")
    
    # Stats by type
    stats_by_type = stats.get('stats_by_type', {})
    if stats_by_type:
        print("\n📋 Statistics by Type:")
        for key_type, type_stats in sorted(stats_by_type.items()):
            print(f"\n   {key_type.upper()}:")
            print(f"      Keys: {type_stats['count']}")
            print(f"      Hits: {type_stats['hits']:,}")
            print(f"      Violations: {type_stats['violations']:,}")
            print(f"      Blocked: {type_stats['blocked']:,}")
    
    # Top violators
    top_violators = stats.get('top_violators', [])
    if top_violators:
        print("\n🔝 Top Violators:")
        for i, violator in enumerate(top_violators[:5], 1):
            key_value = violator['key_value']
            count = violator['violation_count']
            print(f"   {i}. {key_value}: {count} violations")
    
    print("\n" + "="*60 + "\n")
    return 0


def cmd_top(args):
    """Print top violators"""
    print("\n" + "="*60)
    print(f"TOP {args.limit} VIOLATORS")
    print("="*60)
    
    collector = get_stats_collector()
    violators = collector.get_top_violators(args.limit)
    
    if not violators:
        print("\nNo violators found yet.\n")
        return 0
    
    print()
    for i, violator in enumerate(violators, 1):
        key_value = violator['key_value']
        count = violator['violation_count']
        stats = violator.get('stats', {})
        
        print(f"{i}. 🔑 Key: {key_value}")
        print(f"   💥 Violations: {count}")
        
        if stats:
            key_type = stats.get('key_type', 'N/A')
            hits = stats.get('hits', 0)
            violations = stats.get('violations', 0)
            last_violation = stats.get('last_violation', 'N/A')
            
            print(f"   📌 Type: {key_type}")
            print(f"   📊 Hits: {hits}")
            print(f"   ⚠️  Violations: {violations}")
            print(f"   🕐 Last Violation: {last_violation}")
        
        print()
    
    print("="*60 + "\n")
    return 0


def cmd_stats(args):
    """Print stats for specific key"""
    print("\n" + "="*60)
    f"STATISTICS FOR KEY: {args.key}"
    print("="*60)
    
    collector = get_stats_collector()
    stats = collector.get_stats(args.key)
    
    if not stats:
        print(f"\nNo statistics found for key: {args.key}\n")
        print("Make sure the key has made some requests first.\n")
        return 0
    
    print(f"\n📌 Type: {stats.key_type}")
    print(f"📊 Hits: {stats.hits:,}")
    print(f"💥 Violations: {stats.violations:,}")
    print(f"🚫 Blocked: {stats.blocked:,}")
    print(f"⚙️  Limit: {stats.limit}")
    print(f"⏱️  Window: {stats.window}s")
    print(f"📈 Violation Rate: {stats.violation_rate:.2%}")
    print(f"🕐 First Seen: {stats.first_seen}")
    print(f"🕐 Last Seen: {stats.last_seen}")
    print(f"🕐 Last Violation: {stats.last_violation}")
    
    print("\n" + "="*60 + "\n")
    return 0


def cmd_reset(args):
    """Reset rate limit for a key"""
    print(f"\n🔄 Resetting rate limit: {args.key_type}:{args.key_value}")
    
    success = reset_rate_limit(args.key_type, args.key_value)
    
    if success:
        print(f"✅ Rate limit reset successfully\n")
        return 0
    else:
        print(f"❌ Failed to reset rate limit\n")
        return 1


def cmd_usage(args):
    """Check current usage for a key"""
    print("\n" + "="*60)
    f"CURRENT USAGE: {args.key_type}:{args.key_value}"
    print("="*60)
    
    limiter = get_rate_limiter()
    
    # Get configuration for this key type
    from barber.backend.middleware.rate_limit_config import get_endpoint_config
    config = get_endpoint_config(args.key_type)
    limit = config.get('limit', 100)
    window = config.get('window', 60)
    
    # Override with provided values
    if args.limit:
        limit = args.limit
    if args.window:
        window = args.window
    
    usage = limiter.get_current_usage(args.key_type, args.key_value, limit, window)
    
    print(f"\n📊 Count: {usage['count']}/{usage['limit']}")
    print(f"✅ Remaining: {usage['remaining']}")
    print(f"📈 Used: {usage['percentage_used']:.1f}%")
    print(f"⏱️  Window: {usage['window_seconds']}s")
    
    # Create a simple ASCII bar
    bar_width = 40
    filled = int((usage['percentage_used'] / 100) * bar_width)
    empty = bar_width - filled
    
    bar_color = '🟩' if usage['percentage_used'] < 50 else '🟨' if usage['percentage_used'] < 80 else '🟥'
    bar = '[' + bar_color * filled + '⬜' * empty + ']'
    
    print(f"\n{bar}\n")
    print("="*60 + "\n")
    return 0


def cmd_config(args):
    """Print current configuration"""
    print("\n" + "="*60)
    print("RATE LIMITING CONFIGURATION")
    print("="*60)
    
    print(f"\n🔧 Enabled: {env_config.is_enabled()}")
    print(f"🔧 Mode: {env_config.mode}")
    print(f"🔧 Limit Multiplier: {env_config.limit_multiplier}x")
    print(f"🔧 Admin Bypass: {env_config.admin_bypass}")
    
    print(f"\n📝 Whitelisted IPs ({len(env_config.whitelist_ips)}):")
    if env_config.whitelist_ips:
        for ip in env_config.whitelist_ips:
            print(f"   - {ip}")
    else:
        print("   (none)")
    
    print(f"\n📝 Whitelisted Shops ({len(env_config.whitelist_shops)}):")
    if env_config.whitelist_shops:
        for shop in env_config.whitelist_shops:
            print(f"   - {shop}")
    else:
        print("   (none)")
    
    print(f"\n📝 Blocked IPs ({len(env_config.blocked_ips)}):")
    if env_config.blocked_ips:
        for ip in env_config.blocked_ips:
            print(f"   - {ip}")
    else:
        print("   (none)")
    
    print(f"\n📝 Redis TTL: {env_config.redis_ttl}s (0 = use window duration)")
    
    print("\n" + "="*60 + "\n")
    return 0


def cmd_clear(args):
    """Clear statistics"""
    print()
    if args.key:
        print(f"🗑️  Clearing statistics for key: {args.key}")
        collector = get_stats_collector()
        count = collector.clear_stats(args.key)
        print(f"✅ Cleared {count} keys\n")
    else:
        print("🗑️  Clearing ALL statistics...")
        collector = get_stats_collector()
        
        if not args.force:
            response = input("Are you sure? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Cancelled\n")
                return 0
        
        count = collector.clear_stats()
        # Also reset violators leaderboard
        collector.reset_violators_leaderboard()
        print(f"✅ Cleared {count} statistics keys\n")
    
    return 0


def cmd_violations(args):
    """List recent violations"""
    print("\n" + "="*60)
    print("RECENT VIOLATIONS")
    print("="*60)
    
    collector = get_stats_collector()
    
    # Build time range
    since = f"{args.hours}h ago" if args.hours else None
    
    violations = collector.get_violations(since=since, limit=args.limit)
    
    if not violations:
        print("\nNo violations found.\n")
        return 0
    
    print()
    for i, v in enumerate(violations, 1):
        print(f"{i}. 🔑 {v.key_type}: {v._mask_key()}")
        print(f"   ⚠️  Exceeded: {v.violating_count}/{v.limit} in {v.window}s")
        print(f"   ⏰ When: {v.timestamp}")
        print(f"   🔄 Retry after: {v.retry_after}s")
        print()
    
    print("="*60 + "\n")
    return 0


def cmd_test(args):
    """Test rate limiting"""
    print("\n" + "="*60)
    print("RATE LIMITING TEST")
    print("="*60)
    
    limiter = get_rate_limiter()
    
    # Reset the key first
    reset_rate_limit(args.key_type, args.key_value)
    print(f"\n🔄 Resetting rate limit for test...\n")
    
    print(f"Testing: {args.key_type}:{args.key_value}")
    print(f"Limit: {args.limit} per {args.window}s\n")
    
    # Make requests
    for i in range(1, args.limit + args.exceed + 1):
        result = limiter.check(
            args.key_type,
            args.key_value,
            args.limit,
            args.window,
            raise_on_exceed=False
        )
        
        if result['allowed']:
            print(f"✅ Request {i}: Allowed (count: {result['current']}, remaining: {result['remaining']})")
        else:
            print(f"❌ Request {i}: BLOCKED (count: {result['current']}, retry after: {result['retry_after']}s)")
    
    # Show final usage
    usage = limiter.get_current_usage(args.key_type, args.key_value, args.limit, args.window)
    print(f"\n📊 Final usage: {usage['count']}/{usage['limit']} ({usage['percentage_used']:.1f}%)")
    
    print("\n" + "="*60 + "\n")
    return 0


def cmd_export(args):
    """Export statistics to JSON"""
    print("\n" + "="*60)
    print("EXPORT STATISTICS")
    print("="*60)
    
    collector = get_stats_collector()
    stats = collector.get_aggregated_stats()
    
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = Path(__file__).parent.parent / 'rate_limit_stats.json'
    
    with open(output_path, 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    
    print(f"\n✅ Statistics exported to: {output_path}\n")
    print("="*60 + "\n")
    return 0


# ==================== Main ====================

def main():
    parser = argparse.ArgumentParser(
        description='BarberZap Rate Limiting CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Show statistics summary
  python cli.py summary
  
  # Show top 10 violators
  python cli.py top
  
  # Show stats for specific key
  python cli.py stats 192.168.1.1
  
  # Check current usage
  python cli.py usage ip 192.168.1.1
  
  # Reset rate limit for an IP
  python cli.py reset ip 192.168.1.1
  
  # Test rate limiting
  python cli.py test ip 192.168.1.1 --limit 5 --window 60
  
  # Export statistics to JSON
  python cli.py export --output stats.json
  
  # Clear all statistics
  python cli.py clear --force
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Summary command
    summary_parser = subparsers.add_parser('summary', help='Print statistics summary')
    summary_parser.set_defaults(func=cmd_summary)
    
    # Top violators command
    top_parser = subparsers.add_parser('top', help='Print top violators')
    top_parser.add_argument('--limit', '-l', type=int, default=10, 
                           help='Number of violators to show (default: 10)')
    top_parser.set_defaults(func=cmd_top)
    
    # Stats for key command
    stats_parser = subparsers.add_parser('stats', help='Print stats for specific key')
    stats_parser.add_argument('key', help='Key value to look up (e.g., IP address, phone number)')
    stats_parser.set_defaults(func=cmd_stats)
    
    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset rate limit for a key')
    reset_parser.add_argument('key_type', 
                             choices=['ip', 'user', 'phone', 'shop_id', 'email'],
                             help='Type of key')
    reset_parser.add_argument('key_value', help='Value of the key')
    reset_parser.set_defaults(func=cmd_reset)
    
    # Usage command
    usage_parser = subparsers.add_parser('usage', help='Check current usage for a key')
    usage_parser.add_argument('key_type',
                             choices=['ip', 'user', 'phone', 'shop_id', 'email'],
                             help='Type of key')
    usage_parser.add_argument('key_value', help='Value of the key')
    usage_parser.add_argument('--limit', '-l', type=int, help='Limit to check (default: auto)')
    usage_parser.add_argument('--window', '-w', type=int, help='Window in seconds (default: auto)')
    usage_parser.set_defaults(func=cmd_usage)
    
    # Config command
    config_parser = subparsers.add_parser('config', help='Print current configuration')
    config_parser.set_defaults(func=cmd_config)
    
    # Clear command
    clear_parser = subparsers.add_parser('clear', help='Clear statistics')
    clear_parser.add_argument('--key', '-k', help='Specific key to clear (clears all if not specified)')
    clear_parser.add_argument('--force', '-f', action='store_true', 
                             help='Skip confirmation when clearing all')
    clear_parser.set_defaults(func=cmd_clear)
    
    # Violations command
    violations_parser = subparsers.add_parser('violations', help='List recent violations')
    violations_parser.add_argument('--limit', '-l', type=int, default=20,
                                  help='Number of violations to show (default: 20)')
    violations_parser.add_argument('--hours', type=int,
                                  help='Show violations from last N hours (default: all)')
    violations_parser.set_defaults(func=cmd_violations)
    
    # Test command
    test_parser = subparsers.add_parser('test', help='Test rate limiting')
    test_parser.add_argument('key_type',
                            choices=['ip', 'user', 'phone', 'shop_id', 'email'],
                            help='Type of key')
    test_parser.add_argument('key_value', help='Value of the key')
    test_parser.add_argument('--limit', '-l', type=int, default=5,
                            help='Rate limit to test (default: 5)')
    test_parser.add_argument('--window', '-w', type=int, default=60,
                            help='Window in seconds (default: 60)')
    test_parser.add_argument('--exceed', '-e', type=int, default=2,
                            help='How many requests to exceed by (default: 2)')
    test_parser.set_defaults(func=cmd_test)
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export statistics to JSON')
    export_parser.add_argument('--output', '-o', help='Output file path (default: rate_limit_stats.json)')
    export_parser.set_defaults(func=cmd_export)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return 1
    
    try:
        return args.func(args)
    except Exception as e:
        print(f"\n❌ Error: {e}\n", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
