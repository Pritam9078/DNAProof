"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { PricingSection } from "@/components/dashboard/PricingSection";
import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold tracking-tight">Access Plans & Pricing</h1>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Select a plan to unlock advanced document registration and management features. 
            All payments are processed securely on the Ethereum Sepolia network.
          </p>
        </motion.div>
        
        <PricingSection />
        
        <div className="mt-12 text-center text-xs text-foreground/40 p-8 glass-card border-white/5 max-w-2xl mx-auto">
          <p>
            Note: We currently only support the Sepolia test network for transactions. 
            Make sure you have sufficient Sepolia ETH in your wallet to cover the plan cost and gas fees.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
