import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";

const unauthorized = (msg = "authorization token is required") =>
  NextResponse.json({ ok: false, error: msg }, { status: 401 });

type MySizeRow = {
  id: string;
  user_id?: string | null;
  source_product_id?: string | null;
  category?: string | null;
  title?: string | null;
  size_label?: string | null;
  measurement_snapshot?: unknown;
  fit_note?: string | null;
  fit_tags?: string[] | null;
  is_default?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((tag) => String(tag ?? "").trim()).filter(Boolean).slice(0, 12);
}

function normalizeProfile(row: MySizeRow) {
  const snapshot = normalizeSizeSnapshot(row.measurement_snapshot);
  if (!snapshot) return null;
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : undefined,
    sourceProductId: String(row.source_product_id || "").trim() || null,
    category: String(row.category || "").trim(),
    title: String(row.title || "").trim(),
    sizeLabel: String(row.size_label || "").trim() || null,
    measurementSnapshot: snapshot,
    fitNote: String(row.fit_note || "").trim() || null,
    fitTags: normalizeTags(row.fit_tags),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const { id } = await context.params;
    const profileId = String(id || "").trim();
    if (!profileId) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body?.sourceProductId !== undefined) updates.source_product_id = String(body.sourceProductId || "").trim() || null;
    if (body?.category !== undefined) {
      const category = String(body.category || "").trim();
      if (!category) return NextResponse.json({ ok: false, error: "category is required" }, { status: 400 });
      updates.category = category;
    }
    if (body?.title !== undefined) {
      const title = String(body.title || "").trim();
      if (!title) return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
      updates.title = title;
    }
    if (body?.sizeLabel !== undefined) updates.size_label = String(body.sizeLabel || "").trim() || null;
    if (body?.measurementSnapshot !== undefined) {
      const snapshot = normalizeSizeSnapshot(body.measurementSnapshot);
      if (!snapshot) return NextResponse.json({ ok: false, error: "measurementSnapshot is invalid" }, { status: 400 });
      updates.measurement_snapshot = snapshot;
    }
    if (body?.fitNote !== undefined) updates.fit_note = String(body.fitNote || "").trim() || null;
    if (body?.fitTags !== undefined) updates.fit_tags = normalizeTags(body.fitTags);
    if (body?.isDefault !== undefined) updates.is_default = Boolean(body.isDefault);

    if (updates.is_default === true) {
      const category = String(updates.category || "").trim();
      let categoryForDefault = category;
      if (!categoryForDefault) {
        const { data, error } = await db
          .from("user_my_size_profiles")
          .select("category")
          .eq("user_id", user.id)
          .eq("id", profileId)
          .single();
        if (error) throw error;
        categoryForDefault = String((data as { category?: string } | null)?.category || "").trim();
      }
      if (categoryForDefault) {
        const { error } = await db
          .from("user_my_size_profiles")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("category", categoryForDefault)
          .neq("id", profileId);
        if (error) throw error;
      }
    }

    const { data, error } = await db
      .from("user_my_size_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .eq("id", profileId)
      .select("id,user_id,source_product_id,category,title,size_label,measurement_snapshot,fit_note,fit_tags,is_default,created_at,updated_at")
      .single();

    if (error) throw error;
    const profile = normalizeProfile(data as MySizeRow);
    if (!profile) throw new Error("updated profile is invalid");

    return NextResponse.json({ ok: true, data: { profile } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "my size update error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const token = getToken(request);
  if (!token) return unauthorized();

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return unauthorized(authError?.message || "invalid token");

    const { id } = await context.params;
    const profileId = String(id || "").trim();
    if (!profileId) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

    const { error } = await db
      .from("user_my_size_profiles")
      .delete()
      .eq("user_id", user.id)
      .eq("id", profileId);

    if (error) throw error;

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "my size delete error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
