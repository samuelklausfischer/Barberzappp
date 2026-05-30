# Sistema de Integrações BarberZap - Análise Completa

> **Versão:** 1.0.0
> **Data:** 2026-02-26
> **Finalidade:** Documentação completa do sistema de integrações para Notebook LM

---

## Índice

1. [Visão Geral das Integrações](#1-visão-geral-das-integrações)
2. [Evolution API (WhatsApp)](#2-evolution-api-whatsapp)
3. [Supabase (Database)](#3-supabase-database)
4. [AI Service (OpenRouter/Groq/Together AI)](#4-ai-service-openroutergroqtogether-ai)
5. [PostgreSQL Memory (Chat Memory)](#5-postgresql-memory-chat-memory)
6. [Cakto (Checkout)](#6-cakto-checkout)
7. [Cal.com (Booking System)](#7-calcom-booking-system)
8. [n8n (Orquestrador Original)](#8-n8n-orquestrador-original)
9. [Diagrama de Fluxo de Integrações](#9-diagrama-de-fluxo-de-integrações)
10. [Configuração e Deploy](#10-configuração-e-deploy)

---

## 1. Visão Geral das Integrações

O BarberZap utiliza uma arquitetura modular de integrações composta por 7 serviços principais que formam o ecossistema da aplicação.

### 1.1 Mapa de Integrações

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CLIENTE WHATSAPP                                  │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  1️⃣ EVOLUTION API (WhatsApp Gateway)                                    │
│  - webhooks/barberzap-saas                                               │
│  - /message/sendText/{instance}                                         │
│  - /instance/create                                                      │
├──────────────────┬───────────────────────────────────────────────────────┤
│                  │                                                       │
│         POST /webhook/barberzap-saas                                     │
│                  │                                                       │
└──────────────────┼───────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  2️⃣ BARBERZAP FASTAPI SERVER                                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  INTEGRATIONS LAYER                                               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐       │   │
│  │  │ Evolution  │  │ Supabase   │  │    AI Service         │       │   │
│  │  │ API        │  │ REST       │  │ (OpenRouter/Groq/etc) │       │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘       │   │
│  │  ┌────────────┐                                                   │   │
│  │  │ PostgreSQL │                                                   │   │
│  │  │   Memory   │                                                   │   │
│  │  └────────────┘                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────────────────┐
│ 3️⃣ SUPABASE DB  │  │ 4️⃣ AI PROVIDERS            │
│ - leads (105)   │  │ - OpenRouter                │
│ - messages (1.5K)│ │ - Groq                      │
│ - agents_config │  │ - Together AI               │
├─────────────────┤  ├─────────────────────────────┤
│                 │  │ 5️⃣ CAKTO CHECKOUT          │
│ 6️⃣ CAL.COM     │  │ - pay.cakto.com.br          │
│ - Demo bookings │  │ - Checkout webhook → n8n     │
└─────────────────┘  └────────────┬────────────────┘
                                  │
                                  ▼
                        ┌─────────────────────────────┐
                        │ 7️⃣ n8n (ORCHESTRADOR)      │
                        │ - Workflows de IA           │
                        │ - Webhook processing        │
                        └─────────────────────────────┘
```

### 1.2 Tabela de Integrações

| # | Integração | Status | Wrapper Python | URL Principal |
|---|-----------|--------|----------------|---------------|
| 1 | **Evolution API** | PLACEHOLDER | `evolution_api.py` | http://localhost:8080 |
| 2 | **Supabase** | ✅ Ativo | `supabase_rest.py` | https://htssqiupscyhhueqwpgu.supabase.co |
| 3 | **AI Service** | PLACEHOLDER | `ai_service.py` | Multiple providers |
| 4 | **PostgreSQL Memory** | ✅ Ativo | `postgres_memory.py` | db.htssqiupscyhhueqwpgu.supabase.co |
| 5 | **Cakto Checkout** | ✅ Ativo | - | https://pay.cakto.com.br/psc74bb_701168 |
| 6 | **Cal.com** | ✅ Ativo | `calcom_client.py` | Self-hosted |
| 7 | **n8n** | ✅ Ativo | - | https://0001-0001.25xe2c.easypanel.host |

---

## 2. Evolution API (WhatsApp)

### 2.1 Descrição

A **Evolution API** é o gateway WhatsApp oficial do BarberZap, responsável por:
- Receber mensagens de clientes via webhooks
- Enviar respostas automáticas da secretária IA
- Gerenciar múltiplas instâncias (multi-tenancy)
- Fornecer QR Code para pairing/dispositivos

### 2.2 Status da Integração

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Wrapper Python** | ⚠️ PLACEHOLDER | Aguardando API Key do Docker Hub |
| **Implementação** | Migrando do n8n → Python | Wrapper funcional mas sem conexão real |
| **Endpoints Definidos** | ✅ Completo | Todos os endpoints planejados |

### 2.3 Endpoints da Evolution API

#### Webhook Principal
```
POST /webhook/barberzap-saas
```

**Payload Recebido:**
```json
{
  "event": "messages.upsert",
  "instance": {
    "instanceName": "barbearia_001"
  },
  "data": [{
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0FAED6CC5D57E"
    },
    "message": {
      "conversation": "Quero agendar um corte..."
    },
    "pushName": "João Silva",
    "timestamp": 1740315600
  }]
}
```

#### Endpoints de Instância

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/instance/create` | POST | Cria nova instância |
| `/instance/connectionState/{instance}` | GET | Verifica status de conexão |
| `/instance/delete/{instance}` | DELETE | Remove instância |
| `/instance/fetchInstances` | GET | Lista todas as instâncias |

#### Endpoints de Mensagens

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/message/sendText/{instance}` | POST | Envia mensagem de texto |
| `/message/sendMedia/{instance}` | POST | Envia mídia (imagem, áudio, vídeo) |
| `/message/sendButtons/{instance}` | POST | Envia botões interativos |

#### Endpoints de QR Code

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/instance/connect/{instance}` | GET | Obtém QR Code para pairing |
| `/instance/logout/{instance}` | GET | Desconecta instância |

### 2.4 Wrapper Python (`evolution_api.py`)

#### Classe Principal

```python
class EvolutionAPI:
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = base_url or "http://localhost:8080"
        self.api_key = api_key  # TODO: INSERT API KEY WHEN AVAILABLE
```

#### Métodos Principais

```python
# Enviar mensagem
def send_message(instance_name: str, phone: str, message: str) -> Dict[str, any]:
    """
    Envia WhatsApp via Evolution API
    
    Returns:
        {
            "success": bool,
            "message_id": str,
            "error": str | None
        }
    """

# Criar instância
def create_instance(instance_name: str = None, qrcode: bool = True) -> Dict[str, any]:
    """
    Cria nova instância
    
    Returns:
        {
            "success": bool,
            "instance_name": str,
            "instance_token": str,
            "qrcode": str | None
        }
    """

# Verificar status
def check_status(instance_name: str) -> Dict[str, any]:
    """
    Verifica status da instância
    
    Returns:
        {
            "success": bool,
            "status": "connected" | "disconnected" | "pending" | "error",
            "phone_number": str | None
        }
    """

# Deletar instância
def delete_instance(instance_name: str) -> Dict[str, any]:
    """Remove instância"""

# Obter QR Code
def get_qrcode(instance_name: str) -> Dict[str, any]:
    """
    Obtém QR Code para conexão
    
    Returns:
        {
            "success": bool,
            "qrcode": str,
            "base64": str | None
        }
    """
```

### 2.5 Workflow de Webhook

```
1. Cliente envia mensagem no WhatsApp
2. Evolution API recebe webhook
3. POST para /webhook/barberzap-saas
4. BarberZap normaliza payload
5. Resolve tenant (instance_name → user_id)
6. Gera resposta via AI Service
7. POST para /message/sendText/{instance}
8. Evolution envia mensagem para cliente
```

### 2.6 Multi-Tenancy

Cada barbearia tem sua própria instância na Evolution API:

| Instance Name | Tenant ID | Barbearia | Status |
|---------------|-----------|-----------|--------|
| `barbearia_001` | 123 | Barbearia Central | active |
| `barbearia_002` | 456 | Barbearia Sul | active |
| `barbearia_003` | 789 | Barbearia Norte | active |

**Mapeamento no Supabase:**

```sql
-- Tabela: whatsapp_instances
CREATE TABLE whatsapp_instances (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    instance_name text UNIQUE NOT NULL,
    user_id text NOT NULL,
    status text DEFAULT 'active',
    phone_number text,
    qrcode text,
    created_at timestamp with time zone DEFAULT now()
);
```

---

## 3. Supabase (Database)

### 3.1 Descrição

**Supabase** é o backend-as-a-service (BaaS) do BarberZap, fornecendo:
- PostgreSQL como banco de dados principal
- REST API para queries diretas
- Auth e Row Level Security (RLS)
- Real-time subscriptions (futuro)

### 3.2 Status da Integração

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Wrapper Python** | ✅ Completo | `supabase_rest.py` funcional |
| **Conexão** | ✅ Ativa | Endpoint acessível |
| **Tabelas** | ✅ Configuradas | Schema completo com 105+ leads |

### 3.3 Configuração

#### Endpoint e Credenciais

```bash
# .env configuration
SUPABASE_URL=https://htssqiupscyhhueqwpgu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0c3NxaXVwc2N5aGh1ZXF3cGd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYyNjY1OCwiZXhwIjoyMDc3MjAyNjU4fQ.tp-3z2K2QvBWSCB--uOyv-eGOImLKpTvcXgM04w2N38
SUPABASE_DB_URL=postgresql://postgres:password@db.htssqiupscyhhueqwpgu.supabase.co:5432/postgres
```

#### Headers de Autenticação

```http
apikey: {SERVICE_ROLE_KEY}
Authorization: Bearer {SERVICE_ROLE_KEY}
Content-Type: application/json
Prefer: return=representation
```

### 3.4 Schema do Banco de Dados

#### Tabela: leads (105 rows)

Finalidade: Armazenar leads capturados da Landing Page e WhatsApp

```sql
CREATE TABLE leads (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    phone text NOT NULL UNIQUE,
    name text,
    email text,
    status text DEFAULT 'new',  -- new, contacted, demo_scheduled, converted, lost
    plan text,                  -- basic, pro, enterprise
    is_ai_muted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

**Exemplo de lead:**
```json
{
  "id": 1,
  "phone": "5511999999999",
  "name": "João Silva",
  "email": "joao@email.com",
  "status": "demo_scheduled",
  "plan": "pro",
  "is_ai_muted": false,
  "created_at": "2026-02-26T14:30:00Z"
}
```

#### Tabela: messages (1,518 rows)

Finalidade: Histórico completo de conversas com a secretária IA

```sql
CREATE TABLE messages (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    lead_id bigint REFERENCES leads(id),
    direction text NOT NULL,  -- inbound, outbound
    role text NOT NULL,       -- user, assistant
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**Exemplo de mensagem:**
```json
{
  "id": 1234,
  "lead_id": 1,
  "direction": "inbound",
  "role": "user",
  "content": "Quais são os preços dos cortes?",
  "metadata": {
    "instance_name": "barbearia_001",
    "client_name": "João Silva"
  },
  "created_at": "2026-02-26T15:45:00Z"
}
```

#### Tabela: agents_config (5 rows)

Finalidade: Configuração de cada secretária virtual (por tenant)

```sql
CREATE TABLE agents_config (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id text UNIQUE NOT NULL,
    nome_barbearia text NOT NULL,
    endereco text,
    horarios text,
    nome_ia text DEFAULT 'Ana',
    saudacao text,
    instructions text,
    phone text,
    whatsapp text,
    model text DEFAULT 'gpt-4o-mini',
    temperature numeric DEFAULT 0.7,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Exemplo de configuração:**
```json
{
  "id": 1,
  "user_id": "123",
  "nome_barbearia": "Barbearia do João",
  "endereco": "Rua das Flores, 123",
  "horarios": "Seg-Sex 9h-19h, Sáb 9h-14h",
  "nome_ia": "Ana",
  "saudacao": "Olá! Como posso ajudar?",
  "instructions": "Sempre seja empática e clara",
  "phone": "(11) 99999-9999",
  "whatsapp": "5511999999999",
  "model": "gpt-4o-mini",
  "temperature": 0.7
}
```

#### Tabela: plans (5 rows)

Finalidade: Planos de assinatura e links de checkout

```sql
CREATE TABLE plans (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name text UNIQUE NOT NULL,
    price numeric NOT NULL,
    currency text DEFAULT 'BRL',
    features jsonb,
    checkout_url text,
    cakto_link_id text,
    active boolean DEFAULT true
);
```

**Planos disponíveis:**
| ID | Name | Price | Features |
|----|------|-------|----------|
| 1 | Basic | R$ 97/mês | IA básica, WhatsApp único |
| 2 | Pro | R$ 197/mês | IA avançada, multi-agente |
| 3 | Enterprise | R$ 497/mês | API full, suporte prioritário |

#### Tabela: conversation_reviews (42 rows)

Finalidade: Reviews e análises de conversas para treinamento

```sql
CREATE TABLE conversation_reviews (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    lead_id bigint REFERENCES leads(id),
    rating integer CHECK (rating >= 1 AND rating <= 5),
    feedback text,
    issues jsonb,  -- ["price_not_clear", "missed_information"]
    reviewed_at timestamp with time zone DEFAULT now(),
    reviewed_by text
);
```

#### Tabela: whatsapp_instances

Finalidade: Mapeamento de instâncias Evolution API → tenants

```sql
CREATE TABLE whatsapp_instances (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    instance_name text UNIQUE NOT NULL,
    user_id text NOT NULL,
    status text DEFAULT 'pending',
    phone_number text,
    qrcode text,
    created_at timestamp with time zone DEFAULT now()
);
```

#### Tabela: barbers

Finalidade: Cadastro de barbeiros disponíveis

```sql
CREATE TABLE barbers (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id text NOT NULL,
    name text NOT NULL,
    specialties text[],  -- ["Corte", "Barba", "Pigmentação"]
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now()
);
```

#### Tabela: services

Finalidade: Catálogo de serviços da barbearia

```sql
CREATE TABLE services (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    duration integer,  -- minutos
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now()
);
```

**Exemplo de serviços:**
```json
[
  {
    "id": 1,
    "user_id": "123",
    "name": "Corte de Cabelo",
    "description": "Corte tradicional com máquina e tesoura",
    "price": 35.00,
    "duration": 30,
    "status": "active"
  },
  {
    "id": 2,
    "user_id": "123",
    "name": "Barba",
    "description": "Barba modelada com toalha quente",
    "price": 25.00,
    "duration": 20,
    "status": "active"
  }
]
```

### 3.5 Wrapper Python (`supabase_rest.py`)

#### Cliente REST

```python
class SupabaseRestClient:
    def __init__(self, url: str = None, service_role_key: str = None):
        self.url = url or os.getenv('SUPABASE_URL')
        self.service_role_key = service_role_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self._setup_headers()
        self.session = requests.Session()
```

#### Métodos CRUD

```python
# GET - Buscar registros
def get(
    self,
    table: str,
    filters: Optional[Dict[str, Any]] = None,
    single: bool = False
) -> Union[List[Dict], Dict, None]:
    """
    Busca registros na tabela
    
    Examples:
        client.get('barbers')
        client.get('leads', {'status': 'eq.new'})
        client.get('services', {'select': 'id,name,price'})
    """

# POST - Inserir registros
def post(
    self,
    table: str,
    data: Union[Dict, List[Dict]]
) -> Union[Dict, List[Dict]]:
    """
    Insere novo registro(s)
    
    Example:
        client.post('leads', {
            'phone': '5511999999999',
            'name': 'João Silva',
            'status': 'new'
        })
    """

# PATCH - Atualizar registro
def patch(
    self,
    table: str,
    id: Union[str, int],
    data: Dict,
    id_column: str = 'id'
) -> Optional[Dict]:
    """Atualiza registro existente"""

# DELETE - Remover registro
def delete(
    self,
    table: str,
    id: Union[str, int],
    id_column: str = 'id'
) -> bool:
    """Remove registro da tabela"""

# UPSERT - Insert ou update
def upsert(
    self,
    table: str,
    filters: Dict[str, Any],
    data: Dict[str, Any],
    id_column: str = 'id'
) -> Optional[Dict]:
    """
    Insert ou update inteligente
    
    Example:
        client.upsert('whatsapp_instances',
                      {'instance_name': 'inst_001'},
                      {'status': 'connected', 'user_id': 123})
    """
```

#### Filtros Suportados

| Operador | Exemplo | Descrição |
|----------|---------|-----------|
| Equality | `{'active': 'true'}` | `active = true` |
| eq | `{'status': 'eq.new'}` | `status = 'new'` |
| gt | `{'price': 'gt.50'}` | `price > 50` |
| gte | `{'price': 'gte.50'}` | `price >= 50` |
| lt | `{'price': 'lt.100'}` | `price < 100` |
| lte | `{'price': 'lte.100'}` | `price <= 100` |
| ilike | `{'name': 'ilike.jo%'}` | `name ILIKE 'jo%'` |
| in | `{'status': 'in.(new,contacted)'}` | `status IN ('new', 'contacted')` |
| order | `{'order': 'created_at.desc'}` | `ORDER BY created_at DESC` |
| limit | `{'limit': 10}` | `LIMIT 10` |
| offset | `{'offset': 20}` | `OFFSET 20` |

#### Funções de Conveniência

```python
# Instância global
def get_client(url: str = None, service_role_key: str = None) -> SupabaseRestClient:
    """Obtém ou cria instância do cliente"""

# Atalhos
def supabase_get(table: str, filters: Dict = None, single: bool = False):
    return get_client().get(table, filters, single)

def supabase_post(table: str, data: Union[Dict, List]):
    return get_client().post(table, data)

def supabase_patch(table: str, id: Union[str, int], data: Dict, id_column: str = 'id'):
    return get_client().patch(table, id, data, id_column)

def supabase_delete(table: str, id: Union[str, int], id_column: str = 'id'):
    return get_client().delete(table, id, id_column)
```

### 3.6 Context Builder

O `context_builder.py` usa o Supabase REST para construir o contexto da barbearia:

```python
def build_context(tenant_id: str) -> Dict[str, Any]:
    """
    Constrói contexto completo da barbearia
    
    Returns:
        {
            'barbershop': {...},
            'barbers': [...],
            'services': [...]
        }
    """
    
    # Query 1: agente_config
    config = supabase_get('agente_config', {'user_id': f'eq.{tenant_id}'}, single=True)
    
    # Query 2: barbers
    barbers = supabase_get('barbers', {'user_id': f'eq.{tenant_id}', 'status': 'active'})
    
    # Query 3: services
    services = supabase_get('services', {'user_id': f'eq.{tenant_id}', 'status': 'active'})
    
    return {
        'barbershop': config,
        'barbers': barbers,
        'services': services
    }
```

---

## 4. AI Service (OpenRouter/Groq/Together AI)

### 4.1 Descrição

O **AI Service** é o wrapper unificado para múltiplos providers de IA, permitindo:
- Troca de providers sem mudar código
- Seleção de modelos gratuitos/pagos
- Configuração de temperatura e tokens máximos
- Injeção de contexto e histórico

### 4.2 Status da Integração

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Wrapper Python** | ⚠️ PLACEHOLDER | Aguardando API Keys reais |
| **Providers Suportados** | ✅ Definidos | OpenRouter, Groq, Together AI, Anthropic |
| **Modelos Gratuitos** | ✅ Mapeados | Nemotron, Llama-3, Mixtral |

### 4.3 Providers e Modelos

#### OpenRouter

| Nome Interno | Model ID | Preço |
|--------------|----------|-------|
| nemotron_nano | nvidia/nemotron-nano-9b-v2:free | ✅ Grátis |
| mistral_7b | mistralai/mistral-7b-instruct:free | ✅ Grátis |
| gemma_7b | google/gemma-7b-it:free | ✅ Grátis |

```bash
OPENROUTER_API_KEY=sk-or-v1-xxx
```

#### Groq

| Nome Interno | Model ID | Preço |
|--------------|----------|-------|
| llama3_70b | llama-3.3-70b-versatile | ✅ Grátis |
| llama3_8b | llama-3.1-8b-instant | ✅ Grátis |
| mixtral | mixtral-8x7b-32768 | ✅ Grátis |

```bash
GROQ_API_KEY=gsk_xxx
```

#### Together AI

| Nome Interno | Model ID | Preço |
|--------------|----------|-------|
| mixtral_instruct | mistralai/Mixtral-8x7B-Instruct-v0.1 | ✅ Grátis |
| llama3_70b | meta-llama/Llama-3-70b-chat-hf | ✅ Grátis |
| qwen_7b | Qwen/Qwen2-7B-Instruct | ✅ Grátis |

```bash
TOGETHER_API_KEY=xxx
```

### 4.4 Wrapper Python (`ai_service.py`)

#### Classe Principal

```python
class AIProvider(Enum):
    OPENROUTER = "openrouter"
    GROQ = "groq"
    TOGETHER = "together"
    ANTHROPIC = "anthropic"

class AIService:
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
        # ...
    }
    
    def __init__(self, provider: AIProvider = AIProvider.OPENROUTER, model: str = "nemotron_nano"):
        self.provider = provider
        self.model_name = model
        self.model_id = self._get_model_id(provider, model)
        self.api_key = os.getenv(f"{provider.value.upper()}_API_KEY", "")  # TODO
```

#### Método Principal

```python
def generate_response(
    self,
    prompt: str,
    context: Optional[Dict[str, Any]] = None,
    chat_history: Optional[List[Dict[str, str]]] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> Dict[str, Any]:
    """
    Gera resposta da IA
    
    Args:
        prompt: Mensagem do usuário
        context: Dados da barbearia (nome, serviços, etc.)
        chat_history: Histórico de conversa
        temperature: Criatividade (0.0 - 1.0)
        max_tokens: Tokens máximos de resposta
    
    Returns:
        {
            "success": bool,
            "response": str,
            "tokens_used": int,
            "model": str,
            "provider": str,
            "error": Optional[str]
        }
    """
```

#### Troca de Modelo

```python
def set_model(self, model_name: str, provider: Optional[AIProvider] = None) -> bool:
    """Define novo modelo"""
```

#### Listar Modelos Disponíveis

```python
def get_available_models(self, provider: Optional[AIProvider] = None) -> Dict[str, List[str]]:
    """Retorna modelos disponíveis por provider"""
```

### 4.5 Função de Conveniência

```python
def create_ai_service(
    provider: str = "openrouter",
    model: str = "nemotron_nano"
) -> AIService:
    """
    Cria instância do serviço de IA
    
    Args:
        provider: "openrouter", "groq", "together", "anthropic"
        model: Nome do modelo (ex: "llama3_70b", "mixtral")
    
    Returns:
        Instância de AIService
    """
```

### 4.6 System Prompt Template

```python
SYSTEM_PROMPT_TEMPLATE = """
Você são {nome_ia}, a secretária virtual da {nome_barbearia}.

🎯 Sua Missão:
Atender clientes de forma NATURAL, EMPÁTICA e PROFISSIONAL

📍 Informações da Barbearia:
- Nome: {nome_barbearia}
- Endereço: {endereco}
- Horário: {horarios}
- WhatsApp: {whatsapp}

🧔 Barbeiros disponíveis:
{barbers_list}

💈 Serviços disponíveis:
{services_list}

💬 Diretrizes:
1. NATURAL e CONVERSACIONAL
2. EMPÁTICA e ATENCIOSA
3. CLARA e OBJETIVA
4. PROATIVA na sugestão de serviços

🚫 NÃO:
- Não seja robótico
- Não repita informações
- Não invente horários disponíveis

✅ SEMPRE:
- Confirmar informações cruciais
- Perguntar se precisa de mais ajuda
- Oferecer agendamento quando apropriado
"""
```

---

## 5. PostgreSQL Memory (Chat Memory)

### 5.1 Descrição

O **PostgreSQL Memory** é o sistema de memória de chat do BarberZap, armazenando:
- Histórico de conversas por sessão
- Multi-tenancy (cada tenant tem sua própria memória)
- Metadata associada a cada mensagem
- Suporte a TTL (futuro)

### 5.2 Status da Integração

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Wrapper Python** | ✅ Ativo | `postgres_memory.py` funcional |
| **Conexão** | ✅ Ativa | Conectado ao Supabase PostgreSQL |
| **Tabela** | ✅ Criada | `chat_memoria_v4` |

### 5.3 Schema da Tabela

```sql
CREATE TABLE chat_memoria_v4 (
    id bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    session_key text NOT NULL,  -- {tenant_id}_{phone}
    tenant_id text NOT NULL,
    phone text NOT NULL,
    role text NOT NULL,  -- user, assistant
    message text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_memoria_session_key ON chat_memoria_v4(session_key);
CREATE INDEX idx_chat_memoria_tenant_id ON chat_memoria_v4(tenant_id);
CREATE INDEX idx_chat_memoria_phone ON chat_memoria_v4(phone);
CREATE INDEX idx_chat_memoria_created_at ON chat_memoria_v4(created_at);
```

### 5.4 Wrapper Python (`postgres_memory.py`)

#### Classe Principal

```python
class PostgresMemory:
    def __init__(
        self,
        host: str = POSTGRES_HOST,
        port: int = POSTGRES_PORT,
        database: str = POSTGRES_DB,
        user: str = POSTGRES_USER,
        password: str = POSTGRES_PASSWORD
    ):
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password
        self._connection = None
```

#### Métodos Principais

```python
# Salvar mensagem
def save_message(
    self,
    tenant_id: str,
    phone: str,
    role: str,
    message: str,
    metadata: Optional[Dict] = None
) -> Dict:
    """
    Salva mensagem no histórico de chat
    
    Args:
        tenant_id: ID do tenant
        phone: Número de telefone
        role: 'user' ou 'assistant'
        message: Conteúdo da mensagem
        metadata: Dados adicionais (opcional)
    
    Returns:
        {
            "success": bool,
            "message": str,
            "id": int,
            "session_key": str
        }
    """

# Recuperar histórico
def get_chat_history(
    self,
    tenant_id: str,
    phone: str,
    limit: int = 40
) -> Dict:
    """
    Recupera histórico de chat de um usuário
    
    Returns:
        {
            "success": bool,
            "messages": List[Dict],
            "count": int,
            "session_key": str
        }
    """

# Limpar histórico
def clear_chat_history(
    self,
    tenant_id: str,
    phone: str
) -> Dict:
    """Remove todas as mensagens do usuário"""

# Última mensagem
def get_last_message(
    self,
    tenant_id: str,
    phone: str
) -> Dict:
    """Retorna a última mensagem do usuário"""

# Contar mensagens
def count_messages(
    self,
    tenant_id: str,
    phone: str
) -> Dict:
    """Conta mensagens do usuário"""
```

#### Session Key

```python
def _get_session_key(self, tenant_id: str, phone: str) -> str:
    """
    Gera chave de sessão
    
    Exemplo: "123_5511999999999"
    """
    return f"{tenant_id}_{phone}"
```

### 5.6 Funções de Conveniência

```python
# Instância global
def get_memory() -> PostgresMemory:
    """Retorna instância singleton do PostgresMemory"""

# Atalhos
def save_message(tenant_id: str, phone: str, role: str, message: str, metadata: Dict = None):
    return get_memory().save_message(tenant_id, phone, role, message, metadata)

def get_chat_history(tenant_id: str, phone: str, limit: int = 40):
    result = get_memory().get_chat_history(tenant_id, phone, limit)
    return result.get("messages", []) if result["success"] else []

def clear_chat_history(tenant_id: str, phone: str):
    return get_memory().clear_chat_history(tenant_id, phone)
```

### 5.7 Exemplo de Uso

```python
with PostgresMemory() as mem:
    # Salvar mensagem do usuário
    mem.save_message(
        tenant_id="123",
        phone="5511999999999",
        role="user",
        message="Quero agendar um corte",
        metadata={"client_name": "João Silva"}
    )
    
    # Salvar resposta da IA
    mem.save_message(
        tenant_id="123",
        phone="5511999999999",
        role="assistant",
        message="Claro, João! Qual horário você prefere?"
    )
    
    # Recuperar histórico
    history = mem.get_chat_history("123", "5511999999999", limit=40)
    print(f"Histórico: {len(history['messages'])} mensagens")
    
    # Contar mensagens
    count = mem.count_messages("123", "5511999999999")
    print(f"Total: {count['count']} mensagens")
    
    # Limpar histórico
    mem.clear_chat_history("123", "5511999999999")
```

---

## 6. Cakto (Checkout)

### 6.1 Descrição

**Cakto** é o processador de pagamentos do BarberZap, responsável por:
- Checkout de planos de assinatura
- Processamento de pagamentos (Pix, Cartão)
- Webhooks de confirmação de compra
- Links de checkout configuráveis

### 6.2 Status da Integração

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Checkout URL** | ✅ Ativo | https://pay.cakto.com.br/psc74bb_701168 |
| **Webhook** | ✅ Configurado | → n8n workflow "Cakto Compra work" |
| **Preços** | ⚠️ Inconsistente | Link mostra R$ 0,99, LP anuncia R$ 49,90 |

### 6.3 URL de Checkout

```
https://pay.cakto.com.br/psc74bb_701168
```

### 6.4 Workflow de Compra

```
Landing Page
    │
    │ Clique no botão "Começar Agora"
    ▼
Redirect para Cakto Checkout
    │
    │ Cliente escolhe plano e paga
    ▼
Cakto processa pagamento
    │
    │ POST Webhook
    ▼
n8n Workflow: "Cakto Compra work" (75 nodes)
    │
    ├─ Valida pagamento
    ├─ Cria/atualiza lead no Supabase
    ├─ Define status = "converted"
    ├─ Envia WhatsApp de confirmação
    └─ Libera acesso ao sistema
```

### 6.5 Webhook Payload (Esperado)

```json
{
  "transaction_id": "psc74bb_701168",
  "status": "approved",
  "amount": 49.90,
  "payment_method": "pix",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "5511999999999"
  },
  "checkout_data": {
    "selected_plan": "pro",
    "features": ["IA avançada", "Multi-agente"]
  },
  "created_at": "2026-02-26T15:30:00Z"
}
```

### 6.6 n8n Workflow: Cakto Compra work

| Propriedade | Valor |
|------------|-------|
| **Nome** | `Cakto Compra work` |
| **Webhook** | `https://0001-0001.25xe2c.easypanel.host/webhook/cakto-compra` |
| **Nodes** | 75 nodes |
| **Status** | ⚠️ Inativo (desativado) |

#### Nodes Principais

1. **Webhook Trigger** - Recebe POST do Cakto
2. **Validate Payload** - Valida estrutura do JSON
3. **Check Duplicate** - Verifica transação já processada
4. **Upsert Lead** - Cria/atualiza lead no Supabase
5. **Update Status** - Define status = "converted"
6. **Get Plan** - Busca plano escolhido na tabela `plans`
7. **Send WhatsApp** - Envia confirmação via Evolution API
8. **Log Transaction** - Salva log da transação

### 6.7 Planos Disponíveis

| ID | Nome | Preço (Anunciado) | Preço (Link) | Features |
|----|------|-------------------|--------------|----------|
| 1 | Basic | R$ 97/mês | - | IA básica, WhatsApp único |
| 2 | Pro | R$ 197/mês | R$ 0,99 | IA avançada, multi-agente |
| 3 | Enterprise | R$ 497/mês | - | API full, suporte prioritário |

⚠️ **OBSERVAÇÃO:** Preço do checkout (R$ 0,99) inconsistente com LP (R$ 49,90+)

### 6.8 Link de Checkout por Planos (Tabelas Plans)

```sql
INSERT INTO plans (name, price, currency, features, cakto_link_id) VALUES
('Basic', 97.00, 'BRL', '["IA básica", "WhatsApp único"]', 'psc_basic'),
('Pro', 197.00, 'BRL', '["IA avançada", "Multi-agente", "Dashboard"]', 'psc74bb_701168'),
('Enterprise', 497.00, 'BRL', '["API full", "Suporte prioritário", "SLA"]', 'psc_enterprise');
```

---

## 7. Cal.com (Booking System)

### 7.1 Descrição

**Cal.com** é o sistema de agendamento de demos do BarberZap, responsável por:
- Agendar demos com prospects
- Gerenciar horários disponíveis
- Enviar confirmações e lembretes
- Integrar com CRM via webhooks

### 7.2 Status da Integração

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Wrapper Python** | ✅ Ativo | `calcom_client.py` funcional |
| **Self-Hosted** | ✅ Configurado | Instância própria |
| **Webhook** | ✅ Configurado | → n8n (ou Python future) |

### 7.3 Configuração

```bash
# .env
CALCOM_API_KEY=cal_xxx
CALCOM_API_URL=https://api.cal.com/v2
```

### 7.4 Wrapper Python (`calcom_client.py`)

#### Classe Principal

```python
class CalComClient:
    def __init__(self, api_key: str, api_url: str = "https://api.cal.com/v2"):
        self.api_key = api_key
        self.api_url = api_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
```

#### Métodos Principais

```python
# Buscar booking
def get_booking(self, booking_id: str) -> Optional[Dict]:
    """
    Busca booking por ID
    
    Returns:
        {
            "uid": "booking_xxx",
            "startTime": "2026-02-26T15:00:00Z",
            "endTime": "2026-02-26T15:30:00Z",
            "attendee": {...},
            "metadata": {...}
        }
    """

# Listar event types
def get_event_types(self) -> List[Dict]:
    """
    Lista todos os event types disponíveis
    
    Returns:
        [
            {
                "id": 123,
                "title": "Demo BarberZap",
                "slug": "demo-barberzap",
                "length": 30,
                "users": [...]
            }
        ]
    """

# Buscar event type por slug
def get_event_type_by_slug(self, slug: str) -> Optional[Dict]:
    """Busca event type por slug"""

# Cancelar booking
def cancel_booking(self, booking_id: str, reason: str = "") -> bool:
    """Cancela booking existente"""

# Listar bookings por data
def get_bookings_for_date(self, date: str, event_type_id: Optional[int] = None) -> List[Dict]:
    """
    Lista bookings para uma data específica
    
    Args:
        date: YYYY-MM-DD
        event_type_id: Filtrar por event type (opcional)
    """

# Listar próximos bookings
def get_upcoming_bookings(self, days: int = 7) -> List[Dict]:
    """Lista bookings para os próximos N dias"""
```

#### Funções de Conveniência

```python
# Gerar link de booking
def generate_demo_booking_link(calcom_client: CalComClient, event_slug: str) -> str:
    """
    Gera link de booking para demo
    
    Returns:
        "https://cal.com/{username}/{event_slug}"
    """

# Processar webhook
def process_calcom_webhook(webhook_event: Dict, user_id: str, crm_user_id: str) -> Dict:
    """
    Processa webhook do Cal.com e atualiza CRM
    
    Eventos suportados:
    - booking.created: Cria lead e agenda demo
    - booking.cancelled: Cancela demo no CRM
    - booking.rescheduled: Atualiza horário
    """
```

### 7.5 Webhook do Cal.com

#### Payload (booking.created)

```json
{
  "type": "booking.created",
  "data": {
    "uid": "booking_xxx",
    "startTime": "2026-02-26T15:00:00Z",
    "endTime": "2026-02-26T15:30:00Z",
    "status": "confirmed",
    "title": "Demo BarberZap",
    "attendee": {
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "+55-11-99999-9999"
    },
    "metadata": {
      "videoCallUrl": "https://meet.google.com/xxx-yyy-zzz",
      "source": "landing_page"
    }
  },
  "createdAt": "2026-02-26T14:00:00Z"
}
```

### 7.6 Link de Demo

```
https://cal.com/samuel/demo-barberzap
```

**Como funciona:**
1. Lead clica em "Agendar Demo" na Landing Page
2. Redirecionado para Cal.com
3. Seleciona horário disponível
4. Preenche dados (Nome, Email, Telefone)
5. Cal.com envia webhook → CRM
6. CRM atualiza status = "demo_scheduled"
7. Envia confirmação via WhatsApp

---

## 8. n8n (Orquestrador Original)

### 8.1 Descrição

**n8n** é o orquestrador original de automações do BarberZap, sendo migrado gradualmente para Python. Ainda responsável por:
- Roteador de mensagens multiagente
- Processamento de webhooks
- Automação de vendas e suporte
- Workflows de pós-venda

### 8.2 Status da Integração

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Self-Hosted** | ✅ Ativo | EasyPanel |
| **URL** | https://0001-0001.25xe2c.easypanel.host | |
| **Workflows** | ⚠️ Inativos | Maioria desativada |
| **Fase de Migração** | Em andamento | n8n → Python |

### 8.3 Endpoints

#### Webhook Principal (Landing Page)
```
POST https://0001-0001.25xe2c.easypanel.host/webhook/barberzap
```

#### Webhook Compra (Cakto)
```
POST https://0001-0001.25xe2c.easypanel.host/webhook/cakto-compra
```

#### MCP endpoint
```
GET https://0001-0001.25xe2c.easypanel.host/mcp
```

### 8.4 Workflows Principais

#### 1. 🔧 IA Principal Roteador Multiagente

| Propriedade | Valor |
|------------|-------|
| **Nome** | `IA Principal Roteador Multiagente` |
| **Nodes** | 72 nodes |
| **Status** | Inativo |
| **Função** | Roteia mensagens para agentes especializados |

**Fluxo:**
```
Webhook (Evolution API)
    ↓
Normalizer (JSON → formato interno)
    ↓
Tenant Resolver (instance → tenant_id)
    ↓
Intent Classifier (IA detecta intenção)
    ↓
┌──────────┬──────────┬──────────┐
│   ↓      │    ↓     │    ↓     │
│ Vendas   │ Suporte  │ Agendamento
│  (16)    │  (17)    │   (?)
└──────────┴──────────┴──────────┘
    ↓
Response Generator (AI Service)
    ↓
Evolution API (Enviar resposta)
    ↓
Logger (CRM)
```

#### 2. Cakto Compra work

| Propriedade | Valor |
|------------|-------|
| **Nome** | `Cakto Compra work` |
| **Nodes** | 75 nodes |
| **Status** | Inativo |
| **Função** | Processa webhooks de compra |

**Nodes Principais:**
1. Webhook Trigger
2. Validate Payload
3. Check Duplicate Transaction
4. Upsert Lead (Supabase)
5. Update Status = "converted"
6. Get Plan Details
7. Send WhatsApp (Evolution API)
8. Send Email (futuro)
9. Log Transaction

#### 3. IA VENDAS

| Propriedade | Valor |
|------------|-------|
| **Nome** | `IA VENDAS` |
| **Nodes** | 16 nodes |
| **Status** | Inativo |
| **Função** | Agente de vendas via WhatsApp |

**Comportamento:**
- Responde perguntas sobre preços
- Apresenta planos e benefícios
- Oferece upgrade de plano
- Agenda demos
- Conduz para checkout

#### 4. IA Suporte

| Propriedade | Valor |
|------------|-------|
| **Nome** | `IA Suporte` |
| **Nodes** | 17 nodes |
| **Status** | Inativo |
| **Função** | Agente de suporte técnico |

**Comportamento:**
- Resolve dúvidas sobre o sistema
- Guia de instalação
- Solução de problemas comuns
- Escalas tickets complexos

#### 5. IA Pos venda

| Propriedade | Valor |
|------------|-------|
| **Nome** | `IA Pos venda` |
| **Nodes** | 16 nodes |
| **Status** | Inativo |
| **Função** | Agente de pós-venda e onboarding |

**Comportamento:**
- Onboarding de novos clientes
- Tips e dicas de uso
- Verificação de satisfação
- Upsell e cross-sell

#### 6. IA Reembolso

| Propriedade | Valor |
|------------|-------|
| **Nome** | `IA Reembolso` |
| **Nodes** | 16 nodes |
| **Status** | Inativo |
| **Função** | Processamento de estornos |

**Comportamento:**
- Recebe solicitação de cancelamento
- Verifica elegibilidade (7 dias)
- Processa reembolso via Cakto
- Atualiza status do lead
- Envia confirmação

#### 7. IA Instalação

| Propriedade | Valor |
|------------|-------|
| **Nome** | `IA Instalação` |
| **Nodes** | 12 nodes |
| **Status** | Inativo |
| **Função** | Guia de instalação passo a passo |

**Comportamento:**
- Passo 1: Criar conta no Supabase
- Passo 2: Configurar Evolution API
- Passo 3: Instalar FastAPI server
- Passo 4: Configurar webhooks
- Passo 5: Teste inicial

### 8.5 Arquitetura n8n

```
┌─────────────────────────────────────────────────────────┐
│                    n8n Self-Hosted                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Webhooks   │  │   Database   │  │  External  │  │
│  │              │  │    (Supa)    │  │   APIs     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  │
│         │                 │                  │         │
│         ▼                 ▼                  ▼         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │    Router    │  │  Agent Node  │  │   Logic    │  │
│  │   (Switch)   │  │   (AI/HTTP)  │  │  (If/For)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘  │
│         │                 │                  │         │
│         ▼                 ▼                  ▼         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Set Node    │  │  Code Node   │  │  Wait Node │  │
│  │              │  │   (JS/TS)    │  │            │  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 8.6 Workflow de Webhook n8n

```
1. Landing Page (React)
    │
    │ POST /webhook/barberzap
    ▼
2. n8n: Trigger Webhook
    │
    │ {phone, name, email, source}
    ▼
3. Validate Fields
    │
    │ Check phone format (5511999999999)
    ▼
4. Exist Lead?
    ├─ YES → Update
    │         ↑
    └─ NO  → Lead Node (Supabase POST)
    │
    ▼
5. AI: Welcome Message
    │
    │ Generate greeting
    ▼
6. Evolution API: Send Message
    │
    │ POST /message/sendText/{instance}
    ▼
7. Log Interaction
    │
    │ messages table (Supabase)
    ▼
8. Response to LP
    │
    │ {success: true, lead_id: 123}
```

### 8.7 Migração n8n → Python

#### Progresso da Migração

| Módulo n8n | Status Python | Wrapper |
|------------|---------------|---------|
| Webhook Handler | ✅ Completo | `webhook_handler.py` |
| Tenant Resolver | ✅ Completo | `tenant_resolver.py` |
| Context Builder | ✅ Completo | `context_builder.py` |
| AI Service | ⚠️ Placeholder | `ai_service.py` |
| CRM Logger | ✅ Completo | `crm_logger.py` |
| Evolution API | ⚠️ Placeholder | `evolution_api.py` |
| Supabase Client | ✅ Completo | `supabase_rest.py` |
| Chat Memory | ✅ Completo | `postgres_memory.py` |

#### Vantagens da Migração

| Aspecto | n8n | Python/FastAPI |
|---------|-----|----------------|
| Performance | Variável | Alta |
| Testabilidade | Manual | pytest automated |
| Version Control | JSON export | Git + PRs |
| Deploy | Workflow restart | CI/CD pipeline |
| Monitoramento | Visual logs | Structured logging |
| Custo | Workflow | Serviço (baixo) |

---

## 9. Diagrama de Fluxo de Integrações

### 9.1 Fluxo Completo de Mensagens

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE WHATSAPP                               │
│                         "Quero agendar um corte"                        │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  1️⃣ EVOLUTION API                                                      │
│                                                                          │
│  - Recebe webhook do WhatsApp                                           │
│  - Normaliza payload                                                    │
│  - Envia para endpoint do BarberZap                                     │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             │ POST /webhook/barberzap-saas
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BARBERZAP FASTAPI SERVER                                             │
│                                                                          │
│  ┌────────────────┐                                                      │
│  │ LAYER 1        │                                                      │
│  │ Webhook Handler│                                                      │
│  │                │◄───── WebhookNormalizer.normalize()                   │
│  │ normalized = {│         {                                            │
│  │   instance,   │           instance_name,                             │
│  │   sender,     │           sender,                                    │
│  │   message,    │           message,                                   │
│  │   client_name │           client_name, event                         │
│  │ }             │         }                                            │
│  └────────┬───────┘                                                      │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────┐                                                      │
│  │ LAYER 2        │                                                      │
│  │ Tenant Resolver│◄───── resolve_tenant("barbearia_001")                 │
│  │                │         tenant_id = "123"                             │
│  │ Query:         │       SELECT * FROM whatsapp_instances               │
│  │               │         WHERE instance_name = 'barbearia_001'        │
│  │ Supabase       │                                                      │
│  └────────┬───────┘                                                      │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────┐                                                      │
│  │ LAYER 3        │                                                      │
│  │ Context Builder│◄───── build_context("123")                           │
│  │                │         {                                            │
│  │ Queries:       │           barbershop: {nome, endereco, ...},        │
│  │              │             barbers: [{name, specialties}],           │
│  │ - agente_conf │             services: [{name, price, duration}]      │
│  │ - barbers     │         }                                            │
│  │ - services    │                                                      │
│  │ (Supabase)    │                                                      │
│  └────────┬───────┘                                                      │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────────────────────────────┐                            │
│  │ LAYER 4                                 │                            │
│  │ SECRETÁRIA UNIVERSAL (IA)               │                            │
│  │                                         │                            │
│  │ 1. get_chat_history("123", phone)  ─────┼──► PostgresMemory           │
│  │    (últimas 40 mensagens)               │                            │
│  │                                         │                            │
│  │ 2. build_system_prompt(context)         │                            │
│  │    ──► "Você é Ana, secretária da..."   │                            │
│  │                                         │                            │
│  │ 3. AIService.generate_response()  ──────┼──► AI Provider             │
│  │    (prompt + context + history)         │    (OpenRouter/Groq)      │
│  │                                         │                            │
│  │ 4. response = "Claro, João! Quais..."   │                            │
│  └────────┬────────────────────────────────┘                            │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────┐                                                      │
│  │ LAYER 5        │                                                      │
│  │ CRM Logger     │                                                      │
│  │                │                                                      │
│  │ 1. upsert_lead(phone, name)  ────┼──► Supabase (leads)              │
│  │ 2. log_message('inbound')  ─────┼──► Supabase (messages)            │
│  │ 3. log_message('outbound') ─────┼──► Supabase (messages)            │
│  │ 4. save_message('user')  ───────┼──► PostgresMemory                 │
│  │ 5. save_message('assistant') ────┼──► PostgresMemory                 │
│  └────────┬───────┘                                                      │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────┐                                                      │
│  │ LAYER 6        │                                                      │
│  │ Evolution API  │◄───── evolution_send_message()                       │
│  │                │         POST /message/sendText/{instance}           │
│  │ Send response  │         {                                           │
│  │ to client      │           number: "5511999999999",                   │
│  │                │           text: "Claro, João! Quais..."            │
│  │                │         }                                           │
│  └────────┬───────┘                                                      │
└───────────┼──────────────────────────────────────────────────────────────┘
            │
            │ POST /message/sendText/barbearia_001
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  1️⃣ EVOLUTION API                                                      │
│                                                                          │
│  - Envia mensagem para cliente                                           │
│  - Delivery confirmed                                                   │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       CLIENTE WHATSAPP                                  │
│                         "Claro, João! Quais..."                         │
└──────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Fluxo de Checkout (Cakto)

```
┌──────────────────────────────┐
│  LANDING PAGE (React)        │
│  Botão: "Começar Agora"      │
└────────────┬─────────────────┘
             │
             │ Redirect
             ▼
┌──────────────────────────────┐
│  CAKTO CHECKOUT             │
│  https://pay.cakto.com.br    │
│  /psc74bb_701168             │
└────────────┬─────────────────┘
             │
             │ Cliente paga
             ▼
┌──────────────────────────────┐
│  CAKTO WEBHOOK              │
│  POST                       │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  n8n: Cakto Compra work     │
│  (75 nodes)                 │
└────────────┬─────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────┐   ┌──────────┐
│Supabase  │   │Evolution │
│- leads   │   │API       │
│- plans   │   │- enviar  │
└──────────┘   │confirma-  │
               │ção       │
               └──────────┘
```

### 9.3 Fluxo de Agendamento (Cal.com)

```
┌──────────────────────────────┐
│  LANDING PAGE (React)        │
│  Botão: "Agendar Demo"       │
└────────────┬─────────────────┘
             │
             │ Redirect
             ▼
┌──────────────────────────────┐
│  CAL.COM                    │
│  cal.com/samuel/             │
│  demo-barberzap              │
└────────────┬─────────────────┘
             │
             │ Cliente escolhe horário
             ▼
┌──────────────────────────────┐
│  CAL.COM WEBHOOK            │
│  booking.created            │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  n8n / Python (Future)      │
│  Process webhook            │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  SUPABASE                    │
│  - Update lead               │
│  - status = "demo_schedu-    │
│    led"                      │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  EVOLUTION API               │
│  - Send confirmation         │
│  WhatsApp                    │
└──────────────────────────────┘
```

---

## 10. Configuração e Deploy

### 10.1 Variáveis de Ambiente (.env)

```bash
# ============= EVOLUTION API (WHATSAPP) =============
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_api_key_here
EVOLUTION_API_INSTANCE=barberzap_instance

# ============= SUPABASE (DATABASE) =============
SUPABASE_URL=https://htssqiupscyhhueqwpgu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:password@db.htssqiupscyhhueqwpgu.supabase.co:5432/postgres

# ============= AI PROVIDERS =============
# OpenRouter (FREE MODELS)
OPENROUTER_API_KEY=sk-or-v1-xxx
AI_MODEL=nvidia/nemotron-nano-9b-v2:free

# Groq (FREE MODELS)
GROQ_API_KEY=gsk_xxx
# Model: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768

# Together AI (FREE MODELS)
TOGETHER_API_KEY=xxx
# Model: mistralai/Mixtral-8x7B-Instruct-v0.1, meta-llama/Llama-3-70b-chat-hf

# ============= CAKTO (CHECKOUT) =============
CAKTO_WEBHOOK_SECRET=xxx
CAKTO_CHECKOUT_URL=https://pay.cakto.com.br/psc74bb_701168

# ============= CAL.COM (BOOKING) =============
CALCOM_API_KEY=cal_xxx
CALCOM_API_URL=https://api.cal.com/v2
CALCOM_EVENT_SLUG=demo-barberzap

# ============= N8N (LEGACY) =============
N8N_WEBHOOK_URL=https://0001-0001.25xe2c.easypanel.host/webhook/barberzap
N8N_WEBHOOK_SECRET=xxx

# ============= APP CONFIG =============
APP_HOST=0.0.0.0
APP_PORT=8000
LOG_LEVEL=INFO
```

### 10.2 Comandos de Deploy

#### Systemd Service

```bash
# Criar service file
sudo nano /etc/systemd/system/barberzap.service
```

```ini
[Unit]
Description=BarberZap API
After=network.target

[Service]
Type=simple
User=barberzap
WorkingDirectory=/opt/barberzap
Environment="PATH=/opt/barberzap/venv/bin"
ExecStart=/opt/barberzap/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Reload e start
sudo systemctl daemon-reload
sudo systemctl start barberzap
sudo systemctl enable barberzap
sudo systemctl status barberzap
sudo journalctl -u barberzap -f
```

#### Docker

```bash
# Build
docker build -t barberzap:latest .

# Run
docker run -d \
  --name barberzap \
  --env-file .env \
  -p 8000:8000 \
  --restart always \
  barberzap:latest

# Compose
docker-compose up -d
```

### 10.3 Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.barberzap.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }

    location /webhook/barberzap-saas {
        proxy_pass http://127.0.0.1:8000/webhook/barberzap-saas;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # GZIP
    gzip on;
    gzip_types application/json text/plain;
}
```

### 10.4 Health Check

```python
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "supabase": check_supabase_connection(),
            "postgres": check_postgres_connection(),
            "ai": check_ai_connection(),
            "evolution": check_evolution_connection()
        }
    }
```

### 10.5 Monitoramento

#### Logs Estruturados

```python
import logging

logger = logging.getLogger(__name__)

logger.info(
    "message_processed",
    extra={
        "tenant_id": "123",
        "phone": "5511999999999",
        "event_type": "webhook_barberzap",
        "duration_ms": 245
    }
)
```

#### Métricas (Prometheus/Grafana)

```python
from prometheus_client import Counter, Histogram

# Métricas de mensagens
MESSAGE_COUNTER = Counter('barberzap_messages_total', 'Total de mensagens processadas', ['tenant_id'])
MESSAGE_LATENCY = Histogram('barberzap_message_latency_seconds', 'Latência de processamento de mensagens')

# Métricas de API
API_REQUEST_COUNTER = Counter('barberzap_api_requests_total', 'Total de requests da API', ['endpoint', 'method'])
API_LATENCY = Histogram('barberzap_api_latency_seconds', 'Latência da API')

# Métricas de erros
ERROR_COUNTER = Counter('barberzap_errors_total', 'Total de erros', ['service', 'error_type'])
```

### 10.6 Troubleshooting

#### Problemas Comuns

| Problema | Possível Causa | Solução |
|----------|----------------|---------|
| Tenant not found | Instância não existe | Verifique tabela whatsapp_instances |
| Tenant inactive | status != active | Ative a instância |
| No context from builder | agente_config vazio | Configure barbearia no dashboard |
| AI generation failed | API key inválida | Reveja variável AI_API_KEY |
| Message not sent | Evolution API desconectado | Check status da instância |
| CRM logging failed | Tabela não existe | Execute migrations |
| Chat memory empty | PostgreSQL connection error | Revise POSTGRES_HOST e conexão |
| Timeout Evolution API | Network issues | Verifique Evolution API host e rede |

#### Debug Mode

```bash
# Habilitar logs debug
export LOG_LEVEL=DEBUG

# Ver logs em tempo real
tail -f logs/barberzap.log

# Testar webhook manualmente
curl -X POST http://localhost:8000/webhook/barberzap-saas \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":[...]}'
```

---

## 11. Resumo Executivo

### 11.1 Estado Atual das Integrações

| Integração | Status do Wrapper | Status da Conexão | Pronto para Produção |
|------------|-------------------|-------------------|---------------------|
| **Evolution API** | ⚠️ Placeholder | ❌ Inativo | Não |
| **Supabase REST** | ✅ Completo | ✅ Ativo | Sim |
| **AI Service** | ⚠️ Placeholder | ❌ Inativo | Não |
| **PostgreSQL Memory** | ✅ Completo | ✅ Ativo | Sim |
| **Cakto Checkout** | ✅ Configurado | ✅ Ativo | Sim |
| **Cal.com Booking** | ✅ Completo | ✅ Ativo | Sim |
| **n8n** | ✅ Ativo | ✅ Self-hosted | Sim |

### 11.2 Próximos Passos

#### Curto Prazo (1-2 semanas)

1. **Inserir Evolution API Key**
   - Obter credencial do Docker Hub
   - Ativar conexão real na Evolution API
   - Testar envio/recebimento de mensagens

2. **Inserir AI API Keys**
   - OpenRouter, Groq ou Together AI
   - Testar modelos gratuitos
   - Ajustar prompts e temperature

3. **Testes End-to-End**
   - Fluxo completo: WhatsApp → BarberZap → AI → Resposta
   - Teste multi-tenancy (múltiplas barbearias)
   - Teste de cenários edge-cases

#### Médio Prazo (1-2 meses)

1. **Finalizar migração n8n → Python**
   - Migrar workflows restantes
   - Remover dependência do n8n
   - Documentar todos os endpoints

2. **Implementar real-time subscriptions** (Supabase)
   - Watch tabela leads
   - Watch tabela messages
   - Dashboard em tempo real

3. **Otimizar performance**
   - Cache de contextos (Redis)
   - Batch writes no banco
   - Connection pooling

#### Longo Prazo (3-6 meses)

1. **Escalar arquitetura**
   - Kubernetes deployment
   - Horizontal scaling
   - Multi-region

2. **Implementar features avançadas**
   - Voice (Telegram Voice, WhatsApp Audio)
   - Análise de sentimento
   - Aprendizado contínuo (RLHF)

3. **Observabilidade completa**
   - Tracing (Jaeger/OpenTelemetry)
   - Alertas (PagerDuty)
   - SLAs e SLOs

---

## 12. Glossário

| Termo | Descrição |
|-------|-----------|
| **Multi-tenancy** | Capacidade de atender múltiplas barbearias com a mesma infraestrutura |
| **Instance** | Instância única do WhatsApp por barbearia (instance_name) |
| **Tenant ID** | Identificador único de uma barbearia no sistema |
| **Session Key** | Chave que identifica uma conversa única (`tenant_id_phone`) |
| **Supabase REST** | API REST do Supabase para queries diretas ao PostgreSQL |
| **Evolution API** | Gateway oficial WhatsApp API com suporte a múltiplas instâncias |
| **Wrapper** | Camada de abstração Python para comunicação com API externa |
| **Secretária Universal** IA central que atende clientes de todas as barbearias |
| **Context Builder** | Sistema que recupera dados da barbearia (nome, serviços, barbeiros) |
| **Chat Memory** | Sistema que armazena histórico de conversas (PostgreSQL) |
| **Cakto** | Processador de pagamentos brasileiro (Pix, cartão) |
| **Cal.com** | Sistema de agendamento open-source |
| **n8n** | Plataforma de automação no-code (or original, em migração) |
| **Placeholder** | Código funcional mas sem conexão real (aguardando API Key) |

---

## 13. Referências

### 13.1 Documentação Externa

| Serviço | URL |
|---------|-----|
| Supabase REST | https://supabase.com/docs/reference/javascript |
| Evolution API | https://doc.evolution-api.com/ |
| OpenRouter | https://openrouter.ai/docs |
| Groq | https://console.groq.com/docs |
| Together AI | https://docs.together.ai/docs |
| Cal.com | https://cal.com/docs/api-reference/ |
| Cakto | https://www.cakto.com.br/ |
| n8n | https://docs.n8n.io/ |

### 13.2 Documentação Interna

| Documento | Descrição |
|-----------|-----------|
| `BACKEND_BARBERZAP.md` | Documentação completa do backend |
| `FLOW_DIAGRAM.md` | Fluxos de mensagens detalhados |
| `AUTHENTICATION_SYSTEM_ANALYSIS.md` | Sistema de autenticação |
| `LANDFRONT_BARBERZAP.md` | Landing Page integrada |
| `README.md` | Overview do projeto |

---

## 14. Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-02-26 | Documento inicial completo |

---

**Fim do Documento**

© 2026 BarberZap - Sistema de Integrações
Para Notebook LM - Análise Completa