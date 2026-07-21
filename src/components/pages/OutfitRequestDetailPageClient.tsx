"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Ellipsis, LoaderCircle, LockKeyhole, Pencil, Shirt, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createOutfitProposal,
  deleteOutfitProposal,
  deleteOutfitRequest,
  fetchOutfitRequest,
  updateOutfitProposal,
  updateOutfitRequest,
} from "../../api/outfits";
import { useAuthContext } from "../../contexts/AuthContext";
import { CATEGORY_OPTIONS } from "../../constants";
import type { OutfitProposal, OutfitRequestDetail, Product } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { OutfitProductTile } from "../outfits/OutfitProductTile";
import { OutfitImageFrame } from "../outfits/OutfitImageFrame";
import { PageState } from "../PageState";
import { usePresence } from "../../hooks/usePresence";

const SHARED_CLOSET_PAGE_SIZE = 10;

function statusLabel(status: OutfitRequestDetail["status"]) {
  return status === "open" ? "진행 중" : status === "accepted" ? "채택 완료" : "종료";
}

function focusMatchLabel(proposal: OutfitProposal, focusItemCount: number) {
  if (proposal.focusMatch === "all") return "요청 아이템 활용";
  if (proposal.focusMatch === "partial") return `요청 아이템 ${proposal.matchedFocusItemCount}/${focusItemCount}개 활용`;
  if (proposal.focusMatch === "none") return "대안 코디";
  return "";
}

type RequestConfirmAction = "close" | "delete";
type ProposalConfirmAction = { type: "accept" | "delete"; proposal: OutfitProposal };

function trapDialogFocus(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function OutfitFocusProductPreviewDialog({
  product,
  onClose,
  selected = false,
  onToggle,
}: {
  product: Product;
  onClose: () => void;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const close = () => presence.requestClose(onClose);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => restoreFocusRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button type="button" aria-label="상품 이미지 닫기" onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/80 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${product.brand} ${product.name} 이미지 크게 보기`} tabIndex={-1} onKeyDown={(event) => { trapDialogFocus(event); if (event.key === "Escape") close(); }} className="ui-layer-modal ui-floating-surface relative z-10 h-[min(44rem,calc(100dvh-2rem))] w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17171a] shadow-[0_24px_64px_rgba(0,0,0,0.68)] outline-none" data-visible={presence.isVisible}>
        <button type="button" onClick={close} aria-label="상품 이미지 닫기" className="outfit-detail-pressable absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"><X className="h-5 w-5" /></button>
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_19rem] md:grid-rows-1">
          <div className="relative min-h-0 bg-black/25 p-6 sm:p-8 md:p-10">
            <OutfitImageFrame product={product} alt={`${product.brand} ${product.name}`} fit="contain" />
          </div>
          <div className="flex min-h-0 flex-col border-t border-white/10 bg-[#17171a] p-5 sm:p-6 md:border-l md:border-t-0 md:p-7">
            <div className="pr-11">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{product.brand}</p>
              <h2 className="mt-1 text-lg font-bold leading-6 tracking-[-0.015em] text-white">{product.name}</h2>
              <p className="mt-2 text-sm text-white/55">{product.category}</p>
            </div>
            {onToggle && (
              <div className="mt-6 border-t border-white/10 pt-5 md:mt-auto">
                {selected ? (
                  <>
                    <p className="text-sm font-semibold text-white/75">코디에 담김</p>
                    <button type="button" onClick={onToggle} className="outfit-detail-pressable mt-3 min-h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-bold text-white transition-[background-color,border-color,color,transform] duration-150">선택 해제</button>
                  </>
                ) : (
                  <button type="button" onClick={onToggle} className="outfit-detail-pressable min-h-11 w-full rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition-[background-color,color,transform] duration-150">코디에 담기</button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function OutfitRequestConfirmDialog({
  action,
  working,
  onCancel,
  onConfirm,
}: {
  action: RequestConfirmAction;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action === "delete";
  const titleId = `outfit-request-${action}-title`;
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; requestAnimationFrame(() => dialogRef.current?.focus()); return () => restoreFocusRef.current?.focus(); }, []);
  const close = () => presence.requestClose(onCancel);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
    >
      <button type="button" aria-label="확인창 닫기" disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section
        role="alertdialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => { trapDialogFocus(event); if (event.key === "Escape" && !working) close(); }}
        className={`ui-layer-modal ui-floating-surface relative z-10 w-full max-w-sm rounded-2xl border bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.68)] ${isDelete ? "border-red-500/20" : "border-orange-500/20"}`}
        data-visible={presence.isVisible}
      >
        <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border ${isDelete ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-orange-500/25 bg-orange-500/10 text-orange-300"}`}>
          {isDelete ? <Trash2 className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
        </div>
        <h2 id={titleId} className="mt-4 text-lg font-black text-white">
          {isDelete ? "코디 요청을 삭제하시겠습니까?" : "코디 요청을 마감하시겠습니까?"}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
          {isDelete
            ? "요청 내용과 받은 코디 제안이 모두 삭제되며 복구할 수 없습니다."
            : "채택한 코디 없이 요청이 종료됩니다. 받은 제안과 요청 내용은 그대로 남지만, 더 이상 새로운 코디 제안을 받을 수 없습니다."}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            autoFocus
            disabled={working}
            onClick={close}
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDelete ? "취소" : "계속 받기"}
          </button>
          <button
            type="button"
            disabled={working}
            onClick={onConfirm}
            className={`flex h-11 items-center justify-center rounded-xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDelete ? "bg-red-500 text-white hover:bg-red-400" : "bg-orange-500 text-black hover:bg-orange-400"}`}
          >
            {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isDelete ? "요청 삭제" : "요청 마감"}
          </button>
        </div>
      </section>
    </div>
  );
}

