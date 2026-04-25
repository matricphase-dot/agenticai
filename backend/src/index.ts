import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import logger from "./lib/logger";
import { initSocket } from "./lib/socket";
import { errorHandler } from "./middleware/error.middleware";
import { setupSwagger } from "./lib/swagger";
import cookieParser from 'cookie-parser';
import { EmailService } from './services/email.service';
import { initializeJobs } from './jobs';
import { prisma } from './lib/prisma';

dotenv.config();
EmailService.verifyConnection(); // fire and forget

import authRouter from "./routes/auth.routes";
import agentsRouter from "./routes/agents.routes";
import { invokeRouter } from "./routes/invoke.routes";
import nodeRoutes from "./routes/nodes.routes";
import marketplaceRouter from "./routes/marketplace.routes";
import { stakingRouter } from "./routes/staking.routes";
import billingRouter from "./routes/billing.routes";
import { governanceRouter } from "./routes/governance.routes";
import { keysRouter } from "./routes/keys.routes";
import secretsRouter from "./routes/secrets.routes";
import monitoringRouter from "./routes/monitoring.routes";
import auditRouter from "./routes/audit.routes";
import notificationsRouter from "./routes/notifications.routes";
import usersRouter from "./routes/users.routes";
import { cronRouter } from "./routes/cron.routes";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 4000;

console.log(`[SERVER] Starting in ${process.env.NODE_ENV} mode`);

app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json());

// Swagger Documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/invoke', invokeRouter);
app.use('/api/nodes', nodeRoutes);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/staking', stakingRouter);
app.use('/api/billing', billingRouter);
app.use('/api/governance', governanceRouter);
app.use('/api/keys', keysRouter);
app.use('/api/secrets', secretsRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/cron', cronRouter);

// Platform stats (public)
app.get('/api/stats', async (req, res) => {
  try {
    const [agents, nodes, invocations, staked] = await Promise.all([
      prisma.agent.count({ 
        where: { status: 'PUBLISHED', isPublic: true } 
      }),
      prisma.node.count({ where: { status: 'ONLINE' } }),
      prisma.invocation.count(),
      prisma.balance.aggregate({ 
        _sum: { lockedTokens: true } 
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalAgents: agents,
        activeNodes: nodes,
        totalInvocations: invocations,
        totalStaked: staked._sum.lockedTokens || 0,
      },
    });
  } catch {
    res.json({ success: true, data: {} });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    success: true, 
    status: "UP", 
    uptime: process.uptime(),
    timestamp: new Date() 
  });
});

// Global Error Handler
app.use(errorHandler);

server.listen(PORT, async () => {
  logger.info(`🚀 Agentic AI Backend running on port ${PORT}`);
  logger.info(`📖 API Docs available at http://localhost:${PORT}/api-docs`);
  
  // Non-blocking job initialization for free tier
  try {
    await initializeJobs();
  } catch (error) {
    logger.warn('Job initialization skipped or failed (Redis might be unavailable)');
  }
});
