"use client";

import type { TutorialAnchorRect } from "./OnboardingTutorial";
import { useLocaleContext } from "../contexts/LocaleContext";
import { CategoryTabs } from "./CategoryTabs";

interface FilterBarProps {
  categoryValue: string;
  onCategoryChange: (value: string, anchorRect?: TutorialAnchorRect) => void;
  disabled?: boolean;
  className?: string;
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
  disabled = false,
  className = "",
}: FilterBarProps) {
  const { t } = useLocaleContext();
  return (
    <CategoryTabs
      category={categoryValue}
      onCategoryChange={(value, trigger) =>
        onCategoryChange(value, getAnchorRect(trigger))
      }
      allLabel={t("filter.all")}
      className={`dig-filterbar ${className}`}
      disabled={disabled}
    />
  );
}
