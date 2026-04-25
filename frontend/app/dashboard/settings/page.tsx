'use client';
import { useEffect, useState } from 'react';
import { authApi, usersApi, keysApi } from '@/lib/api';

const TABS = ['Profile', 'API Keys', 'Security'];

export default function SettingsPage() {
  const [tab, setTab] = useState('Profile');
  const [user, setUser] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // API key state
  const [keyName, setKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    Promise.all([
      authApi.me(),
      keysApi.list(),
    ]).then(([userRes, keysRes]) => {
      if (userRes.success) {
        setUser(userRes.data);
        setName((userRes.data as any)?.name || '');
        setBio((userRes.data as any)?.bio || '');
      }
      if (keysRes.success) setKeys((keysRes.data as any) || []);
      setLoading(false);
    });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await usersApi.updateMe({ name, bio });
    if (res.success) setProfileMsg('Profile updated');
    setSaving(false);
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handleCreateKey = async () => {
    if (!keyName) return;
    setCreatingKey(true);
    const res = await keysApi.create(keyName);
    if (res.success) {
      setNewKey((res.data as any)?.key || '');
      setKeyName('');
      const updated = await keysApi.list();
      if (updated.success) setKeys((updated.data as any) || []);
    }
    setCreatingKey(false);
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Revoke this API key?')) return;
    await keysApi.revoke(id);
    setKeys(prev => prev.map(k =>
      k.id === id ? { ...k, isActive: false } : k
    ));
  };

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="bg-[#111111] border border-[#1E1E1E] 
                      rounded-xl h-64" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1E1E1E]">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 
                        transition -mb-px ${
              tab === t
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'Profile' && (
        <div className="bg-[#111111] border border-[#1E1E1E] 
                        rounded-xl p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-700 
                            flex items-center justify-center 
                            text-white text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-zinc-400 text-sm">{user?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 
                               inline-block ${
                user?.emailVerified
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {user?.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-sm block mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                         text-white rounded-lg px-4 py-3
                         focus:outline-none focus:border-purple-500/50"/>
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              rows={3} placeholder="Tell the community about yourself..."
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] 
                         text-white rounded-lg px-4 py-3 resize-none
                         focus:outline-none focus:border-purple-500/50"/>
          </div>

          {profileMsg && (
            <p className="text-green-400 text-sm">✅ {profileMsg}</p>
          )}

          <button onClick={handleSaveProfile} disabled={saving}
            className="bg-purple-600 text-white font-medium px-6 py-2.5 
                       rounded-lg hover:bg-purple-500 transition 
                       disabled:opacity-50 text-sm">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'API Keys' && (
        <div className="space-y-4">
          {/* New key created — show once */}
          {newKey && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 
                            rounded-xl p-5">
              <p className="text-yellow-400 text-sm font-semibold mb-2">
                ⚠️ Copy this key — it won't be shown again
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-900 text-zinc-200 
                                 text-sm font-mono px-4 py-3 rounded-lg 
                                 break-all">
                  {newKey}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(newKey)}
                  className="text-yellow-400 text-xs border 
                             border-yellow-500/30 px-3 py-3 rounded-lg 
                             hover:bg-yellow-500/10 transition">
                  Copy
                </button>
              </div>
              <button onClick={() => setNewKey('')}
                className="text-zinc-500 text-xs mt-2 hover:text-zinc-400">
                Dismiss
              </button>
            </div>
          )}

          {/* Create new key */}
          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">
              Create API Key
            </h3>
            <div className="flex gap-3">
              <input value={keyName}
                onChange={e => setKeyName(e.target.value)}
                placeholder="Key name (e.g. Production)"
                className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] 
                           text-white rounded-lg px-4 py-2.5
                           focus:outline-none focus:border-purple-500/50 
                           text-sm"/>
              <button onClick={handleCreateKey}
                disabled={creatingKey || !keyName}
                className="bg-purple-600 text-white font-medium px-5 
                           py-2.5 rounded-lg hover:bg-purple-500 
                           transition disabled:opacity-50 text-sm">
                {creatingKey ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>

          {/* Keys list */}
          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl divide-y divide-[#1E1E1E]">
            {keys.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                No API keys yet
              </div>
            ) : keys.map(key => (
              <div key={key.id}
                   className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white font-medium text-sm">
                    {key.name}
                    {!key.isActive && (
                      <span className="ml-2 text-xs text-red-400">
                        Revoked
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <code className="text-zinc-400 text-xs font-mono">
                      {key.keyPrefix}...
                    </code>
                    <span className="text-zinc-600 text-xs">
                      {key.lastUsedAt
                        ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                        : 'Never used'
                      }
                    </span>
                  </div>
                </div>
                {key.isActive && (
                  <button onClick={() => handleRevokeKey(key.id)}
                    className="text-red-500 hover:text-red-400 text-xs 
                               transition">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'Security' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">
              Change Password
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Use the forgot password flow to change your password.
            </p>
            <a href="/auth/forgot-password"
               className="inline-block border border-zinc-700 
                          text-zinc-300 px-4 py-2 rounded-lg 
                          hover:border-zinc-500 transition text-sm">
              Send Reset Email
            </a>
          </div>

          <div className="bg-[#111111] border border-[#1E1E1E] 
                          rounded-xl p-6">
            <h3 className="text-white font-medium mb-2">
              Account Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Email</span>
                <span className="text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Role</span>
                <span className="text-white">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Member since</span>
                <span className="text-white">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
