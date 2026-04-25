"use client";

import Link from "next/link";
import { 
  Bot, 
  Zap, 
  Cpu, 
  Shield, 
  Globe, 
  Code, 
  ChevronRight, 
  Play, 
  Star 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-white selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-10 py-6 border-b border-white/5 sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-3xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black">AI</div>
          <span className="text-2xl font-black tracking-tighter">Agentic <span className="text-primary italic">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          <Link href="/marketplace" className="hover:text-primary transition-all">Marketplace</Link>
          <Link href="#features" className="hover:text-primary transition-all">Infrastructure</Link>
          <Link href="#governance" className="hover:text-primary transition-all">Governance</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-all">Login</Link>
          <Link href="/signup" className="bg-primary text-white px-8 py-3 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-10 py-32 flex flex-col items-center text-center space-y-10 overflow-hidden">
        <div className="absolute top-[20%] left-[50%] -translate-x-[50%] w-[1200px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] text-primary animate-in zoom-in-50 duration-500">
          Decentralized AI Infrastructure
        </div>

        <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.9] max-w-5xl animate-in slide-in-from-bottom-20 duration-700">
          The AWS for <br/><span className="text-primary italic">AI Agents.</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl font-medium animate-in slide-in-from-bottom-32 duration-1000">
          Create, deploy, scale, and monetize powerful AI agents on a global, community-owned compute network. 
        </p>

        <div className="flex flex-col md:flex-row items-center gap-6 pt-10">
          <Link href="/signup" className="flex items-center gap-3 bg-primary text-white px-12 py-5 rounded-[2rem] text-xl font-black hover:scale-110 hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] transition-all">
            Build Now <ChevronRight className="w-6 h-6" />
          </Link>
          <Link href="/marketplace" className="flex items-center gap-3 bg-white/5 border border-white/10 px-12 py-5 rounded-[2rem] text-xl font-bold hover:bg-white/10 transition-all">
            <Play className="w-5 h-5 fill-white" /> View Demo
          </Link>
        </div>

        {/* Floating Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-32 w-full max-w-6xl">
            {[
              { label: "Total Invocations", value: "24.8M+" },
              { label: "Global Nodes", value: "14,282" },
              { label: "Community Stakes", value: "$4.1M" },
              { label: "Uptime SLA", value: "99.98%" },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-4xl font-black">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-10 py-32 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-5xl font-black tracking-tight leading-none">Complete <span className="text-primary italic">Developer</span> Stack</h2>
              <p className="text-muted-foreground text-xl">Everything you need to build the next generation of autonomous AI applications.</p>
            </div>
            <Link href="/marketplace" className="text-primary font-bold uppercase tracking-widest hover:underline">Explore Infrastructure →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: "Agent Registry", icon: Bot, desc: "A decentralized repository for AI agents with version control and schema validation." },
              { title: "Compute Nodes", icon: Cpu, desc: "Global decentralized compute network. Scale from 1 to 10k nodes in seconds." },
              { title: "Invocation Gateway", icon: Zap, desc: "Sub-50ms latency for agent triggering with real-time analytics and monitoring." },
              { title: "Secrets Manager", icon: Shield, desc: "AES-256 encrypted storage for API keys and sensitive configuration files." },
              { title: "DAO Governance", icon: Globe, desc: "Stakers and developers vote on network fees and protocol upgrades." },
              { title: "Monetization", icon: Code, desc: "Built-in billing system with per-invocation or per-token revenue distribution." },
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-6 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-primary/5">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black leading-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed italic">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-10 py-20 border-t border-white/5">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-black text-xs">AI</div>
              <span className="text-xl font-black tracking-tighter">Agentic <span className="text-primary italic">AI</span></span>
            </div>
            <div className="flex gap-10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-all">GitHub</Link>
              <Link href="#" className="hover:text-primary transition-all">Documentation</Link>
              <Link href="#" className="hover:text-primary transition-all">Twitter</Link>
              <Link href="#" className="hover:text-primary transition-all">Status</Link>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted-foreground italic">© 2026 DECENTRALIZED PROTOCOL</p>
         </div>
      </footer>
    </div>
  );
}
