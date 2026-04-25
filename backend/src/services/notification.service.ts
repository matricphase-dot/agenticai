import { prisma } from "../lib/prisma";
import { emitToUser } from "../lib/socket";
import logger from "../lib/logger";

export class NotificationService {
  static async notify(userId: string, type: string, title: string, message: string, link?: string) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          link
        }
      });

      // Emit real-time socket event
      emitToUser(userId, "notification:new", {
        id: notification.id,
        type,
        title,
        message,
        link
      });

      // Logic for push/email could be added here based on user preferences
      const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
      if (prefs && prefs.emailInvocations) {
        // mailService.sendNotification(...)
      }

      return notification;
    } catch (err) {
      logger.error("Failed to send notification:", err);
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true }
    });
  }

  static async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}
