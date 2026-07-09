'use client';
import { useEffect, useState } from 'react';
import { billingApi, authApi as userApi } from '@/lib/api';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from 'sonner';

const RAZORPAY_PRESETS = [100, 500, 1000, 2000];
const PAYPAL_PRESETS = [5, 10, 25, 50];

export default function BillingPage() {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INR' | 'USD' | 'PAYOUT'>('INR');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [config, setConfig] = useState({ paypalClientId: '', razorpayKeyId: '' });

  const fetchBalance = async () => {
    const [balRes, txRes, userRes, configRes, payoutRes] = await Promise.all([
      billingApi.balance(),
      billingApi.transactions({ limit: '20' }),
      userApi.me(),
      billingApi.getConfig(),
      billingApi.payouts()
    ]);
    if (balRes.success) setBalance(balRes.data);
    if (txRes.success) setTransactions((txRes.data as any)?.transactions || []);
    if (userRes.success) setUser(userRes.data);
    if (configRes.success) setConfig(configRes.data);
    if (payoutRes.success) setPayouts(payoutRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (currency: 'INR' | 'USD' = 'INR') => {
    const amount = selectedAmount || Number(customAmount);
    const minAmount = currency === 'INR' ? 50 : 1;
    if (!amount || amount < minAmount) {
      toast.error(`Minimum amount is ${currency === 'INR' ? '₹50' : '$1'}`);
      return;
    }

    setProcessing(true);
    try {
      const res = await billingApi.createRazorpayOrder(amount, currency);
      if (!res.success) throw new Error(res.message);

      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error('Razorpay SDK failed to load');

      const options = {
        key: config.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: res.data.amount,
        currency: res.data.currency,
        name: 'AgenticAI Platform',
        description: 'Credit Top-up',
        order_id: res.data.orderId,
        handler: async (response: any) => {
          const verifyRes = await billingApi.verifyRazorpayPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            amount: amount,
            currency: currency
          });

          if (verifyRes.success) {
            toast.success('Credits added successfully!');
            fetchBalance();
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#7C3AED',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayoutRequest = async () => {
    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount < 5000) {
      toast.error('Minimum payout amount is 5000 credits ($50)');
      return;
    }
    if (!payoutMethod || !payoutDetails) {
      toast.error('Please provide payout method and details');
      return;
    }

    setProcessing(true);
    try {
      const data = await billingApi.requestPayout({ amount, payoutMethod, payoutDetails });
      
      if (!data.success) throw new Error(data.message);

      toast.success('Payout requested successfully!');
      setCustomAmount('');
      setPayoutDetails('');
      setPayoutMethod('');
      fetchBalance();
    } catch (error: any) {
      toast.error(error.message || 'Failed to request payout');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-32 bg-zinc-900 rounded-xl" />
      <div className="h-64 bg-zinc-900 rounded-xl" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Billing & Credits</h1>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <p className="text-zinc-500 text-sm mb-1">Credit Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {balance?.credits?.toLocaleString() || 0}
            </span>
            <span className="text-zinc-400 text-sm font-medium">Credits</span>
          </div>
          <p className="text-zinc-600 text-xs mt-2">1 credit = 1 free agent invocation</p>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6">
          <p className="text-zinc-500 text-sm mb-1">Earned Credits</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {balance?.earnedCredits?.toLocaleString() || 0}
            </span>
            <span className="text-zinc-400 text-sm font-medium">Credits</span>
          </div>
          <p className="text-zinc-600 text-xs mt-2">Earned from agent invocations. Withdrawable.</p>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
        <div className="flex border-b border-[#1E1E1E]">
          <button 
            onClick={() => { setActiveTab('INR'); setSelectedAmount(null); setCustomAmount(''); }}
            className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'INR' ? 'bg-purple-600/5 text-white border-b-2 border-purple-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Indian Payments (₹)
          </button>
          <button 
            onClick={() => { setActiveTab('USD'); setSelectedAmount(null); setCustomAmount(''); }}
            className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'USD' ? 'bg-purple-600/5 text-white border-b-2 border-purple-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            International Payments ($)
          </button>
          <button 
            onClick={() => { setActiveTab('PAYOUT'); setSelectedAmount(null); setCustomAmount(''); }}
            className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'PAYOUT' ? 'bg-purple-600/5 text-white border-b-2 border-purple-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Request Payout
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'INR' ? (
            <div className="space-y-6">
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Select Amount</label>
                <div className="grid grid-cols-4 gap-3">
                  {RAZORPAY_PRESETS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-3 rounded-xl border transition ${selectedAmount === amt ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  placeholder="Custom amount (Min ₹50)"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="bg-purple-600/5 border border-purple-500/10 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm text-zinc-400">Credits to receive</span>
                <span className="text-xl font-bold text-white">
                  {(selectedAmount || Number(customAmount) || 0).toLocaleString()} Credits
                </span>
              </div>

              <button
                onClick={() => handleRazorpayPayment('INR')}
                disabled={processing || (!selectedAmount && !customAmount)}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : `Pay ₹${selectedAmount || customAmount || 0} with Razorpay`}
              </button>
            </div>
          ) : activeTab === 'USD' ? (
            <div className="space-y-6">
              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Select Amount</label>
                <div className="grid grid-cols-4 gap-3">
                  {PAYPAL_PRESETS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-3 rounded-xl border transition ${selectedAmount === amt ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                placeholder="Custom amount (Min $1)"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-purple-500 transition"
              />

              <div className="bg-purple-600/5 border border-purple-500/10 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm text-zinc-400">Credits to receive</span>
                <span className="text-xl font-bold text-white">
                  {((selectedAmount || Number(customAmount) || 0) * 100).toLocaleString()} Credits
                </span>
              </div>

              <button
                onClick={() => handleRazorpayPayment('USD')}
                disabled={processing || (!selectedAmount && !customAmount)}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : `Pay $${selectedAmount || customAmount || 0} with Razorpay`}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-purple-600/5 border border-purple-500/10 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-sm text-zinc-400">Available to Withdraw</span>
                <span className="text-xl font-bold text-white">
                  {(balance?.earnedCredits || 0).toLocaleString()} Credits
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-3 block">Payout Method</label>
                  <select
                    value={payoutMethod}
                    onChange={e => setPayoutMethod(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-purple-500 transition appearance-none"
                  >
                    <option value="">Select Method</option>
                    <option value="UPI">UPI (India Only)</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-3 block">Payout Details</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI ID or Account details"
                    value={payoutDetails}
                    onChange={e => setPayoutDetails(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-3 block">Withdrawal Amount (Credits)</label>
                <input
                  type="number"
                  placeholder="Min 5000 Credits ($50)"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <button
                onClick={handlePayoutRequest}
                disabled={processing || !customAmount || !payoutMethod || !payoutDetails}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : `Request Payout of ${customAmount || 0} Credits`}
              </button>

              {payouts.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-white mb-4">Payout History</h3>
                  <div className="space-y-4">
                    {payouts.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center py-4 border-b border-zinc-800 last:border-0">
                        <div>
                          <p className="text-white font-medium">{p.payoutMethod} - {p.payoutDetails}</p>
                          <p className="text-zinc-500 text-xs">{new Date(p.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{p.amount.toLocaleString()} Credits</p>
                          <span className={`text-xs font-bold ${
                            p.status === 'COMPLETED' ? 'text-green-400' :
                            p.status === 'REJECTED' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <p className="text-white text-sm font-semibold mb-1">Indian Rates</p>
          <p className="text-zinc-500 text-xs">₹1 = 1 Credit</p>
        </div>
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <p className="text-white text-sm font-semibold mb-1">International Rates</p>
          <p className="text-zinc-500 text-xs">$1 = 100 Credits</p>
        </div>
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <p className="text-white text-sm font-semibold mb-1">Validity</p>
          <p className="text-zinc-500 text-xs">Credits never expire</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No transactions found</p>
          ) : (
            transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center py-4 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-white font-medium">{tx.description}</p>
                  <p className="text-zinc-500 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
