"""
BarberZap AI Service - Placeholder Wrapper
=========================================

Wrapper placeholder para AI Models com providers gratuitos:
- OpenRouter: nvidia/nemotron-nano-9b-v2:free
- Groq: Llama-3-70B, Mixtral-8x7B
- Together AI: mistralai/Mixtral-8x7B-Instruct-v0.1

STATUS: PLACEHOLDER - Esperando implementação real com API Keys
"""

import os
from typing import Dict, List, Optional, Any
from enum import Enum
import json
import logging

# Configuração de logging
logger = logging.getLogger(__name__)


class AIProvider(Enum):
    """Enumerador de providers de AI disponíveis"""
    OPENROUTER = "openrouter"
    GROQ = "groq"
    TOGETHER = "together"
    ANTHROPIC = "anthropic"


class AIService:
    """
    Serviço de IA placeholder para BarberZap.
    
    Wrapper para múltiplos providers de AI com modelos gratuitos.
    
    NOTA: Implementação PLACEHOLDER - Aguardando API Keys reais.
    """
    
    # Modelos gratuitos disponíveis por provider
    FREE_MODELS = {
        AIProvider.OPENROUTER: {
            "nemotron_nano": "nvidia/nemotron-nano-9b-v2:free",
            "mistral_7b": "mistralai/mistral-7b-instruct:free",
            "gemma_7b": "google/gemma-7b-it:free"
        },
        AIProvider.GROQ: {
            "llama3_70b": "llama-3.3-70b-versatile",
            "llama3_8b": "llama-3.1-8b-instant",
            "mixtral": "mixtral-8x7b-32768"
        },
        AIProvider.TOGETHER: {
            "mixtral_instruct": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "llama3_70b": "meta-llama/Llama-3-70b-chat-hf",
            "qwen_7b": "Qwen/Qwen2-7B-Instruct"
        },
        AIProvider.ANTHROPIC: {
            "claude_medium": "claude-3-7-sonnet-20250219",  # Não gratuito, suporte futuro
            "claude_fast": "claude-3-5-haiku-20241022"
        }
    }
    
    def __init__(self, provider: AIProvider = AIProvider.OPENROUTER, model: str = "nemotron_nano"):
        """
        Inicializa o serviço de IA.
        
        Args:
            provider: Provider de IA (padrão: OpenRouter)
            model: Nome do modelo (padrão: nemotron_nano)
        """
        self.provider = provider
        self.model_name = model
        self.model_id = self._get_model_id(provider, model)
        
        # TODO: INSERT AI API KEY WHEN AVAILABLE (OpenRouter, Groq, Together AI, etc.)
        self.api_key = os.getenv(f"{provider.value.upper()}_API_KEY", "")
        
        logger.info(f"AIService inicializado - Provider: {provider.value}, Model: {self.model_id}")
        logger.warning("⚠️ AIService em modo PLACEHOLDER - Respostas são simuladas")
    
    def _get_model_id(self, provider: AIProvider, model_name: str) -> str:
        """Obtém o ID do modelo para o provider selecionado"""
        if provider in self.FREE_MODELS and model_name in self.FREE_MODELS[provider]:
            return self.FREE_MODELS[provider][model_name]
        return model_name
    
    def set_model(self, model_name: str, provider: Optional[AIProvider] = None) -> bool:
        """
        Define o modelo a ser utilizado.
        
        Args:
            model_name: Nome do modelo (ex: "llama3_70b", "mixtral", "nemotron_nano")
            provider: Provider opcional (se omitido, mantém o atual)
        
        Returns:
            bool: True se o modelo foi definido com sucesso
        
        Raises:
            ValueError: Se o modelo não existir no provider
        """
        try:
            # Usar provider atual se não especificado
            target_provider = provider or self.provider
            
            # Validar se modelo existe no provider
            if target_provider not in self.FREE_MODELS:
                raise ValueError(f"Provider {target_provider.value} não suportado")
            
            if model_name not in self.FREE_MODELS[target_provider]:
                raise ValueError(
                    f"Modelo '{model_name}' não encontrado em {target_provider.value}. "
                    f"Modelos disponíveis: {list(self.FREE_MODELS[target_provider].keys())}"
                )
            
            # Atualizar provider e modelo
            if provider:
                self.provider = provider
            
            self.model_name = model_name
            self.model_id = self._get_model_id(self.provider, model_name)
            
            logger.info(f"Modelo atualizado: {self.provider.value}/{self.model_id}")
            return True
            
        except ValueError as e:
            logger.error(f"Erro ao definir modelo: {e}")
            raise
    
    def generate_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Gera uma resposta da IA baseada no prompt, contexto e histórico.
        
        Args:
            prompt: Mensagem do usuário
            context: Contexto adicional (dados do cliente, agendamento, etc.)
            chat_history: Histórico de conversa [{"role": "user", "content": "..."}, ...]
            temperature: Temperatura de geração (0.0 - 1.0)
            max_tokens: Tokens máximos de resposta
        
        Returns:
            Dict com:
                - success: bool
                - response: str (resposta gerada ou mensagem de placeholder)
                - tokens_used: int
                - model: str
                - provider: str
                - error: Optional[str] (em caso de erro)
        """
        try:
            # TODO: INSERT AI API KEY WHEN AVAILABLE (OpenRouter, Groq, Together AI, etc.)
            # TODO: REPLACE THIS PLACEHOLDER LOGIC WITH ACTUAL API CALL
            
            logger.warning(f"🔄 PLACEHOLDER: generate_response chamado (Provider: {self.provider.value})")
            logger.debug(f"Prompt: {prompt[:100]}...")
            logger.debug(f"Context: {context}")
            logger.debug(f"Chat history length: {len(chat_history) if chat_history else 0}")
            
            # Simular processamento
            response_text = self._generate_placeholder_response(prompt, context, chat_history)
            
            # Formatar resultado
            result = {
                "success": True,
                "response": response_text,
                "tokens_used": self._estimate_tokens(prompt + response_text),
                "model": self.model_id,
                "provider": self.provider.value,
                "timestamp": None,
                "error": None
            }
            
            logger.info(f"✅ Resposta PLACEHOLDER gerada ({len(response_text)} caracteres)")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar resposta: {e}", exc_info=True)
            return {
                "success": False,
                "response": "",
                "tokens_used": 0,
                "model": self.model_id,
                "provider": self.provider.value,
                "error": str(e)
            }
    
    def _generate_placeholder_response(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]]
    ) -> str:
        """
        Gera resposta placeholder (SIMULADA) para demonstração.
        
        NOTA: Substituir por chamada real à API quando disponível.
        
        TODO: INSERT AI API KEY WHEN AVAILABLE (OpenRouter, Groq, Together AI, etc.)
        """
        # Analisar o prompt para gerar resposta fake inteligente
        prompt_lower = prompt.lower()
        
        # Detectar intenção baseada em palavras-chave
        if any(word in prompt_lower for word in ["horário", "hora", "agendar", "marcar"]):
            response = self._create_scheduling_response(context)
        elif any(word in prompt_lower for word in ["preço", "valor", "quanto", "custa"]):
            response = """
