"use client";

import Link from "next/link";
import { PackageOpen, SearchX } from "lucide-react";

interface CollectionEmptyStateProps {
  collection: "saved" | "closet";
  query: string;
  category: string;
  onClearSearch: () => void;
  onClearCategory: () => void;
  onClearAll: () => void;
}

export function CollectionEmptyState({
  collection,
  query,
  category,
  onClearSearch,
  onClearCategory,
  onClearAll,
}: CollectionEmptyStateProps) {
  const normalizedQuery = query.trim();
  const hasQuery = Boolean(normalizedQuery);
  const hasCategory = Boolean(category);
  const hasConstraints = hasQuery || hasCategory;
  const collectionLabel = collection === "saved" ? "저장 상품" : "옷장 상품";

  const title = hasQuery
    ? `“${normalizedQuery}”와 일치하는 ${collectionLabel}이 없어요`
    : hasCategory
      ? `${category}에 해당하는 ${collectionLabel}이 없어요`
      : collection === "saved"
        ? "저장한 상품이 없어요"
        : "옷장에 추가한 상품이 없어요";

  const description = hasConstraints
    ? hasQuery && hasCategory
      ? "검색어를 바꾸거나 검색·필터를 초기화해보세요."
      : hasQuery
        ? "다른 검색어로 찾아보세요."
        : "다른 카테고리의 상품을 둘러보세요."
    : collection === "saved"
      ? "마음에 드는 상품을 저장해보세요."
      : "가지고 있는 상품을 옷장에 추가해보세요.";

  const action = hasQuery && hasCategory
    ? { label: "검색·필터 초기화", onClick: onClearAll }
    : hasQuery
      ? { label: "검색어 지우기", onClick: onClearSearch }
      : hasCategory
        ? { label: "전체 카테고리 보기", onClick: onClearCategory }
        : null;

  const Icon = hasConstraints ? SearchX : PackageOpen;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center"
    >
      <Icon className="mx-auto h-10 w-10 text-white/25" aria-hidden="true" />
      <h2 className="mt-5 text-lg font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="outfit-pressable outfit-primary-action mt-6 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black transition-[background-color,transform] duration-150"
        >
          {action.label}
        </button>
      ) : (
        <Link
          href="/"
          className="outfit-pressable outfit-primary-action mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black no-underline transition-[background-color,transform] duration-150"
        >
          상품 둘러보기
        </Link>
      )}
    </div>
  );
}
