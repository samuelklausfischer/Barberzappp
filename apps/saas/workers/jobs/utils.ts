/**
 * BullMQ Utilities - BarberZap
 * 
 * Funções utilitárias para debugging, monitoring e operações comuns
 */

import { Queue, Job } from 'bullmq';
import { getRedisConnection, QUEUES, type QueueName } from './index';

// ============================================================================
// JOB INSPECTION
// ============================================================================

/**
 * Obtém detalhes completos de um job
 */
export async function getJobDetails(
  queueName: QueueName,
  jobId: string
): Promise<any> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    opts: job.opts,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    stacktrace: job.stacktrace,
    returnvalue: job.returnvalue,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    timestamp: job.timestamp,
    failedReason: job.failedReason,
  };
}

/**
 * Lista jobs por status
 */
export async function listJobsByStatus(
  queueName: QueueName,
  statuses: Array<'waiting' | 'active' | 'completed' | 'failed' | 'delayed'>,
  limit = 100
): Promise<Job[]> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  const jobs = await queue.getJobs(statuses, 0, limit - 1);
  
  await queue.close();
  
  return jobs;
}

/**
 * Limpa filas (cuidado!)
 */
export async function cleanQueue(
  queueName: QueueName,
  gracePeriodMs: number = 0
): Promise<void> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  
  const cleaned = await queue.clean(gracePeriodMs, 1000, 'failed');
  console.log(`[Cleanup] Cleaned ${cleaned.length} failed jobs from ${queueName}`);
  
  await queue.close();
}

/**
 * Limpa Dead Letter Queue
 */
export async function cleanDLQ(queueName: QueueName): Promise<void> {
  const dlq = new Queue(`${queueName}:dlq`, { connection: getRedisConnection() });
  
  const cleaned = await dlq.clean(0, 1000);
  console.log(`[Cleanup] Cleaned ${cleaned.length} jobs from ${queueName} DLQ`);
  
  await dlq.close();
}

// ============================================================================
// JOB RETRY & DEBUGGING
// ============================================================================

/**
 * Retry todos os jobs falhos de uma queue
 */
export async function retryAllFailedJobs(queueName: QueueName): Promise<number> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  const failedJobs = await queue.getFailed(0, 9999);
  
  let retried = 0;
  
  for (const job of failedJobs) {
    await job.retry();
    retried++;
  }
  
  await queue.close();
  
  console.log(`[Debug] Retried ${retried} failed jobs from ${queueName}`);
  
  return retried;
}

/**
 * Move jobs da DLQ para a queue principal
 */
export async function moveDLQToQueue(queueName: QueueName): Promise<number> {
  const dlq = new Queue(`${queueName}:dlq`, { connection: getRedisConnection() });
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  
  const jobs = await dlq.getJobs(['failed', 'waiting'], 0, 9999);
  let moved = 0;
  
  for (const job of jobs) {
    await queue.add(job.name, job.data, { ...job.opts, jobId: job.id });
    await job.remove();
    moved++;
  }
  
  await dlq.close();
  await queue.close();
  
  console.log(`[Debug] Moved ${moved} jobs from ${queueName} DLQ`);
  
  return moved;
}

/**
 * Simula erro em um job para teste
 */
export async function simulateJobFailure(
  queueName: QueueName,
  jobName: string,
  data: any
): Promise<Job> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  
  const job = await queue.add(jobName, data);
  await job.moveToFailed({ message: 'Simulated failure for testing' }, true);
  
  await queue.close();
  
  console.log(`[Debug] Simulated failure for job ${job.id}`);
  
  return job;
}

// ============================================================================
:: WORKER SIMULATION
// ============================================================================

/**
 * Simula um worker manualmente (para debug sem iniciar o worker real)
 */
export async function simulateWorker(
  queueName: QueueName,
  processor: (job: Job) => Promise<any>
): Promise<void> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  const jobs = await queue.getJobs(['waiting'], 0, 10);
  
  console.log(`[Simulation] Processing ${jobs.length} jobs from ${queueName}...`);
  
  for (const job of jobs) {
    try {
      console.log(`[Simulation] Processing job ${job.id} (${job.name})`);
      const result = await processor(job);
      console.log(`[Simulation] Job ${job.id} completed:`, result);
    } catch (error) {
      console.error(`[Simulation] Job ${job.id} failed:`, error);
    }
  }
  
  await queue.close();
}

// ============================================================================
// METRICS & REPORTING
// ============================================================================

/**
 * Gera relatório detalhado de_jobs de uma queue
 */
export async function generateQueueReport(queueName: QueueName): Promise<any> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  
  const [waiting, active, completed, failed, delayed, repeat] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getRepeatableCount(),
  ]);
  
  const recentFailed = await queue.getFailed(0, 9);
  const recentCompleted = await queue.getCompleted(0, 9);
  
  await queue.close();
  
  return {
    queueName,
    counts: {
      waiting,
      active,
      completed,
      failed,
      delayed,
      repeat,
    },
    recentFailed: recentFailed.map((job) => ({
      id: job.id,
      name: job.name,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
    })),
    recentCompleted: recentCompleted.map((job) => ({
      id: job.id,
      name: job.name,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    })),
  };
}

