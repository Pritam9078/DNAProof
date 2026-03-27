"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, Users } from "lucide-react";

export const Trust = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] -z-10 rotate-12" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Enterprise Grade <br />
              <span className="text-primary italic">Security</span> Architecture
            </h2>
            <p className="text-lg text-foreground/60 mb-10 leading-relaxed">
              DNAProof was built from the ground up to support high-compliance industries. 
              Our hybrid ledger technology ensures that your data remains private while its 
              authenticity remains publicly verifiable.
            </p>

            <div className="space-y-6">
              {[
                { icon: Shield, title: "Self-Sovereign Identity", desc: "You own your data and your keys." },
                { icon: Lock, title: "Zero-Knowledge Ready", desc: "Privacy by design in every transaction." },
                { icon: FileCheck, title: "Immutable Audit Trails", desc: "Every action is cryptographically signed." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{item.title}</h4>
                    <p className="text-sm text-foreground/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { label: "Uptime", value: "99.99%", color: "text-green-500" },
              { label: "Verification", value: "< 2s", color: "text-blue-500" },
              { label: "Active Nodes", value: "500+", color: "text-purple-500" },
              { label: "Total Proofs", value: "10k+", color: "text-cyan-500" }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl border-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-colors">
                <p className="text-xs uppercase tracking-widest text-foreground/40 font-black mb-2">{stat.label}</p>
                <p className={`text-4xl font-black ${stat.color} group-hover:scale-110 transition-transform`}>{stat.value}</p>
              </div>
            ))}
            
            <div className="col-span-2 glass-card p-6 rounded-2xl border-white/5 flex items-center justify-center gap-8 opacity-40">
               <Shield className="w-12 h-12" />
               <Users className="w-12 h-12" />
               <div className="h-8 w-px bg-white/10" />
               <span className="text-sm font-bold tracking-tighter uppercase italic">Secured by Ethereum & Fabric</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
