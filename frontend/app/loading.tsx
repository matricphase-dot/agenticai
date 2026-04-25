import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
      <h2 className="mt-8 text-xl font-bold tracking-tight animate-pulse text-white/80">
        Loading AgenticAI...
      </h2>
    </div>
  );
}
