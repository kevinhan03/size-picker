import { NextResponse } from "next/server";
import {
  getAdminTokenFromCookieHeader,
  verifyAdminSessionToken,
} from "../../../../../server/auth/admin-session.js";
import { createProductStack } from "../../../../../server/bootstrap/products.js";

const { backfillProductBrands, refreshBrandRulesCache } = createProductStack();

const adminUnauthorized = () =>
  NextResponse.json(
    { ok: false, error: "admin authentication required" },
    { status: 401 }
  );

export async function POST(request: Request) {
  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  if (!verifyAdminSessionToken(token)) return adminUnauthorized();

  try {
    await refreshBrandRulesCache({ force: true });
    const result = await backfillProductBrands();
    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "brand backfill error",
      },
      { status: 500 }
    );
  }
}
