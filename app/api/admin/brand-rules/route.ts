import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { verifyAdminRequest } from "../../../../server/utils/admin-request.js";
import {
  getBrandRules,
  normalizeBrandRule,
  refreshBrandRulesCache,
  writeBrandRules,
} from "../../../../server/utils/brand-rules.js";

export async function GET(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;
  await refreshBrandRulesCache({ force: true });

  return NextResponse.json({
    ok: true,
    data: {
      rules: getBrandRules(),
    },
  });
}

export async function PUT(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

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

    const savedRules = await writeBrandRules(normalizedRules);
    return NextResponse.json({
      ok: true,
      data: {
        rules: savedRules,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "brand rules update error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}
