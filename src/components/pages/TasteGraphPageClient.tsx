"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Network, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { useProductDetail } from "../../hooks/useProductDetail";
import { captureEvent } from "../../utils/analytics";
import { fetchTasteAnalysis } from "../../api";
import { buildLoginHref } from "../../utils/authNavigation";
import { toPublicUrl } from "../../utils/product";
import type { Product, StyleTagName } from "../../types";
import { loadProductDetailModal } from "../productDetailModalLoader";
import type { SerializedTasteGraphState, TasteCollectionSource } from "../../utils/tasteGraph";
import { buildBrandClusters } from "../../utils/brandClusters";
import { TasteReport } from "../taste-graph/TasteReport";
import { PageState } from "../PageState";

const TasteGraphCanvas = dynamic(() => import("../taste-graph/TasteGraphCanvas").then((module) => module.TasteGraphCanvas), { loading: () => <MapLoading />, ssr: false });
const BrandClusterCanvas = dynamic(() => import("../taste-graph/BrandClusterCanvas").then((module) => module.BrandClusterCanvas), { loading: () => <MapLoading />, ssr: false });
const ProductDetailModal = dynamic(loadProductDetailModal, { ssr: false });
const ImageViewerOverlay = dynamic(() => import("../ImageViewerOverlay").then((module) => module.ImageViewerOverlay), { ssr: false });

type TasteGraphSource = TasteCollectionSource;
type TasteGraphView = "products" | "brands";
type MapTarget = { source?: TasteCollectionSource; tag?: StyleTagName };

const SOURCE_ORDER: readonly TasteGraphSource[] = ["digbox", "closet"];

function MapLoading() {
  const { t } = useLocaleContext();
  return <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">{t("tasteGraph.loading")}</div>;
}

function sourcePath(source: TasteGraphSource) {
  return source === "digbox" ? "saved" : "closet";
}

function graphMatchesProducts(graph: SerializedTasteGraphState | undefined, products: Product[]) {
  if (!graph || graph.products.length !== products.length) return false;
  const productIds = new Set(products.map((product) => product.id));
  return graph.products.every((product) => productIds.has(product.id));
}

