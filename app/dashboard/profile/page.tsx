"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@/context/WalletContext";
import { UserCircle, Shield, Mail, Wallet, Save, Key, Bell, Moon, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const { address, connected } = useWallet();
  const queryClient = useQueryClient();

  // Fetch user profile from the database
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["/api/users/wallet", address],
    queryFn: () => apiRequest("GET", `/api/users/wallet/${address}`).then(res => res.json()),
    enabled: connected && !!address,
  });

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState({
    darkMode: true,
    notifications: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with fetched user profile
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setFullName(userProfile.fullName || "");
      setEmail(userProfile.email || "");
      if (userProfile.preferences) {
        try {
          const parsed = typeof userProfile.preferences === 'string' 
            ? JSON.parse(userProfile.preferences) 
            : userProfile.preferences;
          setPreferences(prev => ({ 
            darkMode: parsed.darkMode ?? prev.darkMode,
            notifications: parsed.notifications ?? prev.notifications
          }));
        } catch (e) {
          console.error("Failed to parse preferences");
        }
      }
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!address) return;
    setIsSaving(true);
    const savePromise = async () => {
      // 1. Update Profile Information
      await apiRequest("PATCH", `/api/users/profile/${address}`, {
        displayName,
        fullName,
        email,
      });

      // 2. Update Preferences
      await apiRequest("PATCH", `/api/users/preferences/${address}`, preferences);
      
      queryClient.invalidateQueries({ queryKey: ["/api/users/wallet", address] });
    };

    toast.promise(savePromise(), {
      loading: 'Saving your profile...',
      success: 'Profile updated successfully!',
      error: (err) => `Failed to save: ${err.message}`
    }).finally(() => setIsSaving(false));
  };

  const role = userProfile?.isSuperAdmin ? 'SUPER ADMIN' : 
               (userProfile?.roleStatus === 'APPROVED' ? (userProfile?.requestedRole || 'USER') : 'GUEST');
  const plan = userProfile?.isSuperAdmin ? 'ENTERPRISE' : (userProfile?.plan || 'FREE');
  const profileName = displayName || fullName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Anonymous User");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Identity & Profile</h1>
            <p className="text-foreground/40 mt-1">Manage your decentralized identity, organization details, and app behavior.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Account Status</p>
              <p className="text-xs font-bold text-green-500 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" /> {userProfile?.isSuperAdmin ? 'System Admin' : 'Verified'}
              </p>
            </div>
          </div>
        </header>

        {!connected ? (
          <Card className="glass-card border-white/5">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <Wallet className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-xl font-bold">Wallet Connectivity Required</h2>
              <p className="text-foreground/40 mt-2 max-w-xs mx-auto">Please connect your Web3 wallet to access your encrypted profile data.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-4">
             <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
             <p className="text-sm font-medium text-foreground/40 animate-pulse tracking-wide">Retrieving profile from node...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* ID Card Column */}
            <div className="md:col-span-1 space-y-6">
              <Card className="glass-card border-white/5 bg-[#0D111C]/50 overflow-hidden group">
                <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-blue-500" />
                <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center mb-5 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl relative overflow-hidden">
                    {userProfile?.profileImage ? (
                      <img src={userProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-14 h-14 text-white/40" />
                    )}
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h3 className="text-lg font-bold truncate w-full" title={profileName}>{profileName}</h3>
                  <p className="text-[10px] font-mono text-foreground/30 mt-1">{address?.slice(0, 6)}...{address?.slice(-4)}</p>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-tighter ${
                      userProfile?.isSuperAdmin 
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' 
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {role}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-foreground/60 text-[10px] font-bold border border-white/10 uppercase tracking-tighter">
                      {plan} PLAN
                    </span>
                  </div>

                  <div className="w-full mt-10 space-y-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-foreground/30 font-bold uppercase tracking-widest">Network</span>
                      <span className="font-bold text-foreground/80">Sepolia</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-foreground/30 font-bold uppercase tracking-widest">Verifications</span>
                      <span className="font-bold text-foreground/80">{userProfile?.verificationCount || 0} / {userProfile?.verificationLimit || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-foreground/30 font-bold uppercase tracking-widest">Registry Docs</span>
                      <span className="font-bold text-foreground/80">{userProfile?.documentCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-[10px] text-primary/70 leading-relaxed italic">
                 "Your profile is encrypted and stored alongside your on-chain identity records for maximum privacy and portability."
              </div>
            </div>

            {/* Forms Column */}
            <div className="md:col-span-3 space-y-6">
              <Card className="glass-card border-white/5 bg-[#0D111C]/30 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-1 text-primary">
                    <UserCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Profile Information</span>
                  </div>
                  <CardTitle className="text-xl">Identity Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 sm:col-span-1">
                    <Label className="text-xs text-foreground/40">Full Name</Label>
                    <Input 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="h-11 bg-white/[0.03] border-white/10 focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2 sm:col-span-1">
                    <Label className="text-xs text-foreground/40">Display Name (Public)</Label>
                    <Input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. John_Web3"
                      className="h-11 bg-white/[0.03] border-white/10 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs text-foreground/40">Registered Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                      <Input 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="h-11 pl-11 bg-white/[0.03] border-white/10 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5 bg-[#0D111C]/30 overflow-hidden">
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center gap-2 mb-1 text-amber-500">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Role & Account Status</span>
                  </div>
                  <CardTitle className="text-xl">Subscription & Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                      <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider">Assigned Role</p>
                      <p className="text-lg font-bold flex items-center gap-2">
                        {role} {userProfile?.isSuperAdmin && <Zap className="w-4 h-4 text-amber-500" />}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                      <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider">Current Plan</p>
                      <p className="text-lg font-bold text-primary">{plan}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="text-xs font-bold mb-2 uppercase tracking-widest opacity-60">System Permissions</h4>
                    <ul className="text-[11px] space-y-1.5 text-foreground/60 font-medium">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" /> 
                        {userProfile?.isSuperAdmin ? "Full System Write & Audit Access" : "Document Request & Verification"}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" /> 
                        {userProfile?.isSuperAdmin ? "Global Registry Management" : "Identity Attestation Storage"}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5 bg-[#0D111C]/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-1 text-accent">
                    <Key className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">User Preferences</span>
                  </div>
                  <CardTitle className="text-xl">App Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Dark Mode</p>
                        <p className="text-[11px] text-foreground/40">Enforce sleek dark aesthetics across dashboard</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.darkMode} 
                      onCheckedChange={(c) => setPreferences(prev => ({ ...prev, darkMode: c }))} 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Smart Notifications</p>
                        <p className="text-[11px] text-foreground/40">Get alerted for verification status changes</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.notifications} 
                      onCheckedChange={(c) => setPreferences(prev => ({ ...prev, notifications: c }))} 
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="h-12 px-10 rounded-xl bg-primary text-white font-bold hover:neon-glow-sm transition-all"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Profile Details
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
