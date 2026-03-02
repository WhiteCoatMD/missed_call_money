'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/businesses', label: 'Businesses' },
  { href: '/settings', label: 'Settings' },
];

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-gray-950 text-white min-h-screen p-6 flex flex-col">
      <Link href="/dashboard" className="mb-8 block">
        <Image src="/logo.png" alt="247 Front Runner" width={160} height={40} />
      </Link>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              pathname.startsWith(item.href)
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md border-l-2 border-violet-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 space-y-2">
        {isAdmin && (
          <Link
            href="/admin"
            className="block text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="block w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
