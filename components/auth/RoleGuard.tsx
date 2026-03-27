"use client";

import React, { useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "issuer" | "auditor" | "verifier")[];
  requireApproval?: boolean;
}

export const RoleGuard = ({ children, allowedRoles, requireApproval = true }: RoleGuardProps) => {
  const { connected, walletInfo, isAuthenticated } = useWallet();
  const router = useRouter();

  const dbUser = walletInfo?.dbUser;
  const roles = walletInfo?.roles;
  
  const roleStatus = dbUser?.roleStatus || 'NONE';
  const isApproved = roleStatus === 'APPROVED';
  
  const isAdmin = roles?.isAdmin || dbUser?.isSuperAdmin || false;
  const isIssuer = roles?.isIssuer || false;
  const isVerifier = roles?.isVerifier || false;
  const isAuditor = roles?.isAuditor || false;

  const hasAccess = !allowedRoles || allowedRoles.some(role => {
    if (role === "admin") return isAdmin;
    if (role === "issuer") return isIssuer;
    if (role === "verifier") return isVerifier;
    if (role === "auditor") return isAuditor;
    return false;
  });

  const isDenied = (requireApproval && !isApproved) || !hasAccess || !walletInfo?.dbUser;

  if (!connected || !walletInfo?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert className="w-16 h-16 text-yellow-500/50" />
        <h2 className="text-2xl font-bold">Please Connect Wallet</h2>
        <p className="text-foreground/40">You need to connect your wallet to access this page.</p>
      </div>
    );
  }

  // Check for authentication (JWT)
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold italic uppercase tracking-tight">Authentication Required</h2>
          <p className="text-foreground/40">
            Your session has expired or you are not logged in. Please sign the authentication message.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push("/")}
          className="border-white/10 hover:bg-white/5"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  if (isDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold italic uppercase tracking-tight">Access Denied</h2>
          <p className="text-foreground/40">
            {!isApproved 
              ? "Your account is not yet approved. Please apply for access or wait for approval." 
              : "You do not have the required role to view this page."}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard")}
          className="border-white/10 hover:bg-white/5"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
