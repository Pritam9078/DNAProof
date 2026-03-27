"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { FileUpload } from "@/components/forms/FileUpload";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  UploadCloud, 
  ShieldCheck, 
  FileCheck, 
  Search, 
  Fingerprint, 
  Lock, 
  FileText, 
  History, 
  ExternalLink, 
  Share2, 
  ClipboardSignature, 
  Download,
  Copy,
  Twitter,
  Mail,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { verifyDocument, getUserRoles, logAuditAction } from "@/lib/contractService";
import { useWallet } from "@/context/WalletContext";
import { apiRequest } from "@/lib/queryClient";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function VerifyDocumentPage() {
  const { address, walletInfo, refreshUser } = useWallet();
  const dbUser = walletInfo?.dbUser;
  const isQuotaExceeded = dbUser && !dbUser.isSuperAdmin && dbUser.verificationCount >= dbUser.verificationLimit;

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [searchHash, setSearchHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [verifiedHash, setVerifiedHash] = useState<string | null>(null);
  const [mismatches, setMismatches] = useState<{ [key: string]: { original: any; uploaded: any } } | null>(null);

  const handleVerify = async () => {
    let targetHash = hash || searchHash;
    if (!targetHash && !file) {
      toast.error("Please provide a file or a document hash");
      return;
    }

    setIsVerifying(true);
    setResult(null); // reset previous result
    setMismatches(null);
    let parsedJson: any = null;

    if (file && file.name.endsWith(".json")) {
      try {
        const text = await file.text();
        parsedJson = JSON.parse(text);
        if (parsedJson.fileHash && parsedJson.credentialSubject) {
          targetHash = parsedJson.fileHash;
        }
      } catch (e) {
        console.warn("Could not parse JSON", e);
      }
    }

    if (!targetHash) {
      toast.error("Could not determine document hash.");
      setIsVerifying(false);
      return;
    }

    const loadingToast = toast.loading("Querying global ledgers for authenticity...");

    try {
      const docRecord = await verifyDocument(targetHash);
      
      if (!docRecord) {
        toast.error("Document not found on the blockchain. It may have been tampered with or not registered.", { id: loadingToast, duration: 5000 });
        return;
      }

      let contentMismatches: any = null;
      let fileIntegrityMatch = !file || targetHash === hash;
      let dbIssuedTo: string | null = null;
      let orgName: string | null = null;

      try {
        const res = await apiRequest("GET", `/api/documents/hash/${targetHash}`);
        if (res.ok) {
          const docDb = await res.json();
          dbIssuedTo = docDb.issuedTo;
          
          if (parsedJson && parsedJson.credentialSubject) {
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
      } catch(e) {
        console.error("Could not fetch DB record for deeper validation", e);
      }

      if (parsedJson && parsedJson.credentialSubject) {
        fileIntegrityMatch = targetHash === hash; 
      }

      // Check Identity Binding
      const vcSubjectId = parsedJson?.credentialSubject?.id;
      const docOwnerAddress = vcSubjectId 
        ? vcSubjectId.replace('did:ethr:', '').toLowerCase()
        : dbIssuedTo?.toLowerCase();
      
      let isIdentityMatch = null;
      if (address && docOwnerAddress) {
        isIdentityMatch = address.toLowerCase() === docOwnerAddress;
      } else if (address && docRecord.owner.toLowerCase() === address.toLowerCase()) {
        isIdentityMatch = true; // self-issued
      }

      // Check Issuer Role
      const roles = await getUserRoles(docRecord.owner);

      const isFullyValid = docRecord.isValid && fileIntegrityMatch && !contentMismatches;

      // Dynamic Trust Score Calculation
      let calculatedScore = 0;
      if (docRecord.isValid) {
        calculatedScore += 60; // Base valid on-chain
        if (fileIntegrityMatch) calculatedScore += 20;
        if (!contentMismatches) calculatedScore += 10;
        if (isIdentityMatch) calculatedScore += 10;
      }

      setResult({
        isValid: docRecord.isValid,
        isFullyValid,
        fileIntegrityMatch,
        contentIntegrityMatch: !contentMismatches,
        identityMatch: isIdentityMatch,
        issuerRoles: roles,
        trustScore: calculatedScore,
        registeredBy: docRecord.owner,
        timestamp: docRecord.timestamp.toLocaleString(),
        docType: docRecord.docType,
        cid: docRecord.ipfsHash,
        version: docRecord.version,
        isPublic: docRecord.isPublic
      });
      setVerifiedHash(targetHash);
      
      if (isFullyValid) {
        toast.success("Document Verified Matching Blockchain!", { id: loadingToast });
      } else {
        toast.error("FRAUD ALERT: Document mismatch detected.", { id: loadingToast, duration: 5000 });
      }

      // Log to Audit Trail (Async)
      logAuditAction(
        docRecord.docId, 
        1, // VERIFY
        `Verified by ${address}. Result: ${isFullyValid ? 'PASS' : 'FAIL (Tampered)'}`
      );

      // Increment Quota (Async)
      if (address) {
        apiRequest("POST", `/api/users/verifications/increment/${address}`)
          .then(() => refreshUser())
          .catch(e => console.warn("Failed to increment verification quota", e));
      }

    } catch (error: any) {
      toast.error(error.message || "Verification failed due to an error.", { id: loadingToast });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('verification-result-panel');
    if (!element) return;

    const loadingToast = toast.loading("Generating PDF Report...");
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
      pdf.text("DNAProof Verification Report", 15, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
      pdf.text(`Verification Hash: ${verifiedHash}`, 15, 34);

      const margin = 10;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, 45, printWidth, printHeight);
      
      pdf.save(`DNAProof_Report_${verifiedHash?.substring(0,8)}.pdf`);
      toast.success("Verification Report Downloaded!", { id: loadingToast });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF.", { id: loadingToast });
    }
  };

  const handleShare = (type: string) => {
    if (!verifiedHash) return;
    
    // Using current URL as base for share links. In production, this would be a specific public verification route.
    const shareUrl = `${window.location.origin}/dashboard/verify?hash=${verifiedHash}`;
    const shareText = `I just verified the authenticity of a document on DNAProof!\nKeccak256 Hash: ${verifiedHash}\n\nCheck it out here:`;

    if (type === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Verification link copied to clipboard!");
    } else if (type === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    } else if (type === 'email') {
      const emailUrl = `mailto:?subject=Document Authenticity Proof&body=${encodeURIComponent(shareText + "\n" + shareUrl)}`;
      window.location.href = emailUrl;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verify Authenticity</h1>
          <p className="text-foreground/40 mt-1">Check if a document is registered and unaltered on the global ledger.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           <div className="space-y-6">
              <Card className="glass-card border-white/5">
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                       <FileText className="w-5 h-5 text-primary" />
                       Option 1: Verify by File
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <FileUpload 
                      onFileSelect={(f, h) => { setFile(f); setHash(h); setSearchHash(""); }} 
                      onClear={() => { setFile(null); setHash(null); }} 
                    />
                 </CardContent>
              </Card>

              <div className="flex items-center gap-4 px-4">
                 <div className="h-px flex-1 bg-white/5" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20">OR</span>
                 <div className="h-px flex-1 bg-white/5" />
              </div>

              <Card className="glass-card border-white/5">
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                       <Search className="w-5 h-5 text-primary" />
                       Option 2: Verify by Hash
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="relative">
                       <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                       <Input 
                        placeholder="Enter keccak256 document hash..." 
                        className="glass-card border-white/10 h-14 pl-12 rounded-xl border-dashed focus:border-solid focus:border-primary/50 transition-colors"
                        value={searchHash}
                        onChange={(e) => { setSearchHash(e.target.value); setHash(null); setFile(null); }}
                       />
                    </div>
                    <Button 
                      onClick={handleVerify}
                      disabled={isVerifying || (!hash && !searchHash) || isQuotaExceeded}
                      className={`w-full h-14 rounded-xl neon-glow gap-2 ${isQuotaExceeded ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      {isVerifying ? "Querying Ledgers..." : isQuotaExceeded ? "Quota Exceeded" : "Run Analysis"}
                      <ShieldCheck className="w-5 h-5" />
                    </Button>

                    {isQuotaExceeded && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
                        <p className="text-xs text-red-500 font-bold uppercase tracking-tight">Verification Limit Reached</p>
                        <p className="text-[10px] text-foreground/60 max-w-[200px] mx-auto">
                          You have used {dbUser.verificationCount}/{dbUser.verificationLimit} free checks. Upgrade your plan to continue.
                        </p>
                        <Link href="/pricing" className="block text-primary text-[10px] font-bold underline hover:text-primary/80">
                           View Pricing Plans
                        </Link>
                      </div>
                    )}
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <AnimatePresence mode="wait">
                 {result ? (
                   <div className="space-y-4">
                   <motion.div
                     id="verification-result-panel"
                     key="result"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={`glass-card p-8 rounded-3xl space-y-8 ${result.isFullyValid ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
                   >
                      <div className="flex items-center gap-4">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.isFullyValid ? 'bg-green-500/20 neon-glow-green text-green-500' : 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                            {result.isFullyValid ? <ShieldCheck className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                         </div>
                         <div>
                            <h3 className={`text-2xl font-black uppercase tracking-tighter ${result.isFullyValid ? 'text-green-500' : 'text-red-500'}`}>
                              {result.isFullyValid ? 'Verified Content' : 'FRAUD ALERT'}
                            </h3>
                            <p className={`text-sm ${result.isFullyValid ? 'text-green-500/60' : 'text-red-500/60'}`}>
                              {result.isFullyValid 
                                ? 'This document exactly matches the registered hash on-chain.' 
                                : 'Tampering detected! The provided document does not match the original blockchain record.'}
                            </p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         {[
                           { 
                             label: "Registered By", 
                             val: result.registeredBy ? `${result.registeredBy.substring(0,6)}...${result.registeredBy.substring(38)}` : 'Unknown', 
                             icon: ShieldCheck,
                             badge: result.issuerRoles?.isIssuer ? <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">✔ Verified Issuer</span> : null
                           },
                           { label: "Anchor Time", val: result.timestamp, icon: History },
                           { label: "Doc Type", val: result.docType || "GENERIC", icon: FileText },
                           { label: "Visibility", val: result.isPublic ? "Public" : "Private", icon: Lock },
                         ].map((item, i) => (
                           <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1 flex items-center gap-1">
                                 <item.icon className="w-3 h-3" />
                                 {item.label}
                                 {item.badge}
                              </p>
                              <p className="text-sm font-bold truncate">{item.val}</p>
                           </div>
                         ))}
                      </div>

                      {/* Phase 1 & 2: Advanced Verification Engine UI */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Detailed Checks */}                          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
                               <Search className="w-3.5 h-3.5" /> Detailed Checks
                            </p>
                            <div className="space-y-2.5">
                               {[
                                 { label: "File Integrity", success: result.fileIntegrityMatch, text: result.fileIntegrityMatch ? "Match" : "Mismatch" },
                                 { label: "Content Integrity", success: result.contentIntegrityMatch, text: result.contentIntegrityMatch ? "Match" : "Mismatch" },
                                 { label: "Signature Valid", success: result.isValid, text: result.isValid ? "Verified" : "Corrupted" },
                                 { label: "Blockchain Record", success: result.isValid, text: result.isValid ? "Found" : "Not Found" },
                               ].map((check, i) => (
                                 <motion.div 
                                   key={i} 
                                   initial={{ opacity: 0, x: -10 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: i * 0.1 + 0.5 }}
                                   className="flex justify-between items-center p-2 rounded-xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5"
                                 >
                                    <span className="text-xs font-medium text-foreground/50 group-hover:text-foreground/80 transition-colors uppercase tracking-tight">{check.label}</span>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                                      check.success 
                                        ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]" 
                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                    }`}>
                                      {check.success ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                      {check.text}
                                    </div>
                                 </motion.div>
                               ))}

                               {result.identityMatch !== null && (
                                 <motion.div 
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: 1 }}
                                   className="pt-2 border-t border-white/5 mt-2"
                                 >
                                    <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
                                       <span className="text-xs font-bold text-foreground/60 transition-colors uppercase tracking-tight">Identity Binding</span>
                                       <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                                         result.identityMatch 
                                           ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                                           : "bg-red-500/10 text-red-500 border-red-500/20"
                                       }`}>
                                         {result.identityMatch ? <Fingerprint className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                         {result.identityMatch ? "Match" : "Mismatch"}
                                       </div>
                                    </div>
                                 </motion.div>
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
                                     className={`transition-all duration-1000 ${result.isFullyValid ? 'text-green-500' : 'text-red-500'}`} />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-black ${result.isFullyValid ? 'text-green-500' : 'text-red-500'}`}>{result.trustScore || '0'}</span>
                                <span className="text-[10px] text-foreground/40 font-bold uppercase">/ 100</span>
                              </div>
                            </div>
                         </div>
                      </div>

                      {/* Phase 2: Compare Mode (Fraud Mismatch Table) */}
                      {!result.isFullyValid && mismatches && (
                         <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 overflow-hidden mt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500/80 mb-3 flex items-center gap-2">
                               <ShieldAlert className="w-4 h-4" /> Content Discrepancies
                            </p>
                            <div className="max-h-60 overflow-y-auto">
                               <table className="w-full text-sm text-left">
                                  <thead className="text-[10px] uppercase text-foreground/40 bg-black/40">
                                     <tr>
                                        <th className="px-4 py-2 rounded-l-lg">Field</th>
                                        <th className="px-4 py-2">Original (Ledger)</th>
                                        <th className="px-4 py-2 rounded-r-lg">Uploaded (Tampered)</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {Object.entries(mismatches).map(([key, data], idx) => (
                                        <tr key={idx} className="border-b border-white/5 last:border-0">
                                           <td className="px-4 py-3 font-medium">{key}</td>
                                           <td className="px-4 py-3 text-green-400">{JSON.stringify(data.original) || '-'}</td>
                                           <td className="px-4 py-3 text-red-400">{JSON.stringify(data.uploaded) || '-'} ❌</td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      )}

                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2">Keccak256 Fingerprint</p>
                         <p className="text-xs font-mono break-all text-primary">{verifiedHash}</p>
                      </div>
                   </motion.div>

                      <div className="flex gap-4">
                         {result.cid && (
                           <Button 
                             onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${result.cid}`, '_blank')}
                             className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 gap-2 text-primary"
                           >
                              <ExternalLink className="w-4 h-4" /> View on IPFS
                           </Button>
                         )}
                         
                         <Button 
                           onClick={handleDownloadPDF}
                           className="flex-1 h-12 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 gap-2 text-primary transition-all"
                         >
                            <Download className="w-4 h-4" /> Download PDF Report
                         </Button>

                         <DropdownMenu>
                            <DropdownMenuTrigger className="flex-none w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center p-0 outline-none">
                               <Share2 className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#0B0F19] border-white/10 text-white rounded-xl">
                               <div className="px-2 py-1.5 text-xs font-semibold text-foreground/40">Share via...</div>
                               <DropdownMenuSeparator className="bg-white/10" />
                               <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 py-3 rounded-lg flex items-center gap-3 transition-colors m-1">
                                  <Copy className="w-4 h-4 text-primary" /> Copy Link
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 py-3 rounded-lg flex items-center gap-3 transition-colors m-1">
                                  <Twitter className="w-4 h-4 text-blue-400" /> Twitter / X
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleShare('email')} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 py-3 rounded-lg flex items-center gap-3 transition-colors m-1">
                                  <Mail className="w-4 h-4 text-orange-400" /> Email
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                   </div>
                 ) : (
                   <motion.div
                     key="empty"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="glass-card border-white/5 border-dashed p-12 rounded-3xl flex flex-col items-center text-center gap-6"
                   >
                      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center grayscale opacity-50">
                         <ShieldAlert className="w-10 h-10" />
                      </div>
                      <div>
                         <h4 className="text-xl font-bold text-foreground/40 italic uppercase tracking-widest">Awaiting Input</h4>
                         <p className="text-sm text-foreground/20 max-w-xs mt-2">Upload a file or enter a hash to begin the cross-ledger verification process.</p>
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
