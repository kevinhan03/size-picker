import { NextResponse } from "next/server";
import {
  getRegisteredRequestUser,
  hasValidMutationOrigin,
} from "../../../server/auth/request-user";
import {
  assertSupabaseConfig,
  supabase,
} from "../../../server/lib/supabase.js";
import { AgentError } from "../../../server/services/fashion-agent/contracts";
import { runAgent } from "../../../server/services/fashion-agent/agent";
import {
  executionContext,
  type ExecutionTrace,
} from "../../../server/services/fashion-agent/trace";
import type {
  AgentMessage,
  AgentState,
} from "../../../src/types/fashion-agent";
import { FASHION_AGENT_ALGORITHM } from "../../../server/services/fashion-agent/version";

export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const send = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
function failure(error: unknown) {
  if (error instanceof AgentError)
    return send({ ok: false, error: error.code }, error.status);
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  const known: Record<string, number> = {
    conversation_not_found: 404,
    conversation_busy: 409,
    request_expired: 409,
    conversation_full: 409,
    rate_limited: 429,
  };
  for (const [code, status] of Object.entries(known))
    if (message.includes(code)) return send({ ok: false, error: code }, status);
  if (
    error instanceof Error &&
    ["AbortError", "TimeoutError"].includes(error.name)
  )
    return send({ ok: false, error: "agent_timeout" }, 504);
  // Never expose database details, provider responses, prompts, or credentials.
  console.error("fashion-agent request failed", {
    code:
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "internal",
  });
  return send({ ok: false, error: "agent_unavailable" }, 503);
}
export async function GET(request: Request) {
  try {
    const user = await getRegisteredRequestUser(request);
    if (!user) return send({ ok: false, error: "login_required" }, 401);
    assertSupabaseConfig();
    const id = new URL(request.url).searchParams.get("conversationId");
    if (id && !uuid.test(id)) throw new AgentError("invalid_request");
    if (id) {
      const { data, error } = await supabase!
        .from("fashion_agent_conversations")
        .select("id,title,messages,updated_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new AgentError("conversation_not_found", 404);
      return send({ ok: true, data });
    }
    const { data, error } = await supabase!
      .from("fashion_agent_conversations")
      .select("id,title,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return send({ ok: true, data: { conversations: data } });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  const startedAt = Date.now();
  const trace: ExecutionTrace = {
    model: process.env.OPENAI_FASHION_AGENT_MODEL || "gpt-4.1-mini",
    version: FASHION_AGENT_ALGORITHM.orchestration,
    events: [],
  };
  async function recordExecution(values: Record<string, unknown>) {
    if (!lease) return;
    try {
      const { error } = await supabase!
        .from("fashion_agent_requests")
        .update(values)
        .eq("id", lease.requestId)
        .eq("user_id", lease.user);
      if (error) console.warn("fashion-agent execution log unavailable");
    } catch {
      console.warn("fashion-agent execution log unavailable");
    }
  }
  if (!hasValidMutationOrigin(request))
    return send({ ok: false, error: "invalid_origin" }, 403);
  let lease: { user: string; requestId: string } | undefined;
  try {
    const user = await getRegisteredRequestUser(request);
    if (!user) return send({ ok: false, error: "login_required" }, 401);
    assertSupabaseConfig();
    if (
      !process.env.OPENAI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY.startsWith("your_")
    )
      throw new AgentError("agent_not_configured", 503);
    if (Number(request.headers.get("content-length") || 0) > 16000)
      throw new AgentError("invalid_request", 413);
    const reader = request.body?.getReader();
    if (!reader) throw new AgentError("invalid_request");
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 16000) {
          await reader.cancel();
          throw new AgentError("invalid_request", 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new AgentError("invalid_request");
    }
    if (
      !body ||
      typeof body.message !== "string" ||
      !body.message.trim() ||
      body.message.length > 2000 ||
      !uuid.test(body.conversationId) ||
      !uuid.test(body.requestId)
    )
      throw new AgentError("invalid_request");
    const message = body.message.trim();
    const { data, error } = await supabase!.rpc("fashion_agent_begin", {
      actor: user.id,
      conversation: body.conversationId,
      request_id: body.requestId,
      message,
    });
    if (error) throw error;
    if (data.cached) return send({ ok: true, data: data.cached });
    lease = { user: user.id, requestId: body.requestId };
    await recordExecution({
      question: message,
      locale: body.locale === "en" ? "en" : "ko",
    });
    const { reply, state } = await executionContext.run(trace, () =>
      runAgent(
        user.id,
        message,
        data.state as AgentState,
        data.messages as AgentMessage[],
        body.locale === "en" ? "en" : "ko",
        request.signal
      )
    );
    const userMessage: AgentMessage = {
      id: `${body.requestId}:user`,
      role: "user",
      text: message,
    };
    const assistantMessage: AgentMessage = {
      id: `${body.requestId}:assistant`,
      role: "assistant",
      ...reply,
    };
    const result = {
      conversationId: body.conversationId,
      messages: [userMessage, assistantMessage],
    };
    const { error: saveError } = await supabase!.rpc("fashion_agent_finish", {
      actor: user.id,
      conversation: body.conversationId,
      request_id: body.requestId,
      new_messages: result.messages,
      new_state: state,
      result,
    });
    if (saveError) throw saveError;
    await recordExecution({
      duration_ms: Date.now() - startedAt,
      execution: trace,
      error_code: null,
    });
    return send({ ok: true, data: result });
  } catch (error) {
    await recordExecution({
      duration_ms: Date.now() - startedAt,
      execution: trace,
      error_code:
        error instanceof AgentError ? error.code : "agent_unavailable",
    });
    if (lease) {
      await supabase!
        .from("fashion_agent_requests")
        .update({ status: "failed" })
        .eq("id", lease.requestId)
        .eq("user_id", lease.user)
        .eq("status", "pending");
    }
    return failure(error);
  }
}
