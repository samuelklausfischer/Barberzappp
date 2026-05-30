# BarberZap Dashboard API

Comprehensive REST API for the BarbetZap admin dashboard. Built with FastAPI and integrated with the existing WhatsApp webhook system.

## Base URL

```
http://localhost:8000
```

## Authentication

All endpoints (except `/api/auth/login`) require authentication via JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_access_token>
```

Alternatively, you can use the `X-Tenant-ID` header for testing purposes (bypasses JWT validation in development mode).

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## API Endpoints

### Authentication `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user and get access token |
| POST | `/api/auth/refresh` | Refresh access token using refresh token |
| POST | `/api/auth/logout` | Logout user (invalidate token) |
| GET | `/api/auth/me` | Get current user information |

**Login Example:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "remember_me": false
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "1",
    "tenant_id": "1",
    "name": "Barbearia Exemplo",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

### Tenants `/api/tenants`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | List all tenants (paginated) |
| GET | `/api/tenants/{tenant_id}` | Get tenant by ID |
| GET | `/api/tenants/{tenant_id}/config` | Get complete tenant configuration |
| PUT | `/api/tenants/{tenant_id}` | Update tenant information |

**Query Parameters:**
- `page` (default: 1)
- `page_size` (default: 20, max: 100)
- `order_by` (default: created_at)
- `order_dir` (desc/asc, default: desc)
- `status` (filter: active/inactive/suspended)

---

### Barbers `/api/barbers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/barbers` | List all barbers (paginated) |
| POST | `/api/barbers` | Create new barber |
| GET | `/api/barbers/{barber_id}` | Get barber by ID |
| PUT | `/api/barbers/{barber_id}` | Update barber information |
| DELETE | `/api/barbers/{barber_id}` | Delete barber |

**Create Barber Example:**
```bash
curl -X POST http://localhost:8000/api/barbers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "specialties": "Corte, Barba",
    "bio": "Barbeiro experiente há 10 anos",
    "status": "active"
  }'
```

---

### Services `/api/services`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services (paginated) |
| POST | `/api/services` | Create new service |
| GET | `/api/services/{service_id}` | Get service by ID |
| PUT | `/api/services/{service_id}` | Update service information |
| DELETE | `/api/services/{service_id}` | Delete service |

**Create Service Example:**
```bash
curl -X POST http://localhost:8000/api/services \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Corte Masculino",
    "description": "Corte de cabelo completo",
    "price": 35.00,
    "duration": 30,
    "status": "active"
  }'
```

---

### Clients `/api/clients`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients (paginated) |
| POST | `/api/clients` | Create new client |
| GET | `/api/clients/{client_id}` | Get client by ID |
| PUT | `/api/clients/{client_id}` | Update client information |
| DELETE | `/api/clients/{client_id}` | Delete client |

---

### Employees `/api/employees`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees (paginated) |
| POST | `/api/employees` | Create new employee |
| GET | `/api/employees/{employee_id}` | Get employee by ID |
| PUT | `/api/employees/{employee_id}` | Update employee information |
| DELETE | `/api/employees/{employee_id}` | Delete employee |

---

### Leads / CRM `/api/leads`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List all leads (paginated) |
| POST | `/api/leads` | Create new lead |
| GET | `/api/leads/{lead_id}` | Get lead by ID |
| PUT | `/api/leads/{lead_id}` | Update lead information |
| PATCH | `/api/leads/{lead_id}/status` | Update lead status only |
| GET | `/api/leads/{lead_id}/conversation` | Get complete conversation history |

**Query Parameters:**
- `page`, `page_size`, `order_by`, `order_dir`
- `status` (filter: new/contacted/converted/lost)
- `search` (search by name or phone)

**Update Lead Status Example:**
```bash
curl -X PATCH http://localhost:8000/api/leads/{lead_id}/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "contacted",
    "notes": "Client was contacted via WhatsApp"
  }'
```

---

### Analytics / Stats `/api/stats`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/overview` | Get overview statistics |
| GET | `/api/stats/leads` | Get lead statistics |
| GET | `/api/stats/conversations` | Get conversation statistics |
| GET | `/api/stats/revenue` | Get revenue statistics |
| GET | `/api/stats/full` | Get complete statistics |

**Query Parameters:**
- `period` (today, yesterday, 7d, 30d, 90d, 1y, custom - default: 7d)
- `start_date` (ISO format, required for custom period)
- `end_date` (ISO format, required for custom period)

**Overview Stats Response:**
```json
{
  "total_leads": 150,
  "new_leads_today": 5,
  "active_conversations": 42,
  "total_appointments": 89,
  "appointments_today": 3,
  "total_revenue": 12500.00,
  "revenue_today": 350.00,
  "conversion_rate": 25.5,
  "barbers_count": 3,
  "services_count": 8,
  "clients_count": 120
}
```

---

