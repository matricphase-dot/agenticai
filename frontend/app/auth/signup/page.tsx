'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await auth.signup(name, email, password);

      if (result.success) {
        setDone(true);
      } else {
        switch (result.code) {
          case 'EMAIL_EXISTS':
            setError('Account already exists. Please log in instead.');
            break;
          case 'VALIDATION_ERROR':
            setError(result.message || 'Please check your details and try again.');
            break;
          default:
            setError(result.message || 'Signup failed. Please try again.');
        }
      }
    } catch {
      setError('Cannot connect to server. Please try again in 30 seconds.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center 
                      justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-2xl p-8">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Check your email!
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              We sent a verification link to{' '}
              <span className="text-white font-medium">{email}</span>
            </p>
            <p className="text-zinc-500 text-xs mb-6">
              Click the link in the email to verify your account 
              and get started.
            </p>
            <div className="bg-purple-500/10 border border-purple-500/20 
                            rounded-lg p-4 mb-6">
              <p className="text-purple-300 text-xs">
                Want to explore first? Use our demo accounts:
              </p>
              <p className="text-white text-xs mt-1 font-mono">
                alice@agenticai.dev / Demo@1234
              </p>
            </div>
            <Link href="/auth/login"
              className="block w-full bg-purple-600 text-white font-bold 
                         py-3 rounded-lg hover:bg-purple-500 transition 
                         text-center">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center 
                    justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            Agentic<span className="text-purple-500">AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">
            Create your account
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Free forever. No credit card required.
          </p>
        </div>

        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 
                            rounded-lg p-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                           text-white rounded-lg px-4 py-3 
                           focus:outline-none focus:border-purple-500/50 
                           transition text-sm"
              />
            </div>

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
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                           text-white rounded-lg px-4 py-3 
                           focus:outline-none focus:border-purple-500/50 
                           transition text-sm"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                             text-white rounded-lg px-4 py-3 pr-12
                             focus:outline-none focus:border-purple-500/50 
                             transition text-sm"
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

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                           text-white rounded-lg px-4 py-3 
                           focus:outline-none focus:border-purple-500/50 
                           transition text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-bold py-3 
                         rounded-lg hover:bg-purple-500 transition 
                         disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 
                                   border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login"
              className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
