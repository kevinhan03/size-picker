"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { Product } from "../../types";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { ProgressiveImage } from "../ProgressiveImage";

export function OutfitImageFrame({
  product,
  alt,
  fit = "cover",
}: {
  product: Product;
  alt: string;
  fit?: "cover" | "contain";
}) {
  const { t } = useLocaleContext();
  const [failed, setFailed] = useState(false);
  // Match Digbox: a product preview can be enlarged, so prefer the original
  // Storage image and use the 320px thumbnail only as a fallback.
  const src = product.image || product.thumbnailImage;

  if (!src || failed) {
    return (
      <div aria-label={t("outfits.detail.noImage", { product: alt })} className="absolute inset-0 flex items-center justify-center bg-white/[0.055] text-white/25">
        <ImageOff aria-hidden className="h-5 w-5" />
      </div>
    );
  }

  return <ProgressiveImage src={src} alt={alt} className={fit === "contain" ? "object-contain" : "object-cover"} onError={() => setFailed(true)} />;
}
