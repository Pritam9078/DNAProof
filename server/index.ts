import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.ts";
import { log } from "./vite.ts";
import { setupBlockchainListeners } from "./blockchain-listeners.ts";

const app = express();

// Suppress harmless ethers.js "filter not found" polling errors on public RPC nodes
process.on('unhandledRejection', (reason: any, promise) => {
  if (reason && reason?.message?.includes('filter not found')) return;
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Ethers v6 internally logs this specific coalesced error
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('could not coalesce error') && args[0].includes('filter not found')) {
    return;
  }
  originalConsoleError(...args);
};

// NUCLEAR CORS: Allow all origins and handle all preflights
app.use((req, res, next) => {
  const origin = req.headers.origin as string;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

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
      origin: true, // true implements reflecting origin logic
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    transports: ['polling', 'websocket']
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
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
