export function convertHeicPhoto(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./heic.worker.ts", import.meta.url), { type: "module" });
    } catch {
      reject(new Error("image_decode_failed"));
      return;
    }
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error("image_processing_timeout"));
    }, 60000);
    worker.onmessage = (event: MessageEvent<{ blob?: Blob }>) => {
      finish();
      if (event.data.blob?.size) resolve(event.data.blob);
      else reject(new Error("image_decode_failed"));
    };
    worker.onerror = () => {
      finish();
      reject(new Error("image_decode_failed"));
    };
    try {
      worker.postMessage(file);
    } catch {
      finish();
      reject(new Error("image_decode_failed"));
    }
  });
}
