"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Zap, CheckCircle2 } from "lucide-react";

export const ConsoleDemo = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black tracking-tighter mb-4">Enterprise Console</h2>
          <p className="text-foreground/50 max-w-xl mx-auto">
            A seamless interface for managing, issuing, and verifying high-stakes documentation.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative group mt-10"
        >
          {/* Mac-style Window */}
          <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden shadow-[0_32px_96px_-12px_rgba(0,0,0,0.8)]">
            {/* Toolbar */}
            <div className="h-12 border-b border-white/5 bg-white/[0.03] flex items-center px-6 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="mx-auto text-[10px] font-bold text-foreground/20 tracking-widest uppercase flex items-center gap-2">
                <Lock className="w-3 h-3" />
                SECURE_ENCLAVE_V2.0
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 grid grid-cols-12 gap-8 min-h-[500px]">
              {/* Sidebar Mock */}
              <div className="col-span-3 space-y-6">
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-8 rounded-lg ${i === 1 ? 'bg-primary/20 border border-primary/20' : 'bg-white/5 border border-transparent'} group-hover:bg-white/10 transition-all duration-300`} />
                    ))}
                </div>
                <div className="pt-8 space-y-2">
                    <div className="h-2 w-16 bg-white/10 rounded-full" />
                    <div className="h-2 w-24 bg-white/10 rounded-full" />
                </div>
              </div>

              {/* Main Content Mock */}
              <div className="col-span-9 space-y-8">
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-primary" />
                            </div>
                            <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                            <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            VALIDATED
                        </motion.div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center p-3 animate-pulse">
                                <Zap className="text-white w-full h-full" />
                            </div>
                            <div>
                                <div className="h-3 w-48 bg-white/20 rounded-full mb-2" />
                                <div className="h-2 w-32 bg-white/10 rounded-full" />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between">
                                <div className="h-2 w-24 bg-white/5 rounded-full" />
                                <div className="h-2 w-16 bg-white/5 rounded-full" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-2 w-32 bg-white/5 rounded-full" />
                                <div className="h-2 w-20 bg-white/5 rounded-full" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-2 w-28 bg-white/5 rounded-full" />
                                <div className="h-2 w-24 bg-white/5 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
          <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-700" />
        </motion.div>
      </div>
    </section>
  );
};
