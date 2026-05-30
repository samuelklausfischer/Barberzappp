"""
Mock AI Service for Testing

Provides mock implementations for testing AI Service wrapper
without requiring API keys or external AI providers.
"""

from typing import Dict, List, Optional, Any
import logging
from unittest.mock import Mock, MagicMock
from datetime import datetime

logger = logging.getLogger(__name__)


class MockAIService:
    """
    Mock implementation of AI Service for testing.

    Simulates AI responses without external dependencies.
    """

    def __init__(self, provider: str = "mock_provider", model: str = "mock_model"):
        """
        Initialize mock AI service.

        Args:
            provider: Mock provider name
            model: Mock model name
        """
        self.provider = provider
        self.model = model
        self.model_name = model
        self.model_id = model
        self.api_key = ""
        self._call_count = 0
        self._responses_history: List[Dict] = []

    def reset(self):
        """Reset mock state."""
        self._call_count = 0
        self._responses_history.clear()

    def generate_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Mock generate_response operation.

        Returns simulated AI response based on prompt content.
        """
        self._call_count += 1

        # Analyze prompt to generate relevant mock response
        response_text = self._generate_mock_response(prompt, context, chat_history)

        result = {
            "success": True,
            "response": response_text,
            "tokens_used": self._estimate_tokens(prompt + response_text),
            "model": self.model_id,
            "provider": self.provider,
            "timestamp": datetime.utcnow().isoformat(),
            "error": None
        }

        # Store response for verification
        self._responses_history.append({
            'prompt': prompt,
            'context': context,
            'chat_history_length': len(chat_history) if chat_history else 0,
            'response': response_text,
            'call_number': self._call_count
        })

        logger.debug(f"[MOCK] AIService.generate_response: call #{self._call_count}")

        return result

    def _generate_mock_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]]
    ) -> str:
        """
        Generate mock AI response based on prompt analysis.

        Detects common intents and returns appropriate responses.
        """
        prompt_lower = prompt.lower()

        # Scheduling intent
        if any(word in prompt_lower for word in ["horário", "hora", "agendar", "marcar", "dia"]):
            return self._create_scheduling_response(context)

        # Pricing intent
        elif any(word in prompt_lower for word in ["preço", "valor", "quanto", "custa", "valor"]):
            return self._create_pricing_response(context)

        # Thanks/gratitude
        elif any(word in prompt_lower for word in ["obrigado", "valeu", "thanks", "agradeço"]):
            return self._create_gratitude_response(context)

        # Greeting
        elif any(word in prompt_lower for word in ["olá", "oi", "bom dia", "boa tarde", "boa noite"]):
            return self._create_greeting_response(context)

        # Goodbye
        elif any(word in prompt_lower for word in ["tchau", "adeus", "até logo", "vá", "falou"]):
            return self._create_goodbye_response(context)

        # General/default response
        else:
            return self._create_general_response(prompt, context)

    def _create_scheduling_response(self, context: Optional[Dict[str, Any]]) -> str:
        """Create mock scheduling response."""
        client_name = ""
        barbershop_name = "Barbearia"

        if context:
            client_name = context.get('client_name', '') or context.get('name', '')
            barbershop = context.get('barbershop', {})
            if barbershop:
                barbershop_name = barbershop.get('name', 'Barbearia')

        if client_name:
            return f"""
📅 **Agendamento - {barbershop_name}**

Olá, {client_name}! 👋

Para agendar seu horário, preciso de algumas informações:
1️⃣ Qual serviço você deseja?
2️⃣ Qual dia e horário prefere?
3️⃣ Qual barbeiro você prefere?

📋 *Resposta gerada pelo Mock AI Service*
"""
        else:
            return f"""
📅 **Agendamento - {barbershop_name}**

Olá! 👋 Vou te ajudar a agendar seu horário!

Por favor, me informe:
1️⃣ Seu nome
2️⃣ Qual serviço deseja (cabelo, barba, combo)
3️⃣ Dia e horário preferido

📋 *Resposta gerada pelo Mock AI Service*
"""

    def _create_pricing_response(self, context: Optional[Dict[str, Any]]) -> str:
        """Create mock pricing response."""
        barbershop_name = "Barbearia"

        if context:
            barbershop = context.get('barbershop', {})
            if barbershop:
                barbershop_name = barbershop.get('name', 'Barbearia')

        return f"""
📋 **TABELA DE PREÇOS - {barbershop_name}**

💇‍♂️ **Corte de Cabelo:** R$ 35,00
🧔 **Barba:** R$ 25,00
💇‍♂️ + 🧔 **Combo Cabelo + Barba:** R$ 50,00
✨ **Acabamento:** R$ 15,00

⏰ Horário de atendimento: Seg-Sab, 09:00 às 19:00

📍 *Resposta gerada pelo Mock AI Service*
"""

    def _create_gratitude_response(self, context: Optional[Dict[str, Any]]) -> str:
        """Create mock gratitude response."""
        ai_name = "Assistente"

        if context:
            ai_name = context.get('ai_name', 'Assistente')

        return f"""
😊 Por nada! Sou o {ai_name} da BarberZap!

Estamos aqui para ajudar! Se precisar agendar,
saber preços ou tirar dúvidas, é só chamar.

📞 *Resposta gerada pelo Mock AI Service*
"""

    def _create_greeting_response(self, context: Optional[Dict[str, Any]]) -> str:
        """Create mock greeting response."""
        barbershop_name = "Barbearia"
        ai_name = "Assistente"

        if context:
            barbershop = context.get('barbershop', {})
            if barbershop:
                barbershop_name = barbershop.get('name', 'Barbearia')
            ai_name = context.get('ai_name', 'Assistente')

        return f"""
