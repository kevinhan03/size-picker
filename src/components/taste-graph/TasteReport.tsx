"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { Product, StyleTagName } from "../../types";
import { buildBrandClusters } from "../../utils/brandClusters";
import {
  compareTasteCollections,
  computeTasteShift,
  computeTasteSummary,
  describeTasteCollection,
  styleTagLabel,
  tagColor,
  type TasteCollectionSource,
  type TasteCollectionComparison,
  type TasteShift,
} from "../../utils/tasteGraph";

type MapTarget = { source?: TasteCollectionSource; tag?: StyleTagName };
const CATEGORY_LABELS: Record<string, { ko: string; en: string }> = {
  top: { ko: "상의", en: "Tops" },
  bottom: { ko: "하의", en: "Bottoms" },
  outer: { ko: "아우터", en: "Outerwear" },
  shoes: { ko: "신발", en: "Shoes" },
};

type CategoryTaste = {
  category: string;
  productCount: number;
  tags: StyleTagName[];
};

const CATEGORY_TASTE_MIN_PRODUCTS = 5;

type TasteConclusion = {
  title: string;
  description: string;
};

function getTasteConclusion(
  comparison: TasteCollectionComparison,
  isEnglish: boolean
): TasteConclusion | null {
  const aspiration = comparison.aspirations[0];
  const saturated = comparison.saturated;

  if (aspiration && saturated) {
    return isEnglish
      ? {
          title: `You save ${styleTagLabel(aspiration.tag)} more often, but ${styleTagLabel(saturated.tag)} makes up more of your Closet.`,
          description:
            "This shows both what you're newly drawn to and what you actually pick most often.",
        }
      : {
          title: `${styleTagLabel(aspiration.tag)}을 더 자주 저장하지만, 옷장에는 ${styleTagLabel(saturated.tag)} 비중이 더 높아요.`,
          description:
            "새롭게 끌리는 방향과 실제로 자주 선택하는 방향이 함께 보여요.",
        };
  }

  if (aspiration) {
    return isEnglish
      ? {
          title: `${styleTagLabel(aspiration.tag)} is a taste you're newly drawn to right now.`,
          description:
            "It shows up often in your saved products, but you don't have much of it in your Closet yet.",
        }
      : {
          title: `${styleTagLabel(aspiration.tag)}이 지금 새롭게 끌리는 취향이에요.`,
          description:
            "저장한 상품에서는 자주 보이지만, 옷장에는 아직 적게 쌓여 있어요.",
        };
  }

  if (comparison.shared) {
    return isEnglish
      ? {
          title: `${styleTagLabel(comparison.shared.tag)} is a taste you like and actually wear often.`,
          description:
            "The same direction keeps showing up in both your saved products and your Closet.",
        }
      : {
          title: `${styleTagLabel(comparison.shared.tag)}은 좋아하고 실제로도 자주 입는 취향이에요.`,
          description: "저장한 상품과 옷장에서 같은 방향이 반복되고 있어요.",
        };
  }

  const strongest =
    comparison.digbox.entries[0] || comparison.closet.entries[0];
  if (!strongest) return null;
  return isEnglish
    ? {
        title: `${styleTagLabel(strongest.tag)} is your clearest taste right now.`,
        description:
          "The more products you save, the clearer your taste direction becomes.",
      }
    : {
        title: `${styleTagLabel(strongest.tag)}이 지금 가장 선명한 취향이에요.`,
        description: "더 많은 상품을 저장할수록 나만의 취향 방향이 또렷해져요.",
      };
}

