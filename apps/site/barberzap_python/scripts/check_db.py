"""
Script para verificar dados existentes no Supabase
"""
import os
import sys

sys.path.insert(0, '/root/Barberzap SITE/barberzap_python')

from integrations.supabase_rest import SupabaseRestClient

# Criar cliente
client = SupabaseRestClient()

print("=" * 60)
print("VERIFICANDO DADOS EXISTENTES NO SUPABASE")
print("=" * 60)

# Verificar agente_config
print("\n1. agente_config:")
configs = client.get('agente_config')
if configs:
    for conf in configs:
        print(f"   - user_id: {conf.get('user_id')}")
        print(f"     name: {conf.get('barber_name') or conf.get('name')}")
else:
    print("   Nenhum registro encontrado")

# Verificar barbers
print("\n2. barbers:")
barbers = client.get('barbers')
if barbers:
    for barber in barbers:
        print(f"   - id: {barber.get('id')}, user_id: {barber.get('user_id')}")
        print(f"     name: {barber.get('name')}, status: {barber.get('status')}")
else:
    print("   Nenhum registro encontrado")

# Verificar services
print("\n3. services:")
services = client.get('services')
if services:
    for service in services[:5]:  # Mostrar apenas os primeiros 5
        print(f"   - id: {service.get('id')}, user_id: {service.get('user_id')}")
        print(f"     name: {service.get('name')}, price: {service.get('price')}")
else:
    print("   Nenhum registro encontrado")

# Verificar whatsapp_instances
print("\n4. whatsapp_instances:")
instances = client.get('whatsapp_instances')
if instances:
    for inst in instances:
        print(f"   - instance_name: {inst.get('instance_name')}")
        print(f"     user_id: {inst.get('user_id')}, status: {inst.get('status')}")
else:
    print("   Nenhum registro encontrado")

client.close()
