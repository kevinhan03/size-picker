"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Copy, LogOut, Network, Plus, Ruler, Search, Shirt, Star, Trash2, UserRound, X } from "lucide-react";
import type { MySizeInput, MySizeProfile, Product } from "../../types";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "../OnboardingTutorial";
import { getProductPageUrl } from "../../utils/product";

interface MyPageViewProps {
  username: string;
  digboxHref: string;
  closetCount: number;
  digboxCount: number;
  discoveredProducts: Product[];
  isDiscoveriesLoading: boolean;
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

function CollectionCard({
  title,
  href,
  icon,
  tone,
  meta,
  emptyCta = false,
  backgroundImage,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  tone: "yellow" | "orange" | "blue";
  meta: React.ReactNode;
  emptyCta?: boolean;
  backgroundImage?: string;
}) {
  const color = tone === "yellow" ? "text-yellow-300" : tone === "orange" ? "text-orange-400" : "text-sky-300";
  const bg = tone === "yellow" ? "bg-yellow-400/12" : tone === "orange" ? "bg-orange-500/12" : "bg-sky-400/12";

  return (
    <section
      className={`${cardClass} relative flex min-w-0 flex-col gap-3 overflow-hidden p-4 sm:p-5`}
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(10,11,15,0.35) 0%, rgba(10,11,15,0.55) 55%, rgba(10,11,15,0.88) 100%), url(${backgroundImage})`,
              backgroundSize: "cover, 170%",
              backgroundPosition: "center, center",
              backgroundRepeat: "no-repeat, no-repeat",
            }
          : undefined
      }
    >
      <Link href={href} className="group relative z-10 flex min-w-0 items-center gap-3 no-underline">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${bg} ${color}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="min-w-0 truncate text-sm font-black text-white transition group-hover:text-orange-300 sm:text-base">{title}</h2>
          <div className="mt-0.5 truncate text-xs font-semibold text-gray-500">{meta}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 transition group-hover:text-orange-300 sm:h-5 sm:w-5" />
      </Link>
      {emptyCta && (
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-black text-black transition hover:bg-orange-400 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
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
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);

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

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
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
          onClick={(event) => {
            if (isAdding) {
              closeAddDialog();
              return;
            }
            showTutorialOnce("mySizeSetup", getAnchorRect(event.currentTarget));
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
                  onClick={(event) => {
                    showTutorialOnce("mySizeSetup", getAnchorRect(event.currentTarget));
                    setIsProductPickerOpen((value) => !value);
                  }}
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
      {activeTutorial && (
        <OnboardingTutorial
          tutorialId={activeTutorial.id}
          anchorRect={activeTutorial.anchorRect}
          onClose={() => setActiveTutorial(null)}
        />
      )}
    </section>
  );
}

export function MyPageView({
  username,
  digboxHref,
  closetCount,
  digboxCount,
  discoveredProducts,
  isDiscoveriesLoading,
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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDiscoveriesOpen, setIsDiscoveriesOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const canConfirmDelete = deleteConfirmText.trim() === "삭제";

  const closeDeleteConfirm = () => {
    if (isDeletingAccount) return;
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmText("");
  };

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
    <>
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

      <div className="grid min-w-0 grid-cols-2 items-stretch gap-3 sm:gap-4">
        <CollectionCard
          title="내 취향"
          href="/taste-graph"
          icon={<Network className="h-5 w-5" />}
          tone="blue"
          meta="관심 취향과 보유 취향을 비교해보세요"
          backgroundImage="/images/taste-graph-card-bg.png"
        />
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
          <CollectionCard
            title="Closet"
            href="/closet"
            icon={<Shirt className="h-5 w-5" />}
            tone="orange"
            meta={`${closetCount}개`}
            emptyCta={closetCount === 0}
          />
          <CollectionCard
            title="DIGBOX"
            href={digboxHref}
            icon={<Star className="h-5 w-5" />}
            tone="yellow"
            meta={`${digboxCount}개`}
            emptyCta={digboxCount === 0}
          />
          <button
            type="button"
            onClick={() => setIsDiscoveriesOpen(true)}
            className={`${cardClass} col-span-2 flex min-w-0 items-center gap-3 overflow-hidden p-4 text-left transition hover:border-orange-400/55 hover:bg-orange-500/[0.055] sm:p-5`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/12 text-orange-400 sm:h-11 sm:w-11"><Search className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-white sm:text-base">내가 발굴한 아이템</span><span className="mt-0.5 block truncate text-xs font-semibold text-gray-500">{isDiscoveriesLoading ? "발굴한 아이템을 불러오는 중" : `${discoveredProducts.length}개`}</span></span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 transition sm:h-5 sm:w-5" />
          </button>
        </div>
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
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="flex h-11 items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-gray-300 transition hover:border-orange-500/40 hover:text-orange-400"
            >
              <span>로그아웃</span>
              <LogOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
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
    {isLogoutConfirmOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.65)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <LogOut className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-black text-white">로그아웃할까요?</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
            현재 계정에서 로그아웃됩니다. 저장된 옷장과 DIGBOX는 계정에 그대로 유지됩니다.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogoutConfirmOpen(false);
                onLogout();
              }}
              className="h-11 rounded-xl bg-orange-500 text-sm font-black text-black transition hover:bg-orange-400"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    )}
    {isDiscoveriesOpen && (
      <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8" role="dialog" aria-modal="true" aria-label="내가 발굴한 아이템">
        <div className="flex max-h-[min(780px,calc(100vh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#151518] shadow-[0_24px_64px_rgba(0,0,0,0.68)]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase text-orange-300">MY DISCOVERIES</p>
              <h2 className="mt-1 text-lg font-black text-white">내가 발굴한 아이템 {discoveredProducts.length}개</h2>
            </div>
            <button type="button" onClick={() => setIsDiscoveriesOpen(false)} aria-label="발굴 아이템 목록 닫기" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {isDiscoveriesLoading ? (
              <p className="py-12 text-center text-sm font-semibold text-gray-500">발굴한 아이템을 불러오는 중입니다.</p>
            ) : discoveredProducts.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {discoveredProducts.map((product) => (
                  <Link key={product.id} href={getProductPageUrl(product)} onClick={() => setIsDiscoveriesOpen(false)} className="group min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] no-underline transition hover:border-orange-400/60">
                    <div className="aspect-square bg-white/[0.04]"><img src={product.thumbnailImage || product.image} alt={product.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]" /></div>
                    <div className="min-w-0 p-3"><p className="truncate text-[11px] font-bold uppercase text-orange-300">{product.brand}</p><p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-white">{product.name}</p></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center"><Search className="mx-auto h-7 w-7 text-gray-600" /><p className="mt-3 text-sm font-bold text-gray-300">아직 발굴한 아이템이 없습니다.</p><p className="mt-1 text-sm leading-6 text-gray-500">상품을 직접 등록하면 이곳에 모입니다.</p></div>
            )}
          </div>
        </div>
      </div>
    )}
    {isDeleteConfirmOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.68)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300">
            <Trash2 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-black text-white">계정을 삭제할까요?</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
            계정을 삭제하면 프로필, 옷장, DIGBOX, 내 사이즈 정보가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <label className="mt-5 block text-left">
            <span className="mb-2 block text-xs font-black text-gray-500">
              계속하려면 <span className="text-red-300">삭제</span>를 입력해 주세요.
            </span>
            <input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              disabled={isDeletingAccount}
              placeholder="삭제"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-red-400/60"
            />
          </label>
          {deleteAccountError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
              {deleteAccountError}
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={closeDeleteConfirm}
              disabled={isDeletingAccount}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canConfirmDelete) return;
                onDeleteAccount();
              }}
              disabled={!canConfirmDelete || isDeletingAccount}
              className="h-11 rounded-xl bg-red-500 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
            >
              {isDeletingAccount ? "삭제 중..." : "계정 삭제"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
