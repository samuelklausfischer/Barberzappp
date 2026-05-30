# BarberZap - API Reference

Referência completa da API BarberZap.

## 🌐 Base URL

```
Desenvolvimento: http://localhost:8000
Produção: https://api.seu-dominio.com
```

## 📋 Convenções

| Item | Descrição |
|------|-----------|
| **Formato** | JSON |
| **Encoding** | UTF-8 |
| **Authentication** | Bearer Token (em desenvolvimento) |
| **Timezone** | UTC |

---

## 🔌 Webhooks

### POST /webhook/barberzap-saas

Webhook principal que recebe mensagens do Evolution API.

**Descrição:**
Recebe webhooks do Evolution API para WhatsApp e processa através do pipeline completo:
1. Normaliza payload
2. Resolve tenant
3. Build contexto
4. Gera resposta IA
5. Loga no CRM
6. Envia resposta

**Endpoint:**
```
POST /webhook/barberzap-saas
```

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "event": "messages.upsert",
  "instance": {
    "instanceName": "barbearia_001",
    "status": "open"
  },
  "data": [
    {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "3EB0FAED6CC5D57E"
      },
      "message": {
        "conversation": "Olá, quero agendar um corte para sexta às 14h"
      },
      "pushName": "João Silva",
      "timestamp": 1740315600
    }
  ]
}
```

**Respota de Sucesso (200 OK):**
```json
{
  "status": "processed",
  "success": true,
  "tenant_id": "123",
  "instance_name": "barbearia_001",
  "phone": "5511999999999",
  "client_name": "João Silva",
  "message": "Olá, quero agendar um corte para sexta às 14h",
  "response": "Claro, João! Vou verificar a disponibilidade para sexta-feira às 14h. Um momento, por favor...",
  "lead_updated": true,
  "lead_id": "uuid-123",
  "message_sent": true,
  "processing_time_ms": 245.67,
  "steps": {
    "normalizer": {
      "is_valid": true,
      "should_process": true,
      "event": "messages.upsert"
    },
    "tenant_resolution": {
      "success": true,
      "tenant_id": "123"
    },
    "context_building": {
      "success": true,
      "has_context": true
    },
    "secretaria": {
      "success": true,
      "ai_name": "Ana",
      "barbershop_name": "Barbearia Central"
    },
    "crm_logging": {
      "success": true,
      "messages_logged": 2,
      "errors": []
    },
    "evolution_api": {
      "success": true,
      "message_id": "3EB0FAED6CC5D57E"
    }
  },
  "metadata": {
    "event": "messages.upsert",
    "ai_model": "openai/gpt-4o-mini"
  },
  "error": null,
  "error_details": null
}
```

**Resposta: Instância não encontrada (404 Not Found):**
```json
{
  "status": "error",
  "success": false,
  "error": "instance_not_found",
  "error_details": "Tenant not found for instance: unknown_instance",
  "instance_name": "unknown_instance",
  "phone": "5511999999999"
}
```

**Resposta: Tenant inativo (403 Forbidden):**
```json
{
  "status": "error",
  "success": false,
  "error": "tenant_inactive",
  "error_details": "Tenant is inactive",
  "tenant_id": "123"
}
```

**Resposta: Erro interno (500 Internal Server Error):**
```json
{
  "status": "error",
  "success": false,
  "error": "tenant_resolution_failed",
  "error_details": "Database connection error",
  "processing_time_ms": 15.23
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:8000/webhook/barberzap-saas \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": {
      "instanceName": "barbearia_001"
    },
    "data": [{
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false
      },
      "message": {
        "conversation": "Olá, quero agendar"
      },
      "pushName": "João Silva"
    }]
  }'
