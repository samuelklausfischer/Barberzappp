/**
 * BullMQ Examples - BarberZap
 * 
 * Exemplos de uso do sistema de filas BullMQ
 */

import {
  initializeBullMQ,
  stopWorkers,
  scheduleBookingConfirmation,
  scheduleReminders,
  scheduleCRMUpdate,
  scheduleCancellationNotification,
  cancelReminderJobs,
  getQueueStats,
  healthCheck,
} from './index';
import { JOBS, type SendBookingConfirmationData } from './types';

// ============================================================================
// EXAMPLE 1: Basic Workflow - Appointment Created
// ============================================================================

export async function example1_appointmentCreated() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  EXAMPLE 1: Appointment Created Workflow                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Dados simulados do appointment
  const appointmentData: SendBookingConfirmationData = {
    appointmentId: 'apt_' + Date.now(),
    clientId: 'client_' + Date.now(),
    clientPhone: '+5511999999999',
    clientName: 'João Silva',
    barberName: 'Carlos Barber',
    serviceName: 'Corte e Barba',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
    time: '14:00',
    duration: 60,
    price: 80,
  };
  
  console.log('📅 New appointment created:');
  console.log(`   ID: ${appointmentData.appointmentId}`);
  console.log(`   Client: ${appointmentData.clientName}`);
  console.log(`   Service: ${appointmentData.serviceName}`);
  console.log(`   Date: ${appointmentData.date} at ${appointmentData.time}\n`);
  
  // 1. Enviar confirmação
  console.log('1️⃣  Sending booking confirmation...');
  const confirmationJob = await scheduleBookingConfirmation(appointmentData);
  console.log(`   ✅ Job scheduled: ${confirmationJob.id}\n`);
  
  // 2. Agendar lembretes
  console.log('2️⃣  Scheduling reminders...');
  const reminderJobs = await scheduleReminders(
    new Date(`${appointmentData.date}T${appointmentData.time}:00`),
    {
      appointmentId: appointmentData.appointmentId,
      clientId: appointmentData.clientId,
      clientPhone: appointmentData.clientPhone,
      clientName: appointmentData.clientName,
      barberName: appointmentData.barberName,
      serviceName: appointmentData.serviceName,
      date: appointmentData.date,
      time: appointmentData.time,
    }
  );
  console.log(`   ✅ 24h reminder scheduled: ${reminderJobs.job24h?.id || 'skipped (too soon)'}`);
  console.log(`   ✅ 2h reminder scheduled: ${reminderJobs.job2h?.id || 'skipped (too soon)'}\n`);
  
  // 3. Atualizar CRM (created)
  console.log('3️⃣  Updating CRM (created)...');
  const crmJob = await scheduleCRMUpdate({
    clientId: appointmentData.clientId,
    appointmentId: appointmentData.appointmentId,
    action: 'created',
    servicePrice: appointmentData.price,
  });
  console.log(`   ✅ CRM job scheduled: ${crmJob.id}\n`);
  
  console.log('✅ Example 1 completed!\n');
}

// ============================================================================
// EXAMPLE 2: Appointment Completed
// ============================================================================

export async function example2_appointmentCompleted(appointmentId: string, clientId: string) {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  EXAMPLE 2: Appointment Completed Workflow                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📅 Appointment completed:');
  console.log(`   ID: ${appointmentId}\n`);
  
  // Atualizar CRM (completed)
  console.log('1️⃣  Updating CRM (completed)...');
  const crmJob = await scheduleCRMUpdate({
    clientId: clientId,
    appointmentId: appointmentId,
    action: 'completed',
    servicePrice: 80,
    appointmentDate: new Date().toISOString(),
  });
  console.log(`   ✅ CRM job scheduled: ${crmJob.id}\n`);
  
  console.log('✅ Example 2 completed!\n');
}

// ============================================================================
// EXAMPLE 3: Appointment Cancelled
// ============================================================================

export async function example3_appointmentCancelled(
  appointmentId: string,
  clientId: string,
  clientPhone: string,
  clientName: string
) {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  EXAMPLE 3: Appointment Cancelled Workflow                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📅 Appointment cancelled:');
  console.log(`   ID: ${appointmentId}\n`);
  
  // 1. Cancelar lembretes pendentes
  console.log('1️⃣  Cancelling pending reminder jobs...');
  const cancelledCount = await cancelReminderJobs(appointmentId);
  console.log(`   ✅ Cancelled ${cancelledCount} reminder jobs\n`);
  
  // 2. Atualizar CRM (cancelled)
  console.log('2️⃣  Updating CRM (cancelled)...');
  const crmJob = await scheduleCRMUpdate({
    clientId: clientId,
    appointmentId: appointmentId,
    action: 'cancelled',
  });
  console.log(`   ✅ CRM job scheduled: ${crmJob.id}\n`);
  
  // 3. Enviar notificação de cancelamento
  console.log('3️⃣  Sending cancellation notification...');
  const cancellationJob = await scheduleCancellationNotification({
    appointmentId: appointmentId,
    clientId: clientId,
    clientPhone: clientPhone,
    clientName: clientName,
    barberPhone: '+5511888888888',
    barberName: 'Carlos Barber',
    serviceName: 'Corte e Barba',
    originalDate: new Date().toISOString().split('T')[0],
    originalTime: '14:00',
    reason: 'Cliente solicitou',
  });
  console.log(`   ✅ Cancellation job scheduled: ${cancellationJob.id}\n`);
  
  console.log('✅ Example 3 completed!\n');
}

