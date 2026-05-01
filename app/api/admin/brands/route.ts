import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { verifyAdminRequest } from "../../../../server/utils/admin-request.js";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../server/config/env.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select("brand");

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const brand = String(row?.brand ?? "").trim();
      if (brand) counts[brand] = (counts[brand] ?? 0) + 1;
    }

    const brands = Object.entries(counts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));

    return NextResponse.json({ ok: true, data: { brands } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "brands fetch error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
