import { NextResponse } from "next/server";
import {
  getAdminTokenFromCookieHeader,
  verifyAdminSessionToken,
} from "../../../../server/auth/admin-session.js";
import { hasValidMutationOrigin } from "../../../../server/auth/request-user";
import { supabase } from "../../../../server/lib/supabase.js";
import { redactValue } from "../../../../server/services/fashion-agent/trace";

const send = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const authorized = (request: Request) =>
  verifyAdminSessionToken(
    getAdminTokenFromCookieHeader(request.headers.get("cookie") || "")
  );
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET(request: Request) {
  if (!authorized(request))
    return send({ error: "관리자 로그인이 필요합니다." }, 401);
  try {
    if (!supabase) throw new Error("database_unavailable");
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (id) {
      if (!uuid.test(id)) return send({ error: "잘못된 요청입니다." }, 400);
      const result = await supabase
        .from("fashion_agent_requests")
        .select(
          "id,created_at,status,question,locale,response,duration_ms,error_code,execution,review,conversation_id"
        )
        .eq("id", id)
        .maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return send({ error: "기록이 없습니다." }, 404);
      const feedback = await supabase
        .from("fashion_agent_feedback")
        .select("product_id,sentiment,reason,created_at")
        .eq("assistant_message_id", `${id}:assistant`)
        .eq("conversation_id", result.data.conversation_id);
      return send({
        data: redactValue({
          ...result.data,
          feedback: feedback.error ? null : feedback.data,
        }),
      });
    }
    const page = Math.max(0, Math.min(10000, Number(params.get("page")) || 0));
    let query = supabase
      .from("fashion_agent_requests")
      .select(
        "id,created_at,status,question,response,duration_ms,error_code,review,execution",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .order("id")
      .range(page * 30, page * 30 + 29);
    const status = params.get("status");
    if (status && ["completed", "failed", "pending"].includes(status))
      query = query.eq("status", status);
    if (params.get("unreviewed") === "true") query = query.is("review", null);
    const result = await query;
    if (result.error) throw result.error;
    const items = (result.data || []).map((row) => {
      const messages = row.response?.messages || [];
      return {
        id: row.id,
        created_at: row.created_at,
        status: row.status,
        question:
          row.question ||
          messages.find((m: { role: string }) => m.role === "user")?.text ||
          "질문 원문 미기록",
        duration_ms: row.duration_ms,
        error_code: row.error_code,
        reviewed: Boolean(row.review),
        productCount:
          messages.find((m: { role: string }) => m.role === "assistant")
            ?.products?.length ?? null,
        model: row.execution?.model || null,
      };
    });
    return send({ data: redactValue({ items, total: result.count, page }) });
  } catch {
    return send({ error: "운영 기록을 불러오지 못했습니다." }, 503);
  }
}
export async function PUT(request: Request) {
  if (!authorized(request))
    return send({ error: "관리자 로그인이 필요합니다." }, 401);
  if (!hasValidMutationOrigin(request))
    return send({ error: "잘못된 요청입니다." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 4000) return send({ error: "입력이 너무 깁니다." }, 400);
    const body = JSON.parse(raw);
    if (
      !uuid.test(body.id || "") ||
      ![body.taste, body.explanation, body.conditions].every(
        (value) => Number.isInteger(value) && value >= 1 && value <= 5
      ) ||
      ![
        "none",
        "intent",
        "retrieval",
        "ranking",
        "explanation",
        "error",
      ].includes(body.issue) ||
      typeof body.note !== "string" ||
      body.note.length > 1000
    )
      return send({ error: "점수와 검수 내용을 확인해 주세요." }, 400);
    if (!supabase) throw new Error("database_unavailable");
    const result = await supabase
      .from("fashion_agent_requests")
      .update({
        review: {
          taste: body.taste,
          explanation: body.explanation,
          conditions: body.conditions,
          issue: body.issue,
          note: body.note,
          reviewedAt: new Date().toISOString(),
        },
      })
      .eq("id", body.id)
      .select("id")
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return send({ error: "기록이 없습니다." }, 404);
    return send({ saved: true });
  } catch {
    return send({ error: "검수를 저장하지 못했습니다." }, 503);
  }
}
