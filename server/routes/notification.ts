import express from "express";
import { Notification } from '../models/Notification';
import { authenticateToken } from '../middleware';

const router = express.Router();

// Get notifications for a user by wallet address and role
router.get("/notifications/:address", authenticateToken, async (req, res) => {
  try {
    const { address } = req.params;
    const { role } = req.query;

    const query: any = {
      $or: [
        { userAddress: address.toLowerCase() },
        { role: "ALL" }
      ]
    };

    if (role) {
      const roleStr = (role as string).toUpperCase();
      query.$or.push({ role: roleStr });
      
      if (roleStr === 'ADMIN') {
          query.$or.push({ role: { $in: ["ADMIN", "ISSUER", "VERIFIER", "AUDITOR"] } });
      }
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Mark notification as read
router.patch("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
});

// Delete notification
router.delete("/notifications/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification" });
  }
});

export default router;
