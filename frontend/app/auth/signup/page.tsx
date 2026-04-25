"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, Lock, User, Github, Chrome } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/auth/signup", formData);
      toast.success("Account created! Please check your email to verify.");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.1),transparent)]">
      <Card className="w-full max-w-md border-white/5 bg-card/50 backdrop-blur-xl rounded-[1.5rem] overflow-hidden">
        <CardHeader className="space-y-4 pt-10 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black text-2xl">A</div>
          <CardTitle className="text-3xl font-black tracking-tighter">Initialize <span className="text-primary italic">Identity</span></CardTitle>
          <CardDescription>Join the infrastructure layer for the AI economy.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="John Doe" 
                  className="pl-10" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Protocol</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Security Key</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>
            <Button className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Provisioning..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-8 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="bg-[#0f0f0f] px-4 relative z-10">or connect with</span>
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="gap-2">
              <Github className="w-4 h-4" /> GitHub
            </Button>
            <Button variant="outline" className="gap-2">
              <Chrome className="w-4 h-4" /> Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pb-10 pt-2 justify-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline ml-1">Login</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
