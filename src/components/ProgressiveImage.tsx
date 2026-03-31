import NextImage from "next/image";
import type { SyntheticEvent } from "react";

// 1×1 dark gray SVG — used as blur placeholder while image loads
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyMjIiLz48L3N2Zz4=";

// Only Supabase storage and Unsplash are in remotePatterns — everything else passes through unoptimized
function isOptimizableUrl(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return hostname.endsWith(".supabase.co") || hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

interface ProgressiveImageProps {
  src: string;
  thumbnailSrc?: string; // kept for API compatibility — Next.js Image optimization replaces progressive loading
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}

export const ProgressiveImage = ({
  src,
  alt,
  className,
  loading = "lazy",
  onError,
}: ProgressiveImageProps) => {
  if (!src) return null;

  const optimizable = isOptimizableUrl(src);

  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      className={className}
      loading={loading}
      unoptimized={!optimizable}
      placeholder={optimizable ? "blur" : "empty"}
      blurDataURL={optimizable ? BLUR_DATA_URL : undefined}
      onError={onError}
      sizes="(max-width: 640px) 50vw, 300px"
    />
  );
};
