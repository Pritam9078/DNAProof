"use client";

import React from "react";
import { useWallet } from "@/context/WalletContext";
import { Search, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NotificationBell from "../notifications/NotificationBell";

export const Topbar = () => {
  const { address } = useWallet();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] z-30 h-16 bg-[#0B0F19]/40 backdrop-blur-md border-b border-white/5 px-6">
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Search bar removed per user request */}
        <div className="flex items-center gap-4 ml-auto">
          <NotificationBell />
          
          <Button variant="ghost" size="icon" className="text-foreground/40 hover:text-white hover:bg-white/5 rounded-full">
             <Settings className="w-5 h-5" />
          </Button>

          <div className="h-8 w-px bg-white/10 mx-2" />

          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase tracking-widest text-foreground/20">Account</p>
                <p className="text-sm font-bold text-foreground/80">
                   {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "Not Connected"}
                </p>
             </div>
             <Avatar className="h-9 w-9 border border-white/20">
                <AvatarImage src={`https://avatar.vercel.sh/${address}`} />
                <AvatarFallback>UN</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};
