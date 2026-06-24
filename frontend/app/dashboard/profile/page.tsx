"use client";

import { authApi } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Camera, User, Mail, Link as LinkIcon, Loader2, Save } from "lucide-react";

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    authApi.me().then(res => {
      if (res.success && res.data) {
        setSession({ user: res.data });
        setName(res.data.name || "");
        setAvatar(res.data.avatar || "");
        setBio(res.data.bio || "");
      }
    });
  }, []);

  const onSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, bio, avatar }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(await res.text());

      // Optionally refresh user data
      const newSession = await authApi.me();
      if (newSession.success) setSession({ user: newSession.data });
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono tracking-tight">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Public Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your personal information and presence.</p>
        </div>
        <button 
          onClick={onSave}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-xl hover:shadow-primary/20"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-foreground" /> : <Save className="h-4 w-4 text-foreground" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar */}
        <div className="md:col-span-1 space-y-4">
          <div className="relative group mx-auto w-48 h-48">
            <div className="w-full h-full rounded-2xl border-4 border-accent bg-card overflow-hidden flex items-center justify-center">
              {avatar || session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar || session?.user?.image || ""} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-20 w-20 text-muted-foreground" />
              )}
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-foreground" />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground font-bold uppercase tracking-widest">JPG, PNG or WEBP. Max 2MB.</p>
        </div>

        {/* Right Column: Fields */}
        <div className="md:col-span-2 space-y-6 bg-card/10 backdrop-blur-sm p-6 rounded-2xl border border-border">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
            <div className="flex items-center gap-2 bg-background border border-input rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <User className="h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                className="bg-transparent border-none focus:ring-0 text-sm w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">About / Bio</label>
            <textarea 
              className="w-full min-h-[120px] bg-background border border-input rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Social Links</label>
            <div className="flex items-center gap-2 bg-background border border-input rounded-xl px-4 py-2 opacity-50 grayscale cursor-not-allowed">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">github.com/</span>
              <input disabled className="bg-transparent border-none focus:ring-0 text-sm w-full" placeholder="username" />
            </div>
            <div className="flex items-center gap-2 bg-background border border-input rounded-xl px-4 py-2 opacity-50 grayscale cursor-not-allowed">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">twitter.com/</span>
              <input disabled className="bg-transparent border-none focus:ring-0 text-sm w-full" placeholder="username" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
