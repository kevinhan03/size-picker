"use client";

import { useEffect, useMemo, useRef } from "react";
import { Info, X } from "lucide-react";
import type { Product } from "../../types";
import { buildBrandClusters, type BrandCluster, type BrandClusterLink } from "../../utils/brandClusters";
import { MOTION_DURATION_MS } from "../../utils/motion";
import { styleTagLabel, tagColor } from "../../utils/tasteGraph";

type ForceGraphInstance = any;

type BrandGraphNode = {
  id: string;
  label: string;
  radius: number;
  cluster: BrandCluster;
  opacity: number;
  selected?: boolean;
  related?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
};

type BrandGraphLink = BrandClusterLink & {
  opacity: number;
  highlighted?: boolean;
};

type BrandCameraHandlers = {
  focusNode: (nodeId: string) => void;
  showOverview: (animate?: boolean) => void;
};

const nodeId = (value: unknown) => typeof value === "object" && value ? String((value as { id: string }).id) : String(value);

function fitCanvasLabel(ctx: CanvasRenderingContext2D, label: string, maxWidth: number) {
  if (ctx.measureText(label).width <= maxWidth) return label;
  const suffix = "…";
  let end = label.length;
  while (end > 0 && ctx.measureText(`${label.slice(0, end)}${suffix}`).width > maxWidth) end -= 1;
  return end > 0 ? `${label.slice(0, end)}${suffix}` : suffix;
}

