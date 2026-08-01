import { NextResponse } from "next/server";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../../server/auth/request-user";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { SUPABASE_STORAGE_BUCKET } from "../../../../server/config/env.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  const user = await getRegisteredRequestUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "invalid image" }, { status: 400 });
    }
    assertSupabaseConfig();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `submissions/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabase!.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error || !data?.path) throw error || new Error("upload failed");
    const response = NextResponse.json({ ok: true, data: { path: data.path } }, { status: 201 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "upload failed" }, { status: 500 });
  }
}
