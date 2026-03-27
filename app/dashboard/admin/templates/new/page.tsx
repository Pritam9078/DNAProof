"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowRight, LayoutTemplate, GripVertical, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";

const FIELD_TYPES = ["string", "number", "date", "boolean"];

interface TemplateField {
  id: string; // local only for keying
  name: string;
  type: string;
  required: boolean;
  placeholder: string;
}

export default function NewTemplatePage() {
  const { address } = useWallet();
  const router = useRouter();
  const [docType, setDocType] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([
    { id: crypto.randomUUID(), name: "", type: "string", required: true, placeholder: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

  const addField = () => {
    setFields(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: "", type: "string", required: true, placeholder: "" },
    ]);
  };

  const removeField = (id: string) => {
    if (fields.length === 1) return;
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: keyof TemplateField, value: any) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const handleSubmit = async () => {
    if (!docType) { toast.error("Template name is required"); return; }
    const validFields = fields.filter(f => f.name.trim());
    if (validFields.length === 0) { toast.error("Add at least one named field"); return; }

    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/templates", {
        createdBy: address,
        docType,
        description,
        fields: validFields.map(({ id, ...rest }) => rest), // strip local id
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Template "${docType}" created!`);
      setCreated(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (created) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card border-green-500/20 bg-green-500/5">
              <CardContent className="p-12 flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-400">Template Created!</h2>
                  <p className="text-foreground/50 mt-2">"{docType}" is now available for document issuance.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-white/10" onClick={() => router.push("/dashboard/admin/templates")}>
                    View All Templates
                  </Button>
                  <Button onClick={() => router.push("/dashboard/register")} className="neon-glow">
                    Issue a Document <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Document Template</h1>
          <p className="text-foreground/40 mt-1">Define the fields that will appear on your issued documents.</p>
        </div>

        <Card className="glass-card border-white/10">
          <CardContent className="p-8 space-y-6">
            {/* Template Meta */}
            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              <span className="font-bold">Template Details</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Document Type Name *</Label>
              <Input
                placeholder="e.g. Degree Certificate, Internship Letter, Medical Record"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="glass-card border-white/10 h-12 rounded-xl bg-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of what this template is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-card border-white/10 rounded-xl bg-transparent resize-none"
                rows={2}
              />
            </div>

            {/* Fields Builder */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                <span className="font-bold">Fields</span>
                <span className="text-xs text-foreground/40 bg-white/5 px-2 py-0.5 rounded-full">{fields.length}</span>
              </div>

              <AnimatePresence>
                {fields.map((field, i) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card border border-white/5 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground/30">
                        <GripVertical className="w-3 h-3" />
                        FIELD {i + 1}
                      </div>
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-red-500/40 hover:text-red-500 transition-colors"
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1 space-y-1">
                        <Label className="text-[10px] text-foreground/30 uppercase tracking-widest">Field Name *</Label>
                        <Input
                          placeholder="e.g. Student Name"
                          value={field.name}
                          onChange={(e) => updateField(field.id, "name", e.target.value)}
                          className="glass-card border-white/10 h-10 rounded-xl bg-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-foreground/30 uppercase tracking-widest">Data Type</Label>
                        <Select value={field.type} onValueChange={(v) => updateField(field.id, "type", v)}>
                          <SelectTrigger className="glass-card border-white/10 h-10 rounded-xl text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0B0F19] border-white/10">
                            {FIELD_TYPES.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-foreground/30 uppercase tracking-widest">Placeholder</Label>
                        <Input
                          placeholder="e.g. Enter CGPA..."
                          value={field.placeholder}
                          onChange={(e) => updateField(field.id, "placeholder", e.target.value)}
                          className="glass-card border-white/10 h-10 rounded-xl bg-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(v) => updateField(field.id, "required", v)}
                      />
                      <Label className="text-xs text-foreground/50">Required field</Label>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                variant="outline"
                onClick={addField}
                className="w-full border-dashed border-white/20 hover:border-primary/50 gap-2 h-12 rounded-xl"
              >
                <Plus className="w-4 h-4" /> Add Another Field
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !docType}
              size="lg"
              className="w-full h-14 rounded-2xl text-lg neon-glow gap-2"
            >
              {isSubmitting ? "Saving Template..." : "Create Template"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
