import type { Product } from "../types";
import { getProductStyleProfile, styleProfileLabels } from "../utils/styleProfile";

export function ProductStyleProfileCard({ product }: { product: Product }) {
  const profile = getProductStyleProfile(product);
  if (!profile) return null;

  return (
    <section className="mt-5 rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4" aria-label="스타일 성향">
      <p className="text-[11px] font-bold tracking-[0.08em] text-gray-400">스타일 성향</p>
      <h5 className="mt-1 text-lg font-bold tracking-tight text-white">{profile.title}</h5>
      <div className="mt-4 space-y-3">
        {profile.displayEntries.map((entry, index) => (
          <div key={entry.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
              <span className="font-semibold text-gray-100">{styleProfileLabels(entry.key)}</span>
              <span className="tabular-nums text-gray-400">{entry.score}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.11]" role="progressbar" aria-label={`${styleProfileLabels(entry.key)} ${entry.score}%`} aria-valuenow={entry.score} aria-valuemin={0} aria-valuemax={100}>
              <div className={index === 0 ? "h-full rounded-full bg-orange-300 transition-[width] duration-200" : "h-full rounded-full bg-white/50 transition-[width] duration-200"} style={{ width: `${entry.score}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-4 text-gray-500">상위 3개 스타일 안에서의 상대적 근접도</p>
    </section>
  );
}
