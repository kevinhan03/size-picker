import Link from "next/link";
import { STYLE_AXIS_FIELDS, STYLE_PROTOTYPE_CENTERS } from "../../constants/styleAnalysis";

function AxisReference({ field, value }: { field: (typeof STYLE_AXIS_FIELDS)[number]; value: number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-200">{field.label}</p>
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-orange-400/50 bg-orange-400/10 px-2 py-1 text-xs font-bold text-orange-300">
          {value}점
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(44px,1fr)_auto_minmax(44px,1fr)] items-center gap-2 sm:grid-cols-[minmax(72px,1fr)_auto_minmax(72px,1fr)] sm:gap-3">
        <span className="text-[11px] leading-4 text-gray-400 sm:text-xs">{field.startLabel}</span>
        <div className="flex items-center justify-center gap-0.5 sm:gap-1" aria-label={`${field.label}: ${value}점`}>
          {Array.from({ length: 7 }, (_, index) => {
            const score = index + 1;
            const active = score === value;
            return (
              <span
                key={score}
                aria-hidden="true"
                className={`flex h-10 w-7 items-center justify-center rounded-full sm:h-11 sm:w-8 ${active ? "bg-orange-400/10" : ""}`}
              >
                <span className={`h-5 w-5 rounded-full border-2 sm:h-6 sm:w-6 ${active ? "border-orange-400 bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.18)]" : "border-sky-400"}`} />
              </span>
            );
          })}
        </div>
        <span className="text-right text-[11px] leading-4 text-gray-400 sm:text-xs">{field.endLabel}</span>
      </div>
    </div>
  );
}

export function StyleCentersPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-white">
      <Link href="/admin" className="text-sm text-gray-400">← 관리자</Link>
      <header>
        <h1 className="text-2xl font-bold">스타일 중심점</h1>
        <p className="mt-2 text-sm text-gray-400">상품의 8개 스타일 축과 비교하는 기준점입니다. 값은 읽기 전용이며, 스타일 성향과 혼합 비율을 계산할 때 사용합니다.</p>
      </header>
      <section className="grid gap-4 lg:grid-cols-2">
        {STYLE_PROTOTYPE_CENTERS.map((prototype) => (
          <article key={prototype.key} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
            <h2 className="text-lg font-bold text-orange-300">{prototype.label}</h2>
            <p className="mt-1 text-xs text-gray-500">스타일 비율 계산 기준점</p>
            <div className="mt-4 space-y-3">
              {STYLE_AXIS_FIELDS.map((field) => (
                <AxisReference key={field.key} field={field} value={(prototype.axes as Record<string, number>)[field.key]} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
