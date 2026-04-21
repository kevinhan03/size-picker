"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { getProductPageUrl } from "../../utils/product";
import type { Product } from "../../types";

const CATEGORIES = ["Outer", "Top", "Bottom", "Shoes", "Acc"] as const;
type SortBy = "recent" | "brand" | "category";
type ViewMode = "grid" | "list";

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
  onSelect,
  onDelete,
  href,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  href: string;
}) {
  const [hover, setHover] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardStyle,
        position: "relative",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hover ? "translateY(-3px)" : "none",
        borderColor: selected
          ? "rgba(249,115,22,0.6)"
          : hover
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.09)",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${selected ? "#F97316" : "rgba(255,255,255,0.3)"}`,
          background: selected ? "#F97316" : "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
          backdropFilter: "blur(4px)",
          cursor: "pointer",
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </div>
      {/* Delete button */}
      {hover && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "rgba(239,68,68,0.8)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      {/* Image */}
      <Link href={href} style={{ textDecoration: "none" }}>
        <div
          style={{
            aspectRatio: "3/4",
            background: "linear-gradient(180deg,rgba(17,24,39,0.8),rgba(0,0,0,0.5))",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {imgOk ? (
            <img
              src={product.thumbnailImage || product.image}
              alt={product.name}
              onError={() => setImgOk(false)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s",
                transform: hover ? "scale(1.04)" : "scale(1)",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#374151",
                fontSize: 11,
              }}
            >
              {product.brand}
            </div>
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top,rgba(0,0,0,0.5),transparent 50%)",
            }}
          />
          <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(251,146,60,0.9)",
                display: "block",
                marginBottom: 2,
              }}
            >
              {product.brand}
            </span>
          </div>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#e5e7eb",
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            {product.name}
          </p>
          <span
            style={{
              fontSize: 10,
              color: "#6b7280",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            {product.category}
          </span>
        </div>
      </Link>
    </div>
  );
}

function ListRow({
  product,
  selected,
  onSelect,
  onDelete,
  href,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  href: string;
}) {
  const [hover, setHover] = useState(false);
  const [imgOk, setImgOk] = useState(true);

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
        borderColor: selected
          ? "rgba(249,115,22,0.6)"
          : hover
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.09)",
      }}
    >
      {/* Checkbox */}
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
              border: "1px solid rgba(255,255,255,0.1)",
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
  const { products } = useProductsContext();

  const [catFilter, setCatFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

  const closetItems = useMemo(
    () => products.filter((p) => !removedIds.has(p.id)),
    [products, removedIds]
  );

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
    setRemovedIds((prev) => new Set([...prev, id]));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setConfirmDeleteId(null);
  };

  const removeSelected = () => {
    setRemovedIds((prev) => new Set([...prev, ...selectedIds]));
    setSelectedIds(new Set());
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
        {/* Back + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <Link
            href="/mypage"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10,
              padding: "7px 14px",
              color: "#9ca3af",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7-7 7 7 7" />
            </svg>
            마이페이지
          </Link>
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
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
              {closetItems.length}개의 아이템
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[{ label: "전체", val: "" }, ...CATEGORIES.map((c) => ({ label: c, val: c }))].map(
              ({ label, val }) => {
                const active = catFilter === val;
                return (
                  <button
                    key={label}
                    onClick={() => setCatFilter(val)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 16,
                      border: "1px solid",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: active ? "#F97316" : "rgba(255,255,255,0.05)",
                      color: active ? "#000" : "#d1d5db",
                      borderColor: active ? "#F97316" : "rgba(255,255,255,0.15)",
                      boxShadow: active ? "0 0 10px rgba(249,115,22,0.4)" : undefined,
                    }}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>
          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmBatchDelete(true)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {selectedIds.size}개 삭제
              </button>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#d1d5db",
                fontSize: 12,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="recent">최근 추가순</option>
              <option value="brand">브랜드순</option>
              <option value="category">카테고리순</option>
            </select>
            {/* View toggle */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
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
                    padding: "7px 10px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      viewMode === v.id ? "rgba(249,115,22,0.2)" : "transparent",
                    color: viewMode === v.id ? "#F97316" : "#6b7280",
                    transition: "all 0.15s",
                  }}
                >
                  {v.icon}
                </button>
              ))}
            </div>
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
              옷장이 비어있어요.
              <br />
              홈에서 상품을 추가해보세요.
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
              상품 탐색하기
            </Link>
          </div>
        )}

        {/* Grid view */}
        {viewMode === "grid" && filtered.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              gap: 14,
            }}
          >
            {filtered.map((p) => (
              <GridCard
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                onSelect={() => toggleSelect(p.id)}
                onDelete={() => setConfirmDeleteId(p.id)}
                href={getProductPageUrl(p)}
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
                onSelect={() => toggleSelect(p.id)}
                onDelete={() => setConfirmDeleteId(p.id)}
                href={getProductPageUrl(p)}
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
