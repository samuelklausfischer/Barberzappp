/**
 * BullMQ Main Job Processor - BarberZap
 * 
 * Sistema central gerenciamento de filas de background jobs
 * 
 * Features:
 * - Multiple queues (WhatsApp, CRM, Notifications)
 * - Retry logic com exponential backoff
 * - Dead letter queue para jobs que falharam
 * - Job prioritization
 * - Error logging e monitoring
 * - Graceful shutdown
 */

import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { Redis } from 'ioredis';
import {
  JOBS,
  JOB_PRIORITY,
  JOB_OPTIONS,
  QUEUES,
  type JobName,
  type QueueName,
  type SendBookingConfirmationData,
  type SendReminderData,
  type UpdateClientStatsData,
  type SendCancellationNotificationData,
} from './types';

// ============================================================================
// REDIS CONNECTION
// ============================================================================

let redisConnection: Redis | null = null;

/**
 * Cria ou retorna uma conexão existente com o Redis
 */
export function getRedisConnection(): Redis {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisConnection.on('error', (error) => {
      console.error('[BullMQ] Redis connection error:', error);
    });

    redisConnection.on('connect', () => {
      console.log('[BullMQ] Redis connected successfully');
    });
  }

  return redisConnection;
}

/**
 * Fecha a conexão com o Redis
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
    console.log('[BullMQ] Redis connection closed');
  }
}

// ============================================================================
// QUEUE MANAGERS
// ============================================================================

const queues: Map<QueueName, Queue> = new Map();
const workers: Map<QueueName, Worker> = new Map();
const schedulers: Map<QueueName, QueueScheduler> = new Map();

/**
 * Cria ou retorna uma queue existente
 */
export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
    queues.set(name, queue);
    console.log(`[BullMQ] Queue "${name}" created`);
  }
  return queues.get(name)!;
}

/**
 * Cria um scheduler para uma queue (opcional, para delayed jobs)
 */
export function getScheduler(name: QueueName): QueueScheduler {
  if (!schedulers.has(name)) {
    const scheduler = new QueueScheduler(name, {
      connection: getRedisConnection(),
    });
    schedulers.set(name, scheduler);
    console.log(`[BullMQ] Scheduler for queue "${name}" created`);
  }
  return schedulers.get(name)!;
}

/**
 * Retorna a dead letter queue para uma queue específica
 */
export function getDeadLetterQueue(queueName: QueueName): Queue {
  return new Queue(`${queueName}:dlq`, {
    connection: getRedisConnection(),
  });
}

// ============================================================================
// JOB SCHEDULERS
// ============================================================================

/**
 * Agenda um job de confirmação de agendamento
 */
export async function scheduleBookingConfirmation(
  data: SendBookingConfirmationData
): Promise<Job> {
  const queue = getQueue(QUEUES.NOTIFICATIONS);
  const job = await queue.add(
    JOBS.SEND_BOOKING_CONFIRMATION,
    data,
    JOB_OPTIONS[JOBS.SEND_BOOKING_CONFIRMATION]
  );

  console.log(
    `[BullMQ] Job scheduled: ${JOBS.SEND_BOOKING_CONFIRMATION} (ID: ${job.id})`
  );

  return job;
}

/**
 * Agenda um job de lembrete 24h antes
 */
export async function scheduleReminder24h(
  data: Omit<SendReminderData, 'reminderType'>
): Promise<Job> {
  const queue = getQueue(QUEUES.NOTIFICATIONS);
  const reminderData: SendReminderData = { ...data, reminderType: '24h' };

  const job = await queue.add(
    JOBS.SEND_REMINDER_24H,
    reminderData,
    {
      ...JOB_OPTIONS[JOBS.SEND_REMINDER_24H],
      delay: 23 * 60 * 60 * 1000, // 23 horas (lembrete 1h antes do appointment de 24h)
    }
  );

  console.log(
    `[BullMQ] Job scheduled: ${JOBS.SEND_REMINDER_24H} (ID: ${job.id})`
  );

  return job;
}

/**
 * Agenda um job de lembrete 2h antes
 */
export async function scheduleReminder2h(
  data: Omit<SendReminderData, 'reminderType'>
): Promise<Job> {
  const queue = getQueue(QUEUES.NOTIFICATIONS);
  const reminderData: SendReminderData = { ...data, reminderType: '2h' };

  const job = await queue.add(
    JOBS.SEND_REMINDER_2H,
    reminderData,
    {
      ...JOB_OPTIONS[JOBS.SEND_REMINDER_2H],
      delay: 2 * 60 * 60 * 1000 - 5 * 60 * 1000, // 1h 55m (5min de margem)
    }
  );

  console.log(
    `[BullMQ] Job scheduled: ${JOBS.SEND_REMINDER_2H} (ID: ${job.id})`
  );

  return job;
}

