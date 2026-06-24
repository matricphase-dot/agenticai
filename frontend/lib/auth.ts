const TOKEN_KEY = 'agenticai_token';
const USER_KEY = 'agenticai_user';
const API = process.env.NEXT_PUBLIC_API_URL || 
  'https://agenticai-backend-xao9.onrender.com';

export const auth = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },

  setSession: (token: string, user: any) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isLoggedIn: (): boolean => {
    return Boolean(auth.getToken());
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      auth.setSession(data.data.token, data.data.user);
    }
    return data;
  },

  verify2FA: async (email: string | null, code: string, partialToken: string | null) => {
    const res = await fetch(`${API}/api/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, partialToken }),
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      auth.setSession(data.data.token, data.data.user);
    }
    return data;
  },

  signup: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  logout: async () => {
    auth.clearSession();
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST' });
    } catch {}
  },

  fetchWithAuth: async (endpoint: string, options: RequestInit = {}) => {
    const token = auth.getToken();
    const res = await fetch(`${API}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      auth.clearSession();
      window.location.href = '/auth/login';
      return null;
    }

    return res.json();
  },
};
