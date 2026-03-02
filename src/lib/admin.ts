import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export function isSuperAdmin(email: string): boolean {
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function requireSuperAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email || '')) {
    redirect('/dashboard');
  }

  return user;
}
