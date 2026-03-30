import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import {
  ADMIN_PASSWORD,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_SECRET,
  ADMIN_SESSION_TTL_SECONDS,
  IS_PRODUCTION,
} from "../config/env.js";

export const assertAdminConfig = () => {
  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    const error = new Error("ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing in server .env");
    error.statusCode = 500;
    throw error;
  }
};

export const safeCompare = (left, right) => {
  const leftHash = createHash("sha256").update(String(left)).digest();
  const rightHash = createHash("sha256").update(String(right)).digest();
  return timingSafeEqual(leftHash, rightHash);
};

const signValue = (value) =>
  createHmac("sha256", ADMIN_SESSION_SECRET).update(value).digest("base64url");

export const makeAdminSessionToken = () => {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000 }),
    "utf8"
  ).toString("base64url");
  return `${payload}.${signValue(payload)}`;
};

export const verifyAdminSessionToken = (token) => {
  if (!token || typeof token !== "string") return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeCompare(signature, signValue(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const expiresAt = Number(parsed?.exp || 0);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  } catch {
    return false;
  }
};

const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separator = item.indexOf("=");
      if (separator < 0) return acc;
      const key = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      if (!key) return acc;
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {});

export const getAdminTokenFromCookieHeader = (cookieHeader = "") => {
  const cookies = parseCookies(String(cookieHeader || ""));
  return cookies[ADMIN_SESSION_COOKIE_NAME] || "";
};

export const makeAdminCookie = (token) => {
  const parts = [
    `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${ADMIN_SESSION_TTL_SECONDS}`,
  ];
  if (IS_PRODUCTION) parts.push("Secure");
  return parts.join("; ");
};

export const clearAdminCookie = () => {
  const parts = [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (IS_PRODUCTION) parts.push("Secure");
  return parts.join("; ");
};

export { ADMIN_PASSWORD };

export const getAdminTokenFromRequest = (request) =>
  getAdminTokenFromCookieHeader(
    request?.headers?.cookie || request?.headers?.Cookie || ""
  );
