"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FilePlus, 
  ShieldCheck, 
  Files, 
  History, 
  UserCircle, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  LogOut,
  Building2,
  LayoutTemplate,
  Users,
  ChevronDown,
  CreditCard,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/context/WalletContext";

const NavLink = ({ item, collapsed, pathname }: { item: any; collapsed: boolean; pathname: string }) => {
  const isActive = item.href === '/dashboard' 
    ? pathname === '/dashboard' 
    : pathname === item.href || pathname.startsWith(item.href + '/');
  return (
    <Link key={item.href} href={item.href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
        isActive ? "bg-primary text-white neon-glow shadow-lg shadow-primary/20" : "text-foreground/40 hover:bg-white/5 hover:text-white",
        collapsed && "w-12 h-12 justify-center px-0 mx-auto"
      )}>
        <item.icon className={cn(
          collapsed ? "w-5 h-5" : "w-4 h-4", 
          "shrink-0 transition-colors",
          isActive ? "text-white" : "group-hover:text-primary"
        )} />
        {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
        {collapsed && (
          <div className="absolute left-full ml-4 px-2 py-1 bg-[#0B0F19] border border-white/10 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            {item.label}
          </div>
        )}
      </div>
    </Link>
  );
};

export const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/dashboard/admin"));
  const { disconnect, walletInfo, connected } = useWallet();

  useEffect(() => {
    if (pathname.startsWith("/dashboard/admin")) {
      setAdminOpen(true);
    }
  }, [pathname]);

  const roles = walletInfo?.roles;
  const dbUser = walletInfo?.dbUser;
  
  const isAdmin = roles?.isAdmin || dbUser?.isSuperAdmin || dbUser?.isAdmin || false;
  const isIssuer = roles?.isIssuer || false;
  const isAuditor = roles?.isAuditor || false;
  
  const roleStatus = dbUser?.roleStatus || 'NONE';
  const isApproved = roleStatus === 'APPROVED';

  const mainItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard", show: connected && isApproved },
    { icon: FilePlus, label: "Register Document", href: "/dashboard/register", show: connected && isApproved && (isAdmin || isIssuer) },
    { icon: ShieldCheck, label: "Verify Document", href: "/dashboard/verify", show: true },
    { icon: Files, label: "My Documents", href: "/dashboard/documents", show: connected && isApproved },
    { icon: History, label: "Audit Logs", href: "/dashboard/logs", show: connected && isApproved && (isAdmin || isAuditor) },
    { icon: Shield, label: "Apply for Access", href: "/dashboard/apply", show: connected && !isApproved },
    { icon: CreditCard, label: "Pricing", href: "/dashboard/pricing", show: connected && !isApproved },
    { icon: UserCircle, label: "Profile", href: "/dashboard/profile", show: connected },
    { icon: Terminal, label: "Developer Toolkit", href: "/dashboard/developer", show: connected },
    { icon: Settings, label: "Settings", href: "/dashboard/settings", show: connected },
  ].filter(item => item.show);

  // Admin panel items — only visible to Admins and Issuers
  const adminItems = [
    { icon: Building2, label: "System Stats", href: "/dashboard/admin/stats", show: !!isAdmin },
    { icon: LayoutTemplate, label: "My Templates", href: "/dashboard/admin/templates", show: !!isAdmin || !!isIssuer },
    { icon: Users, label: "Pending Requests", href: "/dashboard/admin/requests", show: !!isAdmin },
  ].filter(item => item.show);

  const showAdminPanel = isApproved && (isAdmin || isIssuer) && adminItems.length > 0;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-[#0B0F19]/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 flex flex-col",
        collapsed && "items-stretch"
      )}
    >
      {/* Header */}
      <div className={cn("p-6 flex items-center justify-between shrink-0 h-20", collapsed ? "justify-center" : "")}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">DNAProof</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="text-white w-6 h-6" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-7 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white neon-glow border-2 border-[#0B0F19] z-50 transition-transform hover:scale-110",
            collapsed && "rotate-0"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {!collapsed && (
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 px-3 pb-2">Navigation</p>
        )}
        {mainItems.map(item => (
          <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
        ))}

        {/* Admin Panel Section */}
        {showAdminPanel && (
          <div className="pt-6">
            {!collapsed ? (
              <>
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="w-full flex items-center justify-between px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                >
                  Admin Panel
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", adminOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {adminOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {adminItems.map(item => (
                        <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="pt-4 mt-2 border-t border-white/5 space-y-1.5">
                {adminItems.map(item => (
                  <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 shrink-0 bg-white/[0.02]">
        <button
          onClick={() => {
            disconnect();
            sessionStorage.removeItem("dna_welcomed");
            window.location.href = "/";
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all group",
            collapsed && "w-12 h-12 justify-center px-0 mx-auto"
          )}
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};
