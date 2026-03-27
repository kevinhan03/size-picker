import { ADMIN_SESSION_SECRET } from "../config/env.js";
import { getAdminTokenFromRequest, verifyAdminSessionToken } from "../auth/admin-session.js";

export const requireAdminAuth = (req, res, next) => {
  if (!ADMIN_SESSION_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "ADMIN_SESSION_SECRET is missing in server .env",
    });
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
