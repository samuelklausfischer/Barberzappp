# 🔐 BarberZap Authentication System Analysis

**Date:** 2026-02-23  
**Analyst:** Subagent  
**Scope:** Frontend (React) + Backend (FastAPI/Python)

---

## 📊 EXECUTIVE SUMMARY

**Current State:** ❌ **NO AUTHENTICATION SYSTEM EXISTS**

The BarberZap system currently operates as a **webhook-only SaaS** with no traditional web authentication. There is:
- ❌ No login/dashboard system
- ❌ No JWT tokens
- ❌ No user authentication
- ❌ No protected routes
- ❌ No auth middleware
- ⚠️  All API endpoints are PUBLIC (no authentication required)

The system relies on **instance-based multi-tenancy** where identification comes from Evolution API webhooks, not user credentials.

---

## 🎯 FRONTEND ANALYSIS (React)

### Location
`/root/Barberzap SITE/Barberzap-Dev/`

### Findings

#### 1. **Auth Mechanism**
| Aspect | Status | Details |
|--------|--------|---------|
| JWT Tokens | ❌ NOT IMPLEMENTED | No token generation or validation |
| Session Cookies | ❌ NOT IMPLEMENTED | No cookie-based auth |
| LocalStorage | ❌ NOT USED | No token storage in browser |
| SessionStorage | ❌ NOT USED | No session storage |
| Auth Context | ❌ NOT IMPLEMENTED | No AuthProvider or context |
| Protected Routes | ❌ NOT IMPLEMENTED | All routes are public |

#### 2. **Components**
```bash
# Found components (NO auth-related components)
├── components/sections/
│   ├── BenefitsSection.jsx
│   ├── ComparisonSection.jsx
│   ├── FAQSection.jsx
│   ├── FooterSection.jsx
│   ├── HeroSection.jsx
│   ├── HowItWorksSection.jsx
│   ├── LeadModal.jsx          # Lead capture only
│   ├── PricingSection.jsx
│   └── TestimonialsSection.jsx
└── components/ui/
    ├── AccordionItem.jsx
    ├── Button.jsx
    ├── ScrollCard.jsx
    └── SectionHeading.jsx
```

**Missing Components:**
-❓ `LoginForm.jsx` (not found)
-❓ `ProtectedRoute.jsx` (not found)
-❓ `AuthProvider.jsx` (not found)
-❓ `auth/context.js` (not found)
-❓ `Dashboard.jsx` (not found)

#### 3. **App.jsx Structure**
```jsx
// Current structure: Simple landing page
function App() {
  // NO auth state
  // NO auth providers
  // NO route protection

  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      {/* ... marketing sections ... */}
    </>
  );
}
```

#### 4. **User Roles**
| Role | Status | Implementation |
|------|--------|----------------|
| Admin | ❌ NOT IMPLEMENTED | No admin dashboard |
| Barbearia/Tenant | ❌ NOT IMPLEMENTED | No tenant login |
| Customer | ❌ NOT IMPLEMENTED | No customer portal |

#### 5. **Session Management**
- ❌ No session persistence
- ❌ No token refresh
- ❌ No logout functionality
- ❌ No "remember me" feature

---

## 🔧 BACKEND ANALYSIS (FastAPI/Python)

### Location
`/root/Barberzap SITE/barberzap_python/`

### Findings

#### 1. **Auth Endpoints**
| Endpoint | Status | Details |
|----------|--------|---------|
| POST `/auth/login` | ❌ NOT IMPLEMENTED | No login endpoint |
| POST `/auth/logout` | ❌ NOT IMPLEMENTED | No logout endpoint |
| POST `/auth/register` | ❌ NOT IMPLEMENTED | No registration |
| POST `/auth/refresh` | ❌ NOT IMPLEMENTED | No token refresh |
| GET `/auth/me` | ❌ NOT IMPLEMENTED | No user profile endpoint |

