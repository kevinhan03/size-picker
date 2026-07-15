"use client";

import type { ReactNode } from "react";
import type { Product, StyleTagName } from "../../types";
import {
  compareTasteCollections,
  styleTagLabel,
  tagColor,
  type TasteCollectionSource,
} from "../../utils/tasteGraph";

interface ExploreTarget {
  source: TasteCollectionSource;
  tag: StyleTagName;
}

export function TasteInsightCard({
  controls,
  closetProducts,
  digboxProducts,
  onExplore,
}: {
  controls?: ReactNode;
  closetProducts: Product[];
  digboxProducts: Product[];
  onExplore: (target: ExploreTarget) => void;
}) {
  const comparison = compareTasteCollections(closetProducts, digboxProducts);
  const canCompare = comparison.closet.taggedCount > 0 && comparison.digbox.taggedCount > 0;

  return (
    <section className="taste-insight-card">
      <div className="taste-insight-top">
        <div>
          <p className="taste-insight-eyebrow">STYLE MAP · INSIGHT</p>
          <h1>원하는 옷과 가진 옷 사이</h1>
        </div>
        {controls ? <div className="taste-insight-controls">{controls}</div> : null}
      </div>

      {!canCompare ? (
        <p className="taste-insight-empty">
          Closet과 DIGBOX에 태그된 상품이 쌓이면, 두 컬렉션 사이의 취향 차이를 읽어드릴게요.
        </p>
      ) : (
        <div className="taste-insight-content">
          {comparison.shared && (
            <button
              type="button"
              className="insight-lead"
              onClick={() => onExplore({ source: "closet", tag: comparison.shared!.tag })}
            >
              <span className="insight-kicker">YOUR CORE</span>
              <strong>{styleTagLabel(comparison.shared.tag)}은 이미 좋아하고, 실제로 입는 취향이에요.</strong>
              <span>Closet {Math.round(comparison.shared.closetPercent)}% · DIGBOX {Math.round(comparison.shared.digboxPercent)}%</span>
            </button>
          )}

          {comparison.aspirations.length > 0 && (
            <section className="insight-section">
              <div className="insight-heading">
                <p>EXPLORE NEXT</p>
                <span>관심은 높지만 옷장에는 적은 방향</span>
              </div>
              <div className="insight-list">
                {comparison.aspirations.map((entry) => {
                  const color = tagColor(entry.tag).base;
                  return (
                    <button
                      type="button"
                      key={entry.tag}
                      className="insight-row"
                      onClick={() => onExplore({ source: "digbox", tag: entry.tag })}
                    >
                      <span className="insight-dot" style={{ background: color }} />
                      <span className="insight-row-copy">
                        <strong>{styleTagLabel(entry.tag)}</strong>
                        <small>DIGBOX가 CLOSET보다 {Math.round(entry.difference)}%p 높음</small>
                      </span>
                      <span className="insight-row-arrow" aria-hidden="true">↗</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {comparison.recommendations.length > 0 && (
            <section className="insight-section">
              <div className="insight-heading">
                <p>START HERE</p>
                <span>부족한 취향 군집에서 저장한 상품</span>
              </div>
              <div className="insight-product-list">
                {comparison.recommendations.map((entry) => (
                  <button
                    type="button"
                    key={`${entry.tag}-${entry.product.id}`}
                    className="insight-product"
                    onClick={() => onExplore({ source: "digbox", tag: entry.tag })}
                  >
                    {entry.product.thumbnailImage || entry.product.image ? (
                      <img src={entry.product.thumbnailImage || entry.product.image} alt="" />
                    ) : (
                      <span className="insight-product-empty" aria-hidden="true" />
                    )}
                    <span>
                      <strong>{entry.product.brand}</strong>
                      <small>{entry.product.name}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {comparison.saturated && (
            <button
              type="button"
              className="insight-caution"
              onClick={() => onExplore({ source: "closet", tag: comparison.saturated!.tag })}
            >
              <span>ALREADY STRONG</span>
              <strong>{styleTagLabel(comparison.saturated.tag)}은 Closet에 이미 충분히 쌓여 있어요.</strong>
              <small>비슷한 상품을 더하기 전, 현재 군집을 먼저 확인해 보세요.</small>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .taste-insight-card {
          min-height: 100%;
          padding: 18px 16px;
          color: #f3f4f6;
          background: #111217;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .taste-insight-top {
          display: flex;
          flex-direction: column-reverse;
          gap: 14px;
        }

        .taste-insight-controls {
          display: flex;
          justify-content: center;
        }

        .taste-insight-eyebrow,
        .insight-kicker,
        .insight-heading p,
        .insight-caution > span {
          margin: 0;
          color: #f2a56c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        h1 {
          margin: 5px 0 0;
          font-size: 19px;
          font-weight: 750;
          line-height: 1.35;
        }

        .taste-insight-content {
          display: grid;
          gap: 20px;
          margin-top: 20px;
        }

        .taste-insight-empty {
          margin: 22px 0 0;
          color: #9ca4b1;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.6;
        }

        .insight-lead,
        .insight-caution,
        .insight-row,
        .insight-product {
          width: 100%;
          border: 0;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .insight-lead {
          display: grid;
          gap: 6px;
          padding: 14px;
          border: 1px solid rgba(249, 115, 22, 0.28);
          border-radius: 8px;
          background: rgba(249, 115, 22, 0.08);
          color: #f7f8fa;
          transition: border-color 150ms ease, background-color 150ms ease;
        }

        .insight-lead:hover,
        .insight-lead:focus-visible {
          border-color: rgba(251, 146, 60, 0.7);
          background: rgba(249, 115, 22, 0.13);
          outline: none;
        }

        .insight-lead strong,
        .insight-caution strong {
          font-size: 14px;
          font-weight: 750;
          line-height: 1.45;
        }

        .insight-lead > span:last-child {
          color: #c4cad4;
          font-size: 12px;
          font-weight: 650;
        }

        .insight-section {
          display: grid;
          gap: 9px;
        }

        .insight-heading {
          display: grid;
          gap: 3px;
        }

        .insight-heading span {
          color: #8f99a8;
          font-size: 12px;
          line-height: 1.4;
        }

        .insight-list,
        .insight-product-list {
          display: grid;
          gap: 6px;
        }

        .insight-row {
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr) auto;
          gap: 9px;
          align-items: center;
          padding: 8px 5px;
          color: #f3f4f6;
          transition: background-color 150ms ease;
        }

        .insight-row:hover,
        .insight-row:focus-visible,
        .insight-product:hover,
        .insight-product:focus-visible,
        .insight-caution:hover,
        .insight-caution:focus-visible {
          background: rgba(255, 255, 255, 0.06);
          outline: none;
        }

        .insight-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .insight-row-copy {
          display: grid;
          gap: 2px;
        }

        .insight-row strong {
          font-size: 13px;
          font-weight: 750;
        }

        .insight-row small,
        .insight-caution small {
          color: #9ca4b1;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.4;
        }

        .insight-row-arrow {
          color: #f2a56c;
          font-size: 14px;
          font-weight: 750;
        }

        .insight-product {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          gap: 9px;
          align-items: center;
          padding: 5px;
          color: #f3f4f6;
          transition: background-color 150ms ease;
        }

        .insight-product img,
        .insight-product-empty {
          display: block;
          width: 38px;
          height: 38px;
          border-radius: 6px;
          background: #5f6877;
          object-fit: cover;
        }

        .insight-product > span:last-child {
          display: grid;
          gap: 2px;
          min-width: 0;
        }

        .insight-product strong,
        .insight-product small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .insight-product strong {
          color: #f2a56c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .insight-product small {
          color: #d2d7df;
          font-size: 12px;
          font-weight: 650;
        }

        .insight-caution {
          display: grid;
          gap: 5px;
          padding: 11px 5px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #f3f4f6;
          transition: background-color 150ms ease;
        }

        .insight-caution > span { color: #9ca4b1; }

        @media (max-width: 1023px) {
          .taste-insight-card {
            min-height: auto;
          }
        }
      `}</style>
    </section>
  );
}
