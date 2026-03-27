"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const { connected, isAuthenticated, address, connect, disconnect } = useWallet();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      // Reactive redirect in app/page.tsx will handle this, 
      // but push here for immediate response
      router.push("/dashboard");
    } catch (error) {
      console.error("Connection failed", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
        scrolled ? "top-4 mx-auto max-w-5xl rounded-2xl bg-background/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "bg-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center neon-glow group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 leading-none">
              DNAPROOF
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-primary/80 uppercase mt-1">Enterprise Grade</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">How it Works</Link>
          <Link href="/verify" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Verify</Link>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-sm">Dashboard</Button>
              </Link>
              <Button 
                onClick={disconnect}
                variant="outline" 
                className="gap-2 border-white/10 hover:bg-white/5 text-red-400 hover:text-red-500"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {formatAddress(address || "")}
              </Button>
            </div>
          ) : (
            <div className="md:flex hidden items-center gap-4">
               {/* Minimal navbar connection or just rely on Hero for first visit */}
               <Button onClick={handleConnect} className="gap-2 neon-glow">
                 <Wallet className="w-4 h-4" />
                 Connect Wallet
               </Button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-background border-b border-white/10 p-6 md:hidden flex flex-col gap-4"
          >
            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
            <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it Works</Link>
            <Link href="/verify" onClick={() => setIsMobileMenuOpen(false)}>Verify</Link>
            {isAuthenticated ? (
               <Link href="/dashboard">
                 <Button className="w-full">Dashboard</Button>
               </Link>
            ) : (
              <Button onClick={async () => { await handleConnect(); setIsMobileMenuOpen(false); }} className="w-full gap-2">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