#### 2. **Authentication Middleware**
```python
# main.py - NO auth middleware
app = FastAPI(
    title="BarberZap API",
    description="AI-powered WhatsApp assistant for barbershops",
    version="1.0.0",
)

# Only CORSMiddleware - NO JWT/Session middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development: all origins allowed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Missing:**
- ❓ `get_current_user()` dependency for JWT validation
- ❓ `get_current_tenant()` dependency for tenant scoping
- ❓ `verify_token()` function for signature verification
- ❓ `create_access_token()` / `create_refresh_token()` functions
- ❓ Session middleware

#### 3. **Current API Endpoints**

All endpoints are **PUBLIC** (no authentication):

```
PUBLIC WEBHOOKS:
├── POST /webhook/barberzap-saas     # Main webhook (no auth)
├── POST /webhooks/whatsapp          # Legacy webhook (no auth)
├── POST /webhooks/calendar          # Calendar events (no auth)
└── POST /webhooks/ai                # AI responses (no auth)

PUBLIC API:
├── GET  /                           # API info (no auth)
├── GET  /health                     # Health check (no auth)
├── POST /api/send-message           # Send WhatsApp (no auth)
├── GET  /api/tenant/{tenant_id}     # Get tenant (no auth)
├── GET  /api/schedule/available     # Get slots (no auth)
└── POST /api/schedule               # Book appointment (no auth)
```

#### 4. **Multi-Tenant Authentication**

The current system uses **instance-based identification**, NOT user credentials:

```python
# core/tenant_resolver.py - Current auth flow

def resolve_tenant(instance_name: str) -> Optional[str]:
    """
    Resolve tenant ID from instance_name (NOT from JWT token)
    
    Flow:
    instance_name→ database lookup → user_id → tenant_id
    """
    # This is NOT authentication - it's data lookup
    client = get_client()
    result = client.get(
        table='whatsapp_instances',
        filters={'instance_name': f'eq.{instance_name}'},  # Lookup only
        single=True
    )
    return result.get('user_id')  # Returns tenant ID
```

**Webhook Auth Flow:**
```
WhatsApp Client
    ↓ sends message
Evolution API
    ↓ POST /webhook/barberzap-saas (with instance_name in payload)
Webhook Handler
    ↓ Extract instance_name from payload
Tenant Resolver
    ↓ Database lookup: instance_name → user_id
