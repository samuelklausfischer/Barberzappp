# BarberZap - Secretária Universal IA (Universal Secretary AI Agent)

Agente de IA Secretária Universal com memória de chat (40 mensagens) para o BarberZap.

## 📋 Descrição

A Secretária Universal IA é um agente inteligente que atende clientes de forma natural e empática, ajudando com:

- ✅ Agendamentos de horários
- ✅ Informações sobre serviços e preços
- ✅ Dúvidas sobre a barbearia
- ✅ Confirmação de agendamentos

Oagente possui memória de longo prazo (40 mensagens) e identidade configurável.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    generate_response()                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Tenant Resolution   → resolve_tenant(instance_name)     │
│ 2. Context Building    → build_context(tenant_id)          │
│ 3. Memory Retrieval    → get_chat_history(tenant_id, phone)│
│ 4. AI Generation       → AIService.generate_response()      │
│ 5. Memory Save         → save_message(assistant response)   │
└─────────────────────────────────────────────────────────────┘
```

### Módulos Utilizados

- **Tenant Resolver**: `core.tenant_resolver.resolve_tenant()`
- **Context Builder**: `core.context_builder.build_context()`
- **Chat Memory**: `integrations.postgres_memory` (PostgreSQL)
- **AI Service**: `integrations.ai_service.AIService` (placeholder)

## 🚀 Uso Básico

### Opção 1: Fluxo Completo (Recomendado)

Usa `instance_name` para resolver automaticamente o tenant:

```python
from agents import generate_response

result = generate_response(
    instance_name="barbearia_001",  # Nome da instância Evolution API
    phone="5511999999999",           # Número de telefone do cliente
    message="Quero agendar um corte para sexta às 14h"
)

if result['success']:
    print(f"AI Response: {result['response']}")
    print(f"Tenant: {result['tenant_id']}")
    print(f"Processing Time: {result['metadata']['processing_time_ms']}ms")
else:
    print(f"Error: {result['error']}")
```

### Opção 2: Fluxo Simplificado

Use quando já tiver o `tenant_id`:

```python
from agents import generate_response_simple

result = generate_response_simple(
    tenant_id="1",                  # ID direto do tenant
    phone="5511999999999",
    message="Quanto custa um corte?"
)

if result['success']:
    print(result['response'])
```

## 📊 Resposta Retornada

```python
{
    'success': True,                      # Status da operação
    'response': "Oi! Quer agendar um corte...",  # Resposta da IA
    'tenant_id': "1",                     # ID do tenant
    'user_id': "1",                       # Alias para tenant_id
    'message_saved': True,                # Se a mensagem foi salva
    'history_count': 5,                   # Número de mensagens no histórico
    'ai_name': "Ana",                     # Nome da configurado na barbearia
    'barbershop_name': "Barbearia do João",  # Nome da barbearia
    'error': None,                        # Erro em caso de falha
    'metadata': {
        'instance_name': "barbearia_001",
        'phone': "5511999999999",
        'processing_time_ms': 245.5       # Tempo de processamento
    }
}
```

## 🎨 Identidade Configurável

A identidade da IA é configurada via tabela `agente_config`:

```python
# No Context Builder
{
    'barbershop': {
        'ai_name': 'Ana',              # Nome da assistente (de: nome_ia)
        'name': 'Barbearia do João',   # Nome da barbearia (de: barber_name)
        'address': 'Rua das Flores, 123',
        'hours': 'Seg-Sex 9h-19h, Sáb 9h-14h'
    }
}
```

## 🧠 Memória de Chat

A Secretária Universal mantém um histórico das últimas 40 mensagens:

```python
# Obter resumo da conversa
from agents import get_conversation_summary

summary = get_conversation_summary(
    instance_name="barbearia_001",
    phone="5511999999999",
    max_messages=10
)

print(f"Mensagens: {summary['message_count']}")
print(f"Última: {summary['last_message']['message']}")
```

### Limpar Conversa

```python
from agents import clear_conversation

result = clear_conversation(
    instance_name="barbearia_001",
    phone="5511999999999"
)

