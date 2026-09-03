import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Product } from "../types";
import {
  getProductStyleProfile,
  styleProfileLabels,
} from "../utils/styleProfile";

export function ProductStyleProfileCard({ product }: { product: Product }) {
  const profile = getProductStyleProfile(product);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const guideId = useId();

  useEffect(() => {
    if (!isExplanationOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!cardRef.current?.contains(event.target as Node))
        setIsExplanationOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExplanationOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isExplanationOpen]);

  if (!profile) return null;

  return (
    <section
      ref={cardRef}
      className="relative mt-5 rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4"
      aria-label="스타일 무드"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.08em] text-gray-400">
          스타일 무드
        </p>
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-transform duration-150 ease-out hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 active:scale-95"
          aria-label="스타일 무드 안내 보기"
          aria-expanded={isExplanationOpen}
          aria-controls={guideId}
          onClick={() => setIsExplanationOpen((open) => !open)}
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <h5 className="mt-1 text-lg font-bold tracking-tight text-white">
        {profile.title}
      </h5>
      <div className="mt-4 space-y-3">
        {profile.displayEntries.map((entry, index) => (
          <div key={entry.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
              <span className="font-semibold text-gray-100">
                {styleProfileLabels(entry.key)}
              </span>
              <span className="tabular-nums text-gray-400">{entry.score}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-white/[0.11]"
              role="progressbar"
              aria-label={`${styleProfileLabels(entry.key)} ${entry.score}%`}
              aria-valuenow={entry.score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={
                  index === 0
                    ? "h-full rounded-full bg-orange-300 transition-[width] duration-200"
                    : "h-full rounded-full bg-white/50 transition-[width] duration-200"
                }
                style={{ width: `${entry.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {isExplanationOpen && (
        <div
          id={guideId}
          role="tooltip"
          className="absolute right-4 top-10 z-20 w-64 rounded-xl border border-white/10 bg-[#202024] px-3 py-2.5 text-[11px] leading-4 text-gray-300 shadow-xl shadow-black/30"
        >
          <p className="font-semibold text-white">
            이 상품에서 느껴지는 전체적인 스타일 무드입니다.
          </p>
          <p className="mt-1.5">
            디자인, 실루엣, 디테일을 함께 살펴 가장 닮은 세 가지 스타일을
            보여드립니다. %가 높을수록 해당 스타일과 더 가깝게 느껴진다는
            의미입니다.
          </p>
        </div>
      )}
    </section>
  );
}
