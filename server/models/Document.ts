import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  // Core hashes
  hash: {
    type: String,
    required: true,
    unique: true,
  },
  contentHash: {
    type: String,
    default: null, // keccak256 of the JSON field data
  },
  // Near-duplicate detection (Phase 2)
  perceptualHash: {
    type: String,
    default: null,
    index: true,
  },
  fuzzyTextBase: {
    type: String,
    default: null, // Normalized text content for similarity matching
  },
  // Merkle-anchored batches (Phase 3)
  merkleRoot: {
    type: String,
    default: null,
    index: true,
  },
  merkleProof: {
    type: [String],
    default: [],
  },
  // Storage
  cid: {
    type: String,
    required: true,
  },
  // Ownership
  owner: {
    type: String,
    required: true,
    lowercase: true,
  },
  issuedBy: {
    type: String,
    default: null,
    lowercase: true, // issuer (admin) wallet address
  },
  issuedTo: {
    type: String,
    default: null,
    lowercase: true, // recipient wallet address
  },
  // Document metadata
  name: {
    type: String,
    default: null, // original filename
  },
  docType: {
    type: String,
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate',
    default: null,
  },
  // Field data (filled from template)
  fieldData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Verifiable Credential
  verifiableCredential: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // QR Code
  qrCode: {
    type: String,
    default: null, // base64 encoded PNG
  },
  verificationUrl: {
    type: String,
    default: null,
  },
  // Status
  expiryDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
    default: 'ACTIVE',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  // Blockchain
  docId: {
    type: Number, // On-chain document ID from DNAProofRegistry
    default: null,
  },
  documentLimit: {
    type: Number,
    default: 0,
  },
  aiAnalysis: {
    type: Object,
    default: null,
  },
  version: {
    type: Number,
    default: 1,
  },
  txHash: {
    type: String,
    default: null, // Ethereum transaction hash
  },
  fabricTxId: {
    type: String, // Hyperledger Fabric Transaction ID
    default: null,
  },
  nft: {
    isNFT: { type: Boolean, default: false },
    fabricTokenId: { type: String, default: null },
    ethTokenId: { type: String, default: null },
    metadataURI: { type: String, default: null },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Document = mongoose.model('Document', DocumentSchema);
