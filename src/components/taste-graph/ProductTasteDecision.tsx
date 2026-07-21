"use client";

import { styleTagLabel, type ProductTasteDecision } from "../../utils/tasteGraph";

function decisionCopy(decision: ProductTasteDecision) {
  const primary = styleTagLabel(decision.primaryTag);

  if (decision.kind === "new_direction") {
    return {
      title: `${primary} 무드를 새롭게 더해줘요.`,
      accent: "text-sky-200",
      border: "border-sky-300/20",
      background: "bg-sky-300/[0.055]",
    };
  }

  if (decision.kind === "overlap") {
    return {
      title: `내 옷장에 비슷한 ${primary} 무드의 상품이 있어요.`,
      accent: "text-amber-200",
      border: "border-amber-300/20",
      background: "bg-amber-300/[0.055]",
    };
  }

  return {
    title: `${primary} 취향과 잘 맞아요.`,
    accent: "text-orange-200",
    border: "border-orange-300/20",
    background: "bg-orange-300/[0.055]",
  };
}

function productStrengthCopy(score: number) {
  if (score >= 0.75) return "강한 편";
  if (score >= 0.45) return "느껴지는 편";
  return "은은한 편";
}

function closetShareCopy(share: number) {
  if (share < 9) return "드문 편이에요";
  if (share < 20) return "가끔 있는 편이에요";
  return "많은 편이에요";
}

function TasteEvidence({ decision }: { decision: ProductTasteDecision }) {
  const evidence = decision.tagEvidence[0];
  if (!evidence) return null;

  const tag = styleTagLabel(evidence.tag);

  return (
    <div className="mt-3 border-t border-white/[0.08] pt-3">
      <p className="text-xs font-bold text-gray-200">{tag} 무드</p>
      <p className="mt-1.5 text-xs leading-5 text-gray-400">
        상품에서는 {productStrengthCopy(evidence.productScore)} ({Math.round(evidence.productScore * 100)}점)
        <span className="px-1.5 text-gray-600" aria-hidden="true">·</span>
        내 옷장에서는 {closetShareCopy(evidence.closetShare)} ({Math.round(evidence.closetShare)}%)
      </p>
    </div>
  );
}

export function ProductTasteDecisionPanel({ decision }: { decision: ProductTasteDecision }) {
  const copy = decisionCopy(decision);

  return (
    <section className={`rounded-2xl border ${copy.border} ${copy.background} px-4 py-3.5`} aria-label="내 취향 분석">
      <p className={`m-0 text-[10px] font-black uppercase tracking-[0.1em] ${copy.accent}`}>내 취향 분석</p>
      <p className="mt-1.5 text-sm font-bold leading-5 text-gray-100">{copy.title}</p>

      <TasteEvidence decision={decision} />
    </section>
  );
}
