"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://agenticai-backend-xao9.onrender.com'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Message sent! We'll get back to you soon.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-black">AI</div>
          <span className="text-xl font-black tracking-tighter">AgenticAI</span>
        </Link>
      </nav>

      <section className="py-20 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-10">
          <div>
            <h1 className="text-6xl font-black mb-6">Get in touch</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions about the platform, integration, or enterprise plans? Our team is here to help.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-white/[0.03] border border-white/10 rounded-3xl">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Email Us</div>
                <div className="text-muted-foreground text-sm">support@agenticai.dev</div>
              </div>
            </div>
            <div className="flex items-center gap-6 p-6 bg-white/[0.03] border border-white/10 rounded-3xl">
              <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold">Community</div>
                <div className="text-muted-foreground text-sm">Join our Discord server</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black mb-4">Message Received</h2>
              <p className="text-muted-foreground mb-8">Thank you for reaching out. We'll be in touch shortly.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-primary font-bold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                <input 
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                <input 
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                <textarea 
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send className="w-6 h-6" /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
