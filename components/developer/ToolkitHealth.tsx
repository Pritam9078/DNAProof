import React from "react";
import { Server, Check, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolkitHealthProps {
  isInitialized: boolean;
  envAudit: { label: string; exists: boolean }[];
}

export const ToolkitHealth = ({ isInitialized, envAudit }: ToolkitHealthProps) => (
  <section className="space-y-4">
    <div className="flex items-center gap-2 px-1">
      <Server className="w-4 h-4 text-primary" />
      <h2 className="text-sm font-black uppercase tracking-widest text-foreground/40">Environment & Connectivity</h2>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Card className="glass-card border-white/5 lg:col-span-4 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground/50">Runtime Status</span>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                  isInitialized ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-yellow-500 border-yellow-500/20 bg-yellow-500/5"
                )}>
                  {isInitialized ? "Online" : "Booting"}
                </span>
             </div>
             <div className="flex items-center gap-4">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isInitialized ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)] animate-pulse" : "bg-yellow-500"
                )} />
                <span className="text-xl font-bold italic tracking-tight">{isInitialized ? "Engine Ready" : "Initializing Components..."}</span>
             </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/5 lg:col-span-8 overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
             {envAudit.map(env => (
               <div key={env.label} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors group">
                  <span className="text-[11px] font-medium text-foreground/60 group-hover:text-foreground/80 transition-colors uppercase tracking-tight">{env.label}</span>
                  {env.exists ? (
                    <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase">
                      <span className="hidden xl:inline">Connected</span>
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
                      <span className="hidden xl:inline">Action Required</span>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
               </div>
             ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);
