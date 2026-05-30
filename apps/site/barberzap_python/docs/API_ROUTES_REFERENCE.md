# BarberZap API - Routes Reference

## Base URL
```
http://localhost:8000
```

---

## 🔍 Health Endpoints

### GET /
Health check básico com informações da API.

**Response:**
```json
{
  "name": "BarberZap API",
  "version": "1.0.0",
  "status": "online",
  "environment": "development"
}
```

### GET /health
Health check detalhado para monitoramento.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-23T16:46:00Z"
}
```

---

## 📩 Webhook Endpoints

### POST /webhook/barberzap-saas
**Endpoint principal** para Evolution API. Processa mensagens WhatsApp.

**Workflow:**
1. Normalizer → Extract instance_name, sender, message, client_name, event
2. Tenant Resolution → resolve_tenant(instance_name)
3. Context Building → build_context(tenant_id)
4. Secretária → generate_response(instance_name, phone, message, context)
5. CRM Logging → upsert_lead() + log_message()
6. Evolution API → send_message(instance_name, phone, response)

**Request Body:**
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
      "conversation": "Olá, quero agendar um corte"
    },
    "pushName": "João Silva",
    "timestamp": 1740315600
  }]
}
```

**Response (Success):**
```json
{
  "status": "processed",
  "success": true,
  "tenant_id": "123",
  "instance_name": "barbearia_001",
  "phone": "5511999999999",
  "client_name": "João Silva",
  "message": "Olá, quero agendar um corte",
  "response": "Claro! Qual horário prefere?",
  "lead_updated": true,
  "message_sent": true,
  "processing_time_ms": 245,
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
      "barbershop_name": "Barbearia do João"
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
  "metadata": {}
}
```

**Response (Error - Tenant not found):**
```json
{
  "status": "error",
  "success": false,
  "error": "instance_not_found",
  "error_details": "Tenant not found for instance: barbearia_999",
  "steps": {},
  "metadata": {}
}
```

### POST /webhooks/whatsapp
Placeholder para webhook WhatsApp genérico.

**Request:**
```json
{
  "event": "message",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Olá, quero agendar um corte"
    }
  }
}
```

### POST /webhooks/calendar
Placeholder para notificações de calendário.

### POST /webhooks/ai
Placeholder para respostas AI processadas async.

---

## 📤 API Endpoints

### POST /api/send-message
Envia uma mensagem via WhatsApp manualmente.

**Request:**
```json
{
  "phone": "5511999999999",
  "message": "Sua agendamento foi confirmado para às 14h"
}
```

**Response:**
```json
{
  "status": "queued",
  "data": {
    "phone": "5511999999999",
    "message": "Sua agendamento foi confirmado para às 14h"
  }
}
```

### GET /api/tenant/{tenant_id}
Obtém configuração do tenant.

**Parameters:**
- `tenant_id` (path) - ID do tenant

**Response:**
```json
{
  "tenant_id": "tenant_123",
  "name": "Barbearia Exemplo",
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo"
}
```

### GET /api/schedule/available
Obtém horários disponíveis para agendamento.

**Query Parameters:**
- `date` (required) - Data no formato YYYY-MM-DD

**Example:**
```
GET /api/schedule/available?date=2026-02-24
```

**Response:**
```json
{
  "date": "2026-02-24",
  "slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
}
```

### POST /api/schedule
Cria um novo agendamento.

**Request:**
```json
{
  "tenant_id": "tenant_123",
  "phone": "5511999999999",
  "name": "Customer Name",
  "date": "2026-02-24",
  "time": "14:00",
  "service": "Corte"
}
```

**Response:**
```json
{
  "status": "booked",
  "data": {
    "tenant_id": "tenant_123",
    "phone": "5511999999999",
    "name": "Customer Name",
    "date": "2026-02-24",
    "time": "14:00",
    "service": "Corte"
  }
}
```

---

## 📚 Documentation Endpoints

### GET /docs
Swagger UI - Interface interativa para testar a API.

### GET /redoc
ReDoc - Documentação alternativa.

---

## 🔒 Error Responses

### Generic Error Response
**Status:** 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "detail": "Detailed error message here"
}
```

### Tenant Not Found
**Status:** 404 Not Found

```json
{
  "status": "error",
  "success": false,
  "error": "instance_not_found",
  "error_details": "Tenant not found for instance: barbearia_999"
}
```

### Tenant Inactive
**Status:** 403 Forbidden

```json
{
  "status": "error",
  "success": false,
  "error": "tenant_inactive",
  "error_details": "Tenant is inactive: barbearia_002"
}
```

---

## 🔐 CORS Headers

A API suporta CORS para requests de diferentes origens.

**Development:** `allowed_origins=["*"]`

**Production:** `allowed_origins` definido via variável `ALLOWED_ORIGINS`

Example:
```
ALLOWED_ORIGINS=https://barberzap.com,https://app.barberzap.com
```

---

## 📊 Rate Limiting

Ainda não implementado planejado para FASE 8.

---

## 🧪 Testing with Curl

### Health Check
```bash
curl http://localhost:8000/health
```

### Send Message
```bash
curl -X POST http://localhost:8000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Test message"
  }'
```

### Get Tenant
```bash
curl http://localhost:8000/api/tenant/tenant_123
```

### Get Available Slots
```bash
curl "http://localhost:8000/api/schedule/available?date=2026-02-24"
```

### Book Appointment
```bash
curl -X POST http://localhost:8000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant_123",
    "phone": "5511999999999",
    "name": "João Silva",
    "date": "2026-02-24",
    "time": "14:00",
    "service": "Corte"
  }'
```

### Webhook Test
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

## 📝 Notes

1. **Endpoints com TODO**: Aguardam implementação real das integrações.

2. **Webhook Principal**: `/webhook/barberzap-saas` já está implementado em `webhook_handler.py`.

3. **Documentação**: Use `/docs` ou `/redoc` para documentação interativa.

4. **Environment Variables**: Configure via arquivo `.env` na raiz do projeto.

---

**Last Updated:** 2026-02-23
**Version:** 1.0.0
