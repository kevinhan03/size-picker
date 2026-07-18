"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, SyntheticEvent } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { Product, RelatedGraphReason, StyleTagName, StyleTags } from "../../types";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import {
  TAGS,
  getEffectiveStyleTags,
  normalizeStyleTags,
  parseEmbedding,
  styleTagLabel,
} from "../../utils/tasteGraph";
import { captureEvent } from "../../utils/analytics";

const IMAGE_RELATED_LIMIT = 8;
const MOOD_RELATED_LIMIT = 12;
const MIN_RELATED_SCORE = 0.58;
const MOOD_CORE_TAG_MIN_SCORE = 0.45;
const MOOD_SHARED_TAG_MIN_SCORE = 0.42;
const MOOD_CATEGORY_LIMIT = 3;
const DEFAULT_PRODUCT_PLACEHOLDER = "/images/default-product.svg";
const DIGBOX_ORANGE = "#f97316";
const DIGBOX_ORANGE_BRIGHT = "#fb923c";
const DIGBOX_ORANGE_DIM = "rgba(249,115,22,0.38)";

const ProductDetailModal = dynamic(
  () => import("../ProductDetailModal").then((module) => module.ProductDetailModal),
  { ssr: false }
);

type RelatedLevel = "center" | "similar" | "mood";
type RecommendationType = "image" | "mood";
type SharedStyleTag = { tag: StyleTagName; score: number };

const MOOD_CATEGORY_COMPATIBILITY: Record<string, string[]> = {
  top: ["bottom", "outer", "shoes"],
  bottom: ["top", "outer", "shoes"],
  outer: ["top", "bottom", "shoes"],
  shoes: ["top", "bottom", "outer"],
};

interface RelatedProduct {
  product: Product;
  similarity: number;
  tags: Partial<StyleTags>;
  tagSource: "human" | "ai";
  tagReliability: number;
  level: RelatedLevel;
  recommendationType: RecommendationType;
  sharedTags?: SharedStyleTag[];
}

interface RelatedNode {
  id: string;
  label: string;
  brand: string;
  imageUrl: string;
  level: RelatedLevel;
  similarity: number;
  radius: number;
  product: Product;
  relatedProduct?: RelatedProduct;
  x?: number;
  y?: number;
  opacity?: number;
}

interface RelatedLink {
  source: string;
  target: string;
  strength: number;
  kind: "center" | "mood";
  opacity?: number;
}

interface ProductRelatedGraphModalProps {
  product: Product;
  products: Product[];
  onClose: () => void;
}

function tagVector(tags: Partial<StyleTags>): number[] {
  return TAGS.map((tag) => Number(tags[tag]) || 0);
}

function vectorMagnitude(vector: number[]) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function cosineSimilarity(a: number[], b: number[]) {
  const aMagnitude = vectorMagnitude(a);
  const bMagnitude = vectorMagnitude(b);
  if (!aMagnitude || !bMagnitude) return 0;
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  return dot / (aMagnitude * bMagnitude);
}

function tagDistanceSimilarity(a: number[], b: number[]) {
  const distance = Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
  return Math.max(0, 1 - distance / Math.sqrt(TAGS.length));
}

function styleSimilarity(a: Partial<StyleTags>, b: Partial<StyleTags>) {
  const aVector = tagVector(a);
  const bVector = tagVector(b);
  return Math.max(0, Math.min(1, cosineSimilarity(aVector, bVector) * 0.72 + tagDistanceSimilarity(aVector, bVector) * 0.28));
}

function weightedStyleSimilarity(
  a: Pick<RelatedProduct, "tags" | "tagReliability">,
  b: Pick<RelatedProduct, "tags" | "tagReliability">
) {
  const rawSimilarity = styleSimilarity(a.tags, b.tags);
  const averageReliability = (a.tagReliability + b.tagReliability) / 2;
  return Math.max(0, rawSimilarity - (1 - averageReliability) * 0.08);
}

function getProductTagProfile(product: Product) {
  const effectiveTags = getEffectiveStyleTags(product);
  const confidence = Number(product.styleTagsConfidence);
  const tagReliability =
    effectiveTags.source === "human"
      ? 1
      : Math.max(0.45, Math.min(0.85, Number.isFinite(confidence) ? confidence : 0.6));

  return {
    tags: normalizeStyleTags(effectiveTags.tags),
    tagSource: effectiveTags.source,
    tagReliability,
  };
}

