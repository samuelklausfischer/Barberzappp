"""
Unit Tests for Secretaria Universal Agent

Tests for the Universal Secretary AI Agent.
"""

import pytest
import os
import sys
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.secretaria_universal import (
    generate_response,
    generate_response_simple,
    get_conversation_summary,
    clear_conversation,
    SystemPromptTemplates
)


@pytest.mark.unit
@pytest.mark.agent
class TestSystemPromptTemplates:
    """Test suite for SystemPromptTemplates."""

    def test_build_system_prompt_basic(self):
        """Test basic system prompt construction."""
        prompt = SystemPromptTemplates.build_system_prompt(
            ai_name="Ana",
            barbershop_name="Barbearia Central"
        )

        assert "Ana" in prompt
        assert "Barbearia Central" in prompt
        assert "secretária virtual" in prompt
        assert "natural" in prompt.lower()
        assert "empática" in prompt.lower()

    def test_build_system_prompt_with_context(self):
        """Test system prompt with full context."""
        context = {
            'barbershop': {
                'name': 'Barbearia do João',
                'address': 'Rua Teste, 123',
                'hours': '09:00 - 19:00',
                'phone': '11999999999',
                'ai_name': 'Maria'
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

        prompt = SystemPromptTemplates.build_system_prompt(
            ai_name="Maria",
            barbershop_name="Barbearia do João",
            context=context
        )

        assert "Maria" in prompt
        assert "Barbearia do João" in prompt
        assert "Rua Teste, 123" in prompt
        assert "09:00 - 19:00" in prompt
        assert "Carlos" in prompt
        assert "Pedro" in prompt
        assert "Corte" in prompt
        assert "35" in prompt  # Price

    def test_format_chat_history(self):
        """Test chat history formatting."""
        history = [
            {'role': 'user', 'message': 'Olá'},
            {'role': 'assistant', 'message': 'Olá! Como posso ajudar?'},
            {'role': 'user', 'message': 'Quero agendar'}
        ]

        formatted = SystemPromptTemplates.format_chat_history(history)

        assert len(formatted) == 3
        assert formatted[0]['role'] == 'user'
        assert formatted[0]['content'] == 'Olá'
        assert formatted[1]['role'] == 'assistant'
        assert formatted[2]['role'] == 'user'

    def test_format_chat_history_empty(self):
        """Test formatting empty chat history."""
        formatted = SystemPromptTemplates.format_chat_history([])

        assert len(formatted) == 0


@pytest.mark.unit
@pytest.mark.agent
class TestGenerateResponse:
    """Test suite for generate_response function."""

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_generate_response_success(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context,
        mock_resolve_tenant
    ):
        """Test successful response generation."""
        # Setup mocks
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_build_context.return_value = {
            'barbershop': {
                'name': 'Barbearia Teste',
                'ai_name': 'Ana'
            }
        }
        mock_get_history.return_value = []
        mock_save.return_value = {'success': True}

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': True,
            'response': 'Claro! Qual horário prefere?',
            'tokens_used': 50,
            'model': 'model_123',
            'provider': 'openrouter'
        }
        mock_create_ai.return_value = mock_ai

        # Call function
        result = generate_response(
            instance_name="barbearia_001",
            phone="5511999999999",
            message="Quero agendar um corte"
        )

        # Assertions
        assert result['success'] is True
        assert result['tenant_id'] == 'tenant_123'
        assert result['user_id'] == 'tenant_123'
        assert 'response' in result
        assert result['response'] == 'Claro! Qual horário prefere?'
        assert result['ai_name'] == 'Ana'
        assert result['barbershop_name'] == 'Barbearia Teste'
        assert result['message_saved'] is True

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_generate_response_with_chat_history(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context,
        mock_resolve_tenant
    ):
        """Test response generation with existing chat history."""
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_build_context.return_value = {
            'barbershop': {'name': 'Test', 'ai_name': 'Ana'}
        }
        mock_get_history.return_value = [
            {'role': 'user', 'message': 'Olá'},
            {'role': 'assistant', 'message': 'Olá!'}
        ]
        mock_save.return_value = {'success': True}

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': True,
            'response': 'Pode confirmar?',
            'tokens_used': 30
        }
        mock_create_ai.return_value = mock_ai

        result = generate_response(
            instance_name="barbearia_001",
            phone="5511999999999",
            message="Segunda às 14h então"
        )

        assert result['success'] is True
        assert result['history_count'] == 2
        # Verify chat history was passed to AI
        mock_ai.generate_response.assert_called_once()
        call_kwargs = mock_ai.generate_response.call_args[1]
        assert 'chat_history' in call_kwargs
        assert len(call_kwargs['chat_history']) == 2

    @patch('agents.secretaria_universal.resolve_tenant')
    def test_generate_response_tenant_not_found(self, mock_resolve_tenant):
        """Test response generation when tenant not found."""
        mock_resolve_tenant.return_value = None

        result = generate_response(
            instance_name="nonexistent_instance",
            phone="5511999999999",
            message="Teste"
        )

        assert result['success'] is False
        assert result['tenant_id'] is None
        assert 'error' in result
        assert 'Tenant não encontrado' in result['error']

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_generate_response_ai_failure(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context,
        mock_resolve_tenant
    ):
        """Test response generation when AI fails."""
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_build_context.return_value = {
            'barbershop': {'name': 'Test', 'ai_name': 'Ana'}
        }
        mock_get_history.return_value = []

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': False,
            'error': 'AI service error'
        }
        mock_create_ai.return_value = mock_ai

        result = generate_response(
            instance_name="barbearia_001",
            phone="5511999999999",
            message="Teste"
        )

        assert result['success'] is False
        assert 'error' in result
        assert 'AI service error' in result['error']

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_generate_response_without_user_message_save(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context,
        mock_resolve_tenant
    ):
        """Test response generation without saving user message."""
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_build_context.return_value = {
            'barbershop': {'name': 'Test', 'ai_name': 'Ana'}
        }
        mock_get_history.return_value = []
        mock_save.return_value = {'success': True}

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': True,
            'response': 'Response'
        }
        mock_create_ai.return_value = mock_ai

        result = generate_response(
            instance_name="barbearia_001",
            phone="5511999999999",
            message="Teste",
            save_user_message=False
        )

        assert result['success'] is True
        # User message save should only be called once (for assistant response)
        assert mock_save.call_count == 1

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_generate_response_with_context_override(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context,
        mock_resolve_tenant
    ):
        """Test response generation with context override."""
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_build_context.return_value = {
            'barbershop': {'name': 'Default Name', 'ai_name': 'Default AI'}
        }
        mock_get_history.return_value = []
        mock_save.return_value = {'success': True}

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': True,
            'response': 'Response'
        }
        mock_create_ai.return_value = mock_ai

        override_context = {
            'barbershop': {
                'name': 'Override Barbearia',
                'ai_name': 'Override AI'
            }
        }

        result = generate_response(
            instance_name="barbearia_001",
            phone="5511999999999",
            message="Teste",
            context_override=override_context
        )

        assert result['success'] is True
        assert result['barbershop_name'] == 'Override Barbearia'
        assert result['ai_name'] == 'Override AI'
        # build_context should NOT be called
        mock_build_context.assert_not_called()


