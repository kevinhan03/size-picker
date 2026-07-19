"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { Product } from "../../types";
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
  const [failed, setFailed] = useState(false);
  const src = product.thumbnailImage || product.image;

  if (!src || failed) {
    return (
      <div aria-label={`${alt} 이미지 없음`} className="absolute inset-0 flex items-center justify-center bg-white/[0.055] text-white/25">
        <ImageOff aria-hidden className="h-5 w-5" />
      </div>
    );
  }

  return <ProgressiveImage src={src} alt={alt} className={fit === "contain" ? "object-contain" : "object-cover"} onError={() => setFailed(true)} />;
}
