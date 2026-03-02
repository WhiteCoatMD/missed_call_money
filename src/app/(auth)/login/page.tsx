'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-gray-200/60 animate-fade-in">
        <div>
          <div className="flex justify-center">
            <Image src="/logo.png" alt="247 Front Runner" width={200} height={50} priority />
          </div>
          <h2 className="mt-4 text-center text-gray-500">Sign in to your account</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm border border-rose-200/60">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl bg-gray-50/50 border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-2.5 text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl bg-gray-50/50 border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-2.5 text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
