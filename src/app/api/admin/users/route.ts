import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isSuperAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { releasePhoneNumber } from '@/lib/twilio';

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isSuperAdmin(user.email || '')) {
    return null;
  }
  return user;
}

// GET /api/admin/users — List all users with stats, or all businesses
export async function GET(request: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get('type');

  if (type === 'businesses') {
    return getBusinesses();
  }

  return getUsers();
}

async function getUsers() {
  // Get all users from auth.users via admin API
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with subscription and business data
  const enriched = await Promise.all(
    users.map(async (u) => {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('status, stripe_customer_id')
        .eq('user_id', u.id)
        .single();

      const { count } = await supabaseAdmin
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.id);

      return {
        id: u.id,
        email: u.email || '',
        created_at: u.created_at,
        subscription_status: sub?.status || 'none',
        stripe_customer_id: sub?.stripe_customer_id || null,
        business_count: count || 0,
      };
    })
  );

  return NextResponse.json(enriched);
}

async function getBusinesses() {
  const { data: businesses } = await supabaseAdmin
    .from('businesses')
    .select('id, business_name, user_id, twilio_number, created_at')
    .order('created_at', { ascending: false });

  const enriched = await Promise.all(
    (businesses || []).map(async (b) => {
      // Get user email
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(b.user_id);

      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', b.user_id)
        .single();

      const { count: missedCalls } = await supabaseAdmin
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', b.id)
        .eq('call_status', 'missed');

      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('revenue_value')
        .eq('business_id', b.id)
        .eq('converted', true);

      const totalRevenue = leads?.reduce((sum, l) => sum + (l.revenue_value || 0), 0) || 0;

      return {
        ...b,
        user_email: user?.email || 'unknown',
        subscription_status: sub?.status || 'inactive',
        missed_calls: missedCalls || 0,
        recovered_revenue: totalRevenue,
      };
    })
  );

  return NextResponse.json(enriched);
}

// DELETE /api/admin/users — Delete a user or a business
export async function DELETE(request: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // Delete a single business
  if (body.business_id) {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('twilio_number')
      .eq('id', body.business_id)
      .single();

    if (business?.twilio_number) {
      try { await releasePhoneNumber(business.twilio_number); } catch (e) {
        console.error('Failed to release Twilio number:', e);
      }
    }

    await supabaseAdmin.from('leads').delete().eq('business_id', body.business_id);
    await supabaseAdmin.from('calls').delete().eq('business_id', body.business_id);
    await supabaseAdmin.from('businesses').delete().eq('id', body.business_id);

    return NextResponse.json({ success: true });
  }

  // Delete a user and all their data
  if (body.user_id) {
    // Get all businesses for this user
    const { data: businesses } = await supabaseAdmin
      .from('businesses')
      .select('id, twilio_number')
      .eq('user_id', body.user_id);

    // Release Twilio numbers and delete business data
    for (const biz of businesses || []) {
      if (biz.twilio_number) {
        try { await releasePhoneNumber(biz.twilio_number); } catch (e) {
          console.error('Failed to release Twilio number:', e);
        }
      }
      await supabaseAdmin.from('leads').delete().eq('business_id', biz.id);
      await supabaseAdmin.from('calls').delete().eq('business_id', biz.id);
    }

    await supabaseAdmin.from('businesses').delete().eq('user_id', body.user_id);
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', body.user_id);
    await supabaseAdmin.from('referrals').delete().eq('referrer_id', body.user_id);

    // Delete the auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(body.user_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Missing user_id or business_id' }, { status: 400 });
}
