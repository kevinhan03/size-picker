"use client";

import type { Product } from "../../types";
import { describeProductStyle, styleTagLabel, type ProductTasteDecision } from "../../utils/tasteGraph";

function decisionCopy(decision: ProductTasteDecision | null, isAuthenticated: boolean, hasEnoughTasteData: boolean) {
  if (!isAuthenticated) {
    return {
      title: "로그인하면 내 옷장과 취향을 비교할 수 있어요.",
      description: "저장한 상품을 바탕으로 이 상품이 내 취향과 어떻게 이어지는지 알려드려요.",
      accent: "text-gray-300",
    };
  }

  if (!hasEnoughTasteData) {
    return {
      title: "내 옷장에 상품 3개 이상을 저장하면 취향과 비교할 수 있어요.",
      description: "저장한 상품이 쌓일수록 비교가 더 정확해져요.",
      accent: "text-gray-300",
    };
  }

  if (!decision) {
    return {
      title: "이 상품의 스타일 정보를 분석하는 중이에요.",
      description: "분석이 완료되면 내 취향과의 조화를 알려드릴게요.",
      accent: "text-gray-300",
    };
  }

  const primary = styleTagLabel(decision.primaryTag);

  if (decision.kind === "new_direction") {
    return {
      title: "취향에 새로운 포인트가 돼요.",
      description: `평소보다 ${primary} 무드를 더하는 새로운 선택이에요.`,
      accent: "text-sky-200",
    };
  }

  if (decision.kind === "overlap") {
    const closestProduct = decision.closestProducts[0]?.product;
    const productName = [closestProduct?.brand, closestProduct?.name].filter(Boolean).join(" ");
    return {
      title: "비슷한 무드의 옷이 이미 있어요.",
      description: productName
        ? `${productName}와 분위기와 실루엣이 비슷해요.`
        : `${primary} 무드의 옷과 분위기와 실루엣이 비슷해요.`,
      accent: "text-amber-200",
    };
  }

  return {
    title: "내 취향에 잘 맞아요.",
    description: `내 옷장에서 자주 보이는 ${primary} 무드와 자연스럽게 어울려요.`,
    accent: "text-orange-200",
  };
}

interface ProductTasteDecisionPanelProps {
  product: Product;
  decision: ProductTasteDecision | null;
  isAuthenticated: boolean;
  hasEnoughTasteData: boolean;
}

export function ProductTasteDecisionPanel({
  product,
  decision,
  isAuthenticated,
  hasEnoughTasteData,
}: ProductTasteDecisionPanelProps) {
  const productDescription = describeProductStyle(product) || "상품 정보를 분석하는 중이에요.";
  const copy = decisionCopy(decision, isAuthenticated, hasEnoughTasteData);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.018] px-4 py-3" aria-label="상품 및 내 취향 인사이트">
      <div>
        <h5 className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">상품 설명</h5>
        <p className="mt-1 text-sm font-medium leading-5 text-gray-200">{productDescription}</p>
      </div>
      <div className="mt-2.5 border-t border-white/[0.06] pt-2.5">
        <h5 className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">내 취향과의 조화</h5>
        <p className={`mt-1 text-sm font-bold leading-5 tracking-[-0.01em] ${copy.accent}`}>{copy.title}</p>
        <p className="mt-0.5 text-xs font-medium leading-5 text-gray-400">{copy.description}</p>
      </div>
    </section>
  );
}
