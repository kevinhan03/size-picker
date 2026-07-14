"use client";

import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchDigMatchProfile, saveDigMatchProfile } from "../../api/tasteMatch";
import { useAuthContext } from "../../contexts/AuthContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { captureEvent } from "../../utils/analytics";
import { DEFAULT_PRODUCT_PLACEHOLDER } from "../../constants";
import { getProductPageUrl } from "../../utils/product";
import {
  buildDigMatchQuestions,
  calculateDigMatchProfile,
  getDigMatchHighlights,
  getDigMatchInterpretation,
  getDigMatchRecommendations,
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

type Screen = "ready" | "question" | "result";

function handleImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.src.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) return;
  event.currentTarget.src = DEFAULT_PRODUCT_PLACEHOLDER;
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

function ProductChoice({ product, side, onChoose }: { product: DigMatchQuestion["left"]; side: "left" | "right"; onChoose: () => void }) {
  return (
    <button
      type="button"
      onClick={onChoose}
      className="group relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#151518] text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-orange-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:min-h-[460px]"
      aria-label={`${product.brand} ${product.name} 선택`}
    >
      <img src={product.image || product.thumbnailImage || DEFAULT_PRODUCT_PLACEHOLDER} alt={product.name} onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-4 pb-4 pt-16 sm:px-5 sm:pb-5">
        <span className="block text-[11px] font-bold uppercase text-orange-300">{product.brand}</span>
        <span className="mt-1 block line-clamp-2 text-sm font-bold text-white sm:text-base">{product.name}</span>
        <span className="mt-3 inline-flex h-8 items-center rounded-md border border-white/20 bg-black/50 px-3 text-xs font-bold text-white transition group-hover:border-orange-400/70 group-hover:text-orange-200">
          {side === "left" ? "이 상품 선택" : "이 상품 선택"}
        </span>
      </span>
    </button>
  );
}

