'use client';
import { useEffect, useState } from 'react';
import { stakingApi } from '@/lib/api';

export default function StakingPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');
  const [faucetMsg, setFaucetMsg] = useState('');

  useEffect(() => {
    stakingApi.portfolio().then(res => {
      if (res.success) setPortfolio(res.data);
      setLoading(false);
    });
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    const res = await stakingApi.claim();
    if (res.success) {
      setClaimMsg((res as any).message || 'Claimed!');
      // Refresh portfolio
      const updated = await stakingApi.portfolio();
      if (updated.success) setPortfolio(updated.data);
    }
    setClaiming(false);
  };

  const handleFaucet = async () => {
    const res = await stakingApi.faucet();
    setFaucetMsg((res as any).message || (res.success ? 
      '1000 AGNT added!' : 'Already claimed'));
  };

  const handleUnstake = async (stakeId: string) => {
    const res = await stakingApi.unstake(stakeId);
    if (res.success) {
      const updated = await stakingApi.portfolio();
      if (updated.success) setPortfolio(updated.data);
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl h-40" />
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl h-64" />
      </div>
    );
  }

  const claimable = portfolio?.claimableRewards || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Staking</h1>
        <button
          onClick={handleFaucet}
          className="text-sm bg-zinc-800 text-zinc-300 px-4 py-2 
                     rounded-lg hover:bg-zinc-700 transition"
        >
          🚰 Claim Demo Tokens
        </button>
      </div>

      {faucetMsg && (
        <div className="bg-green-500/10 border border-green-500/20 
                        rounded-lg px-4 py-3 text-green-400 text-sm">
          {faucetMsg}
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staked', value: `${(portfolio?.totalStaked || 0).toFixed(0)} AGNT` },
          { label: 'Claimable Rewards', value: `${claimable.toFixed(4)} AGNT`, highlight: claimable > 0 },
          { label: 'Token Balance', value: `${(portfolio?.tokenBalance || 0).toFixed(0)} AGNT` },
          { label: 'Locked', value: `${(portfolio?.lockedTokens || 0).toFixed(0)} AGNT` },
        ].map(item => (
          <div key={item.label}
               className={`bg-[#111111] border rounded-xl p-5 ${
                 item.highlight 
                   ? 'border-purple-500/40' 
                   : 'border-[#1E1E1E]'
               }`}>
            <div className={`text-2xl font-bold mb-1 ${
              item.highlight ? 'text-purple-400' : 'text-white'
            }`}>
              {item.value}
            </div>
            <div className="text-zinc-400 text-sm">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Claim Button */}
      {claimable > 0 && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full md:w-auto bg-purple-600 text-white 
                     font-bold px-8 py-3 rounded-lg hover:bg-purple-500 
                     transition disabled:opacity-50"
        >
          {claiming 
            ? 'Claiming...' 
            : `Claim ${claimable.toFixed(4)} AGNT`
          }
        </button>
      )}
      {claimMsg && (
        <p className="text-green-400 text-sm">{claimMsg}</p>
      )}

      {/* Stakes List */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4">
          Active Stakes
        </h2>

        {(!portfolio?.stakes || portfolio.stakes.length === 0) ? (
          <div className="text-center py-10">
            <p className="text-zinc-400 mb-4">
              No active stakes yet
            </p>
            <a href="/marketplace"
               className="text-purple-400 hover:text-purple-300 text-sm">
              Browse marketplace to stake on agents →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolio.stakes.map((stake: any) => {
              const pendingRewards = stake.rewards?.reduce(
                (sum: number, r: any) => sum + r.amount, 0
              ) || 0;
              const isUnstaking = stake.status === 'UNSTAKING';
              const unlockDate = new Date(stake.lockedUntil);
              const isLocked = unlockDate > new Date();

              return (
                <div key={stake.id}
                     className="flex flex-col md:flex-row md:items-center 
                                justify-between p-4 bg-[#0F0F0F] 
                                border border-[#1E1E1E] rounded-xl gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">
                        {stake.agent?.name || 'Unknown Agent'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isUnstaking 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {stake.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-zinc-400 text-sm">
                      <span>{stake.amount} AGNT staked</span>
                      {isLocked && (
                        <span>
                          Locked until{' '}
                          {unlockDate.toLocaleDateString()}
                        </span>
                      )}
                      {pendingRewards > 0 && (
                        <span className="text-purple-400">
                          +{pendingRewards.toFixed(4)} AGNT pending
                        </span>
                      )}
                    </div>
                  </div>

                  {!isUnstaking && (
                    <button
                      onClick={() => handleUnstake(stake.id)}
                      className="text-sm border border-zinc-700 
                                 text-zinc-300 px-4 py-2 rounded-lg 
                                 hover:border-zinc-500 transition"
                    >
                      Request Unstake
                    </button>
                  )}
                  {isUnstaking && (
                    <span className="text-yellow-400 text-sm">
                      Returns{' '}
                      {unlockDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
