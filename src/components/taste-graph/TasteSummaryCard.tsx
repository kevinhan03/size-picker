"use client";

import type { ReactNode } from "react";
import type { Product } from "../../types";
import { computeTasteSummary, describeTasteCollection, tagColor } from "../../utils/tasteGraph";

const TOP_N = 4;

export function TasteSummaryCard({
  controls,
  products,
  eyebrow = "나의 취향",
  sourceLabel = "상품",
  sourceNoun = "상품",
}: {
  controls?: ReactNode;
  products: Product[];
  eyebrow?: string;
  sourceLabel?: string;
  sourceNoun?: string;
}) {
  const summary = computeTasteSummary(products);
  const interpretation = describeTasteCollection(products, summary);

  if (!summary.entries.length || !interpretation) return null;

  const topEntries = summary.entries.slice(0, TOP_N);
  return (
    <section className="taste-summary-card">
      <div className="taste-summary-top">
        <div className="taste-summary-title">
          <p className="taste-summary-eyebrow">{eyebrow} · {sourceLabel}</p>
          <h1 className="taste-summary-headline">{interpretation.title}</h1>
        </div>
        {controls ? <div className="taste-summary-controls">{controls}</div> : null}
      </div>
      <div className="taste-summary-meta">
        <p className="taste-summary-note">
          {sourceNoun} {summary.totalCount}개 중 태그된 {summary.taggedCount}개 기준
        </p>
        <p className="taste-summary-read">{interpretation.summary}</p>
      </div>

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

      <details className="taste-summary-details">
        <summary>컬렉션 해석 보기</summary>
        <div className="taste-summary-insights">
          <div>
            <p className="taste-summary-insight-label">REPEATED DETAILS</p>
            <p className="taste-summary-insight-copy">
              {interpretation.details.length ? interpretation.details.join(" · ") : "스타일 태그가 쌓이며 실루엣과 디테일의 반복을 찾고 있어요."}
            </p>
          </div>
          <div>
            <p className="taste-summary-insight-label">TASTE DIRECTION</p>
            <p className="taste-summary-insight-copy">
              {interpretation.axes.map((axis) => `${axis.title}: ${axis.label}`).join(" / ")}
            </p>
          </div>
        </div>
      </details>

      <style jsx>{`
        .taste-summary-card {
          width: 100%;
          padding: 14px 20px 12px;
          color: #f3f4f6;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: #111217;
        }

        .taste-summary-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .taste-summary-title {
          min-width: 0;
        }

        .taste-summary-controls {
          flex-shrink: 0;
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
          font-size: 18px;
          font-weight: 750;
          line-height: 1.35;
        }

        .taste-summary-meta {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 4px 12px;
          margin: 6px 0 12px;
        }

        .taste-summary-note {
          margin: 0;
          color: #697283;
          font-size: 12px;
        }

        .taste-summary-read {
          margin: 0;
          color: #c5cad4;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.45;
        }

        .taste-summary-bars {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px 16px;
          max-width: 920px;
        }

        .taste-summary-row {
          display: grid;
          grid-template-columns: minmax(72px, auto) minmax(32px, 1fr) 32px;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .taste-summary-tag {
          color: #f3f4f6;
          font-weight: 650;
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

        .taste-summary-details {
          max-width: 920px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .taste-summary-details summary {
          width: fit-content;
          cursor: pointer;
          color: #a5acb8;
          font-size: 12px;
          font-weight: 700;
          list-style: none;
        }

        .taste-summary-details summary::-webkit-details-marker {
          display: none;
        }

        .taste-summary-details summary::after {
          content: "+";
          margin-left: 7px;
          color: #f97316;
          font-size: 15px;
        }

        .taste-summary-details[open] summary::after {
          content: "−";
        }

        .taste-summary-insights {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px 28px;
          margin-top: 12px;
        }

        .taste-summary-insight-label {
          margin: 0 0 5px;
          color: #f2a56c;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.08em;
        }

        .taste-summary-insight-copy {
          margin: 0;
          color: #b8c0cc;
          font-size: 13px;
          font-weight: 650;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .taste-summary-bars {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .taste-summary-card {
            min-height: 100%;
            padding: 18px 16px;
            border-bottom: 0;
          }

          .taste-summary-top {
            flex-direction: column-reverse;
            gap: 12px;
          }

          .taste-summary-controls {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          .taste-summary-meta {
            display: block;
            margin-top: 8px;
          }

          .taste-summary-read {
            margin-top: 6px;
          }

          .taste-summary-bars {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .taste-summary-insights {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }

        @media (max-width: 640px) {
          .taste-summary-card {
            padding: 13px 16px 11px;
          }

          .taste-summary-top {
            flex-direction: column;
            gap: 10px;
          }

          .taste-summary-controls {
            width: 100%;
          }

          .taste-summary-insights {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .taste-summary-bars {
            grid-template-columns: 1fr;
            gap: 7px;
          }
        }
      `}</style>
    </section>
  );
}
