import { NextResponse } from "next/server";
import { getAdminTokenFromCookieHeader, verifyAdminSessionToken } from "../auth/admin-session.js";

const adminUnauthorized = () =>
  NextResponse.json(
    { ok: false, error: "admin authentication required" },
    { status: 401 }
  );

const forbidden = () => NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

const isAllowedOrigin = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

export const verifyAdminRequest = (request) => {
  if (!isAllowedOrigin(request)) return forbidden();

  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  if (!verifyAdminSessionToken(token)) return adminUnauthorized();

  return null;
};

