"use client";

import { ArrowRight } from "lucide-react";
import { PageHeader } from "../PageHeader";
import type { Product, StyleTagName } from "../../types";
import { buildBrandClusters } from "../../utils/brandClusters";
import {
  compareTasteCollections,
  computeTasteSummary,
  describeTasteCollection,
  styleTagLabel,
  tagColor,
  type TasteCollectionSource,
} from "../../utils/tasteGraph";

type MapTarget = { source?: TasteCollectionSource; tag?: StyleTagName };
const CATEGORY_LABELS: Record<string, string> = { top: "상의", bottom: "하의", outer: "아우터" };

type CategoryTaste = {
  category: string;
  productCount: number;
  tags: StyleTagName[];
};

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
  const comparison = compareTasteCollections(closetProducts, digboxProducts);
  const canCompare = comparison.closet.taggedCount > 0 && comparison.digbox.taggedCount > 0;
  const categoryTastes = getCategoryTastes([...digboxProducts, ...closetProducts]);
  const brandProducts = Array.from(new globalThis.Map([...digboxProducts, ...closetProducts].map((product) => [product.id, product])).values());
  const brandClusters = buildBrandClusters(brandProducts).clusters;
  const preferredBrands = brandClusters.slice(0, 3);
  const preferredBrandTags = computeTasteSummary(brandProducts).entries.slice(0, 2).map((entry) => entry.tag);
  const digboxProductIds = new globalThis.Set(digboxProducts.map((product) => product.id));
  const closetProductIds = new globalThis.Set(closetProducts.map((product) => product.id));
  const recordCount = closetProducts.length + digboxProducts.length;
  return (
    <main className="taste-report" aria-labelledby="taste-report-title">
      <PageHeader
        eyebrow="MY TASTE"
        title="나의 취향"
        titleId="taste-report-title"
        description={<>저장한 상품과 옷장 {recordCount}개를 바탕으로 정리했어요.</>}
      />

      <section className="taste-report-details" aria-labelledby="taste-evidence-title">
        <div className="taste-report-evidence-header">
          <div>
            <p>TASTE CHECK</p>
            <h2 id="taste-evidence-title">저장한 취향과 옷장 취향</h2>
          </div>
          <button type="button" onClick={() => onOpenMap()}>
            취향 그래프 보기 <ArrowRight aria-hidden="true" />
          </button>
        </div>
        <div className="taste-report-details-content">
          {canCompare && comparison.saturated ? (
            <p className="taste-report-saturated">
              옷장에 더 많이 있는 취향은 <strong>{styleTagLabel(comparison.saturated.tag)}</strong>이에요. 옷장 {Math.round(comparison.saturated.closetPercent)}% · 저장 {Math.round(comparison.saturated.digboxPercent)}%
            </p>
          ) : null}
          <div className="taste-report-sources">
            <TasteSourceSection source="digbox" title="저장한 상품" products={digboxProducts} />
            <TasteSourceSection source="closet" title="옷장" products={closetProducts} />
          </div>
          {categoryTastes.length > 0 ? (
            <section className="taste-report-categories" aria-labelledby="taste-categories-title">
              <div>
                <p>CATEGORY TASTE</p>
                <h2 id="taste-categories-title">카테고리마다 달라지는 취향</h2>
                <span>전체 취향과 다른 결이 보이는 카테고리만 보여드려요.</span>
              </div>
              <div className="taste-category-list">
                {categoryTastes.map((item) => (
                  <article key={item.category}>
                    <div><h3>{CATEGORY_LABELS[item.category]}</h3><span>{item.productCount}개 상품 기준</span></div>
                    <p><strong>{styleTagLabel(item.tags[0])}</strong>{item.tags[1] ? <>, {styleTagLabel(item.tags[1])}</> : null}<span> 무드가 두드러져요.</span></p>
                    <div className="taste-category-tags" aria-label={`${CATEGORY_LABELS[item.category]}의 주요 스타일`}>
                      {item.tags.map((tag) => <span key={tag}><i style={{ backgroundColor: tagColor(tag).base }} />{styleTagLabel(tag)}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {onOpenBrandMap && preferredBrands.length > 1 ? (
        <section className="taste-report-brands" aria-labelledby="taste-brand-title">
          <div>
            <p>BRANDS</p>
            <h2 id="taste-brand-title">
              {preferredBrandTags.length
                ? `${preferredBrandTags.map(styleTagLabel).join(" · ")} 계열 브랜드를 자주 찾고 있어요`
                : "선호하는 브랜드 결"}
            </h2>
            <span>저장한 상품과 옷장 {brandProducts.length}개를 함께 분석했어요.</span>
            <div className="taste-brand-list" aria-label="선호 브랜드">
              {preferredBrands.map((brand) => {
                const digboxCount = brand.products.filter((product) => digboxProductIds.has(product.id)).length;
                const closetCount = brand.products.filter((product) => closetProductIds.has(product.id)).length;

                return (
                  <article key={brand.id}>
                    <div className="taste-brand-list-heading">
                      <strong>{brand.displayName}</strong>
                    </div>
                    <div className="taste-brand-counts" aria-label={`${brand.displayName} 상품 구성`}>
                      <span>총 {brand.count}개</span>
                      <i aria-hidden="true">·</i>
                      <span>저장 {digboxCount}</span>
                      <i aria-hidden="true">·</i>
                      <span>옷장 {closetCount}</span>
                    </div>
                    <div className="taste-brand-tags" aria-label={`${brand.displayName}의 주요 스타일`}>
                      {brand.topTags.slice(0, 2).map(({ tag }) => (
                        <span key={tag}>
                          <i style={{ backgroundColor: tagColor(tag).base }} aria-hidden="true" />
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
            브랜드 취향 그래프 보기 <ArrowRight aria-hidden="true" />
          </button>
        </section>
      ) : null}

      <style jsx>{`
        .taste-report { --taste-space-1: .5rem; --taste-space-2: .75rem; --taste-space-3: 1rem; --taste-space-4: 1.5rem; --taste-space-5: 2rem; --taste-section-gap: clamp(2rem, 4vw, 3rem); box-sizing: border-box; width: min(100%, 70rem); min-height: 100vh; margin: 0 auto; padding: var(--page-header-top) var(--app-main-px) var(--app-main-pb); background: #000; color: #f5f5f6; font-family: var(--font-sans); }
        .taste-report-evidence-header p { margin: 0; color: #7f8998; font-size: .625rem; font-weight: 800; letter-spacing: .1em; }
        .taste-report-details { margin-top: var(--page-header-content-gap); }
        .taste-report-evidence-header { display: flex; align-items: end; justify-content: space-between; gap: var(--taste-space-4); }
        .taste-report-evidence-header h2 { margin: .375rem 0 0; font-size: clamp(1.25rem, 2vw, 1.5rem); font-weight: 750; letter-spacing: -.025em; line-height: 1.25; }
        .taste-report-evidence-header button, .taste-report-brands button { display: inline-flex; min-height: 2.75rem; flex: 0 0 auto; align-items: center; gap: .35rem; padding: .5rem .25rem; border: 0; border-radius: .5rem; background: transparent; color: #c9d0da; cursor: pointer; font: inherit; font-size: .8125rem; font-weight: 700; white-space: nowrap; }
        .taste-report-evidence-header button :global(svg), .taste-report-brands button :global(svg) { width: .9rem; height: .9rem; color: #f2a56c; }
        .taste-report-evidence-header button :global(svg):last-child, .taste-report-brands button :global(svg):last-child { margin-left: .125rem; }
        .taste-report-details-content { padding-top: var(--taste-space-4); }
        .taste-report-saturated { margin: 0; color: #aeb7c4; font-size: .8125rem; font-weight: 600; line-height: 1.55; }
        .taste-report-saturated strong { color: #f5f5f6; font-weight: 750; }
        .taste-report-sources { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(var(--taste-space-4), 3vw, 3rem); margin-top: var(--taste-space-4); }
        .taste-report-categories { display: grid; grid-template-columns: minmax(13rem, .65fr) minmax(0, 1.35fr); gap: clamp(var(--taste-space-4), 3vw, 3rem); margin-top: var(--taste-space-5); padding-top: var(--taste-space-4); border-top: 1px solid rgba(255,255,255,.12); }
        .taste-report-categories > div > p { margin: 0; color: #7f8998; font-size: .625rem; font-weight: 800; letter-spacing: .1em; }
        .taste-report-categories h2 { margin: .375rem 0 0; font-size: clamp(1.25rem, 2vw, 1.5rem); font-weight: 750; letter-spacing: -.025em; line-height: 1.25; }
        .taste-report-categories > div > span { display: block; margin-top: .75rem; color: #aeb7c4; font-size: .8125rem; font-weight: 600; line-height: 1.55; }
        .taste-category-list { display: grid; gap: 1rem; }
        .taste-category-list article { padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,.09); }
        .taste-category-list article:last-child { padding-bottom: 0; border-bottom: 0; }
        .taste-category-list article > div:first-child { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
        .taste-category-list h3 { margin: 0; font-size: 1rem; font-weight: 750; letter-spacing: -.02em; }
        .taste-category-list article > div:first-child span { color: #7f8998; font-size: .75rem; font-weight: 600; }
        .taste-category-list article > p { margin: .5rem 0 0; color: #c9d0da; font-size: .875rem; font-weight: 600; line-height: 1.5; }
        .taste-category-list article > p strong { color: #fff; font-weight: 760; }
        .taste-category-tags { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .65rem; }
        .taste-category-tags span { display: inline-flex; align-items: center; gap: .35rem; color: #aeb7c4; font-size: .75rem; font-weight: 650; }
        .taste-category-tags i { width: .4rem; height: .4rem; border-radius: 999px; }
        .taste-report-brands { display: flex; align-items: center; justify-content: space-between; gap: var(--taste-space-4); margin-top: var(--taste-section-gap); padding: var(--taste-space-4) 0 0; border-top: 1px solid rgba(255,255,255,.12); }
        .taste-report-brands > div > p { margin: 0; color: #7f8998; font-size: .625rem; font-weight: 800; letter-spacing: .1em; }
        .taste-report-brands h2 { margin: .375rem 0 0; font-size: clamp(1.25rem, 2vw, 1.5rem); font-weight: 750; letter-spacing: -.025em; line-height: 1.25; }
        .taste-report-brands > div > span { display: block; margin-top: .75rem; color: #aeb7c4; font-size: .8125rem; font-weight: 600; line-height: 1.55; }
        .taste-brand-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin-top: 1rem; }
        .taste-brand-list article { min-width: 0; padding-left: .75rem; border-left: 2px solid rgba(255,255,255,.18); }
        .taste-brand-list-heading { display: flex; align-items: baseline; gap: .5rem; }
        .taste-brand-list-heading strong { overflow: hidden; color: #f5f5f6; font-size: .8125rem; font-weight: 760; letter-spacing: -.01em; text-overflow: ellipsis; white-space: nowrap; }
        .taste-brand-counts { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; margin-top: .35rem; color: #8f98a7; font-size: .6875rem; font-weight: 650; }
        .taste-brand-counts i { color: #515866; font-style: normal; }
        .taste-brand-tags { display: flex; flex-wrap: wrap; gap: .35rem .6rem; margin-top: .45rem; }
        .taste-brand-tags span { display: inline-flex; align-items: center; gap: .25rem; color: #b9c0cc; font-size: .6875rem; font-weight: 650; white-space: nowrap; }
        .taste-brand-tags i { width: .35rem; height: .35rem; border-radius: 999px; }
        @media (hover: hover) and (pointer: fine) { .taste-report-evidence-header button:hover, .taste-report-brands button:hover { background: rgba(255,255,255,.06); color: #fff; } }
        @media (prefers-reduced-motion: no-preference) { .taste-report-evidence-header button, .taste-report-brands button { transition: transform var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out); } .taste-report-evidence-header button:active, .taste-report-brands button:active { transform: scale(.98); } }
        @media (max-width: 700px) { .taste-report-sources, .taste-report-categories, .taste-brand-list { grid-template-columns: 1fr; } .taste-report-evidence-header, .taste-report-brands { align-items: stretch; flex-direction: column; } .taste-report-evidence-header button, .taste-report-brands button { align-self: flex-start; } }
      `}</style>
    </main>
  );
}

function getCategoryTastes(products: Product[]): CategoryTaste[] {
  const overallTags = computeTasteSummary(products).entries.slice(0, 2).map((entry) => entry.tag);
  return Object.keys(CATEGORY_LABELS).flatMap((category) => {
    const categoryProducts = products.filter((product) => product.category?.trim().toLowerCase() === category);
    const summary = computeTasteSummary(categoryProducts);
    if (summary.taggedCount < 2 || !summary.entries.length) return [];
    const categoryTags = summary.entries.slice(0, 2).map((entry) => entry.tag);
    const differsFromOverall = categoryTags.some((tag, index) => tag !== overallTags[index]);
    if (!differsFromOverall) return [];
    return [{
      category,
      productCount: summary.taggedCount,
      tags: categoryTags,
    }];
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
  const summary = computeTasteSummary(products);
  const interpretation = describeTasteCollection(products, summary);
  const topEntries = summary.entries.slice(0, 4);

  return (
    <section className="taste-source" aria-labelledby={`taste-source-${source}`}>
      <div className="taste-source-header">
        <div>
          <h3 id={`taste-source-${source}`}>{title}</h3>
        </div>
        {summary.taggedCount > 0 ? <span>{summary.taggedCount}개 상품 기준</span> : null}
      </div>
      {interpretation && topEntries.length ? (
        <>
          <p className="taste-source-summary">{interpretation.summary}</p>
          <div className="taste-source-bars">
            {topEntries.map((entry) => (
              <div key={entry.tag} className="taste-source-tag">
                <span>{styleTagLabel(entry.tag)}</span>
                <i><b style={{ width: `${entry.percent}%`, backgroundColor: tagColor(entry.tag).base }} /></i>
                <strong>{Math.round(entry.percent)}%</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="taste-source-empty">스타일 태그가 있는 상품이 쌓이면 이 기록의 취향을 보여드릴게요.</p>
      )}
      <style jsx>{`
        .taste-source { min-width: 0; }
        .taste-source-header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
        .taste-source-header p { margin: 0; color: #aeb7c4; font-size: .75rem; font-weight: 700; }
        .taste-source-header h3 { margin: .5rem 0 0; font-size: 1.25rem; font-weight: 760; letter-spacing: -.025em; line-height: 1.25; }
        .taste-source-header > span { flex: 0 0 auto; color: #7f8998; font-size: .75rem; font-weight: 600; }
        .taste-source-summary, .taste-source-empty { margin: .75rem 0 0; color: #c6ccd5; font-size: .875rem; font-weight: 600; line-height: 1.6; }
        .taste-source-empty { color: #8f99a8; }
        .taste-source-bars { display: grid; gap: .5rem; margin-top: 1rem; }
        .taste-source-tag { display: grid; grid-template-columns: 8rem minmax(3rem, 1fr) 2.25rem; align-items: center; gap: .65rem; width: 100%; padding: .45rem 0; color: #f3f4f6; text-align: left; }
        .taste-source-tag > span { overflow: hidden; font-size: .8125rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
        .taste-source-tag i { height: .375rem; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.1); }
        .taste-source-tag b { display: block; height: 100%; min-width: .375rem; border-radius: inherit; }
        .taste-source-tag strong { color: #aeb7c4; font-size: .75rem; font-variant-numeric: tabular-nums; text-align: right; }
      `}</style>
    </section>
  );
}
