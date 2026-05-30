"""
Unit Tests for AI Service Placeholder Wrapper

Tests for AIService placeholder integration.
"""

import pytest
import os
import sys
from unittest.mock import patch

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrations.ai_service import (
    AIService,
    AIProvider,
    create_ai_service
)


@pytest.mark.unit
@pytest.mark.wrapper
@pytest.mark.placeholder
class TestAIService:
    """Test suite for AIService placeholder."""

    def test_initialization_default(self):
        """Test default initialization with OpenRouter."""
        ai = AIService()

        assert ai.provider == AIProvider.OPENROUTER
        assert ai.model_name == "nemotron_nano"
        assert ai.model_id == "nvidia/nemotron-nano-9b-v2:free"
        assert ai.api_key == ""

    def test_initialization_openrouter(self):
        """Test initialization with OpenRouter provider."""
        ai = AIService(
            provider=AIProvider.OPENROUTER,
            model="nemotron_nano"
        )

        assert ai.provider == AIProvider.OPENROUTER
        assert ai.model_name == "nemotron_nano"
        assert "nemotron-nano" in ai.model_id

    def test_initialization_groq(self):
        """Test initialization with Groq provider."""
        ai = AIService(
            provider=AIProvider.GROQ,
            model="llama3_70b"
        )

        assert ai.provider == AIProvider.GROQ
        assert ai.model_name == "llama3_70b"
        assert "llama-3" in ai.model_id

    def test_initialization_together(self):
        """Test initialization with Together AI provider."""
        ai = AIService(
            provider=AIProvider.TOGETHER,
            model="mixtral_instruct"
        )

        assert ai.provider == AIProvider.TOGETHER
        assert ai.model_name == "mixtral_instruct"
        assert "Mixtral" in ai.model_id

    def test_initialization_anthropic(self):
        """Test initialization with Anthropic provider."""
        ai = AIService(
            provider=AIProvider.ANTHROPIC,
            model="claude_fast"
        )

        assert ai.provider == AIProvider.ANTHROPIC
        assert ai.model_name == "claude_fast"
        assert "claude" in ai.model_id

    def test_generate_response_basic(self):
        """Test basic response generation."""
        ai = AIService(provider=AIProvider.OPENROUTER, model="nemotron_nano")

        result = ai.generate_response(
            prompt="Olá!",
            context=None,
            chat_history=None
        )

        assert result['success'] is True
        assert 'response' in result
        assert isinstance(result['response'], str)
        assert len(result['response']) > 0
        assert result['error'] is None

    def test_generate_response_with_context(self):
        """Test response generation with context."""
        ai = AIService()

        context = {
            'client_name': 'João',
            'barbershop': {
                'name': 'Barbearia Teste',
                'address': 'Rua Teste, 123'
            }
        }

        result = ai.generate_response(
            prompt="Qual o endereço?",
            context=context,
            chat_history=None
        )

        assert result['success'] is True
        # Response should contain barbershop info
        assert 'Barbearia Teste' in result['response'] or 'Rua Teste' in result['response']

    def test_generate_response_with_history(self):
        """Test response generation with chat history."""
        ai = AIService()

        chat_history = [
            {'role': 'user', 'content': 'Olá'},
            {'role': 'assistant', 'content': 'Olá! Como posso ajudar?'},
            {'role': 'user', 'content': 'Quero agendar um corte'}
        ]

        result = ai.generate_response(
            prompt="Quero agendar um corte",
            context=None,
            chat_history=chat_history
        )

        assert result['success'] is True
        # Response should be scheduling-related
        response_lower = result['response'].lower()
        assert any(word in response_lower for word in ['agendar', 'horário', 'dia', 'hora'])

    def test_generate_response_scheduling_intent(self):
        """Test scheduling intent detection."""
        ai = AIService()

        scheduling_prompts = [
            "Quero agendar um corte",
            "Preciso marcar um horário",
            "Tenho dia livre na sexta",
            "Qual horário disponível?"
        ]

        for prompt in scheduling_prompts:
            result = ai.generate_response(prompt=prompt)
            assert result['success'] is True
            # Check for scheduling-related keywords
            response_lower = result['response'].lower()
            assert any(word in response_lower for word in ['agendar', 'horário', 'dia', 'semana', 'marcar'])

    def test_generate_response_pricing_intent(self):
        """Test pricing intent detection."""
        ai = AIService()

        pricing_prompts = [
            "Quanto custa o corte?",
            "Qual o preço da barba?",
            "Quais os valores?"
        ]

        for prompt in pricing_prompts:
            result = ai.generate_response(prompt=prompt)
            assert result['success'] is True
            # Check for pricing keywords
            response_lower = result['response'].lower()
            assert any(word in response_lower for word in ['preço', 'valor', 'r$', 'custa', 'valem'])

    def test_generate_response_gratitude_intent(self):
        """Test gratitude intent detection."""
        ai = AIService()

        gratitude_prompts = [
            "Obrigado!",
            "Muito obrigado",
            "Valeu!",
            "Thanks"
        ]

        for prompt in gratitude_prompts:
            result = ai.generate_response(prompt=prompt)
            assert result['success'] is True
            # Should have gratitude/you're welcome
            response_lower = result['response'].lower()
            assert any(word in response_lower for word in ['nada', 'por nada', 'de nada', 'ajudar', 'disponível'])

    def test_generate_response_greeting_intent(self):
        """Test greeting intent detection."""
        ai = AIService()

        greeting_prompts = [
            "Olá",
            "Oi",
            "Bom dia",
            "Boa tarde",
            "Boa noite"
        ]

        for prompt in greeting_prompts:
            result = ai.generate_response(prompt=prompt)
            assert result['success'] is True
            # Should have welcome message
            assert 'bem-vindo' in result['response'].lower() or 'olá' in result['response'].lower()

    def test_generate_response_goodbye_intent(self):
        """Test goodbye intent detection."""
        ai = AIService()

        goodbye_prompts = [
            "Tchau",
            "Adeus",
            "Até logo",
            "Falou",
            "Vou indo"
        ]

        for prompt in goodbye_prompts:
            result = ai.generate_response(prompt=prompt)
            assert result['success'] is True
            response_lower = result['response'].lower()
            assert any(word in response_lower for word in ['até logo', 'volte', 'adeus', 'tchau'])

    def test_generate_response_temperature_parameter(self):
        """Test temperature parameter doesn't break response."""
        ai = AIService()

        for temp in [0.0, 0.5, 1.0]:
            result = ai.generate_response(
                prompt="Teste",
                temperature=temp
            )
            assert result['success'] is True

    def test_generate_response_max_tokens_parameter(self):
        """Test max_tokens parameter doesn't break response."""
        ai = AIService()

        for max_t in [100, 500, 1000, 2000]:
            result = ai.generate_response(
                prompt="Teste",
                max_tokens=max_t
            )
            assert result['success'] is True

    def test_generate_response_tokens_estimation(self):
        """Test tokens estimation in response."""
        ai = AIService()

        result = ai.generate_response(
            prompt="Uma mensagem de teste para estimar tokens"
        )

        assert result['success'] is True
        assert 'tokens_used' in result
        assert isinstance(result['tokens_used'], int)
        assert result['tokens_used'] > 0

    def test_set_model_openrouter(self):
        """Test set_model with OpenRouter."""
        ai = AIService()

        # Change model
        success = ai.set_model('mistral_7b')

        assert success is True
        assert ai.model_name == "mistral_7b"
        assert "mistral" in ai.model_id.lower()

    def test_set_model_groq(self):
        """Test set_model with Groq."""
        ai = AIService(provider=AIProvider.GROQ)

        success = ai.set_model('mixtral')

        assert success is True
        assert ai.model_name == "mixtral"
        assert "mixtral" in ai.model_id.lower()

    def test_set_model_with_provider_change(self):
        """Test set_model with provider change."""
        ai = AIService(provider=AIProvider.OPENROUTER)

        success = ai.set_model('llama3_70b', provider=AIProvider.GROQ)

        assert success is True
        assert ai.provider == AIProvider.GROQ
        assert ai.model_name == "llama3_70b"

    def test_set_model_invalid(self):
        """Test set_model with invalid model name."""
        ai = AIService()

        with pytest.raises(ValueError):
            ai.set_model('invalid_model_name')

    def test_get_available_models_single_provider(self):
        """Test getting models for a single provider."""
        ai = AIService()

        models = ai.get_available_models(provider=AIProvider.OPENROUTER)

        assert 'openrouter' in models
        assert isinstance(models['openrouter'], list)
        assert len(models['openrouter']) > 0
        assert 'nemotron_nano' in models['openrouter']

    def test_get_available_models_all_providers(self):
        """Test getting models for all providers."""
        ai = AIService()

        models = ai.get_available_models()

        assert isinstance(models, dict)
        assert 'openrouter' in models
        assert 'groq' in models
        assert 'together' in models
        assert 'anthropic' in models

        # Check each provider has list of models
        for provider, model_list in models.items():
            assert isinstance(model_list, list)
            assert len(model_list) > 0


