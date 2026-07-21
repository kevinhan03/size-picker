"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircleMore, Plus, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchOutfitRequests } from "../../api/outfits";
import { useAuthContext } from "../../contexts/AuthContext";
import type { OutfitRequestMineStatus, OutfitRequestScope, OutfitRequestSummary } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { PageState } from "../PageState";

type HubScope = Extract<OutfitRequestScope, "open" | "mine" | "proposed">;
type CachedRequestList = { requests: OutfitRequestSummary[]; total: number };

function getRequestCacheKey(scope: HubScope, mineStatus: OutfitRequestMineStatus) {
  return `${scope}:${scope === "mine" ? mineStatus : "all"}`;
}

const tabs: Array<{ value: HubScope; label: string }> = [
  { value: "open", label: "코디 도와주기" },
  { value: "mine", label: "내 요청" },
  { value: "proposed", label: "내 제안" },
];

const mineStatusTabs: Array<{ value: OutfitRequestMineStatus; label: string }> = [
  { value: "all", label: "전체" },
  { value: "open", label: "진행 중" },
  { value: "accepted", label: "채택 완료" },
  { value: "closed", label: "종료" },
];

const mineEmptyStates: Record<OutfitRequestMineStatus, { title: string; description: string; ctaLabel?: string }> = {
  all: {
    title: "아직 작성한 코디 요청이 없습니다",
    description: "코디가 필요한 상황을 작성하면 다른 사용자가 Closet의 상품으로 조합을 제안합니다.",
    ctaLabel: "첫 코디 요청 작성",
  },
  open: {
    title: "진행 중인 요청이 없습니다",
    description: "새 요청을 작성하면 다른 사용자의 코디 제안을 받을 수 있습니다.",
    ctaLabel: "새 요청 작성",
  },
  accepted: {
    title: "아직 채택한 코디가 없습니다",
    description: "진행 중인 요청에서 마음에 드는 제안을 채택하면 이곳에 표시됩니다.",
  },
  closed: {
    title: "종료한 요청이 없습니다",
    description: "코디를 채택하지 않고 종료한 요청이 이곳에 표시됩니다.",
  },
};

const proposedEmptyState = {
  title: "아직 제안한 코디가 없어요",
  description: "다른 회원의 코디 고민을 보고, 나만의 조합을 제안해보세요.",
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "방금 전";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  return `${Math.floor(seconds / 86400)}일 전`;
}

