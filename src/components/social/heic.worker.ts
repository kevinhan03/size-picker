import { heicTo } from "heic-to/next";

// Decode away from the UI thread. No original photo leaves the device.
self.onmessage = async (event: MessageEvent<Blob>) => {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await heicTo({ blob: event.data, type: "bitmap" });
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.round(bitmap.width * scale)),
      Math.max(1, Math.round(bitmap.height * scale))
    );
    const context = canvas.getContext("2d");
    if (!context) throw new Error("image_decode_failed");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    self.postMessage({ blob });
  } catch {
    self.postMessage({ error: "image_decode_failed" });
  } finally {
    bitmap?.close();
  }
};
