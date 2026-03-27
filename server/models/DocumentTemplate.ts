import mongoose from 'mongoose';

const FieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['string', 'number', 'date', 'boolean'], required: true },
  required: { type: Boolean, default: true },
  placeholder: { type: String, default: '' },
}, { _id: false });

const DocumentTemplateSchema = new mongoose.Schema({
  createdBy: {
    type: String,
    required: true,
    lowercase: true, // issuer wallet address
  },
  docType: {
    type: String,
    required: true, // e.g. "Degree Certificate"
  },
  description: {
    type: String,
    default: '',
  },
  fields: {
    type: [FieldSchema],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const DocumentTemplate = mongoose.model('DocumentTemplate', DocumentTemplateSchema);
