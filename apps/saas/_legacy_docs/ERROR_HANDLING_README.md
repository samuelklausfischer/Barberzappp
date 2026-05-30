# BarberZap Error Handling System

Sistema completo de error handling para BarberZap, com handlers globais tanto para frontend (React/TypeScript) quanto para backend (Python).

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Frontend - TypeScript/React](#frontend----typescriptreact)
- [Backend - Python](#backend---python)
- [Boas Práticas](#boas-práticas)
- [Exemplos](#exemplos)
- [Monitoramento e Integrações](#monitoramento-e-integrações)

---

## Visão Geral

O sistema de error handling proporciona:

- ✅ Tratamento consistente de erros em toda a aplicação
- ✅ Mensagens amigáveis ao usuário
- ✅ Logging estruturado (JSON format)
- ✅ Correlation IDs para tracing
- ✅ Recovery suggestions automáticas
- ✅ Diferenciação entre dev/prod
- ✅ Erros customizados por categoria
- ✅ React Error Boundary
- ✅ Handlers globais

---

## Frontend - TypeScript/React

### Estrutura dos Arquivos

```
src/error/
├── types.ts          - Tipos de erro (ErrorCategory, ErrorSeverity, etc.)
├── errors.ts         - Classes de erro customizadas
├── logger.ts         - Logger estruturado
├── globalErrorHandler.ts - Handler global de erros
├── ErrorBoundary.tsx     - React Error Boundary
└── index.ts          - Exportações centrais
```

### Instalação e Configuração

#### 1. Adicionar ErrorBoundary ao Aplicativo

No seu `main.tsx` ou `App.tsx`:

```tsx
import React from 'react';
import { ErrorBoundary } from '@/error';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

#### 2. Registrar Toast/Notification (Opcional)

```tsx
import { registerToast } from '@/error';
import { toast } from 'sonner'; // ou outra lib de toast

// Seu sistema de toast
registerToast((message, type) => {
  toast[type](message);
});
```

### Tipos de Erro Disponíveis

```typescript
import {
  NetworkError,
  TimeoutError,
  ValidationError,
  AuthError,
  TokenExpiredError,
  NotFoundError,
  ConflictError,
  ServerError,
  UnknownError,
} from '@/error';

// Usando diretamente
throw new ValidationError('email', 'Email inválido');

throw new NetworkError('Falha de conexão');

throw new AuthError('Credenciais inválidas');
```

### Criando Erros Customizados

```typescript
import { BaseAppError, ErrorCategory, ErrorSeverity } from '@/error';

class PaymentError extends BaseAppError {
  constructor(message: string, options = {}) {
    super(
      'PAYMENT_ERROR',
      message,
      'Não foi possível processar o pagamento. Tente novamente.',
      ErrorCategory.SERVER,
      ErrorSeverity.HIGH,
      {
        ...options,
        recoverable: true,
        retryable: true,
        recoverySuggestions: [
          'Verifique os dados do cartão',
          'Tente outro método de pagamento',
          'Contate o suporte se o erro persistir',
        ],
      }
    );
  }
}
```

### Usando o Handler Global

```typescript
import { handleError } from '@/error';

try {
  await someAsyncOperation();
} catch (error) {
  handleError(error, {
    component: 'Dashboard',
    action: 'loadAppointments',
    additionalData: { userId: '123' },
  });
}
```

### Wrapping Funções Async

```typescript
import { withErrorHandling, withSilentErrorHandling } from '@/error';

// Com notificação ao usuário
const safeFetch = withErrorHandling(
  async (url: string) => {
    const response = await fetch(url);
    return response.json();
  }
);

// Sem notificação (logging silencioso)
const silentFetch = withSilentErrorHandling(
  async (url: string) => {
    const response = await fetch(url);
    return response.json();
  }
);
```

### Criar Erro a partir de HTTP Status

```typescript
import { createErrorFromStatus } from '@/error';

try {
  const response = await fetch('/api/appointments');
  if (!response.ok) {
    throw createErrorFromStatus(response.status, response.statusText, {
      component: 'Agenda',
      action: 'fetchAppointments',
    });
  }
} catch (error) {
  handleError(error);
}
```

### Accessando Logs e Métricas

```typescript
import { errorLogger } from '@/error';

// Obter métricas
const metrics = errorLogger.getMetrics();
console.log('Total errors:', metrics.totalErrors);
console.log('By category:', metrics.errorsByCategory);

// Obter erros recentes
const recent = errorLogger.getRecentErrors(10);

// Exportar logs
const logsJson = errorLogger.exportLogs();
```

### HOC para Proteger Componentes

```typescript
import { withErrorBoundary } from '@/error';

const SafeDashboard = withErrorBoundary(Dashboard, {
  showErrorDetails: true,
  showReportLink: true,
  onError: (error, errorInfo) => {
    console.error('Dashboard error:', error);
  },
});

// Usar como wrapper
<SafeDashboard data={data} />
```

---

## Backend - Python

### Estrutura dos Arquivos

```
backend/error/
├── __init__.py       - Exportações centrais
├── exceptions.py     - Classes de exceção customizadas
├── logger.py         - Logger estruturado JSON
├── handlers.py       - Error handlers para frameworks
└── middleware.py     - Logging middleware para requests
```

### Instalação e Configuração

#### FastAPI Integration

```python
from fastapi import FastAPI
from error import (
    create_error_middleware,
    create_logging_middleware,
)

app = FastAPI(title="BarberZap API")

# Setup error handling middleware
create_error_middleware(app, framework="fastapi", include_stack_trace=False)

# Setup logging middleware
create_logging_middleware(app, framework="fastapi")

# Optional: Slow request logging
from error import log_slow_requests
log_slow_requests(app, threshold_ms=1000, framework="fastapi")
```

#### Flask Integration

```python
from flask import Flask
from error import (
    create_error_middleware,
    create_logging_middleware,
)

app = Flask(__name__)

# Setup error handling
create_error_middleware(app, framework="flask", include_stack_trace=False)

# Setup logging
create_logging_middleware(app, framework="flask")

# Optional: Slow request logging
from error import log_slow_requests
log_slow_requests(app, threshold_ms=1000, framework="flask")
```

### Exceções Disponíveis

```python
from error import (
    ValidationError,
    AuthenticationError,
    TokenExpiredError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    InternalServerError,
    ServiceUnavailableError,
)

# Validation (400)
raise ValidationError(message="Email inválido", field="email")

# Authentication (401)
raise AuthenticationError("Token inválido")

# Authorization (403)
raise AuthorizationError(required_permission="admin")

# Not Found (404)
raise NotFoundError(resource="Appointment", resource_id="123")

# Conflict (409)
raise ConflictError(
    message="Horário já ocupado",
    conflict_type="double_booking"
)

# Server Error (500)
raise InternalServerError(
    message="Erro ao salvar dados",
    original_exception=original_error
)
```

### Logging Estruturado

```python
from error import (
    log_error,
    log_warning,
    log_info,
    log_debug,
    get_correlation_id,
    generate_correlation_id,
)

# Info
log_info("User logged in", context={"user_id": "123"})

# Warning
log_warning("Cache miss", context={"key": "appointments:123"})

# Error
log_error(
    "Failed to process payment",
    error=exception,
    error_code="PAYMENT_FAILED",
    context={"order_id": "456"},
)

# Debug
log_debug("Database query", context={"query": "SELECT * FROM..."})

# Access correlation ID
correlation_id = get_correlation_id()
```

### Logging de Requests/Responses

Todos os requests são automaticamente logados com:

- ✅ HTTP method e path
- ✅ Status code
- ✅ Duration (ms)
- ✅ Client IP
- ✅ User-Agent
- ✅ User ID (se disponível)
- ✅ Correlation ID

### Sanitização de Logs

```python
from error import sanitize_log_data

data = {
    "username": "john",
    "password": "secret123",
    "email": "john@example.com",
}

sanitized = sanitize_log_data(data)
# Result: {"username": "john", "password": "***REDACTED***", "email": "john@example.com"}
```

### Helpers de Validação

```python
from error import (
    validate_and_raise,
    require_condition,
    ValidationError,
)

# Validar com custom error
validate_and_raise(
    email and "@" in email,
    ValidationError,
    "Email inválido",
    field="email"
)

# Validar simples
require_condition(
    user_id is not None,
    "User ID is required"
)
```

### Decorator para Rotas

```python
from error import with_error_handling

@with_error_handling(framework="flask")
def create_appointment():
    # O erro será capturado e formatado automaticamente
    pass
```

---

## Boas Práticas

### Frontend

1. **Sempre envolva componentes vulneráveis com ErrorBoundary**
   ```tsx
   <ErrorBoundary>
     <Dashboard />
   </ErrorBoundary>
   ```

2. **Use categorias apropriadas de erro**
   - `ValidationError` para input do usuário
   - `AuthError` para login/permissões
   - `NetworkError` para problemas de conexão
   - `ConflictError` para conflitos (double-booking)

3. **Forneça recovery suggestions claras**
   ```typescript
   new ConflictError('Horário ocupado', {
     recoverySuggestions: [
       'Escolha outro horário',
       'Verifique o calendário',
     ],
   });
   ```

4. **Nunca logue dados sensíveis**
   ```typescript
   // ❌ RUIM
   context: { password: 'secret' }
   
   // ✅ BOM - O logger sanitiza automaticamente
   context: { password: 'secret' } // Será redacted
   ```

5. **Use `withSilentErrorHandling` para operações não-críticas**
   ```typescript
   const stats = await withSilentErrorHandling(fetchStats());
   // Não notifica usuário se falhar
   ```

### Backend

1. **Sempre use exceções customizadas**
   ```python
   # ❌ RUIM
   if not user:
       return jsonify({"error": "User not found"}), 404
   
   # ✅ BOM
   raise NotFoundError(resource="User", resource_id=user_id)
   ```

2. **Inclui contexto relevante**
   ```python
   raise ValidationError(
       message="Invalid date",
       field="start_time",
       context={
           "provided": "invalid-date",
           "expectedFormat": "YYYY-MM-DD HH:MM"
       }
   )
   ```

3. **Use correlation IDs para tracing**
   ```python
   correlation_id = generate_correlation_id()
   set_correlation_id(correlation_id)
   # Todos os logs terão este ID
   ```

4. **Sanitize logs com dados sensíveis**
   ```python
   log_info("User data", context={
       "user": sanitize_log_data(user_data)
   })
   ```

5. **Não logue stack traces em produção**
   ```python
   create_error_middleware(
       app,
       include_stack_trace=False  # False em prod
   )
   ```

---

## Exemplos

### Exemplo 1: Handler de API com Retries

```typescript
import { NetworkError, TimeoutError, withErrorHandling } from '@/error';

async function fetchWithRetry<T>(
  url: string,
  maxRetries = 3
): Promise<T> {
  const fetchFn = async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw createErrorFromStatus(response.status, response.statusText);
    }
    return response.json();
  };

  const safeFetch = withErrorHandling(fetchFn);

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await safeFetch();
    } catch (error) {
      if (error instanceof NetworkError || error instanceof TimeoutError) {
        if (i === maxRetries - 1) throw error;
        await delay(1000 * (i + 1)); // Exponential backoff
      } else {
        throw error; // Don't retry non-network errors
      }
    }
  }
  throw new NetworkError('Max retries exceeded');
}
```

### Exemplo 2: Handler de Agendamento

```python
from fastapi import FastAPI, HTTPException, Depends
from error import (
    ConflictError,
    NotFoundError,
    ValidationError,
    log_error,
)
from error import get_correlation_id

app = FastAPI()

@app.post("/appointments")
async def create_appointment(data: dict):
    try:
        # Validate
        if not data.get('shop_id'):
            raise ValidationError(message="shop_id is required", field="shop_id")
        
        # Check for conflicts
        if check_conflict(data['shop_id'], data['start_time']):
            raise ConflictError(
                message="Time slot already booked",
                conflict_type="double_booking",
                context={
                    "shop_id": data['shop_id'],
                    "start_time": data['start_time']
                }
            )
        
        # Create appointment
        appointment = create_appointment_db(data)
        
        log_info("Appointment created", context={
            "appointment_id": appointment.id,
            "correlation_id": get_correlation_id()
        })
        
        return appointment
        
    except (ConflictError, ValidationError, NotFoundError):
        # Re-raise known errors
        raise
    except Exception as e:
        # Wrap unknown errors
        log_error("Failed to create appointment", error=e)
        raise InternalServerError(original_exception=e)
```

### Exemplo 3: Componente com Error Boundary

```tsx
import React from 'react';
import { ErrorBoundary, withErrorBoundary } from '@/error';
import { NetworkError, ConflictError } from '@/error';

const SafeAgenda = (): JSX.Element => {
  const [appointment, setAppointment] = useState(null);
  
  const handleError = (error: unknown) => {
    if (error instanceof NetworkError) {
      console.log('Show offline UI');
    } else if (error instanceof ConflictError) {
      console.log('Show conflict resolution');
    }
  };
  
  return (
    <div>
      <ErrorBoundary onError={handleError}>
        <AppointmentList />
      </ErrorBoundary>
    </div>
  );
};

const SafeDashboard = withErrorBoundary(Dashboard, {
  showErrorDetails: import.meta.env.DEV,
  showReportLink: true,
});
```

---

## Monitoramento e Integrações

### Sentry Integration (Frontend)

No seu `main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// Register Sentry with error logger
import { errorLogger } from '@/error';
const originalLog = errorLogger.log.bind(errorLogger);
errorLogger.log = (error) => {
  Sentry.captureException(error);
  return originalLog(error);
};
```

### Sentry Integration (Backend)

No seu `main.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENV", "development"),
    integrations=[
        FastApiIntegration(),  # ou FlaskIntegration()
    ],
    traces_sample_rate=1.0,
)

# Our logger will send to Sentry automatically
```

### Datadog Integration

```python
from datadog import statsd
from error import get_error_handler

# Custom error handler with Datadog
class DatadogErrorHandler(ErrorHandler):
    def log_error(self, message, error=None, **kwargs):
        super().log_error(message, error, **kwargs)
        
        if error:
            statsd.increment('barberzap.error', tags=[
                f"error_type:{type(error).__name__}",
                f"error_code:{kwargs.get('error_code')}",
            ])
```

---

## Conclusão

Este sistema de error handling fornece:

- 🎯 **Consistência**: Erros tratados de forma uniforme em todo o sistema
- 🔍 **Visibilidade**: Logs estruturados e tracing com correlation IDs
- 💪 **Recuperação**: Sugestões automáticas e estratégias de retry
- 🚀 **Performance**: Logging assíncrono e não-bloqueante
- 🔐 **Segurança**: Sanitização automática de dados sensíveis
- 👥 **UX**: Mensagens amigáveis ao usuário em português

Para suporte adicional, consulte:
- Documentação dos erros específicos nos arquivos `types.ts` e `exceptions.py`
- Exemplos de uso nos comentários inline dos arquivos
- README do cache system para mais sobre monitoramento
