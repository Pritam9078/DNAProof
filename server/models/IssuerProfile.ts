import mongoose from 'mongoose';

const IssuerProfileSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  orgName: {
    type: String,
    required: true,
  },
  orgType: {
    type: String,
    enum: ['University', 'Government', 'Company', 'NGO', 'Other'],
    required: true,
  },
  trustScore: {
    type: Number,
    default: 50, // starts at 50/100
    min: 0,
    max: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  approvedBy: {
    type: String, // Super Admin wallet address
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const IssuerProfile = mongoose.model('IssuerProfile', IssuerProfileSchema);
