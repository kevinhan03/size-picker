import express from "express";
import cors from "cors";
import { ALLOWED_ORIGINS, IS_PRODUCTION, PORT } from "./env.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!IS_PRODUCTION) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "25mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, port: PORT, ts: new Date().toISOString() });
  });

  return app;
}