👋 Olá! Bem-vindo à {barbershop_name}!

Sou o {ai_name}, sua assistente virtual. Como posso ajudar?

- Agendar horários
- Informar sobre serviços e preços
- Tirar dúvidas

📋 *Resposta gerada pelo Mock AI Service*
"""

    def _create_goodbye_response(self, context: Optional[Dict[str, Any]]) -> str:
        """Create mock goodbye response."""
        barbershop_name = "Barbearia"

        if context:
            barbershop = context.get('barbershop', {})
            if barbershop:
                barbershop_name = barbershop.get('name', 'Barbearia')

        return f"""
👋 Até logo!

Volte sempre que precisar. A equipe da {barbershop_name}
agradece seu contato!

✂️ *Resposta gerada pelo Mock AI Service*
"""

    def _create_general_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Create mock general response based on prompt."""
        return f"""
🤖 **Resposta do AI Service (MOCK)**

Recebi sua mensagem: "{prompt[:50]}..."

⚠️ *Esta é uma resposta simulada (mock) para testes.*

📋 **Informações:**
- Model: {self.model_id}
- Provider: {self.provider}
- Call: #{self._call_count}

Se precisar de algo específico como agendar, saber preços
ou tirar dúvidas, é só perguntar!

📋 *Resposta gerada pelo Mock AI Service*
"""

    def _estimate_tokens(self, text: str) -> int:
        """Estimate number of tokens (rough estimate)."""
        return int(len(text.split()) * 4)

    def set_model(self, model_name: str, provider: Optional[str] = None) -> bool:
        """
        Mock set_model operation.

        Returns:
            True (always succeeds in mock)
        """
        if provider:
            self.provider = provider
        self.model_name = model_name
        self.model_id = model_name
        return True

    def get_call_count(self) -> int:
        """Get the number of times generate_response was called."""
        return self._call_count

    def get_responses_history(self) -> List[Dict]:
        """Get history of all generate_response calls."""
        return self._responses_history.copy()

    def assert_response_contains(self, text: str):
        """
        Assert that the last response contains specific text.

        Args:
            text: Text to look for in last response

        Raises:
            AssertionError: If text not found
        """
        if not self._responses_history:
            raise AssertionError("No responses generated yet")

        last_response = self._responses_history[-1]['response']
        if text not in last_response:
            raise AssertionError(
                f"Text '{text}' not found in last response:\n{last_response}"
            )

    def assert_response_generated(self):
        """
        Assert that at least one response was generated.

        Raises:
            AssertionError: If no responses generated
        """
        if self._call_count == 0:
            raise AssertionError("No responses generated yet")


class MockAIServiceWithFailure:
    """
    Mock AI service that always fails.
    """

    def __init__(self, provider: str = "mock_provider", model: str = "mock_model"):
        """Initialize failing mock AI service."""
        self.provider = provider
        self.model = model
        self.model_id = model
        self.api_key = ""

    def generate_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Mock generate_response that always fails.

        Returns:
            Error response
        """
        return {
            "success": False,
            "response": "",
            "tokens_used": 0,
            "model": self.model_id,
            "provider": self.provider,
            "timestamp": datetime.utcnow().isoformat(),
            "error": "Simulated AI service failure"
        }

    def set_model(self, model_name: str, provider: Optional[str] = None) -> bool:
        """Mock set_model operation."""
        if provider:
            self.provider = provider
        self.model_name = model_name
        self.model_id = model_name
        return True


# Global mock instance
_mock_instance: Optional[MockAIService] = None


def get_mock_ai_service() -> MockAIService:
    """
    Get or create the global mock AI service instance.

    Returns:
        MockAIService instance
    """
    global _mock_instance
    if _mock_instance is None:
        _mock_instance = MockAIService()
    return _mock_instance


def reset_mock_ai_service():
    """Reset the global mock AI service instance."""
    global _mock_instance
    if _mock_instance:
        _mock_instance.reset()


def create_ai_service_mock():
    """
    Create a pytest mock for AI Service module.

    Returns:
        Mock that simulates the ai_service module
    """
    mock_service = MockAIService()

    # Create mock module
    mock_module = MagicMock()
    mock_module.AIService = Mock(return_value=mock_service)
    mock_module.AIProvider = Mock()
    mock_module.create_ai_service = lambda provider="mock", model="mock_model": mock_service

    return mock_module


def create_ai_service_mock_with_failure():
    """
    Create a pytest mock for AI Service that always fails.

    Returns:
        Mock that simulates failures
    """
    mock_service = MockAIServiceWithFailure()

    # Create mock module
    mock_module = MagicMock()
    mock_module.AIService = Mock(return_value=mock_service)
    mock_module.AIProvider = Mock()
    mock_module.create_ai_service = lambda provider="mock", model="mock_model": mock_service

    return mock_module


if __name__ == "__main__":
    # Test the mock
    print("Testing Mock AI Service")
    print("=" * 60)

    mock_ai = MockAIService()

    # Test different prompts
    test_prompts = [
        "Olá!",  # Greeting
        "Quais são os preços?",  # Pricing
        "Quero agendar um corte",  # Scheduling
        "Obrigado!",  # Gratitude
        "Até logo!",  # Goodbye
        "Uma pergunta geral"  # General
    ]

    for prompt in test_prompts:
        result = mock_ai.generate_response(prompt)
        print(f"\nPrompt: {prompt}")
        print(f"Response (first 100 chars): {result['response'][:100]}...")

    # Check call count
    print(f"\n\nTotal calls: {mock_ai.get_call_count()}")

    # Verify responses
    mock_ai.assert_response_generated()
    print("Response generation assertion passed!")

    print("\nMock AI Service working correctly!")
