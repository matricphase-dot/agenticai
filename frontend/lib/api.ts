import { auth } from './auth';
import { API_URL } from './config';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = auth.getToken();

  const res = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const data = await res.json().catch(() => ({ success: false, code: 'UNAUTHORIZED' }));
    // Only clear session and redirect if specifically a JWT/Session auth failure inside a protected /dashboard route
    if (data && (data.code === 'NO_TOKEN' || data.code === 'INVALID_TOKEN' || data.code === 'UNAUTHORIZED')) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
        auth.clearSession();
        window.location.href = '/auth/login';
      }
    }
    return data;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  } else {
    return { 
      success: false, 
      message: `Server returned an unexpected ${res.status} error` 
    };
  }
}

// Re-export auth methods for convenience
export { auth };
export const authApi = {
  login: auth.login,
  verify2FA: auth.verify2FA,
  signup: auth.signup,
  logout: auth.logout,
  me: () => apiRequest('/auth/me'),
  updateProfile: (data: any) => apiRequest('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
};

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) => apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any) => apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export const agentsApi = {
  list: (params?: any) => apiRequest(`/agents?${new URLSearchParams(params || {})}`),
  get: (id: string) => apiRequest(`/agents/${id}`),
  create: (data: any) => apiRequest('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/agents/${id}`, { method: 'DELETE' }),
  publish: (id: string) => apiRequest(`/agents/${id}/publish`, { method: 'POST' }),
  analytics: (id: string) => apiRequest(`/agents/${id}/analytics`),
  versions: (id: string) => apiRequest(`/agents/${id}/versions`),
  chat: (id: string, message: string) => apiRequest(`/agents/${id}/chat`, { method: 'POST', body: JSON.stringify({ message }) }),
};

export const marketplaceApi = {
  list: (params?: any) => apiRequest(`/marketplace?${new URLSearchParams(params || {})}`),
  get: (id: string) => apiRequest(`/marketplace/${id}`),
  review: (id: string, rating: number, comment: string) => 
    apiRequest(`/marketplace/${id}/review`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
};

export const stakingApi = {
  positions: () => apiRequest('/staking/positions'),
  rewards: () => apiRequest('/staking/rewards'),
  stake: (agentId: string, amount: number) => apiRequest('/staking/stake', { method: 'POST', body: JSON.stringify({ agentId, amount }) }),
  unstake: (stakeId: string) => apiRequest('/staking/unstake', { method: 'POST', body: JSON.stringify({ stakeId }) }),
  claim: () => apiRequest('/staking/claim', { method: 'POST' }),
  portfolio: () => apiRequest('/staking/portfolio'),
  faucet: () => apiRequest('/staking/faucet', { method: 'POST' }),
};

export const billingApi = {
  balance: () => apiRequest('/billing/balance'),
  transactions: (params?: any) => apiRequest(`/billing/transactions?${new URLSearchParams(params || {})}`),
  topup: (amount: number) => apiRequest('/billing/topup', { method: 'POST', body: JSON.stringify({ amount }) }),
  createRazorpayOrder: (amount: number, currency: string = 'INR') => apiRequest('/billing/razorpay/create-order', { method: 'POST', body: JSON.stringify({ amount, currency }) }),
  verifyRazorpayPayment: (data: any) => apiRequest('/billing/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),
  createPaypalOrder: (amount: number) => apiRequest('/billing/paypal/create-order', { method: 'POST', body: JSON.stringify({ amountUSD: amount }) }),
  capturePaypalOrder: (orderId: string) => apiRequest(`/billing/paypal/capture`, { method: 'POST', body: JSON.stringify({ orderId }) }),
  claimFaucet: () => apiRequest('/staking/faucet', { method: 'POST' }),
  getConfig: () => apiRequest('/billing/config'),
  payouts: () => apiRequest('/billing/payout'),
  requestPayout: (data: any) => apiRequest('/billing/payout', { method: 'POST', body: JSON.stringify(data) }),
};

export const governanceApi = {
  proposals: (params?: any) => apiRequest(`/governance/proposals?${new URLSearchParams(params || {})}`),
  proposal: (id: string) => apiRequest(`/governance/proposals/${id}`),
  vote: (id: string, choice: string) => apiRequest(`/governance/proposals/${id}/vote`, { method: 'POST', body: JSON.stringify({ choice }) }),
  votingPower: () => apiRequest('/governance/voting-power'),
  revokeDelegate: () => apiRequest('/governance/delegate/revoke', { method: 'POST' }),
};

export const nodesApi = {
  list: () => apiRequest('/nodes'),
  get: (id: string) => apiRequest(`/nodes/${id}`),
  register: (data: any) => apiRequest('/nodes', { method: 'POST', body: JSON.stringify(data) }),
  deregister: (id: string) => apiRequest(`/nodes/${id}`, { method: 'DELETE' }),
  tasks: (id: string) => apiRequest(`/nodes/${id}/tasks`),
};

export const monitoringApi = {
  logs: (params?: any) => apiRequest(`/monitoring/logs?${new URLSearchParams(params || {})}`),
  metrics: (agentId: string) => apiRequest(`/monitoring/metrics/${agentId}`),
  alerts: () => apiRequest('/monitoring/alerts'),
};

export const keysApi = {
  list: () => apiRequest('/keys'),
  create: (name: string) => apiRequest('/keys', { method: 'POST', body: JSON.stringify({ name }) }),
  revoke: (id: string) => apiRequest(`/keys/${id}`, { method: 'DELETE' }),
};

export const auditApi = {
  list: (params?: any) => apiRequest(`/audit?${new URLSearchParams(params || {})}`),
};

export const invokeApi = {
  run: (agentId: string, input: any, apiKey?: string) =>
    apiRequest(`/invoke/${agentId}`, {
      method: 'POST',
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
      body: JSON.stringify(input),
    }),
};

export const usersApi = {
  me: () => apiRequest('/users/me'),
  updateMe: (data: any) => apiRequest('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  stats: () => apiRequest('/users/stats'),
};

export const notificationsApi = {
  list: (params?: any) => apiRequest(`/notifications?${new URLSearchParams(params || {})}`),
  markRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
};

export const webhooksApi = {
  list: () => apiRequest('/webhooks'),
  create: (data: any) => apiRequest('/webhooks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/webhooks/${id}`, { method: 'DELETE' }),
};

export const teamsApi = {
  list: () => apiRequest('/teams'),
  get: (id: string) => apiRequest(`/teams/${id}`),
  create: (data: any) => apiRequest('/teams', { method: 'POST', body: JSON.stringify(data) }),
  invite: (id: string, data: any) => apiRequest(`/teams/${id}/invite`, { method: 'POST', body: JSON.stringify(data) }),
};

export const secretsApi = {
  list: () => apiRequest('/secrets'),
  create: (name: string, value: string) => apiRequest('/secrets', { method: 'POST', body: JSON.stringify({ name, value }) }),
  delete: (name: string) => apiRequest(`/secrets/${name}`, { method: 'DELETE' }),
};

export const ragApi = {
  listKbs: (agentId: string) => apiRequest(`/agents/${agentId}/knowledge-bases`),
  createKb: (agentId: string, data: any) => apiRequest(`/agents/${agentId}/knowledge-bases`, {
    method: 'POST', body: JSON.stringify(data)
  }),
  deleteKb: (id: string) => apiRequest(`/knowledge-bases/${id}`, { method: 'DELETE' }),
  search: (id: string, query: string) => apiRequest(`/knowledge-bases/${id}/search`, {
    method: 'POST', body: JSON.stringify({ query })
  }),
};

export const schedulesApi = {
  list: (agentId: string) => apiRequest(`/agents/${agentId}/schedules`),
  create: (agentId: string, data: any) => apiRequest(`/agents/${agentId}/schedules`, {
    method: 'POST', body: JSON.stringify(data)
  }),
  toggle: (id: string) => apiRequest(`/schedules/${id}/toggle`, { method: 'PUT' }),
  runNow: (id: string) => apiRequest(`/schedules/${id}/run-now`, { method: 'POST' }),
  delete: (id: string) => apiRequest(`/schedules/${id}`, { method: 'DELETE' }),
};

export const pipelinesApi = {
  list: () => apiRequest('/pipelines'),
  create: (data: any) => apiRequest('/pipelines', {
    method: 'POST', body: JSON.stringify(data)
  }),
  run: (id: string, input: string) => apiRequest(`/pipelines/${id}/run`, {
    method: 'POST', body: JSON.stringify({ input })
  }),
  delete: (id: string) => apiRequest(`/pipelines/${id}`, { method: 'DELETE' }),
};

export const reportsApi = {
  create: (agentId: string, reason: string, details: string) =>
    apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify({ agentId, reason, details }),
    }),
  list: (status?: string) =>
    apiRequest(`/reports${status && status !== 'all' ? `?status=${status}` : ''}`),
  resolve: (id: string, status: string, adminNotes?: string) =>
    apiRequest(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    }),
};
