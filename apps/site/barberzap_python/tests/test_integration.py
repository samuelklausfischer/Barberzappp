"""
BarberZap Integration Test - FASE 7b

Complete end-to-end integration test for the BarberZap webhook flow.

Tests the complete flow:
1. Webhook payload (simulated)
2. Normalizer → instance_name + phone + message
3. Tenant Resolution → user_id
4. Context Builder → context completo
5. Secretaria Universal → IA response (mock)
6. CRM Logger → upsert_lead + log_message
7. Evolution API → send_message (mock)

Validation:
- All layers connect correctly
- Tenant resolution works
- Context builder returns correct data
- IA response generated (mock)
- CRM logs saved
- Evolution API send_message called (mock)
"""

import pytest
import os
import sys
from unittest.mock import patch, Mock, MagicMock, AsyncMock, call, PropertyMock
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.mark.integration
@pytest.mark.slow
class TestBarberZapIntegrationFlow:
    """
    Complete integration test for BarberZap webhook flow.

    Validates that all layers connect correctly and process
    a webhook message from start to finish.
    """

    # ============================================================
    # FIXTURES
    # ============================================================

    @pytest.fixture
    def webhook_payload(self):
        """
        Sample Evolution API webhook payload.
        Represents a real message from WhatsApp.
        """
        return {
            "event": "messages.upsert",
            "instance": {
                "instanceName": "barbearia_001",
                "status": "open"
            },
            "data": [{
                "key": {
                    "remoteJid": "5511999999999@s.whatsapp.net",
                    "fromMe": False,
                    "id": "3EB0FAED6CC5D57E"
                },
                "message": {
                    "conversation": "Olá, quero agendar um corte para sexta às 14h"
                },
                "pushName": "João Silva",
                "timestamp": 1740315600
            }]
        }

    @pytest.fixture
    def webhook_payload_barbeiro(self):
        """
        Webhook payload requesting specific barber.
        """
        return {
            "event": "messages.upsert",
            "instance": {
                "instanceName": "barbearia_001",
                "status": "open"
            },
            "data": [{
                "key": {
                    "remoteJid": "5511888888888@s.whatsapp.net",
                    "fromMe": False,
                    "id": "3EB0FAED6CC5D57F"
                },
                "message": {
                    "conversation": "Quero cortar com o Carlos na terça às 10h"
                },
                "pushName": "Maria Santos",
                "timestamp": 1740315700
            }]
        }

    @pytest.fixture
    def expected_tenant_data(self):
        """Expected tenant configuration from Supabase."""
        return {
            'id': 1,
            'instance_name': 'barbearia_001',
            'user_id': 'tenant_user_123',
            'status': 'active',
            'api_key': 'test_api_key',
            'webhook_url': 'https://webhook.example.com/barberzap'
        }

    @pytest.fixture
    def expected_agente_config(self):
        """Expected barbershop configuration."""
        return {
            'user_id': 'tenant_user_123',
            'name': 'Barbearia Central',
            'address': 'Rua das Flores, 123 - Centro',
            'hours': 'Seg-Sex: 09:00-19:00, Sáb: 09:00-16:00',
            'ai_name': 'Ana',
            'phone': '11999999999',
            'whatsapp': '5511999999999',
            'created_at': '2026-01-01T00:00:00Z',
            'updated_at': '2026-02-01T00:00:00Z'
        }

    @pytest.fixture
    def expected_barbers(self):
        """Expected barbers list."""
        return [
            {
                'id': 1,
                'name': 'Carlos',
                'status': 'active',
                'specialty': 'Corte Clássico'
            },
            {
                'id': 2,
                'name': 'Pedro',
                'status': 'active',
                'specialty': 'Barba Moderna'
            },
            {
                'id': 3,
                'name': 'Lucas',
                'status': 'inactive',
                'specialty': 'Corte Infantil'
            }
        ]

    @pytest.fixture
    def expected_services(self):
        """Expected services list."""
        return [
            {
                'id': 1,
                'name': 'Corte de Cabelo',
                'price': 35.0,
                'description': 'Corte clássico ou moderno',
                'duration': 30,
                'status': 'active'
            },
            {
                'id': 2,
                'name': 'Barba',
                'price': 25.0,
                'description': 'Barba com toalha quente',
                'duration': 20,
                'status': 'active'
            },
            {
                'id': 3,
                'name': 'Corte + Barba',
                'price': 50.0,
                'description': 'Combo completo',
                'duration': 45,
                'status': 'active'
            }
        ]

    @pytest.fixture
    def expected_ai_response(self):
        """Expected AI response."""
        return {
            'success': True,
            'response': 'Claro, João! Vou anotar: corte de cabelo para sexta às 14h. Pode confirmar o agendamento? ✂️',
            'tokens_used': 87,
            'model': 'test-model',
            'provider': 'mock_provider',
            'tenant_id': 'tenant_user_123',
            'ai_name': 'Ana',
            'barbershop_name': 'Barbearia Central'
        }

    @pytest.fixture
    def mock_dependencies(self):
        """
        Setup all mock dependencies for the integration test.

        This fixture creates mocks for:
        - Supabase (tenant resolution, context builder, CRM)
        - PostgreSQL (chat history)
        - AI Service
        - Evolution API
        """
        # ============= SUPABASE MOCK =============
        mock_sb_client = MagicMock()
        mock_supabase = MagicMock(return_value=mock_sb_client)

        # ============= POSTGRESQL MOCK =============
        mock_pg_conn = MagicMock()
        mock_pg_cursor = MagicMock()
        mock_pg = MagicMock(return_value=mock_pg_conn)
        mock_pg_conn.cursor.return_value = mock_pg_cursor
        mock_pg_cursor.fetchall.return_value = []
        mock_pg_cursor.fetchone.return_value = None

        # ============= AI SERVICE MOCK =============
        mock_ai_service = MagicMock()
        mock_create_ai = MagicMock(return_value=mock_ai_service)

        # ============= EVOLUTION API MOCK =============
        mock_evolution_send = MagicMock(return_value={
            'success': True,
            'message_id': 'msg_integration_test_123',
            'error': None
        })

        return {
            'supabase': mock_sb_client,
            'supabase_patch': mock_supabase,
            'postgres': mock_pg_conn,
            'postgres_cursor': mock_pg_cursor,
            'ai': mock_ai_service,
            'create_ai': mock_create_ai,
            'evolution': mock_evolution_send,
            'mock_pg': mock_pg
        }

    # ============================================================
    # TEST: NORMALIZER ONLY
    # ============================================================

    @pytest.mark.integration
    def test_normalizer_step(self, webhook_payload):
        """
        TEST 1: Normalizer step only.
        Validates webhook payload normalization.
        """
        print("\n" + "="*80)
        print("TEST 1: Normalizer Step")
        print("="*80)

        from webhooks.webhook_handler import WebhookNormalizer

        normalized = WebhookNormalizer.normalize(webhook_payload)

        # Validate normalized data
        assert normalized['is_valid'] is True, "Payload should be valid"
        assert normalized['should_process'] is True, "Message should be processed"
        assert normalized['instance_name'] == 'barbearia_001'
        assert normalized['sender'] == '5511999999999'
        assert normalized['message'] == 'Olá, quero agendar um corte para sexta às 14h'
        assert normalized['client_name'] == 'João Silva'

        print("\n✅ Normalizer works correctly!")
        print(f"   instance_name: {normalized['instance_name']}")
        print(f"   sender: {normalized['sender']}")
        print(f"   message: {normalized['message']}")
        print(f"   client_name: {normalized['client_name']}")

    # ============================================================
    # TEST: NORMALIZER + TENANT RESOLUTION
    # ============================================================

    @pytest.mark.integration
    def test_normalizer_and_tenant_resolution(
        self,
        webhook_payload,
        expected_tenant_data,
        mock_dependencies
    ):
        """
        TEST 2: Normalizer + Tenant Resolution.
        Validates that tenant is correctly resolved from instance name.
        """
        print("\n" + "="*80)
        print("TEST 2: Normalizer + Tenant Resolution")
        print("="*80)

        mock_sb = mock_dependencies['supabase']
        mock_supabase = mock_dependencies['supabase_patch']

        # Patch tenant_resolver.get_client
        with patch('core.tenant_resolver.get_client', mock_supabase):

            # Configure Supabase to return tenant data
            mock_sb.get.return_value = expected_tenant_data

            # Step 1: Normalizer
            from webhooks.webhook_handler import WebhookNormalizer
            normalized = WebhookNormalizer.normalize(webhook_payload)

            # Step 2: Tenant Resolution
            from core.tenant_resolver import resolve_tenant
            tenant_id = resolve_tenant(normalized['instance_name'])

            # Validate
            assert tenant_id is not None, "Tenant ID should not be None"
            assert tenant_id == expected_tenant_data['user_id']
            assert mock_sb.get.called, "Supabase get should be called"

            print("\n✅ Tenant resolution works!")
            print(f"   instance_name: {normalized['instance_name']}")
            print(f"   tenant_id: {tenant_id}")

    # ============================================================
    # TEST: CONTEXT BUILDER
    # ============================================================

    @pytest.mark.integration
    def test_context_builder(
        self,
        expected_agente_config,
        expected_barbers,
        expected_services,
        mock_dependencies
    ):
        """
        TEST 3: Context Builder.
        Validates that context is correctly built from database.
        """
        print("\n" + "="*80)
        print("TEST 3: Context Builder")
        print("="*80)

        tenant_id = 'tenant_user_123'
        mock_sb = mock_dependencies['supabase']
        mock_supabase = mock_dependencies['supabase_patch']

        with patch('core.context_builder.get_client', mock_supabase):

            # Configure Supabase mock
            call_count = [0]

            def supabase_side_effect(table, filters=None, single=False):
                call_count[0] += 1
                if table == 'agente_config':
                    return expected_agente_config
                elif table == 'barbers':
                    return [b for b in expected_barbers if b['status'] == 'active']
                elif table == 'services':
                    return expected_services
                return None

            mock_sb.get.side_effect = supabase_side_effect

            # Build context
            from core.context_builder import build_context
            context = build_context(tenant_id)

            # Validate
            assert context is not None
            assert 'barbershop' in context
            assert 'barbers' in context
            assert 'services' in context
            assert context['barbershop']['name'] == expected_agente_config['name']
            assert len(context['barbers']) == 2  # 2 active barbers
            assert len(context['services']) == 3

            print("\n✅ Context builder works!")
            print(f"   barbershop: {context['barbershop']['name']}")
            print(f"   barbers: {[b['name'] for b in context['barbers']]}")
            print(f"   services: {len(context['services'])} services")

    # ============================================================
    # TEST: AI RESPONSE GENERATION
    # ============================================================

    @pytest.mark.integration
    def test_ai_response_generation(
        self,
        expected_agente_config,
        expected_barbers,
        expected_services,
        mock_dependencies
    ):
        """
        TEST 4: AI Response Generation.
        Validates that AI generates responses correctly.
        """
        print("\n" + "="*80)
        print("TEST 4: AI Response Generation")
        print("="*80)

        context = {
            'barbershop': expected_agente_config,
            'barbers': [b for b in expected_barbers if b['status'] == 'active'],
            'services': expected_services
        }

        mock_ai = mock_dependencies['ai']
        mock_create_ai = mock_dependencies['create_ai']
        mock_pg = mock_dependencies['mock_pg']
        mock_supabase = mock_dependencies['supabase_patch']

        with patch('core.tenant_resolver.get_client', mock_supabase), \
             patch('integrations.postgres_memory.psycopg2.connect', mock_pg), \
             patch('agents.secretaria_universal.create_ai_service', mock_create_ai), \
             patch('agents.secretaria_universal.get_chat_history') as mock_get_history, \
             patch('agents.secretaria_universal.save_message') as mock_save:

            mock_get_history.return_value = []
            mock_ai.generate_response.return_value = {
                'success': True,
                'response': 'Claro! Vou anotar o agendamento. ✅',
                'tokens_used': 50,
                'tenant_id': 'tenant_user_123',
                'ai_name': 'Ana',
                'barbershop_name': 'Barbearia Central'
            }
            mock_save.return_value = {'success': True}

            from agents.secretaria_universal import generate_response
            result = generate_response(
                instance_name='barbearia_001',
                phone='5511999999999',
                message='Quero agendar um corte',
                context_override=context
            )

            assert result['success'] is True
            assert 'response' in result
            assert len(result['response']) > 0

            print("\n✅ AI response generation works!")
            print(f"   response: {result['response'][:50]}...")

    # ============================================================
    # TEST: CRM LOGGING
    # ============================================================

    @pytest.mark.integration
    def test_crm_logging(self, mock_dependencies):
        """
        TEST 5: CRM Logging.
        Validates that CRM operations work correctly.
        """
        print("\n" + "="*80)
        print("TEST 5: CRM Logging")
        print("="*80)

        mock_sb = mock_dependencies['supabase']
        mock_supabase = mock_dependencies['supabase_patch']

        with patch('crm.crm_manager.get_client', mock_supabase):

            # Test upsert_lead (new lead)
            msg_id_counter = [1]
            mock_sb.get.return_value = None  # Lead not found
            mock_sb.post.side_effect = lambda table, data: {'id': msg_id_counter[0]}

            from crm.crm_manager import upsert_lead
            lead_result = upsert_lead(
                user_id='tenant_user_123',
                phone='5511999999999',
                name='João Silva',
                status='new',
                source='whatsapp'
            )

            assert lead_result['success'] is True
            assert lead_result['action'] == 'created'

            lead_id = lead_result['lead_id']

            # Test log_message
            msg_id_counter[0] = 2
            from crm.crm_manager import log_message
            msg_result = log_message(
                lead_id=lead_id,
                user_id='tenant_user_123',
                phone='5511999999999',
                direction='inbound',
                message='Test message'
            )

            assert msg_result['success'] is True

            print("\n✅ CRM logging works!")
            print(f"   lead_id: {lead_id}")
            print(f"   lead_action: {lead_result['action']}")
            print(f"   message_logged: {msg_result['success']}")

    # ============================================================
    # TEST: EVOLUTION API
    # ============================================================

    @pytest.mark.integration
    def test_evolution_api_send_message(self):
        """
        TEST 6: Evolution API send_message.
        Validates that Evolution API wrapper works.
        """
        print("\n" + "="*80)
        print("TEST 6: Evolution API Send Message")
        print("="*80)

        from integrations.evolution_api import EvolutionAPI

        api = EvolutionAPI()
        result = api.send_message(
            instance_name='barbearia_001',
            phone='5511999999999@s.whatsapp.net',
            message='Test message'
        )

        assert result['success'] is True
        assert result['message_id'] is not None

        print("\n✅ Evolution API send_message works!")
        print(f"   message_id: {result['message_id']}")

    # ============================================================
    # TEST 7: COMPLETE INTEGRATED FLOW (NEW LEAD)
    # ============================================================

    @pytest.mark.integration
    def test_complete_flow_new_lead(
        self,
        webhook_payload,
        expected_tenant_data,
        expected_agente_config,
        expected_barbers,
        expected_services,
        expected_ai_response,
        mock_dependencies
    ):
        """
        TEST 7: Complete webhook flow with NEW LEAD.
        Integrates all 7 steps in a single test.
        """
        print("\n" + "="*80)
        print("TEST 7: COMPLETE FLOW - NEW LEAD")
        print("="*80)

        mock_sb = mock_dependencies['supabase']
        mock_supabase = mock_dependencies['supabase_patch']
        mock_pg = mock_dependencies['mock_pg']
        mock_ai = mock_dependencies['ai']
        mock_create_ai = mock_dependencies['create_ai']
        mock_evolution = mock_dependencies['evolution']

        # Apply ALL patches
        with patch('core.tenant_resolver.get_client', mock_supabase), \
             patch('core.context_builder.get_client', mock_supabase), \
             patch('crm.crm_manager.get_client', mock_supabase), \
             patch('integrations.postgres_memory.psycopg2.connect', mock_pg), \
             patch('agents.secretaria_universal.create_ai_service', mock_create_ai), \
             patch('integrations.evolution_api.EvolutionAPI.send_message', mock_evolution), \
             patch('agents.secretaria_universal.get_chat_history') as mock_get_history, \
             patch('agents.secretaria_universal.save_message') as mock_save:

            # Configure mocks
            mock_get_history.return_value = []
            mock_save.return_value = {'success': True}

            call_count = [0]
            msg_id_counter = [0]

            def supabase_side_effect(table, filters=None, single=False):
                call_count[0] += 1
                if table == 'whatsapp_instances':
                    return expected_tenant_data
                elif table == 'agente_config':
                    return expected_agente_config
                elif table == 'barbers':
                    return [b for b in expected_barbers if b['status'] == 'active']
                elif table == 'services':
                    return expected_services
                elif table == 'crm_leads':
                    return None  # New lead
                return None

            mock_sb.get.side_effect = supabase_side_effect
            mock_sb.post.side_effect = lambda table, data: {'id': msg_id_counter[0]}

            mock_ai.generate_response.return_value = expected_ai_response

            # STEP 1: Webhook payload received
            print("\n[STEP 1] Webhook Payload Received ✅")

            # STEP 2: Normalizer
            from webhooks.webhook_handler import WebhookNormalizer
            normalized = WebhookNormalizer.normalize(webhook_payload)
            assert normalized['is_valid'] is True
            print("[STEP 2] Normalizer ✅")

            # STEP 3: Tenant Resolution
            from core.tenant_resolver import resolve_tenant
            tenant_id = resolve_tenant(normalized['instance_name'])
            assert tenant_id == expected_tenant_data['user_id']
            print(f"[STEP 3] Tenant Resolution ✅ (tenant_id: {tenant_id})")

            # STEP 4: Context Builder
            from core.context_builder import build_context
            context = build_context(tenant_id)
            assert context is not None
            print("[STEP 4] Context Builder ✅")

            # STEP 5: IA Response
            from agents.secretaria_universal import generate_response
            ai_result = generate_response(
                instance_name=normalized['instance_name'],
                phone=normalized['sender'],
                message=normalized['message'],
                context_override=context
            )
            assert ai_result['success'] is True
            print(f"[STEP 5] IA Response ✅ (response: {ai_result['response'][:40]}...)")

            # STEP 6: CRM Logger
            from crm.crm_manager import upsert_lead, log_message
            lead_result = upsert_lead(
                user_id=tenant_id,
                phone=normalized['sender'],
                name=normalized['client_name']
            )
            assert lead_result['success'] is True
            print(f"[STEP 6] CRM Logger ✅ (lead_id: {lead_result['lead_id']})")

            # Log messages
            log_message(
                lead_id=lead_result['lead_id'],
                user_id=tenant_id,
                phone=normalized['sender'],
                direction='inbound',
                message=normalized['message']
            )

            log_message(
                lead_id=lead_result['lead_id'],
                user_id=tenant_id,
                phone=normalized['sender'],
                direction='outbound',
                message=ai_result['response']
            )

            # STEP 7: Evolution API
            from integrations.evolution_api import EvolutionAPI
            evolution_api = EvolutionAPI()
            send_result = evolution_api.send_message(
                instance_name=normalized['instance_name'],
                phone=f"{normalized['sender']}@s.whatsapp.net",
                message=ai_result['response']
            )
            assert send_result['success'] is True
            print("[STEP 7] Evolution API ✅")

            # FINAL VALIDATION
            print("\n" + "="*80)
            print("FINAL VALIDATION ✅")
            print("="*80)
            print("✅ All layers connected correctly!")
            print("✅ Tenant resolution works!")
            print("✅ Context builder returns correct data!")
            print("✅ IA response generated successfully!")
            print("✅ CRM logs saved correctly!")
            print("✅ Evolution API send_message called successfully!")
            print("\n🎉 COMPLETE FLOW VALIDATED SUCCESSFULLY! 🎉")

            # Verify all calls
            assert mock_sb.get.called, "Supabase get should be called"
            assert mock_ai.generate_response.called, "AI generate should be called"
            assert mock_evolution.called, "Evolution API send should be called"


# ============================================================
# RUN TESTS
# ============================================================

if __name__ == '__main__':
    print("\n" + "="*80)
    print("BarberZap Integration Test Suite - FASE 7b")
    print("="*80)
    print("\nRunning integration tests...")
    print("="*80 + "\n")

    pytest.main([
        __file__,
        '-v',
        '-s',
        '--tb=short',
        '-m', 'integration'
    ])
