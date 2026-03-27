"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, ShieldAlert, History, FileText, Lock, ExternalLink, Loader2, Fingerprint, Search, Download, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // Added Input import
import { verifyDocument, getUserRoles, logAuditAction } from "@/lib/contractService" 
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { FileUpload } from "@/components/forms/FileUpload"
import { useWallet } from "@/context/WalletContext"; // Ensure useWallet is imported
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";

// Removed REGISTRY_ADDRESS and REGISTRY_ABI as they are handled by contractService

function VerificationContent() {
  const searchParams = useSearchParams()
  const hash = searchParams.get("hash")

  const [isVerifying, setIsVerifying] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileHash, setFileHash] = useState<string | null>(null)
  const [mismatches, setMismatches] = useState<{ [key: string]: { original: any; uploaded: any } } | null>(null)
  const [userWalletInput, setUserWalletInput] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  const { walletInfo, refreshUser } = useWallet();
  const dbUser = walletInfo?.dbUser;
  const isAdmin = walletInfo?.roles?.isAdmin || dbUser?.isSuperAdmin;
  const isApprovedIssuer = dbUser?.roleStatus === 'APPROVED';
  const hasQuota = dbUser && (dbUser.isSuperAdmin || dbUser.verificationCount < dbUser.verificationLimit);

  // If user is logged in as Admin, approved Issuer, or has remaining quota
  useEffect(() => {
    if (isAdmin || isApprovedIssuer || hasQuota) {
      setIsPaid(true);
    }
  }, [isAdmin, isApprovedIssuer, hasQuota]);

  const handlePayment = async () => {
    if (!(window as any).ethereum) {
      toast.error("MetaMask not found!");
      return;
    }

    try {
      setIsPaying(true);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xFA0978539bbb30776ED0664D2413A8A6F8145A61";
      const fee = ethers.parseEther("0.001");

      const tx = await signer.sendTransaction({
        to: adminWallet,
        value: fee
      });

      toast.loading("Verifying transaction...");
      await tx.wait();
      
      setIsPaid(true);
      toast.success("Verification unlocked!");
    } catch (err: any) {
      console.error("Payment failed:", err);
      toast.error(err.message || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    if (!hash) {
      setError("No document hash provided in the URL.")
      setIsVerifying(false)
      return
    }

    const verify = async () => {
      try {
        setIsVerifying(true)
        setError(null)

        const docRecord = await verifyDocument(hash);
        
        if (!docRecord || docRecord.notFound) {
          setResult({ isValid: false, notFound: true });
          return;
        }

        // Check Issuer Role
        const roles = await getUserRoles(docRecord.owner);

        let contentMismatches: any = null;
        let fileIntegrityMatch = true; // By default true for URL-based check
        let isIdentityMatch = null;
        let dbIssuedTo: string | null = null;

        // Try to fetch DB record for deeper comparison if needed
        try {
          const res = await apiRequest('GET', `/api/documents/hash/${hash}`);
          if (res.ok) {
            const docDb = await res.json();
            dbIssuedTo = docDb.issuedTo;
          }
        } catch (e) {}

        // Identity Binding (if user provided input)
        const docOwnerAddress = dbIssuedTo?.toLowerCase() || docRecord.owner.toLowerCase();
        if (userWalletInput) {
          isIdentityMatch = userWalletInput.toLowerCase() === docOwnerAddress;
        }

        const isFullyValid = docRecord.isValid;

        // Dynamic Trust Score (Initial)
        let calculatedScore = 0;
        if (docRecord.isValid) {
          calculatedScore += 60;
          calculatedScore += 20; // 20 for integrity (we don't have file yet)
          if (isIdentityMatch) calculatedScore += 10;
        }

        setResult({
          isValid: docRecord.isValid,
          isFullyValid,
          docId: docRecord.docId,
          sha256Hash: docRecord.sha256Hash,
          ipfsHash: docRecord.ipfsHash,
          docType: docRecord.docType,
          owner: docRecord.owner,
          timestamp: docRecord.timestamp.toLocaleString(),
          isPublic: docRecord.isPublic,
          issuerRoles: roles,
          registeredBy: docRecord.owner,
          trustScore: calculatedScore,
          identityMatch: isIdentityMatch
        })

        // Log Verification (Async)
        logAuditAction(docRecord.docId, 1, `Public verified via URL. Hash: ${hash}`);

        // Increment Quota (Async) if using quota to verify
        if (walletInfo?.address && !isAdmin && !isApprovedIssuer && hasQuota) {
           apiRequest('POST', `/api/users/verifications/increment/${walletInfo.address}`)
             .then(() => refreshUser())
             .catch(e => console.warn("Quota increment failed", e));
        }
      } catch (err: any) {
        console.error("Public verification error:", err)
        setError("Failed to query the blockchain. The network might be congested, please try again.")
        setResult(null)
      } finally {
        setIsVerifying(false)
      }
    }

    verify()
  }, [hash, userWalletInput])

  const handleFileVerify = async (selectedFile: File, selectedHash: string) => {
    setFile(selectedFile);
    setFileHash(selectedHash);
    
    if (!result) return;
    
    let contentMismatches: any = null;
    let fileIntegrityMatch = selectedHash === hash;
    
    // If it's a JSON Verifiable Credential, compare contents
    if (selectedFile.type === "application/json" || selectedFile.name.endsWith(".json")) {
      try {
        const text = await selectedFile.text();
        const parsedJson = JSON.parse(text);
        
        if (parsedJson && parsedJson.credentialSubject) {
          const res = await apiRequest('GET', `/api/documents/hash/${hash}`);
          if (res.ok) {
            const docDb = await res.json();
            const fetchedOriginal = docDb.fieldData || {};
            
            const tempMismatches: any = {};
            const keys = new Set([...Object.keys(parsedJson.credentialSubject), ...Object.keys(fetchedOriginal)]);
            keys.forEach(key => {
              const uploadedVal = parsedJson.credentialSubject[key];
              const originalVal = fetchedOriginal[key];
              if (JSON.stringify(uploadedVal) !== JSON.stringify(originalVal)) {
                 tempMismatches[key] = { original: originalVal, uploaded: uploadedVal };
              }
            });
            
            if (Object.keys(tempMismatches).length > 0) {
              contentMismatches = tempMismatches;
              setMismatches(tempMismatches);
            }
          }
        }
      } catch (e) {
        console.error("JSON parsing error", e);
      }
    }

    const isFullyValid = result.isValid && fileIntegrityMatch && !contentMismatches;
    
    // Update Trust Score
    let calculatedScore = 0;
    if (result.isValid) {
      calculatedScore += 60;
      if (fileIntegrityMatch) calculatedScore += 20;
      if (!contentMismatches) calculatedScore += 10;
      if (result.identityMatch) calculatedScore += 10;
    }

    setResult({
      ...result,
      isFullyValid,
      fileIntegrityMatch,
      contentIntegrityMatch: !contentMismatches,
      trustScore: calculatedScore
    });

    logAuditAction(result.docId, 1, `Public Compare Mode. Match: ${isFullyValid}`);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('public-verification-panel');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0B0F19' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(11, 15, 25);
      pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F');
      
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text("DNAProof Verification Report (Public)", 15, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
      pdf.text(`Verification Hash: ${hash}`, 15, 34);

      const margin = 10;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, 45, printWidth, printHeight);
      
      pdf.save(`DNAProof_Public_Report_${(hash as string).substring(0,8)}.pdf`);
    } catch (e) {
      console.error("PDF gen failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
             <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Public Document Verification</h1>
          <p className="text-foreground/40 max-w-md mx-auto">
            This portal confirms the cryptographic authenticity of documents registered on the DNAProof global ledger.
          </p>
        </div>

        <Card className="glass-card border-white/5 border overflow-hidden">
          <AnimatePresence mode="wait">
             {isVerifying ? (
               <motion.div
                 key="loading"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="p-12 flex flex-col items-center justify-center text-center space-y-4"
               >
                 <Loader2 className="w-10 h-10 text-primary animate-spin" />
                 <p className="text-foreground/60 font-medium">Querying distributed ledgers...</p>
                 <p className="text-xs text-foreground/30">Ensuring zero tampering occurred</p>
               </motion.div>
             ) : error ? (
               <motion.div
                 key="error"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-8 flex flex-col items-center text-center space-y-4"
               >
                 <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <ShieldAlert className="w-8 h-8" />
                 </div>
                 <h2 className="text-xl font-bold text-red-500">Verification Failed</h2>
                 <p className="text-foreground/60">{error}</p>
                 <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-white/10 hover:bg-white/5">
                    Retry Verification
                 </Button>
               </motion.div>
             ) : result && !result.notFound ? (
               <div className="space-y-4">
               <motion.div
                 id="public-verification-panel"
                 key="result"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`glass-card p-6 md:p-8 rounded-3xl space-y-6 md:space-y-8 relative overflow-hidden ${result.isValid ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
               >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                     <div className={`w-20 h-20 shrink-0 rounded-3xl flex items-center justify-center ${result.isValid ? 'bg-green-500/20 neon-glow-green text-green-500' : 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                        {result.isValid ? <ShieldCheck className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                     </div>
                     <div className="flex-1 mt-2">
                        <h3 className={`text-3xl font-black uppercase tracking-tighter ${result.isValid ? 'text-green-500' : 'text-red-500'}`}>
                          {result.isValid ? 'Authentic Document' : 'Revoked Document'}
                        </h3>
                        <p className={`text-sm mt-2 ${result.isValid ? 'text-green-500/70' : 'text-red-500/70'}`}>
                          {result.isValid 
                            ? 'This document exactly matches the cryptographic identity registered on-chain. It has not been tampered with or altered.' 
                            : 'This document has been revoked by the issuing authority and is no longer valid.'}
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { 
                         label: "Registered By", 
                         val: result.registeredBy ? `${result.registeredBy.substring(0,6)}...${result.registeredBy.substring(38)}` : 'Unknown', 
                         icon: Fingerprint, // Changed to Fingerprint as ShieldCheck is used for the badge
                         badge: result.issuerRoles?.isIssuer ? <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">✔ Verified Issuer</span> : null
                       },
                       { label: "Anchor Time", val: result.timestamp, icon: History },
                       { label: "Doc Type", val: result.docType || "GENERIC", icon: FileText },
                       { label: "Visibility", val: result.isPublic ? "Public" : "Private", icon: Lock },
                     ].map((item, i) => (
                       <div key={i} className="p-4 rounded-xl bg-[#0B0F19] border border-white/5 overflow-hidden">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1 flex items-center gap-1">
                             <item.icon className="w-3 h-3" />
                             {item.label}
                             {item.badge}
                          </p>
                          <p className="text-sm font-bold truncate">{item.val}</p>
                       </div>
                     ))}
                  </div>

                  {/* Phase 1: Advanced Verification Engine UI - Payment Gated */}
                  {!isPaid ? (
                    <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 text-center space-y-4 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                       <Lock className="w-12 h-12 text-primary mx-auto mb-2 opacity-50" />
                       <div>
                         <h4 className="text-xl font-bold text-foreground">Verification Details Locked</h4>
                         <p className="text-sm text-foreground/60 mt-2 max-w-sm mx-auto">
                           To maintain the security of our distributed ledger, a minimal verification fee of **0.001 ETH** is required for full document audits.
                         </p>
                       </div>
                       <Button 
                         onClick={handlePayment} 
                         disabled={isPaying}
                         className="bg-primary text-white neon-glow px-8 h-12 rounded-xl border-0 hover:scale-105 transition-transform"
                       >
                         {isPaying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                         {isPaying ? "Processing..." : "Pay 0.001 ETH to Unlock"}
                       </Button>
                       <p className="text-[10px] text-foreground/40 font-medium">Verified Issuers and Admin accounts can bypass this fee.</p>
                    </div>
                  ) : (
                    <>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Detailed Checks */ }
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                             <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 flex items-center gap-2">
                                <Search className="w-3 h-3" /> Detailed Checks
                             </p>
                             <div className="space-y-2 text-sm font-medium">
                                <div className="flex justify-between items-center">
                                   <span className="text-foreground/60">File Integrity</span>
                                   <span className={result.fileIntegrityMatch === false ? "text-red-400" : "text-green-400"}>{result.fileIntegrityMatch === false ? "❌ MISMATCH" : "✔ MATCH"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <span className="text-foreground/60">Content Integrity</span>
                                   <span className={result.contentIntegrityMatch === false ? "text-red-400" : "text-green-400"}>{result.contentIntegrityMatch === false ? "❌ MISMATCH" : "✔ MATCH"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-foreground/60">Signature Valid</span>
                                    <span className={result.isValid ? "text-green-400" : "text-red-400"}>{result.isValid ? "✔ VERIFIED" : "❌ CORRUPTED"}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-foreground/60">Blockchain Record</span>
                                    <span className={result.isValid ? "text-green-400" : "text-red-400"}>{result.isValid ? "✔ FOUND" : "❌ NOT FOUND"}</span>
                                 </div>
                                 {result.identityMatch !== null && (
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                                       <span className="text-foreground/80 font-bold">Identity Binding</span>
                                       <span className={result.identityMatch ? "text-green-400" : "text-red-400"}>{result.identityMatch ? "✔ MATCH" : "❌ MISMATCH"}</span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Trust Score */}
                           <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-center items-center text-center space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1 flex items-center gap-2">
                                 <ShieldCheck className="w-3 h-3" /> Trust Score
                              </p>
                              <div className="relative flex items-center justify-center w-24 h-24">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                          strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (result.trustScore || 0) / 100)} 
                                          className={`transition-all duration-1000 ${result.isValid ? 'text-green-500' : 'text-red-500'}`} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className={`text-2xl font-black ${result.isValid ? 'text-green-500' : 'text-red-500'}`}>{result.trustScore || '0'}</span>
                                  <span className="text-[10px] text-foreground/40 font-bold uppercase">/ 100</span>
                                </div>
                              </div>
                           </div>
                        </div>

                        {/* Phase 5: Compare Mode & Identity Input */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 flex items-center gap-2">
                                 <Fingerprint className="w-3 h-3" /> Identity Self-Check
                              </p>
                              <div className="space-y-2">
                                  <Input 
                                     placeholder="Paste your wallet address..." 
                                     value={userWalletInput}
                                     onChange={(e) => setUserWalletInput(e.target.value)}
                                     className="bg-black/20 border-white/10 text-xs h-9"
                                  />
                                  <p className="text-[9px] text-foreground/30">Verify if you are the intended owner/recipient of this document.</p>
                              </div>
                           </div>

                           <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 flex items-center gap-2">
                                 <FileText className="w-3 h-3" /> Tamper Detection
                              </p>
                              <div className="scale-75 -m-6 origin-top">
                                  <FileUpload 
                                    onFileSelect={handleFileVerify}
                                    onClear={() => { setFile(null); setFileHash(null); setMismatches(null); }}
                                  />
                              </div>
                           </div>
                        </div>
                    </>
                  )}

                   {/* Fraud Table */}
                   {mismatches && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 overflow-hidden">
                         <p className="text-[10px] font-black uppercase tracking-widest text-red-500/80 mb-3 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Content Discrepancies Detected
                         </p>
                         <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-[11px] text-left">
                               <thead className="uppercase text-foreground/40 bg-black/40">
                                  <tr>
                                     <th className="px-3 py-1.5 rounded-l-lg">Field</th>
                                     <th className="px-3 py-1.5">Original</th>
                                     <th className="px-3 py-1.5 rounded-r-lg">Uploaded</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {Object.entries(mismatches).map(([key, data], idx) => (
                                     <tr key={idx} className="border-b border-white/5 last:border-0">
                                        <td className="px-3 py-2 font-medium">{key}</td>
                                        <td className="px-3 py-2 text-green-400">{JSON.stringify(data.original)}</td>
                                        <td className="px-3 py-2 text-red-400">{JSON.stringify(data.uploaded)} ❌</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   )}

                  <div className="p-4 rounded-xl bg-black/50 border border-white/5 overflow-hidden">
                     <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">Original Document Fingerprint</p>
                     <p className="text-xs font-mono break-all text-primary/80">{hash}</p>
                  </div>
               </motion.div>

                  <div className="flex flex-col sm:flex-row gap-4">
                     {result.ipfsHash && (
                       <Button 
                         onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${result.ipfsHash}`, '_blank')}
                         className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 gap-2"
                       >
                          <ExternalLink className="w-4 h-4" /> View Original File
                       </Button>
                     )}
                     <Button 
                       onClick={handleDownloadPDF}
                       className="flex-1 h-12 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary gap-2 transition-all"
                     >
                        <Download className="w-4 h-4" /> Download PDF Report
                     </Button>
                  </div>
               </div>
             ) : (
               <motion.div
                 key="not-found"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-12 flex flex-col items-center text-center space-y-4"
               >
                 <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center grayscale opacity-50">
                    <ShieldAlert className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-bold text-foreground/50 uppercase tracking-tight">Record Not Found</h2>
                 <p className="text-foreground/40 max-w-sm">
                   We could not find a registered document matching this fingerprint. It may be forged or completely unregistered.
                 </p>
                 <div className="p-4 rounded-xl bg-black/30 border border-white/5 w-full mt-4 flex items-center gap-4">
                    <Fingerprint className="w-5 h-5 text-foreground/30 shrink-0" />
                    <p className="text-xs font-mono truncate text-foreground/40 flex-1 text-left">{hash}</p>
                 </div>
               </motion.div>
             )}
          </AnimatePresence>
        </Card>

        <p className="text-center text-[10px] font-bold tracking-widest uppercase text-foreground/20">
          Powered by DNAProof Distributed Ledger Infrastructure
        </p>
      </div>
    </div>
  )
}

export default function PublicVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 sm:p-8 font-sans">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <VerificationContent />
    </Suspense>
  )
}
