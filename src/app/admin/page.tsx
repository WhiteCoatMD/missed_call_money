import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminSettingsPage() {
  // Platform stats
  const { count: totalUsers } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true });

  const { count: activeSubscribers } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: totalBusinesses } = await supabaseAdmin
    .from('businesses')
    .select('*', { count: 'exact', head: true });

  const { data: twilioBusinesses } = await supabaseAdmin
    .from('businesses')
    .select('twilio_number')
    .not('twilio_number', 'is', null);

  const activeTwilioNumbers = twilioBusinesses?.filter((b) => b.twilio_number)?.length || 0;

  const { count: totalLeads } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: convertedLeads } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('converted', true);

  const { data: revenueData } = await supabaseAdmin
    .from('leads')
    .select('revenue_value')
    .eq('converted', true);

  const totalRevenue = revenueData?.reduce((sum, l) => sum + (l.revenue_value || 0), 0) || 0;

  const stats = [
    { label: 'Total Users', value: totalUsers || 0 },
    { label: 'Active Subscribers', value: activeSubscribers || 0 },
    { label: 'Total Businesses', value: totalBusinesses || 0 },
    { label: 'Active Twilio Numbers', value: activeTwilioNumbers },
    { label: 'Total Leads', value: totalLeads || 0 },
    { label: 'Converted Leads', value: convertedLeads || 0 },
    { label: 'Total Revenue Recovered', value: `$${totalRevenue.toLocaleString()}`, isRevenue: true },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              'isRevenue' in stat && stat.isRevenue
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-transparent'
                : 'bg-white border-gray-200/60'
            }`}
          >
            <p className={`text-sm ${
              'isRevenue' in stat && stat.isRevenue ? 'text-white/80' : 'text-gray-500'
            }`}>{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${
              'isRevenue' in stat && stat.isRevenue ? 'text-white' : 'text-gray-900'
            }`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
