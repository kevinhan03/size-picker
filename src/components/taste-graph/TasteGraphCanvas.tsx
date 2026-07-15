"use client";

import { useEffect, useRef, useState } from "react";
import { Orbit, RotateCcw, Search } from "lucide-react";
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

function linkTargetId(link: TasteGraphLink): string {
  const target = link.target as unknown;
  return typeof target === "object" && target ? (target as { id: string }).id : String(link.target);
}

function isProductLink(link: TasteGraphLink, productNodeId: string) {
  return linkSourceId(link) === productNodeId || linkTargetId(link) === productNodeId;
}

function baseLinkOpacity(link: TasteGraphLink, viewMode: ViewMode) {
  if (link.type === "tag") return viewMode === "tag" ? 0.2 : 0.09;
  return viewMode === "embedding" ? 0.17 : 0.08;
}

function getLinkStyle(link: TasteGraphLink) {
  if (link.type === "embedding") {
    const color = link.highlighted ? "#7dd3fc" : "rgba(184, 199, 216, 0.72)";
    const width = link.highlighted ? 2.2 + link.weight * 1.6 : 0.55 + link.weight * 0.45;
    return { color, width };
  }
  const colors = tagColor(link.tag || "");
  const color = link.highlighted ? colors.bright : "rgba(218, 223, 232, 0.72)";
  const width = link.highlighted ? 2.8 + link.weight * 2.2 : 0.55 + link.weight * 0.55;
  return { color, width };
}

function linkDistance(link: TasteGraphLink) {
  return link.type === "embedding" ? 40 + (1 - link.weight) * 60 : 148;
}