export function TasteGraphPageClient({
  initialSource,
  initialView = "products",
  initialTag,
  initialGraphs,
}: {
  initialSource?: TasteGraphSource;
  initialView?: TasteGraphView;
  initialTag?: StyleTagName;
  initialGraphs?: Partial<Record<TasteGraphSource, SerializedTasteGraphState>>;
}) {
  const { t } = useLocaleContext();
  const router = useRouter();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const [isMapOpen, setIsMapOpen] = useState(Boolean(initialSource));
  const [selectedSource, setSelectedSource] = useState<TasteGraphSource | null>(initialSource || null);
  const [selectedView, setSelectedView] = useState<TasteGraphView>(initialView);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [productGraphReady, setProductGraphReady] = useState<Record<TasteGraphSource, boolean>>({
    digbox: false,
    closet: false,
  });
  const [graphs, setGraphs] = useState<Partial<Record<TasteGraphSource, SerializedTasteGraphState>>>(initialGraphs || {});
  const [graphLoadError, setGraphLoadError] = useState<string | null>(null);
  const graphRequestsRef = useRef(new Map<TasteGraphSource, Promise<void>>());
  const [urlFocus, setUrlFocus] = useState<{ source: TasteGraphSource | null; tag?: StyleTagName }>({
    source: initialSource || null,
    tag: initialTag,
  });
  const productModal = useProductModalQuery();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const detailedProduct = useProductDetail(productModal.productId, selectedProduct);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const reportScrollPositionRef = useRef(0);
  const shouldRestoreReportScrollRef = useRef(false);
  const {
    closetProducts,
    isLoaded: isClosetLoaded,
    error: closetError,
    reload: reloadCloset,
    toggleCloset,
    isInCloset,
    ensureLoaded: ensureClosetLoaded,
  } = useClosetContext();
  const {
    digboxProducts,
    isLoaded: isDigboxLoaded,
    error: digboxError,
    reload: reloadDigbox,
    toggleDigbox,
    isInDigbox,
    ensureLoaded: ensureDigboxLoaded,
  } = useDigboxContext();

  useEffect(() => {
    if (auth.isAuthLoading || authUserId) return;
    const query = new URLSearchParams();
    if (initialView === "brands") query.set("view", "brands");
    if (initialTag) query.set("tag", initialTag);
    const returnTo = initialSource
      ? `/taste/${sourcePath(initialSource)}${query.size ? `?${query.toString()}` : ""}`
      : "/taste";
    router.replace(buildLoginHref("login", returnTo, "taste"));
  }, [auth.isAuthLoading, authUserId, initialSource, initialTag, initialView, router]);

  useEffect(() => {
    setSelectedSource(initialSource || null);
    setSelectedView(initialView);
    setSelectedBrand(null);
    setUrlFocus({ source: initialSource || null, tag: initialTag });
    setIsMapOpen(Boolean(initialSource));
  }, [initialSource, initialTag, initialView]);

  useEffect(() => {
    if (!authUserId) return;
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [authUserId, ensureClosetLoaded, ensureDigboxLoaded]);

  const source = selectedSource ?? urlFocus.source ?? "digbox";
  const activeProducts = source === "closet" ? closetProducts : digboxProducts;
  const digboxGraphData = useMemo(
    () => graphMatchesProducts(graphs.digbox, digboxProducts) ? graphs.digbox : undefined,
    [digboxProducts, graphs.digbox]
  );
  const closetGraphData = useMemo(
    () => graphMatchesProducts(graphs.closet, closetProducts) ? graphs.closet : undefined,
    [closetProducts, graphs.closet]
  );
  const brandProducts = useMemo(
    () => Array.from(new Map([...digboxProducts, ...closetProducts].map((product) => [product.id, product])).values()),
    [closetProducts, digboxProducts]
  );
  const normalizedProduct = useMemo<Product | null>(() => {
    if (!detailedProduct) return null;
    const imagePath = String(detailedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : detailedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : detailedProduct.thumbnailImage;
    return { ...detailedProduct, image, thumbnailImage };
  }, [detailedProduct]);
  const hasBrandClusters = useMemo(() => buildBrandClusters(brandProducts).clusters.length > 1, [brandProducts]);
  const emptyCopy = useMemo(() => source === "closet"
    ? { title: t("tasteGraph.empty.closet.title"), description: t("tasteGraph.empty.closet.description") }
    : source === "digbox"
      ? { title: t("tasteGraph.empty.saved.title"), description: t("tasteGraph.empty.saved.description") }
      : { title: t("tasteGraph.empty.title"), description: t("tasteGraph.empty.description") }, [source, t]);

  useEffect(() => {
    if (!isMapOpen || !authUserId || graphs[source] || graphRequestsRef.current.has(source)) return;
    const request = fetchTasteAnalysis(source)
      .then(({ graph }) => {
        setGraphs((current) => ({ ...current, [source]: graph }));
        setGraphLoadError(null);
      })
      .catch((error: unknown) => {
        setGraphLoadError(error instanceof Error ? error.message : t("tasteGraph.analysisLoadFailed"));
      })
      .finally(() => graphRequestsRef.current.delete(source));
    graphRequestsRef.current.set(source, request);
  }, [authUserId, graphs, isMapOpen, source, t]);

  useEffect(() => {
    if (isMapOpen && source !== "closet" && digboxProducts.length > 0) {
      captureEvent("interest_taste_viewed", { product_count: digboxProducts.length });
      captureEvent("taste_result_viewed", { product_count: digboxProducts.length, source });
    }
  }, [digboxProducts.length, isMapOpen, source]);

  useEffect(() => {
    if (isMapOpen || !shouldRestoreReportScrollRef.current) return;
    shouldRestoreReportScrollRef.current = false;
    requestAnimationFrame(() => window.scrollTo({ top: reportScrollPositionRef.current, behavior: "auto" }));
  }, [isMapOpen]);

  useEffect(() => {
    if (!productModal.productId) {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
      return;
    }

    const product =
      digboxProducts.find((item) => item.id === productModal.productId) ||
      closetProducts.find((item) => item.id === productModal.productId);
    if (product) setSelectedProduct(product);
  }, [closetProducts, digboxProducts, productModal.productId]);

  const openProductDetail = (productId: string) => {
    const product = activeProducts.find((item) => item.id === productId);
    if (!product) return;
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    productModal.openProduct(product.id);
  };

  const closeProductDetail = () => {
    productModal.closeProduct();
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
  };

  const openRecommendedProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    productModal.openProduct(product.id, true);
  };

  const handleProductImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  const openMap = (target?: MapTarget) => {
    reportScrollPositionRef.current = window.scrollY;
    const nextSource = target?.source || "digbox";
    const tagQuery = target?.tag ? `?tag=${encodeURIComponent(target.tag)}` : "";
    setSelectedSource(nextSource);
    setSelectedView("products");
    setSelectedBrand(null);
    setUrlFocus({ source: nextSource, tag: target?.tag });
    router.push(`/taste/${sourcePath(nextSource)}${tagQuery}`);
  };

  const openBrandMap = () => {
    if (!hasBrandClusters) return;
    reportScrollPositionRef.current = window.scrollY;
    setSelectedSource("digbox");
    setSelectedView("brands");
    setSelectedBrand(null);
    setUrlFocus({ source: "digbox" });
    router.push("/taste/saved?view=brands");
  };

  const closeMap = () => {
    shouldRestoreReportScrollRef.current = true;
    setIsMapOpen(false);
    setSelectedSource(null);
    setSelectedBrand(null);
    router.push("/taste");
  };

  const selectSource = (nextSource: TasteGraphSource) => {
    if (nextSource === source) return;
    setSelectedSource(nextSource);
    setSelectedView("products");
    setSelectedBrand(null);
    setUrlFocus({ source: nextSource });
    window.history.replaceState(null, "", `/taste/${sourcePath(nextSource)}`);
  };

  const renderSourceToggle = () => (
    <div className="taste-source-toggle" aria-label={t("tasteGraph.dataToggle")}>
      <span className="taste-source-thumb" style={{ transform: `translateX(${SOURCE_ORDER.indexOf(source) * 100}%)` }} aria-hidden="true" />
      {SOURCE_ORDER.map((value) => (
        <button key={value} type="button" className={`taste-source-button ${source === value ? "active" : ""}`} onClick={() => selectSource(value)}>
          {value === "digbox" ? t("tasteGraph.saved") : t("tasteGraph.closet")}
          <span>{value === "digbox" ? digboxProducts.length : closetProducts.length}</span>
        </button>
      ))}
    </div>
  );

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title={t("tasteGraph.loading")} description={t("tasteGraph.loadingDescription")} /></main>;
  }

  if (closetError || digboxError) {
    return (
      <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]">
        <PageState
          kind="error"
          title={t("tasteGraph.loadError")}
          description={t("tasteGraph.loadErrorDescription")}
          action={(
            <button
              type="button"
              onClick={() => {
                if (closetError) void reloadCloset(true);
                if (digboxError) void reloadDigbox(true);
              }}
              className="ui-button ui-button-primary px-5 py-2.5"
            >
              {t("common.retry")}
            </button>
          )}
        />
      </main>
    );
  }

  if (graphLoadError && isMapOpen) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="error" title={t("tasteGraph.loadError")} description={graphLoadError} action={<button type="button" onClick={() => { setGraphLoadError(null); setGraphs((current) => { const next = { ...current }; delete next[source]; return next; }); }} className="ui-button ui-button-primary px-5 py-2.5">{t("common.retry")}</button>} /></main>;
  }

  if (!isClosetLoaded || !isDigboxLoaded) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title={t("tasteGraph.loading")} description={t("tasteGraph.loadingDescription")} /></main>;
  }

  if (!closetProducts.length && !digboxProducts.length) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 pt-[var(--app-main-pt)] text-center text-white"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300"><Network className="h-7 w-7" /></span><div><h1 className="text-xl font-black">{t("tasteGraph.empty.title")}</h1><p className="mt-2 text-sm font-semibold leading-6 text-gray-400">{t("tasteGraph.empty.description")}</p></div><Link href="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400"><Plus className="h-4 w-4" />{t("tasteGraph.browse")}</Link></main>;
  }

  if (isMapOpen && !activeProducts.length) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 pt-[var(--app-main-pt)] text-center text-white"><button type="button" onClick={closeMap} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300"><ArrowLeft className="h-4 w-4" />{t("tasteGraph.backToSummary")}</button><p className="text-xl font-black">{emptyCopy.title}</p><p className="max-w-sm text-sm font-semibold leading-6 text-gray-400">{emptyCopy.description}</p></main>;
  }

  return (
    <>
      {!isMapOpen ? <TasteReport closetProducts={closetProducts} digboxProducts={digboxProducts} onOpenMap={openMap} onOpenBrandMap={hasBrandClusters ? openBrandMap : undefined} /> : null}
    <main className={`taste-graph-page taste-graph-layout ${!isMapOpen ? "taste-graph-layout--standby" : ""}`} aria-hidden={!isMapOpen}>
      <header className="taste-graph-toolbar">
        <button type="button" onClick={closeMap} className="taste-map-back">
          <ArrowLeft className="h-4 w-4" />{t("tasteGraph.summary")}
        </button>
        {selectedView === "products" ? renderSourceToggle() : null}
      </header>
      {isMapOpen ? <div className="taste-canvas-pane">
        <div
          className={`taste-product-graph-stack ${selectedView === "products" ? "active" : ""}`}
          aria-hidden={selectedView !== "products"}
        >
          <div className={`taste-product-graph-layer ${source === "digbox" ? "active" : ""}`}>
            <TasteGraphCanvas
              products={digboxProducts}
              graphData={digboxGraphData}
              initialTag={urlFocus.source === "digbox" ? urlFocus.tag : undefined}
              source="digbox"
              active={isMapOpen && selectedView === "products" && source === "digbox"}
              onOpenProduct={openProductDetail}
              onLoading={() => setProductGraphReady((ready) => ({ ...ready, digbox: false }))}
              onReady={() => setProductGraphReady((ready) => ({ ...ready, digbox: true }))}
            />
          </div>
          <div className={`taste-product-graph-layer ${source === "closet" ? "active" : ""}`}>
            <TasteGraphCanvas
              products={closetProducts}
              graphData={closetGraphData}
              initialTag={urlFocus.source === "closet" ? urlFocus.tag : undefined}
              source="closet"
              active={isMapOpen && selectedView === "products" && source === "closet"}
              onOpenProduct={openProductDetail}
              onLoading={() => setProductGraphReady((ready) => ({ ...ready, closet: false }))}
              onReady={() => setProductGraphReady((ready) => ({ ...ready, closet: true }))}
            />
          </div>
        </div>
        {selectedView === "products" && !productGraphReady[source] ? (
          <div className="taste-graph-loading-overlay" aria-live="polite"><MapLoading /></div>
        ) : null}
        {isMapOpen && selectedView === "brands" ? (
          <BrandClusterCanvas products={brandProducts} selectedBrand={selectedBrand} onSelectBrand={setSelectedBrand} />
        ) : null}
      </div> : null}

      {normalizedProduct && typeof document !== "undefined"
        ? createPortal(
            <>
              <ProductDetailModal
                product={normalizedProduct}
                closetProduct={closetProducts.find((item) => item.id === normalizedProduct.id) || null}
                activeRowIndex={activeRowIndex}
                onClose={closeProductDetail}
                onRowClick={setActiveRowIndex}
                onRecommendationClick={openRecommendedProduct}
                onZoomImage={() => setIsDetailImageZoomed(true)}
                onImageError={handleProductImageError}
                modalRef={modalRef}
                onToggleCloset={(selection) => toggleCloset(normalizedProduct.id, selection)}
                isInCloset={isInCloset(normalizedProduct.id)}
                onToggleDigbox={() => toggleDigbox(normalizedProduct.id)}
                isInDigbox={isInDigbox(normalizedProduct.id)}
                hideDigboxButton={isInDigbox(normalizedProduct.id)}
                analyticsSource="taste_graph"
              />
              <ImageViewerOverlay
                open={isDetailImageZoomed}
                src={normalizedProduct.image}
                alt={normalizedProduct.name}
                onClose={() => setIsDetailImageZoomed(false)}
              />
            </>,
            document.body
          )
        : null}
      <style jsx>{layoutStyles}</style>
    </main>
    </>
  );
}

