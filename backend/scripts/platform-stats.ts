import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const invocationCount = await prisma.invocation.count();
  const agentCount = await prisma.agent.count();
  const unverifiedCount = await prisma.user.count({ where: { emailVerified: false } });

  console.log('--- PLATFORM STATS ---');
  console.log(`Total Users: ${userCount}`);
  console.log(`Unverified Users: ${unverifiedCount}`);
  console.log(`Total Agents: ${agentCount}`);
  console.log(`Total Invocations: ${invocationCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
