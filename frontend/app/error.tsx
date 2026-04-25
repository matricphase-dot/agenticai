"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mb-8">
        <AlertCircle className="w-10 h-10" />
      </div>
      
      <h1 className="text-4xl font-black mb-4">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mb-10">
        We encountered an unexpected error. Our team has been notified.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/80 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