const layoutStyles = `
  .taste-graph-layout { position: fixed; display: flex; width: 100%; min-height: 0; flex-direction: column; overflow: hidden; overscroll-behavior: none; background: #111217; opacity: 1; transform: translateY(0); transition: opacity var(--duration-popover) var(--ease-out), transform var(--duration-popover) var(--ease-out); }
  .taste-graph-layout--standby { display: none; inset: 0; pointer-events: none; }
  @starting-style { .taste-graph-layout { opacity: 0; transform: translateY(8px); } }
  .taste-graph-toolbar { position: absolute; top: .75rem; left: .75rem; z-index: 10; display: flex; align-items: center; gap: .5rem; }
  .taste-graph-toolbar :global(.taste-view-toggle) { width: auto; min-width: 11rem; }
  .taste-canvas-pane { position: relative; flex: 1 1 0%; min-width: 0; min-height: 0; overflow: hidden; }
  .taste-product-graph-stack, .taste-product-graph-layer { position: absolute; inset: 0; min-width: 0; min-height: 0; overflow: hidden; }
  .taste-product-graph-stack { visibility: hidden; pointer-events: none; }
  .taste-product-graph-stack.active { visibility: visible; pointer-events: auto; }
  .taste-product-graph-layer { visibility: hidden; opacity: 0; pointer-events: none; }
  .taste-product-graph-layer.active { visibility: visible; opacity: 1; pointer-events: auto; }
  .taste-graph-loading-overlay { position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; background: #111217; }
  .taste-map-back { display: inline-flex; min-height: 2.25rem; flex-shrink: 0; align-items: center; gap: .375rem; padding: 0 .75rem; border: 1px solid rgba(255,255,255,.12); border-radius: .625rem; background: rgba(17,18,23,.78); backdrop-filter: blur(14px); color: #d0d5dd; cursor: pointer; font: inherit; font-size: .75rem; font-weight: 700; white-space: nowrap; }
  @media (hover: hover) and (pointer: fine) { .taste-map-back:hover { color: #fff; border-color: rgba(255,255,255,.28); } }
  @media (max-width: 700px) { .taste-graph-toolbar { right: .75rem; flex-wrap: wrap; } .taste-source-toggle { flex: 1 1 auto; } .taste-view-toggle { margin-left: auto; } }
  @media (prefers-reduced-motion: reduce) { .taste-graph-layout { transform: none; transition: opacity var(--duration-reduced) ease; } }
`;
