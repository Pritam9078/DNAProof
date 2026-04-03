import express from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { calculateNormalizedHash } from "@shared/utils/hashing";
import { ethers } from 'ethers';
import { User } from '../models/User';
import { Document } from '../models/Document';
import { IssuerProfile } from '../models/IssuerProfile';
import multer from 'multer';
import QRCode from 'qrcode';
import { authenticateToken } from '../middleware';
import axios from 'axios';
import { AuditLog } from '../models/AuditLog';
import crypto from "crypto";
import { DIDService } from '../services/did-service';
import { AIService } from '../services/ai-service';
import * as fuzzyService from '../services/fuzzy-service';
import * as merkleUtils from '@shared/utils/merkle';
import { fabricService } from '../fabric-service';
import { networkInterfaces } from 'os';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Environment Helpers ---

function getLocalNetworkIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netInterfaces = nets[name];
    if (netInterfaces) {
      for (const net of netInterfaces) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

const FRONTEND_PORT = process.env.NEXT_PUBLIC_PORT || '3002';
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `http://${getLocalNetworkIP()}:${FRONTEND_PORT}`;

// Backend-compatible contract verification
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

// Helper to build a Verifiable Credential
function buildVerifiableCredential(params: {
  issuerAddress: string;
  issuerOrgName: string;
  subjectAddress: string | null;
  docType: string;
  fieldData: Record<string, any>;
  fileHash: string;
  contentHash: string;
  cid: string;
}) {
  const issuerDID = DIDService.resolveAddressToDID(params.issuerAddress);
  const subjectDID = params.subjectAddress ? DIDService.resolveAddressToDID(params.subjectAddress) : undefined;

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1'
    ],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ['VerifiableCredential', params.docType.replace(/\s+/g, '')],
    issuer: {
      id: issuerDID,
      name: params.issuerOrgName,
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDID,
      document: {
        hash: params.fileHash,
        contentHash: params.contentHash,
        ipfsCid: params.cid,
        type: params.docType,
      },
      ...params.fieldData,
    },
    proof: {
      type: 'EthereumEip712Signature2021',
      created: new Date().toISOString(),
      verificationMethod: `${issuerDID}#controller`,
      proofPurpose: 'assertionMethod',
    },
  };
}

// --- Routes ---

