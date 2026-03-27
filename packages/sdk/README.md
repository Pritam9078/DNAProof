# DNAProof SDK

The official TypeScript SDK for interacting with the DNAProof platform (Ethereum, Hyperledger Fabric, and IPFS).

## Features
- **Unified Registration**: Register documents across IPFS and multiple ledgers in a single call.
- **On-chain Verification**: Instant cryptographic verification of document integrity and issuance.
- **Role-Based Access Control**: Simple API to manage permissions on the decentralized registry.
- **Audit Logs**: Retrieve immutable proof of actions for any document.

## Installation
```bash
npm install @dnaproof/sdk
```

## Quick Start
```typescript
import { DNAProofSDK } from "@dnaproof/sdk";

const sdk = new DNAProofSDK({
  ethereum: {
    rpcUrl: "your_rpc_url",
    registryAddress: "0x...",
    // ... other addresses
  },
  ipfs: {
    gatewayUrl: "https://ipfs.infura.io:5001"
  }
});

await sdk.init();
await sdk.connectEthereum(yourSigner);

const hash = await sdk.registerDocument(fileBuffer, { title: "My Doc" });
console.log("Verified:", await sdk.verifyDocument(hash));
```

## Documentation
See the `examples/` directory for detailed usage patterns including Fabric integration and Access Control management.
