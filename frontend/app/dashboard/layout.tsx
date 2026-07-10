'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { authApi } from '@/lib/api';

export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = auth.getToken();
    
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    // Ensure onboarded is marked so user stays cleanly in dashboard
    if (!localStorage.getItem('onboarded')) {
      localStorage.setItem('onboarded', 'true');
    }

    // Verify token with backend via central client (handles normalized API_URL properly)
    authApi.me()
      .then(data => {
        if (data && data.success) {
          auth.setSession(token, data.data);
          setAuthorized(true);
        } else if (data && data.code === 'UNAUTHORIZED') {
          auth.clearSession();
          router.replace('/auth/login');
        } else {
          // If backend had a temporary network glitch or restart, preserve active session safely
          setAuthorized(true);
        }
      })
      .catch(() => {
        // Network error - assume still logged in if token exists
        setAuthorized(true);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center 
                      justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-500 
                          border-t-transparent rounded-full animate-spin 
                          mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    auth.logout();
    router.replace('/auth/login');
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="border-b border-[#1E1E1E] bg-[#111111] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/dashboard" className="text-xl font-black text-white tracking-tighter">
              Agentic<span className="text-purple-500 italic">AI</span>
            </a>
            <div className="hidden md:flex gap-6 text-sm text-zinc-400">
              <a href="/dashboard" className="hover:text-white transition">Dashboard</a>
              <a href="/dashboard/pipelines" className="hover:text-white transition">Pipelines</a>
              <a href="/dashboard/billing" className="hover:text-white transition">Billing</a>
              <a href="/marketplace" className="hover:text-white transition">Marketplace</a>
              <a href="/docs" className="hover:text-white transition">Docs</a>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-red-400 hover:text-red-300 transition px-4 py-2 bg-red-400/10 hover:bg-red-400/20 rounded-lg"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
