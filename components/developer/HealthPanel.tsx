"use client";

import React from "react";
import { Check, AlertCircle, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthPanelProps {
  isInitialized: boolean;
}

export function HealthPanel({ isInitialized }: HealthPanelProps) {
  const envCheck = [
    { label: "IPFS Pinata JWT", exists: !!process.env.NEXT_PUBLIC_PINATA_JWT },
    { label: "Ethereum RPC", exists: !!process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL },
    { label: "Registry Addr", exists: !!process.env.NEXT_PUBLIC_REGISTRY_ADDRESS },
    { label: "Access Control", exists: !!process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS },
  ];

  return (
    <Card className="glass-card border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          SDK Engine Health
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              isInitialized ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" : "bg-yellow-500"
            )} />
            <span className="text-sm font-semibold tracking-wide">Runtime Status</span>
          </div>
          <span className="text-[11px] font-black uppercase text-foreground/30 px-3 py-1 rounded-full bg-white/5">
            {isInitialized ? "Online" : "Booting"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-1">
          {envCheck.map(env => (
            <div key={env.label} className="flex flex-col gap-1.5 border-l border-white/5 pl-3">
              <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">{env.label}</span>
              <div className="flex items-center gap-2">
                {env.exists ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] text-green-500/80 font-bold">READY</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[10px] text-red-500/80 font-bold">MISSING</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