function hasUsefulTags(tags: Partial<StyleTags>) {
  return TAGS.some((tag) => Number(tags[tag]) > 0);
}

function getCoreStyleTags(tags: Partial<StyleTags>) {
  return TAGS
    .map((tag) => ({ tag, score: Number(tags[tag]) || 0 }))
    .filter((entry) => entry.score >= MOOD_CORE_TAG_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getSharedCoreTags(
  coreTags: Array<{ tag: StyleTagName; score: number }>,
  candidateTags: Partial<StyleTags>
): SharedStyleTag[] {
  return coreTags
    .map(({ tag }) => ({ tag, score: Math.min(Number(candidateTags[tag]) || 0, Number(coreTags.find((entry) => entry.tag === tag)?.score) || 0) }))
    .filter((entry) => entry.score >= MOOD_SHARED_TAG_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function isCompatibleMoodCategory(sourceCategory: string, candidateCategory: string) {
  return MOOD_CATEGORY_COMPATIBILITY[sourceCategory]?.includes(candidateCategory) ?? false;
}

function buildRelatedGraphReason(centerProduct: Product, relatedProduct: RelatedProduct): RelatedGraphReason {
  const centerProfile = getProductTagProfile(centerProduct);
  const centerCategory = centerProduct.category.trim().toLowerCase();
  const relatedCategory = relatedProduct.product.category.trim().toLowerCase();
  const sharedTags = relatedProduct.sharedTags || TAGS.map((tag) => ({
    tag,
    score: Math.min(Number(centerProfile.tags[tag]) || 0, Number(relatedProduct.tags[tag]) || 0),
  }))
    .filter((entry) => entry.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return {
    similarity: relatedProduct.similarity,
    sharedTags,
    sameCategory: Boolean(centerCategory) && centerCategory === relatedCategory,
    hasHumanReviewedTags: centerProfile.tagSource === "human" || relatedProduct.tagSource === "human",
    recommendationType: relatedProduct.recommendationType,
  };
}

function normalizeCategory(category: string | null | undefined) {
  return String(category || "").trim().toLowerCase();
}

function buildImageRelatedProducts(product: Product, products: Product[]): RelatedProduct[] {
  const sourceEmbedding = parseEmbedding(product.imageEmbedding);
  const sourceCategory = normalizeCategory(product.category);
  if (!sourceEmbedding || !sourceCategory) return [];

  return products
    .filter((candidate) => String(candidate.id) !== String(product.id))
    .filter((candidate) => normalizeCategory(candidate.category) === sourceCategory)
    .map((candidate): RelatedProduct | null => {
      const embedding = parseEmbedding(candidate.imageEmbedding);
      if (!embedding) return null;
      const profile = getProductTagProfile(candidate);
      return {
        product: candidate,
        similarity: cosineSimilarity(sourceEmbedding, embedding),
        tags: profile.tags,
        tagSource: profile.tagSource,
        tagReliability: profile.tagReliability,
        level: "similar" as const,
        recommendationType: "image" as const,
      };
    })
    .filter((entry): entry is RelatedProduct => entry !== null && Number.isFinite(entry.similarity))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, IMAGE_RELATED_LIMIT);
}

function buildMoodRelatedProducts(product: Product, products: Product[]): RelatedProduct[] {
  const sourceProfile = getProductTagProfile(product);
  const sourceCategory = normalizeCategory(product.category);
  const coreTags = getCoreStyleTags(sourceProfile.tags);
  if (!sourceCategory || !coreTags.length) return [];

  const candidates = products
    .filter((candidate) => String(candidate.id) !== String(product.id))
    .filter((candidate) => isCompatibleMoodCategory(sourceCategory, normalizeCategory(candidate.category)))
    .map((candidate): RelatedProduct | null => {
      const candidateProfile = getProductTagProfile(candidate);
      const sharedTags = getSharedCoreTags(coreTags, candidateProfile.tags);
      if (!sharedTags.length || !hasUsefulTags(candidateProfile.tags)) return null;
      const sourceRelatedProduct = {
        tags: sourceProfile.tags,
        tagReliability: sourceProfile.tagReliability,
      };
      const candidateRelatedProduct = {
        tags: candidateProfile.tags,
        tagReliability: candidateProfile.tagReliability,
      };
      return {
        product: candidate,
        // 검수 완료 태그는 원래 유사도를 유지하고, 신뢰도가 낮은 AI 태그만 작게 감점한다.
        similarity: hasUsefulTags(candidateProfile.tags)
          ? weightedStyleSimilarity(sourceRelatedProduct, candidateRelatedProduct)
          : 0,
        tags: candidateProfile.tags,
        tagSource: candidateProfile.tagSource,
        tagReliability: candidateProfile.tagReliability,
        level: "mood" as const,
        recommendationType: "mood" as const,
        sharedTags,
      };
    })
    .filter((entry): entry is RelatedProduct => entry !== null && entry.similarity >= MIN_RELATED_SCORE)
    .sort((a, b) => b.similarity - a.similarity)
  const categoryCounts = new Map<string, number>();

  return candidates
    .filter((entry) => {
      const category = normalizeCategory(entry.product.category);
      const count = categoryCounts.get(category) || 0;
      if (count >= MOOD_CATEGORY_LIMIT) return false;
      categoryCounts.set(category, count + 1);
      return true;
    })
    .slice(0, MOOD_RELATED_LIMIT);
}

function nodeColor(level: RelatedLevel) {
  if (level === "center") return DIGBOX_ORANGE;
  if (level === "similar") return DIGBOX_ORANGE_BRIGHT;
  return DIGBOX_ORANGE_DIM;
}

function buildGraphData(
  graphProduct: Product,
  relatedProducts: RelatedProduct[],
  positions: Map<string, { x: number; y: number }>
) {
  const centerId = `product:${graphProduct.id}`;
  const centerPosition = positions.get(centerId);
  const centerNode: RelatedNode = {
    id: centerId,
    label: graphProduct.name,
    brand: graphProduct.brand,
    imageUrl: graphProduct.thumbnailImage || graphProduct.image || DEFAULT_PRODUCT_PLACEHOLDER,
    level: "center",
    similarity: 1,
    radius: 34,
    product: graphProduct,
    x: centerPosition?.x,
    y: centerPosition?.y,
  };

  const relatedNodes = relatedProducts.map((entry) => {
    const id = `product:${entry.product.id}`;
    const position = positions.get(id);
    return {
      id,
      label: entry.product.name,
      brand: entry.product.brand,
      imageUrl: entry.product.thumbnailImage || entry.product.image || DEFAULT_PRODUCT_PLACEHOLDER,
      level: entry.level,
      similarity: entry.similarity,
      radius: entry.level === "similar" ? 24 : 17,
      product: entry.product,
      relatedProduct: entry,
      x: position?.x,
      y: position?.y,
      opacity: 1,
    } satisfies RelatedNode;
  });

  const links: RelatedLink[] = relatedProducts.map((entry) => {
    const target = `product:${entry.product.id}`;
    return {
      source: centerId,
      target,
      strength: entry.similarity,
      kind: entry.recommendationType === "image" ? "center" : "mood",
      opacity: 1,
    };
  });

  return { nodes: [centerNode, ...relatedNodes], links };
}

export function ProductRelatedGraphModal({
  product,
  products,
  onClose,
}: ProductRelatedGraphModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<any>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const nodePositionsRef = useRef<Map<string, { x: number; y: number; vx?: number; vy?: number }>>(new Map());
  const hasRenderedGraphRef = useRef(false);
  const moodRevealFrameRef = useRef<number | null>(null);
  const moodExitFrameRef = useRef<number | null>(null);
  const selectedProductModalRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMoodExpanded, setIsMoodExpanded] = useState(false);
  const [isMoodGraphVisible, setIsMoodGraphVisible] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [graphProduct, setGraphProduct] = useState(product);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReason, setSelectedReason] = useState<RelatedGraphReason | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [isSelectedImageZoomed, setIsSelectedImageZoomed] = useState(false);
  const { closetProducts, toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { toggleDigbox, isInDigbox, ensureLoaded: ensureDigboxLoaded } = useDigboxContext();
  const sheetDragRef = useRef<{ startY: number; lastY: number; lastTime: number; velocity: number; offset: number } | null>(null);
  useBodyScrollLock(overlayRef);

  const imageRelatedProducts = useMemo(() => buildImageRelatedProducts(graphProduct, products), [graphProduct, products]);
  const moodRelatedProducts = useMemo(() => buildMoodRelatedProducts(graphProduct, products), [graphProduct, products]);
  const moodSharedStyleLabels = useMemo(() => {
    const scores = new Map<StyleTagName, number>();
    moodRelatedProducts.forEach((entry) => {
      entry.sharedTags?.forEach(({ tag, score }) => scores.set(tag, Math.max(scores.get(tag) || 0, score)));
    });
    return [...scores.entries()]
      .sort(([, left], [, right]) => right - left)
      .slice(0, 2)
      .map(([tag]) => styleTagLabel(tag));
  }, [moodRelatedProducts]);
  const relatedProducts = useMemo(
    () => (isMoodGraphVisible ? [...imageRelatedProducts, ...moodRelatedProducts] : imageRelatedProducts),
    [imageRelatedProducts, isMoodGraphVisible, moodRelatedProducts]
  );

  useEffect(() => {
    if (!moodRelatedProducts.length) {
      setIsMoodExpanded(false);
      setIsMoodGraphVisible(false);
    }
  }, [moodRelatedProducts.length]);
  const openProductModal = useCallback(
    (
      nextProduct: Product,
      trigger: "node" | "search" | "top_similar" | "size_recommendation" = "node",
      reason: RelatedGraphReason | null = null
    ) => {
      captureEvent("related_product_graph_product_opened", {
        center_product_id: graphProduct.id,
        product_id: nextProduct.id,
        trigger,
      });
      setSelectedProduct(nextProduct);
      setSelectedReason(reason);
      setSelectedRowIndex(null);
      setIsSelectedImageZoomed(false);
    },
    [graphProduct.id]
  );

  const closeProductModal = useCallback(() => {
    setSelectedProduct(null);
    setSelectedReason(null);
    setSelectedRowIndex(null);
    setIsSelectedImageZoomed(false);
  }, []);

  const switchGraphProduct = useCallback((nextProduct: Product) => {
    captureEvent("related_product_graph_center_changed", {
      from_product_id: graphProduct.id,
      to_product_id: nextProduct.id,
    });
    setGraphProduct(nextProduct);
    closeProductModal();
  }, [closeProductModal, graphProduct.id]);

  useEffect(() => {
    setGraphProduct(product);
    closeProductModal();
  }, [closeProductModal, product]);

  useEffect(() => {
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [ensureClosetLoaded, ensureDigboxLoaded]);

  useEffect(() => {
    const profile = getProductTagProfile(graphProduct);
    captureEvent("related_product_graph_viewed", {
      center_product_id: graphProduct.id,
      related_product_count: imageRelatedProducts.length,
      mood_expanded: isMoodExpanded,
      center_tag_source: profile.tagSource,
    });
  }, [graphProduct, imageRelatedProducts.length, isMoodExpanded]);

  const handleSelectedImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  const toggleSheet = () => {
    setIsSheetExpanded((value) => !value);
    setSheetOffset(0);
  };

  const toggleMoodProducts = () => {
    if (!isMoodExpanded) {
      if (moodExitFrameRef.current !== null) window.cancelAnimationFrame(moodExitFrameRef.current);
      const graphData = graphRef.current?.graphData?.();
      (graphData?.nodes as RelatedNode[] | undefined)?.filter((node) => node.level === "mood").forEach((node) => { node.opacity = 1; });
      (graphData?.links as RelatedLink[] | undefined)?.filter((link) => link.kind === "mood").forEach((link) => { link.opacity = 1; });
      graphRef.current?.refresh?.();
      setIsMoodGraphVisible(true);
      setIsMoodExpanded(true);
      return;
    }

    setIsMoodExpanded(false);
    const graph = graphRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!graph || reduceMotion) {
      setIsMoodGraphVisible(false);
      return;
    }

    const graphData = graph.graphData?.();
    const moodNodes = (graphData?.nodes as RelatedNode[] | undefined)?.filter((node) => node.level === "mood") || [];
    const moodLinks = (graphData?.links as RelatedLink[] | undefined)?.filter((link) => link.kind === "mood") || [];
    const start = performance.now();
    const fadeOut = (now: number) => {
      const opacity = Math.max(0, 1 - (now - start) / 120);
      moodNodes.forEach((node) => { node.opacity = opacity; });
      moodLinks.forEach((link) => { link.opacity = opacity; });
      graph.refresh?.();
      if (opacity > 0) {
        moodExitFrameRef.current = window.requestAnimationFrame(fadeOut);
      } else {
        setIsMoodGraphVisible(false);
      }
    };
    moodExitFrameRef.current = window.requestAnimationFrame(fadeOut);
  };

  useEffect(() => () => {
    if (moodRevealFrameRef.current !== null) window.cancelAnimationFrame(moodRevealFrameRef.current);
    if (moodExitFrameRef.current !== null) window.cancelAnimationFrame(moodExitFrameRef.current);
  }, []);

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button,a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    sheetDragRef.current = { startY: event.clientY, lastY: event.clientY, lastTime: performance.now(), velocity: 0, offset: 0 };
  };

  const handleSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = sheetDragRef.current;
    if (!drag) return;
    const now = performance.now();
    drag.velocity = (event.clientY - drag.lastY) / Math.max(1, now - drag.lastTime);
    drag.lastY = event.clientY;
    drag.lastTime = now;
    const rawOffset = event.clientY - drag.startY;
    const offset = rawOffset < -130
      ? -130 + (rawOffset + 130) * 0.24
      : rawOffset > 80
        ? 80 + (rawOffset - 80) * 0.24
        : rawOffset;
    drag.offset = offset;
    setSheetOffset(offset);
  };

  const handleSheetPointerEnd = () => {
    const drag = sheetDragRef.current;
    if (!drag) return;
    const projectedOffset = drag.offset + drag.velocity * 120;
    const shouldExpand = projectedOffset < -36;
    const shouldCollapse = projectedOffset > 36;
    if (shouldExpand) setIsSheetExpanded(true);
    if (shouldCollapse) setIsSheetExpanded(false);
    setSheetOffset(0);
    sheetDragRef.current = null;
  };

  const handleSheetKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setIsSheetExpanded(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const graphContainer = containerRef.current;

    async function boot() {
      if (!graphContainer) return;
      const [{ default: ForceGraph }, d3] = await Promise.all([import("force-graph"), import("d3")]);
      if (cancelled) return;

      graphContainer.innerHTML = "";
      imageCacheRef.current = new Map();
      const isInitialGraph = !hasRenderedGraphRef.current;
      if (isInitialGraph) setIsReady(false);

      const previousPosition = (id: string) => nodePositionsRef.current.get(id);
      const centerId = `product:${graphProduct.id}`;
      const centerPosition = previousPosition(centerId);

      const centerNode: RelatedNode = {
        id: centerId,
        label: graphProduct.name,
        brand: graphProduct.brand,
        imageUrl: graphProduct.thumbnailImage || graphProduct.image || DEFAULT_PRODUCT_PLACEHOLDER,
        level: "center",
        similarity: 1,
        radius: 34,
        product: graphProduct,
        x: centerPosition?.x,
        y: centerPosition?.y,
      };

      const relatedNodes: RelatedNode[] = relatedProducts.map((entry) => {
        const id = `product:${entry.product.id}`;
        const position = previousPosition(id);
        return {
          id,
          label: entry.product.name,
          brand: entry.product.brand,
          imageUrl: entry.product.thumbnailImage || entry.product.image || DEFAULT_PRODUCT_PLACEHOLDER,
          level: entry.level,
          similarity: entry.similarity,
          radius: entry.level === "similar" ? 24 : 17,
          product: entry.product,
          relatedProduct: entry,
          x: position?.x,
          y: position?.y,
        };
      });

      // 중심 상품과는 가장 유사한 상품만 직접 잇고, 그 밖의 상품은 태그 구성이
      // 가장 가까운 상위 이웃에 붙인다. 모든 상품을 중심에 연결하면 유사도와 무관하게
      // 방사형으로 정렬돼 실제 스타일 군집을 읽기 어려워진다.
      const imageProducts = relatedProducts.filter((entry) => entry.recommendationType === "image");
      const moodProducts = relatedProducts.filter((entry) => entry.recommendationType === "mood");
      const links: RelatedLink[] = imageProducts.map((entry) => ({
        source: centerNode.id,
        target: `product:${entry.product.id}`,
        strength: entry.similarity,
        kind: "center",
      }));

      moodProducts.forEach((entry) => {
        links.push({
          source: centerNode.id,
          target: `product:${entry.product.id}`,
          strength: entry.similarity,
          kind: "mood",
        });
      });

      const nodes = [centerNode, ...relatedNodes];

      const getImage = (url: string) => {
        if (imageCacheRef.current.has(url)) return imageCacheRef.current.get(url)!;
        const image = new Image();
        image.decoding = "async";
        image.onload = image.onerror = () => graphRef.current?.refresh?.();
        image.src = url;
        imageCacheRef.current.set(url, image);
        return image;
      };

      const drawNode = (node: RelatedNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const radius = node.radius;
        const x = node.x || 0;
        const y = node.y || 0;
        const color = nodeColor(node.level);

        ctx.save();
        ctx.globalAlpha = node.opacity ?? 1;
        ctx.beginPath();
        ctx.arc(x, y, radius + (node.level === "center" ? 6 : 3), 0, Math.PI * 2);
        ctx.fillStyle = node.level === "center" ? "rgba(249,115,22,0.13)" : "rgba(255,255,255,0.035)";
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        const image = getImage(node.imageUrl);
        if (image.complete && image.naturalWidth) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
          ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = node.level === "center" ? "#1d1510" : "#f7f7f7";
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
          if (node.level === "center") {
            ctx.fillStyle = "#fdba74";
            ctx.font = `800 ${radius * 0.72}px Inter, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText((node.brand || node.label || "?").trim().slice(0, 1).toUpperCase(), x, y + 1);
          }
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = node.level === "center" ? 3 : node.level === "similar" ? 2 : 1.25;
        ctx.stroke();

        const fontSize = (node.level === "center" ? 11 : 8.5) / Math.max(1, globalScale * 0.72);
        ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = node.level === "center" ? DIGBOX_ORANGE : "rgba(243,244,246,0.78)";
        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.lineWidth = 4 / globalScale;
        const moodTag = node.relatedProduct?.sharedTags?.[0]?.tag;
        const label = node.level === "mood" && moodTag
          ? `${node.brand || node.label} · ${styleTagLabel(moodTag)}`
          : node.brand || node.label;
        ctx.strokeText(label, x, y + radius + 8);
        ctx.fillText(label, x, y + radius + 8);
        ctx.restore();
      };

      const createForceGraph = ForceGraph as unknown as any;
      graphRef.current = createForceGraph()(graphContainer)
        .backgroundColor("rgba(0,0,0,0)")
        .graphData({ nodes, links })
        .nodeId("id")
        .nodeRelSize(1)
        .nodeVal((node: RelatedNode) => node.radius)
        .nodeCanvasObject((node: RelatedNode, ctx: CanvasRenderingContext2D, globalScale: number) => drawNode(node, ctx, globalScale))
        .nodePointerAreaPaint((node: RelatedNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, Math.max(10, node.radius + 8), 0, Math.PI * 2);
          ctx.fill();
        })
        .linkColor((link: RelatedLink) =>
          link.kind === "center"
            ? `rgba(249,115,22,${0.42 * (link.opacity ?? 1)})`
            : `rgba(251,146,60,${0.15 * (link.opacity ?? 1)})`
        )
        .linkWidth((link: RelatedLink) => (link.kind === "center" ? 0.9 + link.strength * 2 : 0.45 + link.strength * 0.45))
        .linkLineDash((link: RelatedLink) => (link.kind === "mood" ? [4, 6] : null))
        .linkDirectionalParticles(0)
        .onNodeClick((node: RelatedNode) => {
          openProductModal(
            node.product,
            "node",
            node.relatedProduct ? buildRelatedGraphReason(graphProduct, node.relatedProduct) : null
          );
        })
        .cooldownTicks(140)
        .d3AlphaDecay(0.035)
        .d3VelocityDecay(0.38);

      graphRef.current.d3Force("charge").strength((node: RelatedNode) => (node.level === "center" ? -980 : -165));
      graphRef.current.d3Force("center").strength(0.025);
      graphRef.current
        .d3Force("link")
        .distance((link: RelatedLink) =>
          link.kind === "center" ? 98 + (1 - link.strength) * 125 : 220 + (1 - link.strength) * 90
        )
        .strength((link: RelatedLink) => (link.kind === "center" ? 0.14 + link.strength * 0.16 : 0.045 + link.strength * 0.055));
      graphRef.current.d3Force("collision", d3.forceCollide((node: RelatedNode) => node.radius + 22).iterations(2));

      window.setTimeout(() => {
        if (cancelled) return;
        graphRef.current?.zoomToFit(isInitialGraph ? 500 : 0, 110);
        hasRenderedGraphRef.current = true;
        setIsReady(true);
      }, 180);
    }

    void boot();

    return () => {
      cancelled = true;
      const currentNodes = graphRef.current?.graphData?.().nodes as RelatedNode[] | undefined;
      if (currentNodes) {
        nodePositionsRef.current = new Map(
          currentNodes
            .filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y))
            .map((node) => [node.id, { x: node.x!, y: node.y! }])
        );
      }
      graphRef.current?.pauseAnimation?.();
      if (graphContainer) graphContainer.innerHTML = "";
      graphRef.current = null;
    };
  }, [graphProduct, openProductModal]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const currentNodes = graph.graphData?.().nodes as RelatedNode[] | undefined;
    if (!currentNodes?.some((node) => node.id === `product:${graphProduct.id}`)) return;

    const positions = new Map(
      currentNodes
        .filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y))
        .map((node) => [node.id, { x: node.x!, y: node.y! }])
    );
    const enteringMoodIds = new Set(
      relatedProducts
        .filter((entry) => entry.level === "mood")
        .map((entry) => `product:${entry.product.id}`)
        .filter((id) => !positions.has(id))
    );
    const nextData = buildGraphData(graphProduct, relatedProducts, positions);
    const enteringMoodNodes = nextData.nodes.filter((node) => enteringMoodIds.has(node.id));
    const enteringMoodNodeIds = new Set(enteringMoodNodes.map((node) => node.id));
    const enteringMoodLinks = nextData.links.filter((link) => link.kind === "mood" && enteringMoodNodeIds.has(link.target));
    enteringMoodNodes.forEach((node) => { node.opacity = 0; });
    enteringMoodLinks.forEach((link) => { link.opacity = 0; });
    graph.graphData(nextData);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enteringMoodNodes.length || reduceMotion) {
      enteringMoodNodes.forEach((node) => { node.opacity = 1; });
      enteringMoodLinks.forEach((link) => { link.opacity = 1; });
      graph.refresh?.();
      return;
    }

    graph.d3ReheatSimulation?.();
    const start = performance.now();
    const reveal = (now: number) => {
      const progress = Math.min(1, (now - start) / 180);
      const opacity = 1 - (1 - progress) ** 2;
      enteringMoodNodes.forEach((node) => { node.opacity = opacity; });
      enteringMoodLinks.forEach((link) => { link.opacity = opacity; });
      graph.refresh?.();
      if (progress < 1) moodRevealFrameRef.current = window.requestAnimationFrame(reveal);
    };
    moodRevealFrameRef.current = window.requestAnimationFrame(reveal);
    return () => {
      if (moodRevealFrameRef.current !== null) window.cancelAnimationFrame(moodRevealFrameRef.current);
    };
  }, [graphProduct, isMoodGraphVisible, relatedProducts]);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[76] bg-[#06070a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(249,115,22,0.095),transparent_34%),linear-gradient(180deg,#0d0f14_0%,#050608_100%)]" />
      <header className="absolute left-4 right-4 top-4 z-20 flex items-start justify-between gap-4 md:left-8 md:right-8 md:top-6">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">비슷한 상품</p>
          <p className="mt-1 truncate text-sm font-semibold text-gray-300">{graphProduct.brand} · {graphProduct.name}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="연관 상품 그래프 닫기" className="ui-related-graph-tool">
          <X className="h-5 w-5" />
        </button>
      </header>

      <aside
        className={`ui-related-graph-sheet ${isSheetExpanded ? "is-expanded" : ""}`}
        style={{ transform: `translate(-50%, ${sheetOffset}px)`, transition: sheetDragRef.current ? "none" : undefined }}
        onKeyDown={handleSheetKeyDown}
        tabIndex={0}
        aria-label="비슷한 상품 탐색 정보"
      >
        <div
          className="ui-related-graph-sheet-grab-area"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerEnd}
          onPointerCancel={handleSheetPointerEnd}
          aria-hidden="true"
        >
          <span />
        </div>
        <div className="ui-related-graph-sheet-actions">
          <button type="button" onClick={toggleSheet} className="ui-related-similar-action" aria-expanded={isSheetExpanded}>
            <span className="ui-related-summary-label">상품 목록</span>
            {isSheetExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          {moodRelatedProducts.length > 0 && <button type="button" onClick={toggleMoodProducts} className={`ui-related-outfit-action ${isMoodExpanded ? "is-active" : ""}`} aria-label={isMoodExpanded ? "유사한 스타일 상품 접기" : "유사한 스타일 보기"}>{isMoodExpanded ? "유사한 스타일 상품 접기" : "유사한 스타일 보기"}</button>}
        </div>

        {isSheetExpanded && <div className="ui-related-graph-sheet-details">
          <section className="ui-related-list-section is-primary" aria-labelledby="similar-products-heading">
            <h3 id="similar-products-heading" className="ui-related-list-heading">비슷한 상품 <span>{imageRelatedProducts.length}개</span></h3>
            <p className="ui-related-list-caption">이미지 기준</p>
            <div className="ui-related-product-list">
              {imageRelatedProducts.map((entry) => (
                <button key={entry.product.id} type="button" onClick={() => openProductModal(entry.product, "top_similar", buildRelatedGraphReason(graphProduct, entry))} className="ui-related-product-row">
                  <img src={entry.product.thumbnailImage || entry.product.image || DEFAULT_PRODUCT_PLACEHOLDER} alt="" />
                  <span><strong>{entry.product.brand}</strong><em>{entry.product.name}</em></span><b><small>유사도</small>{Math.round(entry.similarity * 100)}%</b>
                </button>
              ))}
            </div>
          </section>
          {isMoodExpanded && (
            <section className="ui-related-list-section" aria-labelledby="style-products-heading">
              <h3 id="style-products-heading" className="ui-related-list-heading">유사한 스타일의 다른 상품 <span>{moodRelatedProducts.length}개</span></h3>
              <p className="ui-related-list-caption" aria-live="polite">스타일 태그 기준{moodSharedStyleLabels.length ? ` · ${moodSharedStyleLabels.join(" · ")}` : ""}</p>
              <div className="ui-related-product-list">
                {moodRelatedProducts.map((entry) => (
                  <button key={entry.product.id} type="button" onClick={() => openProductModal(entry.product, "top_similar", buildRelatedGraphReason(graphProduct, entry))} className="ui-related-product-row">
                    <img src={entry.product.thumbnailImage || entry.product.image || DEFAULT_PRODUCT_PLACEHOLDER} alt="" />
                    <span><strong>{entry.product.brand}</strong><em>{entry.product.name}</em></span><b><small>유사한 스타일</small>{entry.sharedTags?.map(({ tag }) => styleTagLabel(tag)).join(" · ")}</b>
                  </button>
                ))}
              </div>
            </section>
          )}
          {!moodRelatedProducts.length && (
            <p className="ui-related-outfit-empty">유사한 스타일의 다른 상품을 준비 중이에요.</p>
          )}
        </div>}
      </aside>

      <div ref={containerRef} className={`relative z-[1] h-full w-full transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`} />
      {!imageRelatedProducts.length && (
        <section className="absolute left-1/2 top-1/2 z-10 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#111318]/92 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <p className="text-sm font-black text-white">이미지 기반 비슷한 상품을 준비 중이에요.</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">이 상품 또는 같은 카테고리 상품의 이미지 임베딩이 준비되면 여기에서 비슷한 상품을 탐색할 수 있어요.</p>
        </section>
      )}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          activeRowIndex={selectedRowIndex}
          onClose={closeProductModal}
          onRowClick={(rowIndex) => setSelectedRowIndex(rowIndex)}
          onRecommendationClick={(nextProduct) => openProductModal(nextProduct, "size_recommendation")}
          onZoomImage={() => setIsSelectedImageZoomed(true)}
          onImageError={handleSelectedImageError}
          modalRef={selectedProductModalRef}
          closetProduct={closetProducts.find((item) => item.id === selectedProduct.id) || null}
          onToggleCloset={(selection) => toggleCloset(selectedProduct.id, selection)}
          isInCloset={isInCloset(selectedProduct.id)}
          onToggleDigbox={() => toggleDigbox(selectedProduct.id, "related_product_graph")}
          isInDigbox={isInDigbox(selectedProduct.id)}
          hideRelatedGraphButton
          onRelatedGraphRequest={() => switchGraphProduct(selectedProduct)}
          relatedGraphButtonLabel="비슷한 상품 더 보기"
          relatedGraphReason={selectedReason}
          analyticsSource="related_product_graph"
        />
      )}
      {selectedProduct && isSelectedImageZoomed && (
        <div
          className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsSelectedImageZoomed(false)}
          onTouchStart={() => setIsSelectedImageZoomed(false)}
        >
          <div className="flex h-[63vh] w-full max-w-6xl items-center justify-center">
            <img
              src={selectedProduct.image || selectedProduct.thumbnailImage || DEFAULT_PRODUCT_PLACEHOLDER}
              alt={selectedProduct.name}
              className="max-h-full max-w-full cursor-pointer object-contain"
              style={{ borderRadius: "20px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