/**
 * Agenda jobs de lembretes para um agendamento
 */
export async function scheduleReminders(
  appointmentDate: Date,
  reminderData: Omit<SendReminderData, 'reminderType'>
): Promise<{ job24h?: Job; job2h?: Job }> {
  const now = new Date();
  const appointmentTime = new Date(appointmentDate).getTime();
  const currentTime = now.getTime();

  const timeUntilAppointment = appointmentTime - currentTime;
  const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);

  const result: { job24h?: Job; job2h?: Job } = {};

  // Agenda lembrete 24h se o agendamento for daqui a mais de 24h
  if (hoursUntilAppointment > 24) {
    result.job24h = await scheduleReminder24h(reminderData);
  }

  // Agenda lembrete 2h se o agendamento for daqui a mais de 2h
  if (hoursUntilAppointment > 2) {
    result.job2h = await scheduleReminder2h(reminderData);
  }

  return result;
}

/**
 * Agenda um job de atualização de CRM
 */
export async function scheduleCRMUpdate(
  data: UpdateClientStatsData
): Promise<Job> {
  const queue = getQueue(QUEUES.CRM);
  const job = await queue.add(
    JOBS.UPDATE_CLIENT_STATS,
    data,
    JOB_OPTIONS[JOBS.UPDATE_CLIENT_STATS]
  );

  console.log(
    `[BullMQ] Job scheduled: ${JOBS.UPDATE_CLIENT_STATS} (ID: ${job.id})`
  );

  return job;
}

/**
 * Agenda um job de notificação de cancelamento
 */
export async function scheduleCancellationNotification(
  data: SendCancellationNotificationData
): Promise<Job> {
  const queue = getQueue(QUEUES.NOTIFICATIONS);
  const job = await queue.add(
    JOBS.SEND_CANCELLATION_NOTIFICATION,
    data,
    JOB_OPTIONS[JOBS.SEND_CANCELLATION_NOTIFICATION]
  );

  console.log(
    `[BullMQ] Job scheduled: ${JOBS.SEND_CANCELLATION_NOTIFICATION} (ID: ${job.id})`
  );

  return job;
}

/**
 * Cancela jobs de lembrete para um agendamento específico
 */
export async function cancelReminderJobs(
  appointmentId: string
): Promise<number> {
  const queue = getQueue(QUEUES.NOTIFICATIONS);
  const jobs = await queue.getJobs(['waiting', 'delayed', 'active']);

  let cancelled = 0;

  for (const job of jobs) {
    const data = job.data as SendReminderData;
    if (
      (job.name === JOBS.SEND_REMINDER_24H ||
        job.name === JOBS.SEND_REMINDER_2H) &&
      data.appointmentId === appointmentId
    ) {
      await job.remove();
      cancelled++;
      console.log(
        `[BullMQ] Cancelled reminder job (ID: ${job.id}) for appointment ${appointmentId}`
      );
    }
  }

  return cancelled;
}

// ============================================================================
// WORKER REGISTRY
// ============================================================================

const processorRegistry: Map<JobName, (job: Job) => Promise<any>> = new Map();

/**
 * Registra um processor para um job específico
 */
export function registerProcessor(
  jobName: JobName,
  processor: (job: Job) => Promise<any>
): void {
  processorRegistry.set(jobName, processor);
  console.log(`[BullMQ] Processor registered for job: ${jobName}`);
}

/**
 * Cria e inicia workers para processar jobs
 */
export function startWorkers(): void {
  // Worker para NOTIFICATIONS queue
  const notificationsWorker = new Worker(
    QUEUES.NOTIFICATIONS,
    async (job: Job) => {
      const { name, data } = job;
      console.log(`[BullMQ] Processing job: ${name} (ID: ${job.id})`);

      const processor = processorRegistry.get(name as JobName);
      if (!processor) {
        throw new Error(`No processor found for job: ${name}`);
      }

      return processor(job);
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );

  notificationsWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job completed: ${job.name} (ID: ${job.id})`);
  });

  notificationsWorker.on('failed', (job, error) => {
    console.error(
      `[BullMQ] Job failed: ${job?.name} (ID: ${job?.id})`,
      error
    );
  });

  notificationsWorker.on('error', (error) => {
    console.error('[BullMQ] Worker error:', error);
  });

  workers.set(QUEUES.NOTIFICATIONS, notificationsWorker);

  // Worker para CRM queue
  const crmWorker = new Worker(
    QUEUES.CRM,
    async (job: Job) => {
      const { name, data } = job;
      console.log(`[BullMQ] Processing job: ${name} (ID: ${job.id})`);

      const processor = processorRegistry.get(name as JobName);
      if (!processor) {
        throw new Error(`No processor found for job: ${name}`);
      }

      return processor(job);
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    }
  );

  crmWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job completed: ${job.name} (ID: ${job.id})`);
  });

  crmWorker.on('failed', (job, error) => {
    console.error(
      `[BullMQ] Job failed: ${job?.name} (ID: ${job?.id})`,
      error
    );
  });

  crmWorker.on('error', (error) => {
    console.error('[BullMQ] Worker error:', error);
  });

  workers.set(QUEUES.CRM, crmWorker);

  console.log('[BullMQ] All workers started');
}

