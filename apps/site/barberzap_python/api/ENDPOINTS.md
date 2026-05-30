## BarberZap Dashboard API - Quick Reference

### Base URL
```
http://localhost:8000
```

### Documentation
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Authentication
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

## Tenants
```
GET    /api/tenants
GET    /api/tenants/{id}
GET    /api/tenants/{id}/config
PUT    /api/tenants/{id}
```

## Barbers
```
GET    /api/barbers
POST   /api/barbers
GET    /api/barbers/{id}
PUT    /api/barbers/{id}
DELETE /api/barbers/{id}
```

## Services
```
GET    /api/services
POST   /api/services
GET    /api/services/{id}
PUT    /api/services/{id}
DELETE /api/services/{id}
```

## Clients
```
GET    /api/clients
POST   /api/clients
GET    /api/clients/{id}
PUT    /api/clients/{id}
DELETE /api/clients/{id}
```

## Employees
```
GET    /api/employees
POST   /api/employees
GET    /api/employees/{id}
PUT    /api/employees/{id}
DELETE /api/employees/{id}
```

## Leads / CRM
```
GET    /api/leads
POST   /api/leads
GET    /api/leads/{id}
PUT    /api/leads/{id}
PATCH  /api/leads/{id}/status
GET    /api/leads/{id}/conversation
```

## Stats
```
GET    /api/stats/overview
GET    /api/stats/leads
GET    /api/stats/conversations
GET    /api/stats/revenue
GET    /api/stats/full
```

## Chat
```
POST   /api/chat/send
POST   /api/chat/history
POST   /api/chat/ai-generate
```

## WhatsApp
```
GET    /api/whatsapp/connection
GET    /api/whatsapp/instance
POST   /api/whatsapp/test-message
```

## Appointments (Coming Soon)
```
GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/{id}
PUT    /api/appointments/{id}
DELETE /api/appointments/{id}
```

---

## Total: 40+ Endpoints