@pytest.mark.unit
@pytest.mark.agent
class TestGenerateResponseSimple:
    """Test suite for generate_response_simple function."""

    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_generate_response_simple_success(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context
    ):
        """Test simple response generation success."""
        mock_build_context.return_value = {
            'barbershop': {'name': 'Test', 'ai_name': 'Ana'}
        }
        mock_get_history.return_value = []
        mock_save.return_value = {'success': True}

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': True,
            'response': 'Simple response',
            'tokens_used': 25
        }
        mock_create_ai.return_value = mock_ai

        result = generate_response_simple(
            tenant_id='tenant_123',
            phone='5511999999999',
            message='Teste'
        )

        assert result['success'] is True
        assert result['tenant_id'] == 'tenant_123'
        assert result['response'] == 'Simple response'
        assert result['ai_name'] == 'Ana'

    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_generate_response_simple_with_context(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context
    ):
        """Test simple response generation with context."""
        # Context provided, should not call build_context
        context = {
            'barbershop': {'name': 'Provided', 'ai_name': 'TestAI'}
        }

        mock_get_history.return_value = []
        mock_save.return_value = {'success': True}

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': True,
            'response': 'Response'
        }
        mock_create_ai.return_value = mock_ai

        result = generate_response_simple(
            tenant_id='tenant_123',
            phone='5511999999999',
            message='Teste',
            context=context
        )

        assert result['success'] is True
        assert result['barbershop_name'] == 'Provided'
        assert result['ai_name'] == 'TestAI'
        mock_build_context.assert_not_called()


