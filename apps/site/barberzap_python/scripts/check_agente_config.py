"""
Script para verificar detalhes do agente_config
"""
import os
import sys

sys.path.insert(0, '/root/Barberzap SITE/barberzap_python')

from integrations.supabase_rest import SupabaseRestClient

# Criar cliente
client = SupabaseRestClient()

print("=" * 60)
print("VERIFICANDO DETALHES DO agente_config")
print("=" * 60)

# Verificar agente_config
configs = client.get('agente_config')
if configs:
    for conf in configs:
        user_id = conf.get('user_id')
        print(f"\nuser_id: {user_id}")
        print(f"Todos os campos:")
        for key, value in conf.items():
            print(f"  {key}: {value}")

client.close()
