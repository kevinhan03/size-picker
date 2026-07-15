"use client";

import { MapPinned, ArrowUpRight } from "lucide-react";
import { styleTagLabel, type ProductTasteDecision } from "../../utils/tasteGraph";

const ATTRIBUTE_LABELS: Record<string, string> = {
  fit: "핏",
  silhouette: "실루엣",
  formality: "격식",
  utility_level: "기능 디테일",
  material: "소재",
  color: "색상",
  wash_texture: "표면 질감",
  decoration_level: "장식성",
  sportiness: "스포티함",
  era_signal: "시대감",
  details: "디테일",
};

const describeMatches = (decision: ProductTasteDecision) => {
  const closest = decision.closestProducts[0];
  if (!closest) return "";
  return [...closest.shapeMatches, ...closest.expressionMatches]
    .map((attribute) => ATTRIBUTE_LABELS[attribute])
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");
};

function decisionCopy(decision: ProductTasteDecision) {
  const primary = styleTagLabel(decision.primaryTag);
  const secondary = decision.secondaryTag ? styleTagLabel(decision.secondaryTag) : null;
  const matchingAttributes = describeMatches(decision);

  if (decision.kind === "new_direction") {
    return {
      eyebrow: "NEW DIRECTION",
      title: `지금 옷장에 없던 ${primary} 감도를 더해볼 상품이에요.`,
      description: secondary
        ? `${primary}에 ${secondary}을 더한 인상이 현재 가진 옷에서는 드문 편입니다.`
        : `${primary} 성향이 현재 가진 옷에서는 드문 편입니다.`,
      accent: "text-sky-300",
      border: "border-sky-300/25",
      background: "bg-sky-300/[0.06]",
    };
  }

  if (decision.kind === "overlap") {
    return {
      eyebrow: "ALREADY CLOSE",
      title: `같은 종류의 ${primary} 아이템과 상당히 겹쳐요.`,
      description: matchingAttributes
        ? `${matchingAttributes}까지 비슷합니다. 새로운 활용 장면이나 확실한 차이가 있는지 비교해 보세요.`
        : "새로운 활용 장면이나 확실한 차이가 있는지 아래의 보유 상품과 비교해 보세요.",
      accent: "text-amber-300",
      border: "border-amber-300/25",
      background: "bg-amber-300/[0.06]",
    };
  }

  return {
    eyebrow: "YOUR CORE",
    title: `지금 즐겨 입는 ${primary} 감도와 잘 맞는 상품이에요.`,
    description: secondary
      ? `${primary}을 중심으로 ${secondary}까지 이어지는, 지금 취향을 자연스럽게 넓히는 방향입니다.`
      : `현재 가진 옷에서 ${primary} 성향이 ${Math.round(decision.closetShare)}%로 나타납니다.`,
    accent: "text-orange-300",
    border: "border-orange-300/25",
    background: "bg-orange-300/[0.06]",
  };
}

export function ProductTasteDecisionPanel({
  decision,
  onViewMap,
}: {
  decision: ProductTasteDecision;
  onViewMap: () => void;
}) {
  const copy = decisionCopy(decision);

  return (
    <section className={`mt-5 border-l-2 ${copy.border} ${copy.background} py-3 pl-4 pr-3`} aria-label="내 스타일 지도 판단">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`m-0 text-[10px] font-black tracking-[0.1em] ${copy.accent}`}>{copy.eyebrow}</p>
          <p className="mt-1 text-sm font-bold leading-5 text-gray-100">{copy.title}</p>
          <p className="mt-1 text-xs font-medium leading-5 text-gray-400">{copy.description}</p>
        </div>
        <button
          type="button"
          onClick={onViewMap}
          className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full border ${copy.border} ${copy.background} px-3 py-2 text-[11px] font-bold ${copy.accent} shadow-[0_8px_22px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.12] hover:text-white hover:shadow-[0_12px_28px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
        >
          <MapPinned className="h-3.5 w-3.5" />
          취향 지도에서 보기
          <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>

      {decision.closestProducts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500">
          <span>Closet에서 닮은 아이템</span>
          {decision.closestProducts.slice(0, 2).map((entry) => (
            <span key={entry.product.id} className="text-gray-300">
              {entry.product.brand || entry.product.name} {Math.round(entry.similarity * 100)}%
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
