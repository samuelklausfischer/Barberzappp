# 🔐 Auth System Quick Reference - BarberZap

## TL;DR

**The BarberZap system has NO authentication.** All API endpoints are public.

---

## Current State

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                        │
│  ├─ No login page ❌                                    │
│  ├─ No auth context ❌                                   │
│  ├─ No protected routes ❌                              │
│  └─ Landing page only                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI)                                       │
│  ├─ No auth endpoints ❌                                │
│  ├─ No JWT tokens ❌                                    │
│  ├─ All APIs are PUBLIC ❌                              │
│  └─ Webhook-based only                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  DATABASE (Supabase)                                     │
│  ├─ No users table ❌                                   │
│  ├─ No sessions table ❌                                │
│  └─ agente_config as main tenant table                   │
└─────────────────────────────────────────────────────────┘
```

---

## How it Currently Works

### Multi-Tenant Identification (Not Auth)

```
WhatsApp → Evolution API → Webhook (instance_name) → Tenant ID
```

**Code:**
```python
# core/tenant_resolver.py
def resolve_tenant(instance_name: str) -> str:
    # Database lookup: instance_name → user_id
    result = client.get('whatsapp_instances', 
                       {'instance_name': f'eq.{instance_name}'}, 
                       single=True)
    return result.get('user_id')
```

**This is NOT authentication - it's data identification!**

---

## What's Missing

### Backend (Python)

| Component | Status |
|-----------|--------|
| `POST /auth/login` | ❌ Missing |
| `POST /auth/logout` | ❌ Missing |
| `POST /auth/refresh` | ❌ Missing |
| JWT tokens | ❌ Missing |
| Password hashing | ❌ Missing |
| Auth middleware | ❌ Missing |
| Protected endpoints | ❌ Missing |
| Users table | ❌ Missing |

### Frontend (React)

| Component | Status |
|-----------|--------|
| `LoginPage.jsx` | ❌ Missing |
| `AuthContext.jsx` | ❌ Missing |
| `ProtectedRoute.jsx` | ❌ Missing |
| Token storage | ❌ Missing |
| Token refresh | ❌ Missing |
| Dashboard route | ❌ Missing |

---

## Security Risks

| Risk | Severity | Description |
|------|----------|-------------|
| No API authentication | 🔴 CRITICAL | Anyone can access all data |
| No login system | 🔴 CRITICAL | No dashboard access control |
| Public webhooks | 🔴 CRITICAL | Spam/abuse vulnerability |
| Tenant enumeration | 🟡 MEDIUM | Can discover all tenants |
| No rate limiting | 🟡 MEDIUM | DDoS vulnerability |
| No audit logging | 🟡 MEDIUM | Can't track access |

---

## Implementation Quick Start

### Step 1: Add Packages

**Backend (requirements.txt):**
```txt
python-jose[cryptography]
passlib[bcrypt]
python-multipart
slowapi
```

**Frontend (package.json):**
```json
{
  "dependencies": {
    "react-router-dom": "^6.0",
    "jwt-decode": "^4.0",
    "axios": "^1.6"
  }
}
```

### Step 2: Create Database Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'barbearia',
    tenant_id UUID REFERENCES agente_config(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Add Auth to Backend

```python
# core/auth.py
from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

```python
# api/dependencies.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from core.auth import decode_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload
```

### Step 4: Protect API Endpoints

```python
# Before (NO AUTH):
@app.get("/api/tenant/{tenant_id}")
async def get_tenant(tenant_id: str):
    return {...}

# After (WITH AUTH):
from api.dependencies import get_current_user

@app.get("/api/tenant/{tenant_id}")
async def get_tenant(
    tenant_id: str,
    user: dict = Depends(get_current_user)
):
    # Validate tenant ownership
    if tenant_id != user.get("sub"):
        raise HTTPException(status_code=403, detail="Access denied")
    return {...}
```

### Step 5: Add Login to Frontend

```javascript
// src/services/auth.js
export const authApi = {
  login: async (email, password) => {
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }
};
```

