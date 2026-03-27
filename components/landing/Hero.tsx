"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";

export const Hero = () => {
  const router = useRouter();
  const { connected, isAuthenticated, connect } = useWallet();

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      try {
        await connect();
        // Reactive redirect in app/page.tsx will handle this, 
        // but push here for immediate response
        router.push("/dashboard");
      } catch (error) {
        console.error("Connection failed", error);
      }
    }
  };

  return (
    <section className="relative pt-44 pb-32 overflow-hidden min-h-screen flex items-center justify-center text-center">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[160px] -z-10 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/20 rounded-full blur-[140px] -z-10 rotate-12" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black tracking-[0.3em] uppercase mb-10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Next-Gen Document Infrastructure
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/20">
            Universal <span className="text-primary italic">Trust</span> <br /> 
            for Every Document
          </h1>
          
          <p className="text-xl text-foreground/50 mb-12 max-w-2xl leading-relaxed font-medium">
            Secure your legal documents with a dual-blockchain layer. 
            Public verification on Ethereum and secure off-chain storage.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <Button 
              size="lg" 
              className="h-16 px-10 text-lg font-bold rounded-2xl neon-glow gap-3 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
              onClick={handleGetStarted}
            >
              <ShieldCheck className="w-6 h-6" />
              {isAuthenticated ? "Go to Dashboard" : "Connect Wallet"}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 px-10 text-lg font-bold rounded-2xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300"
              onClick={() => router.push("/dashboard/verify")}
            >
              Verify Document
              <ArrowRight className="w-5 h-5 ml-2 text-primary" />
            </Button>
          </div>

          <div className="mt-20 flex flex-wrap justify-center items-center gap-12 text-foreground/30">
            <div className="flex items-center gap-3 group transition-colors hover:text-foreground/60">
              <ShieldCheck className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest">Enterprise Grade</span>
            </div>
            <div className="flex items-center gap-3 group transition-colors hover:text-foreground/60">
              <Zap className="w-6 h-6 text-accent/40 group-hover:text-accent transition-colors" />
              <span className="text-xs font-bold uppercase tracking-widest">Fast IPFS</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="glass-card p-8 rounded-3xl relative">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl -z-10" />
             
             {/* Mock Dashboard UI */}
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
                  <div className="h-4 w-12 bg-primary/20 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/10" />
                  ))}
                </div>
                <div className="h-40 bg-gradient-to-t from-primary/10 to-transparent rounded-xl border border-white/10 relative overflow-hidden">
                   <motion.div 
                    animate={{ y: [0, -40, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-primary/20 blur-xl" 
                   />
                </div>
                <div className="space-y-3">
                   <div className="h-3 w-full bg-white/5 rounded" />
                   <div className="h-3 w-4/5 bg-white/5 rounded" />
                   <div className="h-3 w-2/3 bg-white/5 rounded" />
                </div>
             </div>
          </div>
          
          {/* Floating Element 1 */}
        </motion.div>
      </div>
    </section>
  );
};
