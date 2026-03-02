'use client';

import { useEffect, useState } from 'react';

interface Business {
  id: string;
  business_name: string;
  user_email: string;
  twilio_number: string | null;
  subscription_status: string;
  missed_calls: number;
  recovered_revenue: number;
  created_at: string;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBusinesses() {
    const res = await fetch('/api/admin/users?type=businesses');
    if (res.ok) {
      setBusinesses(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { fetchBusinesses(); }, []);

  async function handleDeleteBusiness(id: string, name: string) {
    if (!confirm(`Delete business "${name}"? This will release its Twilio number.`)) return;

    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: id }),
    });

    if (res.ok) fetchBusinesses();
    else alert('Failed to delete business');
  }

  if (loading) {
    return <p className="text-gray-500">Loading businesses...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Businesses ({businesses.length})</h1>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Twilio #</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Missed Calls</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm font-medium">{b.business_name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{b.user_email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{b.twilio_number || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    b.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {b.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{b.missed_calls}</td>
                <td className="px-4 py-3 text-sm font-medium text-green-600">
                  ${b.recovered_revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(b.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleDeleteBusiness(b.id, b.business_name)}
                    className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {businesses.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No businesses registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
