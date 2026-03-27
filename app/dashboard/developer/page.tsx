"use client";

import React, { useState, useEffect } from "react";
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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function DeveloperPage() {
  const { sdk, isInitialized, error } = useSDK();
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const sdkCode = `import { DNAProofSDK } from "@dnaproof/sdk";

// 1. Initialize with your configuration
const sdk = new DNAProofSDK({
  ethereum: {
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
    accessControlAddress: process.env.NEXT_PUBLIC_AC_ADDRESS
  },
  ipfs: {
    gatewayUrl: "https://api.pinata.cloud/psa",
    authHeader: \`Bearer \${process.env.PINATA_JWT}\`
  }
});

// 2. Start the engine
await sdk.init();

// 3. Register your first document
const hash = await sdk.registerDocument(file, {
  docType: "OFFICIAL_TRANSCRIPT",
  issuerName: "University of DNA"
});

console.log(\`Success! Hash: \${hash}\`);`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sdkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied to clipboard!");
  };

  const steps = [
    { label: "Hashing Content", icon: Search },
    { label: "IPFS Pinning", icon: Zap },
    { label: "Blockchain Anchor", icon: ShieldCheck },
    { label: "Fabric Metadata", icon: Layers }
  ];

  const simulateRegistration = async () => {
    if (!isInitialized) return;
    setIsSimulating(true);
    setActiveHash(null);
    setSimulationStep(0);

    for (let i = 1; i <= steps.length; i++) {
      setSimulationStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }

    const mockHash = "0x" + Math.random().toString(16).slice(2, 66);
    setActiveHash(mockHash);
    setIsSimulating(false);
    toast.success("Sandbox: Document Registered successfully!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Developer Toolkit</h1>
            <p className="text-foreground/40 mt-1">
              Build on top of DNAProof with our modular, type-safe SDK.
            </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SDK Status Card */}
          <Card className="lg:col-span-4 glass-card border-white/5 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                SDK Engine
              </CardTitle>
              <CardDescription>Real-time runtime status for internal services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              <div className="p-5 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                 <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Initialization</p>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          isInitialized ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-yellow-500"
                        )} />
                        <span className="text-sm font-bold">{isInitialized ? "Active & Ready" : "Initializing..."}</span>
                      </div>
                    </div>
                    <Layers className={cn(
                      "w-6 h-6 transition-colors duration-500",
                      isInitialized ? "text-primary/50" : "text-foreground/10"
                    )} />
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Core Services</p>
                  {isInitialized && <span className="text-[10px] font-bold text-green-500 px-1.5 py-0.5 rounded bg-green-500/10">Connected</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Ethereum", detail: "Ethers v6", status: "online", color: "blue" },
                    { name: "IPFS", detail: "Pinata Cloud", status: "online", color: "cyan" },
                    { name: "Hyperledger", detail: "Fabric V2", status: "offline", color: "red" },
                    { name: "AccessControl", detail: "RBAC Module", status: "active", color: "primary" },
                  ].map((s) => (
                    <div key={s.name} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1 hover:border-white/10 transition-colors">
                      <p className="text-[11px] font-bold">{s.name}</p>
                      <p className="text-[9px] text-foreground/30 font-medium">{s.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6">
                <Button 
                  onClick={simulateRegistration}
                  disabled={isSimulating || !isInitialized}
                  className={cn(
                    "w-full h-12 rounded-xl border-0 transition-all duration-300 gap-2",
                    isSimulating ? "bg-white/10 text-white/50" : "bg-primary text-white neon-glow hover:scale-[1.02]"
                  )}
                >
                  {isSimulating ? <Terminal className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isSimulating ? "Processing Sandbox..." : "Run SDK Sandbox"}
                </Button>
                {error && <p className="text-[10px] text-red-500 mt-2 text-center uppercase font-black italic">{error}</p>}
                {!isInitialized && !error && <p className="text-[10px] text-foreground/20 mt-2 text-center uppercase font-black italic">Waiting for provider connection...</p>}
              </div>
            </CardContent>
          </Card>

          {/* Implementation Guide & Code Preview */}
          <Card className="lg:col-span-8 glass-card border-white/5 overflow-hidden flex flex-col">
            <Tabs defaultValue="typescript" className="w-full flex-1 flex flex-col">
              <div className="px-6 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <CardTitle className="text-xl font-bold">Implementation Guide</CardTitle>
                  <CardDescription>Modular snippets for quick ledger integration.</CardDescription>
                </div>
                <TabsList className="bg-[#0B0F19] border border-white/5 h-10 p-1 rounded-lg">
                  <TabsTrigger value="typescript" className="text-xs data-[state=active]:bg-primary px-4">TypeScript</TabsTrigger>
                  <TabsTrigger value="python" className="text-xs px-4" disabled>
                    Python <span className="ml-1 opacity-50 px-1 py-0.5 rounded border border-white/10 text-[8px]">BETA</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 flex flex-col">
                <TabsContent value="typescript" className="m-0 p-0 flex-1 flex flex-col">
                  <div className="relative group flex-1">
                    <pre className="absolute inset-0 m-0 bg-[#0B0F19]/50 p-6 font-mono text-sm overflow-auto text-green-400 selection:bg-green-500/20">
                      <code>{sdkCode}</code>
                    </pre>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleCopyCode}
                      className="absolute top-4 right-4 h-9 w-9 bg-black/40 border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 rounded-lg"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Simulation Results Bar */}
            <AnimatePresence>
               {(isSimulating || activeHash) && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: "auto", opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="bg-black/60 border-t border-white/5 p-6"
                 >
                   {isSimulating ? (
                      <div className="flex flex-col gap-4">
                         <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">SDK Engine Activity</span>
                            <span className="text-[10px] font-bold text-foreground/40">{Math.round((simulationStep / steps.length) * 100)}% Complete</span>
                         </div>
                         <div className="grid grid-cols-4 gap-2">
                            {steps.map((step, idx) => (
                              <div key={idx} className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-500",
                                simulationStep > idx ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/5 opacity-40"
                              )}>
                                <step.icon className={cn("w-4 h-4", simulationStep > idx ? "text-primary" : "text-foreground/30")} />
                                <span className={cn("text-[8px] font-bold uppercase", simulationStep > idx ? "text-primary" : "text-foreground/30")}>{step.label}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                   ) : activeHash && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-between bg-primary/5 border border-primary/20 p-4 rounded-2xl"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-in zoom-in duration-500">
                               <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Sandbox Document Registered</p>
                               <p className="text-xs font-mono text-white/80">{activeHash}</p>
                            </div>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/10 rounded-lg px-4 gap-2"
                            onClick={() => window.open(`/dashboard/verify?hash=${activeHash}`, '_blank')}
                         >
                            <ExternalLink className="w-3.0 h-3" />
                            Verify Record
                         </Button>
                      </motion.div>
                   )}
                 </motion.div>
               )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Features / Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[
            { 
              title: "Smart Authentication", 
              desc: "Abstracted wallet signing for Ethereum and certificated identities for Fabric ledger nodes.", 
              icon: Lock,
              color: "blue"
            },
            { 
              title: "Unified Ledger", 
              desc: "Write once to the SDK, atomically record across Ethereum Registry and Fabric metadata stores.", 
              icon: History,
              color: "primary"
            },
            { 
              title: "Immutable Audit", 
              desc: "Integrated audit logging service to track every verification, download, or access change.", 
              icon: ShieldCheck,
              color: "green"
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.4 }}
            >
              <Card className="glass-card border-white/5 hover:border-primary/50 transition-all duration-300 group cursor-default">
                <CardContent className="pt-8">
                  <div className="mb-5 relative">
                     <item.icon className="w-8 h-8 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                     <div className="absolute inset-0 w-12 h-12 bg-primary/10 blur-xl -translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-foreground/40 leading-relaxed font-medium">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