@pytest.mark.unit
@pytest.mark.wrapper
@pytest.mark.placeholder
class TestAIServiceConvenienceFunctions:
    """Test suite for convenience functions."""

    def test_create_ai_service_default(self):
        """Test create_ai_service with defaults."""
        ai = create_ai_service()

        assert ai.provider == AIProvider.OPENROUTER
        assert ai.model_name == "nemotron_nano"

    def test_create_ai_service_openrouter(self):
        """Test create_ai_service with OpenRouter."""
        ai = create_ai_service(provider="openrouter", model="nemotron_nano")

        assert ai.provider == AIProvider.OPENROUTER
        assert ai.model_name == "nemotron_nano"

    def test_create_ai_service_groq(self):
        """Test create_ai_service with Groq."""
        ai = create_ai_service(provider="groq", model="llama3_70b")

        assert ai.provider == AIProvider.GROQ
        assert ai.model_name == "llama3_70b"

    def test_create_ai_service_together(self):
        """Test create_ai_service with Together AI."""
        ai = create_ai_service(provider="together", model="mixtral_instruct")

        assert ai.provider == AIProvider.TOGETHER
        assert ai.model_name == "mixtral_instruct"

    def test_create_ai_service_invalid_provider(self):
        """Test create_ai_service with invalid provider."""
        with pytest.raises(ValueError):
            create_ai_service(provider="invalid_provider")

    def test_create_ai_service_case_insensitive(self):
        """Test create_ai_service with mixed case provider."""
        ai = create_ai_service(provider="OpenRouter", model="nemotron_nano")

        assert ai.provider == AIProvider.OPENROUTER

    def test_model_availability(self):
        """Test that expected models are available."""
        ai = AIService()

        models = ai.get_available_models()

        # Verify OpenRouter models
        assert 'nemotron_nano' in models['openrouter']
        assert 'mistral_7b' in models['openrouter']
        assert 'gemma_7b' in models['openrouter']

        # Verify Groq models
        assert 'llama3_70b' in models['groq']
        assert 'llama3_8b' in models['groq']
        assert 'mixtral' in models['groq']

        # Verify Together models
        assert 'mixtral_instruct' in models['together']
        assert 'llama3_70b' in models['together']

        # Verify Anthropic models
        assert 'claude_fast' in models['anthropic']


@pytest.mark.unit
@pytest.mark.wrapper
@pytest.mark.placeholder
class TestAIServicemocking:
    """Test suite demonstrating how to mock AI Service."""

    def test_mock_ai_service_basic(self):
        """Test basic mocking of AI Service."""
        from unittest.mock import Mock

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            "success": True,
            "response": "This is a mock response",
            "tokens_used": 50,
            "model": "mock_model",
            "provider": "mock_provider"
        }

        result = mock_ai.generate_response("Test prompt")

        assert result['success'] is True
        assert result['response'] == "This is a mock response"

    def test_mock_ai_service_with_context(self):
        """Test mocking with context parameter."""
        from unittest.mock import Mock

        mock_ai = Mock()
        mock_ai.generate_response.return_value = {
            "success": True,
            "response": "Mock response with context",
            "tokens_used": 75
        }

        context = {"client_name": "Test Client"}
        result = mock_ai.generate_response("Test", context=context)

        assert result['success'] is True
        # Verify context was passed
        mock_ai.generate_response.assert_called_once()
        call_kwargs = mock_ai.generate_response.call_args[1]
        assert 'context' in call_kwargs
        assert call_kwargs['context'] == context


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
