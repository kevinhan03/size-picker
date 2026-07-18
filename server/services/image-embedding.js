import {
  IMAGE_EMBEDDING_WORKER_SECRET,
  IMAGE_EMBEDDING_WORKER_TIMEOUT_MS,
  IMAGE_EMBEDDING_WORKER_URL,
} from "../config/env.js";

const EMBEDDING_PATH = "/v1/product-image-embeddings";

function getWorkerEndpoint() {
  if (!IMAGE_EMBEDDING_WORKER_URL) return null;

  try {
    const endpoint = new URL(`${IMAGE_EMBEDDING_WORKER_URL}${EMBEDDING_PATH}`);
    if (endpoint.protocol !== "https:" && endpoint.protocol !== "http:") return null;
    return endpoint;
  } catch {
    return null;
  }
}

function getTimeout() {
  return Math.min(Math.max(IMAGE_EMBEDDING_WORKER_TIMEOUT_MS, 1_000), 120_000);
}

export async function embedProductImageById(productId) {
  const normalizedProductId = String(productId || "").trim();
  if (!normalizedProductId) {
    return { ok: false, skipped: true, reason: "missing_product_id" };
  }

  const endpoint = getWorkerEndpoint();
  if (!endpoint || !IMAGE_EMBEDDING_WORKER_SECRET) {
    return { ok: false, skipped: true, reason: "worker_not_configured" };
  }

  const timeout = AbortSignal.timeout(getTimeout());
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-embedding-worker-secret": IMAGE_EMBEDDING_WORKER_SECRET,
      },
      body: JSON.stringify({ productId: normalizedProductId }),
      signal: timeout,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        reason: String(payload?.error || `worker_http_${response.status}`),
      };
    }

    return { ok: true, data: payload };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
