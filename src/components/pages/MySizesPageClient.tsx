"use client";

import Link from "next/link";
import { ArrowLeft, Ruler } from "lucide-react";
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
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-gray-300">
              <Ruler className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#f2a56c]">DIGBOX</p>
              <h1 className="mt-1 text-xl font-extrabold leading-[1.15] tracking-[-0.035em] text-[#f5f5f6] sm:text-4xl">{c.size}</h1>
            </div>
          </div>
          <Link
            href={profileHref}
            aria-label={c.back}
            title={c.back}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transition-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
