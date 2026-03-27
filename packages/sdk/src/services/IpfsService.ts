export class IpfsService {
  private client: any = null;

  constructor(private config: { gatewayUrl: string; authHeader?: string }) {}

  private async getClient() {
    if (this.client) return this.client;
    
    try {
      const { create } = await import("ipfs-http-client");
      this.client = create({
        url: this.config.gatewayUrl,
        headers: this.config.authHeader ? { Authorization: this.config.authHeader } : undefined,
      });
      return this.client;
    } catch (error) {
      console.error("Failed to initialize IPFS client:", error);
      throw new Error("IPFS client dependencies not available.");
    }
  }

  /**
   * Upload a file or buffer to IPFS
   * @returns The IPFS CID (hash)
   */
  async upload(data: Buffer | File): Promise<string> {
    try {
      const client = await this.getClient();
      const added = await client.add(data);
      return added.path;
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw new Error(`IPFS Upload Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Retrieve contents from IPFS
   */
  async get(cid: string): Promise<Uint8Array> {
    const client = await this.getClient();
    const chunks: Uint8Array[] = [];
    for await (const chunk of client.cat(cid)) {
      chunks.push(chunk);
    }
    // Simple fallback if Buffer is not available globally (browser)
    if (typeof Buffer !== 'undefined') {
      return Buffer.concat(chunks.map(c => Buffer.from(c)));
    } else {
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    }
  }
}
