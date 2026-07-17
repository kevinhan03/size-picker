import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, RefObject, SyntheticEvent, TouchEvent } from "react";
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
import { getProductTasteDecision } from "../utils/tasteGraph";
import { cosineSimilarity, parseEmbedding } from "../utils/tasteGraph";

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

function getClosetSizeRowIndex(product?: Product | null): number | null {
  return Number.isInteger(product?.closetSelectedSizeRowIndex) ? product!.closetSelectedSizeRowIndex! : null;
}

function SavedSizeSummary({ product }: { product?: Product | null }) {
  const label = getClosetSizeLabel(product);
  if (!label) return null;

  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-black text-gray-300">
      <span className="uppercase text-gray-500">My size</span>
      <span className="text-sm leading-none text-orange-400">{label}</span>
    </span>
  );
}

function MySizePickerOverlay({
  open,
  profiles,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  onClose,
}: {
  open: boolean;
  profiles: MySizeProfile[];
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

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <div className="ui-layer-scrim absolute inset-0 bg-black/72" data-visible={presence.isVisible} onClick={onClose} />
      <section
        aria-label="비교할 내 상품 선택"
        aria-modal="true"
        role="dialog"
        className="ui-layer-modal ui-panel relative w-full max-w-md rounded-3xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-6"
        data-visible={presence.isVisible}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">비교할 내 상품</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">같은 카테고리에 저장한 상품을 골라보세요.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-[background-color,color] hover:bg-white/[0.07] hover:text-white" aria-label="비교할 내 상품 선택 닫기">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="상품명 또는 메모 검색"
          autoFocus
          className="mt-5 h-11 w-full rounded-xl border border-white/[0.1] bg-black/25 px-3 text-sm font-semibold text-white outline-none transition-[border-color,background-color] placeholder:text-gray-600 focus:border-orange-400/70 focus:bg-black/35"
        />
        <div className="mt-3 grid max-h-[min(48dvh,22rem)] gap-1 overflow-y-auto pr-1">
          {profiles.length > 0 ? profiles.map((profile) => {
            const selected = selectedId === profile.id;
            const sizeLabel = String(profile.sizeLabel || profile.measurementSnapshot.row?.[0] || "").trim();
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-[background-color,border-color,color] ${
                  selected
                    ? "border-orange-400/55 bg-orange-500/[0.12]"
                    : "border-transparent bg-transparent hover:border-white/[0.1] hover:bg-white/[0.045]"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{profile.title || "저장한 상품"}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-500">{profile.fitNote || "착용감 메모 없음"}</p>
                </div>
                {sizeLabel ? <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${selected ? "bg-orange-400 text-black" : "bg-white/[0.08] text-gray-300"}`}>{sizeLabel}</span> : null}
              </button>
            );
          }) : (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-6 text-center text-sm font-semibold text-gray-500">검색 결과가 없습니다.</div>
          )}
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
  relatedGraphButtonLabel = "연관 상품 그래프",
  relatedGraphReason,
  showGuestDigboxHint = false,
  otherDigboxCount = 0,
  otherDigboxCountLabel,
  analyticsSource = "product_modal",
}: ProductDetailModalProps) {
  const presence = usePresence(true);
  const router = useRouter();
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
  const [isExtraMeasurementsOpen, setIsExtraMeasurementsOpen] = useState(false);
  const [isMySizePickerOpen, setIsMySizePickerOpen] = useState(false);
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
  const selectedMySize = useMemo(() => {
    if (!categoryMySizes.length) return null;
    return categoryMySizes.find((profile) => profile.id === selectedMySizeId) || categoryMySizes[0];
  }, [categoryMySizes, selectedMySizeId]);
  const filteredMySizes = useMemo(() => {
    const query = mySizeSearchQuery.trim().toLowerCase();
    if (!query) return categoryMySizes;
    return categoryMySizes.filter((profile) =>
      `${profile.title} ${profile.sizeLabel || ""} ${profile.fitNote || ""}`.toLowerCase().includes(query)
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
  const comparisonSummary = useMemo(() => {
    const firstDifference = mySizeComparisons.find((item) => item.diff !== 0);
    if (!firstDifference) return mySizeComparisons.length > 0 ? "주요 실측이 내 상품과 같아요." : null;
    const difference = Math.abs(firstDifference.diff).toFixed(1).replace(/\.0$/, "");
    return `${firstDifference.displayLabel}이(가) 내 상품보다 ${difference}cm ${firstDifference.diff > 0 ? "넓어요" : "작아요"}.`;
  }, [mySizeComparisons]);
  const imageSimilarProducts = useMemo(() => {
    const sourceEmbedding = parseEmbedding(product.imageEmbedding);
    const sourceCategory = String(product.category || "").trim().toLowerCase();
    if (!sourceEmbedding || !sourceCategory) return [];

    return products
      .filter((candidate) => candidate.id !== product.id && String(candidate.category || "").trim().toLowerCase() === sourceCategory)
      .map((candidate) => {
        const candidateEmbedding = parseEmbedding(candidate.imageEmbedding);
        const similarity = candidateEmbedding ? cosineSimilarity(sourceEmbedding, candidateEmbedding) : null;
        return similarity === null ? null : { product: candidate, similarity };
      })
      .filter((entry): entry is { product: Product; similarity: number } => entry !== null)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 3);
  }, [product, products]);
  const isSelectedMySizeSourceProduct = selectedMySize?.sourceProductId === product.id;

  useEffect(() => {
    setIsExtraMeasurementsOpen(false);
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
    setIsRelatedGraphOpen(false);
  }, [product.id]);

  useEffect(() => {
    setSelectedMySizeId(categoryMySizes[0]?.id || "");
    setIsMySizePickerOpen(false);
    setMySizeSearchQuery("");
  }, [categoryMySizes]);

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
                onClick={(event) => {
                  onCollectionActionStart?.(getAnchorRect(event));
                  onToggleDigbox?.();
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 ${
                  isInDigbox
                    ? "border-yellow-300/45 bg-yellow-400/[0.11] text-yellow-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-white/[0.12] bg-white/[0.045] text-gray-300 hover:border-yellow-300/45 hover:bg-yellow-400/[0.1] hover:text-yellow-100"
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
                onClick={handleClosetClick}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 ${
                  isInCloset
                    ? "border-orange-300/50 bg-orange-500/[0.14] text-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-white/[0.12] bg-white/[0.045] text-gray-300 hover:border-orange-300/50 hover:bg-orange-500/[0.1] hover:text-orange-100"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.045] text-gray-300 transition-[background-color,border-color,color] hover:border-white/[0.2] hover:bg-white/[0.075] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
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
              className="relative isolate h-[10.5rem] w-[10.5rem] cursor-zoom-in overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(30,38,54,0.42),rgba(8,11,18,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:h-[16.848rem] md:w-[16.848rem]"
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
              {product.url ? (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-300 transition-colors hover:text-orange-400"
                >
                  공식 홈페이지 <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              ) : (
                <span className="text-sm text-gray-600">URL 없음</span>
              )}
              {savedClosetProduct ? <div className="mt-3"><SavedSizeSummary product={savedClosetProduct} /></div> : null}
            </div>
          </div>

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
                        style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
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
                    return (
                      <tr
                        key={rowIndex}
                        onPointerDown={(event) => handleSizeTableRowPointerDown(event, rowIndex)}
                        onClick={(event) => handleSizeTableRowClick(event, rowIndex)}
                        className="group cursor-pointer"
                      >
                        {row.map((cell, cellIndex) => {
                          return (
                            <td
                              key={cellIndex}
                          className={`whitespace-nowrap px-2 py-2.5 text-[11px] font-medium transition-[background-color,color] duration-150 sm:px-4 sm:py-3 sm:text-sm ${cellIndex === 0 ? "border-r border-white/[0.04] text-xs font-bold sm:text-sm" : ""} ${
                            isActiveRow
                                  ? "bg-orange-500/[0.15] text-orange-50 first:rounded-l-lg first:border-l first:border-orange-400/70 last:rounded-r-lg last:border-r last:border-orange-400/70"
                                  : isSavedRow
                                  ? "bg-white/[0.045] text-gray-200 first:rounded-l-lg last:rounded-r-lg"
                                  : "bg-transparent text-gray-300 group-hover:bg-white/[0.065] group-hover:text-white group-hover:first:rounded-l-lg group-hover:last:rounded-r-lg"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {displayTableCell(cell)}
                                {cellIndex === 0 && isSavedRow ? <span className="rounded bg-orange-400/[0.14] px-1 py-0.5 text-[9px] font-bold text-orange-200">내 저장</span> : null}
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

          {categoryMySizes.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400">내 사이즈와 비교</h5>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {activeProductSnapshot?.row?.[0] ? `${activeProductSnapshot.row[0]}와 사이즈 비교` : "비교할 상품 사이즈를 선택하세요"}
                  </p>
                </div>
              </div>

              {selectedMySize && (
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-wide text-gray-600">비교할 상품</p>
                      <div className="mt-1 flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-black text-white">{selectedMySize.title}</p>
                        {(selectedMySize.sizeLabel || selectedMySize.measurementSnapshot.row?.[0]) && (
                          <span className="shrink-0 rounded-md bg-orange-500/12 px-1.5 py-0.5 text-[10px] font-black text-orange-300">
                            {selectedMySize.sizeLabel || selectedMySize.measurementSnapshot.row?.[0]}
                          </span>
                        )}
                      </div>
                      {selectedMySize.fitNote && (
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-gray-500">
                          착용감 메모: {selectedMySize.fitNote}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        showTutorialOnce("mySizeCompare", getAnchorRect(event));
                        setIsMySizePickerOpen(true);
                      }}
                      aria-expanded={isMySizePickerOpen}
                      className="shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.045] px-2.5 py-1.5 text-xs font-bold text-gray-300 transition-[background-color,border-color,color] hover:border-orange-400/45 hover:bg-orange-500/[0.07] hover:text-orange-200"
                    >
                      변경
                    </button>
                  </div>

                </div>
              )}

              {isSelectedMySizeSourceProduct ? (
                <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-200">
                  동일한 상품입니다.
                </div>
              ) : activeRowIndex === null ? null : mySizeComparisons.length > 0 ? (
                <>
                {comparisonSummary ? <p className="mt-3 rounded-xl border border-orange-400/20 bg-orange-500/[0.07] px-3 py-2.5 text-sm font-bold text-orange-100">{comparisonSummary}</p> : null}
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
                        <th className="whitespace-nowrap px-3 py-2 font-black">상품</th>
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
          )}

          {imageSimilarProducts.length > 0 && (
            <section className="mt-6" aria-labelledby="similar-products-title">
              <div className="mb-3">
                <h5 id="similar-products-title" className="text-xs font-bold uppercase tracking-widest text-gray-400">이 상품과 비슷한 상품</h5>
                <p className="mt-1 text-xs font-semibold text-gray-500">같은 카테고리에서 이미지 스타일이 가까운 상품이에요.</p>
              </div>
              <div className="flex flex-col gap-2">
                {imageSimilarProducts.map(({ product: similarProduct, similarity }) => (
                  <button
                    key={similarProduct.id}
                    type="button"
                    onClick={() => onRecommendationClick(similarProduct)}
                    className="ui-card flex items-start gap-3 rounded-2xl px-4 py-3 text-left transition-[background-color,border-color] hover:border-white/[0.16] hover:bg-[#1a1a1d] active:scale-[0.98]"
                  >
                    <img
                      src={similarProduct.thumbnailImage || similarProduct.image || DEFAULT_PRODUCT_PLACEHOLDER}
                      alt={similarProduct.name}
                      className="mt-0.5 h-12 w-12 flex-shrink-0 rounded-xl bg-white/[0.06] object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold uppercase text-orange-400">{similarProduct.brand}</p>
                      <p className="truncate text-sm font-medium text-white">{similarProduct.name}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/[0.07] px-2 py-1 text-[10px] font-bold text-gray-400">유사도 {Math.round(similarity * 100)}%</span>
                  </button>
                ))}
              </div>
            </section>
          )}

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
                            style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
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

          {(product.registeredBy || otherDigboxCount > 0 || !hideRelatedGraphButton || onRelatedGraphRequest || relatedGraphReason || tasteDecision || savedClosetProduct || (hideDigboxButton && isInCloset)) && (
            <section className="mt-6 border-t border-white/[0.08] pt-5" aria-labelledby="product-insights-title">
              <h5 id="product-insights-title" className="text-xs font-bold uppercase tracking-widest text-gray-400">더 알아보기</h5>
              <div className="mt-3 space-y-3">
                {(product.registeredBy || otherDigboxCount > 0) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500">
                    {product.registeredBy && <span>발굴한 사람: <span className="text-gray-200">{product.registeredBy}</span></span>}
                    {otherDigboxCount > 0 && <span>{otherDigboxCountLabel || `이 발굴 상품을 ${otherDigboxCount}명이 저장했어요`}</span>}
                  </div>
                )}
                {(!hideRelatedGraphButton || onRelatedGraphRequest || relatedGraphReason) && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    {!hideRelatedGraphButton || onRelatedGraphRequest ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRelatedGraphRequest) {
                            onRelatedGraphRequest();
                            return;
                          }
                          setIsRelatedGraphOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-gray-200 transition-[background-color,border-color,color] hover:border-orange-500/45 hover:bg-orange-500/[0.08] hover:text-orange-200"
                      >
                        <Network className="h-4 w-4 text-orange-300" />
                        {relatedGraphButtonLabel}
                      </button>
                    ) : null}
                    {relatedGraphReason ? (
                      <span className="text-xs font-semibold text-gray-500">스타일 유사도 <span className="text-gray-300">{Math.round(relatedGraphReason.similarity * 100)}%</span></span>
                    ) : null}
                  </div>
                )}
                {tasteDecision ? (
                  <ProductTasteDecisionPanel
                    decision={tasteDecision}
                    onViewMap={() => router.push(`/taste-graph?source=closet&tag=${tasteDecision.primaryTag}`)}
                  />
                ) : null}
                {hideDigboxButton && isInCloset && !savedClosetProduct ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300">
                    <ClosetIcon className="h-3.5 w-3.5" />
                    이미 옷장에 있어요
                  </span>
                ) : null}
              </div>
            </section>
          )}
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
      selectedId={selectedMySizeId}
      query={mySizeSearchQuery}
      onQueryChange={setMySizeSearchQuery}
      onSelect={(profileId) => {
        setSelectedMySizeId(profileId);
        setIsMySizePickerOpen(false);
        setMySizeSearchQuery("");
      }}
      onClose={() => {
        setIsMySizePickerOpen(false);
        setMySizeSearchQuery("");
      }}
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