export function OutfitsPageClient({ initialScope = "open" }: { initialScope?: HubScope }) {
  const router = useRouter();
  const { authUser, isAuthLoading } = useAuthContext();
  const authUserId = authUser?.id;
  const [scope, setScope] = useState<HubScope>(initialScope);
  const [mineStatus, setMineStatus] = useState<OutfitRequestMineStatus>("all");
  const [requests, setRequests] = useState<OutfitRequestSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const loadSequenceRef = useRef(0);
  const requestCacheRef = useRef(new Map<string, CachedRequestList>());
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const [hasMoreStatusFilters, setHasMoreStatusFilters] = useState(false);

  const updateStatusFilterHint = useCallback(() => {
    const element = statusFilterRef.current;
    if (!element) return;
    setHasMoreStatusFilters(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }, []);

  const load = useCallback(async (nextScope: HubScope, nextMineStatus: OutfitRequestMineStatus, offset = 0) => {
    const loadSequence = ++loadSequenceRef.current;
    if (offset === 0) {
      setLoading(true);
      setLoadingMore(false);
    }
    else setLoadingMore(true);
    setError("");
    try {
      const data = await fetchOutfitRequests(nextScope, offset, nextScope === "mine" ? nextMineStatus : "all");
      if (loadSequence !== loadSequenceRef.current) return;
      const cacheKey = getRequestCacheKey(nextScope, nextMineStatus);
      setRequests((current) => {
        const nextRequests = offset === 0 ? data.requests : [...current, ...data.requests];
        requestCacheRef.current.set(cacheKey, { requests: nextRequests, total: data.total });
        return nextRequests;
      });
      setTotal(data.total);
    } catch (loadError) {
      if (loadSequence !== loadSequenceRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "코디 요청을 불러오지 못했습니다.");
    } finally {
      if (loadSequence === loadSequenceRef.current) {
        setLoading(false);
        setLoadingMore(false);
        setHasCompletedInitialLoad(true);
      }
    }
  }, []);

  function selectScope(nextScope: HubScope) {
    if (nextScope === scope) return;
    const cached = requestCacheRef.current.get(getRequestCacheKey(nextScope, mineStatus));
    if (cached) {
      setRequests(cached.requests);
      setTotal(cached.total);
    }
    setLoading(true);
    setScope(nextScope);
  }

  function selectMineStatus(nextStatus: OutfitRequestMineStatus) {
    if (nextStatus === mineStatus) return;
    const cached = requestCacheRef.current.get(getRequestCacheKey("mine", nextStatus));
    if (cached) {
      setRequests(cached.requests);
      setTotal(cached.total);
    }
    setLoading(true);
    setMineStatus(nextStatus);
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!authUserId) {
      router.replace(buildLoginHref("login", "/outfits"));
      return;
    }
    captureEvent("outfit_hub_viewed", { scope, mine_status: scope === "mine" ? mineStatus : undefined });
    void load(scope, mineStatus);
  }, [authUserId, isAuthLoading, load, mineStatus, router, scope]);

  useEffect(() => {
    if (scope !== "mine") {
      setHasMoreStatusFilters(false);
      return;
    }

    const element = statusFilterRef.current;
    if (!element) return;

    updateStatusFilterHint();
    const resizeObserver = new ResizeObserver(updateStatusFilterHint);
    resizeObserver.observe(element);
    element.addEventListener("scroll", updateStatusFilterHint, { passive: true });
    return () => {
      resizeObserver.disconnect();
      element.removeEventListener("scroll", updateStatusFilterHint);
    };
  }, [scope, updateStatusFilterHint]);

  if (isAuthLoading || (!authUser && !error)) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title="코디 요청을 준비하고 있어요" description="요청과 제안 상태를 불러오는 중입니다." /></main>;
  }

  const emptyState = scope === "open"
    ? {
        title: "현재 코디를 기다리는 요청이 없습니다",
        description: "새로운 요청이 등록되면 이곳에서 코디를 제안할 수 있습니다.",
      }
    : scope === "proposed"
      ? proposedEmptyState
      : mineEmptyStates[mineStatus];
  const isRefreshing = loading && hasCompletedInitialLoad;

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white">
      <div className="mx-auto max-w-5xl">
        <section className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-orange-400"><Shirt className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.2em]">Style together</span></div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">서로의 취향으로 코디를 만드는 곳</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">코디 고민을 올리거나, 다른 회원의 옷으로 새로운 조합을 제안해보세요.</p>
          </div>
          <button onClick={() => router.push("/outfits/new")} className="outfit-pressable outfit-primary-action flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition-[background-color,transform] duration-150">
            <Plus className="h-4 w-4" /> 코디 요청하기
          </button>
        </section>

        <div className="mt-4 grid grid-cols-3 gap-1 border-b border-white/[0.08]">
          {tabs.map((tab) => (
            <button key={tab.value} type="button" aria-pressed={scope === tab.value} onClick={() => selectScope(tab.value)} className={`outfit-pressable outfit-tab min-h-11 border-b-2 px-4 py-2 text-sm font-black transition-[border-color,color,transform] duration-150 ${scope === tab.value ? "border-orange-400 text-orange-200" : "border-transparent text-white/45"}`}>{tab.label}</button>
          ))}
        </div>

        {scope === "mine" && (
          <div className="relative mt-4">
            <div ref={statusFilterRef} aria-label="내 요청 상태 필터" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mineStatusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={mineStatus === tab.value}
                  onClick={() => selectMineStatus(tab.value)}
                  className={`outfit-pressable outfit-status-tab min-h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-xs font-bold transition-[background-color,border-color,color,transform] duration-150 ${
                    mineStatus === tab.value
                      ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                      : "border-white/10 bg-white/[0.035] text-white/45"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {hasMoreStatusFilters && <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black via-black/85 to-transparent" />}
          </div>
        )}

        {error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}<button onClick={() => void load(scope, mineStatus)} className="ml-3 font-bold underline">다시 시도</button></div>}
        <div className="min-h-[28rem]" aria-busy={loading}>
        {isRefreshing && <p role="status" className="mb-3 text-xs font-semibold text-white/55">새 코디 요청을 불러오는 중이에요.</p>}
        <div className={isRefreshing ? "pointer-events-none select-none opacity-45 transition-opacity duration-150" : "transition-opacity duration-150"} inert={isRefreshing} aria-hidden={isRefreshing}>
        {loading && !hasCompletedInitialLoad ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2" aria-label="코디 요청을 불러오는 중">
            {["first", "second", "third", "fourth"].map((key) => (
              <div key={key} className="h-72 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="h-3 w-20 rounded-full bg-white/[0.07]" />
                <div className="mt-5 h-4 w-full rounded-full bg-white/[0.055]" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-white/[0.045]" />
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {["one", "two", "three", "four"].map((imageKey) => <div key={imageKey} className="aspect-square rounded-xl bg-white/[0.05]" />)}
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center">
            <Shirt className="mx-auto h-10 w-10 text-white/25" />
            <h2 className="mt-5 text-lg font-bold">{emptyState.title}</h2>
            <p className="mt-2 text-sm text-white/45">{emptyState.description}</p>
            {scope === "mine" && mineEmptyStates[mineStatus].ctaLabel && (
              <button onClick={() => router.push("/outfits/new")} className="outfit-pressable outfit-primary-action mt-6 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition-[background-color,transform] duration-150">
                {mineEmptyStates[mineStatus].ctaLabel}
              </button>
            )}
            {scope === "proposed" && (
              <button onClick={() => selectScope("open")} className="outfit-pressable outfit-primary-action mt-6 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition-[background-color,transform] duration-150">
                코디 도와주기
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {requests.map((item) => {
              const isProposalRequest = scope === "open";
              const isMyProposal = scope === "proposed";
              const showProposalCount = isProposalRequest || item.status === "open";
              const cardActionLabel = isProposalRequest ? "코디 도와주기" : isMyProposal ? "제안 상세 보기" : "요청 상세 보기";
              const proposalStatus = item.isAccepted ? "내 코디가 선택됐어요" : item.status === "open" ? "제안 대기 중" : "요청 종료";
              const source = scope === "mine" ? "?from=mine" : isMyProposal ? "?from=proposed" : "";
              return (
              <button key={item.id} onClick={() => router.push(`/outfits/${item.id}${source}`)} className={`outfit-pressable outfit-request-card group overflow-hidden rounded-2xl border p-4 text-left transition-[background-color,border-color,transform] duration-150 sm:p-5 ${isMyProposal && item.isAccepted ? "border-orange-500/30 bg-orange-500/[0.055]" : "border-white/[0.08] bg-[#111114]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold text-orange-400">{item.authorUsername}<span className="ml-1.5 font-medium text-white/35">· {relativeTime(isMyProposal ? item.proposedAt || item.createdAt : item.createdAt)}</span></p>
                  {isMyProposal ? (
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${item.isAccepted ? "border-orange-500/30 bg-orange-500/15 text-orange-200" : item.status === "open" ? "border-white/[0.1] bg-white/[0.04] text-white/60" : "border-white/[0.08] bg-white/[0.03] text-white/55"}`}>{proposalStatus}</span>
                  ) : showProposalCount ? (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-white/55"><MessageCircleMore className="h-3.5 w-3.5" />제안 {item.proposalCount}</span>
                  ) : (
                    <span className={`rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] font-bold ${item.status === "open" ? "bg-emerald-500/10 text-emerald-300/75" : "bg-white/[0.04] text-white/45"}`}>{item.status === "open" ? "진행 중" : item.status === "accepted" ? "채택 완료" : "종료"}</span>
                  )}
                </div>
                <div className="outfit-request-copy mt-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-black tracking-[0.06em] text-orange-300">
                    <MessageCircleMore className="h-3.5 w-3.5" />
                    <span>코디 고민</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-base font-semibold leading-7 tracking-[-0.01em] text-white sm:text-[17px]">{item.description}</p>
                  <div className="mt-6 flex items-center justify-end gap-1.5 border-t border-white/[0.08] pt-4 text-xs font-bold text-white/60">{cardActionLabel} <ArrowRight className="outfit-request-card-arrow h-3.5 w-3.5 transition-transform duration-150" /></div>
                </div>
              </button>
              );
            })}
          </div>
        )}
        </div>
        {requests.length < total && <div className="mt-8 flex justify-center"><button disabled={loading || loadingMore} onClick={() => void load(scope, mineStatus, requests.length)} className="rounded-xl border border-white/15 px-6 py-3 text-sm font-bold text-white/70 hover:border-white/30 disabled:opacity-50">{loadingMore ? "불러오는 중..." : "더 보기"}</button></div>}
        </div>
      </div>
    </main>
  );
}
