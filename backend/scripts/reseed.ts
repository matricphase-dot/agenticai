import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting reseed...');

  // Create users
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'demo@agenticai.dev' },
    update: { emailVerified: true },
    create: {
      email: 'demo@agenticai.dev',
      name: 'Demo Admin',
      passwordHash,
      emailVerified: true,
      role: 'ADMIN',
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@agenticai.dev' },
    update: { emailVerified: true },
    create: {
      email: 'alice@agenticai.dev',
      name: 'Alice Chen',
      passwordHash,
      emailVerified: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@agenticai.dev' },
    update: { emailVerified: true },
    create: {
      email: 'bob@agenticai.dev',
      name: 'Bob Patel',
      passwordHash,
      emailVerified: true,
    },
  });

  console.log('Users created');

  // Create balances
  for (const user of [admin, alice, bob]) {
    await prisma.balance.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        credits: 1000,
        tokenBalance: 500,
      },
    });
  }

  console.log('Balances created');

  // Create agents
  const agents: any[] = [
    {
      name: 'DataMind Pro',
      slug: 'datamind-pro',
      description: 'Advanced data analysis agent that processes CSV, JSON, and database outputs to generate actionable business insights.',
      modelProvider: 'google',
      modelName: 'gemini-1.5-flash',
      systemPrompt: 'You are DataMind, an expert data analyst. Identify patterns, trends, and anomalies. Structure responses with: Key Findings, Trends, Anomalies, Recommendations.',
      category: 'DATA_ANALYST',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.05,
      isPublic: true,
      status: 'PUBLISHED',
      currentVersion: '1.2.0',
      tags: ['data', 'analytics', 'insights'],
    },
    {
      name: 'CodeCraft AI',
      slug: 'codecraft-ai',
      description: 'Production-grade code generation and review agent supporting TypeScript, Python, Go, and Rust.',
      modelProvider: 'google',
      modelName: 'gemini-1.5-flash',
      systemPrompt: 'You are CodeCraft, an expert software engineer. Generate clean, well-documented, production-ready code with error handling and TypeScript types.',
      category: 'CODE_ASSISTANT',
      pricingModel: 'FREE',
      pricePerCall: 0,
      isPublic: true,
      status: 'PUBLISHED',
      currentVersion: '2.0.1',
      tags: ['coding', 'typescript', 'python'],
    },
    {
      name: 'ResearchBot',
      slug: 'researchbot',
      description: 'Comprehensive research and summarization agent. Synthesizes complex topics into clear structured reports.',
      modelProvider: 'google',
      modelName: 'gemini-1.5-flash',
      systemPrompt: 'You are ResearchBot. Provide Executive Summary, Key Facts, Multiple Perspectives, Data and Statistics, and Conclusion for any topic.',
      category: 'RESEARCH',
      pricingModel: 'FREE',
      pricePerCall: 0,
      isPublic: true,
      status: 'PUBLISHED',
      currentVersion: '1.0.0',
      tags: ['research', 'summarization', 'reports'],
    },
    {
      name: 'SupportGenie',
      slug: 'supportgenie',
      description: 'Intelligent customer support agent trained on SaaS best practices. Handles FAQs and troubleshooting with empathy.',
      modelProvider: 'google',
      modelName: 'gemini-1.5-flash',
      systemPrompt: 'You are SupportGenie, a friendly customer support specialist. Always greet warmly, understand the issue fully, provide step-by-step solutions.',
      category: 'CUSTOMER_SUPPORT',
      pricingModel: 'PER_INVOCATION',
      pricePerCall: 0.02,
      isPublic: true,
      status: 'PUBLISHED',
      currentVersion: '1.1.0',
      tags: ['support', 'customer-service', 'helpdesk'],
    },
    {
      name: 'AutomateX',
      slug: 'automatex',
      description: 'Workflow automation agent that converts natural language instructions into executable automation scripts.',
      modelProvider: 'google',
      modelName: 'gemini-1.5-flash',
      systemPrompt: 'You are AutomateX, a workflow automation expert. Convert user requirements into clear automation steps and scripts.',
      category: 'AUTOMATION',
      pricingModel: 'FREE',
      pricePerCall: 0,
      isPublic: true,
      status: 'PUBLISHED',
      currentVersion: '1.0.0',
      tags: ['automation', 'workflow', 'scripts'],
    },
  ];

  for (const agentData of agents) {
    const existing = await prisma.agent.findUnique({
      where: { slug: agentData.slug },
    });

    if (!existing) {
      const agent = await prisma.agent.create({
        data: {
          ...agentData,
          user: { connect: { id: alice.id } },
        },
      });

      await prisma.agentAnalytics.create({
        data: {
          agentId: agent.id,
          totalInvocations: Math.floor(Math.random() * 1000) + 100,
          successCount: Math.floor(Math.random() * 900) + 90,
          failureCount: Math.floor(Math.random() * 50),
          avgLatencyMs: Math.floor(Math.random() * 2000) + 500,
          totalEarnings: Math.random() * 100,
          stakerCount: Math.floor(Math.random() * 10) + 1,
          totalStaked: Math.random() * 5000 + 500,
          avgRating: 4 + Math.random(),
          reviewCount: Math.floor(Math.random() * 30) + 5,
        },
      });

      console.log(`Created agent: ${agent.name}`);
    } else {
      console.log(`Agent already exists: ${agentData.name}`);
    }
  }

  // Create nodes
  const nodes: any[] = [
    {
      name: 'Alpha-GPU-01',
      endpoint: 'https://node-alpha.agenticai.dev',
      nodeApiKey: 'node-key-alpha-' + Date.now(),
      gpuType: 'NVIDIA A100 80GB',
      cpuCores: 32,
      ramGb: 256,
      storageGb: 2000,
      supportedModels: ['gemini-1.5-flash', 'gpt-4o'],
      pricePerTask: 0.008,
      status: 'ONLINE',
      reputation: 94.5,
      uptimePercent: 99.2,
      totalTasks: 8432,
      successfulTasks: 8389,
      failedTasks: 43,
      totalEarned: 67.46,
    },
    {
      name: 'Beta-CPU-03',
      endpoint: 'https://node-beta.agenticai.dev',
      nodeApiKey: 'node-key-beta-' + Date.now(),
      cpuCores: 16,
      ramGb: 64,
      storageGb: 500,
      supportedModels: ['gemini-1.5-flash'],
      pricePerTask: 0.002,
      status: 'ONLINE',
      reputation: 78.3,
      uptimePercent: 96.8,
      totalTasks: 3201,
      successfulTasks: 3089,
      failedTasks: 112,
      totalEarned: 6.40,
    },
  ];

  for (const nodeData of nodes) {
    const existing = await prisma.node.findFirst({
      where: { name: nodeData.name },
    });

    if (!existing) {
      await prisma.node.create({
        data: {
          ...nodeData,
          user: { connect: { id: admin.id } },
          lastHeartbeat: new Date(),
        },
      });
      console.log(`Created node: ${nodeData.name}`);
    }
  }

  // Create governance proposals
  const proposalCount = await prisma.proposal.count();

  if (proposalCount === 0) {
    await prisma.proposal.create({
      data: {
        title: 'Reduce Platform Fee from 20% to 15%',
        description: 'This proposal aims to make the platform more competitive by reducing the platform fee from 20% to 15%.',
        type: 'FEE_CHANGE',
        proposerId: alice.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        forVotes: 12500,
        againstVotes: 3200,
        abstainVotes: 800,
      },
    });
    console.log('Created proposal');
  }

  // Create stakes
  const agents2 = await prisma.agent.findMany({
    where: { isPublic: true, status: 'PUBLISHED' },
    take: 2,
  });

  for (const agent of agents2) {
    const existingStake = await prisma.stake.findFirst({
      where: { userId: bob.id, agentId: agent.id },
    });

    if (!existingStake) {
      await prisma.stake.create({
        data: {
          userId: bob.id,
          agentId: agent.id,
          amount: 300,
          lockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log('Stakes created');

  console.log('Reseed complete!');
  const agentCount = await prisma.agent.count();
  const nodeCount = await prisma.node.count();
  const userCount = await prisma.user.count();
  console.log(`Final counts: ${userCount} users, ${agentCount} agents, ${nodeCount} nodes`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
