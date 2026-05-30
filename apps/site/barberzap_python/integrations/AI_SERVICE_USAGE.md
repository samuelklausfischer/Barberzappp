# AI Service - Guia de Uso (PLACEHOLDER)

## 📋 Resumo

Serviço placeholder para integração com Models de IA gratuitos:
- **OpenRouter**: nvidia/nemotron-nano-9b-v2:free
- **Groq**: Llama-3-70B, Mixtral-8x7B
- **Together AI**: mistralai/Mixtral-8x7B-Instruct-v0.1

## ⚠️ STATUS

Atualmente em **MODO PLACEHOLDER** - Aguardando API Keys reais.

Todas as funções retornam respostas simuladas para demonstração.

## 🔧 Como Usar

### Básico

```python
from integrations.ai_service import create_ai_service

# Criar serviço
ai = create_ai_service(provider="openrouter", model="nemotron_nano")

# Gerar resposta
result = ai.generate_response(
    prompt="Quais são os preços?",
    context={"client_name": "João"},
    chat_history=[
        {"role": "user", "content": "Olá"},
        {"role": "assistant", "content": "Olá! Como posso ajudar?"}
    ]
)

# Resultado
if result["success"]:
    print(result["response"])
    print(f"Provider: {result['provider']}")
    print(f"Model: {result['model']}")
    print(f"Tokens: {result['tokens_used']}")
```

### Trocar Modelo

```python
# Mudar para Groq Llama3-70B
ai.set_model("llama3_70b", "groq")

# Ou mudar só o modelo (mesmo provider)
ai.set_model("llama3_8b")
```

### Listar Modelos Disponíveis

```python
models = ai.get_available_models()
# Output: {
#   "openrouter": ["nemotron_nano", "mistral_7b", "gemma_7b"],
#   "groq": ["llama3_70b", "llama3_8b", "mixtral"],
#   "together": ["mixtral_instruct", "llama3_70b", "qwen_7b"]
# }

# Filtrar por provider
groq_models = ai.get_available_models(provider="groq")
# Output: {"groq": ["llama3_70b", "llama3_8b", "mixtral"]}
```

## 📦 Funções Implementadas

### `generate_response(prompt, context, chat_history, temperature, max_tokens)`

Gera uma resposta da IA.

**Parâmetros:**
- `prompt` (str): Mensagem do usuário
- `context` (dict, opcional): Contexto adicional (dados do cliente, agendamento, etc.)
- `chat_history` (list, opcional): Histórico de conversa `[{"role": "user", "content": "..."}]`
- `temperature` (float, padrão 0.7): Temperatura de geração (0.0 - 1.0)
- `max_tokens` (int, padrão 1000): Tokens máximos de resposta

**Retorno:**
```python
{
    "success": bool,
    "response": str,
    "tokens_used": int,
    "model": str,
    "provider": str,
    "error": Optional[str]
}
```

### `set_model(model_name, provider=None)`

Define o modelo a ser utilizado.

**Parâmetros:**
- `model_name` (str): Nome do modelo (ex: "llama3_70b", "mixtral", "nemotron_nano")
- `provider` (str, opcional): "openrouter", "groq", "together", "anthropic"

**Retorno:**
- `bool`: True se o modelo foi definido com sucesso

## 🚀 Implementação Real

### TODOs para Ativação

1. **Configurar API Keys** no `.env`:

```bash
# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-...

# Groq API Key
GROQ_API_KEY=gsk_...

# Together AI API Key
TOGETHER_API_KEY=e7b3...

# Anthropic API Key (opcional)
ANTHROPIC_API_KEY=sk-ant-...
```

2. **Implementar chamadas reais** em `generate_response()`:

```python
# TODO: INSERT AI API KEY WHEN AVAILABLE
# Substituir placeholder por:
if self.provider == AIProvider.OPENROUTER:
    response = openrouter.chat.completions.create(
        model=self.model_id,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )
elif self.provider == AIProvider.GROQ:
    response = groq_client.chat.completions.create(...)
# ...
```

3. **Instalar dependências**:

```bash
pip install openai groq anthropic together
```

## 🧪 Teste Rápido

```bash
cd "/root/Barberzap SITE/barberzap_python"
python3 integrations/ai_service.py
```

## 📝 Logs

O serviço usa logging Python:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

Logs de WARNING indicam que está em modo placeholder.

## 🎨 Respostas Placeholder

O placeholder detecta intenção baseada em palavras-chave:

| Palavras-chave | Tipo de Resposta |
|----------------|------------------|
| horário, hora, agendar, marcar | Scheduling |
| preço, valor, quanto, custa | Price list |
| obrigado, valeu, thanks | Gratitude response |
| Outro | Generic response |

---

📅 **Criado**: 2026-02-23
🚀 **Status**: Placeholder (FASE 2)
📝 **Implementação**: Subagent