export function TasteGraphCanvas({
  products,
  initialTag,
}: {
  products: Product[];
  initialTag?: StyleTagName;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphInstance>(null);
  const graphStateRef = useRef<TasteGraphState | null>(null);
  const viewModeRef = useRef<ViewMode>("tag");
  const searchQueryRef = useRef("");
  const selectedTagRef = useRef<string | null>(null);
  const selectedProductNodeIdRef = useRef<string | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const initialFitDoneRef = useRef(false);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const handlersRef = useRef<GraphHandlers | null>(null);

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
      hoveredNodeIdRef.current = null;
      initialFitDoneRef.current = false;
      imageCacheRef.current = new Map();
      setViewModeState("tag");
      setResetDisabled(true);
      setSearchValue("");
      setProductPanel(null);
      setGraphOpacity(0);

      if (!products.length) return;

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
          const emphasized = node.selected || node.connected || node.highlighted;
          ctx.beginPath();
          ctx.fillStyle = "rgba(20, 22, 28, 0.94)";
          ctx.strokeStyle = emphasized ? colors.bright : colors.base;
          ctx.lineWidth = emphasized ? 2.5 : 1.45;
          if (emphasized) {
            ctx.shadowColor = colors.bright;
            ctx.shadowBlur = 13 / globalScale;
          }
          ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const zoomFade = emphasized
            ? 1
            : Math.max(0.48, Math.min(1, (globalScale - TAG_LABEL_ZOOM_FADE_START) / (TAG_LABEL_ZOOM_FADE_END - TAG_LABEL_ZOOM_FADE_START)));

          if (zoomFade > 0) {
            const fontSize = Math.max(8, Math.min(11, radius / 2.7)) / globalScale;
            ctx.font = `650 ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = (node.opacity ?? 1) * zoomFade;
            ctx.fillStyle = "rgba(245, 247, 250, 0.9)";
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
          ctx.strokeStyle = node.selected ? "#ffffff" : node.highlighted ? "#fdba74" : node.similar ? "#7dd3fc" : dominantColor;
          ctx.lineWidth = node.selected ? 3 : node.highlighted ? 2.6 : node.similar ? 2.2 : 1.3;
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
          link.visible = true;
          link.opacity = baseLinkOpacity(link, viewModeRef.current);
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

      const showOverview = (animate = true, shouldFit = true) => {
        const state = graphStateRef.current;
        if (!state) return;
        selectedTagRef.current = null;
        selectedProductNodeIdRef.current = null;
        hoveredNodeIdRef.current = null;
        setResetDisabled(true);
        setProductPanel(null);
        resetVisualState();

        for (const node of state.nodes) {
          if (node.type === "tag") {
            node.visible = true;
            node.opacity = viewModeRef.current === "tag" ? 1 : 0.48;
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
        if (shouldFit) fitOverview(animate ? 650 : 0);
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

        hoveredNodeIdRef.current = null;
        resetVisualState();
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
            node.visible = true;
            node.opacity = 0.2;
          } else {
            node.opacity = 0.22;
            node.radius = ITEM_COLLAPSED_RADIUS;
          }
        }

        for (const link of state.forceLinks) {
          const isDirectTagLink = link.type === "tag" && connectedLinkKeys.has(`${linkSourceId(link)}|${link.tag}`);
          const isDirectEmbeddingLink = link.type === "embedding" && isProductLink(link, productNodeId);
          link.highlighted = isDirectTagLink || isDirectEmbeddingLink;
          link.visible = true;
          link.opacity = link.highlighted
            ? (link.type === viewModeRef.current ? 0.98 : 0.76)
            : baseLinkOpacity(link, viewModeRef.current) * 0.22;
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
        hoveredNodeIdRef.current = null;
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
            node.opacity = 0.22;
          } else if (visibleItems.has(node.id)) {
            node.visible = true;
            node.opacity = 1;
            node.radius = ITEM_DETAIL_RADIUS;
          } else {
            node.visible = true;
            node.opacity = 0.22;
            node.radius = ITEM_COLLAPSED_RADIUS;
          }
        }

        for (const link of state.forceLinks) {
          if (link.type === "tag") {
            const sourceId = linkSourceId(link);
            link.visible = link.tag === tag && visibleItems.has(sourceId);
            link.highlighted = link.visible;
            link.opacity = link.visible ? 0.94 : 0;
          } else {
            link.visible = true;
            link.highlighted = false;
            link.opacity = baseLinkOpacity(link, viewModeRef.current) * 0.2;
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

      const showHoverInsight = (node: TasteGraphNode | null) => {
        if (selectedTagRef.current || selectedProductNodeIdRef.current) return;
        if (hoveredNodeIdRef.current === (node?.id || null)) return;

        showOverview(false, false);
        if (!node) return;

        const state = graphStateRef.current;
        if (!state) return;
        hoveredNodeIdRef.current = node.id;
        const relatedLinks = state.forceLinks.filter((link) => {
          if (node.type === "tag") return link.type === "tag" && linkTargetId(link) === node.id;
          return isProductLink(link, node.id);
        });
        const relatedNodeIds = new Set<string>([node.id]);
        for (const link of relatedLinks) {
          relatedNodeIds.add(linkSourceId(link));
          relatedNodeIds.add(linkTargetId(link));
        }

        for (const candidate of state.nodes) {
          const related = relatedNodeIds.has(candidate.id);
          candidate.highlighted = candidate.id === node.id;
          candidate.connected = related && candidate.id !== node.id;
          if (related) {
            candidate.opacity = 1;
            if (candidate.type === "item") candidate.radius = candidate.id === node.id ? ITEM_DETAIL_RADIUS : ITEM_COLLAPSED_RADIUS + 3;
          } else if (candidate.type === "tag") {
            candidate.opacity = 0.28;
          } else {
            candidate.opacity = 0.22;
          }
        }

        const relatedLinkSet = new Set(relatedLinks);
        for (const link of state.forceLinks) {
          const related = relatedLinkSet.has(link);
          link.highlighted = related;
          link.visible = true;
          link.opacity = related ? 0.88 : baseLinkOpacity(link, viewModeRef.current) * 0.22;
        }
        redrawBriefly();
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
          ctx.lineCap = "round";
          if (link.type === "embedding") ctx.setLineDash(link.highlighted ? [7, 3] : [3, 5]);
          if (link.highlighted) {
            ctx.shadowColor = color;
            ctx.shadowBlur = link.type === "tag" ? 7 : 5;
          }
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
        .onNodeHover((node: TasteGraphNode | null) => showHoverInsight(node))
        .onBackgroundClick(() => {
          if (selectedTagRef.current || selectedProductNodeIdRef.current) showOverview(true);
        })
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

      if (initialTag) {
        window.setTimeout(() => {
          if (!cancelled) showTagDetail(initialTag);
        }, 240);
      }

      const handleResize = () => {
        if (!graphRef.current || !containerRef.current) return;
        graphRef.current.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight);
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
  }, [products, initialTag]);

  return (
    <div className="taste-graph-app">
      <div ref={containerRef} className="taste-graph-canvas" style={{ opacity: graphOpacity }} />

      <div className="taste-graph-topbar">
        <div className="taste-graph-controls" aria-label="그래프 보기 제어">
          <label className="search-shell">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <input
              className="search-input"
              type="search"
              placeholder="브랜드/상품명 검색"
              aria-label="브랜드 또는 상품명 검색"
              disabled={!controlsReady}
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                searchQueryRef.current = event.target.value;
                handlersRef.current?.applySearchFilter();
              }}
            />
          </label>
          <button
            type="button"
            className={`control-button icon-button ${viewMode === "embedding" ? "active" : ""}`}
            disabled={!controlsReady}
            onClick={() => handlersRef.current?.setViewMode(viewMode === "tag" ? "embedding" : "tag")}
            aria-label={viewMode === "tag" ? "유사도 뷰로 전환" : "태그 뷰로 전환"}
            title={viewMode === "tag" ? "유사도 뷰로 전환" : "태그 뷰로 전환"}
          >
            <Orbit className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="control-button icon-button"
            disabled={!controlsReady || resetDisabled}
            onClick={() => handlersRef.current?.showOverview(true)}
            aria-label="전체 보기로 돌아가기"
            title="전체 보기로 돌아가기"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="taste-graph-legend" aria-label="그래프 연결 범례">
        <span className={`legend-item ${viewMode === "tag" ? "primary" : ""}`}>
          <i className="legend-line tag-line" aria-hidden="true" />
          STYLE TAG
        </span>
        <span className={`legend-item ${viewMode === "embedding" ? "primary" : ""}`}>
          <i className="legend-line embedding-line" aria-hidden="true" />
          VISUAL SIMILARITY
        </span>
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
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #111217;
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
          justify-content: flex-end;
          gap: 16px;
          pointer-events: none;
        }

        .taste-graph-product-panel {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          background: rgba(25, 27, 33, 0.88);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(12px);
        }

        .taste-graph-controls {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          pointer-events: auto;
        }

        .taste-graph-legend {
          position: absolute;
          right: 16px;
          bottom: 16px;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(23, 25, 31, 0.68);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(14px);
          pointer-events: none;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(197, 203, 212, 0.62);
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.06em;
          white-space: nowrap;
          transition: color 160ms ease;
        }

        .legend-item.primary {
          color: rgba(245, 247, 250, 0.92);
        }

        .legend-line {
          display: block;
          width: 20px;
          height: 1px;
          background: rgba(218, 223, 232, 0.72);
        }

        .embedding-line {
          background: repeating-linear-gradient(90deg, rgba(184, 199, 216, 0.76) 0 4px, transparent 4px 8px);
        }

        .control-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          background: rgba(23, 25, 31, 0.76);
          backdrop-filter: blur(16px);
          color: #e5e7eb;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06);
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
          background: rgba(249, 115, 22, 0.13);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 18px rgba(249, 115, 22, 0.13);
        }

        .icon-button {
          width: 34px;
          padding: 0;
        }

        .search-shell {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          width: 220px;
          padding: 0 12px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          background: rgba(23, 25, 31, 0.76);
          backdrop-filter: blur(16px);
          color: #8f99a9;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .search-input {
          width: 100%;
          min-width: 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #f3f4f6;
          font-size: 13px;
          outline: none;
        }

        .search-input::placeholder { color: rgba(165, 172, 184, 0.75); }

        .search-shell:focus-within { border-color: rgba(251, 146, 60, 0.7); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.14); }

        .search-input:disabled {
          color: #697283;
          cursor: default;
          opacity: 0.55;
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

          .search-shell { width: 100%; }

          .taste-graph-product-panel { top: auto; right: 16px; bottom: 24px; }

          .taste-graph-legend {
            right: 12px;
            bottom: 12px;
            gap: 8px;
            padding: 7px 8px;
          }

          .legend-item { font-size: 8px; }
          .legend-line { width: 15px; }
        }
      `}</style>
    </div>
  );
}
