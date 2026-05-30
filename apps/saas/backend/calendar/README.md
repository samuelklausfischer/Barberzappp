# BarberZap - Calendar Integrations

Integrações de calendário para o BarberZap, permitindo sincronizar agendamentos com calendários externos (Google, Outlook, Apple).

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Componentes React](#componentes-react)
- [Troubleshooting](#troubleshooting)

## Visão Geral

Este módulo fornece integração completa com calendários externos:

### Funcionalidades

- ✅ **Google Calendar**: Integração OAuth 2.0 completa
- ✅ **ICS Export**: Exportar para qualquer calendário compatível
- ✅ **Sync Bidirecional**: Sincronização em ambas as direções
- ✅ **Detecção de Conflitos**: Identificação automática de conflitos de horário
- ✅ **Auto-refresh**: Tokens são renovados automaticamente
- ✅ **UI React Interface**: Componentes prontos para uso

### Arquitetura

```
/backend/calendar/
├── __init__.py           # Exportações do pacote
├── exceptions.py         # Exceções personalizadas
├── google_calendar.py    # Integração Google Calendar
├── ics_exporter.py       # Exportador ICS
├── sync_job.py          # BullMQ sync jobs
└── README.md            # Este arquivo

/src/components/
├── CalendarIntegration.tsx  # Interface de integrações
└── ICSExport.tsx            # Interface de exportação

/src/hooks/
└── useCalendarIntegrations.ts  # Hooks React

/database/
└── 10_calendar_integrations.sql  # Tabelas do banco
```

## Instalação

### 1. Dependências Python

Adicione ao `backend/requirements.txt`:

```txt
# Calendar Integrations
google-api-python-client==2.100.0
google-auth-httplib2==0.1.1
google-auth-oauthlib==1.0.0
icalendar==5.0.13
zoneinfo==0.2.1
```

Instale as dependências:

```bash
cd /root/barber/backend
pip install -r requirements.txt
```

### 2. Criar Tabelas do Banco

Execute o SQL de criação das tabelas:

```bash
psql -U postgres -d barberzap -f database/10_calendar_integrations.sql
```

Ou via Supabase:

```bash
cd /root/barber
supabase db reset
```

### 3. Configurar Google Calendar API

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione existente
3. Ative "Google Calendar API":
   - APIs & Services → Library → "Google Calendar API" → Enable
4. Crie credenciais OAuth 2.0:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     http://localhost:8000/api/calendar/google/callback
     https://yourdomain.com/api/calendar/google/callback
     ```
5. Copie `Client ID` e `Client Secret`

## Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env` ou `config.py`:

```bash
# Google Calendar
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/calendar/google/callback

# Redis (para BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database
DATABASE_URL=postgresql://user:pass@localhost/barberzap
```

### Configuração Supabase

No código Python para conectar com Supabase:

```python
from supabase import create_client

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(supabase_url, supabase_key)
```

## Uso

### Python API

#### 1. Google Calendar OAuth Flow

```python
from calendar import GoogleCalendarService

# Inicializar serviço
service = GoogleCalendarService(
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    redirect_uri=os.getenv('GOOGLE_REDIRECT_URI'),
)

# Obter URL de autorização
state = "random_state_string"
auth_url = service.get_auth_url(state=state)
print(f"Visite: {auth_url}")

# Após usuário autorizar, trocar code por token
await credentials = service.exchange_code_for_tokens(
    code="authorization_code_from_callback",
    state=state
)

# Salvar credenciais no banco
await supabase.table('client_calendars').insert({
    'client_id': client_id,
    'shop_id': shop_id,
    'calendar_type': 'google',
    'access_token': credentials.access_token,
    'refresh_token': credentials.refresh_token,
    'calendar_id': 'primary',
}).execute()
```

#### 2. Criar Evento no Google Calendar

```python
from datetime import datetime, timedelta

# Criar evento
event = await service.create_event(
    calendar_id='primary',
    summary='Corte de Cabelo - João Silva',
    start=datetime.now() + timedelta(days=1, hours=14),
    end=datetime.now() + timedelta(days=1, hours=15),
    description='Agendamento BarberZap\nServiço: Corte\nPreço: R$ 50,00',
    location='Barbearia Central',
    attendees=['joao@email.com', 'barbeiro@email.com'],
    color_id='2',  # Confirmed
    credentials=credentials,
    check_conflicts=True
)

print(f"Evento criado: {event.id}")
```

#### 3. Sincronizar Agendamentos

```python
from calendar import GoogleCalendarService

service = GoogleCalendarService()

# Buscar agendamentos da barbearia
appointments = await supabase.table('appointments').select('*') \
    .eq('client_id', client_id) \
    .gte('scheduled_at', datetime.now() - timedelta(days=30)) \
    .execute()

# Sincronizar com Google Calendar
results = await service.sync_appointments(
    client_id=client_id,
    calendar_id='primary',
    appointments=appointments.data,
    credentials=credentials,
    since_date=datetime.now() - timedelta(days=30)
)

print(f"Sync finalizado: {results}")
```

#### 4. Exportar para ICS

```python
from calendar import ICSExporter

exporter = ICSExporter(timezone='America/Sao_Paulo')

# Exportar agendamento único
ics_content = exporter.export_appointment(appointment)

# Exportar múltiplos
ics_content = exporter.export_appointments(
    appointments=appointments,
    from_date=datetime.now() - timedelta(days=7),
    to_date=datetime.now() + timedelta(days=30),
    status_filter=['scheduled', 'confirmed']
)

# Salvar em arquivo
exporter.save_to_file(
    appointments=appointments,
    filename='barberzap-calendar.ics'
)

# Streaming para download
stream = exporter.stream_ics_file(appointments)
```

#### 5. BullMQ Sync Job

```python
from calendar import CalendarSyncJob, SyncJobData
from bullmq import Queue
import redis

# Conectar ao Redis
redis_connection = redis.Redis()

# Criar fila
queue = Queue('calendar-sync', redis_connection)

# Criar job de sync
job_data = SyncJobData(
    client_calendar_id=calendar_id,
    client_id=client_id,
    shop_id=shop_id,
    calendar_type='google',
    calendar_id='primary',
    access_token=credentials.access_token,
    refresh_token=credentials.refresh_token,
    sync_direction='to_external',
    appointments=appointments,
)

job = await CalendarSyncJob.queue_sync_job(queue, job_data)
print(f"Job enfileirado: {job.id}")
```

### React Components

#### 1. CalendarIntegration Component

```tsx
import { CalendarIntegration } from '../components/CalendarIntegration';

function MyComponent() {
  return (
    <CalendarIntegration 
      clientId="client-uuid" 
      shopId="shop-uuid" 
    />
  );
}
```

#### 2. ICSExport Component

```tsx
import { ICSExport } from '../components/ICSExport';

function ExportPage() {
  return (
    <ICSExport 
      clientId="client-uuid" 
      shopId="shop-uuid" 
    />
  );
}
```

#### 3. Using Hooks

```tsx
import { 
  useCalendarIntegrations,
  useConnectGoogleCalendar 
} from '../hooks/useCalendarIntegrations';

function MyComponent() {
  const { calendars, loading, refetch } = useCalendarIntegrations(
    clientId,
    shopId
  );
  
  const connectGoogle = useConnectGoogleCalendar();
  
  const handleConnect = async () => {
    const { authUrl } = await connectGoogle.getAuthUrl(shopId, clientId);
    // Open popup...
  };
  
  return <div>{/* Your UI */}</div>;
}
```

## API Endpoints

### Calendar Integrations

#### List Client Calendars
```
GET /api/calendar/integrations/{client_id}?shop_id={shop_id}
```

#### Update Calendar Settings
```
PUT /api/calendar/integrations/{client_id}/{calendar_id}
Content-Type: application/json

{
  "enabled": true,
  "sync_direction": "to_external",
  "auto_sync": true,
  "conflict_resolution": "barber_priority"
}
```

#### Disconnect Calendar
```
DELETE /api/calendar/integrations/{client_id}/{calendar_id}
```

#### Sync Calendar
```
POST /api/calendar/integrations/{client_id}/{calendar_id}/sync
```

### Google Calendar

#### Get OAuth URL
```
GET /api/calendar/google/auth-url?client_id={client_id}&shop_id={shop_id}
Response: { "auth_url": "...", "state": "..." }
```

#### OAuth Callback
```
POST /api/calendar/google/oauth/callback
Content-Type: application/json

{
  "client_id": "...",
  "code": "authorization_code",
  "state": "state_string",
  "access_token": "...",
  "refresh_token": "..."
}
```

### Export

#### Export to ICS
```
POST /api/calendar/export/ics?shop_id={shop_id}
Content-Type: application/json

{
  "appointments": [
    {
      "id": "apt-uuid",
      "title": "...",
      "start": "2024-03-04T14:00:00Z",
      "end": "2024-03-04T15:00:00Z",
      "description": "...",
      "location": "...",
      "status": "confirmed",
      ...
    }
  ]
}
```

## Componentes React

### CalendarIntegration.tsx

Interface completa para gerenciar integrações de calendário:

**Features:**
- Listagem de calendários conectados
- Botão "Connect Google Calendar" com OAuth flow
- Toggle sync settings (enabled, direction, auto-sync)
- Sync status indicator (success/failed/in_progress)
- Last synced time com formatação relativa
- Botão "Sync now" com loading state
- Botão "Disconnect" com confirmação
- Modal para configurações avançadas
- Conflict resolution settings

**Props:**
```tsx
interface CalendarIntegrationProps {
  clientId: string;
  shopId: string;
}
```

### ICSExport.tsx

Interface para exportar agendamentos para ICS:

**Features:**
- Date picker (de/até)
- Filter by status (scheduled, confirmed, completed, etc.)
- Preview before download
- One-click download (.ics file)
- Appointment list preview
- Loading states

**Props:**
```tsx
interface ICSExportProps {
  clientId: string;
  shopId: string;
}
```

## Troubleshooting

### Google Calendar OAuth Error

**Erro:** `redirect_uri_mismatch`

**Solução:**
1. Verifique se `GOOGLE_REDIRECT_URI` está configurado corretamente
2. Certifique-se que a URI está adicionada no Google Cloud Console
3. Atualize as URIs autorizadas e tente novamente

### Token Expired Error

**Erro:** `invalid_grant` ou token expirado

**Solução:**
1. Use `refresh_token` para obter novo `access_token`
2. Se não tiver refresh token, solicite re-autenticação ao usuário
3. Configurar auto-refresh no GoogleCalendarService

### Sync Job Not Running

**Erro:** Job fica em status 'pending' ou 'failed'

**Solução:**
1. Verifique se BullMQ worker está rodando
2. Confirme conexão com Redis
3. Verifique logs do worker: `tail -f logs/bullmq-worker.log`

### ICS Export Invalid Format

**Erro:** Calendário não importa o arquivo ICS

**Solução:**
1. Valide conteúdo ICS usando validador RFC 5545
2. Verifique encoding (deve ser UTF-8)
3. Certifique-se que timezone está configurado corretamente

### Database Connection Issues

**Erro:** `relation "client_calendars" does not exist`

**Solução:**
1. Execute o SQL de criação das tabelas
2. Verifique se migrou para o banco correto
3. Confirme permissões do usuário PostgreSQL

### Webhook Not Receiving Updates

**Erro:** Calendário externo não dispara sync

**Solução:**
1. Verifique se webhook foi configurado
2. Confirme URL do webhook está pública
3. Logs do webhook em `/api/webhooks/logs`

## Scripts Úteis

### Testar Google OAuth Localmente

```python
# test_google_oauth.py
import asyncio
from calendar import GoogleCalendarService

async def test():
    service = GoogleCalendarService()
    auth_url = service.get_auth_url(state="test")
    print("URL:", auth_url)
    
    code = input("Enter code: ")
    credentials = await service.exchange_code_for_tokens(code)
    print("Access Token:", credentials.access_token)
    print("Refresh Token:", credentials.refresh_token)

asyncio.run(test())
```

### Testar ICS Export

```python
# test_ics_export.py
from calendar import ICSExporter
import json

exporter = ICSExporter()

with open('test_appointments.json') as f:
    appointments = json.load(f)

ics = exporter.export_appointments(appointments)
print(ics)
```

### Monitor Sync Jobs

```python
# monitor_jobs.py
from bullmq import Queue
import redis

redis_connection = redis.Redis()
queue = Queue('calendar-sync', redis_connection)

async def monitor():
    for job in await queue.getRepeatableJobs():
        print(f"Job: {job.id}, Status: {job.opts}")

# Executar periodicamente
```

## Próximos Passos

### Roadmap

- [ ] Outlook Calendar Integration (Microsoft Graph API)
- [ ] Apple Calendar Integration
- [ ] Webhook support para sync em tempo real
- [ ] Calendar view no dashboard
- [ ] Drag-and-drop para remarcação
- [ ] Recurring appointments
- [ ] Multi-calendar support por cliente
- [ ] Analytics de no-shows e cancelamentos

### Melhorias

- [ ] Rate limiting para APIs externas
- [ ] Caching de eventos do calendário
- [ ] Offline support
- [ ] PWA para sincronização em background
- [ ] Conflict resolution UI melhorado

## Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `logs/calendar.log`
2. Consulte documentação do Google Calendar API
3. Abra issue no repositório

## Licença

Copyright © 2024 BarberZap. Todos os direitos reservados.
