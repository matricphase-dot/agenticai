import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      emailVerified: true,
      passwordHash: true,
      role: true,
    }
  });
  
  console.log('All users in database:');
  users.forEach(u => {
    console.log(`${u.email} | verified: ${u.emailVerified} | hasPassword: ${Boolean(u.passwordHash)}`);
  });
  
  // Fix any unverified seeded users
  await prisma.user.updateMany({
    where: {
      email: {
        in: [
          'demo@agenticai.dev',
          'alice@agenticai.dev', 
          'bob@agenticai.dev',
        ]
      }
    },
    data: { emailVerified: true }
  });
  
  console.log('\nFixed: all demo users are now verified');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
