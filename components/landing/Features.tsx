"use client";

import React from "react";
import { motion } from "framer-motion";
import { Database, ShieldCheck, Zap, Globe, Lock, Cpu } from "lucide-react";

const features = [
  {
    title: "Public Verification",
    description: "Documents are anchored on Ethereum (Sepolia) with UUPS upgradeable security for permanent validity.",
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Secure Storage",
    description: "Sensitive data is kept off-chain and secured with advanced encryption, accessible only via verified roles.",
    icon: Lock,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "IPFS Storage",
    description: "Decentralized file hosting via Pinata, ensuring your documents are always available and tamper-proof.",
    icon: Globe,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    title: "High Performance",
    description: "Optimized Next.js frontend with real-time hash generation and sub-second verification times.",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    title: "Access Control",
    description: "Granular role-based permissions (Admin, Issuer, Verifier) managed by smart contracts.",
    icon: ShieldCheck,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Smart SDKs",
    description: "Ethers.js v6 and Fabric SDK integration for seamless communication across all blockchain layers.",
    icon: Cpu,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
            Engineered for <br /> Absolute Integrity
          </h2>
          <p className="text-foreground/50 max-w-2xl mx-auto text-lg font-medium">
            Our multi-layer verification system ensures your data remains immutable, 
            secure, and verifiable across any enterprise ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card group p-10 rounded-3xl border border-white/5 hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-40 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all" />
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:neon-glow transition-all duration-500">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-foreground/50 leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
