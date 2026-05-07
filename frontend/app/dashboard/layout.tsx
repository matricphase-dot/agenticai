'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

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

    // Verify token with backend
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'https://agenticai-backend-xao9.onrender.com'}/api/auth/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        // Update stored user data
        auth.setSession(token, data.data);
        setAuthorized(true);
      } else {
        auth.clearSession();
        router.replace('/auth/login');
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

  if (!authorized) return null;

  return <>{children}</>;
}
