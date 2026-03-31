"use client";

import React from "react";
import { ShieldCheck, Search, Activity, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SandboxProps {
  verifyHash: string;
  setVerifyHash: (hash: string) => void;
  onVerify: (e: React.FormEvent) => Promise<void>;
  isVerifying: boolean;
  isInitialized: boolean;
}

export function Sandbox({ 
  verifyHash, 
  setVerifyHash, 
  onVerify, 
  isVerifying, 
  isInitialized 
}: SandboxProps) {
  return (
    <Card className="glass-card border-white/5 overflow-hidden">
      <CardHeader className="pb-6 border-b border-white/5 bg-black/30">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-white">On-chain Verification Sandbox</CardTitle>
            <CardDescription className="text-sm text-foreground/40 font-medium">Directly query the Sepolia registry with any hex document hash to check existence and validity status.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={onVerify} className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-5 items-end">
            <div className="flex-1 w-full space-y-2.5">
              <Label 
                htmlFor="hash-input" 
                className="text-[11px] font-black uppercase text-foreground/30 ml-1 tracking-[0.2em]"
              >
                Document SHA-256 Hash
              </Label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-colors" />
                <Input 
                  id="hash-input"
                  placeholder="0x7a4f..." 
                  className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl focus:border-primary/50 focus:ring-primary/20 transition-all font-mono text-sm tracking-widest"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isVerifying || !isInitialized || !verifyHash}
              className={cn(
                "h-14 px-10 rounded-2xl transition-all duration-300 gap-3 font-bold uppercase tracking-wider",
                isVerifying || !isInitialized || !verifyHash
                  ? "bg-white/5 border border-white/10 text-white/20"
                  : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10"
              )}
            >
              {isVerifying ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify On-Chain</span>
                </>
              )}
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-3 px-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
             <p className="text-[11px] text-foreground/30 font-medium italic">
                Registry Contract: <span className="text-primary/40 underline font-mono cursor-pointer">{process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "Not Configured"}</span>
             </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
