"use client";

import { useEffect, useRef, useState } from "react";
import type { Product, StyleTagName } from "../../types";
import {
  ITEM_COLLAPSED_OPACITY,
  ITEM_COLLAPSED_RADIUS,
  ITEM_DETAIL_RADIUS,
  MIN_TAG_RADIUS,
  SEARCH_DIM_OPACITY,
  SIMILAR_TOP_K,
  TAG_LABEL_ZOOM_FADE_END,
  TAG_LABEL_ZOOM_FADE_START,
  cosineSimilarity,
  createGraph,
  tagColor,
  type TasteGraphLink,
  type TasteGraphNode,
  type TasteGraphProduct,
  type TasteGraphState,
} from "../../utils/tasteGraph";

type ViewMode = "tag" | "embedding";

interface StatusInfo {
  title: string;
  lines: string[];
  type: "info" | "warning" | "error";
}

interface ProductPanelData {
  brand: string;
  title: string;
  tagRows: { tag: StyleTagName; score: number }[];
  similar: { nodeId: string; label: string; similarity: number }[];
  reviewNote: string;
}

interface GraphHandlers {
  showOverview: (animate?: boolean) => void;
  showTagDetail: (tag: string) => void;
  showProductInsight: (productNodeId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  applySearchFilter: () => void;
}

// force-graph 인스턴스는 dynamic import로 로드하는 제네릭 클래스라 ref 타입으로 그대로 담기 번거로워 any로 다룬다.
type ForceGraphInstance = any;

function tagId(tag: string) {
  return `tag:${tag}`;
}

function linkSourceId(link: TasteGraphLink): string {
  const source = link.source as unknown;
  return typeof source === "object" && source ? (source as { id: string }).id : String(link.source);
}

function getLinkStyle(link: TasteGraphLink) {
  if (link.type === "embedding") {
    const color = link.highlighted ? "#7dd3fc" : "#38bdf8";
    const width = link.highlighted ? 2.5 + link.weight * 2 : 0.6 + link.weight * 1.6;
    return { color, width };
  }
  const colors = tagColor(link.tag || "");
  const color = link.highlighted ? colors.bright : colors.base;
  const width = link.highlighted ? 3.2 + link.weight * 3 : 0.8 + link.weight * 2.4;
  return { color, width };
}

function linkDistance(link: TasteGraphLink) {
  return link.type === "embedding" ? 40 + (1 - link.weight) * 60 : 148;
}

export function TasteGraphCanvas({ products }: { products: Product[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphInstance>(null);
  const graphStateRef = useRef<TasteGraphState | null>(null);
  const viewModeRef = useRef<ViewMode>("tag");
  const searchQueryRef = useRef("");
  const selectedTagRef = useRef<string | null>(null);
  const selectedProductNodeIdRef = useRef<string | null>(null);
  const initialFitDoneRef = useRef(false);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const handlersRef = useRef<GraphHandlers | null>(null);

  const [status, setStatus] = useState<StatusInfo>({
    title: "취향그래프",
    lines: ["불러오는 중..."],
    type: "info",
  });
  const [viewMode, setViewModeState] = useState<ViewMode>("tag");
  const [resetDisabled, setResetDisabled] = useState(true);
  const [controlsReady, setControlsReady] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [productPanel, setProductPanel] = useState<ProductPanelData | null>(null);
  const [graphOpacity, setGraphOpacity] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!containerRef.current) return;
      const [{ default: ForceGraph }, d3] = await Promise.all([
        import("force-graph"),
        import("d3"),
      ]);
      if (cancelled || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      graphStateRef.current = null;
      viewModeRef.current = "tag";
      searchQueryRef.current = "";
      selectedTagRef.current = null;
      selectedProductNodeIdRef.current = null;
      initialFitDoneRef.current = false;
      imageCacheRef.current = new Map();
      setViewModeState("tag");
      setResetDisabled(true);
      setSearchValue("");
      setProductPanel(null);
      setGraphOpacity(0);

      if (!products.length) {
        setStatus({ title: "옷장이 비어있어요", lines: ["옷장에 상품을 담으면 취향그래프가 그려져요."], type: "warning" });
        return;
      }

      const graph = createGraph(products);
      graphStateRef.current = graph;

      const getImage = (url?: string) => {
        if (!url) return null;
        if (imageCacheRef.current.has(url)) return imageCacheRef.current.get(url)!;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => redrawBriefly();
        image.src = url;
        imageCacheRef.current.set(url, image);
        return image;
      };

      const chargeStrength = (node: TasteGraphNode) => {
        if (node.type !== "tag") return -62;
        return viewModeRef.current === "embedding" ? -30 : -620;
      };

      const linkStrength = (link: TasteGraphLink) => {
        if (link.type === "embedding") {
          return viewModeRef.current === "embedding" ? 0.05 + link.weight * 0.35 : 0.02 + link.weight * 0.08;
        }
        return viewModeRef.current === "embedding" ? 0.01 : 0.05 + (link.normalizedStrength || 0) * 0.24;
      };

      const redrawBriefly = () => {
        graphRef.current?.d3ReheatSimulation();
      };

      const reheatBriefly = () => {
        graphRef.current?.d3ReheatSimulation();
      };

      const drawNode = (node: TasteGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!node.visible && node.type === "item") {
          if ((node.opacity ?? 1) <= 0) return;
        }

        const radius = node.radius || 4;
        ctx.save();
        ctx.globalAlpha = node.opacity ?? 1;

        if (node.type === "tag") {
          const colors = tagColor(node.label);
          ctx.beginPath();
          ctx.fillStyle = node.selected || node.connected ? colors.bright : colors.base;
          ctx.strokeStyle = "rgba(255,255,255,0.78)";
          ctx.lineWidth = node.selected || node.connected ? 2.2 : 1.25;
          ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const emphasized = node.selected || node.connected;
          const zoomFade = emphasized
            ? 1
            : Math.max(0, Math.min(1, (globalScale - TAG_LABEL_ZOOM_FADE_START) / (TAG_LABEL_ZOOM_FADE_END - TAG_LABEL_ZOOM_FADE_START)));

          if (zoomFade > 0) {
            const fontSize = Math.max(9, Math.min(13, radius / 2.4)) / globalScale;
            ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 3 / globalScale;
            ctx.globalAlpha = (node.opacity ?? 1) * zoomFade;
            ctx.strokeStyle = "rgba(0,0,0,0.45)";
            ctx.fillStyle = "#fff7ed";
            ctx.strokeText(node.label, node.x || 0, node.y || 0);
            ctx.fillText(node.label, node.x || 0, node.y || 0);
          }
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
          ctx.clip();

          const image = getImage(node.imageUrl);
          if (image && image.complete && image.naturalWidth) {
            ctx.drawImage(image, (node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);
          } else {
            ctx.fillStyle = "#767d89";
            ctx.fillRect((node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);
          }

          ctx.restore();
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
          const dominantTag = node.product?.tagAssignments?.[0]?.tag;
          const dominantColor = dominantTag ? tagColor(dominantTag).base : "rgba(255,255,255,0.72)";
          ctx.strokeStyle = node.selected ? "#ffffff" : node.similar ? "#38bdf8" : dominantColor;
          ctx.lineWidth = node.selected ? 3 : node.similar ? 2.5 : 1.6;
          ctx.stroke();
        }

        ctx.restore();
      };

      const visibleItemSetForTag = (tag: string) => {
        const entries = graphStateRef.current?.tagItems.get(tag as StyleTagName) || [];
        return new Set(entries.map((entry) => entry.productNodeId));
      };

      const getSimilarProducts = (product: TasteGraphProduct) => {
        if (!product.embedding || !graphStateRef.current) return [];
        return graphStateRef.current.products
          .filter((p) => p.id !== product.id && p.embedding)
          .map((p) => ({ product: p, similarity: cosineSimilarity(product.embedding!, p.embedding!) }))
          .filter((e): e is { product: TasteGraphProduct; similarity: number } => Number.isFinite(e.similarity))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, SIMILAR_TOP_K);
      };

      const resetVisualState = () => {
        const state = graphStateRef.current;
        if (!state) return;
        for (const node of state.nodes) {
          node.selected = false;
          node.connected = false;
          node.highlighted = false;
          node.similar = false;
        }
        for (const link of state.forceLinks) {
          link.highlighted = false;
          link.visible = viewModeRef.current === "tag" ? link.type === "tag" : link.type === "embedding";
          link.opacity = !link.visible ? 0 : link.type === "tag" ? 0.34 : 0.28;
        }
      };

      const applySearchFilter = () => {
        const state = graphStateRef.current;
        if (!state) return;
        const query = searchQueryRef.current.trim().toLowerCase();
        for (const node of state.nodes) {
          if (node.type !== "item") continue;
          const base = node.baseOpacity ?? node.opacity;
          if (!query) {
            node.opacity = base;
            continue;
          }
          const haystack = `${node.product?.brand || ""} ${node.product?.label || ""}`.toLowerCase();
          node.opacity = haystack.includes(query) ? base : Math.min(base, SEARCH_DIM_OPACITY);
        }
        redrawBriefly();
      };

      const fitOverview = (duration = 0) => {
        const includeNode = (node: TasteGraphNode) => node.type === "item" || (node.type === "tag" && viewModeRef.current === "tag");
        if (!initialFitDoneRef.current) {
          initialFitDoneRef.current = true;
          window.setTimeout(() => {
            if (!graphRef.current || selectedTagRef.current || selectedProductNodeIdRef.current) return;
            graphRef.current.zoomToFit(0, 90, includeNode);
            window.requestAnimationFrame(() => {
              setGraphOpacity(1);
            });
          }, 180);
          return;
        }
        graphRef.current?.zoomToFit(duration, 90, includeNode);
      };

      const showOverview = (animate = true) => {
        const state = graphStateRef.current;
        if (!state) return;
        selectedTagRef.current = null;
        selectedProductNodeIdRef.current = null;
        setResetDisabled(true);
        setProductPanel(null);
        resetVisualState();

        for (const node of state.nodes) {
          if (node.type === "tag") {
            node.visible = viewModeRef.current === "tag";
            node.opacity = viewModeRef.current === "tag" ? 1 : 0;
            node.radius = node.radius || MIN_TAG_RADIUS;
          } else {
            node.visible = true;
            node.opacity = ITEM_COLLAPSED_OPACITY;
            node.radius = ITEM_COLLAPSED_RADIUS;
          }
        }

        for (const node of state.nodes) {
          if (node.type === "item") node.baseOpacity = node.opacity;
        }
        applySearchFilter();

        graphRef.current?.nodeVal((node: TasteGraphNode) => Math.max(1, node.radius || 4));
        if (animate) reheatBriefly();
        fitOverview(animate ? 650 : 0);
      };

      const renderProductPanel = (
        product: TasteGraphProduct,
        assignments: { tag: StyleTagName; score: number }[],
        similarProducts: { product: TasteGraphProduct; similarity: number }[]
      ) => {
        setProductPanel({
          brand: product.brand,
          title: product.label,
          tagRows: assignments,
          similar: similarProducts.map((entry) => ({
            nodeId: entry.product.nodeId,
            label: entry.product.label,
            similarity: entry.similarity,
          })),
          reviewNote: product.tagReviewNote,
        });
      };

      const showProductInsight = (productNodeId: string) => {
        const state = graphStateRef.current;
        if (!state) return;
        const product = state.productByNodeId.get(productNodeId);
        if (!product) return;

        selectedProductNodeIdRef.current = productNodeId;
        const assignments = product.tagAssignments || [];
        const connectedTagIds = new Set(assignments.map((assignment) => tagId(assignment.tag)));
        const connectedLinkKeys = new Set(assignments.map((assignment) => `${productNodeId}|${assignment.tag}`));
        const similarProducts = getSimilarProducts(product);
        const similarNodeIds = new Set(similarProducts.map((e) => e.product.nodeId));

        for (const node of state.nodes) {
          node.selected = node.id === productNodeId;
          node.connected = viewModeRef.current === "tag" && connectedTagIds.has(node.id);
          node.similar = similarNodeIds.has(node.id);
          if (node.id === productNodeId || node.connected) {
            node.visible = true;
            node.opacity = 1;
            if (node.type === "item") node.radius = ITEM_DETAIL_RADIUS;
          } else if (similarNodeIds.has(node.id)) {
            node.visible = true;
            node.opacity = 1;
            node.radius = ITEM_DETAIL_RADIUS;
          } else if (node.type === "tag") {
            node.opacity = viewModeRef.current === "tag" ? 0.16 : 0;
          } else {
            node.opacity = ITEM_COLLAPSED_OPACITY;
          }
        }

        for (const link of state.forceLinks) {
          if (link.type !== "tag") continue;
          const key = `${linkSourceId(link)}|${link.tag}`;
          link.highlighted = viewModeRef.current === "tag" && connectedLinkKeys.has(key);
          link.visible = Boolean(link.highlighted);
          link.opacity = link.highlighted ? 0.9 : 0;
        }

        for (const node of state.nodes) {
          if (node.type === "item") node.baseOpacity = node.opacity;
        }
        applySearchFilter();

        renderProductPanel(product, product.panelTagAssignments || assignments, similarProducts);
        redrawBriefly();
      };

      const showTagDetail = (tag: string) => {
        const state = graphStateRef.current;
        if (!state || viewModeRef.current !== "tag") return;
        selectedTagRef.current = tag;
        selectedProductNodeIdRef.current = null;
        setResetDisabled(false);
        setProductPanel(null);
        resetVisualState();

        const selectedTagId = tagId(tag);
        const visibleItems = visibleItemSetForTag(tag);

        for (const node of state.nodes) {
          if (node.id === selectedTagId) {
            node.visible = true;
            node.opacity = 1;
            node.selected = true;
          } else if (node.type === "tag") {
            node.visible = true;
            node.opacity = 0.18;
          } else if (visibleItems.has(node.id)) {
            node.visible = true;
            node.opacity = 1;
            node.radius = ITEM_DETAIL_RADIUS;
          } else {
            node.visible = true;
            node.opacity = ITEM_COLLAPSED_OPACITY;
            node.radius = ITEM_COLLAPSED_RADIUS;
          }
        }

        for (const link of state.forceLinks) {
          if (link.type === "tag") {
            const sourceId = linkSourceId(link);
            link.visible = link.tag === tag && visibleItems.has(sourceId);
            link.opacity = link.visible ? 0.68 : 0;
          }
        }

        for (const node of state.nodes) {
          if (node.type === "item") node.baseOpacity = node.opacity;
        }
        applySearchFilter();

        graphRef.current?.nodeVal((node: TasteGraphNode) => Math.max(1, node.radius || 4));
        reheatBriefly();
        graphRef.current?.zoomToFit(700, 80, (node: TasteGraphNode) => node.id === selectedTagId || visibleItems.has(node.id));
      };

      const clearProductInsight = () => {
        if (!graphStateRef.current || !selectedProductNodeIdRef.current) return;
        selectedProductNodeIdRef.current = null;
        setProductPanel(null);
        if (selectedTagRef.current) showTagDetail(selectedTagRef.current);
        else showOverview(true);
      };

      graphRef.current = new ForceGraph<TasteGraphNode, TasteGraphLink>(containerRef.current)
        .backgroundColor("rgba(0,0,0,0)")
        .graphData({ nodes: graph.nodes, links: graph.forceLinks })
        .nodeId("id")
        .nodeRelSize(1)
        .nodeVal((node: TasteGraphNode) => Math.max(1, node.radius || 4))
        .linkVisibility((link: TasteGraphLink) => Boolean(link.visible))
        .linkColor((link: TasteGraphLink) => getLinkStyle(link).color)
        .linkWidth((link: TasteGraphLink) => (link.visible ? getLinkStyle(link).width : 0))
        .linkDirectionalParticles(0)
        .linkCanvasObjectMode(() => "replace")
        .linkCanvasObject((link: TasteGraphLink, ctx: CanvasRenderingContext2D) => {
          if (!link.visible) return;
          const { color, width } = getLinkStyle(link);
          const source = link.source as unknown as TasteGraphNode;
          const target = link.target as unknown as TasteGraphNode;
          ctx.save();
          ctx.globalAlpha = link.highlighted ? 0.95 : link.opacity ?? 0.3;
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(source.x || 0, source.y || 0);
          ctx.lineTo(target.x || 0, target.y || 0);
          ctx.stroke();
          ctx.restore();
        })
        .nodeCanvasObject((node: TasteGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => drawNode(node, ctx, globalScale))
        .nodePointerAreaPaint((node: TasteGraphNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, Math.max(6, node.radius || 4), 0, Math.PI * 2);
          ctx.fill();
        })
        .onNodeClick((node: TasteGraphNode) => {
          if (viewModeRef.current === "tag" && node.type === "tag") {
            showTagDetail(node.label);
          } else if (node.type === "item" && node.visible) {
            showProductInsight(node.id);
          }
        })
        .onBackgroundClick(() => clearProductInsight())
        .cooldownTicks(45)
        .d3AlphaDecay(0.105)
        .d3VelocityDecay(0.58);

      graphRef.current.d3Force("link").distance(linkDistance).strength(linkStrength);
      graphRef.current.d3Force("charge").strength(chargeStrength);
      graphRef.current.d3Force("center").strength(0.035);
      graphRef.current.d3Force(
        "collision",
        d3.forceCollide((node: TasteGraphNode) => Math.max(7, (node.radius || 4) + (node.type === "tag" ? 14 : 5))).iterations(1)
      );

      setControlsReady(true);
      showOverview(false);

      const embeddableCount = graph.products.filter((p) => p.embedding).length;
      const hasWarning = Object.values(graph.warnings).some(Boolean) || !graph.counts.embeddingLinks;
      const lines = [`옷장 상품 ${graph.counts.items}개, 태그 ${graph.counts.tags}개, 태그링크 ${graph.counts.tagLinks}개, 임베딩 ${embeddableCount}개`];
      if (graph.warnings.missingStyleTags) lines.push(`스타일 태그 없는 상품 ${graph.warnings.missingStyleTags}개`);
      if (graph.warnings.missingEmbedding) lines.push(`이미지 임베딩 없는 상품 ${graph.warnings.missingEmbedding}개`);
      setStatus({
        title: hasWarning ? "로드 완료, 일부 누락 있음" : "로드 완료",
        lines,
        type: hasWarning ? "warning" : "info",
      });

      // 이후 인터랙션(버튼/검색/유사 상품 클릭)에서 재사용할 수 있도록 핸들러 저장
      handlersRef.current = {
        showOverview,
        showTagDetail,
        showProductInsight,
        setViewMode: (mode: ViewMode) => {
          if (!graphStateRef.current || viewModeRef.current === mode) return;
          viewModeRef.current = mode;
          setViewModeState(mode);
          graphRef.current?.d3Force("link").strength(linkStrength);
          graphRef.current?.d3Force("charge").strength(chargeStrength);

          if (selectedProductNodeIdRef.current) {
            showProductInsight(selectedProductNodeIdRef.current);
          } else if (selectedTagRef.current && mode === "tag") {
            showTagDetail(selectedTagRef.current);
          } else {
            showOverview(true);
          }
        },
        applySearchFilter,
      };

      const handleResize = () => {
        if (!graphRef.current) return;
        graphRef.current.width(window.innerWidth).height(window.innerHeight);
        const fallbackInclude = (node: TasteGraphNode) => node.type === "item" || (node.type === "tag" && viewModeRef.current === "tag");
        graphRef.current.zoomToFit(350, 90, (node: TasteGraphNode) =>
          selectedTagRef.current ? node.id === tagId(selectedTagRef.current) || node.visible : fallbackInclude(node)
        );
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const cleanupPromise = boot();

    return () => {
      cancelled = true;
      handlersRef.current = null;
      void cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [products]);

  return (
    <div className="taste-graph-app">
      <div ref={containerRef} className="taste-graph-canvas" style={{ opacity: graphOpacity }} />

      <div className="taste-graph-topbar">
        <div className={`taste-graph-status ${status.type}`}>
          <p className="status-title">{status.title}</p>
          {status.lines.map((line, index) => (
            <p key={index} className="status-line">
              {line}
            </p>
          ))}
        </div>

        <div className="taste-graph-controls" aria-label="그래프 보기 제어">
          <input
            className="search-input"
            type="search"
            placeholder="브랜드/상품명 검색"
            disabled={!controlsReady}
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              searchQueryRef.current = event.target.value;
              handlersRef.current?.applySearchFilter();
            }}
          />
          <button
            type="button"
            className={`control-button ${viewMode === "embedding" ? "active" : ""}`}
            disabled={!controlsReady}
            onClick={() => handlersRef.current?.setViewMode(viewMode === "tag" ? "embedding" : "tag")}
          >
            {viewMode === "tag" ? "유사도 뷰로 전환" : "태그 뷰로 전환"}
          </button>
          <button
            type="button"
            className="control-button"
            disabled={!controlsReady || resetDisabled}
            onClick={() => handlersRef.current?.showOverview(true)}
          >
            전체 보기로 돌아가기
          </button>
        </div>
      </div>

      {productPanel && (
        <aside className="taste-graph-product-panel visible" aria-live="polite">
          {productPanel.brand && <p className="product-brand">{productPanel.brand}</p>}
          <h2 className="product-title">{productPanel.title}</h2>
          <div className="product-tags">
            {productPanel.tagRows.length ? (
              productPanel.tagRows.map((assignment) => (
                <div key={assignment.tag} className="product-tag-row">
                  <span className="product-tag-name">{assignment.tag}</span>
                  <span className="product-tag-bar">
                    <span className="product-tag-fill" style={{ width: `${Math.round(assignment.score * 100)}%` }} />
                  </span>
                  <span className="product-tag-score">{assignment.score.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="product-tag-row">
                <span className="product-tag-name">태그 없음</span>
                <span />
                <span />
              </div>
            )}
          </div>

          {productPanel.similar.length ? (
            <>
              <p className="product-similar-title">비슷한 상품</p>
              <div className="product-similar-list">
                {productPanel.similar.map((entry) => (
                  <button
                    type="button"
                    key={entry.nodeId}
                    className="product-similar-row"
                    onClick={() => handlersRef.current?.showProductInsight(entry.nodeId)}
                  >
                    <span className="product-similar-name">{entry.label}</span>
                    <span className="product-similar-score">{(entry.similarity * 100).toFixed(0)}%</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="product-note">임베딩 데이터 없음</p>
          )}

          {productPanel.reviewNote && (
            <details className="product-review">
              <summary className="product-review-toggle">태그 수정 근거</summary>
              <p className="product-review-note">{productPanel.reviewNote}</p>
            </details>
          )}
        </aside>
      )}

      <style jsx>{`
        .taste-graph-app {
          position: relative;
          width: 100vw;
          height: 100dvh;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.045), transparent 44%),
            linear-gradient(180deg, #151720 0%, #0e0f13 100%);
          color: #f3f4f6;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .taste-graph-canvas {
          width: 100%;
          height: 100%;
          transition: opacity 120ms ease;
        }

        .taste-graph-topbar {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          z-index: 5;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          pointer-events: none;
        }

        .taste-graph-status,
        .taste-graph-product-panel {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          background: rgba(25, 27, 33, 0.88);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(12px);
        }

        .taste-graph-status {
          max-width: min(720px, calc(100vw - 32px));
          padding: 12px 14px;
          pointer-events: auto;
        }

        .status-title {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 750;
        }

        .status-line {
          margin: 0;
          color: #a5acb8;
          font-size: 13px;
          line-height: 1.45;
        }

        .taste-graph-status.error { border-color: rgba(251, 113, 133, 0.5); }
        .taste-graph-status.warning { border-color: rgba(250, 204, 21, 0.48); }

        .taste-graph-controls {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          pointer-events: auto;
        }

        .control-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.07));
          backdrop-filter: blur(20px);
          color: #e5e7eb;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
        }

        .control-button:hover:not(:disabled) {
          border-color: rgba(249, 115, 22, 0.6);
          color: #fb923c;
        }

        .control-button:disabled {
          color: rgba(165, 172, 184, 0.55);
          cursor: default;
          opacity: 0.55;
        }

        .control-button.active {
          border-color: rgba(249, 115, 22, 0.65);
          color: #fdba74;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 22px rgba(249, 115, 22, 0.18);
        }

        .search-input {
          min-height: 36px;
          width: 220px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
          backdrop-filter: blur(20px);
          color: #f3f4f6;
          font-size: 13px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 14px 30px rgba(0, 0, 0, 0.24);
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .search-input::placeholder { color: rgba(165, 172, 184, 0.75); }

        .search-input:hover:not(:disabled) { border-color: rgba(249, 115, 22, 0.5); }

        .search-input:disabled {
          color: #697283;
          cursor: default;
          opacity: 0.55;
        }

        .search-input:focus {
          border-color: rgba(251, 146, 60, 0.7);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 0 3px rgba(249, 115, 22, 0.2);
        }

        .taste-graph-product-panel {
          position: absolute;
          top: 72px;
          right: 16px;
          z-index: 6;
          width: min(320px, calc(100vw - 32px));
          padding: 14px;
          pointer-events: auto;
        }

        .product-title {
          margin: 2px 0 10px;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.35;
        }

        .product-brand {
          margin: 0;
          color: #f59e0b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .product-tags {
          display: grid;
          gap: 8px;
          margin: 0;
        }

        .product-tag-row {
          display: grid;
          grid-template-columns: 72px 1fr 42px;
          align-items: center;
          gap: 8px;
          color: #a5acb8;
          font-size: 13px;
        }

        .product-tag-name {
          color: #f3f4f6;
          font-weight: 750;
        }

        .product-tag-bar {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
        }

        .product-tag-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #38bdf8, #7dd3fc);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
        }

        .product-tag-score {
          color: #a5acb8;
          font-weight: 750;
          text-align: right;
        }

        .product-note {
          margin: 10px 0 0;
          color: #697283;
          font-size: 12px;
          line-height: 1.4;
        }

        .product-review {
          margin-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 10px;
        }

        .product-review-toggle {
          cursor: pointer;
          color: #a5acb8;
          font-size: 12px;
          font-weight: 750;
          list-style: none;
        }

        .product-review-toggle::-webkit-details-marker { display: none; }

        .product-review-note {
          margin: 8px 0 0;
          color: #f3f4f6;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .product-similar-title {
          margin: 14px 0 8px;
          color: #a5acb8;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .product-similar-list {
          display: grid;
          gap: 6px;
        }

        .product-similar-row {
          display: grid;
          grid-template-columns: 1fr 40px;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin: 0;
          padding: 4px 6px;
          border: none;
          border-radius: 6px;
          background: transparent;
          font: inherit;
          font-size: 13px;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: background-color 120ms ease;
        }

        .product-similar-row:hover,
        .product-similar-row:focus-visible {
          background: rgba(255, 255, 255, 0.08);
          outline: none;
        }

        .product-similar-row:hover .product-similar-name,
        .product-similar-row:focus-visible .product-similar-name {
          color: #fb923c;
        }

        .product-similar-name {
          color: #f3f4f6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 120ms ease;
        }

        .product-similar-score {
          color: #38bdf8;
          font-weight: 750;
          text-align: right;
        }

        @media (max-width: 760px) {
          .taste-graph-topbar {
            flex-direction: column;
            align-items: stretch;
          }

          .taste-graph-controls {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .search-input { width: 100%; }
          .control-button { flex: 1 1 auto; }

          .taste-graph-product-panel { top: auto; right: 16px; bottom: 24px; }
        }
      `}</style>
    </div>
  );
}
