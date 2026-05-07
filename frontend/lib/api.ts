import { auth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://agenticai-backend-xao9.onrender.com';

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
    auth.clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return { success: false, code: 'UNAUTHORIZED' };
  }

  return res.json();
}

// Re-export auth methods for convenience
export { auth };
export const authApi = {
  login: auth.login,
  signup: auth.signup,
  logout: auth.logout,
  me: () => apiRequest('/auth/me'),
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
  review: (id: string, data: any) => apiRequest(`/marketplace/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
};

export const stakingApi = {
  positions: () => apiRequest('/staking/positions'),
  rewards: () => apiRequest('/staking/rewards'),
  stake: (agentId: string, amount: number) => apiRequest('/staking/stake', { method: 'POST', body: JSON.stringify({ agentId, amount }) }),
  unstake: (stakeId: string) => apiRequest('/staking/unstake', { method: 'POST', body: JSON.stringify({ stakeId }) }),
  claim: () => apiRequest('/staking/claim', { method: 'POST' }),
};

export const billingApi = {
  balance: () => apiRequest('/billing/balance'),
  transactions: () => apiRequest('/billing/transactions'),
  topup: (amount: number) => apiRequest('/billing/topup', { method: 'POST', body: JSON.stringify({ amount }) }),
};

export const governanceApi = {
  proposals: (params?: any) => apiRequest(`/governance/proposals?${new URLSearchParams(params || {})}`),
  proposal: (id: string) => apiRequest(`/governance/proposals/${id}`),
  vote: (id: string, choice: string) => apiRequest(`/governance/proposals/${id}/vote`, { method: 'POST', body: JSON.stringify({ choice }) }),
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
  run: (agentId: string, input: any, apiKey: string) =>
    fetch(`${API_URL}/api/invoke/${agentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(input),
    }).then(r => r.json()),
};

export const usersApi = {
  updateMe: (data: any) => apiRequest('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
};

export const notificationsApi = {
  list: () => apiRequest('/notifications'),
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
