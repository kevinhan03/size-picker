"use client";

import { SavedCollectionContent } from "../collections/SavedCollectionContent";
import { PageHeader } from "../PageHeader";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { Product } from "../../types";
import { useState } from "react";
import { PostFeed } from "../social/PostFeed";
import { useSocialMessages } from "../social/messages";
import { SocialTabs } from "../social/SocialTabs";

export function SavedPageClient({
  username,
  products,
  discoveredDigboxCounts,
  initialTab = "products",
}: {
  username: string;
  products: Product[];
  discoveredDigboxCounts: Record<string, number>;
  initialTab?: "products" | "posts";
}) {
  const { t } = useLocaleContext();
  const c = useSocialMessages();
  const [tab, setTab] = useState<"products" | "posts">(initialTab);
  function changeTab(value: "products" | "posts") {
    setTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search
    );
  }

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-[70rem]">
        <PageHeader eyebrow="MY SAVED" title={t("saved.title")} />
        <SocialTabs
          label={t("saved.title")}
          value={tab}
          options={[
            { value: "products", label: c.savedProducts },
            { value: "posts", label: c.savedPosts },
          ]}
          onChange={changeTab}
        />
        <div hidden={tab !== "products"}>
          <SavedCollectionContent
            username={username}
            products={products}
            discoveredDigboxCounts={discoveredDigboxCounts}
            hydrateOwner
          />
        </div>
        {tab === "posts" && <PostFeed saved />}
      </div>
    </main>
  );
}
