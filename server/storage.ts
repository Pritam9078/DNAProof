import mongoose from 'mongoose';
import { User } from './models/User';
import { Document } from './models/Document';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dnaproof';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

export interface IStorage {
  // User operations
  getUser(id: string): Promise<any>;
  getUserByWalletAddress(walletAddress: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(walletAddress: string, updates: any): Promise<any>;
  
  // Document operations
  getFiles(walletAddress?: string): Promise<any[]>;
  getFile(id: string): Promise<any>;
  getFileByHash(hash: string): Promise<any>;
  createFile(fileData: any): Promise<any>;
  updateFile(hash: string, updates: any): Promise<any>;
  deleteFile(id: string): Promise<boolean>;
  getStats(walletAddress?: string): Promise<any>;
}

export class MongoStorage implements IStorage {
  async getStats(walletAddress?: string): Promise<any> {
    const query = walletAddress ? { owner: walletAddress.toLowerCase() } : {};
    const total = await Document.countDocuments(query);
    const verified = await Document.countDocuments({ ...query, status: 'ACTIVE' });
    const pending = await Document.countDocuments({ ...query, status: 'PENDING' });
    const revoked = await Document.countDocuments({ ...query, status: 'REVOKED' });
    
    // NFT stats
    const nfts = await Document.countDocuments({ ...query, 'nft.isNFT': true });
    
    // AI stats (Average Risk)
    const docsWithAI = await Document.find({ ...query, 'aiAnalysis.riskScore': { $exists: true } });
    const avgRisk = docsWithAI.length > 0 
      ? docsWithAI.reduce((acc, d) => acc + (d.aiAnalysis?.riskScore || 0), 0) / docsWithAI.length 
      : 0;

    return {
      total,
      verified,
      pending,
      revoked,
      nfts,
      avgRisk: Math.round(avgRisk)
    };
  }
  async getUser(id: string): Promise<any> {
    return await User.findById(id);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<any> {
    return await User.findOne({ address: walletAddress.toLowerCase() });
  }

  async createUser(userData: any): Promise<any> {
    const userCount = await User.countDocuments();
    const user = new User({
      ...userData,
      address: userData.address.toLowerCase(),
      isSuperAdmin: userCount === 0,
      roleStatus: userCount === 0 ? 'APPROVED' : (userData.roleStatus || 'NONE'),
    });
    return await user.save();
  }
  
  async updateUser(walletAddress: string, updates: any): Promise<any> {
    return await User.findOneAndUpdate(
      { address: walletAddress.toLowerCase() },
      { $set: updates },
      { new: true }
    );
  }

  async getFiles(walletAddress?: string): Promise<any[]> {
    const query = walletAddress ? { owner: walletAddress.toLowerCase() } : {};
    return await Document.find(query).sort({ createdAt: -1 });
  }

  async getFile(id: string): Promise<any> {
    return await Document.findById(id);
  }

  async getFileByHash(hash: string): Promise<any> {
    return await Document.findOne({ hash });
  }

  async createFile(fileData: any): Promise<any> {
    const doc = new Document({
      ...fileData,
      owner: fileData.owner.toLowerCase(),
    });
    return await doc.save();
  }

  async updateFile(hash: string, updates: any): Promise<any> {
    return await Document.findOneAndUpdate(
      { hash },
      { $set: updates },
      { new: true }
    );
  }

  async deleteFile(id: string): Promise<boolean> {
    const result = await Document.findByIdAndDelete(id);
    return !!result;
  }

  async getOrganization(id: number) {
    // Note: Assuming an Organization model exists or and ID was intended as a number for lookup
    // If Organization is not defined, this will need a model import
    // return Organization.findById(id);
    return null; 
  }

  async updateDocumentNFT(docId: string | number, nftData: any) {
    const doc = await this.queryDocument(docId);
    if (!doc) {
      console.warn(`[Storage] Cannot update NFT data: Document not found for ${docId}`);
      return null;
    }
    
    return await (Document as any).findByIdAndUpdate(
      doc._id,
      { $set: { nft: nftData } },
      { new: true }
    );
  }

  async queryDocument(identifier: string | number) {
    console.log(`[Storage] Querying document with identifier: ${identifier} (type: ${typeof identifier})`);
    
    // 1. Try Numeric docId (Registry ID)
    const isNumeric = identifier !== undefined && identifier !== null && 
                     !isNaN(Number(identifier)) && 
                     !String(identifier).startsWith('0x') &&
                     String(identifier).length < 10; // docIds are small, hashes are long
                     
    if (isNumeric) {
      console.log(`[Storage] Performing docId lookup for: ${Number(identifier)}`);
      const doc = await (Document as any).findOne({ docId: Number(identifier) });
      if (doc) {
        console.log(`[Storage] Found document via docId: ${doc._id}`);
        return doc;
      }
    }
    
    // 2. Try MongoDB ObjectId (Internal ID)
    if (typeof identifier === 'string' && mongoose.Types.ObjectId.isValid(identifier)) {
      console.log(`[Storage] Performing ObjectId lookup for: ${identifier}`);
      const docById = await Document.findById(identifier);
      if (docById) {
        console.log(`[Storage] Found document via ObjectId: ${docById._id}`);
        return docById;
      }
    }

    // 3. Fallback to hash lookup
    console.log(`[Storage] Performing hash lookup for: ${identifier}`);
    const docByHash = await (Document as any).findOne({ hash: String(identifier) });
    if (docByHash) {
      console.log(`[Storage] Found document via hash: ${docByHash._id}`);
      return docByHash;
    }

    console.warn(`[Storage] Document NOT found for identifier: ${identifier}`);
    return null;
  }
}

export const storage = new MongoStorage();
