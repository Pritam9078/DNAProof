"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { motion } from "framer-motion";
import { 
  Activity, 
  Terminal, 
  Cpu, 
  Database, 
  Globe, 
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const auditLogs = [
  { event: "UUPS Upgrade Detected", platform: "Ethereum", time: "10 mins ago", status: "Stable", type: "SMART_CONTRACT" },
  { event: "Private Metadata Sync", platform: "Hyperledger", time: "25 mins ago", status: "Success", type: "LEDGER_SYNC" },
  { event: "IPFS Gateway Heartbeat", platform: "Off-chain", time: "45 mins ago", status: "Healthy", type: "STORAGE" },
  { event: "New Node Validator Joined", platform: "HL Fabric", time: "1 hour ago", status: "Confirmed", type: "NETWORK" },
  { event: "Encryption Key Rotation", platform: "System", time: "2 hours ago", status: "Success", type: "SECURITY" },
];

export default function AuditLogsPage() {
  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="space-y-8">
        <header>
           <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
           <p className="text-foreground/40 mt-1">Real-time transparency of the hybrid blockchain state and synchronization processes.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* System Health Cards */}
           <div className="lg:col-span-1 space-y-6">
              <Card className="glass-card border-white/5 bg-primary/5">
                 <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary/60 italic">Hybrid Sync Health</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                          <span>Eth-Sepolia Sync</span>
                          <span className="text-primary">98.4%</span>
                       </div>
                       <Progress value={98.4} className="h-1 bg-white/5" />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                          <span>Fabric Private State</span>
                          <span className="text-green-500">Synced</span>
                       </div>
                       <Progress value={100} className="h-1 bg-white/5" />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                          <span>Pinata IPFS Gateway</span>
                          <span className="text-cyan-500">Latency: 240ms</span>
                       </div>
                       <Progress value={85} className="h-1 bg-white/5" />
                    </div>
                 </CardContent>
              </Card>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                 <h4 className="font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Live Activity
                 </h4>
                 <div className="space-y-3">
                    {[
                      { label: "Req/min", val: "1,240", icon: Zap },
                      { label: "Active Nodes", val: "14", icon: Globe },
                      { label: "TPS (Peak)", val: "68", icon: Cpu },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                         <div className="flex items-center gap-3">
                            <stat.icon className="w-4 h-4 text-foreground/30" />
                            <span className="text-xs text-foreground/40">{stat.label}</span>
                         </div>
                         <span className="text-sm font-black">{stat.val}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Detailed Audit Stream */}
           <Card className="lg:col-span-2 glass-card border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-primary" />
                    Ledger Events
                 </CardTitle>
                 <Badge className="bg-primary/20 text-primary border-primary/20">LIVE STREAM</Badge>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4 font-mono">
                    {auditLogs.map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-primary/30 transition-all flex items-center justify-between"
                      >
                         <div className="flex items-center gap-4 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                            <div className="truncate">
                               <span className="text-primary mr-2">[{log.platform}]</span>
                               <span className="text-sm font-bold text-foreground/80">{log.event}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 text-xs font-black shrink-0">
                            <span className="text-foreground/20 italic">{log.time}</span>
                            <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px]">{log.status}</span>
                         </div>
                      </motion.div>
                    ))}
                 </div>
                 <Button className="w-full mt-8 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs gap-2">
                    <Database className="w-4 h-4" /> Load Archival Logs
                 </Button>
              </CardContent>
           </Card>
        </div>

        <section className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
           <Info className="w-6 h-6 text-blue-500 shrink-0" />
           <p className="text-sm text-blue-500/80 leading-relaxed">
             <strong>Compliance Note:</strong> These logs are cryptographically signed and archived for 7 years as per the internal data governance protocol. 
             They provide an immutable link between the public Ethereum state and the private Hyperledger Fabric identities.
           </p>
        </section>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
