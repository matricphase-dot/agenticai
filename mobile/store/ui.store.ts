import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  toasts: any[];
  setLoading: (loading: boolean) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  toasts: [],
  setLoading: (isLoading) => set({ isLoading }),
  addToast: (message, type) => set((state) => ({ 
    toasts: [...state.toasts, { message, type, id: Date.now() }] 
  })),
}));
