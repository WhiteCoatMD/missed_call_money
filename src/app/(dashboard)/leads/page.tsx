import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LeadsClient from './leads-client';

export default async function LeadsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, business_name')
    .eq('user_id', user.id);

  if (!businesses || businesses.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Leads</h1>
        <p className="text-gray-500">Create a business first to start tracking leads.</p>
      </div>
    );
  }

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businesses[0].id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leads</h1>
      <LeadsClient leads={leads || []} />
    </div>
  );
}
