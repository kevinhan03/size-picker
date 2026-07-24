import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const LEGAL_EFFECTIVE_DATE = "2026년 7월 24일";
export const PRIVACY_CONTACT_EMAIL = "digda2026@gmail.com";

export function LegalDocument({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black px-4 pb-28 pt-28 text-gray-200 sm:px-6 sm:pt-32">
      <article className="mx-auto w-full max-w-4xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <Link
            href="/"
            className="mb-7 inline-flex items-center gap-2 rounded-xl text-sm font-bold text-gray-400 transition hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80"
          >
            <Image src="/digbox-mark.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            DIGBOX 홈으로
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">DIGBOX LEGAL</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-gray-400 sm:text-base">{description}</p>
          <p className="mt-5 text-xs font-semibold text-gray-500">시행일: {LEGAL_EFFECTIVE_DATE}</p>
        </div>

        <nav aria-label="법적 문서" className="mb-10 flex flex-wrap gap-2">
          <Link
            href="/privacy"
            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-gray-300 transition hover:border-orange-400/40 hover:text-orange-200"
          >
            개인정보 처리방침
          </Link>
          <Link
            href="/terms"
            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-gray-300 transition hover:border-orange-400/40 hover:text-orange-200"
          >
            이용약관
          </Link>
        </nav>

        <div className="space-y-12">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm font-medium leading-7 text-gray-300 sm:text-[15px]">{children}</div>
    </section>
  );
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.025]">
      <table className="min-w-[720px] w-full border-collapse text-left text-xs sm:text-sm">
        <thead className="bg-white/[0.06] text-gray-200">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="border-b border-white/10 px-4 py-3 font-extrabold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/[0.07]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 leading-6 text-gray-400">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-orange-400/20 bg-orange-500/[0.07] px-5 py-4 text-sm leading-7 text-orange-100">
      {children}
    </div>
  );
}
