import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BusinessesClient from './businesses-client';

export default async function BusinessesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Businesses</h1>
      <BusinessesClient businesses={businesses || []} />
    </div>
  );
}
