'use client';
import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    const params: Record<string, string> = filter === 'unread' ? { read: 'false' } : {};
    const res = await notificationsApi.list(params);
    if (res.success) {
      setNotifications((res.data as any)?.notifications || []);
      setUnreadCount((res.data as any)?.unreadCount || 0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [filter]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    await fetchNotifications();
  };

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const typeIcons: Record<string, string> = {
    reward: '🪙',
    invocation: '⚡',
    governance: '🗳️',
    stake: '📈',
    unstake_complete: '🔓',
    proposal_finalized: '✅',
    default: '🔔',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-zinc-400 text-sm mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm 
                            font-medium transition capitalize ${
                  filter === f
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-[#1E1E1E] 
                                     rounded-xl h-20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-[#111111] border 
                        border-[#1E1E1E] rounded-xl">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-white font-medium mb-1">All caught up</p>
          <p className="text-zinc-400 text-sm">
            No notifications to show
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`flex items-start gap-4 p-4 rounded-xl 
                          border transition cursor-pointer ${
                n.read
                  ? 'bg-[#111111] border-[#1E1E1E] opacity-70'
                  : 'bg-[#111111] border-purple-500/20 hover:border-purple-500/40'
              }`}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">
                {typeIcons[n.type] || typeIcons.default}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`font-medium text-sm ${
                    n.read ? 'text-zinc-300' : 'text-white'
                  }`}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="w-2 h-2 bg-purple-500 rounded-full 
                                     flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-zinc-400 text-sm mt-0.5">
                  {n.message}
                </p>
                <p className="text-zinc-600 text-xs mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {n.link && (
                <Link
                  href={n.link}
                  onClick={e => e.stopPropagation()}
                  className="text-purple-400 text-xs hover:text-purple-300 
                             flex-shrink-0"
                >
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
