import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fabricService } from '../fabric-service.ts';
import { storage } from '../storage.ts';

const nftAbiPath = path.join(process.cwd(), 'lib/abis/DNAProofNFT.json');
const NFT_ABI_FILE = JSON.parse(fs.readFileSync(nftAbiPath, 'utf8'));
const NFT_ABI = NFT_ABI_FILE.abi || NFT_ABI_FILE;

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

export class NFTService {
    private provider: ethers.JsonRpcProvider;
    private wallet: any;
    private nftContract: ethers.Contract | null = null;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        // Fallback to PRIVATE_KEY if BURNER_WALLET_PRIVATE_KEY is missing
        const privateKey = process.env.BURNER_WALLET_PRIVATE_KEY || process.env.PRIVATE_KEY || '';
        
        if (privateKey) {
            this.wallet = new ethers.Wallet(privateKey, this.provider);
            if (NFT_ADDRESS) {
                this.nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, this.wallet);
            }
        } else {
            // Provide a dummy wallet to prevent crash, though minting will fail later with clear error
            this.wallet = ethers.Wallet.createRandom().connect(this.provider);
            console.warn('NFTService: No private key provided in .env. Digital signatures will use a random ephemeral key.');
        }
    }

    /**
     * Mints a document NFT on both Ethereum (Public) and Hyperledger Fabric (Private).
     * @param userAddress The Ethereum address of the owner.
     * @param docId The unique document identifier.
     * @param docHash The Keccak256 hash of the document content.
     * @param metadataURI The IPFS CID or URI of the document metadata.
     */
    async dualMint(userAddress: string, docId: string, docHash: string, metadataURI: string, signature?: string) {
        console.log(`[NFT-Service] Starting dual-mint for document ${docId}...`);
        
        let fabricSuccess = false;
        let ethSuccess = false;
        let ethTokenId = null;
        let dbSuccess = false;

        try {
            // 1. Mint on Hyperledger Fabric (Private Record)
            try {
                await fabricService.mintNFT(docId, docHash, metadataURI, userAddress, signature);
                fabricSuccess = true;
                console.log(`[Fabric] NFT minted successfully for ${docId}`);
            } catch (error: any) {
                console.error(`[Fabric] Minting failed for ${docId}:`, error.message);
            }

            // 2. Mint on Ethereum (Public Anchor)
            if (this.nftContract) {
                try {
                    console.log(`[Ethereum] Sending transaction for ${userAddress}...`);
                    const tx = await this.nftContract.mintDocumentNFT(userAddress, metadataURI);
                    const receipt = await tx.wait();
                    ethSuccess = true;
                    
                    // Attempt to extract tokenId from events
                    if (receipt.logs && receipt.logs.length > 0) {
                        try {
                            // Simple heuristic for tokenId in standard ERC-721 Transfer events
                            // or our custom DocumentNFTMinted event
                            for (const log of receipt.logs) {
                                try {
                                    const parsedLog = this.nftContract.interface.parseLog(log);
                                    if (parsedLog && (parsedLog.name === 'DocumentNFTMinted' || parsedLog.name === 'Transfer')) {
                                        // For DocumentNFTMinted(address, uint256, string)
                                        // For Transfer(address, address, uint256)
                                        const val = parsedLog.args[parsedLog.name === 'Transfer' ? 2 : 1];
                                        ethTokenId = val.toString();
                                        break;
                                    }
                                } catch (e) {}
                            }
                        } catch (e) {
                            console.warn(`[Ethereum] Failed to parse logs for tokenId:`, e);
                        }
                    }
                    console.log(`[Ethereum] NFT minted successfully. Token ID: ${ethTokenId || 'Unknown'}`);
                } catch (error: any) {
                    console.error(`[Ethereum] Minting failed:`, error.message);
                }
            } else {
                console.warn('[Ethereum] NFT contract address missing, skipping public mint.');
            }

            // 3. Update local database
            const nftData = {
                success: ethSuccess || fabricSuccess,
                isNFT: true,
                fabricTokenId: docId,
                ethTokenId: ethTokenId,
                metadataURI: metadataURI,
                ownerSignature: signature, // Audit Trail: Store actual signature
                mintedAt: new Date().toISOString()
            };

            try {
                const updatedDoc = await storage.updateDocumentNFT(docId, nftData);
                dbSuccess = !!updatedDoc;
                if (dbSuccess) {
                    console.log(`[Storage] NFT metadata persisted for document ${docId}`);
                } else {
                    console.warn(`[Storage] Document ${docId} not found for NFT update.`);
                }
            } catch (error: any) {
                console.error(`[Storage] Metadata persistence failed:`, error.message);
            }

            return {
                success: dbSuccess && (ethSuccess || fabricSuccess),
                fabricSuccess,
                ethSuccess,
                ethTokenId,
                docId,
                signature
            };
        } catch (error: any) {
            console.error(`[NFT-Service] Fatal dual-mint failure:`, error);
            return {
                success: false,
                error: error.message,
                docId
            };
        }
    }

    /**
     * Transfers an NFT on both chains.
     */
    async transferNFT(docId: string, from: string, to: string, ethTokenId?: string) {
        // Implementation for cross-chain transfer coordination
        // ...
    }
}

export const nftService = new NFTService();
