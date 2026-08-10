import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent, PointerEvent, RefObject, SyntheticEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ExternalLink, X } from "lucide-react";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ClosetSizeSelection, MySizeProfile, Product } from "../types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing module imports.
import { DEFAULT_PRODUCT_PLACEHOLDER } from "../constants";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { MySizesProvider, useMySizesContext } from "../contexts/MySizesContext";
import { useAuthContext } from "../contexts/AuthContext";
import { SizeSelectionSheet } from "./SizeSelectionSheet";
import { usePresence } from "../hooks/usePresence";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "./OnboardingTutorial";
import {
  compareMeasurementSnapshots,
  displayTableCell,
  getDisplaySizeTable,
  isPrimaryColumnHeader,
} from "../utils/sizeTable";
import { captureEvent } from "../utils/analytics";
import { ClosetIcon } from "./icons/ClosetIcon";
import { ProductSummaryDetailsPanel } from "./taste-graph/ProductTasteDecision";
import { buildLoginHref } from "../utils/authNavigation";
import { getProductPageUrl } from "../utils/product";

interface ProductDetailModalProps {
  product: Product;
  closetProduct?: Product | null;
  activeRowIndex: number | null;
  onClose: () => void;
  onRowClick: (rowIndex: number) => void;
  onRecommendationClick: (product: Product) => void;
  onZoomImage: () => void;
  onImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
  modalRef: RefObject<HTMLDivElement | null>;
  onToggleCloset?: (selection?: ClosetSizeSelection | null) => void;
  isInCloset?: boolean;
  onToggleDigbox?: () => void;
  isInDigbox?: boolean;
  onCollectionActionStart?: (anchorRect?: TutorialAnchorRect) => void;
  hideDigboxButton?: boolean;
  hideCollectionActions?: boolean;
  showGuestDigboxHint?: boolean;
  otherDigboxCount?: number;
  otherDigboxCountLabel?: string;
  analyticsSource?: string;
}

function trapDialogFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
  if (!focusable.length) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeElement = document.activeElement;
  const focusIsInsideDialog = activeElement instanceof Node && event.currentTarget.contains(activeElement);
  if (event.shiftKey && (!focusIsInsideDialog || activeElement === event.currentTarget || activeElement === first)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (!focusIsInsideDialog || activeElement === last)) {
    event.preventDefault();
    first.focus();
  }
}

function getClosetSizeLabel(product?: Product | null): string {
  return String(product?.closetSelectedSizeLabel || "").trim();
}

function getClosetSizeRowIndex(product?: Product | null): number | null {
  return Number.isInteger(product?.closetSelectedSizeRowIndex) ? product!.closetSelectedSizeRowIndex! : null;
}

function SavedSizeSummary({ product }: { product?: Product | null }) {
  const label = getClosetSizeLabel(product);
  if (!label) return null;

  return (
    <p className="flex items-baseline gap-2 text-sm">
      <span className="text-xs font-semibold text-gray-500">보유 사이즈</span>
      <span className="font-bold text-gray-100">{label}</span>
    </p>
  );
}

