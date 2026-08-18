import { NextResponse } from "next/server";
import { getRegisteredRequestUser } from "../../../server/auth/request-user";
import { getTasteAnalysis } from "../../../server/services/taste-analysis";
import { requestLog } from "../../../server/services/catalog";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const source = new URL(request.url).searchParams.get("source") === "closet" ? "closet" : "digbox";
  try {
    const user = await getRegisteredRequestUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    const data = await getTasteAnalysis(user.id, source);
    requestLog("/api/taste-analysis", request, startedAt, 200);
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "private, no-store", "Server-Timing": `taste;dur=${Date.now() - startedAt}` } });
  } catch (error) {
    requestLog("/api/taste-analysis", request, startedAt, 500);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "taste analysis failed" }, { status: 500, headers: { "Cache-Control": "private, no-store", "Server-Timing": `taste;dur=${Date.now() - startedAt}` } });
  }
}
