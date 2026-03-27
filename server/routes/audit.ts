import express from "express";
import { AuditLog } from '../models/AuditLog';
import { authenticateToken } from '../middleware';

const router = express.Router();

router.post("/audit-logs", async (req: express.Request, res: express.Response) => {
  try {
    const log = await AuditLog.create(req.body);
    return res.status(201).json(log);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/audit-logs", async (req: express.Request, res: express.Response) => {
  try {
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100);
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/audit-logs/:address", async (req: express.Request, res: express.Response) => {
  try {
    const addr = req.params.address.toLowerCase();
    const logs = await AuditLog.find({
      $or: [{ actor: addr }, { targetAddress: addr }],
    }).sort({ timestamp: -1 }).limit(100);
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
