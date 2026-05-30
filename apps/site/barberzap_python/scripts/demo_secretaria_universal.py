"""
Demonstration script for BarberZap Universal Secretary AI Agent

Shows how to use the secretaria_universal agent for generating responses.
"""

import logging
from agents.secretaria_universal import (
    generate_response,
    generate_response_simple,
    get_conversation_summary,
    clear_conversation
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def demo_generate_response():
    """
    Demonstrates the complete flow of generate_response().

    Flow:
    1. Resolve tenant from instance_name
    2. Build context from database
    3. Retrieve chat history (40 messages)
    4. Generate AI response with context + history
    5. Save messages to memory
    """
    print("\n" + "=" * 70)
    print("🎯 Demo 1: generate_response() - Complete Flow")
    print("=" * 70)

    # Configuration - REPLACE WITH YOUR REAL VALUES
    instance_name = "barbearia_001"
    phone = "5511999999999"
    message = "Quero agendar um corte para sexta às 14h"

    print(f"\n📲 Incoming Message:")
    print(f"   Instance: {instance_name}")
    print(f"   Phone: {phone}")
    print(f"   Message: {message}")

    # Generate response
    print("\n🤖 Processing...")
    result = generate_response(
        instance_name=instance_name,
        phone=phone,
        message=message
    )

    # Display results
    print("\n📊 Results:")
    print(f"   Success: {result['success']}")

    if result['success']:
        print(f"   Tenant ID: {result['tenant_id']}")
        print(f"   AI Name: {result['ai_name']}")
        print(f"   Barbershop: {result['barbershop_name']}")
        print(f"   History Count: {result['history_count']} messages")
        print(f"   Processing Time: {result['metadata']['processing_time_ms']}ms")

        print("\n💬 AI Response:")
        print("-" * 70)
        print(result['response'])
        print("-" * 70)
    else:
        print(f"   ❌ Error: {result['error']}")


def demo_conversation_flow():
    """
    Demonstrates a multi-turn conversation.
    """
    print("\n" + "=" * 70)
    print("🎯 Demo 2: Multi-turn Conversation")
    print("=" * 70)

    # Configuration
    instance_name = "barbearia_001"
    phone = "5511988888888"

    conversation = [
        "Olá!",
        "Quais serviços vocês têm?",
        "Quão custa um corte?",
        "Vou agendar então"
    ]

    print(f"\n💬 Simulating conversation with {phone}...")
    print()

    for i, message in enumerate(conversation, 1):
        print(f"\n--- Message {i} ---")
        print(f"User: {message}")

        result = generate_response(
            instance_name=instance_name,
            phone=phone,
            message=message
        )

        if result['success']:
            print(f"AI ({result['ai_name']}): {result['response'][:100]}...")
            print(f"History: {result['history_count']} messages")
        else:
            print(f"Error: {result['error']}")


def demo_get_summary():
    """
    Demonstrates getting a conversation summary.
    """
    print("\n" + "=" * 70)
    print("🎯 Demo 3: Get Conversation Summary")
    print("=" * 70)

    instance_name = "barbearia_001"
    phone = "5511999999999"

    print(f"\n📋 Fetching summary for {phone}...")

    summary = get_conversation_summary(
        instance_name=instance_name,
        phone=phone,
        max_messages=10
    )

    if summary:
        print(f"\n✅ Summary Found:")
        print(f"   Tenant ID: {summary['tenant_id']}")
        print(f"   Phone: {summary['phone']}")
        print(f"   Message Count: {summary['message_count']}")

        if summary['messages']:
            print(f"\n📜 Last 5 Messages:")
            for msg in summary['messages'][-5:]:
                role_icon = "👤" if msg['role'] == 'user' else "🤖"
                print(f"   {role_icon} [{msg['role']}]: {msg['message'][:50]}...")
    else:
        print("\n❌ No conversation found")


def demo_simple_response():
    """
    Demonstrates generate_response_simple() - assumes tenant_id is known.
    """
    print("\n" + "=" * 70)
    print("🎯 Demo 4: generate_response_simple() - Direct Tenant ID")
    print("=" * 70)

    # Configuration - REPLACE WITH YOUR REAL VALUES
    tenant_id = "1"
    phone = "5511777777777"
    message = "Qual o horário de funcionamento?"

    print(f"\n📲 Incoming Message:")
    print(f"   Tenant ID: {tenant_id}")
    print(f"   Phone: {phone}")
    print(f"   Message: {message}")

    # Generate response
    print("\n🤖 Processing...")
    result = generate_response_simple(
        tenant_id=tenant_id,
        phone=phone,
        message=message
    )

    # Display results
    if result['success']:
        print(f"\n💬 AI Response:")
        print("-" * 70)
        print(result['response'])
        print("-" * 70)
    else:
        print(f"\n❌ Error: {result['error']}")


def main():
    """
    Run all demonstrations.
    """
    print("\n" + "=" * 70)
    print("🚀 BarberZap - Secretária Universal IA - Demonstration")
    print("=" * 70)
    print("\n⚠️  NOTE: This is a DEMO script.")
    print("   Replace instance_name, phone, and tenant_id with your real values.")
    print("   Ensure your database has the required tables and data.")
    print()

    # Run demos
    try:
        demo_generate_response()
        demo_conversation_flow()
        demo_get_summary()
        demo_simple_response()

        print("\n" + "=" * 70)
        print("✅ All demonstrations completed!")
        print("=" * 70)
        print("\n📚 API Reference:")
        print("   - generate_response(instance_name, phone, message)  → Complete")
        print("   - generate_response_simple(tenant_id, phone, message) → Direct")
        print("   - get_conversation_summary(instance_name, phone) → Summary")
        print("   - clear_conversation(instance_name, phone) → Clear history")
        print()

    except Exception as e:
        logger.error(f"Error running demonstrations: {e}", exc_info=True)


if __name__ == '__main__':
    main()
