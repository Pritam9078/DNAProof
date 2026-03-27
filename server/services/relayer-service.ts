import { ethers } from 'ethers';
import { fabricService } from '../fabric-service.ts';
import { nftService } from './nft-service.ts';
import NFT_ABI from '../../lib/abis/DNAProofNFT.json' assert { type: 'json' };

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

export class RelayerService {
    private provider: ethers.JsonRpcProvider;
    private nftContract: ethers.Contract | null = null;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        if (NFT_ADDRESS) {
            this.nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, this.provider);
        }
    }

    /**
     * Starts listening for events on Ethereum and Fabric to bridge state.
     */
    async startRelaying() {
        console.log('Relayer Service starting...');

        if (this.nftContract) {
            // 🌐 Listen for Ethereum Mint Events -> Sync to Fabric
            this.nftContract.on('DocumentNFTMinted', async (to, tokenId, uri, event) => {
                console.log(`[Relayer] Ethereum Event: DocumentNFTMinted - ID: ${tokenId}`);
                try {
                    // We assume docId matches or is linked via metadata
                    // In a production app, we'd lookup the docId from the URI or event data
                    const docId = tokenId.toString();
                    const docHash = ethers.id(uri); // Simplified link
                    await fabricService.mintNFT(docId, docHash, uri, to);
                    console.log(`[Relayer] Successfully synced Ethereum NFT ${tokenId} to Fabric.`);
                } catch (error) {
                    console.error('[Relayer] Failed to sync Ethereum event to Fabric:', error);
                }
            });
        }

        // 🏗️ In a real app, we would also set up a Fabric Event Listener here
        // to sync Fabric Minted events -> Ethereum Minting
        // fabricService.on('NFTMinted', ...);
    }

    async stopRelaying() {
        if (this.nftContract) {
            this.nftContract.removeAllListeners();
        }
    }
}

export const relayerService = new RelayerService();
