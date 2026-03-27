import express from "express";
import { storage } from "../storage";
import { Document } from '../models/Document';
import { fabricService } from '../fabric-service';
import { authenticateToken } from '../middleware';

const router = express.Router();

/**
 * Performs AI classification and analysis on a document.
 */
router.post("/ai/classify", authenticateToken, async (req, res) => {
  try {
    const { docId, documentHash } = req.body;
    
    if (!docId) {
      return res.status(400).json({ message: "docId is required" });
    }

    console.log(`[AI-Classify] Processing request for docId: ${docId}`);
    const doc = await storage.queryDocument(docId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found by ID or Hash" });
    }
    if (!doc.cid) {
      return res.status(404).json({ message: "Document found but missing IPFS CID" });
    }

    const mockBuffer = Buffer.from("Document content for AI classification simulation");

    const { AIService } = await import('../services/ai-service.ts');
    const analysisResult = await AIService.analyzeDocument(mockBuffer, doc.fieldData || {});

    await Document.findByIdAndUpdate(doc._id, { $set: { aiAnalysis: analysisResult } });

    try {
      await fabricService.updateAIAnalysis(docId, analysisResult);
    } catch (fError) {
      console.warn("Soft failure: Could not sync AI analysis to Fabric:", fError);
    }

    res.status(200).json({
      message: "AI Classification complete",
      analysisResult
    });
  } catch (error: any) {
    console.error("AI Classification failed:", error);
    res.status(500).json({ message: "AI analysis failed", error: error.message });
  }
});

export default router;
