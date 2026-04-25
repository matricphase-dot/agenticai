'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { agentsApi } from '@/lib/api';
import type { Agent, AgentAnalytics } from '@/types/api.types';

const TABS = ['Overview', 'Analytics', 'Versions', 'Sandbox', 'Settings'];

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [analytics, setAnalytics] = useState<AgentAnalytics | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    Promise.all([
      agentsApi.get(id),
      agentsApi.analytics(id),
      agentsApi.versions(id),
    ]).then(([agentRes, analyticsRes, versionsRes]) => {
      if (agentRes.success) setAgent(agentRes.data as Agent);
      if (analyticsRes.success) setAnalytics(analyticsRes.data as AgentAnalytics);
      if (versionsRes.success) setVersions((versionsRes.data as any) || []);
      setLoading(false);
    });
  }, [id]);

  const handleSaveField = async (field: string, value: any) => {
    if (!agent) return;
    setSaving(true);
    const res = await agentsApi.update(id, { [field]: value });
    if (res.success) {
      setAgent(prev => prev ? { ...prev, [field]: value } : null);
    }
    setSaving(false);
    setEditField(null);
  };

  const handlePublish = async () => {
    await agentsApi.publish(id);
    setAgent(prev => prev ? { ...prev, status: 'PUBLISHED' } : null);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this agent permanently?')) return;
    await agentsApi.delete(id);
    router.push('/dashboard/agents');
  };

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl h-32" />
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl h-64" />
    </div>
  );

  if (!agent) return (
    <div className="p-6 text-center text-zinc-400">
      Agent not found
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/agents" 
                  className="text-zinc-400 hover:text-white text-sm">
              ← Agents
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
          <p className="text-zinc-400 text-sm mt-1">{agent.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            agent.status === 'PUBLISHED'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {agent.status}
          </span>
          {agent.status === 'DRAFT' && (
            <button onClick={handlePublish}
              className="bg-purple-600 text-white text-sm font-medium 
                         px-4 py-2 rounded-lg hover:bg-purple-500 transition">
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1E1E1E] overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap
                        border-b-2 transition -mb-px ${
              tab === t
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'Overview' && (
        <div className="space-y-4">
          {[
            { label: 'Name', field: 'name', value: agent.name, type: 'text' },
            { label: 'Description', field: 'description', value: agent.description, type: 'textarea' },
            { label: 'System Prompt', field: 'systemPrompt', value: agent.systemPrompt, type: 'textarea' },
          ].map(item => (
            <div key={item.field} 
                 className="bg-[#111111] border border-[#1E1E1E] 
                            rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-zinc-400 text-sm font-medium">
                  {item.label}
                </label>
                <button
                  onClick={() => {
                    setEditField(item.field);
                    setEditValue(item.value);
                  }}
                  className="text-purple-400 text-xs hover:text-purple-300">
                  Edit
                </button>
              </div>
              {editField === item.field ? (
                <div className="space-y-2">
                  {item.type === 'textarea' ? (
                    <textarea value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={4}
                      className="w-full bg-[#1A1A1A] border border-purple-500/30 
                                 text-white rounded-lg px-3 py-2 resize-none 
                                 text-sm font-mono focus:outline-none"/>
                  ) : (
                    <input value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-purple-500/30 
                                 text-white rounded-lg px-3 py-2 text-sm
                                 focus:outline-none"/>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField(item.field, editValue)}
                      disabled={saving}
                      className="bg-purple-600 text-white text-xs px-4 py-1.5 
                                 rounded-lg hover:bg-purple-500 transition">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditField(null)}
                      className="border border-zinc-700 text-zinc-300 text-xs 
                                 px-4 py-1.5 rounded-lg hover:border-zinc-500">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-white text-sm ${
                  item.type === 'textarea' 
                    ? 'font-mono whitespace-pre-wrap line-clamp-4' 
                    : ''
                }`}>
                  {item.value}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Analytics */}
      {tab === 'Analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Invocations', value: analytics?.totalInvocations || 0 },
              { label: 'Success Rate', value: analytics ? `${((analytics.successCount / Math.max(analytics.totalInvocations, 1)) * 100).toFixed(1)}%` : '0%' },
              { label: 'Avg Latency', value: `${analytics?.avgLatencyMs || 0}ms` },
              { label: 'Total Earnings', value: `$${(analytics?.totalEarnings || 0).toFixed(4)}` },
              { label: 'Stakers', value: analytics?.stakerCount || 0 },
              { label: 'Total Staked', value: `${(analytics?.totalStaked || 0).toFixed(0)} AGNT` },
              { label: 'Avg Rating', value: `${(analytics?.avgRating || 0).toFixed(1)} ⭐` },
              { label: 'Reviews', value: analytics?.reviewCount || 0 },
            ].map(stat => (
              <div key={stat.label}
                   className="bg-[#111111] border border-[#1E1E1E] 
                              rounded-xl p-4">
                <p className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-zinc-400 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Versions */}
      {tab === 'Versions' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-zinc-400 text-sm">
              Current: v{agent.currentVersion}
            </p>
          </div>
          {versions.length === 0 ? (
            <div className="text-center py-10 bg-[#111111] border 
                            border-[#1E1E1E] rounded-xl">
              <p className="text-zinc-400">No version history yet</p>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#1E1E1E] 
                            rounded-xl divide-y divide-[#1E1E1E]">
              {versions.map((v: any) => (
                <div key={v.id}
                     className="flex justify-between items-center p-4">
                  <div>
                    <p className="text-white font-medium">
                      v{v.version}
                      {v.version === agent.currentVersion && (
                        <span className="ml-2 text-xs bg-purple-500/20 
                                         text-purple-400 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                    {v.changelog && (
                      <p className="text-zinc-500 text-xs mt-1">
                        {v.changelog}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Sandbox — link to sandbox page */}
      {tab === 'Sandbox' && (
        <div className="text-center py-10">
          <p className="text-zinc-400 mb-4">
            Test your agent in the interactive sandbox
          </p>
          <Link href={`/dashboard/agents/${id}/sandbox`}
            className="bg-purple-600 text-white font-medium px-6 py-3 
                       rounded-lg hover:bg-purple-500 transition">
            Open Sandbox
          </Link>
        </div>
      )}

      {/* Tab: Settings */}
      {tab === 'Settings' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Agent Endpoint</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-900 text-zinc-300 text-sm 
                               px-4 py-3 rounded-lg font-mono">
                POST {process.env.NEXT_PUBLIC_API_URL}/api/invoke/{id}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/invoke/${id}`
                )}
                className="text-purple-400 text-sm hover:text-purple-300 
                           px-3 py-3 border border-zinc-700 rounded-lg">
                Copy
              </button>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 
                          rounded-xl p-6">
            <h3 className="text-red-400 font-medium mb-2">
              Danger Zone
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Permanently delete this agent and all its data.
            </p>
            <button onClick={handleDelete}
              className="bg-red-600 text-white text-sm font-medium 
                         px-4 py-2 rounded-lg hover:bg-red-500 transition">
              Delete Agent
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
