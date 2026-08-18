import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

function normalizeSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const headers = Array.isArray(record.headers) ? record.headers.map((item) => String(item ?? "").trim()) : [];
  const row = Array.isArray(record.row) ? record.row.map((item) => String(item ?? "").trim()) : [];
  return headers.length && row.length ? { headers, row } : null;
}

const validSources = new Set(["comparison", "try_on", "worn"]);
const validFits = new Set(["tight", "true_to_size", "roomy"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  if (!hasValidMutationOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
    if (!user) return unauthorized("registered account required");
    const { productId } = await context.params;
    const pid = String(productId || "").trim();
    if (!pid) return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });

    const body = await request.json();
    const decision = body?.decision;
    const updates = decision && typeof decision === "object"
      ? {
          size_decision_label: String(decision.label || "").trim() || null,
          size_decision_row_index: Number.isInteger(decision.rowIndex) && decision.rowIndex >= 0 ? decision.rowIndex : null,
          size_decision_snapshot: normalizeSnapshot(decision.snapshot),
          size_decision_sources: Array.from(new Set(
            (Array.isArray(decision.sources) ? decision.sources : [])
              .map((source: unknown) => String(source))
              .filter((source: string) => validSources.has(source))
          )),
          size_decision_fit: validFits.has(String(decision.fit || "")) ? String(decision.fit) : null,
          size_decision_note: String(decision.note || "").trim().slice(0, 240) || null,
          size_decision_updated_at: new Date().toISOString(),
        }
      : {
          size_decision_label: null,
          size_decision_row_index: null,
          size_decision_snapshot: null,
          size_decision_sources: [],
          size_decision_fit: null,
          size_decision_note: null,
          size_decision_updated_at: null,
        };

    const { error } = await db.from("user_digbox_items").update(updates).eq("user_id", user.id).eq("product_id", pid);
    if (error) throw error;
    return NextResponse.json({ ok: true, data: { updated: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "digbox size decision update error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  if (!hasValidMutationOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const user = await getRegisteredRequestUser(request);
    if (!user) return unauthorized("registered account required");

    const { productId } = await context.params;
    const pid = String(productId || "").trim();
    if (!pid) return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });

    const { error } = await db
      .from("user_digbox_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", pid);

    if (error) throw error;

    return NextResponse.json({ ok: true, data: { removed: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "digbox remove error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
