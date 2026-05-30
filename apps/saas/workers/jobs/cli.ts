#!/usr/bin/env node

/**
 * BullMQ CLI - BarberZap
 * 
 * Interface de linha de comando para monitorar e gerenciar filas BullMQ
 * 
 * Uso:
 *   npx ts-node workers/jobs/cli.ts stats
 *   npx ts-node workers/jobs/cli.ts queue notifications
 *   npx ts-node workers/jobs/cli.ts job notifications job_id
 *   npx ts-node workers/jobs/cli.ts retry notifications job_id
 *   npx ts-node workers/jobs/cli.ts clean notifications
 *   npx ts-node workers/jobs/cli.ts health
 */

import { getQueueStats, healthCheck, retryFailedJob } from './index';
import {
  printQueueStats,
  printJobDetails,
  printQueueReport,
  getJobDetails,
  cleanQueue,
  cleanDLQ,
  retryAllFailedJobs,
  moveDLQToQueue,
  generateQueueReport,
  listJobsByStatus,
} from './utils';
import { QUEUES, type QueueName } from './types';

// ============================================================================
// CLI COMMANDS
// ============================================================================

async function cmdStats(args: string[]): Promise<void> {
  console.log('Fetching queue stats...\n');
  
  const stats = await getQueueStats();
  printQueueStats(stats);
}

async function cmdQueue(args: string[]): Promise<void> {
  const queueName = args[0] as QueueName;
  
  if (!queueName || !Object.values(QUEUES).includes(queueName)) {
    console.error('❌ Invalid queue name');
    console.log('Available queues:', Object.values(QUEUES).join(', '));
    process.exit(1);
  }
  
  console.log(`Generating report for queue: ${queueName}...\n`);
  
  const report = await generateQueueReport(queueName);
  printQueueReport(report);
}

async function cmdJob(args: string[]): Promise<void> {
  const [queueName, jobId] = args;
  
  if (!queueName || !jobId) {
    console.error('❌ Usage: cli.ts job <queueName> <jobId>');
    process.exit(1);
  }
  
  if (!Object.values(QUEUES).includes(queueName as QueueName)) {
    console.error('❌ Invalid queue name');
    process.exit(1);
  }
  
  console.log(`Fetching job details: ${jobId} from queue ${queueName}...\n`);
  
  const details = await getJobDetails(queueName as QueueName, jobId);
  printJobDetails(details);
}

async function cmdRetry(args: string[]): Promise<void> {
  const [queueName, jobId] = args;
  
  if (!queueName || !jobId) {
    console.error('❌ Usage: cli.ts retry <queueName> <jobId>');
    process.exit(1);
  }
  
  if (!Object.values(QUEUES).includes(queueName as QueueName)) {
    console.error('❌ Invalid queue name');
    process.exit(1);
  }
  
  console.log(`Retrying job: ${jobId} from queue ${queueName}...\n`);
  
  await retryFailedJob(queueName as QueueName, jobId);
  console.log('✅ Job retried successfully');
}

async function cmdRetryAll(args: string[]): Promise<void> {
  const queueName = args[0] as QueueName;
  
  if (!queueName || !Object.values(QUEUES).includes(queueName)) {
    console.error('❌ Invalid queue name');
    console.log('Available queues:', Object.values(QUEUES).join(', '));
    process.exit(1);
  }
  
  console.log(`Retrying all failed jobs from queue: ${queueName}...\n`);
  
  const count = await retryAllFailedJobs(queueName);
  console.log(`✅ Retried ${count} failed jobs`);
}

async function cmdClean(args: string[]): Promise<void> {
  const queueName = args[0] as QueueName;
  
  if (!queueName || !Object.values(QUEUES).includes(queueName)) {
    console.error('❌ Invalid queue name');
    console.log('Available queues:', Object.values(QUEUES).join(', '));
    process.exit(1);
  }
  
  console.log(`Cleaning queue: ${queueName}...\n`);
  console.log('⚠️  This will remove old completed and failed jobs');
  
  const gracePeriod = args[1] ? parseInt(args[1]) * 1000 * 60 : 0; // minutes to ms
  if (gracePeriod > 0) {
    console.log(`   Grace period: ${args[1]} minutes`);
  }
  
  await cleanQueue(queueName, gracePeriod);
  console.log('✅ Queue cleaned');
}

async function cmdCleanDLQ(args: string[]): Promise<void> {
  const queueName = args[0] as QueueName;
  
  if (!queueName || !Object.values(QUEUES).includes(queueName)) {
    console.error('❌ Invalid queue name');
    console.log('Available queues:', Object.values(QUEUES).join(', '));
    process.exit(1);
  }
  
  console.log(`Cleaning DLQ for queue: ${queueName}...\n`);
  console.log('⚠️  This will remove all jobs from the Dead Letter Queue');
  
  await cleanDLQ(queueName);
  console.log('✅ DLQ cleaned');
}

