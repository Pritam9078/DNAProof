import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  nonceExpiresAt: {
    type: Date,
  },
  did: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Role management
  roleStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NONE',
  },
  requestedRole: {
    type: String,
    enum: ['ISSUER', 'VERIFIER', 'AUDITOR', 'ADMIN', null],
    default: null,
  },
  // Org info (for issuers)
  orgName: {
    type: String,
    default: null,
  },
  orgType: {
    type: String,
    enum: ['University', 'Government', 'Company', 'NGO', 'Other', null],
    default: null,
  },
  // Profile
  displayName: {
    type: String,
    default: null,
  },
  profileImage: {
    type: String,
    default: null, // base64 or URL
  },
  // Access request and payment info
  fullName: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: null,
  },
  orgWebsite: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'COMPLETED'],
    default: 'NONE',
  },
  paymentTxHash: {
    type: String,
    default: null,
  },
  // SaaS / Subscription info
  plan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE', null],
    default: 'FREE',
  },
  verificationCount: {
    type: Number,
    default: 0,
  },
  verificationLimit: {
    type: Number,
    default: 3, // Free users get 3 verifications
  },
  documentCount: {
    type: Number,
    default: 0,
  },
  documentLimit: {
    type: Number,
    default: 0, // 0 for FREE users by default
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  preferences: {
    type: String,
    default: '{"darkMode":true,"notifications":true}',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model('User', UserSchema);
