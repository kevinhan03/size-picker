"use client";
/* eslint-disable @next/next/no-img-element -- User avatars are dynamic Supabase Storage URLs. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, ArrowLeft, Check, ChevronDown, Ellipsis, Heart, LoaderCircle, LockKeyhole, Pencil, Shirt, Trash2, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createOutfitProposal,
  deleteOutfitProposal,
  deleteOutfitRequest,
  fetchOutfitRequest,
  setOutfitProposalLike,
  updateOutfitProposal,
  updateOutfitRequest,
} from "../../api/outfits";
import { useAuthContext } from "../../contexts/AuthContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { MessageKey } from "../../i18n/messages";
import { getCategoryLabel } from "../../constants";
import type { OutfitProposal, OutfitRequestDetail, Product } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { OutfitProductTile } from "../outfits/OutfitProductTile";
import { OutfitImageFrame } from "../outfits/OutfitImageFrame";
import { OutfitLoadingState } from "../outfits/OutfitLoadingState";
import { ProductStyleProfileCard } from "../ProductStyleProfileCard";
import { PageState } from "../PageState";
import { CategoryTabs } from "../CategoryTabs";
import { usePresence } from "../../hooks/usePresence";

const SHARED_CLOSET_PAGE_SIZE = 10;

function statusLabel(status: OutfitRequestDetail["status"]) {
  return status === "open" ? "진행 중" : status === "accepted" ? "채택 완료" : "종료";
}

function focusMatchLabel(proposal: OutfitProposal, focusItemCount: number, t: (key: MessageKey, values?: Record<string, string | number>) => string) {
  if (proposal.focusMatch === "all") return t("outfits.detail.usedFocusItems");
  if (proposal.focusMatch === "partial") return t("outfits.detail.usedFocusItemsPartial", { matched: proposal.matchedFocusItemCount, total: focusItemCount });
  if (proposal.focusMatch === "none") return t("outfits.detail.alternativeOutfit");
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
  const { t } = useLocaleContext();
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
      <button type="button" aria-label={t("outfits.detail.closeProductImage")} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/80 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("outfits.detail.productImageDialog", { product: `${product.brand} ${product.name}` })} tabIndex={-1} onKeyDown={(event) => { trapDialogFocus(event); if (event.key === "Escape") close(); }} className="ui-layer-modal ui-floating-surface relative z-10 h-[min(44rem,calc(100dvh-2rem))] w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17171a] shadow-[0_24px_64px_rgba(0,0,0,0.68)] outline-none" data-visible={presence.isVisible}>
        <button type="button" onClick={close} aria-label={t("outfits.detail.closeProductImage")} className="outfit-detail-modal-close outfit-detail-pressable absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white shadow-md backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"><X className="h-5 w-5" /></button>
        <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_19rem] md:grid-rows-1">
          <div className="relative min-h-0 bg-black/25 p-6 sm:p-8 md:p-10">
            <OutfitImageFrame product={product} alt={`${product.brand} ${product.name}`} fit="contain" />
          </div>
          <div className="flex min-h-0 flex-col border-t border-white/10 bg-[#17171a] p-5 sm:p-6 md:border-l md:border-t-0 md:p-7">
            <div>
              <div className="pr-11">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{product.brand}</p>
                <h2 className="mt-1 text-lg font-bold leading-6 tracking-[-0.015em] text-white">{product.name}</h2>
              </div>
              <p className="mt-2 text-sm text-white/55">
                {getCategoryLabel(product.category)}
                {product.subCategory ? ` · ${product.subCategory}` : ""}
              </p>
              <ProductStyleProfileCard product={product} />
            </div>
            {onToggle && (
              <div className="mt-6 border-t border-white/10 pt-5 md:mt-auto">
                {selected ? (
                  <>
                    <p className="text-sm font-semibold text-white/75">{t("outfits.detail.addedToOutfit")}</p>
                    <button type="button" onClick={onToggle} className="outfit-detail-pressable mt-3 min-h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-bold text-white transition-[background-color,border-color,color,transform] duration-150">{t("outfits.detail.removeFromOutfit")}</button>
                  </>
                ) : (
                  <button type="button" onClick={onToggle} className="outfit-detail-pressable min-h-11 w-full rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition-[background-color,color,transform] duration-150">{t("outfits.detail.addToOutfit")}</button>
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
  const { t } = useLocaleContext();
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
      <button type="button" aria-label={t("outfits.detail.closeDialog")} disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
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
          {isDelete ? t("outfits.detail.deleteRequestTitle") : t("outfits.detail.closeRequestTitle")}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
          {isDelete
            ? t("outfits.detail.deleteRequestDescription")
            : t("outfits.detail.closeRequestDescription")}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            autoFocus
            disabled={working}
            onClick={close}
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDelete ? t("common.cancel") : t("outfits.detail.keepReceiving")}
          </button>
          <button
            type="button"
            disabled={working}
            onClick={onConfirm}
            className={`flex h-11 items-center justify-center rounded-xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDelete ? "bg-red-500 text-white hover:bg-red-400" : "bg-orange-500 text-black hover:bg-orange-400"}`}
          >
            {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isDelete ? t("outfits.detail.deleteRequest") : t("outfits.detail.closeRequest")}
          </button>
        </div>
      </section>
    </div>
  );
}

function OutfitProposalConfirmDialog({
  matchedCount,
  totalCount,
  working,
  onCancel,
  onConfirm,
}: {
  matchedCount: number;
  totalCount: number;
  working: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLocaleContext();
  const isAlternative = matchedCount === 0;
  const actionLabel = t("outfits.detail.propose");
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; requestAnimationFrame(() => dialogRef.current?.focus()); return () => restoreFocusRef.current?.focus(); }, []);
  const close = () => presence.requestClose(onCancel);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button type="button" aria-label={t("outfits.detail.closeDialog")} disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
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
          {isAlternative ? t("outfits.detail.alternativeOutfitConfirm", { action: actionLabel }) : t("outfits.detail.outfitConfirm", { action: actionLabel })}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
          {isAlternative
            ? t("outfits.detail.alternativeOutfitDescription", { action: t("outfits.detail.propose") })
            : t("outfits.detail.partialFocusDescription", { total: totalCount, matched: matchedCount })}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" autoFocus disabled={working} onClick={close} className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60">{t("outfits.detail.chooseAgain")}</button>
          <button type="button" disabled={working} onClick={onConfirm} className="flex h-11 items-center justify-center rounded-xl bg-orange-500 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60">
            {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isAlternative ? t("outfits.detail.asAlternative", { action: actionLabel }) : t("outfits.detail.asIs", { action: actionLabel })}
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
  const { t } = useLocaleContext();
  const isDelete = action.type === "delete";
  const titleId = `outfit-proposal-${action.type}-title`;
  const presence = usePresence(true);
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => { restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; requestAnimationFrame(() => dialogRef.current?.focus()); return () => restoreFocusRef.current?.focus(); }, []);
  const close = () => presence.requestClose(onCancel);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button type="button" aria-label={t("outfits.detail.closeDialog")} disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
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
          {isDelete ? t("outfits.detail.deleteProposalTitle") : t("outfits.detail.acceptProposalTitle")}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">
          {isDelete
            ? t("outfits.detail.deleteProposalDescription")
            : t("outfits.detail.acceptProposalDescription")}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" autoFocus disabled={working} onClick={close} className="h-11 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isDelete ? t("common.cancel") : t("outfits.detail.reviewAgain")}
          </button>
          <button type="button" disabled={working} onClick={onConfirm} className={`flex h-11 items-center justify-center rounded-xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${isDelete ? "bg-red-500 text-white hover:bg-red-400" : "bg-orange-500 text-black hover:bg-orange-400"}`}>
            {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isDelete ? t("outfits.detail.deleteProposal") : t("outfits.detail.acceptOutfit")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function OutfitRequestDetailPageClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { t } = useLocaleContext();
  const returnToOutfits = () => {
    const source = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
    if (source === "mine" || source === "proposed") {
      router.push(`/outfits?tab=${source}`);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/outfits");
  };
  const { authUser, isAuthLoading } = useAuthContext();
  const authUserId = authUser?.id;
  const [outfitRequest, setOutfitRequest] = useState<OutfitRequestDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
  const [proposalSort, setProposalSort] = useState<"likes" | "latest">("latest");
  const [proposalSortMenuOpen, setProposalSortMenuOpen] = useState(false);
  const [likingProposalId, setLikingProposalId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [visibleProductAnnouncement, setVisibleProductAnnouncement] = useState("");
  const requestMenuRef = useRef<HTMLDivElement>(null);
  const proposalMenuRef = useRef<HTMLDivElement>(null);
  const proposalSortMenuRef = useRef<HTMLDivElement>(null);
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
      setError(loadError instanceof Error ? loadError.message : t("outfits.detail.loadError"));
    } finally {
      if (showInitialLoading) setLoading(false);
    }
  }, [requestId, t]);

  useEffect(() => {
    if (isAuthLoading) return;
    void load(true);
  }, [isAuthLoading, load]);

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

  useEffect(() => {
    if (!proposalSortMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!proposalSortMenuRef.current?.contains(event.target as Node)) setProposalSortMenuOpen(false);
    };
    const closeMenuWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProposalSortMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenuWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenuWithEscape);
    };
  }, [proposalSortMenuOpen]);

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
  const isOwner = Boolean(authUserId && outfitRequest && currentUserId === outfitRequest.authorId);
  const myProposal = authUserId ? outfitRequest?.proposals.find((proposal) => proposal.authorId === currentUserId) || null : null;
  const isEditingMyProposal = Boolean(myProposal && editingProposalId === myProposal.id);
  const canComposeProposal = Boolean(authUserId && !isOwner && outfitRequest?.status === "open" && (!myProposal || isEditingMyProposal));
  const selectionTrayPresence = usePresence(canComposeProposal && selectedProducts.length > 0);
  const selectionTrayCount = selectedProducts.length || (selectionTrayPresence.isMounted ? 1 : 0);
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
    setVisibleProductAnnouncement(t("outfits.detail.moreItemsAnnouncement", { shown: nextProductCount, remaining: remainingProductCount > 0 ? t("outfits.detail.remainingItemsAnnouncement", { count: remainingProductCount }) : "" }));
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
    if (!authUserId) {
      router.push(buildLoginHref("login", `/outfits/${requestId}`));
      return;
    }
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
      setStatusMessage(editingId ? t("outfits.detail.proposalUpdated") : t("outfits.detail.proposalCreated"));
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
      setError(workError instanceof Error ? workError.message : t("outfits.detail.proposalSaveError"));
    } finally {
      setWorking(false);
    }
  }

  async function toggleProposalLike(proposal: OutfitProposal) {
    if (!authUserId) {
      router.push(buildLoginHref("login", `/outfits/${requestId}${window.location.search}`));
      return;
    }
    if (likingProposalId) return;
    const active = !proposal.isLiked;
    const previousRequest = outfitRequest;
    setLikingProposalId(proposal.id);
    setOutfitRequest((current) => current && {
      ...current,
      proposals: current.proposals.map((item) => item.id === proposal.id
        ? { ...item, isLiked: active, likeCount: Math.max(0, item.likeCount + (active ? 1 : -1)) }
        : item),
    });
    try {
      const result = await setOutfitProposalLike(proposal.id, active);
      setOutfitRequest((current) => current && {
        ...current,
        proposals: current.proposals.map((item) => item.id === proposal.id
          ? { ...item, isLiked: result.active, likeCount: result.likeCount }
          : item),
      });
    } catch (likeError) {
      setOutfitRequest(previousRequest);
      setError(likeError instanceof Error ? likeError.message : "좋아요를 반영하지 못했습니다.");
    } finally {
      setLikingProposalId(null);
    }
  }

  async function acceptProposal(proposal: OutfitProposal) {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      const data = await updateOutfitRequest(requestId, { action: "accept", proposalId: proposal.id });
      setOutfitRequest(data.request);
      setStatusMessage(t("outfits.detail.outfitAccepted"));
      captureEvent("outfit_proposal_accepted", { request_id: requestId, proposal_id: proposal.id });
    } catch (workError) {
      setError(workError instanceof Error ? workError.message : t("outfits.detail.outfitAcceptError"));
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
      setStatusMessage(t("outfits.detail.requestClosed"));
      captureEvent("outfit_request_closed", { request_id: requestId });
    } catch (workError) { setError(workError instanceof Error ? workError.message : t("outfits.detail.requestCloseError")); setConfirmAction(null); }
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
      setStatusMessage(t("outfits.detail.proposalDeleted"));
    }
    catch (workError) { setError(workError instanceof Error ? workError.message : t("outfits.detail.proposalDeleteError")); }
    finally {
      setWorking(false);
      setProposalAction(null);
    }
  }

  async function removeRequest() {
    if (working) return;
    setWorking(true);
    try { await deleteOutfitRequest(requestId); router.replace("/outfits"); }
    catch (workError) { setError(workError instanceof Error ? workError.message : t("outfits.detail.requestDeleteError")); setConfirmAction(null); }
    finally { setWorking(false); }
  }

  if (isAuthLoading || loading || (!authUser && !error)) return <OutfitLoadingState variant="detail" title={t("outfits.loading")} description={t("outfits.detail.loadingDescription")} />;
  if (!outfitRequest) return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="error" title={t("outfits.detail.notFound")} description={error || t("outfits.detail.notFoundDescription")} action={<button type="button" onClick={returnToOutfits} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-black">{t("outfits.detail.backToList")}</button>} /></main>;

  const compareProposals = (left: OutfitProposal, right: OutfitProposal) => proposalSort === "likes"
    ? right.likeCount - left.likeCount || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  const otherProposals = outfitRequest.proposals.filter((proposal) => proposal.id !== myProposal?.id).sort(compareProposals);
  const orderedProposals = myProposal ? [myProposal, ...otherProposals] : [...outfitRequest.proposals].sort(compareProposals);

  return (
    <main className={`min-h-screen bg-black px-[var(--app-main-px)] pt-[var(--app-main-pt)] text-white lg:pt-24 ${canComposeProposal ? "pb-32 sm:pb-[var(--app-main-pb)]" : "pb-[var(--app-main-pb)]"}`} aria-busy={loading || working}>
      <div className="mx-auto flex max-w-5xl flex-col">
        <section className="relative w-full rounded-3xl border border-white/[0.1] bg-[#111114] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-7">
          <button
            type="button"
            onClick={returnToOutfits}
            aria-label={t("outfits.detail.list")}
            title={t("outfits.detail.list")}
            className="outfit-detail-pressable absolute left-2 top-5 flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-[background-color,color,transform] duration-150 sm:left-4 sm:top-7"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 pl-8 sm:pl-9">
            <Link
              href={`/${encodeURIComponent(outfitRequest.authorUsername)}`}
              aria-label={`${outfitRequest.authorUsername} 프로필 보기`}
              className="group inline-flex min-w-0 items-center gap-2 rounded-full pr-2 text-[13px] font-bold tracking-[-0.01em] text-white/70 transition-[color,transform] duration-150 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              {outfitRequest.authorAvatarUrl ? (
                <img src={outfitRequest.authorAvatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover transition-colors duration-150 group-hover:border-white/25" />
              ) : (
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/50 transition-[border-color,color] duration-150 group-hover:border-white/25 group-hover:text-white/70"><UserRound className="h-4 w-4" /></span>
              )}
              <span className="truncate">{outfitRequest.authorUsername}</span>
            </Link>
            <div className="flex items-center gap-2">
              {outfitRequest.status !== "open" && <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/45">{outfitRequest.status === "accepted" ? t("outfits.status.accepted") : t("outfits.status.closed")}</span>}
              {outfitRequest.proposals.length > 0 && <span className="inline-flex min-h-8 shrink-0 items-center rounded-full border border-white/[0.1] bg-white/[0.06] px-3 text-[13px] font-bold text-white/75">{t("outfits.card.proposals", { count: outfitRequest.proposals.length })}</span>}
              {isOwner && (
                <div ref={requestMenuRef} className="relative">
                  <button type="button" aria-label={t("outfits.detail.manageRequest")} aria-haspopup="menu" aria-expanded={requestMenuOpen} aria-controls="outfit-request-management-menu" onClick={() => setRequestMenuOpen((open) => !open)} className={`outfit-detail-pressable flex h-10 w-10 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 ${requestMenuOpen ? "bg-white/[0.08] text-white" : "text-gray-400"}`}><Ellipsis className="h-5 w-5" /></button>
                  {requestMenuOpen && (
                    <div id="outfit-request-management-menu" role="menu" aria-label={t("outfits.detail.requestManagementMenu")} className="outfit-detail-menu absolute right-0 top-[calc(100%+0.5rem)] z-40 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.6)]">
                      {outfitRequest.status === "open" && <button type="button" role="menuitem" onClick={() => { setRequestMenuOpen(false); setConfirmAction("close"); }} className="outfit-detail-pressable flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-gray-200 transition-[background-color,color,transform] duration-150 focus:bg-white/[0.07] focus:outline-none"><LockKeyhole className="h-4 w-4 text-gray-400" />{t("outfits.detail.closeRequest")}</button>}
                      <div className={outfitRequest.status === "open" ? "mt-1 border-t border-white/10 pt-1" : ""}><button type="button" role="menuitem" onClick={() => { setRequestMenuOpen(false); setConfirmAction("delete"); }} className="outfit-detail-pressable outfit-detail-danger-action flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-red-300 transition-[background-color,color,transform] duration-150 focus:bg-red-500/10 focus:outline-none"><Trash2 className="h-4 w-4" />{t("outfits.detail.deleteRequest")}</button></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={`mt-4 ${focusProducts.length > 0 ? "md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] md:gap-8" : ""}`}>
            <h1 className="max-w-3xl whitespace-pre-wrap break-words text-[clamp(1.25rem,2.4vw,1.75rem)] font-bold leading-8 tracking-[-0.02em] text-white sm:mt-1 sm:leading-10">{outfitRequest.description}</h1>
            {focusProducts.length > 0 && (
            <div className="mt-6 border-t border-white/[0.1] pt-4 md:mt-0 md:border-l md:border-t-0 md:pl-6 md:pt-0 sm:pt-5">
              <p className="text-xs font-bold tracking-[0.01em] text-white/65">{t("outfits.detail.desiredItems")}</p>
              <div className="mt-3 flex gap-2.5 sm:mt-3.5 sm:gap-3">
                {focusProducts.slice(0, 3).map((product) => <article key={product.id} className="w-[calc((100%_-_1.25rem)_/_3)] max-w-36 min-w-0 sm:w-[calc((100%_-_1.5rem)_/_3)] sm:max-w-40"><button type="button" onClick={() => setPreviewProduct(product)} aria-label={t("outfits.detail.productImageDialog", { product: `${product.brand} ${product.name}` })} className="outfit-detail-pressable relative block w-full overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.035] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"><div className="relative aspect-[4/5] bg-white/[0.035]"><OutfitImageFrame product={product} alt={`${product.brand} ${product.name}`} fit="contain" /></div></button><p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-wide text-white/55">{product.brand}</p><p className="mt-1 min-h-10 line-clamp-2 text-[13px] font-semibold leading-5 text-white/90">{product.name}</p></article>)}
              </div>
            </div>
            )}
          </div>
        </section>

        <p aria-live="polite" className="sr-only">{statusMessage}</p>
        <p aria-live="polite" className="sr-only">{visibleProductAnnouncement}</p>
        {error && <p role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

        {!isOwner && (
        <section id="shared-closet-section" className="mt-10 scroll-mt-24">
          <div>
            <h2 className="text-xl font-black tracking-[-0.015em]">{t("outfits.detail.sharedCloset", { username: outfitRequest.authorUsername })}</h2>
            <CategoryTabs category={category} onCategoryChange={(value) => selectCategory(value)} allLabel={t("outfits.detail.all")} ariaLabel={t("outfits.detail.categoryFilter")} className="mt-4" spacing="default" alignment="center" />
          </div>
          <div id="shared-closet-product-grid" className="mt-0 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedProducts.map((product) => {
              const productId = String(product.id);
              return (
                <OutfitProductTile
                  key={product.id}
                  product={product}
                  badge={outfitRequest.focusProductIds.includes(productId) ? t("outfits.detail.desiredBadge") : undefined}
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
              <span className="text-sm font-bold">{t("outfits.detail.moreItems", { count: nextProductCount })}</span>
              <span className="mt-0.5 text-xs font-semibold text-white/35">{t("outfits.detail.remainingItems", { count: hiddenProductCount })}</span>
            </button>
          )}
          {!authUserId && outfitRequest.status === "open" && (
            <section className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-400/[0.07] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="font-black text-orange-100">이 옷장으로 코디를 제안해보세요</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-white/55">로그인하면 아이템을 골라 나만의 코디를 제안할 수 있어요.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(buildLoginHref("login", `/outfits/${requestId}`))}
                className="outfit-detail-pressable mt-3 min-h-11 w-full shrink-0 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition-[background-color,transform] hover:bg-orange-400 sm:mt-0 sm:w-auto"
              >
                로그인하고 제안하기
              </button>
            </section>
          )}
          {selectionTrayPresence.isMounted && (
            <aside aria-label={t("outfits.detail.selectionStatus")} data-visible={selectionTrayPresence.isVisible} className="outfit-detail-selection-tray fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-[#161619]/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur sm:sticky sm:bottom-4 sm:inset-x-auto sm:mt-5 sm:max-w-3xl">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                <span aria-live="polite" className="text-sm font-bold text-white/80">{t("outfits.detail.selectedItems", { count: selectionTrayCount })}</span>
              </div>
              {selectionTrayCount >= 2 && <button type="button" onClick={focusComposer} className="outfit-detail-pressable outfit-detail-primary-action min-h-11 shrink-0 rounded-xl bg-orange-500 px-4 text-xs font-black text-black transition-[background-color,transform] duration-150">{t("outfits.detail.writeProposal")}</button>}
            </aside>
          )}
        </section>
        )}

        {canComposeProposal && selectedIds.length >= 2 && (
          <section ref={composerRef} aria-labelledby="outfit-proposal-heading" className="mx-auto mt-8 w-full max-w-5xl scroll-mt-24 rounded-3xl border border-orange-500/25 bg-[#121214] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="outfit-proposal-heading" className="text-xl font-black tracking-[-0.02em] sm:text-2xl">{t("outfits.detail.proposeOutfit")}</h2>
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
                        aria-label={t("outfits.detail.unselectProduct", { product: `${product.brand} ${product.name}` })}
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
              <p className="mt-5 text-sm font-semibold text-white/55">{t("outfits.detail.selectItemsHelp")}</p>
            )}

            {selectedIds.length === 1 && <p className="mt-3 text-xs font-semibold text-orange-300">{t("outfits.detail.selectOneMoreForOutfit")}</p>}
            <label htmlFor="outfit-proposal-explanation" className="mt-7 block border-t border-white/10 pt-6 text-sm font-bold text-white/75">{t("outfits.detail.stylingComment")}</label>
            <textarea ref={explanationRef} id="outfit-proposal-explanation" value={explanation} onChange={(event) => setExplanation(event.target.value)} maxLength={300} rows={3} placeholder={t("outfits.detail.commentPlaceholder")} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/50 p-3 text-sm outline-none placeholder:text-white/25 focus:border-orange-500/60" />
            <div className={`mt-4 grid gap-2 ${isEditingMyProposal ? "grid-cols-2" : "grid-cols-1"}`}>
              {isEditingMyProposal && (
                <button type="button" disabled={working} onClick={cancelEditingProposal} className="outfit-detail-pressable rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-black text-white/60 transition-[background-color,border-color,color,transform] duration-150 disabled:opacity-40">
                  {t("common.cancel")}
                </button>
              )}
              <button disabled={selectedIds.length < 2 || explanation.trim().length < 10 || working} onClick={() => void submitProposal()} className="outfit-detail-pressable outfit-detail-primary-action flex w-full items-center justify-center rounded-xl bg-orange-500 py-3 text-sm font-black text-black transition-[background-color,transform] duration-150 disabled:opacity-35">{working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isEditingMyProposal ? t("outfits.detail.edit") : t("outfits.detail.proposeThisOutfit")}</button>
            </div>
          </section>
        )}

        <section className={`mt-12 border-t border-white/10 pt-9 ${isOwner ? "order-3" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">추천 코디</h2>
            <div className="flex items-center gap-2">
              <div ref={proposalSortMenuRef} className="relative">
                <button type="button" aria-label={t("outfits.detail.sortProposals")} aria-haspopup="menu" aria-expanded={proposalSortMenuOpen} aria-controls="outfit-proposal-sort-menu" onClick={() => setProposalSortMenuOpen((open) => !open)} className={`outfit-detail-pressable flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-[background-color,color,transform] ${proposalSortMenuOpen ? "bg-white/[0.08] text-white" : "text-white/65"}`}>
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  <span>{proposalSort === "likes" ? t("outfits.detail.sortByLikes") : t("outfits.detail.sortByLatest")}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${proposalSortMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {proposalSortMenuOpen && (
                  <div id="outfit-proposal-sort-menu" role="menu" aria-label={t("outfits.detail.sortProposals")} className="outfit-detail-menu absolute right-0 top-[calc(100%+0.5rem)] z-40 w-32 overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.6)]">
                    {(["latest", "likes"] as const).map((sort) => (
                      <button key={sort} type="button" role="menuitemradio" aria-checked={proposalSort === sort} onClick={() => { setProposalSort(sort); setProposalSortMenuOpen(false); }} className={`outfit-detail-pressable flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-xs font-bold transition-[background-color,color,transform] ${proposalSort === sort ? "bg-white/[0.08] text-white" : "text-white/55"}`}>
                        {sort === "likes" ? t("outfits.detail.sortByLikes") : t("outfits.detail.sortByLatest")}
                        {proposalSort === sort && <Check className="h-3.5 w-3.5 text-orange-300" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {outfitRequest.status !== "open" && <span className="flex items-center gap-1.5 text-xs text-white/35"><LockKeyhole className="h-3.5 w-3.5" />{t("outfits.detail.proposalsClosed")}</span>}
            </div>
          </div>
          {orderedProposals.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-white/15 py-16 text-center">
              <Shirt className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-4 text-sm text-white/40">{t("outfits.detail.noProposals")}</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {orderedProposals.map((proposal) => {
                const accepted = proposal.id === outfitRequest.acceptedProposalId;
                const matchLabel = focusMatchLabel(proposal, outfitRequest.focusProductIds.length, t);
                const isMine = proposal.authorId === currentUserId;
                const isEditingThisProposal = editingProposalId === proposal.id;
                return (
                  <div key={proposal.id} className="space-y-3">
                    <article className={`rounded-2xl border p-5 sm:p-6 ${accepted ? "border-orange-500/35 bg-orange-500/[0.055]" : "border-white/[0.09] bg-[#111114]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                          <p className="text-[11px] font-bold tracking-wide text-white/55">{isMine ? accepted ? t("outfits.detail.myOutfitSelected") : t("outfits.detail.myProposal") : t("outfits.detail.proposer")}</p>
                          <p className="mt-0.5 truncate text-base font-black tracking-[-0.01em] text-white">{proposal.authorUsername}</p>
                          {(matchLabel || isEditingThisProposal) && <div className="mt-2 flex flex-wrap gap-1.5">
                            {matchLabel && <span className="rounded-full border border-white/[0.09] bg-white/[0.035] px-2 py-1 text-[11px] font-bold text-white/55">{matchLabel}</span>}
                            {isEditingThisProposal && <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-1 text-[11px] font-black text-orange-300">{t("outfits.detail.editing")}</span>}
                          </div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={likingProposalId === proposal.id}
                          aria-pressed={proposal.isLiked}
                          aria-label={proposal.isLiked ? t("outfits.detail.unlikeProposal") : t("outfits.detail.likeProposal")}
                          onClick={() => void toggleProposalLike(proposal)}
                          className={`outfit-detail-pressable flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition-[background-color,color,transform] disabled:opacity-50 ${proposal.isLiked ? "bg-orange-500/10 text-orange-300" : "text-white/60"}`}
                        >
                          <Heart className="h-[1.125rem] w-[1.125rem]" fill={proposal.isLiked ? "currentColor" : "none"} />
                          <span>{proposal.likeCount}</span>
                        </button>
                        {accepted && <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-black">{t("outfits.detail.accepted")}</span>}
                        {isMine && outfitRequest.status === "open" && (
                          isEditingThisProposal ? (
                            <button type="button" disabled={working} onClick={cancelEditingProposal} className="outfit-detail-pressable flex h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white/60 transition-[background-color,color,transform] duration-150 disabled:opacity-40">
                              {t("outfits.detail.cancelEdit")}
                            </button>
                          ) : (
                            <div ref={proposalMenuOpen === proposal.id ? proposalMenuRef : undefined} className="relative">
                              <button type="button" disabled={working} aria-label={t("outfits.detail.moreProposalActions")} aria-haspopup="menu" aria-expanded={proposalMenuOpen === proposal.id} aria-controls={`outfit-proposal-menu-${proposal.id}`} onClick={() => setProposalMenuOpen((open) => open === proposal.id ? null : proposal.id)} className={`outfit-detail-pressable flex h-11 w-11 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 disabled:opacity-40 ${proposalMenuOpen === proposal.id ? "bg-white/[0.08] text-white" : "text-white/45"}`}>
                                <Ellipsis className="h-5 w-5" />
                              </button>
                              {proposalMenuOpen === proposal.id && (
                                <div id={`outfit-proposal-menu-${proposal.id}`} role="menu" aria-label={t("outfits.detail.proposalManagement")} className="outfit-detail-menu absolute right-0 top-[calc(100%+0.5rem)] z-40 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.6)]">
                                  <button type="button" role="menuitem" onClick={() => { setProposalMenuOpen(null); startEditingProposal(proposal); }} className="outfit-detail-pressable flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-gray-200 transition-[background-color,color,transform] duration-150 focus:bg-white/[0.07] focus:outline-none">
                                    <Pencil className="h-4 w-4 text-gray-400" />{t("outfits.detail.edit")}
                                  </button>
                                  <div className="mt-1 border-t border-white/10 pt-1">
                                  <button type="button" role="menuitem" onClick={() => { setProposalMenuOpen(null); setProposalAction({ type: "delete", proposal }); }} className="outfit-detail-pressable outfit-detail-danger-action flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-red-300 transition-[background-color,color,transform] duration-150 focus:bg-red-500/10 focus:outline-none">
                                    <Trash2 className="h-4 w-4" />{t("outfits.detail.deleteProposal")}
                                  </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className={`mt-5 grid gap-3 ${proposal.products.length <= 2 ? "grid-cols-2" : proposal.products.length === 3 ? "grid-cols-2 sm:grid-cols-3" : proposal.products.length < 6 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>{proposal.products.map((product) => <OutfitProductTile key={product.id} product={product} />)}</div>
                    <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-4 sm:px-5">
                      <p className="text-xs font-bold text-white/45">{t("outfits.detail.stylingComment")}</p>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-white/90">{proposal.explanation}</p>
                    </div>
                    {isOwner && outfitRequest.status === "open" && <div className="mt-5 border-t border-white/10 pt-4"><button disabled={working} onClick={() => setProposalAction({ type: "accept", proposal })} className="outfit-detail-pressable outfit-detail-secondary-action min-h-11 w-full rounded-xl border border-white/15 bg-white px-4 text-sm font-black text-black transition-[background-color,border-color,color,transform] duration-150">{t("outfits.detail.acceptThisOutfit")}</button></div>}
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {isOwner && (
          <section id="shared-closet-section" className="mt-10 scroll-mt-24">
            <div>
              <div>
                <h2 className="text-xl font-black">{t("outfits.detail.sharedClosetTitle")}</h2>
              </div>
              <CategoryTabs category={category} onCategoryChange={(value) => selectCategory(value)} allLabel={t("outfits.detail.all")} ariaLabel={t("outfits.detail.categoryFilter")} className="mt-4" spacing="default" alignment="center" />
            </div>
            <div id="shared-closet-product-grid" className="mt-0 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayedProducts.map((product) => {
                const productId = String(product.id);
                return <OutfitProductTile key={product.id} product={product} badge={outfitRequest.focusProductIds.includes(productId) ? t("outfits.detail.desiredBadge") : undefined} selectable={canComposeProposal} selected={selectedIds.includes(productId)} selectionLimitReached={selectedIds.length >= 6} onClick={() => toggleProduct(productId)} />;
              })}
            </div>
            {hiddenProductCount > 0 && <button type="button" aria-controls="shared-closet-product-grid" onClick={showMoreProducts} className="outfit-detail-pressable outfit-detail-secondary-action mt-4 flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-white/55 transition-[background-color,border-color,color,transform] duration-150"><span className="text-sm font-bold">{t("outfits.detail.moreItems", { count: nextProductCount })}</span><span className="mt-0.5 text-xs font-semibold text-white/35">{t("outfits.detail.remainingItems", { count: hiddenProductCount })}</span></button>}
          </section>
        )}
        {confirmAction && <OutfitRequestConfirmDialog action={confirmAction} working={working} onCancel={() => setConfirmAction(null)} onConfirm={() => { if (confirmAction === "delete") void removeRequest(); else void closeRequest(); }} />}
        {proposalConfirmOpen && <OutfitProposalConfirmDialog matchedCount={outfitRequest.focusProductIds.filter((id) => selectedIds.includes(id)).length} totalCount={outfitRequest.focusProductIds.length} working={working} onCancel={() => setProposalConfirmOpen(false)} onConfirm={() => void submitProposal(true)} />}
        {proposalAction && <OutfitProposalActionDialog action={proposalAction} working={working} onCancel={() => setProposalAction(null)} onConfirm={() => { if (proposalAction.type === "delete") void removeProposal(proposalAction.proposal.id); else void acceptProposal(proposalAction.proposal); }} />}
        {previewProduct && <OutfitFocusProductPreviewDialog product={previewProduct} onClose={() => setPreviewProduct(null)} selected={selectedIds.includes(String(previewProduct.id))} onToggle={canComposeProposal ? () => toggleProduct(String(previewProduct.id)) : undefined} />}
      </div>
    </main>
  );
}
