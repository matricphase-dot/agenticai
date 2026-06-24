'use client';
import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';

const REASON_LABELS: Record<string, string> = {
  HARMFUL_OUTPUT: 'Harmful Output',
  ILLEGAL_CONTENT: 'Illegal Content',
  DECEPTIVE_PRACTICE: 'Deceptive Practice',
  PRIVACY_VIOLATION: 'Privacy Violation',
  MISINFORMATION: 'Misinformation',
  SPAM: 'Spam',
  OTHER: 'Other',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  const load = () => {
    setLoading(true);
    reportsApi.list(filter === 'all' ? undefined : filter).then(res => {
      if (res.success) setReports((res.data as any) || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [filter]);

  const handleResolve = async (id: string, status: string) => {
    const notes = status === 'RESOLVED_UNPUBLISHED' || status === 'RESOLVED_WARNING_ISSUED'
      ? prompt('Admin notes (sent to creator):') || ''
      : '';
    await reportsApi.resolve(id, status, notes);
    load();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Agent Reports</h1>

      <div className="flex gap-2">
        {['PENDING', 'UNDER_REVIEW', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-[#111111] border border-[#1E1E1E] text-zinc-400'
            }`}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-[#111111] border border-[#1E1E1E] rounded-xl text-zinc-400">
          No reports found
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-medium">
                    {r.agent?.name} 
                    <span className="text-zinc-500 text-sm ml-2">
                      ({r.agent?.isPublic ? 'Public' : 'Unpublished'})
                    </span>
                  </p>
                  <p className="text-zinc-400 text-sm">
                    Reported by {r.reporter?.name} · 
                    {REASON_LABELS[r.reason]} · 
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                  {r.status}
                </span>
              </div>
              <p className="text-zinc-300 text-sm bg-zinc-900/50 rounded-lg p-3 mb-3">
                {r.details}
              </p>
              {r.status === 'PENDING' || r.status === 'UNDER_REVIEW' ? (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleResolve(r.id, 'RESOLVED_NO_ACTION')}
                    className="text-xs border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg hover:border-zinc-500">
                    No Action Needed
                  </button>
                  <button onClick={() => handleResolve(r.id, 'RESOLVED_WARNING_ISSUED')}
                    className="text-xs bg-yellow-600/20 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                    Issue Warning
                  </button>
                  <button onClick={() => handleResolve(r.id, 'RESOLVED_UNPUBLISHED')}
                    className="text-xs bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20">
                    Unpublish Agent
                  </button>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs">
                  Resolved · {r.adminNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
