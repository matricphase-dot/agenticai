import { prisma } from "../lib/prisma";
import { TransactionType } from "@prisma/client";

export class BillingService {
  static async topUp(userId: string, amount: number, paymentMethod: string) {
    // In prod, integrate with Stripe/PayPal here
    return prisma.$transaction(async (tx) => {
      const balance = await tx.balance.upsert({
        where: { userId },
        update: { credits: { increment: amount } },
        create: { userId, credits: amount }
      });

      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.TOPUP,
          amount,
          description: `Topped up $${amount} via ${paymentMethod}`,
          metadata: { paymentMethod }
        }
      });

      return balance;
    });
  }

  static async getBalance(userId: string) {
    const balance = await prisma.balance.findUnique({ where: { userId } });
    if (!balance) {
      return prisma.balance.create({ data: { userId, credits: 0 } });
    }
    return balance;
  }

  static async getTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async chargeInvocation(userId: string, amount: number, agentId: string) {
    return prisma.$transaction(async (tx) => {
      const balance = await tx.balance.update({
        where: { userId },
        data: { credits: { decrement: amount } }
      });

      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.INVOCATION_CHARGE,
          amount: -amount,
          description: `Charged $${amount} for agent invocation`,
          metadata: { agentId }
        }
      });

      return balance;
    });
  }
}
