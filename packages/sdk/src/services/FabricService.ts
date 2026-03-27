import { DocMetadata } from "../types";

export class FabricService {
  private gateway: any = null;
  private network: any = null;
  private contract: any = null;

  constructor(private config: {
    ccpPath: string;
    walletPath: string;
    userIdentity: string;
    channelName: string;
    chaincodeName: string;
  }) {}

  async init(): Promise<void> {
    if (typeof window !== "undefined") {
      console.warn("FabricService: Hyperledger Fabric integration is only available in Node.js environments.");
      return;
    }
  }

  async connect(wallet: any, identity: string): Promise<void> {
    if (typeof window !== "undefined") {
      throw new Error("FabricService.connect is not supported in the browser.");
    }

    try {
      // Dynamic import to prevent browser bundling issues
      const { Gateway } = await import("fabric-network");
      this.gateway = new Gateway();
      // Additional connection logic would go here in a full implementation
    } catch (error) {
      console.error("Failed to load fabric-network:", error);
      throw new Error("Fabric dependencies not available.");
    }
  }

  /**
   * Record document metadata on Hyperledger Fabric
   */
  async recordDocument(hash: string, cid: string, metadata: DocMetadata): Promise<void> {
    if (typeof window !== "undefined") {
      console.warn("FabricService.recordDocument: Skipping Fabric record in browser environment.");
      return;
    }

    if (!this.contract) {
      console.warn("Fabric contract not connected. Skipping Fabric record.");
      return;
    }

    try {
      await this.contract.submitTransaction(
        "RecordDocument",
        hash,
        cid,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.error("Fabric transaction failed:", error);
      throw new Error(`Fabric Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.gateway) {
      await this.gateway.disconnect();
    }
  }
}
