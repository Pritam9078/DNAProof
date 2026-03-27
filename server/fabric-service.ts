import { Gateway, Wallets, Network, Contract } from 'fabric-network';
import path from 'path';
import fs from 'fs';

const channelName = 'mychannel';
const chaincodeName = 'dna-contract';
const mspId = 'Org1MSP';

interface FabricConfig {
    connectionProfilePath: string;
    walletPath: string;
    userName: string;
}

export class FabricService {
    private gateway: Gateway | null = null;
    private network: Network | null = null;
    private contract: Contract | null = null;

    constructor(private config: FabricConfig) {}

    async connect() {
        try {
            const ccpPath = path.resolve(this.config.connectionProfilePath);
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            const walletPath = path.resolve(this.config.walletPath);
            const wallet = await Wallets.newFileSystemWallet(walletPath);

            const identity = await wallet.get(this.config.userName);
            if (!identity) {
                throw new Error(`An identity for the user ${this.config.userName} does not exist in the wallet`);
            }

            this.gateway = new Gateway();
            await this.gateway.connect(ccp, {
                wallet,
                identity: this.config.userName,
                discovery: { enabled: true, asLocalhost: true }
            });

            this.network = await this.gateway.getNetwork(channelName);
            this.contract = this.network.getContract(chaincodeName);
            
            console.log('Successfully connected to Hyperledger Fabric network');
        } catch (error) {
            console.error('Failed to connect to Fabric network:', error);
            // In a real app, you might want to retry or throw
            this.contract = null;
        }
    }

    async registerPrivateDocument(docId: string, sha256Hash: string, privateMetadata: any, owner: string) {
        if (!this.contract) await this.connect();
        if (!this.contract) throw new Error('Fabric contract not initialized');

        const metadataStr = typeof privateMetadata === 'string' ? privateMetadata : JSON.stringify(privateMetadata);
        await this.contract.submitTransaction('registerPrivateDocument', docId, sha256Hash, metadataStr, owner);
    }

    async mintNFT(docId: string, sha256Hash: string, metadataURI: string, owner: string, signature?: string) {
        if (!this.contract) await this.connect();
        if (!this.contract) throw new Error('Fabric contract not initialized');

        if (signature) {
            await this.contract.submitTransaction('mintNFT', docId, sha256Hash, metadataURI, owner, signature);
        } else {
            await this.contract.submitTransaction('mintNFT', docId, sha256Hash, metadataURI, owner);
        }
    }

    async transferNFT(docId: string, newOwner: string) {
        if (!this.contract) await this.connect();
        if (!this.contract) throw new Error('Fabric contract not initialized');

        await this.contract.submitTransaction('transferNFT', docId, newOwner);
    }

    async updateStatus(docId: string, newStatus: string) {
        if (!this.gateway) await this.connect();
        if (!this.contract) throw new Error('Fabric contract not initialized');

        await this.contract.submitTransaction('updateStatus', docId, newStatus);
    }

    async updateAIAnalysis(docId: string, aiAnalysis: any) {
        if (!this.gateway) await this.connect();
        if (!this.contract) throw new Error('Fabric contract not initialized');

        const aiAnalysisStr = JSON.stringify(aiAnalysis);
        await this.contract.submitTransaction('updateAIAnalysis', docId, aiAnalysisStr);
    }

    async queryDocument(docId: string) {
        if (!this.contract) await this.connect();
        if (!this.contract) throw new Error('Fabric contract not initialized');

        const result = await this.contract.evaluateTransaction('queryDocument', docId);
        return JSON.parse(result.toString());
    }

    async getHistory(docId: string) {
        if (!this.contract) await this.connect();
        if (!this.contract) throw new Error('Fabric contract not initialized');

        const result = await this.contract.evaluateTransaction('getHistoryForDocument', docId);
        return JSON.parse(result.toString());
    }

    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
            this.gateway = null;
            this.contract = null;
            this.network = null;
        }
    }
}

// Default instance for the application
export const fabricService = new FabricService({
    connectionProfilePath: process.env.FABRIC_CCP_PATH || './fabric/network/connection.json',
    walletPath: process.env.FABRIC_WALLET_PATH || './fabric/wallet',
    userName: process.env.FABRIC_USER || 'appUser'
});
