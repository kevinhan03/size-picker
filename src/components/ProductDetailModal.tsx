import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent, PointerEvent, RefObject, SyntheticEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Network, X } from "lucide-react";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ClosetSizeSelection, MySizeProfile, Product, RelatedGraphReason } from "../types";
import { DEFAULT_PRODUCT_PLACEHOLDER } from "../constants";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useMySizesContext } from "../contexts/MySizesContext";
import { useAuthContext } from "../contexts/AuthContext";
import { useClosetContext } from "../contexts/ClosetContext";
import { useProductsContext } from "../contexts/ProductsContext";
import { SizeSelectionSheet } from "./SizeSelectionSheet";
import { usePresence } from "../hooks/usePresence";
import { OnboardingTutorial, type TutorialAnchorRect, type TutorialId } from "./OnboardingTutorial";
import { ProductRelatedGraphModal } from "./product-related/ProductRelatedGraphModal";
import {
  compareMeasurementSnapshots,
  displayTableCell,
  getDisplaySizeTable,
  isPrimaryColumnHeader,
} from "../utils/sizeTable";
import { captureEvent } from "../utils/analytics";
import { ClosetIcon } from "./icons/ClosetIcon";
import { ProductTasteDecisionPanel } from "./taste-graph/ProductTasteDecision";
import { getProductTasteDecision, styleTagLabel } from "../utils/tasteGraph";
import { buildLoginHref } from "../utils/authNavigation";

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
  hideRelatedGraphButton?: boolean;
  onRelatedGraphRequest?: () => void;
  relatedGraphButtonLabel?: string;
  relatedGraphReason?: RelatedGraphReason | null;
  showGuestDigboxHint?: boolean;
  otherDigboxCount?: number;
  otherDigboxCountLabel?: string;
  analyticsSource?: string;
}

function getClosetSizeLabel(product?: Product | null): string {
  return String(product?.closetSelectedSizeLabel || "").trim();
}

