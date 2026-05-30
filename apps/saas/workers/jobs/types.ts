/**
 * Types para BullMQ Jobs - BarberZap
 */

import { JobsOptions } from 'bullmq';

// ============================================================================
// JOB NAMES
// ============================================================================
export const JOBS = {
  // Confirmações
  SEND_BOOKING_CONFIRMATION: 'send_booking_confirmation',
  
  // Lembretes
  SEND_REMINDER_24H: 'send_reminder_24h',
  SEND_REMINDER_2H: 'send_reminder_2h',
  
  // CRM
  UPDATE_CLIENT_STATS: 'update_client_stats',
  
  // Cancelamentos
  SEND_CANCELLATION_NOTIFICATION: 'send_cancellation_notification',
} as const;

export type JobName = (typeof JOBS)[keyof typeof JOBS];

// ============================================================================
// JOB PRIORITIES (menor número = maior prioridade)
// ============================================================================
export const JOB_PRIORITY = {
  CRITICAL: 1,    // Confirmações imediatas
  HIGH: 5,        // Lembretes 24h
  NORMAL: 10,     // Lembretes 2h
  LOW: 20,        // Atualizações de CRM
} as const;

// ============================================================================
// JOB DATA TYPES
// ============================================================================

export interface SendBookingConfirmationData {
  appointmentId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  barberName: string;
  serviceName: string;
  date: string; // ISO date string
  time: string;
  duration: number; // minutos
  price: number;
}

export interface SendReminderData {
  appointmentId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  barberName: string;
  serviceName: string;
  date: string; // ISO date string
  time: string;
  reminderType: '24h' | '2h';
}

export interface UpdateClientStatsData {
  clientId: string;
  appointmentId: string;
  action: 'created' | 'completed' | 'cancelled' | 'no_show';
  servicePrice?: number;
  appointmentDate?: string;
}

export interface SendCancellationNotificationData {
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

// ============================================================================
// JOB RESULT TYPES
// ============================================================================

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface UpdateClientStatsResult {
  success: boolean;
  updatedFields?: string[];
  error?: string;
}

// ============================================================================
// JOB OPTIONS
// ============================================================================

export const JOB_OPTIONS: Record<JobName, Partial<JobsOptions>> = {
  [JOBS.SEND_BOOKING_CONFIRMATION]: {
    priority: JOB_PRIORITY.CRITICAL,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000, // Manter últimos 1000 jobs
      age: 86400,  // 24 horas
    },
    removeOnFail: {
      count: 5000, // Manter jobs falhos para inspeção
      age: 604800, // 7 dias
    },
  },
  
  [JOBS.SEND_REMINDER_24H]: {
    priority: JOB_PRIORITY.HIGH,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 500,
      age: 86400,
    },
    removeOnFail: {
      count: 5000,
      age: 604800,
    },
  },
  
  [JOBS.SEND_REMINDER_2H]: {
    priority: JOB_PRIORITY.NORMAL,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 500,
      age: 86400,
    },
    removeOnFail: {
      count: 5000,
      age: 604800,
    },
  },
  
  [JOBS.UPDATE_CLIENT_STATS]: {
    priority: JOB_PRIORITY.LOW,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: {
      count: 100,
      age: 43200, // 12 horas
    },
    removeOnFail: {
      count: 5000,
      age: 604800,
    },
  },
  
  [JOBS.SEND_CANCELLATION_NOTIFICATION]: {
    priority: JOB_PRIORITY.CRITICAL,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000,
      age: 86400,
    },
    removeOnFail: {
      count: 5000,
      age: 604800,
    },
  },
};

// ============================================================================
// QUEUE NAMES
// ============================================================================

export const QUEUES = {
  WHATSAPP: 'whatsapp',
  CRM: 'crm',
  NOTIFICATIONS: 'notifications',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
