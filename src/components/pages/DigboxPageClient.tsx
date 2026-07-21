"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { supabase } from "../../lib/supabase";
import { ProgressiveImage } from "../ProgressiveImage";
import { FilterBar } from "../FilterBar";
import { ProductDetailModal } from "../ProductDetailModal";
import { ImageViewerOverlay } from "../ImageViewerOverlay";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "../OnboardingTutorial";
import { toPublicUrl } from "../../utils/product";
import { CollectionSearchField } from "../CollectionSearchField";
import { CollectionEmptyState } from "../CollectionEmptyState";
import type { Product } from "../../types";

const cardStyle: React.CSSProperties = {
  background: "#111114",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1.25rem",
  overflow: "hidden",
  boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 40px rgba(0,0,0,0.55)",
};

function GridCard({
  product,
  selected,
  isEditing,
  onSelect,
  onOpen,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const imageSrc = product.image || product.thumbnailImage || "";

  return (
    <div
      data-editing={isEditing}
      data-selected={isEditing && selected}
      className={`digbox-product-card ui-card ui-product-card relative flex h-full flex-col overflow-hidden rounded-[22px] border bg-[linear-gradient(180deg,rgba(25,25,29,0.98),rgba(15,15,18,0.98))] shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition-[transform,border-color,box-shadow,background-color] duration-150 [transition-timing-function:var(--ease-out)] ${
        isEditing && selected
          ? "border-orange-400 bg-orange-500/[0.08] shadow-[0_0_0_2px_rgba(251,146,60,0.3),0_14px_34px_rgba(0,0,0,0.18)]"
          : "border-white/[0.09]"
      }`}
    >
      <Link
        href={`?product=${encodeURIComponent(product.id)}`}
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
          <div className="mb-1 truncate text-xs font-bold tracking-wide text-orange-500">{product.brand}</div>
          <h3 className="mb-2 line-clamp-2 text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
          <div className="mt-auto pt-2 text-center text-sm text-gray-300">{product.category}</div>
        </div>
      </Link>

      {isEditing && (
        <button
          type="button"
          aria-label={selected ? "상품 선택 해제" : "상품 선택"}
          aria-pressed={selected}
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
  onOpen,
}: {
  product: Product;
  selected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div
      className={`digbox-list-row ${isEditing && selected ? "border-orange-400/80 bg-orange-500/[0.08]" : "border-white/[0.09]"}`}
      data-editing={isEditing}
      style={{
        ...cardStyle,
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
        borderColor: isEditing && selected ? "rgba(251,146,60,0.8)" : "rgba(255,255,255,0.09)",
        background: isEditing && selected ? "rgba(249,115,22,0.08)" : "#111114",
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
      <Link
        href={`?product=${encodeURIComponent(product.id)}`}
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
        href={`?product=${encodeURIComponent(product.id)}`}
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
      {isEditing && (
        <button
          type="button"
          aria-label={selected ? "상품 선택 해제" : "상품 선택"}
          aria-pressed={selected}
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
        <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>저장 목록에서 삭제할까요?</h3>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          이 상품을 저장 목록에서 삭제합니다.
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
  const productModal = useProductModalQuery();
  const { toggleCloset, isInCloset, ensureLoaded: ensureClosetLoaded } = useClosetContext();

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

  useEffect(() => () => {
    if (removalUndoTimerRef.current) window.clearTimeout(removalUndoTimerRef.current);
  }, []);

  const [catFilter, setCatFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUndoingRemoval, setIsUndoingRemoval] = useState(false);
  const [removalUndoProducts, setRemovalUndoProducts] = useState<Product[] | null>(null);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const [bio, setBio] = useState(initialBio);
  const [isBioEditing, setIsBioEditing] = useState(false);
  const [bioInput, setBioInput] = useState(initialBio);
  const [bioSaving, setBioSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);
  const removalUndoTimerRef = useRef<number | null>(null);

  const getAnchorRect = (element: Element): TutorialAnchorRect => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  const showTutorialOnce = (tutorialId: TutorialId, anchorRect?: TutorialAnchorRect) => {
    const storageKey = `sizepicker:tutorial:v2:${tutorialId}`;
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "true");
    setActiveTutorial({ id: tutorialId, anchorRect });
  };

  const closeMenu = () => {
    if (!menuOpen || isSheetClosing) return;
    setIsSheetClosing(true);
    window.setTimeout(() => {
      setMenuOpen(false);
      setIsSheetClosing(false);
    }, 160);
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
      return;
    }
    setIsSheetClosing(false);
    setMenuOpen(true);
  };

  const handleShare = async () => {
    closeMenu();
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

  const openBioEditor = () => {
    closeMenu();
    setBioInput(bio);
    window.setTimeout(() => {
      setIsBioEditing(true);
      bioTextareaRef.current?.focus();
    }, 170);
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

  useEffect(() => {
    if (!productModal.productId) {
      setSelectedProduct(null);
      setActiveRowIndex(null);
      setIsDetailImageZoomed(false);
      return;
    }

    const product = products.find((item) => item.id === productModal.productId);
    if (product) setSelectedProduct(product);
  }, [productModal.productId, products]);

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const removeSelected = async () => {
    const ids = [...selectedIds];
    if (!ids.length || isRemoving) return;

    setIsRemoving(true);
    setRemovalError(null);
    const results = await Promise.allSettled(ids.map((id) => digbox.removeFromDigbox(id)));
    const succeededIds = new Set(ids.filter((_, index) => results[index]?.status === "fulfilled"));
    const failedIds = ids.filter((id) => !succeededIds.has(id));
    const removedProducts = products.filter((product) => succeededIds.has(product.id));

    if (removedProducts.length) {
      if (removalUndoTimerRef.current) window.clearTimeout(removalUndoTimerRef.current);
      setRemovalUndoProducts(removedProducts);
      removalUndoTimerRef.current = window.setTimeout(() => setRemovalUndoProducts(null), 5000);
    }

    setSelectedIds(new Set(failedIds));
    setIsEditing(failedIds.length > 0);
    if (failedIds.length) setRemovalError("일부 상품을 저장 목록에서 삭제하지 못했어요. 다시 시도해주세요.");
    setIsRemoving(false);
  };

  const undoRemoval = async () => {
    if (!removalUndoProducts?.length || isUndoingRemoval) return;

    setIsUndoingRemoval(true);
    setRemovalError(null);
    const results = await Promise.allSettled(removalUndoProducts.map((product) => digbox.addToDigbox(product.id)));
    const failedCount = results.filter((result) => result.status === "rejected").length;
    if (failedCount) {
      setRemovalError("일부 상품을 다시 저장하지 못했어요. 다시 시도해주세요.");
    } else {
      if (removalUndoTimerRef.current) window.clearTimeout(removalUndoTimerRef.current);
      setRemovalUndoProducts(null);
    }
    setIsUndoingRemoval(false);
  };

  const getCardDigboxCountLabel = (count: number) =>
    isOwner ? `${count}명이 저장했어요` : `${count}명이 저장했어요`;

  const getDetailDigboxCountLabel = (count: number) =>
    isOwner ? `내가 발굴한 상품을 ${count}명이 저장했어요` : `이 상품을 ${count}명이 저장했어요`;

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
        <div className="collection-page-title">
          <div className="collection-page-heading-row">
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {isOwner ? "저장한 상품" : `${username} 님이 저장한 상품`}
            </h1>
            {isOwner && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={(event) => {
                    showTutorialOnce("digboxShare", getAnchorRect(event.currentTarget));
                    toggleMenu();
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 3, width: 36, height: 36, borderRadius: 9,
                    background: menuOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
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
          {!isOwner && !isBioEditing && (
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
        <CollectionSearchField value={searchQuery} onChange={setSearchQuery} disabled={isEditing} ariaLabel="저장한 상품 검색" />

        {copied && (
          <div className="digbox-copy-toast fixed bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]" style={{
            left: "50%",
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
              className="digbox-sheet-backdrop"
              data-closing={isSheetClosing}
              onClick={closeMenu}
              style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            />
            <div className="digbox-sheet" data-closing={isSheetClosing} style={{
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
                  onClick={openBioEditor}
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
                    <p style={{ color: "#6b7280", fontSize: 12, margin: "2px 0 0" }}>내 저장 목록 소개글을 바꿔요</p>
                  </div>
                </button>
              )}
            </div>
          </>
        )}

        {/* Category filter */}
        <FilterBar categoryValue={catFilter} onCategoryChange={(value) => setCatFilter(value)} disabled={isEditing} />

        {/* Toolbar */}
        <div className="hidden">
          <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 transition focus-within:border-orange-500/45 focus-within:bg-white/[0.055] sm:h-[34px]">
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
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] p-0 text-gray-500 transition hover:bg-orange-500/[0.14] hover:text-orange-300"
                aria-label="Clear saved items search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="hidden">
            {isEditing && (
              <p aria-live="polite" className="text-xs font-bold text-orange-300">
                {selectedIds.size ? `${selectedIds.size}개 선택됨` : "상품을 선택하세요"}
              </p>
            )}

            {/* Delete button — owner only */}
            {isOwner && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setRemovalError(null);
                  setIsEditing(true);
                }}
                style={{
                  height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "0 12px", borderRadius: 11,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#d1d5db",
                  cursor: "pointer", transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
                }}
                aria-label="편집"
              >
                저장 목록에서 삭제
              </button>
            )}

            {isOwner && isEditing && (
              <button
                type="button"
                onClick={() => { setSelectedIds(new Set()); setRemovalError(null); setIsEditing(false); }}
                style={{
                  height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "0 12px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#6b7280", cursor: "pointer", transition: "transform 150ms var(--ease-out), border-color 150ms ease, background-color 150ms ease, color 150ms ease",
                }}
                aria-label="취소"
              >
                취소
              </button>
            )}
          </div>
        </div>

        {removalError && <p role="alert" className="mb-4 text-xs font-semibold text-red-300">{removalError}</p>}
        </div>{/* end 860 wrapper */}

        {/* Empty state */}
        {isLoading ? null : filtered.length === 0 ? (
          <CollectionEmptyState
            collection="saved"
            query={searchQuery}
            category={catFilter}
            onClearSearch={() => setSearchQuery("")}
            onClearCategory={() => setCatFilter("")}
            onClearAll={() => {
              setSearchQuery("");
              setCatFilter("");
            }}
          />
        ) : (
          <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p aria-live="polite" className={`text-sm font-bold ${isEditing ? "text-orange-300" : "text-white/75"}`}>
              {isEditing
                ? (selectedIds.size ? `${selectedIds.size}개 선택됨` : "저장 목록에서 삭제할 상품을 선택하세요.")
                : (searchQuery.trim() ? `${filtered.length}개 검색 결과` : `저장한 상품 ${filtered.length}개`)}
            </p>
            {isOwner && !isEditing && (
              <button type="button" onClick={() => { setRemovalError(null); setIsEditing(true); }} className="h-9 rounded-lg px-2.5 text-sm font-semibold text-white/65 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80">
                저장 목록에서 삭제
              </button>
            )}
            {isOwner && isEditing && (
              <button type="button" onClick={() => { setSelectedIds(new Set()); setRemovalError(null); setIsEditing(false); }} className="h-9 rounded-lg px-2.5 text-sm font-semibold text-white/65 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80">
                취소
              </button>
            )}
          </div>
          <div className="closet-product-grid" style={{ display: "grid" }}>
            {filtered.map((p) => (
              <GridCard
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                isEditing={isEditing}
                onSelect={() => toggleSelect(p.id)}
                onOpen={() => handleProductOpen(p)}
              />
            ))}
          </div>
          </>
        )}
      </div>

      {isOwner && isEditing && selectedIds.size > 0 && (
        <div className="digbox-removal-tray fixed inset-x-4 bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/[0.12] bg-[#17171b]/95 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6">
          <p className="min-w-0 text-sm font-bold text-white"><span className="text-orange-300">{selectedIds.size}개</span> 선택됨</p>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => { setSelectedIds(new Set()); setRemovalError(null); setIsEditing(false); }} className="h-10 rounded-xl px-3 text-sm font-bold text-gray-300 transition hover:bg-white/[0.06] hover:text-white">
              취소
            </button>
            <button type="button" disabled={isRemoving} onClick={() => void removeSelected()} className="h-10 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-wait disabled:bg-red-500/50">
              {isRemoving ? "저장 목록에서 삭제 중…" : "선택한 상품을 저장 목록에서 삭제"}
            </button>
          </div>
        </div>
      )}

      {removalUndoProducts?.length ? (
        <div role="status" className="digbox-removal-tray fixed inset-x-4 bottom-[calc(var(--app-bottom-nav-height)+1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-white/[0.12] bg-[#17171b]/95 px-4 py-3 text-sm shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6">
          <p className="min-w-0 font-semibold text-white">상품 {removalUndoProducts.length}개를 저장 목록에서 삭제했어요.</p>
          <button type="button" disabled={isUndoingRemoval} onClick={() => void undoRemoval()} className="shrink-0 font-bold text-orange-300 transition hover:text-orange-200 disabled:cursor-wait disabled:text-orange-300/50">
            {isUndoingRemoval ? "되돌리는 중…" : "되돌리기"}
          </button>
        </div>
      ) : null}

      {normalizedProduct && (
        <ProductDetailModal
          product={normalizedProduct}
          activeRowIndex={activeRowIndex}
          onClose={handleModalClose}
          onRowClick={(rowIndex) => setActiveRowIndex(rowIndex)}
          onRecommendationClick={(product) => handleProductOpen(product, true)}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={modalRef}
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

      {normalizedProduct && <ImageViewerOverlay open={isDetailImageZoomed} src={normalizedProduct.image} alt={normalizedProduct.name} onClose={() => setIsDetailImageZoomed(false)} />}
      {activeTutorial && (
        <OnboardingTutorial
          tutorialId={activeTutorial.id}
          anchorRect={activeTutorial.anchorRect}
          onClose={() => setActiveTutorial(null)}
        />
      )}
    </main>
  );
}
