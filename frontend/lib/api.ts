import type {
  User, Agent, AgentAnalytics, Stake, Proposal,
  Balance, Pagination, ApiKey, Notification, DashboardStats,
  StakingPortfolio, MarketplaceResponse, AgentDetail, InvocationResult,
  ProposalsResponse, ProposalDetail, VotingPower, PlatformStats, Secret,
  CreateAgentPayload, CreateProposalPayload, RegisterNodePayload
} from '../types/api.types';

import { API_URL } from './config';

const BASE_URL = API_URL;

// Base fetch with auto-refresh on 401
let isRefreshing = false;

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<{ success: boolean; data?: T; error?: string; code?: string; message?: string }> {
  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401 && retry && !isRefreshing) {
    isRefreshing = true;
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    isRefreshing = false;

    if (refreshRes.ok) {
      return apiFetch<T>(endpoint, options, false);
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }

  // Handle errors
  if (!response.ok) {
    try {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'Request failed',
        code: errorData.code,
        message: errorData.message 
      };
    } catch {
      return { success: false, error: `Error ${response.status}` };
    }
  }

  return response.json();
}

// ── AUTH ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (name: string, email: string, password: string) =>
    apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch<User>('/auth/me'),
};

// ── USERS ─────────────────────────────────────────────────────
export const usersApi = {
  stats: () => apiFetch<DashboardStats>('/users/stats'),
  updateMe: (data: Partial<User>) =>
    apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── AGENTS ───────────────────────────────────────────────────
export const agentsApi = {
  list: (params?: Record<string, string>) =>
    apiFetch<{ agents: Agent[]; pagination: Pagination }>(
      '/agents?' + new URLSearchParams(params || {})
    ),
  get: (id: string) => apiFetch<Agent>(`/agents/${id}`),
  create: (data: CreateAgentPayload) =>
    apiFetch('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Agent>) =>
    apiFetch(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/agents/${id}`, { method: 'DELETE' }),
  publish: (id: string) =>
    apiFetch(`/agents/${id}/publish`, { method: 'POST' }),
  analytics: (id: string) =>
    apiFetch<AgentAnalytics>(`/agents/${id}/analytics`),
  chat: (id: string, message: string) =>
    apiFetch(`/agents/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  versions: (id: string) =>
    apiFetch(`/agents/${id}/versions`),
  createVersion: (id: string, data: any) =>
    apiFetch(`/agents/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── MARKETPLACE ──────────────────────────────────────────────
export const marketplaceApi = {
  list: (params?: Record<string, string>) =>
    apiFetch<MarketplaceResponse>(
      '/marketplace?' + new URLSearchParams(params || {})
    ),
  get: (id: string) =>
    apiFetch<AgentDetail>(`/marketplace/${id}`),
  review: (id: string, rating: number, comment?: string) =>
    apiFetch(`/marketplace/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
  purchase: (id: string) =>
    apiFetch(`/marketplace/${id}/purchase`, { method: 'POST' }),
};

// ── INVOKE ───────────────────────────────────────────────────
export const invokeApi = {
  run: (agentId: string, input: Record<string, unknown>, apiKey: string) =>
    apiFetch<InvocationResult>(`/invoke/${agentId}`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: JSON.stringify(input),
    }),
  logs: (agentId: string, params?: Record<string, string>) =>
    apiFetch(`/invoke/${agentId}/logs?` + new URLSearchParams(params || {})),
};

// ── STAKING ──────────────────────────────────────────────────
export const stakingApi = {
  portfolio: () => apiFetch<StakingPortfolio>('/staking/portfolio'),
  positions: () => apiFetch<Stake[]>('/staking/positions'),
  rewards: (params?: Record<string, string>) =>
    apiFetch('/staking/rewards?' + new URLSearchParams(params || {})),
  stake: (agentId: string, amount: number) =>
    apiFetch('/staking/stake', {
      method: 'POST',
      body: JSON.stringify({ agentId, amount }),
    }),
  unstake: (stakeId: string) =>
    apiFetch('/staking/unstake', {
      method: 'POST',
      body: JSON.stringify({ stakeId }),
    }),
  claim: () => apiFetch('/staking/claim', { method: 'POST' }),
  faucet: () => apiFetch('/staking/faucet', { method: 'POST' }),
  agentStats: (agentId: string) =>
    apiFetch(`/staking/agent/${agentId}`),
  tokenBalance: () => apiFetch('/staking/token-balance'),
};

// ── BILLING ──────────────────────────────────────────────────
export const billingApi = {
  balance: () => apiFetch<Balance>('/billing/balance'),
  topup: (amount: number) =>
    apiFetch('/billing/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  transactions: (params?: Record<string, string>) =>
    apiFetch('/billing/transactions?' + new URLSearchParams(params || {})),
  
  // Razorpay
  createRazorpayOrder: (amountINR: number) =>
    apiFetch<any>('/billing/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amountINR }),
    }),
  verifyRazorpayPayment: (data: any) =>
    apiFetch<any>('/billing/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PayPal
  createPaypalOrder: (amountUSD: number) =>
    apiFetch<any>('/billing/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify({ amountUSD }),
    }),
  capturePaypalOrder: (orderId: string) =>
    apiFetch<any>('/billing/paypal/capture', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),

  // Faucet
  claimFaucet: () => apiFetch<any>('/staking/faucet', { method: 'POST' }),
};

// ── GOVERNANCE ───────────────────────────────────────────────
export const governanceApi = {
  proposals: (params?: Record<string, string>) =>
    apiFetch<ProposalsResponse>(
      '/governance/proposals?' + new URLSearchParams(params || {})
    ),
  proposal: (id: string) =>
    apiFetch<ProposalDetail>(`/governance/proposals/${id}`),
  create: (data: CreateProposalPayload) =>
    apiFetch('/governance/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  vote: (id: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN') =>
    apiFetch(`/governance/proposals/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ choice }),
    }),
  delegate: (toUserId: string) =>
    apiFetch('/governance/delegate', {
      method: 'POST',
      body: JSON.stringify({ toUserId }),
    }),
  revokeDelegate: () =>
    apiFetch('/governance/delegate', { method: 'DELETE' }),
  votingPower: () =>
    apiFetch<VotingPower>('/governance/voting-power'),
};

// ── NODES ────────────────────────────────────────────────────
export const nodesApi = {
  list: (params?: Record<string, string>) =>
    apiFetch('/nodes?' + new URLSearchParams(params || {})),
  get: (id: string) => apiFetch(`/nodes/${id}`),
  register: (data: RegisterNodePayload) =>
    apiFetch('/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deregister: (id: string) =>
    apiFetch(`/nodes/${id}`, { method: 'DELETE' }),
  tasks: (id: string) => apiFetch(`/nodes/${id}/tasks`),
};

// ── KEYS ─────────────────────────────────────────────────────
export const keysApi = {
  list: () => apiFetch<ApiKey[]>('/keys'),
  create: (name: string) =>
    apiFetch('/keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  revoke: (id: string) =>
    apiFetch(`/keys/${id}`, { method: 'DELETE' }),
};

// ── SECRETS ──────────────────────────────────────────────────
export const secretsApi = {
  list: () => apiFetch<Secret[]>('/secrets'),
  create: (name: string, value: string) =>
    apiFetch('/secrets', {
      method: 'POST',
      body: JSON.stringify({ name, value }),
    }),
  delete: (id: string) =>
    apiFetch(`/secrets/${id}`, { method: 'DELETE' }),
};

// ── MONITORING ───────────────────────────────────────────────
export const monitoringApi = {
  logs: (params?: Record<string, string>) =>
    apiFetch('/monitoring/logs?' + new URLSearchParams(params || {})),
  metrics: (agentId: string) =>
    apiFetch(`/monitoring/metrics/${agentId}`),
  alerts: () => apiFetch('/monitoring/alerts'),
  createAlert: (data: any) =>
    apiFetch('/monitoring/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAlert: (id: string) =>
    apiFetch(`/monitoring/alerts/${id}`, { method: 'DELETE' }),
};

// ── NOTIFICATIONS ────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: Record<string, string>) =>
    apiFetch('/notifications?' + new URLSearchParams(params || {})),
  markRead: (id: string) =>
    apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    apiFetch('/notifications/read-all', { method: 'PUT' }),
};

// ── AUDIT ────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: Record<string, string>) =>
    apiFetch('/audit?' + new URLSearchParams(params || {})),
};

// ── PUBLIC STATS ─────────────────────────────────────────────
export const platformApi = {
  stats: () => apiFetch<PlatformStats>('/stats'),
};

// ── TEAMS ──────────────────────────────────────────────────
export const teamsApi = {
  list: () => apiFetch('/teams'),
  get: (id: string) => apiFetch(`/teams/${id}`),
  create: (data: any) => apiFetch('/teams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/teams/${id}`, { method: 'DELETE' }),
  invite: (id: string, data: any) => apiFetch(`/teams/${id}/invite`, { method: 'POST', body: JSON.stringify(data) }),
  changeRole: (teamId: string, memberId: string, role: string) => apiFetch(`/teams/${teamId}/members/${memberId}`, { method: 'PUT', body: JSON.stringify({ role }) }),
  removeMember: (teamId: string, memberId: string) => apiFetch(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),
  agents: (id: string) => apiFetch(`/teams/${id}/agents`),
};

// ── STORAGE ──────────────────────────────────────────────────
export const storageApi = {
  get: (agentId: string, key: string) => apiFetch(`/storage/${agentId}/${key}`),
  set: (agentId: string, key: string, value: string) => apiFetch(`/storage/${agentId}/${key}`, { method: 'POST', body: JSON.stringify({ value }) }),
  delete: (agentId: string, key: string) => apiFetch(`/storage/${agentId}/${key}`, { method: 'DELETE' }),
};

// ── WALLET ──────────────────────────────────────────────────
export const walletApi = {
  getOnChainBalance: async (address: string) => {
    return { success: true, data: { balance: 0, staked: 0 } };
  }
};

// ── BACKWARD COMPATIBILITY ───────────────────────────────────
export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) => apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any) => apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};