/**
 * Calcula tempo médio de processamento de jobs
 */
export async function getAverageProcessingTime(queueName: QueueName): Promise<number> {
  const queue = new Queue(queueName, { connection: getRedisConnection() });
  const jobs = await queue.getJobs(['completed'], 0, 999);
  
  if (jobs.length === 0) {
    await queue.close();
    return 0;
  }
  
  const totalTime = jobs.reduce((sum, job) => {
    return sum + ((job.finishedOn || 0) - (job.processedOn || 0));
  }, 0);
  
  await queue.close();
  
  return totalTime / jobs.length;
}

// ============================================================================
:: CLI HELPERS
// ============================================================================

/**
 * Helper para CLI - imprime stats formatadas
 */
export function printQueueStats(stats: Record<QueueName, any>): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    BULLMQ QUEUE STATS                      ');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  for (const [queueName, queueStats] of Object.entries(stats)) {
    console.log(`📦 Queue: ${queueName}`);
    console.log(`   ⏳ Waiting:   ${queueStats.waiting}`);
    console.log(`   ▶️  Active:    ${queueStats.active}`);
    console.log(`   ✅ Completed: ${queueStats.completed}`);
    console.log(`   ❌ Failed:    ${queueStats.failed}`);
    console.log(`   ⏱️  Delayed:   ${queueStats.delayed}`);
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Helper para CLI - imprime detalhes de um job
 */
export function printJobDetails(details: any): void {
  if (!details) {
    console.log('❌ Job not found');
    return;
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`                      JOB DETAILS                          `);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`🆔 ID:           ${details.id}`);
  console.log(`📝 Name:         ${details.name}`);
  console.log(`🔄 Attempts:     ${details.attemptsMade}`);
  console.log(`📊 Progress:     ${JSON.stringify(details.progress)}`);
  console.log(`⏰ Created:      ${new Date(details.timestamp).toLocaleString()}`);
  
  if (details.processedOn) {
    console.log(`🚀 Processed:   ${new Date(details.processedOn).toLocaleString()}`);
  }
  
  if (details.finishedOn) {
    const duration = details.finishedOn - details.processedOn;
    console.log(`✅ Finished:    ${new Date(details.finishedOn).toLocaleString()}`);
    console.log(`⏱️  Duration:    ${duration}ms`);
  }
  
  if (details.failedReason) {
    console.log(`\n❌ Failed Reason:`);
    console.log(`   ${details.failedReason}`);
  }
  
  if (details.stacktrace && details.stacktrace.length > 0) {
    console.log(`\n📚 Stacktrace:`);
    details.stacktrace.forEach((trace: string, index: number) => {
      console.log(`   [${index + 1}] ${trace}`);
    });
  }
  
  if (details.data) {
    console.log(`\n📦 Data:`);
    console.log(`   ${JSON.stringify(details.data, null, 2)}`);
  }
  
  if (details.returnvalue) {
    console.log(`\n↩️  Return Value:`);
    console.log(`   ${JSON.stringify(details.returnvalue, null, 2)}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

/**
 * Helper para CLI - imprime relatório de queue
 */
export function printQueueReport(report: any): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`                 QUEUE REPORT: ${report.queueName}            `);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const { counts, recentFailed, recentCompleted } = report;
  
  console.log('📊 Counts:');
  console.log(`   ⏳ Waiting:   ${counts.waiting}`);
  console.log(`   ▶️  Active:    ${counts.active}`);
  console.log(`   ✅ Completed: ${counts.completed}`);
  console.log(`   ❌ Failed:    ${counts.failed}`);
  console.log(`   ⏱️  Delayed:   ${counts.delayed}`);
  console.log(`   🔄 Repeat:    ${counts.repeat}`);
  
  if (recentFailed.length > 0) {
    console.log('\n❌ Recent Failed Jobs:');
    recentFailed.forEach((job: any, index: number) => {
      console.log(`   ${index + 1}. ${job.id} (${job.name})`);
      console.log(`      Reason: ${job.failedReason?.substring(0, 100)}...`);
      console.log(`      Attempts: ${job.attemptsMade}`);
    });
  }
  
  if (recentCompleted.length > 0) {
    console.log('\n✅ Recent Completed Jobs:');
    recentCompleted.slice(0, 5).forEach((job: any, index: number) => {
      console.log(`   ${index + 1}. ${job.id} (${job.name})`);
      console.log(`      Finished: ${new Date(job.finishedOn).toLocaleString()}`);
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getJobDetails,
  listJobsByStatus,
  cleanQueue,
  cleanDLQ,
  retryAllFailedJobs,
  moveDLQToQueue,
  simulateJobFailure,
  simulateWorker,
  generateQueueReport,
  getAverageProcessingTime,
  printQueueStats,
  printJobDetails,
  printQueueReport,
};
