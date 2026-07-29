"use client";
/* eslint-disable @next/next/no-img-element -- Product images require native fallback source mutation. */

import { type KeyboardEvent, type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Compass, RotateCcw, Sparkles, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchDigMatchHistory, fetchDigMatchProfile, saveDigMatchProfile, type DigMatchHistoryEntry } from "../../api/tasteMatch";
import { useAuthContext } from "../../contexts/AuthContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { captureEvent } from "../../utils/analytics";
import { DEFAULT_PRODUCT_PLACEHOLDER } from "../../constants";
import { getProductPageUrl } from "../../utils/product";
import {
  buildDigMatchQuestions,
  buildDigMatchFollowUpQuestions,
  buildDigMatchOpeningQuestions,
  calculateDigMatchProfile,
  DIG_MATCH_OPENING_QUESTION_COUNT,
  getDigMatchHighlights,
  getDigMatchInterpretation,
  getDigMatchProgressInsight,
  getDigMatchRecommendationGroups,
  getDigMatchTagLabel,
  parseDigMatchProfile,
  type DigMatchAnswer,
  type DigMatchChoice,
  type DigMatchProfile,
  type DigMatchPresentation,
  type DigMatchQuestion,
} from "../../utils/digMatch";
import type { Product } from "../../types";

const GUEST_PROFILE_KEY = "digbox:dig-match:profile:v1";
const UNDO_TIMEOUT_MS = 4200;

type Screen = "ready" | "question" | "result";
type UndoState = Pick<DigMatchPageClientState, "answers" | "questions" | "questionIndex">;
type DigMatchPageClientState = {
  answers: DigMatchAnswer[];
  questions: DigMatchQuestion[];
  questionIndex: number;
};

function handleImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  if (!event.currentTarget.src.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) event.currentTarget.src = DEFAULT_PRODUCT_PLACEHOLDER;
}

function readGuestProfile() {
  try {
    return parseDigMatchProfile(JSON.parse(window.localStorage.getItem(GUEST_PROFILE_KEY) || "null"));
  } catch {
    return null;
  }
}

function writeGuestProfile(profile: DigMatchProfile) {
  window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
}

