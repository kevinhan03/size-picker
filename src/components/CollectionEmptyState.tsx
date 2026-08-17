"use client";

import Link from "next/link";
import { PackageOpen, SearchX } from "lucide-react";
import { useLocaleContext } from "../contexts/LocaleContext";

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
  const { t } = useLocaleContext();
  const normalizedQuery = query.trim();
  const hasQuery = Boolean(normalizedQuery);
  const hasCategory = Boolean(category);
  const hasConstraints = hasQuery || hasCategory;
  const collectionLabel = collection === "saved" ? t("collection.saved") : t("collection.closet");

  const title = hasQuery
    ? t("collection.noSearch", { query: normalizedQuery, collection: collectionLabel })
    : hasCategory
      ? t("collection.noCategory", { category, collection: collectionLabel })
      : collection === "saved"
        ? t("collection.emptySaved")
        : t("collection.emptyCloset");

  const description = hasConstraints
    ? hasQuery && hasCategory
      ? t("collection.adjustFilters")
      : hasQuery
        ? t("collection.trySearch")
        : t("collection.tryCategory")
    : collection === "saved"
      ? t("collection.saveProducts")
      : t("collection.addCloset");

  const action = hasQuery && hasCategory
    ? { label: t("collection.reset"), onClick: onClearAll }
    : hasQuery
      ? { label: t("collection.clearSearch"), onClick: onClearSearch }
      : hasCategory
        ? { label: t("collection.allCategories"), onClick: onClearCategory }
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
          {t("collection.browse")}
        </Link>
      )}
    </div>
  );
}
