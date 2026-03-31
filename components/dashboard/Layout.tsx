"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { Rocket } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { connected } = useWallet();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    
    // 1. Route Guard check
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
      return;
    }

    // 2. Welcome Popup (Once per session)
    const hasBeenWelcomed = sessionStorage.getItem("dna_welcomed");
    if (!hasBeenWelcomed) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full glass-card border-primary/20 p-4 pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5 text-primary">
                <Rocket className="h-10 w-10" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-white">
                  Welcome to DNAProof 🚀
                </p>
                <p className="mt-1 text-xs text-foreground/60">
                  Your wallet has been successfully authenticated.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-white/10">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-bold text-primary hover:text-primary/80 focus:outline-none"
            >
              GOT IT
            </button>
          </div>
        </div>
      ), { duration: 5000, position: 'top-center' });
      sessionStorage.setItem("dna_welcomed", "true");
    }
  }, [router]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-foreground font-sans selection:bg-primary/30">
      <Sidebar />
      
      <div className="transition-all duration-300 lg:pl-[280px]">
        <Topbar />
        
        <main className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto">
           <AnimatePresence mode="wait">
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
             >
                {children}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
      
      {/* Global Background Elements */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
    </div>
  );
};
