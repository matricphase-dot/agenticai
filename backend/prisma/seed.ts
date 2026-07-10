import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Synchronizing database tables and migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (err: any) {
    console.warn('Note: prisma migrate deploy warning:', err.message || err);
  }

  console.log('🚀 Starting database seed...');

  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  // --- 1. USERS ---
  console.log('👥 Creating users...');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@agenticai.dev' },
    update: {},
    create: {
      email: 'demo@agenticai.dev',
      name: 'Demo User',
      role: 'ADMIN',
      emailVerified: true,
      passwordHash,
      balance: {
        create: {
          credits: 1000.00,
          tokenBalance: 500.00
        }
      }
    }
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@agenticai.dev' },
    update: {},
    create: {
      id: 'alice-fixed-id-123',
      email: 'alice@agenticai.dev',
      name: 'Alice Chen',
      role: 'USER',
      emailVerified: true,
      passwordHash,
      balance: {
        create: {
          credits: 1000.00,
          tokenBalance: 500.00
        }
      }
    }
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@agenticai.dev' },
    update: {},
    create: {
      id: 'bob-fixed-id-456',
      email: 'bob@agenticai.dev',
      name: 'Bob Patel',
      role: 'USER',
      emailVerified: true,
      passwordHash,
      balance: {
        create: {
          credits: 1000.00,
          tokenBalance: 500.00
        }
      }
    }
  });

  // --- 2. AGENTS ---
  console.log('🤖 Creating agents...');
  
  const agent1 = await prisma.agent.upsert({
    where: { slug: 'datamind-pro' },
    update: {},
    create: {
      userId: alice.id,
      name: 'DataMind Pro',
      slug: 'datamind-pro',
      description: 'Advanced data analysis agent that processes CSV, JSON, and database outputs to generate actionable business insights.',
      modelProvider: 'groq',
      modelName: 'llama-3.1-8b-instant',
      systemPrompt: 'You are DataMind, an expert data analyst.',
      category: 'DATA_ANALYST',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.05,
      isPublic: true,
      status: 'PUBLISHED',
      currentVersion: '1.2.0',
      tags: JSON.stringify(['data', 'analytics', 'insights']),
      analytics: {
        create: {
          totalInvocations: 1247,
          successCount: 1198,
          failureCount: 49,
          avgLatencyMs: 1823,
          totalEarnings: 62.35,
          stakerCount: 8,
          totalStaked: 4200.0
        }
      }
    }
  });

  const additionalAgents = [
    {
      name: 'LegalEagle AI',
      slug: 'legaleagle-ai',
      description: 'AI legal assistant that helps with contract review, legal research, and compliance checks. Trained on thousands of legal documents.',
      category: 'LEGAL',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.10,
      tags: ['legal', 'contracts', 'compliance'],
      invocations: 342, earnings: 34.20, rating: 4.6, stakers: 15, staked: 8500.0,
    },
    {
      name: 'MarketMind',
      slug: 'marketmind',
      description: 'Real-time market analysis agent. Analyzes trends, competitor data, and consumer sentiment to generate actionable marketing insights.',
      category: 'DATA_ANALYST',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.08,
      tags: ['marketing', 'analytics', 'market-research'],
      invocations: 891, earnings: 71.28, rating: 4.8, stakers: 23, staked: 12000.0,
    },
    {
      name: 'FinanceGuru',
      slug: 'financeguru',
      description: 'Personal finance advisor that analyzes spending patterns, suggests investment strategies, and helps with budgeting and financial planning.',
      category: 'FINANCE',
      pricingModel: 'FREE',
      pricePerCall: 0.0,
      tags: ['finance', 'investing', 'budgeting'],
      invocations: 2341, earnings: 0.0, rating: 4.5, stakers: 31, staked: 15000.0,
    },
    {
      name: 'DevOps Assistant',
      slug: 'devops-assistant',
      description: 'Expert DevOps agent for CI/CD pipelines, Docker configurations, Kubernetes deployments, and infrastructure-as-code.',
      category: 'CODE_ASSISTANT',
      pricingModel: 'PER_TOKEN',
      pricePerToken: 0.00008,
      tags: ['devops', 'docker', 'kubernetes', 'cicd'],
      invocations: 567, earnings: 45.36, rating: 4.9, stakers: 18, staked: 9800.0,
    },
    {
      name: 'ContentCreator Pro',
      slug: 'contentcreator-pro',
      description: 'AI content strategist that creates SEO-optimized blog posts, social media content, email campaigns, and marketing copy.',
      category: 'AUTOMATION',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.05,
      tags: ['content', 'seo', 'marketing', 'writing'],
      invocations: 1823, earnings: 91.15, rating: 4.7, stakers: 29, staked: 18000.0,
    },
    {
      name: 'CodeReviewer Pro',
      slug: 'codereviewer-pro',
      description: 'Automated code review agent that scans pull requests for bugs, security vulnerabilities, and code smell.',
      category: 'CODE_ASSISTANT',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.03,
      tags: ['code', 'review', 'security'],
      invocations: 945, earnings: 28.35, rating: 4.8, stakers: 12, staked: 6500.0,
    },
    {
      name: 'QueryMaster AI',
      slug: 'querymaster-ai',
      description: 'Expert database querying agent that translates natural language questions into complex, optimized SQL queries.',
      category: 'RESEARCH',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.04,
      tags: ['sql', 'database', 'queries'],
      invocations: 1450, earnings: 58.00, rating: 4.7, stakers: 19, staked: 11200.0,
    }
  ];

  for (const data of additionalAgents) {
    const existing = await prisma.agent.findUnique({ where: { slug: data.slug } });
    if (!existing) {
      const agent = await prisma.agent.create({
        data: {
          userId: bob.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          modelProvider: 'groq',
          modelName: 'llama-3.1-8b-instant',
          systemPrompt: `You are ${data.name}, an expert AI assistant. Always provide helpful, accurate, and concise responses.`,
          category: data.category as any,
          pricingModel: data.pricingModel as any,
          pricePerCall: data.pricePerCall || 0,
          pricePerToken: (data as any).pricePerToken || 0,
          isPublic: true,
          status: 'PUBLISHED',
          currentVersion: '1.0.0',
          tags: JSON.stringify(data.tags),
          analytics: {
            create: {
              totalInvocations: data.invocations,
              successCount: Math.floor(data.invocations * 0.96),
              failureCount: Math.floor(data.invocations * 0.04),
              avgLatencyMs: Math.floor(Math.random() * 1500) + 500,
              totalEarnings: data.earnings,
              stakerCount: data.stakers,
              totalStaked: data.staked,
            }
          }
        }
      });

      // Seed sample reviews
      for (let i = 0; i < 2; i++) {
        await prisma.review.create({
          data: {
            agentId: agent.id,
            userId: i === 0 ? alice.id : bob.id,
            rating: Math.floor(Math.random() * 2) + 4,
            comment: i === 0 
              ? 'Incredibly useful agent. Saves me hours every week.' 
              : 'Best AI agent I have used. Highly recommend to everyone.',
          }
        }).catch(() => {});
      }
      console.log(`Created agent: ${data.name}`);
    }
  }

  console.log('✨ Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
