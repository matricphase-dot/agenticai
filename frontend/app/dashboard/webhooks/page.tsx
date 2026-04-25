'use client';
import { useState } from 'react';

const WEBHOOK_EVENTS = [
  'invocation.completed', 'reward.distributed', 'stake.placed',
  'stake.withdrawn', 'proposal.finalized', 'proposal.created',
  'node.task.completed', 'agent.created',
];

// Note: Webhooks CRUD uses /api/webhooks endpoint
// Build using the same apiFetch pattern as other pages

export default function WebhooksPage() {
  const [webhooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const toggleEvent = (e: string) => {
    setSelectedEvents(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Get notified when events happen on your account
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white font-medium px-4 py-2 
                     rounded-lg hover:bg-purple-500 transition text-sm">
          + Add Webhook
        </button>
      </div>

      {/* Add webhook form */}
      {showForm && (
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6 space-y-4">
          <h3 className="text-white font-medium">New Webhook</h3>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Slack notifications"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                         text-white rounded-lg px-4 py-3
                         focus:outline-none focus:border-purple-500/50"/>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">
              Endpoint URL
            </label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://hooks.slack.com/..."
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                         text-white rounded-lg px-4 py-3
                         focus:outline-none focus:border-purple-500/50"/>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-2">
              Events to subscribe
            </label>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map(e => (
                <button key={e} onClick={() => toggleEvent(e)}
                  className={`px-3 py-1.5 rounded-lg text-xs 
                              font-medium transition ${
                    selectedEvents.includes(e)
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="bg-purple-600 text-white font-medium px-6 
                         py-2 rounded-lg hover:bg-purple-500 transition 
                         text-sm opacity-50 cursor-not-allowed"
              title="Wire to /api/webhooks POST endpoint">
              Create Webhook
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-zinc-700 text-zinc-300 px-6 py-2 
                         rounded-lg hover:border-zinc-500 transition text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 
                      rounded-xl p-5">
        <h3 className="text-blue-400 font-medium mb-2">
          Webhook Security
        </h3>
        <p className="text-zinc-400 text-sm">
          All webhook payloads are signed with HMAC-SHA256 using 
          your webhook secret. Verify the{' '}
          <code className="bg-zinc-800 px-1 rounded text-xs">
            X-Webhook-Signature
          </code>{' '}
          header on your server.
        </p>
      </div>

      {/* Empty state */}
      {webhooks.length === 0 && !showForm && (
        <div className="text-center py-16 bg-[#111111] border 
                        border-[#1E1E1E] rounded-xl">
          <p className="text-4xl mb-4">🔗</p>
          <h3 className="text-white font-semibold mb-2">
            No webhooks yet
          </h3>
          <p className="text-zinc-400 text-sm">
            Add a webhook to receive real-time event notifications
          </p>
        </div>
      )}
    </div>
  );
}
