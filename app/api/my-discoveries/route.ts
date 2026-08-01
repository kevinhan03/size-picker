import { NextResponse } from "next/server";
import { assertSupabaseConfig } from "../../../server/lib/supabase.js";
import { getRegisteredRequestUser } from "../../../server/auth/request-user";
import { getUserDiscoveries } from "../../../server/services/user-collections";

export async function GET(request: Request) {
  try {
    assertSupabaseConfig();
    const user = await getRegisteredRequestUser(request);
    if (!user?.id) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    const { products, totalSaveCount } = await getUserDiscoveries(user.id);
    return NextResponse.json({ ok: true, data: { products, totalSaveCount } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "discoveries fetch error" },
      { status: 500 }
    );
  }
}