```

---

### POST /webhooks/whatsapp

Webhook placeholder do WhatsApp (legado).

**Descrição:**
Recebe mensagens do WhatsApp diretamente. Este endpoint é mantido para compatibilidade.

**Endpoint:**
```
POST /webhooks/whatsapp
```

**Response (200 OK):**
```json
{
  "status": "received",
  "data": {
    "event": "message",
    "data": {}
  }
}
```

---

### POST /webhooks/calendar

Webhook para eventos de calendário.

**Descrição:**
Recebe notificações de eventos de calendário (confirmações, lembretes, etc.).

**Endpoint:**
```
POST /webhooks/calendar
```

**Request Body:**
```json
{
  "event": "appointment_confirmed",
  "data": {
    "appointment_id": "uuid-123",
    "date": "2026-02-24",
    "time": "14:00",
    "phone": "5511999999999"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "received",
  "data": {...}
}
```

---

### POST /webhooks/ai

Webhook para respostas de IA (async).

**Descrição:**
Recebe respostas de IA geradas assincronamente.

**Endpoint:**
```
POST /webhooks/ai
```

**Response (200 OK):**
```json
{
  "status": "received",
  "data": {...}
}
```

---

## 🏥 Health Check

### GET /

Endpoint raiz com informações da API.

**Endpoint:**
```
GET /
```

**Response (200 OK):**
```json
{
  "name": "BarberZap API",
  "version": "1.0.0",
  "status": "online",
  "environment": "production"
}
```

---

### GET /health

Health check para monitoramento.

**Endpoint:**
```
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-23T17:00:00Z"
}
```

**Curl Example:**
```bash
curl http://localhost:8000/health
```

---

## 📤 API - Mensagens

### POST /api/send-message

Envia uma mensagem via WhatsApp.

**Descrição:**
Envia uma mensagem formatada através do Evolution API.

**Endpoint:**
```
POST /api/send-message
```

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "instance_name": "barbearia_001",
  "phone": "5511999999999",
  "message": "Olá! Esta é uma mensagem de teste."
}
```

**Parameters:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| instance_name | string | Sim | Nome da instância Evolution API |
| phone | string | Sim | Número do telefone (sem @s.whatsapp.net) |
| message | string | Sim | Conteúdo da mensagem |

**Response (200 OK):**
```json
{
  "status": "queued",
  "success": true,
  "message_id": "3EB0FAED6CC5D57E",
  "data": {
    "instance_name": "barbearia_001",
    "phone": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste."
  }
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:8000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "instance_name": "barbearia_001",
    "phone": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste."
  }'
```

---

## 🏢 API - Tenants

### GET /api/tenant/{tenant_id}

Obtém configurações de um tenant.

**Endpoint:**
```
GET /api/tenant/{tenant_id}
```

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| tenant_id | string | UUID do tenant |

**Response (200 OK):**
```json
{
  "tenant_id": "123",
  "name": "Barbearia Exemplo",
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-23T17:00:00Z"
}
```

**Response: Não encontrado (404):**
```json
{
  "error": "Tenant not found"
}
```

**Curl Example:**
```bash
curl http://localhost:8000/api/tenant/123
```

---

## 📅 API - Agendamentos

### GET /api/schedule/available

Obtém horários disponíveis para agendamento.

**Endpoint:**
```
GET /api/schedule/available
```

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| date | string | Sim | Data no formato YYYY-MM-DD |
| tenant_id | string | Não | UUID do tenant (opcional) |
| service | string | Não | Tipo de serviço (opcional) |

**Request Example:**
```
GET /api/schedule/available?date=2026-02-24&tenant_id=123
```

**Response (200 OK):**
```json
{
  "date": "2026-02-24",
  "tenant_id": "123",
  "available_slots": [
    {
      "time": "09:00",
      "available": true,
      "barbers": ["João", "Pedro"]
    },
    {
      "time": "10:00",
      "available": true,
      "barbers": ["João"]
    },
    {
      "time": "11:00",
      "available": false,
      "barbers": []
    },
    {
      "time": "14:00",
      "available": true,
      "barbers": ["Pedro"]
    },
    {
      "time": "15:00",
      "available": true,
      "barbers": ["João", "Pedro"]
    }
  ]
}
```

**Response: Data inválida (400):**
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD."
}
```

**Curl Example:**
```bash
curl "http://localhost:8000/api/schedule/available?date=2026-02-24&tenant_id=123"
```

---

### POST /api/schedule

Cria um novo agendamento.

**Endpoint:**
```
POST /api/schedule
```

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenant_id": "123",
  "phone": "5511999999999",
  "name": "João Silva",
  "date": "2026-02-24",
  "time": "14:00",
  "service": "Corte de cabelo",
  "barber": "Pedro"
}
```

**Parameters:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| tenant_id | string | Sim | UUID do tenant |
| phone | string | Sim | Telefone do cliente |
| name | string | Sim | Nome do cliente |
| date | string | Sim | Data (YYYY-MM-DD) |
| time | string | Sim | Horário (HH:MM) |
| service | string | Não | Tipo de serviço |
| barber | string | Não | Barbeiro preferido |

