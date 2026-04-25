"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Send, 
  Bot, 
  User, 
  RefreshCcw, 
  Cpu, 
  Zap, 
  Terminal 
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatSandbox({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post<any>(`/api/agents/${agentId}/chat`, {
        message: input,
      });
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: response.success && response.data ? (response.data.output || response.data.content || "Agent produced no output.") : (response.message || "Agent produced no output.")
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-border rounded-3xl overflow-hidden bg-card shadow-2xl">
      <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Sandbox Environment</span>
        </div>
        <button 
          onClick={() => setMessages([])}
          className="p-2 hover:bg-muted rounded-xl transition-all"
        >
          <RefreshCcw className="w-4 h-4 text-muted-foreground hover:rotate-180 transition-all duration-500" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot className="w-12 h-12 text-primary" />
            <p className="text-xl font-medium">Ready to test. Send a message to begin.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`p-3 rounded-2xl ${msg.role === "user" ? "bg-primary text-white" : "bg-muted text-foreground"}`}>
              {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-3xl ${
              msg.role === "user" ? "bg-primary/5 border border-primary/20 text-foreground" : "bg-muted/50 border border-border"
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-4">
             <div className="p-3 rounded-2xl bg-muted text-foreground animate-pulse">
                <Bot className="w-5 h-5" />
             </div>
             <div className="bg-muted/50 w-24 h-12 rounded-3xl animate-pulse border border-border" />
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-muted/20">
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40 transition-all">
          <input 
            className="flex-1 bg-transparent border-none outline-none text-lg py-1 px-2"
            placeholder="Ask your agent anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />
          <button 
            disabled={isLoading || !input.trim()}
            onClick={onSend}
            className="bg-primary text-white p-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
