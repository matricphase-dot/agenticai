export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  role: string;
  emailVerified: boolean;
  walletAddress?: string;
  createdAt: string;
}

export interface DashboardStats {
  agentCount: number;
  invocationsToday: number;
  credits: number;
  tokenBalance: number;
  totalStaked: number;
  activeStakesCount: number;
  unreadNotifications: number;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  category: string;
  pricingModel: 'FREE' | 'PER_INVOCATION' | 'PER_TOKEN';
  pricePerCall: number;
  pricePerToken: number;
  isPublic: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  currentVersion: string;
  tags: string[];
  createdAt: string;
  analytics?: AgentAnalytics;
  user?: { id: string; name: string; avatar?: string };
}

export interface AgentAnalytics {
  totalInvocations: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  totalEarnings: number;
  stakerCount: number;
  totalStaked: number;
  avgRating: number;
  reviewCount: number;
}

export interface Stake {
  id: string;
  userId: string;
  agentId: string;
  amount: number;
  lockedUntil: string;
  status: 'ACTIVE' | 'UNSTAKING' | 'COMPLETED';
  createdAt: string;
  agent?: { id: string; name: string; category: string };
  rewards?: { amount: number }[];
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'DRAFT' | 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';
  startDate: string;
  endDate: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  quorum: number;
  createdAt: string;
  proposer: { id: string; name: string; avatar?: string };
  myVote?: { choice: string; weight: number } | null;
}

export interface Balance {
  credits: number;
  lockedCredits: number;
  tokenBalance: number;
  lockedTokens: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  rateLimit: number;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface StakingPortfolio {
  totalStaked: number;
  tokenBalance: number;
  lockedTokens: number;
  claimableRewards: number;
  stakes: Stake[];
}

export interface MarketplaceResponse {
  agents: Agent[];
  pagination: Pagination;
}

export interface AgentDetail extends Agent {
  reviews: any[];
}

export interface InvocationResult {
  output: any;
  latencyMs: number;
  cost: number;
}

export interface ProposalsResponse {
  proposals: Proposal[];
  pagination: Pagination;
}

export interface ProposalDetail extends Proposal {
  votes: any[];
}

export interface VotingPower {
  basePower: number;
  delegatedPower: number;
  effectivePower: number;
  canPropose: boolean;
  delegatedTo?: { id: string; name: string };
}

export interface PlatformStats {
  totalInvocations: number;
  totalAgents: number;
  totalUsers: number;
  totalStaked: number;
}

export interface Secret {
  id: string;
  name: string;
  createdAt: string;
  bindings: any[];
}

export interface CreateAgentPayload {
  name: string;
  description: string;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  category: string;
  pricingModel: string;
  pricePerCall?: number;
  pricePerToken?: number;
}

export interface CreateProposalPayload {
  title: string;
  description: string;
  type: string;
}

export interface RegisterNodePayload {
  name: string;
  endpoint: string;
}
