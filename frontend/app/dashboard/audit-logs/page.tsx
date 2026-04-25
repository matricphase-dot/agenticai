'use client';
import { useEffect, useState } from 'react';
import { auditApi } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    auditApi.list({ limit: '100' }).then(res => {
      if (res.success) setLogs((res.data as any)?.logs || []);
      setLoading(false);
    });
  }, []);

  const ACTION_COLORS: Record<string, string> = {
    'POST /auth/login': 'text-green-400',
    'POST /auth/signup': 'text-blue-400',
    'DELETE': 'text-red-400',
    'POST': 'text-purple-400',
    'PUT': 'text-yellow-400',
  };

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(ACTION_COLORS)) {
      if (action.includes(key)) return color;
    }
    return 'text-zinc-300';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Complete history of account actions
          </p>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl">
        <div className="p-4 border-b border-[#1E1E1E] flex 
                        justify-between items-center">
          <h2 className="text-white font-semibold">Activity Log</h2>
          {!loading && (
            <span className="text-zinc-500 text-sm">
              {logs.length} records
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-zinc-400">
            No audit logs yet
          </div>
        ) : (
          <div className="divide-y divide-[#1E1E1E]">
            {logs.map((log: any) => (
              <div key={log.id}>
                <div
                  className="flex items-center justify-between p-4 
                             hover:bg-zinc-900/30 transition cursor-pointer"
                  onClick={() => setExpanded(
                    expanded === log.id ? null : log.id
                  )}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-mono font-medium ${
                      getActionColor(log.action)
                    }`}>
                      {log.action}
                    </span>
                    {log.entityType && (
                      <span className="text-xs bg-zinc-800 text-zinc-400 
                                       px-2 py-0.5 rounded">
                        {log.entityType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 
                                  text-zinc-500 text-xs">
                    {log.ipAddress && (
                      <span>{log.ipAddress}</span>
                    )}
                    <span>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <span className="text-zinc-600">
                      {expanded === log.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expanded === log.id && log.metadata && (
                  <div className="px-4 pb-4">
                    <pre className="bg-zinc-900 rounded-lg p-3 
                                    text-zinc-300 text-xs font-mono 
                                    overflow-auto max-h-40">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
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
