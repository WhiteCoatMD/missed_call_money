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
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Messages</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm">{lead.caller_number}</td>
                <td className="px-4 py-3 text-sm">{lead.name || '—'}</td>
                <td className="px-4 py-3 text-sm">
                  {(lead.message_thread || []).length} messages
                </td>
                <td className="px-4 py-3">
                  {lead.converted ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Converted
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                      Open
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {lead.converted ? `$${lead.revenue_value.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3">
                  {!lead.converted && (
                    <>
                      {convertingId === lead.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Revenue $"
                            value={revenueInput}
                            onChange={(e) => setRevenueInput(e.target.value)}
                            className="w-24 border rounded px-2 py-1 text-sm"
                          />
                          <button
                            onClick={() => markConverted(lead.id)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setConvertingId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConvertingId(lead.id)}
                          className="text-xs text-blue-600 hover:underline"
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
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
