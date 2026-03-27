"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { FileUpload } from "@/components/forms/FileUpload";
import { motion } from "framer-motion";
import {
  Shield,
  Info,
  Calendar,
  Globe,
  Lock,
  Wallet,
  ArrowRight,
  ExternalLink,
  Copy,
  ShieldAlert,
  QrCode,
  CheckCircle2,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/context/WalletContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { uploadToIPFS, getIPFSGatewayUrl } from "@/lib/ipfsService";
import { registerDocument, calculateSHA256, verifyDocument } from "@/lib/contractService";
import { calculateNormalizedHash } from "@shared/utils/hashing";
import { apiRequest } from "@/lib/queryClient";

interface TemplateField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

interface Template {
  _id: string;
  docType: string;
  fields: TemplateField[];
  description?: string;
}

export default function RegisterDocumentPage() {
  const { connected, address, connect, walletInfo, signMessage } = useWallet();

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [recipientAddress, setRecipientAddress] = useState("");

  // Basic fields
  const [docType, setDocType] = useState("Legal");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoClassify, setAutoClassify] = useState(true);
  const [mintAsNFT, setMintAsNFT] = useState(false);

  // Results
  const [registeredCid, setRegisteredCid] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  const isAdminOrIssuer = walletInfo?.roles?.isAdmin || walletInfo?.roles?.isIssuer;

  // Load templates for issuers
  useEffect(() => {
    if (connected && address && isAdminOrIssuer) {
      apiRequest("GET", `/api/templates?createdBy=${address}`)
        .then(r => r.json())
        .then(data => setTemplates(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [connected, address, isAdminOrIssuer]);

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find(t => t._id === templateId) || null;
    setSelectedTemplate(tmpl);
    // Reset field values
    setFieldValues({});
    if (tmpl) setDocType(tmpl.docType);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleRegister = async () => {
    if (!connected || !address) { toast.error("Please connect your wallet first"); return; }
    if (!isAdminOrIssuer) { toast.error("You are not authorized to register documents."); return; }
    if (!file || !hash) { toast.error("Please upload a file"); return; }

    setIsSubmitting(true);
    setRegisteredCid(null);
    setQrCode(null);
    const loadingToast = toast.loading("Processing registration...");

    try {
      // 0. Pre-check if already on blockchain
      toast.loading("Verifying on-chain existence...", { id: loadingToast });
      const existingDoc = await verifyDocument(hash);
      if (existingDoc && existingDoc.docId > 0) {
        toast.error("This document has already been registered on the blockchain!", { id: loadingToast });
        setRegisteredCid(existingDoc.ipfsHash);
        setIsSubmitting(false);
        return;
      }

      // 1. Upload to IPFS
      toast.loading("Uploading to IPFS...", { id: loadingToast });
      const ipfsCid = await uploadToIPFS(file);

      // 2. Anchor on blockchain
      toast.loading("Confirming on blockchain...", { id: loadingToast });
      
      // Calculate normalized content hash for field data to keep it consistent with backend
      const contentHash = calculateNormalizedHash(fieldValues);
      const blockchainDocId = await registerDocument(hash, ipfsCid, docType, isPublic);

      // 3. Issue with full VC, QR, and audit log
      toast.loading("Generating credential & QR code...", { id: loadingToast });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("issuerAddress", address);
      formData.append("docType", selectedTemplate?.docType || docType);
      formData.append("isPublic", String(isPublic));
      formData.append("ipfsCid", ipfsCid);
      formData.append("blockchainDocId", String(blockchainDocId));
      formData.append("fileHash", hash);
      if (selectedTemplate) formData.append("templateId", selectedTemplate._id);
      if (recipientAddress) formData.append("recipientAddress", recipientAddress);
      formData.append("fieldData", JSON.stringify(fieldValues));

      const res = await apiRequest("POST", "/api/register-document", formData);
      const issueData = await res.json();
      if (!res.ok) throw new Error(issueData.message || "Registration failed on server.");

      toast.success("Document issued & anchored on blockchain!", { id: loadingToast });
      setRegisteredCid(ipfsCid);
      setQrCode(issueData.qrCode);
      setVerificationUrl(issueData.verificationUrl);

      // --- NEW: AI & NFT INTEGRATION ---
      // Use the backend-returned ID or hash for subsequent processing
      const resultDoc = issueData.document || issueData;
      const targetId = resultDoc.docId || resultDoc.hash || blockchainDocId || hash;

      if (autoClassify && targetId) {
        toast.loading("Analyzing with DNA-AI...", { id: loadingToast });
        await apiRequest("POST", "/api/ai/classify", { docId: targetId });
      }

      if (mintAsNFT && targetId) {
        const docName = file?.name || `Document-${hash?.substring(0,8)}`;
        const authMessage = `Authorize NFT Minting for document: ${docName}\nHash: ${hash}\nOwner: ${address}`;
        toast.loading("Requesting wallet authorization for NFT...", { id: loadingToast });
        const mintSig = await signMessage(authMessage);
        toast.loading("Issuing Dual-Chain NFT...", { id: loadingToast });
        await apiRequest("POST", "/api/nft/mint", {
          docId: targetId,
          userAddress: address,
          docHash: hash,
          metadataURI: `ipfs://${ipfsCid}`,
          signature: mintSig,
          authMessage
        });
        toast.success("NFT Minted & Authorized!", { id: loadingToast });
      }

      setFile(null);
    } catch (error: any) {
      console.error("Registration failed", error);
      toast.error(error.message || "Registration failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${title} copied!`);
  };

  const downloadQR = () => {
    if (!qrCode) return;
    const a = document.createElement('a');
    a.href = qrCode;
    a.download = `dnaproof-qr-${Date.now()}.png`;
    a.click();
  };

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={["admin", "issuer"]}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Register Document</h1>
            <p className="text-foreground/40 mt-1">Upload and anchor your document to the hybrid ledger.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left column — form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Template Selector */}
              {templates.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                    <span className="w-8 h-px bg-primary/30" />
                    Step 1: Select Template (Optional)
                  </div>
                  <Select onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Choose a document template..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B0F19] border-white/10">
                      {templates.map(t => (
                        <SelectItem key={t._id} value={t._id}>{t.docType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>
              )}

              {/* Dynamic Template Fields */}
              {selectedTemplate && selectedTemplate.fields.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                    <span className="w-8 h-px bg-primary/30" />
                    Document Fields — {selectedTemplate.docType}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label className="text-xs font-bold text-foreground/40">
                          {field.name} {field.required && <span className="text-red-400">*</span>}
                        </Label>
                        {field.type === 'boolean' ? (
                          <div className="flex items-center gap-3 mt-1">
                            <Switch
                              checked={!!fieldValues[field.name]}
                              onCheckedChange={(v) => handleFieldChange(field.name, v)}
                            />
                            <span className="text-sm text-foreground/60">{fieldValues[field.name] ? 'Yes' : 'No'}</span>
                          </div>
                        ) : (
                          <Input
                            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                            placeholder={field.placeholder || `Enter ${field.name}...`}
                            value={fieldValues[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className="glass-card border-white/10 h-12 rounded-xl bg-transparent"
                          />
                        )}
                      </div>
                    ))}

                    {/* Recipient Address */}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-bold text-foreground/40">Recipient Wallet Address (Optional)</Label>
                      <Input
                        placeholder="0x... recipient's wallet address"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="glass-card border-white/10 h-12 rounded-xl bg-transparent font-mono text-sm"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* File Upload */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                  <span className="w-8 h-px bg-primary/30" />
                  {selectedTemplate ? "Step 2" : "Step 1"}: Upload Document File
                </div>
                <FileUpload
                  onFileSelect={(f: File, h: string) => { setFile(f); setHash(h); setRegisteredCid(null); setQrCode(null); }}
                  onClear={() => { setFile(null); setHash(null); setRegisteredCid(null); setQrCode(null); }}
                />
              </section>

              {/* Metadata */}
              {!selectedTemplate && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary italic">
                    <span className="w-8 h-px bg-primary/30" />
                    Step 2: Metadata & Visibility
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-foreground/40">Document Category</Label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger className="glass-card border-white/10 h-12 rounded-xl">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0B0F19] border-white/10">
                          <SelectItem value="Legal">Legal Agreement</SelectItem>
                          <SelectItem value="Business">Business Contract</SelectItem>
                          <SelectItem value="Personal">Identity Proof</SelectItem>
                          <SelectItem value="Medical">Medical Record</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-foreground/40">Expiry Date (Optional)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                        <Input type="date" className="glass-card border-white/10 h-12 rounded-xl pl-12" />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Visibility Toggle */}
              <div className="glass-card p-6 rounded-2xl border-white/10 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", isPublic ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500")}>
                    {isPublic ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold">Privacy Setting</p>
                    <p className="text-xs text-foreground/40">{isPublic ? "Publicly verifiable on Ethereum & IPFS" : "Private metadata in Hyperledger"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground/20">{isPublic ? "Public" : "Private"}</span>
                  <Switch checked={!isPublic} onCheckedChange={(v) => setIsPublic(!v)} />
                </div>
              </div>

              {/* Advanced Services (NEW) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-2xl border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Auto-Classify (AI)</span>
                  </div>
                  <Switch checked={autoClassify} onCheckedChange={setAutoClassify} />
                </div>
                <div className="glass-card p-4 rounded-2xl border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Mint as NFT</span>
                  </div>
                  <Switch checked={mintAsNFT} onCheckedChange={setMintAsNFT} />
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={!file || isSubmitting}
                size="lg"
                className="w-full h-16 rounded-2xl text-lg neon-glow gap-3 group"
              >
                {isSubmitting ? "Processing Ledger Sync..." : "Confirm & Issue Document"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Right column — proof panel */}
            <div className="space-y-6">
              <Card className={cn("glass-card border-white/5 transition-colors duration-500", registeredCid ? "bg-primary/10 border-primary/20" : "bg-white/2")}>
                <CardContent className="p-6 space-y-6">
                  <h4 className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Verification Proof
                    </span>
                    {registeredCid && <span className="text-[10px] font-black uppercase text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Issued</span>}
                  </h4>

                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 relative group cursor-pointer" onClick={() => hash && copyToClipboard(hash, "File Hash")}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Document Hash</p>
                        <Copy className="w-3 h-3 text-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] font-mono break-all text-foreground/60">{hash || "Waiting for file..."}</p>
                    </div>

                    {registeredCid && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 relative group cursor-pointer" onClick={() => copyToClipboard(registeredCid, "IPFS CID")}>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">IPFS Document CID</p>
                            <Copy className="w-3 h-3 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[10px] font-mono break-all text-primary/80 mb-2">{registeredCid}</p>
                          <a
                            href={getIPFSGatewayUrl(registeredCid)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-black/30 rounded-lg text-[10px] text-white hover:bg-black/50 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> View Source on IPFS
                          </a>
                        </div>

                        {/* QR Code */}
                        {qrCode && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                            <div className="p-4 rounded-2xl bg-white flex flex-col items-center gap-3">
                              <img src={qrCode} alt="Verification QR Code" className="w-full max-w-[180px] rounded-lg" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-black/60 flex items-center gap-1">
                                <QrCode className="w-3 h-3" /> Scan to Verify
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-white/10 text-xs gap-1"
                                onClick={() => verificationUrl && copyToClipboard(verificationUrl, "Verification Link")}
                              >
                                <Copy className="w-3 h-3" /> Copy Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-white/10 text-xs gap-1"
                                onClick={downloadQR}
                              >
                                <Download className="w-3 h-3" /> Download QR
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    <div className="space-y-3 pt-2">
                      {[
                        { label: "IPFS Node", status: registeredCid ? "Pinned" : "Ready", active: !!registeredCid },
                        { label: "Public Ledger", status: registeredCid ? "Anchored" : "Sepolia", active: !!registeredCid },
                        { label: "Verifiable Credential", status: registeredCid ? "Issued" : "Pending", active: !!registeredCid },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-foreground/40">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", item.active ? "bg-green-500 animate-pulse" : "bg-foreground/20")} />
                            <span className="font-bold">{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex gap-3 text-primary">
                  <Info className="w-5 h-5 shrink-0" />
                  <p className="text-xs leading-relaxed font-medium">
                    A Verifiable Credential (VC) is generated on issuance. The QR code links directly to the verification page for this document.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
