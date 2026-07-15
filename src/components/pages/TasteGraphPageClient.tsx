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
import { TasteInsightCard } from "../taste-graph/TasteInsightCard";
import { TasteSummaryCard } from "../taste-graph/TasteSummaryCard";
import type { StyleTagName } from "../../types";
import { TAGS } from "../../utils/tasteGraph";

type TasteGraphSource = "closet" | "digbox" | "insight";
type InsightFocus = { source: "closet" | "digbox"; tag: StyleTagName } | null;

export function TasteGraphPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const [selectedSource, setSelectedSource] = useState<TasteGraphSource | null>(null);
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
  const sourceLabel = graphSource === "closet" ? "Closet" : "DIGBOX";
  const sourceNoun = graphSource === "closet" ? "Closet 상품" : "DIGBOX 상품";
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
            description: "마음에 드는 상품을 DIGBOX에 담으면 관심 취향이 그려집니다.",
          },
    [graphSource]
  );

  useEffect(() => {
    if (source === "digbox" && activeProducts.length > 0) {
      captureEvent("interest_taste_viewed", { product_count: activeProducts.length });
    }
  }, [activeProducts.length, source]);

  const sourceToggle = (
    <div className="taste-source-toggle" aria-label="취향 분석 기준">
      {(["digbox", "insight", "closet"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={`taste-source-button ${source === value ? "active" : ""}`}
          onClick={() => {
            setSelectedSource(value);
            if (value !== "insight") setInsightFocus(null);
          }}
        >
          {value === "digbox" ? "DIGBOX" : value === "closet" ? "CLOSET" : "INSIGHT"}
          <span>{value === "digbox" ? digboxProducts.length : value === "closet" ? closetProducts.length : ""}</span>
        </button>
      ))}
    </div>
  );

  if (auth.isAuthLoading || !auth.authUser || isClosetLoading || isDigboxLoading) {
    return <main className="taste-graph-page bg-black" />;
  }

  if (activeProducts.length === 0) {
    return (
      <main className="taste-graph-page flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <div className="absolute left-4 right-4 top-4 flex justify-end">
          {sourceToggle}
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
      <aside className="taste-summary-pane">
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
          <TasteSummaryCard
            controls={sourceToggle}
            products={activeProducts}
            eyebrow={eyebrow}
            sourceLabel={sourceLabel}
            sourceNoun={sourceNoun}
          />
        )}
      </aside>
      <div className="taste-canvas-pane">
        <TasteGraphCanvas
          key={`${graphSource}-${source === "insight" ? insightFocus?.tag || "overview" : "overview"}`}
          products={activeProducts}
          initialTag={source === "insight" ? insightFocus?.tag : urlFocus.tag}
        />
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
