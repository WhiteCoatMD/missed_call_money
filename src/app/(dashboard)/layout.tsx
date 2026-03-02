import Sidebar from '@/components/sidebar';
import { createClient } from '@/lib/supabase-server';
import { isSuperAdmin } from '@/lib/admin';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email ? isSuperAdmin(user.email) : false;

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}
