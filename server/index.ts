import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.ts";
import { log } from "./vite.ts";
import { setupBlockchainListeners } from "./blockchain-listeners.ts";

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3002",
  credentials: true
}));

// Increase size limits for file uploads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // VERBOSE LOGGING FOR DEBUGGING 404s
  console.log(`[Backend-Incoming] ${req.method} ${req.url}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize Socket.IO for notifications
  const { Server: SocketServer } = await import('socket.io');
  const io = new SocketServer(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  const { initNotificationService } = await import('./notification-service');
  initNotificationService(io);

  // Initialize Blockchain Event Listeners
  try {
    setupBlockchainListeners();
    const { relayerService } = await import('./services/relayer-service.ts');
    relayerService.startRelaying();
  } catch (error) {
    console.error("Failed to setup blockchain listeners or relayer:", error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ 
        message: message || "Internal Server Error",
        success: false 
      });
    }
    console.error("Global Error Handler:", err);
  });

  // The frontend is now handled by Next.js, which proxies /api requests to this Express server.
  const port = 5001;
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
