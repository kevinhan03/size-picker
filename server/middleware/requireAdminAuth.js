import { ADMIN_SESSION_SECRET, ALLOWED_ORIGINS, IS_PRODUCTION } from "../config/env.js";
import { getAdminTokenFromRequest, verifyAdminSessionToken } from "../auth/admin-session.js";

export const requireAdminAuth = (req, res, next) => {
  if (!ADMIN_SESSION_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "ADMIN_SESSION_SECRET is missing in server .env",
    });
  }

  // production에서 Origin 헤더가 있으면 허용된 출처인지 검증 (CORS 미들웨어 백업)
  if (IS_PRODUCTION && ALLOWED_ORIGINS.length > 0) {
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
  }

  const token = getAdminTokenFromRequest(req);
  if (!verifyAdminSessionToken(token)) {
    return res.status(401).json({
      ok: false,
      error: "admin authentication required",
    });
  }

  return next();
};