function getRelatedGraphReasonCopy(reason: RelatedGraphReason) {
  if (reason.recommendationType === "mood") {
    const sharedStyles = reason.sharedTags.slice(0, 2).map(({ tag }) => styleTagLabel(tag));
    return sharedStyles.length
      ? `이 상품과 ${sharedStyles.join(" · ")} 스타일이 비슷해요.`
      : "이 상품과 유사한 스타일의 다른 상품이에요.";
  }

  return `이미지 유사도 ${Math.round(reason.similarity * 100)}% · 연결된 상품을 탐색해 보세요.`;
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

export function ProductDetailModal({
  product,
  closetProduct,
  activeRowIndex,
  onClose,
  onRowClick,
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
  hideRelatedGraphButton,
  onRelatedGraphRequest,
  relatedGraphButtonLabel = "비슷한 상품 보기",
  relatedGraphReason,
  showGuestDigboxHint = false,
  otherDigboxCount = 0,
  otherDigboxCountLabel,
  analyticsSource = "product_modal",
}: ProductDetailModalProps) {
  const router = useRouter();
  const presence = usePresence(true);
  const { authUser } = useAuthContext();
  const { closetProducts, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const canUseCloset = Boolean(authUser);
  const [isRelatedGraphOpen, setIsRelatedGraphOpen] = useState(false);
  useBodyScrollLock(modalRef, !isRelatedGraphOpen);
  const sizeTableTouchStartX = useRef<number | null>(null);
  const sizeTableTouchStartY = useRef<number | null>(null);
  const sizeTableIsScrolling = useRef(false);

  useEffect(() => {
    captureEvent("product_opened", { product_id: product.id, source: analyticsSource });
  }, [analyticsSource, product.id]);
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
  const { products } = useProductsContext();
  const [selectedMySizeId, setSelectedMySizeId] = useState<string>("");
  const savedClosetProduct = closetProduct || null;
  const savedSizeRowIndex = getClosetSizeRowIndex(savedClosetProduct);
  const displaySizeTable = useMemo(() => getDisplaySizeTable(product), [product]);
  const displayProduct = useMemo(
    () => ({ ...product, sizeTable: displaySizeTable }),
    [displaySizeTable, product]
  );

  useEffect(() => {
    ensureMySizesLoaded();
  }, [ensureMySizesLoaded]);

  useEffect(() => {
    if (authUser) ensureClosetLoaded();
  }, [authUser, ensureClosetLoaded]);

  const tasteDecision = useMemo(
    () => (authUser ? getProductTasteDecision(product, closetProducts) : null),
    [authUser, closetProducts, product]
  );

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
  const canExploreRelatedProducts = !hideRelatedGraphButton || Boolean(onRelatedGraphRequest) || Boolean(relatedGraphReason);
  const hasProductInsights = Boolean(tasteDecision);

  const closeMySizePicker = () => {
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
    requestAnimationFrame(() => mySizeChangeButtonRef.current?.focus());
  };

  useEffect(() => {
    setIsExtraMeasurementsOpen(false);
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
    setIsRelatedGraphOpen(false);
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

  const handleRelatedGraphClick = () => {
    if (onRelatedGraphRequest) {
      onRelatedGraphRequest();
      return;
    }
    setIsRelatedGraphOpen(true);
  };

  const closeModal = () => presence.requestClose(onClose);

  return (
    <>
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="ui-layer-scrim absolute inset-0 bg-black/70 backdrop-blur-sm" data-visible={presence.isVisible} onClick={closeModal} />
      <div
        className="ui-product-detail-modal ui-layer-modal ui-floating-surface relative flex flex-col max-h-[90vh] w-full max-w-4xl rounded-3xl bg-[#1c1c1f] shadow-[0_24px_60px_rgba(0,0,0,0.38)] md:h-[80.4vh] md:max-h-none md:w-[91%] md:max-w-[58.24rem]"
        data-visible={presence.isVisible}
      >
        <div className="z-10 flex flex-shrink-0 flex-nowrap items-center justify-between rounded-t-3xl border-b border-white/10 bg-[#1c1c1f] px-3 py-3 text-white sm:px-6 sm:py-4">
          <h3 className="shrink-0 text-base font-bold text-white sm:text-xl">상품 상세</h3>
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
                className={`ui-detail-toolbar-button ui-detail-toolbar-button--digbox inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 ${
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
              {showGuestDigboxHint && !isInDigbox && (
                <p className="pointer-events-none absolute right-0 top-full mt-3 w-52 rounded-xl border border-yellow-300/30 bg-[#17150e]/95 px-3 py-2 text-[11px] font-bold leading-snug text-yellow-100 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  마음에 드는 상품은 여기 담아 내 취향을 찾아보세요.
                </p>
              )}
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
                className={`ui-detail-toolbar-button ui-detail-toolbar-button--closet inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 ${
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
              className="ui-detail-toolbar-button ui-detail-toolbar-button--close inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.045] text-gray-300 transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
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
              {(product.registeredBy || otherDigboxCount > 0 || relatedGraphReason) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500">
                  {product.registeredBy && <span>발굴한 사람: <span className="text-gray-200">{product.registeredBy}</span></span>}
                  {otherDigboxCount > 0 && <span>{otherDigboxCountLabel || `이 발굴 상품을 ${otherDigboxCount}명이 저장했어요`}</span>}
                  {relatedGraphReason && <span>{getRelatedGraphReasonCopy(relatedGraphReason)}</span>}
                </div>
              )}
            </div>
          </div>

          {hasProductInsights && (
            <section className="mt-5" aria-label="내 취향 분석">
              <ProductTasteDecisionPanel decision={tasteDecision!} />
            </section>
          )}

          {canExploreRelatedProducts ? (
            <button
              type="button"
              onClick={handleRelatedGraphClick}
              className="group mt-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-[background-color,color,transform] duration-150 hover:bg-white/[0.05] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Network className="h-4 w-4 shrink-0 text-orange-300 transition-transform duration-150 group-hover:scale-110" aria-hidden="true" />
                <span className="truncate text-sm font-bold text-gray-300 transition-colors group-hover:text-white">{relatedGraphButtonLabel}</span>
              </span>
              <span className="shrink-0 text-base leading-none text-gray-500 transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-orange-200" aria-hidden="true">→</span>
            </button>
          ) : null}

          <section className="mt-8" aria-labelledby="size-selection-title">
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
                className="shrink-0 text-xs font-bold text-orange-300 underline decoration-orange-300/45 underline-offset-4 transition-colors hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1f]"
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
                className="ui-size-comparison-action shrink-0 rounded-lg border border-orange-300/45 bg-orange-400/[0.13] px-3 py-1.5 text-xs font-bold text-orange-100 transition-[background-color,border-color,color,transform] duration-150 hover:border-orange-200/70 hover:bg-orange-400/[0.22] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
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
                className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
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
    {isRelatedGraphOpen && (
      <ProductRelatedGraphModal
        product={product}
        products={products}
        onClose={() => setIsRelatedGraphOpen(false)}
      />
    )}
    </>
  );
}
