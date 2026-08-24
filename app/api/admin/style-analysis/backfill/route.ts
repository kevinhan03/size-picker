import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { CORE_TASTE_CATEGORIES } from "@/constants/styleAnalysis";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../../server/config/env.js";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { tagProductStyleById } from "../../../../../server/services/style-tagging.js";
import { verifyAdminRequest } from "../../../../../server/utils/admin-request.js";

const MAX_BATCH_SIZE = 5;

export async function POST(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  try {
    const body = await request.json().catch(() => ({}));
    const requestedLimit = Number(body?.limit);
    const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, MAX_BATCH_SIZE)) : MAX_BATCH_SIZE;
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select("id")
      .in("category", CORE_TASTE_CATEGORIES)
      .in("style_axis_analysis_status", ["pending", "failed"])
      .order("id")
      .limit(limit);
    if (error) throw error;

    const results = [];
    for (const product of data || []) {
      const id = String(product.id);
      try {
        const { error: statusError } = await supabase!
          .from(SUPABASE_PRODUCTS_TABLE)
          .update({ style_axis_analysis_status: "tagging", style_axis_analysis_error: null })
          .eq("id", id);
        if (statusError) throw statusError;
        await tagProductStyleById(id, { force: true, axesOnly: true });
        results.push({ id, ok: true });
      } catch (error) {
        results.push({ id, ok: false, error: getErrorMessage(error, "style axes analysis failed") });
      }
    }
    return NextResponse.json({ ok: true, data: { results, remainingHint: "Call again until no products are returned." } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "style analysis backfill failed") }, { status: getErrorStatusCode(error) });
  }
}
