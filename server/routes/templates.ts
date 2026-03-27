import express from "express";
import { DocumentTemplate } from '../models/DocumentTemplate';
import { AuditLog } from '../models/AuditLog';
import { authenticateToken } from '../middleware';

const router = express.Router();

// Create template
router.post("/templates", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { createdBy, docType, description, fields } = req.body;
    
    if (!createdBy || !docType || !fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ message: "createdBy, docType, and fields (array) are required" });
    }

    const template = await DocumentTemplate.create({ 
      createdBy: createdBy.toLowerCase(), 
      docType, 
      description, 
      fields 
    });

    await AuditLog.create({
      actor: createdBy.toLowerCase(),
      action: 'TEMPLATE_CREATED',
      metadata: { templateId: template._id, docType },
    });

    return res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// List templates
router.get("/templates", async (req: express.Request, res: express.Response) => {
  try {
    const { createdBy } = req.query;
    const query: any = { isActive: true };
    if (createdBy) query.createdBy = (createdBy as string).toLowerCase();
    
    const templates = await DocumentTemplate.find(query).sort({ createdAt: -1 });
    return res.status(200).json(templates);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get template by ID
router.get("/templates/:id", async (req: express.Request, res: express.Response) => {
  try {
    const template = await DocumentTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    return res.status(200).json(template);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Archive template
router.delete("/templates/:id", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    await DocumentTemplate.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.status(200).json({ message: "Template archived" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
