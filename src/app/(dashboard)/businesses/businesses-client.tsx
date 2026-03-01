'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Business } from '@/types/database';

interface Props {
  businesses: Business[];
}

export default function BusinessesClient({ businesses: initialBusinesses }: Props) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_name: '',
    phone_number: '',
    auto_reply_template: 'Sorry we missed your call. How can we help you today?',
  });
  const router = useRouter();

  function resetForm() {
    setForm({
      business_name: '',
      phone_number: '',
      auto_reply_template: 'Sorry we missed your call. How can we help you today?',
    });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(b: Business) {
    setForm({
      business_name: b.business_name,
      phone_number: b.phone_number || '',
      auto_reply_template: b.auto_reply_template,
    });
    setEditingId(b.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      business_name: form.business_name,
      phone_number: form.phone_number,
      auto_reply_template: form.auto_reply_template,
    };

    if (editingId) {
      const res = await fetch('/api/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBusinesses(businesses.map(b => b.id === editingId ? updated : b));
      }
    } else {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setBusinesses([created, ...businesses]);
      }
    }

    resetForm();
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={() => { resetForm(); setShowForm(!showForm); }}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        {showForm ? 'Cancel' : '+ Add Business'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+15551234567"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Reply Template</label>
            <textarea
              value={form.auto_reply_template}
              onChange={(e) => setForm({ ...form, auto_reply_template: e.target.value })}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {editingId ? 'Update Business' : 'Create Business'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {businesses.map((b) => (
          <div key={b.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{b.business_name}</h3>
              <button
                onClick={() => startEdit(b)}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Phone:</span> {b.phone_number || '—'}
              </div>
              <div>
                <span className="font-medium">Twilio #:</span> {b.twilio_number || 'Pending'}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <span className="font-medium">Auto-Reply:</span> {b.auto_reply_template}
            </div>
          </div>
        ))}

        {businesses.length === 0 && (
          <p className="text-gray-400 text-center py-8">No businesses yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
