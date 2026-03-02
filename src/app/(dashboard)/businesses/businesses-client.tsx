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
    ai_prompt: '',
  });
  const router = useRouter();

  function resetForm() {
    setForm({
      business_name: '',
      phone_number: '',
      auto_reply_template: 'Sorry we missed your call. How can we help you today?',
      ai_prompt: '',
    });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(b: Business) {
    setForm({
      business_name: b.business_name,
      phone_number: b.phone_number || '',
      auto_reply_template: b.auto_reply_template,
      ai_prompt: b.ai_prompt || '',
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
      ai_prompt: form.ai_prompt,
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch('/api/businesses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setBusinesses(businesses.filter(b => b.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => { resetForm(); setShowForm(!showForm); }}
        className="mb-4 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200"
      >
        {showForm ? 'Cancel' : '+ Add Business'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200/60 p-6 mb-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="w-full rounded-xl bg-gray-50/50 border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+15551234567"
                className="w-full rounded-xl bg-gray-50/50 border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Reply Template</label>
            <textarea
              value={form.auto_reply_template}
              onChange={(e) => setForm({ ...form, auto_reply_template: e.target.value })}
              rows={2}
              className="w-full rounded-xl bg-gray-50/50 border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Receptionist Prompt
              <span className="text-gray-400 font-normal ml-1">(optional — leave empty to disable)</span>
            </label>
            <textarea
              value={form.ai_prompt}
              onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })}
              rows={3}
              placeholder="e.g. We are a plumbing company open Mon-Fri 8am-5pm. Ask callers if it's an emergency and collect their address."
              className="w-full rounded-xl bg-gray-50/50 border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">
              When set, missed calls get an AI voice receptionist that collects the caller&apos;s name and reason for calling.
            </p>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            {editingId ? 'Update Business' : 'Create Business'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {businesses.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{b.business_name}</h3>
                {b.ai_prompt && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                    AI Receptionist
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startEdit(b)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.business_name)}
                  className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <span className="font-medium">Business Phone:</span> {b.phone_number || '—'}
              </div>
              <div>
                <span className="font-medium">Forwarding Number:</span>{' '}
                {b.twilio_number ? (
                  <span className="text-emerald-700 font-mono">{b.twilio_number}</span>
                ) : (
                  <span className="text-amber-600">Provisioning...</span>
                )}
              </div>
              {b.twilio_number && (
                <div className="bg-indigo-50 border border-indigo-200/60 rounded-xl p-3 mt-2">
                  <p className="font-medium text-indigo-900 text-xs mb-1">Setup Instructions:</p>
                  <p className="text-indigo-800 text-xs">
                    Set up call forwarding on your business phone so unanswered calls go to{' '}
                    <span className="font-mono font-bold">{b.twilio_number}</span>.
                    Most carriers: dial <span className="font-mono">*71{b.twilio_number.replace('+1', '')}</span> or
                    go to your carrier&apos;s app and enable &quot;Forward when unanswered&quot;.
                    Your customers keep calling your normal number — we handle the rest.
                  </p>
                </div>
              )}
              <div>
                <span className="font-medium">Auto-Reply:</span>{' '}
                <span className="text-gray-500">{b.auto_reply_template}</span>
              </div>
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
