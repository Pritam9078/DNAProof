import express from "express";
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { IssuerProfile } from '../models/IssuerProfile';
import { storage } from '../storage';
import { authenticateToken } from '../middleware';

const router = express.Router();

// Super Admin: Get all requests
router.get("/super-admin/requests", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const requests = await User.find({ roleStatus: 'PENDING' }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Super Admin: Get stats
router.get("/super-admin/stats", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingRequests = await User.countDocuments({ roleStatus: 'PENDING' });
    
    const counts = {
      USER: await User.countDocuments({ roleStatus: 'APPROVED', requestedRole: 'USER' }),
      ISSUER: await User.countDocuments({ roleStatus: 'APPROVED', requestedRole: 'ISSUER' }),
      ADMIN: await User.countDocuments({ roleStatus: 'APPROVED', requestedRole: 'ADMIN' }),
      SUPER_ADMIN: await User.countDocuments({ isSuperAdmin: true })
    };

    const activeIssuers = counts.ISSUER;
    
    const usersWithPayments = await User.find({ roleStatus: 'APPROVED' });
    const totalRevenue = usersWithPayments.reduce((acc, user) => {
      const price = user.plan === 'BASIC' ? 0.01 : user.plan === 'PRO' ? 0.05 : 0;
      return acc + price;
    }, 0);

    const recentConversions = await AuditLog.find({ action: 'ACCESS_REQUEST_APPROVED' })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('targetAddress metadata timestamp');

    const mappedConversions = recentConversions.map(log => ({
      address: log.targetAddress,
      newRole: log.metadata?.role || 'UNKNOWN',
      timestamp: log.timestamp
    }));

    res.status(200).json({
      totalUsers,
      pendingRequests,
      activeIssuers,
      totalRevenue,
      counts,
      recentConversions: mappedConversions
    });
  } catch (error) {
    console.error("Error fetching super admin stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Super Admin: Approve/Reject Request
router.patch("/super-admin/approve/:address", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const targetAddress = req.params.address.toLowerCase();
    const { action, txHash } = req.body; 
    const adminUser = (req as any).user;

    const user = await User.findOne({ address: targetAddress });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === 'APPROVE') {
      await storage.updateUser(targetAddress, { 
        roleStatus: 'APPROVED',
        paymentStatus: 'COMPLETED'
      });

      if (user.requestedRole === 'ISSUER') {
        await IssuerProfile.findOneAndUpdate(
          { walletAddress: targetAddress },
          {
            orgName: user.orgName,
            orgType: user.orgType,
            approvedBy: adminUser.address.toLowerCase(),
            approvedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      await AuditLog.create({
        actor: adminUser.address.toLowerCase(),
        action: 'ACCESS_REQUEST_APPROVED',
        targetAddress,
        txHash: txHash || null,
        metadata: { role: user.requestedRole }
      });

      return res.status(200).json({ message: "Request approved successfully" });
    } else {
      await storage.updateUser(targetAddress, { roleStatus: 'REJECTED' });

      await AuditLog.create({
        actor: adminUser.address.toLowerCase(),
        action: 'ACCESS_REQUEST_REJECTED',
        targetAddress
      });

      return res.status(200).json({ message: "Request rejected" });
    }
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get issuer profile
router.get("/issuer/profile/:address", async (req: express.Request, res: express.Response) => {
  try {
    const profile = await IssuerProfile.findOne({ walletAddress: req.params.address.toLowerCase() });
    if (!profile) return res.status(404).json({ message: "Issuer profile not found" });
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
