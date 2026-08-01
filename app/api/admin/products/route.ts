import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { getAdminTokenFromCookieHeader, verifyAdminSessionToken } from "../../../../server/auth/admin-session.js";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../server/config/env.js";
import { normalizeClientProduct, requestLog } from "../../../../server/services/catalog";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const token = getAdminTokenFromCookieHeader(request.headers.get("cookie") || "");
  if (!verifyAdminSessionToken(token)) {
    requestLog("/api/admin/products", request, startedAt, 401);
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const products = (data || []).map(normalizeClientProduct).filter(Boolean);
    requestLog("/api/admin/products", request, startedAt, 200);
    return NextResponse.json(
      { ok: true, data: { products } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    requestLog("/api/admin/products", request, startedAt, status);
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "admin products error") }, { status });
  }
}
