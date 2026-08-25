"use client";

import { CategoryTabs } from "./CategoryTabs";
import { SubcategoryTabs } from "./SubcategoryTabs";

interface DigCategoryFilterProps {
  category: string;
  subCategory: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (subcategory: string) => void;
}

export function DigCategoryFilter({
  category,
  subCategory,
  onCategoryChange,
  onSubCategoryChange,
}: DigCategoryFilterProps) {
  return (
    <div className={`mx-auto w-full max-w-3xl ${category ? "mb-6" : ""}`}>
      <CategoryTabs
        category={category}
        onCategoryChange={(value) => onCategoryChange(value)}
        spacing={category ? "tight" : "result"}
      />

      {category ? (
        <SubcategoryTabs
          category={category}
          subCategory={subCategory}
          onSubCategoryChange={onSubCategoryChange}
        />
      ) : null}
    </div>
  );
}
