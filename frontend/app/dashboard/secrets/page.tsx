'use client';
import { useEffect, useState } from 'react';
import { secretsApi } from '@/lib/api';

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchSecrets = async () => {
    const res = await secretsApi.list();
    if (res.success) setSecrets(res.data as any[] || []);
    setLoading(false);
  };

  useEffect(() => { fetchSecrets(); }, []);

  const handleCreate = async () => {
    setError('');
    if (!name || !value) return;

    setSaving(true);
    const res = await secretsApi.create(name, value);
    if (res.success) {
      setMsg('Secret stored securely');
      setName(''); setValue(''); setShowForm(false);
      await fetchSecrets();
    } else {
      setError((res as any).message || 'Failed to store secret');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this secret? This cannot be undone.')) return;
    await secretsApi.delete(id);
    await fetchSecrets();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Secrets</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Encrypted environment variables for your agents
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white font-medium px-4 py-2 
                     rounded-lg hover:bg-purple-500 transition text-sm"
        >
          + Add Secret
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 
                      rounded-xl px-5 py-4">
        <p className="text-blue-400 text-sm">
          🔒 Secrets are encrypted with AES-256-GCM. Values are 
          <strong> never exposed</strong> after creation. Use them 
          in agent system prompts as{' '}
          <code className="bg-blue-500/20 px-1 rounded">
            {'{{secret.YOUR_KEY}}'}
          </code>
        </p>
      </div>

      {/* Add Secret Form */}
      {showForm && (
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">New Secret</h2>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div>
            <label className="text-zinc-400 text-sm block mb-1">
              Name (UPPER_SNAKE_CASE)
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value.toUpperCase())}
              placeholder="OPENAI_API_KEY"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                         text-white font-mono rounded-lg px-4 py-3 
                         focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">
              Value
            </label>
            <input
              type="password"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                         text-white rounded-lg px-4 py-3
                         focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving || !name || !value}
              className="bg-purple-600 text-white font-medium px-6 py-2 
                         rounded-lg hover:bg-purple-500 transition 
                         disabled:opacity-50 text-sm"
            >
              {saving ? 'Storing...' : 'Store Secret'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-zinc-700 text-zinc-300 px-6 py-2 
                         rounded-lg hover:border-zinc-500 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className="text-green-400 text-sm">✅ {msg}</p>
      )}

      {/* Secrets List */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl divide-y divide-[#1E1E1E]">
        {loading ? (
          <div className="p-6 animate-pulse">
            <div className="h-10 bg-zinc-800 rounded" />
          </div>
        ) : secrets.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-zinc-400 text-sm">
              No secrets yet. Add your first secret above.
            </p>
          </div>
        ) : (
          secrets.map((s: any) => (
            <div key={s.id}
                 className="flex items-center justify-between p-4">
              <div>
                <p className="text-white font-mono font-medium text-sm">
                  {s.name}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Added {new Date(s.createdAt).toLocaleDateString()}
                  {s.bindings?.length > 0 && 
                    ` · Bound to ${s.bindings.length} agent(s)`
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-600 font-mono text-sm">
                  ••••••••
                </span>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-red-500 hover:text-red-400 text-xs 
                             transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