function OutfitProposalConfirmDialog({
  matchedCount,
  totalCount,
  isEditing,
  working,
  onCancel,
  onConfirm,
}: {
  matchedCount: number;
  totalCount: number;
  isEditing: boolean;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isAlternative = matchedCount === 0;
  const actionLabel = isEditing ? "수정" : "제안";
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; requestAnimationFrame(() => dialogRef.current?.focus()); return () => restoreFocusRef.current?.focus(); }, []);
  const close = () => presence.requestClose(onCancel);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button type="button" aria-label="확인창 닫기" disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section
        role="alertdialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="outfit-proposal-confirm-title"
        onKeyDown={(event) => { trapDialogFocus(event); if (event.key === "Escape" && !working) close(); }}
        className="ui-layer-modal ui-floating-surface relative z-10 w-full max-w-sm rounded-2xl border border-orange-500/20 bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.68)]"
        data-visible={presence.isVisible}
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-300">
          <Shirt className="h-5 w-5" />
        </div>
        <h2 id="outfit-proposal-confirm-title" className="mt-4 text-lg font-black text-white">
          {isAlternative ? `대안 코디로 ${actionLabel}하시겠습니까?` : `이대로 코디를 ${actionLabel}하시겠습니까?`}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
          {isAlternative
            ? `요청자가 선택한 옷이 포함되지 않았습니다. 더 잘 어울리는 조합이라면 대안 코디로 ${isEditing ? "저장" : "제안"}할 수 있습니다.`
            : `요청자가 선택한 옷 ${totalCount}개 중 ${matchedCount}개만 포함되었습니다.`}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" autoFocus disabled={working} onClick={close} className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60">다시 고르기</button>
          <button type="button" disabled={working} onClick={onConfirm} className="flex h-11 items-center justify-center rounded-xl bg-orange-500 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60">
            {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isAlternative ? `대안으로 ${actionLabel}` : `이대로 ${actionLabel}`}
          </button>
        </div>
      </section>
    </div>
  );
}

