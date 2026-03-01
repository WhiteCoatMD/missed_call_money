import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';

// Admin page — lists all businesses with stats
// In production, add proper admin role check
export default async function AdminBusinessesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch all businesses with related data using admin client
  const { data: businesses } = await supabaseAdmin
    .from('businesses')
    .select(`
      id,
      business_name,
      user_id,
      twilio_number,
      created_at
    `)
    .order('created_at', { ascending: false });

  // Get stats for each business
  const businessStats = await Promise.all(
    (businesses || []).map(async (b) => {
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
        subscription_status: sub?.status || 'inactive',
        missed_calls: missedCalls || 0,
        recovered_revenue: totalRevenue,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin — All Businesses</h1>

        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Twilio #</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Missed Calls</th>
                <th className="px-4 py-3">Revenue Recovered</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {businessStats.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{b.business_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{b.twilio_number || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      b.subscription_status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {b.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{b.missed_calls}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    ${b.recovered_revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {businessStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No businesses registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
