import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_DELETIONS_PER_RUN = 100;

const isGoogleAccount = (user: { app_metadata?: Record<string, unknown> }) => {
  const metadata = user.app_metadata || {};
  if (metadata.provider === "google") return true;
  return Array.isArray(metadata.providers) && metadata.providers.includes("google");
};

export async function GET(request: Request) {
  const cronSecret = String(process.env.CRON_SECRET || "").trim();
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    assertSupabaseConfig();
    const db = supabase!;
    const staleBefore = Date.now() - GRACE_PERIOD_MS;
    const users = [] as Array<{ id: string; created_at?: string; app_metadata?: Record<string, unknown> }>;

    for (let page = 1; ; page += 1) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
      if (error) throw error;
      const batch = data.users || [];
      users.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }

    const candidates = users.filter((user) => {
      const createdAt = Date.parse(String(user.created_at || ""));
      return isGoogleAccount(user) && Number.isFinite(createdAt) && createdAt < staleBefore;
    });
    const registeredIds = new Set<string>();

    for (let index = 0; index < candidates.length; index += 500) {
      const ids = candidates.slice(index, index + 500).map((user) => user.id);
      if (!ids.length) continue;
      const { data, error } = await db.from("users").select("id").in("id", ids);
      if (error) throw error;
      (data || []).forEach((profile: { id: string }) => registeredIds.add(String(profile.id)));
    }

    let deleted = 0;
    let failed = 0;
    for (const user of candidates) {
      if (deleted >= MAX_DELETIONS_PER_RUN) break;
      if (registeredIds.has(user.id)) continue;
      const { error } = await db.auth.admin.deleteUser(user.id);
      if (error) failed += 1;
      else deleted += 1;
    }

    return NextResponse.json({ ok: true, data: { deleted, failed } });
  } catch {
    return NextResponse.json({ ok: false, error: "cleanup failed" }, { status: 500 });
  }
}
