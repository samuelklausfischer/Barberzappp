#!/usr/bin/env python3
"""
Script para aplicar o schema do CRM no Supabase

Este script lê o arquivo schema.sql e executa as queries
via Supabase REST API (usando POST com parâmetros para executar SQL)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from integrations.supabase_rest import get_client


def execute_sql_via_rpc(sql_query):
    """
    Executa SQL via Supabase REST API usando RPC.
    
    Nota: A REST API padrão não suporta execução arbitrária de SQL.
    Para isso, é necessário usar a API de RPC ou criar uma função no Supabase.
    
    Como alternativa, este script mostra o SQL que precisa ser executado manualmente
    via Supabase Dashboard ou psql.
    """
    print("SQL precisa ser executado via Supabase Dashboard ou psql:")
    print("="*80)
    print(sql_query)
    print("="*80)


def main():
    """Executa a migração do schema."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    schema_file = os.path.join(script_dir, 'schema.sql')
    
    print("="*80)
    print("MIGRAÇÃO DO SCHEMA CRM BARBERZAP")
    print("="*80)
    
    # Lê o arquivo schema.sql
    with open(schema_file, 'r') as f:
        sql_content = f.read()
    
    print(f"\n📄 Lendo schema de: {schema_file}")
    print(f"📊 Tamanho do SQL: {len(sql_content)} caracteres")
    
    # Divide em statements individuais
    statements = []
    current_statement = []
    in_function = False
    
    for line in sql_content.split('\n'):
        stripped = line.strip()
        
        # Detecta início/fim de função
        if stripped.startswith('CREATE OR REPLACE FUNCTION') or stripped.startswith('CREATE FUNCTION'):
            in_function = True
        
        if in_function:
            current_statement.append(line)
            if stripped.endswith('$$ LANGUAGE plpgsql;'):
                in_function = False
                statements.append('\n'.join(current_statement))
                current_statement = []
        elif stripped and not stripped.startswith('--'):
            current_statement.append(line)
            if stripped.endswith(';'):
                statements.append('\n'.join(current_statement))
                current_statement = []
        elif stripped.startswith('--'):
            # Comentários são ignorados
            continue
    
    print(f"\n🔢 Statements identificados: {len(statements)}")
    
    print("\n" + "="*80)
    print("OPÇÕES DE EXECUÇÃO")
    print("="*80)
    print("\n1. Via Supabase Dashboard:")
    print("   - Acesse: https://app.supabase.com")
    print("   - Navegue para: SQL Editor")
    print("   - Cole o conteúdo do arquivo schema.sql")
    print("   - Clique em RUN")
    
    print("\n2. Via psql (linha de comando):")
    print("   psql -h db.htssqiupscyhhueqwpgu.supabase.co -U postgres -d postgres < schema.sql")
    
    print("\n3. Via API (não direto - requer função RPC customizada)")
    
    print("\n" + "="*80)
    print("CONTINGÊNCIA: MODOS OFFLINE/DEMO")
    print("="*80)
    print("\nNão é possível executar migrations SQL diretas via REST API padrão.")
    print("O schema.sql foi gerado e pode ser aplicado manualmente.")
    print("\nPara testes locais sem aplicar o schema, você pode:")
    print("- Usar uma instância local do Supabase/Docker")
    print("- Criar as tabelas manualmente via Dashboard")
    
    print("\n" + "="*80)
    print("PREVIEW DO SCHEMA")
    print("="*80)
    
    # Mostra preview das principais tabelas
    print("\n📋 TABELA: crm_leads")
    print("   Columns:")
    print("   - id: BIGSERIAL PRIMARY KEY")
    print("   - tenant_id: BIGINT NOT NULL")
    print("   - phone: VARCHAR(20) NOT NULL")
    print("   - name: VARCHAR(255)")
    print("   - email: VARCHAR(255)")
    print("   - status: VARCHAR(50) DEFAULT 'new'")
    print("   - notes: TEXT")
    print("   - metadata: JSONB")
    print("   - created_at: TIMESTAMPTZ")
    print("   - updated_at: TIMESTAMPTZ")
    
    print("\n📋 TABELA: crm_messages")
    print("   Columns:")
    print("   - id: BIGSERIAL PRIMARY KEY")
    print("   - tenant_id: BIGINT NOT NULL")
    print("   - lead_id: BIGINT REFERENCES crm_leads(id)")
    print("   - phone: VARCHAR(20) NOT NULL")
    print("   - sender: VARCHAR(255) NOT NULL")
    print("   - message: TEXT NOT NULL")
    print("   - direction: VARCHAR(20) -- 'inbound' ou 'outbound'")
    print("   - status: VARCHAR(50) DEFAULT 'received'")
    print("   - metadata: JSONB")
    print("   - created_at: TIMESTAMPTZ")
    
    print("\n" + "="*80)
    print("PRÓXIMOS PASSOS")
    print("="*80)
    print("\n1. Execute o schema.sql no Supabase Dashboard")
    print("2. Rode o teste: python3 crm/test_crm_logger.py")
    print("3. Verifique se as tabelas foram criadas corretamente")
    
    print("\n" + "="*80)
    
    # Opcionalmente, mostra se o schema já existe
    try:
        client = get_client()
        
        print("\n🔍 VERIFICANDO TABELAS EXISTENTES")
        print("="*80)
        
        # Tenta buscar da tabela crm_leads (deve falhar se não existir)
        try:
            leads = client.get('crm_leads', {'limit': '1'})
            print("✅ crm_leads existe")
        except Exception as e:
            if 'does not exist' in str(e):
                print("❌ crm_leads não existe - Execute a migration!")
            else:
                print(f"⚠️  Erro ao verificar crm_leads: {e}")
        
        # Tenta buscar da tabela crm_messages
        try:
            messages = client.get('crm_messages', {'limit': '1'})
            print("✅ crm_messages existe")
        except Exception as e:
            if 'does not exist' in str(e):
                print("❌ crm_messages não existe - Execute a migration!")
            else:
                print(f"⚠️  Erro ao verificar crm_messages: {e}")
        
    except Exception as e:
        print(f"⚠️  Não foi possível verificar tabelas: {e}")
    
    print("\n✅ Scripts gerados com sucesso!")
    print(f"📄 Schema file: {schema_file}\n")


if __name__ == '__main__':
    main()
