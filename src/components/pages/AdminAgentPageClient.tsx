"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AgentMessage } from "../../types/fashion-agent";
import { ProgressiveImage } from "../ProgressiveImage";
import { AgentResultInsight } from "../AgentResultInsight";
import { getProductPageUrl } from "../../utils/product";

type Item = {
  id: string;
  question: string;
  created_at: string;
  status: string;
  duration_ms: number | null;
  reviewed: boolean;
  productCount: number | null;
  model: string | null;
};
type Review = {
  taste: number;
  explanation: number;
  conditions: number;
  issue: string;
  note: string;
};
type ComparisonReview = {
  preferredOption: "a" | "b" | "tie";
  tasteA: number;
  tasteB: number;
  conditionsA: number;
  conditionsB: number;
  diversityA: number;
  diversityB: number;
  explanationA: number;
  explanationB: number;
  note: string;
};
type Comparison = {
  eligible: boolean;
  ineligibleReason: string | null;
  changedPositions: number;
  feedback: {
    total?: number;
    actionableTotal?: number;
    strength?: number;
    reasons?: Record<string, number>;
  } | null;
  optionA: AgentMessage["products"];
  optionB: AgentMessage["products"];
  review: ComparisonReview | null;
  reveal: {
    optionA: "baseline" | "feedback";
    optionB: "baseline" | "feedback";
    baselineVersion: string;
    challengerVersion: string;
  } | null;
};
type Insights = {
  cardEvents: {
    available: boolean;
    impressions: number;
    clicks: number;
    saves: number;
  };
  feedback: {
    total: number;
    positive: number;
    negative: number;
    reasons: Record<string, number>;
  };
  comparisons: {
    eligible: number;
    reviewed: number;
    wins: { baseline: number; feedback: number; tie: number };
  };
};
type Detail = Item & {
  response: { messages: AgentMessage[] } | null;
  execution: {
    model: string;
    version: string;
    events: Array<{ stage: string; data: unknown }>;
  } | null;
  error_code: string | null;
  review: Review | null;
  feedback: unknown;
  cardEvents: Array<{
    product_id: number;
    rank: number;
    event_type: string;
    created_at: string;
  }> | null;
  comparison: Comparison | null;
};
type TraceEvent = { stage: string; data: unknown };
const eventData = (events: TraceEvent[], stage: string) =>
  events.findLast((event) => event.stage === stage)?.data as
    Record<string, unknown> | undefined;
const percent = (value: unknown) =>
  typeof value === "number" ? `${Math.round(value * 100)}%` : "—";
