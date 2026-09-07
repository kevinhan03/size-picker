"use client";

import { SavedCollectionContent } from "../collections/SavedCollectionContent";
import { PageHeader } from "../PageHeader";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { Product } from "../../types";

export function SavedPageClient({
  username,
  products,
  discoveredDigboxCounts,
}: {
  username: string;
  products: Product[];
  discoveredDigboxCounts: Record<string, number>;
}) {
  const { t } = useLocaleContext();

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-[70rem]">
        <PageHeader eyebrow="MY SAVED" title={t("saved.title")} />
        <SavedCollectionContent
          username={username}
          products={products}
          discoveredDigboxCounts={discoveredDigboxCounts}
          hydrateOwner
        />
      </div>
    </main>
  );
}
