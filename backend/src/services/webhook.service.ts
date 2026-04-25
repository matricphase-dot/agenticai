import { prisma } from "../lib/prisma";
import axios from "axios";
import { signWebhookPayload } from "../lib/encryption";
import logger from "../lib/logger";

export class WebhookService {
  static async createWebhook(userId: string, data: any) {
    return prisma.webhook.create({
      data: {
        userId,
        name: data.name,
        url: data.url,
        secret: data.secret || `whsec_${crypto.randomUUID()}`,
        events: data.events
      }
    });
  }

  static async trigger(userId: string, event: string, payload: any) {
    const webhooks = await prisma.webhook.findMany({
      where: { userId, isActive: true, events: { has: event } }
    });

    for (const webhook of webhooks) {
      this.deliver(webhook, event, payload).catch(err => {
        logger.error(`Webhook delivery failure for ${webhook.id}:`, err);
      });
    }
  }

  private static async deliver(webhook: any, event: string, payload: any) {
    const timestamp = Date.now();
    const signature = signWebhookPayload(webhook.secret, JSON.stringify(payload));

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: {
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": event,
          "X-Webhook-Timestamp": timestamp,
          "Content-Type": "application/json"
        },
        timeout: 5000
      });

      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          statusCode: response.status,
          success: true
        }
      });

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggeredAt: new Date(), failureCount: 0 }
      });
    } catch (error: any) {
      const failureCount = webhook.failureCount + 1;
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          statusCode: error.response?.status,
          response: error.message,
          success: false
        }
      });

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { 
          failureCount,
          isActive: failureCount < 10 // Auto-disable after 10 failures
        }
      });
    }
  }
}
