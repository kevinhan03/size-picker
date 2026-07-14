"use client";

import { Shuffle } from "lucide-react";
import { FilterDropdown, type FilterDropdownOption } from "./FilterDropdown";
import type { TutorialAnchorRect } from "./OnboardingTutorial";

interface FilterBarProps {
  categoryOptions: FilterDropdownOption[];
  categoryValue: string;
  onCategoryChange: (value: string, anchorRect?: TutorialAnchorRect) => void;
  brandOptions: FilterDropdownOption[];
  brandValue: string;
  onBrandChange: (value: string, anchorRect?: TutorialAnchorRect) => void;
  onShuffle: (anchorRect?: TutorialAnchorRect) => void;
  isShuffling: boolean;
  onBrandDropdownOpenChange?: (isOpen: boolean, anchorRect?: TutorialAnchorRect) => void;
}

export function FilterBar({
  categoryOptions,
  categoryValue,
  onCategoryChange,
  brandOptions,
  brandValue,
  onBrandChange,
  onShuffle,
  isShuffling,
  onBrandDropdownOpenChange,
}: FilterBarProps) {
  return (
    <div className="dig-filterbar mb-8 flex w-full max-w-2xl items-start gap-2 sm:gap-3">
      <FilterDropdown
        eyebrow="Category"
        options={categoryOptions}
        value={categoryValue}
        onChange={onCategoryChange}
      />
      <FilterDropdown eyebrow="Brand" options={brandOptions} value={brandValue} onChange={onBrandChange} onOpenChange={onBrandDropdownOpenChange} />
      <button
        type="button"
        aria-label="Shuffle products"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onShuffle({
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }}
        className="dig-shuffle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-gray-400 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] outline-none transition hover:border-orange-500/40 hover:bg-orange-500/[0.08] hover:text-orange-300 focus-visible:ring-2 focus-visible:ring-orange-500/25 sm:h-11 sm:w-11"
      >
        <Shuffle className={`h-4 w-4 ${isShuffling ? "animate-dig-shuffle-spin" : ""}`} />
      </button>
    </div>
  );
}
