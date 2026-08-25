"use client";

import { useEffect, useRef } from "react";
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from "../constants";

interface CategoryTabsProps {
  category: string;
  onCategoryChange: (category: string, trigger: HTMLButtonElement) => void;
  allLabel?: string;
  ariaLabel?: string;
  className?: string;
  spacing?: "default" | "tight" | "result";
  disabled?: boolean;
}

const parentTabClass = (active: boolean) =>
  `h-11 shrink-0 border-b-2 px-3 text-sm font-bold transition-[border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 sm:px-4 ${
    active
      ? "border-b-orange-300 text-orange-300"
      : "border-b-transparent text-gray-500 hover:text-white"
  }`;

const getScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

export function CategoryTabs({
  category,
  onCategoryChange,
  allLabel = "전체",
  ariaLabel = "상품 카테고리",
  className = "",
  spacing = "default",
  disabled = false,
}: CategoryTabsProps) {
  const tablistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeTab = tablistRef.current?.querySelector<HTMLElement>(
      "[data-active='true']"
    );
    activeTab?.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "nearest",
      inline: "center",
    });
  }, [category]);

  return (
    <nav
      className={`relative w-full ${className}`}
      style={{
        marginBottom:
          spacing === "tight" ? "0.5rem" : spacing === "result" ? "1.5rem" : "1.25rem",
      }}
      aria-label={ariaLabel}
    >
      <div
        ref={tablistRef}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="상위 카테고리"
      >
        <div className="flex w-max min-w-full px-3 sm:justify-center">
          <button
            type="button"
            role="tab"
            data-active={!category}
            aria-selected={!category}
            disabled={disabled}
            className={parentTabClass(!category)}
            onClick={(event) => onCategoryChange("", event.currentTarget)}
          >
            {allLabel}
          </button>
          {CATEGORY_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              data-active={category === item}
              aria-selected={category === item}
              disabled={disabled}
              className={parentTabClass(category === item)}
              onClick={(event) => onCategoryChange(item, event.currentTarget)}
            >
              {CATEGORY_LABELS[item]}
            </button>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-black to-transparent sm:hidden" />
    </nav>
  );
}
