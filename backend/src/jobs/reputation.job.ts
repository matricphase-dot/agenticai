import { nodeQueue } from "./worker";
import { NodeService } from "../services/node.service";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const setupReputationCron = async () => {
  // Add a repeatable job to run every day at midnight
  await nodeQueue.add(
    "calculate-reputation",
    {},
    {
      repeat: {
        pattern: "0 0 * * *", // Every day at midnight
      },
      jobId: "daily-reputation-sync",
    }
  );

  logger.info("📅 Node Reputation Cron Job scheduled (Daily at 00:00)");
};

// Process the reputation update
export const processReputationJob = async () => {
  const nodes = await prisma.node.findMany({ select: { id: true } });
  
  logger.info(`🔄 Running daily reputation update for ${nodes.length} nodes...`);
  
  for (const node of nodes) {
    try {
      await NodeService.updateReputation(node.id);
    } catch (err) {
      logger.error(`Failed to update reputation for node ${node.id}:`, err);
    }
  }
  
  logger.info("✅ Daily reputation update complete.");
};
