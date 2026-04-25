'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { governanceApi } from '@/lib/api';

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchProposal = async () => {
    const res = await governanceApi.proposal(id);
    if (res.success) setProposal(res.data);
    setLoading(false);
  };

  useEffect(() => { if (id) fetchProposal(); }, [id]);

  const handleVote = async (choice: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    setVoting(choice);
    setError('');
    const res = await governanceApi.vote(id, choice);
    if (res.success) {
      await fetchProposal(); // Refresh
    } else {
      setError((res as any).message || 'Vote failed');
    }
    setVoting(null);
  };

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl h-64" />
    </div>
  );

  if (!proposal) return (
    <div className="p-6 text-center text-zinc-400">
      Proposal not found
    </div>
  );

  const total = (proposal.forVotes || 0) + (proposal.againstVotes || 0) + 
                (proposal.abstainVotes || 0);
  const forPct = total > 0 
    ? ((proposal.forVotes / total) * 100).toFixed(1) 
    : '0';
  const againstPct = total > 0 
    ? ((proposal.againstVotes / total) * 100).toFixed(1) 
    : '0';
  const abstainPct = total > 0 
    ? ((proposal.abstainVotes / total) * 100).toFixed(1) 
    : '0';

  const isActive = proposal.status === 'ACTIVE' 
    && new Date(proposal.endDate) > new Date();
  const hasVoted = !!proposal.myVote;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <a href="/dashboard/governance" 
         className="text-zinc-400 hover:text-white text-sm flex 
                    items-center gap-1">
        ← Back to Governance
      </a>

      {/* Header */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            proposal.status === 'ACTIVE' 
              ? 'bg-green-500/20 text-green-400'
              : proposal.status === 'PASSED'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {proposal.status}
          </span>
          <span className="text-xs bg-zinc-800 text-zinc-400 
                           px-2 py-1 rounded-full">
            {proposal.type?.replace('_', ' ')}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {proposal.title}
        </h1>
        <p className="text-zinc-400 text-sm">
          Proposed by <strong className="text-white">
            {proposal.proposer?.name}
          </strong>
          {' · '}
          {new Date(proposal.startDate).toLocaleDateString()} 
          {' → '}
          {new Date(proposal.endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Vote Tally */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Vote Results</h2>

        <div className="space-y-4">
          {[
            { label: 'FOR', pct: forPct, 
              votes: proposal.forVotes || 0, color: 'bg-green-500' },
            { label: 'AGAINST', pct: againstPct, 
              votes: proposal.againstVotes || 0, color: 'bg-red-500' },
            { label: 'ABSTAIN', pct: abstainPct, 
              votes: proposal.abstainVotes || 0, color: 'bg-zinc-500' },
          ].map(bar => (
            <div key={bar.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400 font-medium">
                  {bar.label}
                </span>
                <span className="text-white">
                  {bar.pct}% 
                  <span className="text-zinc-500 ml-1">
                    ({bar.votes.toLocaleString()} AGNT)
                  </span>
                </span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`${bar.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#1E1E1E] 
                        flex justify-between text-sm text-zinc-400">
          <span>Total: {total.toLocaleString()} AGNT</span>
          <span>
            Quorum: {proposal.quorumReached ? '✅ Reached' : '❌ Not reached'}
          </span>
        </div>
      </div>

      {/* Vote Buttons */}
      {isActive && !hasVoted && (
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Cast Your Vote</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 
                            rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            {(['FOR', 'AGAINST', 'ABSTAIN'] as const).map(choice => (
              <button
                key={choice}
                onClick={() => handleVote(choice)}
                disabled={!!voting}
                className={`py-3 rounded-lg font-medium text-sm 
                            transition disabled:opacity-50 ${
                  choice === 'FOR'
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : choice === 'AGAINST'
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-zinc-700 text-white hover:bg-zinc-600'
                }`}
              >
                {voting === choice ? '...' : choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasVoted && (
        <div className="bg-purple-500/10 border border-purple-500/20 
                        rounded-xl px-6 py-4">
          <p className="text-purple-400">
            ✓ You voted <strong>{proposal.myVote.choice}</strong>{' '}
            with {proposal.myVote.weight.toLocaleString()} AGNT
          </p>
        </div>
      )}

      {/* Description */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Description</h2>
        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {proposal.description}
        </div>
      </div>

      {/* Recent Voters */}
      {(proposal.votes?.length || 0) > 0 && (
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">
            Recent Voters
          </h2>
          <div className="space-y-3">
            {proposal.votes.slice(0, 10).map((vote: any) => (
              <div key={vote.id}
                   className="flex justify-between items-center 
                              py-2 border-b border-[#1E1E1E] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-700 
                                  flex items-center justify-center 
                                  text-white text-xs font-bold">
                    {vote.user?.name?.[0] || '?'}
                  </div>
                  <span className="text-white text-sm">
                    {vote.user?.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    vote.choice === 'FOR' 
                      ? 'bg-green-500/20 text-green-400'
                      : vote.choice === 'AGAINST'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {vote.choice}
                  </span>
                  <span className="text-zinc-400 text-xs">
                    {(vote.weight || 0).toLocaleString()} AGNT
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
