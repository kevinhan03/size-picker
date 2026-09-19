import type { Product } from "../types";
import {
  getProductStyleProfile,
  styleProfileLabels,
} from "../utils/styleProfile";

const SEGMENT_COLORS = ["bg-orange-300", "bg-orange-300/70", "bg-orange-300/40"];

export function ProductStyleProfileCard({ product }: { product: Product }) {
  const profile = getProductStyleProfile(product);

  if (!profile) return null;

  return (
    <section className="mt-8" aria-label="스타일 무드">
      <div>
        <div
          className="flex h-2 overflow-hidden rounded-full bg-white/[0.11]"
          role="img"
          aria-label={`스타일 비율: ${profile.displayEntries
            .map((entry) => `${styleProfileLabels(entry.key)} ${entry.score}%`)
            .join(", ")}`}
        >
          {profile.displayEntries.map((entry, index) => (
            <div
              key={entry.key}
              className={`h-full ${SEGMENT_COLORS[index]} ${index > 0 ? "border-l border-[#1c1c1f]" : ""}`}
              style={{ width: `${entry.score}%` }}
            />
          ))}
        </div>
        <ul className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-semibold text-gray-300">
          {profile.displayEntries.map((entry, index) => (
            <li
              key={entry.key}
              className={`flex items-center gap-1 whitespace-nowrap ${
                index === 1
                  ? "justify-center"
                  : index === 2
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEGMENT_COLORS[index]}`}
                aria-hidden="true"
              />
              <span>{styleProfileLabels(entry.key)}</span>
              <span className="tabular-nums text-gray-500">{entry.score}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
