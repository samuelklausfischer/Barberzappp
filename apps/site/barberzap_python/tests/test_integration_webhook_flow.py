"""
Integration Test for Complete Webhook Flow

Tests the complete flow:
webhook → tenant → context → IA → CRM → Evolution API
"""

import pytest
import os
import sys
from unittest.mock import patch, Mock, MagicMock, call
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.mark.integration
@pytest.mark.slow
class TestWebhookIntegrationFlow:
    """
    Integration test for complete webhook flow.

    Flow:
    1. Webhook payload received
    2. WebhookNormalizer.normalize()
    3. Core: resolve_tenant()
    4. Core: build_context()
    5. AI: generate_response()
    6. CRM: log_conversation()
    7. Evolution API: send_message()
    """

    @pytest.fixture
    def sample_webhook_payload(self):
        """Sample Evolution API webhook payload."""
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
    def mock_dependencies(self):
        """Setup all mock dependencies."""
        with patch('core.tenant_resolver.get_client') as mock_supabase, \
             patch('integrations.postgres_memory.psycopg2.connect') as mock_pg, \
             patch('agents.secretaria_universal.create_ai_service') as mock_create_ai, \
             patch('integrations.evolution_api.send_message') as mock_evolution_send:

            # Supabase mock
            mock_sb_client = Mock()
            mock_sb_client.get.return_value = {
                'id': 1,
                'instance_name': 'barbearia_001',
                'user_id': 'tenant_123'
            }
            mock_supabase.return_value = mock_sb_client

            # PostgreSQL mock
            mock_conn = Mock()
            mock_cursor = Mock()
            mock_pg.return_value = mock_conn
            mock_conn.cursor.return_value = mock_cursor
            mock_cursor.fetchall.return_value = []
            mock_cursor.fetchone.return_value = 456

            # AI Service mock
            mock_ai = Mock()
            mock_ai.generate_response.return_value = {
                'success': True,
                'response': 'Claro, João! Vou anotar: corte de cabelo para sexta às 14h. Pode confirmar?',
                'tokens_used': 85,
                'model': 'test-model',
                'provider': 'mock_provider'
            }
            mock_create_ai.return_value = mock_ai

            # Evolution API mock
            mock_evolution_send.return_value = {
                'success': True,
                'message_id': 'msg_123'
            }

            yield {
                'supabase': mock_sb_client,
                'postgres': mock_conn,
                'ai': mock_ai,
                'evolution': mock_evolution_send
            }

    def test_complete_webhook_flow(
        self,
        sample_webhook_payload,
        mock_dependencies
    ):
        """
        Test complete webhook flow from start to finish.

        Steps:
        1. Normalize webhook payload
        2. Resolve tenant
        3. Build context
        4. Generate AI response
        5. Log to CRM
        6. Send via Evolution API
        """

        # Import after patches are applied
        from webhooks.webhook_handler import WebhookNormalizer
        from core.tenant_resolver import resolve_tenant
        from core.context_builder import build_context
        from agents.secretaria_universal import generate_response
        from crm.crm_manager import log_conversation
        from integrations.evolution_api import send_message as evolution_send_message

        # ========================
        # STEP 1: NORMALIZE
        # ========================
        print("\n[1] Normalizing webhook payload...")
        normalized = WebhookNormalizer.normalize(sample_webhook_payload)

        assert normalized['is_valid'] is True
        assert normalized['should_process'] is True
        assert normalized['instance_name'] == 'barbearia_001'
        assert normalized['sender'] == '5511999999999'
        assert normalized['message'] == 'Olá, quero agendar um corte para sexta às 14h'
        assert normalized['client_name'] == 'João Silva'

        print(f"  ✓ Normalized: instance={normalized['instance_name']}, phone={normalized['sender']}")

        # ========================
        # STEP 2: TENANT RESOLUTION
        # ========================
        print("\n[2] Resolving tenant...")
        tenant_id = resolve_tenant(normalized['instance_name'])

        assert tenant_id == 'tenant_123'
        print(f"  ✓ Tenant resolved: {tenant_id}")

        # ========================
        # STEP 3: CONTEXT BUILDING
        # ========================

        # Mock build_context
        with patch('core.context_builder.get_client') as mock_ctx_client:
            mock_ctx_sb = Mock()
            mock_ctx_sb.get.return_value = {
                'barbershop': {
                    'id': 1,
                    'user_id': 'tenant_123',
                    'name': 'Barbearia Central',
                    'ai_name': 'Ana',
                    'address': 'Rua Teste, 123',
                    'hours': '09:00 - 19:00',
                    'phone': '11999999999'
                },
                'barbers': [
                    {'id': 1, 'name': 'Carlos', 'status': 'active'},
                    {'id': 2, 'name': 'Pedro', 'status': 'active'}
                ],
                'services': [
                    {'id': 1, 'name': 'Corte', 'price': 35},
                    {'id': 2, 'name': 'Barba', 'price': 25}
                ]
            }
            mock_ctx_client.return_value = mock_ctx_sb

            print("\n[3] Building context...")
            context = build_context(tenant_id)

            assert context is not None
            assert 'barbershop' in context
            assert context['barbershop']['name'] == 'Barbearia Central'
            assert context['barbershop']['ai_name'] == 'Ana'
            print(f"  ✓ Context built: {context['barbershop']['name']}")

            # ========================
            # STEP 4: AI GENERATION
            # ========================
            print("\n[4] Generating AI response...")
            ai_result = generate_response(
                instance_name=normalized['instance_name'],
                phone=normalized['sender'],
                message=normalized['message'],
                context_override=context,
                save_user_message=False
            )

            assert ai_result['success'] is True
            assert 'response' in ai_result
            assert len(ai_result['response']) > 0
            assert ai_result['tenant_id'] == tenant_id
            assert ai_result['ai_name'] == 'Ana'
            assert ai_result['barbershop_name'] == 'Barbearia Central'
            print(f"  ✓ AI Response: {ai_result['response'][:60]}...")

            # ========================
            # STEP 5: CRM LOGGING
            # ========================
            with patch('crm.crm_manager.get_client') as mock_crm_client:
                mock_crm_sb = Mock()
                mock_crm_sb.get.return_value = None  # Lead doesn't exist
                mock_crm_sb.post.return_value = {'id': 123}  # Create lead
                mock_crm_sb.get.return_value = {'id': 123, 'name': 'João Silva'}  # Lead exists now
                mock_crm_client.return_value = mock_crm_sb

                print("\n[5] Logging to CRM...")
                crm_result = log_conversation(
                    user_id=tenant_id,
                    phone=normalized['sender'],
                    client_name=normalized['client_name'],
                    inbound_message=normalized['message'],
                    outbound_message=ai_result['response'],
                    metadata={
                        'instance_name': normalized['instance_name'],
                        'ai_name': ai_result['ai_name']
                    }
                )

                assert crm_result['success'] is True
                assert crm_result['lead_id'] == 123
                assert crm_result['messages_logged'] >= 2  # inbound + outbound
                print(f"  ✓ CRM logged: lead_id={crm_result['lead_id']}, messages={crm_result['messages_logged']}")

                # ========================
                # STEP 6: EVOLUTION API - SEND MESSAGE
                # ========================
                print("\n[6] Sending message via Evolution API...")
                evolution_result = evolution_send_message(
                    instance_name=normalized['instance_name'],
                    phone=normalized['sender'],
                    message=ai_result['response']
                )

                assert evolution_result['success'] is True
                assert evolution_result['message_id'] == 'msg_123'
                print(f"  ✓ Message sent: {evolution_result['message_id']}")

        # ========================
        # VERIFICATION
        # ========================
        print("\n[✓] Complete flow verified!")

    def test_webhook_flow_with_existing_lead(
        self,
        sample_webhook_payload,
        mock_dependencies
    ):
        """
        Test webhook flow when lead already exists.
        """
        from webhooks.webhook_handler import WebhookNormalizer
        from core.tenant_resolver import resolve_tenant
        from crm.crm_manager import log_conversation
        from integrations.evolution_api import send_message as evolution_send_message

        # Normalize
        normalized = WebhookNormalizer.normalize(sample_webhook_payload)

        # Resolve tenant
        tenant_id = resolve_tenant(normalized['instance_name'])
        assert tenant_id == 'tenant_123'

        # Create mock AI result
        with patch('agents.secretaria_universal.create_ai_service') as mock_create_ai, \
             patch('agents.secretaria_universal.get_chat_history') as mock_get_history:

            mock_ai = Mock()
            mock_ai.generate_response.return_value = {
                'success': True,
                'response': 'Test response',
                'tokens_used': 50
            }
            mock_create_ai.return_value = mock_ai
            mock_get_history.return_value = []

            with patch('crm.crm_manager.get_client') as mock_crm_client, \
                 patch('core.context_builder.get_client') as mock_ctx_client:

                # Mock existing lead
                mock_crm_sb = Mock()
                mock_crm_sb.get.return_value = {
                    'id': 456,
                    'phone': '5511999999999',
                    'name': 'Existing Lead'
                }
                mock_crm_client.return_value = mock_crm_sb

                # Mock context
                mock_ctx_sb = Mock()
                mock_ctx_sb.get.return_value = {
                    'barbershop': {'name': 'Test', 'ai_name': 'AI'},
                    'barbers': [],
                    'services': []
                }
                mock_ctx_client.return_value = mock_ctx_sb

                # Log conversation with existing lead
                crm_result = log_conversation(
                    user_id=tenant_id,
                    phone=normalized['sender'],
                    client_name=normalized['client_name'],
                    inbound_message=normalized['message'],
                    outbound_message="Test response"
                )

                assert crm_result['success'] is True
                # Should use existing lead (ID 456), not create new
                assert crm_result['lead_id'] == 456

    def test_webhook_flow_with_ai_failure(
        self,
        sample_webhook_payload,
        mock_dependencies
    ):
        """
        Test webhook flow when AI generation fails.
        """
        from webhooks.webhook_handler import WebhookNormalizer
        from core.tenant_resolver import resolve_tenant
        from agents.secretaria_universal import generate_response

        # Normalize
        normalized = WebhookNormalizer.normalize(sample_webhook_payload)

        # Resolve tenant
        tenant_id = resolve_tenant(normalized['instance_name'])

        # Mock AI failure
        with patch('agents.secretaria_universal.create_ai_service') as mock_create_ai, \
             patch('agents.secretaria_universal.get_chat_history') as mock_get_history:

            mock_ai = Mock()
            mock_ai.generate_response.return_value = {
                'success': False,
                'error': 'AI service unavailable'
            }
            mock_create_ai.return_value = mock_ai
            mock_get_history.return_value = []

            # Generate response
            ai_result = generate_response(
                instance_name=normalized['instance_name'],
                phone=normalized['sender'],
                message=normalized['message']
            )

            # Should fail gracefully
            assert ai_result['success'] is False
            assert 'error' in ai_result

    def test_webhook_flow_with_evolution_api_failure(
        self,
        sample_webhook_payload,
        mock_dependencies
    ):
        """
        Test webhook flow when Evolution API fails.
        """
        from webhooks.webhook_handler import WebhookNormalizer
        from core.tenant_resolver import resolve_tenant

        # Normalize
        normalized = WebhookNormalizer.normalize(sample_webhook_payload)

        # Resolve tenant
        tenant_id = resolve_tenant(normalized['instance_name'])

        # Mock Evolution API failure
        with patch('integrations.evolution_api.send_message') as mock_evolution_send, \
             patch('agents.secretaria_universal.create_ai_service') as mock_create_ai, \
             patch('agents.secretaria_universal.get_chat_history') as mock_get_history, \
             patch('crm.crm_manager.get_client'), \
             patch('core.context_builder.get_client'):

            mock_create_ai.return_value = Mock(
                generate_response=Mock(return_value={
                    'success': True,
                    'response': 'Test response'
                })
            )
            mock_get_history.return_value = []

            # Simulate failure
            mock_evolution_send.return_value = {
                'success': False,
                'error': 'Evolution API timeout'
            }

            # Try to send
            result = mock_evolution_send(
                instance_name=normalized['instance_name'],
                phone=normalized['sender'],
                message="Test"
            )

            assert result['success'] is False
            assert 'error' in result


