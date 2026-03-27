'use strict';

const { Contract } = require('fabric-contract-api');

class DNAContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }

    async registerPrivateDocument(ctx, docId, sha256Hash, privateMetadata, owner) {
        console.info('============= START : Register Private Document ===========');
        
        const mspid = ctx.clientIdentity.getMSPID();
        if (mspid !== 'Org1MSP') {
            throw new Error('Unauthorized: Only Org1 members can register documents');
        }
        
        const document = {
            docId,
            sha256Hash,
            privateMetadata: JSON.parse(privateMetadata),
            owner,
            status: 'ACTIVE',
            timestamp: ctx.stub.getTxTimestamp().seconds.low,
            docType: 'private_dna_record',
            aiAnalysis: null, // Placeholder for AI results
            complianceStatus: 'PENDING', // Default compliance
            isNFT: false
        };

        await ctx.stub.putState(docId, Buffer.from(JSON.stringify(document)));
        console.info('============= END : Register Private Document ===========');
    }

    async mintNFT(ctx, docId, sha256Hash, metadataURI, owner, signature) {
        console.info('============= START : Mint NFT-Based Document ===========');
        
        const mspid = ctx.clientIdentity.getMSPID();
        if (mspid !== 'Org1MSP') {
            throw new Error('Unauthorized: Only Org1 members can mint NFTs');
        }

        const document = {
            docId,
            sha256Hash,
            metadataURI,
            owner,
            status: 'CERTIFIED',
            timestamp: ctx.stub.getTxTimestamp().seconds.low,
            docType: 'dna_nft_record',
            isNFT: true,
            tokenId: docId, // Using docId as tokenId in Fabric
            ownerSignature: signature || null // Store the wallet authorization signature
        };

        await ctx.stub.putState(docId, Buffer.from(JSON.stringify(document)));
        
        // Emit an event for the NFT minting
        const eventPayload = { docId, owner, tokenId: docId, signature: signature || null };
        ctx.stub.setEvent('NFTMinted', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Mint NFT ===========');
    }

    async transferNFT(ctx, docId, newOwner) {
        console.info('============= START : Transfer NFT ===========');
        
        const documentAsBytes = await ctx.stub.getState(docId);
        if (!documentAsBytes || documentAsBytes.length === 0) {
            throw new Error(`${docId} does not exist`);
        }

        const document = JSON.parse(documentAsBytes.toString());
        if (!document.isNFT) {
            throw new Error(`${docId} is not an NFT-based document`);
        }

        // In a production app, verify that the caller is the current owner
        // const clientID = ctx.clientIdentity.getID();
        // if (document.owner !== clientID) { ... }

        const oldOwner = document.owner;
        document.owner = newOwner;
        document.updatedAt = ctx.stub.getTxTimestamp().seconds.low;

        await ctx.stub.putState(docId, Buffer.from(JSON.stringify(document)));
        
        // Emit transfer event
        const eventPayload = { docId, from: oldOwner, to: newOwner };
        ctx.stub.setEvent('NFTTransferred', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Transfer NFT ===========');
    }

    async queryDocument(ctx, docId) {
        const documentAsBytes = await ctx.stub.getState(docId);
        if (!documentAsBytes || documentAsBytes.length === 0) {
            throw new Error(`${docId} does not exist`);
        }
        console.log(documentAsBytes.toString());
        return documentAsBytes.toString();
    }

    async updateStatus(ctx, docId, newStatus) {
        console.info(`============= START : Update Status to ${newStatus} ===========`);
        
        const mspid = ctx.clientIdentity.getMSPID();
        if (mspid !== 'Org1MSP') {
            throw new Error('Unauthorized: Only Org1 members can update status');
        }

        const documentAsBytes = await ctx.stub.getState(docId);
        if (!documentAsBytes || documentAsBytes.length === 0) {
            throw new Error(`${docId} does not exist`);
        }

        const document = JSON.parse(documentAsBytes.toString());
        document.status = newStatus;
        document.updatedAt = ctx.stub.getTxTimestamp().seconds.low;

        await ctx.stub.putState(docId, Buffer.from(JSON.stringify(document)));
        console.info(`============= END : Update Status ===========`);
    }

    async updateAIAnalysis(ctx, docId, aiAnalysis) {
        console.info('============= START : Update AI Analysis ===========');
        const documentAsBytes = await ctx.stub.getState(docId);
        if (!documentAsBytes || documentAsBytes.length === 0) {
            throw new Error(`${docId} does not exist`);
        }

        const document = JSON.parse(documentAsBytes.toString());
        document.aiAnalysis = JSON.parse(aiAnalysis);
        document.updatedAt = ctx.stub.getTxTimestamp().seconds.low;

        await ctx.stub.putState(docId, Buffer.from(JSON.stringify(document)));
    }

    async getHistoryForDocument(ctx, docId) {
        let iterator = await ctx.stub.getHistoryForKey(docId);
        let result = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value) {
                const historyRecord = {
                    txId: res.value.tx_id,
                    timestamp: res.value.timestamp,
                    value: res.value.value.toString('utf8'),
                    isDelete: res.value.is_delete
                };
                result.push(historyRecord);
            }
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(result);
    }
}

module.exports = DNAContract;
