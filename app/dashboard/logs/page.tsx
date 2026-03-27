"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Filter,
  History,
  Shield,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  QrCode,
  UserCheck,
  LayoutTemplate,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@/context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const ACTION_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  DOCUMENT_ISSUED: { icon: FileText, color: "text-primary", label: "Document Issued" },
  DOCUMENT_VERIFIED: { icon: Shield, color: "text-green-500", label: "Document Verified" },
  DOCUMENT_REVOKED: { icon: XCircle, color: "text-red-500", label: "Document Revoked" },
  ROLE_REQUESTED: { icon: UserCheck, color: "text-yellow-500", label: "Role Requested" },
  ROLE_APPROVED: { icon: CheckCircle2, color: "text-green-500", label: "Role Approved" },
  ROLE_REJECTED: { icon: XCircle, color: "text-red-500", label: "Role Rejected" },
  TEMPLATE_CREATED: { icon: LayoutTemplate, color: "text-accent", label: "Template Created" },
};

export default function AuditLogsPage() {
  const { address, connected, walletInfo } = useWallet();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const isAdminOrAuditor = walletInfo?.roles?.isAdmin || walletInfo?.roles?.isAuditor;

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/audit-logs", address],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/audit-logs/${address}`);
      return res.json();
    },
    enabled: connected && !!address && isAdminOrAuditor,
  });

  const filteredLogs = (logs as any[]).filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch = log.action?.toLowerCase().includes(q) ||
      log.documentHash?.toLowerCase().includes(q) ||
      log.actor?.toLowerCase().includes(q) ||
      log.targetAddress?.toLowerCase().includes(q) ||
      log.metadata?.docType?.toLowerCase().includes(q);
      
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-foreground/40 mt-1">Immutable cryptographic timeline of all on-chain actions.</p>
          </div>

          {connected && isAdminOrAuditor && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="glass-card border-white/10 h-11 w-full sm:w-[180px] rounded-xl bg-transparent">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-foreground/40" />
                    <SelectValue placeholder="All Actions" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F19] border-white/10">
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="DOCUMENT_ISSUED">Document Issued</SelectItem>
                  <SelectItem value="DOCUMENT_VERIFIED">Document Verified</SelectItem>
                  <SelectItem value="DOCUMENT_REVOKED">Document Revoked</SelectItem>
                  <SelectItem value="ROLE_REQUESTED">Role Requested</SelectItem>
                  <SelectItem value="ROLE_APPROVED">Role Approved</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                <Input
                  placeholder="Search hash, address..."
                  className="glass-card border-white/10 h-11 w-full sm:w-[280px] pl-10 rounded-xl bg-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}
        </header>

        {!connected ? (
          <Card className="glass-card border-white/5">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <History className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-xl font-bold">Wallet Disconnected</h2>
              <p className="text-foreground/40 mt-2">Connect your wallet to view the audit timeline.</p>
            </CardContent>
          </Card>
        ) : !isAdminOrAuditor ? (
          <Card className="glass-card border-red-500/20 bg-red-500/5">
            <CardContent className="p-12 flex flex-col items-center text-center gap-4">
              <ShieldAlert className="w-16 h-16 text-red-500" />
              <h3 className="text-2xl font-bold text-red-500">Access Denied</h3>
              <p className="text-foreground/60 max-w-md">
                Your wallet does not have the <strong className="text-foreground">Auditor</strong> or <strong className="text-foreground">Admin</strong> role to view system audit logs.
              </p>
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="mt-4 border-white/10 hover:bg-white/5">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <Card className="glass-card border-white/5">
                <CardContent className="p-12 text-center">
                  <History className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground/60">No Audit Events Yet</h3>
                  <p className="text-sm text-foreground/40 mt-1">
                    {search ? "No results match your search." : "Actions like document issuance and role approvals will appear here."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative border-l-2 border-white/10 ml-4 md:ml-6 space-y-10 pb-8">
                {filteredLogs.map((log, i) => {
                  const meta = ACTION_META[log.action] || { icon: FileText, color: "text-foreground/50", label: log.action };
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="relative pl-8 md:pl-10 group"
                    >
                      {/* Timeline dot */}
                      <div className={cn("absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-[#0B0F19] flex items-center justify-center bg-[#0B0F19] group-hover:scale-125 transition-transform", meta.color)}>
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      </div>

                      <Card className="glass-card border-white/5 bg-gradient-to-r from-white/5 to-transparent hover:border-primary/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4", meta.color)} />
                                <h3 className="font-bold text-base">{meta.label}</h3>
                                {log.metadata?.docType && (
                                  <Badge variant="outline" className="text-[10px] border-white/10 text-foreground/50">
                                    {log.metadata.docType}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-3 mt-3 text-xs font-mono text-foreground/40">
                                {log.actor && (
                                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                                    <span className="text-primary">Actor:</span>
                                    {log.actor.substring(0, 10)}...
                                  </div>
                                )}
                                {log.documentHash && (
                                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                                    <span className="text-primary">Hash:</span>
                                    {log.documentHash.substring(0, 12)}...
                                  </div>
                                )}
                                {log.ipfsCid && (
                                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                                    <span className="text-accent">CID:</span>
                                    {log.ipfsCid.substring(0, 12)}...
                                  </div>
                                )}
                                {log.targetAddress && (
                                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
                                    <span className="text-green-400">Target:</span>
                                    {log.targetAddress.substring(0, 10)}...
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                              <div className="flex items-center gap-1.5 text-xs text-foreground/40 bg-white/5 px-3 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
