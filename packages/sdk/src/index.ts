import { SDKConfig, DocMetadata, DocumentRecord, AuditLogEntry } from "./types/index";
import { EthereumService } from "./services/EthereumService";
import type { IpfsService } from "./services/IpfsService";
import type { FabricService } from "./services/FabricService";
import { AccessControlService } from "./services/AccessControlService";
import { Signer } from "ethers";

export class DNAProofSDK {
  public eth: EthereumService | null = null;
  public ipfs: IpfsService | null = null;
  public fabric: FabricService | null = null;
  public access: AccessControlService | null = null;

  constructor(private config: SDKConfig) {
    if (config.ethereum) {
      this.eth = new EthereumService(config.ethereum);
    }
    // We don't initialize IPFS or Fabric here; we'll do it in init() or on-demand
  }

  /**
   * Initialize all configured services
   */
  async init(): Promise<void> {
    const initPromises: Promise<void>[] = [];
    
    // Ethereum
    if (this.eth) {
      initPromises.push(this.eth.init());
      this.access = new AccessControlService({
        rpcUrl: this.config.ethereum!.rpcUrl,
        address: this.config.ethereum!.accessControlAddress
      }, (this.eth as any).provider);
    }

    // IPFS (Dynamic load)
    if (this.config.ipfs && !this.ipfs) {
      const { IpfsService: IpfsServiceImpl } = await import("./services/IpfsService");
      this.ipfs = new IpfsServiceImpl(this.config.ipfs);
    }

    // Fabric (Dynamic load - Only in Node)
    if (this.config.fabric && !this.fabric && typeof window === "undefined") {
      const { FabricService: FabricServiceImpl } = await import("./services/FabricService");
      this.fabric = new FabricServiceImpl(this.config.fabric);
      initPromises.push(this.fabric.init());
    }

    await Promise.all(initPromises);
  }

  /**
   * Connect an Ethereum signer (e.g. MetaMask)
   */
  async connectEthereum(signer: Signer): Promise<void> {
    if (!this.eth) throw new Error("Ethereum service not configured");
    await this.eth.connect(signer);
  }

  /**
   * High-level: Register a document across IPFS, Ethereum, and Fabric
   */
  async registerDocument(file: Buffer | File, metadata: DocMetadata): Promise<string> {
    if (!this.ipfs || !this.eth) {
      throw new Error("IPFS and Ethereum services are required for registration");
    }

    // 1. Upload to IPFS
    const cid = await this.ipfs.upload(file);
    
    // 2. Compute local hash for registry (keccak256)
    const hash = await this.eth.computeHash(file);

    // 3. Register on Ethereum
    await this.eth.register(hash, cid, metadata.docType || "GENERIC");

    // 4. (Optional) Record on Fabric if configured
    if (this.fabric) {
      await this.fabric.recordDocument(hash, cid, metadata);
    }

    return hash;
  }

  /**
   * High-level: Verify a document on-chain
   */
  async verifyDocument(hash: string): Promise<boolean> {
    if (!this.eth) throw new Error("Ethereum service not configured");
    return this.eth.verify(hash);
  }

  /**
   * Get full document details
   */
  async getDocument(hash: string): Promise<DocumentRecord> {
    if (!this.eth) throw new Error("Ethereum service not configured");
    return this.eth.getDocument(hash);
  }

  /**
   * Get audit logs for a document
   */
  async getAuditLogs(hash: string): Promise<AuditLogEntry[]> {
    if (!this.eth) throw new Error("Ethereum service not configured");
    return this.eth.getLogs(hash);
  }

  /**
   * Utility: Hash data using keccak256
   */
  async hashDocument(data: Buffer | File): Promise<string> {
    if (!this.eth) throw new Error("Ethereum service required for hashing");
    return this.eth.computeHash(data);
  }

  /**
   * Utility: Get IPFS CID for a file without uploading (dry-run if possible, or just upload)
   */
  async createIPFSHash(data: Buffer | File): Promise<string> {
    if (!this.ipfs) throw new Error("IPFS service not configured");
    return this.ipfs.upload(data);
  }
}

export * from "./types";
