"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { 
  ChevronRight, 
  ChevronLeft, 
  Bot, 
  Settings, 
  Code, 
  Cpu, 
  DollarSign, 
  CheckCircle,
  Braces,
  Zap
} from "lucide-react";

const steps = [
  { id: 1, name: "Basic Info", icon: Bot },
  { id: 2, name: "Model Config", icon: Settings },
  { id: 3, name: "Schema", icon: Code },
  { id: 4, name: "Compute", icon: Cpu },
  { id: 5, name: "Pricing", icon: DollarSign },
  { id: 6, name: "Review", icon: CheckCircle },
];

const categories = [
  { value: "CHATBOT", label: "Chatbot" },
  { value: "DATA_ANALYST", label: "Data Analyst" },
  { value: "CODE_ASSISTANT", label: "Code Assistant" },
  { value: "IMAGE_GENERATOR", label: "Image Generator" },
  { value: "RESEARCH", label: "Research" },
  { value: "AUTOMATION", label: "Automation" },
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
  { value: "FINANCE", label: "Finance" },
  { value: "LEGAL", label: "Legal" },
  { value: "OTHER", label: "Other" },
];

export function CreateAgentWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "CHATBOT",
    modelProvider: "openai",
    modelName: "gpt-4o",
    systemPrompt: "",
    inputSchema: '{\n  "type": "object",\n  "properties": {\n    "message": { "type": "string" }\n  }\n}',
    outputSchema: '{\n  "type": "object",\n  "properties": {\n    "response": { "type": "string" }\n  }\n}',
    cpuRequired: 1,
    ramRequired: 512,
    gpuRequired: false,
    pricingModel: "PER_INVOCATION",
    pricePerCall: 0.001,
    pricePerToken: 0,
    isPublic: true,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const generateSlug = (name: string) => 
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      await api.post("/api/agents", {
        ...formData,
        slug: generateSlug(formData.name),
        inputSchema: JSON.parse(formData.inputSchema),
        outputSchema: JSON.parse(formData.outputSchema),
      });
      toast.success("Agent created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to create agent");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-12">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                  isActive ? "bg-primary text-white scale-110 shadow-[0_0_15px_rgba(124,58,237,0.5)]" : 
                  isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`mt-2 text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {step.name}
              </span>
              {step.id !== steps.length && (
                <div className={`absolute top-5 left-[50%] w-full h-[2px] -z-0 ${isCompleted ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border p-8 rounded-xl shadow-xl min-h-[400px]">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-bold">Identity & Category</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Agent Name</label>
                <input 
                  className="w-full bg-background border border-input rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Sales Assistant Pro"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  className="w-full bg-background border border-input rounded-md px-4 py-2 mt-1 h-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="What does this agent do?"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="w-full bg-background border border-input rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Model Config */}
        {currentStep === 2 && (
          <div className="space-y-6 fade-in">
            <h2 className="text-2xl font-bold">Intelligence Engine</h2>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setFormData({...formData, modelProvider: "openai"})}
                className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-lg ${formData.modelProvider === "openai" ? "border-primary bg-primary/5 shadow-primary/10" : "border-border"}`}
              >
                <div className="font-bold">OpenAI</div>
                <div className="text-xs text-muted-foreground mt-1">GPT-4o, GPT-4, GPT-3.5</div>
              </div>
              <div className="p-4 border border-border/50 rounded-xl opacity-50 grayscale flex flex-col justify-center">
                <div className="font-bold">Anthropic</div>
                <div className="text-[10px] uppercase font-bold text-primary">Coming Soon</div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Model</label>
              <select
                className="w-full bg-background border border-input rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.modelName}
                onChange={(e) => setFormData({...formData, modelName: e.target.value})}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">System Prompt</label>
              <textarea 
                className="w-full bg-[#0d0d0d] text-green-400 font-mono text-sm border border-input rounded-md px-4 py-3 mt-1 h-64 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Talk to the agent, tell it how to behave..."
                value={formData.systemPrompt}
                onChange={(e) => setFormData({...formData, systemPrompt: e.target.value})}
              />
            </div>
          </div>
        )}

        {/* Step 3: Schema */}
        {currentStep === 3 && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center gap-3">
              <Braces className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Input / Output Schema</h2>
            </div>
            <p className="text-muted-foreground text-sm">Define the JSON schema for what your agent accepts and returns. This powers type validation on invocations.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Input Schema</label>
                <textarea 
                  className="w-full bg-[#0d0d0d] text-blue-400 font-mono text-sm border border-input rounded-xl px-4 py-3 mt-2 h-56 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.inputSchema}
                  onChange={(e) => setFormData({...formData, inputSchema: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Output Schema</label>
                <textarea 
                  className="w-full bg-[#0d0d0d] text-emerald-400 font-mono text-sm border border-input rounded-xl px-4 py-3 mt-2 h-56 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.outputSchema}
                  onChange={(e) => setFormData({...formData, outputSchema: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Compute */}
        {currentStep === 4 && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Compute Requirements</h2>
            </div>
            <p className="text-muted-foreground text-sm">Define the minimum hardware specs needed to run your agent on decentralized nodes.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CPU Cores</label>
                <input 
                  type="number" min="1" max="32"
                  className="w-full bg-background border border-input rounded-md px-4 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.cpuRequired}
                  onChange={(e) => setFormData({...formData, cpuRequired: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">RAM (MB)</label>
                <select
                  className="w-full bg-background border border-input rounded-md px-4 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.ramRequired}
                  onChange={(e) => setFormData({...formData, ramRequired: parseInt(e.target.value)})}
                >
                  <option value="256">256</option>
                  <option value="512">512</option>
                  <option value="1024">1024</option>
                  <option value="2048">2048</option>
                  <option value="4096">4096</option>
                </select>
              </div>
              <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GPU Required</label>
                <button 
                  onClick={() => setFormData({...formData, gpuRequired: !formData.gpuRequired})}
                  className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                    formData.gpuRequired 
                      ? "bg-primary text-white shadow-lg shadow-primary/30" 
                      : "bg-background border border-input text-muted-foreground"
                  }`}
                >
                  {formData.gpuRequired ? "✓ Required" : "Not Required"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Pricing */}
        {currentStep === 5 && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Monetization</h2>
            </div>
            <p className="text-muted-foreground text-sm">Set your agent&apos;s pricing model for the marketplace. Earnings are paid in platform credits.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: "FREE", label: "Free", desc: "No cost per use" },
                { value: "PER_INVOCATION", label: "Per Invocation", desc: "Flat fee per call" },
                { value: "PER_TOKEN", label: "Per Token", desc: "Usage-based pricing" },
              ].map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setFormData({...formData, pricingModel: pm.value})}
                  className={`p-6 rounded-2xl border text-left transition-all ${
                    formData.pricingModel === pm.value
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="font-bold text-lg">{pm.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{pm.desc}</div>
                </button>
              ))}
            </div>
            {formData.pricingModel === "PER_INVOCATION" && (
              <div>
                <label className="text-sm font-medium">Price Per Call (Credits)</label>
                <input 
                  type="number" step="0.001" min="0"
                  className="w-full bg-background border border-input rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.pricePerCall}
                  onChange={(e) => setFormData({...formData, pricePerCall: parseFloat(e.target.value) || 0})}
                />
              </div>
            )}
            {formData.pricingModel === "PER_TOKEN" && (
              <div>
                <label className="text-sm font-medium">Price Per 1K Tokens (Credits)</label>
                <input 
                  type="number" step="0.0001" min="0"
                  className="w-full bg-background border border-input rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.pricePerToken}
                  onChange={(e) => setFormData({...formData, pricePerToken: parseFloat(e.target.value) || 0})}
                />
              </div>
            )}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => setFormData({...formData, isPublic: !formData.isPublic})}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                  formData.isPublic
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                <Zap className="w-4 h-4" />
                {formData.isPublic ? "Listed on Marketplace" : "Private Agent"}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="space-y-6 fade-in">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-3xl font-bold">Ready to Deploy</h2>
              <p className="text-muted-foreground">Review your agent configuration and hit launch to deploy.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              {[
                { label: "Name", value: formData.name || "—" },
                { label: "Model", value: formData.modelName },
                { label: "Category", value: formData.category },
                { label: "Pricing", value: formData.pricingModel },
                { label: "CPU", value: `${formData.cpuRequired} Core${formData.cpuRequired > 1 ? 's' : ''}` },
                { label: "RAM", value: `${formData.ramRequired} MB` },
                { label: "GPU", value: formData.gpuRequired ? "Required" : "No" },
                { label: "Visibility", value: formData.isPublic ? "Public" : "Private" },
              ].map((item, i) => (
                <div key={i} className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{item.label}</span>
                  <div className="font-bold mt-1">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button 
          onClick={prevStep}
          disabled={currentStep === 1 || isLoading}
          className="flex items-center gap-2 px-6 py-2 rounded-md font-medium hover:bg-muted disabled:opacity-50 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {currentStep < steps.length ? (
          <button 
            onClick={nextStep}
            className="flex items-center gap-2 bg-primary text-white px-8 py-2 rounded-md font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={onSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-white px-10 py-3 rounded-md font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(124,58,237,0.4)]"
          >
            {isLoading ? "Deploying..." : "Launch Agent"}
          </button>
        )}
      </div>
    </div>
  );
}
