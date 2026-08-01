import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { getCatalogPage, requestLog } from "../../../../server/services/catalog";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const rawOffset = Number(request.nextUrl.searchParams.get("offset") ?? "0");
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
  if (!Number.isInteger(rawOffset) || rawOffset < 0 || !Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > MAX_LIMIT) {
    requestLog("/api/catalog/products", request, startedAt, 400);
    return NextResponse.json({ ok: false, error: "invalid offset or limit" }, { status: 400 });
  }
  const offset = rawOffset;
  const limit = rawLimit;

  try {
    const page = await getCatalogPage(offset, limit);
    requestLog("/api/catalog/products", request, startedAt, 200, request.headers.get("x-vercel-cache") || undefined);
    return NextResponse.json(
      { ok: true, data: page },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error: unknown) {
    requestLog("/api/catalog/products", request, startedAt, getErrorStatusCode(error));
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "catalog products fetch error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
