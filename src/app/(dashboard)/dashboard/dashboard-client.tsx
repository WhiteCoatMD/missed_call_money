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
      className="border rounded px-3 py-2 text-sm"
    >
      {businesses.map((b) => (
        <option key={b.id} value={b.id}>{b.business_name}</option>
      ))}
    </select>
  );
}
