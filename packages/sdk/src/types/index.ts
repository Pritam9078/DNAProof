import { Signer } from "ethers";

export interface SDKConfig {
  ethereum?: {
    rpcUrl: string;
    registryAddress: string;
    accessControlAddress: string;
    auditLogsAddress: string;
  };
  fabric?: {
    ccpPath: string;
    walletPath: string;
    userIdentity: string;
    channelName: string;
    chaincodeName: string;
  };
  ipfs?: {
    gatewayUrl: string;
    authHeader?: string;
  };
}

export interface DocMetadata {
  title?: string;
  issuer?: string;
  description?: string;
  [key: string]: any;
}

export interface DocumentRecord {
  hash: string;
  ipfsCid: string;
  issuer: string;
  timestamp: Date;
  docType?: string;
  isPublic: boolean;
  tokenId?: string;
}

export interface AuditLogEntry {
  docId: string;
  actor: string;
  actionType: number;
  details: string;
  timestamp: Date;
}
