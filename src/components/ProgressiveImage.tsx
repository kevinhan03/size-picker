import NextImage from "next/image";
import type { SyntheticEvent } from "react";

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyMjIiLz48L3N2Zz4=";

interface ProgressiveImageProps {
  src: string;
  thumbnailSrc?: string;
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

  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      className={className}
      loading={loading}
      unoptimized
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      onError={onError}
      sizes="(max-width: 640px) 50vw, 300px"
    />
  );
};
