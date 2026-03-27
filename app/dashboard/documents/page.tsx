"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { motion } from "framer-motion";
import { 
  FileText, 
  Search, 
  Filter, 
  ExternalLink, 
  MoreVertical,
  Download,
  ShieldCheck,
  Clock,
  Trash2,
  Copy,
  Hash,
  Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";

import { useWallet } from "@/context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentHistoryPage() {
  const { address, connected, signMessage } = useWallet();
  const [search, setSearch] = useState("");

  const { data: documents = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/documents", address],
    queryFn: () => apiRequest("GET", `/api/documents/${address}`).then(res => res.json()),
    enabled: connected && !!address,
  });

  const handleRevoke = async (docId: string, docHash: string) => {
    if (!confirm("Are you sure you want to revoke this document? This action is irreversible on the blockchain.")) return;

    try {
      toast.loading("Requesting signature for revocation...", { id: "revoke-doc" });
      const message = `Revoke document with hash: ${docHash}`;
      const signature = await signMessage(message);

      toast.loading("Revoking document...", { id: "revoke-doc" });
      await apiRequest("POST", "/api/revoke-document", { 
        hash: docHash,
        message,
        signature
      });
      toast.success("Document revoked successfully", { id: "revoke-doc" });
      refetch();
    } catch (error: any) {
      console.error("Revocation failed:", error);
      toast.error(error.message || "Revocation failed", { id: "revoke-doc" });
    }
  };

  const docsArray = Array.isArray(documents) ? documents : [];

  const formattedDocs = docsArray.map((doc: any) => ({
    id: doc._id || Math.random().toString(),
    name: doc.name || `Document_${(doc.hash || "").substring(0, 8)}`,
    hash: doc.hash || "",
    displayHash: `${(doc.hash || "").substring(0, 8)}...${(doc.hash || "").substring((doc.hash || "").length - 8)}`,
    date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Just now",
    time: doc.createdAt ? new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "",
    status: doc.status === "ACTIVE" ? "Verified" : doc.status === "PENDING" ? "Pending" : "Revoked",
    type: doc.docType || "Generic",
    cid: doc.cid || "",
    displayCid: doc.cid ? `${doc.cid.substring(0, 8)}...${doc.cid.substring(doc.cid.length - 8)}` : "NOT_PINNED",
    blockchainDocId: doc.docId,
    nft: doc.nft || null,
    aiAnalysis: doc.aiAnalysis ? (typeof doc.aiAnalysis === 'string' ? JSON.parse(doc.aiAnalysis) : doc.aiAnalysis) : null
  }));

  const filteredDocs = formattedDocs.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.hash.toLowerCase().includes(search.toLowerCase()) ||
    doc.cid.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-bold tracking-tight">Document Explorer</h1>
              <p className="text-foreground/40 mt-1">Manage and audit your full collection of registered document identities.</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                 <Input 
                   placeholder="Search name, hash or CID..." 
                   className="glass-card border-white/10 h-11 w-[300px] pl-10 rounded-xl"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <Button variant="outline" className="glass-card border-white/10 h-11 rounded-xl gap-2">
                 <Filter className="w-4 h-4" /> Filter
              </Button>
           </div>
        </header>

        <Card className="glass-card border-white/5 overflow-hidden">
           <Table>
              <TableHeader className="bg-white/5">
                 <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-[300px]">Document</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>AI Assessment</TableHead>
                    <TableHead>NFT Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-8">
                       <Skeleton className="h-20 w-full bg-white/5" />
                     </TableCell>
                   </TableRow>
                 ) : filteredDocs.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-8 text-foreground/40">No documents found matching your search.</TableCell>
                   </TableRow>
                 ) : filteredDocs.map((doc, i) => (
                   <motion.tr
                     key={doc.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className="border-white/5 hover:bg-white/5 transition-colors group"
                   >
                      <TableCell>
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                               <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  {doc.name || `Document_${doc.hash.substring(0, 8)}`}
                                 {(doc.nft?.success || doc.nft?.isNFT) && (
                                   <span className="bg-amber-500/10 text-amber-500 text-[8px] px-1 rounded border border-amber-500/20 font-black uppercase">NFT</span>
                                 )}
                               </div>
                               <div className="flex flex-col gap-0.5 mt-1">
                                  <p className="text-[10px] font-mono text-foreground/30 cursor-help" title={`Full Hash: ${doc.hash}`}>
                                    Hash: {doc.displayHash}
                                  </p>
                                  {doc.blockchainDocId && (
                                    <p className="text-[10px] font-mono text-primary/40 uppercase tracking-tighter">
                                      Registry ID: #{doc.blockchainDocId}
                                    </p>
                                  )}
                               </div>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-2">
                               <Clock className="w-3 h-3 text-foreground/20" />
                               {doc.date}
                            </div>
                            <div className="text-[10px] text-foreground/40 ml-5">
                               {doc.time}
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                            <Badge variant="outline" className={cn(
                               "text-[10px] uppercase font-bold",
                               (doc.aiAnalysis?.riskScore || 0) > 50 ? "border-red-500/50 text-red-400 bg-red-500/5" : "border-blue-500/30 text-blue-400 bg-blue-500/5"
                            )}>
                               {doc.aiAnalysis?.docType || "Processing..."}
                            </Badge>
                            <span className="text-[10px] text-foreground/40 text-center">
                               Risk: {doc.aiAnalysis?.riskScore || 0}%
                            </span>
                         </div>
                      </TableCell>
                       <TableCell>
                          {(doc.nft?.success || doc.nft?.isNFT) ? (
                            <div className="flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase tracking-tighter">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              NFT Minted
                            </div>
                          ) : (
                            <span className="text-foreground/20 text-[10px] font-medium italic">Not Certified</span>
                          )}
                       </TableCell>
                      <TableCell>
                         <div className={cn(
                           "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full w-fit",
                           doc.status === "Verified" ? "bg-green-500/10 text-green-500" :
                           doc.status === "Pending" ? "bg-yellow-500/10 text-yellow-500" :
                           "bg-red-500/10 text-red-500"
                         )}>
                            {doc.status === "Verified" && <ShieldCheck className="w-3 h-3" />}
                            {doc.status}
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger>
                               <div className="h-8 w-8 ml-auto flex items-center justify-center rounded-md hover:bg-white/10 cursor-pointer">
                                  <MoreVertical className="h-4 w-4" />
                               </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card bg-[#0B0F19] border-white/10 text-white">
                               <DropdownMenuItem 
                                  className="gap-2 cursor-pointer hover:bg-amber-500/10 text-amber-500 font-bold" 
                                  disabled={!(doc.nft?.success || doc.nft?.isNFT)}
                                  onClick={() => {
                                    const nftAddr = process.env.NEXT_PUBLIC_NFT_ADDRESS || "0x81aa5528C9aC1a02378004088138B95DbCF7012F";
                                    const tokenId = doc.nft?.ethTokenId || doc.blockchainDocId;
                                    
                                    if (!tokenId || tokenId === "0") {
                                      toast.error("On-chain certificate data is still pending. Please try again in a moment.", { id: "nft-pending" });
                                      return;
                                    }

                                    window.open(`https://sepolia.etherscan.io/nft/${nftAddr}/${tokenId}`, "_blank");
                                  }}
                                >
                                   <ShieldCheck className="w-4 h-4" /> View Certificate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                   className="gap-2 cursor-pointer hover:bg-white/10" 
                                   onClick={() => {
                                     const nftAddr = process.env.NEXT_PUBLIC_NFT_ADDRESS || "0x81aa5528C9aC1a02378004088138B95DbCF7012F";
                                     navigator.clipboard.writeText(nftAddr);
                                     toast.success("NFT Contract Address copied!", { id: "nft-addr" });
                                   }}
                                >
                                   <Copy className="w-4 h-4" /> Copy Contract Address
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer hover:bg-white/10" onClick={() => doc.cid && window.open(`https://gateway.pinata.cloud/ipfs/${doc.cid}`, "_blank")}>
                                   <ExternalLink className="w-4 h-4" /> View IPFS Hash
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                   className="gap-2 cursor-pointer hover:bg-white/10" 
                                   onClick={() => {
                                     navigator.clipboard.writeText(doc.hash);
                                     toast.success("Full hash copied to clipboard");
                                   }}
                                >
                                   <Hash className="w-4 h-4" /> Copy Full Hash
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                   className="gap-2 cursor-pointer hover:bg-white/10" 
                                   onClick={() => {
                                     navigator.clipboard.writeText(doc.cid);
                                     toast.success("IPFS CID copied to clipboard");
                                   }}
                                >
                                   <Copy className="w-4 h-4" /> Copy IPFS CID
                                </DropdownMenuItem>
                               <div className="h-px bg-white/5 my-1" />
                               {!doc.nft?.isNFT && (
                                 <DropdownMenuItem 
                                    className="gap-2 cursor-pointer hover:bg-amber-500/20 text-amber-500"
                                    onClick={async () => {
                                      try {
                                        const authMessage = `Authorize NFT Minting for document: ${doc.name}\nHash: ${doc.hash}\nOwner: ${address}`;
                                        toast.loading("Requesting authorization signature...", { id: `mint-${doc.id}` });
                                        
                                        const signature = await signMessage(authMessage);
                                        
                                        toast.loading("Minting NFT with authorization...", { id: `mint-${doc.id}` });
                                        await apiRequest("POST", "/api/nft/mint", {
                                          docId: doc.blockchainDocId || doc.id,
                                          userAddress: address,
                                          docHash: doc.hash,
                                          metadataURI: `ipfs://${doc.cid}`,
                                          signature,
                                          authMessage
                                        });
                                        toast.success("NFT minted and authorized successfully", { id: `mint-${doc.id}` });
                                        refetch();
                                      } catch (error: any) {
                                        console.error("NFT Minting Action failed:", error);
                                        toast.error(`Minting failed: ${error.message}`, { id: `mint-${doc.id}` });
                                      }
                                    }}
                                 >
                                    <ShieldCheck className="w-4 h-4" /> Mint as NFT
                                 </DropdownMenuItem>
                               )}
                               <DropdownMenuItem 
                                  className="gap-2 cursor-pointer hover:bg-blue-500/20 text-blue-400"
                                  onClick={async () => {
                                    const toastId = `ai-${doc.id}`;
                                    try {
                                      toast.loading("Re-classifying doc...", { id: toastId });
                                      await apiRequest("POST", "/api/ai/classify", { docId: doc.blockchainDocId || doc.id });
                                      toast.success("AI Analysis updated", { id: toastId });
                                      refetch();
                                      } catch (error: any) {
                                        console.error("AI Classification Action failed:", error);
                                        toast.error(`Classification failed: ${error.message}`, { id: toastId });
                                      }
                                  }}
                               >
                                  <FileText className="w-4 h-4" /> AI Re-classify
                               </DropdownMenuItem>
                               <DropdownMenuItem 
                                  className="gap-2 cursor-pointer hover:bg-red-500/20 text-red-500"
                                  onClick={() => handleRevoke(doc.id, doc.hash)}
                               >
                                  <Trash2 className="w-4 h-4" /> Revoke Doc
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                   </motion.tr>
                 ))}
              </TableBody>
           </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
