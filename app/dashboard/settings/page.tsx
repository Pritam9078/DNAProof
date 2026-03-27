"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { 
  Network, 
  ShieldAlert, 
  Globe, 
  DownloadCloud,
  Database,
  Lock,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@/context/WalletContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { connected, chainId, switchNetwork } = useWallet();
  const [activeTab, setActiveTab] = React.useState("Network & RPC");
  const [signingRequired, setSigningRequired] = React.useState(false);
  const [autoLock, setAutoLock] = React.useState(true);

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    const savedSigning = localStorage.getItem("setting_require_signature");
    const savedAutoLock = localStorage.getItem("setting_auto_lock");
    if (savedSigning !== null) setSigningRequired(savedSigning === "true");
    if (savedAutoLock !== null) setAutoLock(savedAutoLock === "true");
  }, []);

  const handleToggleSigning = (checked: boolean) => {
    setSigningRequired(checked);
    localStorage.setItem("setting_require_signature", String(checked));
    toast.success(checked ? "Enhanced signing enabled" : "Enhanced signing disabled");
  };

  const handleToggleAutoLock = (checked: boolean) => {
    setAutoLock(checked);
    localStorage.setItem("setting_auto_lock", String(checked));
    toast.success(checked ? "Session auto-lock enabled" : "Session auto-lock disabled");
  };

  const handleExport = async () => {
    try {
      toast.loading("Fetching your document history...", { id: "export" });
      const response = await apiRequest("GET", "/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      
      const documents = await response.json();
      const exportData = {
        exportedAt: new Date().toISOString(),
        network: chainId === 11155111 ? "Sepolia" : "Unknown",
        documents: documents.map((d: any) => ({
          name: d.name,
          hash: d.hash,
          cid: d.cid,
          registeredAt: d.createdAt,
          status: d.status,
          registryId: d.docId
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dnaproof-export-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started!", { id: "export" });
    } catch (error) {
      toast.error("Failed to generate export", { id: "export" });
    }
  };

  const handleSwitchNetwork = async () => {
    if (chainId === 11155111) {
      toast.success("You are already on the correct network!");
      return;
    }
    const success = await switchNetwork();
    if (success) toast.success("Switched to Sepolia");
  };

  const menuItems = [
    { label: "Network & RPC", icon: Network },
    { label: "Security", icon: ShieldAlert },
    { label: "Data Management", icon: Database },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
           <h1 className="text-3xl font-bold tracking-tight">Application Settings</h1>
           <p className="text-foreground/40 mt-1">Configure your Web3 RPC networks, advanced security, and data handling.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <aside className="space-y-2 hidden md:block">
              {menuItems.map((item, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveTab(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    activeTab === item.label ? "bg-primary/10 text-primary neon-glow-sm" : "hover:bg-white/5 text-foreground/40"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
           </aside>

           <div className="md:col-span-3 space-y-8">
              {/* Network Settings */}
              {activeTab === "Network & RPC" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="glass-card border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Globe className="w-5 h-5 text-primary" /> Network Configuration
                        </CardTitle>
                        <CardDescription>Select the blockchain endpoint used for anchoring.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className={cn(
                          "p-4 rounded-xl border transition-all flex items-center justify-between",
                          chainId === 11155111 ? "border-primary/20 bg-primary/5" : "border-white/10 bg-white/5"
                        )}>
                          <div>
                              <p className={cn("text-sm font-bold", chainId === 11155111 ? "text-primary" : "text-white")}>
                                Ethereum Sepolia (Testnet)
                              </p>
                              <p className="text-xs font-mono text-foreground/40 mt-1">Chain ID: 11155111</p>
                          </div>
                          <Button 
                            variant={chainId === 11155111 ? "outline" : "default"} 
                            size="sm" 
                            onClick={handleSwitchNetwork}
                            className={cn(
                              "h-8 rounded-lg",
                              chainId === 11155111 ? "border-primary/30 text-primary hover:bg-primary/10" : "bg-primary text-white"
                            )}
                          >
                            {chainId === 11155111 ? "Active Network" : "Switch Network"}
                          </Button>
                        </div>

                        <div className="p-4 rounded-xl border border-white/5 bg-white/2 flex items-center justify-between opacity-50 relative overflow-hidden group">
                          <div>
                              <p className="text-sm font-bold">Ethereum Mainnet</p>
                              <p className="text-xs font-mono text-foreground/40 mt-1">Chain ID: 1</p>
                          </div>
                          <Button variant="outline" size="sm" disabled className="h-8 rounded-lg border-white/10">Coming Soon</Button>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-[#0B0F19] px-2 py-1 rounded">V2 ROADMAP</span>
                          </div>
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeTab === "Security" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="glass-card border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lock className="w-5 h-5 text-accent" /> Security Parameters
                        </CardTitle>
                        <CardDescription>Manage signing requirements and session controls.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="pr-4">
                              <p className="text-sm font-bold">Require Signature for every API action</p>
                              <p className="text-[10px] text-foreground/40 mt-1 leading-relaxed">
                                If enabled, your wallet will prompt you to cryptographically sign every read/write action, ignoring cached JWT sessions.
                              </p>
                          </div>
                          <Switch checked={signingRequired} onCheckedChange={handleToggleSigning} />
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-6">
                          <div className="pr-4">
                              <p className="text-sm font-bold">Auto-Lock Dashboard</p>
                              <p className="text-[10px] text-foreground/40 mt-1">Automatically log out and disconnect wallet after 15 minutes of inactivity.</p>
                          </div>
                          <Switch checked={autoLock} onCheckedChange={handleToggleAutoLock} />
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Data & Export */}
              {activeTab === "Data Management" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="glass-card border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-500" /> Data Management
                        </CardTitle>
                        <CardDescription>Export or control your off-chain data footprint.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                              <p className="text-sm font-bold">Export Audit History</p>
                              <p className="text-xs text-foreground/40 mt-1">Download a JSON bundle of all your registered hashes and CIDs.</p>
                          </div>
                          <Button onClick={handleExport} disabled={!connected} variant="outline" className="h-9 gap-2">
                            <DownloadCloud className="w-4 h-4" /> Download Export
                          </Button>
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

