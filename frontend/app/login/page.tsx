"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Github, Chrome } from "lucide-react";

import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);

      if (!res.success) {
        if (res.requires2FA) {
          router.push(`/2fa?email=${encodeURIComponent(email)}&partialToken=${res.partialToken}`);
          return;
        }
        throw new Error(res.message);
      }

      toast.success("Logged in successfully!");
      router.push(callbackUrl);
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = (provider: "google" | "github") => {
    toast.error("Social login not configured yet.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Login to your account to continue
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => socialLogin("github")}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Github className="h-4 w-4" /> Github
          </button>
          <button
            onClick={() => socialLogin("google")}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Chrome className="h-4 w-4" /> Google
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-bold">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
