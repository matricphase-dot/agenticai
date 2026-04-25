import { PrismaClient, Role, AgentCategory, PricingModel, AgentStatus, NodeStatus, InvocationStatus, ProposalType, ProposalStatus, VoteChoice, StakeStatus, TeamRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting comprehensive database seed...');

  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  // --- 1. USERS ---
  console.log('👥 Creating users...');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@agenticai.dev' },
    update: {},
    create: {
      email: 'demo@agenticai.dev',
      name: 'Demo User',
      role: Role.ADMIN,
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
    update: { id: 'alice-fixed-id-123' },
    create: {
      id: 'alice-fixed-id-123',
      email: 'alice@agenticai.dev',
      name: 'Alice Chen',
      role: Role.USER,
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
    update: { id: 'bob-fixed-id-456' },
    create: {
      id: 'bob-fixed-id-456',
      email: 'bob@agenticai.dev',
      name: 'Bob Patel',
      role: Role.USER,
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
  
  // Agent 1: DataMind Pro
  const agent1 = await prisma.agent.upsert({
    where: { slug: 'datamind-pro' },
    update: {},
    create: {
      userId: alice.id,
      name: 'DataMind Pro',
      slug: 'datamind-pro',
      description: 'Advanced data analysis agent that processes CSV, JSON, and database outputs to generate actionable business insights. Specializes in trend detection and anomaly identification.',
      modelProvider: 'openai',
      modelName: 'gpt-4o',
      systemPrompt: 'You are DataMind, an expert data analyst. When given data, you identify patterns, trends, and anomalies. Always structure your response with: 1) Key Findings, 2) Trends Detected, 3) Anomalies, 4) Recommendations. Be precise and data-driven.',
      category: AgentCategory.DATA_ANALYST,
      pricingModel: PricingModel.PER_INVOCATION,
      pricePerCall: 0.05,
      isPublic: true,
      status: AgentStatus.PUBLISHED,
      currentVersion: '1.2.0',
      tags: ['data', 'analytics', 'insights', 'csv', 'trends'],
      analytics: {
        create: {
          totalInvocations: 1247,
          successCount: 1198,
          failureCount: 49,
          avgLatencyMs: 1823,
          totalEarnings: 62.35,
          stakerCount: 8,
          totalStaked: 4200.0,
          avgRating: 4.7,
          reviewCount: 23
        }
      }
    }
  });

  // Agent 2: CodeCraft AI
  const agent2 = await prisma.agent.upsert({
    where: { slug: 'codecraft-ai' },
    update: {},
    create: {
      userId: alice.id,
      name: 'CodeCraft AI',
      slug: 'codecraft-ai',
      description: 'Production-grade code generation and review agent. Supports TypeScript, Python, Go, and Rust. Provides code with full documentation, tests, and security considerations.',
      modelProvider: 'anthropic',
      modelName: 'claude-3-opus',
      systemPrompt: 'You are CodeCraft, an expert software engineer. Generate clean, well-documented, production-ready code. Always include: error handling, TypeScript types (if applicable), unit test examples, and security notes.',
      category: AgentCategory.CODE_ASSISTANT,
      pricingModel: PricingModel.PER_TOKEN,
      pricePerToken: 0.0001,
      isPublic: true,
      status: AgentStatus.PUBLISHED,
      currentVersion: '2.0.1',
      tags: ['coding', 'typescript', 'python', 'review', 'tests'],
      analytics: {
        create: {
          totalInvocations: 892,
          successCount: 871,
          failureCount: 21,
          avgLatencyMs: 2341,
          totalEarnings: 89.20,
          stakerCount: 12,
          totalStaked: 7800.0,
          avgRating: 4.9,
          reviewCount: 41
        }
      }
    }
  });

  // Agent 3: ResearchBot
  const agent3 = await prisma.agent.upsert({
    where: { slug: 'researchbot' },
    update: {},
    create: {
      userId: alice.id,
      name: 'ResearchBot',
      slug: 'researchbot',
      description: 'Comprehensive research and summarization agent. Synthesizes information from complex topics into clear, structured reports with citations and key takeaways.',
      modelProvider: 'google',
      modelName: 'gemini-pro',
      systemPrompt: 'You are ResearchBot, a thorough research assistant. For any topic, provide: Executive Summary, Key Facts, Multiple Perspectives, Data & Statistics, and Conclusion. Always acknowledge uncertainty and conflicting evidence.',
      category: AgentCategory.RESEARCH,
      pricingModel: PricingModel.FREE,
      pricePerCall: 0,
      isPublic: true,
      status: AgentStatus.PUBLISHED,
      currentVersion: '1.0.0',
      tags: ['research', 'summarization', 'reports', 'analysis'],
      analytics: {
        create: {
          totalInvocations: 3421,
          successCount: 3380,
          failureCount: 41,
          avgLatencyMs: 3102,
          totalEarnings: 0.00,
          stakerCount: 5,
          totalStaked: 1500.0,
          avgRating: 4.5,
          reviewCount: 17
        }
      }
    }
  });

  // Agent 4: SupportGenie
  const agent4 = await prisma.agent.upsert({
    where: { slug: 'supportgenie' },
    update: {},
    create: {
      userId: alice.id,
      name: 'SupportGenie',
      slug: 'supportgenie',
      description: 'Intelligent customer support agent trained on best practices for SaaS products. Handles FAQs, troubleshooting, and escalation routing with empathy and precision.',
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      systemPrompt: 'You are SupportGenie, a friendly customer support specialist. Always: greet warmly, understand the issue fully, provide step-by-step solutions, offer alternatives if the primary solution fails, and end with a satisfaction check.',
      category: AgentCategory.CUSTOMER_SUPPORT,
      pricingModel: PricingModel.PER_INVOCATION,
      pricePerCall: 0.02,
      isPublic: true,
      status: AgentStatus.PUBLISHED,
      currentVersion: '1.1.0',
      tags: ['support', 'faq', 'customer-service', 'helpdesk'],
      analytics: {
        create: {
          totalInvocations: 567,
          successCount: 541,
          failureCount: 26,
          avgLatencyMs: 987,
          totalEarnings: 11.34,
          stakerCount: 3,
          totalStaked: 900.0,
          avgRating: 4.3,
          reviewCount: 9
        }
      }
    }
  });

  // Agent 5: FinanceAdvisor (Private draft)
  const agent5 = await prisma.agent.upsert({
    where: { slug: 'finance-advisor-draft' },
    update: {},
    create: {
      userId: alice.id,
      name: 'FinanceAdvisor',
      slug: 'finance-advisor-draft',
      description: 'Financial analysis and portfolio optimization agent.',
      modelProvider: 'openai',
      modelName: 'gpt-4o',
      systemPrompt: 'You are a financial advisor assistant.',
      category: AgentCategory.FINANCE,
      pricingModel: PricingModel.PER_INVOCATION,
      pricePerCall: 0.10,
      isPublic: false,
      status: AgentStatus.DRAFT,
      currentVersion: '0.1.0',
      tags: ['finance', 'trading', 'portfolio']
    }
  });

  // --- 3. NODES ---
  console.log('🖥️ Creating nodes...');
  const node1 = await prisma.node.upsert({
    where: { nodeApiKey: crypto.randomBytes(32).toString('hex') }, // Using random key as placeholder for upsert
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Alpha-GPU-01',
      endpoint: 'https://node-alpha.agenticai.dev',
      nodeApiKey: crypto.randomBytes(32).toString('hex'),
      description: 'High-performance NVIDIA A100 GPU node optimized for LLM inference. 99.9% uptime SLA.',
      gpuType: 'NVIDIA A100 80GB',
      cpuCores: 32,
      ramGb: 256,
      storageGb: 2000,
      supportedModels: ['gpt-4o', 'claude-3-opus', 'llama-3-70b'],
      pricePerTask: 0.008,
      status: NodeStatus.ONLINE,
      reputation: 94.5,
      uptimePercent: 99.2,
      totalTasks: 8432,
      successfulTasks: 8389,
      failedTasks: 43,
      totalEarned: 67.46,
      lastHeartbeat: new Date()
    }
  });

  const node2 = await prisma.node.upsert({
    where: { nodeApiKey: crypto.randomBytes(32).toString('hex') },
    update: {},
    create: {
      userId: alice.id,
      name: 'Beta-CPU-03',
      endpoint: 'https://node-beta.agenticai.dev',
      nodeApiKey: crypto.randomBytes(32).toString('hex'),
      description: 'Reliable CPU node for lightweight agent tasks and text-based processing.',
      gpuType: undefined,
      cpuCores: 16,
      ramGb: 64,
      storageGb: 500,
      supportedModels: ['gpt-4o-mini', 'gemini-pro', 'mistral-7b'],
      pricePerTask: 0.002,
      status: NodeStatus.BUSY,
      reputation: 78.3,
      uptimePercent: 96.8,
      totalTasks: 3201,
      successfulTasks: 3089,
      failedTasks: 112,
      totalEarned: 6.40,
      lastHeartbeat: new Date()
    }
  });

  const node3 = await prisma.node.upsert({
    where: { nodeApiKey: crypto.randomBytes(32).toString('hex') },
    update: {},
    create: {
      userId: bob.id,
      name: 'Gamma-GPU-02',
      endpoint: 'https://node-gamma.agenticai.dev',
      nodeApiKey: crypto.randomBytes(32).toString('hex'),
      description: 'Secondary GPU node — currently undergoing maintenance.',
      gpuType: 'NVIDIA RTX 4090',
      cpuCores: 24,
      ramGb: 128,
      storageGb: 1000,
      supportedModels: ['gpt-4o', 'llama-3-70b'],
      pricePerTask: 0.005,
      status: NodeStatus.OFFLINE,
      reputation: 61.2,
      uptimePercent: 87.4,
      totalTasks: 1893,
      successfulTasks: 1654,
      failedTasks: 239,
      totalEarned: 9.46,
      lastHeartbeat: new Date(Date.now() - 5 * 60 * 1000)
    }
  });

  // --- 4. INVOCATIONS ---
  console.log('📈 Creating invocations...');
  const agentsForInvocations = [agent1, agent2];
  for (let i = 0; i < 10; i++) {
    const agent = agentsForInvocations[i % 2];
    const status = i < 8 ? InvocationStatus.SUCCESS : InvocationStatus.FAILED;
    await prisma.invocation.create({
      data: {
        agentId: agent.id,
        userId: demoUser.id,
        input: { prompt: `Test prompt ${i}` },
        output: status === InvocationStatus.SUCCESS ? { response: `Test response ${i}` } : undefined,
        status: status,
        latencyMs: Math.floor(800 + Math.random() * 2700),
        tokensUsed: Math.floor(100 + Math.random() * 900),
        cost: agent.pricePerCall || (Math.random() * 0.1),
        errorMessage: status === InvocationStatus.FAILED ? 'Simulated failure' : undefined,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
      }
    });
  }

  // --- 5. STAKES ---
  console.log('🥩 Creating stakes...');
  await prisma.stake.upsert({
    where: { userId_agentId: { userId: bob.id, agentId: agent1.id } },
    update: {},
    create: {
      userId: bob.id,
      agentId: agent1.id,
      amount: 500,
      lockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: StakeStatus.ACTIVE
    }
  });

  await prisma.stake.upsert({
    where: { userId_agentId: { userId: bob.id, agentId: agent2.id } },
    update: {},
    create: {
      userId: bob.id,
      agentId: agent2.id,
      amount: 300,
      lockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: StakeStatus.ACTIVE
    }
  });

  await prisma.stake.upsert({
    where: { userId_agentId: { userId: alice.id, agentId: agent3.id } },
    update: {},
    create: {
      userId: alice.id,
      agentId: agent3.id,
      amount: 200,
      lockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: StakeStatus.ACTIVE
    }
  });

  // --- 6. GOVERNANCE ---
  console.log('⚖️ Creating governance proposals...');
  const proposal1 = await prisma.proposal.create({
    data: {
      title: 'Reduce Platform Fee from 20% to 15%',
      description: 'This proposal aims to make the Agentic AI Platform more competitive by reducing the platform fee from 20% to 15%. The reduction will increase creator earnings, potentially attracting more high-quality agent developers to the platform.\n\n## Rationale\nCurrent 20% fee is above market average (15%). Reducing to 15% would increase creator revenue by 6.25%, likely increasing supply of quality agents.\n\n## Implementation\nIf passed, the fee change would take effect 14 days after proposal execution.',
      type: ProposalType.FEE_CHANGE,
      proposerId: alice.id,
      status: ProposalStatus.ACTIVE,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      quorum: 0.10,
      forVotes: 12500.0,
      againstVotes: 3200.0,
      abstainVotes: 800.0
    }
  });

  const proposal2 = await prisma.proposal.create({
    data: {
      title: 'Add Hinglish Language Support to Agent Prompts',
      description: 'Enable agents to generate content in Hinglish (Roman script Hindi-English code-switching) to serve the large Indian creator market. This opens the platform to 500M+ potential users.',
      type: ProposalType.FEATURE,
      proposerId: demoUser.id,
      status: ProposalStatus.PASSED,
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      quorum: 0.10,
      forVotes: 28900.0,
      againstVotes: 1100.0,
      abstainVotes: 2000.0
    }
  });

  // --- 7. VOTES ---
  console.log('🗳️ Creating votes...');
  await prisma.vote.upsert({
    where: { proposalId_userId: { proposalId: proposal1.id, userId: bob.id } },
    update: {},
    create: {
      proposalId: proposal1.id,
      userId: bob.id,
      choice: VoteChoice.FOR,
      weight: 800
    }
  });

  await prisma.vote.upsert({
    where: { proposalId_userId: { proposalId: proposal1.id, userId: demoUser.id } },
    update: {},
    create: {
      proposalId: proposal1.id,
      userId: demoUser.id,
      choice: VoteChoice.FOR,
      weight: 1000
    }
  });

  // --- 8. REVIEWS ---
  console.log('⭐ Creating reviews...');
  await prisma.review.upsert({
    where: { agentId_userId: { agentId: agent1.id, userId: bob.id } },
    update: {},
    create: {
      agentId: agent1.id,
      userId: bob.id,
      rating: 5,
      comment: 'Absolutely incredible for business data analysis. Saved our team 20+ hours per week.'
    }
  });

  await prisma.review.upsert({
    where: { agentId_userId: { agentId: agent2.id, userId: demoUser.id } },
    update: {},
    create: {
      agentId: agent2.id,
      userId: demoUser.id,
      rating: 5,
      comment: 'Best code generation agent I\'ve used. TypeScript output is clean and production-ready.'
    }
  });

  await prisma.review.upsert({
    where: { agentId_userId: { agentId: agent3.id, userId: alice.id } },
    update: {},
    create: {
      agentId: agent3.id,
      userId: alice.id,
      rating: 4,
      comment: 'Great for research synthesis. Sometimes a bit slow on complex topics but very thorough.'
    }
  });

  // --- 9. API KEYS ---
  console.log('🔑 Creating API keys...');
  const users = [demoUser, alice, bob];
  for (const user of users) {
    const key = `sk-agnt-${crypto.randomBytes(24).toString('hex')}`;
    await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: 'Default Key',
        keyPrefix: key.substring(0, 15),
        keyHash: crypto.createHash('sha256').update(key).digest('hex'),
        rateLimit: 100,
        isActive: true
      }
    });
  }

  // --- 10. TEAMS ---
  console.log('👥 Creating teams...');
  const team1 = await prisma.team.upsert({
    where: { slug: 'ai-builders' },
    update: {},
    create: {
      name: 'AI Builders Collective',
      slug: 'ai-builders',
      description: 'A team building next-gen AI agents',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: TeamRole.OWNER },
          { userId: bob.id, role: TeamRole.MEMBER }
        ]
      }
    }
  });

  // --- 11. WEBHOOKS ---
  console.log('🔗 Creating webhooks...');
  await prisma.webhook.create({
    data: {
      userId: alice.id,
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/test/webhook',
      secret: crypto.randomBytes(32).toString('hex'),
      events: ['invocation.completed', 'reward.distributed', 'stake.placed'],
      isActive: true
    }
  });

  // --- 12. NOTIFICATIONS ---
  console.log('🔔 Creating notifications...');
  for (const user of users) {
    await prisma.notification.createMany({
      data: [
        { userId: user.id, type: 'reward', title: 'Reward Received', message: 'You received 5.2 AGNT in staking rewards.', read: false },
        { userId: user.id, type: 'invocation', title: 'Agent Invoked', message: 'Your DataMind Pro agent was successfully invoked.', read: true },
        { userId: user.id, type: 'governance', title: 'New Proposal', message: 'A new proposal is active for voting.', read: false }
      ]
    });
  }

  console.log('✨ Database seeding completed successfully!');
  console.log(`
Summary:
- Users: 3
- Agents: 5
- Nodes: 3
- Invocations: 10
- Stakes: 3
- Proposals: 2
- Votes: 2
- Reviews: 3
- Teams: 1
- API Keys: 3
- Webhooks: 1
- Notifications: 9
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