function SignalGroup({ title, items, emptyCopy }: { title: string; items: ReturnType<typeof getDigMatchHighlights>["core"]; emptyCopy: string }) {
  return (
    <section className="border-t border-white/10 py-5 first:border-t-0 first:pt-0">
      <p className="text-xs font-bold uppercase text-orange-300">{title}</p>
      {items.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item.tag} className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-white">
              {getDigMatchTagLabel(item.tag)}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">{emptyCopy}</p>
      )}
    </section>
  );
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
  const [presentation, setPresentation] = useState<DigMatchPresentation | null>(null);
  const loadedProfileRef = useRef<DigMatchProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const guestProfile = readGuestProfile();
    loadedProfileRef.current = guestProfile;
    setProfile(guestProfile);
  }, []);

  useEffect(() => {
    if (!auth.authUser) return;
    let active = true;
    void fetchDigMatchProfile()
      .then((savedProfile) => {
        if (!active || !savedProfile) return;
        loadedProfileRef.current = savedProfile;
        setProfile(savedProfile);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [auth.authUser]);

  useEffect(() => {
    let active = true;
    void fetch("/api/products")
      .then(async (response) => {
        const payload = await response.json() as { ok?: boolean; data?: { products?: Product[] } };
        return response.ok && payload.ok && Array.isArray(payload.data?.products) ? payload.data.products : [];
      })
      .then((loadedProducts) => {
        if (active) setFallbackProducts(loadedProducts);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setIsFallbackLoading(false); });
    return () => { active = false; };
  }, []);

  const availableProducts = products.length > 0 ? products : fallbackProducts;

  const currentQuestion = questions[questionIndex] || null;
  const result = useMemo(() => {
    if (!profile) return null;
    const selectedIds = new Set(
      answers.flatMap((answer) => (answer.choice === "left" ? [answer.leftProductId] : answer.choice === "right" ? [answer.rightProductId] : []))
    );
    return {
      highlights: getDigMatchHighlights(profile),
      interpretation: getDigMatchInterpretation(profile, questions, answers),
      recommendations: getDigMatchRecommendations(availableProducts, profile, selectedIds, 3, presentation || "all"),
      selectedProducts: questions
        .flatMap((question) => [question.left, question.right])
        .filter((product) => selectedIds.has(product.id))
        .slice(0, 6),
    };
  }, [answers, availableProducts, presentation, profile, questions]);

  const start = useCallback(() => {
    if (!presentation) return;
    const generated = buildDigMatchQuestions(availableProducts, 12, Math.random, { presentation });
    if (generated.length < 6) return;
    setQuestions(generated);
    setAnswers([]);
    setQuestionIndex(0);
    setScreen("question");
    captureEvent("dig_match_started", { question_count: generated.length, is_authenticated: Boolean(auth.authUser) });
  }, [auth.authUser, availableProducts, presentation]);

  const complete = useCallback(async (nextAnswers: DigMatchAnswer[]) => {
    const nextProfile = calculateDigMatchProfile(loadedProfileRef.current, questions, nextAnswers);
    loadedProfileRef.current = nextProfile;
    setProfile(nextProfile);
    writeGuestProfile(nextProfile);
    setScreen("result");
    captureEvent("dig_match_completed", { answer_count: nextAnswers.filter((answer) => answer.choice !== "skip").length, question_count: questions.length });
    if (auth.authUser) {
      setIsSaving(true);
      try {
        await saveDigMatchProfile(nextProfile, nextAnswers);
        captureEvent("dig_match_profile_saved", { completed_sessions: nextProfile.completedSessions });
      } catch {
        // The guest copy remains in local storage, so a temporary server failure does not lose progress.
      } finally {
        setIsSaving(false);
      }
    }
  }, [auth.authUser, questions]);

  const answer = useCallback((choice: DigMatchChoice) => {
    if (!currentQuestion) return;
    const nextAnswers = [...answers, {
      questionId: currentQuestion.id,
      axisId: currentQuestion.axisId,
      choice,
      leftProductId: currentQuestion.left.id,
      rightProductId: currentQuestion.right.id,
    }];
    setAnswers(nextAnswers);
    captureEvent(choice === "skip" ? "dig_match_question_skipped" : "dig_match_question_answered", {
      question_index: questionIndex + 1,
      choice,
      axis: currentQuestion.axisId,
    });
    if (questionIndex + 1 >= questions.length) {
      void complete(nextAnswers);
      return;
    }
    setQuestionIndex((index) => index + 1);
  }, [answers, complete, currentQuestion, questionIndex, questions.length]);

  useEffect(() => {
    if (screen === "result") captureEvent("dig_match_result_viewed", { completed_sessions: profile?.completedSessions || 1 });
  }, [profile?.completedSessions, screen]);

  const isLoadingProducts = isProductsLoading && isFallbackLoading;
  const canStart = Boolean(presentation) && !isLoadingProducts && buildDigMatchQuestions(availableProducts, 12, () => 0.42, { presentation: presentation || "all" }).length >= 12;

  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 pb-[calc(var(--app-bottom-nav-height)+2rem)] pt-24 text-white sm:px-6 sm:pb-12">
      <div className="mx-auto w-full max-w-5xl">
        {screen === "ready" && (
          <section className="mx-auto max-w-2xl py-10 sm:py-16">
            <p className="text-xs font-bold uppercase text-orange-400">DIG MATCH</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">지금 더 입고 싶은 쪽을 골라보세요.</h1>
            <p className="mt-3 text-base leading-7 text-gray-400">상의 4개, 하의 4개, 아우터 4개의 비교를 통해 취향의 중심과 아직 열려 있는 방향을 정리합니다.</p>
            <fieldset className="mt-8">
              <legend className="text-sm font-bold text-gray-200">이번 매치에서 보고 싶은 상품</legend>
              <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup">
                {([
                  ["menswear", "남성 스타일"],
                  ["womenswear", "여성 스타일"],
                  ["all", "구분 없이"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={presentation === value}
                    onClick={() => setPresentation(value)}
                    className={`h-11 rounded-md border px-3 text-sm font-bold transition ${presentation === value ? "border-orange-400 bg-orange-500/15 text-orange-200" : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/30 hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500">상품 상세 정보에 명시된 타깃과 유니섹스 상품만 같은 그룹 안에서 비교합니다.</p>
            </fieldset>
            <div className="mt-8 flex items-center gap-3">
              <button type="button" disabled={!canStart} onClick={start} className="inline-flex h-11 items-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500">
                <Sparkles className="h-4 w-4" /> 매치 시작
              </button>
              {profile?.completedSessions ? <span className="text-sm text-gray-500">완료한 매치 {profile.completedSessions}회</span> : null}
            </div>
            {isLoadingProducts && <p className="mt-4 text-sm text-gray-500">상품을 불러오는 중입니다.</p>}
            {productsError && !fallbackProducts.length && <button type="button" onClick={retryProductsLoad} className="mt-4 text-sm font-bold text-orange-300">상품 다시 불러오기</button>}
            {presentation && !isLoadingProducts && !canStart && !productsError && <p className="mt-4 text-sm text-gray-500">선택한 그룹 안에 비교할 수 있는 스타일 태그 상품이 아직 충분하지 않습니다.</p>}
          </section>
        )}

        {screen === "question" && currentQuestion && (
          <section>
            <div className="mb-7 flex items-center justify-between gap-4">
              <button type="button" onClick={() => setScreen("ready")} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> 나가기</button>
              <span className="text-sm font-bold text-gray-400">{questionIndex + 1} / {questions.length}</span>
            </div>
            <div className="mb-8 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-orange-500 transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
            <h1 className="text-center text-2xl font-bold sm:text-3xl">지금 더 입고 싶은 쪽은?</h1>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-5">
              <ProductChoice product={currentQuestion.left} side="left" onChoose={() => answer("left")} />
              <ProductChoice product={currentQuestion.right} side="right" onChoose={() => answer("right")} />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => answer("both")} className="h-10 rounded-md border border-white/15 bg-white/[0.05] px-4 text-sm font-bold text-gray-200 transition hover:border-orange-400/60 hover:text-white">둘 다 좋아요</button>
              <button type="button" onClick={() => answer("neither")} className="h-10 rounded-md border border-white/15 bg-white/[0.05] px-4 text-sm font-bold text-gray-200 transition hover:border-orange-400/60 hover:text-white">둘 다 아니에요</button>
              <button type="button" onClick={() => answer("skip")} className="h-10 rounded-md px-3 text-sm font-bold text-gray-500 transition hover:text-white">고르기 어려워요</button>
            </div>
          </section>
        )}

        {screen === "result" && result && (
          <section className="mx-auto max-w-4xl py-5 sm:py-10">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase text-orange-400">DIG MATCH RESULT</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{result.interpretation.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">{result.interpretation.summary}</p></div>
              <button type="button" onClick={start} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/15 px-3 text-sm font-bold text-gray-200 transition hover:border-orange-400/70 hover:text-white"><RotateCcw className="h-4 w-4" /> 다시 하기</button>
            </div>
            {result.selectedProducts.length > 0 && <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">{result.selectedProducts.map((product) => <img key={product.id} src={product.thumbnailImage || product.image || DEFAULT_PRODUCT_PLACEHOLDER} alt="" onError={handleImageFallback} className="aspect-square w-full rounded-md object-cover" />)}</div>}
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              <div>
                <section className="border-t border-white/10 py-5 first:pt-0">
                  <p className="text-xs font-bold uppercase text-orange-300">PREFERENCE AXES</p>
                  <div className="mt-3 space-y-2">
                    {result.interpretation.axes.map(({ axis, score, label }) => (
                      <div key={axis.id} className="flex items-center justify-between gap-4 rounded-md bg-white/[0.03] px-3 py-2.5">
                        <span className="text-sm font-bold text-white">{label}</span>
                        <span className="shrink-0 text-xs text-gray-500">{score >= 0.08 ? axis.positiveLabel : score <= -0.08 ? axis.negativeLabel : "균형 탐색"}</span>
                      </div>
                    ))}
                  </div>
                </section>
                {result.interpretation.details.length > 0 && <section className="border-t border-white/10 py-5"><p className="text-xs font-bold uppercase text-orange-300">REPEATED DETAILS</p><div className="mt-3 flex flex-wrap gap-2">{result.interpretation.details.map((detail) => <span key={detail} className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-white">{detail}</span>)}</div></section>}
                <SignalGroup title="Core" items={result.highlights.core} emptyCopy="몇 번 더 고르면 중심 취향이 더 뚜렷해집니다." />
                <SignalGroup title="Signature" items={result.highlights.signature} emptyCopy="선택이 쌓이면 나만의 시그니처가 나타납니다." />
                <SignalGroup title="Curious" items={result.highlights.curious} emptyCopy="아직 탐색 중인 방향입니다." />
              </div>
              <aside className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="text-xs font-bold uppercase text-orange-300">FOR YOU</p>
                <div className="mt-3 space-y-3">
                  {result.recommendations.map(({ product, reasons }) => <button key={product.id} type="button" onClick={() => { captureEvent("dig_match_recommendation_opened", { product_id: product.id }); router.push(getProductPageUrl(product)); }} className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-2 text-left transition hover:border-orange-400/60"><img src={product.thumbnailImage || product.image || DEFAULT_PRODUCT_PLACEHOLDER} alt="" onError={handleImageFallback} className="h-16 w-16 rounded object-cover" /><span className="min-w-0"><span className="block truncate text-xs font-bold text-orange-200">{product.brand}</span><span className="mt-1 block line-clamp-2 text-sm font-bold text-white">{product.name}</span>{reasons.length ? <span className="mt-1 block text-xs text-gray-500">{reasons.map(getDigMatchTagLabel).join(" · ")}</span> : null}</span><ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-500" /></button>)}
                  {!result.recommendations.length && <p className="text-sm text-gray-500">추천을 만들기 위한 선택이 조금 더 필요합니다.</p>}
                </div>
              </aside>
            </div>
            <div className="mt-10 flex items-center gap-2 text-sm text-gray-500"><Check className="h-4 w-4 text-orange-400" /> {isSaving ? "취향 프로필을 저장하는 중입니다." : auth.authUser ? "이번 선택이 내 취향 프로필에 반영되었습니다." : "이번 선택은 이 기기에 저장되었습니다."}</div>
          </section>
        )}
      </div>
    </main>
  );
}
