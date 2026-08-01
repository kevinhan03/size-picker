import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { requestLog } from "../../../../../server/services/catalog";
import { getProductRecommendationData } from "../../../../../server/services/product-recommendations";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const productId = String(id || "").match(/^\d+/)?.[0] || "";
  if (!productId) return NextResponse.json({ ok: false, error: "product id required" }, { status: 400 });

  try {
    const data = await getProductRecommendationData(productId);
    if (!data) {
      requestLog("/api/products/[id]/recommendations", request, startedAt, 404);
      return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
    }

    requestLog("/api/products/[id]/recommendations", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/products/[id]/recommendations", request, startedAt, status);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "product recommendations error") }, { status });
  }
}
