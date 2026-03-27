"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { TrustLogos } from "@/components/landing/TrustLogos";
import { ConsoleDemo } from "@/components/landing/ConsoleDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import React from "react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useWallet();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [router, isAuthenticated]);

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <Navbar />
      <Hero />
      <TrustLogos />
      <ConsoleDemo />
      <Features />
      <Testimonials />
      <Footer />
    </main>
  );
}
