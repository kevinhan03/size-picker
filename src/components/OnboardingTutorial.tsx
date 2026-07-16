"use client";

import { ChevronRight, X } from "lucide-react";
import { useMemo } from "react";

interface TutorialStep {
  title: string;
  description: string;
  action: string;
}

export type TutorialId =
  | "search"
  | "filters"
  | "detail"
  | "collection"
  | "sizeSelection"
  | "sizeRecommendations"
  | "mySizeCompare"
  | "mySizeSetup"
  | "digboxShare";

export interface TutorialAnchorRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const TUTORIAL_STEPS: Record<TutorialId, TutorialStep> = {
  search: {
    title: "검색으로 상품 찾기",
    description: "브랜드명이나 상품명을 입력하면 관련 브랜드와 상품 추천이 바로 나타나요.",
    action: "알겠어요",
  },
  filters: {
    title: "필터로 좁혀보기",
    description: "카테고리와 브랜드 필터를 조합해서 지금 보고 싶은 상품만 빠르게 골라보세요.",
    action: "확인했어요",
  },
  detail: {
    title: "상품 상세 정보",
    description: "상품을 열면 사이즈표를 확인하고, 행을 선택해서 비슷한 사이즈의 다른 상품도 볼 수 있어요.",
    action: "좋아요",
  },
  collection: {
    title: "관심과 보유를 나눠 담기",
    description: "관심 있는 상품은 저장해 취향을 확인하고, 실제 가진 상품은 Closet에 담아 사이즈를 관리해보세요.",
    action: "시작할게요",
  },
  sizeSelection: {
    title: "보유 사이즈 저장하기",
    description: "내가 가진 사이즈를 함께 저장하면 나중에 My Size 비교와 추천에 더 정확하게 활용할 수 있어요.",
    action: "알겠어요",
  },
  sizeRecommendations: {
    title: "비슷한 사이즈 찾기",
    description: "사이즈표에서 행을 선택하면 그 사이즈와 비슷한 다른 상품을 아래에서 추천해드려요.",
    action: "확인했어요",
  },
  mySizeCompare: {
    title: "내 사이즈와 비교",
    description: "My Size에 저장한 잘 맞는 옷과 현재 상품의 실측을 비교해서 차이를 바로 확인할 수 있어요.",
    action: "좋아요",
  },
  mySizeSetup: {
    title: "My Size 저장하기",
    description: "잘 맞았던 옷장 상품을 My Size로 저장해두면 다른 상품 상세에서 실측 비교가 가능해요.",
    action: "시작할게요",
  },
  digboxShare: {
    title: "저장 목록 공유하기",
    description: "내 저장 목록 링크를 복사해서 다른 사람에게 발굴한 상품들을 공유할 수 있어요.",
    action: "공유해볼게요",
  },
};

interface OnboardingTutorialProps {
  tutorialId: TutorialId;
  anchorRect?: TutorialAnchorRect | null;
  onClose: () => void;
}

export function OnboardingTutorial({ tutorialId, anchorRect, onClose }: OnboardingTutorialProps) {
  const step = TUTORIAL_STEPS[tutorialId];
  const position = useMemo(() => {
    const width = 288;
    const estimatedHeight = 180;
    const gap = 12;
    const margin = 12;

    if (!anchorRect || typeof window === "undefined") {
      return {
        left: `calc(100vw - ${width + 24}px)`,
        top: "88px",
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const canPlaceRight = anchorRect.right + gap + width <= viewportWidth - margin;
    const canPlaceLeft = anchorRect.left - gap - width >= margin;
    const hasSidePlacement = canPlaceRight || canPlaceLeft;
    const left = canPlaceRight
      ? anchorRect.right + gap
      : canPlaceLeft
        ? anchorRect.left - gap - width
        : Math.min(Math.max(anchorRect.left, margin), viewportWidth - width - margin);
    const centeredTop = anchorRect.top + anchorRect.height / 2 - estimatedHeight / 2;
    const canPlaceBelow = anchorRect.bottom + gap + estimatedHeight <= viewportHeight - margin;
    const verticalTop = canPlaceBelow ? anchorRect.bottom + gap : anchorRect.top - gap - estimatedHeight;
    const top = Math.min(
      Math.max(hasSidePlacement ? centeredTop : verticalTop, margin),
      viewportHeight - estimatedHeight - margin
    );

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  }, [anchorRect]);

  return (
    <div
      className="fixed z-[90] w-[18rem] max-w-[calc(100vw_-_1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1a1e] to-[#0f0f12] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.42)]"
      style={position}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`tutorial-${tutorialId}-title`}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
        aria-label="튜토리얼 닫기"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="pr-8">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">
          TIP
        </div>
        <h2 id={`tutorial-${tutorialId}-title`} className="mb-2 text-base font-black text-white">{step.title}</h2>
        <p className="mb-4 text-xs leading-relaxed text-gray-300">{step.description}</p>
      </div>

      <button
        onClick={onClose}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg transition hover:from-orange-600 hover:to-orange-700"
      >
        {step.action}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
