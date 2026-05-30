# Sistema de Preferências de Notificação - BarberZap

Implementação completa do sistema de preferências de notificação para o BarberZap, permitindo que clientes gerenciem como e quando recebem notificações.

## 📋 Visão Geral

Este sistema permite:
- ✅ Controle granular por tipo de notificação
- ✅ Seleção de canal (WhatsApp, Email, SMS, In-App, Nenhum)
- ✅ Configuração de preferência de horário (timing)
- ✅ Suporte a timezones
- ✅ Período de "Não Perturbar" (Do Not Disturb)
- ✅ Preview de mensagens antes de definir preferências
- ✅ Configurações padrão por barbearia
- ✅ Fallback inteligente para defaults da shop

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. `client_notification_preferences`

Armazena preferências individuais de cada cliente.

**Colunas:**
- `shop_id` (UUID, NOT NULL) - ID da barbearia
- `client_id` (UUID, NOT NULL) - ID do cliente
- `notification_type` (VARCHAR, NOT NULL) - Tipo de notificação
- `channel` (VARCHAR) - Canal preferido
- `enabled` (BOOLEAN) - Se está habilitado
- `timing` (VARCHAR) - Quando enviar
- `timezone` (VARCHAR) - Fuso horário do cliente
- `do_not_disturb_start` (TIME) - Início do período de silêncio
- `do_not_disturb_end` (TIME) - Fim do período de silêncio
- `created_at`, `updated_at` (TIMESTAMP) - Metadados

**Chave Primária:** `(shop_id, client_id, notification_type)`

#### 2. `shop_notification_defaults`

Configurações padrão aplicadas quando cliente não tem preferências definidas.

**Colunas:**
- `shop_id` (UUID, PRIMARY KEY) - ID da barbearia
- `default_channel` (VARCHAR) - Canal padrão
- `default_timezone` (VARCHAR) - Timezone padrão
- `*_enabled` (BOOLEAN) - Habilitar por tipo de notificação
- `*_timing` (VARCHAR) - Timing padrão por tipo
- `do_not_disturb_*` (TIME) - Período de silêncio global
- `max_notifications_per_day` (INTEGER) - Rate limiting
- `max_promotional_per_week` (INTEGER) - Limite promocional

#### 3. `notification_queue`

Fila de notificações agendadas para envio.

**Colunas:**
- `id` (UUID, PRIMARY KEY)
- `shop_id`, `client_id`, `notification_type`, `channel`
- `title`, `message`, `metadata` (JSONB)
- `scheduled_at`, `sent_at` (TIMESTAMP)
- `status` (VARCHAR) - pending, queued, sent, failed, skipped
- `attempt_count`, `max_attempts`, `error_message`
- `appointment_id` (UUID, FK)
- `created_at`, `updated_at` (TIMESTAMP)

#### 4. `notification_templates`

Templates de mensagem personalizados por barbearia.

**Colunas:**
- `id` (UUID, PRIMARY KEY)
- `shop_id`, `notification_type`, `channel`, `language`
- `title_template`, `message_template` (TEXT)
- `available_variables` (TEXT[])
- `active` (BOOLEAN)

#### 5. `notification_logs`

Histórico completo de notificações enviadas.

**Colunas:**
- `id` (UUID, PRIMARY KEY)
- `shop_id`, `client_id`, `queue_id`
- `notification_type`, `channel`, `status`
- `sent_at`, `delivered_at`, `read_at`
- `title_sent`, `message_sent`
- `delivery_attempts`, `error_message`
- `appointment_id`, `metadata` (JSONB)
- `created_at` (TIMESTAMP)

## 🚀 Instalação

### 1. Rodar Migration do Banco de Dados

```bash
# Via psql
psql -d barberzap -f /root/barber/database/09_notification_preferences.sql

# Via Supabase
supabase db push

# Via migrations (se usando ferramenta de migration)
npm run db:migrate -- --file=09_notification_preferences.sql
```

### 2. Configurar Backend

Adicionar o router de preferências ao FastAPI:

```python
# main.py ou app.py
from backend.api.notification_preferences import router as preferences_router

app.include_router(
    preferences_router,
    prefix="/api/preferences",
    tags=["notification_preferences"]
)
```

