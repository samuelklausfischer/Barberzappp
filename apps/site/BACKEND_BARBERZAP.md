# Backend BarberZap - Análise Técnica Completa

> **Versão do Documento:** 1.0.0
> **Data:** 2026-02-26
> **Status:** Completado - Fase 8 de 8 (Documentação)

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Modular](#2-arquitetura-modular)
3. [Tecnologias e Dependências](#3-tecnologias-e-dependências)
4. [Fluxo de Mensagens Completo](#4-fluxo-de-mensagens-completo)
5. [Módulos e Funcionalidades](#5-módulos-e-funcionalidades)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)
8. [Integrações](#8-integrações)
9. [Segurança](#9-segurança)
10. [Deploy e Operação](#10-deploy-e-operação)
11. [Diagramas de Sequência](#11-diagramas-de-sequência)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Visão Geral do Sistema

### 1.1 Propósito

O **BarberZap Backend** é um sistema de inteligência artificial para barbearias, migrado do n8n para uma arquitetura Python modular baseada em FastAPI. O sistema atende clientes via WhatsApp, usando IA para processar solicitações de agendamento, fornecer informações sobre serviços e manter o histórico de conversas.

### 1.2 Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTE WHATSAPP                          │
│                   (Cliente da barbearia)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Evolution API  │  ← Gateway WhatsApp
                    │   (WhatsApp)    │
                    └────────┬────────┘
                             │ POST /webhook/barberzap-saas
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                     BARBERZAP FASTAPI                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Webhooks   │  │     Core     │  │     Agents       │    │
│  │   Handler    │  │   (Tenant +  │  │  (Secretária     │    │
│  │              │  │   Context)   │  │   Universal)     │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘    │
│         │                 │                    │               │
│         ▼                 ▼                    ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Integrations│  │     CRM      │  │    Memory (PG)   │    │
│  │  (Evo, Supa, │  │  (Logger)    │  │  Chat Memoria    │    │
│  │   AI Service)│  │              │  │                  │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────────┬───────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│  Supabase/DB  │    │  AI Provider  │    │Evolution API │
│   (PostgreSQL)│    │  (OpenRouter, │    │              │
│               │    │   Groq, etc.) │    │              │
└───────────────┘    └──────────────┘    └──────────────┘
```

### 1.3 Objetivos da Migração n8n → Python

| Aspecto | n8n | Python/FastAPI | Benefício |
|---------|-----|----------------|-----------|
| Performance | Variável | Alta | Respostas mais rápidas |
| Manutenibilidade | Visual/arrastar | Código estruturado | Mais fácil de manter |
| Testes | Manual | Automatizados (pytest) | Cobertura de erro |
| Deploy | Workflow node | Serviço systemd/Docker | Escalável |
| Monitoramento | Limitado | Logging estruturado | Observabilidade |
| Custo | Workflow | Baixo custo | Econômico |

---

## 2. Arquitetura Modular

### 2.1 Estrutura de Diretórios

```
barberzap_python/
│
├── 📁 integrations/          ← Camada de Integrações
│   ├── evolution_api.py      ├── Evolution API Wrapper (WhatsApp)
│   ├── supabase_rest.py      └── Supabase REST API Client
│   ├── ai_service.py         └── AI Service Wrapper (OpenRouter, Groq, etc.)
│   └── postgres_memory.py    └── Chat Memory (PostgreSQL)
│
├── 📁 core/                  ← Camada Central
│   ├── tenant_resolver.py    ├── Multi-tenancy: instance_name → tenant_id
│   ├── context_builder.py    └── Builder de contexto da barbearia
│   └── config.py             └── Configurações globais
│
├── 📁 agents/                ← Camada de Agentes IA
│   └── secretaria_universal.py  └── Secretária universal com memória
│
├── 📁 crm/                   ← Camada de CRM
│   ├── crm_manager.py        ├── Gestão de leads e conversas
│   └── crm_logger.py         └── Logger de atividades CRM
│
├── 📁 webhooks/              ← Camada de Webhooks
│   └── webhook_handler.py    └── Handler principal BarberZap SaaS
│
├── 📁 api/                   ← Dashboard REST API
│   ├── routers/              ├── Auth, Tenants, Barbers, Services
│   ├── middleware/           ├── Tenant, Logging, Security
│   └── deps.py               └── Dependências de rota
│
├── 📁 tests/                 ← Testes Unitários
│   ├── test_tenant_resolver.py
│   ├── test_context_builder.py
│   └── mocks/                └── Mock objects para testes
│
├── 📁 scripts/               ← Scripts utilitários
├── 📁 logs/                  ← Logs da aplicação (rotativos)
├── 📁 docs/                  ← Documentação completa (FASE 8)
│
├── 📄 main.py                ← FastAPI Entry Point
├── 📄 requirements.txt       ← Dependências Python
├── 📄 pytest.ini             ← Configuração de testes
└── 📄 .env.example           ← Template de variáveis de ambiente
```

### 2.2 Responsabilidades por Camada

#### Integrations Layer
- **evolution_api.py**: Wrapper para Evolution API (WhatsApp)
- **supabase_rest.py**: Cliente REST Supabase
- **ai_service.py**: Wrapper para múltiplos providers de IA
- **postgres_memory.py**: Memória de chat

#### Core Layer
- **tenant_resolver.py**: Multi-tenancy
- **context_builder.py**: Builder de contexto
- **config.py**: Configurações globais

#### Agents Layer
- **secretaria_universal.py**: Agente IA principal

#### Webhooks Layer
- **webhook_handler.py**: Handler principal

#### CRM Layer
- **crm_manager.py**: Gestão de leads e conversas

---

## 3. Tecnologias e Dependências

### 3.1 Stack Tecnológico

| Categoria | Tecnologia | Versão | Propósito |
|-----------|-----------|--------|-----------|
| **Linguagem** | Python | 3.12+ | Runtime principal |
| **Web Framework** | FastAPI | 0.115.0 | API REST / Webhooks |
| **ASGI Server** | Uvicorn | 0.32.0 | Servidor HTTP/Async |
| **Validation** | Pydantic | 2.9.2 | Validação de dados |
| **Database** | PostgreSQL | via Supabase | Banco de dados principal |
| **ORM/Client** | Supabase SDK | 2.7.4 | Cliente Supabase |
| **HTTP Client** | requests / httpx | 2.32.3 / 0.27.2 | Chamadas de API externas |
| **Env Vars** | python-dotenv | 1.0.1 | Gerenciamento de configuração |
| **Testing** | pytest | 8.3.3 | Testes unitários |

### 3.2 Requirements.txt Detalhado

```txt
# Web Framework
fastapi==0.115.0          # Framework REST moderno
uvicorn[standard]==0.32.0 # Server ASGI com WebSockets
pydantic==2.9.2           # Validação de schemas
pydantic-settings==2.5.2  # Configurações tipadas

# Database
psycopg2-binary==2.9.9    # Driver PostgreSQL
supabase==2.7.4           # SDK Supabase oficial

# HTTP Client
requests==2.32.3          # Cliente HTTP síncrono
httpx==0.27.2             # Cliente HTTP assíncrono

# Environment Variables
python-dotenv==1.0.1      # Carregar .env

# Utilities
pyyaml==6.0.2             # Parser YAML
python-dateutil==2.9.0    # Manipulação de datas

# Testing
pytest==8.3.3             # Framework de testes
pytest-cov==5.0.0         # Cobertura de código
pytest-asyncio==0.24.0    # Suporte a async
```

---

## 4. Fluxo de Mensagens Completo

### 4.1 Pipeline de 6 Etapas

**ETAPA 1 - Evolution API Webhook**
- Client envia mensagem pelo WhatsApp
- Evolution API recebe e envia POST para `/webhook/barberzap-saas`
- Payload contém: event, instance, data

**ETAPA 2 - WebhookNormalizer**
- `WebhookNormalizer.normalize(payload)`
- Extrai: instance_name, sender (phone), message, client_name
- Normaliza: phone sem @s.whatsapp.net
- Determina: is_valid, should_process

**ETAPA 3 - Tenant Resolution**
- `resolve_tenant(instance_name)`
- Busca em `whatsapp_instances` pelo instance_name
- Verifica status = active
- Retorna: user_id (tenant_id)

**ETAPA 4 - Context Building**
- `build_context(tenant_id)`
- Consulta `agente_config`: info da barbearia
- Consulta `barbers`: lista de barbeiros ativos
- Consulta `services`: lista de serviços ativos
- Retorna: {barbershop, barbers, services}

**ETAPA 5 - Secretária Universal (IA)**
- `generate_response(instance_name, phone, message, context)`
- Recupera histórico de chat (40 mensagens)
- Constroi system prompt com identidade e contexto
- Chama `AIService.generate_response()`
- Salva mensagem do usuário e resposta da IA na memória

**ETAPA 6 - CRM Logging + Send Message**
- `log_conversation(...)`
- `upsert_lead(...)` -> cria ou atualiza lead
- `log_message(direction='inbound', message=client_msg)`
- `log_message(direction='outbound', message=ai_response)`
- `evolution_send_message(...)` -> envia resposta ao WhatsApp

### 4.2 Payload Example de Webhook

```json
{
  "event": "messages.upsert",
  "instance": {
    "instanceName": "barbearia_001",
    "status": "open"
  },
  "data": [{
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0FAED6CC5D57E"
    },
    "message": {
      "conversation": "Quero agendar um corte para sexta às 14h"
    },
    "pushName": "João Silva",
    "timestamp": 1740315600
  }]
}
```

### 4.3 Response Example

```json
{
  "status": "processed",
  "success": true,
  "tenant_id": "123",
  "instance_name": "barbearia_001",
  "phone": "5511999999999",
  "client_name": "João Silva",
  "message": "Quero agendar um corte para sexta às 14h",
  "response": "Claro, João! Vou verificar a disponibilidade para sexta-feira às 14h. Um momento, por favor...",
  "lead_updated": true,
  "lead_id": "uuid-123",
  "message_sent": true,
  "processing_time_ms": 245.67,
  "steps": {
    "normalizer": { "is_valid": true, "should_process": true },
    "tenant_resolution": { "success": true, "tenant_id": "123" },
    "context_building": { "success": true, "has_context": true },
    "secretaria": { "success": true, "ai_name": "Ana" },
    "crm_logging": { "success": true, "messages_logged": 2 },
    "evolution_api": { "success": true, "message_id": "3EB0FAED6CC5D57E" }
  }
}
```

---

## 5. Módulos e Funcionalidades

### 5.1 Integrations

#### Evolution API Wrapper

**Classe:** `EvolutionAPI`

**Métodos principais:**

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `send_message()` | `instance_name, phone, message` | `{success, message_id}` | Envia mensagem WhatsApp |
| `create_instance()` | `instance_name, qrcode=True` | `{success, instance_name, qrcode}` | Cria nova instância |
| `check_status()` | `instance_name` | `{success, status}` | Verifica status da instância |
| `delete_instance()` | `instance_name` | `{success, message}` | Remove instância |
| `get_qrcode()` | `instance_name` | `{success, qrcode}` | Obtém QR Code para conexão |

#### Supabase REST Wrapper

**Classe:** `SupabaseRestClient`

**Métodos principais:**

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `get()` | `table, filters, single=False` | `data or None` | Query SELECT |
| `post()` | `table, data` | `created_data` | Query INSERT |
| `patch()` | `table, id, data` | `updated_data` | Query UPDATE |
| `delete()` | `table, id` | `None` | Query DELETE |
| `upsert()` | `table, data, on_conflict` | `data` | UPSERT (insert or update) |

#### AI Service Wrapper

**Classe:** `AIService`

**Providers suportados:**
- `OPENROUTER`: nvidia/nemotron-nano-9b-v2:free
- `GROQ`: llama-3.3-70b-versatile, llama-3.1-8b-instant
- `TOGETHER`: mistralai/Mixtral-8x7B-Instruct-v0.1
- `ANTHROPIC`: claude-3-5-haiku-20241022

```python
generate_response(
    prompt: str,                    ← Mensagem do usuário
    context: Optional[Dict],        ← Contexto adicional
    chat_history: List[Dict],       ← Histórico de chat
    temperature: float = 0.7,       ← Temperatura de geração
    max_tokens: int = 1000         ← Tokens máximos
) -> {
    'success': bool,
    'response': str,
    'tokens_used': int,
    'model': str,
    'provider': str
}
```

#### PostgreSQL Memory

**Funções principais:**

| Função | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `get_chat_history()` | `user_id, phone, limit=40` | `List[Dict]` | Recupera histórico |
| `save_message()` | `user_id, phone, role, message, metadata` | `bool` | Salva mensagem |
| `clear_history()` | `user_id, phone` | `bool` | Limpa histórico |

### 5.2 Core

#### Tenant Resolver

**Função principal:**

```python
resolve_tenant(
    instance_name: str,
    check_active: bool = True,
    use_cache: bool = True
) -> Optional[str]
```

**Exceções:**
- `TenantNotFoundError`: Instância não encontrada
- `TenantInactiveError`: Tenant está inativo
- `TenantResolutionError`: Erro genérico

#### Context Builder

**Função principal:**

```python
build_context(user_id: str) -> Optional[Dict]
```

**Retorna:**

```python
{
    'barbershop': {
        'user_id': str,
        'name': str,
        'address': str,
        'hours': str,
        'ai_name': str,
        'phone': str,
        'whatsapp': str
    },
    'barbers': [
        {
            'id': int,
            'name': str,
            'status': str
        },
        ...
    ],
    'services': [
        {
            'id': int,
            'name': str,
            'price': float,
            'description': str,
            'duration': int,
            'status': str
        },
        ...
    ]
}
```

### 5.3 Agents

#### Secretária Universal

**Função principal:**

```python
generate_response(
    instance_name: str,
    phone: str,
    message: str,
    context_override: Optional[Dict] = None,
    save_user_message: bool = True
) -> Dict
```

**Personalidade da IA:**
- Natural e Conversacional
- Empática e Atenciosa
- Confirma Agendamentos
- Profissional
- Concisa e Direta

### 5.4 CRM

#### CRM Manager

**Funções principais:**

| Função | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `upsert_lead()` | `user_id, phone, name, status, source, metadata` | `Dict` | Cria ou atualiza lead |
| `log_message()` | `lead_id, user_id, phone, direction, message, response, metadata` | `Dict` | Registra mensagem |
| `log_conversation()` | `user_id, phone, client_name, inbound_message, outbound_message, metadata` | `Dict` | Log completo |

---

## 6. API Reference

### 6.1 Webhooks

#### POST /webhook/barberzap-saas

**Descrição:** Webhook principal para receber mensagens do Evolution API

**Response (200 OK):**
```json
{
  "status": "processed",
  "success": true,
  "tenant_id": "123",
  "response": "Resposta da IA..."
}
```

**Error Responses:**

| Status | Código | Descrição |
|--------|--------|-----------|
| 404 | `instance_not_found` | Instância não encontrada |
| 403 | `tenant_inactive` | Tenant inativo |
| 500 | `tenant_resolution_failed` | Erro ao resolver tenant |

### 6.2 Health Check

#### GET /
```json
{
  "name": "BarberZap API",
  "version": "1.0.0",
  "status": "online",
  "environment": "production"
}
```

#### GET /health
```json
{
  "status": "healthy",
  "timestamp": "2026-02-23T17:00:00Z",
  "components": {
    "api": "ok",
    "database": "ok",
    "webhooks": "ok"
  }
}
```

### 6.3 API Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/send-message` | POST | Envia mensagem WhatsApp |
| `/api/tenant/{tenant_id}` | GET | Configurações de tenant |
| `/api/schedule/available` | GET | Horários disponíveis |
| `/api/schedule` | POST | Criar agendamento |
| `/api/leads/{lead_id}` | GET | Info de lead |
| `/api/tenant/{tenant_id}/leads` | GET | Lista leads |
| `/api/analytics/summary` | GET | Analytics |

---

## 7. Database Schema

### 7.1 Tabelas Principais

#### whatsapp_instances
```sql
CREATE TABLE whatsapp_instances (
    id INT PRIMARY KEY,
    instance_name VARCHAR(255) UNIQUE,
    user_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    api_key VARCHAR(255),
    webhook_url TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### agente_config
```sql
CREATE TABLE agente_config (
    user_id VARCHAR(100) PRIMARY KEY,
    nome_barbearia VARCHAR(255),
    endereco TEXT,
    horarios TEXT,
    nome_ia VARCHAR(100),
    saudacao TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20)
);
```

#### barbers
```sql
CREATE TABLE barbers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    specialties TEXT[],
    created_at TIMESTAMP
);
```

#### services
```sql
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    duration INT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP
);
```

#### crm_leads
```sql
CREATE TABLE crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'new',
    source VARCHAR(20) DEFAULT 'whatsapp',
    metadata JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### crm_messages
```sql
CREATE TABLE crm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(id),
    user_id VARCHAR(100),
    phone VARCHAR(20),
    direction VARCHAR(10),
    message TEXT,
    response TEXT,
    metadata JSONB,
    created_at TIMESTAMP
);
```

#### chat_memoria_v4
```sql
CREATE TABLE chat_memoria_v4 (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(10),
    content TEXT,
    created_at TIMESTAMP
);
```

---

## 8. Integrações

### 8.1 Evolution API

**Finalidade:** Gateway para WhatsApp

**Configuração (.env):**
```bash
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your_api_key
EVOLUTION_API_INSTANCE=barberzap_instance
```

**Endpoints Evolution:**
- `/instance/create` - Criar instância
- `/instance/connectionState/{instance}` - Status
- `/message/sendText/{instance}` - Enviar mensagem
- `/webhook/set/{instance}` - Configurar webhook

### 8.2 Supabase

**Finalidade:** Backend as a Service (PostgreSQL)

**Configuração (.env):**
```bash
SUPABASE_URL=https://htssqiupscyhhueqwpgu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
```

**Auth:** SERVICE_ROLE_KEY (server-side only)

### 8.3 AI Providers

**OpenRouter:**
```bash
OPENROUTER_API_KEY=sk-or-v1-xxx
AI_MODEL=openai/gpt-4o-mini
```

**Groq:**
```bash
GROQ_API_KEY=gsk_xxx
AI_MODEL=llama-3.3-70b-versatile
```

---

## 9. Segurança

### 9.1 Boas Práticas

- ✅ `.env` no `.gitignore`
- ✅ SERVICE_ROLE_KEY only server-side
- ✅ Separação de tenancy por instance_name
- ✅ Validação de webhooks em desenvolvimento
- ✅ Logging sem credenciais

### 9.2 Recomendações de Produção

- 🔒 Implementar rate limiting (Nginx)
- 🔒 Configurar CORS whitelist
- 🔒 Usar HTTPS obrigatório (Let's Encrypt)
- 🔒 Rotacionar chaves periodicamente
- 🔒 Monitorar logs de segurança

---

## 10. Deploy e Operação

### 10.1 Systemd Service

**Arquivo:** `/etc/systemd/system/barberzap.service`

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

**Comandos:**
```bash
sudo systemctl daemon-reload
sudo systemctl start barberzap
sudo systemctl enable barberzap
sudo systemctl status barberzap
sudo journalctl -u barberzap -f
```

### 10.2 Docker (Opcional)

**Dockerfile:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  barberzap:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    restart: always
```

### 10.3 Nginx Reverse Proxy

**Configução:**
```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}
```

---

## 11. Diagramas de Sequência

### 11.1 Fluxo de Mensagens

```
Cliente    EvolutionAPI     BarberZap     Supabase      AIProvider
  |           |               |            |              |
  |--Msg----->|               |            |              |
  |           |--Webhook----->|            |              |
  |           |           Norm|            |              |
  |           |         Tenant|            |              |
  |           |         Context|          |              |
  |           |            AI |--------Request-------->|
  |           |            AI |<------Response--------|
  |           |            CRM|            |              |
  |           |           CRM|--Insert--->|              |
  |           |<---SendText--|            |              |
  |<----Resp----|               |            |              |
```

### 11.2 Multi-Tenancy

```
Instance Name       Tenant ID       Barbearia
barbearia_001  -->  123        -->  Barbearia Central
barbearia_002  -->  456        -->  Barbearia Sul
barbearia_003  -->  789        -->  Barbearia Norte
```

---

## 12. Troubleshooting

### 12.1 Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| **Tenant not found** | Instância não existe | Verifique tabela whatsapp_instances |
| **Tenant inactive** | status != active | Use check_active=False ou ative |
| **Context not found** | agente_config vazio | Configure barbearia no dashboard |
| **AI generation failed** | API key inválida | Verifique variável AI_API_KEY |
| **Message not sent** | Evolution API desconectado | Verifique status da instância |
| **CRM logging failed** | Tabela não existe | Execute migrations |

### 12.2 Logs

```bash
# Ver logs em tempo real
tail -f logs/barberzap_$(date +%Y%m%d).log

# Filtrar erros
grep ERROR logs/barberzap_*.log

# Logs do systemd
sudo journalctl -u barberzap -f
```

### 12.3 Testes

```bash
# Todos os testes
pytest tests/ -v

# Com coverage
pytest tests/ --cov=. --cov-report=html

# Teste específico
pytest tests/test_tenant_resolver.py -v
```

---

## Conclusão

O Backend BarberZap representa uma arquitetura modular e escalável, migrada com sucesso do n8n para Python/FastAPI. O sistema suporta:

- ✅ **Multi-tenancy**: Múltiplas barbearias em uma única instância
- ✅ **IA Contextual**: Respostas baseadas em contexto da barbearia
- ✅ **Memória de Chat**: Histórico de 40 mensagens por conversa
- ✅ **CRM Integrado**: Logging completo de leads e mensagens
- ✅ **Dashboard API**: REST API completa para frontend
- ✅ **Testes Automatizados**: pytest com cobertura
- ✅ **Monitoramento**: Logs estruturados e health checks

**Fases de Desenvolvimento:**
- ✅ Fase 1-7: Implementação completa
- ✅ Fase 8: Documentação completa

---

**Documento preparado para:** Notebook LM  
**Formato:** Markdown  
**Técnico mas acessível**  

---

**Fim do Documento**
