import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { getDigMatchProducts } from "../../../../server/services/dig-match-products.js";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(36, Math.max(24, Number.parseInt(url.searchParams.get("limit") || "36", 10) || 36));
    const seed = String(url.searchParams.get("seed") || "default").slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, "") || "default";
    const products = await getDigMatchProducts({ limit, seed });
    return NextResponse.json(
      { ok: true, data: { products } },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "dig match products fetch error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