```jsx
// src/context/AuthContext.jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const { access_token, user } = await authApi.login(email, password);
    localStorage.setItem('token', access_token);
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## API Auth Flow (After Implementation)

```
┌─────────────────────────────────────────────────────────┐
│  1. USER LOGIN                                           │
│  └─ POST /auth/login                                     │
│     { email, password }                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. VERIFICATE                                           │
│  └─ Fetch user from DB                                   │
│  └─ Verify password hash                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. ISSUE TOKENS                                        │
│  └─ Generate JWT access token (30 min)                  │
│  └─ Generate refresh token (7 days)                     │
│  └─ Save refresh token to DB                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. RETURN TO USER                                       │
│  └─ Response: { access_token, refresh_token, user }     │
│  └─ Store in LocalStorage                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. SUBSEQUENT REQUESTS                                  │
│  └─ Authorization: Bearer {access_token}                │
│  └─ Server validates JWT                                 │
│  └─ Extract user_id and tenant_id                        │
│  └─ Apply RLS based on tenant_id                         │
└─────────────────────────────────────────────────────────┘
```

---

## Authentication vs Current Instance-Based Flow

| Aspect | Current (Instance) | Proposed (JWT Auth) |
|--------|-------------------|-------------------|
| **Identification** | instance_name in webhook | JWT token in headers |
| **Auth Type** | None (public) | Bearer token |
| **User Validation** | Not possible | Database lookup |
| **Multi-Tenancy** | Works via instance_name | Works via user.tenant_id |
| **Sessions** | N/A | JWT + refresh token |
| **Security** | 🔴 Low | 🟢 Medium-High |
| **Complexity** | Low | Medium |

---

## Estimated Effort

| Task | Time | Priority |
|------|------|----------|
| Database schema | 2 hours | 🔴 |
| Backend auth (JWT, endpoints) | 6 hours | 🔴 |
| Frontend auth (login, context) | 4 hours | 🔴 |
| Protect existing APIs | 2 hours | 🔴 |
| Security (rate limiting, secrets) | 3 hours | 🟡 |
| Testing | 4 hours | 🟡 |
| **TOTAL** | **21 hours** | | 

---

## Database Relationships

```
┌─────────────────────┐
│   users             │
├─────────────────────┤
│ id (UUID) PK        │
│ email VARCHAR       │
│ password_hash       │
│ role VARCHAR        │
│ tenant_id UUID      │──┐
│ created_at          │  │
└─────────────────────┘  │
                         │
                         │ REFERENCES
                         │
         ┌───────────────┘
         │
         ▼
┌─────────────────────┐
│   agente_config     │
├─────────────────────┤
│ user_id UUID PK     │──┬─
│ instance_name       │  │
│ nome_ia             │  │
│ saudacao            │  │
│ endereco            │  │
│ horarios            │  │
└─────────────────────┘  │
                          │
                          │ Has Many
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  barbers    │   │  services   │   │ crm_leads   │
├─────────────┤   ├─────────────┤   ├─────────────┤
│ user_id FK  │   │ user_id FK  │   │ tenant_id FK│
│ ...         │   │ ...         │   │ ...         │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## Key Files to Create

### Backend

```
barberzap_python/
├── core/
│   ├── auth.py              # NEW: JWT functions
│   └── dependencies.py      # NEW: get_current_user
├── api/
│   └── endpoints/
│       └── auth.py          # NEW: login/logout endpoints
├── models/
│   ├── user.py              # NEW: User model
│   └── session.py           # NEW: Session model
└── migrations/
    └── 001_create_users.sql # NEW: DB schema
```

### Frontend

```
Barberzap-Dev/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx  # NEW: Auth state
│   ├── pages/
│   │   ├── LoginPage.jsx    # NEW: Login form
│   │   └── DashboardPage.jsx # NEW: Dashboard
│   ├── components/
│   │   └── auth/
│   │       └── ProtectedRoute.jsx # NEW: Route protection
│   ├── services/
│   │   └── auth.js          # NEW: API calls
│   └── lib/
│       └── auth.js          # NEW: token utilities
```

---

## Common Patterns

### Protecting an Endpoint

```python
from fastapi import Depends
from api.dependencies import get_current_user, get_current_tenant

@app.get("/api/my-data")
async def get_my_data(
    tenant_id: str = Depends(get_current_tenant)
):
    # tenant_id is guaranteed to be authenticated and valid
    data = client.get('agente_config', {'user_id': f'eq.{tenant_id}'}, single=True)
    return data
```

### Making Authenticated Request from Frontend

```javascript
import api from './services/auth';

// Authenticated request (token added automatically)
const data = await api.get('/api/my-data');

// Manual token addition
const response = await fetch('/api/my-data', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## Checklist

- [ ] Install auth packages (python-jose, passlib, react-router-dom)
- [ ] Create users, user_sessions tables in Supabase
- [ ] Implement JWT functions in backend (core/auth.py)
- [ ] Create auth endpoints (POST /auth/login, /auth/logout)
- [ ] Add get_current_user dependency
- [ ] Protect sensitive API endpoints
- [ ] Create LoginPage component
- [ ] Create AuthContext
- [ ] Create ProtectedRoute component
- [ ] Add token refresh logic
- [ ] Test login flow end-to-end
- [ ] Add rate limiting to auth endpoints
- [ ] Add webhook secret validation

---

**Last Updated:** 2026-02-23  
**Auth Status:** ❌ NOT IMPLEMENTED  
**Effort to Implement:** 21 hours for MVP auth system