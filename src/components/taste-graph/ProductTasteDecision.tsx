"use client";

import type { Product } from "../../types";
import { getProductSummaryDetails } from "../../utils/tasteGraph";

export function ProductSummaryDetailsPanel({ product }: { product: Product }) {
  const productDetails = getProductSummaryDetails(product);

  if (!productDetails.length) return null;

  return (
    <div className="mt-1" aria-label="상품 정보">
      <ul className="flex flex-wrap items-baseline gap-y-1 text-sm font-medium leading-6 text-orange-200" aria-label="상품 정보 목록">
        {productDetails.map((detail, index) => (
          <li key={detail} className="inline-flex items-center whitespace-nowrap">
            <span>{detail}</span>
            {index < productDetails.length - 1 ? <span className="mx-2 text-[13px] leading-none text-gray-600" aria-hidden="true">·</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
