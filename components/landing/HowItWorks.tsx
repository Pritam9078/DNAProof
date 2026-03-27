"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const steps = [
  {
    title: "Connect & Auth",
    description: "Connect your Web3 wallet and sign a secure nonce to establish your unique identity.",
    image: "/step1.png",
  },
  {
    title: "Upload Document",
    description: "Drag & drop your files. Our system generates a secure keccak256 hash locally.",
    image: "/step2.png",
  },
  {
    title: "Public Anchoring",
    description: "The document hash and CID are recorded on Ethereum for tamper-proof public verification.",
    image: "/step3.png",
  },
  {
    title: "Private Sync",
    description: "Confidential metadata is synced to Hyperledger Fabric with granular access controls.",
    image: "/step4.png",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 italic">How It Works</h2>
          <p className="text-foreground/60 max-w-xl mx-auto">
            A seamless bridge between traditional document management and blockchain security.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line for Desktop */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent hidden lg:block" />

          <div className="space-y-24">
            {steps.map((step, index) => (
              <div key={index} className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                <motion.div 
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 space-y-4"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30 text-primary font-black text-xl">
                    {index + 1}
                  </div>
                  <h3 className="text-3xl font-bold">{step.title}</h3>
                  <p className="text-lg text-foreground/50 leading-relaxed max-w-md">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {["Military-grade encryption", "Instant verification", "Blockchain proof"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground/40">
                         <Check className="w-4 h-4 text-primary" />
                         {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.8 }}
                   className="flex-1 w-full"
                >
                   <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 glass-card relative overflow-hidden flex items-center justify-center group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                      <div className="text-primary/20 font-black text-9xl absolute -bottom-10 -right-10 opacity-20 group-hover:scale-110 transition-transform">
                        0{index + 1}
                      </div>
                      <div className="w-2/3 h-2/3 bg-white/5 rounded-xl border border-white/10 shadow-inner group-hover:neon-glow transition-all" />
                   </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
