// Versioned filenames distinguish uploads with thumbnails from legacy media.
// Keep this module codec-free: reads and cleanup do not need Sharp.
export function socialThumbnailPath(path: string) {
  return path.endsWith(".display.webp")
    ? path.replace(/\.display\.webp$/, ".thumb.webp")
    : path;
}

export function socialImageCleanupPaths(paths: string[]) {
  return [
    ...new Set(paths.flatMap((path) => [path, socialThumbnailPath(path)])),
  ];
}
