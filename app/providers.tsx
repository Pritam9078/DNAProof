"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { WalletProvider } from "@/context/WalletContext";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        {children}
        <Toaster />
      </WalletProvider>
    </QueryClientProvider>
  );
}
