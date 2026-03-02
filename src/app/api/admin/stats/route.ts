import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isSuperAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/stats — Platform-wide stats
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [users, subs, businesses, leads] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.from('subscriptions').select('status'),
    supabaseAdmin.from('businesses').select('twilio_number'),
    supabaseAdmin.from('leads').select('converted, revenue_value'),
  ]);

  const totalUsers = users.data?.users?.length || 0;
  const activeSubscribers = subs.data?.filter((s) => s.status === 'active').length || 0;
  const totalBusinesses = businesses.data?.length || 0;
  const activeTwilioNumbers = businesses.data?.filter((b) => b.twilio_number).length || 0;
  const totalLeads = leads.data?.length || 0;
  const convertedLeads = leads.data?.filter((l) => l.converted).length || 0;
  const totalRevenue = leads.data
    ?.filter((l) => l.converted)
    .reduce((sum, l) => sum + (l.revenue_value || 0), 0) || 0;

  return NextResponse.json({
    totalUsers,
    activeSubscribers,
    totalBusinesses,
    activeTwilioNumbers,
    totalLeads,
    convertedLeads,
    totalRevenue,
  });
}
