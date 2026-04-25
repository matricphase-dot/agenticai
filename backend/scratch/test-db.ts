import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Verification ---');
  const agentCount = await prisma.agent.count();
  const nodeCount = await prisma.node.count();
  const proposalCount = await prisma.proposal.count();
  const userCount = await prisma.user.count();

  console.log(`Users: ${userCount}`);
  console.log(`Agents: ${agentCount}`);
  console.log(`Nodes: ${nodeCount}`);
  console.log(`Proposals: ${proposalCount}`);
  console.log('-----------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