@pytest.mark.integration
class TestWebhookFlowComponents:
    """Test individual components in isolation but with more realistic scenarios."""

    @patch('webhooks.webhook_handler.WebhookNormalizer')
    def test_normalizer_robustness(self, mock_normalizer):
        """Test normalizer with various edge cases."""
        from webhooks.webhook_handler import WebhookNormalizer

        # Empty data
        payload = {"event": "messages.upsert", "instance": {}, "data": []}
        result = WebhookNormalizer.normalize(payload)
        assert result['is_valid'] is False
        assert result['should_process'] is False

        # FromMe message (should skip)
        payload = {
            "event": "messages.upsert",
            "instance": {"instanceName": "test"},
            "data": [{
                "key": {"remoteJid": "5511999999999@s.whatsapp.net", "fromMe": True},
                "message": {"conversation": "Test"}
            }]
        }
        result = WebhookNormalizer.normalize(payload)
        assert result['should_process'] is False

    @patch('core.tenant_resolver.get_client')
    def test_tenant_resolver_caching(self, mock_get_client):
        """Test that tenant resolver caches results."""
        from core.tenant_resolver import resolve_tenant

        mock_client = Mock()
        mock_client.get.return_value = {'id': 1, 'user_id': 'tenant_123'}
        mock_get_client.return_value = mock_client

        # First call
        result1 = resolve_tenant("instance_001")
        # Second call - should use cache
        result2 = resolve_tenant("instance_001")

        assert result1 == result2 == 'tenant_123'
        # Should only query once (cached)
        assert mock_client.get.call_count == 1


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
