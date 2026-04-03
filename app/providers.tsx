"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { WalletProvider } from "@/context/WalletContext";
import { SDKProvider } from "./providers/SDKProvider";
import { Toaster } from "react-hot-toast";
import { ReactNode, useState, useEffect } from "react";
import { Preloader } from "@/components/Preloader";

export function Providers({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show preloader for at least 2 seconds for branding
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <SDKProvider>
          <Preloader isLoading={loading} />
          {children}
          <Toaster />
        </SDKProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
