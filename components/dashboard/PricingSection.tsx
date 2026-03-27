"use client";

import React from "react";
import { Check, Zap, Shield, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { useWallet } from "@/context/WalletContext";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: "BASIC",
    name: "Basic Plan",
    price: "0.01",
    description: "Standard access for small teams and issuers.",
    features: [
      "100 Document Verifications",
      "Issue up to 50 Documents",
      "Standard Templates",
      "Email Support",
    ],
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "PRO",
    name: "Pro Professional",
    price: "0.05",
    description: "Advanced institutional grade features.",
    features: [
      "Unlimited Verifications",
      "Unlimited Document Issuance",
      "Custom Templates",
      "Bulk Issuance & API",
      "Priority Support",
    ],
    icon: Shield,
    color: "from-primary to-purple-600",
    popular: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    description: "For large government and institutions.",
    features: [
      "Private Fabric Node",
      "SLA Guarantee",
      "Dedicated account manager",
      "On-premise Options",
    ],
    icon: Crown,
    color: "from-yellow-500 to-orange-500",
  },
];

export const PricingSection = ({ onSelect }: { onSelect?: (plan: PricingPlan) => void }) => {
  const { walletInfo } = useWallet();

  const handlePayment = async (plan: PricingPlan) => {
    if (plan.price === "Custom") {
      toast.success("Our team will contact you for enterprise details!");
      return;
    }

    if (!walletInfo?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xFA0978539bbb30776ED0664D2413A8A6F8145A61"; 
      
      toast.loading("Processing payment...", { id: "payment" });
      
      const tx = await signer.sendTransaction({
        to: adminWallet,
        value: ethers.parseEther(plan.price),
      });

      toast.loading("Waiting for confirmation...", { id: "payment" });
      await tx.wait();

      // Trigger Backend Upgrade
      const res = await fetch(`/api/users/plan/upgrade/${walletInfo.address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, paymentTxHash: tx.hash })
      });

      if (res.ok) {
        toast.success("Account upgraded successfully!", { id: "payment" });
        if (onSelect) onSelect({ ...plan, paymentTxHash: tx.hash } as any);
      } else {
        toast.error("Payment received but upgrade failed. Contact support.", { id: "payment" });
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed", { id: "payment" });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={cn(
            "relative h-full glass-card border-white/5 overflow-hidden group hover:border-primary/50 transition-all duration-500",
            plan.popular && "border-primary/30 ring-1 ring-primary/20"
          )}>
            {plan.popular && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg z-10">
                Most Popular
              </div>
            )}
            
            <CardHeader>
              <div className={cn(
                "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500",
                plan.color
              )}>
                <plan.icon className="text-white w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">
                  {plan.price === "Custom" ? "" : "Ξ"} {plan.price}
                </span>
                {plan.price !== "Custom" && <span className="text-foreground/40 text-sm">/lifetime</span>}
              </div>
              <p className="text-foreground/60 text-sm mt-2">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="h-px bg-white/5 w-full" />
              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-foreground/70">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="pt-6">
              <Button 
                onClick={() => handlePayment(plan)}
                className={cn(
                  "w-full group/btn relative overflow-hidden",
                  plan.popular ? "bg-primary hover:bg-primary/90" : "bg-white/5 hover:bg-white/10"
                )}
              >
                <span className="relative z-10">
                  {plan.price === "Custom" ? "Contact Us" : "Get Started"}
                </span>
                {plan.popular && (
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </Button>
            </CardFooter>

            {/* Background Light Effect */}
            <div className={cn(
              "absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none",
              plan.color
            )} />
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
