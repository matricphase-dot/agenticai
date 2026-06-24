"use client";

import { useEffect, useState } from "react";
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
  BarChart3, 
  Layers, 
  Wallet, 
  Menu,
  X,
  CheckCircle2
} from "lucide-react";
import { API_URL } from '@/lib/config';
import StatsBar from "@/components/StatsBar";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 selection:text-white">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 px-6 py-4 ${
        scrolled ? "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-transform">AI</div>
            <span className="text-2xl font-black tracking-tighter">Agentic<span className="text-primary italic">AI</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-primary transition-colors">Docs</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="px-6 py-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Sign In</Link>
            <Link href="/auth/signup" className="bg-primary text-white px-8 py-3 rounded-2xl font-black hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105 active:scale-95 transition-all">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-[#0a0a0a] border-b border-white/10 p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top-4">
            <Link href="#features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>Marketplace</Link>
            <Link href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)}>Docs</Link>
            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              <Link href="/auth/login" className="text-center font-bold">Sign In</Link>
              <Link href="/auth/signup" className="bg-primary text-center py-4 rounded-2xl font-black">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        
        <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] text-primary mb-8 animate-in zoom-in-50 duration-500">
          The Future of AI is Agentic
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-5xl mb-8 animate-in slide-in-from-bottom-20 duration-700">
          The Infrastructure Layer for the <br/><span className="text-primary italic">AI Agent Economy</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl font-medium mb-12 animate-in slide-in-from-bottom-32 duration-1000">
          Create, deploy, and monetize AI agents. Join the decentralized AI economy.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-20 animate-in fade-in duration-1000 delay-500">
          <Link href="/auth/signup" className="group flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl text-xl font-black hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all">
            Start Building Free <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/marketplace" className="flex items-center gap-3 bg-white/5 border border-white/10 px-10 py-5 rounded-2xl text-xl font-bold hover:bg-white/10 transition-all">
            Browse Marketplace
          </Link>
        </div>

        {/* Stats Bar */}
        <StatsBar />
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-white/10 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-8">
            Trusted by innovators at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale">
            <div className="text-2xl font-black font-serif">TechCrunch</div>
            <div className="text-2xl font-black tracking-tighter">WIRED</div>
            <div className="text-2xl font-black italic">The Verge</div>
            <div className="text-2xl font-bold font-mono">Y Combinator</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Everything you need <br />to <span className="text-primary italic">Scale AI</span></h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">A comprehensive stack for developers and node operators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { 
                title: "Agent Builder", 
                icon: Bot, 
                desc: "Build AI agents with no code. Connect any LLM, write a system prompt, deploy in minutes." 
              },
              { 
                title: "Marketplace", 
                icon: Globe, 
                desc: "Discover agents built by the community. Deploy with one click and integrate into your apps." 
              },
              { 
                title: "Instant Monetization", 
                icon: Wallet, 
                desc: "Set your own price per invocation. Keep 80% of all revenue generated by your agents automatically." 
              },
              { 
                title: "Developer API", 
                icon: Code, 
                desc: "Invoke any agent via REST API. Full OpenAPI docs and SDKs included for every agent." 
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white/[0.03] p-10 rounded-[2.5rem] border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed italic">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black mb-6">How it Works</h2>
            <p className="text-muted-foreground text-xl">Four steps to launch your AI empire.</p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 -z-10" />
            
            {[
              { title: "Create", desc: "Build your agent with our no-code wizard", icon: Layers },
              { title: "Deploy", desc: "Publish to the marketplace in one click", icon: Zap },
              { title: "Earn", desc: "Collect revenue every time someone uses your agent", icon: Wallet },
              { title: "Grow", desc: "Stakers back your agent, increasing its visibility", icon: BarChart3 },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-[#0a0a0a] border-4 border-primary rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Simple Pricing</h2>
            <p className="text-muted-foreground text-xl">Choose the plan that fits your needs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white/[0.03] p-10 rounded-[3rem] border border-white/10 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black">$0</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {['100 invocations/day', '1 active agent', 'Community support', 'Public marketplace'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="w-full py-4 rounded-2xl border border-white/20 font-bold text-center hover:bg-white/5 transition-all">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="bg-primary/5 p-10 rounded-[3rem] border-2 border-primary relative flex flex-col shadow-[0_0_50px_rgba(124,58,237,0.2)]">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Most Popular</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black">$29</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {['Unlimited invocations', '10 active agents', 'Priority support', 'Advanced analytics', 'Custom domain'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="w-full py-4 rounded-2xl bg-primary text-white font-black text-center hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all">Get Started</Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white/[0.03] p-10 rounded-[3rem] border border-white/10 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black">Custom</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {['Unlimited everything', 'Dedicated nodes', 'SLA guarantees', 'Custom contracts', '24/7 support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="w-full py-4 rounded-2xl border border-white/20 font-bold text-center hover:bg-white/5 transition-all">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-20">Loved by <span className="text-primary italic">Builders</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: "Sarah Chen", 
                role: "AI Developer", 
                quote: "Built and deployed my first agent in under 10 minutes. Already earning from it. This platform is exactly what the AI creator economy needed.",
                color: "bg-cyan-500/20 text-cyan-400"
              },
              { 
                name: "Marcus Johnson", 
                role: "Startup Founder", 
                quote: "We replaced our $500/month AI infrastructure with AgenticAI agents. Same quality, fraction of the cost, and we actually earn from sharing our agents.",
                color: "bg-purple-500/20 text-purple-400"
              },
              { 
                name: "Priya Patel", 
                role: "Data Scientist", 
                quote: "The staking mechanism is brilliant. I stake on the top data analysis agents and earn passive income while they do the work.",
                color: "bg-green-500/20 text-green-400"
              },
            ].map((t, i) => (
              <div key={i} className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                <div className="flex gap-1 mb-4 text-yellow-500 text-sm">⭐⭐⭐⭐⭐</div>
                <p className="text-xl mb-6 text-white/90 italic">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${t.color}`}>
                    {t.name.split(' ')[0][0]}{t.name.split(' ')[1][0]}
                  </div>
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-8">Ready to join the <br />AI agent economy?</h2>
          <p className="text-xl text-muted-foreground mb-12">Join thousands of builders, stakers, and node operators today.</p>
          <Link href="/auth/signup" className="bg-primary text-white px-12 py-6 rounded-3xl text-2xl font-black hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] transition-all inline-block">
            Get Started Free
          </Link>
          <p className="mt-8 text-sm text-muted-foreground uppercase tracking-widest font-bold">
            No credit card required · Free tier available · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div>
            <h4 className="font-bold uppercase tracking-widest text-primary mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/marketplace" className="hover:text-white">Marketplace</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Create Agent</Link></li>
              <li><Link href="/dashboard/staking" className="hover:text-white">Staking</Link></li>
              <li><Link href="/dashboard/governance" className="hover:text-white">Governance</Link></li>
              <li><Link href="/dashboard/nodes" className="hover:text-white">Nodes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-primary mb-6">Developers</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-white">API Docs</Link></li>
              <li><Link href="#" className="hover:text-white">SDK</Link></li>
              <li><Link href="#" className="hover:text-white">Smart Contracts</Link></li>
              <li><Link href="#" className="hover:text-white">Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-primary mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="#" className="hover:text-white">Blog</Link></li>
              <li><Link href="#" className="hover:text-white">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-primary mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-black">AI</div>
            <span className="text-xl font-black tracking-tighter">AgenticAI</span>
          </div>
          <p className="text-sm text-muted-foreground italic">© 2026 AgenticAI Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Discord</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
