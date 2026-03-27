"use client";

import React from "react";
import Link from "next/link";
import { Shield, Github, Twitter, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="pt-32 pb-12 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1 border-r border-white/5 pr-8">
            <Link href="/" className="flex items-center gap-2 group mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center neon-glow group-hover:scale-110 transition-all duration-300">
                <Shield className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter">DNAPROOF</span>
            </Link>
            <p className="text-sm text-foreground/40 leading-relaxed font-medium">
              The universal layer for high-stakes document verification. Built on Ethereum and Hyperledger.
            </p>
          </div>

          <div className="col-span-1">
            <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-primary mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-sm text-foreground/50 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/verify" className="text-sm text-foreground/50 hover:text-white transition-colors">Verification</Link></li>
              <li><Link href="/dashboard" className="text-sm text-foreground/50 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-primary mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-foreground/50 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-sm text-foreground/50 hover:text-white transition-colors">API Reference</Link></li>
              <li><Link href="#" className="text-sm text-foreground/50 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-primary mb-6">Infrastructure</h4>
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Github className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Twitter className="w-4 h-4" />
                </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:row justify-between items-center gap-4 text-xs font-bold text-foreground/20 uppercase tracking-widest">
            <div>© 2024 DNAPROOF PROTOCOL. ALL RIGHTS RESERVED.</div>
            <div className="flex gap-8">
                <Link href="#" className="hover:text-white/40 transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-white/40 transition-colors">Terms of Service</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};
