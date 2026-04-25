'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nodesApi } from '@/lib/api';

const SUPPORTED_MODELS = [
  'gpt-4o', 'gpt-4o-mini', 'claude-3-opus', 'claude-3-haiku',
  'gemini-pro', 'llama-3-70b', 'mistral-7b',
];

const GPU_TYPES = [
  'NVIDIA A100 80GB', 'NVIDIA A100 40GB', 'NVIDIA H100',
  'NVIDIA RTX 4090', 'NVIDIA RTX 3090', 'NVIDIA V100',
  'AMD MI300X', 'None (CPU only)',
];

export default function RegisterNodePage() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    endpoint: '',
    description: '',
    gpuType: '',
    cpuCores: 8,
    ramGb: 32,
    storageGb: 500,
    pricePerTask: 0.005,
    selectedModels: [] as string[],
  });

  const set = (k: string, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const toggleModel = (m: string) => {
    set('selectedModels',
      form.selectedModels.includes(m)
        ? form.selectedModels.filter(x => x !== m)
        : [...form.selectedModels, m]
    );
  };

  const handleRegister = async () => {
    if (!form.name || !form.endpoint) {
      setError('Name and endpoint are required');
      return;
    }

    setRegistering(true);
    setError('');

    const res = await nodesApi.register({
      name: form.name,
      endpoint: form.endpoint,
      description: form.description,
      gpuType: form.gpuType === 'None (CPU only)' ? '' : form.gpuType,
      cpuCores: form.cpuCores,
      ramGb: form.ramGb,
      storageGb: form.storageGb,
      pricePerTask: form.pricePerTask,
      supportedModels: form.selectedModels,
    } as any);

    if (res.success) {
      const data = res.data as any;
      setApiKey(data.nodeApiKey || data.apiKey || '');
    } else {
      setError((res as any).message || 'Registration failed');
    }
    setRegistering(false);
  };

  // Show API key screen after successful registration
  if (apiKey) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-2xl font-bold text-white mb-2">
            Node Registered!
          </h1>
          <p className="text-zinc-400">
            Save your node API key — it won't be shown again.
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 
                        rounded-xl p-6">
          <p className="text-yellow-400 text-sm font-semibold mb-3">
            ⚠️ Save this API key now
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-900 text-zinc-200 text-sm 
                             font-mono px-4 py-3 rounded-lg break-all">
              {apiKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(apiKey)}
              className="flex-shrink-0 bg-zinc-700 text-white text-xs 
                         px-3 py-3 rounded-lg hover:bg-zinc-600 transition">
              Copy
            </button>
          </div>
          <p className="text-zinc-500 text-xs mt-3">
            Your node uses this key to authenticate heartbeat pings 
            via PUT /api/nodes/heartbeat
          </p>
        </div>

        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6 space-y-3">
          <h3 className="text-white font-medium">Quick start</h3>
          <pre className="bg-zinc-900 rounded-lg p-3 text-zinc-300 
                          text-xs font-mono overflow-x-auto">
{`# Send heartbeat every 60 seconds
curl -X PUT ${process.env.NEXT_PUBLIC_API_URL}/api/nodes/heartbeat \\
  -H "X-Node-Key: ${apiKey}"`}
          </pre>
        </div>

        <button onClick={() => router.push('/dashboard/nodes')}
          className="w-full bg-purple-600 text-white font-bold py-3 
                     rounded-lg hover:bg-purple-500 transition">
          Go to My Nodes
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/nodes"
           className="text-zinc-400 hover:text-white text-sm">
          ← Nodes
        </a>
        <h1 className="text-2xl font-bold text-white mt-2">
          Register Compute Node
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Share your hardware and earn AGNT for running agents
        </p>
      </div>

      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6 space-y-5">

        {/* Basic Info */}
        <div>
          <label className="text-zinc-400 text-sm block mb-1">
            Node Name *
          </label>
          <input value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Alpha-GPU-01"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                       text-white rounded-lg px-4 py-3
                       focus:outline-none focus:border-purple-500/50"/>
        </div>

        <div>
          <label className="text-zinc-400 text-sm block mb-1">
            Endpoint URL *
          </label>
          <input value={form.endpoint}
            onChange={e => set('endpoint', e.target.value)}
            placeholder="https://my-node.example.com"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                       text-white rounded-lg px-4 py-3
                       focus:outline-none focus:border-purple-500/50"/>
        </div>

        <div>
          <label className="text-zinc-400 text-sm block mb-1">
            Description
          </label>
          <input value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="High performance GPU node..."
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                       text-white rounded-lg px-4 py-3
                       focus:outline-none focus:border-purple-500/50"/>
        </div>

        {/* Hardware */}
        <div>
          <label className="text-zinc-400 text-sm block mb-2">
            GPU Type
          </label>
          <select value={form.gpuType}
            onChange={e => set('gpuType', e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                       text-white rounded-lg px-4 py-3
                       focus:outline-none focus:border-purple-500/50">
            <option value="">Select GPU...</option>
            {GPU_TYPES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'CPU Cores', key: 'cpuCores', min: 1, max: 256 },
            { label: 'RAM (GB)', key: 'ramGb', min: 4, max: 2048 },
            { label: 'Storage (GB)', key: 'storageGb', min: 50, max: 100000 },
          ].map(item => (
            <div key={item.key}>
              <label className="text-zinc-400 text-sm block mb-1">
                {item.label}
              </label>
              <input type="number"
                min={item.min} max={item.max}
                value={form[item.key as keyof typeof form] as number}
                onChange={e => set(item.key, Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                           text-white rounded-lg px-4 py-3
                           focus:outline-none focus:border-purple-500/50"/>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div>
          <label className="text-zinc-400 text-sm block mb-1">
            Price per Task (AGNT)
          </label>
          <input type="number" step="0.001" min="0"
            value={form.pricePerTask}
            onChange={e => set('pricePerTask', Number(e.target.value))}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                       text-white rounded-lg px-4 py-3
                       focus:outline-none focus:border-purple-500/50"/>
        </div>

        {/* Supported Models */}
        <div>
          <label className="text-zinc-400 text-sm block mb-2">
            Supported Models
          </label>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_MODELS.map(m => (
              <button key={m}
                onClick={() => toggleModel(m)}
                className={`px-3 py-1.5 rounded-lg text-xs 
                            font-medium transition ${
                  form.selectedModels.includes(m)
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button onClick={handleRegister} disabled={registering}
          className="w-full bg-purple-600 text-white font-bold py-3 
                     rounded-lg hover:bg-purple-500 transition 
                     disabled:opacity-50">
          {registering ? 'Registering...' : 'Register Node'}
        </button>
      </div>
    </div>
  );
}
