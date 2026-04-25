import Link from "next/link";
import { MoveLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative">
        <h1 className="text-[12rem] font-black text-white/5 leading-none select-none">404</h1>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-primary/20 text-primary rounded-3xl flex items-center justify-center mb-6 animate-pulse">
            <Search className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black mb-2">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved to another dimension.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-12">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all group"
        >
          <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Go Home
        </Link>
        <Link 
          href="/marketplace" 
          className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
        >
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}
