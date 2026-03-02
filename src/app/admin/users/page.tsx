'use client';

import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  business_count: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleToggleSubscription(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'canceled' : 'active';
    if (!confirm(`${newStatus === 'active' ? 'Activate' : 'Cancel'} subscription for this user?`)) return;

    const res = await fetch('/api/admin/subscriptions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, status: newStatus }),
    });

    if (res.ok) fetchUsers();
    else alert('Failed to update subscription');
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This will delete all their businesses and release Twilio numbers.`)) return;

    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (res.ok) fetchUsers();
    else alert('Failed to delete user');
  }

  if (loading) {
    return <p className="text-gray-500">Loading users...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users ({users.length})</h1>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Signed Up</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Businesses</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm font-medium">{u.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    u.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{u.business_count}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button
                    onClick={() => handleToggleSubscription(u.id, u.subscription_status)}
                    className={`px-2 py-1 text-xs rounded ${
                      u.subscription_status === 'active'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {u.subscription_status === 'active' ? 'Cancel Sub' : 'Activate Sub'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.email)}
                    className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
