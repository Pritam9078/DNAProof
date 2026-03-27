import { ethers } from 'ethers';
import { createNotification } from './notification-service.ts';
import RegistryABI from '../lib/abis/DNAProofRegistry.json';
import AccessControlABI from '../lib/abis/DNAProofAccessControl.json';
import AuditLogsABI from '../lib/abis/DNAProofAuditLogs.json';

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '';
const ACCESS_CONTROL_ADDRESS = process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS || '';
const AUDIT_LOGS_ADDRESS = process.env.NEXT_PUBLIC_AUDIT_LOGS_ADDRESS || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

export const setupBlockchainListeners = () => {
  if (!REGISTRY_ADDRESS || !ACCESS_CONTROL_ADDRESS || !AUDIT_LOGS_ADDRESS) {
    console.warn("Blockchain addresses missing, listeners not started.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const registry = new ethers.Contract(REGISTRY_ADDRESS, (RegistryABI as any).abi || RegistryABI, provider);
  const accessControl = new ethers.Contract(ACCESS_CONTROL_ADDRESS, (AccessControlABI as any).abi || AccessControlABI, provider);
  const auditLogs = new ethers.Contract(AUDIT_LOGS_ADDRESS, (AuditLogsABI as any).abi || AuditLogsABI, provider);

  console.log("Starting Blockchain Event Listeners...");

  // 📄 Document Registered
  registry.on("DocumentRegistered", async (docId, issuer, hash, ipfsHash) => {
    console.log(`Event: DocumentRegistered - ID: ${docId}, Issuer: ${issuer}`);
    await createNotification({
      userAddress: issuer,
      role: "ISSUER",
      type: "DOCUMENT_REGISTERED",
      message: `Your document has been registered on-chain with ID ${docId}.`,
      metadata: { docId: Number(docId), documentHash: hash, txHash: ipfsHash }
    });
    
    // Also notify Admin
    await createNotification({
      role: "ADMIN",
      type: "SYSTEM_ALERT",
      message: `A new document (${docId}) was registered by ${issuer}.`,
      metadata: { docId: Number(docId), issuer }
    });
  });

  // 📄 Document Verified
  registry.on("DocumentVerified", async (docId, verifier) => {
    console.log(`Event: DocumentVerified - ID: ${docId}, Verifier: ${verifier}`);
    // We don't have the original issuer address here, but we can notify the role or lookup in DB if needed
    await createNotification({
      role: "ADMIN",
      type: "DOCUMENT_VERIFIED",
      message: `Document ${docId} was verified by ${verifier}.`,
      metadata: { docId: Number(docId), verifier }
    });
  });

  // 🔐 Role Granted
  accessControl.on("RoleGranted", async (role, account, sender) => {
    console.log(`Event: RoleGranted - Account: ${account}, Role: ${role}`);
    await createNotification({
      userAddress: account,
      role: "ALL",
      type: "ACCESS_GRANTED",
      message: `You have been granted a new role in the DNAProof system.`,
      metadata: { role, grantedBy: sender }
    });
  });

  // 📊 Audit Log Created
  auditLogs.on("LogEntryCreated", async (docId, actor, action, timestamp) => {
      console.log(`Event: LogEntryCreated - Doc: ${docId}, Action: ${action}`);
      await createNotification({
          role: "AUDITOR",
          type: "AUDIT_LOG",
          message: `New audit log entry for document ${docId} by ${actor}.`,
          metadata: { docId: Number(docId), actor, action }
      });
  });
};
