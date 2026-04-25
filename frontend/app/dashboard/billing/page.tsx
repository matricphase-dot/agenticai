'use client';
import { useEffect, useState } from 'react';
import { billingApi } from '@/lib/api';

const TOPUP_PRESETS = [10, 50, 100, 500];

export default function BillingPage() {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [topping, setTopping] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      billingApi.balance(),
      billingApi.transactions({ limit: '20' }),
    ]).then(([balRes, txRes]) => {
      if (balRes.success) setBalance(balRes.data);
      if (txRes.success) 
        setTransactions((txRes.data as any)?.transactions || []);
      setLoading(false);
    });
  }, []);

  const handleTopup = async () => {
    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount <= 0) return;

    setTopping(true);
    const res = await billingApi.topup(amount);
    if (res.success) {
      setMsg(`✅ ${amount} credits added!`);
      const updated = await billingApi.balance();
      if (updated.success) setBalance(updated.data);
      const txUpdated = await billingApi.transactions({ limit: '20' });
      if (txUpdated.success)
        setTransactions((txUpdated.data as any)?.transactions || []);
    } else {
      setMsg('❌ Top-up failed');
    }
    setTopping(false);
    setSelectedAmount(null);
    setCustomAmount('');
  };

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl h-40" />
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl h-64" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Billing</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6">
          <p className="text-zinc-400 text-sm mb-1">Credits Balance</p>
          <p className="text-4xl font-bold text-white mb-1">
            ${(balance?.credits || 0).toFixed(2)}
          </p>
          <p className="text-zinc-500 text-xs">
            Available to spend on agent invocations
          </p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6">
          <p className="text-zinc-400 text-sm mb-1">AGNT Tokens</p>
          <p className="text-4xl font-bold text-white mb-1">
            {(balance?.tokenBalance || 0).toFixed(0)}
          </p>
          <p className="text-zinc-500 text-xs">
            {(balance?.lockedTokens || 0).toFixed(0)} locked in staking
          </p>
        </div>
      </div>

      {/* Top Up */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4">
          Top Up Credits
        </h2>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {TOPUP_PRESETS.map(amt => (
            <button
              key={amt}
              onClick={() => {
                setSelectedAmount(amt);
                setCustomAmount('');
              }}
              className={`py-3 rounded-lg font-medium text-sm 
                          transition ${
                selectedAmount === amt
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Or enter custom amount"
          value={customAmount}
          onChange={e => {
            setCustomAmount(e.target.value);
            setSelectedAmount(null);
          }}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                     text-white rounded-lg px-4 py-3 mb-4
                     focus:outline-none focus:border-purple-500/50 
                     transition"
        />

        {msg && (
          <p className="text-sm mb-3 text-green-400">{msg}</p>
        )}

        <button
          onClick={handleTopup}
          disabled={topping || (!selectedAmount && !customAmount)}
          className="w-full bg-purple-600 text-white font-bold 
                     py-3 rounded-lg hover:bg-purple-500 transition 
                     disabled:opacity-50"
        >
          {topping 
            ? 'Processing...' 
            : `Add ${selectedAmount || customAmount || 0} Credits`
          }
        </button>
        <p className="text-zinc-500 text-xs text-center mt-2">
          Mock payment — no real charges in development mode
        </p>
      </div>

      {/* Transaction History */}
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4">
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-0">
            {transactions.map((tx: any) => {
              const isPositive = tx.amount > 0;
              const typeColors: Record<string, string> = {
                TOPUP: 'bg-green-500/20 text-green-400',
                INVOCATION_CHARGE: 'bg-red-500/20 text-red-400',
                AGENT_EARNING: 'bg-blue-500/20 text-blue-400',
                REWARD_CLAIM: 'bg-purple-500/20 text-purple-400',
                STAKE: 'bg-yellow-500/20 text-yellow-400',
                NODE_REWARD: 'bg-cyan-500/20 text-cyan-400',
              };

              return (
                <div key={tx.id}
                     className="flex justify-between items-center 
                                py-4 border-b border-[#1E1E1E] 
                                last:border-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        typeColors[tx.type] || 
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">
                      {tx.description}
                    </p>
                    <p className="text-zinc-600 text-xs">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`font-bold ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}
                    {tx.amount.toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
