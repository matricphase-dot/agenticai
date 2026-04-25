import { PrismaClient } from "@prisma/client";
import logger from "./logger";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"], // Reduced logging for production
  });

// Add connection retry logic for free tier
async function connectWithRetry(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      logger.info("Connected to database successfully");
      return;
    } catch (err) {
      if (i === retries - 1) {
        logger.error("Failed to connect to database after maximum retries");
        // We don't exit(1) here to allow the server to at least start (useful for Render health checks)
      } else {
        logger.warn(`Database connection failed. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Start connection attempt in background
connectWithRetry();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