[PROCEEDS WITH PROCESSING]
```

**This is NOT user authentication - it's data identification!**

---

## 🗄️ DATABASE ANALYSIS (Supabase)

### Tables Found

| Table | Purpose | Auth-Related |
|-------|---------|--------------|
| `whatsapp_instances` | Maps instance_name → user_id | ⚠️  NOT auth table (data mapping only) |
| `agente_config` | Barbershop settings (by user_id) | ❌ NOT auth |
| `barbers` | Barbers list (by user_id) | ❌ NOT auth |
| `services` | Services and prices | ❌ NOT auth |
| `crm_leads` | Customer leads | ❌ NOT auth |
| `crm_messages` | Message history | ❌ NOT auth |
| `visitors` | Web tracking | ❌ NOT auth |

### Missing Auth Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | User accounts | ❌ NOT EXISTS |
| `user_sessions` | Session management | ❌ NOT EXISTS |
| `audit_logs` | Auth events (login/logout) | ❌ NOT EXISTS |
| `roles` | User roles (admin/barbearia) | ❌ NOT EXISTS |
| `permissions` | Role permissions | ❌ NOT EXISTS |
| `password_reset` | Reset tokens | ❌ NOT EXISTS |

### Current Schema

**whatsapp_instances** (NOT an auth table):
```sql
CREATE TABLE whatsapp_instances (
    id BIGSERIAL PRIMARY KEY,
    instance_name VARCHAR UNIQUE,      -- Evolution API instance name
    user_id UUID,                      -- Links to agente_config
    status VARCHAR,                    -- active/inactive
    api_key VARCHAR,                   -- Evolution API key
    webhook_url VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**agente_config** (NOT an auth table):
```sql
CREATE TABLE agente_config (
    user_id UUID PRIMARY KEY,          -- This is the tenant ID
    instance_name VARCHAR,
    nome_ia VARCHAR,
    saudacao TEXT,
    endereco TEXT,
    horarios TEXT
    -- ❌ NO password field
    -- ❌ NO email field (for login)
    -- ❌ NO role field
);
```

### Row Level Security (RLS)

RLS is configured for CRM tables but relies on `app.current_tenant_id`:

```sql
-- RLS policy example
CREATE POLICY "Users can view their own tenant's leads"
    ON crm_leads FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id')::BIGINT);
```

**Problem:** `current_setting('app.current_tenant_id')` requires:
1. Auth middleware to extract tenant_id from JWT
2. PostgreSQL session variable to be set
3. ❌ Currently NOT IMPLEMENTED

---

## 🔄 CURRENT AUTH FLOW

### Webhook Flow (Multi-Tenant)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: WhatsApp Message                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Evolution API                                      │
│ Instance: barber_d9fd2be40768483b                          │
│ Sends webhook to: POST /webhook/barberzap-saas               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Webhook Handler (NO AUTH)                          │
│ Receives: instance_name from payload                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Tenant Resolver                                     │
│ Function: resolve_tenant(instance_name)                    │
│ Query: SELECT user_id FROM whatsapp_instances              │
│        WHERE instance_name = 'barber_d9fd2be40768483b'      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Get user_id = d9fd2be4-0768-483b-b122-b60277335e2a │
│ Returns: tenant_id for scoped queries                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Process Message                                     │
│ - Build context for tenant                                 │
│ - Generate AI response                                     │
│ - Log to CRM with tenant_id                                │
│ - Send response via WhatsApp                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Multi-tenancy works via `instance_name`
- ❌ NO user authentication
- ❌ NO JWT tokens
- ❌ Anyone with instance_name can access tenant data (SECURITY RISK!)

---

## 🚨 SECURITY GAPS

### Critical Vulnerabilities

| Vulnerability | Severity | Impact |
|---------------|----------|--------|
| **No API Authentication** | 🔴 CRITICAL | Anyone can call API endpoints |
| **No Login System** | 🔴 CRITICAL | No dashboard access control |
| **Public Webhook Without Auth** | 🔴 CRITICAL | Spam/abuse vulnerability |
| **Exposed instance_name** | 🟡 MEDIUM | Tenant enumeration possible |
| **No Rate Limiting** | 🟡 MEDIUM | DDoS vulnerability |
| **No Audit Logging** | 🟡 MEDIUM | Cannot track access |

### Example Attack Scenarios

#### Scenario 1: API Data Theft
```bash
# WITHOUT AUTH, anyone can access tenant data
curl http://localhost:8000/api/tenant/6ba07579-ac54-4954-b0de-aa5da9152f65

# Response returns all tenant data (barbers, services, leads)
# ❌ NO AUTHENTICATION REQUIRED
```

#### Scenario 2: Tenant Enumeration
```bash
# Guess instance names to discover tenants
for i in {1..1000}; do
  instance="barber_${i}"
  curl http://localhost:8000/api/instance-info/$instance
done

# Attacker can discover all active tenants by checking HTTP 200 vs 404
```

#### Scenario 3: Spam Webhook
```bash
# Send thousands of fake webhooks
for i in {1..10000}; do
  curl -X POST http://localhost:8000/webhook/barberzap-saas \
    -H "Content-Type: application/json" \
    -d '{"event":"messages.upsert","instance":{"instanceName":"barber_001"},"data":[...]}'
done

# No rate limiting, no auth required - causes database overload
```

---

## 📋 MISSING COMPONENTS

### Backend (FastAPI)

#### Required Files

| File | Purpose | Exists? |
|------|---------|---------|
| `core/auth.py` | JWT token generation/validation | ❌ |
| `core/security.py` | Password hashing, encryption | ❌ |
| `core/token.py` | Token models, schemas | ❌ |
| `api/endpoints/auth.py` | Login/logout endpoints | ❌ |
| `api/dependencies.py` | get_current_user, get_current_tenant | ❌ |
| `models/user.py` | User model/ORM | ❌ |
| `models/session.py` | Session model/ORM | ❌ |

#### Required Functions

| Function | Purpose | Exists? |
|----------|---------|---------|
| `create_access_token(user_id)` | Generate JWT | ❌ |
| `create_refresh_token(user_id)` | Generate refresh token | ❌ |
| `verify_token(token)` | Validate JWT signature | ❌ |
| `hash_password(password)` | Hash passwords | ❌ |
| `verify_password(plain, hashed)` | Verify passwords | ❌ |
| `get_current_user(token)` | Dependency for auth | ❌ |
| `get_current_tenant(token)` | Dependency for multi-tenant | ❌ |

#### Required Database Tables

| Table | Columns | Purpose | Exists? |
|-------|---------|---------|---------|
| `users` | id, email, password_hash, role, tenant_id, created_at | User accounts | ❌ |
| `user_sessions` | id, user_id, token_hash, expires_at, created_at | Session management | ❌ |
| `audit_logs` | id, user_id, action, ip, user_agent, timestamp | Auth events | ❌ |

#### Required PyPI Packages

```bash
# Add to requirements.txt
fastapi[all]
python-jose[cryptography]  # JWT handling
passlib[bcrypt]           # Password hashing
python-multipart          # Form data
pyotp                     # 2FA (optional)
```

### Frontend (React)

#### Required Files

| File | Purpose | Exists? |
|------|---------|---------|
| `src/lib/auth.js` | Axios interceptor for auth headers | ❌ |
| `src/context/AuthContext.jsx` | Auth state management | ❌ |
| `src/pages/LoginPage.jsx` | Login form | ❌ |
| `src/pages/RegisterPage.jsx` | Registration form | ❌ |
| `src/components/auth/ProtectedRoute.jsx` | Route protection | ❌ |
| `src/components/dashboard/DashboardLayout.jsx` | Dashboard layout | ❌ |
| `src/services/auth.js` | API calls: login, logout, refresh | ❌ |

#### Required Packages

```bash
# Add to package.json
npm install react-router-dom      # Protected routes
npm install jwt-decode            # JWT decoding
npm install axios                 # HTTP client with interceptors
```

---

## 🎯 IMPLEMENTATION PLAN

### Phase 1: Backend Auth Infrastructure (8-12 hours)

#### Step 1.1: Database Schema
```sql
-- Create users table
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

-- Create sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit log table
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

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_audit_user_created ON audit_logs(user_id, created_at DESC);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON users
    FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

#### Step 1.2: Auth Utilities (`core/auth.py`)
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

#### Step 1.3: Auth Dependencies (`api/dependencies.py`)
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.auth import decode_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # TODO: Fetch user from database and return user object
    return payload

async def get_current_tenant(
    user: dict = Depends(get_current_user)
) -> str:
    tenant_id = user.get("sub")  # subject = user_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User has no tenant"
        )
    
    # Set PostgreSQL session variable for RLS
    # This requires database connection access
    return tenant_id
```

#### Step 1.4: Auth Endpoints (`api/endpoints/auth.py`)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from core.auth import verify_password, get_password_hash, create_access_token, create_refresh_token
from api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # TODO: Fetch user from database by email
    user = get_user_by_email(request.email)
    
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})
    
    # TODO: Save refresh token to database
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "tenant_id": user["tenant_id"]
        }
    )

