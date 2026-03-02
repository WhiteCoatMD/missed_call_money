import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/businesses/:businessId/badge — Public badge data for embed
// Returns revenue recovered this month for a business (if badge enabled)
export async function GET(
  _request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, business_name, badge_enabled, white_label_enabled, white_label_name')
    .eq('id', params.businessId)
    .single();

  if (!business || !business.badge_enabled) {
    return NextResponse.json({ error: 'Badge not enabled' }, { status: 404 });
  }

  const { data: stats } = await supabaseAdmin.rpc('get_business_stats', {
    p_business_id: params.businessId,
  });

  const displayName = business.white_label_enabled && business.white_label_name
    ? business.white_label_name
    : 'Missed Call Money';

  return NextResponse.json({
    business_name: business.business_name,
    revenue_recovered_this_month: stats?.revenue_recovered_this_month || 0,
    powered_by: displayName,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=300',
    },
  });
}
