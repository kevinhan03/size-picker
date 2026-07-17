"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Network, Plus } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { captureEvent } from "../../utils/analytics";
import { TasteGraphCanvas } from "../taste-graph/TasteGraphCanvas";
import { BrandClusterCanvas } from "../taste-graph/BrandClusterCanvas";
import { BrandClusterSummaryCard } from "../taste-graph/BrandClusterSummaryCard";
import { TasteInsightCard } from "../taste-graph/TasteInsightCard";
import { TasteSummaryCard } from "../taste-graph/TasteSummaryCard";
import { PageState } from "../PageState";
import type { StyleTagName } from "../../types";
import { TAGS } from "../../utils/tasteGraph";

type TasteGraphSource = "closet" | "digbox" | "insight";

const SOURCE_ORDER: readonly TasteGraphSource[] = ["digbox", "insight", "closet"];
type TasteGraphView = "products" | "brands";
type InsightFocus = { source: "closet" | "digbox"; tag: StyleTagName } | null;

export function TasteGraphPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const [selectedSource, setSelectedSource] = useState<TasteGraphSource | null>(null);
  const [selectedView, setSelectedView] = useState<TasteGraphView>("products");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [insightFocus, setInsightFocus] = useState<InsightFocus>(null);
  const [urlFocus, setUrlFocus] = useState<{ source: TasteGraphSource | null; tag?: StyleTagName }>({ source: null });
  const {
    closetProducts,
    isLoading: isClosetLoading,
    ensureLoaded: ensureClosetLoaded,
  } = useClosetContext();
  const {
    digboxProducts,
    isLoading: isDigboxLoading,
    ensureLoaded: ensureDigboxLoaded,
  } = useDigboxContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !authUserId) router.replace("/login");
  }, [auth.isAuthLoading, authUserId, router]);

  useEffect(() => {
    if (!authUserId) return;
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [authUserId, ensureClosetLoaded, ensureDigboxLoaded]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSource = params.get("source");
    const source = requestedSource === "closet" || requestedSource === "digbox" || requestedSource === "insight" ? requestedSource : null;
    const requestedTag = params.get("tag");
    const tag = requestedTag && (TAGS as string[]).includes(requestedTag) ? (requestedTag as StyleTagName) : undefined;
    setUrlFocus({ source, tag });
  }, []);

  const source = selectedSource ?? urlFocus.source ?? (closetProducts.length > 0 ? "closet" : "digbox");
  const graphSource = source === "insight" ? insightFocus?.source ?? (closetProducts.length > 0 ? "closet" : "digbox") : source;
  const activeProducts = graphSource === "closet" ? closetProducts : digboxProducts;
  const sourceLabel = graphSource === "closet" ? "Closet" : "저장";
  const sourceNoun = graphSource === "closet" ? "Closet 상품" : "저장한 상품";
  const eyebrow = graphSource === "closet" ? "보유 취향" : "관심 취향";
  const emptyCopy = useMemo(
    () =>
      graphSource === "closet"
        ? {
            title: "아직 보유 상품이 없습니다",
            description: "실제로 가진 상품을 Closet에 담으면 보유 취향이 그려집니다.",
          }
        : {
            title: "아직 관심 상품이 없습니다",
            description: "마음에 드는 상품을 저장하면 관심 취향이 그려집니다.",
          },
    [graphSource]
  );

  useEffect(() => {
    if (source === "digbox" && activeProducts.length > 0) {
      captureEvent("interest_taste_viewed", { product_count: activeProducts.length });
    }
  }, [activeProducts.length, source]);

  const renderSourceToggle = (floating = false) => (
    <div className={`taste-source-toggle${floating ? " is-floating" : ""}`} aria-label="취향 분석 기준">
      <span
        className="taste-source-thumb"
        style={{ transform: `translateX(${SOURCE_ORDER.indexOf(source) * 100}%)` }}
        aria-hidden="true"
      />
      {SOURCE_ORDER.map((value) => (
        <button
          key={value}
          type="button"
          className={`taste-source-button ${source === value ? "active" : ""}`}
          onClick={() => {
            setSelectedSource(value);
            if (value !== "insight") setInsightFocus(null);
            if (value === "insight") setSelectedView("products");
            setSelectedBrand(null);
          }}
        >
          {value === "digbox" ? "저장" : value === "closet" ? "CLOSET" : "INSIGHT"}
          <span>{value === "digbox" ? digboxProducts.length : value === "closet" ? closetProducts.length : ""}</span>
        </button>
      ))}
    </div>
  );
  const sourceToggle = renderSourceToggle();

  const viewToggle = source !== "insight" ? (
    <div className="taste-view-toggle" aria-label="그래프 보기 방식">
      <span
        className="taste-view-thumb"
        style={{ transform: `translateX(${selectedView === "brands" ? 100 : 0}%)` }}
        aria-hidden="true"
      />
      <button type="button" className={selectedView === "products" ? "active" : ""} onClick={() => { setSelectedView("products"); setSelectedBrand(null); }}>
        상품 그래프
      </button>
      <button type="button" className={selectedView === "brands" ? "active" : ""} onClick={() => setSelectedView("brands")}>
        브랜드 클러스터
      </button>
    </div>
  ) : null;

  if (auth.isAuthLoading || !auth.authUser || isClosetLoading || isDigboxLoading) {
    return (
      <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]">
        <PageState
          kind="loading"
          title="취향 지도를 준비하고 있어요"
          description="저장한 상품을 분석해 나만의 연결을 만드는 중입니다."
        />
      </main>
    );
  }

  if (activeProducts.length === 0) {
    return (
      <main className="taste-graph-page flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <div className="absolute left-4 right-4 top-4 flex justify-end">
          {renderSourceToggle(true)}
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
          <Network className="h-7 w-7" />
        </span>
        <div>
          <p className="text-xl font-black text-white">{emptyCopy.title}</p>
          <p className="mt-2 text-sm font-semibold text-gray-500">{emptyCopy.description}</p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400"
        >
          <Plus className="h-4 w-4" />
          상품 둘러보기
        </Link>
      </main>
    );
  }

  return (
    <main className="taste-graph-page taste-graph-layout">
      <aside className={`taste-summary-pane ${source === "insight" ? "taste-insight-pane" : ""}`}>
        {source === "insight" ? (
          <TasteInsightCard
            controls={sourceToggle}
            closetProducts={closetProducts}
            digboxProducts={digboxProducts}
            onExplore={(target) => {
              setInsightFocus(target);
              setSelectedSource("insight");
            }}
          />
        ) : (
          selectedView === "brands" ? (
            <BrandClusterSummaryCard
              controls={sourceToggle}
              viewControls={viewToggle}
              products={activeProducts}
              source={graphSource}
              selectedBrand={selectedBrand}
            />
          ) : (
            <TasteSummaryCard
              controls={sourceToggle}
              viewControls={viewToggle}
              products={activeProducts}
              eyebrow={eyebrow}
              sourceLabel={sourceLabel}
              sourceNoun={sourceNoun}
            />
          )
        )}
      </aside>
      <div className="taste-canvas-pane">
        {selectedView === "brands" && source !== "insight" ? (
          <BrandClusterCanvas
            key={`brands-${graphSource}`}
            products={activeProducts}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
          />
        ) : (
          <TasteGraphCanvas
            key={`${graphSource}-${source === "insight" ? insightFocus?.tag || "overview" : "overview"}`}
            products={activeProducts}
            initialTag={source === "insight" ? insightFocus?.tag : urlFocus.tag}
          />
        )}
      </div>
      <style jsx>{layoutStyles}</style>
    </main>
  );
}

const layoutStyles = `
  .taste-graph-layout {
    display: flex;
    flex-direction: row;
    min-height: 0;
  }

  .taste-summary-pane {
    width: clamp(292px, 23vw, 340px);
    flex-shrink: 0;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    background: #111217;
  }

  .taste-insight-pane {
    scrollbar-width: none;
  }

  .taste-insight-pane::-webkit-scrollbar {
    display: none;
  }

  .taste-canvas-pane {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  @media (max-width: 1023px) {
    .taste-graph-layout {
      flex-direction: column;
    }

    .taste-summary-pane {
      width: 100%;
      max-height: 40%;
      border-right: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
  }

`;
