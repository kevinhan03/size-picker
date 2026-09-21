export const MAX_SOURCE_PHOTO_BYTES = 20 * 1024 * 1024;

const SUPPORTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const isSupportedPhoto = (file: Pick<File, "name" | "type">) =>
  SUPPORTED_PHOTO_TYPES.has(file.type.toLowerCase()) ||
  ((!file.type || file.type === "application/octet-stream") &&
    /\.(jpe?g|png|webp|hei[cf])$/i.test(file.name));

const isHeicPhoto = (file: File) =>
  /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const photoDimensions = new WeakMap<Blob, { width: number; height: number }>();

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("image_processing_timeout")),
      20000
    );
    try {
      canvas.toBlob(
        (blob) => {
          clearTimeout(timer);
          resolve(blob);
        },
        type,
        quality
      );
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

type DecodedPhoto = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

async function encodePhoto(canvas: HTMLCanvasElement): Promise<Blob> {
  // Safari may silently return PNG for a WebP request; PNG ignores quality.
  // Inspect the actual MIME type and use JPEG before giving up on compression.
  for (const type of ["image/webp", "image/jpeg"]) {
    if (type === "image/jpeg") {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("invalid_image");
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    for (const quality of [0.88, 0.75, 0.6, 0.45]) {
      const blob = await canvasBlob(canvas, type, quality);
      if (!blob || blob.type !== type) break;
      if (blob.size > 0 && blob.size <= MAX_UPLOAD_BYTES) return blob;
    }
  }
  throw new Error("image_compression_failed");
}

async function decodePhoto(file: Blob): Promise<DecodedPhoto> {
  try {
    const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
      let expired = false;
      const timer = setTimeout(() => {
        expired = true;
        reject(new Error("image_processing_timeout"));
      }, 20000);
      Promise.resolve()
        .then(() => createImageBitmap(file, { imageOrientation: "from-image" }))
        .then(
          (bitmap) => {
            clearTimeout(timer);
            if (expired) bitmap.close();
            else resolve(bitmap);
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          }
        );
    });
    if (!bitmap.width || !bitmap.height) {
      bitmap.close();
      throw new Error("image_decode_failed");
    }
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
        const timer = setTimeout(() => {
          image.onload = null;
          image.onerror = null;
          image.src = "";
          reject(new Error("image_processing_timeout"));
        }, 20000);
        image.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        image.onerror = () => {
          clearTimeout(timer);
          reject(new Error("image_decode_failed"));
        };
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

export async function getPhotoDimensions(blob: Blob) {
  const cached = photoDimensions.get(blob);
  if (cached) return cached;
  const decoded = await decodePhoto(blob);
  try {
    return { width: decoded.width, height: decoded.height };
  } finally {
    decoded.dispose();
  }
}

export async function preparePhoto(file: File): Promise<Blob> {
  if (!isSupportedPhoto(file)) throw new Error("image_unsupported");
  if (!file.size) throw new Error("image_decode_failed");
  if (file.size > MAX_SOURCE_PHOTO_BYTES) throw new Error("image_too_large");
  let source: Blob = file;
  let decoded: DecodedPhoto;
  try {
    decoded = await decodePhoto(source);
  } catch (error) {
    if (!isHeicPhoto(file)) throw error;
    // Decode locally: sending a 20MB original to a serverless route exceeds
    // the deployment's request limit. Load the codec only when native decoding fails.
    const { convertHeicPhoto } = await import("./heic-conversion");
    source = await convertHeicPhoto(file);
    decoded = await decodePhoto(source);
  }
  try {
    photoDimensions.set(source, {
      width: decoded.width,
      height: decoded.height,
    });
    if (source !== file) return source;
    if (isHeicPhoto(file)) {
      // PNG is a lossless, browser-displayable editing source, not another
      // lossy JPEG generation. Bound its dimensions for mobile memory usage.
      const canvas = document.createElement("canvas");
      try {
        const scale = Math.min(
          1,
          2400 / Math.max(decoded.width, decoded.height)
        );
        canvas.width = Math.max(1, Math.round(decoded.width * scale));
        canvas.height = Math.max(1, Math.round(decoded.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("image_decode_failed");
        ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
        const png = await canvasBlob(canvas, "image/png", 1);
        if (!png?.size) throw new Error("image_decode_failed");
        photoDimensions.set(png, {
          width: canvas.width,
          height: canvas.height,
        });
        return png;
      } finally {
        canvas.width = canvas.height = 0;
      }
    }
    // Preserve JPEG/PNG/WebP until the crop is confirmed; no selection-time recompression.
    return source;
  } finally {
    decoded.dispose();
  }
}
export type PhotoEdit = {
  aspect: number | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
};
export async function renderPhotoEdit(
  blob: Blob,
  edit: PhotoEdit
): Promise<Blob> {
  if (
    edit.aspect === null &&
    edit.zoom === 1 &&
    !edit.offsetX &&
    !edit.offsetY &&
    blob.size <= MAX_UPLOAD_BYTES
  )
    return blob;
  const decoded = await decodePhoto(blob);
  const canvas = document.createElement("canvas");
  try {
    const aspect = edit.aspect || decoded.width / decoded.height;
    if (
      !Number.isFinite(aspect) ||
      aspect <= 0 ||
      !Number.isFinite(edit.zoom) ||
      edit.zoom < 1
    )
      throw new Error("invalid_image");
    const maxHeight = Math.min(
      2000,
      2000 / aspect,
      decoded.height / edit.zoom,
      decoded.width / aspect / edit.zoom
    );
    // Keep 3:4 exact, including small photos, because publishing validates that ratio.
    const height =
      aspect === 3 / 4 ? Math.floor(maxHeight / 4) * 4 : Math.floor(maxHeight);
    const width = Math.floor(height * aspect);
    if (width < 1 || height < 1) throw new Error("image_decode_failed");
    const scale =
      Math.max(width / decoded.width, height / decoded.height) * edit.zoom;
    const renderedWidth = decoded.width * scale;
    const renderedHeight = decoded.height * scale;
    const maxX = Math.max(0, (renderedWidth - width) / 2);
    const maxY = Math.max(0, (renderedHeight - height) / 2);
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
    return await encodePhoto(canvas);
  } finally {
    canvas.width = canvas.height = 0;
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
    xhr.onerror = () => reject(new Error("image_upload_network"));
    xhr.ontimeout = () => reject(new Error("image_upload_network"));
    xhr.onabort = () => reject(new Error("image_upload_network"));
    xhr.onload = () => {
      if (xhr.status === 413) {
        reject(new Error("image_compression_failed"));
        return;
      }
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
    const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/png" ? "png" : "webp";
    form.set("image", blob, `photo.${extension}`);
    xhr.send(form);
  });
}
