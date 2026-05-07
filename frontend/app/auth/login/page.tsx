'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Handle post-verification redirect
    const verified = searchParams.get('verified');
    const token = searchParams.get('token');
    const err = searchParams.get('error');

    if (verified && token) {
      // Auto-login after email verification
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://agenticai-backend-xao9.onrender.com'}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          auth.setSession(token, data.data);
          router.replace('/dashboard');
        }
      });
      return;
    }

    if (err === 'invalid_token') {
      setError('Invalid or expired verification link. Please request a new one.');
    }

    // If already logged in go to dashboard
    if (auth.isLoggedIn()) {
      router.replace('/dashboard');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await auth.login(email, password);

      if (result.success) {
        router.push('/dashboard');
      } else {
        switch (result.code) {
          case 'INVALID_CREDENTIALS':
            setError('Invalid email or password. Try demo: alice@agenticai.dev / Demo@1234');
            break;
          case 'EMAIL_NOT_VERIFIED':
            setError('Please verify your email first. Check your inbox or use a demo account below.');
            break;
          case 'RATE_LIMIT_EXCEEDED':
            setError('Too many attempts. Please wait a few minutes.');
            break;
          default:
            setError(result.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again in 30 seconds (free tier waking up).');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@1234');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            Agentic<span className="text-purple-500">AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Welcome back</h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-5">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white 
                           rounded-lg px-4 py-3 focus:outline-none 
                           focus:border-purple-500/50 transition text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-zinc-400 text-sm">Password</label>
                <Link href="/auth/forgot-password"
                  className="text-purple-400 text-xs hover:text-purple-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white 
                             rounded-lg px-4 py-3 pr-12 focus:outline-none 
                             focus:border-purple-500/50 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 
                             hover:text-zinc-300 transition text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-bold py-3 
                         rounded-lg hover:bg-purple-500 transition 
                         disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 
                                   border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-[#1E1E1E]">
            <p className="text-zinc-500 text-xs text-center mb-3">
              Try with demo accounts (pre-verified)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '👤 Admin', email: 'demo@agenticai.dev' },
                { label: '🤖 Creator', email: 'alice@agenticai.dev' },
                { label: '💰 Staker', email: 'bob@agenticai.dev' },
              ].map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => quickLogin(u.email)}
                  className="text-xs bg-zinc-800 text-zinc-300 rounded-lg 
                             px-2 py-2 hover:bg-zinc-700 transition border 
                             border-zinc-700">
                  {u.label}
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-xs text-center mt-2">
              Password for all demo accounts: Demo@1234
            </p>
          </div>

          <p className="text-center text-zinc-500 text-sm mt-6">
            No account?{' '}
            <Link href="/auth/signup"
              className="text-purple-400 hover:text-purple-300">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
