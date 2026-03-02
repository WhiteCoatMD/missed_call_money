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
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-8 text-center shadow-sm">
          <p className="text-gray-500 mb-4">You haven&apos;t created a business yet.</p>
          <a
            href="/businesses"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200"
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

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {businesses.length > 1 && (
          <DashboardClient businesses={businesses} currentBusinessId={business.id} />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          title="Leads Converted"
          value={stats?.revenue_recovered || 0}
          variant="green"
        />
      </div>

      {/* Revenue This Month */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-6 mb-8 shadow-sm">
        <p className="text-sm font-medium opacity-80">Revenue Recovered This Month</p>
        <p className="text-4xl font-bold mt-1">
          ${(stats?.revenue_recovered_this_month || 0).toLocaleString()}
        </p>
      </div>

      {/* Recent Missed Calls Table */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Missed Calls</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Caller</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentCalls || []).map((call) => (
                <tr key={call.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{call.caller_number}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-700">
                      Missed
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {new Date(call.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!recentCalls || recentCalls.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-gray-400">
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
