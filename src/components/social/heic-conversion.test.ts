import { afterEach, describe, expect, it, vi } from "vitest";
import { convertHeicPhoto } from "./heic-conversion";

describe("HEIC worker lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  function mockWorker() {
    const worker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: undefined as ((event: MessageEvent) => void) | undefined,
      onerror: undefined as (() => void) | undefined,
    };
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          return worker;
        }
      }
    );
    return worker;
  }
  it("returns the decoded image and releases the worker", async () => {
    const worker = mockWorker();
    const file = new Blob(["heic"]);
    const pending = convertHeicPhoto(file);
    const png = new Blob(["png"], { type: "image/png" });
    worker.onmessage?.({ data: { blob: png } } as MessageEvent);
    expect(await pending).toBe(png);
    expect(worker.postMessage).toHaveBeenCalledWith(file);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("reports decoding failures", async () => {
    const worker = mockWorker();
    const pending = convertHeicPhoto(new Blob(["bad"]));
    worker.onerror?.();
    await expect(pending).rejects.toThrow("image_decode_failed");
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("terminates stalled decoding so the composer can leave its loading state", async () => {
    vi.useFakeTimers();
    const worker = mockWorker();
    const pending = expect(
      convertHeicPhoto(new Blob(["heic"]))
    ).rejects.toThrow("image_processing_timeout");
    await vi.advanceTimersByTimeAsync(60000);
    await pending;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
