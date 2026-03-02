'use client';

import { useState } from 'react';
import type { Lead } from '@/types/database';

interface Props {
  leads: Lead[];
}

export default function LeadsClient({ leads: initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [revenueInput, setRevenueInput] = useState('');

  async function markConverted(leadId: string) {
    const revenue = parseFloat(revenueInput);
    if (isNaN(revenue) || revenue <= 0) return;

    const res = await fetch('/api/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leadId, converted: true, revenue_value: revenue }),
    });

    if (res.ok) {
      const updated = await res.json();
      setLeads(leads.map(l => l.id === leadId ? updated : l));
      setConvertingId(null);
      setRevenueInput('');
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Messages</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Revenue</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{lead.caller_number}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{lead.name || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">
                  {(lead.message_thread || []).length} messages
                </td>
                <td className="px-5 py-3.5">
                  {lead.converted ? (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60">
                      Converted
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                      Open
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">
                  {lead.converted ? `$${lead.revenue_value.toLocaleString()}` : '—'}
                </td>
                <td className="px-5 py-3.5">
                  {!lead.converted && (
                    <>
                      {convertingId === lead.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Revenue $"
                            value={revenueInput}
                            onChange={(e) => setRevenueInput(e.target.value)}
                            className="w-24 rounded-lg bg-gray-50/50 border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                          />
                          <button
                            onClick={() => markConverted(lead.id)}
                            className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-lg font-medium hover:shadow-md transition-all duration-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setConvertingId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConvertingId(lead.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                        >
                          Mark Converted
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                  No leads yet. Leads are created when callers respond to your auto-text.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
