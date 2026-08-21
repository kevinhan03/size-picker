"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_OPTIONS, getSubcategories } from "../constants";

interface DigCategoryFilterProps {
  category: string;
  subCategory: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (subcategory: string) => void;
}

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

export function DigCategoryFilter({ category, subCategory, onCategoryChange, onSubCategoryChange }: DigCategoryFilterProps) {
  const subcategoryRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    subcategoryRailRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [category]);

  useEffect(() => {
    if (!subCategory) return;
    const activeTab = subcategoryRailRef.current?.querySelector<HTMLElement>("[data-active='true']");
    activeTab?.scrollIntoView({ behavior: getScrollBehavior(), block: "nearest", inline: "center" });
  }, [subCategory]);

  const scrollSubcategories = (direction: -1 | 1) => {
    const rail = subcategoryRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: rail.clientWidth * direction * 0.7, behavior: getScrollBehavior() });
  };

  const parentTabClass = (active: boolean) => `h-11 shrink-0 border-b-2 px-3 text-sm font-bold transition-[border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 sm:px-4 ${active ? "border-b-orange-300 text-orange-300" : "border-b-transparent text-gray-500 hover:text-white"}`;
  const childTabClass = (active: boolean) => `h-10 shrink-0 border-b-2 px-3 text-xs font-semibold transition-[border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${active ? "border-b-orange-300 text-orange-200" : "border-b-transparent text-gray-500 hover:text-white"}`;

  return (
    <nav className="mb-5 w-full max-w-7xl" aria-label="상품 카테고리">
      <div className="relative">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="상위 카테고리">
          <div className="flex min-w-max px-3 sm:min-w-full sm:justify-center">
            <button type="button" role="tab" aria-selected={!category} className={parentTabClass(!category)} onClick={() => onCategoryChange("")}>전체</button>
            {CATEGORY_OPTIONS.map((item) => <button key={item} type="button" role="tab" aria-selected={category === item} className={parentTabClass(category === item)} onClick={() => onCategoryChange(item)}>{CATEGORY_LABELS[item]}</button>)}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-black to-transparent sm:hidden" />
      </div>

      {category ? (
        <div className="mt-1.5 flex items-center">
          <button type="button" onClick={() => scrollSubcategories(-1)} aria-label="이전 하위 카테고리" className="z-10 flex h-10 w-8 shrink-0 items-center justify-center text-gray-500 transition-[color,transform] duration-150 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"><ChevronLeft className="h-4 w-4" /></button>
          <div ref={subcategoryRailRef} className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={`${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]} 하위 카테고리`}>
            <div className="flex min-w-max">
              <button type="button" role="tab" data-active={!subCategory} aria-selected={!subCategory} className={childTabClass(!subCategory)} onClick={() => onSubCategoryChange("")}>전체</button>
              {getSubcategories(category).map((item) => <button key={item} type="button" role="tab" data-active={subCategory === item} aria-selected={subCategory === item} className={childTabClass(subCategory === item)} onClick={() => onSubCategoryChange(item)}>{item}</button>)}
            </div>
          </div>
          <button type="button" onClick={() => scrollSubcategories(1)} aria-label="다음 하위 카테고리" className="z-10 flex h-10 w-8 shrink-0 items-center justify-center text-gray-500 transition-[color,transform] duration-150 hover:text-white active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"><ChevronRight className="h-4 w-4" /></button>
        </div>
      ) : null}
    </nav>
  );
}