@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(refresh_token: str):
    # TODO: Validate refresh token from database
    # TODO: Issue new access token
    pass

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # TODO: Delete refresh token from database
    return {"message": "Logged out successfully"}
```

#### Step 1.5: Protect Existing Endpoints
```python
# In main.py or api/endpoints/*.py

# Before (NO AUTH):
@app.get("/api/tenant/{tenant_id}")
async def get_tenant(tenant_id: str):
    return {...}

# After (WITH AUTH):
from api.dependencies import get_current_tenant

@app.get("/api/tenant/{tenant_id}")
async def get_tenant(
    tenant_id: str,
    current_tenant_id: str = Depends(get_current_tenant)
):
    # Only allow access to own tenant
    if tenant_id != current_tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {...}
```

### Phase 2: Frontend Auth Implementation (6-8 hours)

#### Step 2.1: Auth Service (`src/services/auth.js`)
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor - add auth header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export default api;
```

#### Step 2.2: Auth Context (`src/context/AuthContext.jsx`)
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.me()
        .then(setUser)
        .then(() => setIsAuthenticated(true))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { access_token, refresh_token, user } = await authApi.login(email, password);
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### Step 2.3: Protected Route (`src/components/auth/ProtectedRoute.jsx`)
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

#### Step 2.4: Login Page (`src/pages/LoginPage.jsx`)
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">BarberZap</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### Step 2.5: Dashboard Pages
```javascript
// src/pages/DashboardPage.jsx
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Dashboard content */}
        <h1>Bem-vindo à Dashboard</h1>
        {/* Metrics, leads, messages, etc. */}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// src/components/dashboard/DashboardLayout.jsx
export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1">
        <Header user={user} onLogout={logout} />
        {children}
      </main>
    </div>
  );
}
```

