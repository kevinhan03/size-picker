"use client";

import { styleTagLabel, type ProductTasteDecision } from "../../utils/tasteGraph";

function decisionCopy(decision: ProductTasteDecision) {
  const primary = styleTagLabel(decision.primaryTag);

  if (decision.kind === "new_direction") {
    return {
      title: `지금 옷장에 드문 ${primary} 감도의 상품이에요.`,
      accent: "text-sky-200",
      border: "border-sky-300/20",
      background: "bg-sky-300/[0.055]",
    };
  }

  if (decision.kind === "overlap") {
    return {
      title: `${primary} 감도의 보유 상품과 매우 비슷해요.`,
      accent: "text-amber-200",
      border: "border-amber-300/20",
      background: "bg-amber-300/[0.055]",
    };
  }

  return {
    title: `지금 즐겨 입는 ${primary} 감도와 잘 맞아요.`,
    accent: "text-orange-200",
    border: "border-orange-300/20",
    background: "bg-orange-300/[0.055]",
  };
}

function TagValues({
  decision,
  type,
}: {
  decision: ProductTasteDecision;
  type: "product" | "closet";
}) {
  return (
    <span className="flex min-w-0 flex-wrap gap-1.5">
      {decision.tagEvidence.map((entry) => (
        <span key={entry.tag} className="rounded-md bg-black/20 px-1.5 py-0.5 text-[11px] font-bold text-gray-200">
          {styleTagLabel(entry.tag)} {type === "product" ? `${Math.round(entry.productScore * 100)}점` : `${Math.round(entry.closetShare)}%`}
        </span>
      ))}
    </span>
  );
}

export function ProductTasteDecisionPanel({ decision }: { decision: ProductTasteDecision }) {
  const copy = decisionCopy(decision);

  return (
    <section className={`rounded-2xl border ${copy.border} ${copy.background} px-4 py-3.5`} aria-label="내 취향 분석">
      <p className={`m-0 text-[10px] font-black uppercase tracking-[0.1em] ${copy.accent}`}>내 취향 분석</p>
      <p className="mt-1.5 text-sm font-bold leading-5 text-gray-100">{copy.title}</p>

      <div className="mt-3 border-t border-white/[0.08] pt-3">
        <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-2 gap-y-2 text-xs">
          <span className="whitespace-nowrap pt-0.5 font-bold text-gray-500">상품 스타일 점수</span>
          <TagValues decision={decision} type="product" />
          <span className="whitespace-nowrap pt-0.5 font-bold text-gray-500">옷장 비중</span>
          <TagValues decision={decision} type="closet" />
        </div>
      </div>
    </section>
  );
}
