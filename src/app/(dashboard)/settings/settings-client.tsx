'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import type { Subscription, Referral } from '@/types/database';

interface Props {
  subscription: Subscription | null;
  referralCode: string;
  referrals: Referral[];
  userEmail: string;
}

export default function SettingsClient({ subscription, referralCode, referrals, userEmail }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isActive = subscription?.status === 'active';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${appUrl}/signup?ref=${referralCode}`;

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const text = await res.text();
      if (!text) {
        console.error('Empty response from checkout');
        setLoading(false);
        return;
      }
      const data = JSON.parse(text);
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    }
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Account */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <p className="text-sm text-gray-600 mb-4">Signed in as <strong>{userEmail}</strong></p>
        <button
          onClick={handleSignOut}
          className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
        {isActive ? (
          <div>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60">Active</span>
            <p className="text-sm text-gray-500 mt-2">$19/month — 247 Front Runner Pro</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Subscribe to activate your Twilio number and start recovering missed calls.
            </p>
            <div className="bg-gray-50/50 rounded-xl p-5 mb-4 border border-gray-200/60">
              <p className="text-2xl font-bold text-gray-900">$19<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-3 text-sm text-gray-600 space-y-1.5">
                <li>- Dedicated Twilio phone number</li>
                <li>- Auto-text on missed calls</li>
                <li>- Lead capture & tracking</li>
                <li>- Revenue recovery dashboard</li>
              </ul>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Subscribe Now'}
            </button>
          </div>
        )}
      </div>

      {/* Referral Program */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Program</h2>
        <p className="text-sm text-gray-600 mb-3">Share your link and earn when referrals subscribe.</p>
        <div className="flex items-center gap-2 mb-4">
          <input
            readOnly
            value={referralLink}
            className="flex-1 rounded-xl bg-gray-50/50 border border-gray-200 px-4 py-2.5 text-sm"
          />
          <button
            onClick={copyReferralLink}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium">{referrals.length}</span> referrals ·{' '}
          <span className="font-medium">{referrals.filter(r => r.status !== 'pending').length}</span> converted
        </div>
      </div>
    </div>
  );
}
