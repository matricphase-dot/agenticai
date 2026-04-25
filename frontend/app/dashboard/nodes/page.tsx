'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { nodesApi } from '@/lib/api';

const STATUS_COLORS = {
  ONLINE: 'bg-green-500/20 text-green-400',
  OFFLINE: 'bg-red-500/20 text-red-400',
  BUSY: 'bg-yellow-500/20 text-yellow-400',
  MAINTENANCE: 'bg-blue-500/20 text-blue-400',
};

const STATUS_DOTS = {
  ONLINE: 'bg-green-400',
  OFFLINE: 'bg-red-400',
  BUSY: 'bg-yellow-400',
  MAINTENANCE: 'bg-blue-400',
};

export default function NodesPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    nodesApi.list().then(res => {
      if (res.success) setNodes((res.data as any) || []);
      setLoading(false);
    });
  }, []);

  const handleDeregister = async (id: string) => {
    if (!confirm('Deregister this node?')) return;
    await nodesApi.deregister(id);
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const filtered = filter === 'all'
    ? nodes
    : nodes.filter(n => n.status === filter);

  const totalEarned = nodes.reduce((s, n) => s + (n.totalEarned || 0), 0);
  const onlineCount = nodes.filter(n => n.status === 'ONLINE').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Compute Nodes
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {onlineCount}/{nodes.length} nodes online
          </p>
        </div>
        <Link href="/dashboard/nodes/register"
          className="bg-purple-600 text-white font-medium px-4 py-2 
                     rounded-lg hover:bg-purple-500 transition text-sm">
          + Register Node
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Online', value: onlineCount, color: 'text-green-400' },
          { label: 'Total Tasks', value: nodes.reduce((s, n) => s + (n.totalTasks || 0), 0).toLocaleString() },
          { label: 'Total Earned', value: `${totalEarned.toFixed(4)} AGNT` },
        ].map(stat => (
          <div key={stat.label}
               className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl p-4">
            <p className={`text-2xl font-bold mb-1 ${stat.color || 'text-white'}`}>
              {stat.value}
            </p>
            <p className="text-zinc-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['all', 'ONLINE', 'BUSY', 'OFFLINE'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium 
                        transition capitalize ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-[#111111] border border-[#1E1E1E] text-zinc-400 hover:text-white'
            }`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-[#1E1E1E] 
                                     rounded-xl h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] border 
                        border-[#1E1E1E] rounded-xl">
          <p className="text-4xl mb-4">🖥️</p>
          <h3 className="text-white font-semibold mb-2">
            No nodes registered
          </h3>
          <p className="text-zinc-400 text-sm mb-6">
            Register your hardware to earn AGNT by running agents
          </p>
          <Link href="/dashboard/nodes/register"
            className="inline-block bg-purple-600 text-white 
                       font-medium px-6 py-2 rounded-lg 
                       hover:bg-purple-500 transition">
            Register Node
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(node => {
            const successRate = node.totalTasks > 0
              ? ((node.successfulTasks / node.totalTasks) * 100).toFixed(1)
              : '0';

            return (
              <div key={node.id}
                   className="bg-[#111111] border border-[#1E1E1E] 
                              rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      STATUS_DOTS[node.status as keyof typeof STATUS_DOTS] 
                      || 'bg-zinc-500'
                    } ${node.status === 'ONLINE' 
                        ? 'animate-pulse' : ''}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">
                          {node.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[node.status as keyof typeof STATUS_COLORS]
                          || 'bg-zinc-700 text-zinc-400'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm">
                        {node.gpuType || 'CPU only'} · 
                        {node.cpuCores} cores · 
                        {node.ramGb}GB RAM
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/nodes/${node.id}`}
                      className="text-xs border border-zinc-700 
                                 text-zinc-300 px-3 py-1.5 rounded-lg 
                                 hover:border-zinc-500 transition">
                      Details
                    </Link>
                    <button onClick={() => handleDeregister(node.id)}
                      className="text-xs text-red-500 hover:text-red-400 
                                 px-3 py-1.5 rounded-lg transition">
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4 
                                pt-4 border-t border-[#1E1E1E]">
                  {[
                    { label: 'Reputation', value: `${node.reputation?.toFixed(0) || 0}/100` },
                    { label: 'Uptime', value: `${node.uptimePercent?.toFixed(1) || 0}%` },
                    { label: 'Success Rate', value: `${successRate}%` },
                    { label: 'Earned', value: `${(node.totalEarned || 0).toFixed(4)} AGNT` },
                  ].map(stat => (
                    <div key={stat.label}>
                      <p className="text-white font-semibold text-sm">
                        {stat.value}
                      </p>
                      <p className="text-zinc-500 text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Reputation bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (node.reputation || 0) >= 70 
                          ? 'bg-green-500'
                          : (node.reputation || 0) >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${node.reputation || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
