"use client";

import { type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { CATEGORY_OPTIONS, getCategoryLabel, getSubcategoryFilterOptions } from "../constants";

interface DigCategoryFilterProps {
  category: string;
  subCategory: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (subcategory: string) => void;
  disabled?: boolean;
}

const shortLabels: Record<string, string> = {
  "긴소매 티셔츠": "긴팔 티셔츠",
  "반소매 티셔츠": "반팔 티셔츠",
  "맨투맨·스웨트": "맨투맨",
  "피케·카라 티셔츠": "카라 티셔츠",
};

const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-inset";

function useHorizontalRailDrag() {
  const dragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 3) {
      drag.moved = true;
      setIsDragging(true);
      // Preserve regular button clicks; capture only once this is a real drag.
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    if (!drag.moved) return;
    event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
    event.preventDefault();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    setIsDragging(false);
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return { isDragging, onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onClickCapture };
}

function DigSubcategoryTabs({
  category, subCategory, onSubCategoryChange, disabled = false,
}: Pick<DigCategoryFilterProps, "category" | "subCategory" | "onSubCategoryChange" | "disabled">) {
  const railDrag = useHorizontalRailDrag();
  const options = getSubcategoryFilterOptions(category).map(item => ({
    ...item,
    label: item.value ? shortLabels[item.label] || item.label : "전체",
  }));
  return (
    <div className="dig-subcategory-reveal overflow-hidden border-b border-white/[0.1] bg-white/[0.035]" data-dig-subcategories>
      <div
        role="tablist"
        aria-label={`${getCategoryLabel(category)} 하위 카테고리`}
        className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${railDrag.isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
        onPointerDown={railDrag.onPointerDown}
        onPointerMove={railDrag.onPointerMove}
        onPointerUp={railDrag.onPointerUp}
        onPointerCancel={railDrag.onPointerCancel}
        onClickCapture={railDrag.onClickCapture}
      >
        <div className="flex w-max min-w-full">
          {options.map(item => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={subCategory === item.value}
              disabled={disabled}
              onClick={() => onSubCategoryChange(item.value)}
              className={`h-10 shrink-0 border-b-2 px-3 text-sm font-semibold transition-[border-color,color,transform] duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 sm:px-4 ${focusClass} ${subCategory === item.value ? "border-orange-400 text-orange-300" : "border-transparent text-gray-400 hover:text-white"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DigCategoryFilter({
  category, subCategory, onCategoryChange, onSubCategoryChange, disabled = false,
}: DigCategoryFilterProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const railDrag = useHorizontalRailDrag();
  const categories = [{ value: "", label: "전체" }, ...CATEGORY_OPTIONS.map(value => ({ value, label: getCategoryLabel(value) }))];

  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!rail || !active) return;
    const railBox = rail.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    if (activeBox.left < railBox.left) rail.scrollLeft -= railBox.left - activeBox.left;
    else if (activeBox.right > railBox.right) rail.scrollLeft += activeBox.right - railBox.right;
  }, [category]);

  return (
    <div className="mx-auto mb-6 w-full max-w-7xl" data-dig-category-filter>
      <div className="flex items-center border-b border-white/[0.14]">
        <div ref={railRef} role="group" aria-label="상위 카테고리"
          className={`min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${railDrag.isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
          onPointerDown={railDrag.onPointerDown}
          onPointerMove={railDrag.onPointerMove}
          onPointerUp={railDrag.onPointerUp}
          onPointerCancel={railDrag.onPointerCancel}
          onClickCapture={railDrag.onClickCapture}
        >
          <div className="flex w-max min-w-full">
            {categories.map(item => (
              <button key={item.value} type="button" aria-pressed={category === item.value} disabled={disabled}
                onClick={() => onCategoryChange(item.value)}
                className={`h-11 shrink-0 border-b-2 px-3 text-sm font-semibold transition-[border-color,color,transform] duration-150 [transition-timing-function:var(--ease-out)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 sm:px-4 ${focusClass} ${category === item.value ? "border-orange-400 text-orange-300" : "border-transparent text-gray-400 hover:text-white"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {category && <DigSubcategoryTabs key={category} category={category} subCategory={subCategory} onSubCategoryChange={onSubCategoryChange} disabled={disabled} />}
    </div>
  );
}
