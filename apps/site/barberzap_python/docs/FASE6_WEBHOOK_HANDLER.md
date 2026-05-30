# FASE 6: BarberZap Webhook Handler - Implementation Summary

## Context
Converter BarberZap do N8N → Python - FASE 6

## Deliverables

### 1. `/root/Barberzap SITE/barberzap_python/webhooks/webhook_handler.py`
Main webhook handler implementing the Evolution API webhook receiver.

#### Implementation Details

**Endpoint:** `POST /webhook/barberzap-saas`

**Workflow:**
1. **Normalizer** (`WebhookNormalizer`):
   - Extracts `instance_name`, `sender`, `message`, `client_name`, `event`
   - Normalizes phone number (removes `@s.whatsapp.net`)
   - Validates if message should be processed

2. **Tenant Resolution** (`resolve_tenant`):
   - Resolves tenant ID from instance name
   - Handles inactive/missing tenants with appropriate error responses

3. **Context Building** (`build_context`):
   - Builds barbershop context (barbershop info, barbers, services)
   - Returns structured context for AI generation

4. **Secretária** (`generate_response`):
   - Generates AI response using `secretaria_universal` module
   - Supports chat history (last 40 messages)
   - Uses Nemotron Nano model

5. **CRM Logging** (`log_conversation`):
   - Upserts lead (`upsert_lead`)
   - Logs inbound and outbound messages (`log_message`)
   - Attaches metadata (instance_name, ai_model, event)

6. **Evolution API** (`send_message`):
   - Sends AI response via Evolution API
   - Returns message ID or error

#### Expected Payload (Evolution API)
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
            "id": "3EB0..."
        },
        "message": {
            "conversation": "Olá, quero agendar um corte"
        },
        "pushName": "João Silva",
        "timestamp": 1740315600
    }]
}
```

#### Response Format
```json
{
    "status": "processed",
    "success": true,
    "tenant_id": "123",
    "instance_name": "barbearia_001",
    "phone": "5511999999999",
    "client_name": "João Silva",
    "response": "Claro! Qual horário prefere?",
    "lead_updated": true,
    "lead_id": 456,
    "message_sent": true,
    "processing_time_ms": 245,
    "steps": {
        "normalizer": { "is_valid": true, "should_process": true, "event": "messages.upsert" },
        "tenant_resolution": { "success": true, "tenant_id": "123" },
        "context_building": { "success": true },
        "secretaria": { "success": true, "ai_name": "Ana", "barbershop_name": "Barbearia Exemplo" },
        "crm_logging": { "success": true, "messages_logged": 2 },
        "evolution_api": { "success": true, "message_id": "msg_123" }
    }
}
```

---

### 2. `/root/Barberzap SITE/barberzap_python/crm/crm_manager.py`
CRM module featuring lead management and message logging functions.

#### Functions

**`upsert_lead(user_id, phone, name, status, source, metadata)`**
- Creates or updates lead in `crm_leads` table
- Uses combination of `user_id` + `phone` for matching
- Supports metadata attachment
- Returns: `{ success, lead_id, action, lead, error }`

**`log_message(lead_id, user_id, phone, direction, message, response, metadata)`**
- Logs message to `crm_messages` table
- Supports `inbound` or `outbound` directions
- Associates with lead ID
- Returns: `{ success, message_id, message, error }`

**`log_conversation(user_id, phone, client_name, inbound_message, outbound_message, metadata)`**
- Complete conversation logging convenience function
- Combines `upsert_lead` + `log_message` for both directions
- Returns: `{ success, lead_result, messages_logged, errors, lead_id }`

---

### 3. Updated `/root/Barberzap SITE/barberzap_python/webhooks/__init__.py`
Package exports for webhook handlers.

**Exports:**
- `webhook_barberzap` - Main webhook handler function
- `create_barberzap_webhook_route` - Factory function to register route
- `WebhookNormalizer` - Payload normalization class
- `validate_webhook_request` - Request validation function
- `is_whatsapp_message` - Check if payload is WhatsApp message
- `is_status_update` - Check if payload is status update

---

### 4. Updated `/root/Barberzap SITE/barberzap_python/crm/__init__.py`
Package exports for CRM functions.

**Exports:**
- `upsert_lead` - Create/update lead
- `log_message` - Log single message
- `log_conversation` - Log complete conversation
- `get_lead_history` - Get lead conversation history
- `lead_exists` - Check if lead exists
- `get_lead_by_id` - Get lead by ID
- `update_lead_status` - Update lead status
- `list_leads` - List leads with filters
- `get_message_by_id` - Get message by ID
- `CRMError`, `CRMLeadNotFoundError`, `CRMMessageError` - Exceptions

---

### 5. Updated `/root/Barberzap SITE/barberzap_python/main.py`
Main application entry point with webhook route registered.

**Changes:**
- Added import: `from webhooks.webhook_handler import create_barberzap_webhook_route`
- Registered webhook route: `create_barberzap_webhook_route(app)` after CORS middleware
- Webhook is accessible at: `POST /webhook/barberzap-saas`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Evolution API Webhook                        │
│                  POST /webhook/barberzap-saas                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Normalizer (WebhookNormalizer)                        │
│  • Extract instance_name, sender, message, client_name, event  │
│  • Normalize phone number (remove @s.whatsapp.net)             │
│  • Validate if should process                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Tenant Resolution (resolve_tenant)                    │
│  • Query whatsapp_instances table                             │
│  • Return user_id for instance_name                            │
│  • Handle inactive / missing tenants                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Context Building (build_context)                      │
│  • Query agente_config (barbershop info)                       │
│  • Query barbers (active barbers)                              │
│  • Query services (active services)                            │
│  • Return structured context                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Secretária (generate_response)                        │
│  • Load chat history (last 40 messages)                        │
│  • Build system prompt with context                            │
│  • Generate AI response (Nemotron Nano)                        │
│  • Return AI response text                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: CRM Logging (log_conversation)                        │
│  • upsert_lead (create or update lead)                        │
│  • log_message (inbound)                                       │
│  • log_message (outbound)                                      │
│  • Attach metadata (instance_name, ai_model, event)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: Evolution API (send_message)                          │
│  • Send AI response via Evolution API                          │
│  • Return message_id or error                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Response   │
                    │ JSON Payload │
                    └──────────────┘
```

