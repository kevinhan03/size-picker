import { NextResponse } from "next/server";
import {
  getRegisteredRequestUser,
  hasValidMutationOrigin,
} from "../../../../server/auth/request-user";
import {
  assertSupabaseConfig,
  supabase,
} from "../../../../server/lib/supabase.js";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reasons = new Set([
  "not_my_taste",
  "too_similar",
  "too_plain",
  "too_bold",
  "wrong_condition",
]);
export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request))
    return NextResponse.json(
      { ok: false, error: "invalid_origin" },
      { status: 403 }
    );
  try {
    const user = await getRegisteredRequestUser(request);
    if (!user)
      return NextResponse.json(
        { ok: false, error: "login_required" },
        { status: 401 }
      );
    assertSupabaseConfig();
    const body = await request.json();
    if (
      !body ||
      !uuid.test(body.conversationId) ||
      typeof body.assistantMessageId !== "string" ||
      !/^\\d+$/.test(String(body.productId)) ||
      !["positive", "negative"].includes(body.sentiment) ||
      (body.sentiment === "negative" && !reasons.has(body.reason)) ||
      (body.sentiment === "positive" && body.reason !== null)
    )
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    const { data: conversation, error: conversationError } = await supabase!
      .from("fashion_agent_conversations")
      .select("messages")
      .eq("id", body.conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (conversationError) throw conversationError;
    const message =
      Array.isArray(conversation?.messages) &&
      conversation.messages.find(
        (item: unknown) =>
          item &&
          typeof item === "object" &&
          (item as { id?: unknown }).id === body.assistantMessageId &&
          (item as { role?: unknown }).role === "assistant"
      );
    const productExists =
      message &&
      Array.isArray((message as { products?: unknown }).products) &&
      (message as { products: Array<{ id?: unknown }> }).products.some(
        (product) => String(product?.id) === String(body.productId)
      );
    if (!productExists)
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 }
      );
    const { error } = await supabase!.from("fashion_agent_feedback").upsert(
      {
        user_id: user.id,
        conversation_id: body.conversationId,
        assistant_message_id: body.assistantMessageId,
        product_id: Number(body.productId),
        sentiment: body.sentiment,
        reason: body.reason,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,conversation_id,assistant_message_id,product_id" }
    );
    if (error) throw error;
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "feedback_unavailable" },
      { status: 503 }
    );
  }
}
