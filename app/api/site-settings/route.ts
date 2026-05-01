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

    return NextResponse.json({ ok: true, data: { instagramUrl } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "settings fetch error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  const body = await request.json();
  const instagramUrl = String(body?.instagramUrl ?? "").trim();

  try {
    assertSupabaseConfig();
    const { error } = await supabase!
      .from("site_settings")
      .upsert({ key: "instagram_url", value: instagramUrl });

    if (error) throw error;

    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "settings save error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