function ProductChoice({ product, choice, isSelected, isPending, onChoose }: {
  product: DigMatchQuestion["left"];
  choice: "left" | "right";
  isSelected: boolean;
  isPending: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={onChoose}
      className={`dig-match-choice group relative aspect-[3/4] min-w-0 overflow-hidden rounded-xl border bg-[#151518] text-left transition-[transform,opacity,border-color] duration-150 [transition-timing-function:var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d] sm:aspect-[4/5] ${isSelected ? "scale-[0.98] border-orange-300 opacity-90" : "border-white/10"} disabled:cursor-wait`}
      aria-label={`${product.brand} ${product.name} 선택`}
    >
      <img src={product.image || product.thumbnailImage || DEFAULT_PRODUCT_PLACEHOLDER} alt={product.name} onError={handleImageFallback} className="dig-match-choice-image absolute inset-0 h-full w-full object-cover transition-transform duration-[var(--duration-layer-enter)] [transition-timing-function:var(--ease-out)]" />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent px-3 pb-3 pt-14 sm:px-5 sm:pb-5">
        <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/65 sm:text-[11px]">{product.brand}</span>
        <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-5 text-white sm:text-base">{product.name}</span>
      </span>
      {isSelected ? <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-black"><Check className="h-4 w-4" /></span> : null}
      <span className="sr-only">{choice === "left" ? "왼쪽 상품" : "오른쪽 상품"}</span>
    </button>
  );
}

function SignalGroup({ title, items, emptyCopy }: { title: string; items: ReturnType<typeof getDigMatchHighlights>["core"]; emptyCopy: string }) {
  return <section className="border-t border-white/10 py-5 first:border-t-0 first:pt-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">{title}</p>{items.length ? <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={item.tag} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white">{getDigMatchTagLabel(item.tag)}</span>)}</div> : <p className="mt-2 text-sm text-gray-400">{emptyCopy}</p>}</section>;
}

function RecommendationGroup({ title, copy, items, onOpen }: { title: string; copy: string; items: ReturnType<typeof getDigMatchRecommendationGroups>["forYou"]; onOpen: (product: Product) => void }) {
  if (!items.length) return null;
  return <section className="border-t border-white/10 py-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">{title}</p><p className="mt-1 text-sm leading-5 text-gray-400">{copy}</p><div className="mt-3 space-y-2">{items.map(({ product, reasons }) => <button key={product.id} type="button" onClick={() => onOpen(product)} className="dig-match-recommendation-row flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-2 text-left transition-[background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"><img src={product.thumbnailImage || product.image || DEFAULT_PRODUCT_PLACEHOLDER} alt="" onError={handleImageFallback} className="h-14 w-14 rounded-md object-cover" /><span className="min-w-0"><span className="block truncate text-xs font-medium text-white/60">{product.brand}</span><span className="mt-1 block line-clamp-2 text-sm font-semibold text-white">{product.name}</span>{reasons.length ? <span className="mt-1 block text-xs text-gray-400">{reasons.map(getDigMatchTagLabel).join(" · ")}</span> : null}</span><ArrowRight className="ml-auto h-4 w-4 shrink-0 text-white/45" /></button>)}</div></section>;
}

export function DigMatchPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const { products, isProductsLoading, productsError, retryProductsLoad } = useProductsContext();
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([]);
  const [isFallbackLoading, setIsFallbackLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("ready");
  const [questions, setQuestions] = useState<DigMatchQuestion[]>([]);
  const [answers, setAnswers] = useState<DigMatchAnswer[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [profile, setProfile] = useState<DigMatchProfile | null>(null);
  const [previousProfile, setPreviousProfile] = useState<DigMatchProfile | null>(null);
  const [history, setHistory] = useState<DigMatchHistoryEntry[]>([]);
  const [presentation, setPresentation] = useState<DigMatchPresentation | null>(null);
  const [pendingChoice, setPendingChoice] = useState<DigMatchChoice | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const loadedProfileRef = useRef<DigMatchProfile | null>(null);
  const pendingTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const clearUndo = useCallback(() => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setUndoState(null);
  }, []);

  const clearPendingAnswer = useCallback(() => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = null;
    setPendingChoice(null);
  }, []);

  useEffect(() => () => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
  }, []);

  useEffect(() => { const guestProfile = readGuestProfile(); loadedProfileRef.current = guestProfile; setProfile(guestProfile); }, []);

  useEffect(() => {
    if (!auth.authUser) return;
    let active = true;
    void fetchDigMatchProfile().then((savedProfile) => { if (active && savedProfile) { loadedProfileRef.current = savedProfile; setProfile(savedProfile); } }).catch(() => undefined);
    void fetchDigMatchHistory().then((entries) => { if (active) setHistory(entries); }).catch(() => undefined);
    return () => { active = false; };
  }, [auth.authUser]);

  useEffect(() => {
    let active = true;
    void fetch("/api/products").then(async (response) => { const payload = await response.json() as { ok?: boolean; data?: { products?: Product[] } }; return response.ok && payload.ok && Array.isArray(payload.data?.products) ? payload.data.products : []; }).then((loadedProducts) => { if (active) setFallbackProducts(loadedProducts); }).catch(() => undefined).finally(() => { if (active) setIsFallbackLoading(false); });
    return () => { active = false; };
  }, []);

  const availableProducts = products.length > 0 ? products : fallbackProducts;
  const currentQuestion = questions[questionIndex] || null;
  const result = useMemo(() => {
    if (!profile) return null;
    return { highlights: getDigMatchHighlights(profile), interpretation: getDigMatchInterpretation(profile, questions, answers, previousProfile), recommendationGroups: getDigMatchRecommendationGroups(availableProducts, profile, questions, answers, presentation || "all") };
  }, [answers, availableProducts, presentation, previousProfile, profile, questions]);

  const start = useCallback(() => {
    if (!presentation) return;
    const generated = buildDigMatchOpeningQuestions(availableProducts, DIG_MATCH_OPENING_QUESTION_COUNT, Math.random, { presentation });
    if (generated.length < DIG_MATCH_OPENING_QUESTION_COUNT) return;
    clearUndo(); clearPendingAnswer(); setQuestions(generated); setAnswers([]); setQuestionIndex(0); setPreviousProfile(loadedProfileRef.current); setScreen("question");
    captureEvent("dig_match_started", { question_count: generated.length, is_authenticated: Boolean(auth.authUser) });
  }, [auth.authUser, availableProducts, clearPendingAnswer, clearUndo, presentation]);

  const complete = useCallback(async (nextAnswers: DigMatchAnswer[]) => {
    const priorProfile = loadedProfileRef.current;
    const nextProfile = calculateDigMatchProfile(priorProfile, questions, nextAnswers);
    setPreviousProfile(priorProfile); loadedProfileRef.current = nextProfile; setProfile(nextProfile); writeGuestProfile(nextProfile); setScreen("result");
    captureEvent("dig_match_completed", { answer_count: nextAnswers.filter((answer) => answer.choice !== "skip").length, question_count: questions.length });
    if (!auth.authUser) return;
    setIsSaving(true);
    try { await saveDigMatchProfile(nextProfile, nextAnswers); setHistory((entries) => [{ completedAt: nextProfile.updatedAt, profile: nextProfile }, ...entries].slice(0, 5)); captureEvent("dig_match_profile_saved", { completed_sessions: nextProfile.completedSessions }); } catch { /* Guest copy preserves the result during a temporary server failure. */ } finally { setIsSaving(false); }
  }, [auth.authUser, questions]);

  const commitAnswer = useCallback((choice: DigMatchChoice) => {
    if (!currentQuestion) return;
    const priorState: UndoState = { answers, questions, questionIndex };
    const nextAnswers = [...answers, { questionId: currentQuestion.id, axisId: currentQuestion.axisId, choice, leftProductId: currentQuestion.left.id, rightProductId: currentQuestion.right.id }];
    captureEvent(choice === "skip" ? "dig_match_question_skipped" : "dig_match_question_answered", { question_index: questionIndex + 1, choice, axis: currentQuestion.axisId });
    const isOpeningComplete = questionIndex + 1 === DIG_MATCH_OPENING_QUESTION_COUNT && questions.length === DIG_MATCH_OPENING_QUESTION_COUNT;
    const followUps = isOpeningComplete ? buildDigMatchFollowUpQuestions(availableProducts, questions, nextAnswers, 4, Math.random, { presentation: presentation || "all" }) : [];
    const isFinal = !followUps.length && questionIndex + 1 >= questions.length;
    setAnswers(nextAnswers);
    if (!isFinal) {
      setUndoState(priorState);
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = window.setTimeout(() => setUndoState(null), UNDO_TIMEOUT_MS);
    }
    if (followUps.length) { setQuestions((current) => [...current, ...followUps]); setQuestionIndex((index) => index + 1); captureEvent("dig_match_follow_up_generated", { question_count: followUps.length }); return; }
    if (isFinal) { void complete(nextAnswers); return; }
    setQuestionIndex((index) => index + 1);
  }, [answers, availableProducts, complete, currentQuestion, presentation, questionIndex, questions]);

  const answer = useCallback((choice: DigMatchChoice) => {
    if (pendingChoice) return;
    setPendingChoice(choice);
    pendingTimerRef.current = window.setTimeout(() => { pendingTimerRef.current = null; setPendingChoice(null); commitAnswer(choice); }, 150);
  }, [commitAnswer, pendingChoice]);

  const undoLastAnswer = useCallback(() => {
    if (!undoState) return;
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    setQuestions(undoState.questions); setAnswers(undoState.answers); setQuestionIndex(undoState.questionIndex); setScreen("question"); clearUndo();
  }, [clearUndo, undoState]);

  const requestExit = useCallback(() => {
    clearPendingAnswer();
    if (answers.length) setIsExitConfirmOpen(true);
    else setScreen("ready");
  }, [answers.length, clearPendingAnswer]);
  const confirmExit = useCallback(() => { clearUndo(); clearPendingAnswer(); setIsExitConfirmOpen(false); setScreen("ready"); }, [clearPendingAnswer, clearUndo]);
  const selectPresentation = useCallback((value: DigMatchPresentation) => setPresentation(value), []);
  const onPresentationKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, value: DigMatchPresentation) => {
    const choices: DigMatchPresentation[] = ["menswear", "womenswear", "all"];
    const current = choices.indexOf(value);
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const next = choices[(current + direction + choices.length) % choices.length];
    setPresentation(next);
    document.getElementById(`dig-match-presentation-${next}`)?.focus();
  }, []);

  useEffect(() => { if (screen === "result") captureEvent("dig_match_result_viewed", { completed_sessions: profile?.completedSessions || 1 }); }, [profile?.completedSessions, screen]);

  const isLoadingProducts = isProductsLoading && isFallbackLoading;
  const canStart = Boolean(presentation) && !isLoadingProducts && buildDigMatchQuestions(availableProducts, 12, () => 0.42, { presentation: presentation || "all" }).length >= 12;
  const progressInsight = getDigMatchProgressInsight(questions.slice(0, questionIndex), answers);
  const isFollowUpPhase = questionIndex >= DIG_MATCH_OPENING_QUESTION_COUNT;
  const phaseTotal = isFollowUpPhase ? Math.max(1, questions.length - DIG_MATCH_OPENING_QUESTION_COUNT) : DIG_MATCH_OPENING_QUESTION_COUNT;
  const phaseIndex = isFollowUpPhase ? questionIndex - DIG_MATCH_OPENING_QUESTION_COUNT + 1 : questionIndex + 1;
  const phaseLabel = isFollowUpPhase ? "조율" : "탐색";
  const lastMatchLabel = history[0]?.completedAt ? new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(history[0].completedAt)) : null;
  const selectedTags = result?.highlights.core.slice(0, 3) || result?.highlights.signature.slice(0, 3) || [];

  return <main data-dig-match-screen={screen} className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white lg:pt-24"><div className="mx-auto w-full max-w-5xl">
    {screen === "ready" ? <section className="mx-auto max-w-2xl py-10 sm:py-16"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-300">DIG MATCH</p><h1 className="mt-3 text-3xl font-semibold leading-[1.12] tracking-[-0.035em] sm:text-4xl">더 끌리는 쪽은?</h1><p className="mt-4 max-w-xl text-base leading-7 text-gray-300">약 2분의 비교로, 지금의 취향을 더 선명하게 정리해요.</p><div className="mt-9"><div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="이번 매치에서 볼 상품 범위">{([ ["menswear", "남성 스타일"], ["womenswear", "여성 스타일"], ["all", "구분 없이"] ] as const).map(([value, label]) => <button id={`dig-match-presentation-${value}`} key={value} type="button" role="radio" aria-checked={presentation === value} tabIndex={presentation === null ? (value === "all" ? 0 : -1) : presentation === value ? 0 : -1} onClick={() => selectPresentation(value)} onKeyDown={(event) => onPresentationKeyDown(event, value)} className={`dig-match-presentation-option inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-medium whitespace-nowrap transition-[border-color,color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:text-sm ${presentation === value ? "border-orange-300 bg-orange-400/[0.08] text-white" : "border-white/10 bg-white/[0.02] text-gray-300"}`}>{presentation === value ? <Check className="h-3.5 w-3.5 text-orange-300" /> : null}{label}</button>)}</div><p className="mt-3 text-sm leading-6 text-gray-400">선택한 범위 안에서 비슷한 조건의 상품을 비교합니다.</p></div><div className="mt-8"><button type="button" disabled={!canStart} onClick={start} className="dig-match-start-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-400 px-5 text-sm font-semibold text-black transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500 sm:w-auto"><Sparkles className="h-4 w-4" />{isLoadingProducts ? "상품 준비 중" : "매치 시작"}</button></div>{profile?.completedSessions ? <p className="mt-5 text-sm leading-6 text-gray-300">지난 매치 이후의 취향 변화도 함께 비교해 드려요.</p> : null}{lastMatchLabel ? <p className="mt-2 text-sm text-gray-400">최근 매치: {lastMatchLabel}</p> : null}{isLoadingProducts ? <p className="mt-4 text-sm text-gray-400">상품을 불러오는 중입니다.</p> : null}{productsError && !fallbackProducts.length ? <button type="button" onClick={retryProductsLoad} className="mt-4 text-sm font-medium text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">상품 다시 불러오기</button> : null}{presentation && !isLoadingProducts && !canStart && !productsError ? <p className="mt-4 text-sm text-gray-400">선택한 범위에 비교할 상품이 아직 충분하지 않습니다.</p> : null}</section> : null}

    {screen === "question" && currentQuestion ? <section className="mx-auto max-w-4xl"><div className="mb-7 flex items-center justify-between gap-4"><button type="button" onClick={requestExit} className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-gray-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"><ArrowLeft className="h-4 w-4" />나가기</button><span className="text-sm font-medium text-gray-300">{phaseLabel} {phaseIndex} / {phaseTotal}</span></div><div className="mb-8 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full origin-left bg-orange-400 transition-transform duration-150 [transition-timing-function:var(--ease-out)] motion-reduce:transition-opacity" style={{ transform: `scaleX(${phaseIndex / phaseTotal})` }} /></div><p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-orange-300">{currentQuestion.axisTitle}</p><h1 className="mt-2 text-center text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">지금 더 끌리는 쪽은?</h1>{isFollowUpPhase && phaseIndex === 1 ? <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-gray-300">취향을 조금 더 선명하게 정리할게요.</p> : null}{progressInsight ? <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-gray-300"><Compass className="mr-1.5 inline h-4 w-4 text-orange-300" />{progressInsight}</p> : null}<div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-5"><ProductChoice product={currentQuestion.left} choice="left" isSelected={pendingChoice === "left"} isPending={Boolean(pendingChoice)} onChoose={() => answer("left")} /><ProductChoice product={currentQuestion.right} choice="right" isSelected={pendingChoice === "right"} isPending={Boolean(pendingChoice)} onChoose={() => answer("right")} /></div><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" disabled={Boolean(pendingChoice)} onClick={() => answer("both")} className={`h-11 rounded-lg border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${pendingChoice === "both" ? "border-orange-300 bg-orange-400/[0.08] text-white" : "border-white/15 bg-white/[0.04] text-gray-200 hover:border-white/30"}`}>둘 다 좋아요</button><button type="button" disabled={Boolean(pendingChoice)} onClick={() => answer("neither")} className={`h-11 rounded-lg border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${pendingChoice === "neither" ? "border-orange-300 bg-orange-400/[0.08] text-white" : "border-white/15 bg-white/[0.04] text-gray-200 hover:border-white/30"}`}>둘 다 아니에요</button><button type="button" disabled={Boolean(pendingChoice)} onClick={() => answer("skip")} className="h-11 rounded-lg px-3 text-sm font-medium text-gray-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">건너뛰기</button></div>{undoState ? <div role="status" className="fixed inset-x-4 bottom-[calc(var(--app-bottom-nav-height)+1rem)] z-30 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1b1b1f]/95 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md motion-reduce:transition-none sm:bottom-6"><span className="inline-flex min-w-0 items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-300" />선택됨</span><button type="button" onClick={undoLastAnswer} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 font-medium text-orange-200 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"><Undo2 className="h-4 w-4" />실행 취소</button></div> : null}</section> : null}

    {screen === "result" && result ? <section className="mx-auto max-w-4xl py-5 sm:py-10"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-300">DIG MATCH RESULT</p><h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl">{result.interpretation.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-gray-300">{result.interpretation.summary}</p></div><button type="button" onClick={start} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-medium text-gray-200 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">새 매치 시작</span><span className="sm:hidden">다시</span></button></div><div className="mt-7 flex flex-wrap gap-2">{selectedTags.map((item) => <span key={item.tag} className="rounded-lg border border-orange-300/30 bg-orange-400/[0.08] px-3 py-2 text-sm font-medium text-orange-100">{getDigMatchTagLabel(item.tag)}</span>)}</div>{result.interpretation.changeSentence ? <p className="mt-4 border-l-2 border-orange-300/70 pl-3 text-sm leading-6 text-gray-200">{result.interpretation.changeSentence}</p> : null}<section className="mt-10 border-t border-white/10 pt-6"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-orange-300">FOR YOU</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.015em] text-white">내 취향 추천</h2><p className="mt-1 text-sm leading-6 text-gray-300">지금의 중심 취향과 잘 맞는 상품이에요.</p></div></div>{result.recommendationGroups.forYou.length ? <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">{result.recommendationGroups.forYou.slice(0, 6).map(({ product }) => <button key={product.id} type="button" onClick={() => { captureEvent("dig_match_recommendation_opened", { product_id: product.id, group: "for_you" }); router.push(getProductPageUrl(product)); }} className="dig-match-recommendation-card group min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"><img src={product.thumbnailImage || product.image || DEFAULT_PRODUCT_PLACEHOLDER} alt={product.name} onError={handleImageFallback} className="dig-match-recommendation-image aspect-square w-full rounded-lg object-cover transition-transform duration-150 motion-reduce:transform-none" /><span className="mt-2 block truncate text-xs font-medium text-gray-300">{product.brand}</span></button>)}</div> : <p className="mt-5 text-sm text-gray-400">추천을 만들기 위한 선택이 조금 더 필요합니다.</p>}<button type="button" onClick={() => router.push("/")} className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">추천 전체 보기<ArrowRight className="h-4 w-4" /></button></section><details className="group mt-10 border-t border-white/10"><summary className="flex h-14 cursor-pointer list-none items-center justify-between text-sm font-medium text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">세부 취향 분석 보기<ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><div className="border-t border-white/10 pb-2 pt-6"><section><p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">PREFERENCE AXES</p><div className="mt-3 space-y-2">{result.interpretation.axes.map(({ axis, score, label }) => <div key={axis.id} className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] px-3 py-3"><span className="text-sm font-medium text-white">{label}</span><span className="shrink-0 text-xs text-gray-400">{score >= 0.08 ? axis.positiveLabel : score <= -0.08 ? axis.negativeLabel : "균형 탐색"}</span></div>)}</div></section>{result.interpretation.details.length ? <section className="border-t border-white/10 py-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">REPEATED DETAILS</p><div className="mt-3 flex flex-wrap gap-2">{result.interpretation.details.map((detail) => <span key={detail} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white">{detail}</span>)}</div></section> : null}<section className="border-t border-white/10 py-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">YOUR READ</p><div className="mt-3 space-y-3 text-sm leading-6 text-gray-300"><p>{result.interpretation.coreSentence}</p><p>{result.interpretation.curiousSentence}</p><p>{result.interpretation.explorationSentence}</p></div></section><SignalGroup title="Core" items={result.highlights.core} emptyCopy="몇 번 더 고르면 중심 취향이 더 선명해집니다." /><SignalGroup title="Signature" items={result.highlights.signature} emptyCopy="반복된 선택이 쌓이면 나만의 특징이 나타납니다." /><SignalGroup title="Curious" items={result.highlights.curious} emptyCopy="아직 탐색 중인 방향입니다." /><RecommendationGroup title="EXPLORE NEXT" copy="관심이 보인 방향을 조금 더 넓혀 볼 상품입니다." items={result.recommendationGroups.explore} onOpen={(product) => { captureEvent("dig_match_recommendation_opened", { product_id: product.id, group: "explore" }); router.push(getProductPageUrl(product)); }} /><RecommendationGroup title="WORTH A SECOND LOOK" copy="둘 다 좋아했거나 판단을 미뤘던 상품입니다." items={result.recommendationGroups.revisit} onOpen={(product) => { captureEvent("dig_match_recommendation_opened", { product_id: product.id, group: "revisit" }); router.push(getProductPageUrl(product)); }} /></div></details><div className="mt-8 flex items-center gap-2 text-sm text-gray-300"><Check className="h-4 w-4 text-orange-300" />{isSaving ? "취향 프로필을 저장하는 중입니다." : auth.authUser ? "이번 선택이 취향 프로필에 반영되었습니다." : "이번 선택은 이 기기에 저장되었습니다."}</div></section> : null}
  </div>{isExitConfirmOpen ? <div role="dialog" aria-modal="true" aria-labelledby="dig-match-exit-title" className="fixed inset-0 z-40 flex items-end bg-black/55 p-4 sm:items-center sm:justify-center"><div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#18181b] p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="dig-match-exit-title" className="text-lg font-semibold text-white">매치를 나갈까요?</h2><p className="mt-2 text-sm leading-6 text-gray-300">이번 진행의 선택은 저장되지 않습니다.</p></div><button type="button" onClick={() => setIsExitConfirmOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300" aria-label="나가기 취소"><X className="h-4 w-4" /></button></div><div className="mt-6 grid grid-cols-2 gap-2"><button type="button" onClick={() => setIsExitConfirmOpen(false)} className="h-11 rounded-lg border border-white/15 text-sm font-medium text-white transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">계속하기</button><button type="button" onClick={confirmExit} className="h-11 rounded-lg bg-white text-sm font-semibold text-black transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">나가기</button></div></div></div> : null}</main>;
}
