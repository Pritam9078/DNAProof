"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, ChevronRight, LayoutTemplate, ShieldAlert } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";

interface Template {
  _id: string;
  docType: string;
  description: string;
  fields: { name: string; type: string; required: boolean }[];
  createdAt: string;
}

export default function TemplatesPage() {
  const { address, walletInfo } = useWallet();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminOrIssuer = walletInfo?.roles?.isAdmin || walletInfo?.roles?.isIssuer;

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("GET", `/api/templates?createdBy=${address}`);
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address) fetchTemplates();
  }, [address]);

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/templates/${id}`);
      toast.success("Template archived");
      setTemplates(prev => prev.filter(t => t._id !== id));
    } catch {
      toast.error("Failed to archive template");
    }
  };

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={["admin", "issuer"]}>
        <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Templates</h1>
            <p className="text-foreground/40 mt-1">Define reusable document schemas for your organization.</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/admin/templates/new")}
            className="neon-glow rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="glass-card border-white/5">
            <CardContent className="p-12 flex flex-col items-center text-center gap-4">
              <LayoutTemplate className="w-12 h-12 text-foreground/20" />
              <h3 className="text-lg font-medium text-foreground/60">No Templates Yet</h3>
              <p className="text-sm text-foreground/40">Create a template to define the structure of your documents.</p>
              <Button onClick={() => router.push("/dashboard/admin/templates/new")} className="mt-2 gap-2">
                <Plus className="w-4 h-4" /> Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="glass-card border-white/10 hover:border-primary/40 transition-colors group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold">{t.docType}</h3>
                          <p className="text-xs text-foreground/40">{new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500/50 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {t.description && (
                      <p className="text-sm text-foreground/50 mb-3">{t.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {t.fields.slice(0, 4).map((f) => (
                        <Badge key={f.name} variant="outline" className="text-[10px] border-white/10 text-foreground/50">
                          {f.name} <span className="text-primary ml-1">({f.type})</span>
                        </Badge>
                      ))}
                      {t.fields.length > 4 && (
                        <Badge variant="outline" className="text-[10px] border-white/10 text-foreground/40">
                          +{t.fields.length - 4} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-primary/60 text-xs mt-4 group-hover:text-primary transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      {t.fields.length} fields defined
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
