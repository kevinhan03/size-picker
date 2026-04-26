"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { ProgressiveImage } from "../ProgressiveImage";
import { getProductPageUrl } from "../../utils/product";
import type { Product } from "../../types";

const CATEGORIES = ["Outer", "Top", "Bottom", "Shoes", "Acc"] as const;
type SortBy = "recent" | "brand" | "category";
type ViewMode = "grid" | "list";
const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "brand", label: "Brand" },
  { id: "category", label: "Category" },
];

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
  href,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDelete: () => void;
  href: string;
}) {
  const [imgOk, setImgOk] = useState(true);
  const imageSrc = product.image || product.thumbnailImage || "";
  const showInlineDelete = false;

  return (
    <div className="ui-product-card group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(0,0,0,0.3)]">
      <Link
        href={href}
        className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] text-inherit no-underline ${
          isEditing && selected ? "ring-2 ring-orange-500/70" : ""
        }`}
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
          <div className="mb-1 truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</div>
          <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
          <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
        </div>
      </Link>

      {isEditing && (
        <button
          type="button"
          aria-label="?곹뭹 ?좏깮"
          onClick={onSelect}
          className={`absolute inset-0 z-10 rounded-[28px] transition ${
            selected ? "bg-orange-500/8" : "bg-transparent"
          }`}
        />
      )}

      {isEditing && (
        <div
          className={`absolute left-3 top-3 z-20 flex h-6 w-6 items-center justify-center rounded-md border-2 backdrop-blur transition ${
            selected ? "border-orange-500 bg-orange-500" : "border-white/30 bg-black/50 hover:border-orange-500/70"
          }`}
        >
          {selected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          )}
        </div>
      )}

      {showInlineDelete && (
      <button
        type="button"
        aria-label="?룹옣?먯꽌 ??젣"
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
  href,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDelete: () => void;
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
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        transition: "all 0.15s",
        transform: hover ? "translateX(4px)" : "none",
        borderColor: isEditing && selected
          ? "rgba(249,115,22,0.6)"
          : hover
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.09)",
      }}
    >
      {/* Checkbox */}
      {isEditing && (
      <div
        onClick={onSelect}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${selected ? "#F97316" : "rgba(255,255,255,0.2)"}`,
          background: selected ? "#F97316" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </div>
      )}
      {/* Thumb */}
      <Link href={href} style={{ textDecoration: "none", flexShrink: 0 }}>
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
      <Link href={href} style={{ flex: 1, cursor: "pointer", minWidth: 0, textDecoration: "none" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#F97316",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 2,
          }}
        >
          {product.brand}
        </p>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#e5e7eb",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {product.name}
        </p>
      </Link>
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
        {product.category}
      </span>
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
          ?룹옣?먯꽌 ??젣?좉퉴??
        </h3>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          ???꾩씠?쒖쓣 ???룹옣?먯꽌 ??젣?⑸땲??
          <br />
          ?섏쨷???ㅼ떆 異붽??????덉뒿?덈떎.
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
            痍⑥냼
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
            ??젣
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

  const [catFilter, setCatFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

  const closetItems = useMemo(() => closetProducts, [closetProducts]);

  const filtered = useMemo(() => {
    let list = closetItems.filter((p) => !catFilter || p.category === catFilter);
    if (sortBy === "brand") list = [...list].sort((a, b) => a.brand.localeCompare(b.brand));
    if (sortBy === "category") list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    return list;
  }, [closetItems, catFilter, sortBy]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    closetItems.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [closetItems]);

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
      <div style={{ width: "100%", maxWidth: 860 }}>
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

        {/* Stats row */}
        <div
          className="closet-stats-grid"
          style={{
            display: "grid",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            onClick={() => setCatFilter("")}
            style={{
              ...cardStyle,
              padding: "12px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
              borderColor: catFilter === "" ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.09)",
            }}
          >
            <p
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: catFilter === "" ? "#F97316" : "#fff",
                marginBottom: 2,
              }}
            >
              {closetItems.length}
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Total</p>
          </div>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? "" : cat)}
              style={{
                ...cardStyle,
                padding: "12px 14px",
                cursor: "pointer",
                transition: "all 0.15s",
                borderColor:
                  catFilter === cat
                    ? "rgba(249,115,22,0.5)"
                    : "rgba(255,255,255,0.09)",
              }}
            >
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: catFilter === cat ? "#F97316" : "#fff",
                  marginBottom: 2,
                }}
              >
                {catCounts[cat] || 0}
              </p>
              <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{cat}</p>
            </div>
          ))}
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
          <div
            className="closet-sort-control"
            style={{
              display: "flex",
              height: 34,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            {SORT_OPTIONS.map((option) => {
              const active = sortBy === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortBy(option.id)}
                  style={{
                    padding: "0 11px",
                    border: "none",
                    borderRight: option.id === "category" ? "none" : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "rgba(249,115,22,0.18)" : "transparent",
                    color: active ? "#F97316" : "#8b949e",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
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
              aria-label={isEditing ? "??젣 ?좏깮 ?꾨즺" : "??젣???곹뭹 ?좏깮"}
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
                aria-label="??젣 ?좏깮 痍⑥냼"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

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
              ?룹옣??鍮꾩뼱?덉뼱??
              <br />
              ?덉뿉???곹뭹??異붽??대낫?몄슂.
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
              ?곹뭹 ?먯깋?섍린
            </Link>
          </div>
        )}

        {/* Grid view */}
        {viewMode === "grid" && filtered.length > 0 && (
          <div
            className="closet-product-grid"
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            {filtered.map((p) => (
              <GridCard
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                onSelect={() => toggleSelect(p.id)}
                onDelete={() => setConfirmDeleteId(p.id)}
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
    </main>
  );
}

