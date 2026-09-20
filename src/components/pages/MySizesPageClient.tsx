"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Product } from "../../types";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { useMySizesContext } from "../../contexts/MySizesContext";
import { MySizesManager } from "../views/MyPageView";
import { profileMessages } from "../profile/messages";

export function MySizesPageClient({
  closetProducts,
  profileHref,
}: {
  closetProducts: Product[];
  profileHref: string;
}) {
  const { locale } = useLocaleContext();
  const c = profileMessages[locale];
  const sizes = useMySizesContext();

  return (
    <main className="settings-page min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--settings-page-top)] text-white">
      <div className="mx-auto w-full max-w-none lg:max-w-3xl">
        <header className="flex items-center gap-0 border-b border-white/10 pb-2 lg:gap-2 lg:pb-6">
          <Link
            href={profileHref}
            aria-label={c.back}
            title={c.back}
            className="relative inline-flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-[color,transform] after:absolute after:-inset-x-0.5 after:inset-y-0 after:content-[''] hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <h1 className="text-xl font-extrabold leading-tight tracking-[-0.015em] text-[#f5f5f6] lg:text-2xl">{c.size}</h1>
        </header>
        <section className="mt-8" aria-label={c.sizeFit}>
          <MySizesManager
            closetProducts={closetProducts}
            mySizes={sizes.mySizes}
            onCreateMySize={async (input) => { await sizes.createMySize(input); }}
            onUpdateMySize={async (id, input) => { await sizes.updateMySize(id, input); }}
            onDeleteMySize={sizes.deleteMySize}
          />
        </section>
      </div>
    </main>
  );
}
