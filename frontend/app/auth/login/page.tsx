'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authApi.login(email, password);
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(
          result.code === 'INVALID_CREDENTIALS' 
            ? 'Invalid email or password'
            : result.code === 'EMAIL_NOT_VERIFIED'
            ? 'Please verify your email first'
            : 'Login failed. Please try again.'
        );
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center 
                    justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-zinc-400">
            Sign in to your Agentic AI account
          </p>
        </div>

        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 
                           rounded-lg p-3 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-zinc-400 text-sm font-medium 
                               block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                           text-white rounded-lg px-4 py-3 
                           focus:outline-none focus:border-purple-500/50 
                           transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm font-medium 
                               block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                           text-white rounded-lg px-4 py-3 
                           focus:outline-none focus:border-purple-500/50 
                           transition"
                placeholder="••••••••"
              />
            </div>

            <div className="text-right">
              <Link href="/auth/forgot-password" 
                    className="text-purple-400 text-sm hover:text-purple-300">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-bold 
                         rounded-lg py-3 hover:bg-purple-500 
                         transition disabled:opacity-50 
                         disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" 
                  className="text-purple-400 hover:text-purple-300">
              Sign up free
            </Link>
          </p>

          {/* Dev shortcut — remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-[#1E1E1E]">
              <p className="text-zinc-600 text-xs text-center mb-3">
                Dev quick login
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Admin', email: 'demo@agenticai.dev' },
                  { label: 'Alice', email: 'alice@agenticai.dev' },
                  { label: 'Bob', email: 'bob@agenticai.dev' },
                ].map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setPassword('Demo@1234');
                    }}
                    className="text-xs bg-zinc-800 text-zinc-400 
                               rounded px-2 py-1 hover:bg-zinc-700 
                               transition"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
