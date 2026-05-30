"""
BarberZap - Error Handler Usage Examples (Backend)

Este arquivo demonstra como usar o sistema de error handling
em diferentes situações comuns no backend.
"""

import time
from typing import Optional, Dict, Any
from datetime import datetime

from error import (
    # Exceptions
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    ServiceUnavailableError,
    TokenExpiredError,
    
    # Logger
    log_error,
    log_warning,
    log_info,
    log_debug,
    get_correlation_id,
    set_correlation_id,
    generate_correlation_id,
    get_error_handler,
    
    # Handlers
    validate_and_raise,
    require_condition,
    
    # Middleware
    sanitize_log_data,
    get_request_context,
)


# ============================================================================
# EXEMPLO 1: Setup com FastAPI
# ============================================================================

def setup_fastapi_app():
    """
    Exemplo de setup inicial com FastAPI
    """
    from fastapi import FastAPI, HTTPException
    from error import (
        create_error_middleware,
        create_logging_middleware,
        log_slow_requests,
    )

    app = FastAPI(title="BarberZap API", version="1.0.0")

    # Setup error handling middleware
    create_error_middleware(
        app, 
        framework="fastapi",
        include_stack_trace=False  # False em produção
    )

    # Setup logging middleware
    create_logging_middleware(app, framework="fastapi")

    # Slow request monitoring (log requests > 1s)
    log_slow_requests(app, threshold_ms=1000, framework="fastapi")

    return app


# ============================================================================
# EXEMPLO 2: Setup com Flask
# ============================================================================

def setup_flask_app():
    """
    Exemplo de setup inicial com Flask
    """
    from flask import Flask
    from error import (
        create_error_middleware,
        create_logging_middleware,
        log_slow_requests,
    )

    app = Flask(__name__)

    # Setup error handling
    create_error_middleware(
        app, 
        framework="flask",
        include_stack_trace=False
    )

    # Setup logging
    create_logging_middleware(app, framework="flask")

    # Slow request monitoring
    log_slow_requests(app, threshold_ms=1000, framework="flask")

    return app


# ============================================================================
# EXEMPLO 3: Endpoint de Login com Validação
# ============================================================================

async def login_endpoint(email: str, password: str) -> Dict[str, Any]:
    """
    Endpoint de login com validação
    """
    log_info("Login attempt", context={"email": email})

    # Validação usando helper
    validate_and_raise(
        email and "@" in email,
        ValidationError,
        "Invalid email format",
        field="email"
    )

    validate_and_raise(
        password and len(password) >= 6,
        ValidationError,
        "Password too short",
        field="password"
    )

    # Buscar usuário (simulação)
    user = await get_user_by_email(email)
    if not user:
        # Log attempt mas não expor que usuário não existe
        log_warning("Failed login attempt", context={"email": email})
        raise AuthenticationError("Invalid credentials")

    # Verificar senha
    if not verify_password(password, user["password_hash"]):
        log_warning(
            "Failed password verification",
            context={"user_id": user["id"], "email": email}
        )
        raise AuthenticationError("Invalid credentials")

    # Gerar token
    token = generate_token(user)
    
    log_info("User logged in", context={
        "user_id": user["id"],
        "email": email,
    })

    return {"token": token, "user": user}


# ============================================================================
# EXEMPLO 4: Criar Agendamento com Conflict Detection
# ============================================================================

async def create_appointment_endpoint(
    shop_id: str,
    service_id: str,
    start_time: str,
    client_name: str,
    user_id: str,
) -> Dict[str, Any]:
    """
    Criar agendamento com detecção de conflitos
    """
    log_info(
        "Creating appointment",
        context={
            "shop_id": shop_id,
            "service_id": service_id,
            "user_id": user_id,
        }
    )

    # Validações
    validate_and_raise(
        shop_id and service_id and start_time and client_name,
        ValidationError,
        "Missing required fields"
    )

    # Verificar se shop existe
    shop = await get_shop_by_id(shop_id)
    if not shop:
        raise NotFoundError(
            resource="Shop",
            resource_id=shop_id,
            context={"action": "create_appointment"}
        )

    # Verificar se serviço existe
    service = await get_service_by_id(service_id)
    if not service:
        raise NotFoundError(
            resource="Service",
            resource_id=service_id
        )

    # Parse e validar hora
    try:
        start_dt = datetime.fromisoformat(start_time)
    except ValueError:
        raise ValidationError(
            message="Invalid datetime format",
            field="start_time",
            context={"provided": start_time, "expected": "ISO format"}
        )

    # Verificar conflitos
    existing = await check_appointment_conflict(shop_id, start_dt)
    if existing:
        # Log conflito mas não expor dados de outro usuário
        log_warning(
            "Appointment conflict detected",
            context={
                "shop_id": shop_id,
                "start_time": start_time,
                "user_id": user_id,
            }
        )
        
        raise ConflictError(
            message="Time slot already booked",
            conflict_type="double_booking",
            context={
                "shop_id": shop_id,
                "start_time": start_time,
            }
        )

    # Criar agendamento
    appointment = {
        "id": generate_id(),
        "shop_id": shop_id,
        "service_id": service_id,
        "start_time": start_time,
        "client_name": client_name,
        "user_id": user_id,
        "status": "confirmed",
    }

    await save_appointment(appointment)

    log_info(
        "Appointment created",
        context={
            "appointment_id": appointment["id"],
            "shop_id": shop_id,
            "user_id": user_id,
        }
    )

    return appointment


