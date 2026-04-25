'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { agentsApi } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  latencyMs?: number;
  tokensUsed?: number;
  error?: boolean;
}

export default function SandboxPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    agentsApi.get(id).then(res => {
      if (res.success) setAgent(res.data);
    });
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setSending(true);

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    const res = await agentsApi.chat(id, userMsg);

    if (res.success && (res.data as any)?.output) {
      const data = res.data as any;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.output,
        latencyMs: data.latencyMs,
        tokensUsed: data.tokensUsed,
      }]);
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: (res as any).message || 'Error calling agent. Check your LLM API keys.',
        error: true,
      }]);
    }

    setSending(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <a href={`/dashboard/agents/${id}`}
             className="text-zinc-400 hover:text-white text-sm">
            ← {agent?.name || 'Agent'}
          </a>
          <span className="text-zinc-600">|</span>
          <h1 className="text-white font-semibold">Sandbox</h1>
        </div>
        <button onClick={() => setMessages([])}
          className="text-zinc-400 hover:text-white text-xs border 
                     border-zinc-700 px-3 py-1.5 rounded-lg transition">
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 
                      bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-white font-medium mb-1">
                {agent?.name || 'Agent'} Sandbox
              </p>
              <p className="text-zinc-400 text-sm">
                Send a message to test your agent
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : msg.error
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-zinc-800 text-zinc-100'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
                {msg.role === 'assistant' && msg.latencyMs && (
                  <p className="text-zinc-500 text-xs mt-2">
                    {msg.latencyMs}ms · {msg.tokensUsed} tokens
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i}
                    className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 bg-[#111111] border border-[#1E1E1E] 
                     text-white rounded-xl px-4 py-3
                     focus:outline-none focus:border-purple-500/50 
                     disabled:opacity-50 transition"
        />
        <button onClick={handleSend} disabled={sending || !input.trim()}
          className="bg-purple-600 text-white font-medium px-6 py-3 
                     rounded-xl hover:bg-purple-500 transition 
                     disabled:opacity-50">
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
