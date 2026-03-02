'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SubscribeSuccessPage() {
  const [status, setStatus] = useState<'checking' | 'active' | 'pending'>('checking');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    async function checkSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .limit(1);

      const subscription = subscriptions?.[0];

      if (subscription?.status === 'active') {
        setStatus('active');
        setTimeout(() => router.push('/dashboard'), 3000);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus('active');
        setTimeout(() => router.push('/dashboard'), 3000);
        return;
      }

      setTimeout(checkSubscription, 2000);
    }

    checkSubscription();
  }, [supabase, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Missed Call Money" width={200} height={50} />
        </div>
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">You&apos;re All Set!</h1>
        <p className="text-gray-600">
          Your subscription is active. We&apos;re setting up your account now.
        </p>
        <p className="text-sm text-gray-400">
          {status === 'checking' ? 'Activating your account...' : 'Redirecting to your dashboard...'}
        </p>
        <div className="animate-pulse">
          <div className="h-2 bg-blue-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
