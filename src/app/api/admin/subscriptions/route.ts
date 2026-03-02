import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isSuperAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT /api/admin/subscriptions — Activate or cancel a subscription
export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { user_id, status } = await request.json();

  if (!user_id || !['active', 'canceled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Check if subscription exists
  const { data: existing } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', user_id)
    .single();

  if (existing) {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({ status })
      .eq('user_id', user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Create a subscription record (manual activation)
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .insert({ user_id, status, stripe_subscription_id: 'manual_admin' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
