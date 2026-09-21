import Link from "next/link";
import type { AgentMessage } from "../types/fashion-agent";
import { getProductPageUrl } from "../utils/product";
import { agentPalette } from "../utils/agent-palette";
import { ProgressiveImage } from "./ProgressiveImage";
import type { ProductCardData } from "../types";

function EvidenceProduct({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={getProductPageUrl(product)}
      className="min-w-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/10">
        <ProgressiveImage
          src={product.image}
          alt={product.name}
          className="object-contain"
        />
      </div>
      <p className="mt-2 truncate text-[10px] text-white/60">{product.brand}</p>
      <p className="mt-1 line-clamp-2 break-keep text-xs leading-5 text-white">
        {product.name}
      </p>
    </Link>
  );
}

/** Render structured engine evidence; never infer chart values from prose. */
export function AgentResultInsight({
  message,
  english = false,
}: {
  message: AgentMessage;
  english?: boolean;
}) {
  const data = message.presentation;
  const palette = agentPalette(message.id);
  const colors = [palette.accent, palette.secondary, "#c3cfaa"];
  if (!data)
    return (
      <p className="whitespace-pre-wrap break-words text-sm leading-7">
        {message.text}
      </p>
    );
  const entries = (data.distribution || []).filter(
    (entry) => Number.isFinite(entry.percent) && entry.percent > 0
  );
  const total = entries.reduce((sum, entry) => sum + entry.percent, 0);
  const segments = entries.slice(0, 3);
  const rest = total - segments.reduce((sum, entry) => sum + entry.percent, 0);
  const chart =
    rest > 0
      ? [
          ...segments,
          { label: english ? "Other styles" : "다른 성향", percent: rest },
        ]
      : segments;
  const gradient = chart
    .map((entry, index) => {
      const start =
        (chart
          .slice(0, index)
          .reduce((sum, segment) => sum + segment.percent, 0) /
          total) *
        100;
      const end = start + (entry.percent / total) * 100;
      return `${index === 3 ? "#36404f" : colors[index]} ${start}% ${end}%`;
    })
    .join(",");
  return (
    <section
      style={{
        background: palette.background,
        borderColor: `${palette.accent}55`,
      }}
      className="rounded-3xl border p-5 tracking-[0.16px] sm:p-7"
    >
      <p
        style={{ color: palette.accent }}
        className="text-[10px] font-medium tracking-[0.18em]"
      >
        DIGBOX /{" "}
        {data.kind === "taste"
          ? "TASTE NOTES"
          : data.kind === "compare"
            ? "SIDE BY SIDE"
            : data.kind === "compatible"
              ? "PAIRING"
              : data.kind === "knowledge"
                ? "STYLE GUIDE"
                : "CURATED FINDS"}
      </p>
      <h3 className="mt-3 text-xl font-normal leading-snug text-white sm:text-2xl">
        {data.title}
      </h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {message.text}
      </p>
      {data.kind === "taste" && entries.length > 0 && (
        <div className="mt-6 grid items-center gap-6 sm:grid-cols-[180px_1fr]">
          <div
            role="img"
            aria-label={entries
              .map((entry) => `${entry.label} ${entry.percent.toFixed(1)}%`)
              .join(", ")}
            className="relative mx-auto h-44 w-44 rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
          >
            <div
              style={{ background: palette.background }}
              className="absolute inset-5 flex flex-col items-center justify-center rounded-full"
            >
              <span className="text-xs text-slate-400">
                {english ? "Top tendency" : "가장 많이 보이는 성향"}
              </span>
              <span className="mt-2 text-xl text-white">
                {entries[0].label}
              </span>
              <span
                style={{ color: palette.accent }}
                className="mt-1 text-sm tabular-nums"
              >
                {entries[0].percent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {segments.map((entry, index) => (
              <div key={entry.label}>
                <div className="mb-2 flex justify-between gap-3 text-sm text-white">
                  <span>{entry.label}</span>
                  <span className="tabular-nums text-slate-300">
                    {entry.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.min(100, entry.percent)}%`,
                      background: colors[index],
                    }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs leading-5 text-slate-400">
              {rest > 0 && (
                <span className="mb-2 block">
                  {english ? "Other styles" : "다른 성향"} · {rest.toFixed(1)}%
                </span>
              )}
              {english
                ? "Relative style signals, not percentages of garments."
                : "상품에 나타난 성향의 비중이에요. 해당 스타일의 옷 개수 비율은 아니에요."}
            </p>
          </div>
          <details className="sm:col-span-2 border-t border-white/10 pt-4 text-sm text-slate-300">
            <summary className="cursor-pointer py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400">
              {english ? "Explore all styles" : "전체 스타일 분포 보기"}
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.label}
                  className="flex justify-between gap-2 rounded-xl bg-white/5 p-3 text-xs"
                >
                  <span>{entry.label}</span>
                  <span>{entry.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      {!!data.representatives?.length && (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {data.representatives.map((group, index) => (
            <section
              key={group.label}
              className="rounded-2xl border border-white/10 bg-black/10 p-4"
            >
              <h4
                style={{ color: colors[index % colors.length] }}
                className="text-sm font-medium"
              >
                {group.label}
              </h4>
              <p className="mb-4 mt-1 text-[11px] text-white/60">
                {english
                  ? "Examples from your collection"
                  : "내 컬렉션에서 발견한 대표상품"}
              </p>
              {group.products.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {group.products.map((product) => (
                    <EvidenceProduct key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/60">
                  {english
                    ? "No additional examples yet."
                    : "추가 대표상품이 아직 없어요."}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
      {data.kind === "taste" &&
        ["none", "low"].includes(data.confidence || "") && (
          <p className="mt-4 rounded-xl bg-[#faf5e8] p-3 text-xs text-[#41454d]">
            {english
              ? "Your taste is still taking shape as more items are analyzed."
              : "아직 취향을 알아가는 중이에요. 분석된 상품이 늘면 더 선명해져요."}
          </p>
        )}
      {data.reference && (
        <Link
          href={getProductPageUrl(data.reference)}
          className="mt-5 block rounded-xl border border-[#c7e5f2]/30 bg-[#c7e5f2]/10 p-4 text-sm text-[#c7e5f2]"
        >
          <span className="block text-xs opacity-70">
            {english ? "Pairing with" : "이 상품을 기준으로"}
          </span>
          <div className="relative mt-3 h-28 w-24 overflow-hidden rounded-xl bg-white/10">
            <ProgressiveImage
              src={data.reference.image}
              alt={data.reference.name}
              className="object-contain"
            />
          </div>
          <span className="mt-1 block">
            {data.reference.brand} · {data.reference.name} →
          </span>
        </Link>
      )}
      {!!data.comparedProducts?.length && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {data.comparedProducts.map((product, index) => (
            <div key={product.id} className="rounded-2xl bg-black/10 p-3">
              <p className="mb-2 text-xs" style={{ color: colors[index] }}>
                {english ? `Product ${index + 1}` : `${index + 1}번째 상품`}
              </p>
              <EvidenceProduct product={product} />
            </div>
          ))}
        </div>
      )}
      {!!data.axes?.length && (
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {data.axes[0].values.map((value, index) => (
              <p
                key={index}
                className="text-xs leading-5"
                style={{ color: colors[index] }}
              >
                {index + 1}. {value.name}
              </p>
            ))}
          </div>
          {[...data.axes]
            .sort(
              (a, b) =>
                Math.abs(b.values[0].value - b.values[1].value) -
                Math.abs(a.values[0].value - a.values[1].value)
            )
            .slice(0, 3)
            .map((axis) => (
              <div key={axis.label}>
                <p className="mb-2 text-xs text-slate-300">{axis.label}</p>
                <p className="mb-3 text-sm leading-6 text-white">
                  {axis.explanation}
                </p>
                <div
                  className="relative mb-3 flex h-2 overflow-hidden rounded bg-white/10"
                  role="img"
                  aria-label={`${axis.label}: ${axis.values.map((value) => `${value.name} ${value.value.toFixed(1)}`).join(", ")}`}
                >
                  <div className="flex w-1/2 justify-end border-r border-white/50">
                    <span
                      style={{
                        width: `${(Math.max(0, axis.values[0].value - axis.values[1].value) / 6) * 100}%`,
                        background: colors[0],
                      }}
                    />
                  </div>
                  <div className="w-1/2">
                    <div
                      className="h-full"
                      style={{
                        width: `${(Math.max(0, axis.values[1].value - axis.values[0].value) / 6) * 100}%`,
                        background: colors[1],
                      }}
                    />
                  </div>
                </div>
                {axis.values.map((value, index) => (
                  <div key={index} className="mt-1 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded bg-white/5">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${(value.value / 7) * 100}%`,
                          background: colors[index],
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs tabular-nums text-slate-300">
                      {value.value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          <p className="text-xs leading-6 text-white/70">
            {english ? "Similar impressions: " : "공통된 인상: "}
            {data.axes
              .filter(
                (axis) =>
                  Math.abs(axis.values[0].value - axis.values[1].value) <= 0.5
              )
              .map((axis) => axis.label)
              .join(" · ") ||
              (english
                ? "No near-identical axes."
                : "분석된 성향에서 뚜렷한 공통점은 아직 없어요.")}
          </p>
          <details className="border-t border-white/10 pt-3 text-xs text-white/70">
            <summary className="cursor-pointer py-2">
              {english ? "All comparison values" : "전체 성향 수치 보기"}
            </summary>
            <div className="mt-2 space-y-2">
              {data.axes.map((axis) => (
                <p key={axis.label} className="flex justify-between gap-3">
                  <span>{axis.label}</span>
                  <span className="tabular-nums">
                    {axis.values
                      .map((value) => value.value.toFixed(1))
                      .join(" / ")}
                  </span>
                </p>
              ))}
            </div>
          </details>
          <p className="text-xs text-slate-400">
            {english
              ? "Design impressions · 1–7 scale"
              : "디자인 인상 기준 · 1–7점 척도"}
          </p>
        </div>
      )}
      {!!message.products?.length && data.kind !== "compare" && (
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {data.kind === "knowledge" && (
            <p className="w-full pb-2 text-white/70">
              {english
                ? "Related examples from DIGBOX"
                : "이해를 돕는 DIGBOX 상품 예시"}
            </p>
          )}
          {(["new", "saved", "owned"] as const).map((relationship, index) => {
            const count = message.products!.filter(
              (product) => product.relationship === relationship
            ).length;
            return count ? (
              <span
                key={relationship}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white/80"
              >
                {
                  (english
                    ? ["New to your collection", "Saved", "In wardrobe"]
                    : ["새로운 상품", "저장한 상품", "보유한 상품"])[index]
                }{" "}
                {count}
              </span>
            ) : null;
          })}
        </div>
      )}
    </section>
  );
}
