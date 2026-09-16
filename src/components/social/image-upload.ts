export async function preparePhoto(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("invalid_image");
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("invalid_image");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.88, 0.75, 0.6, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (blob && blob.size <= 3 * 1024 * 1024) return blob;
    }
    throw new Error("invalid_image");
  } finally {
    bitmap.close();
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
  const bitmap = await createImageBitmap(blob);
  try {
    const aspect = edit.aspect || bitmap.width / bitmap.height;
    const width = aspect >= 1 ? 2000 : Math.round(2000 * aspect);
    const height = aspect >= 1 ? Math.round(2000 / aspect) : 2000;
    const scale = Math.max(width / bitmap.width, height / bitmap.height) * edit.zoom;
    const renderedWidth = bitmap.width * scale;
    const renderedHeight = bitmap.height * scale;
    const maxX = Math.max(0, (renderedWidth - width) / 2);
    const maxY = Math.max(0, (renderedHeight - height) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("invalid_image");
    ctx.drawImage(
      bitmap,
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
    bitmap.close();
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
