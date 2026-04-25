import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { storage } from '../lib/storage';

interface AuthState {
  user: any | null;
  token: string | null;
  walletAddress: string | null;
  setUser: (user: any) => void;
  setToken: (token: string) => Promise<void>;
  setWalletAddress: (address: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  walletAddress: null,
  setUser: (user) => set({ user }),
  setToken: async (token) => {
    await SecureStore.setItemAsync('jwt_token', token);
    set({ token });
  },
  setWalletAddress: async (address) => {
    await storage.set('wallet_address', address);
    set({ walletAddress: address });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    set({ user: null, token: null });
  },
  init: async () => {
    const token = await SecureStore.getItemAsync('jwt_token');
    const walletAddress = await storage.get('wallet_address');
    set({ token, walletAddress });
  }
}));