📋 **TABELA DE PREÇOS - BarberZap**

💇‍♂️ **Corte de Cabelo:** R$ 35,00
🧔 **Barba:** R$ 25,00
💇‍♂️ + 🧔 **Combo Cabelo + Barba:** R$ 50,00
✨ **Acabamento:** R$ 15,00

⏰ Horário de atendimento: Seg-Sab, 09:00 às 19:00

📍 *Respondeu pelo AI Service (MODO PLACEHOLDER)*
"""
        elif any(word in prompt_lower for word in ["obrigado", "valeu", "thanks"]):
            response = """
😊 Por nada! Sou o assistente da BarberZap!

Estamos aqui para ajudar! Se precisar agendar, 
saber preços ou tirar dúvidas, é só chamar.

📞 *Respondeu pelo AI Service (MODO PLACEHOLDER)*
"""
        else:
            response = self._create_general_response(prompt, context)
        
        return response
    
    def _create_scheduling_response(self, context: Optional[Dict[str, Any]]) -> str:
        """Cria resposta sobre agendamento"""
        client_name = context.get("client_name", "") if context else ""
        
        if client_name:
            return f"""
📅 **Agendamento - BarberZap**

Olá, {client_name}! 👋

Para agendar seu horário, preciso de algumas informações:
1️⃣ Qual serviço você deseja?
2️⃣ Qual dia e horário prefere?
3️⃣ Qual barbeiro você prefere?

