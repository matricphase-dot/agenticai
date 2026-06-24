import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import http from "http";
import hpp from "hpp";
import compression from "compression";
import cookieParser from 'cookie-parser';
import { validateEnvironment } from './lib/validateEnv';
import { logger } from "./lib/logger";
import { initSocket } from "./lib/socket";
import { errorHandler } from "./middleware/error.middleware";
import { setupSwagger } from "./lib/swagger";
import { EmailService } from './services/email.service';
import { initializeJobs } from './jobs';
import { prisma } from './lib/prisma';
import { globalRateLimit } from './middleware/rate-limit.middleware';

// 1. Validate Environment
dotenv.config();
validateEnvironment();

// 2. Initialize App
const app = express();
const server = http.createServer(app);

// 3. Security & Optimization Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://agenticai-frontend-3tam.onrender.com', process.env.FRONTEND_URL || ''],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://agenticai-frontend-3tam.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      // In production allow all for now to debug
      if (process.env.NODE_ENV === 'production') {
        callback(null, true); // Temporarily allow all origins
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));


app.use(globalRateLimit);
app.use(compression());
app.use(hpp());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Initialize Socket.io
initSocket(server);

// 5. Routes
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
import statsRouter from "./routes/stats.routes";
import contactRouter from "./routes/contact.routes";
import { billingWebhookRouter } from "./routes/webhooks.billing.routes";
import webhooksRouter from "./routes/webhooks.routes";
import { ragRouter } from "./routes/rag.routes";
import { schedulesRouter } from "./routes/schedules.routes";
import { pipelinesRouter } from "./routes/pipelines.routes";
import { reportsRouter } from "./routes/reports.routes";
import { SchedulerService } from './services/scheduler.service';

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
app.use('/api/stats', statsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/webhooks/billing', billingWebhookRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api', ragRouter);
app.use('/api', schedulesRouter);
app.use('/api', pipelinesRouter);
app.use('/api/reports', reportsRouter);

// Documentation
setupSwagger(app);


// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Error Handling
app.use(errorHandler);

// 6. Server Lifecycle
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  logger.info(`🚀 Agentic AI Backend running on port ${PORT}`);
  await SchedulerService.loadAllSchedules();
  EmailService.verifyConnection();
  
  // Keep-alive ping for Render free tier
  if (process.env.NODE_ENV === 'production') {
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 
      'https://agenticai-backend-xao9.onrender.com';
    
    setInterval(() => {
      fetch(`${RENDER_URL}/health`)
        .then(() => logger.debug('Keep-alive ping sent'))
        .catch(err => logger.warn('Keep-alive failed', { err }));
    }, 14 * 60 * 1000); // every 14 minutes
    
    logger.info('Keep-alive service started');
  }

  try {
    await initializeJobs();
  } catch (error) {
    logger.warn('Job initialization failed (Redis might be unavailable)');
  }
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('All connections closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
