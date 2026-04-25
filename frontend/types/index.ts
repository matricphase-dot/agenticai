export enum Role {
  USER = "USER",
  ADMIN = "ADMIN"
}

export enum AgentCategory {
  CHATBOT = "CHATBOT",
  DATA_ANALYST = "DATA_ANALYST",
  CODE_ASSISTANT = "CODE_ASSISTANT",
  IMAGE_GENERATOR = "IMAGE_GENERATOR",
  RESEARCH = "RESEARCH",
  AUTOMATION = "AUTOMATION",
  CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT",
  FINANCE = "FINANCE",
  LEGAL = "LEGAL",
  OTHER = "OTHER"
}

export enum PricingModel {
  FREE = "FREE",
  PER_INVOCATION = "PER_INVOCATION",
  PER_TOKEN = "PER_TOKEN"
}

export enum AgentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  DEPRECATED = "DEPRECATED"
}

export enum ProposalStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PASSED = "PASSED",
  REJECTED = "REJECTED",
  EXECUTED = "EXECUTED",
  CANCELLED = "CANCELLED"
}

export enum ProposalType {
  FEE_CHANGE = "FEE_CHANGE",
  TREASURY = "TREASURY",
  FEATURE = "FEATURE",
  SLASH = "SLASH",
  OTHER = "OTHER"
}

export enum VoteChoice {
  FOR = "FOR",
  AGAINST = "AGAINST",
  ABSTAIN = "ABSTAIN"
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: Role;
  emailVerified: boolean;
  walletAddress?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  user?: Partial<User>;
  name: string;
  slug: string;
  description: string;
  category: AgentCategory;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  inputSchema: any;
  outputSchema: any;
  pricingModel: PricingModel;
  pricePerCall: number;
  pricePerToken: number;
  cpuRequired: number;
  ramRequired: number;
  gpuRequired: boolean;
  isPublic: boolean;
  status: AgentStatus;
  currentVersion: string;
  tags: string[];
  readme?: string;
  analytics?: AgentAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAnalytics {
  id: string;
  agentId: string;
  totalInvocations: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  totalEarnings: number;
  totalTokensUsed: number;
  stakerCount: number;
  totalStaked: number;
  avgRating: number;
  reviewCount: number;
}

export interface Balance {
  id: string;
  userId: string;
  credits: number;
  tokenBalance: number;
  lockedTokens: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  metadata?: any;
  txHash?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
