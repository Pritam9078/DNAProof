"use client";

import React, { useState } from "react";
import { 
  Code2, 
  Play, 
  Copy, 
  Check, 
  Zap,
  Activity,
  ChevronRight,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface MethodExplorerProps {
  isInitialized: boolean;
  onSimulate: (method: string) => Promise<void>;
  isSimulating: boolean;
}

const methodData: Record<string, { title: string; description: string; snippet: string }> = {
  register: {
    title: "Document Registration",
    description: "Computes the SHA-256 hash of the document, uploads the payload to decentralized IPFS storage, and anchors the identity CID to the Ethereum Registry.",
    snippet: `// Unified Registration
const metadata = {
  docType: "OFFICIAL_TRANSCRIPT",
  issuerName: "University of DNA",
  timestamp: Date.now()
};

const hash = await sdk.registerDocument(file, metadata);
console.log("Success! Hash:", hash.slice(0, 10));`
  },
  verify: {
    title: "On-chain Verification",
    description: "Performs a cryptographic integrity check by comparing the local file hash against the verified on-chain registry state.",
    snippet: `// On-chain Verification
const isValid = await sdk.verifyDocument(hash);

if (isValid) {
  const details = await sdk.getDocument(hash);
  console.log("Integrity Verified!", details.cid);
}`
  },
  audit: {
    title: "Immutable Audit Logs",
    description: "Retrieves the full lifecycle history of a document identity, including registration, verification attempts, and field updates.",
    snippet: `// Immutable Audit Trails
const logs = await sdk.getAuditLogs(hash);

logs.forEach(entry => {
  console.log(\`[\${entry.action}] by \${entry.user}\`);
});`
  },
  permissions: {
    title: "RBAC Access Control",
    description: "Manages decentralized role-based access control (RBAC) permissions for verifiers, issuers, and system auditors.",
    snippet: `// Decentralized Access Control
await sdk.access.grantRole(USER_ADDRESS, "VERIFIER");

const canVerify = await sdk.access.hasRole(
  USER_ADDRESS, 
  "VERIFIER"
);`
  }
};

export function MethodExplorer({ isInitialized, onSimulate, isSimulating }: MethodExplorerProps) {
  const [activeTab, setActiveTab] = useState("register");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(methodData[activeTab].snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Snippet copied");
  };

  return (
    <Card className="glass-card border-white/5 overflow-hidden shadow-2xl w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] min-h-[520px] divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          
          {/* Column 1: Explorer Sidebar */}
          <div className="bg-black/40 p-5 flex flex-col gap-6 overflow-hidden">
             <div className="flex items-center gap-2 px-2">
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center border border-primary/20">
                   <Monitor className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Explorer</span>
             </div>
             
             <TabsList className="flex flex-col bg-transparent w-full h-auto p-0 gap-1.5 items-stretch">
                {Object.keys(methodData).map(method => (
                  <TabsTrigger 
                    key={method}
                    value={method} 
                    className={cn(
                      "justify-start h-11 px-4 rounded-lg text-xs font-bold transition-all border border-transparent gap-3 outline-none",
                      "data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20",
                      "hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      activeTab === method ? "bg-primary" : "bg-foreground/20"
                    )} />
                    <span className="capitalize truncate">{method}</span>
                    {activeTab === method && <ChevronRight className="w-3 h-3 ml-auto opacity-50 shrink-0" />}
                  </TabsTrigger>
                ))}
             </TabsList>
          </div>

          {/* Column 2: IDE / Code Viewport */}
          <div className="flex flex-col bg-black/20 min-w-0 overflow-hidden">
             {/* Window Header */}
             <div className="h-12 bg-black/40 border-b border-white/5 flex items-center justify-between px-5 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="flex gap-1.5 px-0.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md border border-white/5 shadow-inner">
                      <Code2 className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-[11px] font-bold text-foreground/50 italic tracking-tight">{activeTab}.ts</span>
                   </div>
                </div>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={handleCopyCode}
                   className="h-8 w-8 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:text-primary transition-colors"
                >
                   {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-white/30" />}
                </Button>
             </div>

             {/* Code View container with Scroll Guard */}
             <div className="flex-1 p-8 font-mono text-[13px] leading-relaxed overflow-x-auto relative group scrollbar-thin scrollbar-thumb-white/10">
                <pre className="text-foreground/80 min-w-fit">
                   {methodData[activeTab].snippet.split('\n').map((line, i) => {
                     const isComment = line.trim().startsWith('//');
                     const isConst = line.includes('const');
                     const isConsole = line.includes('console');
                     return (
                       <div key={i} className="flex gap-6 group/line hover:bg-white/2 transition-colors">
                          <span className="w-6 text-right select-none text-foreground/10 font-bold tabular-nums pr-3 border-r border-white/5">{i + 1}</span>
                          <span className={cn(
                            isComment ? "text-foreground/30 italic" : 
                            isConst ? "text-primary/70" : 
                            isConsole ? "text-yellow-500/80" : "text-foreground/70"
                          )}>
                             {line.split(' ').map((word, wi) => (
                                <span key={wi} className={cn(
                                   word.startsWith('sdk.') ? "text-primary font-bold underline decoration-primary/20 underline-offset-4" : "",
                                   word.startsWith('"') || word.startsWith('`') ? "text-green-500/80" : ""
                                )}>
                                   {word}{' '}
                                </span>
                             ))}
                          </span>
                       </div>
                     );
                   })}
                </pre>
                
                {/* Visual Glow Layer */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
             </div>
          </div>

          {/* Column 3: Action Panel */}
          <div className="bg-black/60 p-8 flex flex-col gap-8 overflow-hidden">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                      <Zap className="w-5 h-5 text-orange-500" />
                   </div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Proper Run</h3>
                </div>
                
                <p className="text-[13px] text-foreground/50 font-medium leading-relaxed">
                   {methodData[activeTab].description}
                </p>
                
                <div className="grid grid-cols-1 gap-3 p-5 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-foreground/20 uppercase tracking-[0.1em]">Target Layer</span>
                      <span className="text-[11px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">Ethereum</span>
                   </div>
                   <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[11px] font-bold text-foreground/20 uppercase tracking-[0.1em]">Execution</span>
                      <span className="text-[11px] font-black text-green-500 uppercase bg-green-500/5 px-2 py-0.5 rounded">Synchronous</span>
                   </div>
                </div>
             </div>

             <div className="mt-auto space-y-4">
                <Button 
                   onClick={() => onSimulate(activeTab)}
                   disabled={isSimulating || !isInitialized}
                   className={cn(
                      "w-full h-16 rounded-2xl transition-all duration-500 font-black gap-3 text-[13px] uppercase tracking-[0.2em] relative group overflow-hidden border-2",
                      isSimulating 
                         ? "bg-white/5 text-white/20 border-white/10" 
                         : "bg-primary text-white border-primary/20 hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)]"
                   )}
                >
                   {isSimulating ? (
                      <>
                         <Activity className="w-5 h-5 animate-spin shrink-0" />
                         <span className="z-10">Processing SDK...</span>
                      </>
                   ) : (
                      <>
                         <Play className="w-5 h-5 fill-current z-10 shrink-0" />
                         <span className="z-10">Run {activeTab.toUpperCase()} Engine</span>
                      </>
                   )}
                   {!isSimulating && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                   )}
                </Button>
                <p className="text-[10px] text-center text-foreground/10 font-bold uppercase tracking-[0.3em] px-4 leading-tight">
                   Transaction hash anchors to mainnet registry on success
                </p>
             </div>
          </div>
        </div>
      </Tabs>
    </Card>
  );
}
