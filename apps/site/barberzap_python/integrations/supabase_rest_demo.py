#!/usr/bin/env python3
"""
Demo/Test do SupabaseRestClient para BarberZap

Exemplos práticos de uso do wrapper Supabase REST API.
"""

import logging
from integrations.supabase_rest import (
    SupabaseRestClient,
    supabase_get,
    supabase_post,
    supabase_patch,
    supabase_delete,
    supabase_upsert,
    get_client
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def demo_get_operations():
    """Demonstra operações GET."""
    print("\n" + "="*60)
    print("DEMO: Operações GET")
    print("="*60)
    
    client = get_client()
    
    # 1. Listar todos os barbeiros
    print("\n1. Listar todos os barbeiros:")
    barbers = client.get('barbers')
    if barbers:
        print(f"   Encontrados {len(barbers)} barbeiro(s)")
        for barber in barbers[:3]:  # Primeiros 3
            print(f"   - ID: {barber.get('id')}, Nome: {barber.get('name')}, Ativo: {barber.get('active')}")
    else:
        print("   Nenhum barbeiro encontrado")
    
    # 2. Buscar apenas barbeiros ativos
    print("\n2. Buscar barbeiros ativos:")
    active_barbers = client.get('barbers', {'active': 'true'})
    print(f"   Barbeiros ativos: {len(active_barbers) if active_barbers else 0}")
    
    # 3. Buscar com ordenação e limite
    print("\n3. Últimos 5 leads:")
    leads = client.get('crm_leads', {
        'order': 'created_at.desc',
        'limit': '5'
    })
    if leads:
        for lead in leads:
            print(f"   - {lead.get('name')} ({lead.get('status')})")
    
    # 4. Buscar colunas específicas
    print("\n4. Serviços (nome e preço apenas):")
    services = client.get('services', {
        'select': 'id,name,price'
    })
    if services:
        for service in services:
            print(f"   - {service.get('name')}: R$ {service.get('price')}")
    
    # 5. Buscar único registro
    print("\n5. Buscar configuração por user_id:")
    config = client.get('agente_config', {'user_id': 'eq.1'}, single=True)
    if config:
        print(f"   Barbearia: {config.get('barber_name')}")
        print(f"   Endereço: {config.get('address')}")
    
    # 6. Buscar instância WhatsApp
    print("\n6. Buscar instância WhatsApp:")
    instance = client.get('whatsapp_instances', {}, single=True)
    if instance:
        print(f"   Instância: {instance.get('instance_name')}")
        print(f"   User ID: {instance.get('user_id')}")
        print(f"   Status: {instance.get('status')}")


def demo_post_operations():
    """Demonstra operações POST."""
    print("\n" + "="*60)
    print("DEMO: Operações POST")
    print("="*60)
    
    client = get_client()
    
    # 1. Criar novo lead
    print("\n1. Criar novo lead:")
    new_lead = client.post('crm_leads', {
        'name': 'Maria Silva',
        'phone': '5511999998888',
        'email': 'maria@email.com',
        'status': 'new'
    })
    if new_lead:
        print(f"   ✓ Lead criado com ID: {new_lead.get('id')}")
        lead_id = new_lead.get('id')
    else:
        print("   ✗ Falha ao criar lead")
        lead_id = None
    
    # 2. Criar mensagem para o lead
    if lead_id:
        print("\n2. Criar mensagem para o lead:")
        message = client.post('crm_messages', {
            'lead_id': lead_id,
            'message': 'Olá! Bem-vinda à Barbearia!',
            'direction': 'outbound',
            'status': 'sent'
        })
        if message:
            print(f"   ✓ Mensagem criada com ID: {message.get('id')}")
    
    # 3. Criar múltiplos registros
    print("\n3. Criar múltiplos serviços (exemplo):")
    new_services = client.post('services', [
        {
            'name': 'Corte Infantil',
            'price': 35.00,
            'duration': 30,
            'active': False
        },
        {
            'name': 'Barba Terapia',
            'price': 50.00,
            'duration': 45,
            'active': False
        }
    ])
    if new_services:
        print(f"   ✓ {len(new_services)} serviços criados")
        for svc in new_services:
            print(f"      - {svc.get('name')} (ID: {svc.get('id')})")


def demo_patch_operations():
    """Demonstra operações PATCH."""
    print("\n" + "="*60)
    print("DEMO: Operações PATCH")
    print("="*60)
    
    client = get_client()
    
    # 1. Atualizar lead existente
    print("\n1. Atualizar status do lead mais recente:")
    recent_lead = client.get('crm_leads', {
        'order': 'created_at.desc',
        'limit': '1'
    }, single=True)
    
    if recent_lead:
        lead_id = recent_lead.get('id')
        print(f"   Lead ID: {lead_id}, Status atual: {recent_lead.get('status')}")
        
        updated = client.patch('crm_leads', lead_id, {
            'status': 'contacted',
            'notes': 'Contato realizado via WhatsApp'
        })
        print(f"   ✓ Status atualizado para: {updated.get('status')}")
    
    # 2. Atualizar barbeiro
    print("\n2. Atualizar primeiro barbeiro:")
    first_barber = client.get('barbers', {}, single=True)
    
    if first_barber:
        barber_id = first_barber.get('id')
        print(f"   Barbeiro ID: {barber_id}, Nome atual: {first_barber.get('name')}")
        
        updated = client.patch('barbers', barber_id, {
            'phone': '5511999990000'  # Exemplo de atualização
        })
        print(f"   ✓ Barbeiro atualizado")
    
    # 3. Atualizar instância WhatsApp por instance_name
    print("\n3. Atualizar status de instância WhatsApp:")
    instance = client.get('whatsapp_instances', {}, single=True)
    
    if instance:
        instance_name = instance.get('instance_name')
        print(f"   Instância: {instance_name}, Status atual: {instance.get('status')}")
        
        updated = client.patch('whatsapp_instances', instance_name, {
            'status': 'ready',
            'last_connected': 'now()'
        }, id_column='instance_name')
        print(f"   ✓ Status atualizado: {updated.get('status')}")


def demo_delete_operations():
    """Demonstra operações DELETE."""
    print("\n" + "="*60)
    print("DEMO: Operações DELETE")
    print("="*60)
    
    client = get_client()
    
    # 1. Deletar lead de teste
    print("\n1. Buscar e deletar lead de teste (Maria Silva):")
    test_lead = client.get('crm_leads', {'name': 'eq.Maria Silva'}, single=True)
    
    if test_lead:
        lead_id = test_lead.get('id')
        print(f"   Encontrado lead ID: {lead_id}")
        
        success = client.delete('crm_leads', lead_id)
        if success:
            print(f"   ✓ Lead deletado com sucesso")
            
        # Verificar se foi deletado
        check = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)
        print(f"   Verificação: {'Não encontrado' if not check else 'Ainda existe'}")
    else:
        print("   Nenhum lead de teste encontrado")


