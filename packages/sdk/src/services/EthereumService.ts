import { 
  ethers, 
  BrowserProvider, 
  JsonRpcProvider, 
  Signer, 
  Contract, 
  keccak256
} from "ethers";
import { DocumentRecord, AuditLogEntry } from "../types";

// Standard ABI fragments for registry interaction
const REGISTRY_ABI = [
  "function registerDocument(bytes32 hash, string cid, string docType) external",
  "function verifyDocument(bytes32 hash) external view returns (bool)",
  "function getDocument(bytes32 hash) external view returns (tuple(bytes32 hash, string cid, address issuer, uint256 timestamp, string docType, bool isPublic))",
  "function getAuditLogs(bytes32 hash) external view returns (tuple(bytes32 docId, address actor, uint8 actionType, string details, uint256 timestamp)[])"
];

export class EthereumService {
  private provider: JsonRpcProvider | BrowserProvider;
  private signer: Signer | null = null;
  private registry: Contract | null = null;

  constructor(private config: { 
    rpcUrl: string; 
    registryAddress: string;
    accessControlAddress: string;
    auditLogsAddress: string;
  }) {
    this.provider = new JsonRpcProvider(config.rpcUrl);
  }

  async init(): Promise<void> {
    this.registry = new Contract(this.config.registryAddress, REGISTRY_ABI, this.provider);
  }

  async connect(signer: Signer): Promise<void> {
    this.signer = signer;
    this.registry = new Contract(this.config.registryAddress, REGISTRY_ABI, signer);
  }

  /**
   * Compute keccak256 hash of a file
   */
  async computeHash(data: Buffer | File): Promise<string> {
    const buffer = data instanceof Buffer ? data : Buffer.from(await (data as any).arrayBuffer());
    return keccak256(buffer);
  }

  async register(hash: string, cid: string, docType: string): Promise<void> {
    if (!this.registry) throw new Error("Registry contract not initialized");
    if (!this.signer) throw new Error("Signer required for registration");
    
    const tx = await this.registry.registerDocument(hash, cid, docType);
    await tx.wait();
  }

  async verify(hash: string): Promise<boolean> {
    if (!this.registry) throw new Error("Registry contract not initialized");
    return await this.registry.verifyDocument(hash);
  }

  async getDocument(hash: string): Promise<DocumentRecord> {
    if (!this.registry) throw new Error("Registry contract not initialized");
    const doc = await this.registry.getDocument(hash);
    return {
      hash: doc.hash,
      ipfsCid: doc.cid,
      issuer: doc.issuer,
      timestamp: new Date(Number(doc.timestamp) * 1000),
      docType: doc.docType,
      isPublic: doc.isPublic
    };
  }

  async getLogs(hash: string): Promise<AuditLogEntry[]> {
    if (!this.registry) throw new Error("Registry contract not initialized");
    const logs = await this.registry.getAuditLogs(hash);
    return logs.map((log: any) => ({
      docId: log.docId,
      actor: log.actor,
      actionType: Number(log.actionType),
      details: log.details,
      timestamp: new Date(Number(log.timestamp) * 1000)
    }));
  }
}
