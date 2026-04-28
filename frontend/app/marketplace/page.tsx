'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketplaceApi } from '@/lib/api';

const CATEGORIES = [
  'All', 'CHATBOT', 'DATA_ANALYST', 'CODE_ASSISTANT',
  'RESEARCH', 'AUTOMATION', 'CUSTOMER_SUPPORT', 'FINANCE',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'invocations', label: 'Most Used' },
  { value: 'staked', label: 'Most Staked' },
];

const CATEGORY_ICONS: Record<string, string> = {
  CHATBOT: '💬', DATA_ANALYST: '📊', CODE_ASSISTANT: '💻',
  RESEARCH: '🔍', AUTOMATION: '⚙️', CUSTOMER_SUPPORT: '🎧',
  FINANCE: '💰', LEGAL: '⚖️', OTHER: '🤖',
};

export default function MarketplacePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchAgents = async () => {
    setLoading(true);
    const params: Record<string, string> = {
      sort, page: String(page), limit: '12'
    };
    if (search) params.search = search;
    if (category !== 'All') params.category = category;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agenticai-backend-xao9.onrender.com';
    try {
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`${API_URL}/api/marketplace?${queryString}`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.data?.agents || []);
        setPagination(data.data?.pagination);
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error('Marketplace fetch failed:', error);
      setAgents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchAgents, 300);
    return () => clearTimeout(timer);
  }, [search, category, sort, page]);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-[#1E1E1E] px-6 py-4 
                      flex items-center justify-between">
        <Link href="/"
          className="text-white font-bold text-xl">
          Agentic<span className="text-purple-500">AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard"
            className="text-zinc-400 hover:text-white text-sm transition">
            Dashboard
          </Link>
          <Link href="/auth/login"
            className="bg-purple-600 text-white text-sm font-medium 
                       px-4 py-2 rounded-lg hover:bg-purple-500 transition">
            Sign In
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Agent Marketplace
          </h1>
          <p className="text-zinc-400">
            Discover and deploy AI agents built by the community
          </p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col md:flex-row gap-4">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search agents..."
            className="flex-1 bg-[#111111] border border-[#1E1E1E] 
                       text-white rounded-xl px-5 py-3
                       focus:outline-none focus:border-purple-500/50"/>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-[#111111] border border-[#1E1E1E] text-white 
                       rounded-xl px-5 py-3 min-w-[160px]
                       focus:outline-none focus:border-purple-500/50">
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm 
                          font-medium transition ${
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#111111] border border-[#1E1E1E] text-zinc-400 hover:text-white'
              }`}>
              {cat === 'All' ? 'All' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 
                          lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i}
                   className="bg-[#111111] border border-[#1E1E1E] 
                              rounded-xl h-56 animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400">No agents found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 
                            lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agents.map(agent => (
                <Link key={agent.id}
                      href={`/marketplace/${agent.id}`}>
                  <div className="bg-[#111111] border border-[#1E1E1E] 
                                  rounded-xl p-5 h-full
                                  hover:border-purple-500/30 transition 
                                  cursor-pointer flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl">
                        {CATEGORY_ICONS[agent.category] || '🤖'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        agent.pricingModel === 'FREE'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {agent.pricingModel === 'FREE' ? 'Free'
                          : agent.pricingModel === 'PER_INVOCATION'
                          ? `$${agent.pricePerCall}/call`
                          : `$${agent.pricePerToken}/token`
                        }
                      </span>
                    </div>

                    <h3 className="text-white font-semibold mb-1">
                      {agent.name}
                    </h3>
                    <p className="text-zinc-400 text-sm line-clamp-2 
                                  flex-1 mb-3">
                      {agent.description}
                    </p>

                    <div className="flex items-center justify-between 
                                    text-zinc-500 text-xs">
                      <span className="flex items-center gap-1">
                        ⭐ {(agent.analytics?.avgRating || 0).toFixed(1)}
                        <span className="text-zinc-600">
                          ({agent.analytics?.reviewCount || 0})
                        </span>
                      </span>
                      <span>
                        {(agent.analytics?.totalInvocations || 0)
                          .toLocaleString()} uses
                      </span>
                    </div>

                    {agent.user && (
                      <div className="flex items-center gap-2 mt-3 
                                      pt-3 border-t border-[#1E1E1E]">
                        <div className="w-5 h-5 rounded-full bg-purple-700 
                                        flex items-center justify-center 
                                        text-white text-xs font-bold">
                          {agent.user.name?.[0]}
                        </div>
                        <span className="text-zinc-500 text-xs">
                          {agent.user.name}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-zinc-700 
                             text-zinc-300 hover:border-zinc-500 transition 
                             disabled:opacity-30 text-sm">
                  Previous
                </button>
                <span className="px-4 py-2 text-zinc-400 text-sm">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => 
                    Math.min(pagination.pages, p + 1)
                  )}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 rounded-lg border border-zinc-700 
                             text-zinc-300 hover:border-zinc-500 transition 
                             disabled:opacity-30 text-sm">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
