import { DNAProofSDK, SDKConfig } from "../src";
import fs from "fs";

async function main() {
  const config: SDKConfig = {
    ethereum: {
      rpcUrl: "http://localhost:8545",
      registryAddress: "0xYourRegistryAddress",
      accessControlAddress: "0xYourAccessAddress",
      auditLogsAddress: "0xYourAuditAddress",
    },
    ipfs: {
      gatewayUrl: "http://localhost:5001",
    }
  };

  const sdk = new DNAProofSDK(config);
  await sdk.init();

  // In a real browser app, you would pass window.ethereum
  // For node apps, you can use a private key signer:
  // const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  // await sdk.connectEthereum(signer);

  console.log("SDK Initialized.");

  try {
    const fileBuffer = fs.readFileSync("./sample.pdf");
    console.log("Registering document...");
    
    const hash = await sdk.registerDocument(fileBuffer, {
      title: "My Secure Document",
      docType: "OFFICIAL_RECORD"
    });

    console.log("Document Registered!");
    console.log("On-chain Hash:", hash);

    const isVerified = await sdk.verifyDocument(hash);
    console.log("Verification Status:", isVerified);

    const docDetails = await sdk.getDocument(hash);
    console.log("Document Details:", JSON.stringify(docDetails, null, 2));

  } catch (error) {
    console.error("Workflow failed:", error);
  }
}

// main();
