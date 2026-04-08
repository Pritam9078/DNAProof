import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';
import { getUserRoles } from '@/lib/contractService';

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface UserRoles {
  isAdmin: boolean;
  isIssuer: boolean;
  isVerifier: boolean;
  isAuditor: boolean;
}

export interface WalletInfo {
  address: string;
  chainId: number;
  network: string;
  balance: string;
  walletType: string;
  roles: UserRoles;
  dbUser?: any;
}

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  walletInfo: WalletInfo | null;
  connect: () => Promise<void>;
  connectToSpecificWallet: (walletType: string) => Promise<void>;
  disconnect: () => void;
  refreshUser: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  switchNetwork: () => Promise<boolean>;
  connectionError: string | null;
  chainId: number | null;
  isAuthenticated: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

// Check if Ethereum is available in the window object
const isEthereumAvailable = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Sync isAuthenticated with localStorage token
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      setIsAuthenticated(connected && !!token);
    };
    checkAuth();
    // Also listen for storage events in case of multiple tabs
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [connected]);

  // Check connection status on load
  useEffect(() => {
    const checkConnection = async () => {
      if (!isEthereumAvailable()) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const address = accounts[0].address;
          await updateWalletInfo(provider, address);
          setConnected(true);

          // Verify token if exists
          const token = localStorage.getItem("auth_token");
          if (token) {
            try {
              const res = await apiRequest("GET", "/api/auth/me");
              if (res.ok) {
                setIsAuthenticated(true);
              } else {
                console.warn("Token validation failed on mount");
                localStorage.removeItem("auth_token");
                setIsAuthenticated(false);
              }
            } catch (e) {
              console.error("Error verifying token on mount:", e);
              localStorage.removeItem("auth_token");
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkConnection();
  }, []);

  // Set up listeners for account and chain changes
  useEffect(() => {
    if (!isEthereumAvailable() || !connected) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect();
      } else if (connected) {
        // User switched accounts
        const provider = new ethers.BrowserProvider(window.ethereum);
        await updateWalletInfo(provider, accounts[0]);
        toast.success(`Account Changed: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      // Chain changed, reload the page to ensure all data is fresh
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      // Clean up listeners
      if (isEthereumAvailable()) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [connected]);

  // Try to create a user if they don't exist yet
  const tryCreateUser = async (address: string) => {
    try {
      // First check if the user already exists (using apiRequest)
      // Note: apiRequest throws on non-200 responses
      const checkResponse = await apiRequest("GET", `/api/users/wallet/${address}`);
      
      if (checkResponse.ok) {
        return await checkResponse.json();
      }
    } catch (error: any) {
      // Correctly handle the 404 status contained in the error message
      if (error?.message?.includes('404')) {
        try {
          // Create a new user with the wallet address
          const newUser = {
            walletAddress: address,
            displayName: "",
            profileImage: null,
            preferences: JSON.stringify({
              darkMode: true,
              animations: true,
              notifications: true
            })
          };
          
          const res = await apiRequest("POST", "/api/users", newUser);
          console.log("Created new user for wallet:", address);
          return await res.json();
        } catch (createError) {
          console.error("Critical error creating user after 404 check:", createError);
        }
      } else {
        // Log other actual errors (unless they're expected auth errors)
        if (!error?.message?.includes('403') && !error?.message?.includes('401')) {
          console.error("Error checking user enrollment:", error);
        }
      }
    }
    return null;
  };

  // Helper to force Sepolia network
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Hexadecimal for 11155111
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia test network',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Sepolia network", addError);
          return false;
        }
      }
      console.error("Error switching to Sepolia", switchError);
      return false;
    }
  };

  // Helper to update wallet info
  const updateWalletInfo = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      let network = await provider.getNetwork();
      
      // Enforce Sepolia Network (Chain ID 11155111)
      if (Number(network.chainId) !== 11155111) {
        const switched = await switchToSepolia();
        if (switched) {
          // Re-instantiate provider and re-fetch network after switch
          provider = new ethers.BrowserProvider(window.ethereum);
          network = await provider.getNetwork();
        } else {
          toast.error("Please switch your wallet to the Sepolia testnet to continue.", { id: "network-error" });
        }
      }

      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      
      // Fetch Roles directly from the smart contract!
      // Fetch Roles and database user in parallel to speed up login
      const [roles, dbUser] = await Promise.all([
        getUserRoles(address),
        tryCreateUser(address)
      ]);
      
      // Determine wallet type
      let walletType = "Unknown";
      if (isEthereumAvailable()) {
        if (window.ethereum.isMetaMask) walletType = "MetaMask";
        else if (window.ethereum.isCoinbaseWallet) walletType = "Coinbase Wallet";
        else if (window.ethereum.isWalletConnect) walletType = "WalletConnect";
        else if (window.ethereum.isTrust) walletType = "Trust Wallet";
      }
      
      const newWalletInfo: WalletInfo = {
        address,
        chainId: Number(network.chainId),
        network: Number(network.chainId) === 11155111 ? "Sepolia" : network.name,
        balance: formattedBalance,
        walletType,
        roles,
        dbUser
      };
      
      setWalletInfo(newWalletInfo);
    } catch (error) {
      console.error("Error updating wallet info:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!walletInfo?.address) return;
    try {
      const dbUser = await tryCreateUser(walletInfo.address);
      if (dbUser) {
        setWalletInfo(prev => prev ? { ...prev, dbUser } : null);
      }
    } catch (error) {
       console.error("Error refreshing user:", error);
    }
  };

  // Connect to any available wallet
  const connect = async () => {
    if (!isEthereumAvailable()) {
      const msg = "No Ethereum wallet detected. Please install MetaMask.";
      setConnectionError(msg);
      toast.error(msg);
      return;
    }

    try {
      setConnecting(true);
      setConnectionError(null);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error("No accounts authorized");
      }
      
      const address = accounts[0];

      // Authenticate with backend
      toast.loading("Requesting authentication nonce...", { id: "auth-step" });
      const loginRes = await apiRequest("POST", "/api/auth/login", { address });
      
      if (loginRes.status === 429) {
        throw new Error("Too many authentication attempts. Please try again later.");
      }
      if (!loginRes.ok) throw new Error("Failed to get login nonce from server.");
      
      const { nonce } = await loginRes.json();

      toast.loading("Waiting for signature...", { id: "auth-step" });
      const signer = await provider.getSigner();
      let signature;
      try {
        signature = await signer.signMessage(nonce);
      } catch (e: any) {
        if (e.code === 4001) throw new Error("Signature request denied by user.");
        throw e;
      }

      toast.loading("Verifying signature...", { id: "auth-step" });
      const verifyRes = await apiRequest("POST", "/api/auth/verify-signature", { address, signature });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.message || "Signature verification failed.");
      }
      
      const { token } = await verifyRes.json();
      localStorage.setItem("auth_token", token);

      await updateWalletInfo(provider, address);
      setConnected(true);
      setIsAuthenticated(true);
      
      toast.success("Wallet Authenticated & Connected", { id: "auth-step" });
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      const message = error.message || "Failed to connect wallet";
      setConnectionError(message);
      toast.error(message, { id: "auth-step" });
    } finally {
      setConnecting(false);
    }
  };

  const connectToSpecificWallet = async (walletType: string) => {
    return connect();
  };

  const disconnect = () => {
    localStorage.removeItem("auth_token");
    setConnected(false);
    setIsAuthenticated(false);
    setWalletInfo(null);
    setConnectionError(null);
    toast.success("Wallet Disconnected");
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!isEthereumAvailable()) throw new Error("Ethereum wallet not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return await signer.signMessage(message);
  };

  // Derived authentication state is now handled by state to be reactive
  
  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        address: walletInfo?.address || null,
        walletInfo,
        connect,
        connectToSpecificWallet,
        disconnect,
        refreshUser,
        signMessage,
        switchNetwork: switchToSepolia,
        connectionError,
        chainId: walletInfo?.chainId || null,
        isAuthenticated
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};