// Document Issuance (Full Flow)
router.post("/register-document", authenticateToken, upload.single('file'), async (req: express.Request, res: express.Response) => {
  try {
    const file = req.file;
    
    if (file) {
      const MAX_SIZE = 50 * 1024 * 1024;
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      
      if (file.size > MAX_SIZE) {
        return res.status(400).json({ message: "File exceeds 50MB limit" });
      }
      if (!validTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only PDF, PNG, and JPEG are allowed." });
      }
    }

    const {
      issuerAddress,
      recipientAddress,
      docType,
      templateId,
      fieldData: fieldDataRaw,
      blockchainDocId,
      ipfsCid,
      txHash,
      isPublic,
    } = req.body;

    if (!issuerAddress || !docType || !ipfsCid) {
      return res.status(400).json({ message: "issuerAddress, docType, and ipfsCid are required" });
    }

    const user = await storage.getUserByWalletAddress(issuerAddress.toLowerCase());
    if (!user) return res.status(404).json({ message: "Issuer user not found" });

    if (!user.isSuperAdmin && user.documentCount >= user.documentLimit) {
      return res.status(403).json({ 
        message: "Document issuance limit reached.", 
        quota: { current: user.documentCount, limit: user.documentLimit } 
      });
    }

    const fieldData = typeof fieldDataRaw === 'string' ? JSON.parse(fieldDataRaw) : (fieldDataRaw || {});
    const fileHash = file ? ethers.keccak256(file.buffer) : req.body.fileHash;
    if (!fileHash) return res.status(400).json({ message: "fileHash or file is required" });

    const existingDoc = await Document.findOne({ hash: fileHash });
    if (existingDoc) {
      return res.status(409).json({
        message: "Document already registered in system.",
        document: existingDoc
      });
    }

    const contentHash = calculateNormalizedHash(fieldData);
    const issuerProfile = await IssuerProfile.findOne({ walletAddress: issuerAddress.toLowerCase() });
    const issuerOrgName = issuerProfile?.orgName || issuerAddress;

    let aiResult = null;
    if (file) {
      try {
        aiResult = await AIService.analyzeDocument(file.buffer, fieldData);
      } catch (err) {
        console.error("AI Analysis failed:", err);
      }
    }

    const vc = buildVerifiableCredential({
      issuerAddress: issuerAddress.toLowerCase(),
      issuerOrgName,
      subjectAddress: recipientAddress || null,
      docType,
      fieldData,
      fileHash,
      contentHash,
      cid: ipfsCid,
    });

    const verificationUrl = `${APP_BASE_URL}/verify?hash=${fileHash}`;
    const qrCode = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: { dark: '#3b82f6', light: '#FFFFFF' },
    });

    const issuerDID = (user as any).did || DIDService.resolveAddressToDID(issuerAddress);
    if (!(user as any).did) {
      await storage.updateUser(issuerAddress, { did: issuerDID });
    }

    const signature = await DIDService.signCredential(vc, process.env.ISSUER_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey);
    (vc.proof as any).signature = signature;

    let perceptualHash: string | null = null;
    let fuzzyTextBase: string | null = null;
    let similarityWarning: string | null = null;

    if (file) {
      if (file.mimetype.startsWith('image/')) {
        perceptualHash = await fuzzyService.calculateImagePHash(file.buffer);
        if (perceptualHash) {
          const similarImg = await Document.findOne({ perceptualHash });
          if (similarImg) {
            similarityWarning = `Note: Visually similar image already exists (ID: ${similarImg.docId || 'pending'})`;
          }
        }
      } else if (file.mimetype.includes('text') || file.mimetype.includes('json')) {
        const text = file.buffer.toString();
        fuzzyTextBase = fuzzyService.prepareFuzzyText(text);
        if (fuzzyTextBase) {
          const existingTextDocs = await Document.find({ fuzzyTextBase: { $ne: null } }).limit(20);
          for (const doc of existingTextDocs) {
            if (doc.fuzzyTextBase) {
              const score = fuzzyService.compareTextSimilarity(fuzzyTextBase, doc.fuzzyTextBase);
              if (score > 0.9) {
                similarityWarning = `Note: Highly similar document content detected (${Math.round(score * 100)}% match)`;
                break;
              }
            }
          }
        }
      }
    } else if (fieldData) {
        const jsonStr = JSON.stringify(fieldData);
        fuzzyTextBase = fuzzyService.prepareFuzzyText(jsonStr);
    }

    const merkleRoot = merkleUtils.generateMerkleRoot([fileHash]);
    const merkleProof = merkleUtils.generateMerkleProof([fileHash], fileHash);

    const doc = await Document.create({
      hash: fileHash,
      contentHash,
      cid: ipfsCid,
      owner: issuerAddress.toLowerCase(),
      issuedBy: issuerAddress.toLowerCase(),
      issuedTo: recipientAddress?.toLowerCase() || null,
      name: file?.originalname || `${docType}-${Date.now()}`,
      docType,
      templateId: templateId || null,
      fieldData,
      verifiableCredential: vc,
      qrCode,
      verificationUrl,
      isPublic: isPublic !== 'false' && isPublic !== false,
      aiAnalysis: aiResult ? { ...aiResult, similarityWarning } : (similarityWarning ? { similarityWarning } : null),
      status: 'ACTIVE',
      perceptualHash,
      fuzzyTextBase,
      merkleRoot,
      merkleProof,
    });

    await AuditLog.create({
      actor: issuerAddress.toLowerCase(),
      action: 'DOCUMENT_ISSUED',
      documentHash: fileHash || 'unknown',
      documentId: blockchainDocId ? Number(blockchainDocId) : null,
      ipfsCid,
      targetAddress: recipientAddress?.toLowerCase() || null,
      txHash: txHash || null,
      metadata: { docType, templateId, orgName: issuerOrgName },
    });

    if (blockchainDocId && aiResult) {
      try {
        await fabricService.updateAIAnalysis(String(blockchainDocId), aiResult);
      } catch (err) {
        console.error("Failed to sync AI result to Fabric:", err);
      }
    }

    await User.findOneAndUpdate(
      { address: issuerAddress.toLowerCase() },
      { $inc: { documentCount: 1 } }
    );

    return res.status(201).json({
      document: doc,
      verifiableCredential: vc,
      verificationUrl,
      qrCode,
      fileHash,
      contentHash,
    });
  } catch (error: any) {
    console.error("Error issuing document:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
});