📋 *Respondeu pelo AI Service (MODO PLACEHOLDER - Implementação pendente)*
"""
        else:
            return """
📅 **Agendamento - BarberZap**

Olá! 👋 Vou te ajudar a agendar seu horário!

Por favor, me informe:
1️⃣ Seu nome
2️⃣ Qual serviço deseja (cabelo, barba, combo)
3️⃣ Dia e horário preferido

📋 *Respondeu pelo AI Service (MODO PLACEHOLDER - Implementação pendente)*
"""
    
    def _create_general_response(self, prompt: str, context: Optional[Dict[str, Any]]) -> str:
        """Cria resposta genérica baseada no prompt"""
        return f"""
🤖 **Resposta do AI Service (PLACEHOLDER)**

Recebi sua mensagem: "{prompt[:50]}..."

⚠️ *Esta é uma resposta simulada (placeholder).*
   Quando as API Keys estiverem configuradas, receberei
   repostas reais dos modelos de IA selecionados.

📋 **Modelo atual:** {self.model_id}
🔧 **Provider:** {self.provider.value}

🚀 TODO: INSERT AI API KEY WHEN AVAILABLE (OpenRouter, Groq, Together AI, etc.)
"""
    
    def _estimate_tokens(self, text: str) -> int:
        """Estima número de tokens (aproximado: ~4 tokens por palavra)"""
        word_count = len(text.split())
        return int(word_count * 4)
    
    def get_available_models(self, provider: Optional[AIProvider] = None) -> Dict[str, List[str]]:
        """
        Retorna modelos disponíveis.
        
        Args:
            provider: Se especificado, retorna apenas desse provider
        
        Returns:
            Dict com {provider_name: [model_list]}
        """
        if provider:
            return {provider.value: list(self.FREE_MODELS.get(provider, {}).keys())}
        return {p.value: list(models.keys()) for p, models in self.FREE_MODELS.items()}


# Funções de conveniência para uso fácil
def create_ai_service(
    provider: str = "openrouter",
    model: str = "nemotron_nano"
) -> AIService:
    """
    Cria uma instância do serviço de IA.
    
    Args:
        provider: "openrouter", "groq", "together", "anthropic"
        model: Nome do modelo (ex: "llama3_70b", "mixtral", "nemotron_nano")
    
    Returns:
        Instância de AIService
    
    Raises:
        ValueError: Se provider inválido
    """
    try:
        provider_enum = AIProvider(provider.lower())
        return AIService(provider=provider_enum, model=model)
    except ValueError:
        valid_providers = [p.value for p in AIProvider]
        raise ValueError(
            f"Provider '{provider}' inválido. "
            f"Use um de: {valid_providers}"
        )


# Exemplo de uso (descomentar para testar)
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Criar serviço
    ai = create_ai_service(provider="openrouter", model="nemotron_nano")
    
    # Gerar resposta
    result = ai.generate_response(
        prompt="Quais são os preços dos cortes?",
        context={"client_name": "João"},
        chat_history=[
            {"role": "user", "content": "Olá"},
            {"role": "assistant", "content": "Olá! Como posso ajudar?"}
        ]
    )
    
    print("=" * 50)
    print("RESULTADO (PLACEHOLDER):")
    print("=" * 50)
    print(result["response"])
    print("=" * 50)
    print(f"Provider: {result['provider']}")
    print(f"Model: {result['model']}")
    print(f"Tokens: {result['tokens_used']}")
