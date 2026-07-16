"use client";

import { CATEGORY_OPTIONS } from "../constants";
import type { TutorialAnchorRect } from "./OnboardingTutorial";

interface FilterBarProps {
  categoryValue: string;
  onCategoryChange: (value: string, anchorRect?: TutorialAnchorRect) => void;
}

const getAnchorRect = (element: HTMLElement): TutorialAnchorRect => {
  const rect = element.getBoundingClientRect();
  return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
};

export function FilterBar({ categoryValue, onCategoryChange }: FilterBarProps) {
  const categories = [{ label: "전체", value: "" }, ...CATEGORY_OPTIONS.map((category) => ({ label: category, value: category }))];

  return (
    <div className="dig-filterbar mb-5 w-full max-w-3xl">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid w-[31rem] grid-cols-6 sm:w-full">
        {categories.map(({ label, value }) => {
          const active = categoryValue === value;
          return (
            <button key={value || "all"} type="button" onClick={(event) => onCategoryChange(value, getAnchorRect(event.currentTarget))} className={`h-9 min-w-0 border-b-2 border-r border-white/[0.12] px-2 text-xs font-bold transition last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${active ? "border-b-orange-300 text-orange-300" : "border-b-transparent text-gray-500 hover:text-white"}`}>
              {label}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
