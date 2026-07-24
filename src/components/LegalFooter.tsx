import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="w-full bg-black px-4 pb-8 pt-10 text-center text-xs text-gray-500">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/[0.08] pt-6">
        <span className="font-bold text-gray-600">© 2026 DIGBOX</span>
        <Link href="/privacy" className="font-semibold transition hover:text-orange-300">
          개인정보 처리방침
        </Link>
        <Link href="/terms" className="font-semibold transition hover:text-orange-300">
          이용약관
        </Link>
        <a href="mailto:digda2026@gmail.com" className="font-semibold transition hover:text-orange-300">
          문의
        </a>
      </div>
    </footer>
  );
}