### 3. Instalar Dependências Python (se necessário)

```bash
pip install asyncpg fastapi pydantic python-dateutil
```

### 4. Configurar Variáveis de Ambiente

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/barberzap
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:8000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 📊 API Endpoints

### GET `/api/preferences/{client_id}`

Obtém todas as preferências de notificação de um cliente.

**Query Params:**
- `shop_id` (required) - ID da barbearia

**Response:**
```json
{
  "shop_id": "uuid",
  "client_id": "uuid",
  "preferences": [
    {
      "shop_id": "uuid",
      "client_id": "uuid",
      "notification_type": "booking_confirmation",
      "channel": "whatsapp",
      "enabled": true,
      "timing": "instant",
      "timezone": "America/Sao_Paulo",
      "do_not_disturb_start": null,
      "do_not_disturb_end": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "shop_defaults": { ... },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### PUT `/api/preferences/{client_id}`

Atualiza preferências de notificação de um cliente.

**Query Params:**
- `shop_id` (required) - ID da barbearia

**Request Body:**
```json
[
  {
    "notification_type": "booking_confirmation",
    "channel": "whatsapp",
    "enabled": true,
    "timing": "instant",
    "timezone": "America/Sao_Paulo",
    "do_not_disturb_start": null,
    "do_not_disturb_end": null
  }
]
```

**Response:** Array de preferências atualizadas

### GET `/api/preferences/{client_id}/preview/{notification_type}`

Gera preview de notificação com base nas preferências do cliente.

**Query Params:**
- `shop_id` (required) - ID da barbearia

**Response:**
```json
{
  "notification_type": "booking_confirmation",
  "channel": "whatsapp",
  "title": "✅ Agendamento Confirmado",
  "message": "Olá João! 🎉\n\nSeu agendamento...",
  "variables": {
    "client_name": "João",
    "date": "01/01/2024",
    "time": "14:00",
    ...
  }
}
```

### POST `/api/preferences/default`

Define configurações padrão da barbearia.

**Query Params:**
- `shop_id` (required) - ID da barbearia

**Request Body:**
```json
{
  "default_channel": "whatsapp",
  "default_timezone": "America/Sao_Paulo",
  "booking_confirmation_enabled": true,
  "reminder_24h_enabled": true,
  "do_not_disturb_enabled": true,
  "do_not_disturbo_start": "22:00",
  "do_not_disturb_end": "08:00"
}
```

### POST `/api/preferences/queue`

Enfileira notificação respeitando preferências do cliente.

**Request Body:**
```json
{
  "appointment_id": "uuid",
  "notification_type": "reminder_24h",
  "scheduled_at": "2024-01-01T14:00:00Z",
  "metadata": {}
}
```

**Response:**
```json
{
  "status": "queued",
  "queue_id": "uuid",
  "channel": "whatsapp",
  "scheduled_at": "2024-01-01T14:00:00Z"
}
```

## 🎨 Uso no Frontend (React)

### Componente NotificationPreferences

```tsx
import { NotificationPreferences } from '../components/NotificationPreferences';

function ClientSettings() {
  const shopId = 'shop-uuid';
  const clientId = 'client-uuid';

  return (
    <div>
      <h1>Configurações de Notificação</h1>
      <NotificationPreferences 
        shopId={shopId}
        clientId={clientId}
      />
    </div>
  );
}
```

### Hook useNotificationPreferences

```tsx
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

function MyComponent() {
  const { 
    preferences, 
    loading, 
    error, 
    refetch 
  } = useNotificationPreferences(shopId, clientId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {preferences?.map(pref => (
        <div key={pref.notification_type}>
          {pref.notification_type}: {pref.enabled ? 'On' : 'Off'}
        </div>
      ))}
    </div>
  );
}
```

### Hook useUpdatePreferences

```tsx
import { useUpdatePreferences } from '../hooks/useNotificationPreferences';

