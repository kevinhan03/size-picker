"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Copy, LogOut, Plus, Ruler, Save, Shirt, Star, Trash2, UserRound, X } from "lucide-react";
import type { MySizeInput, MySizeProfile, Product } from "../../types";

interface MyPageViewProps {
  username: string;
  digboxHref: string;
  closetCount: number;
  digboxCount: number;
  closetPreviewProducts: Product[];
  digboxPreviewProducts: Product[];
  closetProducts: Product[];
  mySizes: MySizeProfile[];
  onCreateMySize: (input: MySizeInput) => Promise<void>;
  onDeleteMySize: (id: string) => Promise<void>;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
  deleteAccountError: string | null;
}

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.055] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_18px_46px_rgba(0,0,0,0.42)] backdrop-blur-2xl";

function ProductCardCarousel({ products, icon }: { products: Product[]; icon: React.ReactNode }) {
  const preview = products.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const didSwipeRef = React.useRef(false);

  if (preview.length === 0) {
    return (
      <div className="flex h-full min-h-[156px] items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 text-gray-600">
        {icon}
      </div>
    );
  }

  const getOffset = (index: number) => {
    if (preview.length === 1) return 0;
    let offset = index - activeIndex;
    const half = preview.length / 2;
    if (offset > half) offset -= preview.length;
    if (offset < -half) offset += preview.length;
    return offset;
  };

  const getCardStyle = (offset: number): React.CSSProperties => ({
    left: "50%",
    opacity: Math.abs(offset) <= 1 ? (offset === 0 ? 1 : 0.58) : 0,
    pointerEvents: Math.abs(offset) <= 1 ? "auto" : "none",
    transform: `translateX(calc(-50% + ${
      offset === 0 ? "0%" : offset < 0 ? "var(--mypage-side-card-x-neg)" : "var(--mypage-side-card-x)"
    })) translateY(-50%) scale(${offset === 0 ? 1 : 0.72})`,
    zIndex: offset === 0 ? 10 : Math.abs(offset) <= 1 ? 1 : 0,
  });

  const slideToNext = () => setActiveIndex((current) => (current + 1) % preview.length);
  const slideToPrevious = () => setActiveIndex((current) => (current - 1 + preview.length) % preview.length);

  const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    didSwipeRef.current = false;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLButtonElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX === null || startY === null || preview.length <= 1) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    didSwipeRef.current = true;
    if (deltaX < 0) slideToNext();
    else slideToPrevious();
  };

  const handleClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    slideToNext();
  };

  return (
    <div className="min-h-[190px] w-full min-w-0 max-w-full overflow-hidden px-2 pt-3 [--mypage-side-card-x-neg:-40%] [--mypage-side-card-x:40%] sm:min-h-[292px] sm:[--mypage-side-card-x-neg:-50%] sm:[--mypage-side-card-x:50%]">
      <button
        type="button"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative h-[170px] w-full touch-pan-y appearance-none border-0 bg-transparent p-0 shadow-none outline-none sm:h-[276px]"
        aria-label="다음 상품 보기"
      >
        {preview.map((product, index) => (
          <div
            key={product.id}
            className="absolute top-1/2 aspect-[4/5] h-[160px] overflow-hidden rounded-2xl bg-white transition-all duration-300 ease-out sm:h-[260px]"
            style={getCardStyle(getOffset(index))}
          >
            <img
              src={product.thumbnailImage || product.image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          </div>
        ))}
      </button>
    </div>
  );
}

