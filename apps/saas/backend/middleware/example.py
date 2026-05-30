"""
FastAPI Rate Limiting Example for BarberZap
Demonstrates integration of rate limiting with a FastAPI application
"""

from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from barber.backend.middleware import (
    rate_limit,
    rate_limit_booking,
    rate_limit_auth,
    rate_limit_api,
    rate_limit_webhook,
    rate_limit_sms,
    rate_limit_whatsapp,
    RateLimitExceeded,
    create_rate_limit_dependency,
)
from pydantic import BaseModel, Field
from typing import Optional

# ==================== FastAPI App ====================

app = FastAPI(
    title="BarberZap API",
    description="Barber shop management API with rate limiting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Exception Handler ====================

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded exceptions"""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "rate_limit_exceeded",
            "message": exc.message,
            "retry_after": exc.retry_after,
            "limit": exc.limit,
            "window": exc.window,
            "current": exc.current
        },
        headers={
            "Retry-After": str(exc.retry_after),
            "X-RateLimit-Limit": str(exc.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(exc.retry_after)
        }
    )


# ==================== Pydantic Models ====================

class AppointmentCreate(BaseModel):
    phone: str = Field(..., example="+5511999999999")
    shop_id: str = Field(..., example="shop123")
    service_id: str = Field(..., example="service001")
    date: str = Field(..., example="2026-03-04")
    time: str = Field(..., example="14:00")


class LoginRequest(BaseModel):
    email: str = Field(..., example="user@example.com")
    password: str = Field(...)


class ClientCreate(BaseModel):
    shop_id: str = Field(..., example="shop123")
    name: str = Field(..., example="John Doe")
    phone: str = Field(..., example="+5511999999999")


class SMSRequest(BaseModel):
    phone: str = Field(..., example="+5511999999999")
    message: str = Field(..., example="Your appointment is confirmed!")


class WhatsAppRequest(BaseModel):
    phone: str = Field(..., example="+5511999999999")
    message: str = Field(..., example="Hello! Welcome to BarberZap")


# ==================== Rate Limit Dependencies ====================

# Create reusable dependencies
shop_read_limiter = create_rate_limit_dependency(
    limit=100,
    window=60,
    key_type='shop_id'
)

shop_write_limiter = create_rate_limit_dependency(
    limit=50,
    window=60,
    key_type='shop_id'
)


# ==================== Routes ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "BarberZap API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# ==================== Webhook Routes ====================

@app.post("/webhooks/supabase")
@rate_limit_webhook()
async def supabase_webhook(request: Request):
    """Supabase webhook endpoint - limited to 100/hour per IP"""
    data = await request.json()
    return {"status": "received", "data": data}


@app.post("/webhooks/whatsapp")
@rate_limit_webhook()
async def whatsapp_webhook(request: Request):
    """WhatsApp webhook endpoint - limited to 100/hour per IP"""
    data = await request.json()
    return {"status": "received", "data": data}


# ==================== Auth Routes ====================

@app.post("/api/auth/login")
@rate_limit_auth()
async def login(request: LoginRequest):
    """Login endpoint - limited to 20/attempts per IP"""
    # Simulated login logic
    if request.email == "admin@example.com" and request.password == "admin123":
        return {
            "token": "simulated_jwt_token",
            "user": {
                "id": "user123",
                "email": request.email
            }
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/api/auth/reset-password")
@rate_limit_auth(limit=5, ip_key=False, email_param='email')
async def reset_password(email: str):
    """Password reset endpoint - limited to 5 requests per email"""
    return {"message": f"Password reset email sent to {email}"}


@app.post("/api/auth/forgot-password")
@rate_limit_auth(limit=5, ip_key=False, email_param='email')
async def forgot_password(email: str):
    """Forgot password endpoint - limited to 5 requests per email"""
    return {"message": f"Password reset link sent to {email}"}


# ==================== Appointment Routes ====================

@app.post("/api/appointments")
@rate_limit_booking()
async def create_appointment(appointment: AppointmentCreate):
    """Create appointment - limited to 10/min per phone"""
    # Simulated appointment creation
    return {
        "id": "apt123",
        "phone": appointment.phone,
        "shop_id": appointment.shop_id,
        "date": appointment.date,
        "time": appointment.time,
        "status": "confirmed"
    }


@app.delete("/api/appointments/{appointment_id}")
@rate_limit(limit=5, window=60, key_type='shop_id')
async def cancel_appointment(appointment_id: str, shop_id: str):
    """Cancel appointment - limited to 5/min per shop_id"""
    return {"id": appointment_id, "status": "cancelled", "shop_id": shop_id}


@app.post("/api/appointments/{appointment_id}/cancel")
@rate_limit(limit=5, window=60, key_type='shop_id')
async def cancel_appointment_alt(appointment_id: str, shop_id: str):
    """Alternative cancel endpoint - limited to 5/min per shop_id"""
    return {"id": appointment_id, "status": "cancelled", "shop_id": shop_id}


# ==================== Client Routes ====================

@app.get("/api/clients", dependencies=[Depends(shop_read_limiter)])
async def list_clients(shop_id: str):
    """List clients - limited to 100/min per shop_id"""
    # Simulated clients list
    return {
        "clients": [
            {"id": "client1", "name": "John Doe", "phone": "+5511999999999"},
            {"id": "client2", "name": "Jane Smith", "phone": "+5511999999998"},
        ],
        "shop_id": shop_id,
        "total": 2
    }


@app.post("/api/clients", dependencies=[Depends(shop_write_limiter)])
async def create_client(client: ClientCreate):
    """Create client - limited to 50/min per shop_id"""
    return {
        "id": "client3",
        "name": client.name,
        "phone": client.phone,
        "shop_id": client.shop_id,
        "status": "created"
    }


@app.get("/api/clients/{client_id}", dependencies=[Depends(shop_read_limiter)])
async def get_client(client_id: str, shop_id: str):
    """Get client details - limited to 100/min per shop_id"""
    return {
        "id": client_id,
        "name": "John Doe",
        "phone": "+5511999999999",
        "shop_id": shop_id
    }


@app.put("/api/clients/{client_id}", dependencies=[Depends(shop_write_limiter)])
async def update_client(client_id: str, shop_id: str, name: Optional[str] = None):
    """Update client - limited to 50/min per shop_id"""
    return {
        "id": client_id,
        "name": name or "John Doe",
        "shop_id": shop_id,
        "status": "updated"
    }


# ==================== SMS Routes ====================

@app.post("/api/sms/send")
@rate_limit_sms()
async def send_sms(sms: SMSRequest):
    """Send SMS - limited to 10/min per phone"""
    return {
        "status": "sent",
        "phone": sms.phone,
        "message": sms.message
    }


# ==================== WhatsApp Routes ====================

@app.post("/api/whatsapp/send")
@rate_limit_whatsapp()
async def send_whatsapp(message: WhatsAppRequest):
    """Send WhatsApp message - limited to 20/min per phone"""
    return {
        "status": "sent",
        "phone": message.phone,
        "message": message.message
    }


@app.post("/api/notifications/send")
@rate_limit_whatsapp()
async def send_notification(phone: str, message: str):
    """Send notification - limited to 20/min per phone"""
    return {
        "status": "sent",
        "phone": phone,
        "message": message
    }


# ==================== Admin Routes ====================

@app.get("/admin/stats")
@rate_limit(limit=1000, window=60, key_type='user', bypass_admin=False)
async def admin_stats():
    """Admin endpoint - higher limit, no admin bypass"""
    return {
        "appointments": 1234,
        "clients": 567,
        "revenue": 89000
    }


# ==================== Rate Limit Info Endpoint ====================

@app.get("/api/rate-limit/info")
async def rate_limit_info(request: Request, shop_id: Optional[str] = None):
    """Get current rate limit status"""
    from barber.backend.middleware import (
        get_rate_limiter,
        RateLimitKeyFunc
    )
    
    limiter = get_rate_limiter()
    
    # Extract IP
    ip = RateLimitKeyFunc.extract_ip(request)
    
    # Get shop_id from query or extract from request
    if not shop_id:
        shop_id = request.query_params.get('shop_id')
    
    result = {
        "ip": ip,
        "limits": []
    }
    
    # Check IP limit
    ip_usage = limiter.get_current_usage('ip', ip, 100, 60)
    result["limits"].append({
        "type": "ip",
        "key": ip,
        "limit": 100,
        "window": 60,
        "current": ip_usage['count'],
        "remaining": ip_usage['remaining'],
        "percentage": ip_usage['percentage_used']
    })
    
    # Check shop_id limit if provided
    if shop_id:
        shop_usage = limiter.get_current_usage('shop_id', shop_id, 100, 60)
        result["limits"].append({
            "type": "shop_id",
            "key": shop_id,
            "limit": 100,
            "window": 60,
            "current": shop_usage['count'],
            "remaining": shop_usage['remaining'],
            "percentage": shop_usage['percentage_used']
        })
    
    return result


# ==================== Run Server ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


# ==================== How to run ====================

"""
To run this example:

1. Make sure Redis is running:
   redis-server

2. Set environment variables (optional):
   export RATE_LIMIT_ENABLED=true
   export RATE_LIMIT_MODE=strict
   export REDIS_URL=redis://localhost:6379/0

3. Run the server:
   python example.py

4. Test with curl:

   # Health check (no rate limit)
   curl http://localhost:8000/health

   # Create appointment (will be limited by phone)
   curl -X POST http://localhost:8000/api/appointments \
     -H "Content-Type: application/json" \
     -d '{"phone":"+5511999999999","shop_id":"shop123","service_id":"service001","date":"2026-03-04","time":"14:00"}'

   # Login (limited by IP)
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'

   # List clients (limited by shop_id)
   curl http://localhost:8000/api/clients?shop_id=shop123

   # Check rate limit status
   curl http://localhost:8000/api/rate-limit/info?shop_id=shop123

5. Monitor rate limiting statistics:
   python cli.py summary
   python cli.py top
   python cli.py usage ip 127.0.0.1

6. Reset a rate limit:
   python cli.py reset ip 127.0.0.1

7. Export statistics to JSON:
   python cli.py export --output stats.json
"""
