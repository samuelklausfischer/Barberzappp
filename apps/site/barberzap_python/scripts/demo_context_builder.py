"""
Demo do Context Builder
"""
import sys
import os
sys.path.insert(0, '/root/Barberzap SITE/barberzap_python')

from core.context_builder import build_context, build_context_string

# User ID válido (do banco)
test_user_id = 'd9fd2be4-0768-483b-b122-b60277335e2a'

print("=" * 60)
print("DEMO - Context Builder")
print("=" * 60)

# Teste 1: build_context()
print("\n1. build_context()")
print("-" * 60)

context = build_context(test_user_id)

if context:
    print("\n✅ Contexto construído com sucesso!\n")

    print(f"Barbershop:")
    bs = context['barbershop']
    print(f"  - user_id: {bs['user_id']}")
    print(f"  - name: {bs['name']}")
    print(f"  - address: {bs['address']}")
    print(f"  - hours: {bs['hours']}")
    print(f"  - ai_name: {bs['ai_name']}")
    print(f"  - greeting: {bs['greeting']}")

    print(f"\nBarbeiros ({len(context['barbers'])}):")
    for b in context['barbers']:
        print(f"  - ID: {b['id']}")
        print(f"    Nome: {b['name']}")
        print(f"    Status: {b['status']}")

    print(f"\nServiços ({len(context['services'])}):")
    for s in context['services']:
        print(f"  - ID: {s['id']}")
        print(f"    Nome: {s['name']}")
        print(f"    Preço: R$ {s['price']:.2f}")
        print(f"    Duração: {s['duration']} min")
        print(f"    Descrição: {s['description']}")
else:
    print("\n❌ Falha ao construir contexto")

# Teste 2: build_context_string()
print("\n\n2. build_context_string()")
print("-" * 60)

ctx_str = build_context_string(test_user_id)
if ctx_str:
    print(f"\n{ctx_str}")
else:
    print("\n❌ Falha ao construir contexto string")

print("\n" + "=" * 60)