### Chat `/api/chat`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/send` | Send manual message via WhatsApp |
| POST | `/api/chat/history` | Get chat history for a phone number |
| POST | `/api/chat/ai-generate` | Generate AI response for a message |

**Send Message Example:**
```bash
curl -X POST http://localhost:8000/api/chat/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Olá! Seu agendamento está confirmado para às 14h.",
    "save_to_crm": true
  }'
```

**Generate AI Response Example:**
```bash
curl -X POST http://localhost:8000/api/chat/ai-generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "client_input": "Qual o preço do corte?",
    "mode": "auto",
    "temperature": 0.7
  }'
```

---

### WhatsApp `/api/whatsapp`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/connection` | Check WhatsApp connection status |
| GET | `/api/whatsapp/instance` | Get WhatsApp instance information |
| POST | `/api/whatsapp/test-message` | Send test WhatsApp message |

**Check Connection Example:**
```bash
curl -X GET http://localhost:8000/api/whatsapp/connection \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "connected": true,
  "instance_name": "barbearia_001",
  "status": "active",
  "phone_connected": "5511999998888",
  "last_activity": "2026-02-23T23:00:00Z",
  "uptime_seconds": 86400
}
```

---

### Appointments `/api/appointments` ⚠️ Coming Soon

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List all appointments |
| POST | `/api/appointments` | Create new appointment |
| GET | `/api/appointments/{appointment_id}` | Get appointment by ID |
| PUT | `/api/appointments/{appointment_id}` | Update appointment |
| DELETE | `/api/appointments/{appointment_id}` | Delete appointment |

> **Note**: Appointments feature is planned but not yet fully implemented. Endpoints return 501 status.

---

## Webhook Endpoint (Pre-Existing)

### BarberZap SaaS Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/barberzap-saas` | Evolution API webhook for WhatsApp messages |

This endpoint remains unchanged for backward compatibility with the WhatsApp automation system.

---

## Pagination

Most list endpoints support pagination:

```bash
GET /api/barbers?page=1&page_size=20&order_by=name&order_dir=asc
```

**Response Format:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error type",
  "detail": "Detailed error message",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `501` - Not Implemented

---

## Data Models

### Tenant
```typescript
{
  id: string,
  user_id: string,
  name: string,
  email?: string,
  phone?: string,
  address?: string,
  hours?: string,
  whatsapp_number?: string,
  instance_name?: string,
  logo_url?: string,
  ai_name: string,
  ai_enabled: boolean,
  language: string,
  timezone: string,
  greeting?: string,
  status: "active" | "inactive" | "suspended",
  created_at: datetime,
  updated_at?: datetime
}
```

### Barber
```typescript
{
  id: string,
  user_id: string,
  name: string,
  specialties?: string,
  bio?: string,
  status: "active" | "inactive",
  photo_url?: string,
  created_at: datetime,
  updated_at?: datetime
}
```

### Service
```typescript
{
  id: string,
  user_id: string,
  name: string,
  description?: string,
  price: number,
  duration: number,  // minutes
  status: "active" | "inactive",
  image_url?: string,
  created_at: datetime,
  updated_at?: datetime
}
```

### Lead
```typescript
{
  id: string,
  tenant_id: string,
  name?: string,
  phone: string,
  email?: string,
  notes?: string,
  status: "new" | "contacted" | "converted" | "lost",
  source: string,
  tags: string[],
  ai_enabled: boolean,
  metadata: object,
  last_message_at?: datetime,
  created_at: datetime,
  updated_at?: datetime
}
```

---

## Development

### Running the Server

```bash
cd /root/Barberzap\ SITE/barberzap_python
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Testing Endpoints

Use the Swagger UI at http://localhost:8000/docs for interactive testing.

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your_api_key

# Application
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
```

---

## Backward Compatibility

The existing webhook endpoint `/webhook/barberzap-saas` remains unchanged and continues to process Evolution API webhooks for WhatsApp automation. All new dashboard API endpoints are separate and do not affect the existing functionality.

---

## File Structure

```
api/
├── __init__.py
├── deps.py                    # Dependencies (auth, pagination, etc.)
├── middleware.py              # Custom middleware
├── models/                    # Pydantic models
│   ├── __init__.py
│   ├── common.py
│   ├── tenant.py
│   ├── barber.py
│   ├── service.py
│   ├── client.py
│   ├── employee.py
│   ├── appointment.py
│   ├── lead.py
│   ├── stats.py
│   ├── auth.py
│   ├── chat.py
│   └── whatsapp.py
└── routers/                   # API route handlers
    ├── __init__.py
    ├── auth.py
    ├── tenants.py
    ├── barbers.py
    ├── services.py
    ├── clients.py
    ├── employees.py
    ├── appointments.py
    ├── leads.py
    ├── stats.py
    ├── chat.py
    └── whatsapp.py
```

---

## License

Part of BarberZap SaaS project.
