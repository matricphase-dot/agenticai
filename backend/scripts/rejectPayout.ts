import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rejectPayout(payoutId: string, reason: string) {
  try {
    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      console.error(`Payout request ${payoutId} not found.`);
      return;
    }

    if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
      console.error(`Cannot reject payout in status: ${payout.status}`);
      return;
    }

    await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'REJECTED', notes: reason },
      }),
      prisma.balance.update({
        where: { userId: payout.userId },
        data: { earnedCredits: { increment: payout.amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: payout.userId,
          type: 'REFUND',
          amount: payout.amount,
          description: `Refund for rejected payout: ${reason}`,
        },
      }),
    ]);

    console.log(`Successfully rejected payout ${payoutId} and refunded ${payout.amount} earned credits to user ${payout.userId}.`);
  } catch (error) {
    console.error(`Failed to reject payout:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  const payoutId = process.argv[2];
  const reason = process.argv[3] || 'No reason provided';
  if (!payoutId) {
    console.log('Usage: npx ts-node scripts/rejectPayout.ts <payoutId> [reason]');
    process.exit(1);
  }
  rejectPayout(payoutId, reason);
}
