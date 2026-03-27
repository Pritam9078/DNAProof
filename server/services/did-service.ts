import { ethers } from 'ethers';

export class DIDService {
  /**
   * Resolve an Ethereum address to a DID string.
   * Format: did:ethr:<address>
   */
  static resolveAddressToDID(address: string): string {
    return `did:ethr:${address.toLowerCase()}`;
  }

  /**
   * Mock resolution for demonstration. In a real scenario, this would
   * query the ethr-did-resolver or a local DID registry.
   */
  static async resolveDID(did: string): Promise<{ publicKey: string }> {
    if (!did.startsWith('did:ethr:')) {
      throw new Error('Unsupported DID method');
    }
    const address = did.split(':')[2];
    return { publicKey: address }; // For did:ethr, the public key is the address
  }

  /**
   * Signs a Verifiable Credential payload using the provided private key.
   * This simulates an issuer's wallet signing a claim.
   */
  static async signCredential(payload: any, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    const message = JSON.stringify(payload);
    const signature = await wallet.signMessage(message);
    return signature;
  }

  /**
   * Verifies a VC signature.
   */
  static async verifyCredentialSignature(payload: any, signature: string, expectedDID: string): Promise<boolean> {
    const message = JSON.stringify(payload);
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const recoveredDID = this.resolveAddressToDID(recoveredAddress);
    return recoveredDID === expectedDID.toLowerCase();
  }
}