# ============================================================================
# EXEMPLO 5: Middleware de Autenticação
# ============================================================================

async def require_auth(token: str) -> Dict[str, Any]:
    """
    Verificar token e retornar usuário
    """
    if not token:
        raise AuthenticationError(
            message="Missing authorization token"
        )

    # Validar token
    try:
        user_data = decode_token(token)
    except Exception as e:
        log_error("Token decode failed", error=e, context={"token": token[:20] + "..."})
        raise TokenExpiredError(
            "Invalid or expired token"
        )

    # Verificar se usuário existe
    user = await get_user_by_id(user_data["user_id"])
    if not user:
        raise NotFoundError(
            resource="User",
            resource_id=user_data["user_id"]
        )

    return user


async def require_permission(user: Dict[str, Any], permission: str) -> None:
    """
    Verificar permissão do usuário
    """
    if permission not in user.get("permissions", []):
        log_warning(
            "Permission denied",
            context={
                "user_id": user["id"],
                "required_permission": permission,
            }
        )
        raise AuthorizationError(
            message="Permission denied",
            required_permission=permission
        )


# Uso em endpoint:
# user = await require_auth(token)
# await require_permission(user, "appointments:create")


# ============================================================================
# EXEMPLO 6: Operações de Banco de Dados com Logging
# ============================================================================

async def get_appointments_db(shop_id: str, date: str) -> list:
    """
    Buscar agendamentos com logging de performance
    """
    error_handler = get_error_handler()
    start_time = time.time()

    try:
        # Query
        query = """
            SELECT * FROM appointments 
            WHERE shop_id = %s AND DATE(start_time) = %s
            ORDER BY start_time
        """
        
        results = await db_execute(query, [shop_id, date])
        
        # Log query performance
        duration_ms = (time.time() - start_time) * 1000
        error_handler.log_db_operation(
            operation="select",
            table="appointments",
            duration_ms=duration_ms,
            rows_affected=len(results)
        )

        return results

    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log_error(
            "Database query failed",
            error=e,
            context={
                "operation": "select",
                "table": "appointments",
                "duration_ms": duration_ms,
                "shop_id": shop_id,
                "date": date,
            }
        )
        raise InternalServerError(
            message="Failed to fetch appointments",
            original_exception=e
        )


# ============================================================================
# EXEMPLO 7: Operações de Cache com Logging
# ============================================================================

async def get_cached_data(key: str) -> Optional[Any]:
    """
    Buscar dados do cache com logging
    """
    error_handler = get_error_handler()
    start_time = time.time()
    correlation_id = get_correlation_id()

    try:
        data = await cache_get(key)
        duration_ms = (time.time() - start_time) * 1000

        error_handler.log_cache_operation(
            operation="get",
            key=key,
            hit=data is not None,
            duration_ms=duration_ms
        )

        return data

    except Exception as e:
        error_handler.log_cache_operation(
            operation="get",
            key=key,
            hit=None,
            duration_ms=(time.time() - start_time) * 1000
        )
        log_error("Cache get failed", error=e, context={"key": key})
        return None  # Cache não deve quebrar o app


async def set_cached_data(key: str, data: Any, ttl: int = 3600) -> None:
    """
    Salvar dados no cache com logging
    """
    error_handler = get_error_handler()
    start_time = time.time()

    try:
        await cache_set(key, data, ttl)
        duration_ms = (time.time() - start_time) * 1000

        error_handler.log_cache_operation(
            operation="set",
            key=key,
            duration_ms=duration_ms
        )

    except Exception as e:
        error_handler.log_cache_operation(
            operation="set",
            key=key,
            duration_ms=(time.time() - start_time) * 1000
        )
        log_warning("Cache set failed", error=e, context={"key": key})
        # Continuar normalmente, cache opcional


# ============================================================================
# EXEMPLO 8: Custom Exception para Pagamentos
# ============================================================================