export function TasteReport({
  closetProducts,
  digboxProducts,
  onOpenMap,
  onOpenBrandMap,
}: {
  closetProducts: Product[];
  digboxProducts: Product[];
  onOpenMap: (target?: MapTarget) => void;
  onOpenBrandMap?: () => void;
}) {
  const { locale, t } = useLocaleContext();
  const isEnglish = locale === "en";
  const comparison = compareTasteCollections(closetProducts, digboxProducts);
  const conclusion = getTasteConclusion(comparison, isEnglish);
  const canCompare =
    comparison.closet.taggedCount > 0 && comparison.digbox.taggedCount > 0;
  const brandProducts = Array.from(
    new globalThis.Map(
      [...digboxProducts, ...closetProducts].map((product) => [
        product.id,
        product,
      ])
    ).values()
  );
  const categoryTastes = getCategoryTastes(brandProducts);
  const brandClusters = buildBrandClusters(brandProducts).clusters;
  const preferredBrands = brandClusters.slice(0, 3);
  const preferredBrandTags = computeTasteSummary(brandProducts)
    .entries.slice(0, 2)
    .map((entry) => entry.tag);
  const recordCount = closetProducts.length + digboxProducts.length;
  return (
    <main className="taste-report" aria-labelledby="taste-report-title">
      <PageHeader
        eyebrow="MY TASTE"
        title={t("tasteReport.title")}
        titleId="taste-report-title"
        description={t("tasteReport.description", { count: recordCount })}
      />

      {conclusion ? (
        <section
          className="taste-report-conclusion"
          aria-labelledby="taste-conclusion-title"
        >
          <p>YOUR TASTE, NOW</p>
          <h2 id="taste-conclusion-title">{conclusion.title}</h2>
          <span>{conclusion.description}</span>
          <Link href="/" className="taste-report-conclusion-link">
            {isEnglish ? "Discover new products" : "새로운 상품 디깅하기"}{" "}
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <TasteShiftSection
        digboxShift={computeTasteShift(digboxProducts, "digbox")}
        closetShift={computeTasteShift(closetProducts, "closet")}
      />

      <section
        className="taste-report-details"
        aria-labelledby="taste-evidence-title"
      >
        <div className="taste-report-evidence-header">
          <div>
            <p>TASTE CHECK</p>
            <div className="taste-report-title-row">
              <h2 id="taste-evidence-title">{t("tasteReport.comparison")}</h2>
              <details className="taste-report-method">
                <summary
                  aria-label={
                    isEnglish
                      ? "How taste shares are calculated"
                      : "전체 스타일 무드 설명"
                  }
                >
                  <Info aria-hidden="true" />
                </summary>
                <p>
                  {isEnglish
                    ? "These shares compare the overall style mood of analyzed products. They are not a count of products in each style."
                    : "각 목록에 담긴 상품들의 스타일 성향을 합쳐 보여드립니다. 상품 개수 비율이 아니라, 목록 전체에서 느껴지는 스타일 무드입니다."}
                </p>
              </details>
            </div>
          </div>
        </div>
        <div className="taste-report-details-content">
          {canCompare && comparison.saturated ? (
            <p className="taste-report-saturated">
              {isEnglish ? (
                <>
                  The taste that appears more in your Closet is{" "}
                  <strong>{styleTagLabel(comparison.saturated.tag)}</strong>.
                  Closet {Math.round(comparison.saturated.closetPercent)}% ·
                  Saved {Math.round(comparison.saturated.digboxPercent)}%
                </>
              ) : (
                <>
                  옷장에 더 많이 있는 취향은{" "}
                  <strong>{styleTagLabel(comparison.saturated.tag)}</strong>
                  이에요. 옷장 {Math.round(comparison.saturated.closetPercent)}%
                  · 저장 {Math.round(comparison.saturated.digboxPercent)}%
                </>
              )}
            </p>
          ) : null}
          <div className="taste-report-sources">
            <TasteSourceSection
              source="digbox"
              title={
                isEnglish
                  ? "Style mood of Saved products"
                  : "저장한 상품의 스타일 무드"
              }
              products={digboxProducts}
            />
            <TasteSourceSection
              source="closet"
              title={isEnglish ? "Closet" : "옷장"}
              products={closetProducts}
            />
          </div>
          <button
            type="button"
            className="taste-report-graph-button"
            onClick={() => onOpenMap()}
          >
            {t("tasteReport.openGraph")} <ArrowRight aria-hidden="true" />
          </button>
          {categoryTastes.length > 0 ? (
            <section
              className="taste-report-categories"
              aria-labelledby="taste-categories-title"
            >
              <div>
                <p>CATEGORY TASTE</p>
                <h2 id="taste-categories-title">
                  {isEnglish
                    ? "Taste that changes by category"
                    : "카테고리마다 달라지는 취향"}
                </h2>
                <span>
                  {isEnglish
                    ? "Only categories with a character distinct from your overall taste are shown."
                    : "전체 취향과 다른 결이 보이는 카테고리만 보여드려요."}
                </span>
              </div>
              <div className="taste-category-list">
                {categoryTastes.map((item) => (
                  <article key={item.category}>
                    <div>
                      <h3>
                        {CATEGORY_LABELS[item.category]?.[locale] ??
                          item.category}
                      </h3>
                      <span>
                        {isEnglish
                          ? `Based on ${item.productCount} products`
                          : `${item.productCount}개 상품 기준`}
                      </span>
                    </div>
                    <p>
                      <strong>{styleTagLabel(item.tags[0])}</strong>
                      {item.tags[1] ? (
                        <>, {styleTagLabel(item.tags[1])}</>
                      ) : null}
                      <span>
                        {isEnglish
                          ? " moods stand out."
                          : " 무드가 두드러져요."}
                      </span>
                    </p>
                    <div
                      className="taste-category-tags"
                      aria-label={
                        isEnglish
                          ? `Key styles for ${CATEGORY_LABELS[item.category]?.en ?? item.category}`
                          : `${CATEGORY_LABELS[item.category]?.ko ?? item.category}의 주요 스타일`
                      }
                    >
                      {item.tags.map((tag) => (
                        <span key={tag}>
                          <i style={{ backgroundColor: tagColor(tag).base }} />
                          {styleTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {onOpenBrandMap && preferredBrands.length > 1 ? (
        <section
          className="taste-report-brands"
          aria-labelledby="taste-brand-title"
        >
          <div>
            <p>BRANDS</p>
            <h2 id="taste-brand-title">
              {preferredBrandTags.length
                ? isEnglish
                  ? `You often explore brands with ${preferredBrandTags.map(styleTagLabel).join(" · ")} moods`
                  : `${preferredBrandTags.map(styleTagLabel).join(" · ")} 계열 브랜드를 자주 찾고 있어요`
                : isEnglish
                  ? "Your preferred brand direction"
                  : "선호하는 브랜드 결"}
            </h2>
            <span>
              {isEnglish
                ? `We analyzed ${brandProducts.length} saved and Closet products together.`
                : `저장한 상품과 옷장 ${brandProducts.length}개를 함께 분석했어요.`}
            </span>
            <div
              className="taste-brand-list"
              aria-label={isEnglish ? "Preferred brands" : "선호 브랜드"}
            >
              {preferredBrands.map((brand) => {
                return (
                  <article key={brand.id}>
                    <div className="taste-brand-list-heading">
                      <strong>{brand.displayName}</strong>
                    </div>
                    <div
                      className="taste-brand-counts"
                      aria-label={t("tasteReport.brandComposition", {
                        brand: brand.displayName,
                      })}
                    >
                      <span>
                        {isEnglish
                          ? `${brand.count} products`
                          : `상품 ${brand.count}개`}
                      </span>
                    </div>
                    <div
                      className="taste-brand-tags"
                      aria-label={t("tasteReport.keyStyles", {
                        brand: brand.displayName,
                      })}
                    >
                      {brand.topTags.slice(0, 2).map(({ tag }) => (
                        <span key={tag}>
                          <i
                            style={{ backgroundColor: tagColor(tag).base }}
                            aria-hidden="true"
                          />
                          {styleTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <button type="button" onClick={onOpenBrandMap}>
            {isEnglish ? "View brand taste graph" : "브랜드 취향 그래프 보기"}{" "}
            <ArrowRight aria-hidden="true" />
          </button>
        </section>
      ) : null}

      <style jsx>{`
        .taste-report {
          --taste-space-1: 0.5rem;
          --taste-space-2: 0.75rem;
          --taste-space-3: 1rem;
          --taste-space-4: 1.5rem;
          --taste-space-5: 2rem;
          --taste-section-gap: clamp(2rem, 4vw, 3rem);
          box-sizing: border-box;
          width: min(
            100%,
            calc(70rem + var(--app-main-px) + var(--app-main-px))
          );
          min-height: 100vh;
          margin: 0 auto;
          padding: var(--page-header-top) var(--app-main-px) var(--app-main-pb);
          background: #000;
          color: #f5f5f6;
          font-family: var(--font-sans);
        }
        .taste-report-conclusion {
          margin-top: var(--page-header-content-gap);
          padding: var(--taste-space-4);
          border: 1px solid rgba(249, 115, 22, 0.28);
          border-radius: 0.875rem;
          background: #141519;
        }
        .taste-report-conclusion > p {
          margin: 0;
          color: #fdba74;
          font-size: 0.625rem;
          font-weight: 850;
          letter-spacing: 0.1em;
        }
        .taste-report-conclusion h2 {
          margin: 0.5rem 0 0;
          color: #f8fafc;
          font-size: clamp(1.25rem, 2.5vw, 1.625rem);
          font-weight: 780;
          letter-spacing: -0.03em;
          line-height: 1.35;
        }
        .taste-report-conclusion > span {
          display: block;
          max-width: 38rem;
          margin-top: 0.625rem;
          color: #b8c0cc;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.6;
        }
        :global(a.taste-report-conclusion-link) {
          display: inline-flex;
          min-height: 2.75rem;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-top: var(--taste-space-4);
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          background: #f97316;
          color: #17120e;
          font-size: 0.8125rem;
          font-weight: 800;
          line-height: 1;
          text-decoration: none;
        }
        :global(a.taste-report-conclusion-link svg) {
          flex: 0 0 auto;
          width: 0.9rem;
          height: 0.9rem;
        }
        :global(a.taste-report-conclusion-link:focus-visible) {
          outline: 2px solid #fdba74;
          outline-offset: 3px;
        }
        :global(.taste-shift) {
          margin-top: var(--taste-section-gap);
          padding-top: var(--taste-space-4);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        :global(.taste-shift-header > p) {
          margin: 0;
          color: #7f8998;
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }
        :global(.taste-shift-header h2) {
          margin: 0.375rem 0 0;
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          font-weight: 750;
          letter-spacing: -0.025em;
          line-height: 1.25;
        }
        :global(.taste-shift-header > span) {
          display: block;
          margin-top: 0.625rem;
          color: #aeb7c4;
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.55;
        }
        :global(.taste-shift-cards) {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--taste-space-3);
          margin-top: var(--taste-space-4);
        }
        :global(.taste-shift-card) {
          min-width: 0;
          padding: var(--taste-space-4);
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 0.875rem;
          background: #141519;
        }
        :global(.taste-shift-card > p) {
          margin: 0;
          color: #f2a56c;
          font-size: 0.625rem;
          font-weight: 820;
          letter-spacing: 0.1em;
        }
        :global(.taste-shift-card h3) {
          margin: 0.5rem 0 0;
          color: #f5f5f6;
          font-size: 1.0625rem;
          font-weight: 760;
          letter-spacing: -0.025em;
          line-height: 1.4;
        }
        :global(.taste-shift-card > span) {
          display: block;
          margin-top: 0.5rem;
          color: #9ea8b7;
          font-size: 0.75rem;
          font-weight: 650;
        }
        :global(.taste-shift-change) {
          display: grid;
          gap: 0.5rem;
          margin: var(--taste-space-3) 0 0;
        }
        :global(.taste-shift-change div) {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          color: #c9d0da;
          font-size: 0.8125rem;
          font-weight: 650;
        }
        :global(.taste-shift-change strong) {
          color: #f5f5f6;
          font-weight: 760;
        }
        :global(.taste-shift-change em) {
          color: #8f99a8;
          font-size: 0.75rem;
          font-style: normal;
          font-variant-numeric: tabular-nums;
        }
        :global(.taste-shift-empty) {
          color: #aeb7c4;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.55;
        }
        .taste-report-evidence-header p {
          margin: 0;
          color: #7f8998;
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }
        .taste-report-details {
          position: relative;
          margin-top: var(--taste-section-gap);
        }
        .taste-report-evidence-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: var(--taste-space-4);
        }
        .taste-report-title-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 0.375rem;
        }
        .taste-report-evidence-header h2 {
          margin: 0;
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          font-weight: 750;
          letter-spacing: -0.025em;
          line-height: 1.25;
        }
        .taste-report-method {
          position: relative;
          flex: 0 0 auto;
        }
        .taste-report-method summary {
          display: grid;
          width: 1.5rem;
          height: 1.5rem;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          color: #aeb7c4;
          cursor: pointer;
          list-style: none;
        }
        .taste-report-method summary::-webkit-details-marker {
          display: none;
        }
        .taste-report-method summary :global(svg) {
          width: 0.8rem;
          height: 0.8rem;
        }
        .taste-report-method p {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          z-index: 3;
          width: min(18rem, calc(100vw - 3rem));
          margin: 0;
          padding: 0.7rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 0.625rem;
          background: #202228;
          box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.25);
          color: #c9d0da;
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1.55;
        }
        .taste-report-graph-button,
        .taste-report-brands button {
          display: inline-flex;
          min-height: 2.75rem;
          flex: 0 0 auto;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 0.25rem;
          border: 0;
          border-radius: 0.5rem;
          background: transparent;
          color: #c9d0da;
          cursor: pointer;
          font: inherit;
          font-size: 0.8125rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .taste-report-graph-button {
          position: absolute;
          top: 0;
          right: 0;
        }
        .taste-report-graph-button :global(svg),
        .taste-report-brands button :global(svg) {
          width: 0.9rem;
          height: 0.9rem;
          color: #f2a56c;
        }
        .taste-report-graph-button :global(svg):last-child,
        .taste-report-brands button :global(svg):last-child {
          margin-left: 0.125rem;
        }
        .taste-report-details-content {
          padding-top: var(--taste-space-4);
        }
        .taste-report-saturated {
          margin: 0;
          color: #aeb7c4;
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.55;
        }
        .taste-report-saturated strong {
          color: #f5f5f6;
          font-weight: 750;
        }
        .taste-report-sources {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(var(--taste-space-4), 3vw, 3rem);
          margin-top: var(--taste-space-4);
        }
        .taste-report-categories {
          display: grid;
          grid-template-columns: minmax(13rem, 0.65fr) minmax(0, 1.35fr);
          gap: clamp(var(--taste-space-4), 3vw, 3rem);
          margin-top: var(--taste-space-5);
          padding-top: var(--taste-space-4);
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        .taste-report-categories > div > p {
          margin: 0;
          color: #7f8998;
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }
        .taste-report-categories h2 {
          margin: 0.375rem 0 0;
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          font-weight: 750;
          letter-spacing: -0.025em;
          line-height: 1.25;
        }
        .taste-report-categories > div > span {
          display: block;
          margin-top: 0.75rem;
          color: #aeb7c4;
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.55;
        }
        .taste-category-list {
          display: grid;
          gap: 1rem;
        }
        .taste-category-list article {
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.09);
        }
        .taste-category-list article:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }
        .taste-category-list article > div:first-child {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
        }
        .taste-category-list h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 750;
          letter-spacing: -0.02em;
        }
        .taste-category-list article > div:first-child span {
          color: #7f8998;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .taste-category-list article > p {
          margin: 0.5rem 0 0;
          color: #c9d0da;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.5;
        }
        .taste-category-list article > p strong {
          color: #fff;
          font-weight: 760;
        }
        .taste-category-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.65rem;
        }
        .taste-category-tags span {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #aeb7c4;
          font-size: 0.75rem;
          font-weight: 650;
        }
        .taste-category-tags i {
          width: 0.4rem;
          height: 0.4rem;
          border-radius: 999px;
        }
        .taste-report-brands {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--taste-space-4);
          margin-top: var(--taste-section-gap);
          padding: var(--taste-space-4) 0 0;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        .taste-report-brands > div > p {
          margin: 0;
          color: #7f8998;
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }
        .taste-report-brands h2 {
          margin: 0.375rem 0 0;
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          font-weight: 750;
          letter-spacing: -0.025em;
          line-height: 1.25;
        }
        .taste-report-brands > div > span {
          display: block;
          margin-top: 0.75rem;
          color: #aeb7c4;
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.55;
        }
        .taste-brand-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .taste-brand-list article {
          min-width: 0;
          padding-left: 0.75rem;
          border-left: 2px solid rgba(255, 255, 255, 0.18);
        }
        .taste-brand-list-heading {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .taste-brand-list-heading strong {
          overflow: hidden;
          color: #f5f5f6;
          font-size: 0.8125rem;
          font-weight: 760;
          letter-spacing: -0.01em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .taste-brand-counts {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.35rem;
          color: #8f98a7;
          font-size: 0.6875rem;
          font-weight: 650;
        }
        .taste-brand-counts i {
          color: #515866;
          font-style: normal;
        }
        .taste-brand-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem 0.6rem;
          margin-top: 0.45rem;
        }
        .taste-brand-tags span {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #b9c0cc;
          font-size: 0.6875rem;
          font-weight: 650;
          white-space: nowrap;
        }
        .taste-brand-tags i {
          width: 0.35rem;
          height: 0.35rem;
          border-radius: 999px;
        }
        @media (hover: hover) and (pointer: fine) {
          :global(a.taste-report-conclusion-link:hover) {
            background: #fb923c;
          }
          .taste-report-method summary:hover {
            border-color: rgba(255, 255, 255, 0.34);
            color: #f5f5f6;
          }
          .taste-report-graph-button:hover,
          .taste-report-brands button:hover {
            background: rgba(255, 255, 255, 0.06);
            color: #fff;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          :global(a.taste-report-conclusion-link),
          .taste-report-graph-button,
          .taste-report-brands button {
            transition:
              transform var(--duration-press) var(--ease-out),
              background-color var(--duration-press) var(--ease-out),
              color var(--duration-press) var(--ease-out);
          }
          :global(a.taste-report-conclusion-link:active),
          .taste-report-graph-button:active,
          .taste-report-brands button:active {
            transform: scale(0.98);
          }
        }
        @media (max-width: 700px) {
          .taste-report-sources,
          .taste-report-categories,
          .taste-brand-list,
          :global(.taste-shift-cards) {
            grid-template-columns: 1fr;
          }
          .taste-report-evidence-header,
          .taste-report-brands {
            align-items: stretch;
            flex-direction: column;
          }
          :global(a.taste-report-conclusion-link) {
            display: flex;
            width: 100%;
          }
          .taste-report-graph-button {
            position: static;
            align-self: flex-start;
            margin-top: var(--taste-space-4);
          }
          .taste-report-brands button {
            align-self: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

function TasteShiftSection({
  digboxShift,
  closetShift,
}: {
  digboxShift: TasteShift;
  closetShift: TasteShift;
}) {
  const { locale, t } = useLocaleContext();
  const isEnglish = locale === "en";
  return (
    <section className="taste-shift" aria-labelledby="taste-shift-title">
      <div className="taste-shift-header">
        <p>TASTE SHIFT</p>
        <h2 id="taste-shift-title">
          {isEnglish ? "Taste shift" : "취향의 변화"}
        </h2>
        <span>
          {isEnglish
            ? "Compares your long-term taste with the direction of your recent saves once enough dated products have accumulated."
            : "시간 기록이 충분히 쌓이면, 장기 취향과 최근 저장 흐름을 비교합니다."}
        </span>
      </div>
      <div className="taste-shift-cards">
        <TasteShiftCard
          title={t("tasteReport.savedProducts")}
          shift={digboxShift}
          isEnglish={isEnglish}
        />
        <TasteShiftCard
          title={isEnglish ? "Style mood of Closet" : "옷장의 스타일 무드"}
          shift={closetShift}
          isEnglish={isEnglish}
        />
      </div>
    </section>
  );
}

function TasteShiftCard({
  title,
  shift,
  isEnglish,
}: {
  title: string;
  shift: TasteShift;
  isEnglish: boolean;
}) {
  if (!shift.eligibleCount) {
    return (
      <article className="taste-shift-card">
        <p>{title.toUpperCase()}</p>
        <h3>
          {isEnglish
            ? "No taste history to read yet."
            : "아직 읽을 취향 기록이 없어요."}
        </h3>
        <span className="taste-shift-empty">
          {isEnglish
            ? "Add products with style tags and we'll show the trend here."
            : "스타일이 분석된 상품을 추가하면 이곳에서 흐름을 보여드려요."}
        </span>
      </article>
    );
  }

  const recentTop = shift.recent.entries[0] || null;
  if (shift.confidence === "early") {
    return (
      <article className="taste-shift-card">
        <p>{title.toUpperCase()}</p>
        <h3>
          {recentTop
            ? isEnglish
              ? `Early signal so far. Your recent saves lean toward ${styleTagLabel(recentTop.tag)}.`
              : `아직 초기 신호예요. 최근 저장은 ${styleTagLabel(recentTop.tag)} 쪽에 기울어 있어요.`
            : isEnglish
              ? "Early signal so far."
              : "아직 초기 신호예요."}
        </h3>
        {recentTop ? (
          <div
            className="taste-shift-change"
            aria-label={
              isEnglish ? `${title} current taste` : `${title} 현재 취향`
            }
          >
            <div>
              <strong>{styleTagLabel(recentTop.tag)}</strong>
              <em>
                {isEnglish
                  ? `Recent ${Math.round(recentTop.percent)}%`
                  : `최근 ${Math.round(recentTop.percent)}%`}
              </em>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  const primary = shift.primary;
  const titleCopy = primary
    ? primary.change > 0
      ? isEnglish
        ? `You've been more drawn to ${styleTagLabel(primary.tag)} style lately.`
        : `최근에는 ${styleTagLabel(primary.tag)}한 스타일에 더 끌리고 있어요.`
      : isEnglish
        ? `${styleTagLabel(primary.tag)} has made up a bit less of your picks lately.`
        : `최근에는 ${styleTagLabel(primary.tag)} 비중이 조금 줄었어요.`
    : isEnglish
      ? recentTop
        ? `${styleTagLabel(recentTop.tag)} has stayed present in your recent saves.`
        : "Your recent taste has stayed consistent."
      : recentTop
        ? `요즘도 ${styleTagLabel(recentTop.tag)} 무드가 이어지고 있어요.`
        : "요즘 취향이 이어지고 있어요.";
  const rows = [primary, shift.secondary].filter(
    (entry): entry is NonNullable<typeof entry> => Boolean(entry)
  );

  return (
    <article className="taste-shift-card">
      <p>{title.toUpperCase()}</p>
      <h3>{titleCopy}</h3>
      {rows.length ? (
        <div
          className="taste-shift-change"
          aria-label={isEnglish ? `${title} taste shift` : `${title} 취향 변화`}
        >
          {rows.map((entry) => (
            <div key={entry.tag}>
              <strong>{styleTagLabel(entry.tag)}</strong>
              <em>
                {Math.round(entry.longTermPercent)}% →{" "}
                {Math.round(entry.recentPercent)}%
              </em>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function getCategoryTastes(products: Product[]): CategoryTaste[] {
  const overallTags = computeTasteSummary(products)
    .entries.slice(0, 2)
    .map((entry) => entry.tag);
  return Object.keys(CATEGORY_LABELS).flatMap((category) => {
    const categoryProducts = products.filter(
      (product) => product.category?.trim().toLowerCase() === category
    );
    const summary = computeTasteSummary(categoryProducts);
    if (
      summary.taggedCount < CATEGORY_TASTE_MIN_PRODUCTS ||
      !summary.entries.length
    )
      return [];
    const categoryTags = summary.entries.slice(0, 2).map((entry) => entry.tag);
    const differsFromOverall = categoryTags.some(
      (tag, index) => tag !== overallTags[index]
    );
    if (!differsFromOverall) return [];
    return [
      {
        category,
        productCount: summary.taggedCount,
        tags: categoryTags,
      },
    ];
  });
}

function TasteSourceSection({
  source,
  title,
  products,
}: {
  source: TasteCollectionSource;
  title: string;
  products: Product[];
}) {
  const { t } = useLocaleContext();
  const summary = computeTasteSummary(products);
  const interpretation = describeTasteCollection(products, summary);
  const topEntries = summary.entries.slice(0, 4);

  return (
    <section
      className="taste-source"
      aria-labelledby={`taste-source-${source}`}
    >
      <div className="taste-source-header">
        <div>
          <h3 id={`taste-source-${source}`}>{title}</h3>
        </div>
        {summary.taggedCount > 0 ? (
          <span>
            {t("tasteReport.basedOnCount", { count: summary.taggedCount })}
          </span>
        ) : null}
      </div>
      {interpretation && topEntries.length ? (
        <>
          <p className="taste-source-summary">{interpretation.summary}</p>
          <div className="taste-source-bars">
            {topEntries.map((entry) => (
              <div key={entry.tag} className="taste-source-tag">
                <span>{styleTagLabel(entry.tag)}</span>
                <i>
                  <b
                    style={{
                      width: `${entry.percent}%`,
                      backgroundColor: tagColor(entry.tag).base,
                    }}
                  />
                </i>
                <strong>{Math.round(entry.percent)}%</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="taste-source-empty">{t("tasteReport.emptySource")}</p>
      )}
      <style jsx>{`
        .taste-source {
          min-width: 0;
        }
        .taste-source-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 1rem;
        }
        .taste-source-header p {
          margin: 0;
          color: #aeb7c4;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .taste-source-header h3 {
          margin: 0.5rem 0 0;
          font-size: 1.25rem;
          font-weight: 760;
          letter-spacing: -0.025em;
          line-height: 1.25;
        }
        .taste-source-header > span {
          flex: 0 0 auto;
          color: #7f8998;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .taste-source-summary,
        .taste-source-empty {
          margin: 0.75rem 0 0;
          color: #c6ccd5;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.6;
        }
        .taste-source-empty {
          color: #8f99a8;
        }
        .taste-source-bars {
          display: grid;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .taste-source-tag {
          display: grid;
          grid-template-columns: 8rem minmax(3rem, 1fr) 2.25rem;
          align-items: center;
          gap: 0.65rem;
          width: 100%;
          padding: 0.45rem 0;
          color: #f3f4f6;
          text-align: left;
        }
        .taste-source-tag > span {
          overflow: hidden;
          font-size: 0.8125rem;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .taste-source-tag i {
          height: 0.375rem;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
        }
        .taste-source-tag b {
          display: block;
          height: 100%;
          min-width: 0.375rem;
          border-radius: inherit;
        }
        .taste-source-tag strong {
          color: #aeb7c4;
          font-size: 0.75rem;
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
      `}</style>
    </section>
  );
}
