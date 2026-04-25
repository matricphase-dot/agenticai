import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const HEARTBEAT_TIMEOUT_MS = 90 * 1000; // 90 seconds

export const NodeService = {

  // Mark nodes OFFLINE if no heartbeat for 90s
  markOfflineNodes: async () => {
    const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);

    const result = await prisma.node.updateMany({
      where: {
        status: 'ONLINE',
        lastHeartbeat: { lt: cutoff },
      },
      data: { status: 'OFFLINE' },
    });

    return { markedOffline: result.count };
  },

  // List nodes for a user
  listNodes: async (filter: { userId: string }) => {
    return prisma.node.findMany({
      where: filter,
      orderBy: { registeredAt: 'desc' },
    });
  },

  // Register a new node
  registerNode: async (userId: string, data: any) => {
    const { name, endpoint, cpuCores, ramGb, gpuType, supportedModels } = data;
    
    // Generate a node API key
    const crypto = require('crypto');
    const rawKey = `node_${crypto.randomBytes(32).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const node = await prisma.node.create({
      data: {
        userId,
        name,
        endpoint,
        nodeApiKey: hash,
        cpuCores,
        ramGb,
        gpuType,
        supportedModels: supportedModels || [],
        status: 'OFFLINE',
      },
    });

    return { node, nodeApiKey: rawKey };
  },

  // Update node heartbeat
  heartbeat: async (nodeApiKey: string) => {
    const hash = require('crypto')
      .createHash('sha256')
      .update(nodeApiKey)
      .digest('hex');

    // Find node by hashed API key
    const node = await prisma.node.findFirst({
      where: { nodeApiKey: hash },
    });

    if (!node) {
      throw Object.assign(
        new Error('Invalid node API key'),
        { code: 'INVALID_NODE_KEY', status: 401 }
      );
    }

    await prisma.node.update({
      where: { id: node.id },
      data: { 
        lastHeartbeat: new Date(),
        status: 'ONLINE',
      },
    });

    return node;
  },

  // Update node reputation score
  updateReputation: async (nodeId: string) => {
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
    });
    if (!node) return;

    // Blended success rate (recent 24h weighted 70%)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTasks = await prisma.nodeTask.count({
      where: { 
        nodeId, 
        createdAt: { gte: yesterday },
        status: 'COMPLETED' 
      },
    });
    const recentTotal = await prisma.nodeTask.count({
      where: { nodeId, createdAt: { gte: yesterday } },
    });

    const recentSuccessRate = recentTotal > 0 
      ? recentTasks / recentTotal 
      : 0;
    const historicalSuccessRate = node.totalTasks > 0
      ? node.successfulTasks / node.totalTasks
      : 0;

    const blendedSuccessRate = 
      (recentSuccessRate * 0.7) + (historicalSuccessRate * 0.3);
    
    const uptimeScore = node.uptimePercent / 100;

    const reputation = Math.round(
      (blendedSuccessRate * 60) + (uptimeScore * 40)
    );

    await prisma.node.update({
      where: { id: nodeId },
      data: { 
        reputation: Math.max(0, Math.min(100, reputation)) 
      },
    });
  },
};
