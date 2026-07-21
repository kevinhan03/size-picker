"use client";

import { Search, X } from "lucide-react";

interface CollectionSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}

export function CollectionSearchField({
  value,
  onChange,
  disabled = false,
  ariaLabel,
}: CollectionSearchFieldProps) {
  return (
    <div className="collection-search-field mb-5">
      <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.045] px-3.5 transition-[background-color,border-color,box-shadow] duration-150 focus-within:border-orange-400/60 focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-orange-500/10 sm:h-10">
        <Search className="h-4 w-4 shrink-0 text-white/45" />
        <input
          type="text"
          value={value}
          disabled={disabled}
          autoComplete="off"
          enterKeyHint="search"
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onChange("");
              event.currentTarget.blur();
            }
          }}
          placeholder="브랜드 또는 상품명 검색"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:text-white/45"
        />
        {value && !disabled ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.08] hover:text-white"
            aria-label="검색어 지우기"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
