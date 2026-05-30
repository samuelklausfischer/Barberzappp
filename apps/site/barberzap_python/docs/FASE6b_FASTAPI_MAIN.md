# FASE 6b: FastAPI Main Entry Point Implementation

## Overview
Implementação do ponto de entrada principal do FastAPI para BarberZap SaaS.

## Data
2026-02-23

## Objetivos Concluídos ✅

### 1. FastAPI Application Setup
- ✅ Configuração do FastAPI com título "BarberZap API"
- ✅ Descrição: "AI-powered WhatsApp assistant for barbershops"
- ✅ Versão: 1.0.0
- ✅ Suporte a /docs (Swagger UI) e /redoc
- ✅ Lifespan context manager para startup/shutdown

### 2. CORS Middleware
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("APP_ENV") == "development" else os.getenv("ALLOWED_ORIGINS", "").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Environment Configuration
```python
from dotenv import load_dotenv
load_dotenv()
```
- ✅ Carrega variáveis de ambiente do arquivo .env
- ✅ Suporte a configurações de ambiente (APP_ENV)
- ✅ Uso de variáveis de ambiente para host/port/workers

### 4. Endpoints Implementados

#### Health Check Endpoints
- ✅ `GET /` - Root endpoint com informações da API
  ```json
  {
    "name": "BarberZap API",
    "version": "1.0.0",
    "status": "online",
    "environment": "development"
  }
  ```

- ✅ `GET /health` - Health check detalhado para monitoramento
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-02-23T16:46:00Z"
  }
  ```

#### Webhook Endpoints (FASE 6)
- ✅ `POST /webhook/barberzap-saas` - Evolution API webhook principal
  - Registrado via `create_barberzap_webhook_route(app)`
  - Workflow completo: Normalizer → Tenant Resolution → Context Building → AI → CRM → Response
  - Payload esperado (Evolution API):
    ```json
    {
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
                "conversation": "Olá, quero agendar um corte"
            },
            "pushName": "João Silva"
        }]
    }
    ```

- ✅ `POST /webhooks/whatsapp` - Placeholder para webhook WhatsApp
- ✅ `POST /webhooks/calendar` - Placeholder para notificações de calendário
- ✅ `POST /webhooks/ai` - Placeholder para respostas AI async

#### API Endpoints
- ✅ `POST /api/send-message` - Envio manual de mensagem
  ```json
  {
    "phone": "5511999999999",
    "message": "Your message here"
  }
  ```

- ✅ `GET /api/tenant/{tenant_id}` - Obter configuração do tenant
  ```json
  {
    "tenant_id": "tenant_123",
    "name": "Barbearia Exemplo",
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo"
  }
  ```

- ✅ `GET /api/schedule/available` - Obter horários disponíveis
  - Query params: `?date=2026-02-24`

- ✅ `POST /api/schedule` - Criar agendamento
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

### 5. Error Handling
- ✅ Global exception handler
- ✅ JSONResponse com códigos de status apropriados
- ✅ Logging de erros

### 6. Uvicorn Runner
```python
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("APP_HOST", "0.0.0.0"),
        port=int(os.getenv("APP_PORT", "8000")),
        reload=os.getenv("APP_ENV") == "development",
        workers=1 if os.getenv("APP_ENV") == "development" else 4
    )
```

### 7. Lifespan Manager
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting BarberZap API...")
    print(f"📍 Environment: {os.getenv('APP_ENV', 'development')}")
    print(f"🔗 Supabase URL: {os.getenv('SUPABASE_URL', 'Not configured')}")

    yield

    # Shutdown
    print("🛑 Shutting down BarberZap API...")
```

## Estrutura do Arquivo
```
barberzap_python/
├── main.py                     # ✅ Entry point (ATUALIZADO)
├── webhooks/
│   └── webhook_handler.py      # ✅ Webhook principal (FASE 6)
├── core/
│   ├── tenant_resolver.py      # ✅ Resolução de tenant
│   └── context_builder.py      # ✅ Construção de contexto
├── agents/
│   └── secretaria_universal.py # ✅ Agente AI
├── crm/
│   └── crm_manager.py          # ✅ Manager CRM
└── integrations/
    └── evolution_api.py        # ✅ Integration Evolution API
```

## Como Executar

### Desenvolvimento
```bash
cd "/root/Barberzap SITE/barberzap_python"
python3 main.py
```

### Produção
```bash
# Via uvicorn diretamente
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Via Python
APP_ENV=production python3 main.py
```

### Com Docker (recomendado)
```bash
docker build -t barberzap-api .
docker run -p 8000:8000 --env-file .env barberzap-api
```

## Variáveis de Ambiente (Exemplo)
```bash
# Environment
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# CORS
ALLOWED_ORIGINS=https://barberzap.com,https://app.barberzap.com

# Supabase
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_KEY=eyJhbGc...

# Evolution API
EVOLUTION_API_URL=https://evolution-api.com
EVOLUTION_API_KEY=api_key_here
```

## Rotas Disponíveis

### Health
- `GET /` - Informações da API
- `GET /health` - Health check

### Documentation
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc

### Webhooks
- `POST /webhook/barberzap-saas` - Evolution API webhook principal
- `POST /webhooks/whatsapp` - Webhook WhatsApp (placeholder)
- `POST /webhooks/calendar` - Webhook calendário (placeholder)
- `POST /webhooks/ai` - Webhook AI (placeholder)

### API
- `POST /api/send-message` - Enviar mensagem manual
- `GET /api/tenant/{tenant_id}` - Obter tenant
- `GET /api/schedule/available` - Horários disponíveis
- `POST /api/schedule` - Criar agendamento

## Status do Projeto

### FASE 6b: ✅ CONCLUÍDA
- ✅ FastAPI app configurado
- ✅ CORS middleware implementado
- ✅ Health check endpoints
- ✅ Evolution API webhook (/webhook/barberzap-saas)
- ✅ API endpoints (/api/send-message, /api/schedule, /api/tenant/{id})
- ✅ .env loading
- ✅ Uvicorn runner
- ✅ Lifespan context manager

### Próximos Passos
- [ ] FASE 7: Implementar lógica real dos endpoints
- [ ] FASE 8: Testes integrados
- [ ] FASE 9: Deploy e monitoramento

## Validação

Sintaxe do Python validada:
```bash
python3 -m py_compile main.py
# ✅ main.py syntax is valid
```

## Notas Técnicas

1. **Endpoints Placeholder**: Alguns endpoints marcados com TODO aguardam implementação de integrações reais.

2. **Webhook Handler**: O webhook principal `/webhook/barberzap-saas` já está implementado com o workflow completo via `webhook_handler.py`.

3. **Modularidade**: O código está estruturado de forma modular, com imports de módulos específicos para cada funcionalidade.

4. **Desenvolvimento**: A configuração atual permite hot-reload em modo desenvolvimento (`APP_ENV=development`).

5. **Produção**: Em produção, o uvicorn usará múltiplos workers (4 por padrão) para melhor performance.

## Documentação Referenciada
- FastAPI: https://fastapi.tiangolo.com/
- Evolution API: https://doc.evolution-api.com/
- Supabase: https://supabase.com/docs

---

**Status**: ✅ FASE 6b CONCLUÍDA
**Data**: 2026-02-23
**Developer**: BarberZap Team
