'use client';
import { useEffect, useState } from 'react';
import { usersApi, monitoringApi } from '@/lib/api';
import type { DashboardStats } from '@/types/api.types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.stats(),
      monitoringApi.logs({ limit: '5' }),
    ]).then(([statsRes, logsRes]) => {
      if (statsRes.success) setStats(statsRes.data!);
      if (logsRes.success) 
        setRecentLogs((logsRes.data as any)?.logs || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Credits" 
          value={`$${(stats?.credits || 0).toFixed(2)}`}
          icon="💳"
          trend="up"
        />
        <StatCard 
          label="Agents Live" 
          value={stats?.agentCount || 0}
          icon="🤖"
        />
        <StatCard 
          label="Invocations Today" 
          value={stats?.invocationsToday || 0}
          icon="⚡"
          trend="up"
        />
        <StatCard 
          label="AGNT Staked" 
          value={(stats?.totalStaked || 0).toFixed(0)}
          icon="🪙"
        />
      </div>

      {/* Recent Invocations */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-lg">
            Recent Invocations
          </h2>
          <a href="/dashboard/monitoring" 
             className="text-purple-400 text-sm hover:text-purple-300">
            View all →
          </a>
        </div>

        {recentLogs.length === 0 ? (
          <EmptyState 
            icon="⚡"
            title="No invocations yet"
            description="Invoke an agent to see logs here"
            cta={{ label: 'Browse Marketplace', href: '/marketplace' }}
          />
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log: any) => (
              <div key={log.id} 
                   className="flex items-center justify-between 
                              py-3 border-b border-[#1E1E1E] last:border-0">
                <div className="flex items-center gap-3">
                  <StatusBadge status={log.status} />
                  <span className="text-white text-sm font-medium">
                    {log.agent?.name || 'Unknown Agent'}
                  </span>
                </div>
                <div className="flex items-center gap-4 
                                text-zinc-400 text-xs">
                  <span>{log.latencyMs}ms</span>
                  <span>${(log.cost || 0).toFixed(4)}</span>
                  <span>{timeAgo(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Create Agent', href: '/dashboard/agents/create', icon: '🤖' },
          { label: 'Top Up Credits', href: '/dashboard/billing', icon: '💳' },
          { label: 'Stake Tokens', href: '/dashboard/staking', icon: '🪙' },
          { label: 'View Proposals', href: '/dashboard/governance', icon: '🗳️' },
        ].map(action => (
          <a key={action.href} href={action.href}
             className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-4 flex flex-col items-center 
                        gap-2 hover:border-purple-500/30 transition 
                        group cursor-pointer">
            <span className="text-2xl">{action.icon}</span>
            <span className="text-white text-sm font-medium 
                             group-hover:text-purple-400 transition">
              {action.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// Helper components defined in same file or imported:
function StatCard({ label, value, icon, trend }: any) {
  return (
    <div className="bg-[#111111] border border-[#1E1E1E] 
                    rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-green-400 text-xs">↑</span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-zinc-400 text-sm">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SUCCESS: 'bg-green-500/20 text-green-400',
    FAILED: 'bg-red-500/20 text-red-400',
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    RUNNING: 'bg-blue-500/20 text-blue-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-zinc-700 text-zinc-400'}`}>
      {status}
    </span>
  );
}

function EmptyState({ icon, title, description, cta }: any) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-zinc-400 text-sm mb-4">{description}</p>
      {cta && (
        <a href={cta.href}
           className="inline-block bg-purple-600 text-white text-sm 
                      font-medium px-4 py-2 rounded-lg hover:bg-purple-500 
                      transition">
          {cta.label}
        </a>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111111] border border-[#1E1E1E] 
                                   rounded-xl p-5 h-28" />
        ))}
      </div>
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6 h-64" />
    </div>
  );
}

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
