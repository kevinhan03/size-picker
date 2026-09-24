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
type TraceEvent = { stage?: unknown; data?: unknown };
type FeedbackShadow = {
  eligible?: boolean;
  ineligibleReason?: string | null;
  optionA?: "baseline" | "challenger";
  baselineVersion?: string;
  challengerVersion?: string;
  baselineProducts?: unknown[];
  challengerProducts?: unknown[];
  changedPositions?: number;
  feedback?: unknown;
};
function feedbackComparison(execution: unknown, review: unknown) {
  const events =
    execution &&
    typeof execution === "object" &&
    Array.isArray((execution as { events?: unknown }).events)
      ? (execution as { events: TraceEvent[] }).events || []
      : [];
  const shadow = events.find((event) => event.stage === "feedback_shadow")
    ?.data as FeedbackShadow | undefined;
  if (!shadow) return null;
  const challengerIsA = shadow.optionA === "challenger";
  const reviewed = Boolean(review);
  return {
    eligible: Boolean(shadow.eligible),
    ineligibleReason: shadow.ineligibleReason || null,
    changedPositions: Number(shadow.changedPositions || 0),
    feedback: shadow.feedback || null,
    optionA: challengerIsA
      ? shadow.challengerProducts || []
      : shadow.baselineProducts || [],
    optionB: challengerIsA
      ? shadow.baselineProducts || []
      : shadow.challengerProducts || [],
    review: review || null,
    reveal: reviewed
      ? {
          optionA: challengerIsA ? "feedback" : "baseline",
          optionB: challengerIsA ? "baseline" : "feedback",
          baselineVersion: shadow.baselineVersion,
          challengerVersion: shadow.challengerVersion,
        }
      : null,
  };
}
function blindedExecution(execution: unknown, reviewed: boolean) {
  if (
    reviewed ||
    !execution ||
    typeof execution !== "object" ||
    !Array.isArray((execution as { events?: unknown }).events)
  )
    return execution;
  return {
    ...(execution as Record<string, unknown>),
    events: (execution as { events: TraceEvent[] }).events.map((event) => {
      if (event.stage !== "feedback_shadow") return event;
      const shadow = (event.data || {}) as FeedbackShadow;
      return {
        stage: event.stage,
        data: {
          eligible: Boolean(shadow.eligible),
          ineligibleReason: shadow.ineligibleReason || null,
          changedPositions: Number(shadow.changedPositions || 0),
          feedback: shadow.feedback || null,
          blinded: true,
        },
      };
    }),
  };
}
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
          "id,created_at,status,question,locale,response,duration_ms,error_code,execution,review,comparison_review,conversation_id"
        )
        .eq("id", id)
        .maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return send({ error: "기록이 없습니다." }, 404);
      const [feedback, events] = await Promise.all([
        supabase
          .from("fashion_agent_feedback")
          .select("product_id,sentiment,reason,created_at")
          .eq("assistant_message_id", `${id}:assistant`)
          .eq("conversation_id", result.data.conversation_id),
        supabase
          .from("fashion_agent_card_events")
          .select("product_id,rank,event_type,algorithm_version,created_at")
          .eq("request_id", id)
          .order("created_at", { ascending: true }),
      ]);
      return send({
        data: redactValue({
          ...result.data,
          execution: blindedExecution(
            result.data.execution,
            Boolean(result.data.comparison_review)
          ),
          feedback: feedback.error ? null : feedback.data,
          cardEvents: events.error ? null : events.data,
          comparison: feedbackComparison(
            result.data.execution,
            result.data.comparison_review
          ),
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
    const [feedbackResult, comparisonResult, eventResult] = await Promise.all([
      supabase
        .from("fashion_agent_feedback")
        .select("sentiment,reason")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("fashion_agent_requests")
        .select("execution,comparison_review")
        .not("execution", "is", null)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.rpc("fashion_agent_card_event_totals"),
    ]);
    const feedbackRows = feedbackResult.error ? [] : feedbackResult.data || [];
    const reasons: Record<string, number> = {};
    let positive = 0,
      negative = 0;
    for (const row of feedbackRows) {
      if (row.sentiment === "positive") positive += 1;
      else negative += 1;
      if (row.reason) reasons[row.reason] = (reasons[row.reason] || 0) + 1;
    }
    const comparisonRows = comparisonResult.error
      ? []
      : (comparisonResult.data || [])
          .map((row) =>
            feedbackComparison(row.execution, row.comparison_review)
          )
          .filter((value) => value?.eligible);
    const reviewedComparisons = comparisonRows.filter((value) => value?.review);
    const wins = { baseline: 0, feedback: 0, tie: 0 };
    for (const comparison of reviewedComparisons) {
      const review = comparison!.review as { preferredOption?: string };
      if (review.preferredOption === "tie") wins.tie += 1;
      else if (comparison!.reveal) {
        const selected =
          review.preferredOption === "a"
            ? comparison!.reveal.optionA
            : comparison!.reveal.optionB;
        if (selected === "feedback") wins.feedback += 1;
        else wins.baseline += 1;
      }
    }
    return send({
      data: redactValue({
        items,
        total: result.count,
        page,
        insights: {
          cardEvents: {
            available: !eventResult.error,
            impressions: Number(eventResult.data?.impressions || 0),
            clicks: Number(eventResult.data?.clicks || 0),
            saves: Number(eventResult.data?.saves || 0),
          },
          feedback: { total: feedbackRows.length, positive, negative, reasons },
          comparisons: {
            eligible: comparisonRows.length,
            reviewed: reviewedComparisons.length,
            wins,
          },
        },
      }),
    });
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
    if (body.action === "comparison_review") {
      const scoreKeys = [
        "tasteA",
        "tasteB",
        "conditionsA",
        "conditionsB",
        "diversityA",
        "diversityB",
        "explanationA",
        "explanationB",
      ];
      if (
        !uuid.test(body.id || "") ||
        !["a", "b", "tie"].includes(body.preferredOption) ||
        !scoreKeys.every(
          (key) =>
            Number.isInteger(body[key]) && body[key] >= 1 && body[key] <= 5
        ) ||
        typeof body.note !== "string" ||
        body.note.length > 1000
      )
        return send({ error: "비교 평가 내용을 확인해 주세요." }, 400);
      if (!supabase) throw new Error("database_unavailable");
      const comparisonReview = {
        preferredOption: body.preferredOption,
        tasteA: body.tasteA,
        tasteB: body.tasteB,
        conditionsA: body.conditionsA,
        conditionsB: body.conditionsB,
        diversityA: body.diversityA,
        diversityB: body.diversityB,
        explanationA: body.explanationA,
        explanationB: body.explanationB,
        note: body.note.trim(),
        reviewedAt: new Date().toISOString(),
      };
      const result = await supabase
        .from("fashion_agent_requests")
        .update({ comparison_review: comparisonReview })
        .eq("id", body.id)
        .select("id")
        .maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return send({ error: "기록이 없습니다." }, 404);
      return send({ saved: true });
    }
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
