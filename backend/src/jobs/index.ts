import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

const connection = { connection: redis };

// ─── QUEUES ──────────────────────────────────────────────────

export const rewardDistributionQueue = new Queue(
  'reward-distribution', 
  connection
);

export const unstakeProcessingQueue = new Queue(
  'unstake-processing',
  connection
);

export const proposalFinalizationQueue = new Queue(
  'proposal-finalization',
  connection
);

export const nodeHealthCheckQueue = new Queue(
  'node-health-check',
  connection
);

// ─── WORKERS ─────────────────────────────────────────────────

// Import services lazily to avoid circular deps
async function startWorkers() {
  const { StakingService } = await import('../services/staking.service');
  const { GovernanceService } = await import('../services/governance.service');
  const { NodeService } = await import('../services/node.service');

  // Reward distribution worker
  new Worker('reward-distribution', async (job) => {
    logger.info('Running reward distribution job', { jobId: job.id });
    const result = await StakingService.distributeRewards();
    logger.info('Reward distribution complete', result);
    return result;
  }, connection);

  // Unstake processing worker
  new Worker('unstake-processing', async (job) => {
    logger.info('Running unstake processing job', { jobId: job.id });
    const result = await StakingService.processMaturedUnstakes();
    logger.info('Unstake processing complete', result);
    return result;
  }, connection);

  // Proposal finalization worker
  new Worker('proposal-finalization', async (job) => {
    logger.info('Running proposal finalization job', { jobId: job.id });
    const result = await GovernanceService.finalizeExpiredProposals();
    logger.info('Proposal finalization complete', result);
    return result;
  }, connection);

  // Node health check worker
  new Worker('node-health-check', async (job) => {
    const result = await NodeService.markOfflineNodes();
    if (result.markedOffline > 0) {
      logger.info('Node health check', result);
    }
    return result;
  }, connection);

  logger.info('BullMQ workers started');
}

// ─── SCHEDULE RECURRING JOBS ─────────────────────────────────

export async function scheduleJobs() {
  try {
    // Check if redis is actually connected
    if (redis.status !== 'ready') {
      logger.warn('Redis not ready, skipping job scheduling');
      return;
    }

    // Remove existing schedules to avoid duplicates on restart
    await rewardDistributionQueue.drain();
    await unstakeProcessingQueue.drain();
    await proposalFinalizationQueue.drain();
    await nodeHealthCheckQueue.drain();

    // Reward distribution: daily at midnight UTC
    await rewardDistributionQueue.add(
      'daily-rewards',
      {},
      {
        repeat: { pattern: '0 0 * * *' }, // midnight daily
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );

    // Unstake processing: every hour
    await unstakeProcessingQueue.add(
      'process-unstakes',
      {},
      {
        repeat: { pattern: '0 * * * *' }, // every hour
        removeOnComplete: 5,
        removeOnFail: 5,
      }
    );

    // Proposal finalization: every hour
    await proposalFinalizationQueue.add(
      'finalize-proposals',
      {},
      {
        repeat: { pattern: '0 * * * *' },
        removeOnComplete: 5,
        removeOnFail: 5,
      }
    );

    // Node health check: every 90 seconds
    await nodeHealthCheckQueue.add(
      'health-check',
      {},
      {
        repeat: { every: 90000 }, // 90 seconds
        removeOnComplete: 3,
        removeOnFail: 3,
      }
    );

    logger.info('BullMQ recurring jobs scheduled');
  } catch (error) {
    logger.error('Failed to schedule jobs', { error });
  }
}

// ─── INITIALIZE ──────────────────────────────────────────────

export async function initializeJobs() {
  try {
    // Basic connectivity check with timeout
    const isRedisUp = await Promise.race([
      new Promise(resolve => {
        if (redis.status === 'ready') resolve(true);
        else redis.once('ready', () => resolve(true));
      }),
      new Promise(resolve => setTimeout(() => resolve(false), 5000))
    ]);

    if (!isRedisUp) {
      logger.warn('Redis connection timed out during initialization. Job system will be disabled.');
      return;
    }

    await startWorkers();
    await scheduleJobs();
    logger.info('Job system initialized');
  } catch (error) {
    logger.error('Failed to initialize job system', { error });
    // Don't crash the server if jobs fail to initialize
  }
}
