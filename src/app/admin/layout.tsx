import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/admin';

const adminNav = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/businesses', label: 'Businesses' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-lg font-bold">Admin Panel</Link>
          <nav className="flex gap-4">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-300 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
          Back to Dashboard
        </Link>
      </header>
      <main className="p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
