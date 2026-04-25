'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { agentsApi } from '@/lib/api';
import type { Agent } from '@/types/api.types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    agentsApi.list().then(res => {
      if (res.success) setAgents((res.data as any)?.agents || []);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this agent? This cannot be undone.')) return;
    await agentsApi.delete(id);
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  const handlePublish = async (id: string, current: string) => {
    if (current === 'PUBLISHED') return;
    await agentsApi.publish(id);
    setAgents(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'PUBLISHED' } : a)
    );
  };

  const STATUS_COLORS: Record<string, string> = {
    PUBLISHED: 'bg-green-500/20 text-green-400',
    DRAFT: 'bg-yellow-500/20 text-yellow-400',
    DEPRECATED: 'bg-zinc-700 text-zinc-400',
  };

  const CATEGORY_ICONS: Record<string, string> = {
    DATA_ANALYST: '📊',
    CODE_ASSISTANT: '💻',
    CHATBOT: '💬',
    RESEARCH: '🔍',
    AUTOMATION: '⚙️',
    CUSTOMER_SUPPORT: '🎧',
    FINANCE: '💰',
    LEGAL: '⚖️',
    OTHER: '🤖',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">My Agents</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            {(['list', 'grid'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  view === v
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}>
                {v === 'list' ? '☰' : '⊞'}
              </button>
            ))}
          </div>
          <Link href="/dashboard/agents/create"
            className="bg-purple-600 text-white font-medium px-4 py-2 
                       rounded-lg hover:bg-purple-500 transition text-sm">
            + Create Agent
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-[#1E1E1E] 
                                     rounded-xl h-24" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] border 
                        border-[#1E1E1E] rounded-xl">
          <p className="text-5xl mb-4">🤖</p>
          <h3 className="text-white font-semibold text-lg mb-2">
            No agents yet
          </h3>
          <p className="text-zinc-400 text-sm mb-6">
            Create your first AI agent to get started
          </p>
          <Link href="/dashboard/agents/create"
            className="inline-block bg-purple-600 text-white font-medium 
                       px-6 py-2 rounded-lg hover:bg-purple-500 transition">
            Create Agent
          </Link>
        </div>
      ) : view === 'list' ? (
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl divide-y divide-[#1E1E1E]">
          {agents.map(agent => (
            <div key={agent.id}
                 className="flex items-center justify-between 
                            p-4 hover:bg-zinc-900/50 transition">
              <div className="flex items-center gap-4">
                <span className="text-2xl">
                  {CATEGORY_ICONS[agent.category] || '🤖'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {agent.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      STATUS_COLORS[agent.status]
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-0.5 
                                max-w-md truncate">
                    {agent.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1 
                                  text-zinc-500 text-xs">
                    <span>{agent.modelProvider}/{agent.modelName}</span>
                    <span>v{agent.currentVersion}</span>
                    <span>{agent.pricingModel === 'FREE' 
                      ? 'Free' 
                      : agent.pricingModel === 'PER_INVOCATION'
                      ? `$${agent.pricePerCall}/call`
                      : `$${agent.pricePerToken}/token`
                    }</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/agents/${agent.id}/sandbox`}
                  className="text-xs border border-zinc-700 text-zinc-300 
                             px-3 py-1.5 rounded-lg hover:border-zinc-500 
                             transition">
                  Test
                </Link>
                <Link href={`/dashboard/agents/${agent.id}`}
                  className="text-xs border border-zinc-700 text-zinc-300 
                             px-3 py-1.5 rounded-lg hover:border-zinc-500 
                             transition">
                  Edit
                </Link>
                {agent.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublish(agent.id, agent.status)}
                    className="text-xs bg-purple-600/20 text-purple-400 
                               px-3 py-1.5 rounded-lg hover:bg-purple-600/30 
                               transition border border-purple-500/20">
                    Publish
                  </button>
                )}
                <button
                  onClick={() => handleDelete(agent.id)}
                  className="text-xs text-red-500 hover:text-red-400 
                             px-3 py-1.5 rounded-lg transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 
                        lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
              <div className="bg-[#111111] border border-[#1E1E1E] 
                              rounded-xl p-5 hover:border-purple-500/20 
                              transition cursor-pointer h-full">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-3xl">
                    {CATEGORY_ICONS[agent.category] || '🤖'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    STATUS_COLORS[agent.status]
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">
                  {agent.name}
                </h3>
                <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                  {agent.description}
                </p>
                <div className="flex items-center justify-between 
                                text-zinc-500 text-xs">
                  <span>{agent.modelName}</span>
                  <span>v{agent.currentVersion}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