print(f"Cleared: {result['success']}")
```

## 🎭 Personalidade

A IA foi projetada com uma personalidade específica:

| Característica | Descrição |
|---------------|-----------|
| **NATURAL** | Fala como pessoa real, não como robô |
| **EMPÁTICA** | Mostra interesse genuíno no cliente |
| **CONFIRMA AGENDAMENTOS** | Repete detalhes e pede confirmação |
| **PROFISSIONAL** | Tom amigável mas profissional |
| **CONCISA** | Respostas objetivas e diretas |

### Exemplos de Respostas

#### ✅ BOA (Natural)
```
Oi João! Tudo bem? Quer agendar um corte para sexta às 14h?
Pode confirmar?
```

#### ✅ BOA (Confirmação)
```
Entendi! Corte com o Carlos às 15h de quarta.
Anotado aqui! ✅
```

#### ❌ RUIM (Robótica)
```
Olá, sou um assistente virtual. Para agendar, forneça os dados...
```

#### ❌ RUIM (Formal demais)
```
Compreendo sua solicitação de agendamento. Procederei...
```

## 🔧 API Completa

### `generate_response()`

Gera resposta com fluxo completo.

```python
def generate_response(
    instance_name: str,
    phone: str,
    message: str,
    context_override: Optional[Dict] = None,
    save_user_message: bool = True
) -> Dict
```

**Parâmetros:**
- `instance_name`: Nome da instância Evolution API
- `phone`: Número de telefone
- `message`: Mensagem do usuário
- `context_override`: Contexto opcional para sobrescrever padrão
- `save_user_message`: Se True, salva mensagem do usuário

**Retorna:** Dict com resultado (veja seção "Resposta Retornada")

### `generate_response_simple()`

Versão simplificada quando já tem `tenant_id`.

```python
def generate_response_simple(
    tenant_id: str,
    phone: str,
    message: str,
    context: Optional[Dict] = None
) -> Dict
```

### `get_conversation_summary()`

Obtém resumo da conversa recente.

```python
def get_conversation_summary(
    instance_name: str,
    phone: str,
    max_messages: int = 10
) -> Optional[Dict]
```

### `clear_conversation()`

Limpa todo o histórico de conversa.

```python
def clear_conversation(
    instance_name: str,
    phone: str
) -> Dict
```

## 📁 Estrutura do Arquivo

```
agents/secretaria_universal.py
├── SystemPromptTemplates (class)
│   ├── build_system_prompt()      # Constrói prompt do sistema
│   └── format_chat_history()      # Formata histórico para IA
├── generate_response()             # Fluxo completo
├── generate_response_simple()      # Fluxo simplificado
├── get_conversation_summary()      # Resumo da conversa
├── clear_conversation()            # Limpa conversa
└── [Exemplos de uso]
```

## 🧪 Testes

Execute o script de demonstração:

```bash
python3 scripts/demo_secretaria_universal.py
```

O script demonstra:
1. `generate_response()` - Fluxo completo
2. Conversa multi-turno
3. `get_conversation_summary()` - Resumo
4. `generate_response_simple()` - Tenant direto

## 📝 Banco de Dados

### Tabela: `chat_memoria_v4`

Armazena as mensagens de chat.

```sql
CREATE TABLE chat_memoria_v4 (
    id SERIAL PRIMARY KEY,
    session_key VARCHAR(255) NOT NULL,  -- {tenant_id}_{phone}
    tenant_id VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL,          -- 'user' ou 'assistant'
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_memoria_session_key ON chat_memoria_v4(session_key);
CREATE INDEX idx_chat_memoria_tenant_phone ON chat_memoria_v4(tenant_id, phone);
```

### Tabela: `agente_config`

Configuração da barbearia e da IA.

```sql
CREATE TABLE agente_config (
    user_id VARCHAR(100) PRIMARY KEY,
    nome_ia VARCHAR(100),               -- Nome da assistente (ex: "Ana")
    barber_name VARCHAR(100),           -- Nome da barbearia
    endereco TEXT,
    horarios TEXT,
    saudacao TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20)
);
```

### Tabela: `whatsapp_instances`

Mapeia instância Evolution API → tenant.

```sql
CREATE TABLE whatsapp_instances (
    id SERIAL PRIMARY KEY,
    instance_name VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    api_key VARCHAR(255),
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES agente_config(user_id)
);
```

## ⚠️ Limitações Atuais

1. **AI Service Placeholder**: As respostas são simuladas (placeholder).
   - Quando as API Keys estiverem disponíveis, substitua por chamadas reais.

2. **Ações Diretas**: A IA NÃO pode agendar/alterar/cancelar horários.
   - Ela apenas INFORMA sobre serviços, horários e preços.

3. **Integração**: Requer tabelas de banco de dados configuradas.

## 🚧 Roadmap

- [ ] Integrar com AI Service real (OpenRouter/Groq/Together AI)
- [ ] Suporte para intents (agendamento, cancelamento, dúvidas)
- [ ] Multitenancy avançado
- [ ] Análise de sentimento
- [ ] Métricas de conversa

## 📚 Referências

- **Core**:
  - `core/tenant_resolver.py` - Resolução de tenant
  - `core/context_builder.py` - Construção de contexto

- **Integrations**:
  - `integrations/postgres_memory.py` - Memória de chat
  - `integrations/ai_service.py` - Serviço de IA

- **Exemplos**:
  - `scripts/demo_secretaria_universal.py` - Demonstração

## 👥 Autores

**FASE 4 - Migração N8N → Python**
- BarberZap Team

---

**Versão**: 1.0.0
**Data**: 23 de Fevereiro de 2026
**Status**: ✅ Completo (FASE 4)
