import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { normalizeProductRow } from "../../../server/utils/product.js";
import { verifyRegisteredBearerToken } from "../../../server/utils/verify-auth.js";

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ ok: false, error: "authentication required" }, { status: 401 });

  try {
    assertSupabaseConfig();
    const user = await verifyRegisteredBearerToken(token) as { appUsername?: string } | null;
    const username = String(user?.appUsername || "").trim();
    if (!username) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });

    const { data, error } = await supabase!
      .from("products")
      .select("*")
      .eq("registered_by", username)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const products = (data || [])
      .map((row) => normalizeProductRow(row))
      .filter((product) => product !== null);
    return NextResponse.json({ ok: true, data: { products } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "discoveries fetch error" },
      { status: 500 }
    );
  }
}
