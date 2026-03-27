"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Shield, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";

export default function IssuerOnboardingPage() {
  const { address, walletInfo } = useWallet();
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const roleStatus = walletInfo?.roles;

  const handleSubmit = async () => {
    if (!orgName || !orgType) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/issuer/request-role", { 
        walletAddress: address, 
        orgName, 
        orgType 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Role request submitted! Awaiting Super Admin approval.");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issuer Onboarding</h1>
          <p className="text-foreground/40 mt-1">Register your organization to issue verified documents on the ledger.</p>
        </div>

        {/* Role Status Banner */}
        {roleStatus?.isIssuer && (
          <Card className="glass-card border-green-500/20 bg-green-500/5">
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
              <div>
                <p className="font-bold text-green-400">You are an approved Issuer</p>
                <p className="text-sm text-foreground/50">Your organization is fully authorized to issue documents on DNAProof.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {submitted && !roleStatus?.isIssuer && (
          <Card className="glass-card border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="w-8 h-8 text-yellow-500 shrink-0" />
              <div>
                <p className="font-bold text-yellow-400">Request Pending Approval</p>
                <p className="text-sm text-foreground/50">A Super Admin will review your request shortly.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!roleStatus?.isIssuer && !submitted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card border-white/10">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold">Organization Details</h2>
                    <p className="text-xs text-foreground/40">This information will be stored on-chain and in your Issuer Profile.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Connected Wallet</Label>
                  <div className="glass-card border-white/5 px-4 py-3 rounded-xl font-mono text-sm text-foreground/60">
                    {address || "Not connected"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Organization Name *</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g. MIT, HDFC Bank, Government of India"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="glass-card border-white/10 h-12 rounded-xl bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Organization Type *</Label>
                  <Select value={orgType} onValueChange={setOrgType}>
                    <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B0F19] border-white/10">
                      <SelectItem value="University">🎓 University / Academic Institution</SelectItem>
                      <SelectItem value="Government">🏛️ Government / Public Authority</SelectItem>
                      <SelectItem value="Company">🏢 Company / Enterprise</SelectItem>
                      <SelectItem value="NGO">🌱 NGO / Non-Profit</SelectItem>
                      <SelectItem value="Other">⚙️ Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex gap-3 text-primary">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      By submitting, you agree that a Super Admin will verify your identity before granting the Issuer role. False submissions may result in a permanent ban.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !orgName || !orgType}
                  size="lg"
                  className="w-full h-14 rounded-2xl text-lg neon-glow"
                >
                  {isSubmitting ? "Submitting Request..." : "Submit Issuer Request"}
                  <Shield className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
