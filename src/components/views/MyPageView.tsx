"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, ChevronRight, LogOut, Pencil, Plus, Ruler, Search, Trash2, UserRound, X } from "lucide-react";
import type { DiscoveryProduct, MySizeInput, MySizeProfile, MySizeUpdateInput, Product } from "../../types";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "../OnboardingTutorial";
import { getProductPageUrl } from "../../utils/product";
import { UsernameSetupForm } from "../UsernameSetupForm";

interface MyPageViewProps {
  username: string;
  discoveredProducts: DiscoveryProduct[];
  discoveryTotalSaveCount: number;
  isDiscoveriesLoading: boolean;
  closetProducts: Product[];
  mySizes: MySizeProfile[];
  onCreateMySize: (input: MySizeInput) => Promise<void>;
  onUpdateMySize: (id: string, input: MySizeUpdateInput) => Promise<void>;
  onDeleteMySize: (id: string) => Promise<void>;
  onLogout: () => void;
  onChangeUsername: (username: string) => Promise<void>;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
  deleteAccountError: string | null;
}

const primaryCardClass =
  "ui-panel rounded-[24px] border border-white/[0.08] bg-[#111114] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_18px_46px_rgba(0,0,0,0.32)]";

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

function trapDialogFocus(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    )
  );
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function MySizesManager({
  closetProducts,
  mySizes,
  onCreateMySize,
  onUpdateMySize,
  onDeleteMySize,
}: {
  closetProducts: Product[];
  mySizes: MySizeProfile[];
  onCreateMySize: (input: MySizeInput) => Promise<void>;
  onUpdateMySize: (id: string, input: MySizeUpdateInput) => Promise<void>;
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
  const [pendingProductSelectionId, setPendingProductSelectionId] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [fitNote, setFitNote] = useState("");
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingFitNote, setEditingFitNote] = useState("");
  const [noteEditorPosition, setNoteEditorPosition] = useState<{ top: number; left: number } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<MySizeProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);
  const noteEditorRef = useRef<HTMLTextAreaElement>(null);
  const noteEditorTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingProductSelectionId) return;
    const timeoutId = window.setTimeout(() => {
      setIsProductPickerOpen(false);
      setProductSearchQuery("");
      setPendingProductSelectionId(null);
    }, 110);
    return () => window.clearTimeout(timeoutId);
  }, [pendingProductSelectionId]);

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
    setPendingProductSelectionId(null);
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

  const startEditingProfile = (profile: MySizeProfile, event: React.MouseEvent<HTMLButtonElement>) => {
    noteEditorTriggerRef.current = event.currentTarget;
    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 320;
    const gutter = 12;
    setNoteEditorPosition({
      top: Math.max(gutter, Math.min(rect.bottom + 8, window.innerHeight - 260)),
      left: Math.max(gutter, Math.min(rect.right - popoverWidth, window.innerWidth - popoverWidth - gutter)),
    });
    setEditingProfileId(profile.id);
    setEditingFitNote(profile.fitNote || "");
    setEditError(null);
  };

  const cancelEditingProfile = () => {
    setEditingProfileId(null);
    setEditingFitNote("");
    setNoteEditorPosition(null);
    setEditError(null);
  };

  const saveProfileNote = async (profileId: string) => {
    setEditError(null);
    setIsUpdatingProfile(true);
    try {
      await onUpdateMySize(profileId, { fitNote: editingFitNote.trim() || null });
      cancelEditingProfile();
    } catch (error: unknown) {
      setEditError(error instanceof Error ? error.message : "메모를 수정하지 못했어요.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const confirmDeleteProfile = async () => {
    if (!deleteCandidate) return;
    setDeleteError(null);
    setIsDeletingProfile(true);
    try {
      await onDeleteMySize(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : "My Size를 삭제하지 못했어요.");
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const closeDeleteProfileConfirm = () => {
    if (isDeletingProfile) return;
    setDeleteCandidate(null);
    setDeleteError(null);
  };

  useEffect(() => {
    if (!editingProfileId) return;
    const frameId = window.requestAnimationFrame(() => noteEditorRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frameId);
      noteEditorTriggerRef.current?.focus();
    };
  }, [editingProfileId]);

  useEffect(() => {
    if (!deleteCandidate) return;
    const frameId = window.requestAnimationFrame(() => deleteCancelButtonRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frameId);
      deleteTriggerRef.current?.focus();
    };
  }, [deleteCandidate]);

  return (
    <>
      <section className={`${primaryCardClass} min-w-0 overflow-hidden p-4 sm:p-5`} aria-labelledby="my-size-title">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.045] text-gray-300">
            <Ruler className="h-4 w-4" />
          </span>
          <div>
            <h2 id="my-size-title" className="text-lg font-black tracking-[-0.02em] text-white">My Size</h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500">내 옷에서 저장한 기준 사이즈</p>
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
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-black text-black transition-[background-color,transform] duration-150 hover:bg-orange-400 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding ? "닫기" : "추가"}
        </button>
      </div>

      {isAdding && (
        <div className="my-size-panel-reveal mb-5 border-t border-white/[0.08] pt-4">
          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-gray-500">등록할 옷 선택</label>
            {closetCandidates.length > 0 && (
              <div>
                <button
                  type="button"
                  aria-expanded={isProductPickerOpen}
                  aria-controls="my-size-product-list"
                  onClick={(event) => {
                    showTutorialOnce("mySizeSetup", getAnchorRect(event.currentTarget));
                    setIsProductPickerOpen((value) => !value);
                  }}
                  className={`ui-my-size-pressable flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-[background-color,transform] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none ${
                    selectedProduct
                      ? "bg-orange-500/[0.10] active:bg-orange-500/[0.16]"
                      : "bg-white/[0.045] hover:bg-white/[0.075] active:bg-white/[0.09]"
                  }`}
                >
                  {selectedProduct && (
                    <div className="h-10 w-9 shrink-0 overflow-hidden rounded-lg bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Preserve native loading for the existing product thumbnail. */}
                      <img src={selectedProduct.thumbnailImage || selectedProduct.image} alt="" className="h-full w-full object-contain" />
                    </div>
                  )}
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
                  {selectedProduct && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-orange-200">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" /> 선택됨
                    </span>
                  )}
                  <ChevronRight className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-[var(--duration-popover)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none ${isProductPickerOpen ? "rotate-90" : ""}`} />
                </button>

                {isProductPickerOpen && (
                  <div id="my-size-product-list" className="mt-3 border-t border-white/[0.08] pt-3">
                    <label htmlFor="my-size-product-search" className="sr-only">상품명 또는 브랜드 검색</label>
                    <input
                      id="my-size-product-search"
                      value={productSearchQuery}
                      onChange={(event) => setProductSearchQuery(event.target.value)}
                      placeholder="상품명 또는 브랜드 검색"
                      className="mb-2 h-10 w-full rounded-lg bg-white/[0.045] px-3 text-xs font-semibold text-white outline-none placeholder:text-gray-600 focus-visible:ring-2 focus-visible:ring-orange-300/70"
                    />
                    <div className="grid max-h-[210px] gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                        setPendingProductSelectionId(product.id);
                      }}
                      className={`ui-my-size-pressable flex min-w-0 items-center gap-3 rounded-xl p-2 text-left transition-[background-color,transform] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none ${
                        selected
                          ? "bg-orange-500/[0.10]"
                          : "hover:bg-white/[0.06] active:bg-white/[0.09]"
                      }`}
                    >
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Preserve native loading for the existing product thumbnail. */}
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
                      {selected && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-orange-200">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" /> 선택됨
                        </span>
                      )}
                    </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-4 text-center text-xs font-semibold text-gray-500">
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

          <div className="mt-4">
            <label htmlFor="my-size-fit-note" className="mb-2 block text-[11px] font-black uppercase tracking-wide text-gray-500">
              착용 메모 <span className="normal-case font-semibold text-gray-600">(선택)</span>
            </label>
          <textarea
            id="my-size-fit-note"
            value={fitNote}
            onChange={(event) => setFitNote(event.target.value)}
            placeholder="예: 허리는 편하고 기장은 살짝 김"
            rows={2}
            className="w-full resize-none rounded-xl bg-white/[0.045] px-3 py-3 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-gray-600 focus-visible:ring-2 focus-visible:ring-orange-300/70"
          />
          </div>
          {!selectedProduct && closetCandidates.length > 0 && (
            <p id="my-size-save-hint" className="mt-3 text-xs font-semibold text-gray-500">상품을 선택하면 저장할 수 있어요.</p>
          )}
          {formError && <p className="mt-3 text-sm font-semibold text-red-300">{formError}</p>}
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isSaving || !selectedProduct}
            aria-describedby={!selectedProduct && closetCandidates.length > 0 ? "my-size-save-hint" : undefined}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition-[background-color,transform] duration-150 hover:bg-orange-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 motion-reduce:transform-none motion-reduce:transition-none"
          >
            {isSaving ? "저장 중..." : "My Size 저장"}
          </button>
        </div>
      )}

      {mySizes.length > 0 ? (
        <div className="divide-y divide-white/[0.08]">
          {groupedProfiles.map(([group, profiles]) => {
            const isOpen = openCategories.has(group);
            const categoryId = `my-size-category-${encodeURIComponent(group)}`;
            return (
              <section key={group}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={categoryId}
                  onClick={() => toggleCategory(group)}
                  className="flex w-full items-center justify-between rounded-lg px-1 py-4 text-left transition-[background-color,transform] duration-150 hover:bg-white/[0.035] active:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-wide text-white">{group}</span>
                    <span className="text-[11px] font-bold text-gray-500">{profiles.length}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-[var(--duration-popover)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div id={categoryId} className="border-t border-white/[0.06]">
                    {profiles.map((profile, index) => {
                      const preview = getSnapshotPreview(profile);
                      const isExpanded = expandedProfileId === profile.id;
                      const profileId = `my-size-profile-${profile.id}`;
                      return (
                        <article
                          key={profile.id}
                          className="my-size-profile-row border-b border-white/[0.06] py-3 last:border-b-0"
                          style={{ transitionDelay: `${Math.min(index, 3) * 24}ms` }}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-controls={profileId}
                              onClick={() => setExpandedProfileId((current) => (current === profile.id ? null : profile.id))}
                              className="group min-w-0 flex-1 rounded-lg px-1 py-1 text-left transition-[background-color,transform] duration-150 hover:bg-white/[0.035] active:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-black text-white">{getMySizePrimaryLabel(profile)}</span>
                                  <span className="mt-0.5 block truncate text-xs font-semibold text-gray-500">
                                    {profile.brand ? `${profile.brand} · ` : ""}{profile.title || "상품명 없음"}
                                  </span>
                                </span>
                                <ChevronRight className={`h-4 w-4 shrink-0 text-gray-600 transition-transform duration-[var(--duration-popover)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none ${isExpanded ? "rotate-90" : ""}`} />
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => startEditingProfile(profile, event)}
                              aria-label="마이사이즈 메모 수정"
                              aria-haspopup="dialog"
                              aria-expanded={editingProfileId === profile.id}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                deleteTriggerRef.current = event.currentTarget;
                                setDeleteCandidate(profile);
                                setDeleteError(null);
                              }}
                              aria-label="마이사이즈 삭제"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-[background-color,color,transform] duration-150 hover:bg-red-500/[0.08] hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 motion-reduce:transform-none motion-reduce:transition-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {isExpanded && (
                            <div id={profileId} className="ml-1 mt-2 border-l border-white/[0.12] pl-3">
                              {profile.fitNote && <p className="text-xs font-semibold leading-relaxed text-gray-400">{profile.fitNote}</p>}
                              {preview.length > 0 && (
                                <div className={`${profile.fitNote ? "mt-2" : ""} flex min-w-0 flex-wrap gap-x-3 gap-y-1`}>
                                  {preview.map(({ label, value }) => (
                                    <span key={`${profile.id}-${label}`} className="text-[10px] font-semibold text-gray-500">
                                      {label} <span className="text-gray-300">{value}</span>
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
              </section>
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
      {editingProfileId && noteEditorPosition && createPortal(
        <>
          <button
            type="button"
            aria-label="메모 편집 닫기"
            onClick={() => {
              if (!isUpdatingProfile) cancelEditingProfile();
            }}
            className="fixed inset-0 z-[70] cursor-default"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-size-note-editor-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !isUpdatingProfile) {
                event.preventDefault();
                cancelEditingProfile();
                return;
              }
              trapDialogFocus(event);
            }}
            className="my-size-note-editor fixed z-[71] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-white/[0.12] bg-[#17171b]/95 p-4 shadow-[0_20px_52px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            style={{ top: noteEditorPosition.top, left: noteEditorPosition.left }}
          >
            <h3 id="my-size-note-editor-title" className="text-sm font-black text-white">착용 메모 수정</h3>
            <textarea
              ref={noteEditorRef}
              value={editingFitNote}
              onChange={(event) => setEditingFitNote(event.target.value)}
              placeholder="메모를 입력하세요"
              rows={3}
              disabled={isUpdatingProfile}
              className="mt-3 w-full resize-none rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-gray-600 focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {editError && <p role="alert" className="mt-2 text-xs font-semibold text-red-300">{editError}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEditingProfile}
                disabled={isUpdatingProfile}
                className="rounded-lg px-3 py-2 text-xs font-bold text-gray-400 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void saveProfileNote(editingProfileId)}
                disabled={isUpdatingProfile}
                className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-black transition-[background-color,transform] duration-150 hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 motion-reduce:transform-none motion-reduce:transition-none"
              >
                {isUpdatingProfile ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
      {deleteCandidate && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="my-size-delete-title"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isDeletingProfile) {
              event.preventDefault();
              closeDeleteProfileConfirm();
              return;
            }
            trapDialogFocus(event);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.68)]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 id="my-size-delete-title" className="mt-4 text-lg font-black text-white">My Size를 삭제할까요?</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
              <span className="font-black text-white">{getMySizePrimaryLabel(deleteCandidate)}</span> 사이즈 · {deleteCandidate.title || "저장한 상품"}의 저장 정보와 착용 메모가 삭제됩니다.
            </p>
            <p className="mt-2 text-xs font-semibold text-red-300/80">이 작업은 되돌릴 수 없지만, 옷장 상품은 삭제되지 않습니다.</p>
            {deleteError && <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">{deleteError}</p>}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeDeleteProfileConfirm}
                disabled={isDeletingProfile}
                ref={deleteCancelButtonRef}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteProfile()}
                disabled={isDeletingProfile}
                className="h-11 rounded-xl bg-red-500 text-sm font-black text-white transition-[background-color,transform] duration-150 hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 motion-reduce:transform-none motion-reduce:transition-none"
              >
                {isDeletingProfile ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export function MyPageView({
  username,
  discoveredProducts,
  discoveryTotalSaveCount,
  isDiscoveriesLoading,
  closetProducts,
  mySizes,
  onCreateMySize,
  onUpdateMySize,
  onDeleteMySize,
  onLogout,
  onChangeUsername,
  onDeleteAccount,
  isDeletingAccount,
  deleteAccountError,
}: MyPageViewProps) {
  const pathname = usePathname();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDiscoveriesOpen, setIsDiscoveriesOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isUsernameEditorOpen, setIsUsernameEditorOpen] = useState(false);
  const [usernameChangeError, setUsernameChangeError] = useState<string | null>(null);
  const discoveriesTriggerRef = useRef<HTMLButtonElement>(null);
  const discoveriesCloseButtonRef = useRef<HTMLButtonElement>(null);
  const isProductDetailOpen = pathname.startsWith("/product/");
  const canConfirmDelete = deleteConfirmText.trim() === "삭제";
  const sortedDiscoveredProducts = useMemo(
    () => discoveredProducts
      .map((product, index) => ({ product, index }))
      .sort((left, right) => right.product.saveCount - left.product.saveCount || left.index - right.index)
      .map(({ product }) => product),
    [discoveredProducts]
  );

  const closeDeleteConfirm = () => {
    if (isDeletingAccount) return;
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmText("");
  };

  useEffect(() => {
    if (!isDiscoveriesOpen) return;
    const trigger = discoveriesTriggerRef.current;
    const frameId = window.requestAnimationFrame(() => discoveriesCloseButtonRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frameId);
      trigger?.focus();
    };
  }, [isDiscoveriesOpen]);

  return (
    <>
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 sm:gap-9">
      <section className={`${primaryCardClass} flex items-center gap-4 p-4 sm:p-5`} aria-labelledby="settings-title">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_24px_rgba(249,115,22,0.1)]">
          <UserRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">마이페이지</p>
          <h1 id="settings-title" className="mt-1 break-all text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-[1.75rem]">{username}</h1>
        </div>
      </section>

      <MySizesManager
        closetProducts={closetProducts}
        mySizes={mySizes}
        onCreateMySize={onCreateMySize}
        onUpdateMySize={onUpdateMySize}
        onDeleteMySize={onDeleteMySize}
      />

      <section className={`${primaryCardClass} min-w-0 overflow-hidden p-4 sm:p-5`} aria-labelledby="discoveries-title">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.045] text-gray-300">
            <Search className="h-4 w-4" />
          </span>
          <div>
            <h2 id="discoveries-title" className="text-lg font-black tracking-[-0.02em] text-white">내가 발굴한 아이템</h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500">직접 찾아 저장한 상품</p>
          </div>
        </div>
        <button
          type="button"
          ref={discoveriesTriggerRef}
          onClick={() => setIsDiscoveriesOpen(true)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-4 text-left transition-[background-color,transform] duration-150 hover:bg-white/[0.035] active:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <span className="min-w-0">
            <span className="block text-sm font-black text-white">발굴한 상품 전체보기</span>
            <span className="mt-0.5 block text-xs font-semibold text-gray-500">{isDiscoveriesLoading ? "불러오는 중" : `${discoveredProducts.length}개 상품 · 다른 사용자 ${discoveryTotalSaveCount}회 저장`}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
        </button>
      </section>

      <section aria-labelledby="account-settings-title">
        <h2 id="account-settings-title" className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-gray-500">계정 관리</h2>
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111114]">
          <button
            type="button"
            onClick={() => { setUsernameChangeError(null); setIsUsernameEditorOpen((open) => !open); }}
            className="flex min-h-[3.5rem] w-full items-center gap-3 px-4 text-left transition-colors duration-150 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300/70 motion-reduce:transition-none"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><UserRound className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-black text-gray-200">사용자 이름 변경</span><span className="mt-0.5 block break-all text-xs font-semibold text-gray-500">현재 {username}</span></span>
            <ChevronRight className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${isUsernameEditorOpen ? "rotate-90" : ""}`} />
          </button>
          {isUsernameEditorOpen && <div className="border-t border-white/10 px-4 py-5"><p className="text-sm font-semibold leading-relaxed text-gray-400">이전 사용자 이름은 14일 동안만 다시 선택할 수 있어요. 그 뒤에는 다른 사용자가 사용할 수 있어요.</p><UsernameSetupForm initialUsername={username} submitLabel="사용자 이름 변경" showSuggestions={false} onSuggestionSelected={() => {}} onSubmit={async (nextUsername) => { try { await onChangeUsername(nextUsername); setIsUsernameEditorOpen(false); } catch (error) { const message = error instanceof Error ? error.message : "사용자 이름을 변경하지 못했어요."; setUsernameChangeError(message); throw error; } }} />{usernameChangeError && <p role="alert" className="mt-3 text-sm font-semibold text-red-300">{usernameChangeError}</p>}</div>}
          <div className="mx-4 border-t border-white/[0.07]" />
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex min-h-[3.5rem] w-full items-center gap-3 px-4 text-left transition-colors duration-150 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300/70 motion-reduce:transition-none"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gray-300">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-gray-200">로그아웃</span>
              <span className="mt-0.5 block text-xs font-semibold text-gray-500">현재 기기에서 로그아웃합니다</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
          </button>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/[0.035]">
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={isDeletingAccount}
            className="flex min-h-[3.5rem] w-full items-center gap-3 px-4 text-left transition-colors duration-150 hover:bg-red-500/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
              <Trash2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-red-200">{isDeletingAccount ? "계정 삭제 중..." : "계정 삭제"}</span>
              <span className="mt-0.5 block text-xs font-semibold text-red-300/65">계정과 저장된 데이터를 영구적으로 삭제합니다</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-red-300/55" />
          </button>
        </div>
        {deleteAccountError && <p className="mt-3 text-sm font-semibold text-red-300">{deleteAccountError}</p>}
      </section>
    </div>
    {isLogoutConfirmOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.65)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
            <LogOut className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-black text-white">로그아웃할까요?</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
            현재 계정에서 로그아웃됩니다. 저장된 옷장과 저장 목록은 계정에 그대로 유지됩니다.
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
    {isDeleteConfirmOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.68)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300">
            <Trash2 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-black text-white">계정을 삭제할까요?</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
            계정을 삭제하면 프로필, 옷장, 저장 목록, 내 사이즈 정보가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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
    {isDiscoveriesOpen && (
      <div
        className="fixed inset-0 z-[64] flex items-end justify-center bg-black/75 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-8"
        role="dialog"
        aria-hidden={isProductDetailOpen}
        aria-modal={isProductDetailOpen ? undefined : "true"}
        aria-label="내가 발굴한 아이템 성과"
        inert={isProductDetailOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setIsDiscoveriesOpen(false);
            return;
          }
          trapDialogFocus(event);
        }}
      >
        <div className="my-discoveries-panel flex max-h-[min(780px,calc(100vh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#151518] shadow-[0_24px_64px_rgba(0,0,0,0.68)]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <div><p className="text-xs font-bold uppercase text-orange-300">MY DISCOVERIES</p><h2 className="mt-1 text-lg font-black text-white">발굴 아이템 성과</h2></div>
            <button ref={discoveriesCloseButtonRef} type="button" onClick={() => setIsDiscoveriesOpen(false)} aria-label="발굴 아이템 성과 닫기" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-white/30 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {isDiscoveriesLoading ? <p className="py-12 text-center text-sm font-semibold text-gray-500">발굴한 아이템을 불러오는 중입니다.</p> : discoveredProducts.length ? (
              <>
                <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3"><p className="text-[11px] font-black uppercase tracking-wide text-gray-500">발굴한 상품</p><p className="mt-1 text-xl font-black tracking-[-0.02em] text-white">{discoveredProducts.length}<span className="ml-1 text-sm text-gray-400">개</span></p></div>
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.08] px-4 py-3"><p className="text-[11px] font-black uppercase tracking-wide text-orange-200/80">다른 사용자 저장</p><p className="mt-1 text-xl font-black tracking-[-0.02em] text-orange-100">{discoveryTotalSaveCount}<span className="ml-1 text-sm text-orange-200/80">회</span></p></div>
                </div>
                <p className="mb-3 text-xs font-semibold text-gray-500">저장 많은 순으로 정렬했어요.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- Preserve native loading for the existing discovery thumbnails. */}
                {sortedDiscoveredProducts.map((product) => <Link key={product.id} href={getProductPageUrl(product)} className="group min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] no-underline transition hover:border-orange-400/60"><div className="aspect-square bg-white/[0.04]"><img src={product.thumbnailImage || product.image} alt={product.name} className="h-full w-full object-contain transition duration-[var(--duration-layer-enter)] group-hover:scale-[1.03]" /></div><div className="min-w-0 p-3"><p className="truncate text-[11px] font-bold uppercase text-orange-300">{product.brand}</p><p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-white">{product.name}</p><p className={`mt-2 text-xs font-black ${product.saveCount > 0 ? "text-orange-200" : "text-gray-500"}`}>{product.saveCount > 0 ? `${product.saveCount}명이 저장했어요` : "아직 저장한 사람이 없어요"}</p></div></Link>)}
              </div>
              </>
            ) : <div className="py-12 text-center"><Search className="mx-auto h-7 w-7 text-gray-600" /><p className="mt-3 text-sm font-bold text-gray-300">아직 발굴한 아이템이 없습니다.</p></div>}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
