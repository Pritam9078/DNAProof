import express from "express";
import { createServer, type Server } from "http";
import apiRouter from "./routes/index";

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Mount the modularized API router
  app.use("/api", apiRouter);

  // Fallback for unmatched API routes
  app.use("/api/*", (req, res) => {
    console.warn(`[Backend-404] Unmatched API request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
  });

  // Basic health check
  app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
