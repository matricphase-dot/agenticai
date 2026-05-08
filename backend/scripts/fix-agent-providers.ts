import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Fixing agent providers to Groq...');

  // Fix all agents to use Groq (free, configured)
  const result = await prisma.agent.updateMany({
    where: {
      modelProvider: { in: ['openai', 'anthropic'] }
    },
    data: {
      modelProvider: 'groq',
      modelName: 'llama3-8b-8192',
    }
  });
  
  console.log(`✅ Fixed ${result.count} agents to use Groq`);
  
  // Verify
  const agents = await prisma.agent.findMany({
    select: { name: true, modelProvider: true, modelName: true }
  });
  
  console.log('📋 All agents now use:');
  agents.forEach(a => console.log(`  ${a.name}: ${a.modelProvider}/${a.modelName}`));
}

main()
  .catch((error) => {
    console.error('❌ Error fixing agent providers:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
