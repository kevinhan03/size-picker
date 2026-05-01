import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { verifyAdminRequest } from "../../../../../server/utils/admin-request.js";
import { refreshBrandRulesCache } from "../../../../../server/utils/brand-rules.js";
import { backfillProductBrands } from "../../../../../server/utils/product.js";

export async function POST(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

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
