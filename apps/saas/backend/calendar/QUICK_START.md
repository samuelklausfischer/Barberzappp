# Quick Start - Calendar Integrations

## 🚀 Setup Rápido (5 minutos)

### 1. Criar Tabelas no Banco
```bash
cd /root/barber
psql -U postgres -d barberzap -f database/10_calendar_integrations.sql
```

### 2. Instalar Depêndencias Python
```bash
cd /root/barber/backend
pip install google-api-python-client==2.100.0 \
            google-auth-httplib2==0.1.1 \
            google-auth-oauthlib==1.0.0 \
            icalendar==5.0.13 \
            pytz==2023.3.post1
```

### 3. Configurar Environment Variables

No arquivo `.env`:
```bash
# Google Calendar (obter em console.cloud.google.com)
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=sua-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/calendar/google/callback

# Redis (já configurado)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Testar Google OAuth (Opcional)

Criar script `test_google.py`:
```python
import asyncio
import os
from backend.calendar import GoogleCalendarService

async def test():
    service = GoogleCalendarService()
    auth_url = service.get_auth_url(state="test_123")
    print(f"✅ OAuth URL Gerada:\n{auth_url}")
    print(f"\n Cole no navegador e autentique...")

asyncio.run(test())
```

Executar:
```bash
python test_google.py
```

## 📱 Testar Frontend

### 1. Usar Component CalendarIntegration
```tsx
import { CalendarIntegration } from './components/CalendarIntegration';

function App() {
  return (
    <div>
      <CalendarIntegration 
        clientId="your-client-id" 
        shopId="your-shop-id" 
      />
    </div>
  );
}
```

### 2. Usar Component ICSExport
```tsx
import { ICSExport } from './components/ICSExport';

function ExportPage() {
  return (
    <ICSExport 
      clientId="your-client-id" 
      shopId="your-shop-id" 
    />
  );
}
```

## 🔧 API Routes Pendentes

É necessário criar os endpoints HTTP em `backend/api/calendar_routes.py`:

```python
from fastapi import APIRouter, Depends
from backend.calendar import GoogleCalendarService, ICSExporter

router = APIRouter(prefix="/calendar", tags=["calendar"])

# List calendars
@router.get("/integrations/{client_id}")
async def get_calendars(client_id: str, shop_id: str):
    # Implementar
    pass

# Sync calendar
@router.post("/integrations/{client_id}/{calendar_id}/sync")
async def sync_calendar(client_id: str, calendar_id: str):
    # Implementar
    pass

# Export ICS
@router.post("/export/ics")
async def export_ics(appointments: list, shop_id: str):
    exporter = ICSExporter()
    ics_content = exporter.export_appointments(appointments)
    return {"ics_content": ics_content, "filename": "barberzap.ics"}

# Google OAuth URL
@router.get("/google/auth-url")
async def google_auth_url(client_id: str, shop_id: str):
    service = GoogleCalendarService()
    auth_url = service.get_auth_url(state=client_id)
    return {"auth_url": auth_url, "state": client_id}

# Google OAuth Callback
@router.post("/google/oauth/callback")
async def google_oauth_callback(credentials: dict):
    service = GoogleCalendarService()
    token_data = await service.exchange_code_for_tokens(
        code=credentials['code'],
        state=credentials['state']
    )
    # Salvar no banco...
    return {"success": True}
```

## ✅ Checklist de Setup

- [ ] Criar tabelas SQL
- [ ] Instalar dependências Python
- [ ] Configurar Google Cloud Console
- [ ] Adicionar environment variables
- [ ] Criar API routes
- [ ] Testar Google OAuth flow
- [ ] Testar sync de appointments
- [ ] Testar export ICS
- [ ] Integrar no frontend existente

## 🆘 Problemas Comuns

### Error: `redirect_uri_mismatch`
- **Causa**: Google não reconhece a URI de redirect
- **Solução**: Adicionar URI exata no Google Cloud Console

### Error: `relation "client_calendars" does not exist`
- **Causa**: Tabelas não foram criadas
- **Solução**: Executar SQL de migração

### Error: `calendar` module not found
- **Causa**: Diretório está no path incorreto
- **Solução**: Verificar imports, usar `backend.calendar.*`

## 📚 Mais Informações

Veja documentação completa:
`/root/barber/backend/calendar/README.md`