class PaymentError(InternalServerError):
    """Erro customizado para pagamentos"""

    def __init__(
        self,
        message: str = "Payment failed",
        payment_gateway: Optional[str] = None,
        gateway_error_code: Optional[str] = None,
        amount: Optional[float] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        error_context = context or {}
        error_context.update({
            "payment_gateway": payment_gateway,
            "gateway_error_code": gateway_error_code,
            "amount": amount,
        })

        super().__init__(
            message=message,
            detail=f"Payment failed: {message}",
            context=error_context,
            recovery_suggestions=[
                "Try a different payment method",
                "Check card details and try again",
                "Contact bank if issue persists",
            ],
        )


async def process_payment(amount: float, card_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processar pagamento com error handling customizado
    """
    log_info("Processing payment", context={"amount": amount})

    # Validações
    validate_and_raise(
        amount > 0,
        ValidationError,
        "Amount must be positive",
        field="amount"
    )

    validate_and_raise(
        card_data.get("number") and len(card_data["number"]) == 16,
        ValidationError,
        "Invalid card number",
        field="card_number"
    )

    # Mask card number for logging
    card_data_sanitized = {
        **card_data,
        "number": card_data["number"][-4:],  # Only last 4 digits
        "cvv": "***",
    }

    try:
        # Call payment gateway
        result = await call_payment_gateway(amount, card_data)
        
        if not result["success"]:
            raise PaymentError(
                message=result["error_message"],
                payment_gateway=result["gateway"],
                gateway_error_code=result["error_code"],
                amount=amount,
                context=card_data_sanitized,
            )

        log_info("Payment successful", context={
            "payment_id": result["payment_id"],
            "amount": amount,
        })

        return result

    except PaymentError:
        raise  # Re-raise our custom error
    except Exception as e:
        log_error("Unexpected payment error", error=e)
        raise PaymentError(
            message="Unexpected payment error",
            amount=amount,
            original_exception=e,
        )


# ============================================================================
# EXEMPLO 9: Sanitização de Logs
# ============================================================================

def log_user_action(action: str, user: Dict[str, Any], data: Dict[str, Any]):
    """
    Log ação do usuário com sanitização
    """
    sanitized_user = sanitize_log_data(user)
    sanitized_data = sanitize_log_data(data)

    log_info(
        f"User action: {action}",
        context={
            "action": action,
            "user": sanitized_user,
            "data": sanitized_data,
        }
    )


# Exemplo de uso:
# log_user_action(
#     "update_profile",
#     {"id": "123", "email": "user@example.com", "password": "secret"},
#     {"bio": "New bio", "phone": "551199999"}
# )
# O log terá "***REDACTED***" no password


# ============================================================================
# EXEMPLO 10: Endpoint com Correlation ID
# ============================================================================

async def complex_operation_endpoint(
    inputs: Dict[str, Any],
    correlation_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Endpoint com operação complexa e correlation ID
    """
    # Set correlation ID
    if not correlation_id:
        correlation_id = generate_correlation_id()
    set_correlation_id(correlation_id)

    log_info("Starting complex operation")

    try:
        # Passo 1: Validação
        validate_inputs(inputs)

        # Passo 2: Buscar dados (com cache)
        data = await get_cached_data(f"operation:{inputs['id']}")
        if not data:
            data = await fetch_data(inputs['id'])
            await set_cached_data(f"operation:{inputs['id']}", data)

        # Passo 3: Processar
        result = process_data(data)

        # Passo 4: Salvar
        await save_result(result)

        # Log success
        log_info("Operation completed", context={
            "operation_id": result["id"],
            "correlation_id": get_correlation_id(),
        })

        return result

    except ValidationError as e:
        log_warning("Validation failed", error=e, context={
            "correlation_id": get_correlation_id(),
        })
        raise

    except (NotFoundError, ConflictError) as e:
        log_error("Operation failed", error=e, context={
            "correlation_id": get_correlation_id(),
        })
        raise

    except Exception as e:
        log_error("Unexpected error", error=e, context={
            "correlation_id": get_correlation_id(),
        })
        raise InternalServerError(
            message="Unexpected error",
            original_exception=e
        )


# ============================================================================
# EXEMPLO 11: Retry Pattern com Exponential Backoff
# ============================================================================

import asyncio

async def retry_with_backoff(
    operation: callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    recoverable_errors: tuple = (ServiceUnavailableError, ConnectionError),
) -> Any:
    """
    Executar operação com retry e exponential backoff
    """
    last_error = None

    for attempt in range(max_retries):
        try:
            return await operation()
        except Exception as e:
            last_error = e

            # Verificar se erro é recuperável
            error_recoverable = isinstance(e, recoverable_errors)

            if not error_recoverable or attempt == max_retries - 1:
                raise

            # Log retry
            delay = base_delay * (2 ** attempt)
            log_warning(
                "Operation failed, retrying",
                context={
                    "attempt": attempt + 1,
                    "max_retries": max_retries,
                    "delay_ms": delay * 1000,
                    "error_type": type(e).__name__,
                }
            )

            await asyncio.sleep(delay)

    raise last_error


# Uso:
# result = await retry_with_backoff(
#     lambda: external_api_call(),
#     max_retries=3
# )


# ============================================================================
# EXEMPLO 12: Endpoint com Multiple Error Handling
# ============================================================================

async def update_appointment_endpoint(
    appointment_id: str,
    updates: Dict[str, Any],
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Atualizar agendamento com múltiplos tipos de erro
    """
    correlation_id = get_correlation_id()

    # Buscar agendamento
    appointment = await get_appointment_by_id(appointment_id)
    if not appointment:
        raise NotFoundError(
            resource="Appointment",
            resource_id=appointment_id
        )

    # Verificar permissão
    if appointment["user_id"] != user["id"] and "admin" not in user.get("roles", []):
        log_warning(
            "Unauthorized update attempt",
            context={
                "appointment_id": appointment_id,
                "user_id": user["id"],
                "correlation_id": correlation_id,
            }
        )
        raise AuthorizationError(
            message="You don't have permission to update this appointment"
        )

    # Validações de atualização
    if "start_time" in updates:
        new_time = updates["start_time"]
        try:
            datetime.fromisoformat(new_time)
        except ValueError:
            raise ValidationError(
                message="Invalid datetime format",
                field="start_time"
            )

        # Verificar conflitos com novo tempo
        existing = await check_appointment_conflict(
            appointment["shop_id"],
            new_time,
            exclude_id=appointment_id
        )
        if existing:
            log_warning(
                "Update would create conflict",
                context={
                    "appointment_id": appointment_id,
                    "new_time": new_time,
                    "correlation_id": correlation_id,
                }
            )
            raise ConflictError(
                message="Time slot already booked",
                conflict_type="double_booking"
            )

    # Verificar status
    if appointment["status"] == "completed":
        raise ValidationError(
            message="Cannot update completed appointment",
            context={"current_status": appointment["status"]}
        )

    # Aplicar atualizações
    updated = {**appointment, **updates}
    updated["updated_at"] = datetime.utcnow().isoformat()

    await save_appointment(updated)

    log_info(
        "Appointment updated",
        context={
            "appointment_id": appointment_id,
            "user_id": user["id"],
            "correlation_id": correlation_id,
        }
    )

    return updated


# ============================================================================
# FUNÇÕES HELPER (SIMULADAS)
# ============================================================================

async def get_user_by_email(email: str) -> Optional[Dict]:
    """Simulação: Buscar usuário por email"""
    return None

def verify_password(password: str, hash: str) -> bool:
    """Simulação: Verificar senha"""
    return True

def generate_token(user: Dict) -> str:
    """Simulação: Gerar token JWT"""
    return "fake-jwt-token"

def decode_token(token: str) -> Dict:
    """Simulação: Decodificar token JWT"""
    return {"user_id": "123", "exp": 9999999999}

async def get_shop_by_id(shop_id: str) -> Optional[Dict]:
    """Simulação: Buscar barbearia"""
    return {"id": shop_id, "name": "Barbearia Teste"}

async def get_service_by_id(service_id: str) -> Optional[Dict]:
    """Simulação: Buscar serviço"""
    return {"id": service_id, "name": "Corte de Cabelo"}

async def check_appointment_conflict(shop_id: str, start_time: datetime) -> Optional[Dict]:
    """Simulação: Verificar conflito de agendamento"""
    return None

def generate_id() -> str:
    """Simulação: Gerar ID único"""
    return f"apt_{int(time.time())}"

async def save_appointment(appointment: Dict) -> None:
    """Simulação: Salvar agendamento"""
    pass

async def db_execute(query: str, params: list) -> list:
    """Simulação: Executar query no banco"""
    return []

async def cache_get(key: str) -> Optional[Any]:
    """Simulação: Get do cache"""
    return None

async def cache_set(key: str, data: Any, ttl: int) -> None:
    """Simulação: Set no cache"""
    pass

async def validate_inputs(inputs: Dict) -> None:
    """Simulação: Validar inputs"""
    pass

async def fetch_data(id: str) -> Dict:
    """Simulação: Buscar dados"""
    return {"id": id}

def process_data(data: Dict) -> Dict:
    """Simulação: Processar dados"""
    return data

async def save_result(result: Dict) -> None:
    """Simulação: Salvar resultado"""
    pass

async def get_appointment_by_id(appointment_id: str) -> Optional[Dict]:
    """Simulação: Buscar agendamento por ID"""
    return {"id": appointment_id, "status": "pending"}

async def call_payment_gateway(amount: float, card_data: Dict) -> Dict:
    """Simulação: Chamar gateway de pagamento"""
    return {"success": True, "payment_id": "pay_123"}
