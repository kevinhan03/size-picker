import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';

interface ProgressiveImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}

export const ProgressiveImage = ({
  src,
  thumbnailSrc,
  alt,
  className,
  loading = 'lazy',
  onError,
}: ProgressiveImageProps) => {
  const [loadedSrc, setLoadedSrc] = useState<string>('');
  const displaySrc =
    loadedSrc === src
      ? src
      : !src
        ? thumbnailSrc || ''
        : !thumbnailSrc || thumbnailSrc === src
          ? src
          : thumbnailSrc;

  useEffect(() => {
    if (!src || !thumbnailSrc || thumbnailSrc === src) {
      return;
    }

    const preloader = new Image();
    preloader.src = src;
    preloader.onload = () => setLoadedSrc(src);
    preloader.onerror = () => setLoadedSrc(src);

    return () => {
      preloader.onload = null;
      preloader.onerror = null;
    };
  }, [src, thumbnailSrc]);

  return (
    <img
      src={displaySrc || src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={onError}
    />
  );
};
