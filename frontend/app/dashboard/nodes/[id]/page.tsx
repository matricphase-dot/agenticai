'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { nodesApi } from '@/lib/api';

export default function NodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [node, setNode] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      nodesApi.get(id),
      nodesApi.tasks(id),
    ]).then(([nodeRes, tasksRes]) => {
      if (nodeRes.success) setNode(nodeRes.data);
      if (tasksRes.success) setTasks((tasksRes.data as any) || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl h-48" />
    </div>
  );

  if (!node) return (
    <div className="p-6 text-center text-zinc-400">
      Node not found
    </div>
  );

  const successRate = node.totalTasks > 0
    ? ((node.successfulTasks / node.totalTasks) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href="/dashboard/nodes"
           className="text-zinc-400 hover:text-white text-sm">
          ← Nodes
        </a>
        <h1 className="text-2xl font-bold text-white">{node.name}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${
          node.status === 'ONLINE'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {node.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Reputation', value: `${(node.reputation || 0).toFixed(0)}/100` },
          { label: 'Uptime', value: `${(node.uptimePercent || 0).toFixed(1)}%` },
          { label: 'Success Rate', value: `${successRate}%` },
          { label: 'Total Earned', value: `${(node.totalEarned || 0).toFixed(4)} AGNT` },
          { label: 'Total Tasks', value: node.totalTasks || 0 },
          { label: 'Successful', value: node.successfulTasks || 0 },
          { label: 'Failed', value: node.failedTasks || 0 },
          { label: 'Price/Task', value: `${node.pricePerTask} AGNT` },
        ].map(stat => (
          <div key={stat.label}
               className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl p-4">
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-zinc-400 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Reputation bar */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-medium">Reputation Score</h3>
          <span className="text-2xl font-bold text-white">
            {(node.reputation || 0).toFixed(0)}
          </span>
        </div>
        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              (node.reputation || 0) >= 70 ? 'bg-green-500'
              : (node.reputation || 0) >= 40 ? 'bg-yellow-500'
              : 'bg-red-500'
            }`}
            style={{ width: `${node.reputation || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>0 — Poor</span>
          <span>50 — Average</span>
          <span>100 — Excellent</span>
        </div>
      </div>

      {/* Hardware specs */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
        <h3 className="text-white font-medium mb-4">Hardware</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'GPU', value: node.gpuType || 'CPU only' },
            { label: 'CPU Cores', value: node.cpuCores },
            { label: 'RAM', value: `${node.ramGb}GB` },
            { label: 'Storage', value: `${node.storageGb}GB` },
          ].map(item => (
            <div key={item.label}>
              <p className="text-zinc-400 text-xs mb-1">{item.label}</p>
              <p className="text-white font-medium">{item.value}</p>
            </div>
          ))}
        </div>
        {node.supportedModels?.length > 0 && (
          <div className="mt-4">
            <p className="text-zinc-400 text-xs mb-2">Supported Models</p>
            <div className="flex flex-wrap gap-2">
              {node.supportedModels.map((m: string) => (
                <span key={m}
                  className="text-xs bg-zinc-800 text-zinc-300 
                             px-2 py-1 rounded-lg">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task history */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl">
        <div className="p-4 border-b border-[#1E1E1E]">
          <h3 className="text-white font-medium">Task History</h3>
        </div>
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            No tasks yet
          </div>
        ) : (
          <div className="divide-y divide-[#1E1E1E]">
            {tasks.slice(0, 20).map((task: any) => (
              <div key={task.id}
                   className="flex justify-between items-center p-4">
                <div>
                  <p className="text-white text-sm">{task.agentId}</p>
                  <p className="text-zinc-400 text-xs">
                    {new Date(task.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    task.status === 'COMPLETED'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {task.status}
                  </span>
                  <span className="text-zinc-400">
                    {task.reward} AGNT
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
