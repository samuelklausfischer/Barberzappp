/**
 * Job Processors: Send Reminders
 * 
 * Envia lembretes de agendamento pelo WhatsApp (24h e 2h antes)
 */

import { Job } from 'bullmq';
import {
  JOBS,
  registerProcessor,
  type SendReminderData,
  type SendWhatsAppResult,
} from './types';

// ============================================================================
// WHATSAPP CLIENT
// ============================================================================

/**
 * Cliente WhatsApp - compartilhado com confirmation.ts
 * Em produção, criar um singleton ou injectar o mesmo cliente
 */

class WhatsAppClient {
  private apiKey: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.baseUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateData: Record<string, any>
  ): Promise<SendWhatsAppResult> {
    try {
      console.log(`[WhatsApp] Sending template: ${templateName} to ${to}`, templateData);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (Math.random() > 0.05) {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
      }

      throw new Error('WhatsApp API unavailable');
    } catch (error) {
      console.error('[WhatsApp] Error sending template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendTextMessage(
    to: string,
    text: string
  ): Promise<SendWhatsAppResult> {
    try {
      console.log(`[WhatsApp] Sending text to ${to}:`, text);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (Math.random() > 0.05) {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
      }

      throw new Error('WhatsApp API unavailable');
    } catch (error) {
      console.error('[WhatsApp] Error sending text:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendInteractiveMessage(
    to: string,
    headerText: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<SendWhatsAppResult> {
    try {
      console.log(`[WhatsApp] Sending interactive to ${to}:`, {
        header: headerText,
        body: bodyText,
        buttons,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (Math.random() > 0.05) {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
      }

      throw new Error('WhatsApp API unavailable');
    } catch (error) {
      console.error('[WhatsApp] Error sending interactive:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

const whatsappClient = new WhatsAppClient();

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

/**
 * Formata data e hora para exibição em português
 */
function formatDateTime(date: string, time: string): string {
  const dateObj = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dateText: string;
  
  if (dateObj.toDateString() === today.toDateString()) {
    dateText = 'hoje';
  } else if (dateObj.toDateString() === tomorrow.toDateString()) {
    dateText = 'amanhã';
  } else {
    dateText = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  return `${dateText} às ${time}`;
}

/**
 * Gera mensagem de lembrete 24h
 */
function generateReminder24hMessage(data: SendReminderData): {
  header: string;
  body: string;
  buttons: Array<{ id: string; title: string }>;
} {
  const formattedDateTime = formatDateTime(data.date, data.time);

  return {
    header: `⏰ Lembrete: Seu corte é amanhã!`,
    body: `Olá, ${data.clientName}! 👋

Lembrando que você tem um agendamento:
📅 Data: ${formattedDateTime}
💇 Barber: ${data.barberName}
✂️ Serviço: ${data.serviceName}

Você pode confirmar sua presença ou, caso precise remarcar, é só nos avisar! 😊`,
    buttons: [
      { id: `confirm_${data.appointmentId}`, title: '✅ Confirmar' },
      { id: `reschedule_${data.appointmentId}`, title: '📅 Remarcar' },
      { id: `cancel_${data.appointmentId}`, title: '❌ Cancelar' },
    ],
  };
}

/**
 * Gera mensagem de lembrete 2h
 */
function generateReminder2hMessage(data: SendReminderData): {
  header: string;
  body: string;
  buttons: Array<{ id: string; title: string }>;
} {
  const formattedDateTime = formatDateTime(data.date, data.time);

  return {
    header: `🎯 Seu corte é em breve!`,
    body: `Olá, ${data.clientName}! 👋

Seu agendamento é ${formattedDateTime}:
💇 Barber: ${data.barberName}
✂️ Serviço: ${data.serviceName}

Chegue com 10 minutos de antecedência para garantir seu horário! 🚀`,
    buttons: [
      { id: `confirm_${data.appointmentId}`, title: '✅ Confirmar Presença' },
      { id: `cancel_${data.appointmentId}`, title: '❌ Não vou poder' },
    ],
  };
}

/**
 * Gera mensagem de texto alternativa (lembrete 24h)
 */
function generateReminder24hTextMessage(data: SendReminderData): string {
  const formattedDateTime = formatDateTime(data.date, data.time);

  return `⏰ *Lembrete BarberZap*

Olá, ${data.clientName}! 👋

Seu corte é amanhã! 🎉

📅 *${formattedDateTime}*
💇 *Barber:* ${data.barberName}
✂️ *Serviço:* ${data.serviceName}

_Responder "CONFIRMAR" para confirmar ou "CANCELAR" se não puder comparecer._`;
}

/**
 * Gera mensagem de texto alternativa (lembrete 2h)
 */
function generateReminder2hTextMessage(data: SendReminderData): string {
  const formattedDateTime = formatDateTime(data.date, data.time);

  return `🎯 *Seu corte é em breve!* ${data.clientName}! 🔥

💈 *Horário:* ${formattedDateTime}
💇 *Barber:* ${data.barberName}
✂️ *Serviço:* ${data.serviceName}

_Chegue com 10 minutos de antecedência! ⏰_

Responder "OK" para confirmar ou "CANCELAR" se não puder comparecer.`;
}

// ============================================================================
// JOB PROCESSORS
// ============================================================================

/**
 * Processa o job de enviar lembrete 24h
 */
async function processReminder24h(
  job: Job<SendReminderData>
): Promise<SendWhatsAppResult> {
  const { data } = job;
  const startTime = Date.now();

  console.log(
    `[Reminder] Processing 24h reminder for appointment ${data.appointmentId}`
  );

  try {
    // Formata o número de telefone
    const cleanedPhone = data.clientPhone.replace(/\D/g, '');
    const toPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;

    // Tenta enviar mensagem interativa
    const { header, body, buttons } = generateReminder24hMessage(data);
    const result = await whatsappClient.sendInteractiveMessage(
      toPhone,
      header,
      body,
      buttons
    );

    // Se falhar, tenta mensagem de texto
    if (!result.success) {
      console.log('[Reminder] Interactive message failed, trying text message');
      const textMessage = generateReminder24hTextMessage(data);
      const textResult = await whatsappClient.sendTextMessage(toPhone, textMessage);
      
      await saveJobLog({
        jobId: job.id!,
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        type: 'reminder_24h',
        status: textResult.success ? 'success_text_fallback' : 'failed',
        duration: Date.now() - startTime,
        error: textResult.error || result.error,
      });

      return textResult;
    }

    // Log do sucesso
    await saveJobLog({
      jobId: job.id!,
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      type: 'reminder_24h',
      status: 'success',
      duration: Date.now() - startTime,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    console.error('[Reminder] Error processing 24h reminder:', error);

    await saveJobLog({
      jobId: job.id!,
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      type: 'reminder_24h',
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Processa o job de enviar lembrete 2h
 */
async function processReminder2h(
  job: Job<SendReminderData>
): Promise<SendWhatsAppResult> {
  const { data } = job;
  const startTime = Date.now();

  console.log(
    `[Reminder] Processing 2h reminder for appointment ${data.appointmentId}`
  );

  try {
    // Formata o número de telefone
    const cleanedPhone = data.clientPhone.replace(/\D/g, '');
    const toPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;

    // Tenta enviar mensagem interativa
    const { header, body, buttons } = generateReminder2hMessage(data);
    const result = await whatsappClient.sendInteractiveMessage(
      toPhone,
      header,
      body,
      buttons
    );

    // Se falhar, tenta mensagem de texto
    if (!result.success) {
      console.log('[Reminder] Interactive message failed, trying text message');
      const textMessage = generateReminder2hTextMessage(data);
      const textResult = await whatsappClient.sendTextMessage(toPhone, textMessage);
      
      await saveJobLog({
        jobId: job.id!,
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        type: 'reminder_2h',
        status: textResult.success ? 'success_text_fallback' : 'failed',
        duration: Date.now() - startTime,
        error: textResult.error || result.error,
      });

      return textResult;
    }

    // Log do sucesso
    await saveJobLog({
      jobId: job.id!,
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      type: 'reminder_2h',
      status: 'success',
      duration: Date.now() - startTime,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    console.error('[Reminder] Error processing 2h reminder:', error);

    await saveJobLog({
      jobId: job.id!,
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      type: 'reminder_2h',
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

// ============================================================================
// JOB LOGGING
// ============================================================================

interface JobLog {
  jobId: string;
  appointmentId: string;
  clientId: string;
  type: string;
  status: 'success' | 'success_text_fallback' | 'failed' | 'error';
  duration: number;
  messageId?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Salva log do job em banco de dados
 * 
 * TODO: Implementar persistência em Supabase
 */
async function saveJobLog(log: JobLog): Promise<void> {
  try {
    console.log('[Reminder] Job log saved:', {
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
    });

    // TODO: Integrar com Supabase
    // await supabase.from('job_logs').insert(log);
  } catch (error) {
    console.error('[Reminder] Error saving job log:', error);
  }
}

// ============================================================================
// EXPORT & REGISTRATION
// ============================================================================

/**
 * Registra os processors de lembrete no BullMQ
 */
export function registerReminderProcessor(): void {
  registerProcessor(JOBS.SEND_REMINDER_24H, processReminder24h);
  registerProcessor(JOBS.SEND_REMINDER_2H, processReminder2h);
}

/**
 * Verifica se deve enviar lembretes para agendamentos próximos
 * 
 * Rotina para executar periodicamente (ex: a cada 5 minutos)
 */
export async function checkAndScheduleReminders(): Promise<void> {
  console.log('[Reminder] Checking for appointments that need reminders...');

  try {
    // TODO: Buscar agendamentos que precisam de lembretes
    // Lógica:
    // 1. Agendamentos nas próximas 24h (sem lembrete 24h)
    // 2. Agendamentos nas próximas 2h (sem lembrete 2h)

    // Exemplo de query (pseudo-código):
    // const { data: appointments } = await supabase
    //   .from('appointments')
    //   .select('*')
    //   .eq('status', 'confirmed')
    //   .gte('datetime', new Date().toISOString())
    //   .lte('datetime', new Date(Date.now() + 24*60*60*1000).toISOString());

    // Para cada agendamento, verificar se já tem lembrete agendado
    // e criar jobs se necessário

    console.log('[Reminder] Check completed');
  } catch (error) {
    console.error('[Reminder] Error in checkAndScheduleReminders:', error);
  }
}

// Auto-export
export default {
  processReminder24h,
  processReminder2h,
  registerReminderProcessor,
  checkAndScheduleReminders,
};
