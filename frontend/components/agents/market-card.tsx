import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Zap, Star, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Agent } from "@/types";

export function AgentMarketCard({ agent }: { agent: Agent }) {
  return (
    <Card className="group relative overflow-hidden h-full flex flex-col hover:scale-[1.02] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Bot className="w-6 h-6" />
          </div>
          <Badge variant={agent.pricingModel === 'FREE' ? 'success' : 'info'}>
            {agent.pricingModel === 'FREE' ? 'Free' : `$${agent.pricePerCall}/call`}
          </Badge>
        </div>

        <h3 className="text-xl font-black mb-2 tracking-tight group-hover:text-primary transition-colors">{agent.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
          {agent.description}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Zap className="w-3.5 h-3.5" />
            <span>{agent.analytics?.totalInvocations.toLocaleString()} Calls</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            <span>{agent.analytics?.avgRating || 4.8} rating</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-md">{agent.category}</Badge>
          <Badge variant="outline" className="rounded-md">{agent.modelName}</Badge>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
              {String.fromCharCode(64 + i)}
            </div>
          ))}
          <div className="w-6 h-6 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
            +12
          </div>
        </div>
        <Link href={`/marketplace/${agent.id}`}>
          <Button size="sm" variant="ghost" className="gap-2 group/btn">
            Deploy <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
