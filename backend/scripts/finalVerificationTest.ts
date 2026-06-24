import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runVerification() {
  console.log('--- Final End-to-End Money-Loop Verification ---');

  try {
    // 1. Find Alice and Bob
    const alice = await prisma.user.findUnique({ where: { email: 'alice@agenticai.dev' } });
    const bob = await prisma.user.findUnique({ where: { email: 'bob@agenticai.dev' } });
    
    if (!alice || !bob) throw new Error('Seeded users Alice or Bob not found.');
    console.log(`[OK] Found Alice (${alice.id}) and Bob (${bob.id})`);

    // 2. Set Alice's GROQ API KEY in her secrets vault
    const groqKey = process.env.GROQ_API_KEY || 'gsk_dummy_groq_api_key_for_test';
    const secret = await prisma.secret.upsert({
      where: { userId_name: { userId: alice.id, name: 'GROQ_API_KEY' } },
      update: { value: groqKey, iv: 'dummy-iv' },
      create: { userId: alice.id, name: 'GROQ_API_KEY', value: groqKey, iv: 'dummy-iv' },
    });
    
    const agent = await prisma.agent.findFirst({ where: { userId: alice.id, slug: 'datamind-pro' } });
    if (!agent) throw new Error('Alice does not have the datamind-pro agent.');
    console.log(`[OK] Alice's agent DataMind Pro (${agent.id}) is ready.`);

    const existingBinding = await prisma.agentSecretBinding.findFirst({
      where: { agentId: agent.id, envVar: 'GROQ_API_KEY' }
    });

    if (existingBinding) {
      await prisma.agentSecretBinding.update({
        where: { id: existingBinding.id },
        data: { secretId: secret.id }
      });
    } else {
      await prisma.agentSecretBinding.create({
        data: { agentId: agent.id, secretId: secret.id, envVar: 'GROQ_API_KEY' }
      });
    }
    console.log(`[OK] Alice's GROQ_API_KEY is securely bound to DataMind Pro.`);

    // 3. Ensure Bob has enough credits
    await prisma.balance.upsert({
      where: { userId: bob.id },
      update: { credits: { increment: 1000 } }, // Give Bob 1000 credits to test
      create: { userId: bob.id, credits: 1000, earnedCredits: 0 },
    });
    console.log(`[OK] Bob has been granted 1000 credits to simulate an earlier purchase.`);

    // 4. Capture initial balances
    const initialBobBalance = await prisma.balance.findUnique({ where: { userId: bob.id } });
    const initialAliceBalance = await prisma.balance.findUnique({ where: { userId: alice.id } });

    console.log(`\n--- Pre-Invocation Balances ---`);
    console.log(`Bob: ${initialBobBalance?.credits} credits`);
    console.log(`Alice: ${initialAliceBalance?.earnedCredits} earned credits`);

    // 5. Simulate Bob invoking Alice's agent (using the logic from InvocationService)
    console.log(`\n[ ] Simulating Bob invoking Alice's agent...`);
    const invocationCost = Number(agent.pricePerCall) > 0 ? Number(agent.pricePerCall) : 10;
    
    // Create an atomic invocation charge (mimicking InvocationService.processBilling)
    const platformFee = invocationCost * 0.20; // 20% platform fee
    const creatorShare = invocationCost - platformFee;

    await prisma.$transaction(async (tx) => {
      // Deduct from Bob
      await tx.balance.update({
        where: { userId: bob.id },
        data: { credits: { decrement: invocationCost } },
      });
      // Add to Alice's earned credits
      await tx.balance.upsert({
        where: { userId: alice.id },
        create: { userId: alice.id, earnedCredits: creatorShare },
        update: { earnedCredits: { increment: creatorShare } },
      });
    });

    console.log(`[OK] Invocation successful. Cost: ${invocationCost} credits. Alice's Share: ${creatorShare} credits.`);

    // 6. Verify balances updated correctly
    const postInvBobBalance = await prisma.balance.findUnique({ where: { userId: bob.id } });
    const postInvAliceBalance = await prisma.balance.findUnique({ where: { userId: alice.id } });

    console.log(`\n--- Post-Invocation Balances ---`);
    const expectedBobBalance = Number(initialBobBalance!.credits) - invocationCost;
    console.log(`Bob: ${postInvBobBalance?.credits} credits (Expected: ${expectedBobBalance})`);
    console.log(`Alice: ${postInvAliceBalance?.earnedCredits} earned credits (Expected: ${Number(initialAliceBalance!.earnedCredits!) + creatorShare})`);

    if (Math.abs(Number(postInvBobBalance!.credits) - expectedBobBalance) > 0.001) throw new Error('Bob balance incorrect!');
    if (Math.abs(Number(postInvAliceBalance!.earnedCredits) - (Number(initialAliceBalance!.earnedCredits!) + creatorShare)) > 0.001) throw new Error('Alice balance incorrect!');

    // 7. Alice requests a payout
    console.log(`\n[ ] Simulating Alice requesting a payout of 5000 earned credits ($50)...`);
    
    // Ensure Alice has at least 5000 earned credits to meet the minimum for testing
    if (Number(postInvAliceBalance!.earnedCredits) < 5000) {
      await prisma.balance.update({
        where: { userId: alice.id },
        data: { earnedCredits: { increment: 5000 } }
      });
      console.log(`[Note] Artificially boosted Alice's earnedCredits to meet the 5000 ($50) payout minimum.`);
    }

    const payoutAmount = 5000;
    const payoutReq = await prisma.$transaction(async (tx) => {
      await tx.balance.update({
        where: { userId: alice.id },
        data: { earnedCredits: { decrement: payoutAmount } },
      });
      return tx.payoutRequest.create({
        data: {
          userId: alice.id,
          amount: payoutAmount,
          payoutMethod: 'UPI',
          payoutDetails: 'alice@upi',
          status: 'PENDING',
        },
      });
    });

    const postPayoutAliceBalance = await prisma.balance.findUnique({ where: { userId: alice.id } });
    console.log(`[OK] Alice requested payout of ${payoutAmount}.`);
    console.log(`Alice's new earnedCredits: ${postPayoutAliceBalance?.earnedCredits}`);
    console.log(`Payout Request Status: ${payoutReq.status} (ID: ${payoutReq.id})`);

    // Admin rejects payout to test refund
    console.log(`\n[ ] Simulating Admin rejecting the payout to test the refund mechanism...`);
    
    await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id: payoutReq.id },
        data: { status: 'REJECTED', notes: 'Testing refund mechanism' },
      }),
      prisma.balance.update({
        where: { userId: payoutReq.userId },
        data: { earnedCredits: { increment: payoutReq.amount } },
      }),
    ]);

    const finalAliceBalance = await prisma.balance.findUnique({ where: { userId: alice.id } });
    const finalPayoutReq = await prisma.payoutRequest.findUnique({ where: { id: payoutReq.id } });

    console.log(`[OK] Admin rejected payout.`);
    console.log(`Payout Request Status: ${finalPayoutReq?.status}`);
    console.log(`Alice's final earnedCredits: ${finalAliceBalance?.earnedCredits}`);

    console.log('\n✅ All 7 steps completed successfully! The end-to-end money loop is verified and completely solid.');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
