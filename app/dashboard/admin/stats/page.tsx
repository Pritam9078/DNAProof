"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { motion } from "framer-motion";
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  TrendingUp,
  CreditCard,
  Building2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function AdminStatsPage() {
  const { walletInfo } = useWallet();
  const isSuperAdmin = walletInfo?.dbUser?.isSuperAdmin;

  const { data: globalStats, isLoading } = useQuery({
    queryKey: ["/api/super-admin/stats"],
    queryFn: () => apiRequest("GET", "/api/super-admin/stats").then(res => res.json()),
    enabled: !!isSuperAdmin,
    refetchInterval: 10000,
  });

  const metrics = [
    { label: "Total Users", value: globalStats?.totalUsers || 0, icon: Users, color: "text-blue-500", trend: "+5% this week" },
    { label: "Active Issuers", value: globalStats?.activeIssuers || 0, icon: Building2, color: "text-primary", trend: "+2 today" },
    { label: "Rev. (Sepolia)", value: `${globalStats?.totalRevenue || 0} ETH`, icon: CreditCard, color: "text-green-500", trend: "Lifetime" },
    { label: "Network Health", value: "99.9%", icon: Activity, color: "text-purple-500", trend: "Ethereum Sepolia" },
  ];

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
            <p className="text-foreground/40 mt-1">Real-time oversight of platform activity, user growth, and revenue.</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card border-white/5 overflow-hidden relative">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-bold uppercase tracking-tight text-foreground/40">{m.label}</CardTitle>
                    <m.icon className={cn("w-4 h-4", m.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tighter">{m.value}</div>
                    <p className="text-[10px] text-foreground/30 mt-1 font-medium">{m.trend}</p>
                  </CardContent>
                  <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-20 bg-current", m.color)} />
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Distribution */}
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Role Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: "Regular Users", count: globalStats?.counts?.USER || 0, color: "bg-blue-500" },
                  { label: "Issuers", count: globalStats?.counts?.ISSUER || 0, color: "bg-primary" },
                  { label: "Admins", count: globalStats?.counts?.ADMIN || 0, color: "bg-purple-500" },
                  { label: "Super Admins", count: globalStats?.counts?.SUPER_ADMIN || 1, color: "bg-green-500" },
                ].map((role) => {
                  const total = globalStats?.totalUsers || 1;
                  const percentage = (role.count / total) * 100;
                  return (
                    <div key={role.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground/60">{role.label}</span>
                        <span className="font-bold">{role.count}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percentage}%` }}
                          className={cn("h-full rounded-full", role.color)} 
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Activity Monitoring */}
            <Card className="glass-card border-white/5">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Latest Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {globalStats?.recentConversions?.map((conv: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold group-hover:text-primary transition-colors">{conv.address.substring(0, 10)}...</p>
                          <p className="text-[10px] text-foreground/40 uppercase">Gained {conv.newRole}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-foreground/20 italic">{new Date(conv.timestamp).toLocaleDateString()}</p>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-foreground/20 italic">
                      No recent role upgrades recorded.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
