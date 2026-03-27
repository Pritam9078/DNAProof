"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "DNAProof has transformed how we handle legal document verification. The hybrid blockchain approach is exactly what the industry needed.",
    author: "Sarah Chen",
    role: "CTO, Global Legal Tech",
    avatar: "SC"
  },
  {
    quote: "The seamless integration with MetaMask and the speed of IPFS storage makes this the most user-friendly Web3 product we've used.",
    author: "Marcus Thorne",
    role: "Head of Operations, BlockChain Solutions",
    avatar: "MT"
  },
  {
    quote: "Security and privacy aren't just buzzwords here. The secure archival layer on Hyperledger is a game-changer for enterprise compliance.",
    author: "Elena Rodriguez",
    role: "Compliance Officer, FinTrust",
    avatar: "ER"
  }
];

export const Testimonials = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black tracking-tighter mb-4">Trusted by Industry Leaders</h2>
          <p className="text-foreground/50 max-w-xl mx-auto">
            See why leading enterprises choose DNAProof for their high-stakes documentation needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-10 rounded-3xl border border-white/5 relative group hover:border-primary/20 transition-all duration-500"
            >
              <Quote className="w-10 h-10 text-primary/20 mb-6 group-hover:text-primary transition-colors" />
              <p className="text-lg font-medium leading-relaxed mb-8 italic text-foreground/80">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-black text-white shadow-lg shadow-primary/20">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-white">{t.author}</div>
                  <div className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
