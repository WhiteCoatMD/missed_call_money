import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: userData } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', user.id)
    .single();

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <SettingsClient
        subscription={subscription}
        referralCode={userData?.referral_code || ''}
        referrals={referrals || []}
        userEmail={user.email || ''}
      />
    </div>
  );
}
