import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actor: {
    type: String,
    required: true,
    lowercase: true, // wallet address of who performed the action
  },
  action: {
    type: String,
    required: true,
    enum: [
      'DOCUMENT_ISSUED',
      'DOCUMENT_VERIFIED',
      'DOCUMENT_REVOKED',
      'ROLE_REQUESTED',
      'ROLE_APPROVED',
      'ROLE_REJECTED',
      'TEMPLATE_CREATED',
      'ACCESS_REQUEST_SUBMITTED',
      'ACCESS_REQUEST_APPROVED',
      'ACCESS_REQUEST_REJECTED',
      'PLAN_UPGRADED',
    ],
  },
  documentHash: {
    type: String,
    default: null,
  },
  documentId: {
    type: Number,
    default: null, // on-chain doc ID
  },
  ipfsCid: {
    type: String,
    default: null,
  },
  targetAddress: {
    type: String,
    default: null, // e.g. recipient of a document or the wallet being approved
    lowercase: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // flexible extra data
    default: {},
  },
  txHash: {
    type: String,
    default: null, // blockchain transaction hash
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
