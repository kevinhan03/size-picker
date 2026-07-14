import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { verifyRegisteredBearerToken } from "../../../../server/utils/verify-auth.js";

const unauthorized = () => NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });

function getToken(request: Request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function parseProfile(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as { version?: unknown; completedSessions?: unknown; signals?: unknown; updatedAt?: unknown };
  if (!raw.signals || typeof raw.signals !== "object" || Array.isArray(raw.signals)) return null;
  const completedSessions = Number(raw.completedSessions);
  if (!Number.isInteger(completedSessions) || completedSessions < 1 || completedSessions > 10000) return null;
  return { version: 1, completedSessions, signals: raw.signals, updatedAt: String(raw.updatedAt || new Date().toISOString()) };
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();
  try {
    assertSupabaseConfig();
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return unauthorized();
    const { data, error } = await supabase!
      .from("user_taste_profiles")
      .select("profile")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    const { data: sessions, error: sessionsError } = await supabase!
      .from("user_taste_match_sessions")
      .select("completed_at,profile_snapshot")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5);
    if (sessionsError) throw sessionsError;
    return NextResponse.json({
      ok: true,
      data: {
        profile: data?.profile || null,
        history: (sessions || []).map((session) => ({ completedAt: session.completed_at, profile: session.profile_snapshot })),
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "taste profile fetch error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getToken(request);
  if (!token) return unauthorized();
  try {
    assertSupabaseConfig();
    const user = await verifyRegisteredBearerToken(token);
    if (!user) return unauthorized();
    const body = await request.json();
    const profile = parseProfile(body?.profile);
    const answers = Array.isArray(body?.answers) ? body.answers.slice(0, 16) : [];
    if (!profile) return NextResponse.json({ ok: false, error: "invalid taste profile" }, { status: 400 });

    const { error: profileError } = await supabase!
      .from("user_taste_profiles")
      .upsert({ user_id: user.id, profile, completed_sessions: profile.completedSessions, updated_at: new Date().toISOString() });
    if (profileError) throw profileError;

    const { error: sessionError } = await supabase!
      .from("user_taste_match_sessions")
      .insert({ user_id: user.id, answers, profile_snapshot: profile });
    if (sessionError) throw sessionError;
    return NextResponse.json({ ok: true, data: { profile } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "taste profile save error" }, { status: 500 });
  }
}
