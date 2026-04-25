"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Shield, Clock, ExternalLink, Filter, User, Terminal } from "lucide-react";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get<{ auditLogs?: any[] }>("/api/audit").then(res => setLogs(res.success && res.data?.auditLogs ? res.data.auditLogs : (res.success && Array.isArray(res.data) ? res.data : []))).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic">Audit <span className="text-primary not-italic">Trail</span></h1>
          <p className="text-muted-foreground font-medium">Immutable record of all protocol and state-changing operations.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="h-10 px-4 font-black text-[10px] uppercase tracking-[0.2em] border-primary/20 text-primary">
              <Shield className="w-3.5 h-3.5 mr-2" /> Compliance Verified
           </Badge>
        </div>
      </div>

      <Card className="bg-card/50 border-white/5">
         <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full border border-border">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Filter by Action</span>
               </div>
            </div>
         </CardHeader>
         <CardContent>
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
               {logs.length === 0 ? (
                 [1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-6 flex items-center justify-between animate-pulse">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted" />
                          <div className="space-y-2">
                             <div className="w-32 h-4 bg-muted rounded" />
                             <div className="w-24 h-3 bg-muted rounded" />
                          </div>
                       </div>
                       <div className="w-16 h-8 bg-muted rounded" />
                    </div>
                 ))
               ) : (
                 logs.map((log, i) => (
                   <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                            {log.action.includes("POST") ? <Terminal className="w-5 h-5" /> : <History className="w-5 h-5" />}
                         </div>
                         <div>
                            <p className="text-sm font-black group-hover:text-primary transition-colors">{log.action}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{log.entityType} • {log.ipAddress}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-8">
                         <div className="hidden lg:block text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">User Agent</p>
                            <p className="text-[10px] font-medium text-foreground italic truncate max-w-xs">{log.userAgent}</p>
                         </div>
                         <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end text-sm font-black">
                               <Clock className="w-3.5 h-3.5 text-primary" />
                               {new Date(log.createdAt).toLocaleString()}
                            </div>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-primary">
                               View Metadata <ExternalLink className="w-2.5 h-2.5 ml-1" />
                            </Button>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
