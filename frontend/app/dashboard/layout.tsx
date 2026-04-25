'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authApi, usersApi } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⬛' },
  { label: 'Agents', href: '/dashboard/agents', icon: '🤖' },
  { label: 'Marketplace', href: '/marketplace', icon: '🛒' },
  { label: 'Invoke', href: '/dashboard/invoke', icon: '⚡' },
  { label: 'Nodes', href: '/dashboard/nodes', icon: '🖥️' },
  { label: 'Staking', href: '/dashboard/staking', icon: '🪙' },
  { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
  { label: 'Governance', href: '/dashboard/governance', icon: '🗳️' },
  { label: 'Secrets', href: '/dashboard/secrets', icon: '🔒' },
  { label: 'Monitoring', href: '/dashboard/monitoring', icon: '📊' },
  { label: 'Webhooks', href: '/dashboard/webhooks', icon: '🔗' },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { 
  children: React.ReactNode 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    authApi.me().then(res => {
      if (!res.success) {
        router.push('/auth/login');
      } else {
        setUser(res.data);
        setLoading(false);
      }
    });

    usersApi.stats().then(res => {
      if (res.success && res.data) {
        setCredits((res.data as any).credits);
        setUnread((res.data as any).unreadNotifications || 0);
      }
    });
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center 
                    justify-center">
      <div className="text-zinc-400 animate-pulse">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 
                         bg-[#0D0D0D] border-r border-[#1E1E1E] 
                         flex flex-col transition-transform md:translate-x-0
                         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-[#1E1E1E]">
          <Link href="/" 
                className="text-white font-bold text-xl">
            Agentic<span className="text-purple-500">AI</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg 
                          text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E1E1E]">
          <button
            onClick={handleLogout}
            className="w-full text-left text-zinc-500 hover:text-white 
                       text-sm transition flex items-center gap-2"
          >
            ↗ Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Nav */}
        <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 
                           backdrop-blur-sm border-b border-[#1E1E1E] 
                           h-14 flex items-center px-4 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-zinc-400 hover:text-white"
          >
            ☰
          </button>

          <div className="flex-1" />

          {/* Credits */}
          {credits !== null && (
            <Link href="/dashboard/billing"
                  className="text-sm bg-zinc-800 text-zinc-300 px-3 py-1.5 
                             rounded-lg hover:bg-zinc-700 transition">
              💳 ${credits.toFixed(2)}
            </Link>
          )}

          {/* Notifications */}
          <Link href="/dashboard/notifications"
                className="relative text-zinc-400 hover:text-white 
                           transition p-2">
            🔔
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 
                               bg-purple-600 text-white text-xs rounded-full 
                               flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-700 
                            flex items-center justify-center 
                            text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-white text-sm hidden md:block">
              {user?.name}
            </span>
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
