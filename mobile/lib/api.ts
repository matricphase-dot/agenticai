import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';
import { router } from 'expo-router';

const client = axios.create({ baseURL: API_URL, timeout: 15000 });

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  response => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
      router.replace('/(auth)/login');
    }
    throw error;
  }
);

export const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post('/api/auth/login', { email, password }),
    signup: (data: any) =>
      client.post('/api/auth/signup', data),
    me: () => client.get('/api/users/me'),
  },
  marketplace: {
    list: (params: any) =>
      client.get('/api/marketplace', { params }),
    get: (id: string) =>
      client.get(`/api/marketplace/${id}`),
    review: (id: string, data: any) =>
      client.post(`/api/marketplace/${id}/review`, data),
  },
  staking: {
    positions: () => client.get('/api/staking/positions'),
    rewards: () => client.get('/api/staking/rewards'),
    stake: (agentId: string, amount: number) =>
      client.post('/api/staking/stake', { agentId, amount }),
    unstake: (stakeId: string) =>
      client.post('/api/staking/unstake', { stakeId }),
    claim: () => client.post('/api/staking/claim'),
  },
  governance: {
    proposals: (params: any) =>
      client.get('/api/governance/proposals', { params }),
    proposal: (id: string) =>
      client.get(`/api/governance/proposals/${id}`),
    vote: (id: string, choice: string) =>
      client.post(`/api/governance/proposals/${id}/vote`, { choice }),
  },
  billing: {
    balance: () => client.get('/api/billing/balance'),
  },
  notifications: {
    list: () => client.get('/api/notifications'),
    markRead: (id: string) =>
      client.put(`/api/notifications/${id}/read`),
    registerPushToken: (token: string, platform: string) =>
      client.post('/api/notifications/push-token', { token, platform }),
  },
  invoke: {
    run: (agentId: string, input: Record<string, unknown>, apiKey: string) =>
      client.post(`/api/invoke/${agentId}`, input, {
        headers: { 'X-API-Key': apiKey }
      }),
  },
};
