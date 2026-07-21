"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { ProgressiveImage } from "../ProgressiveImage";
import { ProductDetailModal } from "../ProductDetailModal";
import { FilterBar } from "../FilterBar";
import { PageState } from "../PageState";
import { ImageViewerOverlay } from "../ImageViewerOverlay";
import { CollectionSearchField } from "../CollectionSearchField";
import { CollectionEmptyState } from "../CollectionEmptyState";
import { toPublicUrl } from "../../utils/product";
import type { Product } from "../../types";

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
  onDelete,
  onOpen,
  href,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onOpen: () => void;
  href: string;
}) {
  const [imgOk, setImgOk] = useState(true);
  const imageSrc = product.image || product.thumbnailImage || "";
  const showInlineDelete = false;

  return (
    <div
      data-editing={isEditing}
      data-selected={isEditing && selected}
      className="digbox-product-card ui-card ui-product-card relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-[transform,border-color,box-shadow,background-color] duration-150 [transition-timing-function:var(--ease-out)]"
    >
      <Link
        href={href}
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        className="digbox-product-card-link relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[22px] text-inherit no-underline"
      >
        <div className="relative mx-1.5 mb-0 mt-1.5 h-44 overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,rgba(17,24,39,0.62),rgba(0,0,0,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:m-3 sm:h-48">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.07),transparent_28%)]" />
          <div className="absolute inset-3 z-[1] sm:inset-4">
            {imgOk && imageSrc ? (
              <ProgressiveImage
                src={imageSrc}
                thumbnailSrc={product.thumbnailImage}
                alt={product.name}
                className="rounded-[10px] object-contain"
                onError={() => setImgOk(false)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-gray-700">
                {product.brand}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col bg-black/[0.06] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</span>
            {product.closetSelectedSizeLabel && (
              <span className="flex-shrink-0 rounded-md border border-orange-500/40 bg-orange-500/12 px-1.5 py-0.5 text-[10px] font-black text-orange-400">
                {product.closetSelectedSizeLabel}
              </span>
            )}
          </div>
          <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
          <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
        </div>
      </Link>

      {isEditing && (
        <button
          type="button"
          aria-label="상품 선택"
          onClick={onSelect}
          className="absolute inset-0 z-10 rounded-[22px] bg-transparent"
        />
      )}


      {showInlineDelete && (
      <button
        type="button"
        aria-label="옷장에서 삭제"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-red-500/80 text-white opacity-100 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-red-500 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
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
  href,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onOpen: () => void;
  href: string;
}) {
  const [hover, setHover] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const showInlineDelete = false;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardStyle,
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
        transform: hover && !isEditing ? "translateX(4px)" : "none",
        borderColor: hover && !isEditing
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.09)",
      }}
    >
      {/* Checkbox */}
      {isEditing && (
      <button
        type="button"
        aria-label="상품 선택"
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
          transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
          position: "relative",
          zIndex: 20,
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </button>
      )}
      {/* Thumb */}
      <Link
        href={href}
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
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        style={{ flex: 1, cursor: "pointer", minWidth: 0, textDecoration: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            {product.brand}
          </p>
          {product.closetSelectedSizeLabel && (
            <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, color: "#fb923c", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 5, padding: "1px 5px" }}>
              {product.closetSelectedSizeLabel}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
          {product.name}
        </p>
        {product.closetSelectedSizeSnapshot?.headers?.length ? (
          <div style={{ overflowX: "auto", scrollbarWidth: "none", marginTop: 6 }}>
            <div style={{ display: "flex", gap: 4, minWidth: "max-content" }}>
              {product.closetSelectedSizeSnapshot.headers.slice(1).map((header, i) => {
                const value = product.closetSelectedSizeSnapshot!.row[i + 1];
                if (!value) return null;
                return (
                  <div key={`${header}-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 6px", minWidth: 36 }}>
                    <span style={{ fontSize: 8, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>{header}</span>
                    <span style={{ fontSize: 11, color: "#e5e7eb", fontWeight: 700, marginTop: 1, whiteSpace: "nowrap" }}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Link>
      {!product.closetSelectedSizeSnapshot?.headers?.length && (
        <span style={{ fontSize: 10, color: "#6b7280", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "3px 8px", flexShrink: 0 }}>
          {product.category}
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
          background: hover ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${hover ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
          color: hover ? "#f87171" : "#4b5563",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

function DeleteConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={onCancel}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "relative",
          background: "rgba(17,24,39,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: 28,
          maxWidth: 320,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="m19,6-.867,14.142A2,2 0 0,1 16.138,22H7.862a2,2 0 0,1-1.995-1.858L5,6m5,5v6m4-6v6" />
            <path d="M9,6V4h6v2" />
          </svg>
        </div>
        <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          옷장에서 삭제할까요?
        </h3>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          이 아이템을 내 옷장에서 삭제합니다.
          <br />
          나중에 다시 추가할 수 있습니다.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "#9ca3af",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.85)",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClosetPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const { closetProducts, removeFromCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const digbox = useDigboxContext();
  const ensureDigboxLoaded = digbox.ensureLoaded;
  const productModal = useProductModalQuery();

  const [catFilter, setCatFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.isAuthLoading && !authUserId) {
      router.replace("/login");
    }
  }, [auth.isAuthLoading, authUserId, router]);

  useEffect(() => {
    if (authUserId) {
      ensureClosetLoaded();
      ensureDigboxLoaded();
    }
  }, [authUserId, ensureClosetLoaded, ensureDigboxLoaded]);

  const closetItems = useMemo(() => closetProducts, [closetProducts]);

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return closetItems.filter((p) => {
      if (catFilter && p.category !== catFilter) return false;
      if (!keyword) return true;
      return `${p.brand} ${p.name}`.toLowerCase().includes(keyword);
    });
  }, [closetItems, catFilter, searchQuery]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    closetItems.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [closetItems]);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!selectedProduct) return null;
    const imagePath = String(selectedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : selectedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : selectedProduct.thumbnailImage;
    return { ...selectedProduct, image, thumbnailImage };
  }, [selectedProduct]);

  const closetProduct = useMemo(() => {
    if (!normalizedProduct) return null;
    return closetProducts.find((item) => item.id === normalizedProduct.id) || normalizedProduct;
  }, [closetProducts, normalizedProduct]);

  useEffect(() => {
    if (!productModal.productId) {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
      return;
    }

    const product = closetProducts.find((item) => item.id === productModal.productId);
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
      <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]">
        <PageState kind="loading" title="옷장을 준비하고 있어요" description="계정과 저장한 상품을 확인하는 중입니다." />
      </main>
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

  const removeOne = (id: string) => {
    void removeFromCloset(id);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setConfirmDeleteId(null);
  };

  const removeSelected = () => {
    selectedIds.forEach((id) => void removeFromCloset(id));
    setSelectedIds(new Set());
    setIsEditing(false);
    setConfirmBatchDelete(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        padding: "88px 16px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1280 }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Title */}
        <div className="collection-page-title">
          <div className="collection-page-heading-row">
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              내 옷장
            </h1>
            <span aria-hidden="true" className="h-9 w-9 shrink-0" />
          </div>
        </div>

        <CollectionSearchField value={searchQuery} onChange={setSearchQuery} disabled={isEditing} ariaLabel="옷장 상품 검색" />
        <FilterBar categoryValue={catFilter} onCategoryChange={(value) => setCatFilter(value)} disabled={isEditing} />

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
          <div className="closet-toolbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                {selectedIds.size ? `${selectedIds.size}개 선택됨` : "옷장에서 삭제할 상품을 선택하세요."}
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                      viewMode === v.id ? "rgba(249,115,22,0.18)" : "transparent",
                    color: viewMode === v.id ? "#F97316" : "#6b7280",
                    transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 0,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}>
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
                background: isEditing ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: isEditing ? "#F97316" : "#6b7280",
                cursor: "pointer",
                transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
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
                  transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
                  boxShadow: "none",
                }}
                aria-label="삭제 선택 취소"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        </div>{/* legacy toolbar removed */}

        {/* Empty state */}
        {filtered.length === 0 && (
          <CollectionEmptyState
            collection="closet"
            query={searchQuery}
            category={catFilter}
            onClearSearch={() => setSearchQuery("")}
            onClearCategory={() => setCatFilter("")}
            onClearAll={() => {
              setSearchQuery("");
              setCatFilter("");
            }}
          />
        )}

        {filtered.length > 0 ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p aria-live="polite" className={`text-sm font-bold ${isEditing ? "text-orange-300" : "text-white/75"}`}>
              {isEditing ? (selectedIds.size ? `${selectedIds.size}개 선택됨` : "옷장에서 삭제할 상품을 선택하세요.") : (searchQuery.trim() ? `${filtered.length}개 검색 결과` : `옷장 상품 ${filtered.length}개`)}
            </p>
            {!isEditing ? <button type="button" onClick={() => setIsEditing(true)} className="h-9 rounded-lg px-2.5 text-sm font-semibold text-white/65 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80">옷장에서 삭제</button> : <button type="button" onClick={() => { setSelectedIds(new Set()); setIsEditing(false); }} className="h-9 rounded-lg px-2.5 text-sm font-semibold text-white/65 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80">취소</button>}
          </div>
        ) : null}

        {/* Grid view */}
        {filtered.length > 0 && (
          <div
            className="closet-product-grid"
            style={{ display: "grid" }}
          >
            {filtered.map((p) => (
              <GridCard
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                onSelect={() => toggleSelect(p.id)}
                onDelete={() => setConfirmDeleteId(p.id)}
                onOpen={() => handleProductOpen(p)}
                href={getClosetProductPageUrl(p)}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {false && viewMode === "list" && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((p) => (
              <ListRow
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                onSelect={() => toggleSelect(p.id)}
                onDelete={() => setConfirmDeleteId(p.id)}
                onOpen={() => handleProductOpen(p)}
                href={getClosetProductPageUrl(p)}
              />
            ))}
          </div>
        )}
      </div>

      {isEditing && selectedIds.size > 0 ? (
        <div className="digbox-removal-tray fixed inset-x-4 bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/[0.12] bg-[#17171b]/95 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6">
          <p className="min-w-0 text-sm font-bold text-white"><span className="text-orange-300">{selectedIds.size}개</span> 선택됨</p>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => { setSelectedIds(new Set()); setIsEditing(false); }} className="h-10 rounded-xl px-3 text-sm font-bold text-gray-300 transition hover:bg-white/[0.06] hover:text-white">취소</button>
            <button type="button" onClick={() => setConfirmBatchDelete(true)} className="h-10 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-400">선택한 상품을 옷장에서 삭제</button>
          </div>
        </div>
      ) : null}

      {/* Delete single confirm */}
      {confirmDeleteId && (
        <DeleteConfirmDialog
          onConfirm={() => removeOne(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Batch delete confirm */}
      {confirmBatchDelete && (
        <DeleteConfirmDialog
          onConfirm={removeSelected}
          onCancel={() => setConfirmBatchDelete(false)}
        />
      )}

      {normalizedProduct && (
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

      {normalizedProduct && <ImageViewerOverlay open={isDetailImageZoomed} src={normalizedProduct.image} alt={normalizedProduct.name} onClose={() => setIsDetailImageZoomed(false)} />}
    </main>
  );
}
