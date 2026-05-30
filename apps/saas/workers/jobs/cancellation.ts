/**
 * Job Processor: Send Cancellation Notifications
 * 
 * Envia notificações de cancelamento para cliente e barbeiro
 */

import { Job } from 'bullmq';
import {
  JOBS,
  registerProcessor,
  type SendCancellationNotificationData,
  type SendWhatsAppResult,
} from './types';

// ============================================================================
// WHATSAPP CLIENT
// ============================================================================

class WhatsAppClient {
  private apiKey: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.baseUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
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
}

const whatsappClient = new WhatsAppClient();

// ============================================================================
// AVAILABLE SLOTS
// ============================================================================

/**
 * Busca horários disponíveis próximos para oferecer ao cliente
 * 
 * TODO: Integrar com sistema real de agendamentos
 */
async function getAvailableSlots(
  barberName: string,
  date?: string
): Promise<Array<{ date: string; time: string }>> {
  try {
    // Mock - buscar horários disponíveis do banco
    console.log(`[Cancellation] Finding available slots for ${barberName}...`);

    // TODO: Integrar com Supabase
    // const { data } = await supabase
    //   .from('available_slots')
    //   .select('datetime, duration')
    //   .eq('barber_name', barberName)
    //   .gte('datetime', new Date().toISOString())
    //   .order('datetime')
    //   .limit(3);

    // Mock de horários disponíveis
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        date: tomorrow.toISOString().split('T')[0],
        time: '09:00',
      },
      {
        date: tomorrow.toISOString().split('T')[0],
        time: '11:00',
      },
      {
        date: tomorrow.toISOString().split('T')[0],
        time: '14:00',
      },
    ];
  } catch (error) {
    console.error('[Cancellation] Error getting available slots:', error);
    return [];
  }
}

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

/**
 * Formata data para exibição
 */
function formatDate(date: string): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Gera mensagem de cancelamento para cliente
 */
function generateClientCancellationMessage(
  data: SendCancellationNotificationData,
  availableSlots?: Array<{ date: string; time: string }>
): {
  header: string;
  body: string;
  buttons: Array<{ id: string; title: string }>;
} {
  const formattedDate = formatDate(data.originalDate);

  let body = `Olá, ${data.clientName}! 👋

Seu agendamento foi cancelado:
📅 ${formattedDate} às ${data.originalTime}
✂️ ${data.serviceName}`;

  if (data.reason) {
    body += `\n\nMotivo: ${data.reason}`;
  }

  // Adiciona horários disponíveis se houver
  if (availableSlots && availableSlots.length > 0) {
    body += '\n\n📅 Horários disponíveis para remarcar:\n';
    
    availableSlots.slice(0, 3).forEach((slot, index) => {
      const slotDate = formatDate(slot.date);
      body += `${index + 1}. ${slotDate} às ${slot.time}\n`;
    });

    body += '\nQuer remarcar em algum desses horários?';
  }

  return {
    header: '❌ Agendamento Cancelado',
    body,
    buttons: availableSlots && availableSlots.length > 0
      ? availableSlots.slice(0, 3).map((slot, index) => ({
          id: `reschedule_${data.appointmentId}_${index}`,
          title: `${slot.time} - ${formatDate(slot.date)}`,
        }))
      : [
          { id: `show_slots_${data.appointmentId}`, title: '📅 Ver Horários' },
          { id: `book_new_${data.appointmentId}`, title: '✂️ Novo Agendamento' },
        ],
  };
}

/**
 * Gera mensagem de texto alternativa (cliente)
 */
function generateClientCancellationTextMessage(
  data: SendCancellationNotificationData,
  availableSlots?: Array<{ date: string; time: string }>
): string {
  const formattedDate = formatDate(data.originalDate);

  let text = `❌ *Agendamento Cancelado*

Olá, ${data.clientName}! 👋

Seu agendamento foi cancelado:
📅 *${formattedDate} às ${data.originalTime}*
✂️ ${data.serviceName}`;

  if (data.reason) {
    text += `\n\n_Motivo: ${data.reason}_`;
  }

  if (availableSlots && availableSlots.length > 0) {
    text += '\n\n📅 *Horários disponíveis para remarcar:*';
    
    availableSlots.slice(0, 3).forEach((slot, index) => {
      const slotDate = formatDate(slot.date);
      text += `\n${index + 1}. ${slotDate} às ${slot.time}`;
    });
  }

  text += '\n\n_Responda "HORARIOS" para ver mais opções ou "NOVO" para um novo agendamento._';

  return text;
}

/**
 * Gera mensagem de cancelamento para barbeiro
 */
