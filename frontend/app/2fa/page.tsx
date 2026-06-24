"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

import { Suspense } from "react";

function TwoFactor() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const partialToken = searchParams.get("partialToken");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const res = await authApi.verify2FA(email, code, partialToken);

      if (!res.success) {
        throw new Error(res.message || "Invalid 2FA code.");
      }

      toast.success("2FA Verified!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Invalid 2FA code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="w-full max-w-md space-y-8 rounded-2xl border-2 border-primary/20 bg-card p-10 shadow-[0_0_50px_rgba(59,130,246,0.1)] text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Two-Factor Authentication</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              className="mt-1 block w-full rounded-lg border-2 border-input bg-background px-4 py-4 text-center text-3xl font-bold tracking-[1em] ring-offset-background focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-4 text-lg font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg hover:shadow-primary/25"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "Verify & Login"
            )}
          </button>
        </form>

        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
          Secure Session Initializing...
        </p>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TwoFactor />
    </Suspense>
  );
}