def demo_upsert_operations():
    """Demonstra operações UPSERT."""
    print("\n" + "="*60)
    print("DEMO: Operações UPSERT")
    print("="*60)
    
    client = get_client()
    
    # 1. Upsert de configuração (update se existe, insert se não)
    print("\n1. Upsert configuração para user_id=100:")
    config = client.upsert(
        'agente_config',
        {'user_id': 'eq.100'},
        {
            'user_id': 100,
            'barber_name': 'Barbearia Teste Upsert',
            'address': 'Rua Teste, 123',
            'phone': '5511999990000',
            'whatsapp': '5511999990000',
            'working_hours': '09:00-18:00',
            'timezone': 'America/Sao_Paulo'
        },
        'user_id'
    )
    print(f"   ✓ Configuração upsertada (ID: {config.get('id')})")
    
    # 2. Upsert de instância WhatsApp
    print("\n2. Upsert instância WhatsApp:")
    instance = client.upsert(
        'whatsapp_instances',
        {'instance_name': 'eq.test_instance'},
        {
            'instance_name': 'test_instance',
            'user_id': 100,
            'status': 'ready',
            'phone_number': '5511999990000'
        },
        'instance_name'
    )
    print(f"   ✓ Instância upsertada (ID: {instance.get('id')})")
    
    # 3. Executar novamente (deve fazer update)
    print("\n3. Upsert novamente (deve fazer UPDATE):")
    updated_instance = client.upsert(
        'whatsapp_instances',
        {'instance_name': 'eq.test_instance'},
        {
            'instance_name': 'test_instance',
            'user_id': 100,
            'status': 'connected',  # Status atualizado
            'phone_number': '5511999990000'
        },
        'instance_name'
    )
    print(f"   ✓ Instância atualizada (Status: {updated_instance.get('status')})")


