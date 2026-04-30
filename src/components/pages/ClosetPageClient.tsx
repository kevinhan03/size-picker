"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { ProgressiveImage } from "../ProgressiveImage";
import { ProductDetailModal } from "../ProductDetailModal";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import { computeSizeRecommendations } from "../../utils/sizeTable";
import { smoothScrollTo } from "../../utils/scroll";
import type { Product, SizeRecommendation } from "../../types";

const CATEGORIES = ["Outer", "Top", "Bottom", "Shoes", "Acc"] as const;
type ViewMode = "grid" | "list";

function getClosetProductPageUrl(product: Product): string {
  return `${getProductPageUrl(product)}?source=closet`;
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
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
      className={`ui-product-card relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition ${
        isEditing ? "" : "group hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(0,0,0,0.3)]"
      }`}
    >
      <Link
        href={href}
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] text-inherit no-underline"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_32%,transparent_68%,rgba(255,255,255,0.1))]" />
        <div className="relative mx-1.5 mb-0 mt-1.5 h-44 overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(17,24,39,0.72),rgba(0,0,0,0.46))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:m-3 sm:h-48 sm:rounded-[22px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%)]" />
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
        <div className="flex flex-1 flex-col bg-black/10 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</span>
            {product.closetSelectedSizeLabel && (
              <span className="flex-shrink-0 rounded-md border border-orange-500/40 bg-orange-500/12 px-1.5 py-0.5 text-[10px] font-black text-orange-400">
                {product.closetSelectedSizeLabel}
              </span>
            )}
          </div>
          <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
          {product.closetSelectedSizeSnapshot?.headers?.length ? (
            <div className="mt-auto">
              <div
                style={{
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  paddingTop: 8,
                  marginTop: 4,
                }}
              >
                <div style={{ display: "flex", gap: 6, minWidth: "max-content" }}>
                  {product.closetSelectedSizeSnapshot.headers.slice(1).map((header, i) => {
                    const value = product.closetSelectedSizeSnapshot!.row[i + 1];
                    if (!value) return null;
                    return (
                      <div
                        key={header}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                          padding: "4px 7px",
                          minWidth: 40,
                        }}
                      >
                        <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 600, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{header}</span>
                        <span style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 700, marginTop: 2, whiteSpace: "nowrap" }}>{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
          )}
        </div>
      </Link>

      {isEditing && (
        <button
          type="button"
          aria-label="상품 선택"
          onClick={onSelect}
          className="absolute inset-0 z-10 rounded-[28px] bg-transparent"
        />
      )}

      {isEditing && (
        <button
          type="button"
          aria-label="상품 선택"
          onClick={onSelect}
          className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-md border-2 p-0 shadow-none backdrop-blur transition ${
            selected ? "border-orange-500 bg-orange-500" : "border-white/30 bg-black/50 hover:border-orange-500/70 hover:bg-orange-500/10"
          }`}
        >
          {selected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          )}
        </button>
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
        transition: "all 0.15s",
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
          transition: "all 0.15s",
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
                  <div key={header} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 6px", minWidth: 36 }}>
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
          transition: "all 0.15s",
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
  const { closetProducts, removeFromCloset } = useClosetContext();
  const digbox = useDigboxContext();
  const { products } = useProductsContext();

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
  const recommendationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

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

  const recommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeRowIndex === null || !selectedProduct) return [];
    return computeSizeRecommendations(selectedProduct, activeRowIndex, products);
  }, [activeRowIndex, selectedProduct, products]);

  const handleProductOpen = (product: Product) => {
    setSelectedProduct(product);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
  };

  const handleModalClose = () => {
    setSelectedProduct(null);
    setActiveRowIndex(null);
    setIsDetailImageZoomed(false);
  };

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="min-h-screen bg-black" />;
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              My Closet
            </h1>
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto overflow-y-visible py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-6 sm:overflow-visible sm:py-0">
          {([["", "All", closetItems.length]] as [string, string, number][])
            .concat(CATEGORIES.map((cat) => [cat, cat, catCounts[cat] || 0]))
            .map(([value, label, count]) => {
              const isActive = catFilter === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCatFilter(catFilter === value ? "" : value === "" ? "" : value)}
                  className={`flex h-9 min-w-max flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-[11px] font-black transition-all sm:h-10 sm:min-w-0 sm:flex-auto sm:px-2 sm:text-xs ${
                    isActive
                      ? "border-orange-500/55 bg-orange-500/12 text-orange-400 shadow-[0_8px_20px_rgba(249,115,22,0.12)]"
                      : "border-white/10 bg-white/[0.045] text-gray-400 hover:border-white/18 hover:bg-white/[0.07] hover:text-gray-100"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive ? "bg-orange-500/18 text-orange-300" : "bg-white/[0.06] text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Toolbar */}
        <div
          className="closet-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 transition focus-within:border-orange-500/45 focus-within:bg-white/[0.055] sm:h-[34px]">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search closet"
              className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-gray-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] p-0 text-gray-500 shadow-none transition hover:bg-orange-500/[0.14] hover:text-orange-300"
                aria-label="Clear closet search"
              >
                <X className="h-3.5 w-3.5" />
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
                {selectedIds.size} selected
              </div>
            )}
            {/* View toggle */}
            {!isEditing && (
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
                    transition: "all 0.15s",
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
                transition: "all 0.15s",
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
                  transition: "all 0.15s",
                  boxShadow: "none",
                }}
                aria-label="삭제 선택 취소"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        </div>{/* end 860 wrapper */}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div
            style={{
              ...cardStyle,
              padding: "60px 24px",
              textAlign: "center",
              marginTop: 20,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#374151"
              strokeWidth="1.5"
              style={{ margin: "0 auto 16px" }}
            >
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
            </svg>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              옷장이 비어있어요.
              <br />
              아래에서 상품을 추가해보세요.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                marginTop: 16,
                padding: "10px 24px",
                borderRadius: 12,
                background: "#F97316",
                color: "#000",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              상품 둘러보기
            </Link>
          </div>
        )}

        {/* Grid view */}
        {viewMode === "grid" && filtered.length > 0 && (
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
        {viewMode === "list" && filtered.length > 0 && (
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
          recommendations={recommendations}
          onRecommendationClick={handleProductOpen}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={modalRef}
          recommendationsRef={recommendationsRef}
          smoothScrollTo={smoothScrollTo}
          isInCloset
          onToggleDigbox={() => digbox.toggleDigbox(normalizedProduct.id)}
          isInDigbox={digbox.isInDigbox(normalizedProduct.id)}
          hideCollectionActions
        />
      )}

      {isDetailImageZoomed && normalizedProduct && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsDetailImageZoomed(false)}
          onTouchStart={() => setIsDetailImageZoomed(false)}
        >
          <div className="flex h-[63vh] w-full max-w-6xl items-center justify-center">
            <img
              src={normalizedProduct.image}
              alt={normalizedProduct.name}
              className="max-h-full max-w-full cursor-pointer object-contain"
              style={{ borderRadius: "20px" }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