// ============================================================================
// EXAMPLE 4: Monitoring
// ============================================================================

export async function example4_monitoring() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  EXAMPLE 4: Monitoring & Stats                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Health check
  console.log('1️⃣  Checking system health...');
  const isHealthy = await healthCheck();
  console.log(`   ${isHealthy ? '✅' : '❌'} System is ${isHealthy ? 'healthy' : 'unhealthy'}\n`);
  
  // Queue stats
  console.log('2️⃣  Getting queue statistics...');
  const stats = await getQueueStats();
  
  console.log('\n   Queue Statistics:');
  for (const [queueName, queueStats] of Object.entries(stats)) {
    console.log(`   📦 ${queueName}:`);
    console.log(`      ⏳ Waiting:   ${queueStats.waiting}`);
    console.log(`      ▶️  Active:    ${queueStats.active}`);
    console.log(`      ✅ Completed: ${queueStats.completed}`);
    console.log(`      ❌ Failed:    ${queueStats.failed}`);
    console.log(`      ⏱️  Delayed:   ${queueStats.delayed}`);
  }
  
  console.log('\n✅ Example 4 completed!\n');
}

// ============================================================================
// EXAMPLE 5: Full Cycle Demo
// ============================================================================

export async function example5_fullCycleDemo() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  EXAMPLE 5: Full Appointment Cycle Demo                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Simular dados do appointment
  const appointmentId = 'apt_' + Date.now();
  const clientId = 'client_' + Date.now();
  const clientPhone = '+5511999999999';
  const clientName = 'João Silva';
  
  const appointmentData: SendBookingConfirmationData = {
    appointmentId,
    clientId,
    clientPhone,
    clientName,
    barberName: 'Carlos Barber',
    serviceName: 'Corte e Barba',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0], // Em 2h
    time: '16:00',
    duration: 60,
    price: 80,
  };
  
  // STAGE 1: Appointment Created
  console.log('╭─────────────────────────────────────────────────────────╮');
  console.log('│ 📅 STAGE 1: Appointment Created                          │');
  console.log('╰─────────────────────────────────────────────────────────╯\n');
  
  await scheduleBookingConfirmation(appointmentData);
  await scheduleReminders(
    new Date(`${appointmentData.date}T${appointmentData.time}:00`),
    {
      appointmentId,
      clientId,
      clientPhone,
      clientName,
      barberName: appointmentData.barberName,
      serviceName: appointmentData.serviceName,
      date: appointmentData.date,
      time: appointmentData.time,
    }
  );
  await scheduleCRMUpdate({
    clientId,
    appointmentId,
    action: 'created',
    servicePrice: appointmentData.price,
  });
  
  console.log('   ✅ All jobs scheduled for new appointment\n');
  
  // STAGE 2: Appointment Completed
  console.log('╭─────────────────────────────────────────────────────────╮');
  console.log('│ ✅ STAGE 2: Appointment Completed                        │');
  console.log('╰─────────────────────────────────────────────────────────╯\n');
  
  await scheduleCRMUpdate({
    clientId,
    appointmentId,
    action: 'completed',
    servicePrice: appointmentData.price,
    appointmentDate: new Date().toISOString(),
  });
  
  console.log('   ✅ CRM updated for completed appointment\n');
  
  // STAGE 3: (Hypothetical) Appointment Cancelled
  console.log('╭─────────────────────────────────────────────────────────╮');
  console.log('│ ❌ STAGE 3: Hypothetical Cancellation                    │');
  console.log('╰─────────────────────────────────────────────────────────╯\n');
  console.log('   (This shows what happens if appointment was cancelled)\n');
  
  await cancelReminderJobs(appointmentId);
  await scheduleCRMUpdate({
    clientId,
    appointmentId,
    action: 'cancelled',
  });
  
  console.log('   ✅ Reminders cancelled and CRM updated\n');
  
  console.log('✅ Full cycle demo completed!\n');
}

// ============================================================================
// MAIN DEMO
// ============================================================================

export async function runAllExamples() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              🔥 BULLMQ EXAMPLES - BARBERZAP 🔥              ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  
  // Inicializar BullMQ
  console.log('\n🚀 Initializing BullMQ system...\n');
  await initializeBullMQ();
  
  try {
    // Executar exemplos
    await example1_appointmentCreated();
    await example4_monitoring();
    await example5_fullCycleDemo();
    
    // Manter workers rodando por um tempo para processar jobs
    console.log('⏳ Workers are running... (Will keep jobs processing for 10s)\n');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    
    // Mostrar stats finais
    console.log('\n📊 Final Stats:');
    await example4_monitoring();
    
  } finally {
    // Parar workers gracefully
    console.log('\n🛑 Stopping BullMQ system...\n');
    await stopWorkers();
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║                    ✅ DEMO COMPLETED ✅                     ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllExamples().catch((error) => {
    console.error('❌ Demo error:', error);
    process.exit(1);
  });
}