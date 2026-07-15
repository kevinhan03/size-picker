"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import type { Product } from "../../types";
import { buildBrandClusters, type BrandCluster } from "../../utils/brandClusters";

type ForceGraphInstance = any;

type BrandGraphNode = {
  id: string;
  kind: "brand" | "item";
  label: string;
  radius: number;
  cluster?: BrandCluster;
  product?: Product;
  imageUrl?: string;
  opacity: number;
  selected?: boolean;
  related?: boolean;
  x?: number;
  y?: number;
};

type BrandGraphLink = {
  source: string;
  target: string;
  kind: "brand-item" | "brand-similarity";
  weight: number;
  opacity: number;
  highlighted?: boolean;
};

const nodeId = (link: BrandGraphLink, edge: "source" | "target") => {
  const value = link[edge] as unknown;
  return typeof value === "object" && value ? (value as { id: string }).id : String(value);
};

export function BrandClusterCanvas({
  products,
  selectedBrand,
  onSelectBrand,
}: {
  products: Product[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphInstance>(null);
  const nodesRef = useRef<BrandGraphNode[]>([]);
  const linksRef = useRef<BrandGraphLink[]>([]);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const selectedBrandRef = useRef(selectedBrand);
  const onSelectBrandRef = useRef(onSelectBrand);
  const [searchValue, setSearchValue] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    selectedBrandRef.current = selectedBrand;
    onSelectBrandRef.current = onSelectBrand;
  }, [onSelectBrand, selectedBrand]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!containerRef.current) return;
      const [{ default: ForceGraph }, d3] = await Promise.all([import("force-graph"), import("d3")]);
      if (cancelled || !containerRef.current) return;

      const { clusters, links: clusterLinks } = buildBrandClusters(products);
      const brandNodes: BrandGraphNode[] = clusters.map((cluster) => ({
        id: cluster.id,
        kind: "brand",
        label: cluster.displayName,
        radius: 24 + Math.sqrt(cluster.count) * 10,
        cluster,
        opacity: 1,
      }));
      const itemNodes: BrandGraphNode[] = clusters.flatMap((cluster) =>
        cluster.products.slice(0, 8).map((product) => ({
          id: `brand-item:${product.id}`,
          kind: "item",
          label: product.name,
          product,
          imageUrl: product.thumbnailImage || product.image,
          radius: 15,
          opacity: 0,
        }))
      );
      const brandLinks: BrandGraphLink[] = clusters.flatMap((cluster) => [
        ...cluster.products.slice(0, 8).map((product) => ({
          source: cluster.id,
          target: `brand-item:${product.id}`,
          kind: "brand-item" as const,
          weight: 1,
          opacity: 0,
        })),
      ]);
      const similarityLinks: BrandGraphLink[] = clusterLinks.map((link) => ({
        ...link,
        kind: "brand-similarity" as const,
        weight: link.similarity,
        opacity: 0.13,
      }));
      const nodes = [...brandNodes, ...itemNodes];
      const links = [...brandLinks, ...similarityLinks];
      nodesRef.current = nodes;
      linksRef.current = links;
      imageCacheRef.current = new Map();
      containerRef.current.innerHTML = "";

      const getImage = (url?: string) => {
        if (!url) return null;
        const cached = imageCacheRef.current.get(url);
        if (cached) return cached;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => graphRef.current?.d3ReheatSimulation();
        image.src = url;
        imageCacheRef.current.set(url, image);
        return image;
      };

      const applyState = (brand: string | null, query = "") => {
        const normalizedQuery = query.trim().toLowerCase();
        const selectedCluster = clusters.find((cluster) => cluster.brand === brand);
        const selectedIds = new Set<string>(selectedCluster
          ? [selectedCluster.id, ...selectedCluster.products.slice(0, 8).map((product) => `brand-item:${product.id}`)]
          : []);
        for (const node of nodes) {
          const cluster = node.cluster || clusters.find((entry) => entry.products.some((product) => `brand-item:${product.id}` === node.id));
          const matchesQuery = !normalizedQuery || `${node.label} ${cluster?.brand || ""}`.toLowerCase().includes(normalizedQuery);
          const related = !brand || selectedIds.has(node.id);
          node.selected = Boolean(brand && node.kind === "brand" && node.cluster?.brand === brand);
          node.related = related;
          node.opacity = !brand && node.kind === "item" ? 0 : matchesQuery ? (related ? 1 : 0.18) : 0.07;
        }
        for (const link of links) {
          const related = !brand || (selectedIds.has(nodeId(link, "source")) && selectedIds.has(nodeId(link, "target")));
          link.highlighted = Boolean(brand && related && link.kind === "brand-item");
          link.opacity = !brand
            ? (link.kind === "brand-similarity" ? 0.3 : 0)
            : related ? (link.kind === "brand-similarity" ? 0.46 : 0.62) : 0;
        }
        graphRef.current?.d3ReheatSimulation();
      };

      const drawNode = (node: BrandGraphNode, ctx: CanvasRenderingContext2D, scale: number) => {
        if (node.opacity <= 0) return;
        const x = node.x || 0;
        const y = node.y || 0;
        ctx.save();
        ctx.globalAlpha = node.opacity;

        if (node.kind === "brand") {
          ctx.beginPath();
          ctx.arc(x, y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = node.selected ? "rgba(249,115,22,0.13)" : "rgba(249,115,22,0.06)";
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = "rgba(18, 19, 23, 0.94)";
          ctx.strokeStyle = node.selected ? "#f97316" : "rgba(249,115,22,0.52)";
          ctx.lineWidth = node.selected ? 3 : 2;
          if (node.selected) { ctx.shadowColor = "rgba(249,115,22,0.6)"; ctx.shadowBlur = 14 / scale; }
          ctx.arc(x, y, node.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(247,247,248,0.96)";
          ctx.font = `750 ${Math.max(8, Math.min(14, node.radius / 3.1)) / scale}px Inter, system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const name = node.label.length > 15 ? `${node.label.slice(0, 14)}…` : node.label;
          ctx.fillText(name, x, y - 4 / scale);
          ctx.fillStyle = "#fb923c";
          ctx.font = `800 ${Math.max(8, Math.min(12, node.radius / 3.7)) / scale}px Inter, system-ui`;
          ctx.font = `850 ${Math.max(11, Math.min(18, node.radius / 2.5)) / scale}px Inter, system-ui`;
          ctx.fillText(String(node.cluster?.count || 0), x, y + 12 / scale);
          ctx.fillStyle = "rgba(251, 146, 60, 0.72)";
          ctx.font = `750 ${Math.max(6, Math.min(8, node.radius / 5.5)) / scale}px Inter, system-ui`;
          ctx.fillText("ITEMS", x, y + 23 / scale);
        } else if (node.kind === "item") {
          ctx.beginPath();
          ctx.arc(x, y, node.radius + 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(249,115,22,0.07)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, node.radius, 0, Math.PI * 2);
          ctx.clip();
          const image = getImage(node.imageUrl);
          if (image?.complete && image.naturalWidth) ctx.drawImage(image, x - node.radius, y - node.radius, node.radius * 2, node.radius * 2);
          else { ctx.fillStyle = "#737986"; ctx.fillRect(x - node.radius, y - node.radius, node.radius * 2, node.radius * 2); }
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = node.opacity;
          ctx.beginPath();
          ctx.arc(x, y, node.radius, 0, Math.PI * 2);
          ctx.strokeStyle = node.related ? "#fb923c" : "rgba(249,115,22,0.35)";
          ctx.lineWidth = node.related ? 2 : 1.25;
          ctx.stroke();
        }
        ctx.restore();
      };

      graphRef.current = new ForceGraph<BrandGraphNode, BrandGraphLink>(containerRef.current)
        .backgroundColor("rgba(0,0,0,0)")
        .graphData({ nodes, links })
        .nodeId("id")
        .nodeVal((node: BrandGraphNode) => node.radius)
        .linkVisibility((link: BrandGraphLink) => link.opacity > 0)
        .linkColor((link: BrandGraphLink) => link.kind === "brand-item" ? "rgba(199,255,5,0.52)" : "rgba(199,255,5,0.58)")
        .linkWidth((link: BrandGraphLink) => link.kind === "brand-item" ? 0.9 + link.weight * 2 : 0.7 + link.weight * 1.15)
        .linkCanvasObjectMode(() => "replace")
        .linkCanvasObject((link: BrandGraphLink, ctx: CanvasRenderingContext2D) => {
          const source = link.source as unknown as BrandGraphNode;
          const target = link.target as unknown as BrandGraphNode;
          ctx.save();
          ctx.globalAlpha = link.opacity;
          ctx.strokeStyle = link.kind === "brand-item" ? "rgba(199,255,5,0.52)" : "rgba(199,255,5,0.58)";
          ctx.lineWidth = link.kind === "brand-item" ? 0.9 + link.weight * 2 : 0.7 + link.weight * 1.15;
          ctx.beginPath(); ctx.moveTo(source.x || 0, source.y || 0); ctx.lineTo(target.x || 0, target.y || 0); ctx.stroke(); ctx.restore();
        })
        .nodeCanvasObject(drawNode)
        .nodePointerAreaPaint((node: BrandGraphNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(node.x || 0, node.y || 0, Math.max(7, node.radius), 0, Math.PI * 2); ctx.fill();
        })
        .onNodeClick((node: BrandGraphNode) => {
          const brand = node.kind === "brand"
            ? clusters.find((cluster) => cluster.id === node.id)?.brand
            : clusters.find((cluster) => cluster.products.some((product) => `brand-item:${product.id}` === node.id))?.brand;
          if (brand) onSelectBrandRef.current(brand === selectedBrandRef.current ? null : brand);
        })
        .onBackgroundClick(() => onSelectBrandRef.current(null))
        .cooldownTicks(52)
        .d3AlphaDecay(0.1)
        .d3VelocityDecay(0.58);

      graphRef.current
        .d3Force("link")
        .distance((link: BrandGraphLink) =>
          link.kind === "brand-item"
            ? 80
            : 150 + (1 - link.weight) * 165
        )
        .strength((link: BrandGraphLink) =>
          link.kind === "brand-item"
            ? 0.18
            : 0.14 + link.weight * 0.2
        );
      graphRef.current.d3Force("charge").strength((node: BrandGraphNode) => node.kind === "brand" ? -1320 : -82);
      graphRef.current.d3Force("center").strength(0.018);
      graphRef.current.d3Force(
        "collision",
        d3.forceCollide((node: BrandGraphNode) => node.radius + (node.kind === "brand" ? 52 : 8)).iterations(3)
      );
      setReady(true);
      applyState(selectedBrandRef.current);
      window.setTimeout(() => graphRef.current?.zoomToFit(0, 90), 160);

      const resize = () => {
        if (!graphRef.current || !containerRef.current) return;
        graphRef.current.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight).zoomToFit(260, 90);
      };
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }

    const cleanup = boot();
    return () => { cancelled = true; setReady(false); void cleanup.then((dispose) => dispose?.()); };
  }, [products]);

  useEffect(() => {
    const clusters = buildBrandClusters(products).clusters;
    const selected = clusters.find((cluster) => cluster.brand === selectedBrand);
    const ids = new Set<string>(selected ? [selected.id, ...selected.products.slice(0, 8).map((product) => `brand-item:${product.id}`)] : []);
    const query = searchValue.trim().toLowerCase();
    for (const node of nodesRef.current) {
      const related = !selectedBrand || ids.has(node.id);
      const matches = !query || node.label.toLowerCase().includes(query);
      node.selected = Boolean(selectedBrand && node.kind === "brand" && node.cluster?.brand === selectedBrand);
      node.related = related;
      node.opacity = !selectedBrand && node.kind === "item" ? 0 : matches ? (related ? 1 : 0.18) : 0.07;
    }
    for (const link of linksRef.current) {
      const related = !selectedBrand || (ids.has(nodeId(link, "source")) && ids.has(nodeId(link, "target")));
      link.highlighted = Boolean(selectedBrand && related && link.kind === "brand-item");
      link.opacity = !selectedBrand
        ? (link.kind === "brand-similarity" ? 0.3 : 0)
        : related ? (link.kind === "brand-similarity" ? 0.46 : 0.62) : 0;
    }
    graphRef.current?.d3ReheatSimulation();
  }, [products, searchValue, selectedBrand]);

  return (
    <div className="brand-graph-app">
      <div ref={containerRef} className="brand-graph-canvas" />
      <div className="brand-graph-topbar">
        <label className="brand-search-shell">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} disabled={!ready} placeholder="브랜드/상품명 검색" aria-label="브랜드 또는 상품명 검색" />
        </label>
        <button type="button" className="brand-icon-button" onClick={() => { setSearchValue(""); onSelectBrand(null); }} aria-label="브랜드 클러스터 전체 보기" title="전체 보기" disabled={!ready}>
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="brand-graph-legend"><span><i /> BRAND ITEMS</span><span><i className="soft" /> STYLE SIMILARITY</span></div>
      <style jsx>{`
        .brand-graph-app{position:relative;width:100%;height:100%;overflow:hidden;background:#111217;color:#f3f4f6;font-family:Inter,ui-sans-serif,system-ui}
        .brand-graph-canvas{width:100%;height:100%}.brand-graph-topbar{position:absolute;z-index:4;top:16px;right:16px;display:flex;gap:7px}.brand-search-shell,.brand-icon-button{display:flex;align-items:center;border:1px solid rgba(255,255,255,.14);background:rgba(23,25,31,.76);box-shadow:0 6px 18px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(16px)}.brand-search-shell{gap:8px;width:220px;height:36px;padding:0 12px;border-radius:9px;color:#8f99a9}.brand-search-shell input{width:100%;min-width:0;border:0;background:transparent;color:#f3f4f6;font-size:13px;outline:0}.brand-search-shell input::placeholder{color:rgba(165,172,184,.75)}.brand-icon-button{justify-content:center;width:36px;height:36px;border-radius:9px;color:#e5e7eb;cursor:pointer}.brand-icon-button:hover:not(:disabled){border-color:rgba(249,115,22,.65);color:#fb923c}.brand-icon-button:disabled,.brand-search-shell input:disabled{opacity:.55;cursor:default}.brand-graph-legend{position:absolute;right:16px;bottom:16px;display:flex;gap:14px;padding:8px 10px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(23,25,31,.68);box-shadow:0 8px 24px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.05);backdrop-filter:blur(14px);pointer-events:none}.brand-graph-legend span{display:flex;align-items:center;gap:6px;color:rgba(197,203,212,.7);font-size:9px;font-weight:750;letter-spacing:.06em}.brand-graph-legend i{display:block;width:18px;height:1px;background:rgba(199,255,5,.52)}.brand-graph-legend i.soft{background:rgba(199,255,5,.58)}@media(max-width:640px){.brand-search-shell{width:178px}.brand-graph-topbar{top:12px;right:12px}.brand-graph-legend{right:12px;bottom:12px}}
      `}</style>
    </div>
  );
}
