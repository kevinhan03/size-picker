"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircleMore, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchOutfitRequests } from "../../api/outfits";
import { useAuthContext } from "../../contexts/AuthContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { MessageKey } from "../../i18n/messages";
import type { OutfitRequestMineStatus, OutfitRequestScope, OutfitRequestSummary } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { OutfitLoadingState } from "../outfits/OutfitLoadingState";

type HubScope = Extract<OutfitRequestScope, "open" | "mine" | "proposed">;
type CachedRequestList = { requests: OutfitRequestSummary[]; total: number; nextCursor: string | null };
const outfitListCache = new Map<string, CachedRequestList>();
let outfitCacheOwnerId: string | null | undefined;

function getRequestCacheKey(scope: HubScope, mineStatus: OutfitRequestMineStatus) {
  return `${scope}:${scope === "mine" ? mineStatus : "all"}`;
}

const tabs: Array<{ value: HubScope; label: string }> = [
  { value: "open", label: "요청 둘러보기" },
  { value: "mine", label: "내 요청" },
  { value: "proposed", label: "내 제안" },
];

const mineStatusTabs: Array<{ value: OutfitRequestMineStatus }> = [
  { value: "all" },
  { value: "open" },
  { value: "accepted" },
  { value: "closed" },
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

function relativeTime(value: string, t: (key: MessageKey, values?: Record<string, string | number>) => string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return t("time.justNow");
  if (seconds < 3600) return t("time.minutesAgo", { count: Math.floor(seconds / 60) });
  if (seconds < 86400) return t("time.hoursAgo", { count: Math.floor(seconds / 3600) });
  return t("time.daysAgo", { count: Math.floor(seconds / 86400) });
}

export function OutfitsPageClient({ initialScope, initialData = null }: { initialScope?: HubScope; initialData?: { requests: OutfitRequestSummary[]; total: number; nextCursor: string | null } | null }) {
  const router = useRouter();
  const { authUser, isAuthLoading } = useAuthContext();
  const { t } = useLocaleContext();
  const tRef = useRef(t);
  tRef.current = t;
  const authUserId = authUser?.id;
  const isGuest = !authUserId;
  const [scope, setScope] = useState<HubScope>(() => {
    if (initialScope) return initialScope;
    if (typeof window === "undefined") return "open";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "mine" || tab === "proposed" ? tab : "open";
  });
  const [mineStatus, setMineStatus] = useState<OutfitRequestMineStatus>("all");
  const [requests, setRequests] = useState<OutfitRequestSummary[]>(initialData?.requests || []);
  const [total, setTotal] = useState(initialData?.total || 0);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData?.nextCursor || null);
  const [loading, setLoading] = useState(!initialData);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(Boolean(initialData));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const loadSequenceRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const requestCacheRef = useRef(outfitListCache);
  const usedInitialDataRef = useRef(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const [hasMoreStatusFilters, setHasMoreStatusFilters] = useState(false);

  const updateStatusFilterHint = useCallback(() => {
    const element = statusFilterRef.current;
    if (!element) return;
    setHasMoreStatusFilters(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }, []);

  const load = useCallback(async (nextScope: HubScope, nextMineStatus: OutfitRequestMineStatus, cursor: string | null = null) => {
    const loadSequence = ++loadSequenceRef.current;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    if (!cursor) {
      setLoading(true);
      setLoadingMore(false);
    }
    else setLoadingMore(true);
    setError("");
    try {
      const data = await fetchOutfitRequests(nextScope, cursor, nextScope === "mine" ? nextMineStatus : "all", controller.signal);
      if (loadSequence !== loadSequenceRef.current) return;
      const cacheKey = getRequestCacheKey(nextScope, nextMineStatus);
      setRequests((current) => {
        const nextRequests = !cursor ? data.requests : [...current, ...data.requests];
        requestCacheRef.current.set(cacheKey, { requests: nextRequests, total: data.total, nextCursor: data.nextCursor });
        return nextRequests;
      });
      setTotal(data.total);
      setNextCursor(data.nextCursor);
    } catch (loadError) {
      if (loadSequence !== loadSequenceRef.current) return;
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : tRef.current("outfits.detail.loadError"));
    } finally {
      if (loadSequence === loadSequenceRef.current) {
        setLoading(false);
        setLoadingMore(false);
        setHasCompletedInitialLoad(true);
      }
    }
  }, []);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  useEffect(() => {
    if (outfitCacheOwnerId !== undefined && outfitCacheOwnerId !== (authUserId || null)) outfitListCache.clear();
    outfitCacheOwnerId = authUserId || null;
  }, [authUserId]);

  function selectScope(nextScope: HubScope) {
    if (nextScope === scope) return;
    if (isGuest && nextScope !== "open") {
      router.push(buildLoginHref("login", `/outfits?tab=${nextScope}`));
      return;
    }
    const cached = requestCacheRef.current.get(getRequestCacheKey(nextScope, mineStatus));
    if (cached) {
      setRequests(cached.requests);
      setTotal(cached.total);
      setNextCursor(cached.nextCursor);
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
      setNextCursor(cached.nextCursor);
    }
    setLoading(true);
    setMineStatus(nextStatus);
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!authUserId && scope !== "open") {
      setScope("open");
      return;
    }
    if (!usedInitialDataRef.current && initialData) {
      usedInitialDataRef.current = true;
      requestCacheRef.current.set(getRequestCacheKey(initialScope || "open", "all"), { requests: initialData.requests, total: initialData.total, nextCursor: initialData.nextCursor });
      setLoading(false);
      setHasCompletedInitialLoad(true);
      return;
    }
    captureEvent("outfit_hub_viewed", { scope, mine_status: scope === "mine" ? mineStatus : undefined });
    void load(scope, mineStatus);
  }, [authUserId, initialData, initialScope, isAuthLoading, load, mineStatus, router, scope]);

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

  if (isAuthLoading) {
    return <OutfitLoadingState variant="list" title={t("outfits.loading")} description={t("outfits.loadingDescription")} />;
  }

  const startRequest = () => {
    if (!authUserId) {
      router.push(buildLoginHref("login", "/outfits/new"));
      return;
    }
    router.push("/outfits/new");
  };

  const emptyState = scope === "open"
    ? { title: t("outfits.empty.open.title"), description: t("outfits.empty.open.description") }
    : scope === "proposed"
      ? { title: t("outfits.empty.proposed.title"), description: t("outfits.empty.proposed.description") }
      : mineEmptyStates[mineStatus];
  const isRefreshing = loading && hasCompletedInitialLoad;

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-[70rem]">
        <div className="flex items-end gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-3 gap-1 border-b border-white/[0.08]">
            {tabs.map((tab) => (
              <button key={tab.value} type="button" aria-pressed={scope === tab.value} onClick={() => selectScope(tab.value)} className={`outfit-pressable outfit-tab min-h-11 border-b-2 px-1 py-2 text-[13px] font-black tracking-[-0.015em] transition-[border-color,color,transform] duration-150 sm:px-4 sm:text-sm ${scope === tab.value ? "border-orange-400 text-orange-200" : "border-transparent text-white/45"}`}>{tab.label}</button>
            ))}
          </div>
          <button type="button" onClick={startRequest} aria-label="코디 요청하기" className="outfit-pressable outfit-primary-action inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 px-3.5 text-sm font-black text-black transition-[background-color,transform] duration-150">요청</button>
        </div>

        {scope === "mine" && (
          <div className="relative mt-4">
            <div ref={statusFilterRef} aria-label={t("outfits.filterAria")} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  {tab.value === "all" ? t("outfits.status.all") : tab.value === "open" ? t("outfits.status.open") : tab.value === "accepted" ? t("outfits.status.accepted") : t("outfits.status.closed")}
                </button>
              ))}
            </div>
            {hasMoreStatusFilters && <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black via-black/85 to-transparent" />}
          </div>
        )}

        {error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}<button onClick={() => void load(scope, mineStatus)} className="ml-3 font-bold underline">{t("common.retry")}</button></div>}
        <div className="min-h-[22rem]" aria-busy={loading}>
        <div className={isRefreshing ? "pointer-events-none select-none opacity-45 transition-opacity duration-150" : "transition-opacity duration-150"} inert={isRefreshing} aria-hidden={isRefreshing}>
        {loading && !hasCompletedInitialLoad ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2" aria-label={t("outfits.listLoadingAria")}>
            {["first", "second", "third", "fourth"].map((key) => (
              <div key={key} className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="h-3 w-24 rounded-full bg-white/[0.07]" />
                <div className="mt-4 h-5 w-3/4 rounded-full bg-white/[0.055]" />
                <div className="mt-6 flex items-end justify-between"><div className="h-3 w-20 rounded-full bg-white/[0.045]" /><div className="h-9 w-28 rounded-xl bg-white/[0.06]" /></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center">
            <Shirt className="mx-auto h-10 w-10 text-white/25" />
            <h2 className="mt-5 text-lg font-bold">{emptyState.title}</h2>
            <p className="mt-2 text-sm text-white/45">{emptyState.description}</p>
            {scope === "mine" && mineEmptyStates[mineStatus].ctaLabel && (
              <button onClick={startRequest} className="outfit-pressable outfit-primary-action mt-6 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition-[background-color,transform] duration-150">
                {mineEmptyStates[mineStatus].ctaLabel}
              </button>
            )}
            {scope === "proposed" && (
              <button onClick={() => selectScope("open")} className="outfit-pressable outfit-primary-action mt-6 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition-[background-color,transform] duration-150">
                {t("outfits.tab.open")}
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {requests.map((item) => {
              const isProposalRequest = scope === "open";
              const isMyProposal = scope === "proposed";
              const showProposalCount = isProposalRequest || item.status === "open";
              const cardActionLabel = isProposalRequest ? t("outfits.card.propose") : isMyProposal ? t("outfits.card.proposalDetails") : t("outfits.card.requestDetails");
              const proposalStatus = item.isAccepted ? t("outfits.card.myOutfitAccepted") : item.status === "open" ? t("outfits.card.awaitingProposal") : t("outfits.card.requestClosed");
              const source = scope === "mine" ? "?from=mine" : isMyProposal ? "?from=proposed" : "";
              return (
              <button key={item.id} onClick={() => router.push(`/outfits/${item.id}${source}`)} className={`outfit-pressable outfit-request-card group overflow-hidden rounded-2xl border p-4 text-left transition-[background-color,border-color,transform] duration-150 sm:p-5 ${isMyProposal && item.isAccepted ? "border-orange-500/30 bg-orange-500/[0.055]" : "border-white/[0.08] bg-[#111114]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold text-white/60">{item.authorUsername}<span className="ml-1.5 font-medium text-white/35">· {relativeTime(isMyProposal ? item.proposedAt || item.createdAt : item.createdAt, t)}</span></p>
                  {isMyProposal ? (
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${item.isAccepted ? "border-orange-500/30 bg-orange-500/15 text-orange-200" : item.status === "open" ? "border-white/[0.1] bg-white/[0.04] text-white/60" : "border-white/[0.08] bg-white/[0.03] text-white/55"}`}>{proposalStatus}</span>
                  ) : !showProposalCount && (
                    <span className={`rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] font-bold ${item.status === "open" ? "bg-emerald-500/10 text-emerald-300/75" : "bg-white/[0.04] text-white/45"}`}>{item.status === "open" ? t("outfits.status.open") : item.status === "accepted" ? t("outfits.status.accepted") : t("outfits.status.closed")}</span>
                  )}
                </div>
                <div className="outfit-request-copy mt-4">
                  <p className="line-clamp-3 text-[15px] font-semibold leading-6 tracking-[-0.01em] text-white sm:text-base">{item.description}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 text-xs font-bold text-white/60">
                    {showProposalCount && !isMyProposal ? <span className="flex items-center gap-1.5"><MessageCircleMore className="h-3.5 w-3.5" />{t("outfits.card.proposals", { count: item.proposalCount })}</span> : <span />}
                    <span className="flex items-center gap-1.5">{cardActionLabel} <ArrowRight className="outfit-request-card-arrow h-3.5 w-3.5 transition-transform duration-150" /></span>
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        )}
        </div>
        {nextCursor && requests.length < total && <div className="mt-8 flex justify-center"><button disabled={loading || loadingMore} onClick={() => void load(scope, mineStatus, nextCursor)} className="rounded-xl border border-white/15 px-6 py-3 text-sm font-bold text-white/70 hover:border-white/30 disabled:opacity-50">{loadingMore ? t("outfits.loadingMore") : t("outfits.more")}</button></div>}
        </div>
      </div>
    </main>
  );
}