function MySizePickerOverlay({
  open,
  profiles,
  selectedProfile,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  onClose,
}: {
  open: boolean;
  profiles: MySizeProfile[];
  selectedProfile?: MySizeProfile | null;
  selectedId: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (profileId: string) => void;
  onClose: () => void;
}) {
  const presence = usePresence(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!presence.isMounted) return null;

  const otherProfiles = profiles.filter((profile) => profile.id !== selectedId);
  const selectedSizeLabel = selectedProfile
    ? String(selectedProfile.sizeLabel || selectedProfile.measurementSnapshot.row?.[0] || "").trim()
    : "";

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div className="ui-layer-scrim absolute inset-0 bg-black/72" data-visible={presence.isVisible} onClick={onClose} />
      <section
        aria-label="비교 기준 변경"
        aria-modal="true"
        role="dialog"
        className="ui-layer-sheet ui-my-size-picker ui-panel relative flex max-h-[min(88dvh,42rem)] w-full max-w-md flex-col rounded-t-3xl px-5 pb-5 pt-3 shadow-[0_-24px_60px_rgba(0,0,0,0.45)] sm:rounded-3xl sm:p-6 sm:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        data-visible={presence.isVisible}
      >
        <div className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-white/[0.16] sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-bold text-white">비교 기준 변경</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">현재 상품과 비교할 내 옷을 선택하세요.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-[background-color,color] hover:bg-white/[0.07] hover:text-white" aria-label="비교 기준 변경 닫기">
            <X className="h-4 w-4" />
          </button>
        </div>
        {selectedProfile && (
          <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/[0.08] px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-orange-300">현재 기준</p>
            <p className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-orange-200">{selectedProfile.brand || "브랜드 미등록"}</p>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-bold text-white">{selectedProfile.title || "저장한 상품"}</p>
              {selectedSizeLabel ? <span className="shrink-0 rounded-md bg-orange-400 px-1.5 py-0.5 text-[10px] font-black text-black">{selectedSizeLabel}</span> : null}
            </div>
            {selectedProfile.fitNote && <p className="mt-1 truncate text-xs font-semibold text-orange-100/60">{selectedProfile.fitNote}</p>}
          </div>
        )}
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="브랜드, 상품명 또는 메모 검색"
          className="mt-5 h-11 w-full rounded-xl border border-white/[0.1] bg-black/25 px-3 text-sm font-semibold text-white outline-none transition-[border-color,background-color] placeholder:text-gray-600 focus:border-orange-400/70 focus:bg-black/35"
        />
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {otherProfiles.length > 0 && <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-gray-500">다른 내 옷</p>}
          <div className="grid gap-1">
          {otherProfiles.length > 0 ? otherProfiles.map((profile) => {
            const sizeLabel = String(profile.sizeLabel || profile.measurementSnapshot.row?.[0] || "").trim();
            const brand = String(profile.brand || "브랜드 미등록").trim();
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-transparent bg-transparent px-3 py-3 text-left transition-[background-color,border-color,color] hover:border-white/[0.1] hover:bg-white/[0.045]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black uppercase tracking-wide text-gray-500">{brand}</p>
                  <p className="truncate text-sm font-bold text-white">{profile.title || "저장한 상품"}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-500">{profile.fitNote || "착용감 메모 없음"}</p>
                </div>
                {sizeLabel ? <span className="shrink-0 rounded-md bg-white/[0.08] px-2 py-1 text-[11px] font-bold text-gray-300">{sizeLabel}</span> : null}
              </button>
            );
          }) : (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-6 text-center text-sm font-semibold text-gray-500">다른 비교 기준이 없습니다.</div>
          )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductDetailModalContent({
  product,
  closetProduct,
  activeRowIndex,
  onClose,
  onRowClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing component contract.
  onRecommendationClick,
  onZoomImage,
  onImageError,
  modalRef,
  onToggleCloset,
  isInCloset,
  onToggleDigbox,
  isInDigbox,
  onCollectionActionStart,
  hideDigboxButton,
  hideCollectionActions,
  showGuestDigboxHint = false,
  otherDigboxCount = 0,
  otherDigboxCountLabel,
  analyticsSource = "product_modal",
}: ProductDetailModalProps) {
  const router = useRouter();
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const saveButtonSeenRef = useRef<string | null>(null);
  const { authUser } = useAuthContext();
  const canUseCloset = Boolean(authUser);
  useBodyScrollLock(modalRef);
  const sizeTableTouchStartX = useRef<number | null>(null);
  const sizeTableTouchStartY = useRef<number | null>(null);
  const sizeTableIsScrolling = useRef(false);

  useEffect(() => {
    captureEvent("product_opened", { product_id: product.id, source: analyticsSource });
  }, [analyticsSource, product.id]);

  useEffect(() => {
    if (!onToggleDigbox || hideCollectionActions || hideDigboxButton) return;
    const eventKey = `${product.id}:${analyticsSource}`;
    if (saveButtonSeenRef.current === eventKey) return;
    saveButtonSeenRef.current = eventKey;
    captureEvent("save_button_seen", {
      product_id: product.id,
      source: analyticsSource,
      logged_in: Boolean(authUser),
      already_saved: Boolean(isInDigbox),
    });
  }, [analyticsSource, authUser, hideCollectionActions, hideDigboxButton, isInDigbox, onToggleDigbox, product.id]);
  const sizeTableSuppressClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDownSelectedRowRef = useRef<number | null>(null);
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false);
  const [pressedSizeRowIndex, setPressedSizeRowIndex] = useState<number | null>(null);
  const [isExtraMeasurementsOpen, setIsExtraMeasurementsOpen] = useState(false);
  const [isMySizePickerOpen, setIsMySizePickerOpen] = useState(false);
  const mySizeChangeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [mySizeSearchQuery, setMySizeSearchQuery] = useState("");
  const [activeTutorial, setActiveTutorial] = useState<{ id: TutorialId; anchorRect?: TutorialAnchorRect } | null>(null);
  const { mySizes, ensureLoaded: ensureMySizesLoaded } = useMySizesContext();
  const [selectedMySizeId, setSelectedMySizeId] = useState<string>("");
  const savedClosetProduct = closetProduct || null;
  const savedSizeRowIndex = getClosetSizeRowIndex(savedClosetProduct);
  const [insightProduct, setInsightProduct] = useState<Product>(product);
  const displaySizeTable = useMemo(() => getDisplaySizeTable(product), [product]);
  const displayProduct = useMemo(
    () => ({ ...product, sizeTable: displaySizeTable }),
    [displaySizeTable, product]
  );

  useEffect(() => {
    ensureMySizesLoaded();
  }, [ensureMySizesLoaded]);

  useEffect(() => {
    let cancelled = false;
    setInsightProduct(product);

    void fetch(`/api/products/${encodeURIComponent(product.id)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json() as { ok?: boolean; data?: { product?: Product } };
        return payload.ok ? payload.data?.product ?? null : null;
      })
      .then((detail) => {
        if (!cancelled && detail?.id === product.id) setInsightProduct(detail);
      })
      .catch(() => {
        // Keep the lightweight catalog product if detail enrichment is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [product]);

  useEffect(() => {
    return () => {
      if (sizeTableSuppressClickTimer.current) clearTimeout(sizeTableSuppressClickTimer.current);
      if (pointerDownTimerRef.current) clearTimeout(pointerDownTimerRef.current);
    };
  }, []);

  const categoryMySizes = useMemo(
    () => mySizes.filter((profile) => profile.category === product.category),
    [mySizes, product.category]
  );
  const mySizeSelectionCategory = String(product.category || "").trim().toLowerCase();
  const mySizeSelectionStorageKey = authUser?.id && mySizeSelectionCategory
    ? `sizepicker:last-my-size:${authUser.id}:${mySizeSelectionCategory}`
    : null;
  const selectedMySize = useMemo(() => {
    if (!categoryMySizes.length) return null;
    return categoryMySizes.find((profile) => profile.id === selectedMySizeId) || categoryMySizes[0];
  }, [categoryMySizes, selectedMySizeId]);
  const filteredMySizes = useMemo(() => {
    const query = mySizeSearchQuery.trim().toLowerCase();
    if (!query) return categoryMySizes;
    return categoryMySizes.filter((profile) =>
      `${profile.brand || ""} ${profile.title} ${profile.sizeLabel || ""} ${profile.fitNote || ""}`.toLowerCase().includes(query)
    );
  }, [categoryMySizes, mySizeSearchQuery]);
  const activeProductSnapshot = useMemo(() => {
    if (activeRowIndex === null || !displaySizeTable?.rows?.[activeRowIndex]) return null;
    return {
      headers: displaySizeTable.headers,
      row: displaySizeTable.rows[activeRowIndex],
    };
  }, [activeRowIndex, displaySizeTable]);
  const mySizeComparisons = useMemo(
    () => compareMeasurementSnapshots(activeProductSnapshot, selectedMySize?.measurementSnapshot),
    [activeProductSnapshot, selectedMySize]
  );
  const isSelectedMySizeSourceProduct = selectedMySize?.sourceProductId === product.id;
  const activeSizeLabel = String(activeProductSnapshot?.row?.[0] ?? "").trim();

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => restoreFocusRef.current?.focus();
  }, []);

  const closeMySizePicker = () => {
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
    requestAnimationFrame(() => mySizeChangeButtonRef.current?.focus());
  };

  useEffect(() => {
    setIsExtraMeasurementsOpen(false);
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
  }, [product.id]);

  useEffect(() => {
    const storedProfileId = mySizeSelectionStorageKey ? window.localStorage.getItem(mySizeSelectionStorageKey) : null;
    const storedProfileStillExists = storedProfileId && categoryMySizes.some((profile) => profile.id === storedProfileId);
    setSelectedMySizeId(storedProfileStillExists ? storedProfileId : categoryMySizes[0]?.id || "");
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
  }, [categoryMySizes, mySizeSelectionStorageKey]);

  const showTutorialOnce = (tutorialId: TutorialId, anchorRect?: TutorialAnchorRect) => {
    const storageKey = `sizepicker:tutorial:v2:${tutorialId}`;
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "true");
    setActiveTutorial({ id: tutorialId, anchorRect });
  };

  const handleRowClick = (rowIndex: number, anchorRect?: TutorialAnchorRect) => {
    onRowClick(rowIndex);
    showTutorialOnce("sizeRecommendations", anchorRect);
  };

  const clearSizeTableClickSuppressionSoon = () => {
    if (sizeTableSuppressClickTimer.current) {
      clearTimeout(sizeTableSuppressClickTimer.current);
    }
    sizeTableSuppressClickTimer.current = setTimeout(() => {
      sizeTableIsScrolling.current = false;
      sizeTableSuppressClickTimer.current = null;
    }, 180);
  };

  const handleSizeTableTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    sizeTableTouchStartX.current = touch?.clientX ?? null;
    sizeTableTouchStartY.current = touch?.clientY ?? null;
    sizeTableIsScrolling.current = false;
    if (sizeTableSuppressClickTimer.current) {
      clearTimeout(sizeTableSuppressClickTimer.current);
      sizeTableSuppressClickTimer.current = null;
    }
  };

  const handleSizeTableTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const startX = sizeTableTouchStartX.current;
    const startY = sizeTableTouchStartY.current;
    const touch = event.touches[0];
    if (startX === null || startY === null || !touch) return;

    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (dx > 8 && dx > dy) {
      sizeTableIsScrolling.current = true;
      setPressedSizeRowIndex(null);
      if (pointerDownTimerRef.current) {
        clearTimeout(pointerDownTimerRef.current);
        pointerDownTimerRef.current = null;
      }
    }
  };

  const handleSizeTableTouchEnd = () => {
    sizeTableTouchStartX.current = null;
    sizeTableTouchStartY.current = null;
    if (sizeTableIsScrolling.current) {
      clearSizeTableClickSuppressionSoon();
    }
  };

  const handleSizeTableRowPointerDown = (event: PointerEvent<HTMLTableRowElement>, rowIndex: number) => {
    setPressedSizeRowIndex(rowIndex);
    if (event.pointerType !== "touch") return;
    if (pointerDownTimerRef.current) clearTimeout(pointerDownTimerRef.current);
    pointerDownSelectedRowRef.current = null;

    pointerDownTimerRef.current = setTimeout(() => {
      pointerDownTimerRef.current = null;
      if (!sizeTableIsScrolling.current) {
        pointerDownSelectedRowRef.current = rowIndex;
        handleRowClick(rowIndex, getAnchorRect(event));
      }
    }, 100);
  };

  const handleSizeTableRowClick = (event: MouseEvent<HTMLTableRowElement>, rowIndex: number) => {
    setPressedSizeRowIndex(null);
    if (pointerDownTimerRef.current) {
      clearTimeout(pointerDownTimerRef.current);
      pointerDownTimerRef.current = null;
    }
    if (pointerDownSelectedRowRef.current === rowIndex) {
      pointerDownSelectedRowRef.current = null;
      return;
    }
    pointerDownSelectedRowRef.current = null;

    if (sizeTableIsScrolling.current) {
      event.preventDefault();
      event.stopPropagation();
      clearSizeTableClickSuppressionSoon();
      return;
    }
    handleRowClick(rowIndex, getAnchorRect(event));
  };

  const handleSizeTableRowKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>, rowIndex: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleRowClick(rowIndex, getAnchorRect(event));
  };

  const getAnchorRect = (event: { currentTarget: HTMLElement }): TutorialAnchorRect => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  const handleClosetClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onToggleCloset) return;
    onCollectionActionStart?.(getAnchorRect(event));
    if (isInCloset) {
      onToggleCloset(null);
      return;
    }
    setIsSizeSheetOpen(true);
  };

  const handleConfirmClosetSize = (selection: ClosetSizeSelection | null) => {
    setIsSizeSheetOpen(false);
    onToggleCloset?.(selection);
  };

  const handleMissingMySizeAction = () => {
    if (!authUser) {
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.push(buildLoginHref("login", returnTo));
      return;
    }
    router.push("/mypage");
  };

  const handleSimilarProductsClick = () => {
    router.push(`${getProductPageUrl(product)}/similar`);
  };

  const closeModal = () => presence.requestClose(onClose);

  return (
    <>
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="ui-layer-scrim absolute inset-0 bg-black/70 backdrop-blur-sm" data-visible={presence.isVisible} onClick={closeModal} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-modal-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          trapDialogFocus(event);
          if (event.key === "Escape") closeModal();
        }}
        className="ui-product-detail-modal ui-layer-modal ui-floating-surface relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-[#1c1c1f] shadow-[0_24px_60px_rgba(0,0,0,0.38)] outline-none md:h-[80.4vh] md:max-h-none md:w-[91%] md:max-w-[58.24rem]"
        data-visible={presence.isVisible}
      >
        <div className="z-10 flex flex-shrink-0 flex-nowrap items-center justify-between rounded-t-3xl border-b border-white/10 bg-[#1c1c1f] px-3 py-2 text-white sm:px-6 sm:py-3">
          <h3 id="product-detail-modal-title" className="shrink-0 text-base font-bold text-white sm:text-xl">상품 상세</h3>
          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            {!hideCollectionActions && !hideDigboxButton && (
            <div className="group relative">
              <button
                type="button"
                aria-label={isInDigbox ? "저장됨" : "저장하기"}
                aria-pressed={isInDigbox}
                data-active={isInDigbox}
                onClick={(event) => {
                  onCollectionActionStart?.(getAnchorRect(event));
                  onToggleDigbox?.();
                }}
                className={`ui-detail-toolbar-button ui-detail-toolbar-button--digbox inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 ${
                  isInDigbox
                    ? "border-yellow-300/45 bg-yellow-400/[0.11] text-yellow-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-white/[0.12] bg-white/[0.045] text-gray-300"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isInDigbox ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{isInDigbox ? "저장됨" : "저장"}</span>
              </button>
            </div>
            )}
            {canUseCloset && !hideCollectionActions && !(hideDigboxButton && isInCloset) && (
            <div className="group relative">
              <button
                type="button"
                aria-label={isInCloset ? "옷장에 있음" : "옷장"}
                aria-pressed={isInCloset}
                data-active={isInCloset}
                onClick={handleClosetClick}
                className={`ui-detail-toolbar-button ui-detail-toolbar-button--closet inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 ${
                  isInCloset
                    ? "border-orange-300/50 bg-orange-500/[0.14] text-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-white/[0.12] bg-white/[0.045] text-gray-300"
                }`}
              >
                <ClosetIcon className="h-4 w-4" />
                <span>{isInCloset ? "옷장에 있음" : "옷장"}</span>
              </button>
            </div>
            )}
            <button
              type="button"
              aria-label="상품 상세 닫기"
              onClick={closeModal}
              className="ui-detail-toolbar-button ui-detail-toolbar-button--close inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.045] text-gray-300 transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={modalRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
        <div className="relative z-[1] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <button
              type="button"
              onClick={onZoomImage}
              className="relative isolate h-[15.5rem] w-full max-w-[22rem] self-center cursor-zoom-in overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(30,38,54,0.42),rgba(8,11,18,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:h-[19rem] md:w-[19rem] md:max-w-none"
            >
              <div className="pointer-events-none absolute inset-[-10%] rounded-[32px] bg-[radial-gradient(circle,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_36%,rgba(255,255,255,0.02)_52%,transparent_74%)] opacity-80 blur-xl" />
              <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015)_40%,transparent_100%)]" />
              <div className="absolute inset-2 z-[1]">
                <ProgressiveImage
                  src={product.image}
                  thumbnailSrc={product.thumbnailImage}
                  alt={product.name}
                  className="object-contain"
                  loading="eager"
                  onError={onImageError}
                />
              </div>
            </button>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-500">
                <span className="rounded-md bg-orange-500/10 px-2 py-0.5 uppercase">{product.brand}</span>
                <span className="text-gray-500">{product.category}</span>
              </div>
              <h4 className="mb-2 text-2xl font-bold text-white">{product.name}</h4>
              <ProductSummaryDetailsPanel product={insightProduct} />
              <div className="mt-3 space-y-2">
                {savedClosetProduct ? <SavedSizeSummary product={savedClosetProduct} /> : null}
                {product.url ? (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-gray-400 transition-colors hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1f]"
                  >
                    공식 홈페이지 <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-gray-600">URL 없음</span>
                )}
              </div>
              {(product.registeredBy || otherDigboxCount > 0) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500">
                  {product.registeredBy && <span>발굴한 사람: <span className="text-gray-200">{product.registeredBy}</span></span>}
                  {otherDigboxCount > 0 && <span>{otherDigboxCountLabel || `이 발굴 상품을 ${otherDigboxCount}명이 저장했어요`}</span>}
                </div>
              )}
            </div>
          </div>

          {showGuestDigboxHint && !isInDigbox ? (
            <p role="status" className="mt-4 rounded-xl border border-yellow-300/20 bg-yellow-300/[0.06] px-3 py-2 text-xs font-semibold leading-5 text-yellow-100">
              마음에 드는 상품은 상단의 저장 버튼으로 담아 내 취향을 찾아보세요.
            </p>
          ) : null}

          <section className="mt-8 border-t border-white/[0.08] pt-6" aria-labelledby="size-selection-title">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h5 id="size-selection-title" className="text-sm font-bold text-white">사이즈 선택</h5>
                <p className="mt-1 text-xs font-semibold text-gray-500">행을 선택하면 내 사이즈와 바로 비교할 수 있어요.</p>
              </div>
              {displaySizeTable?.headers?.length ? (
                <span className="shrink-0 text-[11px] font-semibold text-gray-500">단위: cm</span>
              ) : null}
            </div>
          {categoryMySizes.length > 0 && selectedMySize && (
            <div className="mb-3 flex min-h-11 w-full min-w-0 items-center justify-between gap-3 px-2 py-2">
              <span className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 text-xs font-bold text-gray-500">내 기준</span>
                <span className="min-w-0 truncate text-sm font-bold text-gray-200">
                  <span className="text-orange-300">{selectedMySize.brand || "브랜드 미등록"}</span>
                  <span className="text-gray-600" aria-hidden="true"> · </span>
                  {selectedMySize.title || "저장한 상품"}
                </span>
              </span>
              <button
                ref={mySizeChangeButtonRef}
                type="button"
                onClick={(event) => {
                  showTutorialOnce("mySizeCompare", getAnchorRect(event));
                  setIsMySizePickerOpen(true);
                }}
                aria-expanded={isMySizePickerOpen}
                aria-label={`비교할 내 상품 변경: ${selectedMySize.brand || "브랜드 미등록"} ${selectedMySize.title}`}
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-xs font-bold text-orange-300 underline decoration-orange-300/45 underline-offset-4 transition-[background-color,color] hover:bg-orange-400/[0.08] hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1f]"
              >
                변경
              </button>
            </div>
          )}
          {categoryMySizes.length === 0 && (
            <div className="ui-size-comparison-result mb-3 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-orange-400/20 bg-orange-500/[0.06] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-orange-100">My Size가 없어요</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-orange-100/55">내 옷을 등록하면 바로 비교할 수 있어요.</p>
              </div>
              <button
                type="button"
                onClick={handleMissingMySizeAction}
                className="ui-size-comparison-action min-h-11 shrink-0 rounded-lg border border-orange-300/45 bg-orange-400/[0.13] px-3 py-1.5 text-xs font-bold text-orange-100 transition-[background-color,border-color,color,transform] duration-150 hover:border-orange-200/70 hover:bg-orange-400/[0.22] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
              >
                {!authUser ? "로그인하고 등록" : "My Size 등록하기"}
              </button>
            </div>
          )}
          <div
            className="relative touch-manipulation overflow-x-auto overscroll-x-contain rounded-[22px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.022)_28%,rgba(255,255,255,0.018)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onTouchStart={handleSizeTableTouchStart}
            onTouchMove={handleSizeTableTouchMove}
            onTouchEnd={handleSizeTableTouchEnd}
            onTouchCancel={handleSizeTableTouchEnd}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_55%,transparent)]" />
            {displaySizeTable?.headers?.length ? (
              <table className="relative z-[1] min-w-full w-max text-center text-[11px] sm:text-sm">
                <thead className="text-[11px] sm:text-sm">
                  <tr>
                    {displaySizeTable.headers.map((header, index) => (
                      <th
                        key={index}
                        className={`whitespace-nowrap bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] px-2 py-2.5 text-xs font-bold uppercase sm:px-4 sm:py-3 sm:text-sm ${index === 0 ? "border-r border-white/[0.04]" : ""}`}
                        style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#9CA3AF" }}
                      >
                        {String(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displaySizeTable.rows.map((row, rowIndex) => {
                    const isActiveRow = activeRowIndex === rowIndex;
                    const isSavedRow = savedSizeRowIndex === rowIndex;
                    const isPressedRow = pressedSizeRowIndex === rowIndex;
                    return (
                      <tr
                        key={rowIndex}
                        onPointerDown={(event) => handleSizeTableRowPointerDown(event, rowIndex)}
                        onPointerUp={() => setPressedSizeRowIndex(null)}
                        onPointerCancel={() => setPressedSizeRowIndex(null)}
                        onPointerLeave={() => setPressedSizeRowIndex(null)}
                        onClick={(event) => handleSizeTableRowClick(event, rowIndex)}
                        onKeyDown={(event) => handleSizeTableRowKeyDown(event, rowIndex)}
                        tabIndex={0}
                        aria-selected={isActiveRow}
                        aria-label={`${String(row[0] ?? "사이즈")}${isSavedRow ? " 보유 사이즈" : ""} ${isActiveRow ? "선택됨" : "선택"}`}
                        className="group cursor-pointer outline-none focus-visible:[&>td]:bg-white/[0.075] focus-visible:[&>td:first-child]:rounded-l-lg focus-visible:[&>td:last-child]:rounded-r-lg"
                      >
                        {row.map((cell, cellIndex) => {
                          return (
                            <td
                              key={cellIndex}
                          className={`whitespace-nowrap px-2 py-2.5 text-[11px] font-medium transition-[background-color,color,opacity] duration-150 sm:px-4 sm:py-3 sm:text-sm ${cellIndex === 0 ? "border-r border-white/[0.04] text-xs font-bold sm:text-sm" : ""} ${cellIndex === 0 && isSavedRow ? "border-l-2 border-l-orange-300/75 pl-1.5 sm:pl-3.5" : ""} ${
                            isActiveRow
                                  ? "bg-orange-500/[0.13] text-orange-50 first:rounded-l-lg last:rounded-r-lg"
                                  : isPressedRow
                                  ? "bg-white/[0.065] text-gray-100 first:rounded-l-lg last:rounded-r-lg"
                                  : isSavedRow
                                  ? "bg-white/[0.045] text-gray-200 first:rounded-l-lg last:rounded-r-lg"
                                  : "bg-transparent text-gray-300 group-hover:bg-white/[0.065] group-hover:text-white group-hover:first:rounded-l-lg group-hover:last:rounded-r-lg"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {displayTableCell(cell)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-gray-300">표시할 사이즈표 데이터가 없습니다.</div>
            )}
          </div>
          </section>

          <div className="mt-4" aria-live="polite" aria-atomic="true">
              {activeRowIndex === null || categoryMySizes.length === 0 ? null : isSelectedMySizeSourceProduct ? (
                <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-200">
                  동일한 상품입니다.
                </div>
              ) : activeRowIndex === null ? null : mySizeComparisons.length > 0 ? (
                <>
                <p className="mt-3 text-xs font-semibold text-gray-500">
                  선택한 상품 사이즈: <span className="font-bold text-orange-200">{activeSizeLabel || "선택한 사이즈"}</span>
                </p>
                <div className="mt-3 touch-manipulation overflow-x-auto overscroll-x-contain rounded-xl border border-white/[0.06] bg-black/20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="min-w-[420px] table-fixed text-left text-xs sm:min-w-full sm:text-sm">
                    <colgroup>
                      <col style={{ width: "96px" }} />
                      <col style={{ width: "88px" }} />
                      <col style={{ width: "80px" }} />
                      <col style={{ width: "72px" }} />
                    </colgroup>
                    <thead className="text-[11px] uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="whitespace-nowrap px-3 py-2 font-black">항목</th>
                        <th className="whitespace-nowrap px-3 py-2 font-black">내 사이즈</th>
                        <th className="whitespace-nowrap px-3 py-2 font-black">현재 상품</th>
                        <th className="whitespace-nowrap px-3 py-2 font-black">차이</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySizeComparisons.map((item) => (
                        <tr key={item.label} className="border-t border-white/[0.06]">
                          <td className="whitespace-nowrap px-3 py-2 font-bold text-gray-200">{item.displayLabel}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-300">{item.referenceValue.toFixed(1).replace(/\.0$/, "")}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-gray-300">{item.productValue.toFixed(1).replace(/\.0$/, "")}</td>
                          <td className={`px-3 py-2 font-black ${item.diff === 0 ? "text-gray-400" : item.diff > 0 ? "text-orange-300" : "text-sky-300"}`}>
                            {item.diff > 0 ? "+" : ""}{item.diff.toFixed(1).replace(/\.0$/, "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              ) : (
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-sm font-semibold text-gray-500">
                  비교 가능한 공통 실측이 없습니다.
                </div>
              )}
            </div>

          {displaySizeTable?.extra?.headers?.length ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setIsExtraMeasurementsOpen((value) => !value)}
                className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                <span>추가 실측 정보</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExtraMeasurementsOpen ? "rotate-180" : ""}`} />
              </button>
              {isExtraMeasurementsOpen ? (
                <div className="overflow-x-auto border-t border-white/[0.06]">
                  <table className="min-w-full w-max text-center text-[11px] sm:text-sm">
                    <thead>
                      <tr>
                        {displaySizeTable.extra.headers.map((header, index) => (
                          <th
                            key={index}
                            className={`whitespace-nowrap bg-white/[0.04] px-2 py-2.5 text-xs font-bold uppercase sm:px-4 sm:py-3 ${index === 0 ? "border-r border-white/[0.04]" : ""}`}
                            style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#9CA3AF" }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displaySizeTable.extra.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-white/[0.04]">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className={`whitespace-nowrap px-2 py-2.5 text-[11px] text-gray-200 sm:px-4 sm:py-3 sm:text-sm ${cellIndex === 0 ? "border-r border-white/[0.04] text-xs font-bold sm:text-sm" : ""}`}
                            >
                              {displayTableCell(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSimilarProductsClick}
            className="group mt-5 flex min-h-[3.25rem] w-full items-center justify-between gap-4 rounded-xl border border-white/[0.16] bg-white/[0.08] px-4 py-2.5 text-left shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-white/[0.28] hover:bg-white/[0.13] hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
          >
            <span className="min-w-0 truncate text-sm font-bold text-white">추천 상품 둘러보기</span>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
          </button>
        </div>
        </div>
      </div>
    </div>
    {isSizeSheetOpen && (
      <SizeSelectionSheet
        product={displayProduct}
        initialRowIndex={activeRowIndex}
        onClose={() => setIsSizeSheetOpen(false)}
        onConfirm={handleConfirmClosetSize}
      />
    )}
    <MySizePickerOverlay
      open={isMySizePickerOpen}
      profiles={filteredMySizes}
      selectedProfile={selectedMySize}
      selectedId={selectedMySizeId}
      query={mySizeSearchQuery}
      onQueryChange={setMySizeSearchQuery}
      onSelect={(profileId) => {
        if (mySizeSelectionStorageKey) window.localStorage.setItem(mySizeSelectionStorageKey, profileId);
        setSelectedMySizeId(profileId);
        closeMySizePicker();
      }}
      onClose={closeMySizePicker}
    />
    {activeTutorial && (
      <OnboardingTutorial
        tutorialId={activeTutorial.id}
        anchorRect={activeTutorial.anchorRect}
        onClose={() => setActiveTutorial(null)}
      />
    )}
    </>
  );
}

export function ProductDetailModal(props: ProductDetailModalProps) {
  return <MySizesProvider><ProductDetailModalContent {...props} /></MySizesProvider>;
}
