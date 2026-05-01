import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

type MySizeRow = {
  id: string;
  user_id?: string | null;
  source_product_id?: string | null;
  brand?: string | null;
  category?: string | null;
  title?: string | null;
  size_label?: string | null;
  measurement_snapshot?: unknown;
  fit_note?: string | null;
  created_at?: string | null;
};

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function normalizeSizeSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const headers = Array.isArray(record.headers) ? record.headers.map((v) => String(v ?? "").trim()) : [];
  const row = Array.isArray(record.row) ? record.row.map((v) => String(v ?? "").trim()) : [];
  if (!headers.length || !row.length) return null;
  return { headers, row };
}

function normalizeProfile(row: MySizeRow) {
  const snapshot = normalizeSizeSnapshot(row.measurement_snapshot);
  if (!snapshot) return null;
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : undefined,
    sourceProductId: String(row.source_product_id || "").trim() || null,
    brand: String(row.brand || "").trim() || null,
    category: String(row.category || "").trim(),
    title: String(row.title || "").trim(),
    sizeLabel: String(row.size_label || "").trim() || null,
    measurementSnapshot: snapshot,
    fitNote: String(row.fit_note || "").trim() || null,
    createdAt: row.created_at || null,
  };
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const { data, error } = await db
      .from("user_my_size_profiles")
      .select("id,user_id,source_product_id,brand,category,title,size_label,measurement_snapshot,fit_note,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const profiles = ((data ?? []) as MySizeRow[])
      .map(normalizeProfile)
      .filter((profile): profile is NonNullable<ReturnType<typeof normalizeProfile>> => profile !== null);

    return NextResponse.json({ ok: true, data: { profiles } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "my sizes fetch error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const body = await request.json();
    const category = String(body?.category || "").trim();
    const title = String(body?.title || "").trim();
    const snapshot = normalizeSizeSnapshot(body?.measurementSnapshot);
    if (!category) return NextResponse.json({ ok: false, error: "category is required" }, { status: 400 });
    if (!title) return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
    if (!snapshot) return NextResponse.json({ ok: false, error: "measurementSnapshot is required" }, { status: 400 });

    const { data, error } = await db
      .from("user_my_size_profiles")
      .insert({
        user_id: user.id,
        source_product_id: String(body?.sourceProductId || "").trim() || null,
        brand: String(body?.brand || "").trim() || null,
        category,
        title,
        size_label: String(body?.sizeLabel || "").trim() || null,
        measurement_snapshot: snapshot,
        fit_note: String(body?.fitNote || "").trim() || null,
      })
      .select("id,user_id,source_product_id,brand,category,title,size_label,measurement_snapshot,fit_note,created_at")
      .single();

    if (error) throw error;
    const profile = normalizeProfile(data as MySizeRow);
    if (!profile) throw new Error("created profile is invalid");

    return NextResponse.json({ ok: true, data: { profile } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "my size create error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
