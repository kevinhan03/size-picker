"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import dynamic from "next/dynamic";
import { ExternalLink, X } from "lucide-react";
import type { Product, RelatedGraphReason, StyleTags } from "../../types";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import {
  TAGS,
  getEffectiveStyleTags,
  normalizeStyleTags,
  selectTopTags,
  tagColor,
} from "../../utils/tasteGraph";
import { captureEvent } from "../../utils/analytics";

const RELATED_LIMIT = 22;
const PRIMARY_LIMIT = 7;
const MIN_RELATED_SCORE = 0.58;
const DEFAULT_PRODUCT_PLACEHOLDER = "/images/default-product.svg";
const DIGBOX_ORANGE = "#f97316";
const DIGBOX_ORANGE_BRIGHT = "#fb923c";
const DIGBOX_ORANGE_DIM = "rgba(249,115,22,0.38)";

const ProductDetailModal = dynamic(
  () => import("../ProductDetailModal").then((module) => module.ProductDetailModal),
  { ssr: false }
);

type RelatedLevel = "center" | "level1" | "level2";

interface RelatedProduct {
  product: Product;
  similarity: number;
  tags: Partial<StyleTags>;
  tagSource: "human" | "ai";
  tagReliability: number;
  level: RelatedLevel;
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
}

interface RelatedLink {
  source: string;
  target: string;
  strength: number;
  kind: "center" | "cluster";
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

function buildRelatedGraphReason(centerProduct: Product, relatedProduct: RelatedProduct): RelatedGraphReason {
  const centerProfile = getProductTagProfile(centerProduct);
  const centerCategory = centerProduct.category.trim().toLowerCase();
  const relatedCategory = relatedProduct.product.category.trim().toLowerCase();
  const sharedTags = TAGS.map((tag) => ({
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
  };
}

function buildRelatedProducts(product: Product, products: Product[]): RelatedProduct[] {
  const sourceProfile = getProductTagProfile(product);
  if (!hasUsefulTags(sourceProfile.tags)) return [];

  return products
    .filter((candidate) => String(candidate.id) !== String(product.id))
    .map((candidate) => {
      const candidateProfile = getProductTagProfile(candidate);
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
        level: "level2" as RelatedLevel,
      };
    })
    .filter((entry) => entry.similarity >= MIN_RELATED_SCORE)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, RELATED_LIMIT)
    .map((entry, index) => ({
      ...entry,
      level: index < PRIMARY_LIMIT ? "level1" : "level2",
    }));
}

function nodeColor(level: RelatedLevel) {
  if (level === "center") return DIGBOX_ORANGE;
  if (level === "level1") return DIGBOX_ORANGE_BRIGHT;
  return DIGBOX_ORANGE_DIM;
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
  const selectedProductModalRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [graphProduct, setGraphProduct] = useState(product);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReason, setSelectedReason] = useState<RelatedGraphReason | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [isSelectedImageZoomed, setIsSelectedImageZoomed] = useState(false);
  const { closetProducts, toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { toggleDigbox, isInDigbox, ensureLoaded: ensureDigboxLoaded } = useDigboxContext();
  useBodyScrollLock(overlayRef);

  const sourceTags = useMemo(() => getProductTagProfile(graphProduct).tags, [graphProduct]);
  const relatedProducts = useMemo(() => buildRelatedProducts(graphProduct, products), [graphProduct, products]);
  const topSourceTags = useMemo(() => selectTopTags(sourceTags, 5, { enforceSecondThreshold: false }), [sourceTags]);
  const searchedProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((entry) => String(entry.id) !== String(graphProduct.id))
      .filter((entry) => `${entry.brand} ${entry.name} ${entry.category}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [graphProduct.id, products, searchQuery]);

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
      setSearchQuery("");
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
    setSearchQuery("");
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
      related_product_count: relatedProducts.length,
      center_tag_source: profile.tagSource,
    });
  }, [graphProduct, relatedProducts.length]);

  const handleSelectedImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
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
      setIsReady(false);

      const centerNode: RelatedNode = {
        id: `product:${graphProduct.id}`,
        label: graphProduct.name,
        brand: graphProduct.brand,
        imageUrl: graphProduct.thumbnailImage || graphProduct.image || DEFAULT_PRODUCT_PLACEHOLDER,
        level: "center",
        similarity: 1,
        radius: 34,
        product: graphProduct,
      };

      const relatedNodes: RelatedNode[] = relatedProducts.map((entry) => ({
        id: `product:${entry.product.id}`,
        label: entry.product.name,
        brand: entry.product.brand,
        imageUrl: entry.product.thumbnailImage || entry.product.image || DEFAULT_PRODUCT_PLACEHOLDER,
        level: entry.level,
        similarity: entry.similarity,
        radius: entry.level === "level1" ? 24 : 17,
        product: entry.product,
        relatedProduct: entry,
      }));

      // 중심 상품과는 가장 유사한 상품만 직접 잇고, 그 밖의 상품은 태그 구성이
      // 가장 가까운 상위 이웃에 붙인다. 모든 상품을 중심에 연결하면 유사도와 무관하게
      // 방사형으로 정렬돼 실제 스타일 군집을 읽기 어려워진다.
      const primaryProducts = relatedProducts.filter((entry) => entry.level === "level1");
      const links: RelatedLink[] = primaryProducts.map((entry) => ({
        source: centerNode.id,
        target: `product:${entry.product.id}`,
        strength: entry.similarity,
        kind: "center",
      }));

      relatedProducts.forEach((entry, index) => {
        if (entry.level === "level1") return;

        const possibleParents = relatedProducts.slice(0, index);
        const parent = possibleParents
          .map((candidate) => ({
            candidate,
            similarity: weightedStyleSimilarity(entry, candidate),
          }))
          .sort((a, b) => b.similarity - a.similarity)[0];

        if (!parent) return;
        links.push({
          source: `product:${parent.candidate.product.id}`,
          target: `product:${entry.product.id}`,
          strength: parent.similarity,
          kind: "cluster",
        });
      });

      const nodes = [centerNode, ...relatedNodes];

      const getImage = (url: string) => {
        if (imageCacheRef.current.has(url)) return imageCacheRef.current.get(url)!;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => graphRef.current?.d3ReheatSimulation();
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
          ctx.fillStyle = "#f7f7f7";
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = node.level === "center" ? 3 : node.level === "level1" ? 2 : 1.25;
        ctx.stroke();

        const fontSize = (node.level === "center" ? 11 : 8.5) / Math.max(1, globalScale * 0.72);
        ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = node.level === "center" ? DIGBOX_ORANGE : "rgba(243,244,246,0.78)";
        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.lineWidth = 4 / globalScale;
        const label = node.level === "center" ? node.brand || node.label : node.brand || node.label;
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
          link.kind === "center" ? "rgba(249,115,22,0.42)" : "rgba(249,115,22,0.18)"
        )
        .linkWidth((link: RelatedLink) => (link.kind === "center" ? 0.9 + link.strength * 2 : 0.45 + link.strength * 0.7))
        .linkDirectionalParticles(0)
        .onNodeClick((node: RelatedNode) => {
          if (node.level === "center") return;
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
          link.kind === "center" ? 94 + (1 - link.strength) * 170 : 62 + (1 - link.strength) * 125
        )
        .strength((link: RelatedLink) => (link.kind === "center" ? 0.12 + link.strength * 0.16 : 0.1 + link.strength * 0.22));
      graphRef.current.d3Force("collision", d3.forceCollide((node: RelatedNode) => node.radius + 22).iterations(2));

      window.setTimeout(() => {
        if (cancelled) return;
        graphRef.current?.zoomToFit(500, 110);
        setIsReady(true);
      }, 180);
    }

    void boot();

    return () => {
      cancelled = true;
      graphRef.current?.pauseAnimation?.();
      if (graphContainer) graphContainer.innerHTML = "";
      graphRef.current = null;
    };
  }, [graphProduct, openProductModal, relatedProducts]);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[76] bg-[#06070a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(249,115,22,0.095),transparent_34%),linear-gradient(180deg,#0d0f14_0%,#050608_100%)]" />
      <header className="absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-4 md:left-8 md:right-8 md:top-6">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Related product graph</p>
          <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white md:text-3xl">{graphProduct.brand}</h2>
          <p className="mt-1 max-w-[520px] truncate text-sm font-semibold text-gray-500">{graphProduct.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="연관 상품 그래프 닫기"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-gray-300 backdrop-blur-xl transition hover:border-orange-500/60 hover:text-orange-400"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="absolute left-1/2 top-5 z-20 w-[min(360px,calc(100vw-128px))] -translate-x-1/2 md:top-6">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="상품명 또는 브랜드 검색"
          className="h-10 w-full rounded-xl border border-white/12 bg-white/[0.075] px-4 text-xs font-bold text-white shadow-[0_18px_44px_rgba(0,0,0,0.32)] outline-none backdrop-blur-xl transition placeholder:text-gray-600 focus:border-orange-500/70 focus:bg-white/[0.095] focus:ring-4 focus:ring-orange-500/15"
        />
        {searchQuery.trim() && (
          <div className="mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-white/10 bg-[#111318]/94 p-2 shadow-[0_22px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {searchedProducts.length > 0 ? (
              searchedProducts.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => openProductModal(entry, "search")}
                  className="flex w-full min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.06]"
                >
                  <img
                    src={entry.thumbnailImage || entry.image || DEFAULT_PRODUCT_PLACEHOLDER}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black uppercase text-orange-400">{entry.brand}</span>
                    <span className="block truncate text-sm font-semibold text-gray-200">{entry.name}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm font-semibold text-gray-500">검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      <aside className="absolute bottom-5 left-4 z-10 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#111318]/82 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl md:bottom-8 md:left-8">
        <h3 className="text-2xl font-black text-orange-500">{graphProduct.brand}</h3>
        <a
          href={graphProduct.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (!graphProduct.url) return;
            captureEvent("product_website_clicked", {
              product_id: graphProduct.id,
              source: "related_product_graph_center",
            });
          }}
          className={`mt-2 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.18em] ${
            graphProduct.url ? "text-gray-500 transition hover:text-orange-400" : "pointer-events-none text-gray-700"
          }`}
        >
          공식 홈페이지 <ExternalLink className="h-3 w-3" />
        </a>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.22em] text-gray-600">Top similar</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {relatedProducts.slice(0, 10).map((entry) => (
            <button
              key={entry.product.id}
              type="button"
              onClick={() => openProductModal(entry.product, "top_similar", buildRelatedGraphReason(graphProduct, entry))}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-gray-200 transition hover:border-orange-500/50 hover:text-orange-400"
            >
              {entry.product.brand}
            </button>
          ))}
          {!relatedProducts.length && <span className="text-sm font-semibold text-gray-500">비슷한 태그 점수의 상품이 아직 없습니다.</span>}
        </div>

        {topSourceTags.length > 0 && (
          <div className="mt-5 grid gap-2">
            {topSourceTags.map(([tag, score]) => {
              const colors = tagColor(tag);
              return (
                <div key={tag} className="grid grid-cols-[96px_1fr_38px] items-center gap-2 text-xs">
                  <span className="truncate font-bold text-gray-300">{tag}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full" style={{ width: `${score * 100}%`, background: colors.base }} />
                  </span>
                  <span className="text-right font-bold text-gray-500">{score.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <div ref={containerRef} className={`relative z-[1] h-full w-full transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`} />
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
          relatedGraphButtonLabel="이 상품 그래프로 보기"
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
