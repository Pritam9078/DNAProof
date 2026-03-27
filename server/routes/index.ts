import express from "express";
import authRoutes from "./auth";
import adminRoutes from "./admin";
import documentRoutes from "./documents";
import templateRoutes from "./templates";
import aiRoutes from "./ai";
import nftRoutes from "./nft";
import auditRoutes from "./audit";
import notificationRoutes from "./notification";

const router = express.Router();

// Mount sub-routers
router.use(authRoutes);
router.use(adminRoutes);
router.use(documentRoutes);
router.use(templateRoutes);
router.use(aiRoutes);
router.use(nftRoutes);
router.use(auditRoutes);
router.use(notificationRoutes);

export default router;
