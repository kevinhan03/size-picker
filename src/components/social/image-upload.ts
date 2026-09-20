export const MAX_SOURCE_PHOTO_BYTES = 20 * 1024 * 1024;

const SUPPORTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const isSupportedPhoto = (file: Pick<File, "name" | "type">) =>
  SUPPORTED_PHOTO_TYPES.has(file.type) || /\.hei[cf]$/i.test(file.name);

type DecodedPhoto = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

async function decodePhoto(file: Blob): Promise<DecodedPhoto> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    };
  } catch {
    // Safari can render HEIC in an <img> even where createImageBitmap cannot decode it.
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("invalid_image"));
        image.src = url;
      });
      if (!image.naturalWidth || !image.naturalHeight)
        throw new Error("invalid_image");
      return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        dispose: () => URL.revokeObjectURL(url),
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

async function preparePhotoOnServer(file: File): Promise<Blob> {
  const form = new FormData();
  form.set("image", file);
  const response = await fetch("/api/outfit-explorer/prepare-image", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("invalid_image");
  const blob = await response.blob();
  if (!blob.size || blob.type !== "image/webp")
    throw new Error("invalid_image");
  return blob;
}

export async function getPhotoDimensions(blob: Blob) {
  const decoded = await decodePhoto(blob);
  try {
    return { width: decoded.width, height: decoded.height };
  } finally {
    decoded.dispose();
  }
}

export async function preparePhoto(file: File): Promise<Blob> {
  if (!isSupportedPhoto(file) || !file.size || file.size > MAX_SOURCE_PHOTO_BYTES)
    throw new Error("invalid_image");
  try {
    const decoded = await decodePhoto(file);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2400 / Math.max(decoded.width, decoded.height));
      canvas.width = Math.round(decoded.width * scale);
      canvas.height = Math.round(decoded.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("invalid_image");
      ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.88, 0.75, 0.6, 0.45]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality)
        );
        if (blob && blob.size <= 3 * 1024 * 1024) return blob;
      }
      throw new Error("invalid_image");
    } finally {
      decoded.dispose();
    }
  } catch {
    return preparePhotoOnServer(file);
  }
}
export type PhotoEdit = {
  aspect: number | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
};
export async function renderPhotoEdit(blob: Blob, edit: PhotoEdit): Promise<Blob> {
  if (edit.aspect === null && edit.zoom === 1 && !edit.offsetX && !edit.offsetY)
    return blob;
  const decoded = await decodePhoto(blob);
  try {
    const aspect = edit.aspect || decoded.width / decoded.height;
    const width = aspect >= 1 ? 2000 : Math.round(2000 * aspect);
    const height = aspect >= 1 ? Math.round(2000 / aspect) : 2000;
    const scale = Math.max(width / decoded.width, height / decoded.height) * edit.zoom;
    const renderedWidth = decoded.width * scale;
    const renderedHeight = decoded.height * scale;
    const maxX = Math.max(0, (renderedWidth - width) / 2);
    const maxY = Math.max(0, (renderedHeight - height) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("invalid_image");
    ctx.drawImage(
      decoded.source,
      (width - renderedWidth) / 2 + edit.offsetX * maxX,
      (height - renderedHeight) / 2 + edit.offsetY * maxY,
      renderedWidth,
      renderedHeight
    );
    for (const quality of [0.88, 0.75, 0.6, 0.45]) {
      const result = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (result && result.size <= 3 * 1024 * 1024) return result;
    }
    throw new Error("invalid_image");
  } finally {
    decoded.dispose();
  }
}
export function uploadPhoto(
  blob: Blob,
  onProgress: (progress: number) => void
): Promise<{ id: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/outfit-explorer/uploads");
    xhr.withCredentials = true;
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("server_error"));
    xhr.ontimeout = () => reject(new Error("server_error"));
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 400 || !result.ok)
          reject(new Error(result.error || "server_error"));
        else resolve(result.data);
      } catch {
        reject(new Error("server_error"));
      }
    };
    const form = new FormData();
    form.set("image", blob, "photo.webp");
    xhr.send(form);
  });
}
