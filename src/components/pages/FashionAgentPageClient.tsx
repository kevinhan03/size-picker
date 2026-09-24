"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bookmark,
  Check,
  MessageCircle,
  Plus,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { authenticatedFetch } from "../../api/shared";
import { getProductPageUrl } from "../../utils/product";
import { ProgressiveImage } from "../ProgressiveImage";
import { AgentResultInsight } from "../AgentResultInsight";
import { agentPalette } from "../../utils/agent-palette";
import { captureEvent } from "../../utils/analytics";
import type {
  AgentConversation,
  AgentMessage,
} from "../../types/fashion-agent";

const errors: Record<string, [string, string]> = {
  agent_not_configured: [
    "에이전트 연결을 준비 중이에요. 잠시 후 다시 이용해 주세요.",
    "The agent connection is being set up. Please try again later.",
  ],
  agent_unavailable: [
    "에이전트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    "The agent is unavailable. Please try again later.",
  ],
  login_required: [
    "로그인 후 에이전트를 이용해 주세요.",
    "Please sign in to use the agent.",
  ],
  conversation_busy: [
    "이전 요청을 처리 중이에요. 잠시 후 다시 보내 주세요.",
    "A previous request is still running. Please try again shortly.",
  ],
  rate_limited: [
    "이번 시간의 질문 한도에 도달했어요. 잠시 후 다시 이용해 주세요.",
    "You have reached the hourly question limit. Please try again later.",
  ],
  conversation_full: [
    "이 대화가 길어졌어요. 새 대화에서 이어가 주세요.",
    "This conversation is full. Please start a new one.",
  ],
  agent_timeout: [
    "답변 준비가 오래 걸리고 있어요. 다시 시도해 주세요.",
    "The response timed out. Please try again.",
  ],
  model_busy: [
    "질문이 몰리고 있어요. 잠시 후 다시 시도해 주세요.",
    "The agent is busy. Please try again shortly.",
  ],
  invalid_model_response: [
    "답변 형식을 다시 확인하고 있어요. 잠시 후 다시 시도해 주세요.",
    "The response format needs another try. Please try again shortly.",
  ],
  model_unavailable: [
    "에이전트 응답을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.",
    "The agent could not prepare a response. Please try again shortly.",
  ],
};
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(url, init);
  const payload = await response.json();
  if (!response.ok || !payload.ok)
    throw new Error(payload.error || "agent_unavailable");
  return payload.data as T;
}
const negativeReasons = [
  ["not_my_taste", "취향과 달라요", "Not my taste"],
  ["too_similar", "이미 비슷한 옷이 있어요", "Too similar"],
  ["too_plain", "너무 평범해요", "Too plain"],
  ["too_bold", "너무 튀어요", "Too bold"],
  ["wrong_condition", "조건과 달라요", "Wrong condition"],
] as const;
type FeedbackValue = "positive" | (typeof negativeReasons)[number][0];

