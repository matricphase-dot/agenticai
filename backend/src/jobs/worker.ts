import { Queue, Worker, Job } from "bullmq";
import redis from "../lib/redis";
import { InvocationService } from "../services/invocation.service";
import { StakingService } from "../services/staking.service";
import { NodeService } from "../services/node.service";
import { GovernanceService } from "../services/governance.service";
import { WebhookService } from "../services/webhook.service";
import { processReputationJob, setupReputationCron } from "./reputation.job";
import logger from "../lib/logger";

// Queues
export const invocationQueue = new Queue("invocation", { connection: redis });
export const webhookQueue = new Queue("webhook", { connection: redis });
export const nodeQueue = new Queue("node", { connection: redis });

// Workers
const invocationWorker = new Worker("invocation", async (job: Job) => {
  const { agentId, input, userId, apiKeyId } = job.data;
  try {
    await InvocationService.invoke({
      agentId,
      input,
      callerId: userId,
      callerApiKeyId: apiKeyId
    });
  } catch (err) {
    logger.error(`Job ${job.id} (Invocation) failed:`, err);
    throw err;
  }
}, { connection: redis });

const webhookWorker = new Worker("webhook", async (job: Job) => {
  const { userId, event, payload } = job.data;
  try {
    await WebhookService.trigger(userId, event, payload);
  } catch (err) {
    logger.error(`Job ${job.id} (Webhook) failed:`, err);
    throw err;
  }
}, { connection: redis });

const nodeWorker = new Worker("node", async (job: Job) => {
  try {
    if (job.name === "calculate-reputation") {
      await processReputationJob();
    }
  } catch (err) {
    logger.error(`Job ${job.id} (Node) failed:`, err);
    throw err;
  }
}, { connection: redis });

// CRON Jobs (Simulated via a master scheduler)
export const setupCronJobs = () => {
  // Reward Distribution: Daily at midnight
  const REWARD_DIST_INTERVAL = 24 * 60 * 60 * 1000;
  setInterval(() => {
    StakingService.distributeRewards().catch((err: any) => logger.error("Cron failed: Reward distribution", err));
  }, REWARD_DIST_INTERVAL);

  // Node Health Check: Every 90 seconds
  const HEALTH_CHECK_INTERVAL = 90 * 1000;
  setInterval(() => {
    NodeService.markOfflineNodes().catch((err: any) => logger.error("Cron failed: Node health check", err));
  }, HEALTH_CHECK_INTERVAL);


  // Protocol Reputation Cron (BullMQ)
  setupReputationCron().catch((err: any) => logger.error("Cron failed: Reputation setup", err));

  // Proposal Finalization: Hourly
  const PROPOSAL_FIN_INTERVAL = 60 * 60 * 1000;
  setInterval(() => {
    GovernanceService.finalizeExpiredProposals().catch((err: any) => logger.error("Cron failed: Proposal finalization", err));
  }, PROPOSAL_FIN_INTERVAL);


  // Process Unstakes: Hourly
  setInterval(() => {
    StakingService.processMaturedUnstakes().catch((err: any) => logger.error("Cron failed: Process unstakes", err));
  }, PROPOSAL_FIN_INTERVAL);


  logger.info("Background CRON jobs scheduled.");
};