function OutfitProposalActionDialog({
  action,
  working,
  onCancel,
  onConfirm,
}: {
  action: ProposalConfirmAction;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action.type === "delete";
  const titleId = `outfit-proposal-${action.type}-title`;
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; requestAnimationFrame(() => dialogRef.current?.focus()); return () => restoreFocusRef.current?.focus(); }, []);
  const close = () => presence.requestClose(onCancel);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button type="button" aria-label="확인창 닫기" disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section
        role="alertdialog"
        ref={dialogRef}
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => { trapDialogFocus(event); if (event.key === "Escape" && !working) close(); }}
        className={`ui-layer-modal ui-floating-surface relative z-10 w-full max-w-sm rounded-2xl border bg-[#151518] p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.68)] ${isDelete ? "border-red-500/20" : "border-orange-500/20"}`}
        data-visible={presence.isVisible}
      >
        <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border ${isDelete ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-orange-500/25 bg-orange-500/10 text-orange-300"}`}>
          {isDelete ? <Trash2 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
        </div>
        <h2 id={titleId} className="mt-4 text-lg font-black text-white">
          {isDelete ? "코디 제안을 삭제하시겠습니까?" : "이 코디를 채택하시겠습니까?"}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
          {isDelete
            ? "선택한 상품과 스타일링 코멘트가 모두 삭제되며 복구할 수 없습니다."
            : "이 코디를 채택하면 요청이 완료되며 더 이상 새로운 코디 제안을 받을 수 없습니다."}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" autoFocus disabled={working} onClick={close} className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isDelete ? "취소" : "다시 보기"}
          </button>
          <button type="button" disabled={working} onClick={onConfirm} className={`flex h-11 items-center justify-center rounded-xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDelete ? "bg-red-500 text-white hover:bg-red-400" : "bg-orange-500 text-black hover:bg-orange-400"}`}>
            {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isDelete ? "제안 삭제" : "코디 채택"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function OutfitRequestDetailPageClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const returnToOutfits = () => {
    const source = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
    router.push(source === "mine" ? "/outfits?tab=mine" : source === "proposed" ? "/outfits?tab=proposed" : "/outfits");
  };
  const { authUser, isAuthLoading } = useAuthContext();
  const authUserId = authUser?.id;
  const [outfitRequest, setOutfitRequest] = useState<OutfitRequestDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [visibleProductCount, setVisibleProductCount] = useState(SHARED_CLOSET_PAGE_SIZE);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<RequestConfirmAction | null>(null);
  const [proposalConfirmOpen, setProposalConfirmOpen] = useState(false);
  const [proposalAction, setProposalAction] = useState<ProposalConfirmAction | null>(null);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [requestMenuOpen, setRequestMenuOpen] = useState(false);
  const [proposalMenuOpen, setProposalMenuOpen] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [visibleProductAnnouncement, setVisibleProductAnnouncement] = useState("");
  const [hasMoreCategories, setHasMoreCategories] = useState(false);
  const requestMenuRef = useRef<HTMLDivElement>(null);
  const proposalMenuRef = useRef<HTMLDivElement>(null);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (showInitialLoading = false) => {
    if (showInitialLoading) setLoading(true);
    setError("");
    try {
      const data = await fetchOutfitRequest(requestId);
      setOutfitRequest(data.request);
      setCurrentUserId(data.currentUserId);
      captureEvent("outfit_request_viewed", { request_id: requestId, status: data.request.status });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "코디 요청을 불러오지 못했습니다.");
    } finally {
      if (showInitialLoading) setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!authUserId) {
      router.replace(buildLoginHref("login", `/outfits/${requestId}`));
      return;
    }
    void load(true);
  }, [authUserId, isAuthLoading, load, requestId, router]);

  useEffect(() => {
    if (!requestMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!requestMenuRef.current?.contains(event.target as Node)) setRequestMenuOpen(false);
    };
    const closeMenuWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRequestMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenuWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenuWithEscape);
    };
  }, [requestMenuOpen]);

  useEffect(() => {
    if (!proposalMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!proposalMenuRef.current?.contains(event.target as Node)) setProposalMenuOpen(null);
    };
    const closeMenuWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProposalMenuOpen(null);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenuWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenuWithEscape);
    };
  }, [proposalMenuOpen]);

  const updateCategoryHint = useCallback(() => {
    const element = categoryFilterRef.current;
    if (!element) return;
    setHasMoreCategories(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }, []);

  useEffect(() => {
    if (!categoryFilterRef.current) return;
    const element = categoryFilterRef.current;
    updateCategoryHint();
    const resizeObserver = new ResizeObserver(updateCategoryHint);
    resizeObserver.observe(element);
    element.addEventListener("scroll", updateCategoryHint, { passive: true });
    return () => {
      resizeObserver.disconnect();
      element.removeEventListener("scroll", updateCategoryHint);
    };
  }, [outfitRequest?.products, updateCategoryHint]);

  const categories = useMemo(() => {
    if (!outfitRequest) return [];
    const availableCategories = new Set(outfitRequest.products.map((product) => product.category).filter(Boolean));
    const orderedCategories = CATEGORY_OPTIONS.filter((category) => availableCategories.delete(category));
    return [...orderedCategories, ...[...availableCategories].sort((left, right) => left.localeCompare(right, "ko"))];
  }, [outfitRequest]);
  const selectedProducts = useMemo(() => {
    if (!outfitRequest) return [];
    const productsById = new Map(outfitRequest.products.map((product) => [String(product.id), product]));
    return selectedIds.flatMap((id) => {
      const product = productsById.get(id);
      return product ? [product] : [];
    });
  }, [outfitRequest, selectedIds]);
  const visibleProducts = useMemo(() => {
    if (!outfitRequest) return [];
    return outfitRequest.products.filter((product) => !category || product.category === category);
  }, [category, outfitRequest]);
  const displayedProducts = visibleProducts.slice(0, visibleProductCount);
  const hiddenProductCount = Math.max(0, visibleProducts.length - displayedProducts.length);
  const nextProductCount = Math.min(SHARED_CLOSET_PAGE_SIZE, hiddenProductCount);
  const isOwner = Boolean(outfitRequest && currentUserId === outfitRequest.authorId);
  const myProposal = outfitRequest?.proposals.find((proposal) => proposal.authorId === currentUserId) || null;
  const isEditingMyProposal = Boolean(myProposal && editingProposalId === myProposal.id);
  const canComposeProposal = Boolean(!isOwner && outfitRequest?.status === "open" && (!myProposal || isEditingMyProposal));
  const selectionTrayPresence = usePresence(canComposeProposal && selectedProducts.length > 0, { enterDuration: 150, exitDuration: 160 });
  const selectionTrayCount = selectedProducts.length || (selectionTrayPresence.isMounted ? 1 : 0);
  const acceptedProposal = outfitRequest?.proposals.find((proposal) => proposal.id === outfitRequest.acceptedProposalId) || null;
  const focusProducts = useMemo(() => {
    if (!outfitRequest) return [];
    const focusIds = new Set(outfitRequest.focusProductIds);
    return outfitRequest.products.filter((product) => focusIds.has(String(product.id)));
  }, [outfitRequest]);

  function selectCategory(nextCategory: string) {
    if (nextCategory === category) return;
    setCategory(nextCategory);
    setVisibleProductCount(SHARED_CLOSET_PAGE_SIZE);
    setVisibleProductAnnouncement("");
  }

  function showMoreProducts() {
    if (nextProductCount === 0) return;
    const remainingProductCount = hiddenProductCount - nextProductCount;
    setVisibleProductCount((current) => current + nextProductCount);
    setVisibleProductAnnouncement(`아이템 ${nextProductCount}개를 더 표시했어요.${remainingProductCount > 0 ? ` ${remainingProductCount}개 남았어요.` : ""}`);
  }

  function focusComposer() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = composerRef.current;
    const focusInput = () => explanationRef.current?.focus({ preventScroll: true });
    if (!target || reducedMotion) {
      target?.scrollIntoView({ behavior: "auto", block: "center" });
      focusInput();
      return;
    }

    let focused = false;
    let fallbackTimer: number | null = null;
    const finish = () => {
      if (focused) return;
      focused = true;
      window.removeEventListener("scrollend", finish);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      focusInput();
    };

    window.addEventListener("scrollend", finish, { once: true });
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    fallbackTimer = window.setTimeout(finish, 450);
  }

  function toggleProduct(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 6) return current;
      return [...current, id];
    });
  }

  function startEditingProposal(proposal: OutfitProposal) {
    if (working) return;
    setProposalMenuOpen(null);
    setEditingProposalId(proposal.id);
    setSelectedIds(proposal.products.map((product) => String(product.id)));
    setExplanation(proposal.explanation);
    setCategory("");
    setVisibleProductCount(SHARED_CLOSET_PAGE_SIZE);
    setError("");
    window.requestAnimationFrame(() => {
      document.getElementById("shared-closet-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function cancelEditingProposal() {
    setEditingProposalId(null);
    setSelectedIds([]);
    setExplanation("");
    setProposalConfirmOpen(false);
  }

  async function submitProposal(confirmed = false) {
    if (selectedIds.length < 2 || explanation.trim().length < 10 || working) return;
    const focusProductIds = outfitRequest?.focusProductIds || [];
    const matchedFocusItemCount = focusProductIds.filter((id) => selectedIds.includes(id)).length;
    if (
      !confirmed
      && focusProductIds.length > 0
      && matchedFocusItemCount < focusProductIds.length
    ) {
      setProposalConfirmOpen(true);
      return;
    }
    setProposalConfirmOpen(false);
    setWorking(true);
    setError("");
    try {
      const editingId = editingProposalId;
      const data = editingId
        ? await updateOutfitProposal(editingId, { productIds: selectedIds, explanation: explanation.trim() })
        : await createOutfitProposal(requestId, { productIds: selectedIds, explanation: explanation.trim() });
      setOutfitRequest(data.request);
      setEditingProposalId(null);
      setSelectedIds([]);
      setExplanation("");
      setStatusMessage(editingId ? "코디 제안을 수정했어요." : "코디 제안을 등록했어요.");
      captureEvent(editingId ? "outfit_proposal_updated" : "outfit_proposal_created", {
        request_id: requestId,
        proposal_id: editingId || undefined,
        item_count: selectedIds.length,
        focus_match: focusProductIds.length === 0
          ? "not_applicable"
          : matchedFocusItemCount === 0
            ? "none"
            : matchedFocusItemCount === focusProductIds.length
              ? "all"
              : "partial",
      });
    } catch (workError) {
      setError(workError instanceof Error ? workError.message : "코디 제안을 저장하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  }

  async function acceptProposal(proposal: OutfitProposal) {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      const data = await updateOutfitRequest(requestId, { action: "accept", proposalId: proposal.id });
      setOutfitRequest(data.request);
      setStatusMessage("코디를 채택했어요.");
      captureEvent("outfit_proposal_accepted", { request_id: requestId, proposal_id: proposal.id });
    } catch (workError) {
      setError(workError instanceof Error ? workError.message : "코디를 채택하지 못했습니다.");
    } finally {
      setWorking(false);
      setProposalAction(null);
    }
  }

  async function closeRequest() {
    if (working) return;
    setWorking(true);
    try {
      const data = await updateOutfitRequest(requestId, { action: "close" });
      setOutfitRequest(data.request);
      setConfirmAction(null);
      setStatusMessage("코디 요청을 마감했어요.");
      captureEvent("outfit_request_closed", { request_id: requestId });
    } catch (workError) { setError(workError instanceof Error ? workError.message : "요청을 종료하지 못했습니다."); setConfirmAction(null); }
    finally { setWorking(false); }
  }

  async function removeProposal(id: string) {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      await deleteOutfitProposal(id);
      if (editingProposalId === id) cancelEditingProposal();
      setOutfitRequest((current) => current ? {
        ...current,
        proposals: current.proposals.filter((proposal) => proposal.id !== id),
      } : current);
      setStatusMessage("코디 제안을 삭제했어요.");
    }
    catch (workError) { setError(workError instanceof Error ? workError.message : "제안을 삭제하지 못했습니다."); }
    finally {
      setWorking(false);
      setProposalAction(null);
    }
  }

  async function removeRequest() {
    if (working) return;
    setWorking(true);
    try { await deleteOutfitRequest(requestId); router.replace("/outfits"); }
    catch (workError) { setError(workError instanceof Error ? workError.message : "요청을 삭제하지 못했습니다."); setConfirmAction(null); }
    finally { setWorking(false); }
  }

  if (isAuthLoading || loading || (!authUser && !error)) return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="loading" title="코디 요청을 준비하고 있어요" description="요청과 제안 내용을 불러오는 중입니다." /></main>;
  if (!outfitRequest) return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="error" title="코디 요청을 찾을 수 없어요" description={error || "요청이 삭제되었거나 더 이상 볼 수 없습니다."} action={<button type="button" onClick={returnToOutfits} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-black">목록으로 돌아가기</button>} /></main>;

  const otherProposals = outfitRequest.proposals.filter((proposal) => proposal.id !== myProposal?.id);
  const orderedOtherProposals = acceptedProposal && acceptedProposal.id !== myProposal?.id
    ? [acceptedProposal, ...otherProposals.filter((proposal) => proposal.id !== acceptedProposal.id)]
    : otherProposals;
  const orderedProposals = outfitRequest.status === "open" && myProposal
    ? [myProposal, ...orderedOtherProposals]
    : acceptedProposal
      ? [acceptedProposal, ...outfitRequest.proposals.filter((proposal) => proposal.id !== acceptedProposal.id)]
      : outfitRequest.proposals;

  return (
    <main className={`min-h-screen bg-black px-[var(--app-main-px)] pt-[var(--app-main-pt)] text-white lg:pt-24 ${canComposeProposal ? "pb-32 sm:pb-[var(--app-main-pb)]" : "pb-[var(--app-main-pb)]"}`} aria-busy={loading || working}>
      <div className="mx-auto flex max-w-5xl flex-col">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <button
            type="button"
            onClick={returnToOutfits}
            className="outfit-detail-pressable flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-400 transition-[background-color,color,transform] duration-150"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>뒤로가기</span>
          </button>

          {isOwner && (
            <div ref={requestMenuRef} className="relative">
              <button
                type="button"
                aria-label="코디 요청 관리"
                aria-haspopup="menu"
                aria-expanded={requestMenuOpen}
                aria-controls="outfit-request-management-menu"
                onClick={() => setRequestMenuOpen((open) => !open)}
                className={`outfit-detail-pressable flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-[background-color,color,transform] duration-150 ${requestMenuOpen ? "bg-white/[0.08] text-white" : "text-gray-400"}`}
              >
                <Ellipsis className="h-5 w-5" />
                <span className="hidden sm:inline">요청 관리</span>
              </button>

              {requestMenuOpen && (
                <div
                  id="outfit-request-management-menu"
                  role="menu"
                  aria-label="코디 요청 관리"
                  className="outfit-detail-menu absolute right-0 top-[calc(100%+0.5rem)] z-40 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.6)]"
                >
                  {outfitRequest.status === "open" && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setRequestMenuOpen(false);
                        setConfirmAction("close");
                      }}
                      className="outfit-detail-pressable flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-gray-200 transition-[background-color,color,transform] duration-150 focus:bg-white/[0.07] focus:outline-none"
                    >
                      <LockKeyhole className="h-4 w-4 text-gray-400" />
                      요청 마감
                    </button>
                  )}
                  <div className={outfitRequest.status === "open" ? "mt-1 border-t border-white/10 pt-1" : ""}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setRequestMenuOpen(false);
                        setConfirmAction("delete");
                      }}
                      className="outfit-detail-pressable outfit-detail-danger-action flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-red-300 transition-[background-color,color,transform] duration-150 focus:bg-red-500/10 focus:outline-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      요청 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <section className="mt-7 rounded-3xl border border-white/[0.1] bg-[#111114] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-black tracking-[-0.01em] text-orange-300">코디 고민</p>{outfitRequest.status !== "open" && <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/45">{statusLabel(outfitRequest.status)}</span>}</div>
          <p className="mt-4 text-sm font-semibold text-white/45">{outfitRequest.authorUsername}</p>
          <h1 className="mt-2 max-w-3xl whitespace-pre-wrap break-words text-[clamp(1.25rem,2.4vw,1.75rem)] font-bold leading-8 tracking-[-0.02em] text-white sm:leading-10">{outfitRequest.description}</h1>
          {focusProducts.length > 0 && (
            <div className="mt-7 border-t border-white/[0.1] pt-5">
              <p className="text-sm font-semibold text-white/70">활용 희망 아이템</p>
              <p className="mt-1 text-xs leading-5 text-white/55">이 아이템을 활용하거나, 더 어울리는 새로운 코디를 제안해보세요.</p>
              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3">
                {focusProducts.slice(0, 3).map((product) => <article key={product.id} className="min-w-0"><button type="button" onClick={() => setPreviewProduct(product)} aria-label={`${product.brand} ${product.name} 이미지 크게 보기`} className="outfit-detail-pressable relative block w-full overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.035] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"><div className="relative aspect-[4/5] bg-white/[0.035]"><OutfitImageFrame product={product} alt={`${product.brand} ${product.name}`} fit="contain" /></div></button><p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-wide text-white/55">{product.brand}</p><p className="mt-1 min-h-10 line-clamp-2 text-[13px] font-semibold leading-5 text-white/90">{product.name}</p></article>)}
              </div>
            </div>
          )}
        </section>

        <p aria-live="polite" className="sr-only">{statusMessage}</p>
        <p aria-live="polite" className="sr-only">{visibleProductAnnouncement}</p>
        {error && <p role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

        {!isOwner && (
        <section id="shared-closet-section" className="mt-10 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">{outfitRequest.authorUsername} 님의 옷장</h2>
              <p className="mt-1 text-sm text-white/55">코디에 활용할 아이템을 골라보세요.</p>
            </div>
            <div className="relative max-w-full">
            <div ref={categoryFilterRef} aria-label="공유된 옷 카테고리 필터" className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                aria-pressed={!category}
                onClick={() => selectCategory("")}
                className={`outfit-detail-pressable outfit-detail-filter min-h-11 whitespace-nowrap rounded-full border px-4 text-xs font-bold transition-[background-color,border-color,color,transform] duration-150 ${!category ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.035] text-white/55"}`}
              >
                전체
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => selectCategory(item)}
                  className={`outfit-detail-pressable outfit-detail-filter min-h-11 whitespace-nowrap rounded-full border px-4 text-xs font-bold transition-[background-color,border-color,color,transform] duration-150 ${category === item ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.035] text-white/55"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            {hasMoreCategories && <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black via-black/85 to-transparent" />}
            </div>
          </div>
          <div id="shared-closet-product-grid" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedProducts.map((product) => {
              const productId = String(product.id);
              return (
                <OutfitProductTile
                  key={product.id}
                  product={product}
                  badge={outfitRequest.focusProductIds.includes(productId) ? "활용 희망" : undefined}
                  selectable={canComposeProposal}
                  selected={selectedIds.includes(productId)}
                  selectionLimitReached={selectedIds.length >= 6}
                  onClick={() => toggleProduct(productId)}
                  onPreview={() => setPreviewProduct(product)}
                />
              );
            })}
          </div>
          {hiddenProductCount > 0 && (
            <button
              type="button"
              aria-controls="shared-closet-product-grid"
              onClick={showMoreProducts}
              className="outfit-detail-pressable outfit-detail-secondary-action mt-4 flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-white/55 transition-[background-color,border-color,color,transform] duration-150"
            >
              <span className="text-sm font-bold">아이템 {nextProductCount}개 더 보기</span>
              <span className="mt-0.5 text-xs font-semibold text-white/35">{hiddenProductCount}개 남음</span>
            </button>
          )}
          {selectionTrayPresence.isMounted && (
            <aside aria-label="코디 선택 상태" data-visible={selectionTrayPresence.isVisible} className="outfit-detail-selection-tray fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-[#161619]/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur sm:sticky sm:bottom-4 sm:inset-x-auto sm:mt-5 sm:max-w-3xl">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <span aria-live="polite" className="text-sm font-bold text-white/80">{selectionTrayCount === 1 ? "아이템 1개 선택됨 · 하나 더 골라주세요" : selectionTrayCount === 6 ? "아이템 6개 선택됨 · 최대 선택 개수예요" : `아이템 ${selectionTrayCount}개 선택됨`}</span>
              </div>
              {selectionTrayCount >= 2 && <button type="button" onClick={focusComposer} className="outfit-detail-pressable outfit-detail-primary-action min-h-11 shrink-0 rounded-xl bg-orange-500 px-4 text-xs font-black text-black transition-[background-color,transform] duration-150">제안 내용 작성</button>}
            </aside>
          )}
        </section>
        )}

        {canComposeProposal && selectedIds.length >= 2 && (
          <section ref={composerRef} aria-labelledby="outfit-proposal-heading" className="mx-auto mt-8 w-full max-w-5xl scroll-mt-24 rounded-3xl border border-orange-500/25 bg-[#121214] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="outfit-proposal-heading" className="text-xl font-black tracking-[-0.02em] sm:text-2xl">{isEditingMyProposal ? "코디 수정하기" : "코디 제안하기"}</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">잘 어울리는 이유와 어떻게 입으면 좋은지 들려주세요.</p>
              </div>
            </div>

            {selectedProducts.length > 0 ? (
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]">
                    <div className="relative aspect-[4/5] bg-white/[0.035]">
                      <OutfitImageFrame product={product} alt={`${product.brand} ${product.name}`} fit="contain" />
                      <button
                        type="button"
                        onClick={() => toggleProduct(String(product.id))}
                        aria-label={`${product.brand} ${product.name} 선택 해제`}
                        className="outfit-detail-pressable absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md backdrop-blur">
                          <X className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm font-semibold text-white/55">코디에 활용할 아이템을 골라보세요.</p>
            )}

            {selectedIds.length === 1 && <p className="mt-3 text-xs font-semibold text-orange-300">코디를 완성하려면 옷을 1개 더 선택하세요.</p>}
            <label htmlFor="outfit-proposal-explanation" className="mt-7 block border-t border-white/10 pt-6 text-sm font-bold text-white/75">스타일링 코멘트</label>
            <textarea ref={explanationRef} id="outfit-proposal-explanation" value={explanation} onChange={(event) => setExplanation(event.target.value)} maxLength={300} rows={3} placeholder="잘 어울리는 이유와 어떻게 입으면 좋은지 10자 이상 작성하세요." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/50 p-3 text-sm outline-none placeholder:text-white/25 focus:border-orange-500/60" />
            <div className={`mt-4 grid gap-2 ${isEditingMyProposal ? "grid-cols-2" : "grid-cols-1"}`}>
              {isEditingMyProposal && (
                <button type="button" disabled={working} onClick={cancelEditingProposal} className="outfit-detail-pressable rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-black text-white/60 transition-[background-color,border-color,color,transform] duration-150 disabled:opacity-40">
                  수정 취소
                </button>
              )}
              <button disabled={selectedIds.length < 2 || explanation.trim().length < 10 || working} onClick={() => void submitProposal()} className="outfit-detail-pressable outfit-detail-primary-action flex w-full items-center justify-center rounded-xl bg-orange-500 py-3 text-sm font-black text-black transition-[background-color,transform] duration-150 disabled:opacity-35">{working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isEditingMyProposal ? "수정 저장" : "이 코디 제안하기"}</button>
            </div>
          </section>
        )}

        <section className={`mt-12 border-t border-white/10 pt-9 ${isOwner ? "order-3" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">제안된 코디 {outfitRequest.proposals.length}</h2>
            {outfitRequest.status !== "open" && <span className="flex items-center gap-1.5 text-xs text-white/35"><LockKeyhole className="h-3.5 w-3.5" />제안 마감</span>}
          </div>
          {orderedProposals.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-white/15 py-16 text-center">
              <Shirt className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-4 text-sm text-white/40">아직 등록된 코디가 없어요.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {orderedProposals.map((proposal, index) => {
                const accepted = proposal.id === outfitRequest.acceptedProposalId;
                const matchLabel = focusMatchLabel(proposal, outfitRequest.focusProductIds.length);
                const isMine = proposal.authorId === currentUserId;
                const isEditingThisProposal = editingProposalId === proposal.id;
                const previousProposal = orderedProposals[index - 1];
                const previousIsMine = previousProposal?.authorId === currentUserId;
                const showOtherHeading = !isMine && (index === 0 || previousIsMine);
                return (
                  <div key={proposal.id} className="space-y-3">
                    {showOtherHeading && (
                      <p className="px-1 text-xs font-black tracking-[-0.01em] text-white/55">다른 사람이 제안한 코디</p>
                    )}
                    <article className={`rounded-2xl border p-5 sm:p-6 ${accepted ? "border-orange-500/35 bg-orange-500/[0.055]" : "border-white/[0.09] bg-[#111114]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                          <p className="text-[11px] font-bold tracking-wide text-white/55">{isMine ? accepted ? "내 코디가 선택됐어요" : "내가 제안한 코디" : "제안한 사람"}</p>
                          <p className="mt-0.5 truncate text-base font-black tracking-[-0.01em] text-white">{proposal.authorUsername}</p>
                          {(matchLabel || isEditingThisProposal) && <div className="mt-2 flex flex-wrap gap-1.5">
                            {matchLabel && <span className="rounded-full border border-white/[0.09] bg-white/[0.035] px-2 py-1 text-[11px] font-bold text-white/55">{matchLabel}</span>}
                            {isEditingThisProposal && <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-1 text-[11px] font-black text-orange-300">수정 중</span>}
                          </div>}
                      </div>
                      <div className="flex items-center gap-1">
                        {accepted && <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-black">채택</span>}
                        {isMine && outfitRequest.status === "open" && (
                          isEditingThisProposal ? (
                            <button type="button" disabled={working} onClick={cancelEditingProposal} className="outfit-detail-pressable flex h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white/60 transition-[background-color,color,transform] duration-150 disabled:opacity-40">
                              수정 취소
                            </button>
                          ) : <>
                            <button type="button" disabled={working} onClick={() => startEditingProposal(proposal)} className="outfit-detail-pressable flex h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white/60 transition-[background-color,color,transform] duration-150 disabled:opacity-40" aria-label="제안 수정">
                              <Pencil className="h-3.5 w-3.5" />수정
                            </button>
                            <div ref={proposalMenuOpen === proposal.id ? proposalMenuRef : undefined} className="relative">
                              <button type="button" disabled={working} aria-label="제안 더보기" aria-haspopup="menu" aria-expanded={proposalMenuOpen === proposal.id} aria-controls={`outfit-proposal-menu-${proposal.id}`} onClick={() => setProposalMenuOpen((open) => open === proposal.id ? null : proposal.id)} className={`outfit-detail-pressable flex h-11 w-11 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 disabled:opacity-40 ${proposalMenuOpen === proposal.id ? "bg-white/[0.08] text-white" : "text-white/45"}`}>
                                <Ellipsis className="h-5 w-5" />
                              </button>
                              {proposalMenuOpen === proposal.id && (
                                <div id={`outfit-proposal-menu-${proposal.id}`} role="menu" aria-label="제안 관리" className="outfit-detail-menu absolute right-0 top-[calc(100%+0.5rem)] z-40 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.6)]">
                                  <button type="button" role="menuitem" onClick={() => { setProposalMenuOpen(null); setProposalAction({ type: "delete", proposal }); }} className="outfit-detail-pressable outfit-detail-danger-action flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-red-300 transition-[background-color,color,transform] duration-150 focus:bg-red-500/10 focus:outline-none">
                                    <Trash2 className="h-4 w-4" />제안 삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`mt-5 grid gap-3 ${proposal.products.length <= 2 ? "grid-cols-2" : proposal.products.length === 3 ? "grid-cols-2 sm:grid-cols-3" : proposal.products.length < 6 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>{proposal.products.map((product) => <OutfitProductTile key={product.id} product={product} />)}</div>
                    <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-4 sm:px-5">
                      <p className="text-xs font-bold text-white/45">스타일링 코멘트</p>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-white/90">{proposal.explanation}</p>
                    </div>
                    {isOwner && outfitRequest.status === "open" && <div className="mt-5 border-t border-white/10 pt-4"><button disabled={working} onClick={() => setProposalAction({ type: "accept", proposal })} className="outfit-detail-pressable outfit-detail-secondary-action min-h-11 w-full rounded-xl border border-white/15 bg-white px-4 text-sm font-black text-black transition-[background-color,border-color,color,transform] duration-150">이 코디 채택하기</button></div>}
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {isOwner && (
          <section id="shared-closet-section" className="mt-10 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">공유된 Closet</h2>
              <p className="mt-1 text-sm text-white/55">요청을 올린 시점의 상품 {outfitRequest.products.length}개</p>
              </div>
              <div className="relative max-w-full">
                <div ref={categoryFilterRef} aria-label="공유된 옷 카테고리 필터" className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button type="button" aria-pressed={!category} onClick={() => selectCategory("")} className={`outfit-detail-pressable outfit-detail-filter min-h-11 whitespace-nowrap rounded-full border px-4 text-xs font-bold transition-[background-color,border-color,color,transform] duration-150 ${!category ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.035] text-white/55"}`}>전체</button>
                  {categories.map((item) => (
                    <button key={item} type="button" aria-pressed={category === item} onClick={() => selectCategory(item)} className={`outfit-detail-pressable outfit-detail-filter min-h-11 whitespace-nowrap rounded-full border px-4 text-xs font-bold transition-[background-color,border-color,color,transform] duration-150 ${category === item ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.035] text-white/55"}`}>{item}</button>
                  ))}
                </div>
                {hasMoreCategories && <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black via-black/85 to-transparent" />}
              </div>
            </div>
            <div id="shared-closet-product-grid" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayedProducts.map((product) => {
                const productId = String(product.id);
                return <OutfitProductTile key={product.id} product={product} badge={outfitRequest.focusProductIds.includes(productId) ? "활용 희망" : undefined} selectable={canComposeProposal} selected={selectedIds.includes(productId)} selectionLimitReached={selectedIds.length >= 6} onClick={() => toggleProduct(productId)} />;
              })}
            </div>
            {hiddenProductCount > 0 && <button type="button" aria-controls="shared-closet-product-grid" onClick={showMoreProducts} className="outfit-detail-pressable outfit-detail-secondary-action mt-4 flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-white/55 transition-[background-color,border-color,color,transform] duration-150"><span className="text-sm font-bold">아이템 {nextProductCount}개 더 보기</span><span className="mt-0.5 text-xs font-semibold text-white/35">{hiddenProductCount}개 남음</span></button>}
          </section>
        )}
        {confirmAction && <OutfitRequestConfirmDialog action={confirmAction} working={working} onCancel={() => setConfirmAction(null)} onConfirm={() => { if (confirmAction === "delete") void removeRequest(); else void closeRequest(); }} />}
        {proposalConfirmOpen && <OutfitProposalConfirmDialog matchedCount={outfitRequest.focusProductIds.filter((id) => selectedIds.includes(id)).length} totalCount={outfitRequest.focusProductIds.length} isEditing={isEditingMyProposal} working={working} onCancel={() => setProposalConfirmOpen(false)} onConfirm={() => void submitProposal(true)} />}
        {proposalAction && <OutfitProposalActionDialog action={proposalAction} working={working} onCancel={() => setProposalAction(null)} onConfirm={() => { if (proposalAction.type === "delete") void removeProposal(proposalAction.proposal.id); else void acceptProposal(proposalAction.proposal); }} />}
        {previewProduct && <OutfitFocusProductPreviewDialog product={previewProduct} onClose={() => setPreviewProduct(null)} selected={selectedIds.includes(String(previewProduct.id))} onToggle={canComposeProposal ? () => toggleProduct(String(previewProduct.id)) : undefined} />}
      </div>
    </main>
  );
}
