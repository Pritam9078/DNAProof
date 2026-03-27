import { ethers } from 'ethers';
import { calculateNormalizedHash } from '@shared/utils/hashing';
import RegistryABI from './abis/DNAProofRegistry.json';
import AccessControlABI from './abis/DNAProofAccessControl.json';
import AuditLogsABI from './abis/DNAProofAuditLogs.json';

// Contract ABIs - Handle both raw ABI arrays and Hardhat artifacts (which expose `.abi`)
const REGISTRY_ABI = (RegistryABI as any).abi || RegistryABI;
const ACCESS_CONTROL_ABI = (AccessControlABI as any).abi || AccessControlABI;
const AUDIT_LOGS_ABI = (AuditLogsABI as any).abi || AuditLogsABI;

// Contract Addresses
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || process.env.VITE_REGISTRY_ADDRESS || '';
const ACCESS_CONTROL_ADDRESS = process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS || process.env.VITE_ACCESS_CONTROL_ADDRESS || '';
const AUDIT_LOGS_ADDRESS = process.env.NEXT_PUBLIC_AUDIT_LOGS_ADDRESS || process.env.VITE_AUDIT_LOGS_ADDRESS || '';

// Internal validation helper
function validateAddress(address: string, name: string) {
  if (!address || address === '' || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Contract ${name} address is not configured. Please set NEXT_PUBLIC_${name}_ADDRESS in your .env file.`);
  }
}

export const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Utility to calculate SHA256 hash of a file or string
 */
/**
 * Utility to calculate hash of a file or string using shared normalization logic.
 * Uses Keccak256 for consistency with Ethereum smart contracts and backend.
 */
export async function calculateSHA256(data: string | File): Promise<string> {
  if (typeof data === 'string') {
    return calculateNormalizedHash(data);
  } else {
    // For files, we only normalize if they are textual (json/text)
    const isText = data.type.includes('json') || data.type.includes('text') || data.name.endsWith('.json') || data.name.endsWith('.txt');
    if (isText) {
      const text = await data.text();
      return calculateNormalizedHash(text);
    } else {
      // Binary file: hash raw bytes without normalization
      const buffer = await data.arrayBuffer();
      return ethers.keccak256(new Uint8Array(buffer));
    }
  }
}

/**
 * Get the contract instance with a signer
 */
async function getSignedContract() {
  if (!window.ethereum) throw new Error("Ethereum wallet not found");
  let provider = new ethers.BrowserProvider(window.ethereum);
  let network = await provider.getNetwork();

  // Safeguard: Ensure we are on Sepolia (Chain ID 11155111)
  if (Number(network.chainId) !== 11155111) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      // Re-instantiate provider after network switch
      provider = new ethers.BrowserProvider(window.ethereum);
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error("Sepolia testnet is not added to your wallet. Please add it to continue.");
      }
      throw new Error("Please switch to the Sepolia testnet to interact with the blockchain.");
    }
  }

  const signer = await provider.getSigner();
  validateAddress(REGISTRY_ADDRESS, 'REGISTRY');
  return new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
}

/**
 * Get the Audit Logs contract instance with a signer
 */
async function getSignedAuditContract() {
  if (!window.ethereum) throw new Error("Ethereum wallet not found");
  let provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  validateAddress(AUDIT_LOGS_ADDRESS, 'AUDIT_LOGS');
  return new ethers.Contract(AUDIT_LOGS_ADDRESS, AUDIT_LOGS_ABI, signer);
}

/**
 * Register a document on the blockchain
 */
export async function registerDocument(
  sha256Hash: string,
  ipfsHash: string,
  docType: string = "GENERIC",
  isPublic: boolean = false,
  perceptualHash: string = ZERO_HASH,
  metadataHash: string = ZERO_HASH,
  zkProofHash: string = ZERO_HASH,
  expiryDate: number = 0
): Promise<number> {
  try {
    const contract = await getSignedContract();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const owner = await signer.getAddress();

    // Convert docType to bytes32
    const docTypeBytes = ethers.encodeBytes32String(docType.substring(0, 31));

    const input = {
      sha256Hash,
      perceptualHash,
      metadataHash,
      zkProofHash,
      ipfsHash,
      docType: docTypeBytes,
      owner,
      expiryDate,
      isPublic
    };

    const tx = await contract.registerDocument(input);
    const receipt = await tx.wait();

    // Find DocumentRegistered event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((e: any) => e && e.name === "DocumentRegistered");

    if (!event) {
      throw new Error('Transaction succeeded but no DocumentRegistered event found');
    }

    return Number(event.args.docId);
  } catch (error: any) {
    console.error("Error registering document:", error);

    // Check if the error is our custom DNAProof__DocumentAlreadyExists (0xc099819c)
    if (error.data && error.data.includes("0xc099819c")) {
      throw new Error("This document has already been registered on the blockchain!");
    } else if (error.message && error.message.includes("0xc099819c")) {
      throw new Error("This document has already been registered on the blockchain!");
    }

    throw new Error(`Failed to register document: ${error.message}`);
  }
}

/**
 * Verify a document hash by fetching its complete on-chain record
 */
export async function verifyDocument(
  sha256Hash: string
): Promise<any> {
  try {
    const contract = await getSignedContract();

    // 1. Check if the hash exists and get its document ID
    const docId = await contract.getDocIdBySha256(sha256Hash);

    // If docId is 0, the document does not exist in the registry
    if (Number(docId) === 0) {
      return null;
    }

    // 2. Fetch the full document details
    const doc = await contract.getDocument(docId);

    return {
      isValid: doc[9], // index 9 is isValid boolean
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
  } catch (error: any) {
    console.error("Error verifying document:", error);
    throw new Error(`Failed to verify document: ${error.message}`);
  }
}

/**
 * Get document details (Kept for backwards compatibility logic)
 */
export async function getDocumentDetails(docId: number): Promise<any> {
  try {
    const contract = await getSignedContract();
    const doc = await contract.getDocument(docId);

    return {
      sha256Hash: doc[0],
      perceptualHash: doc[1],
      metadataHash: doc[2],
      zkProofHash: doc[3],
      ipfsHash: doc[4],
      docType: ethers.decodeBytes32String(doc[5]).replace(/\0/g, ''),
      owner: doc[6],
      timestamp: new Date(Number(doc[7]) * 1000),
      expiryDate: Number(doc[8]) > 0 ? new Date(Number(doc[8]) * 1000) : null,
      isValid: doc[9],
      isPublic: doc[10],
      trustScore: Number(doc[11])
    };
  } catch (error: any) {
    console.error(`Error getting document details for ID ${docId}:`, error);
    throw new Error(`Failed to get document details: ${error.message}`);
  }
}

/**
 * Revoke a document
 */
export async function revokeDocument(docId: number): Promise<boolean> {
  try {
    const contract = await getSignedContract();
    const tx = await contract.revokeDocument(docId);
    await tx.wait();
    return true;
  } catch (error: any) {
    console.error(`Error revoking document ID ${docId}:`, error);
    throw new Error(`Failed to revoke document: ${error.message}`);
  }
}

/**
 * Attest a document (Multi-sig/Issuer signature)
 */
export async function attestDocument(docId: number): Promise<boolean> {
  try {
    const contract = await getSignedContract();
    const tx = await contract.attestDocument(docId);
    await tx.wait();
    return true;
  } catch (error: any) {
    console.error(`Error attesting document ID ${docId}:`, error);
    throw new Error(`Failed to attest document: ${error.message}`);
  }
}

/**
 * Log an action to the Audit Logs contract
 */
export async function logAuditAction(
  docId: number,
  action: number, // 0: REGISTER, 1: VERIFY, 2: REVOKE, 3: UPDATE, 4: OTHER
  extraData: string = ""
): Promise<void> {
  try {
    const contract = await getSignedAuditContract();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const actor = await signer.getAddress();

    const extraDataBytes = ethers.toUtf8Bytes(extraData);
    
    // Attempt the log action but do not block the UI if it fails
    // Gas estimation failure (revert) is caught here to avoid MetaMask popups
    const tx = await contract.logAction(docId, actor, action, extraDataBytes).catch((err: any) => {
      console.warn("Audit logging skipped or failed:", err.message);
      return null;
    });

    if (tx) {
      console.log(`Audit log transaction submitted: ${tx.hash}`);
      tx.wait().catch((err: any) => console.error("Audit log confirmation failed:", err));
    }
  } catch (error: any) {
    console.warn("Error in logAuditAction (non-critical):", error.message);
  }
}

/**
 * Get user roles from Access Control contract
 */
export async function getUserRoles(address: string): Promise<{ isAdmin: boolean, isIssuer: boolean, isVerifier: boolean, isAuditor: boolean }> {
  try {
    if (!window.ethereum) return { isAdmin: false, isIssuer: false, isVerifier: false, isAuditor: false };

    const provider = new ethers.BrowserProvider(window.ethereum);
    validateAddress(ACCESS_CONTROL_ADDRESS, 'ACCESS_CONTROL');
    const contract = new ethers.Contract(ACCESS_CONTROL_ADDRESS, ACCESS_CONTROL_ABI, provider);

    // getRoles returns a boolean array [isAdmin, isIssuer, isVerifier, isAuditor]
    const roles = await contract.getRoles(address);

    return {
      isAdmin: roles[0],
      isIssuer: roles[1],
      isVerifier: roles[2],
      isAuditor: roles[3]
    };
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return { isAdmin: false, isIssuer: false, isVerifier: false, isAuditor: false };
  }
}

/**
 * Grant a role on the Access Control contract (Admin Only)
 */
export async function grantRoleOnChain(targetAddress: string, role: string): Promise<string> {
  try {
    if (!window.ethereum) throw new Error("Ethereum wallet not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    validateAddress(ACCESS_CONTROL_ADDRESS, 'ACCESS_CONTROL');
    const contract = new ethers.Contract(ACCESS_CONTROL_ADDRESS, ACCESS_CONTROL_ABI, signer);

    let tx;
    if (role === "ISSUER" || role === "issuer") {
      tx = await contract.addIssuer(targetAddress);
    } else if (role === "VERIFIER" || role === "verifier") {
      tx = await contract.addVerifier(targetAddress);
    } else if (role === "AUDITOR" || role === "auditor") {
      tx = await contract.addAuditor(targetAddress);
    } else if (role === "ADMIN" || role === "admin") {
      tx = await contract.addAdmin(targetAddress);
    } else {
      throw new Error(`Invalid role requested for on-chain grant: ${role}`);
    }

    const receipt = await tx.wait();
    return receipt.hash || tx.hash;
  } catch (error: any) {
    console.error(`Error granting ${role} role on chain:`, error);
    throw new Error(`Failed to grant role on blockchain: ${error?.info?.error?.message || error.message}`);
  }
}

export default {
  calculateSHA256,
  registerDocument,
  verifyDocument,
  getDocumentDetails,
  revokeDocument,
  attestDocument,
  getUserRoles,
  logAuditAction,
  grantRoleOnChain
};