"use client";

import type { Product } from "../../types";
import { getProductSummaryDetails } from "../../utils/tasteGraph";
import { useLocaleContext } from "../../contexts/LocaleContext";

export function ProductSummaryDetailsPanel({ product }: { product: Product }) {
  const { t } = useLocaleContext();
  const productDetails = getProductSummaryDetails(product);

  if (!productDetails.length) return null;

  return (
    <div className="mt-1" aria-label={t("productTaste.info")}>
      <ul className="flex flex-wrap items-baseline gap-y-1 text-sm font-medium leading-6 text-orange-200" aria-label={t("productTaste.infoList")}>
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