function generateBarberCancellationMessage(
  data: SendCancellationNotificationData
): string {
  const formattedDate = formatDate(data.originalDate);

  return `🔔 *Horário Liberado*

Agendamento cancelado:
📅 ${formattedDate} às ${data.originalTime}
✂️ ${data.serviceName}
👤 Cliente: ${data.clientName}

Este horário está disponível para novos agendamentos! 💈`;
}

// ============================================================================
// JOB PROCESSOR
// ============================================================================

/**
 * Processa o job de enviar notificação de cancelamento
 */
async function processCancellationNotification(
  job: Job<SendCancellationNotificationData>
): Promise<{ client: SendWhatsAppResult; barber?: SendWhatsAppResult }> {
  const { data } = job;
  const startTime = Date.now();

  console.log(
    `[Cancellation] Processing cancellation notification for appointment ${data.appointmentId}`
  );

  try {
    const results: {
      client: SendWhatsAppResult;
      barber?: SendWhatsAppResult;
    } = {
      client: { success: false, error: 'Not sent' },
    };

    // ============================================================================
    // 1. Notificar cliente
    // ============================================================================

    if (data.clientPhone) {
      // Formata o número de telefone do cliente
      const cleanedPhone = data.clientPhone.replace(/\D/g, '');
      const toPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;

      // Busca horários disponíveis para oferecer
      const availableSlots = await getAvailableSlots(data.barberName);

      // Tenta enviar mensagem interativa
      const { header, body, buttons } = generateClientCancellationMessage(
        data,
        availableSlots
      );
      
      let clientResult = await whatsappClient.sendInteractiveMessage(
        toPhone,
        header,
        body,
        buttons
      );

      // Se falhar, tenta mensagem de texto
      if (!clientResult.success) {
        console.log('[Cancellation] Interactive message failed, trying text message');
        const textMessage = generateClientCancellationTextMessage(data, availableSlots);
        clientResult = await whatsappClient.sendTextMessage(toPhone, textMessage);
      }

      results.client = clientResult;

      // Log do envio ao cliente
      await saveJobLog({
        jobId: job.id!,
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        type: 'cancellation_notification_client',
        status: clientResult.success ? 'success' : 'failed',
        duration: Date.now() - startTime,
        messageId: clientResult.messageId,
        error: clientResult.error,
      });
    }

    // ============================================================================
    // 2. Notificar barbeiro (se houver telefone)
    // ============================================================================

    if (data.barberPhone) {
      // Formata o número de telefone do barbeiro
      const cleanedPhone = data.barberPhone.replace(/\D/g, '');
      const toPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;

      const barberMessage = generateBarberCancellationMessage(data);
      const barberResult = await whatsappClient.sendTextMessage(toPhone, barberMessage);

      results.barber = barberResult;

      // Log do envio ao barbeiro
      await saveJobLog({
        jobId: job.id!,
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        type: 'cancellation_notification_barber',
        status: barberResult.success ? 'success' : 'failed',
        duration: Date.now() - startTime,
        messageId: barberResult.messageId,
        error: barberResult.error,
      });
    }

    console.log(
      `[Cancellation] Cancellation notification completed in ${
        Date.now() - startTime
      }ms`
    );

    return results;
  } catch (error) {
    console.error('[Cancellation] Error processing cancellation notification:', error);

    await saveJobLog({
      jobId: job.id!,
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      type: 'cancellation_notification',
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
  status: 'success' | 'failed' | 'error';
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
    console.log('[Cancellation] Job log saved:', {
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
    });

    // TODO: Integrar com Supabase
    // await supabase.from('job_logs').insert(log);
  } catch (error) {
    console.error('[Cancellation] Error saving job log:', error);
  }
}

// ============================================================================
// EXPORT & REGISTRATION
// ============================================================================

/**
 * Registra o processor de cancelamento no BullMQ
 */
export function registerCancellationProcessor(): void {
  registerProcessor(
    JOBS.SEND_CANCELLATION_NOTIFICATION,
    processCancellationNotification
  );
}

/**
 * Processa resposta do cliente para remarcação
 */
export async function handleRescheduleResponse(
  appointmentId: string,
  slotIndex: number,
  clientPhone: string
): Promise<void> {
  console.log(
    `[Cancellation] Handling reschedule request for appointment ${appointmentId}, slot ${slotIndex}`
  );

  // TODO: Implementar lógica para:
  // 1. Buscar o slot selecionado
  // 2. Criar novo agendamento
  // 3. Enviar confirmação
  // 4. Cancelar job de notificação de cancelamento pendente (se houver)

  console.log('[Cancellation] Reschedule logic to be implemented');
}

// Auto-export
export default {
  processCancellationNotification,
  registerCancellationProcessor,
  handleRescheduleResponse,
  getAvailableSlots,
};
