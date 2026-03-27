"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Building2, ShieldAlert, RefreshCw } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { grantRoleOnChain } from "@/lib/contractService";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface PendingRequest {
  _id: string;
  address: string;
  fullName: string;
  email: string;
  orgName: string;
  orgType: string;
  requestedRole: string;
  plan: string;
  paymentTxHash: string;
  createdAt: string;
  roleStatus: string;
}

export default function PendingRequestsPage() {
  const { address, walletInfo } = useWallet();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isSuperAdmin = walletInfo?.dbUser?.isSuperAdmin;

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("GET", "/api/super-admin/requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRequests();
    }
  }, [isSuperAdmin]);

  const handleAction = async (targetAddress: string, action: "APPROVE" | "REJECT", role?: string) => {
    setActionLoading(`${targetAddress}-${action}`);
    try {
      
      let txHash = null;
      if (action === "APPROVE" && role) {
         toast.loading("Please sign the transaction to grant the role on-chain...", { id: 'txToast' });
         txHash = await grantRoleOnChain(targetAddress, role);
         toast.success("Role granted on-chain!", { id: 'txToast' });
      }

      const res = await apiRequest("PATCH", `/api/super-admin/approve/${targetAddress}`, {
        action, 
        txHash 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(action === "APPROVE" ? "User approved and role granted!" : "Request rejected");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Action failed", { id: 'txToast' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={["admin"]}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
              <p className="text-foreground/40 mt-1">Review organizational details and verify blockchain payments before granting roles.</p>
            </div>
            <Button variant="outline" className="border-white/10 gap-2" onClick={fetchRequests}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="glass-card border-white/10 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                    <div className="lg:col-span-1 flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="lg:col-span-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="lg:col-span-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="lg:col-span-1 flex justify-end gap-3">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <Skeleton className="h-10 w-28 rounded-md" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <Card className="glass-card border-white/5">
              <CardContent className="p-12 flex flex-col items-center text-center gap-4">
                <Clock className="w-12 h-12 text-foreground/20" />
                <h3 className="text-lg font-medium text-foreground/60">No Pending Requests</h3>
                <p className="text-sm text-foreground/40">All caught up! There are no pending applications at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {requests.map((req, i) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="glass-card border-white/10 hover:border-primary/30 transition-all group overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                        {/* Organization Info */}
                        <div className="lg:col-span-1 border-r border-white/5 pr-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base truncate">{req.orgName}</h3>
                              <p className="text-[10px] text-foreground/40 uppercase tracking-widest">{req.orgType}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 px-2">
                            Role: {req.requestedRole}
                          </Badge>
                        </div>

                        {/* User & Contact Info */}
                        <div className="lg:col-span-1 border-r border-white/5 px-4 space-y-1">
                          <p className="text-xs font-bold">{req.fullName}</p>
                          <p className="text-[10px] text-foreground/40 truncate italic">{req.email}</p>
                          <p className="text-[10px] font-mono text-foreground/20 mt-2 truncate">{req.address}</p>
                        </div>

                        {/* Payment & Status */}
                        <div className="lg:col-span-1 px-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
                              <span>Plan: {req.plan}</span>
                              <span className="text-green-500">PAID</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-primary/20 transition-colors">
                              <p className="text-[9px] text-foreground/30 mb-0.5">TX HASH</p>
                              <p className="text-[10px] font-mono truncate">{req.paymentTxHash}</p>
                            </div>
                            <p className="text-[10px] text-foreground/30">
                              Applied: {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-1 flex items-center justify-end gap-3 pl-4">
                          <button
                            className="h-10 px-4 text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                            disabled={!!actionLoading}
                            onClick={() => handleAction(req.address, "REJECT")}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <Button
                            className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                            disabled={!!actionLoading}
                            onClick={() => handleAction(req.address, "APPROVE", req.requestedRole)}
                          >
                            {actionLoading === `${req.address}-APPROVE` ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
