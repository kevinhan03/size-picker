"use client";

import type { TutorialAnchorRect } from "./OnboardingTutorial";
import { useLocaleContext } from "../contexts/LocaleContext";
import { CategoryTabs } from "./CategoryTabs";
import { SubcategoryTabs } from "./SubcategoryTabs";

interface FilterBarProps {
  categoryValue: string;
  onCategoryChange: (value: string, anchorRect?: TutorialAnchorRect) => void;
  subCategoryValue?: string;
  onSubCategoryChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  spacing?: "default" | "compact";
}

const getAnchorRect = (element: HTMLElement): TutorialAnchorRect => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
};

export function FilterBar({
  categoryValue,
  onCategoryChange,
  subCategoryValue = "",
  onSubCategoryChange,
  disabled = false,
  className = "",
  spacing = "default",
}: FilterBarProps) {
  const { t } = useLocaleContext();
  const showsSubcategories = Boolean(categoryValue && onSubCategoryChange);

  return (
    <div className={`w-full ${showsSubcategories ? spacing === "compact" ? "mb-3" : "mb-6" : ""} ${className}`}>
      <CategoryTabs
        category={categoryValue}
        onCategoryChange={(value, trigger) =>
          onCategoryChange(value, getAnchorRect(trigger))
        }
        allLabel={t("filter.all")}
        className="dig-filterbar"
        spacing={showsSubcategories ? "tight" : spacing === "compact" ? "compact" : "result"}
        disabled={disabled}
      />

      {categoryValue && onSubCategoryChange ? (
        <SubcategoryTabs
          category={categoryValue}
          subCategory={subCategoryValue}
          onSubCategoryChange={onSubCategoryChange}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
