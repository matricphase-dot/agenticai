import Link from "next/link";
import { Terminal, Code, BookOpen, Key, ChevronRight } from "lucide-react";

export default function DocsPage() {
  const baseUrl = "https://agenticai-backend-xao9.onrender.com";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="p-6 max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-black">AI</div>
          <span className="text-xl font-black tracking-tighter">AgenticAI</span>
        </Link>
        <Link href="/dashboard" className="bg-primary px-6 py-2 rounded-xl font-bold text-sm">Dashboard</Link>
      </nav>

      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 text-primary font-bold uppercase tracking-[0.2em] text-xs mb-6">
          <BookOpen className="w-4 h-4" /> Documentation
        </div>
        <h1 className="text-6xl font-black mb-8">API Reference</h1>
        <p className="text-xl text-muted-foreground leading-relaxed mb-16">
          Learn how to integrate AgenticAI into your applications. Our REST API allows you to invoke any agent, manage keys, and track usage programmatically.
        </p>

        <div className="space-y-16">
          {/* Base URL */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-4">
              <Terminal className="w-8 h-8 text-primary" /> Base URL
            </h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 font-mono text-primary break-all">
              {baseUrl}/api
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-4">
              <Key className="w-8 h-8 text-primary" /> Authentication
            </h2>
            <p className="text-muted-foreground">
              To use the API, you need an API key. You can generate one in your <Link href="/dashboard/settings" className="text-primary hover:underline">Dashboard Settings</Link>. 
              Pass the key in the <code className="text-primary">X-API-Key</code> header of your requests.
            </p>
          </div>

          {/* Invoking an Agent */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-4">
              <Code className="w-8 h-8 text-primary" /> Invoking an Agent
            </h2>
            <p className="text-muted-foreground mb-4">
              Send a POST request to the invocation endpoint with your agent ID and input parameters.
            </p>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">curl example</span>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded font-black">POST</span>
              </div>
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <pre className="text-white/80">
{`curl -X POST ${baseUrl}/api/invoke/{AGENT_ID} \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help me today?"
  }'`}
                </pre>
              </div>
            </div>
          </div>

          {/* Swagger Link */}
          <div className="pt-8">
            <Link 
              href={`${baseUrl}/api-docs`} 
              target="_blank"
              className="flex items-center justify-between p-8 bg-primary text-white rounded-[2rem] font-black text-2xl hover:shadow-[0_0_50px_rgba(124,58,237,0.4)] transition-all group"
            >
              Interactive API Docs (Swagger)
              <ChevronRight className="w-10 h-10 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
