"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface PreloaderProps {
  isLoading: boolean;
  logoSrc?: string;
}

export const Preloader: React.FC<PreloaderProps> = ({ 
  isLoading, 
  logoSrc = "/logo.png" 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.05,
            filter: "blur(20px)",
            transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05080F] overflow-hidden"
        >
          {/* 🌌 Cinematic Atmospheric Background (The Nebula) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Primary Deep Glow */}
            <motion.div 
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.15, 0.25, 0.15],
                x: [-20, 20, -20],
                y: [-20, 20, -20],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/20 blur-[160px] rounded-full"
            />
            {/* Secondary Cyan Glow */}
            <motion.div 
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.3, 0.2],
                x: [20, -20, 20],
                y: [20, -20, 20],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/10 blur-[180px] rounded-full"
            />
            
            {/* Center Atmospheric Core */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />

            {/* Subtle Film Grain Texture */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;utf8,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
          </div>

          {/* 💠 3D Logo Component */}
          <div className="relative perspective-[1200px] flex flex-col items-center">
            {/* Soft Shadow/Glow Base */}
            <motion.div
              animate={{
                scale: [0.8, 1.1, 0.8],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/30 blur-[100px] rounded-full"
            />

            {/* Floating 3D Logo Wrapper */}
            <motion.div
              animate={{
                rotateY: [0, 360],
                rotateX: [-8, 8, -8],
                y: [0, -15, 0],
                x: [-10, 10, -10],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-36 h-36 md:w-56 md:h-56"
            >
              <div className="relative w-full h-full drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                <Image
                  src={logoSrc}
                  alt="DNAProof Logo"
                  fill
                  className="object-contain brightness-110 contrast-110"
                  priority
                />
              </div>
            </motion.div>

            {/* 📝 Luxury Typography & Status */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mt-16 text-center z-10"
            >
              <div className="flex flex-col items-center gap-6">
                <h1 className="text-2xl font-light tracking-[0.4em] text-white/90">
                  DNAPROOF
                </h1>
                
                <div className="flex flex-col items-center gap-4">
                  <p className="text-[10px] font-medium tracking-[0.85em] text-primary/60 uppercase">
                    Verifying DNA Integrity
                  </p>
                  
                  {/* Minimalist Progress Meter */}
                  <div className="w-48 h-[1px] bg-white/5 relative overflow-hidden">
                    <motion.div 
                      animate={{
                        x: ["-100%", "100%"]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-1/2"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 🏷️ Bottom Branding */}
          <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-30">
            <div className="w-[1px] h-8 bg-white/20" />
            <p className="text-[9px] font-medium uppercase tracking-[1em] text-white/50">
              On-Chain Identity
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