function SaveButton({ shopId, clientId, preferences }) {
  const updatePreferences = useUpdatePreferences();

  const handleSave = async () => {
    try {
      await updatePreferences(shopId, clientId, preferences);
      alert('Saved successfully!');
    } catch (error) {
      alert('Error saving preferences');
    }
  };

  return <button onClick={handleSave}>Save Preferences</button>;
}
```

### Hook useNotificationPreview

```tsx
import { useNotificationPreview } from '../hooks/useNotificationPreferences';

function PreviewButton({ shopId, clientId, notificationType }) {
  const { preview, loading, loadPreview } = useNotificationPreview(shopId, clientId);

  const handlePreview = () => {
    loadPreview(notificationType);
  };

  return (
    <div>
      <button onClick={handlePreview}>
        Show Preview
      </button>
      {loading && <div>Loading preview...</div>}
      {preview && (
        <div>
          <h3>{preview.title}</h3>
          <pre>{preview.message}</pre>
        </div>
      )}
    </div>
  );
}
```

### Hook useTimezones

```tsx
import { useTimezones } from '../hooks/useNotificationPreferences';

function TimezoneSelector() {
  const timezones = useTimezones();

  return (
    <select>
      {timezones.map(tz => (
        <option key={tz.value} value={tz.value}>
          {tz.label}
        </option>
      ))}
    </select>
  );
}
```

## 🔧 Backend Python

### Uso do Repository

```python
from backend.api.notification_preferences import NotificationPreferencesRepository

async def get_client_prefs():
    db = await get_db_connection()
    repo = NotificationPreferencesRepository(db)
    
    preferences = await repo.get_client_preferences(shop_id, client_id)
    single_pref = await repo.get_client_preference(shop_id, client_id, NotificationType.REMINDER_24H)
```

### Uso do Service

```python
from backend.api.notification_preferences import NotificationPreferencesService

async def send_with_preferences():
    db = await get_db_connection()
    service = NotificationPreferencesService(db, redis)
    
    channel = await service.get_notification_channel(
        shop_id,
        client_id,
        NotificationType.REMINDER_24H,
        scheduled_at
    )
    
    if channel:
        # Envia pela notificação
        pass
```

### Verificar Período de Silêncio

```python
from backend.api.notification_preferences import is_silent_period_sync

# Síncrono
if is_silent_period_sync(
    do_not_disturb_start="22:00",
    do_not_disturb_end="08:00",
    scheduled_at=datetime.now(),
    timezone_str="America/Sao_Paulo"
):
    # Não enviar
    pass
```

## 🎯 Tipos de Notificação

| Tipo | Descrição | Canais Comuns | Timing Padrão |
|------|-----------|---------------|---------------|
| `booking_confirmation` | Confirmação ao agendar | WhatsApp, Email | instant |
| `reminder_24h` | Lembrete 24h antes | WhatsApp, SMS | 24h_before |
| `reminder_2h` | Lembrete 2h antes | WhatsApp, SMS | 2h_before |
| `cancellation` | Cancelamento | WhatsApp, Email | instant |
| `reschedule` | Remarcação | WhatsApp, Email | instant |
| `promotional` | Promoções | WhatsApp, Email | morning |
| `monthly_report` | Relatório mensal | Email | morning |

## 🕐 Timing Options

| Timing | Descrição | Uso |
|--------|-----------|-----|
| `instant` | Envio imediato | Confirmações, cancelamentos |
| `1h_before` | 1 hora antes | Lembretes curtos |
| `24h_before` | 24 horas antes | Lembretes longos |
| `morning` | Entre 8h e 12h | Relatórios, promos |
| `afternoon` | Entre 12h e 18h | Não-críticos |
| `evening` | Entre 18h e 22h | Relatórios |

## 📱 Canais de Notificação

| Canal | Descrição | Custo | Velocidade |
|-------|-----------|-------|------------|
| `whatsapp` | Mensagem WhatsApp | Baixo | Alta |
| `email` | Email detalhado | Muito Baixo | Média |
| `sms` | Mensagem SMS | Alto | Alta |
| `in_app` | Notificação no app | Grátis | Alta |
| `none` | Desabilitar | - | - |

## 🔗 Integração com BullMQ

O sistema está desenhado para integrar com BullMQ para processamento da fila de notificações:

```python
# Exemplo de worker BullMQ (Node.js)
// worker.js
const Queue = require('bullmq');
const { NotificationPreferencesService } = require('./backend/api/notification_preferences');

