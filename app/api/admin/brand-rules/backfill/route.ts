import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  getAdminTokenFromCookieHeader,
  verifyAdminSessionToken,
} from "../../../../../server/auth/admin-session.js";
import { refreshBrandRulesCache } from "../../../../../server/utils/brand-rules.js";
import { backfillProductBrands } from "../../../../../server/utils/product.js";

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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "brand backfill error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}
