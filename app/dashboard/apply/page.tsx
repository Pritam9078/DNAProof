"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PricingSection } from "@/components/dashboard/PricingSection";
import { CheckCircle2, ChevronRight, Building2, User, Globe, Mail, FileText, CreditCard } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/queryClient";

export default function ApplyPage() {
  const { address } = useWallet();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    orgName: "",
    orgType: "",
    orgWebsite: "",
    description: "",
    requestedRole: "",
    plan: "",
    paymentTxHash: ""
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handlePlanSelect = (plan: any) => {
    setFormData(prev => ({ 
      ...prev, 
      plan: plan.id, 
      paymentTxHash: plan.paymentTxHash 
    }));
    nextStep();
  };

  const handleSubmit = async () => {
    try {
      const res = await apiRequest("POST", "/api/auth/request-role", { ...formData, walletAddress: address });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Submission failed");
      }

      toast.success("Application submitted successfully!");
      setStep(4);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 px-4">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  step === i ? "border-primary bg-primary text-white neon-glow" : 
                  step > i ? "border-green-500 bg-green-500 text-white" : "border-white/10 text-foreground/40"
                }`}>
                  {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${
                  step === i ? "text-primary" : "text-foreground/40"
                }`}>
                  {i === 1 ? "Details" : i === 2 ? "Pricing" : "Confirm"}
                </span>
              </div>
              {i < 3 && <div className={`h-px flex-1 mx-4 ${step > i ? "bg-green-500" : "bg-white/10"}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <User className="text-primary w-6 h-6" />
                    Organization & Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-foreground/60">Full Name</Label>
                      <div className="relative">
                        <Input 
                          placeholder="John Doe" 
                          className="bg-white/5 border-white/10 pl-10" 
                          value={formData.fullName}
                          onChange={e => setFormData({...formData, fullName: e.target.value})}
                        />
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-foreground/30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/60">Professional Email</Label>
                      <div className="relative">
                        <Input 
                          placeholder="john@organization.com" 
                          className="bg-white/5 border-white/10 pl-10" 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-foreground/30" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-foreground/60">Organization Name</Label>
                      <div className="relative">
                        <Input 
                          placeholder="Global University" 
                          className="bg-white/5 border-white/10 pl-10" 
                          value={formData.orgName}
                          onChange={e => setFormData({...formData, orgName: e.target.value})}
                        />
                        <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-foreground/30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/60">Organization Website (Optional)</Label>
                      <div className="relative">
                        <Input 
                          placeholder="https://example.com" 
                          className="bg-white/5 border-white/10 pl-10" 
                          value={formData.orgWebsite}
                          onChange={e => setFormData({...formData, orgWebsite: e.target.value})}
                        />
                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-foreground/30" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-foreground/60">Organization Type</Label>
                      <Select 
                        onValueChange={v => setFormData({...formData, orgType: v})}
                        value={formData.orgType}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10">
                          <SelectItem value="University">University</SelectItem>
                          <SelectItem value="Government">Government</SelectItem>
                          <SelectItem value="Company">Company</SelectItem>
                          <SelectItem value="NGO">NGO</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/60">Requested Role</Label>
                      <Select 
                        onValueChange={v => setFormData({...formData, requestedRole: v})}
                        value={formData.requestedRole}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10">
                          <SelectItem value="ISSUER">Issuer (Register Documents)</SelectItem>
                          <SelectItem value="VERIFIER">Verifier (Full Audit Access)</SelectItem>
                          <SelectItem value="AUDITOR">Auditor (Compliance Monitoring)</SelectItem>
                          <SelectItem value="ADMIN">Admin (Manage Users & Templates)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground/60">Use Case Description</Label>
                    <div className="relative">
                      <Textarea 
                        placeholder="Tell us how you plan to use DNAProof..." 
                        className="bg-white/5 border-white/10 pl-10 min-h-[100px]" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-foreground/30" />
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 gap-2 h-12"
                    onClick={() => {
                      if (!formData.fullName || !formData.email || !formData.orgName || !formData.requestedRole) {
                        toast.error("Please fill in all required fields");
                        return;
                      }
                      nextStep();
                    }}
                  >
                    Next: Select Plan
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Select Your Plan</h2>
                <p className="text-foreground/40 mt-2">Complete the payment to proceed with your application.</p>
              </div>
              <PricingSection onSelect={handlePlanSelect} />
              <Button variant="ghost" onClick={prevStep} className="text-foreground/40 hover:text-white">
                Back to details
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <Card className="glass-card border-white/5 overflow-hidden">
                <div className="h-2 bg-primary w-full" />
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Final Confirmation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Personal Info</p>
                      <div className="space-y-1">
                        <p className="text-foreground/40 font-medium">Name</p>
                        <p className="text-lg">{formData.fullName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground/40 font-medium">Email</p>
                        <p className="text-lg">{formData.email}</p>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Organization</p>
                      <div className="space-y-1">
                        <p className="text-foreground/40 font-medium">Name</p>
                        <p className="text-lg">{formData.orgName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground/40 font-medium">Role Requested</p>
                        <p className="text-lg text-primary">{formData.requestedRole}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="text-primary w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Plan: {formData.plan}</p>
                        <p className="text-xs text-foreground/40">Transaction Verified</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-foreground/40">Tx Hash</p>
                      <p className="text-xs font-mono">{formData.paymentTxHash.substring(0, 10)}...</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={prevStep} className="flex-1 h-12 border-white/10">
                      Back
                    </Button>
                    <Button 
                      className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20"
                      onClick={handleSubmit}
                    >
                      Submit Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-12"
            >
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <motion.div 
                  className="absolute inset-0 bg-green-500/10 rounded-full blur-2xl -z-10"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Application Successful!</h2>
                <p className="text-foreground/40 mt-4 max-w-md mx-auto">
                  Your request has been received. Our Super Admin will review your application and payment within 24 hours.
                </p>
              </div>
              <div className="flex flex-col gap-3 max-w-sm mx-auto pt-4">
                <Button onClick={() => router.push("/dashboard")} className="bg-white text-black hover:bg-white/90 h-11">
                  Return to Dashboard
                </Button>
                <p className="text-[10px] text-foreground/30">You will receive an email once your application is processed.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
