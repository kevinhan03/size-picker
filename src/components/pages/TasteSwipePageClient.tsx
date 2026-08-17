"use client";
/* eslint-disable @next/next/no-img-element -- Storage transformation URLs are already optimized and need gesture-safe native images. */

import { type PointerEvent, type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Heart, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchDigMatchProducts, fetchDigMatchProfile, saveTasteSwipe } from "../../api/tasteMatch";
import { DEFAULT_PRODUCT_PLACEHOLDER } from "../../constants";
import { useAuthContext } from "../../contexts/AuthContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { captureEvent } from "../../utils/analytics";
import { buildTasteSwipeDeck, calculateTasteSwipeProfile, getDigMatchHighlights, getDigMatchRecommendations, getDigMatchTagLabel, parseDigMatchProfile, type DigMatchPresentation, type DigMatchProfile, type TasteSwipeAction } from "../../utils/digMatch";
import type { Product } from "../../types";

const PROFILE_KEY = "digbox:dig-match:profile:v1";
const SEEN_KEY = "digbox:taste-swipe:seen:v1";
const SWIPE_THRESHOLD = 96;

function fallback(event: SyntheticEvent<HTMLImageElement>) {
  if (!event.currentTarget.src.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) event.currentTarget.src = DEFAULT_PRODUCT_PLACEHOLDER;
}

function readSeen() {
  try {
    const value = JSON.parse(window.localStorage.getItem(SEEN_KEY) || "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch { return new Set<string>(); }
}

function saveSeen(ids: Set<string>) {
  window.localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-500)));
}

