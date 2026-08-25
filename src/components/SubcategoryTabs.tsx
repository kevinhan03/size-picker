"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_LABELS, getSubcategoryFilterOptions } from "../constants";

interface SubcategoryTabsProps {
  category: string;
  subCategory: string;
  onSubCategoryChange: (value: string) => void;
  disabled?: boolean;
}

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

const scrollEdgeThreshold = 16;

const tabClass = (active: boolean) =>
  `h-11 shrink-0 snap-start border-b-2 px-3 text-sm font-semibold transition-[border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 sm:px-4 ${active ? "border-b-orange-300 text-orange-200" : "border-b-transparent text-gray-500 hover:text-white"}`;

export function SubcategoryTabs({
  category,
  subCategory,
  onSubCategoryChange,
  disabled = false,
}: SubcategoryTabsProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ left: false, right: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateScrollState = () => {
      const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
      const next = {
        left: rail.scrollLeft > scrollEdgeThreshold,
        right: rail.scrollLeft < maxScrollLeft - scrollEdgeThreshold,
      };
      setScrollState((current) =>
        current.left === next.left && current.right === next.right
          ? current
          : next
      );
    };

    rail.scrollTo({ left: 0, behavior: "auto" });
    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(rail);
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      resizeObserver.disconnect();
      rail.removeEventListener("scroll", updateScrollState);
    };
  }, [category]);

  useEffect(() => {
    if (!subCategory) return;
    const activeTab = railRef.current?.querySelector<HTMLElement>(
      "[data-active='true']"
    );
    activeTab?.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "nearest",
      inline: "center",
    });
  }, [subCategory]);

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: rail.clientWidth * direction * 0.7,
      behavior: getScrollBehavior(),
    });
  };

  return (
    <div className="relative w-full">
      <div
        key={category}
        ref={railRef}
        className="overflow-x-auto [scroll-snap-type:x_proximity] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={`${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]} 하위 카테고리`}
      >
        <div className="flex w-max min-w-full px-3 sm:justify-center">
          {getSubcategoryFilterOptions(category).map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              role="tab"
              data-active={subCategory === item.value}
              aria-selected={subCategory === item.value}
              disabled={disabled}
              className={tabClass(subCategory === item.value)}
              onClick={() => onSubCategoryChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-black to-transparent md:hidden" />

      {scrollState.left ? (
        <button
          type="button"
          onClick={() => scrollRail(-1)}
          aria-label="이전 하위 카테고리"
          className="absolute inset-y-0 left-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-r from-black via-black/90 to-transparent text-gray-300 transition-[color,transform] duration-150 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400/80 md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}
      {scrollState.right ? (
        <button
          type="button"
          onClick={() => scrollRail(1)}
          aria-label="다음 하위 카테고리"
          className="absolute inset-y-0 right-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-l from-black via-black/90 to-transparent text-gray-300 transition-[color,transform] duration-150 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400/80 md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
