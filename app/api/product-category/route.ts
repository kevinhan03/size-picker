import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../server/auth/request-user";
import { classifyProductCategory } from "../../../server/services/product-category-classification";
import { PRODUCT_METADATA_MAX_IMAGE_BYTES } from "../../../server/config/env.js";
import { assertPublicHttpUrl, fetchWithTimeout } from "../../../server/services/product-metadata/url.js";
import { validateInlineImageInput } from "../../../server/utils/request-validation.js";

export const maxDuration = 60;

const normalizeText = (value: unknown, maxLength = 500) => String(value || "").trim().slice(0, maxLength);

const imageTooLargeError = () => {
  const error = new Error("image is too large");
  Object.assign(error, { statusCode: 413 });
  return error;
};

const readImageWithinLimit = async (response: Response) => {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > PRODUCT_METADATA_MAX_IMAGE_BYTES) {
    throw imageTooLargeError();
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("product image could not be read");
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > PRODUCT_METADATA_MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw imageTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
};

async function getImage(body: Record<string, unknown>) {
  if (body.imageBase64) {
    return validateInlineImageInput({ imageBase64: body.imageBase64, mimeType: String(body.mimeType || "image/png") });
  }

  const imageUrl = assertPublicHttpUrl(body.imageUrl);
  const response = await fetchWithTimeout(imageUrl, {
    method: "GET",
    headers: { accept: "image/webp,image/png,image/jpeg,*/*;q=0.8", "user-agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error("product image could not be downloaded");
  const mimeType = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(mimeType)) throw new Error("unsupported image type");
  const buffer = await readImageWithinLimit(response);
  if (!buffer.length) throw new Error("product image is empty");
  return { imageBase64: buffer.toString("base64"), mimeType };
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  if (!await getRegisteredRequestUser(request)) {
    return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const image = await getImage(body);
    const result = await classifyProductCategory({
      brand: normalizeText(body.brand),
      name: normalizeText(body.name),
      productMetadata: body.productMetadata ?? null,
      image: { base64: image.imageBase64, mimeType: image.mimeType },
    });
    if (!result) return NextResponse.json({ ok: false, error: "category analysis failed" }, { status: 422 });
    return NextResponse.json({ ok: true, data: { category: result.category } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "category analysis failed") },
      { status: getErrorStatusCode(error) }
    );
  }
}