/**
 * Para todos os workers gracefulmente
 */
export async function stopWorkers(): Promise<void> {
  console.log('[BullMQ] Stopping workers...');

  for (const [queueName, worker] of workers.entries()) {
    await worker.close();
    console.log(`[BullMQ] Worker for queue "${queueName}" stopped`);
  }

  workers.clear();

  for (const scheduler of schedulers.values()) {
    await scheduler.close();
  }
  schedulers.clear();

  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();

  await closeRedisConnection();

  console.log('[BullMQ] All workers stopped');
}

// ============================================================================
// MONITORING & HEALTH CHECK
// ============================================================================

/**
 * Retorna estatísticas das filas
 */
export async function getQueueStats(): Promise<Record<QueueName, any>> {
  const stats: Record<QueueName, any> = {};

  for (const queueName of Object.values(QUEUES)) {
    const queue = getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    stats[queueName] = {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  return stats;
}

/**
 * Verifica a saúde do sistema de filas
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const redis = getRedisConnection();
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[BullMQ] Health check failed:', error);
    return false;
  }
}

/**
 * Retorna jobs falhos de uma queue
 */
export async function getFailedJobs(queueName: QueueName, limit = 50): Promise<Job[]> {
  const queue = getQueue(queueName);
  return queue.getFailed(0, limit - 1);
}

/**
 * Retorna jobs da dead letter queue
 */
export async function getDLQJobs(queueName: QueueName, limit = 50): Promise<Job[]> {
  const dlq = getDeadLetterQueue(queueName);
  return dlq.getJobs(['failed', 'waiting'], 0, limit - 1);
}

/**
 * Replay um job que falhou
 */
export async function retryFailedJob(
  queueName: QueueName,
  jobId: string
): Promise<void> {
  const queue = getQueue(queueName);
  await queue.moveJobToWaiting(jobId);
  console.log(`[BullMQ] Retried job ${jobId}`);
}

// ============================================================================
// SCHEDULED JOBS (CRON)
// ============================================================================

/**
 * Agenda jobs diários para verificar e agendar lembretes
 * Este deve ser chamado periodicamente (ex: a cada hora)
 */
export async function scheduleDailyReminders(): Promise<void> {
  // TODO: Implementar lógica para buscar agendamentos do próximo dia
  // e agendar lembretes automaticamente
  console.log('[BullMQ] Daily reminders scheduler executed');
}

// ============================================================================
// INITIALIZE AND EXPORT
// ============================================================================

/**
 * Inicializa o sistema de BullMQ
 */
export async function initializeBullMQ(): Promise<void> {
  console.log('[BullMQ] Initializing BullMQ system...');

  // Import e registra os processors
  const confirmationModule = await import('./confirmation');
  const reminderModule = await import('./reminders');
  const crmModule = await import('./crm_update');
  const cancellationModule = await import('./cancellation');

  confirmationModule.registerConfirmationProcessor();
  reminderModule.registerReminderProcessor();
  crmModule.registerCRMUpdateProcessor();
  cancellationModule.registerCancellationProcessor();

  registerConfirmationProcessor();
  registerReminderProcessor();
  registerCRMUpdateProcessor();
  registerCancellationProcessor();

  // Inicia os workers
  startWorkers();

  // Inicia schedulers (opcional)
  getScheduler(QUEUES.NOTIFICATIONS);

  console.log('[BullMQ] System initialized successfully');
}

// Auto-export para facilitar o uso
export default {
  JOBS,
  QUEUES,
  initializeBullMQ,
  stopWorkers,
  scheduleBookingConfirmation,
  scheduleReminder24h,
  scheduleReminder2h,
  scheduleReminders,
  scheduleCRMUpdate,
  scheduleCancellationNotification,
  cancelReminderJobs,
  registerProcessor,
  getQueueStats,
  healthCheck,
  getFailedJobs,
  getDLQJobs,
  retryFailedJob,
};
