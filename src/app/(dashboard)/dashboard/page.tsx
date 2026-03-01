import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import KpiCard from '@/components/kpi-card';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Get user's first business (default)
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (!businesses || businesses.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-600 mb-4">You haven&apos;t created a business yet.</p>
          <a
            href="/businesses"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Your First Business
          </a>
        </div>
      </div>
    );
  }

  const business = businesses[0];

  // Fetch stats
  const { data: stats } = await supabase.rpc('get_business_stats', {
    p_business_id: business.id,
  });

  // Fetch recent missed calls
  const { data: recentCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('business_id', business.id)
    .eq('call_status', 'missed')
    .order('created_at', { ascending: false })
    .limit(20);

  const missedCalls = stats?.missed_calls_30d || 0;
  const moneyLost = missedCalls * business.average_job_value * business.close_rate;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {businesses.length > 1 && (
          <DashboardClient businesses={businesses} currentBusinessId={business.id} />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Missed Calls (30d)"
          value={missedCalls}
          variant="red"
        />
        <KpiCard
          title="Leads Generated"
          value={stats?.total_leads || 0}
          variant="blue"
        />
        <KpiCard
          title="Revenue Recovered"
          value={`$${(stats?.revenue_recovered || 0).toLocaleString()}`}
          variant="green"
        />
        <KpiCard
          title="Estimated Money Lost"
          value={`$${moneyLost.toLocaleString()}`}
          subtitle={`${missedCalls} calls × $${business.average_job_value} × ${(business.close_rate * 100).toFixed(0)}%`}
          variant="red"
        />
      </div>

      {/* Revenue This Month */}
      <div className="bg-green-600 text-white rounded-lg p-6 mb-8">
        <p className="text-sm font-medium opacity-80">Revenue Recovered This Month</p>
        <p className="text-4xl font-bold mt-1">
          ${(stats?.revenue_recovered_this_month || 0).toLocaleString()}
        </p>
      </div>

      {/* Recent Missed Calls Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Missed Calls</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="px-4 py-3">Caller</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentCalls || []).map((call) => (
                <tr key={call.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm">{call.caller_number}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      Missed
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(call.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!recentCalls || recentCalls.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    No missed calls yet. Your Twilio number will start tracking calls.
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