@pytest.mark.unit
@pytest.mark.agent
class TestGetConversationSummary:
    """Test suite for get_conversation_summary function."""

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.get_chat_history')
    def test_get_conversation_summary_success(
        self,
        mock_get_history,
        mock_resolve_tenant
    ):
        """Test getting conversation summary."""
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_get_history.return_value = [
            {'id': 1, 'role': 'user', 'message': 'Olá', 'created_at': '2024-01-15T10:00:00'},
            {'id': 2, 'role': 'assistant', 'message': 'Olá!', 'created_at': '2024-01-15T10:01:00'}
        ]

        summary = get_conversation_summary(
            instance_name="barbearia_001",
            phone="5511999999999",
            max_messages=10
        )

        assert summary is not None
        assert summary['tenant_id'] == 'tenant_123'
        assert summary['phone'] == '5511999999999'
        assert summary['message_count'] == 2
        assert len(summary['messages']) == 2
        assert summary['last_message']['message'] == 'Olá!'

    @patch('agents.secretaria_universal.resolve_tenant')
    def test_get_conversation_summary_tenant_not_found(self, mock_resolve_tenant):
        """Test conversation summary when tenant not found."""
        mock_resolve_tenant.return_value = None

        summary = get_conversation_summary(
            instance_name="nonexistent",
            phone="5511999999999"
        )

        assert summary is None


@pytest.mark.unit
@pytest.mark.agent
class TestClearConversation:
    """Test suite for clear_conversation function."""

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.clear_chat_history')
    def test_clear_conversation_success(
        self,
        mock_clear,
        mock_resolve_tenant
    ):
        """Test clearing conversation successfully."""
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_clear.return_value = {
            'success': True,
            'deleted_count': 5
        }

        result = clear_conversation(
            instance_name="barbearia_001",
            phone="5511999999999"
        )

        assert result['success'] is True
        assert result['tenant_id'] == 'tenant_123'
        assert result['deleted_count'] == 5

    @patch('agents.secretaria_universal.resolve_tenant')
    def test_clear_conversation_tenant_not_found(self, mock_resolve_tenant):
        """Test clearing conversation when tenant not found."""
        mock_resolve_tenant.return_value = None

        result = clear_conversation(
            instance_name="nonexistent",
            phone="5511999999999"
        )

        assert result['success'] is False
        assert result['error'] == 'Tenant não encontrado'


@pytest.mark.unit
@pytest.mark.agent
class TestResponseProcessingTime:
    """Test suite for processing time tracking."""

    @patch('agents.secretaria_universal.resolve_tenant')
    @patch('agents.secretaria_universal.build_context')
    @patch('agents.secretaria_universal.get_chat_history')
    @patch('agents.secretaria_universal.save_message')
    @patch('agents.secretaria_universal.create_ai_service')
    def test_processing_time_tracked(
        self,
        mock_create_ai,
        mock_save,
        mock_get_history,
        mock_build_context,
        mock_resolve_tenant
    ):
        """Test that processing time is tracked."""
        mock_resolve_tenant.return_value = 'tenant_123'
        mock_build_context.return_value = {
            'barbershop': {'name': 'Test', 'ai_name': 'Ana'}
        }
        mock_get_history.return_value = []
        mock_save.return_value = {'success': True}

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            'success': True,
            'response': 'Response'
        }
        mock_create_ai.return_value = mock_ai

        result = generate_response(
            instance_name="barbearia_001",
            phone="5511999999999",
            message="Teste"
        )

        assert 'metadata' in result
        assert 'processing_time_ms' in result['metadata']
        assert isinstance(result['metadata']['processing_time_ms'], (int, float))
        assert result['metadata']['processing_time_ms'] >= 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