const notificationQueue = new Queue('notifications');

notificationQueue.process(async (job) => {
  const { appointment_id, notification_type } = job.data;
  
  // Busca canal adequado com base nas preferências
  const service = new NotificationPreferencesService(db, redis);
  const channel = await service.get_notification_channel(
    shop_id,
    client_id,
    notification_type,
    scheduled_at
  );
  
  if (channel && channel !== ChannelType.NONE) {
    // Envia notificação pelo canal adequado
    await sendNotification(channel, job.data);
  }
});
```

## 🧪 Testes

### Testar API Manualmente

```bash
# Obter preferências
curl http://localhost:8000/api/preferences/{client_id}?shop_id={shop_id}

# Atualizar preferências
curl -X PUT http://localhost:8000/api/preferences/{client_id}?shop_id={shop_id} \
  -H "Content-Type: application/json" \
  -d '[{
    "notification_type": "booking_confirmation",
    "channel": "whatsapp",
    "enabled": true,
    "timing": "instant",
    "timezone": "America/Sao_Paulo"
  }]'

# Preview de notificação
curl http://localhost:8000/api/preferences/{client_id}/preview/booking_confirmation?shop_id={shop_id}
```

### Testar Componente React

```bash
# Testar componente isoladamente
cd frontend
npm test -- NotificationPreferences

# ou com Storybook
npm run storybook
```

## 📊 Métricas e Monitoring

### Métricas Disponíveis

- Notificações enviadas por tipo
- Canal mais utilizado
- Taxa de leitura por canal
- Clientes com preferências definidas
- Notificações em período de silêncio (skipped)
- Taxa de erro por canal

### Queries de Análise

```sql
-- Taxa de preferências definidas
SELECT 
  COUNT(DISTINCT client_id) as total_clients,
  COUNT(DISTINCT CASE WHEN enabled THEN client_id END) as clients_with_notifications
FROM client_notification_preferences
WHERE shop_id = 'uuid';

-- Canais mais utilizados
SELECT 
  channel,
  COUNT(*) as usage_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM client_notification_preferences
WHERE channel != 'none' AND enabled = TRUE
GROUP BY channel
ORDER BY usage_count DESC;

-- Notificações em período de silêncio
SELECT 
  notification_type,
  COUNT(*) as skipped_count
FROM notification_queue
WHERE status = 'skipped'
GROUP BY notification_type;
```

## 🔒 Segurança

### Considerações de Segurança

1. **Autenticação:** Endpoints requerem token JWT
2. **Autorização:** Cliente só pode ver/editar suas próprias preferências
3. **RLS (Row Level Security):** Implementar no PostgreSQL
4. **Rate Limiting:** Limite de requisições por cliente
5. **Validação:** Validação rigorosa de inputs via Pydantic

### Exemplo de Política RLS

```sql
-- Permite cliente ver suas próprias preferências
CREATE POLICY client_can_view_own_preferences
ON client_notification_preferences
FOR SELECT
USING (
  client_id = auth.uid()
  AND shop_id IN (
    SELECT shop_id FROM clients WHERE id = auth.uid()
  )
);

-- Permite cliente atualizar suas próprias preferências
CREATE POLICY client_can_update_own_preferences
ON client_notification_preferences
FOR UPDATE
USING (client_id = auth.uid());
```

## 🚧 Roadmap Futuro

- [ ] Integração com Firebase Cloud Messaging
- [ ] Suporte a grupos de notificação
- [ ] Analytics de engagement
- [ ] A/B testing de mensagens
- [ ] Import/Export de preferências em massa
- [ ] Webhook para eventos de notificação
- [ ] Notificações push web
- [ ] Inteligência artificial para optimize.timing

## 📞 Suporte

Para issues ou perguntas:
- Issues: GitHub Repository
- Email: support@barberzap.com
- Docs: docs.barberzap.com

## 📝 Licença

Copyright © 2024 BarberZap. All rights reserved.