---

## Database Schema

### `crm_leads` Table
```sql
- id: int (PK)
- user_id: str (FK to agente_config)
- phone: str (unique combination with user_id)
- name: str (optional)
- status: str ('new', 'contacted', 'converted', 'lost')
- source: str ('whatsapp', 'website', 'referral')
- email: str (optional)
- notes: str (optional)
- metadata: jsonb (additional data)
- created_at: timestamp
- updated_at: timestamp
```

### `crm_messages` Table
```sql
- id: int (PK)
- lead_id: int (FK to crm_leads)
- user_id: str (FK to agente_config)
- phone: str
- direction: str ('inbound', 'outbound')
- message: str
- response: str (optional, references paired message)
- status: str ('received', 'sent', 'delivered', 'read', 'failed')
- metadata: jsonb (message_id, media_url, etc.)
- created_at: timestamp
```

---

## Testing

### Test WebhookNormalizer
```python
from webhooks.webhook_handler import WebhookNormalizer

payload = {
    "event": "messages.upsert",
    "instance": {"instanceName": "barbearia_001"},
    "data": [{
        "key": {"remoteJid": "5511999999999@s.whatsapp.net", "fromMe": False},
        "message": {"conversation": "Olá, quero agendar um corte"},
        "pushName": "João Silva"
    }]
}

normalized = WebhookNormalizer.normalize(payload)
# Returns: { instance_name='barbearia_001', sender='5511999999999', ... }
```

### Test CRM Functions
```python
from crm.crm_manager import upsert_lead, log_message, log_conversation

# Upsert lead
result = upsert_lead(
    user_id='123',
    phone='5511999999999',
    name='João Silva',
    status='new',
    source='whatsapp'
)

# Log message
log_result = log_message(
    lead_id=result['lead_id'],
    user_id='123',
    phone='5511999999999',
    direction='inbound',
    message='Quero agendar um corte'
)

# Log complete conversation
conv_result = log_conversation(
    user_id='123',
    phone='5511999999999',
    client_name='João Silva',
    inbound_message='Quero agendar um corte',
    outbound_message='Claro! Qual horário prefere?'
)
```

---

## Deployment Notes

### Environment Variables Required
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
```

### FastAPI Dependencies
```
fastapi>=0.104.0
uvicorn>=0.24.0
starlette>=0.27.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

### Running the Server
```bash
cd /root/Barberzap\ SITE/barberzap_python
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Webhook URL
```
https://your-domain.com/webhook/barberzap-saas
```

---

## Error Handling

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `instance_not_found` | Instance name not in database | 404 |
| `tenant_inactive` | Tenant status is not 'active' | 403 |
| `tenant_resolution_failed` | Database error resolving tenant | 500 |
| `ai_generation_failed` | AI service error | 500 |
| `unexpected_error` | Unhandled exception | 500 |

---

## Next Steps

1. Install FastAPI dependencies in production environment
2. Configure Evolution API to send webhooks to `/webhook/barberzap-saas`
3. Test with live Evolution API webhooks
4. Monitor processing time and scale accordingly
5. Add rate limiting / throttling
6. Implement retry logic for Evolution API failures
7. Add analytics / monitoring dashboard

---

## Files Created/Modified

**Created:**
- `/root/Barberzap SITE/barberzap_python/crm/crm_manager.py` (15,071 bytes)
- `/root/Barberzap SITE/barberzap_python/webhooks/webhook_handler.py` (21,494 bytes)
- `/root/Barberzap SITE/barberzap_python/docs/FASE6_WEBHOOK_HANDLER.md` (this file)

**Modified:**
- `/root/Barberzap SITE/barberzap_python/webhooks/__init__.py` (548 bytes)
- `/root/Barberzap SITE/barberzap_python/crm/__init__.py` (1,111 bytes)
- `/root/Barberzap SITE/barberzap_python/main.py` (added webhook route)

---

## Summary

✅ **FASE 6 Complete:** Evolution API webhook receiver endpoint implemented

**Key Features:**
- Complete webhook pipeline from reception to response
- Tenant isolation via instance_name resolution
- Context-aware AI responses
- Full CRM logging (leads + messages)
- Progress tracking with detailed step results
- Support for various Evolution API message types (text, image, video, etc.)

**Processing Steps:**
1. Normalizer → Extract & validate payload
2. Tenant Resolution → Resolve user_id from instance
3. Context Building → Build barbershop context
4. Secretária → Generate AI response
5. CRM Logging → Log lead + messages
6. Evolution API → Send response

**Performance:**
- Processing target: < 300ms per webhook
- Supports concurrent webhook processing
- LRU cache for tenant resolution (128 entries)
