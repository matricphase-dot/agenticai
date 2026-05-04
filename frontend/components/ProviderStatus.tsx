"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, XCircle, Key } from "lucide-react";

interface ProviderHealth {
  name: string;
  available: boolean;
  hasKey: boolean;
  failureCount: number;
  circuitOpen: boolean;
}

export default function ProviderStatus() {
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await api.get("/stats/health/providers");
      setProviders((response.data as any) || []);
    } catch (error) {
      console.error("Failed to fetch provider health", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="animate-pulse h-48 bg-white/5 rounded-3xl" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {providers.map((p) => (
        <Card key={p.name} className="border-white/5 bg-card/50 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center capitalize">
              {p.name}
              {p.available ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : p.circuitOpen ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Status
              </span>
              <Badge variant={p.circuitOpen ? "destructive" : p.available ? "default" : "secondary"}>
                {p.circuitOpen ? "Circuit Open" : p.available ? "Online" : "Limited"}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Key className="w-4 h-4" /> API Key
              </span>
              <Badge variant={p.hasKey ? "outline" : "destructive"} className={p.hasKey ? "border-green-500/50 text-green-500" : ""}>
                {p.hasKey ? "Configured" : "Missing"}
              </Badge>
            </div>
            {p.failureCount > 0 && (
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-2">
                Recent Failures: {p.failureCount}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
