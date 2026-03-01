import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';

// Public embeddable badge page
// Usage: <iframe src="https://app.missedcallmoney.com/embed/BUSINESS_ID" />
export default async function EmbedBadgePage({
  params,
}: {
  params: { businessId: string };
}) {
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, business_name, badge_enabled, white_label_enabled, white_label_name')
    .eq('id', params.businessId)
    .single();

  if (!business || !business.badge_enabled) {
    notFound();
  }

  const { data: stats } = await supabaseAdmin.rpc('get_business_stats', {
    p_business_id: params.businessId,
  });

  const revenue = stats?.revenue_recovered_this_month || 0;
  const poweredBy = business.white_label_enabled && business.white_label_name
    ? business.white_label_name
    : 'Missed Call Money';

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #059669, #10b981)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      display: 'inline-block',
      minWidth: '220px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
        Revenue Recovered This Month
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
        ${revenue.toLocaleString()}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>
        Powered by {poweredBy}
      </div>
    </div>
  );
}
