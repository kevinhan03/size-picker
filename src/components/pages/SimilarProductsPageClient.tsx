"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, SyntheticEvent } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProgressiveImage } from "../ProgressiveImage";
import { useProductsContext } from "../../contexts/ProductsContext";
import type { Product } from "../../types";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import {
  getCrossCategoryStyleSimilarity,
  getEffectiveProductTargetGender,
  getProductRecommendationSimilarity,
  hasSharedPrimaryStyleTag,
  parseEmbedding,
} from "../../utils/tasteGraph";

const MIN_VISIBLE_PRODUCTS = 4;
const MAX_VISIBLE_PRODUCTS = 24;
const MIN_QUALITY_SCORE = 0.54;
const NATURAL_SCORE_GAP = 0.075;
const STYLE_TIE_BAND = 0.025;
const STYLE_FALLBACK_MIN_TAG_SIMILARITY = 0.55;
const STYLE_CATEGORIES = new Set(["top", "bottom", "outer", "shoes"]);

type ScoredProduct = { product: Product; similarity: number };
type BehavioralStatus = "idle" | "loading" | "ready" | "error";
type RecommendationSection = "similar" | "style" | "behavioral";

const RECOMMENDATION_SECTIONS: Array<{
  id: RecommendationSection;
  label: string;
  title: string;
}> = [
  { id: "similar", label: "비슷한", title: "비슷한 상품" },
  { id: "style", label: "잘 어울리는", title: "함께 잘 어울리는 상품" },
  { id: "behavioral", label: "함께 담은", title: "함께 담은 상품" },
];

function parseNumericId(param: string): string {
  return param.match(/^\d+/)?.[0] ?? param;
}

function normalizeCategory(category: string | null | undefined): string {
  return String(category || "").trim().toLowerCase();
}

function normalizeProductImages(product: Product): Product {
  const imagePath = String(product.imagePath || "").trim();
  if (!imagePath) return product;
  return {
    ...product,
    image: toPublicUrl(imagePath),
    thumbnailImage: toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 }),
  };
}

function selectNaturalRelatedProducts(candidates: ScoredProduct[]): Product[] {
  const qualified = candidates.filter(({ similarity }) => similarity >= MIN_QUALITY_SCORE);
  const visible = (qualified.length >= MIN_VISIBLE_PRODUCTS ? qualified : candidates).slice(0, MAX_VISIBLE_PRODUCTS);

  for (let index = MIN_VISIBLE_PRODUCTS; index < visible.length; index += 1) {
    const previous = visible[index - 1].similarity;
    const current = visible[index].similarity;
    if (previous - current >= NATURAL_SCORE_GAP && current < previous * 0.91) {
      return visible.slice(0, index).map(({ product }) => product);
    }
  }
  return visible.map(({ product }) => product);
}

function hasCompatibleTargetGender(source: Product, candidate: Product): boolean {
  const sourceGender = getEffectiveProductTargetGender(source);
  const candidateGender = getEffectiveProductTargetGender(candidate);
  if (sourceGender === "unknown" || candidateGender === "unknown") return true;
  return sourceGender === candidateGender || sourceGender === "unisex" || candidateGender === "unisex";
}

function diversifyStyleCategories(candidates: ScoredProduct[]): ScoredProduct[] {
  const result: ScoredProduct[] = [];
  let index = 0;
  while (index < candidates.length) {
    const bandStart = index;
    const bandScore = candidates[index].similarity;
    while (index < candidates.length && bandScore - candidates[index].similarity <= STYLE_TIE_BAND) index += 1;

    const remaining = candidates.slice(bandStart, index);
    const seenCategories = new Set<string>();
    while (remaining.length) {
      const nextIndex = remaining.findIndex((entry) => !seenCategories.has(normalizeCategory(entry.product.category)));
      const [next] = remaining.splice(nextIndex >= 0 ? nextIndex : 0, 1);
      result.push(next);
      seenCategories.add(normalizeCategory(next.product.category));
    }
  }
  return result;
}

function selectStyleProducts(candidates: ScoredProduct[]): Product[] {
  return selectNaturalRelatedProducts(diversifyStyleCategories(candidates));
}

function ProductCard({ product, onImageLoadError }: { product: Product; onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void }) {
  return (
    <Link href={getProductPageUrl(product)} scroll={false} className="ui-product-card ui-card-lift relative flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-transform duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70">
      <div className="relative mx-1.5 mb-0 mt-1.5 h-44 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgba(17,24,39,0.62),rgba(0,0,0,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:m-3 sm:h-48 sm:rounded-[18px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.07),transparent_28%)]" />
        <div className="absolute inset-3 z-[1] sm:inset-4">
          <ProgressiveImage src={product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="rounded-[10px] object-contain" loading="lazy" onError={onImageLoadError} />
        </div>
      </div>
      <div className="flex flex-1 flex-col bg-black/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
        <div className="mb-1 truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</div>
        <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
        <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
      </div>
    </Link>
  );
}

function EmptyRecommendationState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 px-6 text-center">
      <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}

