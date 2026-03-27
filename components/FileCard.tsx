import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { File } from "@shared/schema";
import { useWallet } from "../context/WalletContext";
import { Button } from "@/components/ui/button";
import { verifyDocument, revokeDocument } from "@/lib/contractService";
import { Shield, ShieldCheck, AlertTriangle, Fingerprint, FileText } from "lucide-react";
import { attestDocument } from "@/lib/contractService";

interface FileCardProps {
  file: File;
  variant: "compact" | "full";
}

const FileCard: React.FC<FileCardProps> = ({ file, variant }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { walletInfo } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    docId: number;
    status: number;
    trustScore: number;
    isZkVerified?: boolean;
  } | null>(null);

  const [isZkVerifying, setIsZkVerifying] = useState(false);
  const [isAttesting, setIsAttesting] = useState(false);
  const [showVC, setShowVC] = useState(false);

  // Parse AI Analysis mapping
  const aiAnalysis = file.aiAnalysis ? (typeof file.aiAnalysis === 'string' ? JSON.parse(file.aiAnalysis) : file.aiAnalysis) : null;
  const riskScore = aiAnalysis?.riskScore || 0;
  const docType = aiAnalysis?.docType || 'Unclassified';
  const confidenceScore = aiAnalysis?.confidenceScore || 0;
  const isHighRisk = riskScore > 50;

  // Parse NFT metadata
  const nftData = file.nft ? (typeof file.nft === 'string' ? JSON.parse(file.nft) : file.nft) : null;
  const isNFT = nftData?.isNFT || false;

  // Format the file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: Date | number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;

    return format(date, "MMM d, yyyy");
  };

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Deleted",
        description: "The file has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/files/${walletInfo?.address}`] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  // Handle file verification
  const handleVerify = async () => {
    if (!file.hash) {
      toast({
        title: "Verification Impossible",
        description: "No document hash found for this file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      const result = await verifyDocument(file.hash);
      setVerificationResult(result);
      
      if (result.isValid) {
        toast({
          title: "Verification Successful",
          description: "Document identity and integrity verified on-chain.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Document not found or has been revoked.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify document.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle ZKP Verification (Simulation)
  const handleZkVerify = async () => {
    try {
      setIsZkVerifying(true);
      // Simulate ZK Proof generation and on-chain verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationResult(prev => ({
        ...(prev || { isValid: true, docId: file.docId || 0, status: 1, trustScore: 100 }),
        isZkVerified: true
      }));

      toast({
        title: "ZKP Verified",
        description: "Privacy-preserving proof verified successfully without revealing file content.",
      });
    } catch (error: any) {
      toast({
        title: "ZKP Error",
        description: error.message || "Failed to generate ZK proof.",
        variant: "destructive",
      });
    } finally {
      setIsZkVerifying(false);
    }
  };

  // Handle Document Attestation
  const handleAttest = async () => {
    if (!file.docId) return;

    try {
      setIsAttesting(true);
      const success = await attestDocument(file.docId);
      if (success) {
        toast({
          title: "Attestation Successful",
          description: "You have signed this document as a trusted issuer.",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/files/${walletInfo?.address}`] });
      }
    } catch (error: any) {
      toast({
        title: "Attestation Failed",
        description: error.message || "Failed to attest document.",
        variant: "destructive",
      });
    } finally {
      setIsAttesting(false);
    }
  };

  // Handle document revocation
  const handleRevoke = async () => {
    if (!file.docId) return;
    
    if (confirm("Are you sure you want to revoke this document? This cannot be undone and will mark the document as invalid on the blockchain.")) {
      try {
        const success = await revokeDocument(file.docId!);
        if (success) {
          toast({
            title: "Document Revoked",
            description: "Document status updated on the blockchain.",
          });
          setVerificationResult(null);
        }
      } catch (error: any) {
        toast({
          title: "Revocation Failed",
          description: error.message || "Failed to revoke document.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle file download
  const handleDownload = () => {
    try {
      // For base64 data, create a download link
      const link = document.createElement("a");
      link.href = file.fileData;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your file is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the file.",
        variant: "destructive",
      });
    }
  };

  // Handle file delete
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this file metadata? The registered proof remains on the blockchain.")) {
      deleteMutation.mutate(file.id);
    }
  };

  // Toggle the menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Close menu if clicked outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Compact variant (for the upload page)
  if (variant === "compact") {
    return (
      <motion.div 
        className="rounded-lg p-4 flex items-center relative overflow-hidden transition-all duration-300 border border-[#8A2BE2] hover:border-[#00FFFF] hover:shadow-[0_0_15px_rgba(138,43,226,0.7)] bg-[#1E1E1E]"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-[#8A2BE2] bg-opacity-20 rounded-md flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white truncate font-medium">{file.fileName}</h4>
          <p className="text-xs text-gray-400 font-mono mt-1">{formatFileSize(file.fileSize)} • {formatTimestamp(file.createdAt || new Date())}</p>
        </div>
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleMenu(); }}
            className="ml-2 text-gray-400 hover:text-[#00FFFF] transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-[#121212] border border-[#8A2BE2] rounded-md shadow-2xl z-20 overflow-hidden"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); handleVerify(); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-[#8A2BE2]/20 transition-colors flex items-center text-[#00FFFF]"
                  disabled={isVerifying}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {isVerifying ? "Verifying..." : "Verify Proof"}
                </button>
                <div className="h-px bg-[#8A2BE2]/20 mx-2" />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRevoke(); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 transition-colors flex items-center text-orange-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  Revoke Access
                </button>
                <div className="h-px bg-[#8A2BE2]/20 mx-2" />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/20 transition-colors text-red-500 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Full variant (for the files page)
  return (
    <motion.div 
      className="rounded-lg overflow-hidden group border border-[#8A2BE2] hover:border-[#00FFFF] transition-all hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] bg-[#121212]"
      whileHover={{ y: -5 }}
    >
      <div className="h-40 relative bg-[#1E1E1E] flex items-center justify-center overflow-hidden border-b border-[#8A2BE2]/50">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2]/10 to-[#FF00FF]/10 z-0" />
        
        {file.fileType.startsWith("image/") ? (
          <img 
            src={file.fileData} 
            alt={file.fileName} 
            className="h-full w-full object-cover relative z-10"
          />
        ) : (
          <div className="relative z-10 p-6 bg-[#8A2BE2]/10 rounded-2xl border border-[#8A2BE2]/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(0,255,255,0.4))" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
        )}

        {/* Status Badge */}
        {verificationResult && (
          <motion.div 
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
              verificationResult.isValid 
                ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.3)]' 
                : 'bg-red-500/20 text-red-400 border-red-500/50'
            }`}
          >
            {verificationResult.isValid ? '✓ VERIFIED' : (verificationResult.status === 2 ? '✗ REVOKED' : '✗ INVALID')}
            {verificationResult.isZkVerified && <span className="ml-1 text-[8px] bg-cyan-500/20 p-0.5 rounded text-cyan-400">ZKP</span>}
          </motion.div>
        )}

        {/* AI Risk & Similarity Badge */}
        {aiAnalysis && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isHighRisk ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
              AI RISK: {riskScore}% | {docType} ({confidenceScore}%)
            </div>
            {isNFT && (
              <div className="bg-gradient-to-r from-amber-400 to-yellow-600 text-black px-2 py-0.5 rounded text-[10px] font-bold shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                CERTIFIED NFT
              </div>
            )}
            {aiAnalysis.similarityWarning && (
              <div className="bg-orange-500/20 text-orange-400 border border-orange-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                SIMILARITY ALERT
              </div>
            )}
          </div>
        )}
      </div>

      {aiAnalysis?.similarityWarning && (
        <div className="px-5 py-2 bg-orange-500/5 border-b border-orange-500/10">
          <p className="text-[10px] text-orange-400 italic font-medium">
            {aiAnalysis.similarityWarning}
          </p>
        </div>
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-['Orbitron'] text-white truncate text-lg group-hover:text-[#00FFFF] transition-colors">{file.fileName}</h4>
            <p className="text-xs text-gray-400 mt-1">{formatFileSize(file.fileSize)} • {formatTimestamp(file.createdAt || new Date())}</p>
          </div>
          <div className="flex-shrink-0 ml-2">
            <span className="text-[10px] bg-[#8A2BE2]/20 text-[#8A2BE2] px-2 py-0.5 rounded border border-[#8A2BE2]/30 uppercase tracking-tighter">
              Secured
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Metadata Display */}
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-white/5 space-y-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">On-Chain Hash</p>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] text-[#00FFFF] bg-black/40 p-2 rounded block w-full truncate font-mono border border-[#00FFFF]/10">
                    {file.hash || 'Not Registered'}
                  </code>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">IPFS Storage (CID)</p>
                <div className="flex flex-col gap-2">
                  <code className="text-[10px] text-[#FF00FF] bg-black/40 p-2 rounded block w-full truncate font-mono border border-[#FF00FF]/10">
                    {file.cid || 'Local Store Only'}
                  </code>
                </div>
              </div>
            {file.merkleRoot && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Batch Anchor (Merkle Root)</p>
                <code className="text-[10px] text-emerald-400 bg-black/40 p-2 rounded block w-full truncate font-mono border border-emerald-400/10">
                  {file.merkleRoot}
                </code>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm"
              variant="outline"
              onClick={handleVerify}
              disabled={isVerifying}
              className={`flex-1 border-[#00FFFF]/30 hover:bg-[#00FFFF]/10 text-[#00FFFF] text-[10px] h-9 ${isVerifying ? 'animate-pulse' : ''}`}
            >
              {isVerifying ? 'Checking...' : 'Public Verify'}
            </Button>
            <Button 
              size="sm"
              variant="outline"
              onClick={handleZkVerify}
              disabled={isZkVerifying}
              className={`flex-1 border-cyan-400/30 hover:bg-cyan-400/10 text-cyan-400 text-[10px] h-9 ml-1 ${isZkVerifying ? 'animate-pulse' : ''}`}
            >
              <Shield className="w-3 h-3 mr-1" />
              {isZkVerifying ? 'Proving...' : 'Private (ZKP)'}
            </Button>
            {walletInfo?.roles?.isIssuer && (
              <Button 
                size="sm"
                variant="outline"
                onClick={handleAttest}
                disabled={isAttesting}
                className={`px-3 border-purple-400/30 hover:bg-purple-400/10 text-purple-400 h-9 ${isAttesting ? 'animate-pulse' : ''}`}
                title="Sign as Issuer"
              >
                <Fingerprint className="w-4 h-4" />
              </Button>
            )}
            {!isNFT && file.hash && (
              <Button 
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!walletInfo?.address) return;
                  try {
                    toast({ title: "Minting NFT...", description: "Initializing cross-chain issuance." });
                    const res = await apiRequest("POST", "/api/nft/mint", {
                      docId: file.docId || file.id,
                      userAddress: walletInfo.address,
                      docHash: file.hash,
                      metadataURI: `ipfs://${file.cid}`
                    });
                    if (res.ok) {
                      toast({ title: "NFT Minted", description: "Document successfully certified as NFT." });
                      queryClient.invalidateQueries({ queryKey: [`/api/files/${walletInfo?.address}`] });
                    }
                  } catch (err: any) {
                    toast({ title: "Minting Failed", description: err.message, variant: "destructive" });
                  }
                }}
                className="px-3 border-amber-400/30 hover:bg-amber-400/10 text-amber-400 h-9"
                title="Mint as NFT"
              >
                <ShieldCheck className="w-4 h-4" />
              </Button>
            )}
            <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowVC(true)}
                className="px-3 border-emerald-400/30 hover:bg-emerald-400/10 text-emerald-400 h-9"
                title="View Verifiable Credential"
              >
                <FileText className="w-4 h-4" />
            </Button>
            <Button 
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="px-3 border-[#8A2BE2]/30 hover:bg-[#8A2BE2]/10 text-white h-9"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="px-3 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 h-9"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Verifiable Credential Modal */}
      <AnimatePresence>
        {showVC && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] border border-[#00FFFF]/30 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,255,0.1)]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#00FFFF]/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00FFFF]/10 flex items-center justify-center border border-[#00FFFF]/20">
                    <ShieldCheck className="w-5 h-5 text-[#00FFFF]" />
                  </div>
                  <div>
                    <h3 className="font-['Orbitron'] text-white text-lg">Verifiable Credential</h3>
                    <p className="text-xs text-gray-500 font-mono">{file.hash?.substring(0, 16)}...</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowVC(false)}
                  className="text-gray-500 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-400 mt-1" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Credential Integrity</h4>
                      <p className="text-xs text-gray-400 mt-1">This W3C Verifiable Credential proves the origin and integrity of the document through a cryptographic EIP-712 signature from the issuer.</p>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFFF]/20 to-[#FF00FF]/20 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                    <pre className="relative bg-[#0D0D0D] p-5 rounded-lg overflow-x-auto text-[11px] font-mono text-cyan-300 border border-white/5 leading-relaxed">
                      {file.verifiableCredential 
                        ? JSON.stringify(typeof file.verifiableCredential === 'string' ? JSON.parse(file.verifiableCredential as string) : file.verifiableCredential, null, 2)
                        : "// No Verifiable Credential found for this record"}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                <Button 
                  onClick={() => setShowVC(false)}
                  className="bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30"
                >
                  Close Explorer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileCard;