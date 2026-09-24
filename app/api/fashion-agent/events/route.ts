import { NextResponse } from "next/server";
import {
  getRegisteredRequestUser,
  hasValidMutationOrigin,
} from "../../../../server/auth/request-user";
import { supabase } from "../../../../server/lib/supabase.js";
import { FASHION_AGENT_ALGORITHM } from "../../../../server/services/fashion-agent/version";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const send = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request))
    return send({ ok: false, error: "invalid_origin" }, 403);
  const user = await getRegisteredRequestUser(request);
  if (!user) return send({ ok: false, error: "login_required" }, 401);
  if (Number(request.headers.get("content-length") || 0) > 2000)
    return send({ ok: false, error: "invalid_request" }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2000)
      return send({ ok: false, error: "invalid_request" }, 413);
    body = JSON.parse(raw);
  } catch {
    return send({ ok: false, error: "invalid_request" }, 400);
  }
  const { conversationId, assistantMessageId, productId, eventType } = body;
  if (
    !uuid.test(String(conversationId)) ||
    typeof assistantMessageId !== "string" ||
    !uuid.test(assistantMessageId.replace(/:assistant$/, "")) ||
    !assistantMessageId.endsWith(":assistant") ||
    !/^[1-9]\d*$/.test(String(productId)) ||
    !Number.isSafeInteger(Number(productId)) ||
    !["impression", "click", "save"].includes(String(eventType))
  )
    return send({ ok: false, error: "invalid_request" }, 400);
  const requestId = assistantMessageId.slice(0, -":assistant".length);
  if (!supabase) return send({ ok: false, error: "agent_unavailable" }, 503);
  const { data: execution, error } = await supabase
    .from("fashion_agent_requests")
    .select("id,status,response,execution")
    .eq("id", requestId)
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return send({ ok: false, error: "agent_unavailable" }, 503);
  if (!execution || execution.status !== "completed")
    return send({ ok: false, error: "conversation_not_found" }, 404);
  const reply = execution.response?.messages?.find(
    (message: { id?: string }) => message.id === assistantMessageId
  );
  const rank = reply?.products?.findIndex(
    (product: { id?: string | number }) =>
      String(product.id) === String(productId)
  );
  if (typeof rank !== "number" || rank < 0 || rank >= 12)
    return send({ ok: false, error: "invalid_request" }, 400);
  if (eventType === "save") {
    const saved = await supabase
      .from("user_digbox_items")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("product_id", String(productId))
      .maybeSingle();
    if (saved.error)
      return send({ ok: false, error: "agent_unavailable" }, 503);
    if (!saved.data) return send({ ok: false, error: "invalid_request" }, 400);
  }
  const { error: insertError } = await supabase
    .from("fashion_agent_card_events")
    .insert({
      user_id: user.id,
      conversation_id: conversationId,
      request_id: requestId,
      assistant_message_id: assistantMessageId,
      product_id: Number(productId),
      rank: rank + 1,
      event_type: eventType,
      algorithm_version:
        execution.execution?.version || FASHION_AGENT_ALGORITHM.orchestration,
    });
  if (insertError?.code === "23505")
    return send({ ok: true, data: { recorded: false } });
  if (insertError) return send({ ok: false, error: "agent_unavailable" }, 503);
  return send({ ok: true, data: { recorded: true } });
}
