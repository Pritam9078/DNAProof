"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useSDK } from "@/app/providers/SDKProvider";
import { 
  Terminal, 
  Activity, 
  BookOpen, 
  Github,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

// Modular Components
import { HealthPanel } from "@/components/developer/HealthPanel";
import { EventFeed } from "@/components/developer/EventFeed";
import { MethodExplorer } from "@/components/developer/MethodExplorer";
import { Sandbox } from "@/components/developer/Sandbox";
import { LogEntry } from "@/components/developer/types";

export default function DeveloperPage() {
  const { sdk, isInitialized, error: sdkError } = useSDK();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [verifyHash, setVerifyHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // --- SDK LOGGING SYSTEM ---
  const addLog = (message: string, level: LogEntry["level"] = "info") => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).slice(2, 11),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  useEffect(() => {
    if (isInitialized) {
      addLog("DNAProof SDK Engine initialized.", "success");
      addLog("Service: Registry (Sepolia) connected.", "info");
      addLog("Service: Pinata Gateway active.", "info");
    } else if (sdkError) {
      addLog(`Initialization Failure: ${sdkError}`, "error");
    }
  }, [isInitialized, sdkError]);

  // --- HANDLERS ---
  const runSimulation = async (method: string) => {
    setIsSimulating(true);
    addLog(`Simulation Start: ${method.toUpperCase()}`, "info");

    const steps = method === "register" ? [
      { msg: "Computing Keccak256 content hash...", delay: 800 },
      { msg: "Uploading to Pinata IPFS nodes...", delay: 1000 },
      { msg: "Anchoring CID to Ethereum Registry...", delay: 1200 },
      { msg: "Result: Hash 0x7a...f2e verified on-chain", level: "success" as const }
    ] : [
      { msg: `Querying registry for ${method} state...`, delay: 1000 },
      { msg: "Cryptographic proof match confirmed.", level: "success" as const }
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay || 500));
      addLog(step.msg, step.level || "info");
    }

    setIsSimulating(false);
    toast.success(`Simulation of ${method} complete`);
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyHash) return;
    
    setIsVerifying(true);
    addLog(`Manual Verify: Running on-chain check for ${verifyHash.slice(0, 10)}...`, "info");
    
    try {
      const result = sdk ? await sdk.verifyDocument(verifyHash) : false;
      await new Promise(r => setTimeout(r, 800)); // UI pacing
      
      if (result) {
        addLog("Status: VALID. Document hash exists.", "success");
        toast.success("Identity Verified On-Chain!");
      } else {
        addLog("Status: NOT FOUND. Registry check failed.", "warn");
        toast.error("Hash not found on-chain.");
      }
    } catch (err) {
      addLog(`Error: ${err instanceof Error ? err.message : "Unknown"}`, "error");
      toast.error("Verification error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-12 py-6 px-4 md:px-8">
        {/* Unified Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Developer Resources
             </div>
             <div>
                <h1 className="text-4xl font-black tracking-tighter text-white">Developer Toolkit</h1>
                <p className="text-sm text-foreground/40 mt-2 font-medium max-w-xl leading-relaxed">
                  Full-stack diagnostic suite for building with the DNAProof Hybrid Ledger. Monitor health, test SDK methods, and verify proofs in a clean, isolated environment.
                </p>
             </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
                variant="outline" 
                className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 h-12 px-6 rounded-2xl cursor-pointer text-xs font-bold transition-all"
                onClick={() => window.open("https://github.com/Pritam9078/DNAProof/blob/master/packages/sdk/README.md", "_blank")}
            >
              <BookOpen className="w-4 h-4 text-primary" />
              SDK Docs
            </Button>
            <Button 
                className="gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 h-12 px-6 rounded-2xl transition-all cursor-pointer text-xs font-bold"
                onClick={() => window.open("https://github.com/Pritam9078/DNAProof/tree/master/packages/sdk", "_blank")}
            >
              <Github className="w-4 h-4" />
              Source Code
            </Button>
          </div>
        </header>

        {/* Section 1: Engine Health */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <ChevronRight className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/20">01. System Diagnostics</h2>
           </div>
           <HealthPanel isInitialized={isInitialized} />
        </section>

        {/* Section 2: Method Explorer */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <ChevronRight className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/20">02. SDK Method Explorer</h2>
           </div>
           <MethodExplorer 
             isInitialized={isInitialized} 
             onSimulate={runSimulation} 
             isSimulating={isSimulating} 
           />
        </section>

        {/* Section 3: Verification Sandbox */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <ChevronRight className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/20">03. On-chain Verification</h2>
           </div>
           <Sandbox 
             verifyHash={verifyHash} 
             setVerifyHash={setVerifyHash} 
             onVerify={handleManualVerify} 
             isVerifying={isVerifying} 
             isInitialized={isInitialized} 
           />
        </section>

        {/* Section 4: Live Monitoring */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-1">
              <ChevronRight className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/20">04. Event Monitoring</h2>
           </div>
           <EventFeed logs={logs} onClear={() => setLogs([])} />
        </section>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/5">
           {[
             { label: "SDK Version", value: "v1.0.4-beta", icon: Activity },
             { label: "RPC Status", value: "Sepolia Online", icon: Terminal },
             { label: "IPFS Gateway", value: "Pinata Cloud", icon: Activity },
             { label: "Provider", value: "Ethers.js v6", icon: Activity },
           ].map(stat => (
             <div key={stat.label} className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20">{stat.label}</p>
                <p className="text-sm font-bold text-foreground/60">{stat.value}</p>
             </div>
           ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