### Phase 3: Security Enhancements (4-6 hours)

#### Rate Limiting
```python
# Add slowapi for rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Protect endpoints
@app.post("/auth/login")
@limiter.limit("5/minute")  # Max 5 login attempts per minute
async def login(request: Request, ...):
    ...
```

#### Webhook Secret Validation
```python
# Add secret to Evolution API webhooks
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")

async def webhook_barberzap(request: Request):
    # Verify webhook signature
    webhook_secret = request.headers.get("X-Webhook-Secret")
    if webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")
    
    # Process webhook...
```

#### Audit Logging
```python
async def log_auth_event(user_id: str, action: str, success: bool, ip: str, user_agent: str):
    await client.post('audit_logs', {
        'user_id': user_id,
        'action': action,
        'ip_address': ip,
        'user_agent': user_agent,
        'success': success,
        'details': {}
    })
```

---

## ✅ CHECKLIST FOR COMPLETION

### Backend (Python/FastAPI)

- [ ] Install required packages (python-jose, passlib, etc.)
- [ ] Create `core/auth.py` with JWT functions
- [ ] Create `api/dependencies.py` with `get_current_user`, `get_current_tenant`
- [ ] Create `api/endpoints/auth.py` with login/refresh/logout endpoints
- [ ] Run database migrations (users, sessions, audit_logs tables)
- [ ] Add auth middleware to protect API endpoints
- [ ] Add rate limiting to auth endpoints
- [ ] Add webhook secret validation to Evolution API
- [ ] Implement audit logging for auth events
- [ ] Update API documentation (/docs)
- [ ] Add unit tests for auth functions
- [ ] Add integration tests for auth flows

### Frontend (React)

- [ ] Install required packages (react-router-dom, jwt-decode, axios)
- [ ] Create `src/services/auth.js` with axios interceptors
- [ ] Create `src/context/AuthContext.jsx` for auth state
- [ ] Create `src/components/auth/ProtectedRoute.jsx`
- [ ] Create `src/pages/LoginPage.jsx`
- [ ] Create `src/pages/RegisterPage.jsx`
- [ ] Create `src/pages/DashboardPage.jsx`
- [ ] Create `src/components/dashboard/DashboardLayout.jsx`
- [ ] Update `App.jsx` with routing and AuthProvider
- [ ] Add token refresh logic
- [ ] Add logout functionality
- [ ] Add loading states for auth

### Database (Supabase)

