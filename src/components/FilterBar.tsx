"use client";

import { Shuffle } from "lucide-react";
import { FilterDropdown, type FilterDropdownOption } from "./FilterDropdown";

interface FilterBarProps {
  categoryOptions: FilterDropdownOption[];
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  brandOptions: FilterDropdownOption[];
  brandValue: string;
  onBrandChange: (value: string) => void;
  onShuffle: () => void;
  isShuffling: boolean;
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
}: FilterBarProps) {
  return (
    <div className="dig-filterbar mb-8 flex w-full max-w-2xl items-start gap-2 sm:gap-3">
      <FilterDropdown
        eyebrow="Category"
        options={categoryOptions}
        value={categoryValue}
        onChange={onCategoryChange}
      />
      <FilterDropdown eyebrow="Brand" options={brandOptions} value={brandValue} onChange={onBrandChange} />
      <button
        type="button"
        aria-label="Shuffle products"
        onClick={onShuffle}
        className="dig-shuffle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#00FF00]/70 bg-[#00FF00]/10 text-[#00FF00] shadow-[0_0_22px_rgba(0,255,0,.16),inset_0_1px_0_rgba(255,255,255,.12)] outline-none transition hover:border-[#00FF00] hover:bg-[#00FF00]/18 hover:shadow-[0_0_30px_rgba(0,255,0,.24),inset_0_1px_0_rgba(255,255,255,.16)] focus-visible:ring-2 focus-visible:ring-[#00FF00]/30 sm:h-11 sm:w-11"
      >
        <Shuffle className={`h-4 w-4 ${isShuffling ? "animate-dig-shuffle-spin" : ""}`} />
      </button>
    </div>
  );
}