**Response (201 Created):**
```json
{
  "status": "booked",
  "success": true,
  "appointment_id": "uuid-456",
  "details": {
    "tenant_id": "123",
    "phone": "5511999999999",
    "name": "João Silva",
    "date": "2026-02-24",
    "time": "14:00",
    "service": "Corte de cabelo",
    "barber": "Pedro",
    "created_at": "2026-02-23T17:00:00Z"
  },
  "confirmation_message": "Agendamento confirmado! Te esperamos na Barbearia dia 24/02 às 14:00."
}
```

**Response: Horário indisponível (409 Conflict):**
```json
{
  "error": "Time slot not available",
  "message": "The time 14:00 on 2026-02-24 is already booked"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:8000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "123",
    "phone": "5511999999999",
    "name": "João Silva",
    "date": "2026-02-24",
    "time": "14:00",
    "service": "Corte de cabelo",
    "barber": "Pedro"
  }'
```

---

## 👥 API - CRM & Leads

### GET /api/leads/{lead_id}

Obtém informações de um lead.

**Endpoint:**
```
GET /api/leads/{lead_id}
```

**Response (200 OK):**
```json
{
  "id": "uuid-789",
  "tenant_id": "123",
  "phone": "5511999999999",
  "name": "João Silva",
  "status": "active",
  "created_at": "2026-02-20T10:00:00Z",
  "updated_at": "2026-02-23T17:00:00Z",
  "messages_count": 5,
  "appointments_count": 2
}
```

---

### GET /api/tenant/{tenant_id}/leads

Lista leads de um tenant.

**Endpoint:**
```
GET /api/tenant/{tenant_id}/leads
```

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| page | integer | 1 | Número da página |
| limit | integer | 20 | Itens por página |
| status | string | - | Filtro por status |

**Response (200 OK):**
```json
{
  "tenant_id": "123",
  "leads": [
    {
      "id": "uuid-789",
      "phone": "5511999999999",
      "name": "João Silva",
      "status": "active",
      "created_at": "2026-02-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

---

## 📊 API - Analytics

### GET /api/analytics/summary

Resumo analítico de um tenant.

**Endpoint:**
```
GET /api/analytics/summary
```

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| tenant_id | string | Sim | UUID do tenant |
| period | string | Não | Período: today, week, month (padrão: month) |

**Request Example:**
```
GET /api/analytics/summary?tenant_id=123&period=month
```

**Response (200 OK):**
```json
{
  "tenant_id": "123",
  "period": "month",
  "dates": {
    "start": "2026-02-01",
    "end": "2026-02-23"
  },
  "metrics": {
    "total_leads": 45,
    "new_leads": 12,
    "active_conversations": 23,
    "total_messages": 156,
    "appointments_booked": 18,
    "appointments_confirmed": 15,
    "appointments_cancelled": 1
  },
  "response_time": {
    "average_ms": 345.5,
    "p50_ms": 220,
    "p95_ms": 680
  }
}
```

---

## ❌ Códigos de Erro

| Código HTTP | Tipo | Descrição |
|-------------|------|-----------|
| 200 | Success | Requisição bem-sucedida |
| 201 | Created | Recurso criado |
| 400 | Bad Request | Parâmetros inválidos |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: horário já agendado) |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Error | Erro no servidor |
| 502 | Bad Gateway | Erro no gateway |
| 503 | Service Unavailable | Serviço indisponível |

### Formato de resposta de erro:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2026-02-23T17:00:00Z"
}
```

---

## 🧪 Testando a API

### Com Swagger UI

Acesse: http://localhost:8000/docs

### Com curl

```bash
# Health check
curl http://localhost:8000/health

# Mensagem via webhook
curl -X POST http://localhost:8000/webhook/barberzap-saas \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","instance":{"instanceName":"barbearia_001"},"data":[{"key":{"remoteJid":"5511999999999@s.whatsapp.net","fromMe":false},"message":{"conversation":"Teste"},"pushName":"Teste"}]}'

# Obter horários disponíveis
curl "http://localhost:8000/api/schedule/available?date=2026-02-24&tenant_id=123"
```

### Com Postman/Insomnia

Import as URLs e configure as requests conforme documentado acima.

---

## 📝 Notas

### Rate Limiting

- Webhooks: 10 requisições/segundo por IP
- API geral: 100 requisições/segundo por IP
- Configurado via Nginx

### Timeouts

- Webhooks: 30 segundos
- API calls: 60 segundos

### Versionamento

- Atual: v1.0.0
- Prefixo não utilizado atualmente (planejado para v2: `/v2/...`)

---

## 📚 Referências Externas

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Evolution API Documentation](https://doc.evolution-api.com/)

---

**API Reference v1.0.0** | Última atualização: 2026-02-23
