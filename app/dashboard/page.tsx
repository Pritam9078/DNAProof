"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { motion } from "framer-motion";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Shield,
  UserPlus,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

import { useWallet } from "@/context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function DashboardOverview() {
  const { address, connected, walletInfo } = useWallet();
  const dbUser = walletInfo?.dbUser;
  const roles = walletInfo?.roles;
  const roleStatus = dbUser?.roleStatus || 'NONE';
  const isApproved = roleStatus === 'APPROVED';
  
  const isAdmin = roles?.isAdmin || dbUser?.isSuperAdmin || false;
  const isIssuer = roles?.isIssuer || false;

  // Fetch real statistics
  const { data: statsData } = useQuery<{
    total: number;
    verified: number;
    pending: number;
    revoked: number;
    nfts: number;
    avgRisk: number;
  }>({
    queryKey: ["/api/stats", address, isAdmin],
    queryFn: () => {
      // Admins see GLOBAL stats (no address param)
      const url = isAdmin ? "/api/stats" : `/api/stats?address=${address}`;
      return apiRequest("GET", url).then(res => res.json());
    },
    enabled: connected && (!!address || isAdmin) && isApproved,
    refetchInterval: 5000,
  });

  // Fetch recent documents
  const { data: docsData } = useQuery<any[]>({
    queryKey: ["/api/documents", address, isAdmin],
    queryFn: () => {
      const url = isAdmin ? "/api/documents" : `/api/documents/${address}`;
      return apiRequest("GET", url).then(res => res.json());
    },
    enabled: connected && (!!address || isAdmin) && isApproved,
    refetchInterval: 3000,
  });

  // Fetch live logs
  const { data: logsData } = useQuery<any[]>({
    queryKey: ["/api/audit-logs", address, isAdmin],
    queryFn: () => {
      const url = isAdmin ? "/api/audit-logs" : `/api/audit-logs/${address}`;
      return apiRequest("GET", url).then(res => res.json());
    },
    enabled: connected && (!!address || isAdmin) && isApproved,
    refetchInterval: 5000,
  });

  const isLoadingStats = !statsData;
  const isLoadingDocs = !docsData;
  const isLoadingLogs = !logsData;

  if (!isApproved && connected) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12 space-y-12">
          {/* Welcome Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6"
            >
              <ShieldCheck className="text-primary w-10 h-10" />
            </motion.div>
            <h1 className="text-4xl font-bold tracking-tight">Welcome to DNAProof</h1>
            <p className="text-foreground/60 max-w-xl mx-auto">
              You're currently in Guest mode. To start registering documents or managing your organization, 
              please apply for access or choose a plan.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Link href="/dashboard/verify">
                <Card className="glass-card border-white/5 hover:border-primary/50 transition-all cursor-pointer h-full group relative overflow-hidden">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                      <ShieldCheck className="text-blue-500 w-6 h-6" />
                    </div>
                    <CardTitle className="mt-4 relative z-10">Verify Document</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-sm text-foreground/40">Check the authenticity of any document on the blockchain.</p>
                  </CardContent>
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                </Card>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Link href="/dashboard/apply">
                <Card className="glass-card border-white/5 hover:border-primary/50 transition-all cursor-pointer h-full group relative overflow-hidden">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                      <UserPlus className="text-primary w-6 h-6" />
                    </div>
                    <CardTitle className="mt-4 relative z-10">Apply for Access</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-sm text-foreground/40">Become an Issuer or Admin to start registering your own documents.</p>
                  </CardContent>
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                </Card>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link href="/dashboard/pricing">
                <Card className="glass-card border-white/5 hover:border-primary/50 transition-all cursor-pointer h-full group relative overflow-hidden">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                      <CreditCard className="text-purple-500 w-6 h-6" />
                    </div>
                    <CardTitle className="mt-4 relative z-10">View Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-sm text-foreground/40">Explore our lifetime plans for individuals and organizations.</p>
                  </CardContent>
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                </Card>
              </Link>
            </motion.div>
          </div>

          {/* Status Message */}
          {roleStatus === 'PENDING' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Clock className="text-yellow-500 w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-yellow-500">Application Under Review</h3>
                <p className="text-sm text-foreground/60 mt-1">
                  We've received your request for the <strong>{dbUser?.requestedRole}</strong> role. 
                  The Super Admin is currently reviewing your details and payment.
                </p>
              </div>
              <Button variant="outline" className="border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10">
                Check Status
              </Button>
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: "Total Documents", value: statsData?.total || 0, icon: FileText, color: "text-blue-500" },
    { label: "Verified", value: statsData?.verified || 0, icon: CheckCircle, color: "text-green-500" },
    { label: "NFTs Certified", value: statsData?.nfts || 0, icon: ShieldCheck, color: "text-amber-500" },
    { label: "AI Safety Score", value: `${100 - (statsData?.avgRisk || 0)}%`, icon: Shield, color: "text-primary" },
  ];

  const recentDocs = (docsData || []).slice(0, 3).map((doc: any) => ({
    id: doc._id,
    name: doc.name || `Document_${doc.hash.substring(0, 8)}`,
    type: doc.docType || "Legal",
    status: doc.status === "ACTIVE" ? "Verified" : doc.status === "PENDING" ? "Pending" : "Revoked",
    date: new Date(doc.createdAt).toLocaleDateString(),
    hash: `${doc.hash.substring(0, 6)}...${doc.hash.substring(doc.hash.length - 4)}`
  }));

  const liveLogs = (logsData || []).slice(0, 4).map((log: any) => ({
    action: log.action.replace(/_/g, " "),
    status: log.txHash ? "Confirmed" : "Success",
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const displayLogs = liveLogs.length > 0 ? liveLogs : [
    { action: "Doc Hash Sync", status: "Success", time: "12:45 PM" },
    { action: "Fabric Private Key", status: "Linked", time: "12:40 PM" },
    { action: "Ethereum Sepolia", status: "Confirmed", time: "12:30 PM" },
    { action: "IPFS Gateway", status: "Online", time: "12:15 PM" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isAdmin ? "Super Admin Console" : isIssuer ? "Issuer Dashboard" : "User Overview"}
              </h1>
              <p className="text-foreground/40 mt-1">
                {isAdmin 
                  ? "System-wide monitoring and access control." 
                  : isIssuer 
                  ? "Manage your document issuance and templates." 
                  : "Welcome back. Here's your verification activity."}
              </p>
           </div>
           
           {(isAdmin || isIssuer) && (
             <Link href="/dashboard/register">
               <Button className="gap-2 neon-glow h-11 px-6 rounded-xl">
                 <Plus className="w-5 h-5" />
                 New Document
               </Button>
             </Link>
           )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {isLoadingStats ? (
             Array(4).fill(0).map((_, i) => (
               <Card key={i} className="glass-card border-white/5 overflow-hidden">
                 <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-5 w-5 rounded-md" />
                 </CardHeader>
                 <CardContent>
                   <Skeleton className="h-8 w-16 mb-2" />
                   <Skeleton className="h-3 w-28" />
                 </CardContent>
               </Card>
             ))
           ) : (
             stats.map((stat, i) => (
               <motion.div
                 key={stat.label}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
               >
                 <Card className="glass-card border-white/5 overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/40 italic">{stat.label}</CardTitle>
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black group-hover:scale-110 transition-transform">{stat.value}</div>
                      <div className="flex items-center gap-1 text-xs text-green-500 mt-2">
                         <ArrowUpRight className="w-3 h-3" />
                         <span>+12% from last wk</span>
                      </div>
                    </CardContent>
                 </Card>
               </motion.div>
             ))
           )}
        </div>

        {/* Tables/Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 glass-card border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="text-xl font-bold">Recent Documents</CardTitle>
                 <Link href="/dashboard/documents">
                    <Button variant="ghost" size="sm" className="text-xs text-primary">View All</Button>
                 </Link>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {isLoadingDocs ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                           <div className="flex items-center gap-4 flex-1">
                              <Skeleton className="w-10 h-10 rounded-lg" />
                              <div className="flex-1">
                                 <Skeleton className="h-4 w-1/3 mb-2" />
                                 <Skeleton className="h-3 w-1/2" />
                              </div>
                           </div>
                           <div className="text-right">
                              <Skeleton className="h-5 w-16 rounded-full ml-auto mb-2" />
                              <Skeleton className="h-3 w-12 ml-auto" />
                           </div>
                        </div>
                      ))
                    ) : (
                      recentDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                 <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                 <p className="font-bold text-sm group-hover:text-primary transition-colors">{doc.name}</p>
                                 <div className="flex items-center gap-2 text-xs text-foreground/30 mt-1">
                                    <span>{doc.type}</span>
                                    <span>•</span>
                                    <span>{doc.hash}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={cn(
                                 "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                                 doc.status === "Verified" ? "bg-green-500/10 text-green-500" :
                                 doc.status === "Pending" ? "bg-yellow-500/10 text-yellow-500" :
                                 "bg-red-500/10 text-red-500"
                              )}>
                                 {doc.status}
                              </p>
                              <p className="text-[10px] text-foreground/20 mt-1">{doc.date}</p>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </CardContent>
           </Card>

           <Card className="glass-card border-white/5">
              <CardHeader>
                 <CardTitle className="text-xl font-bold">Live Logs</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-6 relative">
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-white/5" />
                    {isLoadingLogs ? (
                      Array(4).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-6 relative">
                           <Skeleton className="w-8 h-8 rounded-full z-10 shrink-0" />
                           <div className="flex-1 min-w-0">
                              <Skeleton className="h-4 w-full mb-1" />
                              <Skeleton className="h-3 w-1/2" />
                           </div>
                        </div>
                      ))
                    ) : (
                      displayLogs.map((log, i) => (
                        <div key={i} className="flex items-center gap-6 relative">
                           <div className="w-8 h-8 rounded-full bg-[#0B0F19] border border-primary/30 flex items-center justify-center z-10 shrink-0">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{log.action}</p>
                              <p className="text-xs text-foreground/30">{log.status}</p>
                           </div>
                           <span className="text-[10px] text-foreground/20 italic">{log.time}</span>
                        </div>
                      ))
                    )}
                 </div>
                 <Button className="w-full mt-8 border-white/10 hover:bg-white/5" variant="outline">
                    Full Audit Trail
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