function EmptyBehavioralCard({ status }: { status: BehavioralStatus }) {
  const content = status === "loading"
    ? { title: "함께 담은 상품을 찾고 있어요.", description: "이 상품을 담은 사람들의 선택을 확인하고 있어요." }
    : status === "error"
      ? { title: "함께 담은 상품을 불러오지 못했어요.", description: "잠시 후 다시 시도해 주세요." }
      : { title: "함께 담은 상품을 아직 찾지 못했어요.", description: "더 많은 사람이 함께 담으면 여기에서 발견할 수 있어요." };
  return <EmptyRecommendationState {...content} />;
}

export function SimilarProductsPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { products, isProductsLoading } = useProductsContext();
  const [behavioralProducts, setBehavioralProducts] = useState<Product[]>([]);
  const [behavioralStatus, setBehavioralStatus] = useState<BehavioralStatus>("idle");
  const [activeSection, setActiveSection] = useState<RecommendationSection>("similar");
  const [behavioralRequestedForId, setBehavioralRequestedForId] = useState<string | null>(null);
  const numericId = parseNumericId(id);
  const sourceProduct = products.find((product) => String(product.id) === numericId) ?? null;

  const normalizedSourceProduct = useMemo(
    () => (sourceProduct ? normalizeProductImages(sourceProduct) : null),
    [sourceProduct]
  );

  const similarProducts = useMemo(() => {
    if (!sourceProduct || activeSection !== "similar") return [];
    const sourceCategory = normalizeCategory(sourceProduct.category);
    if (!parseEmbedding(sourceProduct.imageEmbedding) || !sourceCategory) return [];

    const candidates = products
      .filter((candidate) => String(candidate.id) !== String(sourceProduct.id))
      .filter((candidate) => normalizeCategory(candidate.category) === sourceCategory)
      .map((candidate) => {
        if (!parseEmbedding(candidate.imageEmbedding)) return null;
        if (hasSharedPrimaryStyleTag(sourceProduct, candidate) === false) return null;
        const similarity = getProductRecommendationSimilarity(sourceProduct, candidate);
        return similarity?.visualSimilarity === null || !similarity ? null : { product: candidate, similarity: similarity.score };
      })
      .filter((candidate): candidate is ScoredProduct => candidate !== null)
      .sort((left, right) => right.similarity - left.similarity);

    return selectNaturalRelatedProducts(candidates);
  }, [activeSection, products, sourceProduct]);

  const styleProducts = useMemo(() => {
    if (!sourceProduct || activeSection !== "style") return [];
    const sourceCategory = normalizeCategory(sourceProduct.category);
    if (!STYLE_CATEGORIES.has(sourceCategory)) return [];

    const strictCandidates: ScoredProduct[] = [];
    const fallbackCandidates: ScoredProduct[] = [];

    products
      .filter((candidate) => String(candidate.id) !== String(sourceProduct.id))
      .filter((candidate) => {
        const category = normalizeCategory(candidate.category);
        return STYLE_CATEGORIES.has(category) && category !== sourceCategory;
      })
      .filter((candidate) => hasCompatibleTargetGender(sourceProduct, candidate))
      .forEach((candidate) => {
        const sharesPrimaryTag = hasSharedPrimaryStyleTag(sourceProduct, candidate);
        const similarity = getCrossCategoryStyleSimilarity(sourceProduct, candidate);
        if (!similarity) return;

        const scoredCandidate = { product: candidate, similarity: similarity.score };
        if (sharesPrimaryTag === true) {
          strictCandidates.push(scoredCandidate);
        } else if ((similarity.styleSimilarity ?? 0) >= STYLE_FALLBACK_MIN_TAG_SIMILARITY) {
          fallbackCandidates.push(scoredCandidate);
        }
      });

    strictCandidates.sort((left, right) => right.similarity - left.similarity);
    fallbackCandidates.sort((left, right) => right.similarity - left.similarity);
    const candidates = strictCandidates.length >= MIN_VISIBLE_PRODUCTS
      ? strictCandidates
      : [
          ...strictCandidates,
          ...fallbackCandidates.slice(0, MIN_VISIBLE_PRODUCTS - strictCandidates.length),
        ];

    return selectStyleProducts(candidates);
  }, [activeSection, products, sourceProduct]);

  useEffect(() => {
    if (behavioralRequestedForId === numericId) return;
    setBehavioralProducts([]);
    setBehavioralStatus("idle");
  }, [behavioralRequestedForId, numericId]);

  useEffect(() => {
    if (behavioralRequestedForId !== numericId) return;
    let cancelled = false;
    setBehavioralProducts([]);
    setBehavioralStatus("loading");
    fetch(`/api/products/${encodeURIComponent(numericId)}/behavioral-related`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("behavioral related products request failed");
        const payload = await response.json();
        if (!payload?.ok || !Array.isArray(payload?.data?.products)) throw new Error("invalid behavioral response");
        if (!cancelled) {
          setBehavioralProducts(payload.data.products.map(normalizeProductImages));
          setBehavioralStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setBehavioralStatus("error");
      });
    return () => { cancelled = true; };
  }, [behavioralRequestedForId, numericId]);

  const selectSection = (section: RecommendationSection) => {
    setActiveSection(section);
    if (section === "behavioral" && behavioralRequestedForId !== numericId) {
      setBehavioralStatus("loading");
      setBehavioralRequestedForId(numericId);
    }
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const nextIndex = (index + direction + RECOMMENDATION_SECTIONS.length) % RECOMMENDATION_SECTIONS.length;
    const nextSection = RECOMMENDATION_SECTIONS[nextIndex];
    selectSection(nextSection.id);
    document.getElementById(`${nextSection.id}-recommendation-tab`)?.focus();
  };

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  if (isProductsLoading && !sourceProduct) {
    return <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white" />;
  }
  if (!normalizedSourceProduct) {
    return <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white"><div><p className="text-base font-bold">상품 정보를 불러오지 못했어요.</p><button type="button" onClick={() => router.back()} className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-gray-200 transition active:scale-[0.98]">돌아가기</button></div></main>;
  }

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white lg:pt-24">
      <div className="mx-auto w-full max-w-7xl">
        <button type="button" onClick={() => router.back()} className="group flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-400 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70">
          <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />뒤로가기
        </button>

        <header className="ui-panel mt-5 mb-7 rounded-[24px] border border-white/[0.08] bg-[#111114] p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_18px_46px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-300">PRODUCT RECOMMENDATIONS</p>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">추천 상품 둘러보기</h1>
            </div>
            <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/[0.18] p-2.5 lg:max-w-md">
              <div className="isolate h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.06] p-1.5" style={{ position: "relative" }}>
                <ProgressiveImage src={normalizedSourceProduct.image} thumbnailSrc={normalizedSourceProduct.thumbnailImage} alt={normalizedSourceProduct.name} className="rounded-lg object-contain" loading="eager" onError={handleImageLoadError} />
              </div>
              <div className="min-w-0"><p className="text-[11px] font-bold tracking-wide text-gray-500">보고 있는 상품</p><p className="mt-1 truncate text-xs font-bold text-orange-300">{normalizedSourceProduct.brand}</p><p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-gray-100 sm:text-base">{normalizedSourceProduct.name}</p></div>
            </div>
          </div>
        </header>

        <section className="pb-8 pt-2 sm:pb-10 sm:pt-3" aria-label="상품 추천">
          <div role="tablist" aria-label="상품 추천 기준" className="grid grid-cols-3 rounded-2xl border border-white/[0.1] bg-white/[0.045] p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
            {RECOMMENDATION_SECTIONS.map((section, index) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  id={`${section.id}-recommendation-tab`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${section.id}-recommendation-panel`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => selectSection(section.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`min-h-11 rounded-xl px-2 text-xs font-bold transition-[background-color,color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 sm:px-4 sm:text-sm ${isActive ? "bg-orange-400 text-black shadow-[0_5px_14px_rgba(249,115,22,0.22)]" : "text-gray-400 hover:bg-white/[0.07] hover:text-white active:scale-[0.98]"}`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          {RECOMMENDATION_SECTIONS.map((section) => {
            if (section.id !== activeSection) return null;
            const productsForSection = section.id === "similar" ? similarProducts : section.id === "style" ? styleProducts : behavioralProducts;
            const isBehavioral = section.id === "behavioral";
            const hasProducts = productsForSection.length > 0;
            const emptyTitle = section.id === "similar" ? "비슷한 상품을 아직 찾지 못했어요." : "함께 잘 어울리는 상품을 아직 찾지 못했어요.";
            const emptyDescription = section.id === "similar"
              ? "같은 카테고리의 이미지 임베딩이 준비된 상품이 추가되면 여기에서 보여드릴게요."
              : "무드와 스타일 속성이 더 잘 맞는 다른 카테고리 상품이 추가되면 여기에서 보여드릴게요.";

            return (
              <div key={section.id} id={`${section.id}-recommendation-panel`} role="tabpanel" aria-labelledby={`${section.id}-recommendation-tab`} tabIndex={0} className="pt-7 sm:pt-8">
                <div className="mb-5"><h3 className="text-xl font-black tracking-[-0.02em] text-white">{section.title}</h3></div>
                {isBehavioral && (!hasProducts || behavioralStatus !== "ready") ? (
                  <EmptyBehavioralCard status={behavioralStatus} />
                ) : hasProducts ? (
                  <div className="grid grid-cols-2 gap-3 pb-2 lg:grid-cols-4 lg:gap-5">{productsForSection.map((product) => <ProductCard key={product.id} product={product} onImageLoadError={handleImageLoadError} />)}</div>
                ) : (
                  <EmptyRecommendationState title={emptyTitle} description={emptyDescription} />
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
