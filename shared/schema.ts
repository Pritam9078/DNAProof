import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  address: text("address").unique(), // Direct mapping to Mongoose 'address'
  displayName: text("display_name"),
  profileImage: text("profile_image"), 
  did: text("did").unique(),
  roleStatus: text("role_status").default("NONE"), // NONE, PENDING, APPROVED, REJECTED
  requestedRole: text("requested_role"),
  orgName: text("org_name"),
  orgType: text("org_type"),
  email: text("email"),
  fullName: text("full_name"),
  orgWebsite: text("org_website"),
  description: text("description"),
  paymentStatus: text("payment_status").default("NONE"),
  paymentTxHash: text("payment_tx_hash"),
  plan: text("plan").default("FREE"),
  verificationCount: integer("verification_count").default(0),
  verificationLimit: integer("verification_limit").default(3),
  documentCount: integer("document_count").default(0),
  documentLimit: integer("document_limit").default(0),
  isSuperAdmin: boolean("is_super_admin").default(false),
  preferences: text("preferences").default('{"darkMode":true,"notifications":true}'), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileData: text("file_data").notNull(), 
  walletAddress: text("wallet_address").notNull(), // maps to owner
  owner: text("owner").notNull(), 
  hash: text("hash").notNull().unique(), // documentHash
  contentHash: text("content_hash"),
  cid: text("cid").notNull(), // ipfs_cid
  issuedBy: text("issued_by"),
  issuedTo: text("issued_to"),
  name: text("name"),
  docType: text("doc_type").notNull(),
  templateId: text("template_id"),
  fieldData: text("field_data"), // JSON string
  verifiableCredential: text("verifiable_credential"), // JSON string
  qrCode: text("qr_code"),
  verificationUrl: text("verification_url"),
  expiryDate: timestamp("expiry_date"),
  status: text("status").default("ACTIVE"),
  isPublic: boolean("is_public").default(true),
  blockchainDocId: integer("blockchain_doc_id"), 
  docId: integer("doc_id"), // direct mapping to mongoose docId
  txHash: text("tx_hash"),
  fabricTxId: text("fabric_tx_id"),
  aiAnalysis: text("ai_analysis"), // JSON string
  perceptualHash: text("perceptual_hash"),
  fuzzyTextBase: text("fuzzy_text_base"),
  merkleRoot: text("merkle_root"),
  merkleProof: text("merkle_proof"), 
  nft: text("nft"), // JSON string: { isNFT: boolean, fabricTokenId: string, ethTokenId: string, metadataURI: string }
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  address: true,
  displayName: true,
  profileImage: true,
  preferences: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  fileName: true,
  fileType: true,
  fileSize: true,
  fileData: true,
  walletAddress: true,
  owner: true,
  hash: true,
  cid: true,
  docType: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
