import express from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { ethers } from 'ethers';

const router = express.Router();

// Helper for on-chain verification
async function verifyDocumentOnChain(sha256Hash: string) {
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '';
  const registryPath = path.join(process.cwd(), 'lib/abis/DNAProofRegistry.json');
  const RegistryABI = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const REGISTRY_ABI = (RegistryABI as any).abi || RegistryABI;

  if (!REGISTRY_ADDRESS) return null;

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
    const docId = await contract.getDocIdBySha256(sha256Hash);
    if (Number(docId) === 0) return null;
    const doc = await contract.getDocument(docId);
    return {
      isValid: doc[9],
      docId: Number(docId),
      sha256Hash: doc[0],
      ipfsHash: doc[4],
      docType: ethers.decodeBytes32String(doc[5]).replace(/\0/g, ''),
      owner: doc[6],
      timestamp: new Date(Number(doc[7]) * 1000),
      isPublic: doc[10],
      trustScore: Number(doc[11]),
      version: Number(doc[12])
    };
  } catch (err) {
    console.error("verifyDocumentOnChain error:", err);
    return null;
  }
}

/**
 * Mints a document NFT on Ethereum (Public) and Fabric (Private).
 */
router.post("/nft/mint", async (req, res) => {
  try {
    const { docId, userAddress, docHash, metadataURI, signature, authMessage } = req.body;
    
    if (!docId || !userAddress || !docHash || !metadataURI) {
      return res.status(400).json({ message: "Missing required fields for NFT minting" });
    }

    if (signature && authMessage) {
      const recoveredAddress = ethers.verifyMessage(authMessage, signature);
      if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
        return res.status(401).json({ message: "Invalid authorization signature." });
      }
      console.log(`[NFT-Auth] Verified signature from ${recoveredAddress} for doc ${docId}`);
    } else {
      return res.status(400).json({ message: "Mandatory wallet authorization signature is missing." });
    }

    const doc = await storage.queryDocument(docId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const onChainDoc = await verifyDocumentOnChain(docHash);
    if (!onChainDoc) {
      return res.status(404).json({ message: "Document not found or not valid on blockchain" });
    }

    const { nftService } = await import('../services/nft-service.ts');
    const result = await nftService.dualMint(userAddress, docId, docHash, metadataURI, signature);

    res.status(200).json({
      message: "Dual-mint successful",
      result
    });
  } catch (error: any) {
    console.error("NFT Minting failed:", error);
    res.status(500).json({ message: "Failed to mint NFT", error: error.message });
  }
});

export default router;
