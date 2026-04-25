'use client';
import { useEffect, useState } from 'react';
import { agentsApi, keysApi, invokeApi } from '@/lib/api';

export default function InvokePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [inputJson, setInputJson] = useState('{\n  "message": "Hello!"\n}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    Promise.all([
      agentsApi.list({ status: 'PUBLISHED' }),
      keysApi.list(),
    ]).then(([agentsRes, keysRes]) => {
      const agentList = (agentsRes.data as any)?.agents || [];
      setAgents(agentList);
      if (agentList.length > 0) setSelectedAgent(agentList[0].id);

      const keyList = (keysRes.data as any) || [];
      setKeys(keyList);
      if (keyList.length > 0) setSelectedKey(keyList[0].keyPrefix);
    });
  }, []);

  const validateJson = (val: string) => {
    try { JSON.parse(val); setJsonError(''); return true; }
    catch { setJsonError('Invalid JSON'); return false; }
  };

  const handleInvoke = async () => {
    if (!selectedAgent || !selectedKey) {
      setError('Select an agent and API key');
      return;
    }
    if (!validateJson(inputJson)) return;

    setLoading(true);
    setError('');
    setResponse(null);

    const input = JSON.parse(inputJson);
    const res = await invokeApi.run(selectedAgent, input, selectedKey);

    if (res.success) {
      setResponse(res.data);
    } else {
      setError((res as any).message || 'Invocation failed');
    }
    setLoading(false);
  };

  const curlCommand = selectedAgent && selectedKey
    ? `curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/api/invoke/${selectedAgent} \\
  -H "X-API-Key: ${selectedKey}" \\
  -H "Content-Type: application/json" \\
  -d '${inputJson}'`
    : '';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Invoke Playground</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Agent selector */}
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Agent</label>
          <select value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                       text-white rounded-lg px-4 py-3
                       focus:outline-none focus:border-purple-500/50">
            <option value="">Select agent...</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* API Key selector */}
        <div>
          <label className="text-zinc-400 text-sm block mb-1">
            API Key
          </label>
          <div className="flex gap-2">
            <select value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
              className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] 
                         text-white rounded-lg px-4 py-3
                         focus:outline-none focus:border-purple-500/50">
              <option value="">Select key...</option>
              {keys.map(k => (
                <option key={k.id} value={k.keyPrefix}>
                  {k.name} ({k.keyPrefix})
                </option>
              ))}
            </select>
            <a href="/dashboard/settings"
               className="border border-zinc-700 text-zinc-400 px-3 py-3 
                          rounded-lg hover:text-white transition text-sm 
                          flex items-center">
              + New
            </a>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-zinc-400 text-sm">
              Request Body (JSON)
            </label>
            {jsonError && (
              <span className="text-red-400 text-xs">{jsonError}</span>
            )}
          </div>
          <textarea
            value={inputJson}
            onChange={e => {
              setInputJson(e.target.value);
              validateJson(e.target.value);
            }}
            rows={12}
            className={`w-full bg-[#111111] border rounded-xl px-4 py-3 
                        text-white font-mono text-sm resize-none
                        focus:outline-none transition ${
              jsonError 
                ? 'border-red-500/50' 
                : 'border-[#1E1E1E] focus:border-purple-500/50'
            }`}
          />
          <button onClick={handleInvoke}
            disabled={loading || !!jsonError || !selectedAgent || !selectedKey}
            className="w-full mt-3 bg-purple-600 text-white font-bold 
                       py-3 rounded-xl hover:bg-purple-500 transition 
                       disabled:opacity-50">
            {loading ? 'Invoking...' : '⚡ Invoke Agent'}
          </button>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Response */}
        <div>
          <label className="text-zinc-400 text-sm block mb-2">
            Response
          </label>
          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl p-4 min-h-[300px]">
            {!response && !loading && (
              <p className="text-zinc-600 text-sm">
                Response will appear here...
              </p>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-4 h-4 border-2 border-purple-500 
                                border-t-transparent rounded-full 
                                animate-spin" />
                <span className="text-sm">Invoking agent...</span>
              </div>
            )}
            {response && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs bg-green-500/20 text-green-400 
                                   px-2 py-1 rounded-full">
                    {response.status}
                  </span>
                  <span className="text-zinc-400 text-xs">
                    {response.latencyMs}ms
                  </span>
                  <span className="text-zinc-400 text-xs">
                    {response.tokensUsed} tokens
                  </span>
                  <span className="text-zinc-400 text-xs">
                    ${(response.cost || 0).toFixed(6)} cost
                  </span>
                </div>
                <pre className="text-zinc-200 text-sm font-mono 
                                whitespace-pre-wrap break-all 
                                bg-zinc-900/50 rounded-lg p-3">
                  {typeof response.output === 'string'
                    ? response.output
                    : JSON.stringify(response.output, null, 2)
                  }
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* cURL snippet */}
      {curlCommand && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-sm">cURL equivalent</span>
            <button
              onClick={() => navigator.clipboard.writeText(curlCommand)}
              className="text-purple-400 text-xs hover:text-purple-300">
              Copy
            </button>
          </div>
          <pre className="text-zinc-300 text-xs font-mono 
                          whitespace-pre-wrap overflow-x-auto">
            {curlCommand}
          </pre>
        </div>
      )}
    </div>
  );
}
