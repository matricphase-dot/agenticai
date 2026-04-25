"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users2, 
  UserPlus, 
  Shield, 
  Settings, 
  Mail, 
  MoreHorizontal,
  MailPlus,
  ArrowRight,
  Bell
} from "lucide-react";

export default function TeamsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic">Team <span className="text-primary not-italic">Sync</span></h1>
          <p className="text-muted-foreground font-medium">Collaborate on agent deployments and infrastructure management.</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 border-white/5">
               <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                     <CardTitle className="text-lg font-black tracking-tight">Active Members</CardTitle>
                     <CardDescription>Everyone with access to the Fleet-01 infrastructure.</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-bold">4 Members</Badge>
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {[
                       { name: "John Doe", email: "john@agenticai.dev", role: "OWNER", status: "Active" },
                       { name: "Alice Smith", email: "alice@example.com", role: "ADMIN", status: "Active" },
                       { name: "Bob Johnson", email: "bob@example.com", role: "DEVELOPER", status: "Away" },
                       { name: "Charlie Davis", email: "charlie@example.com", role: "OPERATOR", status: "Offline" },
                     ].map((member, i) => (
                       <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/30 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                                {member.name.split(" ").map(n => n[0]).join("")}
                             </div>
                             <div>
                                <p className="text-sm font-bold group-hover:text-primary transition-colors">{member.name}</p>
                                <p className="text-[10px] text-muted-foreground font-medium italic">{member.email}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <Badge variant="outline" className="w-24 justify-center bg-muted/50 border-white/5 font-black text-[10px] tracking-widest">{member.role}</Badge>
                             <div className="flex items-center gap-2 w-20">
                                <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{member.status}</span>
                             </div>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                             </Button>
                          </div>
                       </div>
                     ))}
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/5">
                <CardHeader>
                   <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                      <MailPlus className="w-5 h-5 text-primary" /> Pending Requests
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="p-4 border border-border rounded-xl border-dashed text-center space-y-2">
                      <p className="text-sm font-bold text-muted-foreground italic">No outgoing invitations pending.</p>
                      <Button variant="link" className="text-xs font-black uppercase text-primary tracking-widest">View Invite History</Button>
                   </div>
                </CardContent>
            </Card>
         </div>

         <aside className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
               <CardHeader>
                  <CardTitle className="text-lg italic font-black text-primary">Fleet Roles</CardTitle>
                  <CardDescription>Configure role-based access control (RBAC).</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  {[
                    { role: "Owner", desc: "Full Protocol Access" },
                    { role: "Admin", desc: "Manage Members & Secrets" },
                    { role: "Developer", desc: "Deploy & Edit Agents" },
                    { role: "Operator", desc: "Monitor & Run Invocations" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <Shield className="w-4 h-4 text-primary" />
                       <div>
                          <p className="text-xs font-bold">{r.role}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{r.desc}</p>
                       </div>
                    </div>
                  ))}
                  <div className="pt-4">
                     <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-[0.2em] h-11 border-primary/20">
                        Edit Role Schema
                     </Button>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/5">
                <CardHeader>
                   <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" /> Team Shared Activity
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-3">
                      {[
                        { user: "Alice", action: "Updated API key", time: "2h ago" },
                        { user: "Bob", action: "Changed node status", time: "5h ago" },
                      ].map((a, i) => (
                        <div key={i} className="text-xs">
                           <p className="font-bold">{a.user} <span className="text-muted-foreground font-medium">{a.action}</span></p>
                           <p className="text-[10px] text-muted-foreground italic">{a.time}</p>
                        </div>
                      ))}
                   </div>
                   <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                      Full Audit Trail <ArrowRight className="w-3 h-3 ml-2" />
                   </Button>
                </CardContent>
            </Card>
         </aside>
      </div>
    </div>
  );
}
