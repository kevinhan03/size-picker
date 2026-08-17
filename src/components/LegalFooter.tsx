"use client";

import Link from "next/link";
import { useLocaleContext } from "../contexts/LocaleContext";

export function LegalFooter() {
  const { t } = useLocaleContext();
  return (
    <footer className="w-full bg-black px-4 pb-8 pt-10 text-center text-xs text-gray-500">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/[0.08] pt-6">
        <span className="font-bold text-gray-600">© 2026 DIGBOX</span>
        <Link href="/privacy" prefetch={false} className="font-semibold transition hover:text-orange-300">
          {t("footer.privacy")}
        </Link>
        <Link href="/terms" prefetch={false} className="font-semibold transition hover:text-orange-300">
          {t("footer.terms")}
        </Link>
        <a href="mailto:digda2026@gmail.com" className="font-semibold transition hover:text-orange-300">
          {t("footer.contact")}
        </a>
      </div>
    </footer>
  );
}
