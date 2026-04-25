"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Suspense } from "react";

function VerifyEmail() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Missing token!");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        setSuccess("Email verified successfully!");
        toast.success("Email verified!");
        setTimeout(() => router.push("/login"), 2000);
      } catch (err: any) {
        setError(err.message || "Something went wrong!");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold tracking-tight">Email Verification</h1>

        <div className="flex flex-col items-center justify-center space-y-4">
          {!success && !error && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Verifying your email...</p>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center gap-2 text-green-500">
              <CheckCircle2 className="h-16 w-16" />
              <p className="text-lg font-semibold">{success}</p>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 text-destructive">
              <XCircle className="h-16 w-16" />
              <p className="text-lg font-semibold">{error}</p>
              <Link href="/login" className="text-primary hover:underline mt-4 text-sm font-bold">
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmail />
    </Suspense>
  );
}
