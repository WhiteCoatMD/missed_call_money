'use client';

import { useRouter } from 'next/navigation';
import type { Business } from '@/types/database';

interface Props {
  businesses: Business[];
  currentBusinessId: string;
}

export default function DashboardClient({ businesses, currentBusinessId }: Props) {
  const router = useRouter();

  return (
    <select
      value={currentBusinessId}
      onChange={(e) => router.push(`/dashboard?business=${e.target.value}`)}
      className="rounded-xl bg-gray-50/50 border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
    >
      {businesses.map((b) => (
        <option key={b.id} value={b.id}>{b.business_name}</option>
      ))}
    </select>
  );
}