- [ ] Create `users` table with indexes and RLS
- [ ] Create `user_sessions` table with indexes
- [ ] Create `audit_logs` table
- [ ] Add sample admin user
- [ ] Test CRUD operations on users table
- [ ] Verify RLS policies
- [ ] Set up PostgreSQL session variables for RLS

### Security

- [ ] Generate strong JWT secret key
- [ ] Set up password hashing with bcrypt
- [ ] Add webhook secret to Evolution API
- [ ] Implement rate limiting (login: 5/min, API: 100/min)
- [ ] Add CSRF protection
- [ ] Set up HTTPS for production
- [ ] Configure CORS for production domains only
- [ ] Add security headers (HSTS, X-Frame-Options, etc.)
- [ ] Implement audit logging
- [ ] Set up alerts for failed login attempts

---

## 📊 ESTIMATED EFFORT

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1: Backend Auth** | DB schema, JWT, endpoints, middleware | 8-12 hours |
| **Phase 2: Frontend Auth** | Auth context, routes, login page, dashboard | 6-8 hours |
| **Phase 3: Security** | Rate limiting, secrets, audit logging | 4-6 hours |
| **Phase 4: Testing** | Unit tests, integration tests, E2E tests | 4-6 hours |
| **Phase 5: Deployment** | Environment variables, production config | 2-4 hours |
| **TOTAL** | | **24-36 hours** |

---

## 🎯 CONCLUSION

### Current State Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Auth System Exists** | NO | 🔴 |
| **Login Flow** | Not Implemented | 🔴 |
| **JWT Tokens** | Not Implemented | 🔴 |
| **Protected APIs** | 0% of endpoints | 🔴 |
| **User Accounts** | No users table | 🔴 |
| **Security Score** | 0/10 | 🔴 |
| **Multi-Tenancy** | Working (instance-based) | 🟡 |
| **Webhook Auth** | No protection | 🔴 |

### Key Findings

1. **No Authentication**: The system is completely unauthenticated. All API endpoints are public.
2. **Webhook-Only Architecture**: The system is designed as a webhook service, not a web app with user dashboards.
3. **Multi-Tenancy via Instance**: Tenant identification uses Evolution API instance names, not user credentials.
4. **Security Risk**: Anyone who knows an instance_name can access all tenant data.
5. **Missing Components**: No user tables, no JWT, no login pages, no dashboard routes.

### Recommendation

**Option A: Keep Webhook-Only (No Auth)**
- ✅ Simpler architecture
- ✅ Faster development
- ❌ No user dashboard
- ❌ Security risk if instance_name exposed
- ❌ No admin controls

**Option B: Add Full Auth System (Recommended)**
- ✅ Secure user dashboard
- ✅ Admin controls and analytics
- ✅ Multiple users per tenant
- ✅ Audit logging and compliance
- ❌ Requires 24-36 hours of development
- ❌ More complex architecture

### Next Steps

1. **Immediate** (if dashboard needed):
   - Run database migrations for users, sessions, audit_logs
   - Implement JWT authentication in backend
   - Create login page in React
   - Protect API endpoints with JWT validation

2. **Alternative** (if webhook-only needed):
   - Add webhook secret validation to prevent spam
   - Add rate limiting to all endpoints
   - Document that instance_name is a secret token
   - Add API key-based auth for admin operations

3. **Hybrid** (recommended for SaaS):
   - Keep webhook flow for WhatsApp automation (with secret validation)
   - Add JWT auth for dashboard/admin panels
   - Use same tenant_id for multi-tenancy

### Resources

- [FastAPI Security Best Practices](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Authentication with FastAPI](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Supabase auth with custom tables](https://supabase.com/docs/guides/auth/server-side/nodeloaded)
- [React Router Protected Routes](https://reactrouter.com/en/main/start/overview#protected-routes)

---

**Report Generated:** 2026-02-23  
**System:** BarberZap SaaS  
**Auth Status:** ❌ NOT IMPLEMENTED  
**Action Required:** Implement full auth system before production deployment  
**Estimated Effort:** 24-36 hours for complete auth implementation