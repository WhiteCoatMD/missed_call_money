import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

// POST /api/referrals — Link a referred user to their referrer
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { referral_code, user_id } = body;

  if (!referral_code || !user_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Find referrer by referral code
  const { data: referrer } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('referral_code', referral_code)
    .single();

  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  // Update referred user
  await supabaseAdmin
    .from('users')
    .update({ referred_by: referrer.id })
    .eq('id', user_id);

  // Create referral record
  await supabaseAdmin.from('referrals').insert({
    referrer_id: referrer.id,
    referred_id: user_id,
    status: 'pending',
  });

  return NextResponse.json({ success: true });
}

// GET /api/referrals — Get user's referral stats
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', user.id)
    .single();

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id);

  return NextResponse.json({
    referral_code: userData?.referral_code,
    referrals: referrals || [],
    total_referrals: referrals?.length || 0,
    converted: referrals?.filter(r => r.status === 'converted' || r.status === 'paid').length || 0,
  });
}
