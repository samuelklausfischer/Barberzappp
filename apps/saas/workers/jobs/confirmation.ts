/**
 * Job Processor: Send Booking Confirmation
 * 
 * Envia confirmação de agendamento pelo WhatsApp
 */

import { Job } from 'bullmq';
import {
  JOBS,
  registerProcessor,
  type SendBookingConfirmationData,
  type SendWhatsAppResult,
} from './types';

// ============================================================================
// WHATSAPP CLIENT MOCK/SERVICE
// ============================================================================

/**
 * Cliente WhatsApp - Implementar com a API real
 * 
 * TODO: Integrar com API de WhatsApp real (ex: Twilio, Meta Business API, etc.)
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

  /**
   * Envia uma mensagem de template pelo WhatsApp
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateData: Record<string, any>
  ): Promise<SendWhatsAppResult> {
    try {
      // Mock - substituir com chamada real à API
      console.log(`[WhatsApp] Sending template message: ${templateName} to ${to}`, templateData);

      // Simular delay de rede
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock: 95% de sucesso
      if (Math.random() > 0.05) {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
      }

      throw new Error('WhatsApp API unavailable');
    } catch (error) {
      console.error('[WhatsApp] Error sending template message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Envia uma mensagem de texto simples pelo WhatsApp
   */
  async sendTextMessage(
    to: string,
    text: string
  ): Promise<SendWhatsAppResult> {
    try {
      // Mock - substituir com chamada real à API
      console.log(`[WhatsApp] Sending text message to ${to}:`, text);

      // Simular delay de rede
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock: 95% de sucesso
      if (Math.random() > 0.05) {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
      }

      throw new Error('WhatsApp API unavailable');
    } catch (error) {
      console.error('[WhatsApp] Error sending text message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Envia uma mensagem interativa com botões
   */
  async sendInteractiveMessage(
    to: string,
    headerText: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<SendWhatsAppResult> {
    try {
      // Mock - substituir com chamada real à API
      console.log(`[WhatsApp] Sending interactive message to ${to}:`, {
        header: headerText,
        body: bodyText,
        buttons,
      });

      // Simular delay de rede
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock: 95% de sucesso
      if (Math.random() > 0.05) {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
      }

      throw new Error('WhatsApp API unavailable');
    } catch (error) {
      console.error('[WhatsApp] Error sending interactive message:', error);
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
  return dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ` às ${time}`;
}

/**
 * Gera mensagem de confirmação de agendamento
 */
function generateConfirmationMessage(data: SendBookingConfirmationData): {
  header: string;
  body: string;
  buttons: Array<{ id: string; title: string }>;
} {
  const formattedDateTime = formatDateTime(data.date, data.time);
  const durationHours = Math.floor(data.duration / 60);
  const durationMinutes = data.duration % 60;
  const durationText =
    durationHours > 0
      ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}min` : ''}`
      : `${durationMinutes}min`;

  return {
    header: `✂️ Agendamento Confirmado - BarberZap`,
    body: `Olá, ${data.clientName}! Seu agendamento foi confirmado:

📅 Data: ${formattedDateTime}
💇 Barber: ${data.barberName}
✂️ Serviço: ${data.serviceName}
⏱️ Duração: ${durationText}
💰 Valor: R$ ${data.price.toFixed(2)}`,
    buttons: [
      { id: `confirm_${data.appointmentId}`, title: '✅ Confirmar Presença' },
      { id: `cancel_${data.appointmentId}`, title: '❌ Cancelar Agendamento' },
    ],
  };
}

/**
 * Gera mensagem de texto alternativa (sem botões interativos)
 */
function generateConfirmationTextMessage(data: SendBookingConfirmationData): string {
  const formattedDateTime = formatDateTime(data.date, data.time);
  const durationHours = Math.floor(data.duration / 60);
  const durationMinutes = data.duration % 60;
  const durationText =
    durationHours > 0
      ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}min` : ''}`
      : `${durationMinutes}min`;

  return `✂️ *Agendamento Confirmado - BarberZap*

Olá, ${data.clientName}! 🔥

Seu agendamento foi confirmado:
📅 Data: ${formattedDateTime}
💇 Barber: ${data.barberName}
✂️ Serviço: ${data.serviceName}
⏱️ Duração: ${durationText}
💰 Valor: *R$ ${data.price.toFixed(2)}*

_Responder "CONFIRMAR" para confirmar sua presença ou "CANCELAR" para desistir._`;
}

// ============================================================================
// JOB PROCESSOR
// ============================================================================

/**
 * Processa o job de enviar confirmação de agendamento
 */
async function processBookingConfirmation(
  job: Job<SendBookingConfirmationData>
): Promise<SendWhatsAppResult> {
  const { data } = job;
  const startTime = Date.now();

  console.log(
    `[Confirmation] Processing booking confirmation for appointment ${data.appointmentId}`
  );

  try {
    // Formata o número de telefone (remove caracteres especiais e adiciona código do país se necessário)
    const cleanedPhone = data.clientPhone.replace(/\D/g, '');
    const toPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;

    // Tenta enviar mensagem interativa com botões
    const { header, body, buttons } = generateConfirmationMessage(data);
    const result = await whatsappClient.sendInteractiveMessage(
      toPhone,
      header,
      body,
      buttons
    );

    // Se falhar, tenta enviar mensagem de texto simples
    if (!result.success) {
      console.log('[Confirmation] Interactive message failed, trying text message');
      const textMessage = generateConfirmationTextMessage(data);
      const textResult = await whatsappClient.sendTextMessage(toPhone, textMessage);
      
      // Log da tentativa alternativa
      await saveJobLog({
        jobId: job.id!,
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        type: 'booking_confirmation',
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
      type: 'booking_confirmation',
      status: 'success',
      duration: Date.now() - startTime,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    console.error('[Confirmation] Error processing booking confirmation:', error);

    // Log do erro
    await saveJobLog({
      jobId: job.id!,
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      type: 'booking_confirmation',
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
 * TODO: Implementar persistência em Supabase ou outro banco
 */
async function saveJobLog(log: JobLog): Promise<void> {
  try {
    // Mock - salvar em tabela de logs
    console.log('[Confirmation] Job log saved:', {
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
    });

    // TODO: Integrar com Supabase
    // await supabase.from('job_logs').insert(log);
  } catch (error) {
    console.error('[Confirmation] Error saving job log:', error);
  }
}

// ============================================================================
// EXPORT & REGISTRATION
// ============================================================================

/**
 * Registra o processor de confirmação no BullMQ
 */
export function registerConfirmationProcessor(): void {
  registerProcessor(JOBS.SEND_BOOKING_CONFIRMATION, processBookingConfirmation);
  
  // Handler para respostas do WhatsApp (confirmação/cancelamento)
  // TODO: Implementar webhook handler
}

/**
 * Processa resposta do cliente (confirmação/cancelamento)
 */
export async function handleWhatsAppResponse(
  appointmentId: string,
  action: 'confirm' | 'cancel',
  clientPhone: string
): Promise<void> {
  console.log(
    `[Confirmation] Handling WhatsApp response: ${action} for appointment ${appointmentId}`
  );

  // TODO: Implementar lógica para atualizar status do agendamento
  // e cancelar lembretes se necessário

  if (action === 'cancel') {
    // Cancelar lembretes pendentes
    const { cancelReminderJobs } = await import('./index');
    await cancelReminderJobs(appointmentId);

    // Agendar notificação de cancelamento
    // TODO: Buscar dados completos do agendamento
    // await scheduleCancellationNotification(...);
  } else {
    // Confirmar presença
    console.log(`[Confirmation] Client confirmed appointment ${appointmentId}`);
  }
}

// Auto-export
export default {
  processBookingConfirmation,
  registerConfirmationProcessor,
  handleWhatsAppResponse,
};
