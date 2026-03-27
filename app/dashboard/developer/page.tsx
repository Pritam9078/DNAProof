"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useSDK } from "@/app/providers/SDKProvider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code2, 
  Terminal, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Play, 
  Copy, 
  Check, 
  ExternalLink,
  BookOpen,
  Github,
  Search,
  Zap,
  Lock,
  History,
  Info,
  Activity,
  Server,
  Key,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "error" | "warn";
  message: string;
}

export default function DeveloperPage() {
  const { sdk, isInitialized, error: sdkError } = useSDK();
  const [activeTab, setActiveTab] = useState("register");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [verifyHash, setVerifyHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- SDK LOGGING SYSTEM ---
  const addLog = (message: string, level: LogEntry["level"] = "info") => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).slice(2, 11),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  useEffect(() => {
    if (isInitialized) {
      addLog("DNAProof SDK Engine initialized successfully.", "success");
      addLog("Service: Ethereum Registry connection established.", "info");
      addLog("Service: Pinata IPFS Gateway connected.", "info");
    } else if (sdkError) {
      addLog(`SDK Initialization Failed: ${sdkError}`, "error");
    }
  }, [isInitialized, sdkError]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // --- SNIPPETS DATA ---
  const snippets: Record<string, string> = {
    register: `// Unified Registration
const metadata = {
  docType: "OFFICIAL_TRANSCRIPT",
  issuerName: "University of DNA",
  timestamp: Date.now()
};

const hash = await sdk.registerDocument(file, metadata);
addLog(\`Document Registered: \${hash}\`);`,

    verify: `// On-chain Verification
const isValid = await sdk.verifyDocument(hash);

if (isValid) {
  const details = await sdk.getDocument(hash);
  console.log("Integrity Verified!", details.cid);
}`,

    audit: `// Immutable Audit Trails
const logs = await sdk.getAuditLogs(hash);

logs.forEach(entry => {
  console.log(\`[\${entry.action}] by \${entry.user}\`);
});`,

    permissions: `// Decentralized Access Control
await sdk.access.grantRole(USER_ADDRESS, "VERIFIER");

const canVerify = await sdk.access.hasRole(
  USER_ADDRESS, 
  "VERIFIER"
);`
  };

  // --- HANDLERS ---
  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Snippet copied!");
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    addLog(`Starting simulation for method: ${activeTab.toUpperCase()}`, "info");

    if (activeTab === "register") {
      addLog("Step 1: Computing Keccak256 hash of document content...", "info");
      await new Promise(r => setTimeout(r, 800));
      addLog("Step 2: Uploading payload to Pinata IPFS pinned storage...", "info");
      await new Promise(r => setTimeout(r, 1000));
      addLog("Step 3: Anchoring CID to Ethereum Registry (Sepolia)...", "info");
      await new Promise(r => setTimeout(r, 1200));
      addLog("Result: Document anchored successfully at 0x7a...f2e", "success");
    } else if (activeTab === "verify") {
      addLog("Querying blockchain state for record integrity...", "info");
      await new Promise(r => setTimeout(r, 1000));
      addLog("Cryptographic proof valid. Match found on-chain.", "success");
    } else {
      addLog("Simulating internal service calls...", "info");
      await new Promise(r => setTimeout(r, 1500));
      addLog("Action completed within the decentralized network.", "success");
    }

    setIsSimulating(false);
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyHash) return;
    
    setIsVerifying(true);
    addLog(`Manual Verification: Checking hash ${verifyHash.slice(0, 10)}...`, "info");
    
    try {
      // Real SDK call if initialized
      const result = sdk ? await sdk.verifyDocument(verifyHash) : false;
      await new Promise(r => setTimeout(r, 1000)); // Just for UI feel
      
      if (result) {
        addLog("Verification Result: VALID. Document exists and is untampered.", "success");
        toast.success("Document Verified On-Chain!");
      } else {
        addLog("Verification Result: NOT FOUND. Hash doesn't exist on registry.", "warn");
        toast.error("Document not found on registry.");
      }
    } catch (err) {
      addLog(`Verification Error: ${err instanceof Error ? err.message : "Unknown"}`, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- RENDER ---
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                <Terminal className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Developer Toolkit</h1>
                <p className="text-foreground/40 mt-1 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                  Build, test, and deploy with the DNAProof Hybrid Ledger SDK.
                </p>
             </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
                variant="outline" 
                className="gap-2 border-white/5 bg-white/5 hover:bg-white/10 h-11 px-5 rounded-xl cursor-pointer"
                onClick={() => window.open("https://github.com/Pritam9078/DNAProof/blob/master/packages/sdk/README.md", "_blank")}
            >
              <BookOpen className="w-4 h-4 text-primary" />
              Documentation
            </Button>
            <Button 
                className="gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 h-11 px-5 rounded-xl transition-all cursor-pointer"
                onClick={() => window.open("https://github.com/Pritam9078/DNAProof/tree/master/packages/sdk", "_blank")}
            >
              <Github className="w-4 h-4" />
              View Source
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* L.H.S: Diagnostics & Health */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card border-white/5 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  SDK Engine Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isInitialized ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                      )} />
                      <span className="text-sm font-bold">Runtime Status</span>
                   </div>
                   <span className="text-[10px] font-black uppercase text-foreground/30">{isInitialized ? "Online" : "Booting"}</span>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-1 mb-3">Environment Audit</p>
                   {[
                     { label: "IPFS Pinata JWT", exists: !!process.env.NEXT_PUBLIC_PINATA_JWT },
                     { label: "Ethereum RPC", exists: !!process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL },
                     { label: "Registry Addr", exists: !!process.env.NEXT_PUBLIC_REGISTRY_ADDRESS },
                     { label: "Access Control", exists: !!process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS },
                   ].map(env => (
                     <div key={env.label} className="flex items-center justify-between px-1 py-1">
                        <span className="text-xs text-foreground/60 font-medium">{env.label}</span>
                        {env.exists ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5 overflow-hidden flex flex-col h-[340px]">
               <CardHeader className="pb-2 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-primary" />
                    Live Event Feed
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-foreground/20 hover:text-white"
                    onClick={() => setLogs([])}
                  >
                     <ChevronRight className="w-3 h-3 rotate-90" />
                  </Button>
               </CardHeader>
               <CardContent 
                 ref={scrollRef}
                 className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2 scrollbar-hide"
               >
                  {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-foreground/10 space-y-2 italic">
                       <Terminal className="w-8 h-8" />
                       <p>Listening for SDK events...</p>
                    </div>
                  )}
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-3 leading-relaxed animate-in fade-in slide-in-from-left-2 duration-300">
                       <span className="text-foreground/20 shrink-0">[{log.timestamp}]</span>
                       <span className={cn(
                          "font-bold uppercase shrink-0",
                          log.level === "success" ? "text-green-500" :
                          log.level === "error" ? "text-red-500" :
                          log.level === "warn" ? "text-yellow-500" : "text-primary/70"
                       )}>
                          {log.level}:
                       </span>
                       <span className="text-foreground/80 break-words">{log.message}</span>
                    </div>
                  ))}
               </CardContent>
            </Card>
          </div>

          {/* R.H.S: Method Explorer & Interactive Sandbox */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="glass-card border-white/5 overflow-hidden">
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <CardHeader className="p-0">
                     <div className="px-6 pt-6 flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <CardTitle className="text-xl font-bold">SDK Method Explorer</CardTitle>
                          <CardDescription className="text-xs mt-1">Select a service to see boilerplate code and test logic.</CardDescription>
                        </div>
                        <TabsList className="bg-black/40 border border-white/5 h-auto p-1 rounded-lg flex flex-wrap justify-start">
                          <TabsTrigger value="register" className="text-[10px] font-bold px-3 py-1.5 h-auto">Register</TabsTrigger>
                          <TabsTrigger value="verify" className="text-[10px] font-bold px-3 py-1.5 h-auto">Verify</TabsTrigger>
                          <TabsTrigger value="audit" className="text-[10px] font-bold px-3 py-1.5 h-auto">Audit</TabsTrigger>
                          <TabsTrigger value="permissions" className="text-[10px] font-bold px-3 py-1.5 h-auto">Access</TabsTrigger>
                        </TabsList>
                     </div>
                  </CardHeader>

                  <CardContent className="p-0">
                     <div className="grid grid-cols-1 md:grid-cols-5 min-h-[320px]">
                        {/* Snippet Header */}
                        <div className="p-6 bg-black/20 md:col-span-3 border-b md:border-b-0 md:border-r border-white/5 relative group flex flex-col">
                           <div className="flex items-center justify-between mb-4 shrink-0">
                              <div className="flex items-center gap-2">
                                 <Code2 className="w-4 h-4 text-primary" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Snippet Preview</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleCopyCode}
                                className="h-7 w-7 bg-white/5 border border-white/5 rounded-md hover:bg-white/10 shrink-0"
                              >
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </Button>
                           </div>
                           <pre className="text-[11px] md:text-xs font-mono text-green-400 leading-relaxed overflow-x-auto scrollbar-hide flex-1">
                              <code>{snippets[activeTab]}</code>
                           </pre>
                           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Interactive Sandbox Logic */}
                        <div className="p-6 md:p-8 flex flex-col justify-center bg-black/40 md:col-span-2">
                           <h3 className="text-base md:text-lg font-bold mb-2">Interactive Preview</h3>
                           <p className="text-xs text-foreground/40 mb-6 font-medium leading-relaxed">
                              Trigger a mock simulation to see how the SDK handles this method internally.
                           </p>
                           
                           <Button 
                              onClick={runSimulation}
                              disabled={isSimulating || !isInitialized}
                              className={cn(
                                "w-full h-11 md:h-12 rounded-xl transition-all duration-300 font-bold gap-2 text-[10px] sm:text-[11px] md:text-xs px-2 whitespace-nowrap",
                                isSimulating ? "bg-white/5 text-white/20 border border-white/5" : "bg-primary text-white neon-glow"
                              )}
                           >
                              {isSimulating ? <Activity className="w-4 h-4 animate-spin shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
                              <span className="truncate">{isSimulating ? "Processing..." : `Simulate ${activeTab.toUpperCase()}`}</span>
                           </Button>
                        </div>
                     </div>
                  </CardContent>
               </Tabs>
            </Card>

            {/* Verification Sandbox Form */}
            <Card className="glass-card border-white/5 overflow-hidden">
               <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                        <CardTitle className="text-lg font-bold">On-chain Verification Sandbox</CardTitle>
                        <CardDescription>Directly query the Sepolia registry with a hex document hash.</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent>
                  <form onSubmit={handleManualVerify} className="flex gap-3">
                     <div className="flex-1 space-y-1.5">
                        <Label htmlFor="hash-input" className="text-[10px] font-black uppercase text-foreground/30 ml-1">Document Hash</Label>
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                           <Input 
                              id="hash-input"
                              placeholder="0x..." 
                              className="bg-black/40 border-white/10 h-11 pl-10 rounded-xl focus:border-primary/50 transition-all font-mono text-sm"
                              value={verifyHash}
                              onChange={(e) => setVerifyHash(e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="self-end pt-6">
                        <Button 
                           type="submit" 
                           disabled={isVerifying || !isInitialized}
                           className="h-11 px-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all gap-2"
                        >
                           {isVerifying && <Activity className="w-3 h-3 animate-spin text-primary" />}
                           Verify On-Chain
                        </Button>
                     </div>
                  </form>
               </CardContent>
            </Card>
          </div>
        </div>

        {/* Global Footer Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[
             { label: "SDK Version", value: "v1.0.4-beta", icon: Info },
             { label: "API Latency", value: "240ms", icon: Activity },
             { label: "IPFS Gateway", value: "Pinata Cloud", icon: Key },
             { label: "Auth Provider", value: "Sepolia RPC", icon: ShieldCheck },
           ].map(stat => (
             <div key={stat.label} className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all">
                <stat.icon className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors" />
                <div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-foreground/20">{stat.label}</p>
                   <p className="text-xs font-bold">{stat.value}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
