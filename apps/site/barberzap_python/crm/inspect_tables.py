#!/usr/bin/env python3
"""
Script para inspecionar a estrutura das tabelas CRM no Supabase
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrations.supabase_rest import get_client
import json


def inspect_table_columns(table_name):
    """
    Tenta descobrir a estrutura de uma tabela inserindo um registro
    e analisando o erro de validação para obter informações das colunas.
    
    Alternativamente, verifica o primeiro registro para inferir a estrutura.
    """
    client = get_client()
    
    print(f"\n{'='*80}")
    print(f"TABELA: {table_name}")
    print('='*80)
    
    # Tenta buscar o primeiro registro para inferir estrutura
    try:
        sample = client.get(table_name, {'limit': '1'})
        
        if sample and len(sample) > 0:
            record = sample[0]
            print(f"\n✅ Registro de exemplo encontrado!")
            print(f"\nColunas detectadas ({len(record)}):")
            
            for key, value in record.items():
                value_type = type(value).__name__
                value_display = str(value)[:50] if value is not None else 'NULL'
                if len(str(value)) > 50:
                    value_display += '...'
                print(f"  - {key:30} ({value_type:10}): {value_display}")
            
            return record.keys()
        else:
            print(f"\n⚠️  Nenhum registro encontrado na tabela")
            print(f"   Tabela vazia ou sem acesso")
            return None
            
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Erro ao inspecionar tabela: {error_msg}")
        return None


def check_table_exists(table_name):
    """Verifica se a tabela existe."""
    client = get_client()
    
    try:
        client.get(table_name, {'limit': '1'})
        return True
    except Exception as e:
        error_msg = str(e)
        if 'does not exist' in error_msg or 'relation' in error_msg:
            return False
        raise


def main():
    """Executa a inspeção."""
    print("="*80)
    print("INSPEÇÃO DE TABELAS CRM - BARBERZAP")
    print("="*80)
    
    tables_to_check = ['crm_leads', 'crm_messages']
    
    for table in tables_to_check:
        exists = check_table_exists(table)
        
        if exists:
            columns = inspect_table_columns(table)
            
            if columns:
                print(f"\n📊 Lista de colunas: {', '.join(columns)}")
        else:
            print(f"\n{'='*80}")
            print(f"TABELA: {table}")
            print('='*80)
            print(f"❌ Tabela {table} NÃO existe no banco de dados")
            print(f"\nExecute a migration para criar: python3 crm/migrate_schema.py")
    
    print("\n" + "="*80)
    print("RECOMENDAÇÕES")
    print("="*80)
    
    leads_exists = check_table_exists('crm_leads')
    messages_exists = check_table_exists('crm_messages')
    
    if leads_exists and messages_exists:
        print("\n✅ Tabelas existem - Analise se a estrutura está correta acima")
        
        # Verifica se tem as colunas críticas
        print("\nVerificando colunas críticas...")
        
        try:
            sample = get_client().get('crm_leads', {'limit': '1'})
            if sample:
                required_cols = ['id', 'tenant_id', 'phone', 'name', 'status']
                existing_cols = set(sample[0].keys())
                missing = set(required_cols) - existing_cols
                
                if missing:
                    print(f"⚠️  Colunas faltando em crm_leads: {', '.join(missing)}")
                else:
                    print(f"✅ Todas as colunas críticas presentes em crm_leads")
        except:
            pass
        
        try:
            sample = get_client().get('crm_messages', {'limit': '1'})
            if sample:
                required_cols = ['id', 'tenant_id', 'lead_id', 'phone', 'sender', 'message', 'direction']
                existing_cols = set(sample[0].keys())
                missing = set(required_cols) - existing_cols
                
                if missing:
                    print(f"⚠️  Colunas faltando em crm_messages: {', '.join(missing)}")
                else:
                    print(f"✅ Todas as colunas críticas presentes em crm_messages")
        except:
            pass
    
    else:
        print("\n⚠️  Execute a migration para criar as tabelas:")
        print("   python3 crm/migrate_schema.py")
        print("   (Em seguida, cole o SQL no Supabase Dashboard)")
    
    print("\n" + "="*80 + "\n")


if __name__ == '__main__':
    main()
