'use client';
import { useEffect, useState } from 'react';
import { agentsApi, monitoringApi } from '@/lib/api';

export default function MonitoringPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    agentsApi.list().then(res => {
      if (res.success) setAgents((res.data as any)?.agents || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '50' };
    if (selectedAgent !== 'all') params.agentId = selectedAgent;
    if (statusFilter !== 'all') params.status = statusFilter;

    Promise.all([
      monitoringApi.logs(params),
      selectedAgent !== 'all'
        ? monitoringApi.metrics(selectedAgent)
        : Promise.resolve({ success: false, data: null as any }),
    ]).then(([logsRes, metricsRes]) => {
      if (logsRes.success) setLogs((logsRes.data as any)?.logs || []);
      if (metricsRes.success) setMetrics((metricsRes.data as any));
      setLoading(false);
    });
  }, [selectedAgent, statusFilter]);

  const STATUS_COLORS: Record<string, string> = {
    SUCCESS: 'bg-green-500/20 text-green-400',
    FAILED: 'bg-red-500/20 text-red-400',
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    RUNNING: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Monitoring</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedAgent}
          onChange={e => setSelectedAgent(e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] text-white 
                     rounded-lg px-4 py-2 text-sm
                     focus:outline-none focus:border-purple-500/50">
          <option value="all">All Agents</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
          {['all', 'SUCCESS', 'FAILED', 'RUNNING'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium 
                          transition ${
                statusFilter === s
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics (when agent selected) */}
      {metrics && selectedAgent !== 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: metrics.analytics?.totalInvocations || 0 },
            { label: 'Success Rate', value: `${((metrics.analytics?.successCount / Math.max(metrics.analytics?.totalInvocations, 1)) * 100).toFixed(1)}%` },
            { label: 'Avg Latency', value: `${metrics.analytics?.avgLatencyMs || 0}ms` },
            { label: 'Earnings', value: `$${(metrics.analytics?.totalEarnings || 0).toFixed(4)}` },
          ].map(stat => (
            <div key={stat.label}
                 className="bg-[#111111] border border-[#1E1E1E] 
                            rounded-xl p-4">
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-zinc-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl">
        <div className="p-4 border-b border-[#1E1E1E]">
          <h2 className="text-white font-semibold">
            Invocation Logs
            {!loading && (
              <span className="text-zinc-500 text-sm font-normal ml-2">
                ({logs.length} records)
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-zinc-400">No invocations found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E1E1E]">
            {logs.map((log: any) => (
              <div key={log.id}>
                <div
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 
                             hover:bg-zinc-900/30 transition cursor-pointer gap-2"
                  onClick={() => setExpandedLog(
                    expandedLog === log.id ? null : log.id
                  )}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      STATUS_COLORS[log.status] || 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-white text-sm font-medium">
                      {log.agent?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap
                                  text-zinc-400 text-[10px]">
                    {log.latencyMs && (
                      <span>{log.latencyMs}ms</span>
                    )}
                    {log.tokensUsed && (
                      <span>{log.tokensUsed} tokens</span>
                    )}
                    <span>${(log.cost || 0).toFixed(6)}</span>
                    <span>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-zinc-600">
                      {expandedLog === log.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expandedLog === log.id && (
                  <div className="px-4 pb-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Input</p>
                      <pre className="bg-zinc-900 rounded-lg p-3 
                                      text-zinc-300 text-xs font-mono 
                                      overflow-auto max-h-40">
                        {JSON.stringify(log.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Output</p>
                      <pre className="bg-zinc-900 rounded-lg p-3 
                                      text-zinc-300 text-xs font-mono 
                                      overflow-auto max-h-40">
                        {log.errorMessage || JSON.stringify(log.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