// Legacy Document Routes
router.post("/documents", upload.single('file'), async (req: express.Request, res: express.Response) => {
  try {
    const { owner, docType, isPublic, ipfsCid, blockchainDocId, privateMetadata } = req.body;
    const file = req.file;

    if (!file && !ipfsCid) {
      return res.status(400).json({ message: "File or IPFS CID is required" });
    }

    let hash = req.body.hash;
    if (file && !hash) {
      hash = ethers.keccak256(file.buffer);
    }

    let fabricTxId = null;
    if (privateMetadata) {
      try {
        const docIdForFabric = blockchainDocId || hash;
        await fabricService.registerPrivateDocument(
          docIdForFabric.toString(),
          hash,
          privateMetadata,
          owner.toLowerCase()
        );
        fabricTxId = `fab_${Math.random().toString(36).substring(7)}`;
      } catch (error) {
        console.warn("Fabric synchronization failed:", error);
      }
    }

    const docData = {
      hash,
      cid: ipfsCid,
      owner: owner.toLowerCase(),
      name: file?.originalname || req.body.name || 'document',
      docType: docType || "GENERIC",
      status: "ACTIVE",
      docId: blockchainDocId ? Number(blockchainDocId) : null,
      fabricTxId,
    };

    const document = await storage.createFile(docData);
    return res.status(201).json(document);
  } catch (error) {
    console.error("Error creating document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/documents", async (_req: express.Request, res: express.Response) => {
  try {
    const files = await storage.getFiles();
    return res.status(200).json(files);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/documents/:walletAddress", async (req: express.Request, res: express.Response) => {
  try {
    const walletAddress = req.params.walletAddress;
    const files = await storage.getFiles(walletAddress);
    return res.status(200).json(files);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/documents/hash/:hash", async (req: express.Request, res: express.Response) => {
  try {
    const hash = req.params.hash;
    const doc = await storage.getFileByHash(hash);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    return res.status(200).json(doc);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Verification Endpoint
router.post("/verify-document", upload.single('file'), async (req: express.Request, res: express.Response) => {
  try {
    let documentHash = req.body.hash;
    
    if (req.file) {
      documentHash = ethers.keccak256(req.file.buffer);
    }

    if (!documentHash) {
      return res.status(400).json({ message: "File or hash is required for verification." });
    }

    const doc = await storage.getFileByHash(documentHash);
    if (!doc) {
      return res.status(404).json({ isValid: false, message: "Document not found or has been tampered with." });
    }

    return res.status(200).json({
      isValid: doc.status === 'ACTIVE',
      document: doc
    });
  } catch (error) {
     console.error(error);
     return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/stats", async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.query;
    const stats = await storage.getStats(address as string);
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Revocation
router.post("/revoke-document", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { hash, reason, message, signature } = req.body;
    const user = (req as any).user;

    if (!hash) return res.status(400).json({ message: "Document hash is required" });

    const doc = await storage.getFileByHash(hash);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const dbUser = await storage.getUserByWalletAddress(user.address);
    if (!dbUser?.isSuperAdmin && doc.owner.toLowerCase() !== user.address.toLowerCase() && doc.issuedBy?.toLowerCase() !== user.address.toLowerCase()) {
      return res.status(403).json({ message: "Unauthorized to revoke this document" });
    }

    if (signature && message) {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== user.address.toLowerCase()) {
          return res.status(401).json({ message: "Invalid revocation signature" });
        }
      } catch (sigErr) {
        return res.status(400).json({ message: "Malformed signature" });
      }
    } else if (!dbUser?.isSuperAdmin) {
      return res.status(400).json({ message: "Revocation requires a wallet signature" });
    }

    await Document.findOneAndUpdate({ hash }, { status: 'REVOKED' });

    if (doc.cid) {
      try {
        const pinataJwt = process.env.VITE_PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT;
        if (pinataJwt) {
          await axios.delete(`https://api.pinata.cloud/pinning/unpin/${doc.cid}`, {
            headers: {
              'Authorization': `Bearer ${pinataJwt}`
            }
          });
          console.log(`Document ${doc.cid} unpinned from Pinata`);
        }
      } catch (pinataError: any) {
        console.error("Failed to unpin from Pinata:", pinataError.response?.data || pinataError.message);
      }
    }

    try {
      if (doc.docId) {
         await fabricService.updateStatus(doc.docId.toString(), 'REVOKED');
      }
    } catch (fabricError) {
      console.warn("Failed to update Fabric:", fabricError);
    }

    await AuditLog.create({
      documentId: doc.docId || null,
      documentHash: doc.hash,
      actor: user.address,
      action: 'DOCUMENT_REVOKED', 
      metadata: { reason: reason || "Document revoked via API" },
      timestamp: new Date()
    });

    return res.status(200).json({ message: "Document successfully revoked" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
