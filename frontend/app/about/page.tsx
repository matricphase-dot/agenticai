import Link from "next/link";
import { ChevronRight, Target, Users, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Simple Nav */}
      <nav className="p-6 max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-black">AI</div>
          <span className="text-xl font-black tracking-tighter">AgenticAI</span>
        </Link>
        <Link href="/marketplace" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Marketplace</Link>
      </nav>

      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-6xl font-black mb-8">Our Mission</h1>
        <p className="text-2xl text-muted-foreground leading-relaxed mb-16">
          We are building the decentralized infrastructure for the autonomous economy. Our mission is to democratize access to high-performance AI agents and provide a transparent, community-owned platform for developers and node operators to thrive.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Focus</h3>
            <p className="text-muted-foreground">Empowering developers to build and monetize agents with zero friction.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Community</h3>
            <p className="text-muted-foreground">Owned and governed by the builders and stakers of the network.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Performance</h3>
            <p className="text-muted-foreground">Sub-50ms latency powered by a global decentralized node network.</p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-12 mb-24">
          <h2 className="text-3xl font-black mb-6">The Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-primary mb-2">Backend</div>
              <div className="text-muted-foreground text-sm">Node.js / Express<br />TypeScript<br />Prisma / Postgres</div>
            </div>
            <div>
              <div className="font-bold text-primary mb-2">Frontend</div>
              <div className="text-muted-foreground text-sm">Next.js 14<br />Tailwind CSS<br />Lucide Icons</div>
            </div>
            <div>
              <div className="font-bold text-primary mb-2">Compute</div>
              <div className="text-muted-foreground text-sm">Decentralized Nodes<br />BullMQ / Redis<br />Docker</div>
            </div>
            <div>
              <div className="font-bold text-primary mb-2">Intelligence</div>
              <div className="text-muted-foreground text-sm">OpenAI / Anthropic<br />Google Gemini<br />Custom Models</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-4xl font-black mb-8">Ready to start?</h2>
          <div className="flex justify-center gap-6">
            <Link href="/auth/signup" className="bg-primary text-white px-10 py-4 rounded-2xl font-black hover:scale-105 transition-all">Create Account</Link>
            <Link href="/marketplace" className="bg-white/5 border border-white/10 px-10 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-2">
              Marketplace <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