const initialReview: Review = {
  taste: 3,
  explanation: 3,
  conditions: 3,
  issue: "none",
  note: "",
};
const initialComparisonReview: ComparisonReview = {
  preferredOption: "tie",
  tasteA: 3,
  tasteB: 3,
  conditionsA: 3,
  conditionsB: 3,
  diversityA: 3,
  diversityB: 3,
  explanationA: 3,
  explanationB: 3,
  note: "",
};
const statusLabel: Record<string, string> = {
  completed: "응답 완료",
  pending: "처리 중 / 중단 여부 확인",
  failed: "실패",
};
const feedbackReasonLabel: Record<string, string> = {
  not_my_taste: "취향과 다름",
  too_similar: "이미 비슷함",
  too_plain: "너무 평범함",
  too_bold: "너무 튐",
  wrong_condition: "조건 불일치",
};
const comparisonWaitLabel = (comparison: Comparison) => {
  if (comparison.ineligibleReason === "ranking_unchanged")
    return "피드백 보정 후에도 상위 순서가 같아 비교 대상에서 제외했습니다.";
  if (comparison.ineligibleReason === "insufficient_candidates")
    return "비교할 추천 후보가 부족합니다.";
  return `피드백 비교 대기 중 · 유효 피드백 ${comparison.feedback?.actionableTotal ?? 0}/3건`;
};
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "요청에 실패했습니다.");
  return result as T;
}
export function AdminAgentPageClient() {
  const [items, setItems] = useState<Item[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0);
  const [status, setStatus] = useState(""),
    [unreviewed, setUnreviewed] = useState(false),
    [revision, setRevision] = useState(0);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null),
    [review, setReview] = useState<Review>(initialReview),
    [comparisonReview, setComparisonReview] = useState<ComparisonReview>(
      initialComparisonReview
    );
  const [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const selection = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<{ data: { items: Item[]; total: number; insights: Insights } }>(
      `/api/admin/agent?page=${page}&status=${status}&unreviewed=${unreviewed}`,
      { signal: controller.signal }
    )
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
        setInsights(data.insights);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setItems([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, status, unreviewed, revision]);
  async function open(id: string) {
    const token = ++selection.current;
    setDetail(null);
    setError("");
    setNotice("");
    try {
      const { data } = await api<{ data: Detail }>(`/api/admin/agent?id=${id}`);
      if (token !== selection.current) return;
      setDetail(data);
      setReview(data.review || { ...initialReview });
      setComparisonReview(
        data.comparison?.review || { ...initialComparisonReview }
      );
    } catch (err) {
      if (token === selection.current) setError((err as Error).message);
    }
  }
  async function save() {
    if (!detail) return;
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: detail.id, ...review }),
      });
      setNotice("검수를 저장했습니다.");
      setRevision((value) => value + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function saveComparison() {
    if (!detail?.comparison?.eligible) return;
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comparison_review",
          id: detail.id,
          ...comparisonReview,
        }),
      });
      await open(detail.id);
      setNotice("블라인드 비교 평가를 저장했습니다.");
      setRevision((value) => value + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const messages = detail?.response?.messages || [];
  const events = detail?.execution?.events || [];
  const algorithm = eventData(events, "algorithm");
  const taste = eventData(events, "taste");
  const confidence = taste?.confidence as Record<string, unknown> | undefined;
  const ranking = eventData(events, "ranking");
  const funnel = events
    .filter((event) => event.stage === "candidate_funnel")
    .map((event) => event.data as Record<string, unknown>);
  const elapsed = items.filter((item) => item.duration_ms !== null);
  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-[var(--app-main-pt)] text-white">
      <Link href="/admin" className="text-sm text-orange-300">
        ← 관리자 홈 / 로그인
      </Link>
      <div className="my-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">에이전트 운영</h1>
          <p className="mt-2 text-sm text-gray-400">
            질문과 실제 응답을 확인하고 품질 검수를 남깁니다. 과거 기록에는 실행
            진단이 없을 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setRevision((value) => value + 1)}
          className="rounded-lg border border-white/20 p-3"
        >
          새로고침
        </button>
      </div>
      <div className="mb-5 rounded-xl bg-white/5 p-4 text-sm text-gray-300">
        조건에 맞는 요청 {total}건 · 현재 페이지 완료{" "}
        {items.filter((item) => item.status === "completed").length}/
        {items.length}건 · 현재 페이지 평균 응답{" "}
        {elapsed.length
          ? `${Math.round(elapsed.reduce((sum, item) => sum + item.duration_ms!, 0) / elapsed.length)}ms`
          : "미기록"}
      </div>
      {insights && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-gray-500">추천 카드 행동 · 전체</p>
            <p className="mt-1 text-sm">
              {insights.cardEvents.available
                ? `노출 ${insights.cardEvents.impressions} · 클릭 ${insights.cardEvents.clicks} · 저장 ${insights.cardEvents.saves}`
                : "이벤트 집계를 불러오지 못했습니다."}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-gray-500">수집 피드백</p>
            <p className="mt-1 text-lg font-semibold">
              {insights.feedback.total}건
            </p>
            <p className="text-xs text-gray-400">
              긍정 {insights.feedback.positive} · 부정{" "}
              {insights.feedback.negative}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-gray-500">주요 부정 이유</p>
            <p className="mt-1 text-sm">
              {Object.entries(insights.feedback.reasons)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(
                  ([reason, count]) =>
                    `${feedbackReasonLabel[reason] || reason} ${count}`
                )
                .join(" · ") || "아직 없음"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-gray-500">비교 평가</p>
            <p className="mt-1 text-lg font-semibold">
              {insights.comparisons.reviewed}/{insights.comparisons.eligible}건
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-gray-500">블라인드 선호</p>
            <p className="mt-1 text-sm">
              평균 {insights.comparisons.wins.baseline} · 피드백{" "}
              {insights.comparisons.wins.feedback} · 동률{" "}
              {insights.comparisons.wins.tie}
            </p>
          </div>
        </div>
      )}
      <div className="mb-5 flex gap-4">
        <label>
          상태{" "}
          <select
            className="rounded bg-gray-900 p-2"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
          >
            <option value="">전체</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
            <option value="pending">처리 중</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={unreviewed}
            onChange={(event) => {
              setUnreviewed(event.target.checked);
              setPage(0);
            }}
          />
          미검수만
        </label>
      </div>
      {error && (
        <p role="alert" className="my-4 text-orange-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="my-4 text-green-300">
          {notice}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_2fr]">
        <section aria-label="질문 목록">
          <div className="space-y-2">
            {loading && <p role="status">불러오는 중…</p>}
            {!loading && !items.length && (
              <p className="p-5 text-gray-400">표시할 요청이 없습니다.</p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => void open(item.id)}
                className={`w-full rounded-xl border p-4 text-left ${detail?.id === item.id ? "border-orange-400 bg-orange-400/10" : "border-white/10 bg-white/5"}`}
              >
                <p className="line-clamp-3 text-sm">{item.question}</p>
                <p className="mt-3 text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleString("ko-KR")} ·{" "}
                  {statusLabel[item.status]} ·{" "}
                  {item.reviewed ? "검수 완료" : "미검수"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  추천 {item.productCount ?? "—"}개 ·{" "}
                  {item.model || "모델 미기록"}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button
              disabled={page === 0 || loading}
              className="p-2 disabled:opacity-30"
              onClick={() => setPage((value) => value - 1)}
            >
              이전
            </button>
            <span className="p-2">{page + 1} 페이지</span>
            <button
              disabled={(page + 1) * 30 >= total || loading}
              className="p-2 disabled:opacity-30"
              onClick={() => setPage((value) => value + 1)}
            >
              다음
            </button>
          </div>
        </section>
        <section className="min-w-0 rounded-xl border border-white/10 p-5">
          {!detail ? (
            <p className="text-gray-400">
              질문을 선택하면 실제 답변과 추천 결과를 확인할 수 있습니다.
            </p>
          ) : (
            <>
              <h2 className="text-lg font-semibold">
                {detail.question ||
                  messages.find((message) => message.role === "user")?.text ||
                  "질문 원문 미기록"}
              </h2>
              <p className="my-3 text-xs text-gray-400">
                {statusLabel[detail.status]} · {detail.duration_ms ?? "—"}ms ·{" "}
                {detail.execution?.version || "실행 버전 미기록"}
              </p>
              {detail.error_code && (
                <p className="my-3 text-red-300">오류: {detail.error_code}</p>
              )}
              {messages
                .filter((message) => message.role === "assistant")
                .map((message) => (
                  <article key={message.id}>
                    <AgentResultInsight message={message} />
                    <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {message.products?.map((product, index) => (
                        <div
                          key={product.id}
                          className="rounded-xl border border-white/10 p-2"
                        >
                          <Link
                            target="_blank"
                            href={getProductPageUrl(product)}
                          >
                            <div className="relative aspect-square">
                              <ProgressiveImage
                                src={product.image}
                                alt={product.name}
                                className="object-contain"
                              />
                            </div>
                            <p className="mt-2 text-xs text-gray-400">
                              {index + 1}. {product.brand}
                            </p>
                            <p className="mt-1 text-sm">{product.name}</p>
                          </Link>
                          <p className="my-2 text-xs text-orange-300">
                            취향 점수 {product.tasteScore ?? "미기록"}
                          </p>
                          <p className="text-xs leading-5 text-gray-400">
                            {product.reasons.join(" ")}
                          </p>
                        </div>
                      ))}
                    </div>
                    {!!message.notes?.length && (
                      <details className="my-4 text-xs text-gray-400">
                        <summary className="cursor-pointer py-2">
                          분석 기준 보기
                        </summary>
                        {message.notes.map((note, index) => (
                          <p className="text-xs text-gray-400" key={index}>
                            {note}
                          </p>
                        ))}
                      </details>
                    )}
                  </article>
                ))}
              {!messages.length && (
                <p className="my-4 text-gray-400">저장된 응답이 없습니다.</p>
              )}
              {detail.comparison?.eligible && (
                <section className="my-6 border-t border-white/10 pt-5">
                  <h3 className="font-semibold">추천 방식 블라인드 비교</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    동일한 질문·후보·필수 조건에서 순위만 다르게 계산했습니다.
                    저장 전에는 어느 쪽이 평균 방식인지 공개하지 않습니다. 상위
                    5개 중 {detail.comparison.changedPositions}개 위치가
                    달라졌습니다.
                  </p>
                  <div className="mt-4 grid gap-5 xl:grid-cols-2">
                    {(["A", "B"] as const).map((label) => {
                      const key = label === "A" ? "optionA" : "optionB";
                      const products = detail.comparison?.[key] || [];
                      return (
                        <div
                          key={label}
                          className="rounded-xl border border-white/10 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">결과 {label}</h4>
                            {detail.comparison?.reveal && (
                              <span className="text-xs text-orange-300">
                                {detail.comparison.reveal[key] === "feedback"
                                  ? "피드백 보정 방식"
                                  : "평균 취향 방식"}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
                            {products.map((product, index) => (
                              <Link
                                key={product.id}
                                target="_blank"
                                href={getProductPageUrl(product)}
                                className="rounded-lg bg-white/5 p-2"
                              >
                                <div className="relative aspect-square">
                                  <ProgressiveImage
                                    src={product.image}
                                    alt={product.name}
                                    className="object-contain"
                                  />
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs">
                                  {index + 1}. {product.brand} {product.name}
                                </p>
                                <p className="mt-1 line-clamp-3 text-[11px] leading-4 text-gray-500">
                                  {product.reasons.join(" ")}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <form
                    className="mt-4 space-y-4 rounded-xl bg-white/5 p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveComparison();
                    }}
                  >
                    <label className="block text-sm">
                      더 나은 결과{" "}
                      <select
                        className="rounded bg-gray-900 p-2"
                        value={comparisonReview.preferredOption}
                        onChange={(event) =>
                          setComparisonReview({
                            ...comparisonReview,
                            preferredOption: event.target.value as
                              "a" | "b" | "tie",
                          })
                        }
                      >
                        <option value="a">A</option>
                        <option value="b">B</option>
                        <option value="tie">비슷함</option>
                      </select>
                    </label>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead className="text-left text-xs text-gray-500">
                          <tr>
                            <th className="p-2">평가 항목</th>
                            <th className="p-2">A</th>
                            <th className="p-2">B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            [
                              ["taste", "취향 적합성"],
                              ["conditions", "조건 준수"],
                              ["diversity", "다양성·새로움"],
                              ["explanation", "설명 납득도"],
                            ] as const
                          ).map(([key, label]) => (
                            <tr key={key} className="border-t border-white/5">
                              <td className="p-2">{label}</td>
                              {(["A", "B"] as const).map((option) => {
                                const field =
                                  `${key}${option}` as keyof ComparisonReview;
                                return (
                                  <td className="p-2" key={option}>
                                    <select
                                      aria-label={`${label} ${option}`}
                                      className="rounded bg-gray-900 p-2"
                                      value={comparisonReview[field] as number}
                                      onChange={(event) =>
                                        setComparisonReview({
                                          ...comparisonReview,
                                          [field]: Number(event.target.value),
                                        })
                                      }
                                    >
                                      {[1, 2, 3, 4, 5].map((score) => (
                                        <option value={score} key={score}>
                                          {score}점
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <textarea
                      aria-label="블라인드 비교 메모"
                      maxLength={1000}
                      placeholder="두 결과에서 눈에 띈 차이"
                      className="min-h-20 w-full rounded-lg bg-gray-900 p-3 text-sm"
                      value={comparisonReview.note}
                      onChange={(event) =>
                        setComparisonReview({
                          ...comparisonReview,
                          note: event.target.value,
                        })
                      }
                    />
                    <button
                      disabled={saving}
                      className="rounded-lg bg-orange-500 px-4 py-3 font-semibold text-black disabled:opacity-40"
                    >
                      {saving ? "저장 중…" : "블라인드 평가 저장"}
                    </button>
                  </form>
                </section>
              )}
              {detail.comparison && !detail.comparison.eligible && (
                <p className="my-5 rounded-lg border border-white/10 p-3 text-xs text-gray-400">
                  {comparisonWaitLabel(detail.comparison)}
                </p>
              )}
              {detail.execution && (
                <section className="my-6 border-t border-white/10 pt-5">
                  <h3 className="font-semibold">추천 실행 진단</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-gray-500">랭킹 버전</p>
                      <p className="mt-1 break-words text-sm">
                        {String(
                          algorithm?.ranking ||
                            ranking?.algorithmVersion ||
                            "미기록"
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-gray-500">취향 신뢰도</p>
                      <p className="mt-1 text-sm">
                        {percent(confidence?.confidence)} ·{" "}
                        {String(confidence?.level || "미기록")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-gray-500">분석 가능한 상품</p>
                      <p className="mt-1 text-sm">
                        {confidence
                          ? `${String(confidence.analyzedCount)} / ${String(confidence.totalCount)}`
                          : "미기록"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-gray-500">최종 노출</p>
                      <p className="mt-1 text-sm">
                        {ranking?.displayedCount === undefined
                          ? "미기록"
                          : `${String(ranking.displayedCount)}개`}
                      </p>
                    </div>
                  </div>
                  {funnel.length > 0 && (
                    <div className="mt-3 rounded-lg border border-white/10 p-3">
                      <p className="text-xs font-semibold text-gray-300">
                        후보 흐름
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        {funnel.map((entry, index) => (
                          <span key={`${String(entry.stage)}-${index}`}>
                            {index > 0 && <span className="mr-2">→</span>}
                            {String(entry.stage)} {String(entry.count)}개
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {confidence && (
                    <p className="mt-3 text-xs leading-5 text-gray-400">
                      분석 비율 {percent(confidence.analyzableRatio)} · 축
                      일관성 {percent(confidence.axisConsistency)} · 카테고리
                      범위 {String(confidence.categoryCount ?? "—")}개
                    </p>
                  )}
                </section>
              )}
              <details className="my-5">
                <summary className="cursor-pointer text-sm text-orange-200">
                  해석·취향·후보 및 순위 진단
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded bg-black/30 p-3 text-xs">
                  {JSON.stringify(
                    detail.execution || "과거 요청 또는 진단 미수집",
                    null,
                    2
                  )}
                </pre>
              </details>
              <details className="my-5">
                <summary className="cursor-pointer text-sm">
                  사용자 추천 피드백
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {JSON.stringify(
                    detail.feedback ?? "피드백 조회 불가",
                    null,
                    2
                  )}
                </pre>
              </details>
              <details className="my-5">
                <summary className="cursor-pointer text-sm">
                  추천 카드 노출·클릭·저장
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {JSON.stringify(
                    detail.cardEvents ?? "이벤트 조회 불가",
                    null,
                    2
                  )}
                </pre>
              </details>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
                className="mt-6 space-y-4 border-t border-white/10 pt-5"
              >
                <h3 className="font-semibold">관리자 검수</h3>
                <p className="text-xs text-gray-400">
                  개인 취향 적합성은 참고 평가입니다. 사용자 본인의 피드백과
                  함께 판단해 주세요.
                </p>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      ["taste", "취향 적합성"],
                      ["explanation", "설명 정확성"],
                      ["conditions", "조건 준수"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm">
                      {label}{" "}
                      <select
                        className="rounded bg-gray-900 p-2"
                        value={review[key]}
                        onChange={(event) =>
                          setReview({
                            ...review,
                            [key]: Number(event.target.value),
                          })
                        }
                      >
                        {[1, 2, 3, 4, 5].map((score) => (
                          <option key={score} value={score}>
                            {score}점
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <label className="block text-sm">
                  문제 단계{" "}
                  <select
                    className="rounded bg-gray-900 p-2"
                    value={review.issue}
                    onChange={(event) =>
                      setReview({ ...review, issue: event.target.value })
                    }
                  >
                    {Object.entries({
                      none: "문제 없음",
                      intent: "질문 해석",
                      retrieval: "후보 검색",
                      ranking: "추천 순위",
                      explanation: "설명",
                      error: "실행 오류",
                    }).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <textarea
                  aria-label="검수 메모"
                  placeholder="구체적인 문제 또는 개선 제안"
                  maxLength={1000}
                  className="min-h-24 w-full rounded-lg bg-gray-900 p-3 text-sm"
                  value={review.note}
                  onChange={(event) =>
                    setReview({ ...review, note: event.target.value })
                  }
                />
                <button
                  disabled={saving}
                  className="rounded-lg bg-orange-500 px-4 py-3 font-semibold text-black disabled:opacity-40"
                >
                  {saving ? "저장 중…" : "검수 저장"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
