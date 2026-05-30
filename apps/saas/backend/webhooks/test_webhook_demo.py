#!/usr/bin/env python3
"""
Webhook Testing Demo

This script demonstrates how to test the webhook system locally.
"""

import asyncio
import json
import hmac
import hashlib
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from webhooks.supabase_webhook import (
    SupabaseWebhook,
    WebhookEvent,
    WebhookEventType,
    extract_signature
)
from webhooks.invalidator import (
    map_supabase_event_to_cache_patterns,
    invalidate_patterns,
    CacheInvalidator
)
from webhooks.webhook_handler import create_webhook_handler


# ==================== Demo Functions ====================

def load_example_webhook(filename: str) -> dict:
    """Load example webhook payload"""
    examples_dir = Path(__file__).parent / "example_webhooks"
    with open(examples_dir / filename) as f:
        return json.load(f)


def generate_signature(payload: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature"""
    signature = hmac.new(
        key=secret.encode('utf-8'),
        msg=payload.encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


async def demo_basic_webhook():
    """Demo 1: Basic webhook parsing"""
    print("\n" + "="*60)
    print("DEMO 1: Basic Webhook Parsing")
    print("="*60)
    
    # Load example webhook
    payload = load_example_webhook("appointments_insert.json")
    payload_str = json.dumps(payload)
    
    print(f"\nPayload:")
    print(json.dumps(payload, indent=2))
    
    # Create webhook instance
    webhook = SupabaseWebhook(webhook_secret="test-secret")
    
    # Parse event (no signature validation for demo)
    event = webhook.parse_event(payload_str, signature=None)
    
    print(f"\nParsed Event:")
    print(f"  Type: {event.event_type.value}")
    print(f"  Table: {event.table}")
    print(f"  Record ID: {event.get_id()}")
    print(f"  Shop ID: {event.get_shop_id()}")
    print(f"  Client ID: {event.get_client_id()}")
    print(f"  Scheduled Date: {event.get_scheduled_date()}")


async def demo_signature_validation():
    """Demo 2: Signature validation"""
    print("\n" + "="*60)
    print("DEMO 2: Signature Validation")
    print("="*60)
    
    secret = "demo-secret-123"
    payload = load_example_webhook("client_insert.json")
    payload_str = json.dumps(payload)
    
    # Generate signature
    signature = generate_signature(payload_str, secret)
    print(f"\nGenerated Signature: {signature[:20]}...")
    
    # Create webhook instance
    webhook = SupabaseWebhook(webhook_secret=secret)
    
    try:
        # Verify signature
        is_valid = webhook.verify_signature(payload_str, signature)
        print(f"\n✓ Signature is valid: {is_valid}")
        
        # Parse with signature
        event = webhook.parse_event(payload_str, signature)
        print(f"✓ Event parsed successfully: {event.event_type.value} on {event.table}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")


async def demo_cache_patterns():
    """Demo 3: Cache pattern mapping"""
    print("\n" + "="*60)
    print("DEMO 3: Cache Pattern Mapping")
    print("="*60)
    
    # Test different webhook types
    test_files = [
        ("appointments_insert.json", "INSERT appointments"),
        ("appointments_update.json", "UPDATE appointments (status change)"),
        ("client_insert.json", "INSERT client"),
        ("services_update.json", "UPDATE services"),
        ("employee_update.json", "UPDATE employee"),
    ]
    
    for filename, description in test_files:
        print(f"\n{description}:")
        print("-" * 40)
        
        payload = load_example_webhook(filename)
        
        # Map to cache patterns
        patterns = map_supabase_event_to_cache_patterns(
            event_type=WebhookEventType(payload['type']),
            table_name=payload['table'],
            record_data=payload['record'],
            old_record=payload.get('old_record')
        )
        
        if patterns:
            print(f"  Cache patterns to invalidate:")
            for pattern in patterns:
                print(f"    • {pattern}")
        else:
            print(f"  No cache patterns to invalidate")


async def demo_handler():
    """Demo 4: Full webhook handler processing"""
    print("\n" + "="*60)
    print("DEMO 4: Full Webhook Handler")
    print("="*60)
    
    # Create handler (without signature for demo)
    handler = create_webhook_handler(
        webhook_secret=None,
        require_signature=False  # Disable signature for demo
    )
    
    # Load example webhook
    payload = load_example_webhook("appointments_insert.json")
    payload_str = json.dumps(payload)
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": "demo-signature"
    }
    
    print(f"\nProcessing webhook: {payload['type']} on {payload['table']}")
    
    # Handle webhook
    result = await handler.handle_webhook(
        payload=payload_str,
        headers=headers
    )
    
    print(f"\nResult:")
    print(f"  Status: {result['status']}")
    print(f"  Status Code: {result['status_code']}")
    if 'cache_invalidation' in result:
        inv = result['cache_invalidation']
        print(f"  Cache Invalidation:")
        print(f"    Status: {inv['status']}")
        print(f"    Patterns: {len(inv.get('patterns', []))}")
        if inv.get('patterns'):
            for p in inv['patterns']:
                print(f"      • {p}")
    print(f"  Duration: {result.get('duration_ms', 0):.2f}ms")


async def demo_batch_invalidation():
    """Demo 5: Batch cache invalidation"""
    print("\n" + "="*60)
    print("DEMO 5: Batch Cache Invalidation")
    print("="*60)
    
    from webhooks.invalidator import invalidate_pattern_batch
    
    # Define patterns to invalidate
    patterns = [
        "barberzap:tenant:shop_barber_123",
        "barberzap:services:shop_barber_123",
        "barberzap:appointments:shop_barber_123:*",
        "barberzap:client:client_john_456",
    ]
    
    print(f"\nInvalidating {len(patterns)} patterns:")
    for pattern in patterns:
        print(f"  • {pattern}")
    
    # Note: This won't actually invalidate unless Redis is running
    print("\nNOTE: This requires Redis to be running to actually invalidate cache.")
    print("      Without Redis, this will log but not delete any keys.")


async def main():
    """Run all demos"""
    print("\n" + "="*60)
    print("BarberZap Webhook System - Interactive Demo")
    print("="*60)
    
    demos = [
        ("Basic Webhook Parsing", demo_basic_webhook),
        ("Signature Validation", demo_signature_validation),
        ("Cache Pattern Mapping", demo_cache_patterns),
        ("Full Webhook Handler", demo_handler),
        ("Batch Invalidation", demo_batch_invalidation),
    ]
    
    for name, demo_func in demos:
        try:
            await demo_func()
        except Exception as e:
            print(f"\n✗ Error in {name}: {e}")
            import traceback
            traceback.print_exc()
        
        # Pause between demos
        if name != demos[-1][0]:
            print("\n" + "-"*60)
            try:
                input("Press Enter to continue to next demo...")
            except (EOFError, KeyboardInterrupt):
                break
    
    print("\n" + "="*60)
    print("Demo Complete!")
    print("="*60)
    print("\nTo run individual demos:")
    print("  python test_webhook_demo.py --demo basic")
    print("  python test_webhook_demo.py --demo signature")
    print("  python test_webhook_demo.py --demo patterns")
    print("  python test_webhook_demo.py --demo handler")
    print("  python test_webhook_demo.py --demo all")
    print()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Webhook Testing Demo")
    parser.add_argument(
        "--demo",
        choices=["basic", "signature", "patterns", "handler", "all"],
        default="all",
        help="Which demo to run"
    )
    args = parser.parse_args()
    
    # Run specified demo
    if args.demo == "basic":
        asyncio.run(demo_basic_webhook())
    elif args.demo == "signature":
        asyncio.run(demo_signature_validation())
    elif args.demo == "patterns":
        asyncio.run(demo_cache_patterns())
    elif args.demo == "handler":
        asyncio.run(demo_handler())
    else:
        asyncio.run(main())
