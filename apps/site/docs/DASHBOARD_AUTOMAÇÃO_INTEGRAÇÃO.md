# 🔄 BarberZap Dashboard-Automation Integration Report

**Date:** 2026-02-23  
**Version:** 1.0  
**Scope:** Frontend (React Dashboard) + Backend (FastAPI/Python) + WhatsApp Automation  
**Status:** 🔴 INTEGRATION NOT IMPLEMENTED - ANALYSIS ONLY

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current Architecture](#current-architecture)
3. [Gap Analysis](#gap-analysis)
4. [Proposed Integration Architecture](#proposed-integration-architecture)
5. [API Requirements](#api-requirements)
6. [Data Flow & Sync](#data-flow--sync)
7. [Implementation Plan](#implementation-plan)
8. [Risks & Mitigation](#risks--mitigation)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Strategy](#deployment-strategy)

---

## 🎯 EXECUTIVE SUMMARY

### Current State

| Component | Status | Description |
|-----------|--------|-------------|
| **Frontend (Dashboard)** | ⚠️ PARTIAL | Landing page exists, NO dashboard UI |
| **Backend APIs** | ⚠️ PARTIAL | Webhook automation exists, NO dashboard APIs |
| **Authentication** | 🔴 ABSENT | No auth system (JWT, sessions, login) |
| **Database** | ✅ EXISTS | Supabase with WhatsApp/CRM tables |
| **Automation** | ✅ WORKING | Evolution API webhook + AI response pipeline |
| **Integration** | 🔴 MISSING | Frontend has NO connection to backend |

### Key Findings

1. **Webhook-Only Architecture**: System is designed as a pure webhook automation service, NOT a web application with dashboards
2. **No Authentication**: All public endpoints have no authentication (security risk)
3. **Multi-Tenancy via Instance**: Tenant identification uses Evolution API `instance_name`, NOT user credentials
4. **Frontend Missing Dashboard**: React app has only landing page, no admin/dashboard screens
5. **Backend Missing CRUD APIs**: No endpoints for barbers, services, appointments, statistics
6. **No Real-time Sync**: No WebSocket or real-time data push to frontend

### Integration Challenge

The system needs to evolve from **webhook automation only** to **SaaS platform with dashboard**:

```
BEFORE (Current State):
WhatsApp → Evolution API → Webhook → Python Automation → Response
                                     ↓
                                  Supabase (CRM only)

AFTER (Proposed):
Dashboard UI → FastAPI APIs → Supabase
              ↓           ↓
          WhatsApp   Real-time Sync
          Automation   (WebSocket)
```

---

## 🔍 CURRENT ARCHITECTURE

### Frontend Architecture (React)

#### Location
`/root/Barberzap SITE/Barberzap-Dev/`

#### Existing Components

```
src/
├── components/
│   ├── sections/              (Landing page sections)
│   │   ├── HeroSection.jsx           ✅ Landing hero
│   │   ├── BenefitsSection.jsx       ✅ Feature highlights
│   │   ├── PricingSection.jsx        ✅ Pricing cards
│   │   ├── LeadModal.jsx             ✅ Lead capture
│   │   ├── TestimonialsSection.jsx   ✅ Social proof
│   │   └── ... (marketing content)
│   └── ui/                   (Reusable UI)
│       ├── Button.jsx               ✅ Button component
│       ├── SectionHeading.jsx       ✅ Section titles
│       └── ...
├── App.jsx                        ✅ Landing page composition
├── main.jsx                       ✅ React entry point
└── utils/
    └── pixel.js                    ✅ Facebook Pixel tracking
```

#### Missing Dashboard Components

```
src/
├── pages/
│   ├── LoginPage.jsx              ❌ NOT EXISTS
│   ├── RegisterPage.jsx           ❌ NOT EXISTS
│   ├── DashboardPage.jsx          ❌ NOT EXISTS
│   ├── LeadsPage.jsx              ❌ NOT EXISTS
│   ├── AppointmentsPage.jsx       ❌ NOT EXISTS
│   ├── SettingsPage.jsx           ❌ NOT EXISTS
│   └── AnalyticsPage.jsx          ❌ NOT EXISTS
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.jsx    ❌ NOT EXISTS
│   │   ├── Sidebar.jsx            ❌ NOT EXISTS
│   │   ├── Header.jsx             ❌ NOT EXISTS
│   │   ├── MetricsCard.jsx        ❌ NOT EXISTS
│   │   ├── LeadsTable.jsx         ❌ NOT EXISTS
│   │   ├── MessageThread.jsx      ❌ NOT EXISTS
│   │   └── ...
│   └── auth/
│       ├── AuthContext.jsx        ❌ NOT EXISTS
│       ├── ProtectedRoute.jsx     ❌ NOT EXISTS
│       ├── LoginForm.jsx          ❌ NOT EXISTS
│       └── RegisterForm.jsx       ❌ NOT EXISTS
├── services/
│   ├── api.js                     ❌ NOT EXISTS
│   ├── auth.js                    ❌ NOT EXISTS
│   └── websocket.js               ❌ NOT EXISTS
└── lib/
    └── axios.js                   ❌ NOT EXISTS
```

#### Tech Stack

- **Framework**: React (Vite)
- **Routing**: ⚠️ NOT IMPLEMENTED (no react-router-dom)
- **State Management**: useState, useEffect (no global state)
- **HTTP Client**: ❌ NOT IMPLEMENTED (no axios/fetch for APIs)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (for landing page only)
- **Components**: Lucide React icons

### Backend Architecture (FastAPI)

#### Location
`/root/Barberzap SITE/barberzap_python/`

#### Existing Modules

```
barberzap_python/
├── main.py                        ✅ FastAPI app entry point
├── core/
│   ├── tenant_resolver.py         ✅ Instance → tenant resolution
│   └── context_builder.py         ✅ Barbearia context builder
├── agents/
│   └── secretaria_universal.py    ✅ AI response generator
├── webhooks/
│   └── webhook_handler.py         ✅ Evolution API webhook receiver
├── crm/
│   ├── crm_manager.py             ✅ Lead/message logging
│   └── inspect_tables.py          ✅ DB schema inspector
├── integrations/
│   ├── supabase_rest.py           ✅ Supabase REST client
│   ├── evolution_api.py           ✅ WhatsApp integration
│   └── ai_service.py              ✅ OpenAI/NVIDIA API client
└── tests/                         ✅ Test suite
```

#### Existing API Endpoints

```
WEBHOOK ENDPOINTS (No Auth):
├── POST /webhook/barberzap-saas           ✅ Main webhook (WhatsApp messages)
├── POST /webhooks/whatsapp                ✅ Legacy webhook
├── POST /webhooks/calendar                ⚠️  Placeholder (calendar events)
└── POST /webhooks/ai                      ⚠️  Placeholder (AI responses)

API ENDPOINTS (No Auth):
├── GET  /                                 ✅ API info
├── GET  /health                           ✅ Health check
├── POST /api/send-message                 ⚠️  Placeholder (send WhatsApp)
├── GET  /api/tenant/{tenant_id}           ⚠️  Placeholder (get tenant config)
├── GET  /api/schedule/available           ⚠️  Placeholder (get slots)
└── POST /api/schedule                     ⚠️  Placeholder (book appointment)
```

#### Existing Webhook Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ WHAT EXISTS: WEBHOOK AUTOMATION PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘

1️⃣ WHATSAPP CLIENT
   Message: "Quero agendar um corte"
   ↓
2️⃣ EVOLUTION API
   Instance: barber_d9fd2be40768483b
   Webhook: POST /webhook/barberzap-saas
   ↓
3️⃣ WEBHOOK NORMALIZER
   Extract: instance_name, sender, message, client_name
   ↓
4️⃣ TENANT RESOLVER
   Query: SELECT user_id FROM whatsapp_instances 
          WHERE instance_name = 'barber_d9fd2be40768483b'
   Result: user_id = d9fd2be4-0768-483b-b122-b60277335e2a
   ↓
5️⃣ CONTEXT BUILDER
   Query: agente_config, barbers, services
   Result: { barbershop: {...}, barbers: [...], services: [...] }
   ↓
6️⃣ SECRETÁRIA UNIVERSAL (AI AGENT)
   Input: { phone, message, context }
   AI Model: nemotron_nano / gpt-4o-mini
   Output: "Claro! Qual horário prefere? Temos vagas às 14h ou 16h."
   ↓
7️⃣ CRM LOGGING
   upsert_lead(user_id, phone, name)
   log_message(lead_id, direction='inbound', message)
   log_message(lead_id, direction='outbound', response)
   ↓
8️⃣ EVOLUTION API RESPONSE
   POST /message/send
   Instance: barber_d9fd2be40768483b
   Phone: 5511999999999
   Message: "Claro! Qual horário prefere?..."
   ↓
9️⃣ CUSTOMER RECEIVES RESPONSE
   WhatsApp message displays
```

### Database Architecture (Supabase)

#### Existing Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `whatsapp_instances` | Maps Evolution API instances to tenants (user_id) | ✅ EXISTS |
| `agente_config` | Barbearia configuration (name, address, hours, AI settings) | ✅ EXISTS |
| `barbers` | List of barbers/services providers | ✅ EXISTS |
| `services` | Services catalog (prices, descriptions, duration) | ✅ EXISTS |
| `crm_leads` | Customer leads/contact info | ✅ EXISTS |
| `crm_messages` | Message history (inbound/outbound) | ✅ EXISTS |
| `visitors` | Web visitor tracking | ✅ EXISTS |

#### Table Schema Examples

**whatsapp_instances**:
```sql
CREATE TABLE whatsapp_instances (
    id BIGSERIAL PRIMARY KEY,
    instance_name VARCHAR UNIQUE,      -- Evolution API instance name
    user_id UUID,                      -- Tenant ID (FK to agente_config.user_id)
    status VARCHAR,                    -- active/inactive/suspended
    api_key VARCHAR,
    webhook_url VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**agente_config**:
```sql
CREATE TABLE agente_config (
    user_id UUID PRIMARY KEY,          -- This IS the tenant ID
    instance_name VARCHAR,
    nome_ia VARCHAR,                   -- AI assistant name
    saudacao TEXT,                     -- AI greeting message
    endereco TEXT,                     -- Barbershop address
    horarios TEXT,                     -- Opening hours
    nome_barbearia VARCHAR,            -- Barbershop name
    phone VARCHAR,
    whatsapp VARCHAR
);
```

**crm_leads**:
```sql
CREATE TABLE crm_leads (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,                      -- Tenant ID
    tenant_id BIGINT,                  -- Alternative tenant ID
    phone VARCHAR,                     -- Customer phone
    name VARCHAR,                      -- Customer name
    status VARCHAR DEFAULT 'new',      -- new, contacted, scheduled, converted, lost
    source VARCHAR DEFAULT 'whatsapp', -- whatsapp, web, manual
    metadata JSONB,                    -- Additional info
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**crm_messages**:
```sql
CREATE TABLE crm_messages (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT,                    -- FK to crm_leads
    user_id UUID,                      -- Tenant ID
    tenant_id BIGINT,
    phone VARCHAR,                     -- Customer phone
    direction VARCHAR,                 -- inbound/outbound
    message TEXT,                      -- Message content
    response TEXT,                     -- Response (if direction='outbound')
    metadata JSONB,                    -- AI model, instance_name, etc.
    created_at TIMESTAMPTZ
);
```

#### Missing Database Tables

| Table | Purpose | Priority |
|-------|---------|----------|
| `users` | User accounts (login, password) | 🔴 CRITICAL |
| `user_sessions` | JWT refresh tokens | 🔴 CRITICAL |
| `audit_logs` | Login/logout, API access | 🟡 HIGH |
| `appointments` | Scheduled appointments | 🟡 HIGH |
| `dashboard_metrics` | Cached analytics stats | 🟢 LOW |
| `webhooks_config` | Webhook configuration history | 🟢 LOW |

---

## 🚨 GAP ANALYSIS

### What Exists vs What's Needed

#### Frontend Gaps

| Feature | Exists | Needed | Gap |
|---------|--------|--------|-----|
| Landing Page | ✅ | ✅ | ✅ NONE |
| Dashboard UI | ❌ | ✅ | 🔴 CRITICAL |
| Login System | ❌ | ✅ | 🔴 CRITICAL |
| Auth Context | ❌ | ✅ | 🔴 CRITICAL |
| Protected Routes | ❌ | ✅ | 🔴 CRITICAL |
| API Client | ❌ | ✅ | 🔴 CRITICAL |
| Real-time Updates | ❌ | ✅ | 🟡 HIGH |
| Charts/Analytics | ❌ | ✅ | 🟡 HIGH |

#### Backend Gaps

| Feature | Exists | Needed | Gap |
|---------|--------|--------|-----|
| Webhook Automation | ✅ | ✅ | ✅ NONE |
| CRM Logging | ✅ | ✅ | ✅ NONE |
| Tenant Resolution | ✅ | ✅ | ✅ NONE |
| Auth Middleware | ❌ | ✅ | 🔴 CRITICAL |
| JWT Tokens | ❌ | ✅ | 🔴 CRITICAL |
| CRUD APIs | ❌ | ✅ | 🔴 CRITICAL |
| Statistics APIs | ❌ | ✅ | 🟡 HIGH |
| WebSocket/Real-time | ❌ | ✅ | 🟡 HIGH |
| Rate Limiting | ❌ | ✅ | 🟡 MEDIUM |
| Audit Logging | ❌ | ✅ | 🟡 MEDIUM |

#### Integration Gaps

| Integration | Status | Description |
|-------------|--------|-------------|
| Frontend ↔ Backend | ❌ NO CONNECTION | React has no API calls to FastAPI |
| Backend ↔ Supabase | ✅ CONNECTED | via supabase_rest.py |
| Evolution API ↔ Backend | ✅ CONNECTED | via evolution_api.py |
| AI Service ↔ Backend | ✅ CONNECTED | via ai_service.py |
| Real-time Sync | ❌ MISSING | No WebSocket or Server-Sent Events |

### Current Limitations

1. **No Dashboard Access**: Users cannot see their CRM data, leads, or analytics
2. **No Configuration UI**: Cannot configure AI, services, barbers via web interface
3. **No Appointment Management**: Cannot view/book appointments online
4. **No Message History**: Cannot see WhatsApp conversation transcripts
5. **No Analytics**: No metrics (leads per day, response time, conversion rates)
6. **Security Risk**: All endpoints are public, no authentication
7. **No Multi-User**: Single tenant per Evolution API instance, no team collaboration
8. **No Real-time Updates**: Dashboard must refresh to see new leads/messages

---

## 🏗️ PROPOSED INTEGRATION ARCHITECTURE

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        BARBERZAP SAAS ARCHITECTURE                        │
│                          (Full Stack Integration)                         │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────────────────────────────────┐
│   BROWSER       │         │              FRONTEND (React)                │
│  (User's Device)│         │  ┌──────────────────────────────────────┐    │
│                 │<────────>│  │  Dashboard UI Components            │    │
│  - Login Page   │   HTTPS  │  │  - Leads Table                      │    │
│  - Dashboard    │         │  │  - Message Thread                   │    │
│  - Leads View   │         │  │  - Analytics Charts                  │    │
│  - Settings     │         │  │  - Appointment Calendar             │    │
│  - Analytics    │         │  │  - Barbers/Services Management       │    │
│                 │         │  └──────────────────────────────────────┘    │
└─────────────────┘         │                                                │
                            │  ┌──────────────────────────────────────┐    │
                            │  │  Auth Layer                           │    │
                            │  │  - AuthContext (JWT state)           │    │
                            │  │  - ProtectedRoute (auth guard)       │    │
                            │  │  - Login/Logout handlers             │    │
                            │  └──────────────────────────────────────┘    │
                            │                                                │
                            │  ┌──────────────────────────────────────┐    │
                            │  │  API Client (Axios)                   │    │
                            │  │  - JWT interceptor                    │    │
                            │  │  - Token refresh                      │    │
                            │  │  - Error handling                     │    │
                            │  └──────────────────────────────────────┘    │
                            │                                                │
                            │  ┌──────────────────────────────────────┐    │
                            │  │  Real-time Client (WebSocket)          │    │
                            │  │  - Live leads update                  │    │
                            │  │  - Live message notifications        │    │
                            │  └──────────────────────────────────────┘    │
                            └─────────────────────────────────────────────┘
                                              │
                                              │ HTTPS + JWT
                                              │
┌─────────────────────────────────────────────┴─────────────────────────────┐
│                     BACKEND (FastAPI Python)                              │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    API Gateway / CORS Middleware                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                         AUTHENTICATION LAYER                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐      │  │
│  │  │ JWT Middleware│  │ Session Mgmt │  │ Rate Limiting        │      │  │
│  │  │ - Verify      │  │ - Refresh    │  │ - 5 req/min (login)  │      │  │
│  │  │   signature   │  │   tokens     │  │ - 100 req/min (api)  │      │  │
│  │  │ - Extract     │  │ - Invalidate │  │                      │      │  │
│  │  │   user_id     │  │   on logout  │  │                      │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        ROUTE HANDLERS                              │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │  │
│  │  │ Auth Endpoints  │  │ CRUD Endpoints  │  │ Analytics APIs  │    │  │
│  │  │ - login         │  │ - barbers       │  │ - stats          │    │  │
│  │  │ - logout        │  │ - services      │  │ - leads_summary  │    │  │
│  │  │ - register      │  │ - leads         │  │ - conversion_rt  │    │  │
│  │  │ - refresh_token │  │ - messages      │  │ - response_time  │    │  │
│  │  │ - me (profile)  │  │ - appointments  │  │ - trends         │    │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                       BUSINESS LOGIC                              │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │  │
│  │  │ Tenant Resolver  │  │ Context Builder │  │ CRM Manager     │    │  │
│  │  │ - instance_name │  │ - Load config   │  │ - upsert_lead   │    │  │
│  │  │   → tenant_id   │  │ - Load barbers  │  │ - log_message   │    │  │
│  │  │ - Validate      │  │ - Load services │  │ - get_history   │    │  │
│  │  │   access        │  │ - AI context    │  │ - update_status  │    │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │  │
│  │                                                                         │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │  │
│  │  │ AI Agent        │  │ Webhook Handler │  │ WebSocket Mgr   │    │  │
│  │  │ - Generate      │  │ - Normalizer    │  │ - Push updates  │    │  │
│  │  │   response      │  │ - Process flow  │  │ - Broadcast     │    │  │
│  │  │ - Context aware │  │ - Evolution API │  │ - Room mgmt     │    │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    EXTERNAL INTEGRATIONS                           │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │  │
│  │  │ Evolution API   │  │ AI Service      │  │ WebSocket       │    │  │
│  │  │ - Send msg      │  │ (OpenAI/NVIDIA) │  │ Server          │    │  │
│  │  │ - Webhook recv  │  │ - Generate AI   │  │ - Real-time     │    │  │
│  │  │ - Instance mgmt │  │   responses     │  │   push          │    │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              │ REST API / PostgreSQL
                                              │
┌─────────────────────────────────────────────┴─────────────────────────────┐
│                         DATABASE (Supabase/PostgreSQL)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ AUTH TABLES     │  │ CRM TABLES      │  │ CONFIG TABLES   │          │
│  │ - users         │  │ - crm_leads     │  │ - agente_config │          │
│  │ - user_sessions │  │ - crm_messages  │  │ - barbers       │          │
│  │ - audit_logs    │  │ - appointments  │  │ - services      │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│  ┌─────────────────┐                                                    │
│  │ INSTANCE TABLE  │                                                    │
│  │ - whatsapp_     │                                                    │
│  │   instances     │                                                    │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                              │
┌─────────────────────────────────────────────┴─────────────────────────────┐
│                         EXTERNAL SERVICES                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Evolution API   │  │ OpenAI / NVIDIA │  │ Payment Gateway │          │
│  │ (WhatsApp)      │  │ (AI Models)     │  │ (Cakto)         │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow (Login → Dashboard)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: USER LOGIN                                                   │
└─────────────────────────────────────────────────────────────────────┘

User Browser
    ↓
    1. Navigate to /login
    ↓
    2. Enter email: barbearia@test.com
       Enter password: ********
    ↓
    3. Click "Entrar" button
    ↓
React Frontend
    ↓
    4. POST https://api.barberzap.com/auth/login
       Body: { email: "...", password: "..." }
    ↓
FastAPI Backend
    ↓
    5. Verify credentials (POSTGRES: users table)
       Hashed password comparison
    ↓
    6. Generate JWT tokens
       - access_token (expires: 30 min)
         { "sub": user_id, "role": "admin", "tenant_id": "..." }
       - refresh_token (expires: 7 days)
    ↓
    7. Save refresh_token to DB (user_sessions table)
    ↓
    8. Return response:
       {
         "access_token": "eyJ...",
         "refresh_token": "eyJ...",
         "user": { id, email, role, tenant_id }
       }
    ↓
React Frontend
    ↓
    9. Store tokens in localStorage
       - localStorage.setItem('access_token', jwt)
       - localStorage.setItem('refresh_token', jwt)
    ↓
   10. Update AuthContext state
       - setUser(user)
       - setIsAuthenticated(true)
    ↓
   11. Redirect to /dashboard

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: DASHBOARD API REQUEST (Protected)                            │
└─────────────────────────────────────────────────────────────────────┐

React Dashboard
    ↓
    1. Load leads list on mount
       useEffect(() => { fetchLeads() }, [])
    ↓
    2. Axios interceptor adds JWT header:
       GET https://api.barberzap.com/api/leads
       Headers: Authorization: Bearer eyJ...
    ↓
FastAPI Backend
    ↓
    3. JWT Middleware verifies token
       - Decode JWT
       - Extract user_id (sub)
       - Extract tenant_id
    ↓
    4. Dependency: get_current_tenant()
       - Query permissions: Does user have access to this tenant?
       - Set PostgreSQL session var: app.current_tenant_id = tenant_id
    ↓
    5. Query database with tenant isolation
       SELECT * FROM crm_leads
       WHERE user_id = current_setting('app.current_tenant_id')::UUID
    ↓
    6. Return results:
       {
         "leads": [
           { id: 1, name: "João", phone: "...", status: "new" },
           ...
         ]
       }
    ↓
React Dashboard
    ↓
    7. Display leads in table
    8. Show metrics (new leads today, etc.)

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: TOKEN REFRESH (Automatic)                                    │
└─────────────────────────────────────────────────────────────────────┐

React Dashboard
    ↓
    1. API call fails with 401 Unauthorized
    ↓
    2. Axios response interceptor catches error
    ↓
    3. POST https://api.barberzap.com/auth/refresh
       Body: { refresh_token: "eyJ..." }
    ↓
FastAPI Backend
    ↓
    4. Validate refresh_token in DB (user_sessions table)
    ↓
    5. Generate new access_token:
       { "sub": user_id, "role": "...", "tenant_id": "..." }
    ↓
    6. Return new access_token
    ↓
React Dashboard
    ↓
    7. Update localStorage with new access_token
    ↓
    8. Retry original request with new token

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: LOGOUT                                                       │
└─────────────────────────────────────────────────────────────────────┘

React Dashboard
    ↓
    1. User clicks "Sair" button
    ↓
    2. POST https://api.barberzap.com/auth/logout
       Headers: Authorization: Bearer eyj...
    ↓
FastAPI Backend
    ↓
    3. Delete refresh_token from DB
       DELETE FROM user_sessions WHERE user_id = ...
    ↓
   4. Add audit log
       INSERT INTO audit_logs (user_id, action: "logout")
    ↓
   5. Return: { "message": "Logged out" }
    ↓
React Dashboard
    ↓
    6. Clear localStorage
       removeItem('access_token')
       removeItem('refresh_token')
    ↓
    7. Update AuthContext
       setUser(null)
       setIsAuthenticated(false)
    ↓
   8. Redirect to /login
```

### Data Flow (Dashboard ↔ Backend ↔ Database)

```
┌─────────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: VIEWING LEADS (Dashboard → Read)                         │
└─────────────────────────────────────────────────────────────────────┘

React Dashboard (LeadsPage.jsx)
    ↓
    1. GET /api/leads?status=new&limit=20
       Headers: Authorization: Bearer {access_token}
    ↓
FastAPI (api/endpoints/leads.py)
    ↓
    2. @router.get("/leads")
       async def get_leads(
         status: Optional[str] = None,
         limit: int = 20,
         current_user: dict = Depends(get_current_user),
         current_tenant: str = Depends(get_current_tenant)
       ):
    ↓
    3. Build Supabase query
       filters = { 'user_id': f'eq.{current_tenant}' }
       if status: filters['status'] = f'eq.{status}'
       leads = client.get('crm_leads', filters, {'limit': str(limit)})
    ↓
    4. Return JSON response
       { "leads": [...], "total": 45 }
    ↓
React Dashboard
    ↓
    5. Update state: setLeads(leads)
    6. Render leads in table component

┌─────────────────────────────────────────────────────────────────────┐
│ SCENARIO 2: UPDATING LEAD (Dashboard → Write)                        │
└─────────────────────────────────────────────────────────────────────┘

React Dashboard (EditLeadModal.jsx)
    ↓
    1. User edits lead status: new → contacted
       PATCH /api/leads/{lead_id}
       Body: { status: "contacted", notes: "Called via WhatsApp" }
    ↓
FastAPI (api/endpoints/leads.py)
    ↓
    2. @router.patch("/leads/{lead_id}")
       async def update_lead(
         lead_id: int,
         request: LeadUpdateRequest,
         current_tenant: str = Depends(get_current_tenant)
       ):
    ↓
    3. Verify tenant ownership
       existing = client.get('crm_leads', {'id': f'eq.{lead_id}'}, single=True)
       if existing['user_id'] != current_tenant:
         raise HTTPException(403, "Access denied")
    ↓
    4. Update in Supabase
       client.patch('crm_leads', lead_id, {
         'status': request.status,
         'metadata': { **existing['metadata'], 'notes': request.notes },
         'updated_at': now()
       })
    ↓
    5. Log audit event
       client.post('audit_logs', {
         'user_id': current_user['id'],
         'action': 'update_lead',
         'details': { lead_id, old_status, new_status }
       })
    ↓
    6. Return { "success": true, "lead": updated_lead }
    ↓
React Dashboard
    ↓
    7. Update local state: leads.map(...)
    8. Show success toast notification

┌─────────────────────────────────────────────────────────────────────┐
│ SCENARIO 3: REAL-TIME LEAD UPDATE (WhatsApp → Dashboard)              │
└─────────────────────────────────────────────────────────────────────┘

WhatsApp Customer
    ↓
    1. Sends message: "Quero agendar um corte"
    ↓
Evolution API
    ↓
    2. POST /webhook/barberzap-saas
       { instance: { instanceName: "barber_001" }, data: [...] }
    ↓
FastAPI (webhooks/webhook_handler.py)
    ↓
    3. Webhook normalizer extracts:
       - instance_name = "barber_001"
       - sender = "5511999999999"
       - message = "Quero agendar um corte"
    ↓
    4. Resolve tenant
       tenant_id = resolve_tenant("barber_001")  // "d9fd2be40768483b"
    ↓
    5. Upsert lead (CRM)
       upsert_lead(user_id=tenant_id, phone=sender, name="João Silva")
       Returns: { lead_id: 123, action: "created" }
    ↓
    6. Generate AI response (Secretária Universal)
       generate_response(instance_name, phone, message, context)
       Returns: "Claro! Qual horário prefere?"
    ↓
    7. Log messages to CRM
       log_message(lead_id=123, direction='inbound', message="Quero agendar...")
       log_message(lead_id=123, direction='outbound', message="Claro!...")
    ↓
    8. Send WhatsApp response (Evolution API)
       send_message("barber_001", "5511999999999", "Claro!...")
    ↓
    9. PUSH NOTIFICATION TO DASHBOARD (NEW!)
       WebSocket Manager broadcasts to tenant room:
       {
         "event": "new_lead",
         "tenant_id": "d9fd2be40768483b",
         "data": {
           "lead_id": 123,
           "name": "João Silva",
           "phone": "5511999999999",
           "message": "Quero agendar um corte",
           "timestamp": "2026-02-23T18:38:00Z"
         }
       }
    ↓
React Dashboard (user is viewing dashboard)
    ↓
   10. WebSocket receives event
       websocket.onmessage = (event) => {
         const data = JSON.parse(event.data)
         if (data.event === 'new_lead') {
           add
           lead to state
           showNotification("Novo lead: João Silva")
         }
       }
    ↓
   11. UI updates automatically
       - New lead appears in table (no refresh needed)
       - Lead counter increments: "Leads hoje: 45 → 46"
       - Browser notification: "Novo lead recebido!"
```

---

## 🔌 API REQUIREMENTS

### Authentication APIs

#### POST /auth/login
**Purpose**: User authentication (email/password via JWT)

**Request**:
```json
{
  "email": "barbearia@test.com",
  "password": "securepassword123"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "d9fd2be4-0768-483b-b122-b60277335e2a",
    "email": "barbearia@test.com",
    "role": "barbearia",
    "tenant_id": "d9fd2be4-0768-483b-b122-b60277335e2a",
    "created_at": "2026-02-01T10:00:00Z"
  }
}
```

**Errors**: 
- 401 (invalid credentials)
- 429 (ratelimited)

#### POST /auth/refresh
**Purpose**: Get new access_token using refresh_token

**Request**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...NEW...",
  "token_type": "bearer"
}
```

#### POST /auth/logout
**Purpose**: Invalidate refresh_token

**Request**: 
- Headers: `Authorization: Bearer {access_token}`

**Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

#### GET /auth/me
**Purpose**: Get current user profile

**Headers**: `Authorization: Bearer {access_token}`

**Response (200)**:
```json
{
  "user": {
    "id": "d9fd2be4-0768-483b-b122-b60277335e2a",
    "email": "barbearia@test.com",
    "role": "barbearia",
    "tenant_id": "d9fd2be4-0768-483b-b122-b60277335e2a",
    "created_at": "2026-02-01T10:00:00Z",
    "last_login": "2026-02-23T18:30:00Z"
  }
}
```

### CRUD APIs - Leads

#### GET /api/leads
**Purpose**: List leads with filters (paginated)

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**:
- `status` (optional): `new`|`contacted`|`scheduled`|`converted`|`lost`
- `source` (optional): `whatsapp`|`web`|`manual`
- `limit` (optional, default 20): max 100
- `offset` (optional): for pagination

**Response (200)**:
```json
{
  "leads": [
    {
      "id": 123,
      "user_id": "d9fd2be4-0768-483b-b122-b60277335e2a",
      "name": "João Silva",
      "phone": "5511999999999",
      "status": "new",
      "source": "whatsapp",
      "metadata": { "last_message": "Quero agendar" },
      "created_at": "2026-02-23T18:35:00Z",
      "updated_at": "2026-02-23T18:35:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

#### GET /api/leads/{lead_id}
**Purpose**: Get single lead details

**Response (200)**:
```json
{
  "lead": {
    "id": 123,
    "name": "João Silva",
    "phone": "5511999999999",
    "status": "new",
    "source": "whatsapp",
    "metadata": { "last_message": "Quero agendar" },
    "created_at": "2026-02-23T18:35:00Z",
    "messages": [
      {
        "id": 456,
        "direction": "inbound",
        "message": "Quero agendar um corte",
        "created_at": "2026-02-23T18:35:00Z"
      },
      {
        "id": 457,
        "direction": "outbound",
        "message": "Claro! Qual horário prefere?",
        "created_at": "2026-02-23T18:36:00Z"
      }
    ]
  }
}
```

#### PATCH /api/leads/{lead_id}
**Purpose**: Update lead (status, notes, etc.)

**Request Body**:
```json
{
  "status": "contacted",
  "name": "João Silva Jr.",
  "metadata": {
    "notes": "Called via WhatsApp",
    "next_action": "Follow up tomorrow"
  }
}
```

**Response (200)**:
```json
{
  "success": true,
  "lead": { /* updated lead object */ }
}
```

### CRUD APIs - Barbers

#### GET /api/barbers
**Purpose**: List barbers

**Response (200)**:
```json
{
  "barbers": [
    {
      "id": 1,
      "name": "João Silva",
      "status": "active",
      "user_id": "d9fd2be4-0768-483b-b122-b60277335e2a",
      "created_at": "2026-02-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/barbers
**Purpose**: Create new barber

**Request Body**:
```json
{
  "name": "Pedro Santos",
  "status": "active"
}
```

#### PATCH /api/barbers/{barber_id}
**Purpose**: Update barber

#### DELETE /api/barbers/{barber_id}
**Purpose**: Delete barber (soft delete: status=inactive)

### CRUD APIs - Services

#### GET /api/services
**Purpose**: List services

**Response (200)**:
```json
{
  "services": [
    {
      "id": 1,
      "name": "Corte Masculino",
      "price": 35.00,
      "description": "Corte simples",
      "duration": 30,
      "status": "active"
    }
  ]
}
```

#### POST /api/services
**Purpose**: Create service

**Request Body**:
```json
{
  "name": "Corte + Barba",
  "price": 50.00,
  "description": "Combo corte e barba",
  "duration": 45,
  "status": "active"
}
```

### CRUD APIs - Messages

#### GET /api/messages
**Purpose**: List messages (filtered by lead or date)

**Query Params**:
- `lead_id` (optional)
- `direction` (optional): `inbound`|`outbound`
- `limit`, `offset`

**Response (200)**:
```json
{
  "messages": [
    {
      "id": 456,
      "lead_id": 123,
      "phone": "5511999999999",
      "direction": "inbound",
      "message": "Quero agendar um corte",
      "response": null,
      "metadata": { "ai_model": "nemotron_nano" },
      "created_at": "2026-02-23T18:35:00Z"
    }
  ],
  "total": 120
}
```

#### POST /api/messages/send
**Purpose**: Send WhatsApp message to customer

**Request Body**:
```json
{
  "phone": "5511999999999",
  "message": "Olá João! Seu agendamento está confirmado.",
  "lead_id": 123
}
```

**Response (200)**:
```json
{
  "success": true,
  "message_id": "3EB0FAED6CC5D57E",
  "evolution_api_response": { /* Evolution API response */ }
}
```

### Analytics APIs

#### GET /api/stats/summary
**Purpose**: Dashboard metrics (cards)

**Response (200)**:
```json
{
  "leads_today": 12,
  "leads_week": 45,
  "leads_month": 180,
  "conversion_rate": 0.35,
  "messages_today": 28,
  "messages_week": 125,
  "response_time_avg": "2.5 min",
  "active_leads": 15,
  "new_leads": 12,
  "scheduled_leads": 8,
  "converted_leads": 6
}
```

#### GET /api/stats/leads-trend
**Purpose**: Leads over time (for charts)

**Query Params**:
- `period`: `daily`|`weekly`|`monthly`
- `days` (default 30): number of days to return

**Response (200)**:
```json
{
  "trend": [
    { "date": "2026-02-20", "count": 8 },
    { "date": "2026-02-21", "count": 12 },
    { "date": "2026-02-22", "count": 15 },
    { "date": "2026-02-23", "count": 12 }
  ],
  "total": 47,
  "average": 11.75
}
```

#### GET /api/stats/by-status
**Purpose**: Lead distribution by status

**Response (200)**:
```json
{
  "distribution": [
    { "status": "new", "count": 15, "percentage": 33.3 },
    { "status": "contacted", "count": 8, "percentage": 17.8 },
    { "status": "scheduled", "_count": 10, "percentage": 22.2 },
    { "status": "converted", "count": 8, "percentage": 17.8 },
    { "status": "lost", "count": 4, "percentage": 8.9 }
  ]
}
```

### Configuration APIs

#### GET /api/config
**Purpose**: Get barbershop configuration

**Response (200)**:
```json
{
  "config": {
    "user_id": "d9fd2be4-0768-483b-b122-b60277335e2a",
    "name": "Barbearia do João",
    "address": "Rua das Flores, 123",
    "hours": "Seg-Sex 9h-19h, Sáb 9h-14h",
    "ai_name": "ZapBot",
    "greeting": "Olá! Bem-vindo à Barbearia do João!",
    "phone": "5511999998888",
    "whatsapp": "5511999998888",
    "instance_name": "barber_d9fd2be40768483b"
  }
}
```

#### PATCH /api/config
**Purpose**: Update barbershop configuration

**Request Body**:
```json
{
  "name": "Nova Barbearia",
  "address": "Av. Central, 456",
  "hours": "Seg-Sáb 8h-20h",
  "ai_name": "Atendente Virtual",
  "greeting": "Olá! Como posso ajudar?"
}
```

**Response (200)**:
```json
{
  "success": true,
  "config": { /* updated config */ }
}
```

---

## 📡 DATA FLOW & SYNC

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ COMPLETE DATA FLOW: CUSTOMER INTERACTION                            │
└─────────────────────────────────────────────────────────────────────┘

                     ┌─────────────────┐
                     │   CUSTOMER      │
                     │  (WhatsApp)     │
                     └────────┬────────┘
                              │
                              │ "Quero agendar um corte"
                              ▼
                     ┌─────────────────┐
                     │ EVOLUTION API   │
                     │  - Instance:    │
                     │    barber_001   │
                     └────────┬────────┘
                              │
                              │ POST /webhook/barberzap-saas
                              ▼
            ┌─────────────────────────────────────────┐
            │         WEBHOOK NORMALIZER              │
            │  Extract:                               │
            │  - instance_name: "barber_001"          │
            │  - sender: "5511999999999"              │
            │  - message: "Quero agendar..."          │
            │  - client_name: "João Silva"            │
            └────────┬────────────────────────────────┘
                     │
                     ▼
           ┌───────────────────────────────┐
           │    TENANT RESOLVER            │
           │  instance_name → user_id      │
           │  "barber_001" →               │
           │  "d9fd2be4-0768-483b..."      │
           └────────┬──────────────────────┘
                    │
                    ├───────────────────┐
                    │                   │
                    ▼                   ▼
        ┌─────────────────┐   ┌─────────────────┐
        │ CONTEXT BUILDER │   │  DATABASE:      │
        │ - Load config   │   │  crm_leads      │
        │ - Load barbers  │   │  UPSERT LEAD    │
        │ - Load services │   │  (user_id,      │
        │                 │   │   phone, name)  │
        └────────┬────────┘   └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ AI AGENT        │
        │ Generate:       │
        │ "Claro! Qual    │
        │  horário prefere│
        │  ?"             │
        └────────┬────────┘
                 ├─────────────────┐
                 │                 │
                 ▼                 ▼
    ┌─────────────────────┐  ┌─────────────────┐
    │ DATABASE:           │  │ DATABASE:       │
    │  crm_messages       │  │  crm_messages   │
    │  LOG INBOUND        │  │  LOG OUTBOUND   │
    │  (lead_id, msg)     │  │  (lead_id, resp)│
    └─────────────────────┘  └────────┬────────┘
                                      │
                    ┌─────────────────┴───────────────┐
                    │                                 │
                    ▼                                 ▼
        ┌─────────────────────┐         ┌─────────────────────┐
        │ EVOLUTION API       │         │ WEBSOCKET           │
        │ Send WhatsApp       │         │ (Real-time Push)    │
        │ response            │         │ {                   │
        │                     │         │   event: "new_lead" │
        │ "Claro! Qual..."    │         │   tenant_id: "..."  │
        └─────────────────────┘         │   data: {...}       │
                                      │ }                   │
                                      └──────┬──────────────┘
                                             │
                    ┌────────────────────────┴───────────────┐
                    │                                        │
                    ▼                                        ▼
        ┌─────────────────────┐               ┌─────────────────────┐
        │ CUSTOMER            │               │ DASHBOARD         │
        │ Receives response   │               │ (React)           │
        │ on WhatsApp         │               │ - New lead toast   │
        │                     │               │ - Table update     │
        │                     │               │ - Counter update   │
        └─────────────────────┘               └─────────────────────┘
```

### Real-time Sync Options

#### Option 1: WebSocket (Recommended)

**Advantages**:
- ✅ Bi-directional communication
- ✅ Low latency (instant updates)
- ✅ Efficient (no polling overhead)
- ✅ Can handle multiple connection types

**Implementation**:

```python
# backend: websockets/websocket_manager.py
from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # { tenant_id: { websocket1, websocket2, ... } }

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = set()
        self.active_connections[tenant_id].add(websocket)
        logger.info(f"WebSocket connected: tenant={tenant_id}")

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        self.active_connections[tenant_id].discard(websocket)
        logger.info(f"WebSocket disconnected: tenant={tenant_id}")

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        if tenant_id in self.active_connections:
            # Convert dict to JSON
            message_json = json.dumps(message)
            
            # Broadcast to all connections for this tenant
            for connection in self.active_connections[tenant_id]:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error sending to WebSocket: {e}")

# Global manager instance
manager = WebSocketManager()

# FastAPI endpoint
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str  # JWT token for auth
):
    # Verify JWT token
    user = verify_jwt_token(token)
    tenant_id = user.get('sub')
    
    await manager.connect(websocket, tenant_id)
    
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except:
        manager.disconnect(websocket, tenant_id)
```

**Frontend usage**:

```javascript
// services/websocket.js
class WebSocketClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const wsUrl = `wss://api.barberzap.com/ws?token=${this.token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(data) {
    // Emit custom events
    if (data.event === 'new_lead') {
      window.dispatchEvent(new CustomEvent('new-lead', { detail: data }));
    } else if (data.event === 'new_message') {
      window.dispatchEvent(new CustomEvent('new-message', { detail: data }));
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage in component
export default function DashboardPage() {
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const wsClient = new WebSocketClient(token);
    wsClient.connect();

    // Listen for custom events
    const handleNewLead = (event) => {
      const lead = event.detail.data;
      showNotification(`Novo lead: ${lead.name}`);
      // Refresh leads list
      fetchLeads();
    };

    window.addEventListener('new-lead', handleNewLead);

    return () => {
      wsClient.disconnect();
      window.removeEventListener('new-lead', handleNewLead);
    };
  }, []);
}
```

#### Option 2: Server-Sent Events (Simpler)

**Advantages**:
- ✅ One-way communication (server → client) - sufficient for dashboard
- ✅ Simpler than WebSocket
- ✅ Built-in reconnection handling
- ✅ Uses HTTP (works behind proxies)

**Implementation**:

```python
# backend: api/endpoints/sse.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from starlette.requests import Request

router = APIRouter()

@router.get("/api/events")
async def events_endpoint(
    request: Request,
    current_user = Depends(get_current_user)
):
    async def event_generator():
        tenant_id = current_user['sub']
        
        # Keep connection open
        while True:
            # Check for new events (queue-based)
            events = get_pending_events(tenant_id)
            
            for event in events:
                yield f"event: {event['type']}\n"
                yield f"data: {json.dumps(event['data'])}\n\n"
            
            # Heartbeat every 30s
            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
```

**Frontend usage**:

```javascript
const eventSource = new EventSource('/api/events');

eventSource.addEventListener('new-lead', (event) => {
  const lead = JSON.parse(event.data);
  showNotification(`Novo lead: ${lead.name}`);
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

#### Option 3: Polling (Fallback)

**Advantages**:
- ✅ Simplest to implement
- ✅ Works everywhere (no WebSocket/SSE support needed)

**Disadvantages**:
- ❌ Higher latency (updates delayed between polls)
- ❌ More server load (HTTP requests every few seconds)
- ❌ Not truly real-time

**Implementation**:

```javascript
// Simple polling
setInterval(() => {
  fetchLeads()
}, 5000); // Poll every 5 seconds
```

### Conflict Resolution Strategy

#### Scenario: Concurrent Updates

**Problem**: User A and User B both edit the same lead simultaneously

```
Time  | User A                          | User B
------|--------------------------------|---------------------------------
T1    | GET /api/leads/123             | GET /api/leads/123
      | status: "new"                  | status: "new"
T2    | PATCH /api/leads/123           |
      | status: "contacted"            |
T3    |                                 | PATCH /api/leads/123
      |                                 | status: "scheduled" (based on old data!)
```

**Solution: Optimistic Concurrency Control (Versioning)**

```sql
-- Add version column to crm_leads
ALTER TABLE crm_leads ADD COLUMN version INTEGER DEFAULT 1;

-- Update on every change
UPDATE crm_leads
SET status = 'contacted', version = version + 1
WHERE id = 123 AND version = {old_version};

-- Check if row was updated
-- If rows_affected = 0, then version conflict occurred
```

**API Response on Conflict**:

```json
{
  "error": "conflict",
  "message": "This lead was modified by another user. Please refresh and try again.",
  "current_version": 5,
  "your_version": 4
}
```

**Frontend Handling**:

```javascript
try {
  await updateLead(leadId, { status: 'contacted' });
} catch (error) {
  if (error.message === 'conflict') {
    // Show modal: "Changes detected. Refresh to see latest?"
    confirmRefresh();
    fetchLeads(); // Reload from server
  }
}
```

---

## 📝 IMPLEMENTATION PLAN

### Phase 1: Authentication Foundation (8-10 hours)

**Objective**: Implement JWT-based authentication system

**Backend Tasks**:

1. **Database Migrations** (2 hours)
   ```sql
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       email VARCHAR(255) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       role VARCHAR(50) DEFAULT 'barbearia',
       tenant_id UUID REFERENCES agente_config(user_id),
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW(),
       last_login TIMESTAMPTZ
   );

   CREATE TABLE user_sessions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
       expires_at TIMESTAMPTZ NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE audit_logs (
       id BIGSERIAL PRIMARY KEY,
       user_id UUID REFERENCES users(id),
       action VARCHAR(100) NOT NULL,
       ip_address INET,
       user_agent TEXT,
       success BOOLEAN DEFAULT TRUE,
       details JSONB,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Create Auth Core Module** (2 hours)
   - File: `core/auth.py`
   - Functions:
     - `verify_password()`, `get_password_hash()`
     - `create_access_token()`, `create_refresh_token()`
     - `decode_token()`, `verify_token()`

3. **Create Auth Dependencies** (1 hour)
   - File: `api/dependencies.py`
   - Dependencies:
     - `get_current_user()` - Verify JWT and return user
     - `get_current_tenant()` - Extract and set PostgreSQL session variable

4. **Create Auth Endpoints** (2 hours)
   - File: `api/endpoints/auth.py`
   - Endpoints:
     - `POST /auth/login`
     - `POST /auth/refresh`
     - `POST /auth/logout`
     - `GET /auth/me`

5. **Add Middleware** (1 hour)
   - Auth guard for all protected routes
   - Session variable setting: `SET app.current_tenant_id = ...`

**Frontend Tasks**:

1. **Install Dependencies** (30 minutes)
   ```bash
   npm install react-router-dom jwt-decode axios
   ```

2. **Create Auth Service** (1 hour)
   - File: `src/services/auth.js`
   - Axios instance with JWT interceptor
   - Token refresh logic

3. **Create Auth Context** (1 hour)
   - File: `src/context/AuthContext.jsx`
   - `AuthProvider` component
   - `useAuth()` hook

4. **Create Login Page** (1 hour)
   - File: `src/pages/LoginPage.jsx`
   - Email/password form
   - Error handling

5. **Create Protected Route** (30 minutes)
   - File: `src/components/auth/ProtectedRoute.jsx`
   - Auth guard for dashboard routes

6. **Add Routing** (30 minutes)
   - File: `src/App.jsx`
   - Configure react-router-dom
   - Add login and dashboard routes

**Testing**:

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (401)
- [ ] Token refresh after expiration
- [ ] Logout clears localStorage
- [ ] Protected route redirects to login if not authenticated

---

### Phase 2: Backend CRUD APIs (12-16 hours)

**Objective**: Implement all CRUD operations for leads, barbers, services, messages

**Tasks**:

1. **Leads APIs** (4 hours)
   - `GET /api/leads` (with filters, pagination)
   - `GET /api/leads/{lead_id}`
   - `PATCH /api/leads/{lead_id}`
   - `DELETE /api/leads/{lead_id}` (soft delete)

2. **Barbers APIs** (2 hours)
   - `GET /api/barbers`
   - `POST /api/barbers`
   - `PATCH /api/barbers/{barber_id}`
   - `DELETE /api/barbers/{barber_id}`

3. **Services APIs** (2 hours)
   - `GET /api/services`
   - `POST /api/services`
   - `PATCH /api/services/{service_id}`
   - `DELETE /api/services/{service_id}`

4. **Messages APIs** (2 hours)
   - `GET /api/messages` (with filters)
   - `POST /api/messages/send` (via Evolution API)

5. **Configuration APIs** (2 hours)
   - `GET /api/config`
   - `PATCH /api/config`

**File Structure**:

```
barberzap_python/
├── api/
│   ├── endpoints/
│   │   ├── auth.py          (Phase 1)
│   │   ├── leads.py         (NEW)
│   │   ├── barbers.py       (NEW)
│   │   ├── services.py      (NEW)
│   │   ├── messages.py      (NEW)
│   │   └── config.py        (NEW)
│   ├── models/
│   │   ├── lead.py          (NEW - Pydantic models)
│   │   ├── barber.py        (NEW)
│   │   ├── service.py       (NEW)
│   │   └── message.py       (NEW)
│   └── dependencies.py      (Phase 1 - update)
```

**Testing**:

- [ ] CRUD operations for leads
- [ ] CRUD operations for barbers
- [ ] CRUD operations for services
- [ ] List messages with pagination
- [ ] Send WhatsApp message via API
- [ ] Tenant isolation (can't access other tenant's data)
- [ ] Validation (required fields, data types)

---

### Phase 3: Analytics APIs (6-8 hours)

**Objective**: Implement statistics and trends for dashboard

**Tasks**:

1. **Summary Metrics** (2 hours)
   - `GET /api/stats/summary`
   - Leads today/week/month
   - Conversion rate
   - Messages count
   - Response time average

2. **Leads Trend** (2 hours)
   - `GET /api/stats/leads-trend`
   - Time series data (daily/weekly/monthly)
   - For line charts

3. **Status Distribution** (1 hour)
   - `GET /api/stats/by-status`
   - For pie/donut charts

4. **Response Time** (1 hour)
   - `GET /api/stats/response-time`
   - Average/median/max response times

5. **Cached Queries** (2 hours)
   - Use materialized views or Redis for performance
   - Update on new lead/message

**File**:
- `barberzap_python/api/endpoints/analytics.py`

---

### Phase 4: Frontend Dashboard Components (16-24 hours)

**Objective**: Build complete dashboard UI

**Tasks**:

1. **Dashboard Layout** (2 hours)
   - File: `src/components/dashboard/DashboardLayout.jsx`
   - Sidebar navigation
   - Header with user menu

2. **Dashboard Home** (4 hours)
   - File: `src/pages/DashboardPage.jsx`
   - Metric cards (leads today, conversion rate, etc.)
   - Charts (leads trend, status distribution)
   - Recent leads table

3. **Leads Page** (4 hours)
   - File: `src/pages/LeadsPage.jsx`
   - Leads table with filters
   - Status badges
   - Lead edit modal
   - Send message button

4. **Messages Page** (3 hours)
   - File: `src/pages/MessagesPage.jsx`
   - Message list with filters
   - Message thread view
   - Reply form

5. **Settings Page** (3 hours)
   - File: `src/pages/SettingsPage.jsx`
   - Barbershop configuration form
   - Barbers management
   - Services management
   - AI settings

6. **Install Charts Library** (30 minutes)
   ```bash
   npm install recharts  # Chart library for React
   ```

7. **Create Chart Components** (4 hours)
   - Leads trend line chart
   - Status distribution pie chart
   - Response time bar chart

**File Structure**:

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── MetricCard.jsx
│   │   ├── LeadsTable.jsx
│   │   ├── MessageThread.jsx
│   │   ├── LeadEditModal.jsx
│   │   └── charts/
│   │       ├── LeadsTrendChart.jsx
│   │       ├── StatusPieChart.jsx
│   │       └── ResponseTimeChart.jsx
│   └── auth/
│       ├── ProtectedRoute.jsx
│       └── AuthContext.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── LeadsPage.jsx
│   ├── MessagesPage.jsx
│   └── SettingsPage.jsx
└── services/
    ├── api.js
    └── auth.js
```

---

### Phase 5: Real-time Sync (4-6 hours)

**Objective**: Implement WebSocket for real-time dashboard updates

**Backend Tasks**:

1. **WebSocket Manager** (2 hours)
   - File: `websockets/websocket_manager.py`
   - Connection management
   - Tenant-based rooms
   - Broadcast methods

2. **WebSocket Endpoint** (1 hour)
   - File: `main.py`
   - `/ws` endpoint
   - JWT authentication for WebSocket

3. **Trigger Push Events** (1 hour)
   - Update webhook handler to broadcast on new lead
   - Broadcast on new message
   - Broadcast on lead status change

**Frontend Tasks**:

1. **WebSocket Client Class** (1 hour)
   - File: `src/services/websocket.js`
   - Connection handling
   - Reconnect logic
   - Custom event dispatch

2. **Integrate with Dashboard** (30 minutes)
   - Listen for `new-lead` event
   - Listen for `new-message` event
   - Show notifications

---

### Phase 6: Security & Hardening (4-6 hours)

**Objective**: Implement security best practices

**Tasks**:

1. **Rate Limiting** (1 hour)
   ```bash
   pip install slowapi
   ```
   - Login: 5 attempts/minute
   - API: 100 requests/minute

2. **Webhook Secret** (1 hour)
   - Add `WEBHOOK_SECRET` to env
   - Validate webhook signature
   - Prevent spam webhooks

3. **Input Validation** (1 hour)
   - Pydantic models for all requests
   - Sanitize inputs

4. **Audit Logging** (1 hour)
   - Log all auth events
   - Log all CRUD operations
   - Log API access

5. **CORS Configuration** (30 minutes)
   - Restrict to production domain
   - Remove wildcard `*` in production

6. **JWT Security** (30 minutes)
   - Strong secret key
   - Secure token expiration
   - Store in httpOnly cookies (optional)

---

### Phase 7: Testing (8-12 hours)

**Objective**: Comprehensive test coverage

**Backend Tests**:

1. **Auth Tests** (2 hours)
   ```python
   # tests/test_auth.py
   - test_login_success()
   - test_login_invalid_credentials()
   - test_refresh_token()
   - test_logout()
   - test_protected_route_without_token()
   ```

2. **CRUD Tests** (3 hours)
   ```python
   # tests/test_crud.py
   - test_create_lead()
   - test_get_leads_paginated()
   - test_update_lead()
   - test_delete_lead()
   - test_tenant_isolation()
   ```

3. **Integration Tests** (2 hours)
   ```python
   # tests/test_integration.py
   - test_webhook_creates_lead()
   - test_dashboard_can_view_lead()
   - test_realtime_push()
   ``

**Frontend Tests**:

1. **Component Tests** (2 hours)
   ```javascript
   // tests/components/LoginPage.test.jsx
   - renders without errors
   - submits login form correctly
   - shows error on invalid credentials

   // tests/components/LeadsTable.test.jsx
   - displays leads list
   - filters by status
   - opens edit modal
   ```

2. **Integration Tests** (1 hour)
   ```javascript
   // tests/integration/DashboardFlow.test.jsx
   - login → navigate to dashboard → view leads
   - update lead status → table update
   ```

**E2E Tests** (2 hours):
```javascript
// Playwright/Cypress tests
- test_complete_flow.spec.js
- Create test user
- Login
- Create lead via webhook
- Verify lead appears in dashboard
- Update lead status
- Verify status changed
```

---

### Phase 8: Deployment (4-6 hours)

**Objective**: Deploy to production

**Backend Deployment** (3 hours):

1. **Environment Configuration**
   ```bash
   # .env.production
   APP_ENV=production
   JWT_SECRET_KEY="<strong-random-256-bit>"
   SUPABASE_URL="..."
   SUPABASE_KEY="..."
   EVOLUTION_API_URL="..."
   WEBHOOK_SECRET="..."
   ALLOWED_ORIGINS="https://dashboard.barberzap.com"
   ```

2. **Docker Setup**
   ```dockerfile
   # Dockerfile
   FROM python:3.11-slim
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

3. **Database Migrations**
   ```bash
   # Run migrations on Supabase
   psql -U postgres -d barberzap < migrations/001_initial.sql
   psql -U postgres -d barberzap < migrations/002_add_users.sql
   ```

4. **Production Server**
   - Use Gunicorn (Uvicorn workers)
   - SSL certificate (Let's Encrypt)
   - Nginx reverse proxy

**Frontend Deployment** (1-2 hours):

1. **Build for Production**
   ```bash
   npm run build
   # Output: dist/
   ```

2. **Environment Variables**
   ```bash
   # .env.production
   VITE_API_URL="https://api.barberzap.com"
   ```

3. **Deploy to CDN**
   - Vercel, Netlify, or Cloudflare Pages
   - Configure build commands

4. **Domain Configuration**
   - dashboard.barberzap.com → frontend
   - api.barberzap.com → backend

---

## 🚨 RISKS & MITIGATION

### Risk 1: Concurrent Write Conflicts

**Description**: Multiple users editing the same lead simultaneously

**Impact**: Data inconsistency, lost updates

**Mitigation**:
1. **Optimistic Concurrency Control**
   - Add `version` column to tables
   - Check version on update
   - Return 409 Conflict if version mismatch

2. **Last-Write-Wins with Audit**
   - Allow updates but log who changed what
   - Show change history in UI

3. **Pessimistic Locking (for critical updates)**
   - Lock row when user starts editing
   - Show "being edited by X" to other users

### Risk 2: WebSocket Connection Issues

**Description**: WebSocket disconnects, browser compatibility

**Impact**: Real-time updates stop working

**Mitigation**:
1. **Automatic Reconnection**
   - Exponential backoff: 1s, 2s, 4s, 8s, ...
   - Give up after 5 attempts, fallback to polling

2. **Graceful Degradation**
   - If WebSocket fails, use Server-Sent Events
   - If SSE fails, use polling (5-10 seconds)

3. **Heartbeat**
   - Send ping every 30s
   - Close connection if no pong

4. **Browser Fallback**
   - Check WebSocket support
   - Fallback to EventSource (SSE) on IE11

### Risk 3: Race Conditions in Webhook Processing

**Description**: Multiple webhooks for same message arrive quickly

**Impact**: Duplicate leads, duplicate messages

**Mitigation**:
1. **Idempotent Operations**
   - Use `upsert_lead()` instead of `create_lead()`
   - Check if message already logged

2. **Deduplication by WhatsApp message ID**
   ```python
   # Use Evolution API message ID as deduplication key
   message_id = message_obj['key']['id']  # "3EB0FAED6CC5D57E"
   existing = client.get('crm_messages', {
     'message_id': f'eq.{message_id}'
   })
   if existing:
     return # Skip duplicate
   ```

3. **Rate Limiting on Webhook**
   - 10 webhooks/second per instance
   - Queue excess webhooks

### Risk 4: Auth Security Vulnerabilities

**Description**: JWT theft, XSS attacks, CSRF

**Impact**: Unauthorized access, data breach

**Mitigation**:
1. **JWT Best Practices**
   - Short expiration: 30 minutes (access), 7 days (refresh)
   - Strong secret key (256-bit random)
   - Include tenant_id in token claims
   - Never store sensitive data in JWT

2. **XSS Protection**
   - Sanitize all user inputs
   - Use Content Security Policy headers
   - Escape HTML in React (default)

3. **CSRF Protection**
   - Use httpOnly cookies for refresh tokens
   - Check Origin/Referer headers
   - Use CSRF tokens for state-changing operations

4. **Session Management**
   - Invalidate refresh tokens on logout
   - One refresh token per user
   - IP address validation (optional)

5. **Rate Limiting**
   - Login: 5 attempts/minute
   - Password reset: 3 attempts/hour
   - API: 100 requests/minute

### Risk 5: Performance with Large Datasets

**Description**: 10k+ leads, slow queries, dashboard lag

**Impact**: Poor user experience, timeouts

**Mitigation**:
1. **Database Indexing**
   ```sql
   CREATE INDEX idx_leads_user_tenant ON crm_leads(user_id, tenant_id);
   CREATE INDEX idx_leads_status_date ON crm_leads(status, created_at DESC);
   CREATE INDEX idx_messages_lead_date ON crm_messages(lead_id, created_at DESC);
   ```

2. **Pagination**
   - Never return all records
   - Default limit: 20, max: 100
   - Use cursor-based pagination for better UX

3. **Caching**
   - Cache summary stats (Redis or materialized view)
   - Refresh every 5 minutes
   - Invalidate on new lead/message

4. **Materialized Views for Analytics**
   ```sql
   CREATE MATERIALIZED VIEW leads_summary AS
   SELECT 
     user_id,
     user_id,
     date_trunc('day', created_at) as date,
     count(*) filter (where status = 'new') as new_leads,
     count(*) filter (where status = 'converted') as converted,
     count(*) as total
   FROM crm_leads
   GROUP BY user_id, date_trunc('day', created_at);

   CREATE INDEX idx_leads_summary_user_date ON leads_summary(user_id, date);

   -- Refresh every 5 minutes
   REFRESH MATERIALIZED VIEW CONCURRENTLY leads_summary;
   ```

5. **Lazy Loading**
   - Load leads on scroll vs all at once
   - Defer loading message history until lead clicked

### Risk 6: WebSocket Memory Leaks

**Description**: Accumulating connections, not cleaning up

**Impact**: Server crashes, memory exhaustion

**Mitigation**:
1. **Connection Cleanup**
   - Remove connection on `onclose` event
   - Ping/pong heartbeat (30s)
   - Expire idle connections (5 min)

2. **Connection Limits**
   - Max 10 connections per tenant
   - Max 1000 connections total
   - Return error when limit reached

3. **Monitoring**
   - Log connection count
   - Alert if connections > threshold
   - Monitor memory usage

### Risk 7: Database Deadlocks

**Description**: Concurrent updates causing PostgreSQL deadlocks

**Impact**: Transactions fail, errors in dashboard

**Mitigation**:
1. **Transaction Order**
   - Always update tables in same order
   - Example: leads → messages (never messages → leads)

2. **Timeouts**
   ```python
   # Set transaction timeout
   SET statement_timeout = 5000;  -- 5 seconds
   ```

3. **Retry Logic**
   ```python
   # Retry on deadlock (SQLSTATE 40P01)
   for attempt in range(3):
     try:
       execute_query()
       break
     except DeadlockError:
       sleep(100 * (attempt + 1))  # Backoff
   ```

4. **Avoid Long Transactions**
   - Break large updates into batches
   - Commit frequently

---

## 🧪 TESTING STRATEGY

### Test Pyramid

```
        /\
       /E2E\       5%  (End-to-end)
      /------\
     / Integration \  15%  (API + DB + WebSocket)
    /--------------\
   /     Unit Tests \  80%  (Component + Function)
  /------------------\
```

### Unit Tests (Backend)

**Tools**: `pytest`, `pytest-asyncio`

**Coverage**: 80%+

**Example: Auth Tests**

```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/auth/login", json={
        "email": "test@test.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_invalid_credentials():
    response = client.post("/auth/login", json={
        "email": "test@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

def test_protected_route_without_token():
    response = client.get("/api/leads")
    assert response.status_code == 401

def test_protected_route_with_token(test_user):
    token = create_test_token(test_user)
    response = client.get("/api/leads", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
```

### Integration Tests

**Scenario**: Webhook → Lead Creation → Dashboard Display

```python
# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient

def test_complete_lead_flow(client, test_tenant):
    # Step 1: Send webhook (simulating WhatsApp message)
    webhook_payload = {
        "event": "messages.upsert",
        "instance": {"instanceName": test_tenant['instance_name']},
        "data": [{
            "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
            "message": {"conversation": "Quero agendar um corte"},
            "pushName": "João Silva"
        }]
    }
    
    response = client.post("/webhook/barberzap-saas", json=webhook_payload)
    assert response.status_code == 200
    assert response.json()["success"] == True

    # Step 2: Verify lead created in database
    from integrations.supabase_rest import get_client
    db = get_client()
    leads = db.get('crm_leads', {'user_id': f'eq.{test_tenant["user_id"]}'})
    assert len(leads) == 1
    assert leads[0]['name'] == "João Silva"
    assert leads[0]['phone'] == "5511999999999"
    
    lead_id = leads[0]['id']
    
    # Step 3: Verify lead accessible via API (dashboard)
    token = create_test_token(test_tenant)
    response = client.get(f"/api/leads/{lead_id}", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    assert response.json()["lead"]["name"] == "João Silva"
    
    # Step 4: Update lead via API
    response = client.patch(f"/api/leads/{lead_id}", 
        json={"status": "contacted"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    
    # Step 5: Verify update
    response = client.get(f"/api/leads/{lead_id}", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.json()["lead"]["status"] == "contacted"
```

### Component Tests (Frontend)

**Tools**: `vitest`, `@testing-library/react`

**Example: Leads Table Component**

```javascript
// tests/components/LeadsTable.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadsTable } from '@/components/dashboard/LeadsTable';

describe('LeadsTable', () => {
  const mockLeads = [
    { id: 1, name: 'João Silva', phone: '5511999999999', status: 'new', created_at: '2026-02-23' },
    { id: 2, name: 'Maria Santos', phone: '5511888888888', status: 'contacted', created_at: '2026-02-22' }
  ];

  it('renders leads list', () => {
    render(<LeadsTable leads={mockLeads} />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('filters by status', () => {
    render(<LeadsTable leads={mockLeads} />);
    
    const filter = screen.getByLabelText('Status');
    fireEvent.change(filter, { target: { value: 'new' } });
    
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('opens edit modal on row click', () => {
    const onEdit = jest.fn();
    render(<LeadsTable leads={mockLeads} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('João Silva'));
    expect(onEdit).toHaveBeenCalledWith(1);
  });
});
```

### E2E Tests

**Tools**: Playwright

**Scenario: Full User Journey**

```javascript
// e2e/dashboard.spec.js
import { test, expect } from '@playwright/test';

test('complete dashboard flow', async ({ page }) => {
  // Step 1: Login
  await page.goto('https://dashboard.barberzap.com/login');
  await page.fill('input[name="email"]', 'test@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Step 2: Verify redirected to dashboard
  await expect(page).toHaveURL('https://dashboard.barberzap.com/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
  
  // Step 3: View leads
  await page.click('text=Leads');
  await expect(page.locator('table tbody tr')).toHaveCount(2);
  
  // Step 4: Update lead status
  await page.click('tr:first-child button:has-text("Editar")');
  await page.selectOption('select[name="status"]', 'contacted');
  await page.click('button:has-text("Salvar")');
  
  // Step 5: Verify update
  await expect(page.locator('tr:first-child td:nth-child(4)')).toContainText('contactado');
  
  // Step 6: Send message
  await page.click('text=Mensagens');
  await page.click('button:has-text("Nova Mensagem")');
  await page.fill('input[name="phone"]', '5511999999999');
  await page.fill('textarea[name="message"]', 'Olá! Seu agendamento está confirmado.');
  await page.click('button:has-text("Enviar")');
  
  // Step 7: Verify message sent
  await expect(page.locator('.toast')).toContainText('Mensagem enviada');
  
  // Step 8: Logout
  await page.click('button:has-text("Sair")');
  await expect(page).toHaveURL('https://dashboard.barberzap.com/login');
});
```

### Load Testing

**Tools**: Locust

```python
# locustfile.py
from locust import HttpUser, task, between

class DashboardUser(HttpUser):
    wait_time = between(5, 15)
    
    def on_start(self):
        # Login
        response = self.client.post("/auth/login", json={
            "email": "test@test.com",
            "password": "password123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(5)
    def view_leads(self):
        self.client.get("/api/leads", headers=self.headers)
    
    @task(3)
    def view_dashboard(self):
        self.client.get("/api/stats/summary", headers=self.headers)
    
    @task(2)
    def view_messages(self):
        self.client.get("/api/messages", headers=self.headers)
    
    @task(1)
    def update_lead(self):
        # Get a lead and update it
        leads = self.client.get("/api/leads", headers=self.headers).json()["leads"]
        if leads:
            lead_id = leads[0]["id"]
            self.client.patch(f"/api/leads/{lead_id}", 
                json={"status": "contacted"},
                headers=self.headers
            )
```

**Run**:
```bash
locust -f locustfile.py --users=100 --spawn-rate=10 --host=https://api.barberzap.com
```

**Targets**:
- 10 concurrent users: < 500ms response time
- 100 concurrent users: < 2s response time
- 1000 concurrent users: < 5s response time

---

## 🚀 DEPLOYMENT STRATEGY

### Environment Setup

### Development Environment

```bash
# Backend
cd barberzap_python
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy env example
cp .env.example .env
# Edit .env with local Supabase credentials

# Run
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

```bash
# Frontend
cd Barberzap-Dev
npm install
cp .env.example .env.local
# Edit .env.local with API URL

# Run
npm run dev
```

### Staging Environment

**Purpose**: Mirror production, test with real data

**Infrastructure**:
- Separate Supabase project (or schema in same project)
- Separate Evolution API instance
- Test data only

**Deployment**:
```bash
# Create staging database
psql -U postgres < migrations/all.sql

# Deploy backend
git checkout staging
docker build -t barberzap-api:staging .
docker run -d -p 8001:8000 \
  -e APP_ENV=staging \
  --name barberzap-api-staging \
  barberzap-api:staging

# Deploy frontend
npm run build
netlify deploy --site=dist --alias=staging
```

### Production Environment

#### Backend Deployment

**Option 1: Docker + Nginx**

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Expose port
EXPOSE 8000

# Run with gunicorn
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
```

```bash
# Build and push
docker build -t barberzap/api:latest .
docker tag barberzap/api:latest registry.barberzap.com/barberzap/api:latest
docker push registry.barberzap.com/barberzap/api:latest

# Deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: barberzap-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: barberzap-api
  template:
    metadata:
      labels:
        app: barberzap-api
    spec:
      containers:
      - name: api
        image: registry.barberzap.com/barberzap/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: APP_ENV
          value: "production"
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: barberzap-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**Option 2: Cloud Run (Google Cloud)**

```bash
# Build
gcloud builds submit --tag gcr.io/PROJECT-ID/barberzap-api

# Deploy
gcloud run deploy barberzap-api \
  --image gcr.io/PROJECT-ID/barberzap-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=production,JWT_SECRET_KEY=xxx...
```

**Option 3: Railway / Render / Fly.io**

```bash
# Deploy with single command
railway up
# or
deployctl deploy --project barberzap-api
```

#### Frontend Deployment

**Option 1: Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

```
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "https://api.barberzap.com"
  }
}
```

**Option 2: Cloudflare Pages**

```bash
# Deploy
npm run build
npx wrangler pages publish dist --project-name barberzap-dashboard
```

**Option 3: Netlify**

```bash
# Deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Database Migrations

**Strategy**: Version-based migrations

```bash
migrations/
├── 001_initial_schema.sql
├── 002_whatsapp_instances.sql
├── 003_crm_tables.sql
├── 004_users_tables.sql
├── 005_analytics_views.sql
└── 006_indexes.sql
```

**Migration Script**

```python
# scripts/migrate.py
import psycopg2
from pathlib import Path

def run_migrations():
    conn = psycopg2.connect("...")
    cur = conn.cursor()
    
    # Create migrations table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    # Get executed migrations
    cur.execute("SELECT filename FROM migrations")
    executed = {row[0] for row in cur.fetchall()}
    
    # Run new migrations
    for migration_file in sorted(Path("migrations/").glob("*.sql")):
        if migration_file.name not in executed:
            print(f"Running: {migration_file.name}")
            with open(migration_file) as f:
                cur.execute(f.read())
            cur.execute("INSERT INTO migrations (filename) VALUES (%s)", 
                       (migration_file.name,))
            conn.commit()
    
    conn.close()

if __name__ == "__main__":
    run_migrations()
```

#### CI/CD Pipeline

**GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd barberzap_python
          pip install -r requirements.txt
          pip install pytest pytest-asyncio
      
      - name: Run tests
        run: |
          cd barberzap_python
          pytest tests/ -v

      - name: Run frontend tests
        run: |
          cd Barberzap-Dev
          npm ci
          npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Build and push Docker image
          docker build -t barberzap/api:${{ github.sha }} ./barberzap_python
          docker push barberzap/api:${{ github.sha }}
          
          # Deploy to Kubernetes
          kubectl set image deployment/barberzap-api \
            api=barberzap/api:${{ github.sha }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./Barberzap-Dev
```

#### Monitoring & Logging

**Application Monitoring**

```python
# monitoring/health.py
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Response

# Metrics
lead_counter = Counter('leads_total', 'Total leads', ['status'])
api_latency = Histogram('api_latency_seconds', 'API latency', ['endpoint'])

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

**Centralized Logging**

```python
# Logging setup
import logging
from logging.handlers import RotatingFileHandler

logging.basicConfig(
    level=logging.INFO,
    handlers=[
        RotatingFileHandler('app.log', maxBytes=10*1024*1024, backupCount=5),
        logging.StreamHandler()
    ],
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Or send to external service (DataDog, LogRocket, Sentry)
import sentry_sdk
sentry_sdk.init(
    dsn="...",
    traces_sample_rate=0.1
)
```

**Health Checks**

```python
@app.get("/health")
def health_check():
    checks = {
        "database": check_database(),
        "supabase": check_supabase(),
        "evolution_api": check_evolution_api(),
        "websocket": check_websocket()
    }
    
    all_ok = all(checks.values())
    status_code = 200 if all_ok else 503
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if all_ok else "unhealthy",
            "checks": checks
        }
    )
```

---

## 📊 SUMMARY & NEXT STEPS

### Implementation Priorities

**Phase 1: Foundation** (Critical - Must Have)
1. ✅ Authentication system (JWT, login, logout)
2. ✅ Backend CRUD APIs (leads, barbers, services)
3. ✅ Frontend basic dashboard (leads list, stats cards)

**Estimated Time**: 40-48 hours

**Phase 2: Enhanced Features** (High Priority - Should Have)
4. ✅ Real-time sync (WebSocket)
5. ✅ Advanced analytics (charts, trends)
6. ✅ Message management module

**Estimated Time**: 20-24 hours

**Phase 3: Polish** (Nice to Have)
7. ✅ Appointment scheduling UI
8. ✅ Export reports (CSV/PDF)
9. ✅ Advanced filtering and search

**Estimated Time**: 12-16 hours

**Total Estimated Time**: 72-88 hours (9-11 working days)

### Technology Stack Recommendations

**Backend**:
- Framework: FastAPI ✅ (already in use)
- Database: Supabase (PostgreSQL) ✅ (already in use)
- Auth: JWT with python-jose ✅
- Real-time: WebSocket (native FastAPI)
- Monitoring: Prometheus + Grafana optional
- Testing: pytest for backend

**Frontend**:
- Framework: React + Vite ✅ (already in use)
- Routing: react-router-dom
- State Management: React Context (for auth) + React Query (for server state)
- Charts: Recharts
- HTTP Client: Axios
- Real-time: native WebSocket API
- Styling: Tailwind CSS ✅ (already in use)
- Testing: Vitest + Testing Library

**Infrastructure**:
- Backend Containers: Docker
- Orchestration: Kubernetes / Cloud Run
- Frontend Hosting: Vercel / Netlify
- CI/CD: GitHub Actions
- Database: Supabase Managed PostgreSQL

### Implementation Checklist

**Backend**
- [ ] Create users table migration
- [ ] Create auth module (JWT functions)
- [ ] Create auth dependencies
- [ ] Implement /auth/login endpoint
- [ ] Implement /auth/refresh endpoint
- [ ] Implement /auth/logout endpoint
- [ ] Implement /auth/me endpoint
- [ ] Create auth middleware
- [ ] Implement /api/leads CRUD
- [ ] Implement /api/barbers CRUD
- [ ] Implement /api/services CRUD
- [ ] Implement /api/messages CRUD
- [ ] Implement /api/config CRUD
- [ ] Implement /api/stats/* endpoints
- [ ] Add WebSocket manager
- [ ] Add WebSocket endpoint
- [ ] Integrate WebSocket with webhook handler
- [ ] Add rate limiting
- [ ] Add audit logging
- [ ] Write unit tests
- [ ] Write integration tests

**Frontend**
- [ ] Install react-router-dom, axios, jwt-decode
- [ ] Create auth service (Axios instance)
- [ ] Create AuthContext Provider
- [ ] Create LoginPage component
- [ ] Create ProtectedRoute component
- [ ] Create DashboardLayout component
- [ ] Create DashboardPage component (stats cards + charts)
- [ ] Create LeadsPage component (table + filters)
- [ ] Create MessagesPage component
- [ ] Create SettingsPage component
- [ ] Create WebSocket client class
- [ ] Integrate real-time updates
- [ ] Add loading/error states
- [ ] Add toast notifications
- [ ] Write component tests

**Database**
- [ ] Run migrations for users table
- [ ] Run migrations for sessions table
- [ ] Run migrations for audit_logs table
- [ ] Create database indexes
- [ ] Set up Row Level Security policies
- [ ] Create materialized views for analytics

**DevOps**
- [ ] Set up development environment
- [ ] Configure CI/CD pipeline
- [ ] Set up staging environment
- [ ] Configure production deployment
- [ ] Set up SSL certificates
- [ ] Configure CORS for production
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

---

## 📚 REFERENCES

### Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [FastAPI Security (JWT)](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Supabase Python Client](https://supabase.com/docs/reference/python)
- [React Router v6](https://reactrouter.com/en/main)
- [Recharts Documentation](https://recharts.org/)
- [WebSockets in FastAPI](https://fastapi.tiangolo.com/advanced/websockets/)
- [Vite Documentation](https://vitejs.dev/)

### Example Projects

- [FastAPI Full Stack Boilerplate](https://github.com/tiangolo/full-stack-fastapi-postgresql)
- [React Dashboard Templates](https://github.com/flatlogic/react-dashboard)
- [Supabase Auth Examples](https://supabase.com/docs/guides/auth/server-side/python)

---

## 📞 CONTACT & SUPPORT

**Technical Questions**: Refer to this document `/root/Barberzap SITE/docs/DASHBOARD_AUTOMAÇÃO_INTEGRAÇÃO.md`

**Related Documents**:
- `/root/Barberzap SITE/AUTHENTICATION_SYSTEM_ANALYSIS.md` - Auth system analysis
- `/root/Barberzap SITE/barberzap_python/` - Backend code
- `/root/Barberzap SITE/Barberzap-Dev/` - Frontend code

---

**Report Version**: 1.0  
**Created**: 2026-02-23  
**Status**: 🔴 INTEGRATION NOT IMPLEMENTED - ANALYSIS ONLY  

**Next Action**: Review report and begin Phase 1 implementation (Authentication Foundation)
