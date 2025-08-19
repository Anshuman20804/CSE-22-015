import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { shortenUrl, redirectUrl, getStatistics, getLogs } from "./routes/urlShortener";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add trust proxy for proper IP detection
  app.set('trust proxy', true);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // URL Shortener routes
  app.post("/api/shorten", shortenUrl);
  app.get("/api/redirect/:shortcode", redirectUrl);
  app.get("/api/statistics", getStatistics);
  app.get("/api/logs", getLogs);

  return app;
}
