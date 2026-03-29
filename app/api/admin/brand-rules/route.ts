import { NextResponse } from "next/server";
import {
  getAdminTokenFromCookieHeader,
  verifyAdminSessionToken,
} from "../../../../server/auth/admin-session.js";
import {
  getBrandRules,
  normalizeBrandRule,
  writeBrandRules,
} from "../../../../server/shared.js";

const adminUnauthorized = () =>
  NextResponse.json(
    { ok: false, error: "admin authentication required" },
    { status: 401 }
  );

export async function GET(request: Request) {
  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  if (!verifyAdminSessionToken(token)) return adminUnauthorized();

  return NextResponse.json({
    ok: true,
    data: {
      rules: getBrandRules(),
    },
  });
}

export async function PUT(request: Request) {
  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") ?? "");
  if (!verifyAdminSessionToken(token)) return adminUnauthorized();

  try {
    const body = await request.json();
    const rawRules: unknown[] | null = Array.isArray(body?.rules) ? body.rules : null;
    if (!rawRules) {
      return NextResponse.json({ ok: false, error: "rules array is required" }, { status: 400 });
    }

    const normalizedRules = rawRules
      .map((rule: unknown) => normalizeBrandRule(rule))
      .filter((rule): rule is NonNullable<ReturnType<typeof normalizeBrandRule>> => Boolean(rule));
    if (normalizedRules.length !== rawRules.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "every rule must include valid matchType, matchValue, and canonicalBrand",
        },
        { status: 400 }
      );
    }

    const savedRules = writeBrandRules(normalizedRules);
    return NextResponse.json({
      ok: true,
      data: {
        rules: savedRules,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "brand rules update error",
      },
      { status: 500 }
    );
  }
}