const redrawGraph = (graph: ForceGraphInstance | null) => {
  if (!graph) return;
  graph.nodeCanvasObject(graph.nodeCanvasObject());
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
  const pressedNodeRef = useRef<{ id: string; scale: number; targetScale: number; lastFrameAt: number } | null>(null);
  const cameraHandlersRef = useRef<BrandCameraHandlers | null>(null);
  const selectedBrandRef = useRef(selectedBrand);
  const onSelectBrandRef = useRef(onSelectBrand);
  const { clusters, links } = useMemo(() => buildBrandClusters(products), [products]);
  const selectedCluster = clusters.find((cluster) => cluster.brand === selectedBrand);
  const nearbyBrands = selectedCluster
    ? links
      .filter((link) => nodeId(link.source) === selectedCluster.id || nodeId(link.target) === selectedCluster.id)
      .map((link) => ({ cluster: clusters.find((cluster) => cluster.id === (nodeId(link.source) === selectedCluster.id ? nodeId(link.target) : nodeId(link.source))), similarity: link.similarity }))
      .filter((entry): entry is { cluster: BrandCluster; similarity: number } => Boolean(entry.cluster))
      .sort((left, right) => right.similarity - left.similarity)
    : [];

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

      const nodes: BrandGraphNode[] = clusters.map((cluster) => ({
        id: cluster.id,
        label: cluster.displayName,
        radius: 27 + Math.sqrt(cluster.count) * 9,
        cluster,
        opacity: 1,
      }));
      const graphLinks: BrandGraphLink[] = links.map((link) => ({ ...link, opacity: 0.42 }));
      const linkDistance = (link: BrandGraphLink) => 150 + (1 - link.similarity) * 110;
      const linkStrength = (link: BrandGraphLink) => .14 + link.similarity * .2;
      nodesRef.current = nodes;
      linksRef.current = graphLinks;
      containerRef.current.style.opacity = "0";
      containerRef.current.innerHTML = "";

      const settlingLinks = graphLinks.map((link) => ({
        ...link,
        source: nodeId(link.source),
        target: nodeId(link.target),
      }));
      const settlingSimulation = d3.forceSimulation<BrandGraphNode>(nodes)
        .force(
          "link",
          d3.forceLink<BrandGraphNode, BrandGraphLink>(settlingLinks)
            .id((node) => node.id)
            .distance(linkDistance)
            .strength(linkStrength)
        )
        .force("charge", d3.forceManyBody<BrandGraphNode>().strength(-160))
        .force("gravity-x", d3.forceX<BrandGraphNode>(0).strength(.012))
        .force("gravity-y", d3.forceY<BrandGraphNode>(0).strength(.012))
        .force("collision", d3.forceCollide<BrandGraphNode>((node) => node.radius + 16).iterations(3))
        .stop();
      settlingSimulation.tick(90);
      settlingSimulation.stop();
      for (const node of nodes) {
        node.vx = 0;
        node.vy = 0;
      }

      const applyState = (brand: string | null) => {
        const selected = clusters.find((cluster) => cluster.brand === brand);
        const relatedIds = new Set<string>(selected ? [selected.id] : []);
        for (const link of links) {
          if (selected && (nodeId(link.source) === selected.id || nodeId(link.target) === selected.id)) {
            relatedIds.add(nodeId(link.source));
            relatedIds.add(nodeId(link.target));
          }
        }
        for (const node of nodes) {
          node.selected = Boolean(selected && node.id === selected.id);
          node.related = !selected || relatedIds.has(node.id);
          node.opacity = node.related ? 1 : 0.18;
        }
        for (const link of graphLinks) {
          const related = !selected || (relatedIds.has(nodeId(link.source)) && relatedIds.has(nodeId(link.target)));
          link.highlighted = Boolean(selected && (nodeId(link.source) === selected.id || nodeId(link.target) === selected.id));
          link.opacity = !selected ? 0.42 : link.highlighted ? 0.88 : related ? 0.16 : 0.055;
        }
      };

      const startNodePressAnimation = (nodeId: string) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const graph = graphRef.current;
        if (!graph) return;
        const now = performance.now();
        pressedNodeRef.current = {
          id: nodeId,
          scale: pressedNodeRef.current?.id === nodeId ? pressedNodeRef.current.scale : 1,
          targetScale: .97,
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
          if (Math.abs(press.targetScale - press.scale) < .001) {
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
        return press?.id === nodeId ? press.scale : 1;
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
          if (Math.abs(currentPress.targetScale - currentPress.scale) < .001) {
            pressedNodeRef.current = null;
            graph.autoPauseRedraw(true);
            return;
          }
          window.requestAnimationFrame(animate);
        };
        window.requestAnimationFrame(animate);
      };

      const pressNodeAtPointer = (event: PointerEvent) => {
        const graph = graphRef.current;
        const container = containerRef.current;
        if (!graph || !container) return;
        const rect = container.getBoundingClientRect();
        const pointer = graph.screen2GraphCoords(event.clientX - rect.left, event.clientY - rect.top);
        const zoom = Math.max(graph.zoom(), .25);
        const hitNode = nodesRef.current.find((node) => {
          const radius = node.radius + 8 / zoom;
          return Math.hypot((node.x || 0) - pointer.x, (node.y || 0) - pointer.y) <= radius;
        });
        if (hitNode) startNodePressAnimation(hitNode.id);
      };

      const drawNode = (node: BrandGraphNode, ctx: CanvasRenderingContext2D, scale: number) => {
        if (node.opacity <= 0) return;
        const x = node.x || 0;
        const y = node.y || 0;
        const primaryTag = node.cluster.topTags[0]?.tag;
        const primaryColor = primaryTag ? tagColor(primaryTag).base : "rgba(255,255,255,.72)";
        ctx.save();
        const pressScale = nodePressScale(node.id);
        if (pressScale !== 1) {
          ctx.translate(x, y);
          ctx.scale(pressScale, pressScale);
          ctx.translate(-x, -y);
        }
        ctx.globalAlpha = node.opacity;
        ctx.beginPath();
        ctx.arc(x, y, node.radius + 4 / scale, 0, Math.PI * 2);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = node.selected ? 3.6 / scale : node.related ? 2.2 / scale : 1.3 / scale;
        if (node.selected) { ctx.shadowColor = primaryColor; ctx.shadowBlur = 13 / scale; }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(18, 19, 23, .94)";
        ctx.fill();
        ctx.fillStyle = "rgba(247,247,248,.96)";
        ctx.font = `750 ${Math.max(8, Math.min(14, node.radius / 3.15)) / scale}px Inter, system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const name = fitCanvasLabel(ctx, node.label, Math.max(16, node.radius * 1.52));
        ctx.fillText(name, x, y - 5 / scale);
        ctx.fillStyle = "rgba(208,213,221,.82)";
        ctx.font = `700 ${Math.max(7, Math.min(10, node.radius / 4.4)) / scale}px Inter, system-ui`;
        ctx.fillText(`${node.cluster.count}개 상품`, x, y + 12 / scale);
        ctx.restore();
      };

      graphRef.current = new ForceGraph<BrandGraphNode, BrandGraphLink>(containerRef.current)
        .backgroundColor("rgba(0,0,0,0)")
        .graphData({ nodes, links: graphLinks })
        .nodeId("id")
        .nodeVal((node: BrandGraphNode) => node.radius)
        .linkVisibility((link: BrandGraphLink) => link.opacity > 0)
        .linkCanvasObjectMode(() => "replace")
        .linkCanvasObject((link: BrandGraphLink, ctx: CanvasRenderingContext2D) => {
          const source = link.source as unknown as BrandGraphNode;
          const target = link.target as unknown as BrandGraphNode;
          ctx.save();
          ctx.globalAlpha = link.opacity;
          ctx.strokeStyle = link.highlighted ? "rgba(255,255,255,.92)" : "rgba(197,203,212,.76)";
          ctx.lineWidth = (link.highlighted ? 2.2 : 1.35) + link.similarity * 1.05;
          ctx.beginPath(); ctx.moveTo(source.x || 0, source.y || 0); ctx.lineTo(target.x || 0, target.y || 0); ctx.stroke(); ctx.restore();
        })
        .nodeCanvasObject(drawNode)
        .nodePointerAreaPaint((node: BrandGraphNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(node.x || 0, node.y || 0, Math.max(12, node.radius + 6), 0, Math.PI * 2); ctx.fill();
        })
        .onNodeClick((node: BrandGraphNode) => onSelectBrandRef.current(node.cluster.brand === selectedBrandRef.current ? null : node.cluster.brand))
        .onBackgroundClick(() => onSelectBrandRef.current(null))
        .enableNodeDrag(true)
        .onNodeDrag(() => {
          graphRef.current
            ?.cooldownTicks(Number.POSITIVE_INFINITY)
            .autoPauseRedraw(false);
        })
        .onNodeDragEnd(() => {
          graphRef.current
            ?.cooldownTicks(Number.POSITIVE_INFINITY)
            .autoPauseRedraw(false);
        })
        .onEngineStop(() => {
          graphRef.current
            ?.cooldownTicks(0)
            .autoPauseRedraw(true);
        })
        .cooldownTicks(0)
        .d3AlphaDecay(.075)
        .d3VelocityDecay(.5);

      graphRef.current.d3Force("link")
        .distance(linkDistance)
        .strength(linkStrength);
      graphRef.current.d3Force("charge").strength(-160);
      graphRef.current.d3Force("center").strength(.018);
      graphRef.current.d3Force("gravity-x", d3.forceX<BrandGraphNode>(0).strength(.012));
      graphRef.current.d3Force("gravity-y", d3.forceY<BrandGraphNode>(0).strength(.012));
      graphRef.current.d3Force("collision", d3.forceCollide((node: BrandGraphNode) => node.radius + 16).iterations(3));

      const fitOverviewCamera = (duration = 0) => {
        const graph = graphRef.current;
        const container = containerRef.current;
        if (!graph || !container || !nodesRef.current.length) return;

        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        for (const node of nodesRef.current) {
          const radius = node.radius + 4;
          const x = node.x || 0;
          const y = node.y || 0;
          minX = Math.min(minX, x - radius);
          maxX = Math.max(maxX, x + radius);
          minY = Math.min(minY, y - radius);
          maxY = Math.max(maxY, y + radius);
        }

        const rect = container.getBoundingClientRect();
        const compact = rect.width < 600;
        const toolbar = container.closest(".taste-graph-page")?.querySelector(".taste-graph-toolbar");
        const toolbarBottom = toolbar?.getBoundingClientRect().bottom || rect.top;
        const horizontalPadding = compact ? 18 : 90;
        const safeTop = compact ? Math.max(24, toolbarBottom - rect.top + 16) : 90;
        const safeBottom = rect.height - (compact ? 16 : 90);
        const availableWidth = Math.max(1, rect.width - horizontalPadding * 2);
        const availableHeight = Math.max(1, safeBottom - safeTop);
        const graphCenterX = (minX + maxX) / 2;
        const graphCenterY = (minY + maxY) / 2;
        const graphWidth = Math.max(1, maxX - minX);
        const graphHeight = Math.max(1, maxY - minY);
        const scale = Math.max(.1, Math.min(4, availableWidth / graphWidth, availableHeight / graphHeight));
        const safeCenterY = (safeTop + safeBottom) / 2;
        const canvasCenterY = rect.height / 2;
        const cameraCenterY = graphCenterY - (safeCenterY - canvasCenterY) / scale;

        graph.zoom(scale, duration);
        graph.centerAt(graphCenterX, cameraCenterY, duration);
        graph.autoPauseRedraw(false);
      };

      const focusNodeCamera = (nodeId: string) => {
        const graph = graphRef.current;
        const container = containerRef.current;
        const node = nodesRef.current.find((candidate) => candidate.id === nodeId);
        if (!graph || !container || !node) return;

        const rect = container.getBoundingClientRect();
        const compact = rect.width < 600;
        const currentScale = graph.zoom();
        const targetScale = Math.max(currentScale, Math.min(currentScale * 1.18, compact ? 1.1 : 1.25));
        const canvasCenterX = rect.width / 2;
        const canvasCenterY = rect.height / 2;
        const detailPanelWidth = compact ? 0 : Math.min(320, Math.max(0, rect.width - 32));
        const desiredScreenX = compact ? canvasCenterX : Math.max(48, (rect.width - detailPanelWidth - 16) / 2);
        const toolbar = container.closest(".taste-graph-page")?.querySelector(".taste-graph-toolbar");
        const toolbarBottom = toolbar?.getBoundingClientRect().bottom || rect.top;
        const safeTop = Math.max(24, toolbarBottom - rect.top + 16);
        const desiredScreenY = compact ? Math.max(safeTop + 36, rect.height * .38) : canvasCenterY;
        const cameraCenterX = (node.x || 0) - (desiredScreenX - canvasCenterX) / targetScale;
        const cameraCenterY = (node.y || 0) - (desiredScreenY - canvasCenterY) / targetScale;
        const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : MOTION_DURATION_MS.layerEnter;

        graph.zoom(targetScale, duration);
        graph.centerAt(cameraCenterX, cameraCenterY, duration);
      };

      const showOverview = (animate = true) => {
        const duration = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? MOTION_DURATION_MS.layerEnter
          : 0;
        fitOverviewCamera(duration);
      };

      cameraHandlersRef.current = { focusNode: focusNodeCamera, showOverview };
      applyState(selectedBrandRef.current);
      const graphInstance = graphRef.current;
      window.requestAnimationFrame(() => {
        if (cancelled || graphRef.current !== graphInstance) return;
        fitOverviewCamera(0);
        window.requestAnimationFrame(() => {
          if (cancelled || graphRef.current !== graphInstance) return;
          fitOverviewCamera(0);
          window.requestAnimationFrame(() => {
            if (cancelled || graphRef.current !== graphInstance || !containerRef.current) return;
            containerRef.current.style.opacity = "1";
          });
        });
      });

      const resize = () => {
        const graph = graphRef.current;
        const container = containerRef.current;
        if (!graph || !container) return;
        graph.width(container.clientWidth).height(container.clientHeight);
        const selected = clusters.find((cluster) => cluster.brand === selectedBrandRef.current);
        if (selected) focusNodeCamera(selected.id);
        else fitOverviewCamera(0);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(containerRef.current);
      window.addEventListener("resize", resize);
      const canvasContainer = containerRef.current;
      canvasContainer.addEventListener("pointerdown", pressNodeAtPointer, { capture: true });
      canvasContainer.addEventListener("pointerup", releaseNodePress, { capture: true });
      canvasContainer.addEventListener("pointercancel", releaseNodePress, { capture: true });
      window.addEventListener("pointerup", releaseNodePress, { capture: true });
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", resize);
        canvasContainer.removeEventListener("pointerdown", pressNodeAtPointer, { capture: true });
        canvasContainer.removeEventListener("pointerup", releaseNodePress, { capture: true });
        canvasContainer.removeEventListener("pointercancel", releaseNodePress, { capture: true });
        window.removeEventListener("pointerup", releaseNodePress, { capture: true });
      };
    }

    const cleanup = boot();
    return () => {
      cancelled = true;
      cameraHandlersRef.current = null;
      pressedNodeRef.current = null;
      const graph = graphRef.current;
      graphRef.current = null;
      graph?._destructor?.();
      void cleanup.then((dispose) => dispose?.());
    };
  }, [clusters, links]);

  useEffect(() => {
    const selected = clusters.find((cluster) => cluster.brand === selectedBrand);
    const relatedIds = new Set<string>(selected ? [selected.id] : []);
    for (const link of links) if (selected && (nodeId(link.source) === selected.id || nodeId(link.target) === selected.id)) { relatedIds.add(nodeId(link.source)); relatedIds.add(nodeId(link.target)); }
    for (const node of nodesRef.current) {
      node.selected = Boolean(selected && node.id === selected.id);
      node.related = !selected || relatedIds.has(node.id);
      node.opacity = node.related ? 1 : .18;
    }
    for (const link of linksRef.current) {
      const related = !selected || (relatedIds.has(nodeId(link.source)) && relatedIds.has(nodeId(link.target)));
      link.highlighted = Boolean(selected && (nodeId(link.source) === selected.id || nodeId(link.target) === selected.id));
      link.opacity = !selected ? .42 : link.highlighted ? .88 : related ? .16 : .055;
    }
    redrawGraph(graphRef.current);
    if (selected) cameraHandlersRef.current?.focusNode(selected.id);
    else cameraHandlersRef.current?.showOverview(true);
  }, [clusters, links, selectedBrand]);

  return (
    <div className="brand-graph-app">
      <div ref={containerRef} className="brand-graph-canvas" />
      <details className="brand-graph-guide">
        <summary><Info aria-hidden="true" />브랜드 취향 그래프 읽는 법</summary>
        <ul>
          <li><strong>상품 수</strong><span>저장한 상품과 옷장에 있는 이 브랜드의 상품이 많을수록 원이 커져요.</span></li>
          <li><strong>대표 스타일</strong><span>테두리 색은 이 브랜드 상품에서 가장 많이 보이는 스타일 태그예요.</span></li>
          <li><strong>비슷한 브랜드</strong><span>선은 저장·옷장 상품의 스타일 구성이 비슷한 브랜드를 이어요.</span></li>
          <li><strong>브랜드를 누르면</strong><span>저장·옷장에 있는 상품 수, 상위 스타일 2개, 비슷한 브랜드를 볼 수 있어요.</span></li>
        </ul>
      </details>
      {selectedCluster ? (
        <aside key={`brand:${selectedCluster.id}`} className="brand-graph-panel" aria-label={`${selectedCluster.displayName} 브랜드 정보`}>
          <button type="button" className="brand-panel-close" onClick={() => onSelectBrand(null)} aria-label="브랜드 정보 닫기"><X aria-hidden="true" /></button>
          <p>BRAND</p>
          <h3>{selectedCluster.displayName}</h3>
          <div className="brand-summary" aria-label="브랜드 요약">
            <span><small>저장·옷장 상품</small><strong>{selectedCluster.count}개</strong></span>
            <span><small>비슷한 브랜드</small><strong>{nearbyBrands.length}개</strong></span>
          </div>
          <span className="brand-panel-count">저장한 상품과 옷장에 {selectedCluster.count}개 상품</span>
          <section><h4>스타일 태그</h4><div className="brand-panel-tags">{selectedCluster.topTags.slice(0, 2).map(({ tag, score }) => <span key={tag}><i style={{ backgroundColor: tagColor(tag).base }} />{styleTagLabel(tag)} <strong>{Math.round(score * 100)}%</strong></span>)}</div></section>
          <section><h4>가까운 브랜드</h4>{nearbyBrands.length ? <div className="brand-nearby-list">{nearbyBrands.map(({ cluster }) => <button key={cluster.id} type="button" onClick={() => onSelectBrand(cluster.brand)}>{cluster.displayName}<span aria-hidden="true">→</span></button>)}</div> : <span className="brand-panel-empty">지금은 비슷한 브랜드 연결이 없어요.</span>}</section>
        </aside>
      ) : null}
      <style jsx>{`
        .brand-graph-app{position:relative;width:100%;height:100%;overflow:hidden;background:#111217;color:#f3f4f6;font-family:var(--font-sans)}.brand-graph-canvas{width:100%;height:100%;transition:opacity var(--duration-popover) var(--ease-out)}.brand-graph-intro{position:absolute;z-index:3;top:18px;left:18px;max-width:18rem;pointer-events:none}.brand-graph-intro p,.brand-graph-panel>p{margin:0;color:#f2a56c;font-size:.6875rem;font-weight:850;letter-spacing:.1em}.brand-graph-intro h2{margin:.4rem 0 0;font-size:1.25rem;font-weight:780;letter-spacing:-.03em}.brand-graph-intro span{display:block;margin-top:.45rem;color:#aeb7c4;font-size:.75rem;font-weight:600;line-height:1.5}.brand-graph-topbar{position:absolute;z-index:4;top:16px;right:16px}.brand-icon-button{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:rgba(23,25,31,.76);box-shadow:0 6px 18px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.06);color:#e5e7eb;backdrop-filter:blur(16px);cursor:pointer}.brand-icon-button :global(svg){width:.9rem;height:.9rem}.brand-icon-button:hover:not(:disabled){border-color:rgba(249,115,22,.65);color:#fb923c}.brand-icon-button:disabled{opacity:.55;cursor:default}.brand-graph-legend{position:absolute;right:16px;bottom:16px;display:flex;gap:14px;padding:8px 10px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(23,25,31,.68);backdrop-filter:blur(14px);pointer-events:none}.brand-graph-legend span{display:flex;align-items:center;gap:6px;color:rgba(197,203,212,.76);font-size:.625rem;font-weight:750}.brand-graph-legend i{display:block;width:9px;height:9px;border:2px solid #fb923c;border-radius:50%}.brand-graph-legend b{display:block;width:18px;height:1px;background:rgba(197,203,212,.7)}.brand-graph-panel{position:absolute;z-index:5;top:5.5rem;right:1rem;width:min(20rem,calc(100% - 2rem));padding:1.125rem;border:1px solid rgba(255,255,255,.14);border-radius:1rem;background:rgba(25,27,33,.94);box-shadow:0 18px 42px rgba(0,0,0,.35);backdrop-filter:blur(18px);animation:brand-panel-in .2s var(--ease-out)}.brand-panel-close{position:absolute;top:.75rem;right:.75rem;display:grid;width:2rem;height:2rem;padding:0;border:0;border-radius:.5rem;background:rgba(255,255,255,.06);color:#cbd0d8;place-items:center;cursor:pointer}.brand-panel-close :global(svg){width:.9rem;height:.9rem}.brand-graph-panel h3{margin:.4rem 2.25rem 0 0;font-size:1.125rem;font-weight:800;letter-spacing:-.025em}.brand-panel-count{display:block;margin-top:.4rem;color:#aeb7c4;font-size:.75rem;font-weight:600}.brand-graph-panel section{margin-top:1rem;padding-top:.875rem;border-top:1px solid rgba(255,255,255,.09)}.brand-graph-panel h4{margin:0;color:#8993a2;font-size:.6875rem;font-weight:800;letter-spacing:.06em}.brand-panel-tags{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.625rem}.brand-panel-tags span{display:inline-flex;align-items:center;gap:.3rem;color:#d7dce4;font-size:.75rem;font-weight:700}.brand-panel-tags i{width:.4rem;height:.4rem;border-radius:50%}.brand-panel-tags strong{color:#fff;font-size:.6875rem}.brand-nearby-list{display:grid;gap:.25rem;margin-top:.45rem}.brand-nearby-list button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:.4rem 0;border:0;background:transparent;color:#e4e7ec;font:inherit;font-size:.75rem;font-weight:700;text-align:left;cursor:pointer}.brand-nearby-list button:hover{color:#fdba74}.brand-nearby-list :global(svg){width:.85rem;height:.85rem}.brand-panel-empty{display:block;margin-top:.55rem;color:#8993a2;font-size:.75rem;font-weight:600}.brand-product-list{display:flex;gap:.4rem;margin-top:.625rem;overflow:hidden}.brand-product-list img{width:2.7rem;height:2.7rem;border:1px solid rgba(255,255,255,.1);border-radius:.55rem;background:#25272e;object-fit:cover}@keyframes brand-panel-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@media(max-width:640px){.brand-graph-intro{top:14px;left:14px;max-width:12rem}.brand-graph-intro h2{font-size:1rem}.brand-graph-intro span{display:none}.brand-graph-topbar{top:12px;right:12px}.brand-graph-panel{top:auto;right:12px;bottom:12px;left:12px;width:auto;max-height:48%;overflow-y:auto}.brand-graph-legend{right:12px;bottom:calc(48% + 24px)}}@media(prefers-reduced-motion:reduce){.brand-graph-canvas{transition:none}.brand-graph-panel{animation:none}}
      `}</style>
      <style jsx>{`
        .brand-panel-count{display:none}
        .brand-summary{display:flex;gap:1.5rem;margin-top:.85rem}
        .brand-summary span{display:grid;gap:.2rem}
        .brand-summary small{color:#8993a2;font-size:.625rem;font-weight:800;letter-spacing:.05em}
        .brand-summary strong{color:#f1f3f5;font-size:.8125rem;font-weight:780;letter-spacing:-.015em}
        .brand-graph-panel{animation:brand-detail-panel-in var(--duration-popover) var(--ease-out)}
        @keyframes brand-detail-panel-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(min-width:641px){.brand-graph-panel{top:.75rem}}
        .brand-graph-guide{position:absolute;right:1rem;bottom:1rem;z-index:4;max-width:min(20rem,calc(100% - 2rem));border:1px solid rgba(255,255,255,.1);border-radius:.625rem;background:rgba(23,25,31,.78);box-shadow:0 8px 24px rgba(0,0,0,.2);backdrop-filter:blur(14px);color:#aeb7c4}
        .brand-graph-guide summary{display:flex;align-items:center;gap:.4rem;min-height:2.25rem;padding:0 .7rem;color:#d9dee6;cursor:pointer;font-size:.75rem;font-weight:750;list-style:none}
        .brand-graph-guide summary::-webkit-details-marker{display:none}.brand-graph-guide summary :global(svg){width:.9rem;height:.9rem}.brand-graph-guide ul{display:grid;gap:.55rem;max-width:20rem;margin:0;padding:0 .7rem .85rem;list-style:none}.brand-graph-guide li{display:grid;gap:.1rem}.brand-graph-guide li strong{color:#e6eaf0;font-size:.6875rem;font-weight:800}.brand-graph-guide li span{font-size:.75rem;font-weight:600;line-height:1.4}
        @media(max-width:640px){.brand-graph-guide{right:12px;bottom:12px}}
      `}</style>
    </div>
  );
}
