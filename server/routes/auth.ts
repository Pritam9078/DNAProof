import express from "express";
import { storage } from "../storage";
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { User } from '../models/User';
import { IssuerProfile } from '../models/IssuerProfile';
import { AuditLog } from '../models/AuditLog';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many authentication requests, please try again later." }
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Login - Get Nonce
router.post("/auth/login", authLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ message: "Address is required" });

    const walletAddress = (address as string).toLowerCase();
    const nonce = `Sign this message to authenticate with DNAProof: ${Math.floor(Math.random() * 1000000)}`;
    const nonceExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 
    
    let user = await storage.getUserByWalletAddress(walletAddress);
    if (!user) {
      user = await storage.createUser({ address: walletAddress, nonce, nonceExpiresAt });
    } else {
      await storage.updateUser(walletAddress, { nonce, nonceExpiresAt });
    }

    res.status(200).json({ nonce });
  } catch (error) {
    console.error("DEBUG: /api/auth/login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Verify Signature and Get JWT
router.post("/auth/verify-signature", authLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ message: "Address and signature are required" });

    const walletAddress = address.toLowerCase();
    const user = await storage.getUserByWalletAddress(walletAddress);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.nonceExpiresAt && new Date() > new Date(user.nonceExpiresAt)) {
      return res.status(401).json({ message: "Nonce expired, please login again" });
    }

    const recoveredAddress = ethers.verifyMessage(user.nonce, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const token = jwt.sign({ address: walletAddress, role: user.roleStatus }, JWT_SECRET, { expiresIn: '24h' });
    
    await storage.updateUser(walletAddress, { 
      nonce: `Sign this message next time: ${Math.floor(Math.random() * 1000000)}`,
      nonceExpiresAt: new Date(Date.now() - 1000) 
    });

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get current user session
router.get("/auth/me", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const authReq = req as any;
    const user = await storage.getUserByWalletAddress(authReq.user.address);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user, role: authReq.user.role });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create/Fetch user from wallet context
router.post("/users", async (req: express.Request, res: express.Response) => {
  try {
    const { walletAddress, displayName, profileImage, preferences } = req.body;
    if (!walletAddress) return res.status(400).json({ message: "Wallet address is required" });

    const address = walletAddress.toLowerCase();
    let user = await storage.getUserByWalletAddress(address);
    
    if (user) {
      return res.status(200).json(user);
    }

    const nonce = `Sign this message to authenticate with DNAProof: ${Math.floor(Math.random() * 1000000)}`;
    user = await storage.createUser({
      address,
      nonce,
      displayName: displayName || "",
      profileImage: profileImage || null,
      preferences: preferences || '{"darkMode":true,"animations":true,"notifications":true}'
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user from wallet context:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get profile by wallet
router.get("/users/wallet/:address", async (req: express.Request, res: express.Response) => {
  try {
    const walletAddress = req.params.address;
    if (!walletAddress) return res.status(400).json({ message: "Wallet address is required" });
    
    const user = await storage.getUserByWalletAddress(walletAddress);
    if (!user) return res.status(404).json({ message: "User not found" });

    const issuerProfile = await IssuerProfile.findOne({ walletAddress: walletAddress.toLowerCase() });
    return res.status(200).json({ ...user.toObject(), issuerProfile });
  } catch (error: any) {
    console.error("DEBUG: /api/users/wallet/:address error:", error);
    return res.status(500).json({ message: "Internal server error", details: error?.message || String(error) });
  }
});

// Update profile
router.patch("/users/profile/:address", async (req: express.Request, res: express.Response) => {
  try {
    const walletAddress = req.params.address;
    const user = await storage.getUserByWalletAddress(walletAddress);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const { displayName, profileImage, email, fullName } = req.body;
    const updatedUser = await storage.updateUser(walletAddress, { displayName, profileImage, email, fullName });
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Update preferences
router.patch("/users/preferences/:address", async (req: express.Request, res: express.Response) => {
  try {
    const walletAddress = req.params.address;
    const user = await storage.getUserByWalletAddress(walletAddress);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const { darkMode, animations, notifications } = req.body;
    const preferences = JSON.stringify({
      darkMode: darkMode !== undefined ? darkMode : true,
      animations: animations !== undefined ? animations : true,
      notifications: notifications !== undefined ? notifications : true,
    });
    
    const updatedUser = await storage.updateUser(walletAddress, { preferences });
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Update verification count (quota management)
router.post("/users/verifications/increment/:address", async (req: express.Request, res: express.Response) => {
  try {
    const addr = req.params.address.toLowerCase();
    const user = await storage.getUserByWalletAddress(addr);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isSuperAdmin) {
      return res.status(200).json({ success: true, count: user.verificationCount });
    }

    const updatedUser = await User.findOneAndUpdate(
      { address: addr },
      { $inc: { verificationCount: 1 } },
      { new: true }
    );

    return res.status(200).json({ success: true, count: updatedUser?.verificationCount });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Upgrade Plan
router.post("/users/plan/upgrade/:address", async (req: express.Request, res: express.Response) => {
  try {
    const addr = req.params.address.toLowerCase();
    const { plan, paymentTxHash } = req.body;
    
    if (!plan || !paymentTxHash) {
      return res.status(400).json({ message: "Plan and paymentTxHash are required" });
    }

    const limits: Record<string, number> = {
      'FREE': 3,
      'BASIC': 100,
      'PRO': 1000000, 
      'ENTERPRISE': 999999999
    };

    const docLimits: Record<string, number> = {
      'FREE': 0,
      'BASIC': 50,
      'PRO': 1000000,
      'ENTERPRISE': 999999999
    };

    const updatedUser = await storage.updateUser(addr, {
      plan,
      paymentTxHash,
      paymentStatus: 'COMPLETED',
      verificationLimit: limits[plan] || 3,
      documentLimit: docLimits[plan] || 0
    });

    await AuditLog.create({
      actor: addr,
      action: 'PLAN_UPGRADED',
      metadata: { plan, paymentTxHash }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Submit Access Request (Role Request)
router.post("/auth/request-role", authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { 
      walletAddress, 
      fullName, 
      email, 
      orgName, 
      orgType, 
      orgWebsite, 
      description, 
      requestedRole, 
      plan, 
      paymentTxHash 
    } = req.body;

    if (!walletAddress || !fullName || !email || !requestedRole || !plan || !paymentTxHash) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const addr = walletAddress.toLowerCase();
    
    await storage.updateUser(addr, {
      fullName,
      email,
      orgName,
      orgType,
      orgWebsite,
      description,
      requestedRole,
      plan,
      paymentTxHash,
      paymentStatus: 'PENDING',
      roleStatus: 'PENDING'
    });

    await AuditLog.create({
      actor: addr,
      action: 'ACCESS_REQUEST_SUBMITTED',
      metadata: { requestedRole, plan, paymentTxHash }
    });

    res.status(200).json({ message: "Access request submitted successfully." });
  } catch (error) {
    console.error("Error submitting access request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
