import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminRequest } from "../../../server/utils/admin-request.js";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";

export async function GET() {
  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from("site_settings")
      .select("key,value");

    if (error) throw error;

    const instagramUrl =
      (Array.isArray(data) ? data : []).find((r) => r.key === "instagram_url")
        ?.value ?? "";
    const featuredHeading =
      (Array.isArray(data) ? data : []).find((r) => r.key === "featured_heading")
        ?.value ?? "";

    return NextResponse.json({ ok: true, data: { instagramUrl, featuredHeading } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "settings fetch error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  const body = await request.json();
  const updates: Array<{ key: string; value: string }> = [];
  if (Object.prototype.hasOwnProperty.call(body ?? {}, "instagramUrl")) {
    updates.push({ key: "instagram_url", value: String(body?.instagramUrl ?? "").trim() });
  }
  if (Object.prototype.hasOwnProperty.call(body ?? {}, "featuredHeading")) {
    updates.push({ key: "featured_heading", value: String(body?.featuredHeading ?? "").trim() });
  }

  try {
    assertSupabaseConfig();
    if (updates.length > 0) {
      const { error } = await supabase!
        .from("site_settings")
        .upsert(updates);

      if (error) throw error;
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "settings save error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
