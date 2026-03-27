"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useWallet } from "@/context/WalletContext";

interface SDKContextType {
  sdk: any | null;
  isInitialized: boolean;
  error: string | null;
}

const SDKContext = createContext<SDKContextType>({
  sdk: null,
  isInitialized: false,
  error: null,
});

export const useSDK = () => useContext(SDKContext);

export function SDKProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [sdk, setSdk] = useState<any | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const initSDK = async () => {
      try {
        // Dynamic import of the SDK to avoid build-time static analysis
        // of Node-only dependencies like fabric-network and electron-fetch
        const { DNAProofSDK } = await import("@dnaproof/sdk");
        
        const config = {
          ethereum: {
            rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
            registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "",
            accessControlAddress: process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS || "",
            auditLogsAddress: process.env.NEXT_PUBLIC_AUDIT_LOGS_ADDRESS || "",
          },
          ipfs: {
            gatewayUrl: "https://api.pinata.cloud/psa",
            authHeader: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
          }
        };

        const newSdk = new DNAProofSDK(config);
        await newSdk.init();
        
        if (address && (window as any).ethereum) {
          const { ethers } = await import("ethers");
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          await newSdk.connectEthereum(signer as any);
        }

        setSdk(newSdk);
        setIsInitialized(true);
      } catch (err) {
        console.error("SDK Initialization Error:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize SDK");
      }
    };

    initSDK();
  }, [address]);

  return (
    <SDKContext.Provider value={{ sdk, isInitialized, error }}>
      {children}
    </SDKContext.Provider>
  );
}
