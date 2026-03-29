import express from "express";
import cors from "cors";
import { ALLOWED_ORIGINS, IS_PRODUCTION, IS_VERCEL, PORT } from "./env.js";

export function createApp() {
  const app = express();

  // Vercel은 프록시 뒤에서 실행되므로 X-Forwarded-For 헤더에서 실제 클라이언트 IP를 읽어야
  // rate limiter가 올바르게 동작함. 없으면 모든 요청이 동일 IP(프록시 IP)로 집계됨.
  if (IS_VERCEL) app.set("trust proxy", 1);

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
