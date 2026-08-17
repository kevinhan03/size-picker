"use client";

import NextImage from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ExternalLink, Info, X } from "lucide-react";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { Product, StyleTagName } from "../../types";
import { MOTION_DURATION_MS } from "../../utils/motion";
import {
  ITEM_COLLAPSED_OPACITY,
  ITEM_COLLAPSED_RADIUS,
  EMBEDDING_MIN_SIMILARITY,
  MIN_TAG_RADIUS,
  SEARCH_DIM_OPACITY,
  SIMILAR_TOP_K,
  TAG_LABEL_ZOOM_FADE_END,
  TAG_LABEL_ZOOM_FADE_START,
  createGraph,
  deserializeTasteGraph,
  tagColor,
  type TasteGraphLink,
  type TasteGraphNode,
  type TasteGraphProduct,
  type TasteGraphState,
  type SerializedTasteGraphState,
} from "../../utils/tasteGraph";

interface ProductPanelData {
  nodeId: string;
  productId: string;
  brand: string;
  title: string;
  imageUrl: string;
  fallbackImageUrl: string;
  tags: { label: string; score: number; color: string }[];
  similar: {
    nodeId: string;
    label: string;
    similarity: number;
    imageUrl: string;
    fallbackImageUrl: string;
  }[];
}

interface TagPanelData {
  tag: string;
  rank: number;
  count: number;
  percent: number;
  color: string;
  products: {
    nodeId: string;
    label: string;
    imageUrl: string;
    fallbackImageUrl: string;
  }[];
}

interface GraphHandlers {
  showOverview: (animate?: boolean) => void;
  showTagDetail: (tag: string) => void;
  showProductInsight: (productNodeId: string) => void;
  applySearchFilter: () => void;
}

// force-graph 인스턴스는 dynamic import로 로드하는 제네릭 클래스라 ref 타입으로 그대로 담기 번거로워 any로 다룬다.
type ForceGraphInstance = any;

function tagId(tag: string) {
  return `tag:${tag}`;
}

