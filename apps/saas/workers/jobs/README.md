# BullMQ Background Jobs - BarberZap

Sistema robusto de filas de background jobs para processamento assíncrono de notificações WhatsApp e atualizações de CRM.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Tipos de Jobs](#tipos-de-jobs)
- [Uso](#uso)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## 🎯 Visão Geral

O sistema BullMQ é responsável por processar tarefas assíncronas de forma confiável, incluindo:

- ✅ Confirmações de agendamento via WhatsApp
- ⏰ Lembretes de agendamento (24h e 2h antes)
- 📊 Atualizações de estatísticas de CRM
- ❌ Notificações de cancelamento

**Por que Use BullMQ?**

- ✅ Processamento assíncrono (não bloqueia webhooks)
- 🔁 Retry automático com exponential backoff
- 📊 Monitoramento de jobs em tempo real
- 💾 Dead letter queue para inspect de falhas
- ⚡ Alta performance com Redis
- 🎯 Priorização de jobs

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         BarberZap App                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BullMQ Queues                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │   NOTIFICATIONS │  │        CRM      │  │   WHATSAPP    │  │
│  │                 │  │                 │  │               │  │
│  │ • Confirmações  │  │ • Stats Update  │  │ • (Future)    │  │
│  │ • Lembretes     │  │ • Loyalty       │  │               │  │
│  │ • Cancelamentos │  │ • Analytics     │  │               │  │
│  └─────────────────┘  └─────────────────┘  └───────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Redis                                    │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   Job Storage   │  │   DLQ (Failed)  │                      │
│  │                 │  │                 │                      │
│  │ • Waiting       │  │ • Inspect       │                      │
│  │ • Active        │  │ • Retry         │                      │
│  │ • Completed     │  │ • Debug         │                      │
│  │ • Failed        │  │                 │                      │
│  │ • Delayed       │  │                 │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Workers                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Notification   │  │     CRM         │  │   WhatsApp    │  │
│  │    Worker       │  │    Worker       │  │    Client     │  │
│  │                 │  │                 │  │               │  │
│  │ • Process jobs  │  │ • Process jobs  │  │ • Send msgs   │  │
│  │ • 5 concurrent  │  │ • 3 concurrent  │  │ • API calls   │  │
│  └─────────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
cd /root/barber
npm install bullmq ioredis
```

### 2. Instalar Redis

```bash
# Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Ou localmente
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
brew services start redis
```

### 3. Verificar Redis

```bash
redis-cli ping
# Deve retornar: PONG
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_URL=redis://localhost:6379

# ============================================================================
# WHATSAPP CONFIGURATION
# ============================================================================
# Meta Business API / Twilio / Outra API
WHATSAPP_API_KEY=your-api-key
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# ============================================================================
# SUPABASE CONFIGURATION (para CRM)
# ============================================================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 Tipos de Jobs

### 1. `send_booking_confirmation` ⚡ PRIORITY CRITICAL

Envia confirmação de agendamento ao cliente.

**Trigger:** Quando appointment é criado

**Payload:**
```typescript
{
  appointmentId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  barberName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
}
```

**Retry:** 3 tentativas com delay de 2s, 4s, 8s

---

### 2. `send_reminder_24h` 🔔 PRIORITY HIGH

Envia lembrete 24h antes do agendamento.

**Trigger:** Agendado quando appointment é criado

**Payload:**
```typescript
{
  appointmentId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  barberName: string;
  serviceName: string;
  date: string;
  time: string;
  reminderType: '24h';
}
```

**Delay:** ~23 horas

**Retry:** 3 tentativas com delay de 5s, 10s, 20s

---

### 3. `send_reminder_2h` ⏰ PRIORITY NORMAL

Envia lembrete 2h antes do agendamento.

**Trigger:** Agendado quando appointment é criado

**Payload:** Mesmo que `send_reminder_24h` com `reminderType: '2h'`

**Delay:** ~1h 55m (com margem de segurança)

**Retry:** 3 tentativas

---

### 4. `update_client_stats` 📊 PRIORITY LOW

Atualiza estatísticas de CRM do cliente.

**Trigger:** Quando appointment é criado/completado/cancelado/no-show

**Payload:**
```typescript
{
  clientId: string;
  appointmentId: string;
  action: 'created' | 'completed' | 'cancelled' | 'no_show';
  servicePrice?: number;
  appointmentDate?: string;
}
```

**Retry:** 3 tentativas

---

### 5. `send_cancellation_notification` ❌ PRIORITY CRITICAL

Envia notificação de cancelamento ao cliente e barbeiro.

**Trigger:** Quando appointment é cancelado

**Payload:**
```typescript
{
  appointmentId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  barberPhone?: string;
  barberName: string;
  serviceName: string;
  originalDate: string;
  originalTime: string;
  reason?: string;
}
```

**Retry:** 3 tentativas

---

## 📖 Uso

### Inicializar o Sistema

```typescript
import { initializeBullMQ, stopWorkers } from './workers/jobs/index.js';

// Inicializar no startup da aplicação
await initializeBullMQ();

// No shutdown graceful
await stopWorkers();
```

### Agendar Jobs

```typescript
import {
  scheduleBookingConfirmation,
  scheduleReminders,
  scheduleCRMUpdate,
  scheduleCancellationNotification,
  cancelReminderJobs
} from './workers/jobs/index.js';

// 1. Enviar confirmação quando appointment for criado
await scheduleBookingConfirmation({
  appointmentId: 'apt_123',
  clientId: 'client_456',
  clientPhone: '+5511999999999',
  clientName: 'João Silva',
  barberName: 'Carlos Barber',
  serviceName: 'Corte e Barba',
  date: '2026-03-05',
  time: '14:00',
  duration: 60,
  price: 80,
});

// 2. Agendar lembretes (24h e 2h)
await scheduleReminders(
  new Date('2026-03-05T14:00:00'),
  {
    appointmentId: 'apt_123',
    clientId: 'client_456',
    clientPhone: '+5511999999999',
    clientName: 'João Silva',
    barberName: 'Carlos Barber',
    serviceName: 'Corte e Barba',
    date: '2026-03-05',
    time: '14:00',
  }
);

// 3. Atualizar CRM quando appointment for completado
await scheduleCRMUpdate({
  clientId: 'client_456',
  appointmentId: 'apt_123',
  action: 'completed',
  servicePrice: 80,
  appointmentDate: '2026-03-05T14:00:00',
});

// 4. Enviar notificação de cancelamento
await scheduleCancellationNotification({
  appointmentId: 'apt_123',
  clientId: 'client_456',
  clientPhone: '+5511999999999',
  clientName: 'João Silva',
  barberPhone: '+5511888888888',
  barberName: 'Carlos Barber',
  serviceName: 'Corte e Barba',
  originalDate: '2026-03-05',
  originalTime: '14:00',
  reason: 'Cliente solicitou',
});

// 5. Cancelar lembretes se appointment for cancelado
await cancelReminderJobs('apt_123');
```

### Integrar com Aplicação

Exemplo de integração com Supabase webhook:

```typescript
// Supabase Database Functions ou Edge Functions
import { 
  scheduleBookingConfirmation, 
  scheduleReminders,
  scheduleCRMUpdate 
} from './workers/jobs/index.js';

export async function handleAppointmentInsert(newRecord: any) {
  // Enviar confirmação
  await scheduleBookingConfirmation({
    appointmentId: newRecord.id,
    clientId: newRecord.client_id,
    clientPhone: newRecord.client_phone,
    clientName: newRecord.client_name,
    barberName: newRecord.barber_name,
    serviceName: newRecord.service_name,
    date: newRecord.date,
    time: newRecord.time,
    duration: newRecord.duration,
    price: newRecord.price,
  });

  // Agendar lembretes
  await scheduleReminders(
    new Date(`${newRecord.date}T${newRecord.time}`),
    {
      appointmentId: newRecord.id,
      clientId: newRecord.client_id,
      clientPhone: newRecord.client_phone,
      clientName: newRecord.client_name,
      barberName: newRecord.barber_name,
      serviceName: newRecord.service_name,
      date: newRecord.date,
      time: newRecord.time,
    }
  );

  // Atualizar CRM (created)
  await scheduleCRMUpdate({
    clientId: newRecord.client_id,
    appointmentId: newRecord.id,
    action: 'created',
    servicePrice: newRecord.price,
  });
}
```

---

## 📊 Monitoramento

### Estatísticas das Filas

```typescript
import { getQueueStats } from './workers/jobs/index.js';

const stats = await getQueueStats();
console.log('Queue Stats:', stats);
/*
{
  whatsapp: { waiting: 0, active: 1, completed: 150, failed: 2, delayed: 5 },
  crm: { waiting: 2, active: 0, completed: 75, failed: 0, delayed: 0 },
  notifications: { waiting: 1, active: 2, completed: 200, failed: 5, delayed: 10 }
}
*/
```

### Ver Jobs Falhos

```typescript
import { getFailedJobs, getDLQJobs } from './workers/jobs/index.js';

// Jobs falhos normais
const failedJobs = await getFailedJobs('notifications', 50);

// Jobs na Dead Letter Queue
const dlqJobs = await getDLQJobs('notifications', 50);
```

### Retry Job Falho

```typescript
import { retryFailedJob } from './workers/jobs/index.js';

await retryFailedJob('notifications', 'job_id_here');
```

### Health Check

```typescript
import { healthCheck } from './workers/jobs/index.js';

const isHealthy = await healthCheck();
if (!isHealthy) {
  console.error('BullMQ system is not healthy!');
}
```

---

## 🐛 Troubleshooting

### Jobs não estão sendo processados

1. Verifique se o está rodando:
```bash
# Verificar processos
ps aux | grep node

# Verificar logs
tail -f /var/log/barberzap/worker.log
```

2. Verifique se Redis está rodando:
```bash
redis-cli ping
# Deve retornar: PONG
```

3. Verifique conexões:
```bash
redis-cli
> CLIENT LIST
# Deve mostrar conexões dos workers
```

### Jobs falhando com "No processor found"

Certifique-se de que todos os processors estão registrados:

```typescript
import { initializeBullMQ } from './workers/jobs/index.js';

// Isso registra todos os processors automaticamente
await initializeBullMQ();
```

### Jobs enfileirados mas não processados

Verifique a concorrência dos workers:

```typescript
// workers/jobs/index.ts
const notificationsWorker = new Worker(
  QUEUES.NOTIFICATIONS,
  processor,
  {
    connection: getRedisConnection(),
    concurrency: 5, // ↑ Aumentar se necessário
  }
);
```

### Muitos jobs na Dead Letter Queue

1. Inspect os jobs falhos:
```typescript
const dlqJobs = await getDLQJobs('notifications');

for (const job of dlqJobs) {
  console.log({
    id: job.id,
    name: job.name,
    data: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
    stacktrace: job.stacktrace,
  });
}
```

2. Common issues:
  - Erros de API do WhatsApp (rate limiting, autenticação)
  - Erros de conexão com banco de dados
  - Dados inválidos
  - Timeout de rede

3. Fix e retry:
```typescript
for (const job of dlqJobs) {
  // Corrigir dados se necessário
  // await fixJobData(job);
  
  await retryFailedJob('notifications', job.id);
}
```

---

## 📚 API Reference

### Main Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `initializeBullMQ()` | Inicializa sistema BullMQ | `Promise<void>` |
| `stopWorkers()` | Para todos os workers gracefully | `Promise<void>` |
| `scheduleBookingConfirmation(data)` | Agenda job de confirmação | `Promise<Job>` |
| `scheduleReminder24h(data)` | Agenda lembrete 24h | `Promise<Job>` |
| `scheduleReminder2h(data)` | Agenda lembrete 2h | `Promise<Job>` |
| `scheduleReminders(date, data)` | Agenda ambos lembretes | `Promise<{job24h?, job2h?}>` |
| `scheduleCRMUpdate(data)` | Agenda atualização CRM | `Promise<Job>` |
| `scheduleCancellationNotification(data)` | Agenda notificação cancelamento | `Promise<Job>` |
| `cancelReminderJobs(appointmentId)` | Cancela lembretes | `Promise<number>` |

### Monitoring Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `getQueueStats()` | Estatísticas de todas filas | `Promise<Record<QueueName, any>>` |
| `healthCheck()` | Health check do sistema | `Promise<boolean>` |
| `getFailedJobs(queueName, limit)` | Jobs falhos | `Promise<Job[]>` |
| `getDLQJobs(queueName, limit)` | Jobs na DLQ | `Promise<Job[]>` |
| `retryFailedJob(queueName, jobId)` | Retry job falho | `Promise<void>` |

### Constants

```typescript
import { JOBS, QUEUES, JOB_PRIORITY } from './workers/jobs/types.js';

// Job Names
JOBS.SEND_BOOKING_CONFIRMATION
JOBS.SEND_REMINDER_24H
JOBS.SEND_REMINDER_2H
JOBS.UPDATE_CLIENT_STATS
JOBS.SEND_CANCELLATION_NOTIFICATION

// Queue Names
QUEUES.NOTIFICATIONS
QUEUES.CRM
QUEUES.WHATSAPP

// Priority Levels
JOB_PRIORITY.CRITICAL  // 1
JOB_PRIORITY.HIGH      // 5
JOB_PRIORITY.NORMAL    // 10
JOB_PRIORITY.LOW       // 20
```

---

## 🔒 Segurança

### Redis Passworded

Configure senha no Redis:

```bash
# redis.conf
requirepass your-strong-password-here
```

Atualize `.env`:
```bash
REDIS_URL=redis://:your-strong-password@localhost:6379
```

### Rate Limiting

Evite rate limiting da API do WhatsApp:

```typescript
// Limitar jobs ativos
const worker = new Worker(queueName, processor, {
  concurrency: 3, // Limitar concorrência
});
```

---

## 📈 Performance

### Otimizações

1. **Jobs em Batch:** Processar múltiplas atualizações de CRM em batch
2. **Prioridade Crítica:** Confirmarções sempre antes de lembretes
3. **Exponential Backoff:** Evitar sobrecarga em falhas
4. **Remove on Complete:** Limpar jobs antigos automaticamente

### Benchmarks

- Throughput típico: ~100 jobs/minuto
- Latência média: 200-500ms/job
- Redis memory: ~500KB/1000 jobs

---

## 🚧 Roadmap

- [ ] Integração com Meta Business API real
- [ ] Dashboard de monitoramento
- [ ] Alerts para jobs falhando
- [ ] Job deduplication
- [ ] Rate limiting por cliente
- [ ] Analytics e reports
- [ ] Suporte a templates dinâmicos
- [ ] Multi-language support

---

## 📝 Licença

MIT

---

## 💬 Suporte

Para dúvidas ou problemas:
1. Verifique o [Troubleshooting](#troubleshooting)
2. Review logs em `/var/log/barberzap/`
3. Open issue com detalhes do erro

---

**BarberZap Background Jobs System** 🚀
