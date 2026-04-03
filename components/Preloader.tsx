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
            scale: 1.1,
            transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F19] overflow-hidden"
        >
          {/* Animated Background Layers */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
            <div className="absolute inset-0 animated-gradient opacity-30" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
          </div>

          {/* 3D Content Container */}
          <div className="relative perspective-1000 flex flex-col items-center">
            {/* Reflection/Glow Base */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -inset-10 bg-primary/20 blur-[60px] rounded-full"
            />

            {/* 3D Animated Logo Wrapper */}
            <motion.div
              animate={{
                rotateY: [0, 360],
                rotateX: [-10, 10, -10],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-32 h-32 md:w-48 md:h-48 preserves-3d"
            >
              <div className="relative w-full h-full drop-shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-pulse">
                <Image
                  src={logoSrc}
                  alt="DNAProof Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* Status Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center z-10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                    DNAPROOF
                  </span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase animate-pulse">
                    Verifying DNA Integrity
                  </p>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Branding */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
              Enterprise Grade Security
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