function passthroughImageLoader({ src }: { src: string }) {
  return src;
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

function getLinkStyle(link: TasteGraphLink) {
  if (link.type === "embedding") {
    const color = link.highlighted ? "rgba(241, 245, 249, 0.52)" : "rgba(226, 232, 240, 0.28)";
    const width = link.highlighted ? 0.9 : 0.6;
    return { color, width };
  }
  const colors = tagColor(link.tag || "");
  const color = link.highlighted ? colors.bright : colors.base;
  const width = link.highlighted
    ? 1.4 + link.weight * 0.9
    : link.rank === 2
      ? 0.7
      : 0.7 + link.weight * 0.65;
  return { color, width };
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function fitCanvasLabel(ctx: CanvasRenderingContext2D, label: string, maxWidth: number) {
  if (ctx.measureText(label).width <= maxWidth) return label;
  const suffix = "…";
  let end = label.length;
  while (end > 0 && ctx.measureText(`${label.slice(0, end)}${suffix}`).width > maxWidth) end -= 1;
  return end > 0 ? `${label.slice(0, end)}${suffix}` : suffix;
}

export function TasteGraphCanvas({
  products,
  graphData,
  initialTag,
  source,
  active = true,
  onOpenProduct,
  onLoading,
  onReady,
}: {
  products: Product[];
  graphData?: SerializedTasteGraphState;
  initialTag?: StyleTagName;
  source: "digbox" | "closet";
  active?: boolean;
  onOpenProduct: (productId: string) => void;
  onLoading?: () => void;
  onReady?: () => void;
}) {
  const { t } = useLocaleContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphInstance>(null);
  const graphStateRef = useRef<TasteGraphState | null>(null);
  const searchQueryRef = useRef("");
  const selectedTagRef = useRef<string | null>(null);
  const selectedProductNodeIdRef = useRef<string | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const pressedNodeRef = useRef<{ id: string; scale: number; targetScale: number; lastFrameAt: number } | null>(null);
  const initialFitDoneRef = useRef(false);
  const hasRenderedGraphRef = useRef(false);
  const graphCacheRef = useRef<WeakMap<Product[], TasteGraphState>>(new WeakMap());
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const handlersRef = useRef<GraphHandlers | null>(null);
  const activeRef = useRef(active);
  const onLoadingRef = useRef(onLoading);
  const onReadyRef = useRef(onReady);
  activeRef.current = active;
  onLoadingRef.current = onLoading;
  onReadyRef.current = onReady;

  const graphInputSignature = products.map((product) => [
    product.id,
    product.name,
    product.brand,
    product.image,
    product.thumbnailImage,
    product.imagePath,
    product.tagReviewStatus,
    JSON.stringify(product.styleTags ?? null),
    JSON.stringify(product.humanStyleTags ?? null),
  ].join("\u0001")).join("\u0002");
  const productsRef = useRef(products);
  productsRef.current = products;

  const [productPanel, setProductPanel] = useState<ProductPanelData | null>(null);
  const [tagPanel, setTagPanel] = useState<TagPanelData | null>(null);
  const [areTagScoresExpanded, setAreTagScoresExpanded] = useState(false);
  const [graphOpacity, setGraphOpacity] = useState(0);

  useLayoutEffect(() => {
    onLoadingRef.current?.();
  }, [graphInputSignature]);

  // The canvas instance can be preserved briefly during route transitions.
  // Hide that previous frame before the browser paints the returning graph,
  // rather than after the asynchronous graph module has loaded.
  useLayoutEffect(() => {
    if (!active || !containerRef.current) return;
    containerRef.current.style.opacity = "0";
    setGraphOpacity(0);
  }, [active, graphInputSignature]);

  useEffect(() => {
    let cancelled = false;
    let lastCameraFitWidth = 0;
    let lastCameraFitHeight = 0;

    async function boot() {
      if (!containerRef.current) return;
      const graphProducts = productsRef.current;
      const [{ default: ForceGraph }, d3] = await Promise.all([
        import("force-graph"),
        import("d3"),
      ]);
      if (cancelled || !containerRef.current) return;

      // Never expose force-graph's default camera for a frame. This effect can
      // restart while the previous graph is still visible, so hide the canvas
      // synchronously before replacing its contents and fitting the overview.
      containerRef.current.style.opacity = "0";
      setGraphOpacity(0);
      containerRef.current.innerHTML = "";
      graphStateRef.current = null;
      searchQueryRef.current = "";
      selectedTagRef.current = null;
      selectedProductNodeIdRef.current = null;
      hoveredNodeIdRef.current = null;
      initialFitDoneRef.current = false;
      imageCacheRef.current = new Map();
      setProductPanel(null);
      setTagPanel(null);

      if (!graphProducts.length) return;

      let graph = graphData ? deserializeTasteGraph(graphData) : graphCacheRef.current.get(graphProducts);
      if (!graph) {
        graph = createGraph(graphProducts);
        graphCacheRef.current.set(graphProducts, graph);
      }
      graphStateRef.current = graph;
      const isCompactLayout = () => (containerRef.current?.clientWidth || 0) < 600;
      const collapsedItemRadius = () => isCompactLayout() ? 12 : ITEM_COLLAPSED_RADIUS;
      const detailItemRadius = () => isCompactLayout() ? 17 : 19;

      const seedFreePositions = (width: number, height: number) => {
        const state = graphStateRef.current;
        if (!state) return;

        const tagNodes = state.nodes.filter((node) => node.type === "tag");
        const compact = width < 600;
        const spreadX = compact ? Math.min(width * 0.5, 190) : Math.min(width * 0.44, 430);
        const spreadY = compact ? Math.min(height * 0.34, 230) : Math.min(height * 0.42, 330);
        const tagNodeById = new Map(tagNodes.map((node) => [node.id, node]));

        tagNodes.forEach((node) => {
          const hash = stableHash(node.id);
          const xRatio = ((hash & 0xffff) / 0xffff) * 2 - 1;
          const yRatio = (((hash >>> 16) & 0xffff) / 0xffff) * 2 - 1;
          node.fx = undefined;
          node.fy = undefined;
          node.x = xRatio * spreadX;
          node.y = yRatio * spreadY;
          node.vx = 0;
          node.vy = 0;
        });

        for (const node of state.nodes) {
          if (node.type !== "item" || !node.product) continue;
          const primaryTag = node.product.tagAssignments[0]?.tag;
          const anchor = primaryTag ? tagNodeById.get(tagId(primaryTag)) : null;
          const hash = stableHash(node.id);
          const angle = ((hash % 360) * Math.PI) / 180;
          const sourceRadius = compact ? 64 : 96;
          const offset = sourceRadius + ((hash >>> 9) % (compact ? 24 : 38));
          node.fx = undefined;
          node.fy = undefined;
          node.x = (anchor?.x || 0) + Math.cos(angle) * offset;
          node.y = (anchor?.y || 0) + Math.sin(angle) * offset;
          node.vx = 0;
          node.vy = 0;
        }
      };

      seedFreePositions(containerRef.current.clientWidth, containerRef.current.clientHeight);

      const getImage = (url?: string, fallbackUrl?: string) => {
        const primaryUrl = url || fallbackUrl;
        if (!primaryUrl) return null;
        const cacheKey = `${primaryUrl}|${fallbackUrl || ""}`;
        if (imageCacheRef.current.has(cacheKey)) return imageCacheRef.current.get(cacheKey)!;
        const image = new Image();
        image.decoding = "async";
        image.onload = () => redrawBriefly();
        let triedFallback = false;
        image.onerror = () => {
          if (!triedFallback && fallbackUrl && fallbackUrl !== primaryUrl) {
            triedFallback = true;
            image.src = fallbackUrl;
            return;
          }
          redrawBriefly();
        };
        image.src = primaryUrl;
        imageCacheRef.current.set(cacheKey, image);
        return image;
      };

      const chargeStrength = (node: TasteGraphNode) => node.type === "item" ? -48 : -190;

      const linkDistance = (link: TasteGraphLink) => {
        if (link.type === "embedding") return 100 + (1 - link.weight) * 70;
        return link.rank === 1 ? 112 : 188;
      };

      const linkStrength = (link: TasteGraphLink) => {
        if (link.type === "embedding") return 0;
        const normalized = link.normalizedStrength || 0;
        return link.rank === 1 ? 0.12 + normalized * 0.1 : 0.025 + normalized * 0.025;
      };

      // Settle the force layout off-screen so the first fitted frame is also
      // the final overview. This avoids a second camera move after mount.
      const settlingLinks = graph.forceLinks.map((link) => ({
        ...link,
        source: linkSourceId(link),
        target: linkTargetId(link),
      }));
      const settlingSimulation = d3.forceSimulation<TasteGraphNode>(graph.nodes)
        .force(
          "link",
          d3.forceLink<TasteGraphNode, TasteGraphLink>(settlingLinks)
            .id((node) => node.id)
            .distance(linkDistance)
            .strength(linkStrength)
        )
        .force("charge", d3.forceManyBody<TasteGraphNode>().strength(chargeStrength))
        .force(
          "gravity-x",
          d3.forceX<TasteGraphNode>(0).strength((node) => node.type === "tag" ? 0.02 : 0.003)
        )
        .force(
          "gravity-y",
          d3.forceY<TasteGraphNode>(0).strength((node) => node.type === "tag" ? 0.02 : 0.003)
        )
        .force(
          "collision",
          d3.forceCollide<TasteGraphNode>((node) =>
            Math.max(10, (node.radius || 4) + (node.type === "tag" ? 16 : 10))
          ).iterations(3)
        )
        .stop();
      settlingSimulation.tick(90);
      settlingSimulation.stop();
      for (const node of graph.nodes) {
        node.vx = 0;
        node.vy = 0;
      }

      const redrawBriefly = () => {
        const graph = graphRef.current;
        if (!graph) return;

        // Keep the active canvas painting. force-graph can clear its canvas for
        // a frame when toggling auto-pause, which is visible during navigation.
        graph.autoPauseRedraw(false);
      };

      const startNodePressAnimation = (nodeId: string) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const graph = graphRef.current;
        if (!graph) return;
        const now = performance.now();
        pressedNodeRef.current = {
          id: nodeId,
          scale: pressedNodeRef.current?.id === nodeId ? pressedNodeRef.current.scale : 1,
          targetScale: 0.97,
          lastFrameAt: now,
        };
        graph.autoPauseRedraw(false);

        const animate = (frameAt: number) => {
          const press = pressedNodeRef.current;
          if (!press || graphRef.current !== graph) return;
          const elapsed = Math.min(frameAt - press.lastFrameAt, 64);
          press.lastFrameAt = frameAt;
          const smoothing = 1 - Math.exp(-elapsed / (MOTION_DURATION_MS.press / 3));
          press.scale += (press.targetScale - press.scale) * smoothing;

          if (Math.abs(press.targetScale - press.scale) < 0.001) {
            press.scale = press.targetScale;
            if (press.targetScale === 1) {
              pressedNodeRef.current = null;
              graph.autoPauseRedraw(true);
            }
            return;
          }
          window.requestAnimationFrame(animate);
        };
        window.requestAnimationFrame(animate);
      };

      const nodePressScale = (nodeId: string) => {
        const press = pressedNodeRef.current;
        if (!press || press.id !== nodeId) return 1;
        return press.scale;
      };

      const releaseNodePress = () => {
        const press = pressedNodeRef.current;
        const graph = graphRef.current;
        if (!press || !graph) return;
        press.targetScale = 1;
        press.lastFrameAt = performance.now();
        graph.autoPauseRedraw(false);

        const animate = (frameAt: number) => {
          const currentPress = pressedNodeRef.current;
          if (!currentPress || graphRef.current !== graph) return;
          const elapsed = Math.min(frameAt - currentPress.lastFrameAt, 64);
          currentPress.lastFrameAt = frameAt;
          const smoothing = 1 - Math.exp(-elapsed / (MOTION_DURATION_MS.press / 3));
          currentPress.scale += (currentPress.targetScale - currentPress.scale) * smoothing;
          if (Math.abs(currentPress.targetScale - currentPress.scale) < 0.001) {
            pressedNodeRef.current = null;
            graph.autoPauseRedraw(true);
            return;
          }
          window.requestAnimationFrame(animate);
        };
        window.requestAnimationFrame(animate);
      };

      const pressNodeAtPointer = (event: PointerEvent) => {
        const state = graphStateRef.current;
        const graph = graphRef.current;
        const container = containerRef.current;
        if (!state || !graph || !container) return;

        const rect = container.getBoundingClientRect();
        const pointer = graph.screen2GraphCoords(event.clientX - rect.left, event.clientY - rect.top);
        const zoom = Math.max(graph.zoom(), 0.25);
        const hitNode = state.nodes.find((node) => {
          if (node.type === "item" && !node.visible) return false;
          const radius = Math.max(6, node.radius || 4) + 8 / zoom;
          return Math.hypot((node.x || 0) - pointer.x, (node.y || 0) - pointer.y) <= radius;
        });
        if (!hitNode) return;
        startNodePressAnimation(hitNode.id);
      };

      const drawNode = (node: TasteGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!node.visible && node.type === "item") {
          if ((node.opacity ?? 1) <= 0) return;
        }

        const visualOpacity = Math.max(0, Math.min(1, node.opacity ?? 1));
        if (visualOpacity <= 0) return;
        const layoutRadius = node.radius || 4;
        const radius =
          node.type === "item"
            ? Math.max(layoutRadius, (isCompactLayout() ? 9.5 : 8.5) / Math.max(globalScale, 0.25))
            : layoutRadius;
        ctx.save();
        const pressScale = nodePressScale(node.id);
        if (pressScale !== 1) {
          ctx.translate(node.x || 0, node.y || 0);
          ctx.scale(pressScale, pressScale);
          ctx.translate(-(node.x || 0), -(node.y || 0));
        }
        ctx.globalAlpha = 1;

        if (node.type === "tag") {
          const colors = tagColor(node.label);
          const emphasized = node.selected || node.connected || node.highlighted;
          const stronglyEmphasized = node.selected || node.connected;
          ctx.beginPath();
          ctx.fillStyle = "#14161c";
          ctx.strokeStyle = emphasized ? colors.bright : colors.base;
          ctx.lineWidth = stronglyEmphasized ? 2.5 : node.highlighted ? 1.8 : 1.45;
          if (stronglyEmphasized) {
            ctx.shadowColor = colors.bright;
            ctx.shadowBlur = 13 / globalScale;
          }
          ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = Math.max(0.38, visualOpacity);
          ctx.stroke();

          const zoomFade = emphasized
            ? 1
            : Math.max(0.48, Math.min(1, (globalScale - TAG_LABEL_ZOOM_FADE_START) / (TAG_LABEL_ZOOM_FADE_END - TAG_LABEL_ZOOM_FADE_START)));

          if (zoomFade > 0) {
            const fontSize = Math.max(8, Math.min(11, radius / 2.7)) / globalScale;
            ctx.font = `650 ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.globalAlpha = visualOpacity * zoomFade;
            ctx.fillStyle = "rgba(245, 247, 250, 0.9)";
            const label = fitCanvasLabel(ctx, node.label, Math.max(14, radius * 1.58));
            ctx.fillText(label, node.x || 0, node.y || 0);
          }
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = "#242831";
          ctx.fillRect((node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);

          const image = getImage(node.imageUrl, node.fallbackImageUrl);
          if (image && image.complete && image.naturalWidth) {
            ctx.drawImage(image, (node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);
          } else {
            ctx.fillStyle = "#767d89";
            ctx.fillRect((node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);
          }
          if (visualOpacity < 1) {
            ctx.fillStyle = `rgba(10, 12, 16, ${(1 - visualOpacity) * 0.82})`;
            ctx.fillRect((node.x || 0) - radius, (node.y || 0) - radius, radius * 2, radius * 2);
          }

          ctx.restore();
          const dominantTag = node.product?.tagAssignments?.[0]?.tag;
          const dominantColor = dominantTag ? tagColor(dominantTag).base : "rgba(255,255,255,0.72)";
          const styleRingWidth = node.selected
            ? 3 + 1.5 / globalScale
            : node.highlighted
              ? 1.8
              : node.similar
                ? 2.2
                : 1.3;
          ctx.beginPath();
          // Keep the single ring fully outside the image. Centering a thick
          // stroke on the image edge makes its inner and outer halves appear
          // like two differently colored rings over light product photos.
          const styleRingRadius = radius + styleRingWidth / 2;
          ctx.arc(node.x || 0, node.y || 0, styleRingRadius, 0, Math.PI * 2);
          ctx.strokeStyle = dominantColor;
          ctx.lineWidth = styleRingWidth;
          ctx.globalAlpha = Math.max(0.38, visualOpacity);
          ctx.stroke();

        }

        ctx.restore();
      };

      const visibleItemSetForTag = (tag: string) => {
        const entries = graphStateRef.current?.tagItems.get(tag as StyleTagName) || [];
        return new Set(entries.map((entry) => entry.productNodeId));
      };

      const getSimilarProducts = (product: TasteGraphProduct) => {
        const state = graphStateRef.current;
        if (!state) return [];
        return state.embeddingForceLinks
          .filter((link) => isProductLink(link, product.nodeId) && link.weight >= EMBEDDING_MIN_SIMILARITY)
          .map((link) => ({
            product: state.productByNodeId.get(linkSourceId(link) === product.nodeId ? linkTargetId(link) : linkSourceId(link)),
            similarity: link.weight,
          }))
          .filter((entry): entry is { product: TasteGraphProduct; similarity: number } => Boolean(entry.product))
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
          link.visible = link.type === "tag";
          link.opacity =
            link.type === "tag"
              ? link.rank === 2
                ? 0.3
                : 0.3 + (link.normalizedStrength || 0) * 0.18
              : 0;
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

      const fitOverviewCamera = (duration = 0) => {
        const state = graphStateRef.current;
        const graphInstance = graphRef.current;
        const container = containerRef.current;
        if (!state || !graphInstance || !container || !state.nodes.length) return;

        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        let nodeMinX = Number.POSITIVE_INFINITY;
        let nodeMaxX = Number.NEGATIVE_INFINITY;
        for (const node of state.nodes) {
          const x = node.x || 0;
          const y = node.y || 0;
          const radius = Math.max(6, node.radius || 4);
          const horizontalRadius =
            node.type === "tag" ? Math.max(radius, node.label.length * 4.5) : radius;
          minX = Math.min(minX, x - horizontalRadius);
          maxX = Math.max(maxX, x + horizontalRadius);
          minY = Math.min(minY, y - radius);
          maxY = Math.max(maxY, y + radius);
          nodeMinX = Math.min(nodeMinX, x - radius);
          nodeMaxX = Math.max(nodeMaxX, x + radius);
        }

        const rect = container.getBoundingClientRect();
        lastCameraFitWidth = rect.width;
        lastCameraFitHeight = rect.height;
        const compact = isCompactLayout();
        const toolbar = container.closest(".taste-graph-page")?.querySelector(".taste-graph-toolbar");
        const toolbarBottom = toolbar?.getBoundingClientRect().bottom || rect.top;
        const horizontalPadding = compact ? 18 : 90;
        const safeTop = compact ? Math.max(24, toolbarBottom - rect.top + 16) : 90;
        const viewportBottom = compact ? window.innerHeight - 64 : window.innerHeight;
        const safeBottom = Math.min(rect.height, viewportBottom - rect.top) - (compact ? 16 : 90);
        const safeLeft = horizontalPadding;
        const safeRight = rect.width - horizontalPadding;
        const availableWidth = Math.max(1, safeRight - safeLeft);
        const availableHeight = Math.max(1, safeBottom - safeTop);
        // Center the node structure itself. Long tag labels affect only the
        // scale needed to avoid clipping, not the perceived graph center.
        const graphCenterX = (nodeMinX + nodeMaxX) / 2;
        const graphCenterY = (minY + maxY) / 2;
        const graphWidth = Math.max(1, 2 * Math.max(graphCenterX - minX, maxX - graphCenterX));
        const graphHeight = Math.max(1, maxY - minY);
        const scale = Math.max(0.1, Math.min(4, availableWidth / graphWidth, availableHeight / graphHeight));
        const safeCenterX = (safeLeft + safeRight) / 2;
        const safeCenterY = (safeTop + safeBottom) / 2;
        const canvasCenterX = rect.width / 2;
        const canvasCenterY = rect.height / 2;
        const cameraCenterX = graphCenterX - (safeCenterX - canvasCenterX) / scale;
        const cameraCenterY = graphCenterY - (safeCenterY - canvasCenterY) / scale;

        graphInstance.zoom(scale, duration);
        graphInstance.centerAt(cameraCenterX, cameraCenterY, duration);

        // Keep the active canvas alive after the instant camera fit. Toggling
        // force-graph's auto-pause here can briefly clear the canvas.
        graphInstance.autoPauseRedraw(false);
      };

      const fitOverview = (duration = 0) => {
        if (!initialFitDoneRef.current) {
          initialFitDoneRef.current = true;
          const graphInstance = graphRef.current;
          window.requestAnimationFrame(() => {
            if (cancelled || graphRef.current !== graphInstance) return;
            fitOverviewCamera(0);
            window.requestAnimationFrame(() => {
              if (cancelled || graphRef.current !== graphInstance) return;
              // Let force-graph paint the final, centered camera while hidden.
              // The following frame is deliberately still hidden, so no
              // intermediate camera position can reach the user.
              fitOverviewCamera(0);
              window.requestAnimationFrame(() => {
                if (cancelled || graphRef.current !== graphInstance) return;
                graphInstance?.autoPauseRedraw(false);
                hasRenderedGraphRef.current = true;
                if (containerRef.current) containerRef.current.style.opacity = "1";
                setGraphOpacity(1);
                onReadyRef.current?.();
              });
            });
          });
          return;
        }
        fitOverviewCamera(duration);
      };

      const focusNodeCamera = (nodeId: string) => {
        const state = graphStateRef.current;
        const graphInstance = graphRef.current;
        const container = containerRef.current;
        const node = state?.nodes.find((candidate) => candidate.id === nodeId);
        if (!node || !graphInstance || !container) return;

        const rect = container.getBoundingClientRect();
        const compact = isCompactLayout();
        const currentScale = graphInstance.zoom();
        const targetScale = Math.max(
          currentScale,
          Math.min(currentScale * 1.18, compact ? 1.1 : 1.25)
        );
        const canvasCenterX = rect.width / 2;
        const canvasCenterY = rect.height / 2;
        const detailPanelWidth = compact ? 0 : Math.min(320, Math.max(0, rect.width - 32));
        const desiredScreenX = compact
          ? canvasCenterX
          : Math.max(48, (rect.width - detailPanelWidth - 16) / 2);
        const toolbar = container.closest(".taste-graph-page")?.querySelector(".taste-graph-toolbar");
        const toolbarBottom = toolbar?.getBoundingClientRect().bottom || rect.top;
        const safeTop = Math.max(24, toolbarBottom - rect.top + 16);
        const desiredScreenY = compact
          ? Math.max(safeTop + 36, rect.height * 0.38)
          : canvasCenterY;
        const cameraCenterX =
          (node.x || 0) - (desiredScreenX - canvasCenterX) / targetScale;
        const cameraCenterY =
          (node.y || 0) - (desiredScreenY - canvasCenterY) / targetScale;
        const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : MOTION_DURATION_MS.layerEnter;

        graphInstance.zoom(targetScale, duration);
        graphInstance.centerAt(cameraCenterX, cameraCenterY, duration);
      };

      const showOverview = (animate = true, shouldFit = true) => {
        const state = graphStateRef.current;
        if (!state) return;
        selectedTagRef.current = null;
        selectedProductNodeIdRef.current = null;
        hoveredNodeIdRef.current = null;
        setProductPanel(null);
        setTagPanel(null);
        resetVisualState();

        for (const node of state.nodes) {
          if (node.type === "tag") {
            node.visible = true;
            node.opacity = 1;
            node.radius = node.radius || MIN_TAG_RADIUS;
          } else {
            node.visible = true;
            node.opacity = ITEM_COLLAPSED_OPACITY;
            node.radius = collapsedItemRadius();
          }
        }

        for (const node of state.nodes) {
          if (node.type === "item") node.baseOpacity = node.opacity;
        }
        applySearchFilter();

        graphRef.current?.nodeVal((node: TasteGraphNode) => Math.max(1, node.radius || 4));
        redrawBriefly();
        if (shouldFit) fitOverview(animate ? MOTION_DURATION_MS.layerEnter : 0);
      };

      const renderProductPanel = (
        product: TasteGraphProduct,
        similarProducts: { product: TasteGraphProduct; similarity: number }[]
      ) => {
        setAreTagScoresExpanded(false);
        setProductPanel({
          nodeId: product.nodeId,
          productId: product.id,
          brand: product.brand,
          title: product.label,
          imageUrl: product.imageUrl,
          fallbackImageUrl: product.fallbackImageUrl,
          tags: product.panelTagAssignments.map((assignment) => ({
            label: assignment.tag.replaceAll("_", " "),
            score: assignment.score,
            color: tagColor(assignment.tag).bright,
          })),
          similar: similarProducts.map((entry) => ({
            nodeId: entry.product.nodeId,
            label: entry.product.label,
            similarity: entry.similarity,
            imageUrl: entry.product.imageUrl,
            fallbackImageUrl: entry.product.fallbackImageUrl,
          })),
        });
      };

      const showProductInsight = (productNodeId: string) => {
        const state = graphStateRef.current;
        if (!state) return;
        const product = state.productByNodeId.get(productNodeId);
        if (!product) return;

        setTagPanel(null);
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
          node.connected = connectedTagIds.has(node.id);
          node.similar = similarNodeIds.has(node.id);
          if (node.id === productNodeId || node.connected) {
            node.visible = true;
            node.opacity = 1;
            if (node.type === "item") node.radius = detailItemRadius();
          } else if (similarNodeIds.has(node.id)) {
            node.visible = true;
            node.opacity = 1;
            node.radius = detailItemRadius();
          } else if (node.type === "tag") {
            node.visible = true;
            node.opacity = 0.2;
          } else {
            node.opacity = 0.22;
            node.radius = collapsedItemRadius();
          }
        }

        for (const link of state.forceLinks) {
          const isDirectTagLink = link.type === "tag" && connectedLinkKeys.has(`${linkSourceId(link)}|${link.tag}`);
          const embeddingNeighborId =
            linkSourceId(link) === productNodeId ? linkTargetId(link) : linkSourceId(link);
          const isDirectEmbeddingLink =
            link.type === "embedding" &&
            isProductLink(link, productNodeId) &&
            similarNodeIds.has(embeddingNeighborId);
          link.highlighted = isDirectTagLink || isDirectEmbeddingLink;
          link.visible = link.highlighted;
          link.opacity = link.highlighted ? (link.type === "tag" ? 0.96 : 0.72) : 0;
        }

        for (const node of state.nodes) {
          if (node.type === "item") node.baseOpacity = node.opacity;
        }
        applySearchFilter();

        renderProductPanel(product, similarProducts);
        redrawBriefly();
        focusNodeCamera(productNodeId);
      };

      const showTagDetail = (tag: string) => {
        const state = graphStateRef.current;
        if (!state) return;
        selectedTagRef.current = tag;
        selectedProductNodeIdRef.current = null;
        hoveredNodeIdRef.current = null;
        setProductPanel(null);
        resetVisualState();

        const selectedTagId = tagId(tag);
        const visibleItems = visibleItemSetForTag(tag);
        const tagCounts = Array.from(state.tagItems.entries())
          .map(([entryTag, items]) => ({
            tag: entryTag,
            count: new Set(items.map((item) => item.productNodeId)).size,
            weight: items.reduce((sum, item) => sum + item.weight, 0),
          }))
          .filter((entry) => entry.count > 0)
          .sort((left, right) =>
            right.count - left.count ||
            right.weight - left.weight ||
            left.tag.localeCompare(right.tag)
          );
        const selectedTagEntry = tagCounts.find((entry) => entry.tag === tag);
        const count = selectedTagEntry?.count || visibleItems.size;
        const rank = 1 + tagCounts.filter((entry) => entry.count > count).length;
        const previewProducts = (state.tagItems.get(tag as StyleTagName) || [])
          .map((item) => state.productByNodeId.get(item.productNodeId))
          .filter((product): product is TasteGraphProduct =>
            Boolean(product && (product.imageUrl || product.fallbackImageUrl))
          )
          .slice(0, 5)
          .map((product) => ({
            nodeId: product.nodeId,
            label: product.label,
            imageUrl: product.imageUrl,
            fallbackImageUrl: product.fallbackImageUrl,
          }));
        setTagPanel({
          tag,
          rank,
          count,
          percent: state.products.length ? Math.round((count / state.products.length) * 100) : 0,
          color: tagColor(tag).bright,
          products: previewProducts,
        });

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
            node.radius = detailItemRadius();
          } else {
            node.visible = true;
            node.opacity = 0.22;
            node.radius = collapsedItemRadius();
          }
        }

        for (const link of state.forceLinks) {
          const isRelatedProduct =
            link.type === "tag" &&
            linkTargetId(link) === selectedTagId;
          link.visible = isRelatedProduct;
          link.highlighted = isRelatedProduct;
          link.opacity = isRelatedProduct ? 0.78 : 0;
        }

        for (const node of state.nodes) {
          if (node.type === "item") node.baseOpacity = node.opacity;
        }
        applySearchFilter();

        graphRef.current?.nodeVal((node: TasteGraphNode) => Math.max(1, node.radius || 4));
        redrawBriefly();
        focusNodeCamera(selectedTagId);
      };

      const showHoverInsight = (node: TasteGraphNode | null) => {
        if (selectedTagRef.current || selectedProductNodeIdRef.current) return;
        if (hoveredNodeIdRef.current === (node?.id || null)) return;

        showOverview(false, false);
        if (!node) {
          redrawBriefly();
          return;
        }

        const state = graphStateRef.current;
        if (!state) return;
        hoveredNodeIdRef.current = node.id;
        const relatedLinks = state.forceLinks.filter((link) => {
          if (node.type === "tag") {
            return link.type === "tag" && linkTargetId(link) === node.id;
          }
          return link.type === "tag" && isProductLink(link, node.id);
        });
        for (const candidate of state.nodes) {
          candidate.highlighted = candidate.id === node.id;
          candidate.connected = false;
          if (candidate.id === node.id && candidate.type === "item") {
            candidate.radius = collapsedItemRadius() + 2;
          }
        }

        const relatedLinkSet = new Set(relatedLinks);
        for (const link of state.forceLinks) {
          const related = relatedLinkSet.has(link);
          link.highlighted = false;
          link.visible = related;
          link.opacity = related ? 0.72 : 0;
        }
        redrawBriefly();
      };

      graphRef.current = new ForceGraph<TasteGraphNode, TasteGraphLink>(containerRef.current)
        .backgroundColor("rgba(0,0,0,0)")
        .width(containerRef.current.clientWidth)
        .height(containerRef.current.clientHeight)
        .warmupTicks(90)
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
          if (link.type === "embedding") ctx.setLineDash([2, 6]);
          if (link.type === "tag" && link.rank === 2 && !link.highlighted) ctx.setLineDash([3, 4]);
          if (link.highlighted && link.type === "tag") {
            ctx.shadowColor = color;
            ctx.shadowBlur = 3.5;
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
          if (node.type === "tag") {
            showTagDetail(node.label);
          } else if (node.type === "item" && node.visible) {
            showProductInsight(node.id);
          }
        })
        .onNodeHover((node: TasteGraphNode | null) => showHoverInsight(node))
        .enablePointerInteraction(activeRef.current)
        .enableZoomInteraction(activeRef.current)
        .enablePanInteraction(activeRef.current)
        .enableNodeDrag(activeRef.current)
        .onNodeDrag(() => {
          // Startup rendering is paused only after the centered overview is
          // painted. Resume the existing force response as soon as a user
          // starts a direct drag.
          graphRef.current
            ?.resumeAnimation()
            ?.cooldownTicks(Number.POSITIVE_INFINITY)
            .autoPauseRedraw(false);
        })
        .onNodeDragEnd(() => {
          // force-graph releases the node and lets the existing links, charge
          // and collision forces settle naturally until alpha reaches its floor.
          graphRef.current
            ?.cooldownTicks(Number.POSITIVE_INFINITY)
            .autoPauseRedraw(false);
        })
        .onEngineStop(() => {
          graphRef.current
            ?.cooldownTicks(0)
            .autoPauseRedraw(true);
        })
        .onBackgroundClick(() => {
          if (selectedTagRef.current || selectedProductNodeIdRef.current) showOverview(true);
        })
        .cooldownTicks(0)
        .d3AlphaDecay(0.075)
        .d3VelocityDecay(0.5);

      graphRef.current.d3Force("link").distance(linkDistance).strength(linkStrength);
      graphRef.current.d3Force("charge").strength(chargeStrength);
      graphRef.current.d3Force(
        "gravity-x",
        d3.forceX<TasteGraphNode>(0)
          .strength((node) => node.type === "tag" ? 0.02 : 0.003)
      );
      graphRef.current.d3Force(
        "gravity-y",
        d3.forceY<TasteGraphNode>(0)
          .strength((node) => node.type === "tag" ? 0.02 : 0.003)
      );
      graphRef.current.d3Force(
        "collision",
        d3.forceCollide((node: TasteGraphNode) => Math.max(10, (node.radius || 4) + (node.type === "tag" ? 16 : 10))).iterations(3)
      );

      showOverview(false);

      // 이후 인터랙션(버튼/검색/유사 상품 클릭)에서 재사용할 수 있도록 핸들러 저장
      handlersRef.current = {
        showOverview,
        showTagDetail,
        showProductInsight,
        applySearchFilter,
      };

      if (initialTag) {
        window.setTimeout(() => {
          if (!cancelled) showTagDetail(initialTag);
        }, 240);
      }

      const handleResize = () => {
        if (!graphRef.current || !containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (
          Math.abs(width - lastCameraFitWidth) < 0.5 &&
          Math.abs(height - lastCameraFitHeight) < 0.5
        ) return;
        graphRef.current.width(width).height(height);
        fitOverviewCamera(0);
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
      window.addEventListener("resize", handleResize);
      const canvasContainer = containerRef.current;
      canvasContainer.addEventListener("pointerdown", pressNodeAtPointer, { capture: true });
      canvasContainer.addEventListener("pointerup", releaseNodePress, { capture: true });
      canvasContainer.addEventListener("pointercancel", releaseNodePress, { capture: true });
      window.addEventListener("pointerup", releaseNodePress, { capture: true });

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
        canvasContainer.removeEventListener("pointerdown", pressNodeAtPointer, { capture: true });
        canvasContainer.removeEventListener("pointerup", releaseNodePress, { capture: true });
        canvasContainer.removeEventListener("pointercancel", releaseNodePress, { capture: true });
        window.removeEventListener("pointerup", releaseNodePress, { capture: true });
      };
    }

    const cleanupPromise = boot();

    return () => {
      cancelled = true;
      handlersRef.current = null;
      const graph = graphRef.current;
      graphRef.current = null;
      graph?._destructor?.();
      void cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [initialTag, graphData, graphInputSignature]);

  useLayoutEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    graph
      .enablePointerInteraction(active)
      .enableZoomInteraction(active)
      .enablePanInteraction(active)
      .enableNodeDrag(active);

    if (!active) {
      graph
        .cooldownTicks(0)
        .autoPauseRedraw(true)
        .pauseAnimation();
      return;
    }

    graph
      .resumeAnimation()
      .autoPauseRedraw(false);

    if (hasRenderedGraphRef.current && containerRef.current) {
      containerRef.current.style.opacity = "1";
      setGraphOpacity(1);
    }
  }, [active]);

  return (
    <div className="taste-graph-app">
      <div ref={containerRef} className="taste-graph-canvas" style={{ opacity: graphOpacity }} />

      <details className="taste-graph-connection-info">
        <summary><Info className="h-3.5 w-3.5" aria-hidden="true" />{t("tasteCanvas.guide")}</summary>
        <ul>
          <li><strong>{t("tasteCanvas.productNode")}</strong><span>{t("tasteCanvas.productNodeHelp")}</span></li>
          <li><strong>{t("tasteCanvas.borderColor")}</strong><span>{t("tasteCanvas.borderColorHelp")}</span></li>
          <li><strong>{t("tasteCanvas.styleTag")}</strong><span>{t("tasteCanvas.styleTagHelp")}</span></li>
          <li><strong>{t("tasteCanvas.selectProduct")}</strong><span>{t("tasteCanvas.selectProductHelp")}</span></li>
        </ul>
      </details>

      {productPanel && (
        <aside
          key={`product:${productPanel.nodeId}`}
          className="taste-graph-product-panel visible"
          aria-live="polite"
        >
          <button
            type="button"
            className="product-panel-close"
            onClick={() => handlersRef.current?.showOverview(true)}
            aria-label={t("tasteCanvas.closeProduct")}
          >
            <X aria-hidden="true" />
          </button>
          <div className="product-panel-header">
            <div className="product-panel-image-shell">
              {(productPanel.imageUrl || productPanel.fallbackImageUrl) ? (
                <NextImage
                  className="product-panel-image"
                  src={productPanel.imageUrl || productPanel.fallbackImageUrl}
                  loader={passthroughImageLoader}
                  unoptimized
                  width={58}
                  height={58}
                  data-fallback={productPanel.fallbackImageUrl}
                  alt=""
                  onError={(event) => {
                    const image = event.currentTarget;
                    const fallback = image.dataset.fallback;
                    if (fallback && image.src !== fallback) {
                      image.src = fallback;
                      image.dataset.fallback = "";
                    } else {
                      image.style.display = "none";
                    }
                  }}
                />
              ) : null}
            </div>
            <div className="product-panel-heading">
              {productPanel.brand && <p className="product-brand">{productPanel.brand}</p>}
              <h2 className="product-title">{productPanel.title}</h2>
            </div>
          </div>

          {productPanel.tags.length ? (
            <section className="product-taste-summary" aria-label={t("tasteCanvas.productStyleTags")}>
              <div className="product-taste-heading">
                <p className="product-taste-label">{t("tasteCanvas.styleTag")}</p>
                <span>{t("tasteCanvas.tagScore")}</span>
              </div>
              <div className="product-tag-list">
                {productPanel.tags.slice(0, areTagScoresExpanded ? productPanel.tags.length : 2).map((tag) => (
                  <div className="product-tag-score-row" key={tag.label}>
                    <div className="product-tag-score-label">
                      <span className="product-tag-dot" style={{ backgroundColor: tag.color }} aria-hidden="true" />
                      <span>{tag.label}</span>
                      <strong>{Math.round(tag.score * 100)}%</strong>
                    </div>
                    <span className="product-tag-meter" aria-hidden="true">
                      <span style={{ width: `${Math.max(0, Math.min(100, tag.score * 100))}%`, backgroundColor: tag.color }} />
                    </span>
                  </div>
                ))}
              </div>
              {productPanel.tags.length > 2 ? (
                <button
                  type="button"
                  className="product-tag-toggle"
                  aria-expanded={areTagScoresExpanded}
                  onClick={() => setAreTagScoresExpanded((expanded) => !expanded)}
                >
                  {areTagScoresExpanded ? t("tasteCanvas.collapseTags") : t("tasteCanvas.expandTags", { count: productPanel.tags.length })}
                </button>
              ) : null}
            </section>
          ) : null}

          {productPanel.similar.length ? (
            <div className="product-related">
              <p className="product-nearby">
                {t("tasteCanvas.similarProducts", { count: SIMILAR_TOP_K })}
              </p>
              <div className="product-quick-list">
                {productPanel.similar.map((entry) => (
                  <button
                    type="button"
                    key={entry.nodeId}
                    aria-label={t("tasteCanvas.selectEntry", { label: entry.label })}
                    title={entry.label}
                    onClick={() => handlersRef.current?.showProductInsight(entry.nodeId)}
                  >
                    <span className="product-related-image-shell">
                      {(entry.imageUrl || entry.fallbackImageUrl) ? (
                        <NextImage
                          className="product-related-image"
                          src={entry.imageUrl || entry.fallbackImageUrl}
                          loader={passthroughImageLoader}
                          unoptimized
                          width={30}
                          height={30}
                          data-fallback={entry.fallbackImageUrl}
                          alt=""
                          onError={(event) => {
                            const image = event.currentTarget;
                            const fallback = image.dataset.fallback;
                            if (fallback && image.src !== fallback) {
                              image.src = fallback;
                              image.dataset.fallback = "";
                            } else {
                              image.style.display = "none";
                            }
                          }}
                        />
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="product-panel-actions">
            <button type="button" onClick={() => onOpenProduct(productPanel.productId)}>
              {t("tasteCanvas.openProduct")} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}

      {tagPanel && (
        <aside
          key={`tag:${tagPanel.tag}`}
          className="taste-graph-product-panel taste-graph-tag-panel visible"
          aria-live="polite"
          style={{ "--tag-panel-color": tagPanel.color } as CSSProperties}
        >
          <button
            type="button"
            className="product-panel-close"
            onClick={() => handlersRef.current?.showOverview(true)}
            aria-label={t("tasteCanvas.closeTag")}
          >
            <X aria-hidden="true" />
          </button>
          <p className="tag-panel-label">{tagPanel.tag.replaceAll("_", " ")}</p>
          <h2 className="tag-panel-title">
            {t("tasteCanvas.tagSummary", { source: source === "closet" ? t("tasteCanvas.closet") : t("tasteCanvas.saved"), rank: tagPanel.rank === 1 ? t("tasteCanvas.topRank") : t("tasteCanvas.rank", { rank: tagPanel.rank }) })}
          </h2>
          {tagPanel.products.length ? (
            <div className="tag-product-stack" aria-hidden="true">
              {tagPanel.products.map((product) => (
                <NextImage
                  key={product.nodeId}
                  className="tag-product-avatar"
                  src={product.imageUrl || product.fallbackImageUrl}
                  loader={passthroughImageLoader}
                  unoptimized
                  width={36}
                  height={36}
                  data-fallback={product.fallbackImageUrl}
                  alt=""
                  title={product.label}
                  onError={(event) => {
                    const image = event.currentTarget;
                    const fallback = image.dataset.fallback;
                    if (fallback && image.src !== fallback) {
                      image.src = fallback;
                      image.dataset.fallback = "";
                    } else {
                      image.style.display = "none";
                    }
                  }}
                />
              ))}
              {tagPanel.count > tagPanel.products.length ? (
                <span className="tag-product-more">+{tagPanel.count - tagPanel.products.length}</span>
              ) : null}
            </div>
          ) : null}
          <p className="tag-panel-count">
            {t("tasteCanvas.tagCount", { count: tagPanel.count, percent: tagPanel.percent })}
          </p>
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
          transition: opacity var(--duration-popover) var(--ease-out);
        }


        .taste-graph-connection-info { position: absolute; right: 1rem; bottom: 1rem; z-index: 4; width: max-content; max-width: min(19rem, calc(100% - 2rem)); border: 1px solid rgba(255,255,255,.1); border-radius: .625rem; background: rgba(23,25,31,.78); box-shadow: 0 8px 24px rgba(0,0,0,.2); backdrop-filter: blur(14px); color: #aeb7c4; }
        .taste-graph-connection-info summary { display: flex; align-items: center; gap: .4rem; min-height: 2.25rem; padding: 0 .7rem; color: #d9dee6; cursor: pointer; font-size: .75rem; font-weight: 750; list-style: none; }
        .taste-graph-connection-info summary::-webkit-details-marker { display: none; }
        .taste-graph-connection-info p { max-width: 17rem; margin: 0; padding: 0 .7rem .7rem; font-size: .75rem; font-weight: 600; line-height: 1.5; }

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
          transition: color var(--duration-popover) var(--ease-out);
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
          transition: border-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out), box-shadow var(--duration-press) var(--ease-out);
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
          top: .75rem;
          right: 16px;
          z-index: 6;
          width: min(320px, calc(100vw - 32px));
          padding: 14px;
          pointer-events: auto;
          animation: detail-panel-in var(--duration-popover) var(--ease-out);
        }

        .product-panel-header { display: grid; grid-template-columns: 3.625rem minmax(0, 1fr); align-items: center; gap: .75rem; }
        .product-panel-close { position: absolute; top: .75rem; right: .75rem; display: grid; width: 2rem; height: 2rem; padding: 0; border: 0; border-radius: .5rem; background: rgba(255,255,255,.06); color: #cbd0d8; place-items: center; cursor: pointer; transition: background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out), transform var(--duration-press) var(--ease-out); }
        .product-panel-close:hover { background: rgba(255,255,255,.1); color: #f1f3f5; }
        .product-panel-close:active { transform: scale(.94); }
        .product-panel-close:focus-visible { outline: 2px solid rgba(148,163,184,.85); outline-offset: 2px; }
        .product-panel-close :global(svg) { width: .9rem; height: .9rem; }
        .product-panel-header, .taste-graph-tag-panel > .tag-panel-label, .taste-graph-tag-panel .tag-panel-title { margin-right: 2.25rem; }
        .product-panel-heading { min-width: 0; }
        .product-panel-image-shell, .product-related-image-shell { overflow: hidden; background: #2a2d34; }
        .product-panel-image-shell { width: 3.625rem; height: 3.625rem; border: 1px solid rgba(255,255,255,.1); border-radius: .75rem; }
        :global(.product-panel-image), :global(.product-related-image) { display: block; width: 100%; height: 100%; object-fit: cover; }
        .product-taste-summary { margin-top: .875rem; padding-top: .875rem; border-top: 1px solid rgba(255,255,255,.09); }
        .product-taste-heading { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
        .product-taste-label, .product-taste-heading > span { margin: 0; color: #aeb7c4; font-size: .6875rem; font-weight: 750; }
        .product-taste-heading > span { color: #777f8c; font-weight: 650; }
        .product-tag-list { display: grid; gap: .55rem; margin-top: .7rem; }
        .product-tag-score-row { display: grid; gap: .28rem; }
        .product-tag-score-label { display: grid; grid-template-columns: .45rem minmax(0, 1fr) auto; align-items: center; gap: .42rem; color: #d9dee6; font-size: .75rem; font-weight: 650; line-height: 1; text-transform: capitalize; }
        .product-tag-dot { width: .375rem; height: .375rem; border-radius: 999px; box-shadow: 0 0 0 2px rgba(255,255,255,.045); }
        .product-tag-score-label strong { color: #b9c1cc; font-size: .6875rem; font-variant-numeric: tabular-nums; font-weight: 750; }
        .product-tag-meter { display: block; height: .1875rem; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.07); }
        .product-tag-meter > span { display: block; height: 100%; min-width: .1875rem; border-radius: inherit; opacity: .82; }
        .product-tag-toggle { display: inline-flex; min-height: 2rem; align-items: center; margin: .45rem -.35rem -.3rem; padding: .25rem .35rem; border: 0; border-radius: .375rem; background: transparent; color: #aeb7c4; cursor: pointer; font: inherit; font-size: .6875rem; font-weight: 750; transition: color var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out); }
        .product-tag-toggle:hover { color: #e3e7ed; background: rgba(255,255,255,.055); }
        .product-tag-toggle:focus-visible { outline: 2px solid rgba(148, 163, 184, .85); outline-offset: 2px; }
        .product-related { margin-top: .875rem; }
        .product-nearby { margin: 0; color: #aeb7c4; font-size: .6875rem; font-weight: 700; }
        .taste-graph-tag-panel { border-color: color-mix(in srgb, var(--tag-panel-color) 32%, transparent); background: linear-gradient(145deg, color-mix(in srgb, var(--tag-panel-color) 10%, rgba(25, 27, 33, .94)), rgba(25, 27, 33, .92) 58%); }
        .tag-panel-label { margin: 0; color: var(--tag-panel-color); font-size: .6875rem; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
        .tag-panel-title { margin: .45rem 0 0; color: #f7f7f8; font-size: 1rem; font-weight: 800; line-height: 1.45; letter-spacing: -.015em; }
        .tag-product-stack { display: flex; align-items: center; min-height: 2.25rem; margin-top: .75rem; padding-left: .125rem; }
        :global(.tag-product-avatar), .tag-product-more { position: relative; width: 2.25rem; height: 2.25rem; flex: 0 0 2.25rem; margin-left: -.5rem; border: 2px solid rgba(25, 27, 33, .96); border-radius: 999px; box-shadow: 0 5px 12px rgba(0,0,0,.28); }
        :global(.tag-product-avatar:first-child) { margin-left: 0; }
        :global(.tag-product-avatar) { display: block; background: rgba(255,255,255,.06); object-fit: cover; }
        .tag-product-more { display: inline-flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--tag-panel-color) 16%, #202228); color: #f7f7f8; font-size: .6875rem; font-weight: 800; font-variant-numeric: tabular-nums; }
        .tag-panel-count { margin: .65rem 0 0; color: #aeb7c4; font-size: .75rem; font-weight: 650; }
        .tag-panel-count span { margin: 0 .2rem; color: rgba(255,255,255,.32); }
        .product-panel-actions { margin-top: .875rem; padding-top: .75rem; border-top: 1px solid rgba(255,255,255,.08); }
        .product-panel-actions button { display: inline-flex; align-items: center; gap: .35rem; padding: 0; border: 0; background: transparent; color: #cbd0d8; cursor: pointer; font: inherit; font-size: .75rem; font-weight: 750; transition: color var(--duration-press) var(--ease-out); }
        .product-panel-actions button:hover { color: #fdba74; }
        .product-quick-list { display: flex; gap: .375rem; max-width: 100%; margin-top: .5rem; overflow-x: auto; scrollbar-width: none; }
        .product-quick-list::-webkit-scrollbar { display: none; }
        .product-quick-list button { display: block; flex: 0 0 auto; width: 2.625rem; height: 2.625rem; padding: 0; border: 1px solid rgba(255,255,255,.1); border-radius: .625rem; background: transparent; color: #f3f4f6; cursor: pointer; overflow: hidden; transition: border-color var(--duration-press) var(--ease-out), transform var(--duration-press) var(--ease-out); }
        .product-quick-list button:hover { border-color: rgba(125,211,252,.62); transform: translateY(-1px); }
        .product-related-image-shell { display: block; width: 100%; height: 100%; border-radius: inherit; }
        .product-tags, .product-similar-title, .product-similar-list, .product-note, .product-review { display: none; }
        @keyframes detail-panel-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .product-title {
          display: -webkit-box;
          overflow: hidden;
          margin: .2rem 0 0;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.35;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
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
          transition: background-color var(--duration-press) var(--ease-out);
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
          transition: color var(--duration-press) var(--ease-out);
        }

        .product-similar-score {
          color: #38bdf8;
          font-weight: 750;
          text-align: right;
        }

        @media (max-width: 760px) {
          .taste-graph-topbar {
            display: none;
          }

          .taste-graph-controls {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .search-shell { width: 100%; }

          .taste-graph-product-panel { top: auto; right: 12px; bottom: 12px; left: 12px; width: auto; max-height: 42%; overflow-y: auto; }

          .taste-graph-connection-info {
            right: 12px;
            bottom: 12px;
            gap: 8px;
            padding: 7px 8px;
          }

          .legend-item { font-size: 8px; }
          .legend-line { width: 15px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .taste-graph-canvas { transition: opacity var(--duration-reduced) ease; }
          .taste-graph-product-panel { animation: none; }
        }
        .taste-graph-legend{display:none}
      `}</style>
      <style jsx>{`
        .taste-graph-connection-info ul{display:grid;gap:.55rem;max-width:20rem;margin:0;padding:0 .7rem .85rem;list-style:none}
        .taste-graph-connection-info li{display:grid;gap:.1rem}
        .taste-graph-connection-info li strong{color:#e6eaf0;font-size:.6875rem;font-weight:800}
        .taste-graph-connection-info li span{color:#aeb7c4;font-size:.75rem;font-weight:600;line-height:1.4}
      `}</style>
    </div>
  );
}
