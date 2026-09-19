import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { requestLog, searchCatalog, searchCatalogBrands } from "../../../../server/services/catalog";

const MAX_LIMIT = 8;

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const query = String(request.nextUrl.searchParams.get("q") || "").trim().slice(0, 50);
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || "8");
  const scope = request.nextUrl.searchParams.get("scope") === "brands" ? "brands" : "products";
  const limit = Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 8));

  if (query.length < 1) {
    requestLog("/api/catalog/search", request, startedAt, 200);
    return NextResponse.json({ ok: true, data: scope === "brands" ? { brands: [] } : { products: [] } });
  }

  try {
    const results = scope === "brands"
      ? { brands: await searchCatalogBrands(query, limit) }
      : { products: await searchCatalog(query, limit) };
    requestLog("/api/catalog/search", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data: results },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/catalog/search", request, startedAt, status);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "catalog search error") }, { status });
  }
}
