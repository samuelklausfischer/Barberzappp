# BarberZap - Integration Guide

Guia completo de integração com serviços externos.

## 📋 Sumário

1. [Evolution API (WhatsApp)](#evolution-api-whatsapp)
2. [Supabase](#supabase)
3. [AI Providers (OpenRouter)](#ai-providers-openrouter)
4. [Webhook Configuration](#webhook-configuration)
5. [Testing Integrations](#testing-integrations)

---

## 🔌 Evolution API (WhatsApp)

### O que é Evolution API?

Evolution API é uma solução de automação para WhatsApp através de Webhooks e API REST. Permite:
- Enviar e receber mensagens
- Gerenciar instâncias
- Acompanhar status de conexão
- Tratar múltiplos números em uma única API

### Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────┐
│                   BarberZap Python                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  webhook_handler.py                            │    │
│  │  - Recebe webhook                              │    │
│  │  - Normaliza payload                           │    │
│  │  - Processa resposta                           │    │
│  │  - Envia via evolution_api.py                  │    │
│  └────────────────────────────────────────────────┘    │
│                          ↓                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  evolution_api.py                              │    │
│  │  - Wrapper para Evolution API                  │    │
│  │  - send_message()                              │    │
│  │  - create_instance()                           │    │
│  │  - check_status()                              │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS/WebSocket
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Evolution API Server                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Instance: barberzap_instance                  │    │
│  │  - Connected to WhatsApp                       │    │
│  │  - Receives messages                           │    │
│  │  - Sends responses                             │    │
│  │  - Webhooks configured                         │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ↓
                   ┌──────────┐
                   │ WhatsApp │
                   └──────────┘
```

### Configuração

#### 1. Variáveis de Ambiente (.env)

```bash
# Evolution API Configuration
EVOLUTION_API_URL=https://your-evolution-api-instance.com
EVOLUTION_API_KEY=your_api_key_here
EVOLUTION_API_INSTANCE=barberzap_instance
```

#### 2. Wrapper Python

O wrapper `integrations/evolution_api.py` fornece:

```python
from integrations.evolution_api import send_message, create_instance, check_status

# Enviar mensagem
result = send_message(
    instance_name="barbearia_001",
    phone="5511999999999",
    message="Olá! Sua mensagem aqui."
)

# Verificar resultado
if result['success']:
    print(f"✅ Mensagem enviada: {result['message_id']}")
else:
    print(f"❌ Erro: {result['error']}")
```

### Instalação do Evolution API

#### Opção 1: Docker (Recomendado)

```bash
# Clone Evolution API
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Criar .env
cp .env.example .env
nano .env
```

**Configurar .env:**
```bash
# URL base
SERVER_URL=http://localhost:8080

# Auth
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=your_secure_api_key

# Database (PostgreSQL)
DATABASE_TYPE=postgresql
DATABASE_CONNECTION_STRING=postgresql://user:password@localhost:5432/evolution

# Redis (opcional, para cache)
REDIS_ENABLED=true
REDIS_URI=redis://localhost:6379
```

**Iniciar containers:**
```bash
docker-compose up -d
```

#### Opção 2: Instalação Local

Requer Node.js 18+:

```bash
npm install -g evolution-api
evolution-api start
```

### Criar uma Instância

#### Via cURL:

```bash
curl -X POST https://your-evolution-api.com/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "instanceName": "barbearia_001",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta:**
```json
{
  "instance": {
    "instance": {
      "instanceName": "barbearia_001",
      "owner": "admin",
      "status": "close"
    },
    "qrcode": {
      "pairingCode": "XXXXXXXX",
      "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUh..."
    }
  }
}
```

### Conectar com WhatsApp

1. Copie o QR Code ou Pairing Code da resposta
2. Abra WhatsApp no seu celular
3. Vá em: Dispositivos conectados → Vincular um dispositivo
4. Escaneie o QR Code ou digite o pairing code
5. Aguarde a conexão

### Configurar Webhook

#### Configure webhook no Evolution API para enviar mensagens ao BarberZap:

```bash
curl -X POST https://your-evolution-api.com/webhook/set/barbearia_001 \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "url": "https://your-barberzap-domain.com/webhook/barberzap-saas",
    "webhook_by_events": true,
    "events": [
      "MESSAGES_UPSERT",
      "SEND_MESSAGE"
    ],
    "base64": false
  }'
```

**Eventos disponíveis:**
- `MESSAGES_UPSERT` - Nova mensagem recebida
- `SEND_MESSAGE` - Mensagem enviada
- `CONNECTION_UPDATE` - Status de conexão
- `PRESENCE_UPDATE` - Status de presença (online/offline)

### Verificar Status

```bash
# Via Python wrapper
from integrations.evolution_api import check_status

status = check_status("barbearia_001")
if status['status'] == 'open':
    print("✅ Conectado ao WhatsApp")
else:
    print("❌ Não conectado")
```

**Via cURL:**
```bash
curl -X GET https://your-evolution-api.com/instance/connectionState/barbearia_001 \
  -H "apikey: your_api_key"
```

**Resposta:**
```json
{
  "instance": "barbearia_001",
  "state": "open"
}
```

### Múltiplas Barbearias (Multi-tenancy)

Crie uma instância Evolution API para cada barbearia:

| Instance Evolution | Tenant ID Supabase | Barbearia |
|--------------------|-------------------|-----------|
| `barbearia_central` | `123` | Barbearia Central |
| `barbearia_sul` | `456` | Barbearia Sul |
| `barbearia_norte` | `789` | Barbearia Norte |

O sistema resolve automaticamente via `tenant_resolver.py`:

```python
# Instance do webhook: "barbearia_central"
tenant_id = resolve_tenant("barbearia_central")
# Retorna: "123"
```

---

## 🗄️ Supabase

### O que é Supabase?

Supabase é uma alternativa open-source ao Firebase. BarberZap usa:
- PostgreSQL (banco de dados)
- Auth (autenticação - futuramente)
- Realtime (quando necessário)
- Storage (uploads de imagens - planejado)

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│              Supabase (htssqiupscyhhueqwpgu)            │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │   PostgreSQL     │  │   Supabase API   │            │
│  │                  │  │                  │            │
│  │  - tenants       │  │  - REST API      │            │
│  │  - barbearias    │  │  - GraphQL       │            │
│  │  - leads         │  │  - Realtime      │            │
│  │  - messages      │  │                  │            │
│  │  - chat_memoria  │  │                  │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ↓ REST API
┌─────────────────────────────────────────────────────────┐
│              BarberZap Python                           │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ supabase.py │  │      CRM    │  │   Context   │    │
│  │   wrapper   │  │  Manager    │  │   Builder   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Configuração

#### 1. Obter credenciais

Acesse: [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/htssqiupscyhhueqwpgu/settings/api)

Copie:
- **Project URL** (pública)
- **service_role** key (secret - usar apenas no servidor)

#### 2. Configurar .env

```bash
SUPABASE_URL=https://htssqiupscyhhueqwpgu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.htssqiupscyhhueqwpgu.supabase.co:5432/postgres
```

### Wrappers Python

#### supabase_rest.py (REST Client)

```python
from integrations.supabase_rest import SupabaseClient

# Inicializar cliente
client = SupabaseClient()

# Insert lead
lead = client.insert("leads", {
    "tenant_id": "123",
    "phone": "5511999999999",
    "name": "João Silva"
})

# Select com filtros
leads = client.select("leads", filters={
    "tenant_id": "eq.123",
    "status": "eq.active"
})

# Update
updated = client.update("leads", "uuid-123", {
    "status": "converted"
})
```

#### postgres_memory.py (Chat Memory)

```python
from integrations.postgres_memory import get_chat_history, save_message

# Buscar histórico
history = get_chat_history(
    user_id="123",
    phone="5511999999999",
    limit=40
)

# Salvar mensagem
save_message(
    user_id="123",
    phone="5511999999999",
    role="user",  # ou "assistant"
    content="Olá, quero agendar"
)
```

### Schema do Banco

As tabelas principais:

```sql
-- Tenancies
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    evolution_instance VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barbearias
CREATE TABLE barbearias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    hours VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barbeiros
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id UUID REFERENCES barbearias(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Serviços
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id UUID REFERENCES barbearias(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads/Clientes
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensagens CRM
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Memory (IA)
CREATE TABLE chat_memoria_v4 (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_chat_memory_user_phone ON chat_memoria_v4(user_id, phone);
CREATE INDEX idx_tenants_instance ON tenants(evolution_instance);
```

### Migrações

```bash
# Execute migrations
python scripts/migrate_schema.py
```

---

## 🤖 AI Providers (OpenRouter)

### O que é OpenRouter?

OpenRouter é um gateway para modelos de IA que permite:
- Acesso a múltiplos modelos (OpenAI, Anthropic, Google, etc.)
- Preços competitivos
- Uma única API key

### Configuração

#### 1. Criar conta

Acesse: [openrouter.ai](https://openrouter.ai/)

#### 2. Obter API Key

1. Login → Dashboard → API Keys
2. Create new key
3. Copie para o .env

#### 3. Configurar .env

```bash
# AI Configuration
AI_API_KEY=sk-or-v1-your-key-here
AI_MODEL=openai/gpt-4o-mini
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
```

### Modelos disponíveis

| Modelo | Preço (1M tokens) | Uso recomendado |
|--------|-------------------|-----------------|
| `openai/gpt-4o-mini` | US$0.15 | Chat padrão |
| `openai/gpt-4o` | US$2.50 | Requisições complexas |
| `anthropic/claude-3-haiku` | US$0.25 | Respostas rápidas |
| `anthropic/claude-3-sonnet` | US$3.00 | Análise detalhada |
| `google/gemini-pro` | US$0.50 | Geral |

### Wrapper Python

```python
from integrations.ai_service import create_ai_service, AIService

# Criar serviço
ai = AIService(model="openai/gpt-4o-mini")

# Gerar resposta
response = ai.generate(
    system_prompt="Você é uma secretária de barbearia.",
    user_message="Quero agendar um corte.",
    context={
        "name": "João",
        "barbershop": "Barbearia Central"
    }
)
```

### Customização de Prompt

O sistema `SystemPromptTemplates.build_system_prompt()` constrói prompts dinâmicos:

```python
from agents.secretaria_universal import SystemPromptTemplates

prompt = SystemPromptTemplates.build_system_prompt(
    ai_name="Ana",
    barbershop_name="Barbearia Central",
    context={
        'barbershop': {'address': 'Rua A, 123', 'hours': '9h-18h'},
        'barbers': [{'name': 'João'}, {'name': 'Pedro'}],
        'services': [{'name': 'Corte', 'price': 35.00}]
    }
)
```

---

## 🔗 Webhook Configuration

### Configurar webhook no Evolution API

```bash
curl -X POST https://your-evolution-api.com/webhook/set/barbearia_001 \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "url": "https://your-barberzap-domain.com/webhook/barberzap-saas",
    "webhook_by_events": true,
    "events": [
      "MESSAGES_UPSERT"
    ],
    "base64": false,
    "reject_unauthorized": false
  }'
```

### Validar Webhooks (Planejado)

Em produção, implementar verificação de assinatura:

```python
import hmac
import hashlib

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verifica se o webhook veio da Evolution API.
    """
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    # Comparação segura contra timing attacks
    return hmac.compare_digest(expected, signature)
```

---

## 🧪 Testing Integrations

### Testar Evolution API

```bash
# 1. Criar instância
curl -X POST https://your-evolution-api.com/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{"instanceName": "test_instance", "qrcode": true}'

# 2. Escanear QR Code

# 3. Enviar mensagem de teste
curl -X POST https://your-evolution-api.com/message/sendText/test_instance \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "number": "5511999999999",
    "options": {"delay": 1200, "presence": "composing"},
    "textMessage": {"text": "Teste do BarberZap!"}
  }'
```

### Testar Supabase Connection

```bash
python scripts/check_db.py
```

Saída esperada:
```
✅ Supabase URL configured
✅ Service Role Key valid
✅ Connected to database
✅ Tables found: tenants, barbearias, leads, messages, chat_memoria_v4
```

### Testar AI Integration

```bash
python scripts/demo_secretaria_universal.py
```

### Testar Webhook Manual

Use ngrok para expor localhost:

```bash
# 1. Iniciar ngrok
ngrok http 8000

# 2. Copy the URL (ex: https://abc123.ngrok.io)

# 3. Configure webhook no Evolution API
curl -X POST https://your-evolution-api.com/webhook/set/barbearia_001 \
  -H "Content-Type: application/json" \
  -H "apikey: your_api_key" \
  -d '{
    "url": "https://abc123.ngrok.io/webhook/barberzap-saas",
    "events": ["MESSAGES_UPSERT"]
  }'

# 4. Envie mensagem via WhatsApp para testar
```

---

## 📊 Monitoring de Integrações

### Evolution API Status

```bash
# Verificar status de todas as instâncias
curl -X GET https://your-evolution-api.com/instance/fetchInstances \
  -H "apikey: your_api_key"

# Logs da Evolution API
# (Configure via Evolution API dashboard)
```

### Supabase Health

```bash
# Check connection
python -c "
from supabase import create_client
import os
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
client = create_client(url, key)
print('✅ Connected to Supabase')
"
```

### Latency Tests

```python
import time

def test_ai_latency(ai_service):
    start = time.time()
    ai_service.generate("Test message")
    elapsed = (time.time() - start) * 1000
    print(f"Ai latency: {elapsed:.2f}ms")

def test_db_latency(supabase_client):
    start = time.time()
    supabase_client.table('tenants').select('*').limit(1).execute()
    elapsed = (time.time() - start) * 1000
    print(f"DB latency: {elapsed:.2f}ms")
```

---

## ✅ Integration Checklist

Antes de ir para produção:

### Evolution API
- [ ] Instância criada
- [ ] QR Code escaneado e conectado
- [ ] API Key configurada
- [ ] Webhook configurado para `/webhook/barberzap-saas`
- [ ] Webhook recebendo mensagens
- [ ] Mensagens sendo respondidas

### Supabase
- [ ] SERVICE_ROLE_KEY configurada
- [ ] Tabelas criadas (schema)
- [ ] Migrações executadas
- [ ] Conexão testada
- [ ] Tenant resolution funcionando

### AI Provider
- [ ] API Key configurada
- [ ] Modelo selecionado
- [ ] Prompt templates configurados
- [ ] Respostas sendo geradas

### Geral
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Logs não expondo credenciais
- [ ] Error handling implementado
- [ ] Retry logic configurado
- [ ] Monitoring configurado

---

## 🛠️ Troubleshooting

### Evolution API não conecta

**Symptom:** Status sempre "close"

**Solutions:**
1. O WhatsApp não foi escaneadoRecentemente (após 5 min o QR expira)
2. O número está sendo usado em outro WhatsApp Web
3. A instância foi desconnected

```bash
# Generate new QR Code
curl -X GET https://your-evolution-api.com/instance/connect/barbearia_001 \
  -H "apikey: your_api_key"
```

---

### Webhook não recebendo mensagens

**Symptom:** Endpoint não é chamado

**Solutions:**
1. Evolution API não consegue acessar a URL (firewall, rede)
2. URL está incorreta
3. Use ngrok para desenvolvimento local

---

### AI não gera respostas

**Symptom:** `AI generation failed`

**Solutions:**
1. Verifique API Key do OpenRouter
2. Verifique saldo/credits
3. Verifique se o_modelo existe
4. Aumente `AI_MAX_TOKENS` se response truncada

---

## 📚 Referências Externas

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

**Integration Guide v1.0.0** | Última atualização: 2026-02-23
