import { prisma } from "../lib/prisma";
import { encryptionService } from "./encryption.service";
import logger from "../lib/logger";
import { AgentCategory, AgentStatus, PricingModel } from "@prisma/client";

export class AgentService {
  static async listAgents(filters: { userId?: string; category?: string; status?: string; isPublic?: boolean }) {
    return prisma.agent.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.category && { category: filters.category as AgentCategory }),
        ...(filters.status && { status: filters.status as AgentStatus }),
        ...(filters.isPublic !== undefined && { isPublic: filters.isPublic }),
      },
      include: {
        analytics: true,
        user: {
          select: {
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async createAgent(userId: string, data: any) {
    const { 
      name, 
      slug, 
      description, 
      modelProvider, 
      modelName, 
      systemPrompt, 
      category, 
      pricingModel, 
      pricePerCall, 
      pricePerToken,
      isPublic,
      inputSchema,
      outputSchema,
      cpuRequired,
      ramRequired,
      gpuRequired
    } = data;

    return prisma.agent.create({
      data: {
        userId,
        name,
        slug,
        description,
        modelProvider,
        modelName,
        systemPrompt,
        category: category as AgentCategory,
        pricingModel: pricingModel as PricingModel,
        pricePerCall: pricePerCall || 0,
        pricePerToken: pricePerToken || 0,
        isPublic: isPublic ?? true,
        inputSchema: inputSchema || {},
        outputSchema: outputSchema || {},
        cpuRequired: cpuRequired || 1,
        ramRequired: ramRequired || 512,
        gpuRequired: gpuRequired || false,
        status: AgentStatus.PUBLISHED, // Auto-publish for MVP
        analytics: {
          create: {}
        }
      }
    });
  }

  static async getAgentById(id: string) {
    return prisma.agent.findUnique({
      where: { id },
      include: {
        analytics: true,
        versions: true,
        user: {
          select: {
            name: true,
            avatar: true
          }
        }
      }
    });
  }

  static async updateAgent(id: string, userId: string, data: any) {
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent || agent.userId !== userId) {
      throw new Error("Agent not found or unauthorized.");
    }

    return prisma.agent.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }
}