export function TasteSwipePageClient({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const router = useRouter();
  const auth = useAuthContext();
  const { t } = useLocaleContext();
  const [feedProducts, setFeedProducts] = useState<Product[]>(initialProducts);
  const [isFeedLoading, setIsFeedLoading] = useState(initialProducts.length === 0);
  const [profile, setProfile] = useState<DigMatchProfile | null>(null);
  const [presentation, setPresentation] = useState<DigMatchPresentation>("all");
  const [deck, setDeck] = useState<Product[]>([]);
  const [actions, setActions] = useState<TasteSwipeAction[]>([]);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDecision, setExitDecision] = useState<"like" | "pass" | null>(null);
  const [finished, setFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    seen.current = readSeen();
    try { setProfile(parseDigMatchProfile(JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null"))); } catch { /* empty guest profile */ }
  }, []);
  useEffect(() => {
    if (!auth.authUser) return;
    void fetchDigMatchProfile().then((value) => { if (value) setProfile(value); }).catch(() => undefined);
  }, [auth.authUser]);

  useEffect(() => {
    if (initialProducts.length) return;
    let active = true;
    void fetchDigMatchProducts()
      .then((items) => { if (active) setFeedProducts(items); })
      .catch(() => undefined)
      .finally(() => { if (active) setIsFeedLoading(false); });
    return () => { active = false; };
  }, [initialProducts.length]);

  const products = feedProducts;
  const isProductsLoading = isFeedLoading;

  const start = useCallback(() => {
    const next = buildTasteSwipeDeck(products, profile, presentation, seen.current, 24);
    setDeck(next); setActions([]); setFinished(false); setDragX(0); setExitDecision(null);
    captureEvent("taste_swipe_started", { deck_size: next.length, presentation, is_authenticated: Boolean(auth.authUser) });
  }, [auth.authUser, presentation, products, profile]);

  const current = deck[0] || null;
  const nextProfile = useMemo(() => finished && actions.length ? calculateTasteSwipeProfile(profile, products, actions) : profile, [actions, finished, products, profile]);
  const recommendations = useMemo(() => finished && nextProfile ? getDigMatchRecommendations(products, nextProfile, new Set(actions.map((action) => action.productId)), 3, presentation) : [], [actions, finished, nextProfile, presentation, products]);
  const highlights = useMemo(() => nextProfile ? getDigMatchHighlights(nextProfile) : null, [nextProfile]);
  const sessionLikeCount = actions.filter((action) => action.decision === "like").length;
  const strongestSignals = highlights ? [...highlights.core, ...highlights.signature].filter((item, index, items) => items.findIndex((candidate) => candidate.tag === item.tag) === index).slice(0, 2) : [];
  const newSignal = profile?.updatedAt ? highlights?.curious[0] : null;

  useEffect(() => {
    deck.slice(1, 3).forEach((product) => {
      const image = new Image();
      image.src = product.thumbnailImage || product.image || DEFAULT_PRODUCT_PLACEHOLDER;
      void image.decode?.().catch(() => undefined);
    });
  }, [deck]);

  const finish = useCallback(async () => {
    if (finished) return;
    setFinished(true);
    if (!actions.length) return;
    const finalProfile = calculateTasteSwipeProfile(profile, products, actions);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(finalProfile));
    captureEvent("taste_swipe_completed", { action_count: actions.length, likes: actions.filter((item) => item.decision === "like").length });
    if (!auth.authUser) return;
    setIsSaving(true);
    try { await saveTasteSwipe(finalProfile, actions); captureEvent("taste_swipe_saved", { action_count: actions.length }); }
    catch { /* local profile still preserves the interaction */ }
    finally { setIsSaving(false); }
  }, [actions, auth.authUser, finished, products, profile]);

  useEffect(() => {
    if (!deck.length && actions.length) void finish();
  }, [actions.length, deck.length, finish]);

  const decide = useCallback((decision: "like" | "pass") => {
    if (!current || exitDecision) return;
    const nextActions = [...actions, { productId: current.id, decision, decidedAt: new Date().toISOString() }];
    captureEvent("taste_swipe_decided", { decision, product_id: current.id, card_number: nextActions.length });
    seen.current.add(current.id); saveSeen(seen.current);
    setActions(nextActions); setDeck((items) => items.slice(1)); setDragX(0);
  }, [actions, current, exitDecision]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => { if (exitDecision) return; pointerStart.current = event.clientX; setIsDragging(true); event.currentTarget.setPointerCapture(event.pointerId); };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => { if (pointerStart.current !== null) setDragX(event.clientX - pointerStart.current); };
  const onPointerEnd = () => { if (dragX >= SWIPE_THRESHOLD) decide("like"); else if (dragX <= -SWIPE_THRESHOLD) decide("pass"); else setDragX(0); pointerStart.current = null; setIsDragging(false); };

  if (finished) return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 pb-12 pt-24 text-white">
      <section className="mx-auto max-w-xl py-10">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-300">TASTE SWIPE</p>
        <div className="taste-swipe-summary-card mt-4 overflow-hidden rounded-2xl border border-white/10 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.32)] sm:p-6">
          <p className="text-sm font-medium text-gray-400">{t("tasteSwipe.session")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">{strongestSignals[0] ? t("tasteSwipe.summarySignal", { tag: getDigMatchTagLabel(strongestSignals[0].tag) }) : t("tasteSwipe.summaryFallback")}</h1>
          <p className="mt-5 text-sm text-gray-300">{t("tasteSwipe.likedCount", { total: actions.length, liked: sessionLikeCount })}</p>
          {strongestSignals.length ? <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">{strongestSignals.map((signal) => <div key={signal.tag}><p className="text-base font-semibold text-white">{getDigMatchTagLabel(signal.tag)}</p><p className="mt-1 text-sm text-gray-400">{signal.confidence >= 0.35 ? t("tasteSwipe.clearer") : t("tasteSwipe.emerging")}</p></div>)}</div> : null}
          {newSignal ? <p className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200"><span className="text-orange-300">{t("tasteSwipe.newSignal")}</span> · {getDigMatchTagLabel(newSignal.tag)}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={start} className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400">{t("tasteSwipe.moreCards")}</button>
          {recommendations.length ? <button type="button" onClick={() => document.getElementById("taste-swipe-recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-medium text-white transition hover:border-white/30">{t("tasteSwipe.viewRecommendations", { count: recommendations.length })}</button> : null}
        </div>

        {recommendations.length ? <section id="taste-swipe-recommendations" className="mt-10 border-t border-white/10 pt-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-300">FOR YOU</p><h2 className="mt-2 text-xl font-semibold text-white">{t("tasteSwipe.recommendations")}</h2><div className="mt-5 space-y-2">{recommendations.map(({ product, reasons }) => <button key={product.id} type="button" onClick={() => router.push(`/products/${product.slug || product.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-left transition hover:border-white/20"><img src={product.thumbnailImage || product.image || DEFAULT_PRODUCT_PLACEHOLDER} alt="" onError={fallback} className="h-16 w-16 rounded-lg object-cover"/><span className="min-w-0"><span className="block text-xs font-semibold text-orange-200">{product.brand}</span><span className="mt-1 block truncate text-sm font-semibold text-white">{product.name}</span>{reasons.length ? <span className="mt-1 block text-xs text-gray-400">{reasons.map(getDigMatchTagLabel).join(" · ")}</span> : null}</span></button>)}</div></section> : null}
        {isSaving ? <p className="mt-5 text-sm text-gray-500">{t("tasteSwipe.saving")}</p> : null}
      </section>
    </main>
  );

  if (!deck.length) return <main className="min-h-screen bg-[#0b0b0d] px-4 pb-12 pt-24 text-white"><section className="mx-auto max-w-xl py-10"><button type="button" onClick={() => router.push("/dig-match")} className="inline-flex items-center gap-1 text-sm font-bold text-gray-400"><ArrowLeft className="h-4 w-4"/> {t("tasteSwipe.back")}</button><p className="mt-8 text-xs font-bold uppercase text-orange-400">TASTE SWIPE</p><h1 className="mt-3 text-3xl font-bold">{t("tasteSwipe.title")}</h1><p className="mt-3 leading-7 text-gray-400">{t("tasteSwipe.description")}</p><div className="mt-7 grid grid-cols-3 gap-2">{([['menswear', t('tasteSwipe.menswear')],['womenswear', t('tasteSwipe.womenswear')],['all', t('tasteSwipe.all')]] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setPresentation(value)} className={`h-11 rounded-md border text-sm font-bold ${presentation === value ? "border-orange-400 bg-orange-500/15 text-orange-200" : "border-white/10 text-gray-400"}`}>{label}</button>)}</div><button type="button" disabled={isProductsLoading || !products.length} onClick={start} className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-bold text-black disabled:bg-white/10 disabled:text-gray-500"><Sparkles className="h-4 w-4"/> {t("tasteSwipe.start")}</button></section></main>;

  const visualDecision = exitDecision || (dragX > 18 ? "like" : dragX < -18 ? "pass" : null);
  const glow = visualDecision === "like" ? "0 0 18px rgba(56,189,248,.9), 0 0 50px rgba(37,99,235,.7), 0 24px 54px rgba(0,0,0,.45)" : visualDecision === "pass" ? "0 0 18px rgba(251,113,133,.9), 0 0 50px rgba(239,68,68,.65), 0 24px 54px rgba(0,0,0,.45)" : "0 24px 54px rgba(0,0,0,.45)";
  return <main className="min-h-screen bg-[#0b0b0d] px-4 pb-12 pt-24 text-white"><section className="mx-auto max-w-md"><div className="flex items-center justify-between"><button type="button" onClick={() => void finish()} className="inline-flex items-center gap-1 text-sm font-bold text-gray-400"><ArrowLeft className="h-4 w-4"/> {t("tasteSwipe.finish")}</button><span className="text-sm font-bold text-gray-500">{t("tasteSwipe.cardNumber", { count: actions.length + 1 })}</span></div><p className="mt-8 text-center text-xs font-bold uppercase text-orange-300">TASTE SWIPE</p><h1 className="mt-2 text-center text-2xl font-bold">{t("tasteSwipe.question")}</h1><div className="relative mt-7 h-[min(68vh,580px)]"><div className="absolute inset-2 rounded-2xl bg-white/[0.04]"/><div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} style={{ transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`, transition: isDragging ? "none" : "transform 120ms var(--ease-out)", boxShadow: glow }} className="absolute z-10 inset-0 touch-pan-y select-none overflow-hidden rounded-2xl border border-white/10 bg-[#151518]"><img src={current.thumbnailImage || current.image || DEFAULT_PRODUCT_PLACEHOLDER} alt={current.name} onError={fallback} draggable={false} className="h-full w-full object-cover pointer-events-none"/><div className={`absolute left-5 top-5 rounded-md border-2 border-red-200 bg-red-500/20 px-3 py-1.5 text-sm font-black tracking-[0.16em] text-red-100 transition-all ${visualDecision === "pass" ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>PASS</div><div className={`absolute right-5 top-5 rounded-md border-2 border-blue-100 bg-blue-500/25 px-3 py-1.5 text-sm font-black tracking-[0.16em] text-blue-50 transition-all ${visualDecision === "like" ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>LIKE</div><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-5 pb-6 pt-24"><p className="text-xs font-bold text-orange-300">{current.brand}</p><p className="mt-1 text-lg font-bold">{current.name}</p><p className="mt-2 text-xs text-gray-300">{t("tasteSwipe.hint")}</p></div></div></div><div className="mt-6 grid grid-cols-3 gap-3"><button type="button" disabled={Boolean(exitDecision)} onClick={() => decide("pass")} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-red-300/50 bg-red-400/10 text-sm font-bold text-red-100 disabled:opacity-50" aria-label={t("tasteSwipe.pass")}><X className="h-5 w-5"/> {t("tasteSwipe.pass")}</button><button type="button" disabled={Boolean(exitDecision)} onClick={() => decide("like")} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-bold text-black shadow-lg shadow-orange-500/20 disabled:opacity-50" aria-label={t("tasteSwipe.like")}><Heart className="h-5 w-5"/> {t("tasteSwipe.like")}</button><button type="button" disabled={Boolean(exitDecision)} onClick={() => void finish()} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg border border-white/20 text-sm font-bold text-gray-200 disabled:opacity-50" aria-label={t("tasteSwipe.viewResults")}><Check className="h-5 w-5"/> {t("tasteSwipe.viewResults")}</button></div></section></main>;
}
