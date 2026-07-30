import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { getDigMatchProducts } from "../../../../server/services/dig-match-products.js";

export async function GET() {
  try {
    const products = await getDigMatchProducts();
    return NextResponse.json(
      { ok: true, data: { products } },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "dig match products fetch error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
