import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import logger from "./logger";

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join global stats room
    socket.join("global");

    socket.on("join:agent", (agentId: string) => {
      socket.join(`agent:${agentId}`);
    });

    socket.on("leave:agent", (agentId: string) => {
      socket.leave(`agent:${agentId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${userId})`);
    });
  });

  logger.info("Socket.io initialized");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

// Emit to a specific user
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

// Emit to all connected clients
export function emitGlobal(event: string, data: unknown): void {
  if (!io) return;
  io.to("global").emit(event, data);
}

// Emit to agent room
export function emitToAgent(agentId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`agent:${agentId}`).emit(event, data);
}

export type SocketEvents = {
  "notification:new": { id: string; type: string; title: string; message: string; link?: string };
  "invocation:update": { invocationId: string; status: string; output?: unknown; latencyMs?: number; cost?: number };
  "invocation:complete": { invocationId: string; agentId: string; output: unknown };
  "node:status": { nodeId: string; status: string };
  "reward:distributed": { amount: number; agentId: string; agentName: string };
  "proposal:finalized": { proposalId: string; title: string; status: string };
  "stake:received": { agentId: string; agentName: string; stakerAddress: string; amount: number };
  "stats:update": { totalAgents: number; totalInvocations: number; activeNodes: number; totalStaked: number };
};
