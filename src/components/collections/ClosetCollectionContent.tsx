"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import {
  prefetchProductDetail,
  useProductDetail,
} from "../../hooks/useProductDetail";
import { useProgressiveList } from "../../hooks/useProgressiveList";
import { ProgressiveImage } from "../ProgressiveImage";
import { DigCategoryFilter } from "../DigCategoryFilter";
import { PageState } from "../PageState";
import { CollectionSearchField } from "../CollectionSearchField";
import { CollectionEmptyState } from "../CollectionEmptyState";
import { toPublicUrl } from "../../utils/product";
import type { Product } from "../../types";
import { loadProductDetailModal } from "../productDetailModalLoader";
import { buildLoginHref } from "../../utils/authNavigation";
import { getCategoryLabel } from "../../constants";

const ProductDetailModal = dynamic(loadProductDetailModal, { ssr: false });
const ImageViewerOverlay = dynamic(
  () =>
    import("../ImageViewerOverlay").then((module) => module.ImageViewerOverlay),
  { ssr: false }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing collection constants.
const CATEGORIES = ["Outer", "Top", "Bottom", "Shoes", "Acc"] as const;
type ViewMode = "grid" | "list";

function getClosetProductPageUrl(product: Product): string {
  return `?product=${encodeURIComponent(product.id)}`;
}

const cardStyle: React.CSSProperties = {
  background: "#111114",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1.25rem",
  overflow: "hidden",
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 40px rgba(0,0,0,0.55)",
};

function GridCard({
  product,
  selected,
  isEditing,
  onSelect,
  onOpen,
  onPrefetch,
  href,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onPrefetch: () => void;
  href: string;
}) {
  const { t } = useLocaleContext();
  const source = product.image || product.thumbnailImage || "";
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [failedDirectUrl, setFailedDirectUrl] = useState<string | null>(null);
  const useOriginal = failedSource === source;
  const directUrl = product.cardThumbnailImage;
  const useDirect = Boolean(directUrl && failedDirectUrl !== directUrl);
  const imageSrc =
    useOriginal || !directUrl
      ? source
      : useDirect
        ? directUrl
        : `/api/products/${encodeURIComponent(product.id)}/card-image`;

  return (
    <div
      data-editing={isEditing}
      data-selected={isEditing && selected}
      className="digbox-product-card ui-card ui-product-card relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-[transform,border-color,box-shadow,background-color] duration-150 [transition-timing-function:var(--ease-out)]"
    >
      <Link
        href={href}
        onMouseEnter={() => {
          void loadProductDetailModal();
          onPrefetch();
        }}
        onFocus={() => {
          void loadProductDetailModal();
          onPrefetch();
        }}
        onTouchStart={() => {
          void loadProductDetailModal();
          onPrefetch();
        }}
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        className="digbox-product-card-link relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[22px] text-inherit no-underline transition-transform duration-150 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
          {imageSrc ? (
            <ProgressiveImage
              key={imageSrc}
              src={imageSrc}
              thumbnailSrc={product.thumbnailImage}
              alt={product.name}
              className="object-contain"
              loading="lazy"
              onError={() => {
                if (!useOriginal && useDirect) setFailedDirectUrl(directUrl!);
                else if (!useOriginal) setFailedSource(source);
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-gray-500">
              {product.brand}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col bg-black/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <div className="mb-1 flex min-w-0 items-center gap-2">
            <div className="truncate text-xs font-bold tracking-wide text-orange-500">
              {product.brand}
            </div>
            {product.isInstagram ? (
              <span className="flex-shrink-0 rounded-md border border-orange-500/35 bg-orange-500/[0.12] px-1.5 py-0.5 text-[9px] font-black leading-none text-orange-300">
                PICK
              </span>
            ) : null}
            {product.closetSelectedSizeLabel ? (
              <span className="flex-shrink-0 rounded-md border border-orange-500/35 bg-orange-500/[0.12] px-1.5 py-0.5 text-[9px] font-black leading-none text-orange-300">
                {product.closetSelectedSizeLabel}
              </span>
            ) : null}
          </div>
          <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">
            {product.name}
          </h3>
          <div className="mt-auto pt-2 text-center text-sm text-gray-300">
            {product.subCategory || getCategoryLabel(product.category)}
          </div>
        </div>
      </Link>

      {isEditing && (
        <button
          type="button"
          aria-label={t("common.selectProduct")}
          onClick={onSelect}
          className="absolute inset-0 z-10 rounded-[22px] bg-transparent"
        />
      )}
    </div>
  );
}

function ListRow({
  product,
  selected,
  isEditing,
  onSelect,
  onDelete,
  onOpen,
  onPrefetch,
  href,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onPrefetch: () => void;
  href: string;
}) {
  const { t } = useLocaleContext();
  const [hover, setHover] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const showInlineDelete = false;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onFocus={() => onPrefetch()}
      onTouchStart={() => onPrefetch()}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardStyle,
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        transition:
          "transform var(--duration-press) var(--ease-out), border-color var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out)",
        transform: hover && !isEditing ? "translateX(4px)" : "none",
        borderColor:
          hover && !isEditing
            ? "rgba(255,255,255,0.15)"
            : "rgba(255,255,255,0.09)",
      }}
    >
      {/* Checkbox */}
      {isEditing && (
        <button
          type="button"
          aria-label={t("common.selectProduct")}
          onClick={onSelect}
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `2px solid ${selected ? "#F97316" : "rgba(255,255,255,0.2)"}`,
            background: selected ? "#F97316" : "transparent",
            boxShadow: "none",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition:
              "transform var(--duration-press) var(--ease-out), border-color var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out)",
            position: "relative",
            zIndex: 20,
          }}
        >
          {selected && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000"
              strokeWidth="3"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
          )}
        </button>
      )}
      {/* Thumb */}
      <Link
        href={href}
        onMouseEnter={() => onPrefetch()}
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        style={{ textDecoration: "none", flexShrink: 0 }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            background: "rgba(17,24,39,0.8)",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {imgOk && (
            // eslint-disable-next-line @next/next/no-img-element -- Preserve the existing native list-thumbnail behavior.
            <img
              src={product.thumbnailImage || product.image}
              alt={product.name}
              onError={() => setImgOk(false)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      </Link>
      {/* Info */}
      <Link
        href={href}
        onMouseEnter={() => onPrefetch()}
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        style={{
          flex: 1,
          cursor: "pointer",
          minWidth: 0,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#F97316",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            {product.brand}
          </p>
          {product.closetSelectedSizeLabel && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 9,
                fontWeight: 800,
                color: "#fb923c",
                background: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.3)",
                borderRadius: 5,
                padding: "1px 5px",
              }}
            >
              {product.closetSelectedSizeLabel}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#e5e7eb",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            margin: 0,
          }}
        >
          {product.name}
        </p>
        {product.closetSelectedSizeSnapshot?.headers?.length ? (
          <div
            style={{ overflowX: "auto", scrollbarWidth: "none", marginTop: 6 }}
          >
            <div style={{ display: "flex", gap: 4, minWidth: "max-content" }}>
              {product.closetSelectedSizeSnapshot.headers
                .slice(1)
                .map((header, i) => {
                  const value = product.closetSelectedSizeSnapshot!.row[i + 1];
                  if (!value) return null;
                  return (
                    <div
                      key={`${header}-${i}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 6,
                        padding: "3px 6px",
                        minWidth: 36,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          color: "#6b7280",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {header}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#e5e7eb",
                          fontWeight: 700,
                          marginTop: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : null}
      </Link>
      {!product.closetSelectedSizeSnapshot?.headers?.length && (
        <span
          style={{
            fontSize: 10,
            color: "#6b7280",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4,
            padding: "3px 8px",
            flexShrink: 0,
          }}
        >
          {product.subCategory || getCategoryLabel(product.category)}
        </span>
      )}
      {/* Delete */}
      {showInlineDelete && (
        <button
          onClick={onDelete}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 8,
            background: hover
              ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${hover ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition:
              "transform var(--duration-press) var(--ease-out), border-color var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out)",
            color: hover ? "#f87171" : "#4b5563",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3,6 5,6 21,6" />
            <path d="m19,6-.867,14.142A2,2 0 0,1 16.138,22H7.862a2,2 0 0,1-1.995-1.858L5,6m5,5v6m4-6v6" />
            <path d="M9,6V4h6v2" />
          </svg>
        </button>
      )}
      {isEditing && (
        <button
          type="button"
          aria-label="상품 선택"
          onClick={onSelect}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        />
      )}
    </div>
  );
}

export function ClosetCollectionContent({
  initialProducts,
  active = true,
}: {
  initialProducts?: Product[];
  active?: boolean;
}) {
  const { t } = useLocaleContext();
  const router = useRouter();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const closet = useClosetContext();
  const {
    closetProducts,
    addToCloset,
    removeFromCloset,
    ensureLoaded: ensureClosetLoaded,
    reload: reloadCloset,
  } = closet;
  const hydrateCloset = closet.hydrate;
  const isClosetLoaded = closet.isLoaded;
  const digbox = useDigboxContext();
  const ensureDigboxLoaded = digbox.ensureLoaded;
  const productModal = useProductModalQuery();

  const [catFilter, setCatFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Retained for the currently disabled list toolbar.
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUndoingRemoval, setIsUndoingRemoval] = useState(false);
  const [removalUndoProducts, setRemovalUndoProducts] = useState<
    Product[] | null
  >(null);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const removalUndoTimerRef = useRef<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const detailedProduct = useProductDetail(
    productModal.productId,
    selectedProduct
  );
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.isAuthLoading && !authUserId) {
      router.replace(buildLoginHref("login", "/closet", "closet"));
    }
  }, [auth.isAuthLoading, authUserId, router]);

  useEffect(() => {
    if (authUserId && initialProducts !== undefined && !isClosetLoaded) {
      hydrateCloset(initialProducts);
    }
  }, [authUserId, hydrateCloset, initialProducts, isClosetLoaded]);

  useEffect(() => {
    if (authUserId && initialProducts === undefined) {
      ensureClosetLoaded();
    }
  }, [authUserId, ensureClosetLoaded, initialProducts]);

  useEffect(() => {
    if (authUserId && productModal.productId) ensureDigboxLoaded();
  }, [authUserId, ensureDigboxLoaded, productModal.productId]);

  useEffect(
    () => () => {
      if (removalUndoTimerRef.current)
        window.clearTimeout(removalUndoTimerRef.current);
    },
    []
  );

  const closetItems = useMemo(
    () =>
      isClosetLoaded ? closetProducts : (initialProducts ?? closetProducts),
    [closetProducts, initialProducts, isClosetLoaded]
  );

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return closetItems.filter((p) => {
      if (catFilter && p.category !== catFilter) return false;
      if (subCategoryFilter && p.subCategory !== subCategoryFilter)
        return false;
      if (!keyword) return true;
      return `${p.brand} ${p.name}`.toLowerCase().includes(keyword);
    });
  }, [closetItems, catFilter, searchQuery, subCategoryFilter]);
  const { visibleCount, sentinelRef } = useProgressiveList(
    filtered.length,
    `${catFilter}:${subCategoryFilter}:${searchQuery}`
  );
  const visibleProducts = filtered.slice(0, visibleCount);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing derived collection state.
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    closetItems.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [closetItems]);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!detailedProduct) return null;
    const imagePath = String(detailedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : detailedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : detailedProduct.thumbnailImage;
    return { ...detailedProduct, image, thumbnailImage };
  }, [detailedProduct]);

  const closetProduct = useMemo(() => {
    if (!normalizedProduct) return null;
    return (
      closetProducts.find((item) => item.id === normalizedProduct.id) ||
      normalizedProduct
    );
  }, [closetProducts, normalizedProduct]);

  useEffect(() => {
    if (!productModal.productId) {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
      return;
    }

    const product = closetProducts.find(
      (item) => item.id === productModal.productId
    );
    if (product) setSelectedProduct(product);
  }, [closetProducts, productModal.productId]);

  const handleProductOpen = (product: Product, replace = false) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
    productModal.openProduct(product.id, replace);
  };

  const handleModalClose = () => {
    productModal.closeProduct();
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
  };

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  if (auth.isAuthLoading || !auth.authUser) {
    return (
      <p role="status" className="py-8 text-gray-400">
        {t("mypage.preparing")}
      </p>
    );
  }

  if (closet.isLoading && closetItems.length === 0) {
    return (
      <p role="status" className="py-8 text-gray-400">
        {t("mypage.preparing")}
      </p>
    );
  }

  if (closet.error && closetItems.length === 0) {
    return (
      <section className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]">
        <PageState
          kind="error"
          title={t("closet.loadError")}
          description={t("closet.loadErrorDescription")}
          action={
            <button
              type="button"
              onClick={() => void closet.reload()}
              className="ui-button ui-button-primary px-5 py-2.5"
            >
              {t("common.retry")}
            </button>
          }
        />
      </section>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectedIds(new Set());
    setRemovalError(null);
    setIsEditing(false);
  };

  const removeSelected = async () => {
    const ids = [...selectedIds];
    if (!ids.length || isRemoving) return;

    setIsRemoving(true);
    setRemovalError(null);
    const results = await Promise.allSettled(
      ids.map((id) => removeFromCloset(id))
    );
    const succeededIds = new Set(
      ids.filter((_, index) => results[index]?.status === "fulfilled")
    );
    const failedIds = ids.filter((id) => !succeededIds.has(id));
    const removedProducts = closetItems.filter((product) =>
      succeededIds.has(product.id)
    );

    if (removedProducts.length) {
      if (removalUndoTimerRef.current)
        window.clearTimeout(removalUndoTimerRef.current);
      setRemovalUndoProducts(removedProducts);
      removalUndoTimerRef.current = window.setTimeout(
        () => setRemovalUndoProducts(null),
        5000
      );
    }

    setSelectedIds(new Set(failedIds));
    setIsEditing(failedIds.length > 0);
    if (failedIds.length) setRemovalError(t("closet.removeFailed"));
    setIsRemoving(false);
  };

  const undoRemoval = async () => {
    if (!removalUndoProducts?.length || isUndoingRemoval) return;

    setIsUndoingRemoval(true);
    setRemovalError(null);
    const results = await Promise.allSettled(
      removalUndoProducts.map((product) =>
        addToCloset(product.id, {
          label: product.closetSelectedSizeLabel ?? null,
          rowIndex: product.closetSelectedSizeRowIndex ?? null,
          snapshot: product.closetSelectedSizeSnapshot ?? null,
        })
      )
    );
    if (results.some((result) => result.status === "fulfilled"))
      await reloadCloset();
    const failedCount = results.filter(
      (result) => result.status === "rejected"
    ).length;
    if (failedCount) {
      setRemovalError(t("closet.restoreFailed"));
    } else {
      if (removalUndoTimerRef.current)
        window.clearTimeout(removalUndoTimerRef.current);
      setRemovalUndoProducts(null);
    }
    setIsUndoingRemoval(false);
  };

  return (
    <section
      className="closet-collection-content"
      style={{
        minHeight: 0,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1280 }}>
        <div className="mx-auto w-full max-w-[70rem]">
          <div className="mt-3">
            <CollectionSearchField
              value={searchQuery}
              onChange={setSearchQuery}
              disabled={isEditing}
              ariaLabel={t("closet.search")}
              spacing="compact"
            />
          </div>
          <DigCategoryFilter
            category={catFilter}
            onCategoryChange={(value) => {
              setCatFilter(value);
              setSubCategoryFilter("");
            }}
            subCategory={subCategoryFilter}
            onSubCategoryChange={setSubCategoryFilter}
            disabled={isEditing}
            spacing="compact"
          />
        </div>

        {/* Toolbar */}
        <div
          className="hidden"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.045] px-3.5 transition-[background-color,border-color,box-shadow] duration-150 focus-within:border-orange-400/60 focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-orange-500/10 sm:h-10">
            <Search className="h-4 w-4 flex-shrink-0 text-white/45" />
            <input
              type="text"
              value={searchQuery}
              disabled={isEditing}
              autoComplete="off"
              enterKeyHint="search"
              aria-label="옷장 상품 검색"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="브랜드 또는 상품명 검색"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:text-white/45"
            />
            {searchQuery && !isEditing && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="검색어 지우기"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Right controls */}
          <div
            className="closet-toolbar-actions"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {isEditing && (
              <div
                className="closet-selected-count"
                style={{
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 12px",
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.05)",
                  color: selectedIds.size > 0 ? "#F97316" : "#8b949e",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {selectedIds.size
                  ? `${selectedIds.size}개 선택됨`
                  : "옷장에서 삭제할 상품을 선택하세요."}
              </div>
            )}
            {/* View toggle */}
            {false && !isEditing && (
              <div
                className="closet-view-control"
                style={{
                  display: "flex",
                  height: 34,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 11,
                  border: "1px solid rgba(255,255,255,0.1)",
                  overflow: "hidden",
                }}
              >
                {(
                  [
                    {
                      id: "grid" as ViewMode,
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      ),
                    },
                    {
                      id: "list" as ViewMode,
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="8" y1="6" x2="21" y2="6" />
                          <line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3.01" y2="6" />
                          <line x1="3" y1="12" x2="3.01" y2="12" />
                          <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                      ),
                    },
                  ] as { id: ViewMode; icon: React.ReactNode }[]
                ).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    style={{
                      width: 36,
                      height: "100%",
                      padding: 0,
                      border: "none",
                      cursor: "pointer",
                      background:
                        viewMode === v.id
                          ? "rgba(249,115,22,0.18)"
                          : "transparent",
                      color: viewMode === v.id ? "#F97316" : "#6b7280",
                      transition:
                        "transform var(--duration-press) var(--ease-out), border-color var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 0,
                      }}
                    >
                      {v.icon}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (isEditing && selectedIds.size > 0) {
                  setConfirmBatchDelete(true);
                  return;
                }
                setIsEditing((prev) => {
                  if (prev) setSelectedIds(new Set());
                  return !prev;
                });
              }}
              style={{
                height: 34,
                width: 36,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                borderRadius: 11,
                background: isEditing
                  ? "rgba(249,115,22,0.18)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: isEditing ? "#F97316" : "#6b7280",
                cursor: "pointer",
                transition:
                  "transform var(--duration-press) var(--ease-out), border-color var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out)",
                boxShadow: "none",
              }}
              aria-label={isEditing ? "삭제 선택 완료" : "삭제할 상품 선택"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setSelectedIds(new Set());
                  setIsEditing(false);
                }}
                style={{
                  height: 34,
                  width: 36,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  transition:
                    "transform var(--duration-press) var(--ease-out), border-color var(--duration-press) var(--ease-out), background-color var(--duration-press) var(--ease-out), color var(--duration-press) var(--ease-out)",
                  boxShadow: "none",
                }}
                aria-label="삭제 선택 취소"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* legacy toolbar removed */}

        {/* Empty state */}
        {filtered.length === 0 && (
          <CollectionEmptyState
            collection="closet"
            query={searchQuery}
            category={catFilter}
            onClearSearch={() => setSearchQuery("")}
            onClearCategory={() => {
              setCatFilter("");
              setSubCategoryFilter("");
            }}
            onClearAll={() => {
              setSearchQuery("");
              setCatFilter("");
              setSubCategoryFilter("");
            }}
          />
        )}

        {removalError && (
          <p role="alert" className="mb-4 text-xs font-semibold text-red-300">
            {removalError}
          </p>
        )}
        {removalUndoProducts?.length ? (
          <div
            role="status"
            className="mx-auto mb-3 flex w-full max-w-[70rem] items-center justify-between gap-3 rounded-xl border border-white/[0.1] bg-white/[0.045] px-3.5 py-2.5 text-sm"
          >
            <p className="min-w-0 font-semibold text-white">
              {t("closet.removed", { count: removalUndoProducts.length })}
            </p>
            <button
              type="button"
              disabled={isUndoingRemoval}
              onClick={() => void undoRemoval()}
              className="shrink-0 font-bold text-orange-300 transition-[color,transform] duration-150 active:scale-[0.97] hover:text-orange-200 disabled:cursor-wait disabled:text-orange-300/50"
            >
              {isUndoingRemoval ? t("common.undoing") : t("common.undo")}
            </button>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p
              aria-live="polite"
              className={`min-w-0 text-sm font-bold ${isEditing ? "text-orange-300" : "text-white/75"}`}
            >
              {isEditing
                ? selectedIds.size
                  ? t("closet.selected", { count: selectedIds.size })
                  : t("closet.selectToDelete")
                : searchQuery.trim()
                  ? t("closet.searchResults", { count: filtered.length })
                  : t("closet.productCount", { count: filtered.length })}
            </p>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setRemovalError(null);
                  setIsEditing(true);
                }}
                className="h-11 rounded-lg px-2.5 text-sm font-semibold text-white/65 transition-[background-color,color,transform] duration-150 active:scale-[0.97] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"
              >
                {t("closet.delete")}
              </button>
            ) : (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={exitSelectionMode}
                  className="h-11 rounded-lg px-2.5 text-sm font-semibold text-white/65 transition-[background-color,color,transform] duration-150 active:scale-[0.97] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0 || isRemoving}
                  onClick={() => void removeSelected()}
                  className="h-11 rounded-lg bg-red-500 px-3 text-sm font-bold text-white transition-[background-color,transform,opacity] duration-150 active:scale-[0.97] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  {isRemoving ? t("closet.deleting") : t("common.delete")}
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Grid view */}
        {filtered.length > 0 && (
          <div className="closet-product-grid" style={{ display: "grid" }}>
            {visibleProducts.map((p) => (
              <GridCard
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                onSelect={() => toggleSelect(p.id)}
                onOpen={() => handleProductOpen(p)}
                onPrefetch={() => prefetchProductDetail(p.id)}
                href={getClosetProductPageUrl(p)}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {false && viewMode === "list" && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleProducts.map((p) => (
              <ListRow
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                onSelect={() => toggleSelect(p.id)}
                onDelete={() => setConfirmDeleteId(p.id)}
                onOpen={() => handleProductOpen(p)}
                onPrefetch={() => prefetchProductDetail(p.id)}
                href={getClosetProductPageUrl(p)}
              />
            ))}
          </div>
        )}
        {visibleCount < filtered.length ? (
          <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
        ) : null}
      </div>

      {active && normalizedProduct && (
        <ProductDetailModal
          product={normalizedProduct}
          closetProduct={closetProduct}
          activeRowIndex={activeRowIndex}
          onClose={handleModalClose}
          onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
          onRecommendationClick={(product) => handleProductOpen(product, true)}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={modalRef}
          isInCloset
          onToggleDigbox={() => digbox.toggleDigbox(normalizedProduct.id)}
          isInDigbox={digbox.isInDigbox(normalizedProduct.id)}
          hideCollectionActions
        />
      )}

      {active && normalizedProduct && (
        <ImageViewerOverlay
          open={isDetailImageZoomed}
          src={normalizedProduct.image}
          alt={normalizedProduct.name}
          onClose={() => setIsDetailImageZoomed(false)}
        />
      )}
    </section>
  );
}
