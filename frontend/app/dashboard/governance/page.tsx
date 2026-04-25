'use client';
import { useEffect, useState } from 'react';
import { governanceApi } from '@/lib/api';
import Link from 'next/link';

const STATUS_FILTERS = ['All', 'ACTIVE', 'PASSED', 'REJECTED'];

export default function GovernancePage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [votingPower, setVotingPower] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      governanceApi.proposals(
        activeFilter !== 'All' ? { status: activeFilter } : {}
      ),
      governanceApi.votingPower(),
    ]).then(([proposalsRes, powerRes]) => {
      if (proposalsRes.success) {
        setProposals((proposalsRes.data as any)?.proposals || []);
      }
      if (powerRes.success) setVotingPower(powerRes.data);
      setLoading(false);
    });
  }, [activeFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center 
                      justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Governance
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Vote on platform proposals with your staked AGNT
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-lg px-4 py-2 text-sm">
            <span className="text-zinc-400">Voting Power: </span>
            <span className="text-white font-bold">
              {(votingPower?.effectivePower || 0).toFixed(0)} AGNT
            </span>
          </div>

          {votingPower?.canPropose ? (
            <Link href="/dashboard/governance/create"
                  className="bg-purple-600 text-white font-medium 
                             px-4 py-2 rounded-lg hover:bg-purple-500 
                             transition text-sm">
              + New Proposal
            </Link>
          ) : (
            <button
              disabled
              title="Need 100 AGNT staked to create proposals"
              className="bg-zinc-800 text-zinc-500 font-medium 
                         px-4 py-2 rounded-lg text-sm cursor-not-allowed"
            >
              + New Proposal
            </button>
          )}
        </div>
      </div>

      {/* Delegation info */}
      {votingPower?.delegatedTo && (
        <div className="bg-blue-500/10 border border-blue-500/20 
                        rounded-lg px-4 py-3 flex justify-between 
                        items-center">
          <p className="text-blue-400 text-sm">
            You delegated your votes to{' '}
            <strong>{votingPower.delegatedTo.name}</strong>
          </p>
          <button
            onClick={async () => {
              await governanceApi.revokeDelegate();
              const res = await governanceApi.votingPower();
              if (res.success) setVotingPower(res.data);
            }}
            className="text-blue-400 text-xs hover:text-blue-300"
          >
            Revoke
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium 
                        transition ${
              activeFilter === f
                ? 'bg-purple-600 text-white'
                : 'bg-[#111111] border border-[#1E1E1E] text-zinc-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} 
                 className="bg-[#111111] border border-[#1E1E1E] 
                            rounded-xl h-40" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 bg-[#111111] border 
                        border-[#1E1E1E] rounded-xl">
          <p className="text-zinc-400">No proposals found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p: any) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: any }) {
  const total = proposal.forVotes + proposal.againstVotes + 
                proposal.abstainVotes;
  const forPct = total > 0 
    ? Math.round((proposal.forVotes / total) * 100) 
    : 0;
  const againstPct = total > 0 
    ? Math.round((proposal.againstVotes / total) * 100) 
    : 0;

  const isActive = proposal.status === 'ACTIVE';
  const endDate = new Date(proposal.endDate);
  const daysLeft = Math.max(
    0, 
    Math.ceil((endDate.getTime() - Date.now()) / 86400000)
  );

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400',
    PASSED: 'bg-blue-500/20 text-blue-400',
    REJECTED: 'bg-red-500/20 text-red-400',
    EXECUTED: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <Link href={`/dashboard/governance/${proposal.id}`}>
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6 hover:border-purple-500/20 
                      transition cursor-pointer">
        <div className="flex flex-col md:flex-row md:items-start 
                        justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                statusColors[proposal.status] || 
                'bg-zinc-700 text-zinc-400'
              }`}>
                {proposal.status}
              </span>
              <span className="text-xs bg-zinc-800 text-zinc-400 
                               px-2 py-0.5 rounded-full">
                {proposal.type.replace('_', ' ')}
              </span>
              {proposal.myVote && (
                <span className="text-xs bg-purple-500/20 
                                 text-purple-400 px-2 py-0.5 rounded-full">
                  Voted {proposal.myVote.choice}
                </span>
              )}
            </div>

            <h3 className="text-white font-semibold text-lg mb-1">
              {proposal.title}
            </h3>
            <p className="text-zinc-400 text-sm">
              by {proposal.proposer?.name}
              {isActive && ` · ${daysLeft} days left`}
            </p>
          </div>

          {/* Mini Tally */}
          <div className="md:w-64 flex-shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between text-xs 
                              text-zinc-400 mb-1">
                <span>FOR {forPct}%</span>
                <span>AGAINST {againstPct}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden 
                              flex">
                <div
                  className="bg-green-500 h-full transition-all"
                  style={{ width: `${forPct}%` }}
                />
                <div
                  className="bg-red-500 h-full transition-all"
                  style={{ width: `${againstPct}%` }}
                />
              </div>
              <p className="text-zinc-500 text-xs text-right">
                {total.toLocaleString()} AGNT total votes
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
