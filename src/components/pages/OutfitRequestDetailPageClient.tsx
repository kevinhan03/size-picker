"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Ellipsis, LoaderCircle, LockKeyhole, MessageCircleMore, Pencil, Shirt, Trash2, X } from "lucide-react";
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
import type { OutfitProposal, OutfitRequestDetail } from "../../types";
import { captureEvent } from "../../utils/analytics";
import { buildLoginHref } from "../../utils/authNavigation";
import { ProgressiveImage } from "../ProgressiveImage";
import { OutfitProductTile } from "../outfits/OutfitProductTile";
import { PageState } from "../PageState";
import { usePresence } from "../../hooks/usePresence";

const SHARED_CLOSET_PAGE_SIZE = 10;

function statusLabel(status: OutfitRequestDetail["status"]) {
  return status === "open" ? "진행 중" : status === "accepted" ? "채택 완료" : "종료";
}

function focusMatchLabel(proposal: OutfitProposal, focusItemCount: number) {
  if (proposal.focusMatch === "all") return "선택 아이템 활용";
  if (proposal.focusMatch === "partial") return `선택 아이템 ${proposal.matchedFocusItemCount}/${focusItemCount}개 활용`;
  if (proposal.focusMatch === "none") return "대안 코디";
  return "";
}

type RequestConfirmAction = "close" | "delete";
type ProposalConfirmAction = { type: "accept" | "delete"; proposal: OutfitProposal };

function OutfitTextBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-r-2xl border-l-2 border-orange-500/70 bg-white/[0.035] px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex items-center gap-1.5 text-[11px] font-black text-orange-300">
        <MessageCircleMore className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-[15px] font-medium leading-7 text-white/90">{children}</p>
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
  const close = () => presence.requestClose(onCancel);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
    >
      <button type="button" aria-label="확인창 닫기" disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => { if (event.key === "Escape" && !working) close(); }}
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
  const close = () => presence.requestClose(onCancel);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button type="button" aria-label="확인창 닫기" disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="outfit-proposal-confirm-title"
        onKeyDown={(event) => { if (event.key === "Escape" && !working) close(); }}
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
  const close = () => presence.requestClose(onCancel);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button type="button" aria-label="확인창 닫기" disabled={working} onClick={close} className="ui-layer-scrim absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" data-visible={presence.isVisible} />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => { if (event.key === "Escape" && !working) close(); }}
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
  const requestMenuRef = useRef<HTMLDivElement>(null);

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

  const categories = useMemo(() => outfitRequest ? [...new Set(outfitRequest.products.map((product) => product.category).filter(Boolean))] : [], [outfitRequest]);
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
  const isOwner = Boolean(outfitRequest && currentUserId === outfitRequest.authorId);
  const myProposal = outfitRequest?.proposals.find((proposal) => proposal.authorId === currentUserId) || null;
  const isEditingMyProposal = Boolean(myProposal && editingProposalId === myProposal.id);
  const canComposeProposal = Boolean(!isOwner && outfitRequest?.status === "open" && (!myProposal || isEditingMyProposal));
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
      await load();
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
  if (!outfitRequest) return <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]"><PageState kind="error" title="코디 요청을 찾을 수 없어요" description={error || "요청이 삭제되었거나 더 이상 볼 수 없습니다."} action={<button type="button" onClick={() => router.push("/outfits")} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-black">목록으로 돌아가기</button>} /></main>;

  const orderedProposals = acceptedProposal
    ? [acceptedProposal, ...outfitRequest.proposals.filter((proposal) => proposal.id !== acceptedProposal.id)]
    : outfitRequest.proposals;

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/outfits")}
            className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">코디 목록</span>
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
                className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${requestMenuOpen ? "bg-white/[0.08] text-white" : "text-gray-400 hover:bg-white/[0.06] hover:text-white"}`}
              >
                <Ellipsis className="h-5 w-5" />
                <span className="hidden sm:inline">요청 관리</span>
              </button>

              {requestMenuOpen && (
                <div
                  id="outfit-request-management-menu"
                  role="menu"
                  aria-label="코디 요청 관리"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#17171a] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.6)]"
                >
                  {outfitRequest.status === "open" && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setRequestMenuOpen(false);
                        setConfirmAction("close");
                      }}
                      className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-gray-200 transition hover:bg-white/[0.07] focus:bg-white/[0.07] focus:outline-none"
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
                      className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-red-300 transition hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none"
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

        <section className="mt-7 rounded-3xl border border-white/10 bg-[#0d0d10] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4"><p className="text-sm font-bold text-orange-400">@{outfitRequest.authorUsername}</p><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${outfitRequest.status === "open" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/55"}`}>{statusLabel(outfitRequest.status)}</span></div>
          <div className="mt-6">
            <OutfitTextBlock label="코디 고민">{outfitRequest.description}</OutfitTextBlock>
          </div>
          {focusProducts.length > 0 && (
            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="text-xs font-black text-orange-300">우선 활용 요청 아이템</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {focusProducts.map((product) => <OutfitProductTile key={product.id} product={product} badge="요청 아이템" />)}
              </div>
            </div>
          )}
        </section>

        {acceptedProposal && <section className="mt-8 rounded-3xl border border-orange-500/45 bg-orange-500/[0.07] p-6"><div className="flex items-center gap-2 text-orange-300"><Check className="h-5 w-5" /><h2 className="font-black">채택한 코디</h2></div><div className="mt-3 flex flex-wrap items-center gap-2"><p className="text-sm font-bold">@{acceptedProposal.authorUsername}</p>{focusMatchLabel(acceptedProposal, outfitRequest.focusProductIds.length) && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-orange-200">{focusMatchLabel(acceptedProposal, outfitRequest.focusProductIds.length)}</span>}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{acceptedProposal.products.map((product) => <OutfitProductTile key={product.id} product={product} />)}</div><div className="mt-5"><OutfitTextBlock label="스타일링 코멘트">{acceptedProposal.explanation}</OutfitTextBlock></div></section>}

        <section id="shared-closet-section" className="mt-10 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">공유된 Closet</h2>
              <p className="mt-1 text-sm text-white/40">요청을 올린 시점의 상품 {outfitRequest.products.length}개</p>
            </div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                aria-pressed={!category}
                onClick={() => selectCategory("")}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${!category ? "bg-white text-black" : "bg-white/[0.06] text-white/50"}`}
              >
                전체
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => selectCategory(item)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${category === item ? "bg-white text-black" : "bg-white/[0.06] text-white/50"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div id="shared-closet-product-grid" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedProducts.map((product) => {
              const productId = String(product.id);
              return (
                <OutfitProductTile
                  key={product.id}
                  product={product}
                  badge={outfitRequest.focusProductIds.includes(productId) ? "요청 아이템" : undefined}
                  selectable={canComposeProposal}
                  selected={selectedIds.includes(productId)}
                  order={selectedIds.indexOf(productId) + 1}
                  onClick={() => toggleProduct(productId)}
                />
              );
            })}
          </div>
          {hiddenProductCount > 0 && (
            <button
              type="button"
              aria-controls="shared-closet-product-grid"
              onClick={() => setVisibleProductCount((current) => current + SHARED_CLOSET_PAGE_SIZE)}
              className="mt-4 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm font-bold text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              옷 더 보기 · {hiddenProductCount}개 남음
            </button>
          )}
        </section>

        {canComposeProposal && (
          <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-orange-500/30 bg-[#121214] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-black">{isEditingMyProposal ? "코디 수정하기" : "코디 제안하기"}</h2>
                <p className="mt-1 text-xs leading-5 text-white/40">상품은 선택한 순서대로 표시됩니다. 요청 아이템을 제외한 경우 설명에 이유를 작성하십시오.</p>
              </div>
              <span className={`shrink-0 text-sm font-black ${selectedIds.length >= 2 ? "text-orange-400" : "text-white/30"}`}>{selectedIds.length}/6</span>
            </div>

            {selectedProducts.length > 0 ? (
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {selectedProducts.map((product, index) => (
                  <div key={product.id} className="relative aspect-square overflow-hidden rounded-xl border border-white/15 bg-white/[0.04]">
                    <ProgressiveImage src={product.thumbnailImage || product.image} alt={`${product.brand} ${product.name}`} className="object-cover" />
                    <span className="absolute left-1.5 top-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-black shadow-md">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleProduct(String(product.id))}
                      aria-label={`${product.brand} ${product.name} 선택 해제`}
                      className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border-0 bg-black/75 p-0 text-white shadow-md outline-none backdrop-blur transition hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm font-semibold text-white/40">공유된 Closet에서 코디에 사용할 옷을 2개 이상 선택하십시오.</p>
            )}

            {selectedIds.length === 1 && <p className="mt-3 text-xs font-semibold text-orange-300">코디를 완성하려면 옷을 1개 더 선택하십시오.</p>}
            <textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} maxLength={300} rows={3} placeholder="이 조합이 상황에 잘 맞는 이유를 10자 이상 작성하십시오." className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/50 p-3 text-sm outline-none placeholder:text-white/25 focus:border-orange-500/60" />
            <div className={`mt-3 grid gap-2 ${isEditingMyProposal ? "grid-cols-2" : "grid-cols-1"}`}>
              {isEditingMyProposal && (
                <button type="button" disabled={working} onClick={cancelEditingProposal} className="rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-black text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40">
                  수정 취소
                </button>
              )}
              <button disabled={selectedIds.length < 2 || explanation.trim().length < 10 || working} onClick={() => void submitProposal()} className="flex w-full items-center justify-center rounded-xl bg-orange-500 py-3 text-sm font-black text-black disabled:opacity-35">{working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isEditingMyProposal ? "수정 저장" : "이 코디 제안하기"}</button>
            </div>
          </section>
        )}

        {error && <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

        <section className="mt-12 border-t border-white/10 pt-9">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">받은 코디 {outfitRequest.proposals.length}</h2>
            {outfitRequest.status !== "open" && <span className="flex items-center gap-1.5 text-xs text-white/35"><LockKeyhole className="h-3.5 w-3.5" />제안 마감</span>}
          </div>
          {orderedProposals.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-white/15 py-16 text-center">
              <Shirt className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-4 text-sm text-white/40">아직 등록된 코디가 없어요.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {orderedProposals.map((proposal) => {
                const accepted = proposal.id === outfitRequest.acceptedProposalId;
                const matchLabel = focusMatchLabel(proposal, outfitRequest.focusProductIds.length);
                const isMine = proposal.authorId === currentUserId;
                return (
                  <article key={proposal.id} className={`rounded-3xl border p-5 ${accepted ? "border-orange-500/45 bg-orange-500/[0.06]" : "border-white/10 bg-[#0d0d10]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">@{proposal.authorUsername}</p>
                        {matchLabel && <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${proposal.focusMatch === "none" ? "bg-white/10 text-white/55" : "bg-orange-500/15 text-orange-200"}`}>{matchLabel}</span>}
                        {editingProposalId === proposal.id && <span className="text-[11px] font-black text-orange-300">수정 중</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {accepted && <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-black">채택</span>}
                        {isMine && outfitRequest.status === "open" && (
                          <>
                            <button type="button" disabled={working} onClick={() => startEditingProposal(proposal)} className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40" aria-label="제안 수정">
                              <Pencil className="h-3.5 w-3.5" />수정
                            </button>
                            <button type="button" disabled={working} onClick={() => setProposalAction({ type: "delete", proposal })} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40" aria-label="제안 삭제">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{proposal.products.map((product) => <OutfitProductTile key={product.id} product={product} />)}</div>
                    <div className="mt-4">
                      <OutfitTextBlock label="스타일링 코멘트">{proposal.explanation}</OutfitTextBlock>
                    </div>
                    {isOwner && outfitRequest.status === "open" && <button disabled={working} onClick={() => setProposalAction({ type: "accept", proposal })} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-black hover:bg-orange-400">이 코디 채택하기</button>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
        {confirmAction && <OutfitRequestConfirmDialog action={confirmAction} working={working} onCancel={() => setConfirmAction(null)} onConfirm={() => { if (confirmAction === "delete") void removeRequest(); else void closeRequest(); }} />}
        {proposalConfirmOpen && <OutfitProposalConfirmDialog matchedCount={outfitRequest.focusProductIds.filter((id) => selectedIds.includes(id)).length} totalCount={outfitRequest.focusProductIds.length} isEditing={isEditingMyProposal} working={working} onCancel={() => setProposalConfirmOpen(false)} onConfirm={() => void submitProposal(true)} />}
        {proposalAction && <OutfitProposalActionDialog action={proposalAction} working={working} onCancel={() => setProposalAction(null)} onConfirm={() => { if (proposalAction.type === "delete") void removeProposal(proposalAction.proposal.id); else void acceptProposal(proposalAction.proposal); }} />}
      </div>
    </main>
  );
}