export function FashionAgentPageClient() {
  const auth = useAuthContext(),
    { locale } = useLocaleContext();
  const { isInDigbox, addToDigbox, ensureLoaded } = useDigboxContext();
  const en = locale === "en",
    say = (ko: string, english: string) => (en ? english : ko);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [conversations, setConversations] = useState<
    Array<Omit<AgentConversation, "messages">>
  >([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pending, setPending] = useState(false),
    [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, FeedbackValue>>({});
  const [feedbackStatus, setFeedbackStatus] = useState<
    Record<string, "pending" | "saved" | "error">
  >({});
  const [reasonPanel, setReasonPanel] = useState<Record<string, boolean>>({});
  const [feedbackLoadError, setFeedbackLoadError] = useState(false);
  const feedbackLocks = useRef(new Set<string>());
  const initialConversation = useRef<string | null>(null);
  const feedbackUser = useRef(auth.authUser?.id);
  const controller = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const retry = useRef<{
    message: string;
    requestId: string;
    conversationId: string;
  } | null>(null);
  const userId = auth.authUser?.id;

  useEffect(() => {
    feedbackUser.current = userId;
    setFeedback({});
    setFeedbackStatus({});
    setReasonPanel({});
    feedbackLocks.current.clear();
    controller.current?.abort();
    inFlight.current = false;
    retry.current = null;
    setPending(false);
    setMessages([]);
    setConversationId(null);
    setConversations([]);
    setError(null);
    setDraft("");
    setLoading(false);
    if (!userId) return;
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    api<{ conversations: Array<Omit<AgentConversation, "messages">> }>(
      "/api/fashion-agent",
      { signal: abort.signal }
    )
      .then((data) => {
        if (!abort.signal.aborted) setConversations(data.conversations);
      })
      .catch((err) => {
        if (!abort.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => {
      abort.abort();
      controller.current?.abort();
    };
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    const id = new URLSearchParams(window.location.search).get(
      "conversationId"
    );
    if (!id || initialConversation.current === id) return;
    initialConversation.current = id;
    void openConversation(id);
  }, [userId]);
  useEffect(() => {
    setFeedbackLoadError(false);
    if (!conversationId || !userId) return;
    const abort = new AbortController();
    api<
      Array<{
        assistant_message_id: string;
        product_id: number;
        sentiment: string;
        reason: FeedbackValue;
      }>
    >(`/api/fashion-agent/feedback?conversationId=${conversationId}`, {
      signal: abort.signal,
    })
      .then((rows) => {
        if (abort.signal.aborted) return;
        const restored = Object.fromEntries(
          rows.map((row) => [
            `${row.assistant_message_id}:${row.product_id}`,
            row.sentiment === "positive" ? ("positive" as const) : row.reason,
          ])
        );
        setFeedback((current) => ({ ...restored, ...current }));
      })
      .catch(() => {
        if (!abort.signal.aborted) setFeedbackLoadError(true);
      });
    return () => abort.abort();
  }, [conversationId, userId]);
  useEffect(() => {
    if (userId) ensureLoaded();
  }, [userId, ensureLoaded]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [messages, pending]);
  useEffect(() => {
    if (!conversationId || !userId) return;
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      message.products?.forEach((product, index) => {
        void recordCardEvent(
          conversationId,
          message.id,
          product.id,
          index + 1,
          "impression"
        );
      });
    }
  }, [conversationId, messages, userId]);

  async function recordCardEvent(
    conversation: string,
    messageId: string,
    productId: string,
    rank: number,
    eventType: "impression" | "click" | "save"
  ) {
    try {
      const result = await api<{ recorded: boolean }>(
        "/api/fashion-agent/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: eventType === "click",
          body: JSON.stringify({
            conversationId: conversation,
            assistantMessageId: messageId,
            productId,
            eventType,
          }),
        }
      );
      if (result.recorded)
        captureEvent("fashion_agent_card", {
          eventType,
          requestId: messageId.replace(/:assistant$/, ""),
          productId,
          rank,
        });
    } catch {
      // Telemetry is best effort.
    }
  }

  async function deleteConversation() {
    if (!conversationId || pending || deleting) return;
    if (
      !window.confirm(
        say(
          "이 대화를 삭제할까요? 복구할 수 없어요.",
          "Delete this conversation? This cannot be undone."
        )
      )
    )
      return;
    const id = conversationId;
    setDeleting(true);
    setError(null);
    try {
      await api(`/api/fashion-agent?conversationId=${id}`, {
        method: "DELETE",
      });
      setConversations((current) => current.filter((item) => item.id !== id));
      newConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "agent_unavailable");
    } finally {
      setDeleting(false);
    }
  }

  function newConversation() {
    if (inFlight.current) return;
    controller.current?.abort();
    retry.current = null;
    setConversationId(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setLoading(false);
    input.current?.focus();
  }
  async function openConversation(id: string) {
    if (inFlight.current) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    retry.current = null;
    setLoading(true);
    setError(null);
    try {
      const data = await api<AgentConversation>(
        `/api/fashion-agent?conversationId=${id}`,
        { signal: abort.signal }
      );
      if (!abort.signal.aborted) {
        setMessages(data.messages);
        setConversationId(id);
        setDraft("");
      }
    } catch (err) {
      if (!abort.signal.aborted)
        setError(err instanceof Error ? err.message : "agent_unavailable");
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  }
  async function submit() {
    if (!draft.trim() || inFlight.current || loading || !userId) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    const message = draft.trim();
    const id = conversationId || crypto.randomUUID();
    setConversationId(id);
    const prior = retry.current;
    const requestId =
      prior?.message === message && prior.conversationId === id
        ? prior.requestId
        : crypto.randomUUID();
    retry.current = { message, requestId, conversationId: id };
    const abort = new AbortController();
    controller.current = abort;
    try {
      const result = await api<{
        conversationId: string;
        messages: AgentMessage[];
      }>("/api/fashion-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: id,
          requestId,
          message,
          locale,
        }),
        signal: abort.signal,
      });
      if (abort.signal.aborted) return;
      if (
        !Array.isArray(result.messages) ||
        result.messages.length !== 2 ||
        result.messages.some(
          (m) =>
            typeof m.id !== "string" ||
            typeof m.text !== "string" ||
            !["user", "assistant"].includes(m.role)
        )
      )
        throw new Error("agent_unavailable");
      setMessages((current) => [
        ...current.filter(
          (m) => !result.messages.some((next) => next.id === m.id)
        ),
        ...result.messages,
      ]);
      setDraft("");
      retry.current = null;
      setConversations((current) => [
        {
          id,
          title:
            current.find((c) => c.id === id)?.title || message.slice(0, 70),
          updated_at: new Date().toISOString(),
        },
        ...current.filter((c) => c.id !== id),
      ]);
    } catch (err) {
      if (abort.signal.aborted) return;
      const code = err instanceof Error ? err.message : "agent_unavailable";
      // A network failure may have committed: retry its idempotency key. A
      // completed HTTP failure is safe to attempt as a new request.
      if (!(err instanceof TypeError) && code !== "conversation_busy")
        retry.current = null;
      setError(code);
    } finally {
      if (!abort.signal.aborted) {
        inFlight.current = false;
        setPending(false);
        input.current?.focus();
      }
    }
  }
  async function submitFeedback(
    messageId: string,
    productId: string,
    value: FeedbackValue
  ) {
    if (!conversationId) return;
    const key = `${messageId}:${productId}`;
    if (feedbackLocks.current.has(key)) return;
    feedbackLocks.current.add(key);
    const actor = userId;
    setFeedbackStatus((current) => ({ ...current, [key]: "pending" }));
    try {
      await api("/api/fashion-agent/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          assistantMessageId: messageId,
          productId,
          sentiment: value === "positive" ? "positive" : "negative",
          reason: value === "positive" ? null : value,
        }),
      });
      if (feedbackUser.current !== actor) return;
      setFeedback((current) => ({ ...current, [key]: value }));
      setFeedbackStatus((current) => ({ ...current, [key]: "saved" }));
      setReasonPanel((current) => ({ ...current, [key]: false }));
    } catch {
      if (feedbackUser.current === actor)
        setFeedbackStatus((current) => ({ ...current, [key]: "error" }));
    } finally {
      feedbackLocks.current.delete(key);
    }
  }
  if (auth.isAuthLoading)
    return (
      <main
        className="mx-auto max-w-3xl p-8 pt-[var(--app-main-pt)] text-gray-400"
        role="status"
      >
        {say("에이전트를 준비하고 있어요…", "Preparing your agent…")}
      </main>
    );
  return (
    <main className="mx-auto min-h-dvh w-full max-w-4xl px-4 pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-widest text-orange-400">
            DIGBOX
          </p>
          <h1 className="text-2xl font-bold">{say("에이전트", "Agent")}</h1>
        </div>
        {userId && (
          <div className="flex items-center gap-2">
            {conversationId && (
              <button
                type="button"
                onClick={() => void deleteConversation()}
                disabled={pending || loading || deleting}
                aria-label={say(
                  "현재 대화 삭제",
                  "Delete current conversation"
                )}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {say("삭제", "Delete")}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={newConversation}
              disabled={pending}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {say("새 대화", "New chat")}
            </button>
          </div>
        )}
      </div>
      {!userId ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <MessageCircle className="mx-auto mb-5 h-9 w-9 text-orange-400" />
          <h2 className="mb-3 text-xl font-semibold">
            {say(
              "내 취향에서 시작하는 패션 대화",
              "Fashion conversations, starting with your taste"
            )}
          </h2>
          <p className="mb-6 text-sm text-gray-400">
            {say(
              "로그인하면 저장한 상품과 취향을 바탕으로 함께 찾아드려요.",
              "Sign in to explore products using your saved items and taste."
            )}
          </p>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 font-semibold text-black"
            href="/login?returnTo=%2Ffashion-agent"
          >
            {say("로그인하고 시작하기", "Sign in to start")}
          </Link>
        </div>
      ) : (
        <>
          {conversations.length > 0 && (
            <label className="mb-6 block text-xs text-gray-400">
              {say("이전 대화", "Previous conversations")}
              <select
                aria-label={say("이전 대화 선택", "Choose a conversation")}
                disabled={pending || loading}
                value={conversationId || ""}
                onChange={(event) => {
                  if (event.target.value)
                    void openConversation(event.target.value);
                  else newConversation();
                }}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#151517] p-3 text-sm text-gray-200"
              >
                <option value="">{say("새 대화", "New chat")}</option>
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!messages.length && !loading && (
            <div className="py-12 sm:py-20">
              <MessageCircle className="mb-5 h-9 w-9 text-orange-400" />
              <h2 className="max-w-lg text-2xl font-semibold leading-snug sm:text-3xl">
                {say("어떤 옷을 찾고 있나요?", "What are you looking for?")}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-gray-400">
                {say(
                  "찾고 싶은 옷부터 내 취향에 대한 궁금증까지. DIGBOX에 모인 상품과 스타일 분석을 함께 살펴봐요.",
                  "Explore products, compare styles, and get to know your taste with DIGBOX."
                )}
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {[
                  say(
                    "검정색 와이드 팬츠 찾아줘",
                    "Find black wide-leg trousers"
                  ),
                  say(
                    "내 취향에 맞는 아우터 추천해줘",
                    "Recommend outerwear for my taste"
                  ),
                  say(
                    "내가 저장한 옷들의 공통점은?",
                    "What do my saved items have in common?"
                  ),
                  say("드리즐러 자켓이 뭐야?", "What is a drizzler jacket?"),
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setDraft(prompt);
                      input.current?.focus();
                    }}
                    className="rounded-2xl border border-white/10 p-4 text-left text-sm text-gray-300 hover:border-orange-400/40 hover:bg-white/[0.03]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && (
            <p role="status" className="py-6 text-sm text-gray-400">
              {say("대화를 불러오고 있어요…", "Loading conversations…")}
            </p>
          )}
          <div
            role="log"
            aria-label={say("에이전트 대화", "Agent conversation")}
            aria-live="polite"
            className="space-y-8"
          >
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-white/[0.07] px-4 py-3"
                    : "max-w-full"
                }
              >
                {message.role === "assistant" && (
                  <p className="mb-3 text-xs font-bold text-orange-400">
                    DIGBOX
                  </p>
                )}
                {message.role === "assistant" ? (
                  <AgentResultInsight message={message} english={en} />
                ) : (
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">
                    {message.text}
                  </p>
                )}
                {message.outfit && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {message.outfit.slots.map((slot) => (
                      <div
                        key={slot.slot}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs"
                      >
                        <p className="font-semibold text-orange-200">
                          {
                            {
                              top: say("상의", "Top"),
                              bottom: say("하의", "Bottom"),
                              outer: say("겉옷", "Outer"),
                              shoes: say("신발", "Shoes"),
                            }[slot.slot]
                          }
                        </p>
                        <p className="mt-1 text-gray-400">{slot.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!!message.products?.length &&
                  message.presentation?.kind !== "compare" && (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {message.products.map((product, index) => {
                        const feedbackKey = `${message.id}:${product.id}`;
                        const outfitSlot = message.outfit?.slots.find(
                          (slot) => slot.productId === product.id
                        );
                        const previous = message.products![index - 1];
                        const beginsPairing =
                          product.recommendationGroup === "compatible" &&
                          previous?.recommendationGroup !== "compatible";
                        return (
                          <Fragment key={product.id}>
                            {beginsPairing && (
                              <p className="col-span-full mt-3 border-t border-white/10 pt-5 text-sm font-semibold text-orange-200">
                                {say(
                                  "첫 번째 추천 상품과 어울리는 상품",
                                  "Pairs for the first recommendation"
                                )}
                              </p>
                            )}
                            <div
                              key={product.id}
                              style={{
                                borderColor: `${agentPalette(message.id).accent}40`,
                              }}
                              className="overflow-hidden rounded-3xl border border-[#354050] bg-[#181d26]"
                            >
                              <Link
                                href={getProductPageUrl(product)}
                                onClick={() => {
                                  if (conversationId)
                                    void recordCardEvent(
                                      conversationId,
                                      message.id,
                                      product.id,
                                      index + 1,
                                      "click"
                                    );
                                }}
                                className="block"
                              >
                                <div className="relative aspect-[4/5] bg-white/[0.04]">
                                  <ProgressiveImage
                                    src={product.image}
                                    alt={product.name}
                                    className="object-contain"
                                  />
                                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs">
                                    {outfitSlot
                                      ? {
                                          top: say("상의", "Top"),
                                          bottom: say("하의", "Bottom"),
                                          outer: say("겉옷", "Outer"),
                                          shoes: say("신발", "Shoes"),
                                        }[outfitSlot.slot]
                                      : index + 1}
                                  </span>
                                  {product.relationship && (
                                    <span
                                      style={{
                                        background: agentPalette(message.id)
                                          .accent,
                                        color: "#181d26",
                                      }}
                                      className="absolute bottom-2 left-2 rounded-lg px-2 py-1 text-[10px] font-medium"
                                    >
                                      {product.relationship === "owned"
                                        ? say("보유한 상품", "In wardrobe")
                                        : product.relationship === "saved"
                                          ? say("저장한 상품", "Saved")
                                          : say("새로운 상품", "New to you")}
                                    </span>
                                  )}
                                </div>
                                <div className="p-3">
                                  <p className="text-xs text-gray-400">
                                    {product.brand}
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-sm font-normal leading-6">
                                    {product.name}
                                  </p>
                                </div>
                              </Link>
                              <div className="px-3 pb-3">
                                {product.tasteScore !== null && (
                                  <p className="mb-2 text-xs font-medium text-orange-300">
                                    {say(
                                      "저장 스타일 유사도",
                                      "Collection style similarity"
                                    )}{" "}
                                    {product.tasteScore}/100
                                  </p>
                                )}
                                <p className="text-xs leading-5 text-gray-400">
                                  {product.reasons[0]}
                                </p>
                                <details className="mt-2 text-xs leading-5 text-gray-400">
                                  <summary className="cursor-pointer py-2 text-orange-200">
                                    {say(
                                      "추천 근거와 확인할 점",
                                      "Why this result"
                                    )}
                                  </summary>
                                  {product.reasons.slice(1).map((reason, i) => (
                                    <p key={i} className="mt-2">
                                      {reason}
                                    </p>
                                  ))}
                                  {product.evidence && (
                                    <>
                                      <p className="mt-2">
                                        {product.evidence.source === "query"
                                          ? say(
                                              "이번 질문의 조건 기준",
                                              "Based on this request"
                                            )
                                          : say(
                                              `분석된 ${product.evidence.source === "closet" ? "옷장" : "저장"} 상품 ${product.evidence.analyzedCount}개 기준`,
                                              `Based on ${product.evidence.analyzedCount} analyzed collection items`
                                            )}
                                      </p>
                                      {product.evidence.source !== "query" && (
                                        <p className="mt-2">
                                          {product.evidence.confidence ===
                                          "high"
                                            ? say(
                                                "저장 데이터에서 반복된 특징을 반영했어요.",
                                                "Reflects recurring features in your collection."
                                              )
                                            : say(
                                                "취향 근거가 제한적이므로 유사도는 참고해 주세요.",
                                                "Taste evidence is limited; use similarity as a guide."
                                              )}
                                        </p>
                                      )}
                                      {product.evidence.caveats.map(
                                        (note, i) => (
                                          <p key={i} className="mt-2">
                                            {note}
                                          </p>
                                        )
                                      )}
                                    </>
                                  )}
                                </details>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      feedbackStatus[feedbackKey] === "pending"
                                    }
                                    aria-pressed={
                                      feedback[feedbackKey] === "positive"
                                    }
                                    style={
                                      feedback[feedbackKey] === "positive"
                                        ? {
                                            background: agentPalette(message.id)
                                              .accent,
                                            color: "#181d26",
                                          }
                                        : undefined
                                    }
                                    onClick={() =>
                                      void submitFeedback(
                                        message.id,
                                        product.id,
                                        "positive"
                                      )
                                    }
                                    className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 motion-safe:active:scale-[0.97] disabled:opacity-50 ${feedback[feedbackKey] === "positive" ? "border-orange-400 bg-orange-400/10 text-orange-200" : "border-white/10 text-gray-300 hover:bg-white/5"}`}
                                  >
                                    {feedback[feedbackKey] === "positive" ? (
                                      <Check className="h-3.5 w-3.5" />
                                    ) : (
                                      <ThumbsUp className="h-3.5 w-3.5" />
                                    )}
                                    {say("좋아요", "Useful")}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      feedbackStatus[feedbackKey] === "pending"
                                    }
                                    aria-expanded={Boolean(
                                      reasonPanel[feedbackKey]
                                    )}
                                    aria-pressed={Boolean(
                                      feedback[feedbackKey] &&
                                      feedback[feedbackKey] !== "positive"
                                    )}
                                    style={
                                      feedback[feedbackKey] &&
                                      feedback[feedbackKey] !== "positive"
                                        ? {
                                            background: agentPalette(message.id)
                                              .accent,
                                            color: "#181d26",
                                          }
                                        : undefined
                                    }
                                    onClick={() =>
                                      setReasonPanel((current) => ({
                                        ...current,
                                        [feedbackKey]: !current[feedbackKey],
                                      }))
                                    }
                                    className={`min-h-11 flex-1 rounded-xl border text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 motion-safe:active:scale-[0.97] disabled:opacity-50 ${feedback[feedbackKey] && feedback[feedbackKey] !== "positive" ? "border-orange-400 bg-orange-400/10 text-orange-200" : "border-white/10 text-gray-300 hover:bg-white/5"}`}
                                  >
                                    {feedback[feedbackKey] &&
                                    feedback[feedbackKey] !== "positive"
                                      ? say("✓ 별로예요", "✓ Not for me")
                                      : say("별로예요", "Not for me")}
                                  </button>
                                </div>
                                <p
                                  role="status"
                                  aria-live="polite"
                                  className={`mt-2 min-h-4 text-[11px] ${feedbackStatus[feedbackKey] === "error" ? "text-red-300" : "text-emerald-200"}`}
                                >
                                  {feedbackStatus[feedbackKey] === "pending"
                                    ? say("의견 저장 중…", "Saving feedback…")
                                    : feedbackStatus[feedbackKey] === "error"
                                      ? say(
                                          "저장하지 못했어요. 다시 눌러 주세요.",
                                          "Could not save. Please try again."
                                        )
                                      : feedback[feedbackKey]
                                        ? feedback[feedbackKey] === "positive"
                                          ? say(
                                              "의견을 저장했어요.",
                                              "Feedback saved."
                                            )
                                          : say("저장됨 · ", "Saved · ") +
                                            (negativeReasons.find(
                                              ([value]) =>
                                                value === feedback[feedbackKey]
                                            )?.[en ? 2 : 1] || "")
                                        : ""}
                                </p>
                                {reasonPanel[feedbackKey] && (
                                  <div className="mt-2 grid gap-1">
                                    <p className="mb-1 text-xs text-gray-300">
                                      {say(
                                        "어떤 점이 아쉬웠나요?",
                                        "What could be better?"
                                      )}
                                    </p>
                                    {negativeReasons.map(([value, ko, en]) => (
                                      <button
                                        key={value}
                                        type="button"
                                        disabled={
                                          feedbackStatus[feedbackKey] ===
                                          "pending"
                                        }
                                        onClick={() =>
                                          void submitFeedback(
                                            message.id,
                                            product.id,
                                            value
                                          )
                                        }
                                        className={`rounded-lg px-2 py-1.5 text-left text-[11px] ${feedback[feedbackKey] === value ? "bg-orange-400/15 text-orange-200" : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]"}`}
                                      >
                                        {say(ko, en)}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  disabled={
                                    saving === product.id ||
                                    isInDigbox(product.id)
                                  }
                                  onClick={async () => {
                                    setSaving(product.id);
                                    try {
                                      await addToDigbox(
                                        product.id,
                                        "fashion_agent"
                                      );
                                      if (conversationId)
                                        void recordCardEvent(
                                          conversationId,
                                          message.id,
                                          product.id,
                                          index + 1,
                                          "save"
                                        );
                                    } finally {
                                      setSaving(null);
                                    }
                                  }}
                                  className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50"
                                >
                                  {isInDigbox(product.id) ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Bookmark className="h-3.5 w-3.5" />
                                  )}
                                  {isInDigbox(product.id)
                                    ? say("저장됨", "Saved")
                                    : say("저장", "Save")}
                                </button>
                              </div>
                            </div>
                          </Fragment>
                        );
                      })}
                    </div>
                  )}
                {!!message.notes?.length && (
                  <details className="mt-4 text-xs text-slate-400">
                    <summary className="cursor-pointer py-2">
                      {say("분석 기준 보기", "About this analysis")}
                    </summary>
                    {message.notes.map((note, index) => (
                      <p
                        key={index}
                        className="mt-3 text-xs leading-5 text-gray-500"
                      >
                        {note}
                      </p>
                    ))}
                  </details>
                )}
              </article>
            ))}
            {pending && (
              <div
                role="status"
                className="rounded-2xl border border-orange-500/20 p-4 text-sm text-gray-400"
              >
                <p className="mb-2 whitespace-pre-wrap text-white">{draft}</p>
                {say(
                  "조건과 취향을 살펴보고 있어요…",
                  "Looking through your requirements and taste…"
                )}
              </div>
            )}
          </div>
          <div ref={bottom} />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="sticky bottom-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom))] mt-8 bg-[#09090b]/95 pb-3 pt-3 backdrop-blur-xl lg:bottom-0"
          >
            {error && (
              <p role="alert" className="mb-3 text-sm text-orange-300">
                {(errors[error] || errors.agent_unavailable)[en ? 1 : 0]}
              </p>
            )}
            {feedbackLoadError && (
              <p role="status" className="mb-3 text-xs text-amber-200">
                {say(
                  "이전에 남긴 의견을 불러오지 못했어요. 대화를 다시 열어 주세요.",
                  "Previous feedback could not be loaded. Reopen this conversation."
                )}
              </p>
            )}
            <div className="flex items-end gap-3 rounded-2xl border border-white/15 bg-[#151517] p-3 focus-within:border-orange-400/50">
              <textarea
                ref={input}
                aria-label={say("에이전트에게 질문", "Ask the agent")}
                placeholder={say(
                  "찾고 싶은 옷이나 궁금한 점을 말해 주세요",
                  "Describe a product or ask about your taste"
                )}
                value={draft}
                maxLength={2000}
                rows={2}
                disabled={pending}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                className="max-h-40 min-h-12 flex-1 resize-y bg-transparent text-sm leading-6 outline-none placeholder:text-gray-500 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={pending || loading || !draft.trim()}
                aria-label={say("보내기", "Send")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-black hover:bg-orange-400 disabled:bg-white/10 disabled:text-gray-500"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-4 text-gray-500">
              {say(
                "상품 정보와 분석이 없는 내용은 확인할 수 없어요.",
                "Answers depend on available product information and analysis."
              )}
            </p>
          </form>
        </>
      )}
    </main>
  );
}