async function cmdMoveDLQ(args: string[]): Promise<void> {
  const queueName = args[0] as QueueName;
  
  if (!queueName || !Object.values(QUEUES).includes(queueName)) {
    console.error('❌ Invalid queue name');
    console.log('Available queues:', Object.values(QUEUES).join(', '));
    process.exit(1);
  }
  
  console.log(`Moving jobs from DLQ to queue: ${queueName}...\n`);
  
  const count = await moveDLQToQueue(queueName);
  console.log(`✅ Moved ${count} jobs from DLQ`);
}

async function cmdHealth(args: string[]): Promise<void> {
  console.log('Checking BullMQ health...\n');
  
  const isHealthy = await healthCheck();
  
  if (isHealthy) {
    console.log('✅ BullMQ system is healthy');
    console.log('   Redis: Connected');
    console.log('   Queues: Operational');
    console.log('   Workers: Running');
  } else {
    console.log('❌ BullMQ system is NOT healthy');
    console.log('   Redis: Disconnected or unreachable');
    process.exit(1);
  }
}

async function cmdList(args: string[]): Promise<void> {
  const [queueName, statusArg, limitArg] = args;
  
  if (!queueName || !Object.values(QUEUES).includes(queueName as QueueName)) {
    console.error('❌ Invalid queue name');
    console.log('Available queues:', Object.values(QUEUES).join(', '));
    process.exit(1);
  }
  
  const allowedStatuses = ['waiting', 'active', 'completed', 'failed', 'delayed'];
  const status = statusArg || 'waiting';
  const limit = limitArg ? parseInt(limitArg) : 20;
  
  if (!allowedStatuses.includes(status)) {
    console.error('❌ Invalid status');
    console.log('Allowed statuses:', allowedStatuses.join(', '));
    process.exit(1);
  }
  
  console.log(`Listing ${limit} ${status} jobs from queue: ${queueName}...\n`);
  
  const jobs = await listJobsByStatus(queueName as QueueName, [status], limit);
  
  if (jobs.length === 0) {
    console.log(`No ${status} jobs found`);
    return;
  }
  
  jobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.id} (${job.name})`);
    console.log(`   Created: ${new Date(job.timestamp || 0).toLocaleString()}`);
    
    if (job.processedOn) {
      console.log(`   Processed: ${new Date(job.processedOn).toLocaleString()}`);
    }
    
    if (job.failedReason) {
      console.log(`   Error: ${job.failedReason.substring(0, 100)}...`);
    }
    
    console.log('');
  });
}

async function cmdHelp(args: string[]): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 BULLMQ CLI - BARBERZAP                        ║
╚═══════════════════════════════════════════════════════════════╝

Usage: npx ts-node workers/jobs/cli.ts <command> [options]

Commands:

  stats                    Show statistics for all queues
  queue <name>             Show detailed report for a queue
  job <queue> <id>         Show details of a specific job
  retry <queue> <id>       Retry a failed job
  retry-all <queue>        Retry all failed jobs in a queue
  clean <queue> [minutes]  Remove old jobs from queue
  clean-dlq <queue>        Remove all jobs from DLQ
  move-dlq <queue>         Move DLQ jobs back to main queue
  health                   Check system health
  list <queue> [status]    List jobs by status (default: waiting)
  help                     Show this help message

Queues:
  ${Object.values(QUEUES).join(', ')}

Statuses for 'list':
  waiting, active, completed, failed, delayed

Examples:

  npx ts-node workers/jobs/cli.ts stats
  npx ts-node workers/jobs/cli.ts queue notifications
  npx ts-node workers/jobs/cli.ts job notifications 123:0: notifications
  npx ts-node workers/jobs/cli.ts retry notifications 123:0: notifications
  npx ts-node workers/jobs/cli.ts retry-all notifications
  npx ts-node workers/jobs/cli.ts clean notifications 30
  npx ts-node workers/jobs/cli.ts list notifications failed

`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  const commands: Record<string, (args: string[]) => Promise<void>> = {
    stats: cmdStats,
    queue: cmdQueue,
    job: cmdJob,
    retry: cmdRetry,
    'retry-all': cmdRetryAll,
    clean: cmdClean,
    'clean-dlq': cmdCleanDLQ,
    'move-dlq': cmdMoveDLQ,
    health: cmdHealth,
    list: cmdList,
    help: cmdHelp,
    '-h': cmdHelp,
    '--help': cmdHelp,
  };

  if (!command || !commands[command]) {
    console.error('❌ Unknown command');
    await cmdHelp([]);
    process.exit(1);
  }

  try {
    await commands[command](args);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
