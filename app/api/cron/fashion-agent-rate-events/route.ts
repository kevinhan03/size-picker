import { NextResponse } from "next/server";
import { supabase } from "../../../../server/lib/supabase.js";

export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!supabase)
    return NextResponse.json(
      { error: "database_unavailable" },
      { status: 503 }
    );
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("fashion_agent_rate_events")
    .delete()
    .lt("created_at", cutoff);
  if (error)
    return NextResponse.json({ error: "cleanup_unavailable" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
