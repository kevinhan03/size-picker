"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { Search, Trash2, X } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductsContext } from "../../contexts/ProductsContext";
import { supabase } from "../../lib/supabase";
import { ProgressiveImage } from "../ProgressiveImage";
import { ProductDetailModal } from "../ProductDetailModal";
import { getProductPageUrl, toPublicUrl } from "../../utils/product";
import { computeSizeRecommendations } from "../../utils/sizeTable";
import { smoothScrollTo } from "../../utils/scroll";
import type { Product, SizeRecommendation } from "../../types";

const CATEGORIES = ["Outer", "Top", "Bottom", "Shoes", "Acc"] as const;
type ViewMode = "grid" | "list";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1.25rem",
  overflow: "hidden",
  boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 40px rgba(0,0,0,0.55)",
};

function getDigboxProductPageUrl(product: Product): string {
  return `${getProductPageUrl(product)}?source=digbox`;
}

function GridCard({
  product,
  selected,
  isEditing,
  otherDigboxCount,
  otherDigboxCountLabel,
  onSelect,
  onOpen,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  otherDigboxCount?: number;
  otherDigboxCountLabel?: string;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const imageSrc = product.image || product.thumbnailImage || "";

  return (
    <div
      className={`ui-product-card relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition ${
        isEditing ? "" : "group hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(0,0,0,0.3)]"
      }`}
    >
      <Link
        href={getDigboxProductPageUrl(product)}
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
          <div className="mb-1 truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</div>
          <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
          {otherDigboxCount ? (
            <div className="mb-2">
              <span className="inline-flex rounded-md bg-white/[0.05] px-2 py-1 text-[11px] font-semibold text-gray-400">
                {otherDigboxCountLabel || `${otherDigboxCount}명이 담았어요`}
              </span>
            </div>
          ) : null}
          <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
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
          aria-label="?곹뭹 ?좏깮"
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
    </div>
  );
}

function ListRow({
  product,
  selected,
  isEditing,
  otherDigboxCount,
  otherDigboxCountLabel,
  onSelect,
  onOpen,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  otherDigboxCount?: number;
  otherDigboxCountLabel?: string;
  onSelect: () => void;
  onOpen: () => void;
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
      {isEditing && (
        <button
          type="button"
          aria-label="?곹뭹 ?좏깮"
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
      <Link
        href={getDigboxProductPageUrl(product)}
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        style={{ textDecoration: "none", flexShrink: 0 }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(17,24,39,0.8)", overflow: "hidden", cursor: "pointer" }}>
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
      <Link
        href={getDigboxProductPageUrl(product)}
        onClick={(event) => {
          if (isEditing) return;
          event.preventDefault();
          onOpen();
        }}
        style={{ flex: 1, cursor: "pointer", minWidth: 0, textDecoration: "none" }}
      >
        <p style={{ fontSize: 10, fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
          {product.brand}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {product.name}
        </p>
      </Link>
      <span style={{ fontSize: 10, color: "#6b7280", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "3px 8px", flexShrink: 0 }}>
        {product.category}
      </span>
      {otherDigboxCount ? (
        <span style={{ fontSize: 10, color: "#9ca3af", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "3px 8px", flexShrink: 0 }}>
          {otherDigboxCountLabel || `${otherDigboxCount}명이 담았어요`}
        </span>
      ) : null}
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

function DeleteConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "rgba(17,24,39,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="m19,6-.867,14.142A2,2 0 0,1 16.138,22H7.862a2,2 0 0,1-1.995-1.858L5,6m5,5v6m4-6v6" />
            <path d="M9,6V4h6v2" />
          </svg>
        </div>
        <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>DIGBOX에서 삭제할까요?</h3>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          이 상품을 DIGBOX에서 삭제합니다.
          <br />나중에 다시 담을 수 있어요.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "none", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            취소
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "rgba(239,68,68,0.85)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export function DigboxPageClient({
  username,
  bio: initialBio = "",
  products: initialProducts,
  discoveredDigboxCounts: initialDiscoveredDigboxCounts = {},
}: {
  username: string;
  bio?: string;
  products: Product[];
  discoveredDigboxCounts?: Record<string, number>;
}) {
  const auth = useAuthContext();
  const digbox = useDigboxContext();
  const ensureDigboxLoaded = digbox.ensureLoaded;
  const { toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { products: allProducts } = useProductsContext();

  const isOwner = Boolean(auth.dbUsername && auth.dbUsername === username);
  const isLoading = auth.isAuthLoading || (isOwner && digbox.isLoading);
  const products = isOwner && !digbox.isLoading ? digbox.digboxProducts : initialProducts;
  const discoveredDigboxCounts = isOwner ? digbox.discoveredDigboxCounts : initialDiscoveredDigboxCounts;

  useEffect(() => {
    if (isOwner) {
      ensureDigboxLoaded();
      ensureClosetLoaded();
    }
  }, [ensureClosetLoaded, ensureDigboxLoaded, isOwner]);

  const [catFilter, setCatFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  const [bio, setBio] = useState(initialBio);
  const [isBioEditing, setIsBioEditing] = useState(false);
  const [bioInput, setBioInput] = useState(initialBio);
  const [bioSaving, setBioSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleShare = async () => {
    setMenuOpen(false);
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveBio = async () => {
    if (bioSaving) return;
    setBioSaving(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/user/bio", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioInput }),
      });
      const json = await res.json();
      if (json.ok) {
        setBio(json.data.bio);
        setIsBioEditing(false);
      }
    } finally {
      setBioSaving(false);
    }
  };

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter && p.category !== catFilter) return false;
      if (!keyword) return true;
      return `${p.brand} ${p.name}`.toLowerCase().includes(keyword);
    });
  }, [catFilter, products, searchQuery]);

  const normalizedProduct = useMemo<Product | null>(() => {
    if (!selectedProduct) return null;
    const imagePath = String(selectedProduct.imagePath || "").trim();
    const image = imagePath ? toPublicUrl(imagePath) : selectedProduct.image;
    const thumbnailImage = imagePath
      ? toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 })
      : selectedProduct.thumbnailImage;
    return { ...selectedProduct, image, thumbnailImage };
  }, [selectedProduct]);

  const recommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeRowIndex === null || !selectedProduct) return [];
    return computeSizeRecommendations(selectedProduct, activeRowIndex, allProducts);
  }, [activeRowIndex, selectedProduct, allProducts]);

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const removeSelected = () => {
    void Promise.all([...selectedIds].map((id) => digbox.removeFromDigbox(id)));
    setSelectedIds(new Set());
    setIsEditing(false);
    setConfirmBatchDelete(false);
  };

  const getCardDigboxCountLabel = (count: number) =>
    isOwner ? `${count}명이 담았어요` : `${count}명이 DIGBOX에 담았어요`;

  const getDetailDigboxCountLabel = (count: number) =>
    isOwner ? `내가 발굴한 상품을 ${count}명이 담았어요` : `이 상품을 ${count}명이 DIGBOX에 담았어요`;

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
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {username}&apos;s DIGBOX
            </h1>
            {isOwner && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 3, width: 32, height: 32, borderRadius: 9,
                    background: menuOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  aria-label="메뉴"
                >
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(156,163,175,0.8)" }} />
                  ))}
                </button>
              </div>
            )}
          </div>

          {/* bio 표시 */}
          {!isBioEditing && (
            bio ? (
              <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.6, maxWidth: 480, whiteSpace: "pre-wrap" }}>
                {bio}
              </p>
            ) : null
          )}

          {/* bio 편집 */}
          {isBioEditing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480, marginTop: 4 }}>
              <textarea
                ref={bioTextareaRef}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value.slice(0, 160))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void saveBio(); }
                  if (e.key === "Escape") setIsBioEditing(false);
                }}
                placeholder="간단한 소개를 입력하세요 (최대 160자)"
                rows={2}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e5e7eb", fontSize: 13, lineHeight: 1.5, resize: "none",
                  outline: "none", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => void saveBio()}
                  disabled={bioSaving}
                  style={{ padding: "6px 16px", borderRadius: 8, background: "#F97316", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {bioSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBioEditing(false)}
                  style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  취소
                </button>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#4b5563" }}>{bioInput.length}/160</span>
              </div>
            </div>
          )}
        </div>

        {/* 복사 완료 토스트 */}
        {copied && (
          <div style={{
            position: "fixed", bottom: "calc(1.5rem + env(safe-area-inset-bottom))", left: "50%",
            transform: "translateX(-50%)", zIndex: 90,
            background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "10px 20px",
            color: "#e5e7eb", fontSize: 13, fontWeight: 600,
            boxShadow: "0 18px 48px rgba(0,0,0,0.55)", backdropFilter: "blur(20px)",
            whiteSpace: "nowrap",
          }}>
            🔗 링크가 복사되었어요
          </div>
        )}

        {/* 바텀시트 메뉴 */}
        {isOwner && menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            />
            <div style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 75,
              background: "#111114", borderTop: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px 20px 0 0",
              padding: "8px 0 calc(20px + env(safe-area-inset-bottom))",
              boxShadow: "0 -24px 60px rgba(0,0,0,0.55)",
            }}>
              {/* 핸들 */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "8px auto 16px" }} />

              {/* 공유 버튼 */}
              <button
                type="button"
                onClick={() => void handleShare()}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 24px", background: "none", border: "none",
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.9)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 600, margin: 0 }}>공유</p>
                  <p style={{ color: "#6b7280", fontSize: 12, margin: "2px 0 0" }}>링크를 복사해서 공유해요</p>
                </div>
              </button>

              {/* 소개 수정 — 본인만 */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setBioInput(bio); setIsBioEditing(true); setTimeout(() => bioTextareaRef.current?.focus(), 30); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 24px", background: "none", border: "none",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(251,146,60,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 600, margin: 0 }}>소개 수정</p>
                    <p style={{ color: "#6b7280", fontSize: 12, margin: "2px 0 0" }}>내 DIGBOX 소개글을 바꿔요</p>
                  </div>
                </button>
              )}
            </div>
          </>
        )}

        {/* Category filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto overflow-y-visible py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-6 sm:overflow-visible sm:py-0">
          {([["", "All", products.length]] as [string, string, number][])
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
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${isActive ? "bg-orange-500/18 text-orange-300" : "bg-white/[0.06] text-gray-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Toolbar */}
        <div
          className="closet-toolbar"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 10, flexWrap: "wrap" }}
        >
          <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 transition focus-within:border-orange-500/45 focus-within:bg-white/[0.055] sm:h-[34px]">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search items"
              className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-gray-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] p-0 text-gray-500 shadow-none transition hover:bg-orange-500/[0.14] hover:text-orange-300"
                aria-label="Clear DIGBOX search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="closet-toolbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isEditing && (
              <div style={{ height: 34, display: "inline-flex", alignItems: "center", padding: "0 12px", borderRadius: 11, background: "rgba(255,255,255,0.05)", color: selectedIds.size > 0 ? "#F97316" : "#8b949e", fontSize: 11, fontWeight: 800 }}>
                {selectedIds.size} selected
              </div>
            )}

            {/* View toggle */}
            {!isEditing && (
              <div style={{ display: "flex", height: 34, background: "rgba(255,255,255,0.05)", borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                {([
                  { id: "grid" as ViewMode, icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  )},
                  { id: "list" as ViewMode, icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  )},
                ] as { id: ViewMode; icon: React.ReactNode }[]).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    style={{
                      width: 36, height: "100%", padding: 0, border: "none", cursor: "pointer",
                      background: viewMode === v.id ? "rgba(249,115,22,0.18)" : "transparent",
                      color: viewMode === v.id ? "#F97316" : "#6b7280",
                      transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}>{v.icon}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Delete button — owner only */}
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  if (isEditing && selectedIds.size > 0) { setConfirmBatchDelete(true); return; }
                  setIsEditing((prev) => { if (prev) setSelectedIds(new Set()); return !prev; });
                }}
                style={{
                  height: 34, width: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: 0, borderRadius: 11,
                  background: isEditing ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: isEditing ? "#F97316" : "#6b7280",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                aria-label={isEditing ? "삭제 선택 완료" : "삭제할 상품 선택"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {isOwner && isEditing && (
              <button
                type="button"
                onClick={() => { setSelectedIds(new Set()); setIsEditing(false); }}
                style={{
                  height: 34, width: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: 0, borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "none",
                  color: "#6b7280", cursor: "pointer", transition: "all 0.15s",
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
        {isLoading ? null : filtered.length === 0 ? (
          <div style={{ ...cardStyle, padding: "60px 24px", textAlign: "center", marginTop: 20 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              DIGBOX가 비어있어요.
              <br />
              마음에 드는 상품을 담아보세요.
            </p>
            <Link
              href="/"
              style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", borderRadius: 12, background: "#F97316", color: "#000", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
            >
              상품 보기
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="closet-product-grid" style={{ display: "grid" }}>
            {filtered.map((p) => (
              <GridCard
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                otherDigboxCount={discoveredDigboxCounts[p.id] || 0}
                otherDigboxCountLabel={discoveredDigboxCounts[p.id] ? getCardDigboxCountLabel(discoveredDigboxCounts[p.id]) : undefined}
                onSelect={() => toggleSelect(p.id)}
                onOpen={() => handleProductOpen(p)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((p) => (
              <ListRow
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                otherDigboxCount={discoveredDigboxCounts[p.id] || 0}
                otherDigboxCountLabel={discoveredDigboxCounts[p.id] ? getCardDigboxCountLabel(discoveredDigboxCounts[p.id]) : undefined}
                onSelect={() => toggleSelect(p.id)}
                onOpen={() => handleProductOpen(p)}
              />
            ))}
          </div>
        )}
      </div>

      {confirmBatchDelete && (
        <DeleteConfirmDialog
          onConfirm={removeSelected}
          onCancel={() => setConfirmBatchDelete(false)}
        />
      )}

      {normalizedProduct && (
        <ProductDetailModal
          product={normalizedProduct}
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
          onToggleCloset={(selection) => toggleCloset(normalizedProduct.id, selection)}
          isInCloset={isInCloset(normalizedProduct.id)}
          onToggleDigbox={() => digbox.toggleDigbox(normalizedProduct.id)}
          isInDigbox={digbox.isInDigbox(normalizedProduct.id)}
          hideDigboxButton={digbox.isInDigbox(normalizedProduct.id)}
          otherDigboxCount={discoveredDigboxCounts[normalizedProduct.id] || 0}
          otherDigboxCountLabel={
            discoveredDigboxCounts[normalizedProduct.id]
              ? getDetailDigboxCountLabel(discoveredDigboxCounts[normalizedProduct.id])
              : undefined
          }
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
