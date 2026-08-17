"use client";

import type { ReactNode } from "react";
import type { Product } from "../../types";
import { buildBrandClusters } from "../../utils/brandClusters";
import { styleTagLabel } from "../../utils/tasteGraph";
import { useLocaleContext } from "../../contexts/LocaleContext";

export function BrandClusterSummaryCard({
  controls,
  viewControls,
  products,
  source,
  selectedBrand,
}: {
  controls?: ReactNode;
  viewControls?: ReactNode;
  products: Product[];
  source: "closet" | "digbox";
  selectedBrand: string | null;
}) {
  const { t } = useLocaleContext();
  const { clusters } = buildBrandClusters(products);
  const selected = clusters.find((cluster) => cluster.brand === selectedBrand) || null;
  const headline = selected
    ? t("brandCluster.selectedHeadline", { brand: selected.displayName, tags: selected.topTags.slice(0, 2).map(({ tag }) => styleTagLabel(tag)).join(" · ") })
    : source === "closet"
      ? t("brandCluster.closetHeadline")
      : t("brandCluster.savedHeadline");
  const copy = selected
    ? t("brandCluster.selectedCopy", { count: selected.count })
    : source === "closet"
      ? t("brandCluster.closetCopy", { products: products.length, brands: clusters.length })
      : t("brandCluster.savedCopy", { products: products.length });

  return (
    <section className="brand-cluster-summary">
      <div className="brand-summary-controls">{controls}</div>
      {viewControls && <div className="brand-summary-view-controls">{viewControls}</div>}
      <p className="brand-summary-eyebrow">{source === "closet" ? t("brandCluster.closetEyebrow") : t("brandCluster.savedEyebrow")} · BRAND CLUSTER</p>
      <h1>{headline}</h1>
      <p className="brand-summary-copy">{copy}</p>
      <div className="brand-summary-rule" />
      <p className="brand-summary-section-title">{selected ? t("brandCluster.selectedSection") : source === "closet" ? t("brandCluster.closetSection") : t("brandCluster.savedSection")}</p>
      <ol className="brand-summary-list">
        {(selected ? [selected] : clusters.slice(0, 5)).map((cluster, index) => (
          <li key={cluster.id} className={selected?.id === cluster.id ? "selected" : ""}>
            <span className="brand-summary-rank">{index + 1}</span>
            <span className="brand-summary-name">{cluster.displayName}</span>
            <span className="brand-summary-count">{cluster.count}</span>
          </li>
        ))}
      </ol>
      {!selected && clusters.length > 1 && (
        <div className="brand-summary-insight">
          <p>INSIGHT</p>
          <span>{t("brandCluster.insight", { first: clusters[0].displayName, second: clusters[1].displayName })}</span>
        </div>
      )}
      <style jsx>{`
        .brand-cluster-summary{min-height:100%;padding:18px 16px;color:#f3f4f6;font-family:var(--font-sans);background:#111217}.brand-summary-controls{display:flex;justify-content:center}.brand-summary-view-controls{margin-top:10px}.brand-summary-eyebrow{margin:18px 0 7px;color:#a5acb8;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.brand-cluster-summary h1{margin:0;color:#f7f7f8;font-size:20px;font-weight:780;line-height:1.35}.brand-summary-copy{margin:10px 0 0;color:#b9c0cb;font-size:13px;font-weight:590;line-height:1.6}.brand-summary-rule{height:1px;margin:20px 0;background:rgba(255,255,255,.1)}.brand-summary-section-title{margin:0 0 10px;color:#d7dbe2;font-size:12px;font-weight:750}.brand-summary-list{display:grid;gap:2px;margin:0;padding:0;list-style:none}.brand-summary-list li{display:grid;grid-template-columns:18px minmax(0,1fr) 20px;align-items:center;gap:8px;min-height:34px;padding:0 6px;border-radius:8px;color:#aeb5c0;font-size:12px}.brand-summary-list li.selected{background:rgba(249,115,22,.15);color:#fdba74}.brand-summary-rank{color:#8891a0;font-weight:800;font-variant-numeric:tabular-nums}.brand-summary-list li:first-child .brand-summary-rank,.brand-summary-list li:first-child .brand-summary-count{color:#fb923c}.brand-summary-name{overflow:hidden;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.brand-summary-count{color:#d9dde3;font-weight:800;font-variant-numeric:tabular-nums;text-align:right}.brand-summary-insight{margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1)}.brand-summary-insight p{margin:0 0 7px;color:#f2a56c;font-size:10px;font-weight:850;letter-spacing:.08em}.brand-summary-insight span{color:#b8c0cc;font-size:13px;font-weight:620;line-height:1.55}@media(max-width:1023px){.brand-cluster-summary{min-height:auto}.brand-summary-controls{justify-content:flex-start}.brand-summary-view-controls{max-width:310px}.brand-summary-list{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px}}@media(max-width:640px){.brand-summary-list{grid-template-columns:1fr}}
      `}</style>
    </section>
  );
}
