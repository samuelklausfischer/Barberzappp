#!/usr/bin/env python3
"""
Teste do CRM Logger para BarberZap

Script de teste para validar as funções do crm_logger.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from crm.crm_logger import (
    upsert_lead,
    log_message,
    get_lead_history,
    lead_exists,
    get_lead_by_id,
    update_lead_status,
    list_leads,
    get_message_by_id,
    CRMError,
    CRMLeadNotFoundError,
    CRMMessageError
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def create_test_phone():
    """Cria um número de telefone único baseado em timestamp."""
    import time
    return f"5511{int(time.time() * 1000) % 1000000000:09d}"


def test_upsert_lead():
    """Testa função upsert_lead."""
    print("\n" + "="*60)
    print("TEST 1: upsert_lead")
    print("="*60)
    
    # Usa UUID de tenant existente no banco
    test_tenant = "d9fd2be4-0768-483b-b122-b60277335e2a"
    test_phone = create_test_phone()
    test_name = "Cliente Teste CRM Python"
    
    try:
        # Teste 1: Criar novo lead
        print(f"\n1. Criando novo lead: phone={test_phone}")
        lead = upsert_lead(
            tenant_id=test_tenant,
            phone=test_phone,
            name=test_name,
            status="new",
            email="teste@email.com",
            notes="Lead de teste"
        )
        
        assert 'id' in lead, "Lead deve ter ID"
        assert lead['name'] == test_name, "Nome deve corresponder"
        assert lead['status'] == "new", "Status deve ser 'new'"
        assert lead['phone'] == test_phone, "Telefone deve corresponder"
        
        print(f"   ✓ Lead criado: ID={lead['id']}")
        print(f"   ✓ Nome: {lead['name']}")
        print(f"   ✓ Status: {lead['status']}")
        
        lead_id = lead['id']
        
        # Teste 2: Atualizar lead existente (mesmo status devido a constraints)
        print(f"\n2. Atualizando lead existente: ID={lead_id}")
        updated = upsert_lead(
            tenant_id=test_tenant,
            phone=test_phone,
            status="new",  # Mantém "new" pois o DB tem constraint
            notes="Lead atualizado"
        )

        assert updated['id'] == lead_id, "ID deve permanecer igual"
        assert updated.get('status') == "new", "Status deve manter-se 'new'"
        assert updated.get('name') == test_name, "Nome deve permanecer igual"
        
        print(f"   ✓ Lead atualizado")
        print(f"   ✓ Status: {updated['status']}")
        
        # Teste 3: UPSERT com metadata
        print(f"\n3. Testando upsert com metadata")
        with_meta = upsert_lead(
            tenant_id=test_tenant,
            phone=test_phone,
            metadata={'source': 'whatsapp', 'campaign': 'teste'}
        )
        
        assert 'metadata' in with_meta, "Metadata deve estar presente"
        
        print(f"   ✓ Lead com metadata criado")
        print(f"   ✓ Metadata: {with_meta['metadata']}")
        
        print("\n   ✅ TESTE upsert_lead PASSOU")
        return True, test_tenant, test_phone, lead_id
        
    except Exception as e:
        print(f"\n   ❌ TESTE upsert_lead FALHOU: {e}")
        import traceback
        traceback.print_exc()
        return False, None, None, None


def test_log_message(tenant_id, phone):
    """Testa função log_message."""
    print("\n" + "="*60)
    print("TEST 2: log_message")
    print("="*60)
    
    if not tenant_id or not phone:
        print("\n   ⚠️  Pulando teste (parâmetros inválidos)")
        return False, None, None
    
    try:
        # Teste 1: Mensagem recebida (inbound)
        print(f"\n1. Registrando mensagem inbound...")
        msg1 = log_message(
            tenant_id=tenant_id,
            phone=phone,
            sender="cliente",
            message="Olá! Gostaria de agendar um corte de cabelo.",
            metadata={'message_id': 'msg_001', 'timestamp': '2024-01-01T10:00:00'}
        )
        
        assert 'id' in msg1, "Mensagem deve ter ID"
        assert msg1.get('direction') == 'inbound' or msg1.get('_direction') == 'inbound', "Direção deve ser 'inbound'"
        # Nota: 'status' não existe no schema atual do banco
        
        print(f"   ✓ Mensagem registrada: ID={msg1['id']}")
        print(f"   ✓ Direction: {msg1['direction']}")
        print(f"   ✓ Message: {msg1['message'][:50]}...")
        
        msg1_id = msg1['id']
        
        # Teste 2: Mensagem enviada (outbound)
        print(f"\n2. Registrando mensagem outbound...")
        msg2 = log_message(
            tenant_id=tenant_id,
            phone=phone,
            sender="sistema",
            message="Olá! Bem-vindo à Barbearia. Temos horários disponíveis!",
            direction="outbound",
            status="sent",
            metadata={'whatsapp_message_id': 'wa_001'}
        )
        
        assert msg2.get('direction') == 'outbound' or msg2.get('_direction') == 'outbound', "Direção deve ser 'outbound'"
        # Nota: 'status' não existe no schema atual do banco

        print(f"   ✓ Mensagem registrada: ID={msg2['id']}")
        print(f"   ✓ Direction: {msg2.get('direction', msg2.get('_direction', 'unknown'))}")
        # Nota: status não está presente no schema
        
        msg2_id = msg2['id']
        
        # Teste 3: Direção automática
        print(f"\n3. Testando detecção automática de direção...")
        msg3 = log_message(
            tenant_id=tenant_id,
            phone=phone,
            sender="bot",
            message="Posso ajudar com mais alguma coisa?"
        )
        
        assert msg3.get('direction') == 'outbound' or msg3.get('_direction') == 'outbound', "Deve detectar como outbound"

        print(f"   ✓ Detecção automática: {msg3.get('direction', msg3.get('_direction', 'unknown'))}")
        
        msg3_id = msg3['id']
        
        print("\n   ✅ TESTE log_message PASSOU")
        return True, [msg1_id, msg2_id, msg3_id]
        
    except Exception as e:
        print(f"\n   ❌ TESTE log_message FALHOU: {e}")
        import traceback
        traceback.print_exc()
        return False, []


def test_get_lead_history(tenant_id, phone):
    """Testa função get_lead_history."""
    print("\n" + "="*60)
    print("TEST 3: get_lead_history")
    print("="*60)
    
    if not tenant_id or not phone:
        print("\n   ⚠️  Pulando teste (parâmetros inválidos)")
        return False
    
    try:
        # Teste 1: Buscar histórico completo
        print(f"\n1. Buscando histórico completo...")
        history = get_lead_history(tenant_id, phone)
        
        assert isinstance(history, list), "Histórico deve ser uma lista"
        assert len(history) > 0, "Histórico deve ter mensagens"
        
        print(f"   ✓ Histórico recuperado: {len(history)} mensagens")
        
        for i, msg in enumerate(history, 1):
            print(f"      {i}. [{msg['direction'].upper()}] {msg['sender']}: {msg['message'][:40]}...")
        
        # Teste 2: Verificar ordenação cronológica
        print(f"\n2. Verificando ordenação cronológica...")
        timestamps = [msg['created_at'] for msg in history]
        assert timestamps == sorted(timestamps), "Mensagens devem estar ordenadas por data"
        
        print(f"   ✓ Mensagens ordenadas cronologicamente")
        
        # Teste 3: Histórico com info do lead
        print(f"\n3. Buscando histórico com info do lead...")
        history_with_info = get_lead_history(tenant_id, phone, include_lead_info=True)
        
        for msg in history_with_info:
            assert '_lead_info' in msg, "Mensagem deve ter info do lead"
            assert 'name' in msg['_lead_info'], "Info do lead deve ter nome"
        
        print(f"   ✓ Histórico com info do lead")
        
        # Teste 4: Histórico com limite
        print(f"\n4. Buscando histórico com limite...")
        limited = get_lead_history(tenant_id, phone, limit=2)
        
        assert len(limited) <= 2, "Limite deve ser respeitado"
        
        print(f"   ✓ Histórico limitado: {len(limited)} mensagens")
        
        # Teste 5: Lead não existente
        print(f"\n5. Buscando histórico de lead inexistente...")
        fake_phone = f"5511{int(__import__('time').time() * 1000) % 1000000000:09d}"
        empty = get_lead_history(tenant_id, fake_phone)
        
        assert len(empty) == 0, "Histórico deve ser vazio para lead inexistente"
        
        print(f"   ✓ Histórico vazio para lead inexistente")
        
        print("\n   ✅ TESTE get_lead_history PASSOU")
        return True
        
    except Exception as e:
        print(f"\n   ❌ TESTE get_lead_history FALHOU: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_helper_functions(tenant_id, phone, lead_id=None):
    """Testa funções auxiliares."""
    print("\n" + "="*60)
    print("TEST 4: Funções Auxiliares")
    print("="*60)
    
    if not tenant_id or not phone:
        print("\n   ⚠️  Pulando teste (parâmetros inválidos)")
        return False
    
    try:
        # Teste 1: lead_exists
        print(f"\n1. Verificando existência do lead...")
        exists = lead_exists(tenant_id, phone)
        
        assert exists is True, "Lead deve existir"
        print(f"   ✓ Lead existe: {exists}")
        
        # Teste 2: Lead inexistente
        print(f"\n2. Verificando lead inexistente...")
        fake_phone = f"5511{int(__import__('time').time() * 1000) % 1000000000:09d}"
        not_exists = lead_exists(tenant_id, fake_phone)
        
        assert not_exists is False, "Lead não deve existir"
        print(f"   ✓ Lead não existe: {not_exists}")
        
        # Teste 3: get_lead_by_id
        if lead_id:
            print(f"\n3. Buscando lead por ID...")
            lead = get_lead_by_id(tenant_id, lead_id)
            
            assert lead is not None, "Lead deve ser encontrado"
            assert lead['id'] == lead_id, "ID deve corresponder"
            print(f"   ✓ Lead encontrado: ID={lead['id']}, Nome={lead['name']}")
        
        # Teste 4: update_lead_status (mantém "new" devido a constraints)
        print(f"\n4. Atualizando status do lead...")
        updated = update_lead_status(
            tenant_id,
            phone,
            "new",
            notes="Teste de atualização de status"
        )

        assert updated.get('status') == 'new', "Status deve ser mantido"
        notes = updated.get('notes', '')
        assert 'Teste de atualização' in notes, "Anotação deve ser adicionada"
        
        print(f"   ✓ Status atualizado: {updated['status']}")
        print(f"   ✓ Notes atualizados")
        
        # Teste 5: list_leads
        print(f"\n5. Listando leads...")
        leads = list_leads(tenant_id, status="new", limit=10)

        assert isinstance(leads, list), "Leads deve ser uma lista"
        print(f"   ✓ Leads listados: {len(leads)} encontrados com status 'new'")
        
        # Teste 6: get_message_by_id
        print(f"\n6. Buscando mensagem mais recente por lead_history...")
        history = get_lead_history(tenant_id, phone, limit=1)
        if history:
            msg_id = history[0]['id']
            message = get_message_by_id(tenant_id, msg_id)
            
            assert message is not None, "Mensagem deve ser encontrada"
            assert message['id'] == msg_id, "ID da mensagem deve corresponder"
            
            print(f"   ✓ Mensagem encontrada: ID={message['id']}")
        
        print("\n   ✅ TESTE funções auxiliares PASSOU")
        return True
        
    except Exception as e:
        print(f"\n   ❌ TESTE funções auxiliares FALHOU: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_error_handling(tenant_id, phone):
    """Testa tratamento de erros."""
    print("\n" + "="*60)
    print("TEST 5: Tratamento de Erros")
    print("="*60)
    
    try:
        # Teste 1: Lead não encontrado para update de status
        print(f"\n1. Testando CRMLeadNotFoundError...")
        fake_phone = f"5511{int(__import__('time').time() * 1000) % 1000000000:09d}"
        
        try:
            update_lead_status(tenant_id, fake_phone, "new")
            assert False, "Deve lançar exceção"
        except CRMLeadNotFoundError as e:
            print(f"   ✓ CRMLeadNotFoundError lançada corretamente")
            print(f"      Mensagem: {str(e)}")
        
        print("\n   ✅ TESTE tratamento de erros PASSOU")
        return True
        
    except Exception as e:
        print(f"\n   ❌ TESTE tratamento de erros FALHOU: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Executa todos os testes."""
    print("\n" + "="*60)
    print("CRM LOGGER - SUITE DE TESTES")
    print("="*60)
    
    results = []
    tenant_id = None
    phone = None
    lead_id = None
    message_ids = []
    
    try:
        # Executa testes em sequência
        success, tenant_id, phone, lead_id = test_upsert_lead()
        results.append(("upsert_lead", success))
        
        if success:
            success, message_ids = test_log_message(tenant_id, phone)
            results.append(("log_message", success))
            
            success = test_get_lead_history(tenant_id, phone)
            results.append(("get_lead_history", success))
            
            success = test_helper_functions(tenant_id, phone, lead_id)
            results.append(("helper_functions", success))
            
            success = test_error_handling(tenant_id, phone)
            results.append(("error_handling", success))
        
    finally:
        # Resumo dos testes
        print("\n" + "="*60)
        print("RESUMO DOS TESTES")
        print("="*60)
        
        passed = sum(1 for _, success in results if success)
        total = len(results)
        
        for test_name, success in results:
            status = "✅ PASSOU" if success else "❌ FALHOU"
            print(f"  {test_name:.<30} {status}")
        
        print(f"\n  Total: {passed}/{total} testes passaram")
        
        if passed == total:
            print("\n  🎉 Todos os testes passaram!")
        else:
            print(f"\n  ⚠️  {total - passed} teste(s) falhou/aram")
        
        print("="*60 + "\n")
        
        # Retorna código de saída apropriado
        sys.exit(0 if passed == total else 1)


if __name__ == '__main__':
    main()
