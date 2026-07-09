"use client";

import type { Product } from "../../types";
import { computeTasteSummary, tagColor } from "../../utils/tasteGraph";

const TOP_N = 4;

export function TasteSummaryCard({ products }: { products: Product[] }) {
  const summary = computeTasteSummary(products);

  if (!summary.entries.length) return null;

  const topEntries = summary.entries.slice(0, TOP_N);
  const headline = topEntries
    .slice(0, 2)
    .map((entry) => entry.tag)
    .join(" x ");

  return (
    <section className="taste-summary-card">
      <p className="taste-summary-eyebrow">나의 취향</p>
      <h1 className="taste-summary-headline">{headline} 타입</h1>
      <p className="taste-summary-note">
        옷장 상품 {summary.totalCount}개 중 태그된 {summary.taggedCount}개 기준
      </p>

      <div className="taste-summary-bars">
        {topEntries.map((entry) => {
          const colors = tagColor(entry.tag);
          return (
            <div key={entry.tag} className="taste-summary-row">
              <span className="taste-summary-tag">{entry.tag}</span>
              <span className="taste-summary-bar">
                <span
                  className="taste-summary-fill"
                  style={{ width: `${entry.percent}%`, background: colors.base }}
                />
              </span>
              <span className="taste-summary-percent">{Math.round(entry.percent)}%</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .taste-summary-card {
          width: 100%;
          padding: 16px;
          color: #f3f4f6;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(180deg, #151720 0%, #0e0f13 100%);
        }

        .taste-summary-eyebrow {
          margin: 0 0 4px;
          color: #a5acb8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .taste-summary-headline {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .taste-summary-note {
          margin: 4px 0 12px;
          color: #697283;
          font-size: 12px;
        }

        .taste-summary-bars {
          display: grid;
          gap: 8px;
          max-width: 420px;
        }

        .taste-summary-row {
          display: grid;
          grid-template-columns: 96px 1fr 40px;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .taste-summary-tag {
          color: #f3f4f6;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .taste-summary-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .taste-summary-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
        }

        .taste-summary-percent {
          color: #a5acb8;
          font-weight: 700;
          text-align: right;
        }
      `}</style>
    </section>
  );
}
