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
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
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
    <div className="space-y-6">
      {/* Account */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <p className="text-sm text-gray-600 mb-4">Signed in as <strong>{userEmail}</strong></p>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:underline"
        >
          Sign Out
        </button>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
        {isActive ? (
          <div>
            <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">Active</span>
            <p className="text-sm text-gray-500 mt-2">$19/month — Missed Call Money Pro</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Subscribe to activate your Twilio number and start recovering missed calls.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-2xl font-bold text-gray-900">$19<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>- Dedicated Twilio phone number</li>
                <li>- Auto-text on missed calls</li>
                <li>- Lead capture & tracking</li>
                <li>- Revenue recovery dashboard</li>
              </ul>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Subscribe Now'}
            </button>
          </div>
        )}
      </div>

      {/* Referral Program */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Program</h2>
        <p className="text-sm text-gray-600 mb-3">Share your link and earn when referrals subscribe.</p>
        <div className="flex items-center gap-2 mb-4">
          <input
            readOnly
            value={referralLink}
            className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
          />
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800"
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