function CollectionCard({
  title,
  count,
  href,
  products,
  icon,
  tone,
}: {
  title: string;
  count: number;
  href: string;
  products: Product[];
  icon: React.ReactNode;
  tone: "yellow" | "orange";
}) {
  const color = tone === "yellow" ? "text-yellow-300" : "text-orange-400";
  const bg = tone === "yellow" ? "bg-yellow-400/12" : "bg-orange-500/12";

  return (
    <section className={`${cardClass} flex min-h-[284px] min-w-0 flex-col p-4 sm:min-h-[292px] sm:p-5`}>
      <div className="mb-3 sm:mb-4">
        <Link href={href} className="group flex min-w-0 items-start justify-between gap-2 no-underline">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl ${bg} ${color}`}>
                {icon}
              </span>
              <h2 className="min-w-0 truncate text-sm font-black text-white transition group-hover:text-orange-300 sm:text-lg">{title}</h2>
            </div>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-500 transition group-hover:text-orange-300 sm:h-5 sm:w-5" />
        </Link>
      </div>
      <div className="min-h-0 min-w-0 flex-1">
        <ProductCardCarousel products={products} icon={icon} />
      </div>
      {count === 0 && (
        <Link
          href="/"
          className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-black text-black transition hover:bg-orange-400 sm:mt-4 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          상품 둘러보기
        </Link>
      )}
    </section>
  );
}

const getSnapshotPreview = (profile: MySizeProfile) =>
  profile.measurementSnapshot.headers
    .slice(1)
    .map((header, index) => ({
      label: String(header || "").trim(),
      value: String(profile.measurementSnapshot.row[index + 1] || "").trim(),
    }))
    .filter(({ label, value }) => label && value);

const getMySizePrimaryLabel = (profile: MySizeProfile) => {
  const sizeLabel = String(profile.sizeLabel || profile.measurementSnapshot.row?.[0] || "").trim();
  return sizeLabel || "사이즈";
};

function MySizesManager({
  closetProducts,
  mySizes,
  onCreateMySize,
  onDeleteMySize,
}: {
  closetProducts: Product[];
  mySizes: MySizeProfile[];
  onCreateMySize: (input: MySizeInput) => Promise<void>;
  onDeleteMySize: (id: string) => Promise<void>;
}) {
  const registeredProductIds = useMemo(
    () => new Set(mySizes.map((p) => p.sourceProductId).filter(Boolean)),
    [mySizes]
  );
  const closetCandidates = useMemo(
    () => closetProducts.filter(
      (product) => product.closetSelectedSizeSnapshot?.headers?.length && !registeredProductIds.has(product.id)
    ),
    [closetProducts, registeredProductIds]
  );
  const groupedProfiles = useMemo(() => {
    const groups = new Map<string, MySizeProfile[]>();
    mySizes.forEach((profile) => {
      const key = profile.category || "Item";
      groups.set(key, [...(groups.get(key) || []), profile]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [mySizes]);

  const [isAdding, setIsAdding] = useState(false);
  const [sourceProductId, setSourceProductId] = useState("");
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [fitNote, setFitNote] = useState("");
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const selectedProduct = closetCandidates.find((product) => product.id === sourceProductId) || null;
  const filteredClosetCandidates = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return closetCandidates;
    return closetCandidates.filter((product) => {
      const sizeLabel = product.closetSelectedSizeLabel || product.closetSelectedSizeSnapshot?.row?.[0] || "";
      return `${product.brand} ${product.name} ${product.category} ${sizeLabel}`.toLowerCase().includes(query);
    });
  }, [closetCandidates, productSearchQuery]);

  const resetForm = () => {
    setSourceProductId("");
    setIsProductPickerOpen(false);
    setProductSearchQuery("");
    setFitNote("");
    setFormError(null);
  };

  const closeAddDialog = () => {
    resetForm();
    setIsAdding(false);
  };

  const handleCreate = async () => {
    setFormError(null);
    setIsSaving(true);
    try {
      const snapshot = selectedProduct?.closetSelectedSizeSnapshot;
      if (!selectedProduct || !snapshot) throw new Error("저장된 사이즈가 있는 옷장 상품을 선택해 주세요.");
      await onCreateMySize({
        sourceProductId: selectedProduct.id,
        brand: selectedProduct.brand || null,
        category: selectedProduct.category || "Item",
        title: selectedProduct.name || selectedProduct.category || "My size",
        sizeLabel: selectedProduct.closetSelectedSizeLabel || snapshot.row[0] || null,
        measurementSnapshot: snapshot,
        fitNote: fitNote.trim() || null,
      });
      closeAddDialog();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "마이사이즈 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={`${cardClass} min-w-0 overflow-hidden p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-gray-300">
            <Ruler className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-black text-white">My Size</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isAdding) {
              closeAddDialog();
              return;
            }
            setIsAdding(true);
            setFormError(null);
          }}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-black text-black transition hover:bg-orange-400"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding ? "닫기" : "추가"}
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white">My Size 추가</h3>
              <p className="mt-1 text-xs font-semibold text-gray-500">옷장에서 잘 맞았던 사이즈를 저장합니다.</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-gray-500">옷장 상품</label>
            {closetCandidates.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen((value) => !value)}
                  className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border px-3 text-left transition ${
                    isProductPickerOpen || selectedProduct
                      ? "border-orange-500/50 bg-orange-500/10"
                      : "border-white/10 bg-white/[0.06] hover:border-white/20"
                  }`}
                >
                  <div className="min-w-0 flex-1 overflow-hidden">
                    {selectedProduct ? (
                      <>
                        <p className="truncate text-xs font-black text-white">{selectedProduct.name}</p>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-gray-500">
                          {selectedProduct.brand} · {selectedProduct.closetSelectedSizeLabel || selectedProduct.closetSelectedSizeSnapshot?.row?.[0] || "사이즈"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-black text-white">옷장에서 상품 선택</p>
                      </>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isProductPickerOpen ? "rotate-90" : ""}`} />
                </button>

                {isProductPickerOpen && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-[#111114] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <input
                      value={productSearchQuery}
                      onChange={(event) => setProductSearchQuery(event.target.value)}
                      placeholder="상품명 또는 브랜드 검색"
                      className="mb-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white outline-none placeholder:text-gray-600 focus:border-orange-500/70"
                    />
                    <div className="grid max-h-[210px] gap-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {filteredClosetCandidates.length > 0 ? (
                        filteredClosetCandidates.map((product) => {
                          const sizeLabel = product.closetSelectedSizeLabel || product.closetSelectedSizeSnapshot?.row?.[0] || "사이즈";
                          const selected = sourceProductId === product.id;
                          return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSourceProductId(product.id);
                        setIsProductPickerOpen(false);
                        setProductSearchQuery("");
                      }}
                      className={`flex min-w-0 items-center gap-3 rounded-xl border p-2 text-left transition ${
                        selected
                          ? "border-orange-500/70 bg-orange-500/12"
                          : "border-white/[0.06] bg-white/[0.035] hover:border-white/[0.14] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                        <img
                          src={product.thumbnailImage || product.image}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-[11px] font-black uppercase text-orange-300">{product.brand}</span>
                          <span className="shrink-0 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                            {sizeLabel}
                          </span>
                        </div>
                        <p className="truncate text-xs font-bold text-white">{product.name}</p>
                      </div>
                      <span className={`h-3 w-3 shrink-0 rounded-full border ${selected ? "border-orange-400 bg-orange-400" : "border-white/20"}`} />
                    </button>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.035] px-3 py-4 text-center text-xs font-semibold text-gray-500">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {closetCandidates.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-gray-500">
                옷장에서 사이즈를 선택해 저장한 상품이 있어야 My Size으로 등록할 수 있습니다.
              </p>
            )}
          </div>

          <textarea
            value={fitNote}
            onChange={(event) => setFitNote(event.target.value)}
            placeholder="착용감 메모 (선택): 예: 허리는 편하고 기장은 살짝 김"
            rows={2}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-gray-600 focus:border-orange-500/70"
          />
          {formError && <p className="mt-3 text-sm font-semibold text-red-300">{formError}</p>}
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isSaving}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "저장 중..." : "My Size 저장"}
          </button>
        </div>
      )}

      {mySizes.length > 0 ? (
        <div className="grid gap-2">
          {groupedProfiles.map(([group, profiles]) => {
            const isOpen = openCategories.has(group);
            return (
              <div key={group} className="rounded-xl border border-white/[0.08] bg-black/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(group)}
                  className="flex w-full items-center justify-between px-3 py-3 transition hover:bg-white/[0.035]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-wide text-white">{group}</span>
                    <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-bold text-gray-400">{profiles.length}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="grid max-h-[240px] gap-2 overflow-y-auto border-t border-white/[0.06] p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {profiles.map((profile) => {
                  const preview = getSnapshotPreview(profile);
                  const isExpanded = expandedProfileId === profile.id;
                  return (
                    <article
                      key={profile.id}
                      onClick={() => setExpandedProfileId((current) => (current === profile.id ? null : profile.id))}
                      className="min-w-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 transition hover:border-white/[0.14] hover:bg-white/[0.035]"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate text-sm font-black text-white">{getMySizePrimaryLabel(profile)}</h3>
                          </div>
                          {profile.brand && (
                            <p className="mt-1 truncate text-xs font-bold text-orange-400/70">{profile.brand}</p>
                          )}
                          <p className="mt-0.5 truncate text-xs font-semibold text-gray-500">
                            {profile.title || "상품명 없음"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void onDeleteMySize(profile.id);
                            }}
                            aria-label="마이사이즈 삭제"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-gray-500 transition hover:border-red-500/40 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {(profile.fitNote || preview.length > 0) && !isExpanded && (
                        <p className="mt-2 text-[11px] font-bold text-gray-600">
                          눌러서 {profile.fitNote ? "메모와 " : ""}실측 보기
                        </p>
                      )}
                      {isExpanded && (
                        <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.035] px-3 py-2">
                          {profile.fitNote && (
                            <p className="text-xs font-semibold leading-relaxed text-gray-400">
                              {profile.fitNote}
                            </p>
                          )}
                          {preview.length > 0 && (
                            <div className={`${profile.fitNote ? "mt-2" : ""} flex min-w-0 flex-wrap gap-1`}>
                              {preview.map(({ label, value }) => (
                                <span key={`${profile.id}-${label}`} className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                                  {label} {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !isAdding ? (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 text-sm font-semibold text-gray-500">
          잘 맞았던 사이즈를 My Size으로 저장해 보세요.
        </div>
      ) : null}
    </section>
  );
}

export function MyPageView({
  username,
  digboxHref,
  closetCount,
  digboxCount,
  closetPreviewProducts,
  digboxPreviewProducts,
  closetProducts,
  mySizes,
  onCreateMySize,
  onDeleteMySize,
  onLogout,
  onDeleteAccount,
  isDeletingAccount,
  deleteAccountError,
}: MyPageViewProps) {
  const [copied, setCopied] = useState(false);

  const copyPublicLink = async () => {
    const url = `${window.location.origin}${digboxHref}`;
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
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:gap-4">
      <section className={`${cardClass} p-4 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_24px_rgba(249,115,22,0.12)] sm:h-14 sm:w-14">
              <UserRound className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">{username}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-[340px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">DIGBOX</p>
                <p className="mt-1 text-xl font-black text-yellow-300">{digboxCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Closet</p>
                <p className="mt-1 text-xl font-black text-orange-400">{closetCount}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void copyPublicLink()}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] text-sm font-bold text-gray-300 transition hover:border-yellow-400/40 hover:text-yellow-300"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "복사됨" : "DIGBOX 링크 복사"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
        <CollectionCard
          title="DIGBOX"
          count={digboxCount}
          href={digboxHref}
          products={digboxPreviewProducts}
          icon={<Star className="h-4 w-4" />}
          tone="yellow"
        />
        <CollectionCard
          title="Closet"
          count={closetCount}
          href="/closet"
          products={closetPreviewProducts}
          icon={<Shirt className="h-4 w-4" />}
          tone="orange"
        />
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4">
        <MySizesManager
          closetProducts={closetProducts}
          mySizes={mySizes}
          onCreateMySize={onCreateMySize}
          onDeleteMySize={onDeleteMySize}
        />

        <section className={`${cardClass} p-5`}>
          <h2 className="mb-4 text-lg font-black text-white">계정</h2>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex h-11 items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-gray-300 transition hover:border-orange-500/40 hover:text-orange-400"
            >
              <span>로그아웃</span>
              <LogOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDeleteAccount}
              disabled={isDeletingAccount}
              className="flex h-11 items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 text-sm font-bold text-red-300 transition hover:border-red-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isDeletingAccount ? "삭제 중..." : "계정 삭제"}</span>
              <Trash2 className="h-4 w-4" />
            </button>
            {deleteAccountError && (
              <p className="text-sm font-semibold text-red-300">{deleteAccountError}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
