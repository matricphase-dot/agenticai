'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { marketplaceApi, stakingApi } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { auth } from '@/lib/auth';

export default function MarketplaceAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState('100');
  const [staking, setStaking] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(auth.isLoggedIn());
    marketplaceApi.get(agentId).then(res => {
      if (res.success) setAgent(res.data);
      else router.push('/marketplace');
      setLoading(false);
    });
  }, [agentId]);

  const handleStake = async () => {
    setStaking(true);
    const res = await stakingApi.stake(agentId, Number(stakeAmount));
    if (res.success) {
      alert(`Successfully staked ${stakeAmount} AGNT!`);
    }
    setStaking(false);
  };

  const handleReview = async () => {
    setReviewing(true);
    await marketplaceApi.review(agentId, rating, comment);
    setShowReviewForm(false);
    const updated = await marketplaceApi.get(agentId);
    if (updated.success) setAgent(updated.data);
    setReviewing(false);
  };

  const copyEndpoint = () => {
    navigator.clipboard.writeText(
      `${API_URL}/api/invoke/${agentId}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 animate-pulse space-y-4">
      <div className="h-48 bg-[#111111] rounded-xl" />
      <div className="h-64 bg-[#111111] rounded-xl" />
    </div>
  );

  if (!agent) return null;

  const analytics = agent.analytics || {};
  const successRate = analytics.totalInvocations > 0
    ? ((analytics.successCount / analytics.totalInvocations) * 100).toFixed(1)
    : '0';

  const curlSnippet = `curl -X POST ${API_URL}/api/invoke/${agentId} \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello!"}'`;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Nav */}
      <div className="border-b border-[#1E1E1E] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl">
          Agentic<span className="text-purple-500">AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="text-zinc-400 hover:text-white text-sm">
            ← Marketplace
          </Link>
          <Link href="/dashboard" className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-500 transition">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT: Main content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hero */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">
                    {({'CHATBOT':'💬','DATA_ANALYST':'📊','CODE_ASSISTANT':'💻',
                      'RESEARCH':'🔍','AUTOMATION':'⚙️','CUSTOMER_SUPPORT':'🎧',
                      'FINANCE':'💰'} as Record<string, string>)[agent.category] || '🤖'}
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        {agent.category?.replace('_', ' ')}
                      </span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${
                  agent.pricingModel === 'FREE'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {agent.pricingModel === 'FREE' ? 'Free'
                    : agent.pricingModel === 'PER_INVOCATION'
                    ? `$${agent.pricePerCall}/call`
                    : `$${agent.pricePerToken}/token`}
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{agent.description}</p>
              {agent.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {agent.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Invocations', value: (analytics.totalInvocations || 0).toLocaleString() },
                { label: 'Success Rate', value: `${successRate}%` },
                { label: 'Avg Latency', value: `${analytics.avgLatencyMs || 0}ms` },
                { label: 'Rating', value: `${(analytics.avgRating || 0).toFixed(1)} ⭐` },
              ].map(s => (
                <div key={s.label} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-zinc-400 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Code snippet */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-medium">API Usage</h3>
                <button onClick={copyEndpoint}
                  className="text-xs text-purple-400 hover:text-purple-300">
                  {copied ? '✅ Copied' : 'Copy endpoint'}
                </button>
              </div>
              <pre className="bg-zinc-900 rounded-lg p-4 text-zinc-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {curlSnippet}
              </pre>
            </div>

            {/* Reviews */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">
                  Reviews ({analytics.reviewCount || 0})
                </h3>
                <button onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-xs border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg hover:border-zinc-500 transition">
                  Write Review
                </button>
              </div>

              {showReviewForm && (
                <div className="bg-zinc-900 rounded-xl p-4 mb-4 space-y-3">
                  <div>
                    <label className="text-zinc-400 text-sm block mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(r => (
                        <button key={r} onClick={() => setRating(r)}
                          className={`text-2xl transition ${r <= rating ? 'opacity-100' : 'opacity-30'}`}>
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={comment} onChange={e => setComment(e.target.value)}
                    rows={3} placeholder="Share your experience..."
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 resize-none text-sm focus:outline-none focus:border-purple-500/50" />
                  <div className="flex gap-2">
                    <button onClick={handleReview} disabled={reviewing}
                      className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-500 transition disabled:opacity-50">
                      {reviewing ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button onClick={() => setShowReviewForm(false)}
                      className="border border-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {agent.reviews?.length === 0 ? (
                <p className="text-zinc-500 text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {(agent.reviews || []).map((review: any) => (
                    <div key={review.id} className="border-b border-[#1E1E1E] pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold">
                            {review.user?.name?.[0] || '?'}
                          </div>
                          <span className="text-white text-sm font-medium">{review.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400 text-sm">{'⭐'.repeat(review.rating)}</span>
                          <span className="text-zinc-500 text-xs">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-zinc-400 text-sm ml-9">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">
            
            {/* Creator */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
              <h3 className="text-zinc-400 text-xs font-medium uppercase mb-3">Creator</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold">
                  {agent.user?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-white font-medium">{agent.user?.name}</p>
                  <p className="text-zinc-400 text-xs">{agent.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Deploy */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
              <h3 className="text-white font-medium mb-3">Deploy this Agent</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Use this agent via API with your own API key.
              </p>
              
              {isLoggedIn ? (
                <>
                  <Link href={`/dashboard/invoke?agentId=${agent.id}`}
                    className="block w-full text-center bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-500 transition">
                    Open in Playground
                  </Link>
                  <Link href="/dashboard/settings"
                    className="block w-full text-center border border-zinc-700 text-zinc-300 py-3 rounded-lg hover:border-zinc-500 transition mt-2 text-sm">
                    Get API Key
                  </Link>
                </>
              ) : (
                <Link href={`/auth/signup?redirect=${encodeURIComponent('/dashboard/invoke?agentId=' + agent.id)}`}
                  className="block w-full text-center bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-500 transition mt-2 text-sm">
                  Sign up to use API
                </Link>
              )}
            </div>

            {/* Stake */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
              <h3 className="text-white font-medium mb-1">Stake AGNT</h3>
              <p className="text-zinc-400 text-xs mb-3">
                Earn 30% of this agent's revenue proportionally
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Total Staked</span>
                  <span className="text-white font-medium">
                    {(analytics.totalStaked || 0).toFixed(0)} AGNT
                  </span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Stakers</span>
                  <span className="text-white">{analytics.stakerCount || 0}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <input type="number" value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                  placeholder="Amount" />
                <span className="text-zinc-400 text-sm flex items-center">AGNT</span>
              </div>
              <button onClick={handleStake} disabled={staking}
                className="w-full mt-3 bg-purple-600/80 text-white font-medium py-2.5 rounded-lg hover:bg-purple-600 transition disabled:opacity-50 text-sm">
                {staking ? 'Staking...' : 'Stake Tokens'}
              </button>
            </div>

            {/* Technical */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
              <h3 className="text-zinc-400 text-xs font-medium uppercase mb-3">Technical</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Provider</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ['openai', 'anthropic'].includes(agent.modelProvider?.toLowerCase()) 
                        ? 'bg-zinc-700 text-zinc-300' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {['openai', 'anthropic'].includes(agent.modelProvider?.toLowerCase()) ? 'PAID' : 'FREE'}
                    </span>
                    <span className="text-white font-medium capitalize">{agent.modelProvider}</span>
                  </div>
                </div>
                {[
                  { label: 'Model', value: agent.modelName },
                  { label: 'Version', value: `v${agent.currentVersion}` },
                  { label: 'GPU Required', value: agent.gpuRequired ? 'Yes' : 'No' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-zinc-400">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