def demo_batch_operations():
    """Demonstra operações em lote."""
    print("\n" + "="*60)
    print("DEMO: Operações em Lote (batch)")
    print("="*60)
    
    client = get_client()
    
    operations = [
        {
            'method': 'get',
            'table': 'barbers',
            'filters': {'active': 'true'},
            'single': False
        },
        {
            'method': 'count',
            'table': 'crm_leads'
        },
        {
            'method': 'upsert',
            'table': 'agente_config',
            'filters': {'user_id': 'eq.200'},
            'data': {
                'user_id': 200,
                'barber_name': 'Barbearia Batch Test'
            },
            'id_column': 'user_id'
        }
    ]
    
    print("\nExecutando operações em lote:")
    results = client.batch操作(operations)
    
    for i, result in enumerate(results, 1):
        print(f"\n{i}. Resultado:")
        if isinstance(result, dict) and 'error' in result:
            print(f"   ✗ Erro: {result['error']}")
        elif isinstance(result, list):
            print(f"   ✓ Lista com {len(result)} itens")
        elif result is not None:
            print(f"   ✓ Sucesso")
        else:
            print(f"   ✓ (sem retorno)")


def demo_utility_functions():
    """Demonstra funções úteis."""
    print("\n" + "="*60)
    print("DEMO: Funções Utilitárias")
    print("="*60)
    
    client = get_client()
    
    # 1. Verificar se existe registro
    print("\n1. Verificar se existem barbeiros:")
    exists = client.exists('barbers', {'active': 'true'})
    print(f"   Barbeiros ativos existem: {exists}")
    
    # 2. Contar registros
    print("\n2. Contar leads por status:")
    for status in ['new', 'contacted', ' converted', 'lost']:
        try:
            count = client.count('crm_leads', {'status': f'eq.{status}'})
            print(f"   Status '{status}': {count}")
        except Exception as e:
            print(f"   Status '{status}': Erro - {e}")
    
    # 3. Obter info da tabela
    print("\n3. Metadados da tabela 'services':")
    info = client.table_info('services')
    print(f"   Tabela: {info.get('table')}")
    print(f"   Colunas: {', '.join(info.get('columns', []))}")
    
    # 4. Usar funções de atalho
    print("\n4. Usando funções de atalho:")
    services = supabase_get('services', {'limit': '3'})
    print(f"   Serviços (via atalho): {len(services) if services else 0}")


def demo_with_context_manager():
    """Demonstra uso com context manager."""
    print("\n" + "="*60)
    print("DEMO: Context Manager")
    print("="*60)
    
    with SupabaseRestClient() as client:
        print("\nDentro do context manager:")
        
        # Buscar dados
        barbers = client.get('barbers', {'limit': '5'})
        print(f"   Barbeiros: {len(barbers) if barbers else 0}")
        
        # Contar leads
        lead_count = client.count('crm_leads')
        print(f"   Total de leads: {lead_count}")
    
    print("\n✓ Context manager fechou a conexão automaticamente")


def main():
    """Executa todos os demos."""
    print("\n" + "="*60)
    print("BARBERZAP - SUPABASE REST API DEMO")
    print("="*60)
    
    try:
        demo_get_operations()
        # demo_post_operations()  # Uncomment para testar inserções
        # demo_patch_operations()  # Uncomment para testar atualizações
        # demo_delete_operations()  # Uncomment para testar deleções
        # demo_upsert_operations()  # Uncomment para testar upserts
        demo_batch_operations()
        demo_utility_functions()
        demo_with_context_manager()
        
        print("\n" + "="*60)
        print("✓ DEMO CONCLUÍDO")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n✗ Erro no demo: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
