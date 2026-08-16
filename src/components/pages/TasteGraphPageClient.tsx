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
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { useProductDetail } from "../../hooks/useProductDetail";
import { captureEvent } from "../../utils/analytics";
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
  return <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">취향 그래프를 준비하고 있어요.</div>;
}

function sourcePath(source: TasteGraphSource) {
  return source === "digbox" ? "saved" : "closet";
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
    ensureLoaded: ensureClosetLoaded,
    error: closetError,
    reload: reloadCloset,
    toggleCloset,
    isInCloset,
  } = useClosetContext();
  const {
    digboxProducts,
    isLoaded: isDigboxLoaded,
    ensureLoaded: ensureDigboxLoaded,
    error: digboxError,
    reload: reloadDigbox,
    toggleDigbox,
    isInDigbox,
  } = useDigboxContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !authUserId) router.replace("/login");
  }, [auth.isAuthLoading, authUserId, router]);

  useEffect(() => {
    if (!authUserId) return;
    ensureDigboxLoaded(true);
    ensureClosetLoaded(true);
  }, [authUserId, ensureClosetLoaded, ensureDigboxLoaded]);

  useEffect(() => {
    setSelectedSource(initialSource || null);
    setSelectedView(initialView);
    setSelectedBrand(null);
    setUrlFocus({ source: initialSource || null, tag: initialTag });
    setIsMapOpen(Boolean(initialSource));
  }, [initialSource, initialTag, initialView]);

  const source = selectedSource ?? urlFocus.source ?? "digbox";
  const activeProducts = source === "closet" ? closetProducts : digboxProducts;
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
    ? { title: "아직 옷장 상품이 없어요", description: "실제로 가진 상품을 옷장에 넣으면 보유 취향을 그려드릴게요." }
    : source === "digbox"
      ? { title: "아직 저장한 상품이 없어요", description: "마음에 드는 상품을 저장하면 관심 취향을 그려드릴게요." }
      : { title: "아직 취향을 읽을 상품이 없어요", description: "상품을 저장하거나 옷장에 추가하면 스타일 섬이 자라기 시작해요." }, [source]);

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
    <div className="taste-source-toggle" aria-label="그래프 데이터 선택">
      <span className="taste-source-thumb" style={{ transform: `translateX(${SOURCE_ORDER.indexOf(source) * 100}%)` }} aria-hidden="true" />
      {SOURCE_ORDER.map((value) => (
        <button key={value} type="button" className={`taste-source-button ${source === value ? "active" : ""}`} onClick={() => selectSource(value)}>
          {value === "digbox" ? "저장" : "옷장"}
          <span>{value === "digbox" ? digboxProducts.length : closetProducts.length}</span>
        </button>
      ))}
    </div>
  );

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title="취향 그래프를 준비하고 있어요" description="저장한 상품을 분석해 나만의 연결을 만드는 중입니다." /></main>;
  }

  if (closetError || digboxError) {
    return (
      <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]">
        <PageState
          kind="error"
          title="취향 그래프를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요. 저장한 상품은 그대로 유지됩니다."
          action={(
            <button
              type="button"
              onClick={() => {
                if (closetError) void reloadCloset(true);
                if (digboxError) void reloadDigbox(true);
              }}
              className="ui-button ui-button-primary px-5 py-2.5"
            >
              다시 시도
            </button>
          )}
        />
      </main>
    );
  }

  if (!isClosetLoaded || !isDigboxLoaded) {
    return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title="취향 그래프를 준비하고 있어요" description="저장한 상품을 분석해 나만의 연결을 만드는 중입니다." /></main>;
  }

  if (!closetProducts.length && !digboxProducts.length) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 pt-[var(--app-main-pt)] text-center text-white"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300"><Network className="h-7 w-7" /></span><div><h1 className="text-xl font-black">아직 취향을 읽을 상품이 없어요</h1><p className="mt-2 text-sm font-semibold leading-6 text-gray-400">상품을 저장하거나 옷장에 추가하면 취향의 중심을 보여드릴게요.</p></div><Link href="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400"><Plus className="h-4 w-4" />상품 둘러보기</Link></main>;
  }

  if (isMapOpen && !activeProducts.length) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 pt-[var(--app-main-pt)] text-center text-white"><button type="button" onClick={closeMap} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300"><ArrowLeft className="h-4 w-4" />요약으로 돌아가기</button><p className="text-xl font-black">{emptyCopy.title}</p><p className="max-w-sm text-sm font-semibold leading-6 text-gray-400">{emptyCopy.description}</p></main>;
  }

  return (
    <>
      {!isMapOpen ? <TasteReport closetProducts={closetProducts} digboxProducts={digboxProducts} onOpenMap={openMap} onOpenBrandMap={hasBrandClusters ? openBrandMap : undefined} /> : null}
    <main className={`taste-graph-page taste-graph-layout ${!isMapOpen ? "taste-graph-layout--standby" : ""}`} aria-hidden={!isMapOpen}>
      <header className="taste-graph-toolbar">
        <button type="button" onClick={closeMap} className="taste-map-back">
          <ArrowLeft className="h-4 w-4" />요약으로
        </button>
        {selectedView === "products" ? renderSourceToggle() : null}
      </header>
      <div className="taste-canvas-pane">
        <div
          className={`taste-product-graph-stack ${selectedView === "products" ? "active" : ""}`}
          aria-hidden={selectedView !== "products"}
        >
          <div className={`taste-product-graph-layer ${source === "digbox" ? "active" : ""}`}>
            <TasteGraphCanvas
              products={digboxProducts}
              graphData={initialGraphs?.digbox}
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
              graphData={initialGraphs?.closet}
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
      </div>

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
